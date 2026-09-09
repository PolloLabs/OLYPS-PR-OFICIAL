import type {
  POSRecord,
  POSProduct,
  POSItem,
  POSExpense,
  POSCashRegister,
  POSAlert,
  POSQuote,
} from '../../types/pdv.types.js';

// ============================================
// SERVIÇO DE POS (PONTO DE VENDA) - OLYPS PRO
// ============================================

const posRecordsStore = new Map<string, POSRecord>();
const posExpensesStore = new Map<string, POSExpense>();
const posCashRegistersStore = new Map<string, POSCashRegister>();
const posQuotesStore = new Map<string, POSQuote>();

// Catálogo padrão de produtos do POS com os códigos solicitados
export const DEFAULT_POS_PRODUCTS: POSProduct[] = [
  {
    id: 'pos-prod-01',
    name: 'Câmera Frontal iPhone 13 Pro Max',
    code: 'EL100954',
    sku: 'CAM-FRT-IP13PM',
    barcode: '7891000100954',
    category: 'Câmeras',
    brand: 'Apple',
    price: 320.0,
    imTaxPrice: 352.0,
    stock: 14,
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&q=80',
  },
  {
    id: 'pos-prod-02',
    name: 'Câmera Traseira Samsung Galaxy S22 Ultra',
    code: 'EL100891',
    sku: 'CAM-TRS-S22U',
    barcode: '7891000100891',
    category: 'Câmeras',
    brand: 'Samsung',
    price: 450.0,
    imTaxPrice: 495.0,
    stock: 9,
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&q=80',
  },
  {
    id: 'pos-prod-03',
    name: 'Módulo de Display OLED Xiaomi 12',
    code: 'EL100890',
    sku: 'DSP-OLED-MI12',
    barcode: '7891000100890',
    category: 'Telas',
    brand: 'Xiaomi',
    price: 580.0,
    imTaxPrice: 638.0,
    stock: 6,
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&q=80',
  },
  {
    id: 'pos-prod-04',
    name: 'Bateria Original iPhone 12 / 12 Pro 2815mAh',
    code: 'EL100939',
    sku: 'BAT-IP12-ORIG',
    barcode: '7891000100939',
    category: 'Baterias',
    brand: 'Apple',
    price: 210.0,
    imTaxPrice: 231.0,
    stock: 22,
    imageUrl: 'https://images.unsplash.com/photo-1609592424368-450ef7773229?w=300&q=80',
  },
  {
    id: 'pos-prod-05',
    name: 'Conector de Carga Flex Type-C Moto G82',
    code: 'EL100912',
    sku: 'FLX-CHG-G82',
    barcode: '7891000100912',
    category: 'Conectores',
    brand: 'Motorola',
    price: 75.0,
    imTaxPrice: 82.5,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&q=80',
  },
  {
    id: 'pos-prod-06',
    name: 'Alto-Falante Auricular Samsung A53 5G',
    code: 'EL100965',
    sku: 'SPK-AUR-A53',
    barcode: '7891000100965',
    category: 'Áudio',
    brand: 'Samsung',
    price: 65.0,
    imTaxPrice: 71.5,
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80',
  },
  {
    id: 'pos-prod-07',
    name: 'Fonte Carregador Turbo 67W GaN Xiaomi',
    code: 'EL100980',
    sku: 'CHG-GAN-67W',
    barcode: '7891000100980',
    category: 'Acessórios',
    brand: 'Xiaomi',
    price: 180.0,
    imTaxPrice: 198.0,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&q=80',
  },
  {
    id: 'pos-prod-08',
    name: 'Película Hidrogel Fosca Premium Universal',
    code: 'EL100774',
    sku: 'PEL-HDG-UNIV',
    barcode: '7891000100774',
    category: 'Acessórios',
    brand: 'Universal',
    price: 35.0,
    imTaxPrice: 38.5,
    stock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=300&q=80',
  },
];

// Garantir registros de demonstração para a lista de POS
function ensureSeedPOSData(companyId: string) {
  const existing = Array.from(posRecordsStore.values()).filter(
    (p) => p.companyId === companyId
  );
  if (existing.length === 0) {
    const pos1Id = crypto.randomUUID();
    const pos1: POSRecord = {
      id: pos1Id,
      companyId,
      invoiceNumber: 'POS-2026-0001',
      sellDate: '07-09-2026 10:45',
      customerId: 'cust-fake-01',
      customerName: 'Cliente Consumidor Final',
      contactNumber: '+55 11 99999-0001',
      locationName: 'Franquia São Paulo (Loja Online SP)',
      companyLocationId: 'loc-sp',
      paymentStatus: 'paid',
      paymentMethod: 'Dinheiro',
      totalAmount: 390.5,
      totalPaid: 390.5,
      sellDue: 0.0,
      shippingStatus: 'delivered',
      totalItems: 2,
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'pos-prod-01',
          productName: 'Câmera Frontal iPhone 13 Pro Max',
          code: 'EL100954',
          quantity: 1,
          unitPrice: 320.0,
          imTaxPrice: 352.0,
          subtotal: 352.0,
          discount: 0,
          taxRate: 10,
        },
        {
          id: crypto.randomUUID(),
          productId: 'pos-prod-08',
          productName: 'Película Hidrogel Fosca Premium Universal',
          code: 'EL100774',
          quantity: 1,
          unitPrice: 35.0,
          imTaxPrice: 38.5,
          subtotal: 38.5,
          discount: 0,
          taxRate: 10,
        },
      ],
      addedBy: 'Admin Geral',
      isSubscription: false,
      createdAt: '2026-09-07T10:45:00.000Z',
    };

    const pos2Id = crypto.randomUUID();
    const pos2: POSRecord = {
      id: pos2Id,
      companyId,
      invoiceNumber: 'POS-2026-0002',
      sellDate: '07-09-2026 09:12',
      customerId: 'cust-fake-02',
      customerName: 'Marcos Silveira Informática',
      contactNumber: '+55 11 98844-3322',
      locationName: 'Franquia São Paulo (Loja Online SP)',
      companyLocationId: 'loc-sp',
      paymentStatus: 'paid',
      paymentMethod: 'Cartão de Crédito',
      totalAmount: 638.0,
      totalPaid: 638.0,
      sellDue: 0.0,
      shippingStatus: 'delivered',
      totalItems: 1,
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'pos-prod-03',
          productName: 'Módulo de Display OLED Xiaomi 12',
          code: 'EL100890',
          quantity: 1,
          unitPrice: 580.0,
          imTaxPrice: 638.0,
          subtotal: 638.0,
          discount: 0,
          taxRate: 10,
        },
      ],
      addedBy: 'Admin Geral',
      isSubscription: false,
      createdAt: '2026-09-07T09:12:00.000Z',
    };

    const pos3Id = crypto.randomUUID();
    const pos3: POSRecord = {
      id: pos3Id,
      companyId,
      invoiceNumber: 'POS-2026-0003',
      sellDate: '06-09-2026 17:30',
      customerId: 'cust-fake-03',
      customerName: 'Oficina do Celular Express',
      contactNumber: '+55 11 97722-1100',
      locationName: 'Franquia São Paulo (Loja Online SP)',
      companyLocationId: 'loc-sp',
      paymentStatus: 'partial',
      paymentMethod: 'Múltiplo (PIX + Dinheiro)',
      totalAmount: 513.5,
      totalPaid: 300.0,
      sellDue: 213.5,
      shippingStatus: 'delivered',
      totalItems: 2,
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'pos-prod-02',
          productName: 'Câmera Traseira Samsung Galaxy S22 Ultra',
          code: 'EL100891',
          quantity: 1,
          unitPrice: 450.0,
          imTaxPrice: 495.0,
          subtotal: 495.0,
          discount: 0,
          taxRate: 10,
        },
        {
          id: crypto.randomUUID(),
          productId: 'pos-prod-05',
          productName: 'Conector de Carga Flex Type-C Moto G82',
          code: 'EL100912',
          quantity: 1,
          unitPrice: 75.0,
          imTaxPrice: 18.5,
          subtotal: 18.5,
          discount: 0,
          taxRate: 10,
        },
      ],
      addedBy: 'Admin Geral',
      isSubscription: false,
      createdAt: '2026-09-06T17:30:00.000Z',
    };

    posRecordsStore.set(pos1Id, pos1);
    posRecordsStore.set(pos2Id, pos2);
    posRecordsStore.set(pos3Id, pos3);
  }
}

export class POSService {
  static async getPOSRecords(companyId: string): Promise<POSRecord[]> {
    ensureSeedPOSData(companyId);
    return Array.from(posRecordsStore.values())
      .filter((p) => p.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getPOSById(companyId: string, id: string): Promise<POSRecord | null> {
    ensureSeedPOSData(companyId);
    const item = posRecordsStore.get(id);
    if (!item || item.companyId !== companyId) return null;
    return item;
  }

  static async createPOSRecord(
    companyId: string,
    payload: Partial<POSRecord>
  ): Promise<POSRecord> {
    ensureSeedPOSData(companyId);

    const now = new Date();
    const newId = crypto.randomUUID();
    const invCount = Array.from(posRecordsStore.values()).filter(
      (p) => p.companyId === companyId
    ).length + 1;
    const invoiceNumber =
      payload.invoiceNumber ||
      `POS-${now.getFullYear()}-${String(invCount).padStart(4, '0')}`;

    const rawItems: any[] = payload.items || [];
    const items: POSItem[] = rawItems.map((it) => ({
      id: it.id || crypto.randomUUID(),
      productId: it.productId || 'prod-custom',
      productName: it.productName || it.nome || it.name || 'Produto',
      code: it.code || it.codigo || it.sku || 'PDV-ITEM',
      sku: it.sku || it.codigo,
      quantity: Number(it.quantity ?? it.quantidade ?? 1),
      unitPrice: Number(it.unitPrice ?? it.precoUnitario ?? it.price ?? 0),
      imTaxPrice: Number(it.imTaxPrice ?? 0),
      subtotal: Number(it.subtotal ?? ((Number(it.unitPrice ?? it.precoUnitario ?? 0)) * Number(it.quantity ?? it.quantidade ?? 1))),
      discount: Number(it.discount ?? it.desconto ?? 0),
      taxRate: Number(it.taxRate ?? it.imposto ?? 0),
      imageUrl: it.imageUrl,
      nome: it.nome || it.productName || it.name,
      quantidade: Number(it.quantidade ?? it.quantity ?? 1),
      precoUnitario: Number(it.precoUnitario ?? it.unitPrice ?? 0),
    }));
    const totalItems = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    const totalAmount = Number(payload.totalAmount ?? (payload as any).total) || items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
    const totalPaid = Number(payload.totalPaid ?? (payload as any).valorPago) || totalAmount;
    const sellDue = Math.max(0, totalAmount - totalPaid);

    const record: POSRecord = {
      id: newId,
      companyId,
      invoiceNumber,
      sellDate: payload.sellDate || '07-09-2026 11:03',
      customerId: payload.customerId || 'cust-fake-01',
      customerName: payload.customerName || (payload as any).cliente || 'Cliente Consumidor Final',
      contactNumber: payload.contactNumber || '+55 11 99999-0000',
      locationName: payload.locationName || 'Franquia São Paulo (Loja Online SP)',
      companyLocationId: payload.companyLocationId || 'loc-sp',
      paymentStatus:
        sellDue <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending',
      paymentMethod: payload.paymentMethod || (payload as any).formaPagamento || 'Dinheiro',
      totalAmount,
      totalPaid,
      sellDue,
      shippingStatus: (payload.shippingStatus as any) || 'delivered',
      totalItems,
      items,
      addedBy: payload.addedBy || 'Admin Geral',
      isSubscription: !!payload.isSubscription,
      notes: payload.notes || '',
      createdAt: now.toISOString(),
    };

    posRecordsStore.set(newId, record);
    return record;
  }

  static async deletePOSRecord(companyId: string, id: string): Promise<boolean> {
    ensureSeedPOSData(companyId);
    const existing = posRecordsStore.get(id);
    if (!existing || existing.companyId !== companyId) {
      throw new Error(`Registro POS com ID ${id} não encontrado.`);
    }
    posRecordsStore.delete(id);
    return true;
  }

  static async createExpense(
    companyId: string,
    payload: { amount: number; category: string; note: string }
  ): Promise<POSExpense> {
    const expense: POSExpense = {
      id: crypto.randomUUID(),
      companyId,
      amount: Number(payload.amount) || 0,
      category: payload.category || 'Geral',
      note: payload.note || '',
      createdAt: new Date().toISOString(),
    };
    posExpensesStore.set(expense.id, expense);
    return expense;
  }

  static async getExpenses(companyId: string): Promise<POSExpense[]> {
    const list: POSExpense[] = [];
    for (const exp of posExpensesStore.values()) {
      if (exp.companyId === companyId) {
        list.push(exp);
      }
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async getCashRegister(companyId: string): Promise<POSCashRegister> {
    const existing = posCashRegistersStore.get(companyId);
    if (existing) {
      return existing;
    }
    // Caixa padrão inicial
    const defaultRegister: POSCashRegister = {
      id: crypto.randomUUID(),
      companyId,
      isOpen: true,
      openedAt: '07-09-2026 08:00:00',
      initialCash: 250.0,
      currentCash: 1480.0,
      totalSalesCash: 1230.0,
      totalExpenses: 0.0,
      notes: 'Abertura de turno normal de vendas POS',
      openedBy: 'Operador Caixa 01',
    };
    posCashRegistersStore.set(companyId, defaultRegister);
    return defaultRegister;
  }

  static async updateCashRegister(
    companyId: string,
    payload: Partial<POSCashRegister>
  ): Promise<POSCashRegister> {
    const current = await this.getCashRegister(companyId);
    const updated: POSCashRegister = {
      ...current,
      ...payload,
      companyId,
    };
    if (payload.closingCash !== undefined) {
      updated.difference = Number(payload.closingCash) - updated.currentCash;
    }
    posCashRegistersStore.set(companyId, updated);
    return updated;
  }

  static async createQuote(companyId: string, payload: any): Promise<POSQuote> {
    const quoteCount = Array.from(posQuotesStore.values()).filter(
      (q) => q.companyId === companyId
    ).length;
    const quoteNumber = `COT-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, '0')}`;

    const quote: POSQuote = {
      id: crypto.randomUUID(),
      companyId,
      quoteNumber,
      customerId: payload.customerId || 'cust-fake-01',
      customerName: payload.customerName || 'Cliente Consumidor Final',
      validUntil: payload.validUntil || '14-09-2026',
      totalAmount: Number(payload.totalAmount) || 0,
      items: payload.items || [],
      notes: payload.notes || 'Cotação gerada diretamente pelo Terminal POS',
      createdAt: new Date().toISOString(),
    };
    posQuotesStore.set(quote.id, quote);
    return quote;
  }

  static async getQuotes(companyId: string): Promise<POSQuote[]> {
    const list: POSQuote[] = [];
    for (const q of posQuotesStore.values()) {
      if (q.companyId === companyId) {
        list.push(q);
      }
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async getAlerts(companyId: string): Promise<POSAlert[]> {
    // Alertas de exemplo baseados no estoque e pagamentos
    return [
      {
        id: 'alt-01',
        type: 'low_stock',
        title: 'Estoque Crítico: Display OLED Xiaomi 12',
        description: 'Restam apenas 6 unidades no inventário da loja.',
        timestamp: '10 min atrás',
        severity: 'warning',
        isRead: false,
      },
      {
        id: 'alt-02',
        type: 'low_stock',
        title: 'Estoque Baixo: Câmera Traseira S22 Ultra',
        description: 'Restam 9 unidades no inventário.',
        timestamp: '25 min atrás',
        severity: 'warning',
        isRead: false,
      },
      {
        id: 'alt-03',
        type: 'pending_payment',
        title: 'Pagamento Parcial Pendente',
        description: 'Fatura POS-2026-0004 possui saldo devedor de R$ 132,00.',
        timestamp: '1 hora atrás',
        severity: 'info',
        isRead: false,
      },
      {
        id: 'alt-04',
        type: 'due_date',
        title: 'Vencimento de Venda a Crédito',
        description: 'Venda a crédito #POS-003 vence nos próximos 3 dias.',
        timestamp: '2 horas atrás',
        severity: 'info',
        isRead: true,
      },
    ];
  }

  static async getCatalogProducts(): Promise<POSProduct[]> {
    return DEFAULT_POS_PRODUCTS;
  }
}

export const PDVService = POSService;
export const DEFAULT_PDV_PRODUCTS = DEFAULT_POS_PRODUCTS;
