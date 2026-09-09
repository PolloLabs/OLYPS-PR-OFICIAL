import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Layers,
  Building2,
  Tag,
  Barcode,
  Smartphone,
  ShieldCheck,
  Percent,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Weight,
  FileText,
  Upload,
  RefreshCw,
  FolderTree,
  Check,
} from 'lucide-react';
import type {
  Product,
  ProductType,
  BarcodeType,
  TaxType,
  WarrantyUnit,
  Category,
  Brand,
  Unit,
  DeviceBrand,
  DeviceModel,
  CommercialLocation,
  CreateProductPayload,
  UpdateProductPayload,
  ProductVariationInput,
  ProductLocationInput,
  CatalogModel,
  CatalogColor,
  CatalogSize,
} from '../../types/index.js';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  isCopying?: boolean;
  companyId: string;
  locations: CommercialLocation[];
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  deviceBrands: DeviceBrand[];
  deviceModels: DeviceModel[];
  models?: CatalogModel[];
  colors?: CatalogColor[];
  sizes?: CatalogSize[];
  onSave: (payload: CreateProductPayload | UpdateProductPayload, actionType: 'save' | 'save_and_stock' | 'save_and_new') => Promise<void>;
  onQuickCreateCategory?: (name: string, code?: string) => Promise<Category>;
  onQuickCreateBrand?: (name: string) => Promise<Brand>;
  onQuickCreateUnit?: (name: string, shortName: string) => Promise<Unit>;
  onQuickCreateDeviceModel?: (brandId: string, name: string) => Promise<DeviceModel>;
  onQuickCreateModel?: (name: string, brandId?: string, technicalCode?: string) => Promise<CatalogModel>;
  onQuickCreateColor?: (name: string, hex?: string) => Promise<CatalogColor>;
  onQuickCreateSize?: (name: string, code?: string) => Promise<CatalogSize>;
}

// Sanitizes numeric inputs: strips non-numeric characters and removes leading zeros while typing
function sanitizeNumericInput(value: string, allowDecimals = true): string {
  if (!value) return '';
  // Normalize comma to dot for decimal inputs
  let clean = value.replace(',', '.');
  if (allowDecimals) {
    clean = clean.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
    }
  } else {
    clean = clean.replace(/\D/g, '');
  }
  if (clean === '') return '';
  // Remove leading zeros: '000100' -> '100', '050' -> '50', '00' -> '0'
  // But preserve decimal values starting with 0 like '0.5' or '0.'
  clean = clean.replace(/^0+(?=\d)/, '');
  return clean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  isCopying = false,
  companyId,
  locations,
  categories,
  brands,
  units,
  deviceBrands,
  deviceModels,
  models = [],
  colors = [],
  sizes = [],
  onSave,
  onQuickCreateCategory,
  onQuickCreateBrand,
  onQuickCreateUnit,
  onQuickCreateDeviceModel,
  onQuickCreateModel,
  onQuickCreateColor,
  onQuickCreateSize,
}) => {
  // Scroll helper to smoothly navigate to form section
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('C128');
  const [barcode, setBarcode] = useState('');
  const [productType, setProductType] = useState<ProductType>('single');

  // Classification
  const [unitId, setUnitId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [modelId, setModelId] = useState('');
  const [colorId, setColorId] = useState('');
  const [sizeId, setSizeId] = useState('');

  // Operational & Details
  const [description, setDescription] = useState('');
  const [operationalNotes, setOperationalNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [brochureName, setBrochureName] = useState('');
  const [weight, setWeight] = useState<string>('');

  // Image Upload state
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState<string>('');

  // Stock Controls
  const [manageStock, setManageStock] = useState(true);
  const [alertQuantity, setAlertQuantity] = useState<string>('5');
  const [enableImeiSerial, setEnableImeiSerial] = useState(false);
  const [notForSale, setNotForSale] = useState(false);

  // Device Compatibility
  const [selectedDeviceBrandId, setSelectedDeviceBrandId] = useState('');
  const [selectedDeviceModelIds, setSelectedDeviceModelIds] = useState<string[]>([]);

  // Locations / Branches
  const effectiveLocations = React.useMemo(() => {
    if (locations && locations.length > 0) {
      return locations;
    }
    return [
      {
        id: 'loc-matriz',
        companyId: companyId || '',
        name: 'Filial Principal',
        isMain: true,
        active: true,
      },
    ];
  }, [locations, companyId]);

  const [selectedStockLocationId, setSelectedStockLocationId] = useState<string>(() => {
    return locations?.find((l) => l.isMain)?.id || locations?.[0]?.id || 'loc-matriz';
  });
  const [locationRows, setLocationRows] = useState<{
    locationId: string;
    locationName: string;
    isEnabled: boolean;
    rackLocation: string;
    initialStock: string;
    minStock: string;
    maxStock: string;
  }[]>(() => {
    const list = locations && locations.length > 0 ? locations : [
      { id: 'loc-matriz', companyId: companyId || '', name: 'Filial Principal', isMain: true, active: true },
    ];
    return list.map((loc, idx) => ({
      locationId: loc.id,
      locationName: loc.name,
      isEnabled: idx === 0 || !!loc.isMain,
      rackLocation: '',
      initialStock: '',
      minStock: '',
      maxStock: '',
    }));
  });

  // Taxes
  const [applicableTax, setApplicableTax] = useState('');
  const [salePriceTaxType, setSalePriceTaxType] = useState<TaxType>('exclusive');

  // Pricing & Margin
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [marginPercent, setMarginPercent] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');

  // Warranty
  const [warrantyDuration, setWarrantyDuration] = useState<string>('');
  const [warrantyUnit, setWarrantyUnit] = useState<WarrantyUnit>('days');

  // Variations (for Variable products)
  const [variations, setVariations] = useState<{
    id?: string;
    name: string;
    sku: string;
    barcode: string;
    purchasePrice: string;
    marginPercent: string;
    salePrice: string;
  }[]>([]);

  // Quick Create Inline State
  const [quickEntityModal, setQuickEntityModal] = useState<'category' | 'brand' | 'unit' | 'deviceModel' | 'model' | 'color' | 'size' | null>(null);
  const [quickInput1, setQuickInput1] = useState('');
  const [quickInput2, setQuickInput2] = useState('');
  const [quickSelectBrandId, setQuickSelectBrandId] = useState('');

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'save' | 'save_and_stock' | 'save_and_new' | null>(null);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setSku('');
    setBarcodeType('C128');
    setBarcode('');
    setProductType('single');
    setUnitId(units[0]?.id || '');
    setBrandId('');
    setCategoryId('');
    setModelId('');
    setColorId('');
    setSizeId('');
    setDescription('');
    setOperationalNotes('');
    setImageUrl('');
    setBrochureUrl('');
    setBrochureName('');
    setWeight('');
    setManageStock(true);
    setAlertQuantity('5');
    setEnableImeiSerial(false);
    setNotForSale(false);
    setSelectedDeviceModelIds([]);
    setApplicableTax('');
    setSalePriceTaxType('exclusive');
    setPurchasePrice('');
    setMarginPercent('');
    setSalePrice('');
    setWarrantyDuration('');
    setWarrantyUnit('days');
    setErrorMsg(null);
    setImageError(null);
    setImageFileName('');
    setImageDimensions('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Default locations
    const defaultLoc = effectiveLocations.find((l) => l.isMain)?.id || effectiveLocations[0]?.id || 'loc-matriz';
    setSelectedStockLocationId(defaultLoc);
    setLocationRows(
      effectiveLocations.map((loc, idx) => ({
        locationId: loc.id,
        locationName: loc.name,
        isEnabled: idx === 0 || !!loc.isMain,
        rackLocation: '',
        initialStock: '',
        minStock: '',
        maxStock: '',
      }))
    );

    // Default variation template
    setVariations([
      { name: 'Padrão', sku: '', barcode: '', purchasePrice: '', marginPercent: '', salePrice: '' },
    ]);
  };

  const initializedRef = React.useRef(false);

  // Initialize or reset form values
  useEffect(() => {
    if (productToEdit) {
      setName(isCopying ? `${productToEdit.name} (Cópia)` : productToEdit.name);
      if (isCopying) {
        handleAutoGenerateSku();
        setBarcode('');
      } else {
        setSku(productToEdit.sku);
        setBarcode(productToEdit.barcode || '');
      }
      setBarcodeType(productToEdit.barcodeType);
      setProductType(productToEdit.productType);
      setUnitId(productToEdit.unitId);
      setBrandId(productToEdit.brandId || '');
      setCategoryId(productToEdit.categoryId || '');
      setModelId(productToEdit.modelId || '');
      setColorId(productToEdit.colorId || '');
      setSizeId(productToEdit.sizeId || '');
      setDescription(productToEdit.description || '');
      setOperationalNotes(productToEdit.operationalNotes || '');
      setImageUrl(productToEdit.imageUrl || '');
      setBrochureUrl(productToEdit.brochureUrl || '');
      setBrochureName(productToEdit.brochureName || '');
      setWeight(productToEdit.weight !== null && productToEdit.weight !== undefined ? String(productToEdit.weight) : '');
      setManageStock(productToEdit.manageStock);
      setAlertQuantity(String(productToEdit.alertQuantity ?? 5));
      setEnableImeiSerial(productToEdit.enableImeiSerial);
      setNotForSale(productToEdit.notForSale);
      setSelectedDeviceModelIds(productToEdit.deviceModelIds || []);
      setApplicableTax(productToEdit.applicableTax || '');
      setSalePriceTaxType(productToEdit.salePriceTaxType);
      setPurchasePrice(productToEdit.defaultPurchasePrice !== null && productToEdit.defaultPurchasePrice !== undefined && productToEdit.defaultPurchasePrice > 0 ? String(productToEdit.defaultPurchasePrice) : '');
      setMarginPercent(productToEdit.marginPercent !== null && productToEdit.marginPercent !== undefined && productToEdit.marginPercent > 0 ? String(productToEdit.marginPercent) : '');
      setSalePrice(productToEdit.defaultSalePrice !== null && productToEdit.defaultSalePrice !== undefined && productToEdit.defaultSalePrice > 0 ? String(productToEdit.defaultSalePrice) : '');
      setWarrantyDuration(productToEdit.warrantyDuration !== null && productToEdit.warrantyDuration !== undefined ? String(productToEdit.warrantyDuration) : '');
      setWarrantyUnit(productToEdit.warrantyUnit);
      setImageError(null);
      setImageFileName('');
      setImageDimensions('');

      // Map locations
      const defaultLoc = isCopying
        ? (effectiveLocations.find((l) => l.isMain)?.id || effectiveLocations[0]?.id || 'loc-matriz')
        : (productToEdit.locations?.find((l) => l.isEnabled)?.locationId || effectiveLocations.find((l) => l.isMain)?.id || effectiveLocations[0]?.id || 'loc-matriz');

      setSelectedStockLocationId(defaultLoc);
      setLocationRows(
        effectiveLocations.map((loc, idx) => {
          const match = productToEdit.locations?.find((l) => l.locationId === loc.id);
          const stockVal = match?.initialStock ?? match?.currentStock;
          return {
            locationId: loc.id,
            locationName: loc.name,
            isEnabled: isCopying ? (idx === 0 || !!loc.isMain) : !!match,
            rackLocation: match?.rackLocation || '',
            initialStock: isCopying
              ? '' // When copying, DO NOT reuse original product stock! Clean field ready for user input!
              : (stockVal !== null && stockVal !== undefined && stockVal > 0 ? String(stockVal) : (stockVal === 0 ? '0' : '')),
            minStock: match?.minStock !== null && match?.minStock !== undefined ? String(match.minStock) : '',
            maxStock: match?.maxStock !== null && match?.maxStock !== undefined ? String(match.maxStock) : '',
          };
        })
      );

      // Map variations if variable
      if (productToEdit.variations && productToEdit.variations.length > 0) {
        setVariations(
          productToEdit.variations.map((v, idx) => ({
            id: isCopying ? `var-copy-${Date.now()}-${idx}` : v.id,
            name: v.name,
            sku: isCopying ? '' : v.sku,
            barcode: isCopying ? '' : (v.barcode || ''),
            purchasePrice: v.purchasePrice ? String(v.purchasePrice) : '',
            marginPercent: v.marginPercent ? String(v.marginPercent) : '',
            salePrice: v.salePrice ? String(v.salePrice) : '',
          }))
        );
      } else {
        setVariations([]);
      }
      setErrorMsg(null);
    } else {
      resetForm();
      handleAutoGenerateSku();
    }
  }, [productToEdit, isCopying, isOpen]);

  // Keep locations in sync without resetting user typed values
  useEffect(() => {
    if (effectiveLocations.length > 0) {
      setLocationRows((prev) => {
        if (prev.length === 0) {
          return effectiveLocations.map((loc, idx) => ({
            locationId: loc.id,
            locationName: loc.name,
            isEnabled: idx === 0 || !!loc.isMain,
            rackLocation: '',
            initialStock: '',
            minStock: '',
            maxStock: '',
          }));
        }
        const existingIds = new Set(prev.map((r) => r.locationId));
        const additions = effectiveLocations
          .filter((loc) => !existingIds.has(loc.id))
          .map((loc) => ({
            locationId: loc.id,
            locationName: loc.name,
            isEnabled: false,
            rackLocation: '',
            initialStock: '',
            minStock: '',
            maxStock: '',
          }));
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
    }
  }, [effectiveLocations]);

  // Recalculate Sale Price when Cost or Margin changes: Preço de Venda = Custo + Margem
  const handlePurchasePriceChange = (valStr: string) => {
    const clean = sanitizeNumericInput(valStr, true);
    setPurchasePrice(clean);
    const cost = parseFloat(clean);
    const margin = parseFloat(marginPercent);
    if (!isNaN(cost)) {
      const effMargin = !isNaN(margin) ? margin : 0;
      const calculatedSale = Math.round(cost * (1 + effMargin / 100) * 100) / 100;
      setSalePrice(String(calculatedSale));
    } else {
      setSalePrice('');
    }
  };

  const handleMarginChange = (valStr: string) => {
    const clean = sanitizeNumericInput(valStr, true);
    setMarginPercent(clean);
    const margin = parseFloat(clean);
    const cost = parseFloat(purchasePrice);
    if (!isNaN(cost)) {
      const effMargin = !isNaN(margin) ? margin : 0;
      const calculatedSale = Math.round(cost * (1 + effMargin / 100) * 100) / 100;
      setSalePrice(String(calculatedSale));
    }
  };

  const handleSalePriceChange = (valStr: string) => {
    const clean = sanitizeNumericInput(valStr, true);
    setSalePrice(clean);
    const sale = parseFloat(clean);
    const cost = parseFloat(purchasePrice);
    if (!isNaN(sale) && !isNaN(cost) && cost > 0) {
      const calculatedMargin = Math.round(((sale - cost) / cost) * 100 * 100) / 100;
      setMarginPercent(String(calculatedMargin));
    }
  };

  // Generate Sequential SKU from Backend (multi-tenant isolated)
  const handleAutoGenerateSku = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/companies/${companyId}/products/next-sku`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.nextSku) {
          setSku(json.data.nextSku);
          return;
        }
      }
    } catch (err) {
      console.error('Erro ao consultar próximo SKU da empresa:', err);
    }
  };

  // Device Model Selection helpers
  const filteredModelsForBrand = useMemo(() => {
    if (!selectedDeviceBrandId) return deviceModels;
    return deviceModels.filter((m) => m.deviceBrandId === selectedDeviceBrandId);
  }, [deviceModels, selectedDeviceBrandId]);

  const filteredCatalogModels = useMemo(() => {
    if (!brandId) return models;
    return models.filter((m) => !m.brandId || m.brandId === brandId);
  }, [models, brandId]);

  const toggleDeviceModel = (modelId: string) => {
    setSelectedDeviceModelIds((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  // Variations Handlers
  const handleAddVariationRow = () => {
    const newIdx = variations.length + 1;
    setVariations((prev) => [
      ...prev,
      {
        name: `Variação ${newIdx}`,
        sku: sku ? `${sku}-V${newIdx}` : '',
        barcode: '',
        purchasePrice: purchasePrice,
        marginPercent: marginPercent,
        salePrice: salePrice,
      },
    ]);
  };

  const handleRemoveVariationRow = (index: number) => {
    if (variations.length <= 1) return;
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariationChange = (index: number, field: string, value: any) => {
    setVariations((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        if (field === 'purchasePrice' || field === 'marginPercent' || field === 'salePrice') {
          const clean = sanitizeNumericInput(String(value), true);
          const updated = { ...v, [field]: clean };
          if (field === 'purchasePrice') {
            const cost = parseFloat(clean);
            const m = parseFloat(String(updated.marginPercent));
            if (!isNaN(cost)) {
              const effMargin = !isNaN(m) ? m : 0;
              updated.salePrice = String(Math.round(cost * (1 + effMargin / 100) * 100) / 100);
            } else {
              updated.salePrice = '';
            }
          } else if (field === 'marginPercent') {
            const m = parseFloat(clean);
            const cost = parseFloat(String(updated.purchasePrice));
            if (!isNaN(cost)) {
              const effMargin = !isNaN(m) ? m : 0;
              updated.salePrice = String(Math.round(cost * (1 + effMargin / 100) * 100) / 100);
            }
          } else if (field === 'salePrice') {
            const sp = parseFloat(clean);
            const cost = parseFloat(String(updated.purchasePrice));
            if (!isNaN(sp) && !isNaN(cost) && cost > 0) {
              updated.marginPercent = String(Math.round(((sp - cost) / cost) * 100 * 100) / 100);
            }
          }
          return updated;
        }
        return { ...v, [field]: value };
      })
    );
  };

  // Submission handler
  const handleSubmit = async (actionType: 'save' | 'save_and_stock' | 'save_and_new') => {
    if (isSubmitting) return;
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('O Nome do Produto é obrigatório.');
      scrollToSection('section-identificacao');
      return;
    }
    if (!unitId) {
      setErrorMsg('A Unidade de Medida é obrigatória.');
      scrollToSection('section-classificacao');
      return;
    }

    setIsSubmitting(true);
    setSubmittingAction(actionType);
    try {
      // Build location inputs
      const activeStockLocId = selectedStockLocationId || effectiveLocations.find((l) => l.isMain)?.id || effectiveLocations[0]?.id || 'loc-matriz';
      let locationInputs: ProductLocationInput[] = locationRows
        .filter((r) => r.locationId === activeStockLocId || r.isEnabled || (r.initialStock !== '' && !isNaN(Number(r.initialStock))))
        .map((r) => ({
          locationId: r.locationId,
          rackLocation: r.rackLocation.trim() || null,
          initialStock: r.initialStock !== '' ? Number(r.initialStock) : 0,
          minStock: r.minStock !== '' ? Number(r.minStock) : null,
          maxStock: r.maxStock !== '' ? Number(r.maxStock) : null,
          isAvailable: true,
          manageStock: manageStock,
        }));

      // Guarantee at least the active location is included with its initial stock
      if (locationInputs.length === 0) {
        const activeRow = locationRows.find((r) => r.locationId === activeStockLocId);
        locationInputs = [
          {
            locationId: activeStockLocId,
            rackLocation: activeRow?.rackLocation?.trim() || null,
            initialStock: activeRow?.initialStock !== '' && activeRow?.initialStock !== undefined ? Number(activeRow.initialStock) : 0,
            minStock: null,
            maxStock: null,
            isAvailable: true,
            manageStock: manageStock,
          },
        ];
      }

      // Build variation inputs if variable
      const variationInputs: ProductVariationInput[] | undefined =
        productType === 'variable'
          ? variations.map((v, i) => ({
              name: v.name.trim(),
              sku: v.sku.trim() || (sku ? `${sku}-${i + 1}` : `VAR-${i + 1}`),
              barcode: v.barcode.trim() || null,
              purchasePrice: v.purchasePrice !== '' ? Number(v.purchasePrice) : 0,
              marginPercent: v.marginPercent !== '' ? Number(v.marginPercent) : 0,
              salePrice: v.salePrice !== '' ? Number(v.salePrice) : 0,
              isDefault: i === 0,
            }))
          : undefined;

      const payload: CreateProductPayload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        barcodeType,
        barcode: barcode.trim() || null,
        productType,
        unitId,
        brandId: brandId || null,
        categoryId: categoryId || null,
        modelId: modelId || null,
        colorId: colorId || null,
        sizeId: sizeId || null,
        description: description.trim() || null,
        operationalNotes: operationalNotes.trim() || null,
        imageUrl: imageUrl.trim() || null,
        brochureUrl: brochureUrl.trim() || null,
        brochureName: brochureName.trim() || null,
        weight: weight !== '' ? Number(weight) : null,
        preparationTime: null,
        manageStock,
        alertQuantity: alertQuantity !== '' ? Number(alertQuantity) : 5,
        enableImeiSerial,
        notForSale,
        applicableTax: applicableTax.trim() || null,
        salePriceTaxType,
        defaultPurchasePrice: purchasePrice !== '' ? Number(purchasePrice) : 0,
        marginPercent: marginPercent !== '' ? Number(marginPercent) : 0,
        defaultSalePrice: salePrice !== '' ? Number(salePrice) : 0,
        warrantyDuration: warrantyDuration !== '' ? Number(warrantyDuration) : null,
        warrantyUnit,
        deviceModelIds: selectedDeviceModelIds,
        locationInputs,
        variations: variationInputs,
      };

      await onSave(payload, actionType);

      if (actionType === 'save_and_new') {
        // Completely reset form for next product to prevent data contamination
        resetForm();
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar produto.');
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  // Quick entity creation submit
  const handleQuickCreateEntitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEntityModal || isSubmittingQuick) return;

    setIsSubmittingQuick(true);
    try {
      if (quickEntityModal === 'category' && onQuickCreateCategory && quickInput1) {
        const cat = await onQuickCreateCategory(quickInput1, quickInput2);
        setCategoryId(cat.id);
      } else if (quickEntityModal === 'brand' && onQuickCreateBrand && quickInput1) {
        const b = await onQuickCreateBrand(quickInput1);
        setBrandId(b.id);
      } else if (quickEntityModal === 'model' && onQuickCreateModel && quickInput1) {
        const m = await onQuickCreateModel(quickInput1, brandId || undefined, quickInput2 || undefined);
        setModelId(m.id);
      } else if (quickEntityModal === 'color' && onQuickCreateColor && quickInput1) {
        const c = await onQuickCreateColor(quickInput1, quickInput2 || undefined);
        setColorId(c.id);
      } else if (quickEntityModal === 'size' && onQuickCreateSize && quickInput1) {
        const s = await onQuickCreateSize(quickInput1, quickInput2 || undefined);
        setSizeId(s.id);
      } else if (quickEntityModal === 'unit' && onQuickCreateUnit && quickInput1 && quickInput2) {
        const u = await onQuickCreateUnit(quickInput1, quickInput2);
        setUnitId(u.id);
      } else if (quickEntityModal === 'deviceModel' && onQuickCreateDeviceModel && quickInput1 && quickSelectBrandId) {
        const dm = await onQuickCreateDeviceModel(quickSelectBrandId, quickInput1);
        setSelectedDeviceModelIds((prev) => [...prev, dm.id]);
      }
      setQuickEntityModal(null);
      setQuickInput1('');
      setQuickInput2('');
      setQuickSelectBrandId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar item rápido.');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header with sovereign title and close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {isCopying ? 'COPIAR PRODUTO' : productToEdit ? 'Editar Produto' : 'ADICIONAR PRODUTO'}
            </h3>
            <p className="text-xs text-slate-500">
              Cadastro completo em tela única vertical: Identificação, Classificação, Características, Preço e Estoque.
            </p>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Quick Anchor Navigation Bar */}
        <div className="px-6 border-b border-slate-200 bg-slate-50/80 flex items-center overflow-x-auto no-scrollbar gap-2 py-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Navegação rápida:</span>
          <button
            type="button"
            onClick={() => scrollToSection('section-identificacao')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Identificação</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('section-classificacao')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <FolderTree className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Classificação</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('section-caracteristicas')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Características</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('section-preco')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>4. Preço</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('section-estoque')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>5. Estoque</span>
          </button>
        </div>

        {/* Scrollable Form Body — Single Vertical Layout */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 divide-y divide-slate-200">
          {/* SECTION 1: IDENTIFICAÇÃO */}
          <section id="section-identificacao" className="space-y-4 pt-1">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                1. Identificação do Produto
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Campos com * são obrigatórios</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do Produto */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cabo Lightning 1 Metro Reforçado Hmaston"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* SKU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    SKU (Código Interno Sequencial)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSku}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Gerar / Atualizar Prévia
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Ex: PRD-100000 (sequencial automático por empresa)"
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden text-slate-800"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Sequência exclusiva por cliente (inicia em PRD-100000 e incrementa de forma isolada).
                </p>
              </div>

              {/* Tipo de Código de Barras */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Código de Barras
                </label>
                <select
                  value={barcodeType}
                  onChange={(e) => setBarcodeType(e.target.value as BarcodeType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="C128">Code 128 (C128) - Padrão Universal</option>
                  <option value="C39">Code 39 (C39)</option>
                  <option value="EAN13">EAN-13 (Comércio / Varejo)</option>
                  <option value="EAN8">EAN-8</option>
                  <option value="UPCA">UPC-A</option>
                  <option value="UPCE">UPC-E</option>
                </select>
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Barras
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Escaneie ou digite o código de barras"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                  />
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Tipo de Produto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Produto
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as ProductType)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="single">Produto Simples (Item padrão único)</option>
                  <option value="variable">Produto com Variações (Grade de cores, tamanhos ou modelos)</option>
                  <option value="combo">Combo / Kit (Conjunto de múltiplos itens)</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 2: CLASSIFICAÇÃO */}
          <section id="section-classificacao" className="space-y-4 pt-6">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-600" />
                2. Classificação & Atributos do Catálogo
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Categoria */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Categoria
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickEntityModal('category')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Nova Categoria
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">Nenhuma categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Marca / Fabricante
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickEntityModal('brand')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Nova Marca
                  </button>
                </div>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">Nenhuma marca selecionada</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modelo do Produto */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Modelo
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickEntityModal('model')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Novo Modelo
                  </button>
                </div>
                <select
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">Nenhum modelo selecionado</option>
                  {filteredCatalogModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.technicalCode ? `(${m.technicalCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Cor
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickEntityModal('color')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Nova Cor
                  </button>
                </div>
                <select
                  value={colorId}
                  onChange={(e) => setColorId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">Nenhuma cor selecionada</option>
                  {colors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tamanho */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tamanho
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickEntityModal('size')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Novo Tamanho
                  </button>
                </div>
                <select
                  value={sizeId}
                  onChange={(e) => setSizeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">Nenhum tamanho selecionado</option>
                  {sizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unidade */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Unidade de Medida *
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickEntityModal('unit')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Nova Unidade
                  </button>
                </div>
                <select
                  required
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">Selecione uma unidade...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.shortName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 3: CARACTERÍSTICAS */}
          <section id="section-caracteristicas" className="space-y-6 pt-6">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                3. Características, Detalhes Técnicos & Compatibilidade
              </h4>
            </div>

            {/* Peso Líquido */}
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peso Líquido (kg)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(sanitizeNumericInput(e.target.value, true))}
                  placeholder="Ex: 0.150"
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                />
                <Weight className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Descrição e Observações Operacionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Comercial do Produto
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes para catálogo, tabela de preços e orçamentos de venda..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Observações Operacionais / Oficina / Uso Interno
                </label>
                <textarea
                  rows={3}
                  value={operationalNotes}
                  onChange={(e) => setOperationalNotes(e.target.value)}
                  placeholder="Orientações aos técnicos, cuidados de manuseio, testes pré-instalação..."
                  className="w-full px-3 py-2 text-xs border border-amber-300 bg-amber-50/40 rounded-lg focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Imagem e Manual */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Imagem do Produto com Upload e URL */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900">
                      Imagem do produto
                    </label>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>Tamanho máximo do arquivo: 5MB</p>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ESCOLHER ARQUIVO</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        setImageError(null);
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validar tamanho máximo: 5 MB
                        const MAX_SIZE_BYTES = 5 * 1024 * 1024;
                        if (file.size > MAX_SIZE_BYTES) {
                          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                          setImageError(`Tamanho máximo do arquivo: 5MB. O arquivo selecionado possui ${sizeMB}MB.`);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          return;
                        }

                        // Carregar imagem (aceita quadrada, retangular, horizontal ou vertical)
                        const objectUrl = URL.createObjectURL(file);
                        const img = new Image();
                        img.onload = () => {
                          URL.revokeObjectURL(objectUrl);
                          const width = img.naturalWidth || img.width;
                          const height = img.naturalHeight || img.height;

                          // Otimizar via Canvas preservando a proporção original para não exceder limites de transporte HTTP
                          const MAX_DIM = 800;
                          let targetWidth = width;
                          let targetHeight = height;

                          if (width > MAX_DIM || height > MAX_DIM) {
                            if (width >= height) {
                              targetWidth = MAX_DIM;
                              targetHeight = Math.round((height / width) * MAX_DIM);
                            } else {
                              targetHeight = MAX_DIM;
                              targetWidth = Math.round((width / height) * MAX_DIM);
                            }
                          }

                          try {
                            const canvas = document.createElement('canvas');
                            canvas.width = targetWidth;
                            canvas.height = targetHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                              let optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                              if (optimizedDataUrl.length > 80000) {
                                optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
                              }
                              setImageUrl(optimizedDataUrl);
                              setImageFileName(file.name);
                              setImageDimensions(`${width}x${height}`);
                              setImageError(null);
                              return;
                            }
                          } catch (canvasErr) {
                            console.warn('Canvas optimization fallback:', canvasErr);
                          }

                          // Fallback com FileReader se Canvas falhar
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            setImageUrl(dataUrl);
                            setImageFileName(file.name);
                            setImageDimensions(`${width}x${height}`);
                            setImageError(null);
                          };
                          reader.readAsDataURL(file);
                        };

                        img.onerror = () => {
                          URL.revokeObjectURL(objectUrl);
                          setImageError('Não foi possível ler a imagem selecionada. Escolha um arquivo JPG, PNG ou WEBP válido.');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        };

                        img.src = objectUrl;
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {imageError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Pré-visualização da imagem */}
                {imageUrl && (
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                        <img
                          src={imageUrl}
                          alt="Prévia do produto"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-800 block truncate max-w-[180px]">
                          {imageFileName || 'Pré-visualização da imagem'}
                        </span>
                        {imageDimensions ? (
                          <span className="text-[10px] text-emerald-600 font-mono block">
                            Dimensões: {imageDimensions}px
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">
                            Foto vinculada
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageFileName('');
                        setImageDimensions('');
                        setImageError(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:underline px-2 py-1"
                    >
                      Remover
                    </button>
                  </div>
                )}

                {/* URL da Foto / Imagem do Produto (coexistência garantida) */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL da Foto / Imagem do Produto
                  </label>
                  <input
                    type="url"
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageFileName('');
                      setImageDimensions('');
                      setImageError(null);
                    }}
                    placeholder={imageUrl.startsWith('data:') ? 'Imagem carregada por arquivo (ou cole uma URL aqui)' : 'https://exemplo.com/imagem.jpg'}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  {imageUrl.startsWith('data:') && (
                    <p className="text-[10px] text-emerald-600 mt-1">
                      Arquivo selecionado ativo. Cole uma URL acima caso prefira vincular por link externo.
                    </p>
                  )}
                </div>
              </div>

              {/* Folheto / Manual do Fabricante */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-0.5">
                    Folheto / Manual do Fabricante (URL ou PDF)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Link para ficha técnica, catálogo ou manual em PDF.
                  </p>
                  <input
                    type="text"
                    value={brochureUrl}
                    onChange={(e) => setBrochureUrl(e.target.value)}
                    placeholder="Link para ficha técnica ou manual em PDF"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Compatível com links diretos HTTP/HTTPS para documentação técnica.
                </p>
              </div>
            </div>

            {/* Modelos de Dispositivos Compatíveis */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Modelos de Dispositivos Compatíveis (Peças, Telas e Acessórios)
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Vincule aparelhos aos quais este item serve (ex: telas para J5 Prime, película Moto G30).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickEntityModal('deviceModel')}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Modelo
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600">Filtrar Fabricante:</span>
                <select
                  value={selectedDeviceBrandId}
                  onChange={(e) => setSelectedDeviceBrandId(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="">Todos os fabricantes</option>
                  {deviceBrands.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 font-medium">
                  Selecionados: <strong>{selectedDeviceModelIds.length}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-white">
                {filteredModelsForBrand.map((model) => {
                  const isSelected = selectedDeviceModelIds.includes(model.id);
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => toggleDeviceModel(model.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all flex items-start justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {model.deviceBrandName || 'Fabricante'}
                        </span>
                        <span>{model.name}</span>
                        {model.technicalCode && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {model.technicalCode}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Garantia e Tributação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Política de Garantia */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Política de Garantia
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Duração da Garantia
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={warrantyDuration}
                      onChange={(e) => setWarrantyDuration(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="Ex: 90"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unidade de Garantia
                    </label>
                    <select
                      value={warrantyUnit}
                      onChange={(e) => setWarrantyUnit(e.target.value as WarrantyUnit)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="days">Dias</option>
                      <option value="months">Meses</option>
                      <option value="years">Anos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Regime de Tributação */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  Regime de Tributação e Impostos
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Imposto Aplicável
                    </label>
                    <select
                      value={applicableTax}
                      onChange={(e) => setApplicableTax(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="">Nenhum (Isento)</option>
                      <option value="ICMS_PADRAO">ICMS Padrão</option>
                      <option value="ISS_SERVICOS">ISS (Serviços)</option>
                      <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                      <option value="SUBST_TRIBUTARIA">Substituição Tributária</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tipo de Preço de Venda
                    </label>
                    <select
                      value={salePriceTaxType}
                      onChange={(e) => setSalePriceTaxType(e.target.value as TaxType)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="exclusive">Imposto Exclusivo</option>
                      <option value="inclusive">Imposto Incluso</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: PREÇO */}
          <section id="section-preco" className="space-y-4 pt-6">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                4. Preço de Compra (Custo), Margem & Preço de Venda
              </h4>
              <p className="text-xs text-slate-500">
                Cálculo automático em tempo real: altere o custo ou a margem para recalcular a venda instantaneamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              {/* Preço de Compra */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preço de Compra Padrão (Custo)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={purchasePrice}
                    onChange={(e) => handlePurchasePriceChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Custo líquido de aquisição</span>
              </div>

              {/* Margem de Lucro */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Margem de Lucro (%)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={marginPercent}
                    onChange={(e) => handleMarginChange(e.target.value)}
                    placeholder="0"
                    className="w-full pr-8 pl-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Markup sobre o custo</span>
              </div>

              {/* Preço de Venda */}
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  Preço de Venda Padrão
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-emerald-600 font-bold">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={salePrice}
                    onChange={(e) => handleSalePriceChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono border border-emerald-400 bg-emerald-50/50 rounded-lg text-emerald-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-emerald-600 mt-1 block">Preço praticado no caixa / PDV</span>
              </div>
            </div>
          </section>

          {/* SECTION 5: ESTOQUE */}
          <section id="section-estoque" className="space-y-6 pt-6">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                5. Controle de Estoque, Filiais, Localização & Variações
              </h4>
            </div>

            {/* Toggles e Controles de Estoque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {/* Campo Quantidade Inicial por Filial */}
              {(() => {
                const activeStockLocId = selectedStockLocationId || effectiveLocations.find((l) => l.isMain)?.id || effectiveLocations[0]?.id || 'loc-matriz';
                const activeLocRow = locationRows.find((r) => r.locationId === activeStockLocId);
                const activeLocObj = effectiveLocations.find((l) => l.id === activeStockLocId);
                const currentVal = activeLocRow?.initialStock ?? '';

                return (
                  <div className="p-3.5 rounded-lg border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <label className="block text-xs font-bold text-slate-900">
                          Quantidade Inicial
                        </label>
                        {effectiveLocations.length > 1 ? (
                          <select
                            value={activeStockLocId}
                            onChange={(e) => setSelectedStockLocationId(e.target.value)}
                            className="text-[10px] font-semibold text-emerald-800 bg-white border border-emerald-300 rounded px-1.5 py-0.5 focus:outline-hidden"
                          >
                            {effectiveLocations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name} {loc.isMain ? '(Principal)' : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            {effectiveLocations[0]?.name || 'Filial Principal'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mb-1.5">
                        Quantidade do produto que está entrando nesta filial.
                      </p>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentVal}
                      onChange={(e) => {
                        const val = sanitizeNumericInput(e.target.value, false);
                        setLocationRows((prev) => {
                          const index = prev.findIndex((r) => r.locationId === activeStockLocId);
                          if (index >= 0) {
                            return prev.map((r, idx) =>
                              idx === index ? { ...r, initialStock: val, isEnabled: true } : r
                            );
                          } else {
                            return [
                              ...prev,
                              {
                                locationId: activeStockLocId,
                                locationName: activeLocObj?.name || 'Filial Principal',
                                isEnabled: true,
                                rackLocation: '',
                                initialStock: val,
                                minStock: '',
                                maxStock: '',
                              },
                            ];
                          }
                        });
                      }}
                      placeholder="0"
                      className="w-full px-2.5 py-1 text-xs font-mono font-bold border border-emerald-300 rounded-md bg-white text-slate-900 focus:border-emerald-600 focus:outline-hidden mt-1"
                    />
                  </div>
                );
              })()}

              {/* Gerenciar Estoque Toggle */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Gerenciar Estoque</span>
                  <p className="text-[10px] text-slate-500">Rastrear saldo e saídas.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manageStock}
                    onChange={(e) => setManageStock(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Quantidade de Alerta */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-0.5">Alerta Mínimo</label>
                  <p className="text-[10px] text-slate-500 mb-1.5">Aviso de reposição.</p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={alertQuantity}
                  onChange={(e) => setAlertQuantity(sanitizeNumericInput(e.target.value, false))}
                  placeholder="5"
                  className="w-full px-2.5 py-1 text-xs font-mono font-bold border border-slate-300 rounded-md bg-white focus:border-emerald-500 focus:outline-hidden mt-1"
                />
              </div>

              {/* IMEI / Serial */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Ativar IMEI / Serial</span>
                  <p className="text-[10px] text-slate-500">Rastrear serial unitário.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableImeiSerial}
                    onChange={(e) => setEnableImeiSerial(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Não destinado à venda */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Não para Venda</span>
                  <p className="text-[10px] text-slate-500">Uso interno ou insumo.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notForSale}
                    onChange={(e) => setNotForSale(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Tabela de Filiais, Prateleiras e Saldo Inicial */}
            <div className="space-y-3">
              <div>
                <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Distribuição por Filiais, Prateleiras e Estoque Inicial
                </h5>
                <p className="text-[11px] text-slate-500">
                  Informe a posição de armazenamento (gaveta/prateleira/rack) e o saldo inicial por filial.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10">Ativo</th>
                      <th className="py-2.5 px-3">Filial / Local</th>
                      <th className="py-2.5 px-3">Localização (Rack / Prateleira)</th>
                      <th className="py-2.5 px-3 w-28">Estoque Inicial</th>
                      <th className="py-2.5 px-3 w-24">Mínimo</th>
                      <th className="py-2.5 px-3 w-24">Máximo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {locationRows.map((row, idx) => (
                      <tr key={row.locationId} className={row.isEnabled ? 'bg-white' : 'bg-slate-50 opacity-60'}>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.isEnabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setLocationRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, isEnabled: checked } : r))
                              );
                            }}
                            className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {row.locationName}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            disabled={!row.isEnabled}
                            value={row.rackLocation}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocationRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, rackLocation: val } : r))
                              );
                            }}
                            placeholder="Ex: Corredor B, Gaveta 3"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-hidden disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            disabled={!row.isEnabled}
                            value={row.initialStock}
                            onChange={(e) => {
                              const val = sanitizeNumericInput(e.target.value, false);
                              setLocationRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, initialStock: val } : r))
                              );
                            }}
                            placeholder="0"
                            className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-md focus:outline-hidden disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            disabled={!row.isEnabled}
                            value={row.minStock}
                            onChange={(e) => {
                              const val = sanitizeNumericInput(e.target.value, false);
                              setLocationRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, minStock: val } : r))
                              );
                            }}
                            placeholder="5"
                            className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded-md focus:outline-hidden disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            disabled={!row.isEnabled}
                            value={row.maxStock}
                            onChange={(e) => {
                              const val = sanitizeNumericInput(e.target.value, false);
                              setLocationRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, maxStock: val } : r))
                              );
                            }}
                            placeholder="100"
                            className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded-md focus:outline-hidden disabled:bg-slate-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grade de Variações (quando tipo = variable) */}
            {productType === 'variable' && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Grade de Variações do Produto
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Configure os SKUs, preços e códigos de barras para cada variação do produto.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariationRow}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Variação
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Nome da Variação</th>
                        <th className="py-2 px-3">SKU Específico</th>
                        <th className="py-2 px-3">Código de Barras</th>
                        <th className="py-2 px-3 w-24">Custo (R$)</th>
                        <th className="py-2 px-3 w-20">Margem (%)</th>
                        <th className="py-2 px-3 w-28">Preço Venda (R$)</th>
                        <th className="py-2 px-2 text-center w-10">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {variations.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              value={v.name}
                              onChange={(e) => handleVariationChange(i, 'name', e.target.value)}
                              placeholder="Ex: Preto / 1 Metro"
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => handleVariationChange(i, 'sku', e.target.value)}
                              placeholder="Deixe vazio para auto"
                              className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded-md focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={v.barcode}
                              onChange={(e) => handleVariationChange(i, 'barcode', e.target.value)}
                              placeholder="EAN / Código"
                              className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded-md focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={v.purchasePrice}
                              onChange={(e) => handleVariationChange(i, 'purchasePrice', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded-md focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={v.marginPercent}
                              onChange={(e) => handleVariationChange(i, 'marginPercent', e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded-md focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={v.salePrice}
                              onChange={(e) => handleVariationChange(i, 'salePrice', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 text-xs font-mono font-bold border border-emerald-400 bg-emerald-50/50 rounded-md focus:outline-hidden text-emerald-900"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariationRow(i)}
                              disabled={variations.length <= 1}
                              className="text-rose-500 hover:text-rose-700 disabled:opacity-30 p-1"
                              title="Remover variação"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('save_and_stock')}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{submittingAction === 'save_and_stock' ? 'Processando...' : 'Salvar & Estoque Inicial'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('save_and_new')}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{submittingAction === 'save_and_new' ? 'Processando...' : 'Salvar & Adicionar Outro'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('save')}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{submittingAction === 'save' ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ENTITY CREATION INLINE MODAL */}
      {quickEntityModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h4 className="text-sm font-bold text-slate-900">
                {quickEntityModal === 'category' && 'Cadastrar Nova Categoria Rápida'}
                {quickEntityModal === 'brand' && 'Cadastrar Nova Marca Rápida'}
                {quickEntityModal === 'model' && 'Cadastrar Novo Modelo Rápido'}
                {quickEntityModal === 'color' && 'Cadastrar Nova Cor Rápida'}
                {quickEntityModal === 'size' && 'Cadastrar Novo Tamanho Rápido'}
                {quickEntityModal === 'unit' && 'Cadastrar Nova Unidade de Medida'}
                {quickEntityModal === 'deviceModel' && 'Cadastrar Novo Modelo de Dispositivo'}
              </h4>
              <button
                type="button"
                onClick={() => setQuickEntityModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateEntitySubmit} className="space-y-3">
              {quickEntityModal === 'deviceModel' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fabricante do Dispositivo *
                  </label>
                  <select
                    required
                    value={quickSelectBrandId}
                    onChange={(e) => setQuickSelectBrandId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden bg-white"
                  >
                    <option value="">Selecione o fabricante...</option>
                    {deviceBrands.map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {quickEntityModal === 'category' && 'Nome da Categoria *'}
                  {quickEntityModal === 'brand' && 'Nome da Marca *'}
                  {quickEntityModal === 'model' && 'Nome do Modelo (ex: EP-TA800, Galaxy J5 Prime) *'}
                  {quickEntityModal === 'color' && 'Nome da Cor (ex: Preto, Branco, Prata) *'}
                  {quickEntityModal === 'size' && 'Nome do Tamanho (ex: Único, P, M, G, 1 Metro) *'}
                  {quickEntityModal === 'unit' && 'Nome da Unidade (ex: Quilograma) *'}
                  {quickEntityModal === 'deviceModel' && 'Nome do Modelo (ex: Galaxy A14) *'}
                </label>
                <input
                  type="text"
                  required
                  value={quickInput1}
                  onChange={(e) => setQuickInput1(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              {(quickEntityModal === 'category' || quickEntityModal === 'unit' || quickEntityModal === 'model' || quickEntityModal === 'color' || quickEntityModal === 'size') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {quickEntityModal === 'category'
                      ? 'Código da Categoria (ex: CC0009)'
                      : quickEntityModal === 'unit'
                      ? 'Sigla / Abreviatura (ex: KG) *'
                      : quickEntityModal === 'model'
                      ? 'Código Técnico / Part Number (opcional)'
                      : quickEntityModal === 'color'
                      ? 'Código Hexadecimal / Cor (opcional, ex: #000000)'
                      : 'Código / Abreviação do Tamanho (opcional, ex: UNICO, P, M, 42)'}
                  </label>
                  <input
                    type="text"
                    required={quickEntityModal === 'unit'}
                    value={quickInput2}
                    onChange={(e) => setQuickInput2(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  disabled={isSubmittingQuick}
                  onClick={() => setQuickEntityModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuick}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  <span>{isSubmittingQuick ? 'Salvando...' : 'Confirmar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
