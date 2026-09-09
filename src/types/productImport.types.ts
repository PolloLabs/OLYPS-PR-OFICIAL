import type { UUID } from './common.types.js';

export interface ProductImportColumnDef {
  number: number;
  key: string;
  name: string;
  required: boolean;
  instruction: string;
  options?: string[];
  defaultValue?: string;
}

export interface ProductImportValidationError {
  rowNumber: number;
  columnNumber: number;
  columnName: string;
  value: string;
  message: string;
}

export interface ProductImportRowItem {
  rowNumber: number;
  isValid: boolean;
  errors: ProductImportValidationError[];
  raw: Record<string, any>;
  parsed: {
    name: string;
    brand?: string;
    unit: string;
    category?: string;
    subCategory?: string;
    sku?: string;
    barcodeType?: string;
    manageStock: boolean;
    alertQuantity?: number;
    expiresIn?: number;
    expiryPeriodUnit?: string;
    applicableTax?: string;
    sellingPriceTaxType: 'inclusive' | 'exclusive';
    productType: 'single' | 'variable';
    variationName?: string;
    variationValues?: string;
    variationSku?: string;
    purchasePriceIncTax?: number;
    purchasePriceExcTax?: number;
    profitMargin?: number;
    sellingPrice?: number;
    openingStock?: number;
    location?: string;
    expiryDate?: string;
    enableImeiSerial?: boolean;
    weight?: number;
    rack?: string;
    row?: string;
    position?: string;
    image?: string;
    productDescription?: string;
    customField1?: string;
    customField2?: string;
    customField3?: string;
    customField4?: string;
    notForSelling?: boolean;
    productLocations?: string[];
  };
}

export interface ProductImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  columnValidation: {
    valid: boolean;
    detectedCount: number;
    expectedCount: number;
    missingColumns?: string[];
    mismatchedColumns?: Array<{ expected: string; found: string; position: number }>;
  };
  items: ProductImportRowItem[];
}

export interface ProductImportPayload {
  items: ProductImportRowItem['parsed'][];
}

export interface ProductImportResult {
  totalRows: number;
  importedCount: number;
  errorsCount: number;
  errors?: string[];
  importedProducts?: Array<{
    id: string;
    name: string;
    sku: string;
    initialStock?: number;
    locationName?: string;
  }>;
}
