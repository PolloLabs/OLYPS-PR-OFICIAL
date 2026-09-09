import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  Brand,
  CreateBrandPayload,
  UpdateBrandPayload,
  Unit,
  CreateUnitPayload,
  UpdateUnitPayload,
  DeviceBrand,
  DeviceModel,
  CreateDeviceModelPayload,
  CatalogModel,
  CreateCatalogModelPayload,
  CatalogColor,
  CreateCatalogColorPayload,
  CatalogSize,
  CreateCatalogSizePayload,
  Product,
  ProductVariation,
  ProductLocation,
  ProductComboComponent,
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
  PaginatedResult,
  ProductStockOpeningPayload,
  BatchProductActionPayload,
  VariationTemplate,
  CreateVariationTemplatePayload,
  UpdateVariationTemplatePayload,
  Warranty,
  CreateWarrantyPayload,
  UpdateWarrantyPayload,
  WarrantyDurationUnit,
} from '../../types/index.js';

// In-memory fallback stores for local/preview resilience with JSON file persistence
interface InMemoryStore {
  categories: Category[];
  brands: Brand[];
  models: CatalogModel[];
  colors: CatalogColor[];
  sizes: CatalogSize[];
  units: Unit[];
  deviceBrands: DeviceBrand[];
  deviceModels: DeviceModel[];
  products: Product[];
  variations: ProductVariation[];
  variationTemplates: VariationTemplate[];
  warranties: Warranty[];
  locations: ProductLocation[];
  combos: ProductComboComponent[];
  nextSkuSequence?: number;
}

// Mutex isolado por tenant para garantir alocação sequencial atômica e livre de concorrência
const companySkuLocks = new Map<string, Promise<void>>();

async function withCompanySkuLock<T>(companyId: string, operation: () => Promise<T>): Promise<T> {
  const currentLock = companySkuLocks.get(companyId) || Promise.resolve();
  let releaseLock: () => void;
  const nextLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  companySkuLocks.set(companyId, nextLock);

  try {
    await currentLock;
    return await operation();
  } finally {
    releaseLock!();
    if (companySkuLocks.get(companyId) === nextLock) {
      companySkuLocks.delete(companyId);
    }
  }
}

/**
 * Calcula o próximo número de SKU sequencial para a empresa informada.
 * A sequência é isolada por company_id e inicia rigorosamente em 100000.
 */
function calculateNextSkuNumber(companyId: string, store: InMemoryStore): number {
  const SKU_BASE_NUMBER = 100000;

  // Analisa os SKUs da empresa que seguem o padrão sequencial PRD-<numero>
  let maxExistingNumber = 0;
  for (const prod of store.products) {
    if (!prod.sku) continue;
    const match = prod.sku.trim().match(/^PRD-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= SKU_BASE_NUMBER) {
        if (num > maxExistingNumber) {
          maxExistingNumber = num;
        }
      }
    }
  }

  let candidate = SKU_BASE_NUMBER;

  // Se houver sequência persistida no store, verifica se ela é consistente com os produtos existentes
  if (store.nextSkuSequence && store.nextSkuSequence >= SKU_BASE_NUMBER) {
    // Se a sequência persistida for muito distante sem produtos reais correspondentes (resquício legado de timestamp > 200000),
    // ancoramos na maior sequência real existente dos produtos
    if (store.nextSkuSequence > 200000 && maxExistingNumber < 200000) {
      candidate = maxExistingNumber >= SKU_BASE_NUMBER ? maxExistingNumber + 1 : SKU_BASE_NUMBER;
      store.nextSkuSequence = candidate;
    } else {
      candidate = Math.max(candidate, store.nextSkuSequence);
    }
  }

  if (maxExistingNumber >= SKU_BASE_NUMBER) {
    candidate = Math.max(candidate, maxExistingNumber + 1);
  }

  // Prevenção de colisões com qualquer produto existente desta empresa
  while (store.products.some((p) => p.sku && p.sku.trim().toUpperCase() === `PRD-${candidate}`)) {
    candidate++;
  }

  return candidate;
}

const tenantStores = new Map<string, InMemoryStore>();

const DATA_DIR = path.join(process.cwd(), '.data', 'catalog');

function getStoreFilePath(companyId: string): string {
  return path.join(DATA_DIR, `catalog-${companyId}.json`);
}

function saveStoreToDisk(companyId: string, store: InMemoryStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(getStoreFilePath(companyId), JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[Catalog] Failed to persist catalog to disk for company ${companyId}:`, err);
  }
}

function loadStoreFromDisk(companyId: string): InMemoryStore | null {
  try {
    const filePath = getStoreFilePath(companyId);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as InMemoryStore;
    }
  } catch (err) {
    console.warn(`[Catalog] Failed to load catalog from disk for company ${companyId}:`, err);
  }
  return null;
}

function buildDefaultTenantStore(companyId: string): InMemoryStore {
  // Seed initial standard catalog data for the tenant
  const defaultUnits: Unit[] = [
    { id: 'u-un', companyId, name: 'Unidade', shortName: 'Un', allowDecimal: false, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'u-pcs', companyId, name: 'Peça', shortName: 'Pcs', allowDecimal: false, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'u-cx', companyId, name: 'Caixa', shortName: 'CX', allowDecimal: false, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'u-m', companyId, name: 'Metro', shortName: 'M', allowDecimal: true, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'u-kg', companyId, name: 'Quilograma', shortName: 'KG', allowDecimal: true, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const brandNames = [
    { id: 'b-samsung', name: 'Samsung' },
    { id: 'b-apple', name: 'Apple' },
    { id: 'b-motorola', name: 'Motorola' },
    { id: 'b-xiaomi', name: 'Xiaomi' },
    { id: 'b-hmaston', name: 'Hmaston' },
    { id: 'b-inova', name: 'Inova' },
    { id: 'b-lg', name: 'LG' },
    { id: 'b-lenovo', name: 'Lenovo' },
    { id: 'b-positivo', name: 'Positivo' },
    { id: 'b-realme', name: 'Realme' },
    { id: 'b-sony', name: 'Sony' },
    { id: 'b-outras', name: 'Outras' },
  ];
  const defaultBrands: Brand[] = brandNames.map((b) => ({
    id: b.id,
    companyId,
    name: b.name,
    description: `Marca ${b.name}`,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // MANDATORY GLOBAL CATEGORIES (12 standard categories)
  const categoryData = [
    { id: 'cat-tela-display', name: 'Tela / Display', code: 'CAT-DISP', desc: 'Telas, displays LCD, AMOLED e touchscreens' },
    { id: 'cat-carregador', name: 'Carregador', code: 'CAT-CARG', desc: 'Carregadores de parede, veiculares e por indução' },
    { id: 'cat-cabo', name: 'Cabo', code: 'CAT-CABO', desc: 'Cabos USB-C, Lightning, Micro-USB e adaptadores' },
    { id: 'cat-bateria', name: 'Bateria', code: 'CAT-BAT', desc: 'Baterias internas e externas' },
    { id: 'cat-conector', name: 'Conector', code: 'CAT-CON', desc: 'Conectores de carga, FPC e flex de carga' },
    { id: 'cat-pelicula', name: 'Película', code: 'CAT-PEL', desc: 'Películas de vidro, 3D, cerâmica e hidrogel' },
    { id: 'cat-capa', name: 'Capa', code: 'CAT-CAP', desc: 'Capas de proteção, anti-impacto e cases' },
    { id: 'cat-acessorios', name: 'Acessórios', code: 'CAT-ACESS', desc: 'Acessórios diversos para smartphones e tablets' },
    { id: 'cat-pecas', name: 'Peças', code: 'CAT-PECAS', desc: 'Componentes internos, câmeras, autofalantes e sensores' },
    { id: 'cat-ferramentas', name: 'Ferramentas', code: 'CAT-FERR', desc: 'Ferramentas de bancada e equipamentos de manutenção' },
    { id: 'cat-insumos', name: 'Insumos', code: 'CAT-INSUM', desc: 'Colas, soldas, fitas e álcool isopropílico' },
    { id: 'cat-outros', name: 'Outros', code: 'CAT-OUTR', desc: 'Outros produtos e itens gerais do catálogo' },
  ];
  const defaultCategories: Category[] = categoryData.map((c) => ({
    id: c.id,
    companyId,
    name: c.name,
    code: c.code,
    description: c.desc,
    parentId: null,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Reusable Catalog Models (linked to Brands)
  const defaultCatalogModels: CatalogModel[] = [
    { id: 'm-j5prime', companyId, brandId: 'b-samsung', brandName: 'Samsung', name: 'Galaxy J5 Prime', technicalCode: 'SM-G570M', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm-epta800', companyId, brandId: 'b-samsung', brandName: 'Samsung', name: 'EP-TA800', technicalCode: 'EP-TA800XBEGBR', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm-a10', companyId, brandId: 'b-samsung', brandName: 'Samsung', name: 'Galaxy A10', technicalCode: 'SM-A105M', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm-s21', companyId, brandId: 'b-samsung', brandName: 'Samsung', name: 'Galaxy S21', technicalCode: 'SM-G991B', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm-iph11', companyId, brandId: 'b-apple', brandName: 'Apple', name: 'iPhone 11', technicalCode: 'A2111', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm-iph13', companyId, brandId: 'b-apple', brandName: 'Apple', name: 'iPhone 13', technicalCode: 'A2482', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm-app20w', companyId, brandId: 'b-apple', brandName: 'Apple', name: '20W USB-C Power Adapter', technicalCode: 'MHJE3AM/A', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm-g30', companyId, brandId: 'b-motorola', brandName: 'Motorola', name: 'Moto G30', technicalCode: 'XT2129-1', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'm-g7pow', companyId, brandId: 'b-motorola', brandName: 'Motorola', name: 'Moto G7 Power', technicalCode: 'XT1955-1', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  // Reusable Catalog Colors
  const defaultCatalogColors: CatalogColor[] = [
    { id: 'col-preto', companyId, name: 'Preto', hex: '#111827', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-branco', companyId, name: 'Branco', hex: '#FFFFFF', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-azul', companyId, name: 'Azul', hex: '#1E40AF', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-dourado', companyId, name: 'Dourado', hex: '#D97706', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-prata', companyId, name: 'Prata', hex: '#94A3B8', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-vermelho', companyId, name: 'Vermelho', hex: '#DC2626', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-grafite', companyId, name: 'Grafite', hex: '#4B5563', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'col-transparente', companyId, name: 'Transparente', hex: '#F3F4F6', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  // Reusable Catalog Sizes
  const defaultCatalogSizes: CatalogSize[] = [
    { id: 'sz-unico', companyId, name: 'Único', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-50', companyId, name: '5.0"', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-55', companyId, name: '5.5"', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-61', companyId, name: '6.1"', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-65', companyId, name: '6.5"', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-67', companyId, name: '6.7"', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-1m', companyId, name: '1.0m', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-2m', companyId, name: '2.0m', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-p', companyId, name: 'P', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-m', companyId, name: 'M', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'sz-g', companyId, name: 'G', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const defaultDeviceBrands: DeviceBrand[] = [
    { id: 'db-samsung', companyId, name: 'Samsung', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'db-motorola', companyId, name: 'Motorola', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'db-apple', companyId, name: 'Apple', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'db-xiaomi', companyId, name: 'Xiaomi', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const defaultDeviceModels: DeviceModel[] = [
    { id: 'dm-1', companyId, deviceBrandId: 'db-samsung', deviceBrandName: 'Samsung', name: 'Galaxy J5 Prime', technicalCode: 'SM-G570M', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'dm-2', companyId, deviceBrandId: 'db-samsung', deviceBrandName: 'Samsung', name: 'Galaxy A10', technicalCode: 'SM-A105M', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'dm-3', companyId, deviceBrandId: 'db-motorola', deviceBrandName: 'Motorola', name: 'Moto G30', technicalCode: 'XT2129-1', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'dm-4', companyId, deviceBrandId: 'db-motorola', deviceBrandName: 'Motorola', name: 'Moto G7 Power', technicalCode: 'XT1955-1', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'dm-5', companyId, deviceBrandId: 'db-apple', deviceBrandName: 'Apple', name: 'iPhone 11', technicalCode: 'A2111', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'dm-6', companyId, deviceBrandId: 'db-apple', deviceBrandName: 'Apple', name: 'iPhone 13', technicalCode: 'A2482', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  // Seed standard products with MANDATORY TEST PRODUCTS
  // PRODUTO 01: Tela LCD Samsung Galaxy J5 Prime
  // PRODUTO 02: Carregador Samsung USB-C 25W (obrigatoriamente testado)
  const seedProducts: Product[] = [
    {
      id: 'prod-001',
      companyId,
      name: 'Tela LCD Samsung Galaxy J5 Prime',
      sku: 'DISP-J5PRIME-001',
      barcodeType: 'C128',
      barcode: '7899876543210',
      productType: 'single',
      unitId: 'u-pcs',
      unitName: 'Peça',
      unitShortName: 'Pcs',
      brandId: 'b-samsung',
      brandName: 'Samsung',
      modelId: 'm-j5prime',
      modelName: 'Galaxy J5 Prime',
      categoryId: 'cat-tela-display',
      categoryName: 'Tela / Display',
      categoryCode: 'CAT-DISP',
      colorId: 'col-preto',
      colorName: 'Preto',
      sizeId: 'sz-50',
      sizeName: '5.0"',
      weight: 180,
      description: 'Tela frontal LCD original com aro compatível com Samsung Galaxy J5 Prime.',
      operationalNotes: 'Testar touch antes de colar. Não remover o lacre de garantia.',
      imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=60',
      brochureUrl: null,
      brochureName: null,
      preparationTime: 20,
      manageStock: true,
      alertQuantity: 5,
      enableImeiSerial: false,
      notForSale: false,
      applicableTax: null,
      salePriceTaxType: 'exclusive',
      defaultPurchasePrice: 45.0,
      marginPercent: 166.67,
      defaultSalePrice: 120.0,
      warrantyDuration: 90,
      warrantyUnit: 'days',
      active: true,
      currentStock: 15,
      deviceModelIds: ['dm-1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-002',
      companyId,
      name: 'Carregador Samsung USB-C 25W',
      sku: 'CARG-SAMS-25W',
      barcodeType: 'EAN13',
      barcode: '8806090973345',
      productType: 'single',
      unitId: 'u-un',
      unitName: 'Unidade',
      unitShortName: 'Un',
      brandId: 'b-samsung',
      brandName: 'Samsung',
      modelId: 'm-epta800',
      modelName: 'EP-TA800',
      categoryId: 'cat-carregador',
      categoryName: 'Carregador',
      categoryCode: 'CAT-CARG',
      colorId: 'col-preto',
      colorName: 'Preto',
      sizeId: 'sz-unico',
      sizeName: 'Único',
      weight: 52,
      description: 'Carregador de parede ultra rápido original Samsung Super Fast Charging 25W modelo EP-TA800.',
      operationalNotes: 'Compatível com linha Galaxy S, A, Note e Z Fold/Flip.',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60',
      brochureUrl: null,
      brochureName: null,
      preparationTime: null,
      manageStock: true,
      alertQuantity: 5,
      enableImeiSerial: false,
      notForSale: false,
      applicableTax: null,
      salePriceTaxType: 'exclusive',
      defaultPurchasePrice: 35.0,
      marginPercent: 100.0,
      defaultSalePrice: 70.0,
      warrantyDuration: 6,
      warrantyUnit: 'months',
      active: true,
      currentStock: 30,
      deviceModelIds: ['dm-1', 'dm-2'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-003',
      companyId,
      name: 'Cabo Tipo-C 1M Turbo Rápido',
      sku: 'CAB-TPC-001',
      barcodeType: 'C128',
      barcode: '7891234567890',
      productType: 'single',
      unitId: 'u-un',
      unitName: 'Unidade',
      unitShortName: 'Un',
      brandId: 'b-hmaston',
      brandName: 'Hmaston',
      categoryId: 'cat-cabo',
      categoryName: 'Cabo',
      categoryCode: 'CAT-CABO',
      colorId: 'col-branco',
      colorName: 'Branco',
      sizeId: 'sz-1m',
      sizeName: '1.0m',
      weight: 50,
      description: 'Cabo USB para Tipo-C reforçado com nylon trançado 1 metro.',
      operationalNotes: 'Compatível com carregamento rápido e transferência de dados.',
      imageUrl: null,
      brochureUrl: null,
      brochureName: null,
      preparationTime: null,
      manageStock: true,
      alertQuantity: 10,
      enableImeiSerial: false,
      notForSale: false,
      applicableTax: null,
      salePriceTaxType: 'exclusive',
      defaultPurchasePrice: 8.5,
      marginPercent: 135.29,
      defaultSalePrice: 20.0,
      warrantyDuration: 90,
      warrantyUnit: 'days',
      active: true,
      currentStock: 45,
      deviceModelIds: ['dm-1', 'dm-2', 'dm-3'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const seedVariations: ProductVariation[] = [
    {
      id: 'var-001',
      companyId,
      productId: 'prod-001',
      name: 'Padrão',
      sku: 'DISP-J5PRIME-001',
      barcode: '7899876543210',
      purchasePrice: 45.0,
      marginPercent: 166.67,
      salePrice: 120.0,
      attributes: { Cor: 'Preto', Tamanho: '5.0"' },
      isDefault: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'var-002',
      companyId,
      productId: 'prod-002',
      name: 'Padrão',
      sku: 'CARG-SAMS-25W',
      barcode: '8806090973345',
      purchasePrice: 35.0,
      marginPercent: 100.0,
      salePrice: 70.0,
      attributes: { Cor: 'Preto', Tamanho: 'Único' },
      isDefault: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'var-003',
      companyId,
      productId: 'prod-003',
      name: 'Padrão',
      sku: 'CAB-TPC-001',
      barcode: '7891234567890',
      purchasePrice: 8.5,
      marginPercent: 135.29,
      salePrice: 20.0,
      attributes: { Cor: 'Branco', Tamanho: '1.0m' },
      isDefault: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const seedLocations: ProductLocation[] = [
    {
      id: 'ploc-1',
      companyId,
      productId: 'prod-001',
      variationId: 'var-001',
      locationId: 'loc-main',
      locationName: 'Matriz Principal',
      rackLocation: 'Gaveta T-01',
      manageStock: true,
      initialStock: 15,
      currentStock: 15,
      minStock: 2,
      maxStock: 50,
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ploc-2',
      companyId,
      productId: 'prod-002',
      variationId: 'var-002',
      locationId: 'loc-main',
      locationName: 'Matriz Principal',
      rackLocation: 'Prateleira C-02',
      manageStock: true,
      initialStock: 30,
      currentStock: 30,
      minStock: 5,
      maxStock: 100,
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ploc-3',
      companyId,
      productId: 'prod-003',
      variationId: 'var-003',
      locationId: 'loc-main',
      locationName: 'Matriz Principal',
      rackLocation: 'Prateleira A-02',
      manageStock: true,
      initialStock: 45,
      currentStock: 45,
      minStock: 10,
      maxStock: 200,
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialStore: InMemoryStore = {
    categories: defaultCategories,
    brands: defaultBrands,
    models: defaultCatalogModels,
    colors: defaultCatalogColors,
    sizes: defaultCatalogSizes,
    units: defaultUnits,
    deviceBrands: defaultDeviceBrands,
    deviceModels: defaultDeviceModels,
    products: seedProducts,
    variations: seedVariations,
    variationTemplates: [],
    warranties: [],
    locations: seedLocations,
    combos: [],
  };

  return initialStore;
}

function getTenantStore(companyId: string): InMemoryStore {
  if (tenantStores.has(companyId)) {
    return tenantStores.get(companyId)!;
  }

  const defaults = buildDefaultTenantStore(companyId);

  // Try loading from disk first
  const diskStore = loadStoreFromDisk(companyId);
  if (diskStore) {
    diskStore.categories = diskStore.categories || [];
    diskStore.brands = diskStore.brands || [];
    diskStore.units = diskStore.units || [];
    diskStore.models = diskStore.models || [];
    diskStore.colors = diskStore.colors || [];
    diskStore.sizes = diskStore.sizes || [];
    diskStore.deviceBrands = diskStore.deviceBrands || [];
    diskStore.deviceModels = diskStore.deviceModels || [];
    diskStore.products = diskStore.products || [];
    diskStore.variations = diskStore.variations || [];
    diskStore.variationTemplates = diskStore.variationTemplates || [];
    diskStore.warranties = diskStore.warranties || [];
    diskStore.locations = diskStore.locations || [];
    diskStore.combos = diskStore.combos || [];

    let modified = false;

    // Merge missing mandatory categories (case-insensitive)
    for (const defCat of defaults.categories) {
      if (!diskStore.categories.some((c) => c.name.toLowerCase() === defCat.name.toLowerCase())) {
        diskStore.categories.push(defCat);
        modified = true;
      }
    }

    // Merge missing brands
    for (const defBrand of defaults.brands) {
      if (!diskStore.brands.some((b) => b.name.toLowerCase() === defBrand.name.toLowerCase())) {
        diskStore.brands.push(defBrand);
        modified = true;
      }
    }

    // Merge missing units
    for (const defUnit of defaults.units) {
      if (!diskStore.units.some((u) => u.name.toLowerCase() === defUnit.name.toLowerCase())) {
        diskStore.units.push(defUnit);
        modified = true;
      }
    }

    // Merge missing models
    for (const defModel of defaults.models) {
      if (!diskStore.models.some((m) => m.name.toLowerCase() === defModel.name.toLowerCase())) {
        diskStore.models.push(defModel);
        modified = true;
      }
    }

    // Merge missing colors
    for (const defColor of defaults.colors) {
      if (!diskStore.colors.some((c) => c.name.toLowerCase() === defColor.name.toLowerCase())) {
        diskStore.colors.push(defColor);
        modified = true;
      }
    }

    // Merge missing sizes
    for (const defSize of defaults.sizes) {
      if (!diskStore.sizes.some((s) => s.name.toLowerCase() === defSize.name.toLowerCase())) {
        diskStore.sizes.push(defSize);
        modified = true;
      }
    }

    // Merge mandatory test products if missing
    for (const defProd of defaults.products) {
      if (!diskStore.products.some((p) => p.name.toLowerCase() === defProd.name.toLowerCase())) {
        diskStore.products.push(defProd);
        modified = true;
      }
    }

    // Merge variations for test products if missing
    for (const defVar of defaults.variations) {
      if (!diskStore.variations.some((v) => v.sku === defVar.sku)) {
        diskStore.variations.push(defVar);
        modified = true;
      }
    }

    if (modified) {
      saveStoreToDisk(companyId, diskStore);
    }

    tenantStores.set(companyId, diskStore);
    return diskStore;
  }

  tenantStores.set(companyId, defaults);
  saveStoreToDisk(companyId, defaults);
  return defaults;
}

export class ProductService {
  /**
   * List products with pagination, search, category, brand, and type filters
   */
  static async listProducts(
    companyId: UUID,
    params: ProductQueryParams
  ): Promise<PaginatedResult<Product>> {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(params.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    if (isSupabaseAdminConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        let query = supabase
          .from('products')
          .select('*, units(name, short_name), brands(name), categories(name, code)', { count: 'exact' })
          .eq('company_id', companyId);

        if (params.search && params.search.trim()) {
          const term = `%${params.search.trim()}%`;
          query = query.or(`name.ilike.${term},sku.ilike.${term},barcode.ilike.${term}`);
        }

        if (params.categoryId) {
          query = query.eq('category_id', params.categoryId);
        }

        if (params.brandId) {
          query = query.eq('brand_id', params.brandId);
        }

        if (params.unitId) {
          query = query.eq('unit_id', params.unitId);
        }

        if (params.productType) {
          query = query.eq('product_type', params.productType);
        }

        if (params.active !== undefined && params.active !== '') {
          const isActive = params.active === 'true' || params.active === true;
          query = query.eq('active', isActive);
        }

        query = query.order('name', { ascending: true }).range(offset, offset + pageSize - 1);

        const { data, count, error } = await query;
        if (!error && data) {
          const totalItems = count || 0;
          const totalPages = Math.ceil(totalItems / pageSize);

          // Map database rows
          const products: Product[] = data.map((row: any) => ({
            id: row.id,
            companyId: row.company_id,
            name: row.name,
            sku: row.sku,
            barcodeType: row.barcode_type,
            barcode: row.barcode,
            productType: row.product_type,
            unitId: row.unit_id,
            unitName: row.units?.name || null,
            unitShortName: row.units?.short_name || null,
            brandId: row.brand_id,
            brandName: row.brands?.name || null,
            categoryId: row.category_id,
            categoryName: row.categories?.name || null,
            categoryCode: row.categories?.code || null,
            description: row.description,
            operationalNotes: row.operational_notes,
            imageUrl: row.image_url,
            brochureUrl: row.brochure_url,
            brochureName: row.brochure_name,
            weight: row.weight ? Number(row.weight) : null,
            preparationTime: row.preparation_time,
            manageStock: row.manage_stock,
            alertQuantity: Number(row.alert_quantity) || 5,
            enableImeiSerial: row.enable_imei_serial,
            notForSale: row.not_for_sale,
            applicableTax: row.applicable_tax,
            salePriceTaxType: row.sale_price_tax_type,
            defaultPurchasePrice: Number(row.default_purchase_price) || 0,
            marginPercent: Number(row.margin_percent) || 0,
            defaultSalePrice: Number(row.default_sale_price) || 0,
            warrantyDuration: row.warranty_duration,
            warrantyUnit: row.warranty_unit || 'days',
            active: row.active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            currentStock: 0,
          }));

          return {
            data: products,
            meta: {
              page,
              pageSize,
              totalItems,
              totalPages,
              hasNextPage: page < totalPages,
              hasPreviousPage: page > 1,
            },
          };
        }
      } catch (err) {
        console.warn('Supabase product query error, using in-memory store:', err);
      }
    }

    // In-memory fallback
    const store = getTenantStore(companyId);
    let filtered = [...store.products];

    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          (p.barcode && p.barcode.toLowerCase().includes(term))
      );
    }

    if (params.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === params.categoryId);
    }

    if (params.brandId) {
      filtered = filtered.filter((p) => p.brandId === params.brandId);
    }

    if (params.unitId) {
      filtered = filtered.filter((p) => p.unitId === params.unitId);
    }

    if (params.productType) {
      filtered = filtered.filter((p) => p.productType === params.productType);
    }

    if (params.active !== undefined && params.active !== '') {
      const isActive = params.active === 'true' || params.active === true;
      filtered = filtered.filter((p) => p.active === isActive);
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginated = filtered.slice(offset, offset + pageSize);

    return {
      data: paginated,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get single product with full relational details
   */
  static async getProductById(companyId: UUID, productId: UUID): Promise<Product | null> {
    const store = getTenantStore(companyId);
    const product = store.products.find((p) => p.id === productId);
    if (!product) return null;

    const variations = store.variations.filter((v) => v.productId === productId);
    const locations = store.locations.filter((l) => l.productId === productId);
    const combos = store.combos.filter((c) => c.comboProductId === productId);
    const deviceModels = store.deviceModels.filter((dm) => product.deviceModelIds?.includes(dm.id));

    return {
      ...product,
      variations,
      locations,
      combos,
      deviceModels,
    };
  }

  /**
   * Consulta o próximo SKU sequencial da empresa (sem avançar ou consumir a sequência)
   */
  static async getNextSku(companyId: UUID): Promise<string> {
    return withCompanySkuLock(companyId, async () => {
      const store = getTenantStore(companyId);
      const nextNum = calculateNextSkuNumber(companyId, store);
      return `PRD-${nextNum}`;
    });
  }

  /**
   * Aloca e confirma o próximo SKU da empresa de forma sequencial atômica
   * O SKU definitivo é gerado rigorosamente no backend para cada company_id, iniciando em PRD-100000.
   */
  static async allocateSku(companyId: UUID, preferredSku?: string | null): Promise<string> {
    const store = getTenantStore(companyId);
    const trimmed = preferredSku?.trim();

    // Se o usuário digitou um SKU manual personalizado que NÃO corresponde ao padrão sequencial automático (PRD-...),
    // nós o respeitamos desde que não colida com outro produto desta empresa.
    if (trimmed && !trimmed.match(/^PRD-\d+$/i)) {
      if (store.products.some((p) => p.sku.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error(`O SKU "${trimmed}" já está em uso nesta empresa.`);
      }
      return trimmed;
    }

    // Caso contrário (vazio, nulo, ou prévia automática PRD-...), o backend SEMPRE aloca a sequência oficial.
    const nextNum = calculateNextSkuNumber(companyId, store);
    const generatedSku = `PRD-${nextNum}`;
    store.nextSkuSequence = nextNum + 1;
    saveStoreToDisk(companyId, store);
    return generatedSku;
  }

  /**
   * Create product with automatic variation & location assignment
   */
  static async createProduct(companyId: UUID, payload: CreateProductPayload): Promise<Product> {
    return withCompanySkuLock(companyId, async () => {
      const store = getTenantStore(companyId);

      // Alocação sequencial isolada por empresa (iniciando rigorosamente em PRD-100000)
      const sku = await ProductService.allocateSku(companyId, payload.sku);

      // Validate SKU uniqueness within company
      const skuExists = store.products.some((p) => p.sku.toLowerCase() === sku.toLowerCase());
      if (skuExists) {
        throw new Error(`O SKU "${sku}" já está em uso nesta empresa.`);
      }

    // Validate Barcode uniqueness if provided
    if (payload.barcode?.trim()) {
      const barcodeExists = store.products.some(
        (p) => p.barcode && p.barcode.trim() === payload.barcode!.trim()
      );
      if (barcodeExists) {
        throw new Error(`O código de barras "${payload.barcode}" já está cadastrado nesta empresa.`);
      }
    }

    const unit = store.units.find((u) => u.id === payload.unitId);
    const brand = store.brands.find((b) => b.id === payload.brandId);
    const category = store.categories.find((c) => c.id === payload.categoryId);
    const model = payload.modelId ? store.models?.find((m) => m.id === payload.modelId) : undefined;
    const color = payload.colorId ? store.colors?.find((c) => c.id === payload.colorId) : undefined;
    const size = payload.sizeId ? store.sizes?.find((s) => s.id === payload.sizeId) : undefined;

    const newProductId = `prod-${Date.now()}`;
    const productType = payload.productType || 'single';

    // Calculate initial stock across locations
    let totalInitialStock = 0;
    if (payload.locationInputs && Array.isArray(payload.locationInputs)) {
      totalInitialStock = payload.locationInputs.reduce((sum, l) => sum + (Number(l.initialStock) || 0), 0);
    }

    const newProduct: Product = {
      id: newProductId,
      companyId,
      name: payload.name.trim(),
      sku,
      barcodeType: payload.barcodeType || 'C128',
      barcode: payload.barcode?.trim() || null,
      productType,
      unitId: payload.unitId,
      unitName: unit?.name || 'Unidade',
      unitShortName: unit?.shortName || 'Un',
      brandId: payload.brandId || null,
      brandName: brand?.name || payload.brandName || null,
      modelId: payload.modelId || null,
      modelName: model?.name || payload.modelName || null,
      categoryId: payload.categoryId || null,
      categoryName: category?.name || payload.categoryName || null,
      categoryCode: category?.code || null,
      colorId: payload.colorId || null,
      colorName: color?.name || payload.colorName || null,
      sizeId: payload.sizeId || null,
      sizeName: size?.name || payload.sizeName || null,
      description: payload.description || null,
      operationalNotes: payload.operationalNotes || null,
      imageUrl: payload.imageUrl || null,
      brochureUrl: payload.brochureUrl || null,
      brochureName: payload.brochureName || null,
      weight: payload.weight ? Number(payload.weight) : null,
      preparationTime: payload.preparationTime ? Number(payload.preparationTime) : null,
      manageStock: payload.manageStock !== undefined ? payload.manageStock : true,
      alertQuantity: payload.alertQuantity !== undefined ? Number(payload.alertQuantity) : 5,
      enableImeiSerial: !!payload.enableImeiSerial,
      notForSale: !!payload.notForSale,
      applicableTax: payload.applicableTax || null,
      salePriceTaxType: payload.salePriceTaxType || 'exclusive',
      defaultPurchasePrice: Number(payload.defaultPurchasePrice) || 0,
      marginPercent: Number(payload.marginPercent) || 0,
      defaultSalePrice: Number(payload.defaultSalePrice) || 0,
      warrantyDuration: payload.warrantyDuration ? Number(payload.warrantyDuration) : null,
      warrantyUnit: payload.warrantyUnit || 'days',
      active: payload.active !== undefined ? payload.active : true,
      currentStock: totalInitialStock,
      deviceModelIds: payload.deviceModelIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.products.unshift(newProduct);

    // 1. Create Default Variation for 'single' or user variations for 'variable'
    if (productType === 'single') {
      const singleVariation: ProductVariation = {
        id: `var-${Date.now()}`,
        companyId,
        productId: newProductId,
        name: 'Padrão',
        sku,
        barcode: newProduct.barcode,
        purchasePrice: newProduct.defaultPurchasePrice,
        marginPercent: newProduct.marginPercent,
        salePrice: newProduct.defaultSalePrice,
        attributes: {
          ...(newProduct.colorName ? { Cor: newProduct.colorName } : {}),
          ...(newProduct.sizeName ? { Tamanho: newProduct.sizeName } : {}),
        },
        isDefault: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.variations.push(singleVariation);

      // Create Product Locations
      if (payload.locationInputs && payload.locationInputs.length > 0) {
        for (const locInput of payload.locationInputs) {
          store.locations.push({
            id: `ploc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            companyId,
            productId: newProductId,
            variationId: singleVariation.id,
            locationId: locInput.locationId,
            locationName: 'Local',
            rackLocation: locInput.rackLocation || null,
            manageStock: locInput.manageStock !== undefined ? locInput.manageStock : true,
            initialStock: Number(locInput.initialStock) || 0,
            currentStock: Number(locInput.initialStock) || 0,
            minStock: locInput.minStock ? Number(locInput.minStock) : null,
            maxStock: locInput.maxStock ? Number(locInput.maxStock) : null,
            isAvailable: locInput.isAvailable !== undefined ? locInput.isAvailable : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } else if (productType === 'variable' && payload.variations && payload.variations.length > 0) {
      for (let i = 0; i < payload.variations.length; i++) {
        const v = payload.variations[i];
        const vSku = v.sku?.trim() || `${sku}-${i + 1}`;
        const variationItem: ProductVariation = {
          id: `var-${Date.now()}-${i}`,
          companyId,
          productId: newProductId,
          name: v.name.trim(),
          sku: vSku,
          barcode: v.barcode?.trim() || null,
          purchasePrice: Number(v.purchasePrice) || newProduct.defaultPurchasePrice,
          marginPercent: Number(v.marginPercent) || newProduct.marginPercent,
          salePrice: Number(v.salePrice) || newProduct.defaultSalePrice,
          attributes: v.attributes || {},
          isDefault: i === 0,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.variations.push(variationItem);

        // Assign locations for this variation
        if (payload.locationInputs && payload.locationInputs.length > 0) {
          for (const locInput of payload.locationInputs) {
            store.locations.push({
              id: `ploc-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
              companyId,
              productId: newProductId,
              variationId: variationItem.id,
              locationId: locInput.locationId,
              rackLocation: locInput.rackLocation || null,
              manageStock: locInput.manageStock !== undefined ? locInput.manageStock : true,
              initialStock: Number(locInput.initialStock) || 0,
              currentStock: Number(locInput.initialStock) || 0,
              minStock: locInput.minStock ? Number(locInput.minStock) : null,
              maxStock: locInput.maxStock ? Number(locInput.maxStock) : null,
              isAvailable: locInput.isAvailable !== undefined ? locInput.isAvailable : true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    } else if (productType === 'combo' && payload.combos) {
      for (const c of payload.combos) {
        store.combos.push({
          id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          companyId,
          comboProductId: newProductId,
          componentVariationId: c.componentVariationId,
          quantity: Number(c.quantity) || 1,
          unitPrice: c.unitPrice ? Number(c.unitPrice) : null,
          createdAt: new Date().toISOString(),
        });
      }
    }

    saveStoreToDisk(companyId, store);
    return newProduct;
    });
  }

  /**
   * Update existing product
   */
  static async updateProduct(
    companyId: UUID,
    productId: UUID,
    payload: UpdateProductPayload
  ): Promise<Product> {
    const store = getTenantStore(companyId);
    const index = store.products.findIndex((p) => p.id === productId);
    if (index === -1) {
      throw new Error('Produto não encontrado.');
    }

    const current = store.products[index];

    // Check SKU conflict
    if (payload.sku && payload.sku.trim().toLowerCase() !== current.sku.toLowerCase()) {
      const skuConflict = store.products.some(
        (p) => p.id !== productId && p.sku.toLowerCase() === payload.sku!.trim().toLowerCase()
      );
      if (skuConflict) {
        throw new Error(`O SKU "${payload.sku}" já está em uso por outro produto.`);
      }
    }

    // Check Barcode conflict
    if (payload.barcode && payload.barcode.trim() !== current.barcode) {
      const barcodeConflict = store.products.some(
        (p) => p.id !== productId && p.barcode === payload.barcode!.trim()
      );
      if (barcodeConflict) {
        throw new Error(`O código de barras "${payload.barcode}" já está em uso por outro produto.`);
      }
    }

    const unit = payload.unitId ? store.units.find((u) => u.id === payload.unitId) : undefined;
    const brand = payload.brandId !== undefined ? store.brands.find((b) => b.id === payload.brandId) : undefined;
    const category = payload.categoryId !== undefined ? store.categories.find((c) => c.id === payload.categoryId) : undefined;
    const model = payload.modelId !== undefined ? store.models?.find((m) => m.id === payload.modelId) : undefined;
    const color = payload.colorId !== undefined ? store.colors?.find((c) => c.id === payload.colorId) : undefined;
    const size = payload.sizeId !== undefined ? store.sizes?.find((s) => s.id === payload.sizeId) : undefined;

    const updated: Product = {
      ...current,
      name: payload.name !== undefined ? payload.name.trim() : current.name,
      sku: payload.sku !== undefined ? payload.sku.trim() : current.sku,
      barcodeType: payload.barcodeType || current.barcodeType,
      barcode: payload.barcode !== undefined ? (payload.barcode?.trim() || null) : current.barcode,
      productType: payload.productType || current.productType,
      unitId: payload.unitId || current.unitId,
      unitName: unit ? unit.name : current.unitName,
      unitShortName: unit ? unit.shortName : current.unitShortName,
      brandId: payload.brandId !== undefined ? payload.brandId : current.brandId,
      brandName: brand ? brand.name : (payload.brandId === null ? null : (payload.brandName || current.brandName)),
      modelId: payload.modelId !== undefined ? payload.modelId : current.modelId,
      modelName: model ? model.name : (payload.modelId === null ? null : (payload.modelName || current.modelName)),
      categoryId: payload.categoryId !== undefined ? payload.categoryId : current.categoryId,
      categoryName: category ? category.name : (payload.categoryId === null ? null : (payload.categoryName || current.categoryName)),
      categoryCode: category ? category.code : (payload.categoryId === null ? null : current.categoryCode),
      colorId: payload.colorId !== undefined ? payload.colorId : current.colorId,
      colorName: color ? color.name : (payload.colorId === null ? null : (payload.colorName || current.colorName)),
      sizeId: payload.sizeId !== undefined ? payload.sizeId : current.sizeId,
      sizeName: size ? size.name : (payload.sizeId === null ? null : (payload.sizeName || current.sizeName)),
      description: payload.description !== undefined ? payload.description : current.description,
      operationalNotes: payload.operationalNotes !== undefined ? payload.operationalNotes : current.operationalNotes,
      imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : current.imageUrl,
      brochureUrl: payload.brochureUrl !== undefined ? payload.brochureUrl : current.brochureUrl,
      brochureName: payload.brochureName !== undefined ? payload.brochureName : current.brochureName,
      weight: payload.weight !== undefined ? (payload.weight ? Number(payload.weight) : null) : current.weight,
      preparationTime: payload.preparationTime !== undefined ? (payload.preparationTime ? Number(payload.preparationTime) : null) : current.preparationTime,
      manageStock: payload.manageStock !== undefined ? payload.manageStock : current.manageStock,
      alertQuantity: payload.alertQuantity !== undefined ? Number(payload.alertQuantity) : current.alertQuantity,
      enableImeiSerial: payload.enableImeiSerial !== undefined ? payload.enableImeiSerial : current.enableImeiSerial,
      notForSale: payload.notForSale !== undefined ? payload.notForSale : current.notForSale,
      applicableTax: payload.applicableTax !== undefined ? payload.applicableTax : current.applicableTax,
      salePriceTaxType: payload.salePriceTaxType || current.salePriceTaxType,
      defaultPurchasePrice: payload.defaultPurchasePrice !== undefined ? Number(payload.defaultPurchasePrice) : current.defaultPurchasePrice,
      marginPercent: payload.marginPercent !== undefined ? Number(payload.marginPercent) : current.marginPercent,
      defaultSalePrice: payload.defaultSalePrice !== undefined ? Number(payload.defaultSalePrice) : current.defaultSalePrice,
      warrantyDuration: payload.warrantyDuration !== undefined ? payload.warrantyDuration : current.warrantyDuration,
      warrantyUnit: payload.warrantyUnit || current.warrantyUnit,
      active: payload.active !== undefined ? payload.active : current.active,
      deviceModelIds: payload.deviceModelIds || current.deviceModelIds,
      updatedAt: new Date().toISOString(),
    };

    // Synchronize location stock if provided
    if (payload.locationInputs && Array.isArray(payload.locationInputs) && payload.locationInputs.length > 0) {
      let totalStock = 0;
      for (const locInput of payload.locationInputs) {
        const stockVal = Number(locInput.initialStock) || 0;
        totalStock += stockVal;
        const existingLoc = store.locations.find(
          (l) => l.productId === productId && l.locationId === locInput.locationId
        );
        if (existingLoc) {
          existingLoc.initialStock = stockVal;
          existingLoc.currentStock = stockVal;
          if (locInput.rackLocation !== undefined) existingLoc.rackLocation = locInput.rackLocation;
          if (locInput.minStock !== undefined) existingLoc.minStock = locInput.minStock ? Number(locInput.minStock) : null;
          if (locInput.maxStock !== undefined) existingLoc.maxStock = locInput.maxStock ? Number(locInput.maxStock) : null;
          existingLoc.updatedAt = new Date().toISOString();
        } else {
          store.locations.push({
            id: `ploc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            companyId,
            productId,
            variationId: store.variations.find((v) => v.productId === productId)?.id || `var-${productId}`,
            locationId: locInput.locationId,
            locationName: 'Local',
            rackLocation: locInput.rackLocation || null,
            manageStock: locInput.manageStock !== undefined ? locInput.manageStock : true,
            initialStock: stockVal,
            currentStock: stockVal,
            minStock: locInput.minStock ? Number(locInput.minStock) : null,
            maxStock: locInput.maxStock ? Number(locInput.maxStock) : null,
            isAvailable: locInput.isAvailable !== undefined ? locInput.isAvailable : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      updated.currentStock = totalStock;
    }

    store.products[index] = updated;
    saveStoreToDisk(companyId, store);
    return updated;
  }

  /**
   * Delete product
   */
  static async deleteProduct(companyId: UUID, productId: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    const initialCount = store.products.length;
    store.products = store.products.filter((p) => p.id !== productId);
    store.variations = store.variations.filter((v) => v.productId !== productId);
    store.locations = store.locations.filter((l) => l.productId !== productId);
    store.combos = store.combos.filter((c) => c.comboProductId !== productId);
    saveStoreToDisk(companyId, store);
    return store.products.length < initialCount;
  }

  /**
   * Duplicate product with new SKU
   */
  static async duplicateProduct(companyId: UUID, productId: UUID): Promise<Product> {
    const original = await this.getProductById(companyId, productId);
    if (!original) throw new Error('Produto original não encontrado.');

    // Se o SKU original for sequencial PRD-XXXXXX, gera o próximo da sequência da empresa; caso contrário sufixo limpo
    let newSku: string | undefined = undefined;
    if (!original.sku.match(/^PRD-\d+$/i)) {
      const store = getTenantStore(companyId);
      let suffixIndex = 1;
      let candidate = `${original.sku}-COPIA`;
      while (store.products.some((p) => p.sku.toLowerCase() === candidate.toLowerCase())) {
        suffixIndex++;
        candidate = `${original.sku}-COPIA-${suffixIndex}`;
      }
      newSku = candidate;
    }

    return this.createProduct(companyId, {
      ...original,
      name: `${original.name} (Cópia)`,
      sku: newSku,
      barcode: null, // Clear barcode to avoid conflicts
      locationInputs: original.locations?.map((l) => ({
        locationId: l.locationId,
        rackLocation: l.rackLocation,
        manageStock: l.manageStock,
        initialStock: 0,
        minStock: l.minStock,
        maxStock: l.maxStock,
        isAvailable: l.isAvailable,
      })),
    });
  }

  /**
   * Update stock opening / initial stock
   */
  static async saveStockOpening(
    companyId: UUID,
    productId: UUID,
    payload: ProductStockOpeningPayload
  ): Promise<boolean> {
    const store = getTenantStore(companyId);
    const product = store.products.find((p) => p.id === productId);
    if (!product) throw new Error('Produto não encontrado.');

    let newTotalStock = 0;

    for (const item of payload.items) {
      const loc = store.locations.find(
        (l) => l.productId === productId && l.locationId === item.locationId
      );
      if (loc) {
        loc.initialStock = item.quantity;
        loc.currentStock = item.quantity;
        if (item.rackLocation !== undefined) loc.rackLocation = item.rackLocation;
      } else {
        store.locations.push({
          id: `ploc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          companyId,
          productId,
          variationId: item.variationId || `var-${productId}`,
          locationId: item.locationId,
          rackLocation: item.rackLocation || null,
          manageStock: true,
          initialStock: item.quantity,
          currentStock: item.quantity,
          minStock: null,
          maxStock: null,
          isAvailable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      newTotalStock += item.quantity;
    }

    product.currentStock = newTotalStock;
    product.updatedAt = new Date().toISOString();
    saveStoreToDisk(companyId, store);
    return true;
  }

  /**
   * Batch actions on products (delete, deactivate, activate, add/remove from branch)
   */
  static async batchAction(
    companyId: UUID,
    payload: BatchProductActionPayload
  ): Promise<{ affected: number }> {
    const store = getTenantStore(companyId);
    let affected = 0;

    switch (payload.action) {
      case 'delete':
        store.products = store.products.filter((p) => {
          if (payload.productIds.includes(p.id)) {
            affected++;
            return false;
          }
          return true;
        });
        break;
      case 'deactivate':
        for (const p of store.products) {
          if (payload.productIds.includes(p.id)) {
            p.active = false;
            affected++;
          }
        }
        break;
      case 'activate':
        for (const p of store.products) {
          if (payload.productIds.includes(p.id)) {
            p.active = true;
            affected++;
          }
        }
        break;
      case 'add_to_location':
        if (payload.locationId) {
          for (const pid of payload.productIds) {
            const exists = store.locations.some(
              (l) => l.productId === pid && l.locationId === payload.locationId
            );
            if (!exists) {
              store.locations.push({
                id: `ploc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                companyId,
                productId: pid,
                variationId: `var-${pid}`,
                locationId: payload.locationId,
                rackLocation: null,
                manageStock: true,
                initialStock: 0,
                currentStock: 0,
                minStock: null,
                maxStock: null,
                isAvailable: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              affected++;
            }
          }
        }
        break;
      case 'remove_from_location':
        if (payload.locationId) {
          store.locations = store.locations.filter((l) => {
            if (payload.productIds.includes(l.productId) && l.locationId === payload.locationId) {
              affected++;
              return false;
            }
            return true;
          });
        }
        break;
    }

    saveStoreToDisk(companyId, store);
    return { affected };
  }

  // ==========================================
  // AUXILIARY CATALOG ENTITIES (CATEGORIES, BRANDS, UNITS, MODELS)
  // ==========================================

  static async listCategories(companyId: UUID): Promise<Category[]> {
    const store = getTenantStore(companyId);
    return store.categories;
  }

  static async createCategory(companyId: UUID, payload: CreateCategoryPayload): Promise<Category> {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();

    // Check duplicate by name
    const existing = store.categories.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      companyId,
      name: trimmedName,
      code: payload.code?.trim() || `CAT-${Date.now().toString().slice(-4)}`,
      description: payload.description || null,
      parentId: payload.parentId || null,
      active: payload.active !== undefined ? payload.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.categories.push(newCat);
    saveStoreToDisk(companyId, store);
    return newCat;
  }

  static async updateCategory(
    companyId: UUID,
    categoryId: UUID,
    payload: UpdateCategoryPayload
  ): Promise<Category> {
    const store = getTenantStore(companyId);
    const cat = store.categories.find((c) => c.id === categoryId);
    if (!cat) throw new Error('Categoria não encontrada.');
    if (payload.name) cat.name = payload.name.trim();
    if (payload.code !== undefined) cat.code = payload.code?.trim() || null;
    if (payload.description !== undefined) cat.description = payload.description;
    if (payload.parentId !== undefined) cat.parentId = payload.parentId;
    if (payload.active !== undefined) cat.active = payload.active;
    cat.updatedAt = new Date().toISOString();
    saveStoreToDisk(companyId, store);
    return cat;
  }

  static async deleteCategory(companyId: UUID, categoryId: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    const initial = store.categories.length;
    store.categories = store.categories.filter((c) => c.id !== categoryId);
    saveStoreToDisk(companyId, store);
    return store.categories.length < initial;
  }

  static async listBrands(companyId: UUID): Promise<Brand[]> {
    const store = getTenantStore(companyId);
    return store.brands;
  }

  static async createBrand(companyId: UUID, payload: CreateBrandPayload): Promise<Brand> {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();

    // Reutilizar se já existir (Anti-duplicação)
    const existing = store.brands.find(
      (b) => b.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newBrand: Brand = {
      id: `b-${Date.now()}`,
      companyId,
      name: trimmedName,
      description: payload.description || null,
      active: payload.active !== undefined ? payload.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.brands.push(newBrand);
    saveStoreToDisk(companyId, store);
    return newBrand;
  }

  static async updateBrand(
    companyId: UUID,
    brandId: UUID,
    payload: UpdateBrandPayload
  ): Promise<Brand> {
    const store = getTenantStore(companyId);
    const brand = store.brands.find((b) => b.id === brandId);
    if (!brand) throw new Error('Marca não encontrada.');
    if (payload.name) brand.name = payload.name.trim();
    if (payload.description !== undefined) brand.description = payload.description;
    if (payload.active !== undefined) brand.active = payload.active;
    brand.updatedAt = new Date().toISOString();
    saveStoreToDisk(companyId, store);
    return brand;
  }

  static async deleteBrand(companyId: UUID, brandId: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    const initial = store.brands.length;
    store.brands = store.brands.filter((b) => b.id !== brandId);
    saveStoreToDisk(companyId, store);
    return store.brands.length < initial;
  }

  // ==========================================
  // MODELOS DE CATÁLOGO (REUTILIZÁVEIS)
  // ==========================================

  static async listModels(companyId: UUID, brandId?: UUID): Promise<CatalogModel[]> {
    const store = getTenantStore(companyId);
    if (brandId) {
      return store.models.filter((m) => m.brandId === brandId);
    }
    return store.models;
  }

  static async createModel(companyId: UUID, payload: CreateCatalogModelPayload): Promise<CatalogModel> {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();

    // Anti-duplicação: por marca e nome
    const existing = store.models.find(
      (m) =>
        m.name.toLowerCase() === trimmedName.toLowerCase() &&
        (payload.brandId ? m.brandId === payload.brandId : true)
    );
    if (existing) {
      return existing;
    }

    const brand = payload.brandId ? store.brands.find((b) => b.id === payload.brandId) : undefined;
    const newModel: CatalogModel = {
      id: `m-${Date.now()}`,
      companyId,
      brandId: payload.brandId || null,
      brandName: brand?.name || null,
      name: trimmedName,
      technicalCode: payload.technicalCode?.trim() || null,
      active: payload.active !== undefined ? payload.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.models.push(newModel);
    saveStoreToDisk(companyId, store);
    return newModel;
  }

  static async updateModel(
    companyId: UUID,
    modelId: UUID,
    payload: Partial<CreateCatalogModelPayload>
  ): Promise<CatalogModel> {
    const store = getTenantStore(companyId);
    const model = store.models.find((m) => m.id === modelId);
    if (!model) throw new Error('Modelo não encontrado.');
    if (payload.name) model.name = payload.name.trim();
    if (payload.brandId !== undefined) {
      model.brandId = payload.brandId;
      const b = store.brands.find((br) => br.id === payload.brandId);
      model.brandName = b ? b.name : null;
    }
    if (payload.technicalCode !== undefined) model.technicalCode = payload.technicalCode?.trim() || null;
    if (payload.active !== undefined) model.active = payload.active;
    model.updatedAt = new Date().toISOString();
    saveStoreToDisk(companyId, store);
    return model;
  }

  static async deleteModel(companyId: UUID, modelId: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    const initial = store.models.length;
    store.models = store.models.filter((m) => m.id !== modelId);
    saveStoreToDisk(companyId, store);
    return store.models.length < initial;
  }

  // ==========================================
  // CORES DE CATÁLOGO (REUTILIZÁVEIS)
  // ==========================================

  static async listColors(companyId: UUID): Promise<CatalogColor[]> {
    const store = getTenantStore(companyId);
    return store.colors;
  }

  static async createColor(companyId: UUID, payload: CreateCatalogColorPayload): Promise<CatalogColor> {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();

    // Anti-duplicação: por nome
    const existing = store.colors.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newColor: CatalogColor = {
      id: `col-${Date.now()}`,
      companyId,
      name: trimmedName,
      hex: payload.hex?.trim() || null,
      active: payload.active !== undefined ? payload.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.colors.push(newColor);
    saveStoreToDisk(companyId, store);
    return newColor;
  }

  static async updateColor(
    companyId: UUID,
    colorId: UUID,
    payload: Partial<CreateCatalogColorPayload>
  ): Promise<CatalogColor> {
    const store = getTenantStore(companyId);
    const color = store.colors.find((c) => c.id === colorId);
    if (!color) throw new Error('Cor não encontrada.');
    if (payload.name) color.name = payload.name.trim();
    if (payload.hex !== undefined) color.hex = payload.hex?.trim() || null;
    if (payload.active !== undefined) color.active = payload.active;
    color.updatedAt = new Date().toISOString();
    saveStoreToDisk(companyId, store);
    return color;
  }

  static async deleteColor(companyId: UUID, colorId: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    const initial = store.colors.length;
    store.colors = store.colors.filter((c) => c.id !== colorId);
    saveStoreToDisk(companyId, store);
    return store.colors.length < initial;
  }

  // ==========================================
  // TAMANHOS DE CATÁLOGO (REUTILIZÁVEIS)
  // ==========================================

  static async listSizes(companyId: UUID): Promise<CatalogSize[]> {
    const store = getTenantStore(companyId);
    return store.sizes;
  }

  static async createSize(companyId: UUID, payload: CreateCatalogSizePayload): Promise<CatalogSize> {
    const store = getTenantStore(companyId);
    if (!payload || !payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
      throw new Error('O nome do tamanho é obrigatório.');
    }
    const trimmedName = payload.name.trim();
    const trimmedCode = payload.code ? payload.code.trim() : null;

    // Anti-duplicação: por nome
    const existing = store.sizes.find(
      (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      if (trimmedCode && !existing.code) {
        existing.code = trimmedCode;
        existing.updatedAt = new Date().toISOString();
        saveStoreToDisk(companyId, store);
      }
      return existing;
    }

    const newSize: CatalogSize = {
      id: `sz-${Date.now()}`,
      companyId,
      name: trimmedName,
      code: trimmedCode,
      active: payload.active !== undefined ? payload.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.sizes.push(newSize);
    saveStoreToDisk(companyId, store);
    return newSize;
  }

  static async updateSize(
    companyId: UUID,
    sizeId: UUID,
    payload: Partial<CreateCatalogSizePayload>
  ): Promise<CatalogSize> {
    const store = getTenantStore(companyId);
    const size = store.sizes.find((s) => s.id === sizeId);
    if (!size) throw new Error('Tamanho não encontrado.');
    if (payload.name) size.name = payload.name.trim();
    if (payload.code !== undefined) size.code = payload.code ? payload.code.trim() : null;
    if (payload.active !== undefined) size.active = payload.active;
    size.updatedAt = new Date().toISOString();
    saveStoreToDisk(companyId, store);
    return size;
  }

  static async deleteSize(companyId: UUID, sizeId: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    const initial = store.sizes.length;
    store.sizes = store.sizes.filter((s) => s.id !== sizeId);
    saveStoreToDisk(companyId, store);
    return store.sizes.length < initial;
  }

  // ==========================================
  // UNIDADES DE MEDIDA (REUTILIZÁVEIS)
  // ==========================================

  static async listUnits(companyId: UUID): Promise<Unit[]> {
    const store = getTenantStore(companyId);
    return store.units;
  }

  static async createUnit(companyId: UUID, payload: CreateUnitPayload): Promise<Unit> {
    const store = getTenantStore(companyId);
    const trimmedName = payload.name.trim();

    const existing = store.units.find(
      (u) => u.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newUnit: Unit = {
      id: `u-${Date.now()}`,
      companyId,
      name: trimmedName,
      shortName: payload.shortName.trim(),
      allowDecimal: !!payload.allowDecimal,
      active: payload.active !== undefined ? payload.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.units.push(newUnit);
    saveStoreToDisk(companyId, store);
    return newUnit;
  }

  static async updateUnit(companyId: UUID, unitId: UUID, payload: UpdateUnitPayload): Promise<Unit> {
    const store = getTenantStore(companyId);
    const unit = store.units.find((u) => u.id === unitId);
    if (!unit) throw new Error('Unidade não encontrada.');
    if (payload.name) unit.name = payload.name.trim();
    if (payload.shortName) unit.shortName = payload.shortName.trim();
    if (payload.allowDecimal !== undefined) unit.allowDecimal = payload.allowDecimal;
    if (payload.active !== undefined) unit.active = payload.active;
    unit.updatedAt = new Date().toISOString();
    saveStoreToDisk(companyId, store);
    return unit;
  }

  static async deleteUnit(companyId: UUID, unitId: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    const initial = store.units.length;
    store.units = store.units.filter((u) => u.id !== unitId);
    saveStoreToDisk(companyId, store);
    return store.units.length < initial;
  }

  static async listDeviceBrands(companyId: UUID): Promise<DeviceBrand[]> {
    const store = getTenantStore(companyId);
    return store.deviceBrands;
  }

  static async listDeviceModels(companyId: UUID, brandId?: UUID): Promise<DeviceModel[]> {
    const store = getTenantStore(companyId);
    if (brandId) {
      return store.deviceModels.filter((dm) => dm.deviceBrandId === brandId);
    }
    return store.deviceModels;
  }

  static async createDeviceModel(
    companyId: UUID,
    payload: CreateDeviceModelPayload
  ): Promise<DeviceModel> {
    const store = getTenantStore(companyId);
    const brand = store.deviceBrands.find((db) => db.id === payload.deviceBrandId);
    const newModel: DeviceModel = {
      id: `dm-${Date.now()}`,
      companyId,
      deviceBrandId: payload.deviceBrandId,
      deviceBrandName: brand?.name || 'Marca',
      name: payload.name.trim(),
      technicalCode: payload.technicalCode?.trim() || null,
      active: payload.active !== undefined ? payload.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.deviceModels.push(newModel);
    saveStoreToDisk(companyId, store);
    return newModel;
  }

  // ==========================================
  // VARIATION TEMPLATES (GRADE / VARIAÇÕES)
  // ==========================================

  static async listVariationTemplates(companyId: UUID): Promise<VariationTemplate[]> {
    const store = getTenantStore(companyId);
    return store.variationTemplates || [];
  }

  static async createVariationTemplate(
    companyId: UUID,
    payload: CreateVariationTemplatePayload
  ): Promise<VariationTemplate> {
    const store = getTenantStore(companyId);
    store.variationTemplates = store.variationTemplates || [];

    const trimmedName = payload.name?.trim();
    if (!trimmedName) {
      throw new Error('O nome da variação é obrigatório.');
    }

    // Check duplicate by name per company (case-insensitive)
    const existing = store.variationTemplates.find(
      (v) => v.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      throw new Error(`Já existe uma variação cadastrada com o nome "${trimmedName}".`);
    }

    // Parse values
    let valuesList: string[] = [];
    if (Array.isArray(payload.values)) {
      valuesList = payload.values.map((v) => String(v).trim()).filter(Boolean);
    } else if (typeof payload.values === 'string') {
      valuesList = payload.values
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (valuesList.length === 0) {
      throw new Error('Informe ao menos um valor para a variação (ex.: Preto, Branco).');
    }

    const newTemplate: VariationTemplate = {
      id: `var-tpl-${Date.now()}`,
      companyId,
      name: trimmedName,
      values: valuesList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.variationTemplates.push(newTemplate);
    saveStoreToDisk(companyId, store);
    return newTemplate;
  }

  static async updateVariationTemplate(
    companyId: UUID,
    id: UUID,
    payload: UpdateVariationTemplatePayload
  ): Promise<VariationTemplate> {
    const store = getTenantStore(companyId);
    store.variationTemplates = store.variationTemplates || [];

    const item = store.variationTemplates.find((v) => v.id === id);
    if (!item) throw new Error('Variação não encontrada.');

    if (payload.name) {
      const trimmedName = payload.name.trim();
      const duplicate = store.variationTemplates.find(
        (v) => v.id !== id && v.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Já existe uma variação cadastrada com o nome "${trimmedName}".`);
      }
      item.name = trimmedName;
    }

    if (payload.values !== undefined) {
      let valuesList: string[] = [];
      if (Array.isArray(payload.values)) {
        valuesList = payload.values.map((v) => String(v).trim()).filter(Boolean);
      } else if (typeof payload.values === 'string') {
        valuesList = payload.values
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      }
      if (valuesList.length === 0) {
        throw new Error('Informe ao menos um valor para a variação.');
      }
      item.values = valuesList;
    }

    item.updatedAt = new Date().toISOString();
    saveStoreToDisk(companyId, store);
    return item;
  }

  static async deleteVariationTemplate(companyId: UUID, id: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    store.variationTemplates = store.variationTemplates || [];

    const item = store.variationTemplates.find((v) => v.id === id);
    if (!item) throw new Error('Variação não encontrada.');

    // Check if in use:
    // 1. Check if any product has variationTemplateId matching id or if any product has variations with values matching item.values
    const inUse = store.products.some((p) => {
      if ((p as any).variationTemplateId === id) return true;
      const pVars = store.variations.filter((v) => v.productId === p.id);
      return pVars.some((v) =>
        item.values.some((val) => val.toLowerCase() === v.name.toLowerCase())
      );
    });

    if (inUse) {
      throw new Error('Esta variação não pode ser excluída pois está vinculada a produtos cadastrados.');
    }

    const initial = store.variationTemplates.length;
    store.variationTemplates = store.variationTemplates.filter((v) => v.id !== id);
    saveStoreToDisk(companyId, store);
    return store.variationTemplates.length < initial;
  }

  // ==========================================
  // WARRANTIES (Prazos e Termos de Garantia)
  // ==========================================
  static async listWarranties(companyId: UUID): Promise<Warranty[]> {
    const store = getTenantStore(companyId);
    store.warranties = store.warranties || [];
    return [...store.warranties].sort((a, b) => {
      const nameA = a.nome || a.name || '';
      const nameB = b.nome || b.name || '';
      return nameA.localeCompare(nameB);
    });
  }

  static async createWarranty(companyId: UUID, payload: CreateWarrantyPayload): Promise<Warranty> {
    const store = getTenantStore(companyId);
    store.warranties = store.warranties || [];

    const name = (payload.nome || payload.name || '').trim();
    if (!name) {
      throw new Error('O nome da garantia é obrigatório.');
    }

    // Validate duplicate name per company (case-insensitive)
    const exists = store.warranties.some(
      (w) => (w.nome || w.name || '').toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      throw new Error(`Já existe uma garantia cadastrada com o nome "${name}".`);
    }

    const durationValue = Number(payload.duracao_valor ?? payload.durationValue ?? 0);
    if (isNaN(durationValue) || durationValue <= 0) {
      throw new Error('A duração da garantia deve ser um número inteiro positivo.');
    }

    const rawUnit = (payload.duracao_unidade ?? payload.durationUnit ?? 'Dias') as string;
    const durationUnit: WarrantyDurationUnit =
      rawUnit === 'Meses' || rawUnit === 'months'
        ? 'Meses'
        : rawUnit === 'Anos' || rawUnit === 'years'
        ? 'Anos'
        : 'Dias';

    const description = (payload.descricao ?? payload.description ?? null)?.trim() || null;
    const now = new Date().toISOString();

    const newWarranty: Warranty = {
      id: `war-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      company_id: companyId,
      name,
      nome: name,
      description,
      descricao: description,
      durationValue,
      duracao_valor: durationValue,
      durationUnit,
      duracao_unidade: durationUnit,
      createdAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now,
    };

    store.warranties.push(newWarranty);
    saveStoreToDisk(companyId, store);
    return newWarranty;
  }

  static async updateWarranty(
    companyId: UUID,
    id: UUID,
    payload: UpdateWarrantyPayload
  ): Promise<Warranty> {
    const store = getTenantStore(companyId);
    store.warranties = store.warranties || [];

    const item = store.warranties.find((w) => w.id === id);
    if (!item) {
      throw new Error('Garantia não encontrada.');
    }

    const name = (payload.nome !== undefined ? payload.nome : payload.name)?.trim();
    if (name !== undefined) {
      if (!name) {
        throw new Error('O nome da garantia não pode ser vazio.');
      }
      const duplicate = store.warranties.some(
        (w) => w.id !== id && (w.nome || w.name || '').toLowerCase() === name.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Já existe uma garantia cadastrada com o nome "${name}".`);
      }
      item.name = name;
      item.nome = name;
    }

    if (payload.duracao_valor !== undefined || payload.durationValue !== undefined) {
      const val = Number(payload.duracao_valor ?? payload.durationValue);
      if (isNaN(val) || val <= 0) {
        throw new Error('A duração da garantia deve ser um número inteiro positivo.');
      }
      item.durationValue = val;
      item.duracao_valor = val;
    }

    if (payload.duracao_unidade !== undefined || payload.durationUnit !== undefined) {
      const rawUnit = (payload.duracao_unidade ?? payload.durationUnit) as string;
      const durationUnit: WarrantyDurationUnit =
        rawUnit === 'Meses' || rawUnit === 'months'
          ? 'Meses'
          : rawUnit === 'Anos' || rawUnit === 'years'
          ? 'Anos'
          : 'Dias';
      item.durationUnit = durationUnit;
      item.duracao_unidade = durationUnit;
    }

    if (payload.descricao !== undefined || payload.description !== undefined) {
      const desc = (payload.descricao !== undefined ? payload.descricao : payload.description)?.trim() || null;
      item.description = desc;
      item.descricao = desc;
    }

    const now = new Date().toISOString();
    item.updatedAt = now;
    item.updated_at = now;

    saveStoreToDisk(companyId, store);
    return item;
  }

  static async deleteWarranty(companyId: UUID, id: UUID): Promise<boolean> {
    const store = getTenantStore(companyId);
    store.warranties = store.warranties || [];

    const item = store.warranties.find((w) => w.id === id);
    if (!item) {
      throw new Error('Garantia não encontrada.');
    }

    // Check if in use by any product in this company
    const inUse = store.products.some((p) => {
      if ((p as any).warrantyId === id) return true;
      if ((p as any).garantiaId === id) return true;
      const pName = (p as any).warrantyName || (p as any).garantiaNome;
      if (pName && pName.toLowerCase() === (item.nome || item.name || '').toLowerCase()) {
        return true;
      }
      return false;
    });

    if (inUse) {
      throw new Error('Esta garantia não pode ser excluída pois está vinculada a produtos cadastrados.');
    }

    const initial = store.warranties.length;
    store.warranties = store.warranties.filter((w) => w.id !== id);
    saveStoreToDisk(companyId, store);
    return store.warranties.length < initial;
  }
}
