import type {
  ProductImportColumnDef,
  ProductImportValidationError,
  ProductImportRowItem,
} from '../types/productImport.types.js';

export const OFFICIAL_PRODUCT_IMPORT_COLUMNS: ProductImportColumnDef[] = [
  {
    number: 1,
    key: 'name',
    name: 'Nome do Produto (NAME)',
    required: true,
    instruction: 'Nome oficial do item ou mercadoria no catálogo. Obrigatório em todas as linhas.',
  },
  {
    number: 2,
    key: 'brand',
    name: 'Marca (BRAND)',
    required: false,
    instruction: 'Nome da marca ou fabricante. Se não existir, será criada automaticamente.',
  },
  {
    number: 3,
    key: 'unit',
    name: 'Unidade (UNIT)',
    required: true,
    instruction: 'Unidade de medida principal (ex: UN, KG, MT, CX, L, PC). Obrigatório.',
  },
  {
    number: 4,
    key: 'category',
    name: 'Categoria (CATEGORY)',
    required: false,
    instruction: 'Nome da categoria principal do produto.',
  },
  {
    number: 5,
    key: 'sub_category',
    name: 'Subcategoria (SUB-CATEGORY)',
    required: false,
    instruction: 'Nome da subcategoria vinculada à categoria.',
  },
  {
    number: 6,
    key: 'sku',
    name: 'SKU (SKU)',
    required: false,
    instruction: 'Código SKU único. Deixe em branco para o sistema gerar automaticamente (ex: PRD-100000).',
  },
  {
    number: 7,
    key: 'barcode_type',
    name: 'Tipo de Código de Barras (BARCODE TYPE)',
    required: false,
    defaultValue: 'C128',
    instruction: 'Padrão: C128. Opções válidas: C128, C39, EAN-13, EAN-8, UPC-A, UPC-E, ITF-14.',
    options: ['C128', 'C39', 'EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'ITF-14'],
  },
  {
    number: 8,
    key: 'manage_stock',
    name: 'Gerenciar Estoque (MANAGE STOCK)',
    required: true,
    instruction: 'Controle de saldo físico. 1 = Sim, 0 = Não.',
    options: ['1', '0'],
  },
  {
    number: 9,
    key: 'alert_quantity',
    name: 'Quantidade de Alerta (ALERT QUANTITY)',
    required: false,
    instruction: 'Quantidade mínima em estoque para aviso de reposição.',
  },
  {
    number: 10,
    key: 'expires_in',
    name: 'Expira em (EXPIRES IN)',
    required: false,
    instruction: 'Número referente ao período de validade/garantia do produto.',
  },
  {
    number: 11,
    key: 'expiry_period_unit',
    name: 'Unidade do Período (EXPIRY PERIOD UNIT)',
    required: false,
    instruction: 'Unidade de tempo de expiração. Opções: days, months, dias, meses.',
    options: ['days', 'months', 'dias', 'meses'],
  },
  {
    number: 12,
    key: 'applicable_tax',
    name: 'Imposto Aplicável (APPLICABLE TAX)',
    required: false,
    instruction: 'Alíquota ou regra de imposto aplicável na venda.',
  },
  {
    number: 13,
    key: 'selling_price_tax_type',
    name: 'Tipo de Imposto Preço Venda (SELLING PRICE TAX TYPE)',
    required: true,
    instruction: 'Regra de incidência tributária no preço de venda. Opções: inclusive ou exclusive.',
    options: ['inclusive', 'exclusive'],
  },
  {
    number: 14,
    key: 'product_type',
    name: 'Tipo de Produto (PRODUCT TYPE)',
    required: true,
    instruction: 'Tipo de cadastro do produto. Opções: single (simples) ou variable (variável).',
    options: ['single', 'variable', 'simples', 'variavel'],
  },
  {
    number: 15,
    key: 'variation_name',
    name: 'Nome da Variação (VARIATION NAME)',
    required: false,
    instruction: 'Obrigatório se o tipo de produto for "variable" (ex: Tamanho, Cor, Voltagem). Deixe em branco se for "single".',
  },
  {
    number: 16,
    key: 'variation_values',
    name: 'Valores da Variação (VARIATION VALUES)',
    required: false,
    instruction: 'Obrigatório se "variable". Valores separados pelo caractere "|" (pipe), ex: P|M|G ou 110V|220V.',
  },
  {
    number: 17,
    key: 'variation_sku',
    name: 'SKU da Variação (VARIATION SKU)',
    required: false,
    instruction: 'SKUs customizados para variações. Deixe em branco para geração automática.',
  },
  {
    number: 18,
    key: 'purchase_price_inc_tax',
    name: 'Preço de Compra Com Imposto (PURCHASE PRICE INC TAX)',
    required: false,
    instruction: 'Preço de custo com impostos inclusos. Se não informado, calculado pelo preço sem imposto.',
  },
  {
    number: 19,
    key: 'purchase_price_exc_tax',
    name: 'Preço de Compra Sem Imposto (PURCHASE PRICE EXC TAX)',
    required: false,
    instruction: 'Preço de custo líquido sem impostos. Pelo menos um dos preços de compra deve ser informado.',
  },
  {
    number: 20,
    key: 'profit_margin',
    name: 'Margem de Lucro % (PROFIT MARGIN)',
    required: false,
    instruction: 'Percentual de margem de lucro desejada sobre o custo.',
  },
  {
    number: 21,
    key: 'selling_price',
    name: 'Preço de Venda (SELLING PRICE)',
    required: false,
    instruction: 'Preço padrão praticado na venda ao consumidor.',
  },
  {
    number: 22,
    key: 'opening_stock',
    name: 'Estoque Inicial (OPENING STOCK)',
    required: false,
    instruction: 'Quantidade física inicial em estoque a ser lançada para o produto.',
  },
  {
    number: 23,
    key: 'location',
    name: 'Filial / Local Estoque Inicial (LOCATION)',
    required: false,
    instruction: 'Nome da filial onde o saldo inicial será lançado. Se vazio, utiliza a filial matriz principal.',
  },
  {
    number: 24,
    key: 'expiry_date',
    name: 'Data de Expiração (EXPIRY DATE)',
    required: false,
    instruction: 'Data limite de validade do lote inicial (formato AAAA-MM-DD ou DD/MM/AAAA).',
  },
  {
    number: 25,
    key: 'enable_imei_sr_no',
    name: 'Habilitar IMEI ou Serial (ENABLE IMEI OR SERIAL NUMBER)',
    required: false,
    defaultValue: '0',
    instruction: 'Controle individual por número de série ou IMEI. 1 = Sim, 0 = Não.',
    options: ['1', '0'],
  },
  {
    number: 26,
    key: 'weight',
    name: 'Peso (WEIGHT)',
    required: false,
    instruction: 'Peso unitário do produto para frete ou pesagem.',
  },
  {
    number: 27,
    key: 'rack',
    name: 'Prateleira / Rack (RACK)',
    required: false,
    instruction: 'Endereçamento de depósito: identificação da prateleira.',
  },
  {
    number: 28,
    key: 'row',
    name: 'Fila / Corredor (ROW)',
    required: false,
    instruction: 'Endereçamento de depósito: identificação do corredor ou fila.',
  },
  {
    number: 29,
    key: 'position',
    name: 'Posição (POSITION)',
    required: false,
    instruction: 'Endereçamento de depósito: posição ou escaninho.',
  },
  {
    number: 30,
    key: 'image',
    name: 'Imagem (IMAGE)',
    required: false,
    instruction: 'Nome do arquivo de imagem ou URL direta da foto do produto.',
  },
  {
    number: 31,
    key: 'product_description',
    name: 'Descrição do Produto (PRODUCT DESCRIPTION)',
    required: false,
    instruction: 'Texto detalhado ou ficha técnica do item.',
  },
  {
    number: 32,
    key: 'custom_field1',
    name: 'Campo Personalizado 1 (CUSTOM FIELD 1)',
    required: false,
    instruction: 'Atributo adicional customizado 1.',
  },
  {
    number: 33,
    key: 'custom_field2',
    name: 'Campo Personalizado 2 (CUSTOM FIELD 2)',
    required: false,
    instruction: 'Atributo adicional customizado 2.',
  },
  {
    number: 34,
    key: 'custom_field3',
    name: 'Campo Personalizado 3 (CUSTOM FIELD 3)',
    required: false,
    instruction: 'Atributo adicional customizado 3.',
  },
  {
    number: 35,
    key: 'custom_field4',
    name: 'Campo Personalizado 4 (CUSTOM FIELD 4)',
    required: false,
    instruction: 'Atributo adicional customizado 4.',
  },
  {
    number: 36,
    key: 'not_for_selling',
    name: 'Não Disponível para Venda (NOT FOR SELLING)',
    required: false,
    defaultValue: '0',
    instruction: 'Indica se o item é apenas de consumo interno/insumo. 1 = Sim, 0 = Não.',
    options: ['1', '0'],
  },
  {
    number: 37,
    key: 'product_locations',
    name: 'Filiais do Produto (PRODUCT LOCATIONS)',
    required: false,
    instruction: 'Nomes das filiais onde o produto estará disponível comercialmente, separados por vírgula.',
  },
];

/**
 * Standard CSV Template with canonical 37 columns
 */
export const OFFICIAL_CSV_HEADER_37 = [
  'NAME',
  'BRAND',
  'UNIT',
  'CATEGORY',
  'SUB-CATEGORY',
  'SKU',
  'BARCODE TYPE',
  'MANAGE STOCK',
  'ALERT QUANTITY',
  'EXPIRES IN',
  'EXPIRY PERIOD UNIT',
  'APPLICABLE TAX',
  'SELLING PRICE TAX TYPE',
  'PRODUCT TYPE',
  'VARIATION NAME',
  'VARIATION VALUES',
  'VARIATION SKU',
  'PURCHASE PRICE (INC TAX)',
  'PURCHASE PRICE (EXC TAX)',
  'PROFIT MARGIN',
  'SELLING PRICE',
  'OPENING STOCK',
  'LOCATION',
  'EXPIRY DATE',
  'ENABLE IMEI OR SERIAL NUMBER',
  'WEIGHT',
  'RACK',
  'ROW',
  'POSITION',
  'IMAGE',
  'PRODUCT DESCRIPTION',
  'CUSTOM FIELD 1',
  'CUSTOM FIELD 2',
  'CUSTOM FIELD 3',
  'CUSTOM FIELD 4',
  'NOT FOR SELLING',
  'PRODUCT LOCATIONS',
];

/**
 * Generates official CSV template string ready for download
 */
export function generateOfficialCsvTemplate(): string {
  const header = OFFICIAL_CSV_HEADER_37.join(',');
  const sampleRows = [
    // Line 1: Standard single product with initial stock and location
    [
      '"Smartphone Galaxy S23 128GB"',
      '"Samsung"',
      '"UN"',
      '"Smartphones"',
      '""',
      '"PRD-SAM-S23"',
      '"C128"',
      '"1"',
      '"5"',
      '""',
      '""',
      '""',
      '"exclusive"',
      '"single"',
      '""',
      '""',
      '""',
      '"3200.00"',
      '"3200.00"',
      '"35.00"',
      '"4320.00"',
      '"15"',
      '"Matriz - Centro"',
      '""',
      '"1"',
      '"0.180"',
      '"A1"',
      '"Fila 2"',
      '"Box 04"',
      '""',
      '"Aparelho celular de alta performance com câmera tripla"',
      '"Preto"',
      '"128GB"',
      '""',
      '""',
      '"0"',
      '"Matriz - Centro, Filial Shopping"',
    ].join(','),
    // Line 2: Accessory single product
    [
      '"Cabo USB-C Trançado 1.5m"',
      '"Anker"',
      '"UN"',
      '"Acessórios"',
      '""',
      '""',
      '"C128"',
      '"1"',
      '"10"',
      '""',
      '""',
      '""',
      '"exclusive"',
      '"single"',
      '""',
      '""',
      '""',
      '"35.00"',
      '"35.00"',
      '"70.00"',
      '"59.90"',
      '"40"',
      '"Matriz - Centro"',
      '""',
      '"0"',
      '"0.050"',
      '"B2"',
      '"Fila 1"',
      '"Prat 3"',
      '""',
      '"Cabo reforçado compatível com carga rápida 60W"',
      '""',
      '""',
      '""',
      '""',
      '"0"',
      '"Matriz - Centro"',
    ].join(','),
    // Line 3: Variable product (e.g. Camiseta Técnica)
    [
      '"Camiseta Dry Fit OLYPS"',
      '"OLYPS Wear"',
      '"UN"',
      '"Vestuário"',
      '""',
      '""',
      '"C128"',
      '"1"',
      '"8"',
      '""',
      '""',
      '""',
      '"inclusive"',
      '"variable"',
      '"Tamanho"',
      '"P|M|G|GG"',
      '""',
      '"40.00"',
      '"40.00"',
      '"100.00"',
      '"80.00"',
      '"25"',
      '"Matriz - Centro"',
      '""',
      '"0"',
      '"0.150"',
      '""',
      '""',
      '""',
      '""',
      '"Camiseta esportiva de secagem rápida"',
      '""',
      '""',
      '""',
      '""',
      '"0"',
      '"Matriz - Centro"',
    ].join(','),
  ];

  return [header, ...sampleRows].join('\n');
}

/**
 * Normalizes header string for comparison
 */
function normalizeHeaderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\s\-\(\)\.]+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Validates header columns against the 37 columns specification
 */
export function validateHeaders(detectedHeaders: string[]): {
  valid: boolean;
  detectedCount: number;
  expectedCount: number;
  errors: string[];
  mapping: Record<string, number>; // key -> index in detectedHeaders
} {
  const detectedCount = detectedHeaders.length;
  const expectedCount = 37;
  const errors: string[] = [];
  const mapping: Record<string, number> = {};

  if (detectedCount < 35) {
    errors.push(
      `O arquivo contém apenas ${detectedCount} colunas. O modelo padrão exige 37 colunas.`
    );
  }

  // Build normalized index map for detected headers
  const normalizedDetected = detectedHeaders.map((h) => normalizeHeaderName(h));

  // Map each of the 37 defined columns
  OFFICIAL_PRODUCT_IMPORT_COLUMNS.forEach((colDef, idx) => {
    // Exact index match first (canonical position)
    if (idx < detectedCount) {
      mapping[colDef.key] = idx;
    } else {
      // Look by name match
      const normDefName = normalizeHeaderName(colDef.name);
      const foundIdx = normalizedDetected.findIndex((h) => h.includes(normDefName) || normDefName.includes(h));
      if (foundIdx !== -1) {
        mapping[colDef.key] = foundIdx;
      }
    }
  });

  return {
    valid: errors.length === 0,
    detectedCount,
    expectedCount,
    errors,
    mapping,
  };
}

/**
 * Validates a single parsed row
 */
export function validateRow(
  rawRow: string[] | Record<string, any>,
  rowNumber: number,
  mapping: Record<string, number>
): ProductImportRowItem {
  const errors: ProductImportValidationError[] = [];

  const getValue = (key: string, defaultVal = ''): string => {
    if (Array.isArray(rawRow)) {
      const idx = mapping[key];
      if (idx !== undefined && idx < rawRow.length) {
        return (rawRow[idx] ?? '').toString().trim();
      }
      return defaultVal;
    }
    const val = rawRow[key];
    return val !== undefined && val !== null ? val.toString().trim() : defaultVal;
  };

  // 1. Name (Required)
  const name = getValue('name');
  if (!name) {
    errors.push({
      rowNumber,
      columnNumber: 1,
      columnName: 'Nome do Produto (NAME)',
      value: name,
      message: 'Nome do produto é obrigatório e não pode ser vazio.',
    });
  }

  // 2. Brand (Optional)
  const brand = getValue('brand');

  // 3. Unit (Required)
  const unit = getValue('unit');
  if (!unit) {
    errors.push({
      rowNumber,
      columnNumber: 3,
      columnName: 'Unidade (UNIT)',
      value: unit,
      message: 'Unidade de medida é obrigatória (ex: UN, KG, MT, CX, L).',
    });
  }

  // 4. Category (Optional)
  const category = getValue('category');

  // 5. Sub-category (Optional)
  const subCategory = getValue('sub_category');

  // 6. SKU (Optional)
  const sku = getValue('sku');

  // 7. Barcode Type (Optional, default C128)
  const rawBarcodeType = getValue('barcode_type', 'C128').toUpperCase();
  const validBarcodeTypes = ['C128', 'C39', 'EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'ITF-14', 'EAN13', 'EAN8', 'UPCA', 'UPCE'];
  let barcodeType = 'C128';
  if (rawBarcodeType && !validBarcodeTypes.includes(rawBarcodeType)) {
    errors.push({
      rowNumber,
      columnNumber: 7,
      columnName: 'Tipo de Código de Barras (BARCODE TYPE)',
      value: rawBarcodeType,
      message: 'Tipo de código de barras inválido. Permitidos: C128, C39, EAN-13, EAN-8, UPC-A, UPC-E.',
    });
  } else if (rawBarcodeType) {
    barcodeType = rawBarcodeType.replace('-', '');
  }

  // 8. Manage Stock (Required: 1 or 0)
  const rawManageStock = getValue('manage_stock');
  let manageStock = true;
  if (rawManageStock === '1' || rawManageStock.toLowerCase() === 'sim' || rawManageStock.toLowerCase() === 'yes') {
    manageStock = true;
  } else if (rawManageStock === '0' || rawManageStock.toLowerCase() === 'nao' || rawManageStock.toLowerCase() === 'não' || rawManageStock.toLowerCase() === 'no') {
    manageStock = false;
  } else if (rawManageStock) {
    errors.push({
      rowNumber,
      columnNumber: 8,
      columnName: 'Gerenciar Estoque (MANAGE STOCK)',
      value: rawManageStock,
      message: 'Valor inválido para Gerenciar Estoque. Aceito: 1 (Sim) ou 0 (Não).',
    });
  }

  // 9. Alert Quantity
  const rawAlertQuantity = getValue('alert_quantity');
  const alertQuantity = rawAlertQuantity ? parseFloat(rawAlertQuantity) : undefined;
  if (rawAlertQuantity && isNaN(alertQuantity!)) {
    errors.push({
      rowNumber,
      columnNumber: 9,
      columnName: 'Quantidade de Alerta (ALERT QUANTITY)',
      value: rawAlertQuantity,
      message: 'Quantidade de alerta deve ser um número válido.',
    });
  }

  // 10. Expires in
  const rawExpiresIn = getValue('expires_in');
  const expiresIn = rawExpiresIn ? parseFloat(rawExpiresIn) : undefined;

  // 11. Expiry period unit
  const expiryPeriodUnit = getValue('expiry_period_unit');

  // 12. Applicable tax
  const applicableTax = getValue('applicable_tax');

  // 13. Selling Price Tax Type (Required: inclusive or exclusive)
  const rawTaxType = getValue('selling_price_tax_type', 'exclusive').toLowerCase();
  let sellingPriceTaxType: 'inclusive' | 'exclusive' = 'exclusive';
  if (rawTaxType === 'inclusive' || rawTaxType === 'incluso') {
    sellingPriceTaxType = 'inclusive';
  } else if (rawTaxType === 'exclusive' || rawTaxType === 'excluso') {
    sellingPriceTaxType = 'exclusive';
  } else if (rawTaxType) {
    errors.push({
      rowNumber,
      columnNumber: 13,
      columnName: 'Tipo de Imposto Preço Venda (SELLING PRICE TAX TYPE)',
      value: rawTaxType,
      message: 'Tipo de imposto deve ser "inclusive" ou "exclusive".',
    });
  }

  // 14. Product Type (Required: single or variable)
  const rawProductType = getValue('product_type', 'single').toLowerCase();
  let productType: 'single' | 'variable' = 'single';
  if (rawProductType === 'single' || rawProductType === 'simples') {
    productType = 'single';
  } else if (rawProductType === 'variable' || rawProductType === 'variavel') {
    productType = 'variable';
  } else {
    errors.push({
      rowNumber,
      columnNumber: 14,
      columnName: 'Tipo de Produto (PRODUCT TYPE)',
      value: rawProductType,
      message: 'Tipo de produto deve ser "single" ou "variable".',
    });
  }

  // 15. Variation Name (Required if variable)
  const variationName = getValue('variation_name');
  if (productType === 'variable' && !variationName) {
    errors.push({
      rowNumber,
      columnNumber: 15,
      columnName: 'Nome da Variação (VARIATION NAME)',
      value: '',
      message: 'Nome da variação é obrigatório quando o tipo de produto for "variable".',
    });
  }

  // 16. Variation Values (Required if variable)
  const variationValues = getValue('variation_values');
  if (productType === 'variable' && !variationValues) {
    errors.push({
      rowNumber,
      columnNumber: 16,
      columnName: 'Valores da Variação (VARIATION VALUES)',
      value: '',
      message: 'Valores da variação são obrigatórios quando o tipo for "variable" (ex: P|M|G).',
    });
  }

  // 17. Variation SKU
  const variationSku = getValue('variation_sku');

  // 18. Purchase Price Inc Tax
  const rawPurchaseInc = getValue('purchase_price_inc_tax').replace(',', '.');
  const purchasePriceIncTax = rawPurchaseInc ? parseFloat(rawPurchaseInc) : undefined;

  // 19. Purchase Price Exc Tax
  const rawPurchaseExc = getValue('purchase_price_exc_tax').replace(',', '.');
  const purchasePriceExcTax = rawPurchaseExc ? parseFloat(rawPurchaseExc) : undefined;

  // 20. Profit Margin
  const rawProfitMargin = getValue('profit_margin').replace(',', '.');
  const profitMargin = rawProfitMargin ? parseFloat(rawProfitMargin) : undefined;

  // 21. Selling Price
  const rawSellingPrice = getValue('selling_price').replace(',', '.');
  const sellingPrice = rawSellingPrice ? parseFloat(rawSellingPrice) : undefined;

  // 22. Opening Stock
  const rawOpeningStock = getValue('opening_stock').replace(',', '.');
  const openingStock = rawOpeningStock ? parseFloat(rawOpeningStock) : undefined;
  if (rawOpeningStock && isNaN(openingStock!)) {
    errors.push({
      rowNumber,
      columnNumber: 22,
      columnName: 'Estoque Inicial (OPENING STOCK)',
      value: rawOpeningStock,
      message: 'Estoque inicial deve ser um número válido.',
    });
  }

  // 23. Location
  const location = getValue('location');

  // 24. Expiry Date
  const expiryDate = getValue('expiry_date');

  // 25. Enable IMEI or Serial
  const rawEnableImei = getValue('enable_imei_sr_no');
  const enableImeiSerial = rawEnableImei === '1' || rawEnableImei.toLowerCase() === 'sim';

  // 26. Weight
  const rawWeight = getValue('weight').replace(',', '.');
  const weight = rawWeight ? parseFloat(rawWeight) : undefined;

  // 27-29. Warehouse locations
  const rack = getValue('rack');
  const row = getValue('row');
  const position = getValue('position');

  // 30. Image
  const image = getValue('image');

  // 31. Description
  const productDescription = getValue('product_description');

  // 32-35. Custom Fields
  const customField1 = getValue('custom_field1');
  const customField2 = getValue('custom_field2');
  const customField3 = getValue('custom_field3');
  const customField4 = getValue('custom_field4');

  // 36. Not for Selling
  const rawNotForSelling = getValue('not_for_selling');
  const notForSelling = rawNotForSelling === '1' || rawNotForSelling.toLowerCase() === 'sim';

  // 37. Product Locations
  const rawProductLocations = getValue('product_locations');
  const productLocations = rawProductLocations
    ? rawProductLocations.split(',').map((l) => l.trim()).filter(Boolean)
    : [];

  const rawObj: Record<string, any> = {};
  if (Array.isArray(rawRow)) {
    rawRow.forEach((val, i) => {
      rawObj[`col_${i + 1}`] = val;
    });
  }

  return {
    rowNumber,
    isValid: errors.length === 0,
    errors,
    raw: rawObj,
    parsed: {
      name,
      brand,
      unit,
      category,
      subCategory,
      sku,
      barcodeType,
      manageStock,
      alertQuantity,
      expiresIn,
      expiryPeriodUnit,
      applicableTax,
      sellingPriceTaxType,
      productType,
      variationName,
      variationValues,
      variationSku,
      purchasePriceIncTax,
      purchasePriceExcTax,
      profitMargin,
      sellingPrice,
      openingStock,
      location,
      expiryDate,
      enableImeiSerial,
      weight,
      rack,
      row,
      position,
      image,
      productDescription,
      customField1,
      customField2,
      customField3,
      customField4,
      notForSelling,
      productLocations,
    },
  };
}
