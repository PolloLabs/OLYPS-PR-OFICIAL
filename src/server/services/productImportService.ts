import type { UUID } from '../../types/common.types.js';
import type {
  ProductImportPreview,
  ProductImportPayload,
  ProductImportResult,
} from '../../types/productImport.types.js';
import {
  validateHeaders,
  validateRow,
} from '../../config/productImportColumns.js';
import { ProductService } from './productService.js';
import { CompanyService } from './companyService.js';
import type { CreateProductPayload, BarcodeType, TaxType } from '../../types/product.types.js';

export class ProductImportService {
  /**
   * Generates a preview and validates CSV data before persistence
   */
  static async generatePreview(
    companyId: UUID,
    rawHeaders: string[],
    rawRows: string[][]
  ): Promise<ProductImportPreview> {
    const headerValidation = validateHeaders(rawHeaders);

    const items = rawRows
      .filter((r) => r.length > 0 && r.some((c) => c && c.trim().length > 0))
      .map((row, idx) => {
        return validateRow(row, idx + 1, headerValidation.mapping);
      });

    const totalRows = items.length;
    const validRows = items.filter((i) => i.isValid).length;
    const invalidRows = totalRows - validRows;

    return {
      totalRows,
      validRows,
      invalidRows,
      columnValidation: {
        valid: headerValidation.valid,
        detectedCount: headerValidation.detectedCount,
        expectedCount: headerValidation.expectedCount,
        missingColumns: headerValidation.errors,
      },
      items,
    };
  }

  /**
   * Executes batch persistence of validated products in database / store
   */
  static async executeImport(
    companyId: UUID,
    payload: ProductImportPayload
  ): Promise<ProductImportResult> {
    const items = payload.items || [];
    if (!items || items.length === 0) {
      throw new Error('Nenhum produto válido foi fornecido para importação.');
    }

    // 1. Preload master data to avoid redundant creations
    const existingUnits = await ProductService.listUnits(companyId);
    const existingBrands = await ProductService.listBrands(companyId);
    const existingCategories = await ProductService.listCategories(companyId);
    const existingLocations = await CompanyService.listLocations(companyId);

    const unitMap = new Map<string, string>(); // name/shortName -> id
    existingUnits.forEach((u) => {
      unitMap.set(u.shortName.toLowerCase(), u.id);
      unitMap.set(u.name.toLowerCase(), u.id);
    });

    const brandMap = new Map<string, string>(); // name -> id
    existingBrands.forEach((b) => brandMap.set(b.name.toLowerCase(), b.id));

    const categoryMap = new Map<string, string>(); // name -> id
    existingCategories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));

    // Fallback main location
    const defaultLocation =
      existingLocations.find((l) => l.isMain) ||
      existingLocations[0] || {
        id: 'loc-matriz',
        name: 'Matriz - Centro',
      };

    let importedCount = 0;
    let errorsCount = 0;
    const errors: string[] = [];
    const importedProducts: ProductImportResult['importedProducts'] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNo = i + 1;

      try {
        // Resolve or create Unit
        let unitId = unitMap.get(item.unit.toLowerCase());
        if (!unitId) {
          const newUnit = await ProductService.createUnit(companyId, {
            name: item.unit.toUpperCase(),
            shortName: item.unit.toUpperCase().substring(0, 5),
            allowDecimal: true,
            active: true,
          });
          unitId = newUnit.id;
          unitMap.set(item.unit.toLowerCase(), unitId);
          unitMap.set(newUnit.shortName.toLowerCase(), unitId);
        }

        // Resolve or create Brand
        let brandId: string | null = null;
        let brandName: string | null = null;
        if (item.brand && item.brand.trim()) {
          const cleanBrand = item.brand.trim();
          brandId = brandMap.get(cleanBrand.toLowerCase()) || null;
          if (!brandId) {
            const newBrand = await ProductService.createBrand(companyId, {
              name: cleanBrand,
              active: true,
            });
            brandId = newBrand.id;
            brandMap.set(cleanBrand.toLowerCase(), brandId);
          }
          brandName = cleanBrand;
        }

        // Resolve or create Category
        let categoryId: string | null = null;
        let categoryName: string | null = null;
        if (item.category && item.category.trim()) {
          const cleanCat = item.category.trim();
          categoryId = categoryMap.get(cleanCat.toLowerCase()) || null;
          if (!categoryId) {
            const newCat = await ProductService.createCategory(companyId, {
              name: cleanCat,
              active: true,
            });
            categoryId = newCat.id;
            categoryMap.set(cleanCat.toLowerCase(), categoryId);
          }
          categoryName = cleanCat;
        }

        // Resolve Location for opening stock
        let targetLocationId = defaultLocation.id;
        let targetLocationName = defaultLocation.name;
        if (item.location && item.location.trim()) {
          const matchedLoc = existingLocations.find(
            (l) => l.name.toLowerCase() === item.location!.trim().toLowerCase()
          );
          if (matchedLoc) {
            targetLocationId = matchedLoc.id;
            targetLocationName = matchedLoc.name;
          }
        }

        // Address rack info
        const rackParts = [item.rack, item.row, item.position].filter(Boolean);
        const rackLocation = rackParts.length > 0 ? rackParts.join(' - ') : undefined;

        // Location inputs for initial stock
        const locationInputs = [
          {
            locationId: targetLocationId,
            initialStock: item.openingStock !== undefined ? Number(item.openingStock) : 0,
            currentStock: item.openingStock !== undefined ? Number(item.openingStock) : 0,
            manageStock: item.manageStock,
            rackLocation: rackLocation || null,
            isAvailable: true,
          },
        ];

        // Format prices
        const purchasePrice =
          item.purchasePriceIncTax ||
          item.purchasePriceExcTax ||
          0;
        const sellingPrice = item.sellingPrice || purchasePrice * 1.3;
        const profitMargin =
          item.profitMargin ||
          (purchasePrice > 0 ? ((sellingPrice - purchasePrice) / purchasePrice) * 100 : 30);

        // Format barcode type
        const barcodeType: BarcodeType =
          item.barcodeType === 'C39' ||
          item.barcodeType === 'EAN13' ||
          item.barcodeType === 'EAN8' ||
          item.barcodeType === 'UPCA' ||
          item.barcodeType === 'UPCE'
            ? (item.barcodeType as BarcodeType)
            : 'C128';

        // Prepare variations if variable product
        const variations =
          item.productType === 'variable' && item.variationValues
            ? item.variationValues.split('|').map((val, idx) => ({
                name: `${item.variationName || 'Variação'}: ${val.trim()}`,
                sku: item.variationSku ? `${item.variationSku}-${idx + 1}` : '',
                purchasePrice,
                marginPercent: profitMargin,
                salePrice: sellingPrice,
                attributes: { [item.variationName || 'Atributo']: val.trim() },
                isDefault: idx === 0,
              }))
            : undefined;

        const productPayload: CreateProductPayload = {
          name: item.name,
          sku: item.sku || undefined,
          barcodeType,
          barcode: null,
          productType: item.productType,
          unitId,
          brandId,
          brandName,
          categoryId,
          categoryName,
          description: item.productDescription || null,
          operationalNotes: [
            item.customField1 ? `Campo 1: ${item.customField1}` : null,
            item.customField2 ? `Campo 2: ${item.customField2}` : null,
            item.customField3 ? `Campo 3: ${item.customField3}` : null,
            item.customField4 ? `Campo 4: ${item.customField4}` : null,
          ]
            .filter(Boolean)
            .join(' | ') || null,
          imageUrl: item.image || null,
          weight: item.weight || null,
          manageStock: item.manageStock,
          alertQuantity: item.alertQuantity || 5,
          enableImeiSerial: !!item.enableImeiSerial,
          notForSale: !!item.notForSelling,
          applicableTax: item.applicableTax || null,
          salePriceTaxType: item.sellingPriceTaxType as TaxType,
          defaultPurchasePrice: purchasePrice,
          marginPercent: profitMargin,
          defaultSalePrice: sellingPrice,
          active: true,
          locationInputs,
          variations,
        };

        const createdProduct = await ProductService.createProduct(companyId, productPayload);

        importedProducts.push({
          id: createdProduct.id,
          name: createdProduct.name,
          sku: createdProduct.sku,
          initialStock: item.openingStock,
          locationName: targetLocationName,
        });

        importedCount++;
      } catch (err: any) {
        errorsCount++;
        errors.push(`Linha ${rowNo} (${item.name || 'Sem nome'}): ${err.message}`);
      }
    }

    return {
      totalRows: items.length,
      importedCount,
      errorsCount,
      errors: errors.length > 0 ? errors : undefined,
      importedProducts,
    };
  }
}
