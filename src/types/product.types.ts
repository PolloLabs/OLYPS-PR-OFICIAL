import type { UUID, ISODateString } from './common.types.js';

export type ProductType = 'single' | 'variable' | 'combo';
export type BarcodeType = 'C128' | 'C39' | 'EAN13' | 'EAN8' | 'UPCA' | 'UPCE';
export type TaxType = 'inclusive' | 'exclusive';
export type WarrantyUnit = 'days' | 'months' | 'years';

export interface Category {
  id: UUID;
  companyId: UUID;
  name: string;
  code: string | null;
  description: string | null;
  parentId: UUID | null;
  parentName?: string | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateCategoryPayload {
  name: string;
  code?: string | null;
  description?: string | null;
  parentId?: UUID | null;
  active?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  code?: string | null;
  description?: string | null;
  parentId?: UUID | null;
  active?: boolean;
}

export interface Brand {
  id: UUID;
  companyId: UUID;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateBrandPayload {
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface UpdateBrandPayload {
  name?: string;
  description?: string | null;
  active?: boolean;
}

export interface Unit {
  id: UUID;
  companyId: UUID;
  name: string;
  shortName: string;
  allowDecimal: boolean;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateUnitPayload {
  name: string;
  shortName: string;
  allowDecimal?: boolean;
  active?: boolean;
}

export interface UpdateUnitPayload {
  name?: string;
  shortName?: string;
  allowDecimal?: boolean;
  active?: boolean;
}

export interface DeviceBrand {
  id: UUID;
  companyId: UUID;
  name: string;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DeviceModel {
  id: UUID;
  companyId: UUID;
  deviceBrandId: UUID;
  deviceBrandName?: string;
  name: string;
  technicalCode: string | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateDeviceModelPayload {
  deviceBrandId: UUID;
  name: string;
  technicalCode?: string | null;
  active?: boolean;
}

export interface CatalogModel {
  id: UUID;
  companyId: UUID;
  brandId?: UUID | null;
  brandName?: string | null;
  name: string;
  technicalCode?: string | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateCatalogModelPayload {
  brandId?: UUID | null;
  name: string;
  technicalCode?: string | null;
  active?: boolean;
}

export interface CatalogColor {
  id: UUID;
  companyId: UUID;
  name: string;
  hex?: string | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateCatalogColorPayload {
  name: string;
  hex?: string | null;
  active?: boolean;
}

export interface CatalogSize {
  id: UUID;
  companyId: UUID;
  name: string;
  code?: string | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateCatalogSizePayload {
  name: string;
  code?: string | null;
  active?: boolean;
}

export interface ProductVariation {
  id: UUID;
  companyId: UUID;
  productId: UUID;
  name: string;
  sku: string;
  barcode: string | null;
  purchasePrice: number;
  marginPercent: number;
  salePrice: number;
  attributes: Record<string, string>;
  isDefault: boolean;
  imageUrl?: string | null;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ProductLocation {
  id: UUID;
  companyId: UUID;
  productId: UUID;
  variationId: UUID;
  locationId: UUID;
  locationName?: string;
  rackLocation: string | null;
  manageStock: boolean;
  initialStock: number;
  currentStock: number;
  minStock: number | null;
  maxStock: number | null;
  isAvailable: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ProductComboComponent {
  id: UUID;
  companyId: UUID;
  comboProductId: UUID;
  componentVariationId: UUID;
  componentProductId?: UUID;
  componentProductName?: string;
  componentVariationName?: string;
  quantity: number;
  unitPrice: number | null;
  createdAt: ISODateString;
}

export interface ProductMedia {
  id: UUID;
  companyId: UUID;
  productId: UUID;
  variationId?: UUID | null;
  mediaType: 'image' | 'document' | 'manual' | 'brochure';
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: ISODateString;
}

export interface Product {
  id: UUID;
  companyId: UUID;
  name: string;
  sku: string;
  barcodeType: BarcodeType;
  barcode: string | null;
  productType: ProductType;
  unitId: UUID;
  unitName?: string | null;
  unitShortName?: string | null;
  brandId: UUID | null;
  brandName?: string | null;
  modelId?: UUID | null;
  modelName?: string | null;
  categoryId: UUID | null;
  categoryName?: string | null;
  categoryCode?: string | null;
  colorId?: UUID | null;
  colorName?: string | null;
  sizeId?: UUID | null;
  sizeName?: string | null;
  description: string | null;
  operationalNotes: string | null;
  imageUrl: string | null;
  brochureUrl: string | null;
  brochureName: string | null;
  weight: number | null;
  preparationTime: number | null;
  manageStock: boolean;
  alertQuantity: number;
  enableImeiSerial: boolean;
  notForSale: boolean;
  applicableTax: string | null;
  salePriceTaxType: TaxType;
  defaultPurchasePrice: number;
  marginPercent: number;
  defaultSalePrice: number;
  warrantyDuration: number | null;
  warrantyUnit: WarrantyUnit;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  // Related loaded data
  currentStock?: number;
  locations?: ProductLocation[];
  variations?: ProductVariation[];
  deviceModels?: DeviceModel[];
  deviceModelIds?: UUID[];
  combos?: ProductComboComponent[];
  media?: ProductMedia[];
}

export interface ProductLocationInput {
  locationId: UUID;
  rackLocation?: string | null;
  manageStock?: boolean;
  initialStock?: number;
  minStock?: number | null;
  maxStock?: number | null;
  isAvailable?: boolean;
}

export interface ProductVariationInput {
  name: string;
  sku: string;
  barcode?: string | null;
  purchasePrice?: number;
  marginPercent?: number;
  salePrice?: number;
  attributes?: Record<string, string>;
  isDefault?: boolean;
  imageUrl?: string | null;
}

export interface ProductComboInput {
  componentVariationId: UUID;
  quantity: number;
  unitPrice?: number | null;
}

export interface CreateProductPayload {
  name: string;
  sku?: string;
  barcodeType?: BarcodeType;
  barcode?: string | null;
  productType?: ProductType;
  unitId: UUID;
  brandId?: UUID | null;
  brandName?: string | null;
  modelId?: UUID | null;
  modelName?: string | null;
  categoryId?: UUID | null;
  categoryName?: string | null;
  colorId?: UUID | null;
  colorName?: string | null;
  sizeId?: UUID | null;
  sizeName?: string | null;
  description?: string | null;
  operationalNotes?: string | null;
  imageUrl?: string | null;
  brochureUrl?: string | null;
  brochureName?: string | null;
  weight?: number | null;
  preparationTime?: number | null;
  manageStock?: boolean;
  alertQuantity?: number;
  enableImeiSerial?: boolean;
  notForSale?: boolean;
  applicableTax?: string | null;
  salePriceTaxType?: TaxType;
  defaultPurchasePrice?: number;
  marginPercent?: number;
  defaultSalePrice?: number;
  warrantyDuration?: number | null;
  warrantyUnit?: WarrantyUnit;
  active?: boolean;
  // Multi-relations
  locationInputs?: ProductLocationInput[];
  deviceModelIds?: UUID[];
  variations?: ProductVariationInput[];
  combos?: ProductComboInput[];
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export interface ProductStockOpeningItem {
  locationId: UUID;
  variationId?: UUID;
  quantity: number;
  unitCost?: number;
  rackLocation?: string | null;
}

export interface ProductStockOpeningPayload {
  items: ProductStockOpeningItem[];
}

export interface BatchProductActionPayload {
  productIds: UUID[];
  action: 'delete' | 'deactivate' | 'activate' | 'add_to_location' | 'remove_from_location';
  locationId?: UUID;
}

export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  locationId?: string;
  productType?: ProductType;
  active?: boolean | string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface VariationTemplate {
  id: UUID;
  companyId: UUID;
  name: string;
  values: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateVariationTemplatePayload {
  name: string;
  values: string[] | string;
}

export interface UpdateVariationTemplatePayload {
  name?: string;
  values?: string[] | string;
}

export type WarrantyDurationUnit = 'Dias' | 'Meses' | 'Anos';

export interface Warranty {
  id: UUID;
  companyId: UUID;
  company_id?: UUID;
  name: string;
  nome?: string;
  description: string | null;
  descricao?: string | null;
  durationValue: number;
  duracao_valor?: number;
  durationUnit: WarrantyDurationUnit;
  duracao_unidade?: WarrantyDurationUnit;
  createdAt: ISODateString;
  created_at?: ISODateString;
  updatedAt: ISODateString;
  updated_at?: ISODateString;
}

export interface CreateWarrantyPayload {
  name?: string;
  nome?: string;
  description?: string | null;
  descricao?: string | null;
  durationValue?: number;
  duracao_valor?: number;
  durationUnit?: WarrantyDurationUnit;
  duracao_unidade?: WarrantyDurationUnit;
}

export interface UpdateWarrantyPayload {
  name?: string;
  nome?: string;
  description?: string | null;
  descricao?: string | null;
  durationValue?: number;
  duracao_valor?: number;
  durationUnit?: WarrantyDurationUnit;
  duracao_unidade?: WarrantyDurationUnit;
}
