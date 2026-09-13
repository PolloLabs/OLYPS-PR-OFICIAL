export type StockAdjustmentType = 'normal' | 'abnormal';

export interface StockAdjustmentItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode?: string | null;
  currentStock: number;
  quantity: number; // positive or negative
  stockAfter: number;
  unitCost: number;
  subtotal: number;
}

export interface StockAdjustment {
  id: string;
  companyId: string;
  referenceNumber: string; // e.g. AJE-0001
  adjustmentDate: string; // YYYY-MM-DD or ISO string
  locationId: string;
  locationName: string;
  type: StockAdjustmentType; // 'normal' | 'abnormal'
  totalAmount: number;
  totalRecovered: number;
  reason: string;
  addedBy: string;
  items: StockAdjustmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockAdjustmentPayload {
  referenceNumber?: string;
  adjustmentDate: string;
  locationId: string;
  locationName?: string;
  type: StockAdjustmentType;
  totalAmount?: number;
  totalRecovered?: number;
  reason?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    barcode?: string | null;
    currentStock: number;
    quantity: number;
    unitCost: number;
  }>;
}

export interface StockAdjustmentFilters {
  startDate?: string;
  endDate?: string;
  type?: 'all' | 'normal' | 'abnormal';
  locationId?: string;
  search?: string;
}

export interface StockAdjustmentKpis {
  totalAdjustments: number;
  totalAdjustedAmount: number;
  totalRecoveredAmount: number;
  abnormalAdjustments: number;
}
