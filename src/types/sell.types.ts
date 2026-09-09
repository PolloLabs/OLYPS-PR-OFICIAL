// ============================================
// TIPOS DO MÓDULO DE VENDAS (SELLS) - OLYPS PRO
// ============================================

export type SellStatus = 'final' | 'draft' | 'proforma' | 'quotation';

export type SellPaymentStatus = 'paid' | 'partial' | 'pending' | 'due';

export type SellShippingStatus =
  | 'ordered'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'pending';

export type SellDiscountType = 'percentage' | 'fixed' | 'none';

export type SellTaxType = 'none' | 'percentage' | 'fixed';

export type SellPaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'bank_transfer'
  | 'check'
  | 'other';

export type InvoiceScheme = 'fatura_facil' | 'padrao' | 'simplificada';

export interface SellCustomer {
  id: string;
  name: string;
  tradeName?: string;
  document?: string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
}

export interface SellProductItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unitPrice: number; // preço unitário
  discountPercentage: number; // Discount %
  discountAmount: number; // Valor calculado do desconto
  taxRate: number; // Taxa %
  taxAmount: number; // Valor do imposto
  imTaxPrice: number; // Preço unitário com imposto
  subtotal: number; // Subtotal da linha
}

export interface SellCashback {
  redeemed: number;
  accessible: number;
  redeemedValue: number;
}

export interface SellShipping {
  shippingDetails?: string;
  shippingAddress?: string;
  shippingCost: number;
  shippingStatus: SellShippingStatus | '';
  deliveredTo?: string;
  deliveryPerson?: string;
  shippingDocumentName?: string;
}

export interface SellPayment {
  id: string;
  advanceBalance: number;
  amount: number;
  paidAt: string;
  paymentMethod: SellPaymentMethod;
  paymentNote?: string;
  changeReturn?: number; // Alterar o retorno (troco)
  balance?: number; // Saldo devedor restante
}

export interface SellRecord {
  id: string;
  companyId: string;
  invoiceNumber: string;
  invoiceScheme: string;
  customerId: string;
  customerName: string;
  contactNumber: string;
  billingAddress: string;
  shippingAddress: string;
  companyLocationId: string;
  locationName: string;
  sellDate: string;
  status: SellStatus;
  paymentStatus: SellPaymentStatus;
  paymentTerm: string;
  paymentTermDays?: number;
  userName?: string;
  isSubscription?: boolean;
  attachedDocumentName?: string;
  items: SellProductItem[];
  discountType: SellDiscountType;
  discountValue: number;
  discountTotal: number;
  cashback?: SellCashback;
  orderTaxRate: number;
  orderTaxType: SellTaxType;
  orderTaxTotal: number;
  saleNote: string;
  shipping: SellShipping;
  totalQuantity: number;
  itemsTotal: number;
  totalAmount: number; // Valor total
  totalPaid: number; // Total pago
  sellDue: number; // Vender devedor
  payments: SellPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface SellFormData {
  companyLocationId: string;
  customerId: string;
  billingAddress: string;
  shippingAddress: string;
  paymentTerm: string;
  paymentTermDays: number;
  sellDate: string;
  status: SellStatus | '';
  invoiceScheme: string;
  invoiceNumber: string;
  attachedDocument?: File;
  attachedDocumentName?: string;
  items: SellProductItem[];
  discountType: SellDiscountType;
  discountValue: number;
  discountTotal: number;
  cashbackRedeemed: number;
  cashbackAccessible: number;
  cashbackRedeemedValue: number;
  orderTaxRate: number;
  orderTaxType: SellTaxType;
  orderTaxTotal: number;
  saleNote: string;
  shipping: SellShipping;
  shippingDocument?: File;
  payments: SellPayment[];
}

export interface SellFilterValues {
  searchTerm: string;
  locationId: string;
  customerId: string;
  paymentStatus: SellPaymentStatus | 'all';
  dateRange: string;
  startDate?: string;
  endDate?: string;
  userId: string;
  shippingStatus: SellShippingStatus | 'all';
  onlySubscriptions: boolean;
}
