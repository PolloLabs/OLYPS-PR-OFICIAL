import type {
  SellRecord,
  SellProductItem,
  SellPayment,
  SellPaymentStatus,
} from '../../types/sell.types.js';

// ============================================
// SERVIÇO DE VENDAS (SELLS) - PERSISTÊNCIA VIA STORE / JSONB
// ============================================

const sellsStore = new Map<string, SellRecord>();

// Inicialização com dados de demonstração realistas
function ensureSeedData(companyId: string) {
  const existing = Array.from(sellsStore.values()).filter((s) => s.companyId === companyId);
  if (existing.length === 0) {
    const s1Id = crypto.randomUUID();
    const s1: SellRecord = {
      id: s1Id,
      companyId,
      invoiceNumber: 'FAT-2026-0012',
      invoiceScheme: 'fatura_facil',
      customerId: 'cust-001',
      customerName: 'TechCorp Soluções Tecnológicas Ltda',
      contactNumber: '+55 11 98877-6655',
      billingAddress: 'Av. Paulista, 1000 - Conj 101, São Paulo/SP',
      shippingAddress: 'Av. Paulista, 1000 - Conj 101, São Paulo/SP',
      companyLocationId: 'loc-sp',
      locationName: 'Franquia São Paulo',
      sellDate: '07-09-2026 10:26 AM',
      status: 'final',
      paymentStatus: 'paid',
      paymentTerm: 'prazo_de',
      paymentTermDays: 30,
      userName: 'Admin Geral',
      isSubscription: false,
      attachedDocumentName: 'proposta_comercial_assinado.pdf',
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'prod-001',
          productName: 'Notebook Dell Latitude 5430 Core i7 16GB',
          sku: 'DELL-LAT-5430',
          barcode: '7891234567890',
          quantity: 2,
          unitPrice: 4850.0,
          discountPercentage: 5,
          discountAmount: 485.0,
          taxRate: 10,
          taxAmount: 921.5,
          imTaxPrice: 5069.25,
          subtotal: 9651.5,
        },
        {
          id: crypto.randomUUID(),
          productId: 'prod-002',
          productName: 'Monitor Dell 27 4K UHD UltraSharp',
          sku: 'DELL-MON-4K',
          barcode: '7891234567891',
          quantity: 2,
          unitPrice: 2200.0,
          discountPercentage: 0,
          discountAmount: 0,
          taxRate: 10,
          taxAmount: 440.0,
          imTaxPrice: 2420.0,
          subtotal: 4840.0,
        },
      ],
      discountType: 'percentage',
      discountValue: 0,
      discountTotal: 0,
      cashback: {
        redeemed: 0,
        accessible: 150.0,
        redeemedValue: 0,
      },
      orderTaxRate: 0,
      orderTaxType: 'none',
      orderTaxTotal: 0,
      saleNote: 'Venda corporativa faturada via Franquia SP.',
      shipping: {
        shippingDetails: 'Transportadora Jadlog Express - Envio Prioritário',
        shippingAddress: 'Av. Paulista, 1000 - Conj 101, São Paulo/SP',
        shippingCost: 80.0,
        shippingStatus: 'delivered',
        deliveredTo: 'Marcos Silveira (Recepção)',
        deliveryPerson: 'Carlos Eduardo',
        shippingDocumentName: 'comprovante_entrega_0012.pdf',
      },
      totalQuantity: 4,
      itemsTotal: 14491.5,
      totalAmount: 14571.5,
      totalPaid: 14571.5,
      sellDue: 0.0,
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 14571.5,
          paidAt: '07-09-2026 10:26 AM',
          paymentMethod: 'pix',
          paymentNote: 'PIX autenticado no ato da entrega',
          changeReturn: 0,
          balance: 0,
        },
      ],
      createdAt: '2026-09-07T08:30:00.000Z',
      updatedAt: '2026-09-07T08:30:00.000Z',
    };

    const s2Id = crypto.randomUUID();
    const s2: SellRecord = {
      id: s2Id,
      companyId,
      invoiceNumber: 'FAT-2026-0013',
      invoiceScheme: 'fatura_facil',
      customerId: 'cust-002',
      customerName: 'Inova Digital Comércio e Serviços',
      contactNumber: '+55 11 97711-2233',
      billingAddress: 'Rua Bela Cintra, 450, São Paulo/SP',
      shippingAddress: 'Rua Bela Cintra, 450, São Paulo/SP',
      companyLocationId: 'loc-sp',
      locationName: 'Franquia São Paulo',
      sellDate: '06-09-2026 14:15 PM',
      status: 'final',
      paymentStatus: 'partial',
      paymentTerm: 'prazo_de',
      paymentTermDays: 15,
      userName: 'Vendedor Loja',
      isSubscription: false,
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'prod-003',
          productName: 'Teclado Mecânico Logitech MX Keys',
          sku: 'LOGI-MX-KEYS',
          barcode: '7891234567892',
          quantity: 5,
          unitPrice: 650.0,
          discountPercentage: 10,
          discountAmount: 325.0,
          taxRate: 5,
          taxAmount: 146.25,
          imTaxPrice: 614.25,
          subtotal: 3071.25,
        },
      ],
      discountType: 'none',
      discountValue: 0,
      discountTotal: 0,
      cashback: {
        redeemed: 0,
        accessible: 80.0,
        redeemedValue: 0,
      },
      orderTaxRate: 0,
      orderTaxType: 'none',
      orderTaxTotal: 0,
      saleNote: 'Entrada de 50% paga e saldo para 15 dias.',
      shipping: {
        shippingDetails: 'Retirada no balcão',
        shippingAddress: 'Rua Bela Cintra, 450, São Paulo/SP',
        shippingCost: 0,
        shippingStatus: 'delivered',
        deliveredTo: 'Ana Paula',
        deliveryPerson: 'Balcão',
      },
      totalQuantity: 5,
      itemsTotal: 3071.25,
      totalAmount: 3071.25,
      totalPaid: 1500.0,
      sellDue: 1571.25,
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 1500.0,
          paidAt: '06-09-2026 14:15 PM',
          paymentMethod: 'cash',
          paymentNote: 'Entrada paga em dinheiro',
          changeReturn: 0,
          balance: 1571.25,
        },
      ],
      createdAt: '2026-09-06T14:15:00.000Z',
      updatedAt: '2026-09-06T14:15:00.000Z',
    };

    const s3Id = crypto.randomUUID();
    const s3: SellRecord = {
      id: s3Id,
      companyId,
      invoiceNumber: 'FAT-2026-0014',
      invoiceScheme: 'fatura_facil',
      customerId: 'cust-003',
      customerName: 'Consultoria Alfa & Gestão',
      contactNumber: '+55 21 99123-4567',
      billingAddress: 'Av. Rio Branco, 156 - Sala 802, Rio de Janeiro/RJ',
      shippingAddress: 'Av. Rio Branco, 156 - Sala 802, Rio de Janeiro/RJ',
      companyLocationId: 'loc-rj',
      locationName: 'Filial Rio de Janeiro',
      sellDate: '05-09-2026 09:30 AM',
      status: 'final',
      paymentStatus: 'due',
      paymentTerm: 'prazo_de',
      paymentTermDays: 30,
      userName: 'Admin Geral',
      isSubscription: true,
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'prod-004',
          productName: 'Licença Anual Olyps Pro Cloud Multi-Empresa',
          sku: 'LIC-OLYPS-PRO',
          barcode: '7891234567893',
          quantity: 1,
          unitPrice: 2400.0,
          discountPercentage: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          imTaxPrice: 2400.0,
          subtotal: 2400.0,
        },
      ],
      discountType: 'none',
      discountValue: 0,
      discountTotal: 0,
      orderTaxRate: 0,
      orderTaxType: 'none',
      orderTaxTotal: 0,
      saleNote: 'Assinatura anual faturada com boleto para 30 dias.',
      shipping: {
        shippingCost: 0,
        shippingStatus: 'delivered',
        shippingDetails: 'Ativação digital online',
      },
      totalQuantity: 1,
      itemsTotal: 2400.0,
      totalAmount: 2400.0,
      totalPaid: 0,
      sellDue: 2400.0,
      payments: [],
      createdAt: '2026-09-05T09:30:00.000Z',
      updatedAt: '2026-09-05T09:30:00.000Z',
    };

    sellsStore.set(s1Id, s1);
    sellsStore.set(s2Id, s2);
    sellsStore.set(s3Id, s3);
  }
}

export class SellService {
  static async getSells(companyId: string): Promise<SellRecord[]> {
    ensureSeedData(companyId);
    const list = Array.from(sellsStore.values())
      .filter((s) => s.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  static async getSellById(companyId: string, sellId: string): Promise<SellRecord | null> {
    ensureSeedData(companyId);
    const sell = sellsStore.get(sellId);
    if (!sell || sell.companyId !== companyId) {
      return null;
    }
    return sell;
  }

  static async createSell(companyId: string, payload: Partial<SellRecord>): Promise<SellRecord> {
    ensureSeedData(companyId);

    // Gerar número de fatura sequencial se não informado
    let invoiceNumber = (payload.invoiceNumber || '').trim();
    if (!invoiceNumber) {
      const existing = Array.from(sellsStore.values()).filter((s) => s.companyId === companyId);
      const nextSeq = String(existing.length + 1).padStart(4, '0');
      invoiceNumber = `FAT-2026-${nextSeq}`;
    }

    const items: SellProductItem[] = payload.items || [];
    const totalQuantity = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
    const itemsTotal = items.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);

    const shippingCost = Number(payload.shipping?.shippingCost) || 0;
    const discountTotal = Number(payload.discountTotal) || 0;
    const cashbackRedeemed = Number(payload.cashback?.redeemedValue) || 0;
    const orderTaxTotal = Number(payload.orderTaxTotal) || 0;

    // Total final da venda
    const totalAmount = Math.max(
      0,
      itemsTotal - discountTotal - cashbackRedeemed + orderTaxTotal + shippingCost
    );

    const payments: SellPayment[] = payload.payments || [];
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const sellDue = Math.max(0, totalAmount - totalPaid);

    let paymentStatus: SellPaymentStatus = 'due';
    if (totalPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'due';
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newRecord: SellRecord = {
      id: newId,
      companyId,
      invoiceNumber,
      invoiceScheme: payload.invoiceScheme || 'fatura_facil',
      customerId: payload.customerId || 'cust-001',
      customerName: payload.customerName || 'Cliente Balcão',
      contactNumber: payload.contactNumber || '',
      billingAddress: payload.billingAddress || '',
      shippingAddress: payload.shippingAddress || '',
      companyLocationId: payload.companyLocationId || 'loc-sp',
      locationName: payload.locationName || 'Franquia São Paulo',
      sellDate: payload.sellDate || '07-09-2026 10:26 AM',
      status: payload.status || 'final',
      paymentStatus,
      paymentTerm: payload.paymentTerm || 'prazo_de',
      paymentTermDays: payload.paymentTermDays || 0,
      userName: payload.userName || 'Admin Geral',
      isSubscription: Boolean(payload.isSubscription),
      attachedDocumentName: payload.attachedDocumentName,
      items,
      discountType: payload.discountType || 'percentage',
      discountValue: Number(payload.discountValue) || 0,
      discountTotal,
      cashback: payload.cashback || {
        redeemed: 0,
        accessible: 0,
        redeemedValue: 0,
      },
      orderTaxRate: Number(payload.orderTaxRate) || 0,
      orderTaxType: payload.orderTaxType || 'none',
      orderTaxTotal,
      saleNote: payload.saleNote || '',
      shipping: {
        shippingDetails: payload.shipping?.shippingDetails || '',
        shippingAddress: payload.shipping?.shippingAddress || '',
        shippingCost,
        shippingStatus: payload.shipping?.shippingStatus || 'pending',
        deliveredTo: payload.shipping?.deliveredTo || '',
        deliveryPerson: payload.shipping?.deliveryPerson || '',
        shippingDocumentName: payload.shipping?.shippingDocumentName,
      },
      totalQuantity,
      itemsTotal,
      totalAmount,
      totalPaid,
      sellDue,
      payments,
      createdAt: now,
      updatedAt: now,
    };

    sellsStore.set(newId, newRecord);
    return newRecord;
  }

  static async updateSell(
    companyId: string,
    sellId: string,
    payload: Partial<SellRecord>
  ): Promise<SellRecord> {
    ensureSeedData(companyId);
    const existing = sellsStore.get(sellId);
    if (!existing || existing.companyId !== companyId) {
      throw new Error(`Venda com ID ${sellId} não encontrada.`);
    }

    const updated: SellRecord = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    sellsStore.set(sellId, updated);
    return updated;
  }

  static async deleteSell(companyId: string, sellId: string): Promise<boolean> {
    ensureSeedData(companyId);
    const existing = sellsStore.get(sellId);
    if (!existing || existing.companyId !== companyId) {
      throw new Error(`Venda com ID ${sellId} não encontrada.`);
    }
    sellsStore.delete(sellId);
    return true;
  }
}
