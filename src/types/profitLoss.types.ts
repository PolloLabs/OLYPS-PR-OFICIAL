/**
 * Tipos para o Relatório de Lucros / Perdas (DRE Gerencial)
 */

export interface ProfitLossKPIs {
  revenue: number;
  cmv: number;
  grossProfit: number;
  netProfit: number;
  grossMarginPercent: number;
  netMarginPercent: number;
  // Comparativo com período anterior
  previousRevenue?: number;
  previousCmv?: number;
  previousGrossProfit?: number;
  previousNetProfit?: number;
  previousNetMarginPercent?: number;
  revenueDelta?: number;
  cmvDelta?: number;
  grossProfitDelta?: number;
  netProfitDelta?: number;
  netMarginDelta?: number;
}

export interface ProfitLossStockPurchases {
  openingStockCost: number;
  openingStockSale: number;
  totalPurchases: number;
  stockAdjustments: number;
  operationalExpenses: number;
  purchaseShipping: number;
  purchaseDiscounts: number;
}

export interface ProfitLossSalesBreakdown {
  closingStockCost: number;
  closingStockSale: number;
  totalSales: number;
  salesShipping: number;
  additionalExpenses: number;
  recoveredStock: number;
  refunds: number;
  salesDiscounts: number;
  roundedSales: number;
  salesReturns: number;
}

export interface ProfitLossDailyPoint extends Record<string, unknown> {
  date: string;
  dayLabel: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ProfitLossProductRow extends Record<string, unknown> {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export interface ProfitLossCategoryRow extends Record<string, unknown> {
  category: string;
  itemsCount: number;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export interface ProfitLossBrandRow extends Record<string, unknown> {
  brand: string;
  itemsCount: number;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export interface ProfitLossLocationRow extends Record<string, unknown> {
  locationId: string;
  locationName: string;
  salesCount: number;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export interface ProfitLossCustomerRow extends Record<string, unknown> {
  customerId: string;
  customerName: string;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export interface ProfitLossDayRow extends Record<string, unknown> {
  date: string;
  dayLabel: string;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export interface ProfitLossReportData {
  startDate: string;
  endDate: string;
  locationId: string;
  comparePrevious: boolean;
  kpis: ProfitLossKPIs;
  stockPurchases: ProfitLossStockPurchases;
  sales: ProfitLossSalesBreakdown;
  dailyChart: ProfitLossDailyPoint[];
  byProduct: ProfitLossProductRow[];
  byCategory: ProfitLossCategoryRow[];
  byBrand: ProfitLossBrandRow[];
  byLocation: ProfitLossLocationRow[];
  byCustomer: ProfitLossCustomerRow[];
  byDay: ProfitLossDayRow[];
  hasData: boolean;
}
