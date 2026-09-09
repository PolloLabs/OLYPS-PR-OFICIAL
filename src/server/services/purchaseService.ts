import type {
  PurchasePayload,
  PurchaseItem,
  PurchaseRecord,
  PurchaseReturnPayload,
  PurchaseReturnRecord,
} from '../../types/purchase.types.js';

// ============================================
// SERVIÇO DE COMPRAS & DEVOLUÇÕES (Persistência via JSONB)
// ============================================

// Store em memória (simula banco via JSONB existente)
const purchasesStore = new Map<string, PurchaseRecord>();
const purchaseReturnsStore = new Map<string, PurchaseReturnRecord>();

// Inicialização com dados de demonstração
function ensureSeedData(companyId: string) {
  const existingPurchases = Array.from(purchasesStore.values()).filter((p) => p.companyId === companyId);
  if (existingPurchases.length === 0) {
    const p1Id = crypto.randomUUID();
    const p1: PurchaseRecord = {
      id: p1Id,
      companyId,
      purchaseNumber: 'COMP-2026-0001',
      supplierId: 'sup-001',
      supplierName: 'Dell Computadores do Brasil Ltda',
      referenceNumber: 'NF-89201-E',
      purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'received',
      address: 'Av. das Nações Unidas, 12901 - São Paulo/SP',
      companyLocationId: 'loc-matriz',
      locationName: 'Matriz - São Paulo',
      paymentTerm: 'net_30',
      paymentTermDays: 30,
      totalItems: 10,
      totalNetValue: 35000.0,
      discountType: 'percentage',
      discountValue: 5,
      discountTotal: 1750.0,
      taxType: 'percentage',
      taxTotal: 1662.5,
      additionalNotes: 'Lote de notebooks corporativos Latitude 5430 para renovação de parque.',
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'prod-001',
          productName: 'Notebook Dell Latitude 5430 Core i7 16GB 512GB SSD',
          sku: 'DELL-LAT-5430',
          barcode: '7891234567890',
          quantity: 10,
          unitCostBeforeDiscount: 3500.0,
          discountPercentage: 5,
          unitCostBeforeTax: 3325.0,
          subtotalBeforeTax: 33250.0,
          taxOnProducts: 5,
          netCost: 34912.5,
          totalLine: 34912.5,
          profitMarginPercent: 30,
          unitSalePriceWithTax: 4538.62,
        },
      ],
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 35000.0,
          paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          paymentMethod: 'bank_transfer',
          paymentNote: 'TED bancária compensada',
        },
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const p2Id = crypto.randomUUID();
    const p2: PurchaseRecord = {
      id: p2Id,
      companyId,
      purchaseNumber: 'COMP-2026-0002',
      supplierId: 'sup-002',
      supplierName: 'Samsung Eletrônica da Amazônia',
      referenceNumber: 'NF-44102-S',
      purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      address: 'Rua Verbo Divino, 1488 - São Paulo/SP',
      companyLocationId: 'loc-filial',
      locationName: 'Filial - Rio de Janeiro',
      paymentTerm: 'net_15',
      paymentTermDays: 15,
      totalItems: 25,
      totalNetValue: 18750.0,
      discountType: 'none',
      discountValue: 0,
      discountTotal: 0,
      taxType: 'none',
      taxTotal: 0,
      additionalNotes: 'Monitores 24 polegadas LED IPS Full HD.',
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'prod-002',
          productName: 'Monitor Samsung 24" IPS Full HD 75Hz',
          sku: 'SAM-MON-24IPS',
          barcode: '7899876543210',
          quantity: 25,
          unitCostBeforeDiscount: 750.0,
          discountPercentage: 0,
          unitCostBeforeTax: 750.0,
          subtotalBeforeTax: 18750.0,
          taxOnProducts: 0,
          netCost: 18750.0,
          totalLine: 18750.0,
          profitMarginPercent: 35,
          unitSalePriceWithTax: 1012.5,
        },
      ],
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 9375.0,
          paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          paymentMethod: 'pix',
          paymentNote: 'Adiantamento 50% via chave PIX',
        },
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const p3Id = crypto.randomUUID();
    const p3: PurchaseRecord = {
      id: p3Id,
      companyId,
      purchaseNumber: 'COMP-2026-0003',
      supplierId: 'sup-003',
      supplierName: 'Logitech do Brasil Comércio de Acessórios',
      referenceNumber: 'PED-7821',
      purchaseDate: new Date().toISOString(),
      status: 'requested',
      address: 'Alameda Santos, 2300 - São Paulo/SP',
      companyLocationId: 'loc-matriz',
      locationName: 'Matriz - São Paulo',
      paymentTerm: 'immediate',
      paymentTermDays: 0,
      totalItems: 50,
      totalNetValue: 8500.0,
      discountType: 'fixed',
      discountValue: 500,
      discountTotal: 500,
      taxType: 'none',
      taxTotal: 0,
      additionalNotes: 'Combos teclado e mouse sem fio MK270.',
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'prod-003',
          productName: 'Kit Teclado e Mouse Sem Fio Logitech MK270',
          sku: 'LOG-MK270-BR',
          barcode: '7896541239870',
          quantity: 50,
          unitCostBeforeDiscount: 180.0,
          discountPercentage: 0,
          unitCostBeforeTax: 180.0,
          subtotalBeforeTax: 9000.0,
          taxOnProducts: 0,
          netCost: 8500.0,
          totalLine: 8500.0,
          profitMarginPercent: 40,
          unitSalePriceWithTax: 252.0,
        },
      ],
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    purchasesStore.set(p1.id, p1);
    purchasesStore.set(p2.id, p2);
    purchasesStore.set(p3.id, p3);

    // Initial purchase return
    const ret1: PurchaseReturnRecord = {
      id: crypto.randomUUID(),
      companyId,
      returnNumber: 'DEV-COMP-2026-0001',
      purchaseId: p2Id,
      purchaseNumber: 'COMP-2026-0002',
      supplierId: 'sup-002',
      supplierName: 'Samsung Eletrônica da Amazônia',
      returnDate: new Date().toISOString(),
      status: 'completed',
      totalRefundAmount: 1500.0,
      notes: 'Devolução de 2 monitores com avaria cosmética de transporte.',
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'prod-002',
          productName: 'Monitor Samsung 24" IPS Full HD 75Hz',
          sku: 'SAM-MON-24IPS',
          quantityReturned: 2,
          unitCost: 750.0,
          totalRefund: 1500.0,
          reason: 'Avaria externa no gabinete detectada no recebimento',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    purchaseReturnsStore.set(ret1.id, ret1);
  }
}

// Gerar número de compra
export function generatePurchaseNumber(): string {
  const year = new Date().getFullYear();
  const count = purchasesStore.size + 1;
  return `COMP-${year}-${String(count).padStart(4, '0')}`;
}

// Gerar número de retorno
export function generatePurchaseReturnNumber(): string {
  const year = new Date().getFullYear();
  const count = purchaseReturnsStore.size + 1;
  return `DEV-COMP-${year}-${String(count).padStart(4, '0')}`;
}

// Criar compra
export async function createPurchase(companyId: string, data: PurchasePayload): Promise<PurchaseRecord> {
  const purchaseNumber = generatePurchaseNumber();

  const purchase: PurchaseRecord = {
    id: crypto.randomUUID(),
    purchaseNumber,
    companyId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  purchasesStore.set(purchase.id, purchase);
  return purchase;
}

// Listar compras
export async function getPurchases(companyId: string): Promise<PurchaseRecord[]> {
  ensureSeedData(companyId);
  return Array.from(purchasesStore.values()).filter((p) => p.companyId === companyId);
}

// Buscar compra por ID
export async function getPurchaseById(companyId: string, purchaseId: string): Promise<PurchaseRecord> {
  ensureSeedData(companyId);
  const purchase = purchasesStore.get(purchaseId);
  if (!purchase || purchase.companyId !== companyId) {
    throw new Error('Compra não encontrada');
  }
  return purchase;
}

// Atualizar compra
export async function updatePurchase(
  companyId: string,
  purchaseId: string,
  data: Partial<PurchasePayload>
): Promise<PurchaseRecord> {
  ensureSeedData(companyId);
  const purchase = purchasesStore.get(purchaseId);
  if (!purchase || purchase.companyId !== companyId) {
    throw new Error('Compra não encontrada');
  }

  const updated: PurchaseRecord = {
    ...purchase,
    ...data,
    updatedAt: new Date(),
  };
  purchasesStore.set(purchaseId, updated);
  return updated;
}

// Excluir compra
export async function deletePurchase(companyId: string, purchaseId: string): Promise<boolean> {
  ensureSeedData(companyId);
  const purchase = purchasesStore.get(purchaseId);
  if (!purchase || purchase.companyId !== companyId) {
    throw new Error('Compra não encontrada');
  }
  purchasesStore.delete(purchaseId);
  return true;
}

// ============================================
// DEVOLUÇÕES / RETORNOS DE COMPRAS
// ============================================
export async function getPurchaseReturns(companyId: string): Promise<PurchaseReturnRecord[]> {
  ensureSeedData(companyId);
  return Array.from(purchaseReturnsStore.values()).filter((r) => r.companyId === companyId);
}

export async function getPurchaseReturnById(companyId: string, returnId: string): Promise<PurchaseReturnRecord> {
  ensureSeedData(companyId);
  const ret = purchaseReturnsStore.get(returnId);
  if (!ret || ret.companyId !== companyId) {
    throw new Error('Devolução de compra não encontrada');
  }
  return ret;
}

export async function createPurchaseReturn(
  companyId: string,
  data: PurchaseReturnPayload
): Promise<PurchaseReturnRecord> {
  const returnNumber = generatePurchaseReturnNumber();
  const record: PurchaseReturnRecord = {
    id: crypto.randomUUID(),
    returnNumber,
    companyId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  purchaseReturnsStore.set(record.id, record);
  return record;
}

export async function deletePurchaseReturn(companyId: string, returnId: string): Promise<boolean> {
  ensureSeedData(companyId);
  const ret = purchaseReturnsStore.get(returnId);
  if (!ret || ret.companyId !== companyId) {
    throw new Error('Devolução de compra não encontrada');
  }
  purchaseReturnsStore.delete(returnId);
  return true;
}

// Calcular totais de uma linha de item
export function calculateItemTotals(item: Partial<PurchaseItem>): PurchaseItem {
  const quantity = Number(item.quantity) || 0;
  const unitCostBeforeDiscount = Number(item.unitCostBeforeDiscount) || 0;
  const discountPercentage = Number(item.discountPercentage) || 0;

  const discountAmount = unitCostBeforeDiscount * (discountPercentage / 100);
  const unitCostBeforeTax = Math.max(0, unitCostBeforeDiscount - discountAmount);
  const subtotalBeforeTax = unitCostBeforeTax * quantity;

  const taxRate = Number(item.taxOnProducts) || 0;
  const taxOnProducts = subtotalBeforeTax * (taxRate / 100);
  const netCost = subtotalBeforeTax + taxOnProducts;
  const totalLine = netCost;

  const profitMarginPercent = Number(item.profitMarginPercent ?? 30);
  const unitSalePriceWithTax = unitCostBeforeTax * (1 + profitMarginPercent / 100);

  return {
    id: item.id || crypto.randomUUID(),
    productId: item.productId || '',
    productName: item.productName || '',
    sku: item.sku || '',
    barcode: item.barcode || '',
    quantity,
    unitCostBeforeDiscount,
    discountPercentage,
    unitCostBeforeTax,
    subtotalBeforeTax,
    taxOnProducts,
    netCost,
    totalLine,
    profitMarginPercent,
    unitSalePriceWithTax,
  };
}

// Calcular totais gerais
export function calculatePurchaseTotals(
  items: PurchaseItem[],
  discountType: string,
  discountValue: number,
  taxType: string,
  taxValue: number = 0
) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.totalLine) || 0), 0);

  let discountTotal = 0;
  const dVal = Number(discountValue) || 0;
  if (discountType === 'percentage') {
    discountTotal = subtotal * (dVal / 100);
  } else if (discountType === 'fixed') {
    discountTotal = dVal;
  }

  const afterDiscount = Math.max(0, subtotal - discountTotal);

  let taxTotal = 0;
  const tVal = Number(taxValue) || (taxType !== 'none' ? dVal : 0);
  if (taxType === 'percentage') {
    taxTotal = afterDiscount * (tVal / 100);
  } else if (taxType === 'fixed') {
    taxTotal = tVal;
  }

  const totalNetValue = afterDiscount + taxTotal;

  return {
    totalItems: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    subtotal,
    discountTotal,
    taxTotal,
    totalNetValue,
  };
}

export const PurchaseService = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchaseReturns,
  getPurchaseReturnById,
  createPurchaseReturn,
  deletePurchaseReturn,
  calculateItemTotals,
  calculatePurchaseTotals,
  generatePurchaseNumber,
  generatePurchaseReturnNumber,
};
