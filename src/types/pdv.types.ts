// ============================================
// TIPOS DO MÓDULO POS (PONTO DE VENDA) - OLYPS PRO
// ============================================

import type { SellPaymentStatus, SellShippingStatus } from './sell.types.js';

export interface POSItem {
  id: string;
  productId: string;
  productName: string;
  code: string; // Ex: EL100890
  sku?: string;
  quantity: number;
  unitPrice: number;
  imTaxPrice: number; // Preço com imposto
  subtotal: number;
  discount: number;
  taxRate: number;
  imageUrl?: string;
  // Compatibilidade com PDVItem
  nome?: string;
  quantidade?: number;
  precoUnitario?: number;
}

export interface POSProduct {
  id: string;
  name: string;
  code: string; // Ex: EL100890, EL100954
  sku: string;
  barcode?: string;
  category: string;
  brand: string;
  price: number;
  imTaxPrice: number;
  stock: number;
  imageUrl: string;
}

export type POSPaymentMethod =
  | 'cash'
  | 'card'
  | 'credit_sale'
  | 'multiple'
  | 'quote'
  | 'pix'
  | 'other';

export const POS_PAYMENT_METHOD_LABELS: Record<POSPaymentMethod, string> = {
  cash: 'Dinheiro',
  card: 'Cartão',
  credit_sale: 'Venda de crédito',
  multiple: 'Pagamento múltiplo',
  quote: 'Cotação',
  pix: 'PIX',
  other: 'Outro',
};

export interface POSTotals {
  totalItems: number;
  subtotal: number;
  discountValue: number;
  cashbackValue: number;
  cashBack?: number;
  orderTaxValue: number;
  shippingValue: number;
  totalToPay: number;
}

export interface POSRecord {
  id: string;
  companyId: string;
  invoiceNumber: string;
  sellDate: string; // Ex: 07-09-2026 11:03
  customerId: string;
  customerName: string;
  contactNumber: string;
  locationName: string;
  companyLocationId: string;
  paymentStatus: SellPaymentStatus;
  paymentMethod: string;
  totalAmount: number;
  totalPaid: number;
  sellDue: number; // Vender devedor
  shippingStatus: SellShippingStatus | 'none';
  totalItems: number;
  items: POSItem[];
  discountValue?: number;
  cashbackValue?: number;
  cashBack?: number;
  orderTaxValue?: number;
  shippingValue?: number;
  addedBy: string;
  isSubscription?: boolean;
  notes?: string;
  createdAt: string;
}

export interface POSFilterValues {
  searchTerm: string;
  location: string;
  customer: string;
  paymentStatus: string;
  dateRange: string;
  user: string;
  shippingStatus: string;
  isSubscription: boolean;
}

export interface POSExpense {
  id: string;
  companyId: string;
  amount: number;
  category: string;
  note: string;
  createdAt: string;
}

export interface POSCashRegister {
  id: string;
  companyId: string;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
  initialCash: number;
  currentCash: number;
  closingCash?: number;
  difference?: number;
  totalSalesCash: number;
  totalExpenses: number;
  notes?: string;
  openedBy: string;
}

export interface POSAlert {
  id: string;
  type: 'low_stock' | 'pending_payment' | 'due_date';
  title: string;
  description: string;
  timestamp: string;
  severity: 'warning' | 'error' | 'info';
  isRead?: boolean;
}

export interface POSQuote {
  id: string;
  companyId: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  validUntil: string;
  totalAmount: number;
  discountValue?: number;
  cashbackValue?: number;
  cashBack?: number;
  items: POSItem[];
  notes?: string;
  createdAt: string;
}

export interface CompletedSaleReceipt {
  items: POSItem[];
  customer?: any;
  subtotal: number;
  discountValue: number;
  cashbackValue: number;
  orderTaxValue: number;
  shippingValue: number;
  totalToPay: number;
  paymentMethod: string;
  invoiceNumber: string;
  date: string;
}

// Aliases para nomenclatura PDV
export interface PDVItem {
  id: string;
  productId: string;
  nome: string;
  sku?: string;
  precoUnitario: number;
  quantidade: number;
  subtotal: number;
  imTaxPrice?: number;
  productName?: string;
  code?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  taxRate?: number;
  imageUrl?: string;
}

export type PDVFormaPagamento =
  | 'cotacao'
  | 'credito'
  | 'cartao'
  | 'multiplo'
  | 'dinheiro'
  | 'pix'
  | 'boleto';

export interface PDVData {
  companyId: string;
  cliente?: string;
  items: PDVItem[];
  subtotal: number;
  desconto: number;
  cashBack: number;
  imposto: number;
  envio: number;
  total: number;
  formaPagamento: PDVFormaPagamento | string;
  dataVenda?: Date | string;
  valorPago?: number;
  troco?: number;
  [key: string]: any;
}

export type PDVProduct = POSProduct;
export type PDVPaymentMethod = POSPaymentMethod;
export const PDV_PAYMENT_METHOD_LABELS = POS_PAYMENT_METHOD_LABELS;
export type PDVTotals = POSTotals;
export type PDVRecord = POSRecord;
export type PDVFilterValues = POSFilterValues;
export type PDVExpense = POSExpense;
export type PDVCashRegister = POSCashRegister;
export type PDVAlert = POSAlert;
export type PDVQuote = POSQuote;
