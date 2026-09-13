import fs from 'fs';
import path from 'path';
import type {
  StockAdjustment,
  StockAdjustmentItem,
  CreateStockAdjustmentPayload,
  StockAdjustmentFilters,
  StockAdjustmentKpis,
} from '../../types/stockAdjustment.types.js';
import { ProductService } from './productService.js';

const DATA_DIR = path.join(process.cwd(), '.data', 'stock-adjustments');

function getStoreFilePath(companyId: string): string {
  return path.join(DATA_DIR, `adjustments-${companyId}.json`);
}

const memoryStores = new Map<string, StockAdjustment[]>();

function ensureDirExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[StockAdjustment] Failed to create data directory:', err);
  }
}

function loadCompanyAdjustments(companyId: string): StockAdjustment[] {
  if (memoryStores.has(companyId)) {
    return memoryStores.get(companyId)!;
  }

  ensureDirExists();
  const filePath = getStoreFilePath(companyId);

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as StockAdjustment[];
      memoryStores.set(companyId, data);
      return data;
    } catch (err) {
      console.warn(`[StockAdjustment] Failed to load data for company ${companyId}:`, err);
    }
  }

  // Seed inicial demonstrativo
  const initialSeed: StockAdjustment[] = [
    {
      id: `adj-seed-1-${companyId}`,
      companyId,
      referenceNumber: 'AJE-0001',
      adjustmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      locationId: 'loc-matriz',
      locationName: 'Matriz - São Paulo',
      type: 'normal',
      totalAmount: 450.0,
      totalRecovered: 0,
      reason: 'Conferência periódica de estoque de rotina mensal',
      addedBy: 'Admin Sistema',
      items: [
        {
          id: 'item-seed-1',
          productId: 'prod-001',
          productName: 'Teclado Mecânico RGB USB',
          sku: 'PRD-100001',
          barcode: '7891234567801',
          currentStock: 25,
          quantity: 3,
          stockAfter: 28,
          unitCost: 150.0,
          subtotal: 450.0,
        },
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `adj-seed-2-${companyId}`,
      companyId,
      referenceNumber: 'AJE-0002',
      adjustmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      locationId: 'loc-matriz',
      locationName: 'Matriz - São Paulo',
      type: 'abnormal',
      totalAmount: 320.0,
      totalRecovered: 120.0,
      reason: 'Avaria em transporte interno com reembolso parcial da seguradora',
      addedBy: 'Admin Sistema',
      items: [
        {
          id: 'item-seed-2',
          productId: 'prod-002',
          productName: 'Mouse Óptico Sem Fio 2.4GHz',
          sku: 'PRD-100002',
          barcode: '7891234567802',
          currentStock: 40,
          quantity: -4,
          stockAfter: 36,
          unitCost: 80.0,
          subtotal: 320.0,
        },
      ],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  memoryStores.set(companyId, initialSeed);
  saveCompanyAdjustments(companyId, initialSeed);
  return initialSeed;
}

function saveCompanyAdjustments(companyId: string, adjustments: StockAdjustment[]): void {
  ensureDirExists();
  const filePath = getStoreFilePath(companyId);
  try {
    fs.writeFileSync(filePath, JSON.stringify(adjustments, null, 2), 'utf-8');
    memoryStores.set(companyId, adjustments);
  } catch (err) {
    console.warn(`[StockAdjustment] Failed to save data for company ${companyId}:`, err);
  }
}

export class StockAdjustmentService {
  /**
   * Gera o próximo número sequencial de referência no formato AJE-XXXX
   */
  static getNextReferenceNumber(companyId: string): string {
    const list = loadCompanyAdjustments(companyId);
    let maxNumber = 0;

    for (const item of list) {
      const match = item.referenceNumber?.match(/^AJE-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextNum = maxNumber + 1;
    return `AJE-${String(nextNum).padStart(4, '0')}`;
  }

  /**
   * Lista ajustes com filtros aplicados e retorna também os KPIs calculados
   */
  static async list(
    companyId: string,
    filters: StockAdjustmentFilters = {}
  ): Promise<{ items: StockAdjustment[]; kpis: StockAdjustmentKpis }> {
    const all = loadCompanyAdjustments(companyId);

    // Calcular KPIs globais da empresa
    let totalAdjustedAmount = 0;
    let totalRecoveredAmount = 0;
    let abnormalCount = 0;

    for (const adj of all) {
      totalAdjustedAmount += Number(adj.totalAmount || 0);
      totalRecoveredAmount += Number(adj.totalRecovered || 0);
      if (adj.type === 'abnormal') {
        abnormalCount++;
      }
    }

    const kpis: StockAdjustmentKpis = {
      totalAdjustments: all.length,
      totalAdjustedAmount,
      totalRecoveredAmount,
      abnormalAdjustments: abnormalCount,
    };

    let filtered = [...all];

    // Filtro de data inicial
    if (filters.startDate) {
      filtered = filtered.filter((a) => a.adjustmentDate >= filters.startDate!);
    }

    // Filtro de data final
    if (filters.endDate) {
      filtered = filtered.filter((a) => a.adjustmentDate <= filters.endDate!);
    }

    // Filtro de tipo
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((a) => a.type === filters.type);
    }

    // Filtro de localização
    if (filters.locationId && filters.locationId !== 'all') {
      filtered = filtered.filter((a) => a.locationId === filters.locationId);
    }

    // Busca textual livre
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter((a) => {
        return (
          a.referenceNumber.toLowerCase().includes(q) ||
          a.locationName.toLowerCase().includes(q) ||
          a.reason?.toLowerCase().includes(q) ||
          a.addedBy?.toLowerCase().includes(q) ||
          a.items.some(
            (i) =>
              i.productName.toLowerCase().includes(q) ||
              i.sku.toLowerCase().includes(q) ||
              (i.barcode && i.barcode.toLowerCase().includes(q))
          )
        );
      });
    }

    // Ordenação decrescente pela data mais recente
    filtered.sort((a, b) => new Date(b.adjustmentDate).getTime() - new Date(a.adjustmentDate).getTime());

    return { items: filtered, kpis };
  }

  /**
   * Obtém um ajuste por ID
   */
  static async getById(companyId: string, id: string): Promise<StockAdjustment | null> {
    const list = loadCompanyAdjustments(companyId);
    return list.find((a) => a.id === id) || null;
  }

  /**
   * Cria um novo ajuste de estoque e atualiza o estoque real dos produtos
   */
  static async create(
    companyId: string,
    payload: CreateStockAdjustmentPayload,
    addedBy: string = 'Usuário do Sistema'
  ): Promise<StockAdjustment> {
    if (!payload.adjustmentDate) {
      throw new Error('A data do ajuste é obrigatória.');
    }
    if (!payload.locationId) {
      throw new Error('A localização/loja é obrigatória.');
    }
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Informe ao menos um produto para o ajuste.');
    }

    // Validação estrita: se for tipo anormal, a razão é OBRIGATÓRIA
    if (payload.type === 'abnormal') {
      if (!payload.reason || !payload.reason.trim()) {
        throw new Error('A razão do ajuste é obrigatória para ajustes anormais.');
      }
    }

    const referenceNumber = payload.referenceNumber?.trim() || this.getNextReferenceNumber(companyId);

    // Calcular itens processados
    let calculatedTotal = 0;
    const processedItems: StockAdjustmentItem[] = payload.items.map((item, index) => {
      const currentStock = Number(item.currentStock || 0);
      const quantity = Number(item.quantity || 0);
      const unitCost = Number(item.unitCost || 0);
      const stockAfter = currentStock + quantity;
      const subtotal = Math.abs(quantity) * unitCost;

      calculatedTotal += subtotal;

      return {
        id: `item-${Date.now()}-${index}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        barcode: item.barcode || null,
        currentStock,
        quantity,
        stockAfter,
        unitCost,
        subtotal,
      };
    });

    const now = new Date().toISOString();
    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      referenceNumber,
      adjustmentDate: payload.adjustmentDate,
      locationId: payload.locationId,
      locationName: payload.locationName || 'Loja Principal',
      type: payload.type,
      totalAmount: payload.totalAmount !== undefined ? payload.totalAmount : calculatedTotal,
      totalRecovered: payload.type === 'abnormal' ? Number(payload.totalRecovered || 0) : 0,
      reason: payload.reason?.trim() || '',
      addedBy,
      items: processedItems,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Atualizar o estoque real dos produtos no catálogo
    const stockDeltaItems = processedItems.map((item) => ({
      productId: item.productId,
      locationId: payload.locationId,
      quantityDelta: item.quantity,
    }));

    await ProductService.adjustStock(companyId, stockDeltaItems);

    // 2. Persistir o ajuste
    const currentList = loadCompanyAdjustments(companyId);
    currentList.unshift(newAdjustment);
    saveCompanyAdjustments(companyId, currentList);

    return newAdjustment;
  }

  /**
   * Exclui um ajuste de estoque com reversão do saldo dos produtos
   */
  static async delete(companyId: string, id: string): Promise<boolean> {
    const list = loadCompanyAdjustments(companyId);
    const existingIndex = list.findIndex((a) => a.id === id);

    if (existingIndex === -1) {
      throw new Error('Ajuste de estoque não encontrado.');
    }

    const adjustment = list[existingIndex];

    // Reverter o estoque dos produtos no catálogo (inverte o delta)
    const stockRevertItems = adjustment.items.map((item) => ({
      productId: item.productId,
      locationId: adjustment.locationId,
      quantityDelta: -item.quantity,
    }));

    await ProductService.adjustStock(companyId, stockRevertItems);

    // Remover da lista
    list.splice(existingIndex, 1);
    saveCompanyAdjustments(companyId, list);

    return true;
  }
}
