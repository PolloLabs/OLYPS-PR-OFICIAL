// ============================================
// TIPOS DO MÓDULO DE COMPRAS
// ============================================

export type PurchaseStatus = 'received' | 'pending' | 'requested';

export type DiscountType = 'none' | 'percentage' | 'fixed';

export type TaxType = 'none' | 'percentage' | 'fixed';

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'pix'
  | 'check'
  | 'other';

export interface PurchaseSupplier {
  id: string;
  name: string;
  tradeName?: string;
  document?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unitCostBeforeDiscount: number;
  discountPercentage: number;
  unitCostBeforeTax: number;
  subtotalBeforeTax: number;
  taxOnProducts: number;
  netCost: number;
  totalLine: number;
  profitMarginPercent: number;
  unitSalePriceWithTax: number;
}

export interface PurchasePayment {
  id: string;
  advanceBalance: number;
  amount: number;
  paidAt: Date;
  paymentMethod: PaymentMethod;
  paymentNote?: string;
}

export interface PurchaseFormData {
  supplierId: string;
  referenceNumber: string;
  purchaseDate: Date;
  status: PurchaseStatus | '';
  address: string;
  companyLocationId: string;
  paymentTerm: string;
  paymentTermDays: number;
  attachedFile?: File;
  items: PurchaseItem[];
  discountType: DiscountType;
  discountValue: number;
  discountTotal: number;
  taxType: TaxType;
  taxTotal: number;
  totalItems: number;
  totalNetValue: number;
  payments: PurchasePayment[];
  additionalNotes: string;
}

export interface PurchasePayload {
  companyId: string;
  supplierId: string;
  referenceNumber: string;
  purchaseDate: Date | string;
  status: PurchaseStatus;
  address: string;
  companyLocationId: string;
  paymentTerm: string;
  paymentTermDays: number;
  items: PurchaseItem[];
  discountType: DiscountType;
  discountValue: number;
  discountTotal: number;
  taxType: TaxType;
  taxTotal: number;
  totalItems: number;
  totalNetValue: number;
  payments: PurchasePayment[];
  additionalNotes: string;
  attachedFileName?: string;
}

export interface PurchaseRecord extends PurchasePayload {
  id: string;
  purchaseNumber: string;
  supplierName?: string;
  locationName?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PurchasePaymentStatus = 'paid' | 'partial' | 'pending';

// ============================================
// RETORNO / DEVOLUÇÃO DE COMPRAS
// ============================================
export type PurchaseReturnStatus = 'completed' | 'pending' | 'cancelled';

export interface PurchaseReturnItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantityReturned: number;
  unitCost: number;
  totalRefund: number;
  reason?: string;
}

export interface PurchaseReturnPayload {
  companyId: string;
  purchaseId?: string;
  purchaseNumber?: string;
  supplierId: string;
  supplierName?: string;
  returnDate: Date | string;
  status: PurchaseReturnStatus;
  items: PurchaseReturnItem[];
  totalRefundAmount: number;
  notes?: string;
}

export interface PurchaseReturnRecord extends PurchaseReturnPayload {
  id: string;
  returnNumber: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
