import type {
  ProfitLossReportData,
  ProfitLossKPIs,
  ProfitLossStockPurchases,
  ProfitLossSalesBreakdown,
  ProfitLossDailyPoint,
  ProfitLossProductRow,
  ProfitLossCategoryRow,
  ProfitLossBrandRow,
  ProfitLossLocationRow,
  ProfitLossCustomerRow,
  ProfitLossDayRow,
} from '../../types/profitLoss.types.js';
import { SellService } from './sellService.js';
import { POSService } from './posService.js';
import { PurchaseService } from './purchaseService.js';
import { StockAdjustmentService } from './stockAdjustmentService.js';
import { ProductService } from './productService.js';
import { CompanyService } from './companyService.js';

interface UnifiedSaleItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  tax: number;
}

interface UnifiedSale {
  id: string;
  source: 'sell' | 'pos';
  date: Date;
  dateStr: string;
  customerId: string;
  customerName: string;
  locationId: string;
  locationName: string;
  totalAmount: number;
  discountTotal: number;
  taxTotal: number;
  shippingCost: number;
  items: UnifiedSaleItem[];
}

/**
 * Função utilitária para converter diversos formatos de data para objeto Date
 */
function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const str = String(val).trim();
  // Formato brasileiro "DD-MM-YYYY HH:mm" ou "DD/MM/YYYY"
  const brMatch = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    const year = parseInt(brMatch[3], 10);
    const hour = brMatch[4] ? parseInt(brMatch[4], 10) : 0;
    const min = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
    const sec = brMatch[6] ? parseInt(brMatch[6], 10) : 0;
    const d = new Date(year, month, day, hour, min, sec);
    return isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function calculateDelta(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : current < 0 ? -100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export class ProfitLossService {
  static async getReport(
    companyId: string,
    params: {
      startDate?: string;
      endDate?: string;
      locationId?: string;
      comparePrevious?: boolean;
    }
  ): Promise<ProfitLossReportData> {
    const todayStr = new Date().toISOString().split('T')[0];
    const startDateStr = params.startDate || todayStr;
    const endDateStr = params.endDate || todayStr;
    const selectedLocationId = params.locationId && params.locationId !== 'all' ? params.locationId : undefined;
    const comparePrevious = Boolean(params.comparePrevious);

    const start = new Date(`${startDateStr}T00:00:00.000`);
    const end = new Date(`${endDateStr}T23:59:59.999`);

    // Coleta de dados das fontes existentes
    const [
      sells,
      posRecords,
      purchases,
      expenses,
      adjustmentsData,
      productsResult,
      locations,
    ] = await Promise.all([
      SellService.getSells(companyId).catch(() => []),
      POSService.getPOSRecords(companyId).catch(() => []),
      PurchaseService.getPurchases(companyId).catch(() => []),
      POSService.getExpenses(companyId).catch(() => []),
      StockAdjustmentService.list(companyId).catch(() => ({ items: [], kpis: {} as any })),
      ProductService.listProducts(companyId, { page: 1, pageSize: 3000 }).catch(() => ({ data: [], meta: {} as any })),
      CompanyService.listLocations(companyId).catch(() => []),
    ]);

    const adjustments = adjustmentsData.items || [];
    const products = productsResult.data || [];

    // Mapeamento de produtos por ID e SKU para consulta rápida de custos e metadados
    const productMap = new Map<string, any>();
    for (const prod of products) {
      if (prod.id) productMap.set(prod.id, prod);
      if (prod.sku) productMap.set(prod.sku, prod);
    }

    // Unificar vendas do módulo Sells e POS
    const unifiedSales: UnifiedSale[] = [];

    for (const s of sells) {
      const d = parseDate(s.sellDate || s.createdAt);
      if (!d) continue;

      unifiedSales.push({
        id: s.id,
        source: 'sell',
        date: d,
        dateStr: d.toISOString().split('T')[0],
        customerId: s.customerId || 'outros',
        customerName: s.customerName || 'Cliente Geral',
        locationId: s.companyLocationId || 'loc-principal',
        locationName: s.locationName || 'Loja Principal',
        totalAmount: Number(s.totalAmount || 0),
        discountTotal: Number(s.discountTotal || 0),
        taxTotal: Number(s.orderTaxTotal || 0),
        shippingCost: Number(s.shipping?.shippingCost || 0),
        items: (s.items || []).map((item) => {
          const prod = productMap.get(item.productId) || productMap.get(item.sku);
          return {
            productId: item.productId || item.sku || 'prod-item',
            productName: item.productName || 'Produto',
            sku: item.sku || prod?.sku || 'SKU-IND',
            category: prod?.categoryName || 'Geral',
            brand: prod?.brandName || 'Geral',
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            subtotal: Number(item.subtotal || item.quantity * item.unitPrice || 0),
            discount: Number(item.discountAmount || 0),
            tax: Number(item.taxAmount || 0),
          };
        }),
      });
    }

    for (const p of posRecords) {
      const d = parseDate(p.sellDate || p.createdAt);
      if (!d) continue;

      unifiedSales.push({
        id: p.id,
        source: 'pos',
        date: d,
        dateStr: d.toISOString().split('T')[0],
        customerId: p.customerId || 'outros-pos',
        customerName: p.customerName || 'Consumidor Final (PDV)',
        locationId: p.companyLocationId || 'loc-principal',
        locationName: p.locationName || 'Loja / PDV',
        totalAmount: Number(p.totalAmount || 0),
        discountTotal: 0,
        taxTotal: 0,
        shippingCost: 0,
        items: (p.items || []).map((item) => {
          const prod = productMap.get(item.productId) || productMap.get(item.code);
          return {
            productId: item.productId || item.code || 'pos-item',
            productName: item.productName || 'Produto PDV',
            sku: item.code || prod?.sku || 'SKU-POS',
            category: prod?.categoryName || 'PDV',
            brand: prod?.brandName || 'Geral',
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            subtotal: Number(item.subtotal || item.quantity * item.unitPrice || 0),
            discount: Number(item.discount || 0),
            tax: Number(item.taxRate || 0),
          };
        }),
      });
    }

    // Função interna para computar métricas de um intervalo de datas
    const computePeriodStats = (rangeStart: Date, rangeEnd: Date) => {
      // Filtrar vendas
      const filteredSales = unifiedSales.filter((sale) => {
        if (sale.date < rangeStart || sale.date > rangeEnd) return false;
        if (selectedLocationId && sale.locationId !== selectedLocationId) return false;
        return true;
      });

      // Filtrar despesas
      const filteredExpenses = expenses.filter((exp) => {
        const d = parseDate(exp.createdAt);
        if (!d) return false;
        return d >= rangeStart && d <= rangeEnd;
      });

      // Filtrar compras
      const filteredPurchases = purchases.filter((pur) => {
        const d = parseDate(pur.purchaseDate || pur.createdAt);
        if (!d) return false;
        if (selectedLocationId && pur.companyLocationId !== selectedLocationId) return false;
        return d >= rangeStart && d <= rangeEnd;
      });

      // Filtrar ajustes de estoque
      const filteredAdjustments = adjustments.filter((adj) => {
        const d = parseDate(adj.adjustmentDate || (adj as any).createdAt);
        if (!d) return false;
        if (selectedLocationId && adj.locationId !== selectedLocationId) return false;
        return d >= rangeStart && d <= rangeEnd;
      });

      // 1. Vendas e Custos
      let totalRevenue = 0;
      let totalSalesDiscounts = 0;
      let totalSalesShipping = 0;
      let totalItemsCost = 0;
      let totalQuantitySold = 0;

      const productAggregation = new Map<string, ProfitLossProductRow>();
      const categoryAggregation = new Map<string, ProfitLossCategoryRow>();
      const brandAggregation = new Map<string, ProfitLossBrandRow>();
      const locationAggregation = new Map<string, ProfitLossLocationRow>();
      const customerAggregation = new Map<string, ProfitLossCustomerRow>();
      const dayAggregation = new Map<string, ProfitLossDayRow>();

      for (const sale of filteredSales) {
        totalSalesDiscounts += sale.discountTotal;
        totalSalesShipping += sale.shippingCost;

        // Agregação por Loja
        const locRow = locationAggregation.get(sale.locationId) || {
          locationId: sale.locationId,
          locationName: sale.locationName,
          salesCount: 0,
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          marginPercent: 0,
        };
        locRow.salesCount += 1;

        // Agregação por Cliente
        const custRow = customerAggregation.get(sale.customerId) || {
          customerId: sale.customerId,
          customerName: sale.customerName,
          salesCount: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          marginPercent: 0,
        };
        custRow.salesCount += 1;

        // Agregação por Dia
        const dayKey = sale.dateStr;
        const dayRow = dayAggregation.get(dayKey) || {
          date: dayKey,
          dayLabel: `${sale.date.getDate().toString().padStart(2, '0')}/${(sale.date.getMonth() + 1).toString().padStart(2, '0')}`,
          salesCount: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          marginPercent: 0,
        };
        dayRow.salesCount += 1;

        for (const item of sale.items) {
          const prod = productMap.get(item.productId) || productMap.get(item.sku);
          // Custo unitário de compra do produto ou estimativa de 65% do preço se não houver custo explícito
          const unitCost = prod?.defaultPurchasePrice
            ? Number(prod.defaultPurchasePrice)
            : item.unitPrice > 0
            ? item.unitPrice * 0.65
            : 0;

          const itemRevenue = item.subtotal;
          const itemCost = item.quantity * unitCost;
          const itemProfit = itemRevenue - itemCost;

          totalRevenue += itemRevenue;
          totalItemsCost += itemCost;
          totalQuantitySold += item.quantity;

          locRow.quantitySold += item.quantity;
          locRow.revenue += itemRevenue;
          locRow.cost += itemCost;

          custRow.revenue += itemRevenue;
          custRow.cost += itemCost;

          dayRow.revenue += itemRevenue;
          dayRow.cost += itemCost;

          // Por Produto
          const prodKey = item.productId || item.sku;
          const pRow = productAggregation.get(prodKey) || {
            id: prodKey,
            name: item.productName,
            sku: item.sku,
            category: item.category,
            brand: item.brand,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            marginPercent: 0,
          };
          pRow.quantitySold += item.quantity;
          pRow.revenue += itemRevenue;
          pRow.cost += itemCost;
          productAggregation.set(prodKey, pRow);

          // Por Categoria
          const catKey = item.category || 'Outros';
          const cRow = categoryAggregation.get(catKey) || {
            category: catKey,
            itemsCount: 0,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            marginPercent: 0,
          };
          cRow.itemsCount += 1;
          cRow.quantitySold += item.quantity;
          cRow.revenue += itemRevenue;
          cRow.cost += itemCost;
          categoryAggregation.set(catKey, cRow);

          // Por Marca
          const brandKey = item.brand || 'Geral';
          const bRow = brandAggregation.get(brandKey) || {
            brand: brandKey,
            itemsCount: 0,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            marginPercent: 0,
          };
          bRow.itemsCount += 1;
          bRow.quantitySold += item.quantity;
          bRow.revenue += itemRevenue;
          bRow.cost += itemCost;
          brandAggregation.set(brandKey, bRow);
        }

        locationAggregation.set(sale.locationId, locRow);
        customerAggregation.set(sale.customerId, custRow);
        dayAggregation.set(dayKey, dayRow);
      }

      // 2. Ajustes de estoque (anormais entram no CMV como custo/perda)
      let abnormalAdjustmentsTotal = 0;
      let normalAdjustmentsTotal = 0;
      let totalStockRecovered = 0;

      for (const adj of filteredAdjustments) {
        const val = Number(adj.totalAmount || 0);
        const rec = Number(adj.totalRecovered || 0);
        totalStockRecovered += rec;

        if (adj.type === 'abnormal') {
          abnormalAdjustmentsTotal += val;
        } else {
          normalAdjustmentsTotal += val;
        }
      }

      // 3. Compras
      let totalPurchases = 0;
      let purchaseDiscounts = 0;
      let purchaseShipping = 0;

      for (const pur of filteredPurchases) {
        totalPurchases += Number(pur.totalNetValue || 0);
        purchaseDiscounts += Number(pur.discountTotal || 0);
      }

      // 4. Despesas operacionais
      let operationalExpenses = 0;
      for (const exp of filteredExpenses) {
        operationalExpenses += Number(exp.amount || 0);
      }

      // 5. Inventário Atual (Estoque Fechamento)
      let closingStockCost = 0;
      let closingStockSale = 0;

      for (const prod of products) {
        const stock = Number(prod.currentStock || 0);
        const cost = Number(prod.defaultPurchasePrice || (Number(prod.defaultSalePrice || 0) * 0.65));
        const sale = Number(prod.defaultSalePrice || 0);

        closingStockCost += stock * cost;
        closingStockSale += stock * sale;
      }

      // CMV e Fórmulas de Lucro
      const cmv = totalItemsCost + abnormalAdjustmentsTotal;
      const grossProfit = totalRevenue - cmv;
      const netProfit = grossProfit - operationalExpenses - totalSalesShipping + totalStockRecovered;

      const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Estoque de Abertura calculado por balanço patrimonial
      const openingStockCost = Math.max(0, closingStockCost - totalPurchases + cmv);
      const openingStockSale = Math.max(0, closingStockSale - totalPurchases * 1.4 + totalRevenue);

      return {
        revenue: totalRevenue,
        cmv,
        grossProfit,
        netProfit,
        grossMarginPercent,
        netMarginPercent,
        stockPurchases: {
          openingStockCost,
          openingStockSale,
          totalPurchases,
          stockAdjustments: abnormalAdjustmentsTotal + normalAdjustmentsTotal,
          operationalExpenses,
          purchaseShipping,
          purchaseDiscounts,
        },
        sales: {
          closingStockCost,
          closingStockSale,
          totalSales: totalRevenue,
          salesShipping: totalSalesShipping,
          additionalExpenses: 0,
          recoveredStock: totalStockRecovered,
          refunds: 0,
          salesDiscounts: totalSalesDiscounts,
          roundedSales: 0,
          salesReturns: 0,
        },
        productAggregation,
        categoryAggregation,
        brandAggregation,
        locationAggregation,
        customerAggregation,
        dayAggregation,
        filteredSalesCount: filteredSales.length,
      };
    };

    // Estatísticas do período atual
    const currentStats = computePeriodStats(start, end);

    // Comparativo anterior se solicitado
    let previousStats: ReturnType<typeof computePeriodStats> | null = null;
    let deltas: Partial<ProfitLossKPIs> = {};

    if (comparePrevious) {
      const durationMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);

      previousStats = computePeriodStats(prevStart, prevEnd);

      deltas = {
        previousRevenue: previousStats.revenue,
        previousCmv: previousStats.cmv,
        previousGrossProfit: previousStats.grossProfit,
        previousNetProfit: previousStats.netProfit,
        previousNetMarginPercent: previousStats.netMarginPercent,
        revenueDelta: calculateDelta(currentStats.revenue, previousStats.revenue),
        cmvDelta: calculateDelta(currentStats.cmv, previousStats.cmv),
        grossProfitDelta: calculateDelta(currentStats.grossProfit, previousStats.grossProfit),
        netProfitDelta: calculateDelta(currentStats.netProfit, previousStats.netProfit),
        netMarginDelta: currentStats.netMarginPercent - previousStats.netMarginPercent,
      };
    }

    const kpis: ProfitLossKPIs = {
      revenue: currentStats.revenue,
      cmv: currentStats.cmv,
      grossProfit: currentStats.grossProfit,
      netProfit: currentStats.netProfit,
      grossMarginPercent: currentStats.grossMarginPercent,
      netMarginPercent: currentStats.netMarginPercent,
      ...deltas,
    };

    // Formatar linhas das tabelas por aba com margens calculadas
    const byProduct: ProfitLossProductRow[] = Array.from(currentStats.productAggregation.values())
      .map((row) => ({
        ...row,
        profit: row.revenue - row.cost,
        marginPercent: row.revenue > 0 ? ((row.revenue - row.cost) / row.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const byCategory: ProfitLossCategoryRow[] = Array.from(currentStats.categoryAggregation.values())
      .map((row) => ({
        ...row,
        profit: row.revenue - row.cost,
        marginPercent: row.revenue > 0 ? ((row.revenue - row.cost) / row.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const byBrand: ProfitLossBrandRow[] = Array.from(currentStats.brandAggregation.values())
      .map((row) => ({
        ...row,
        profit: row.revenue - row.cost,
        marginPercent: row.revenue > 0 ? ((row.revenue - row.cost) / row.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const byLocation: ProfitLossLocationRow[] = Array.from(currentStats.locationAggregation.values())
      .map((row) => ({
        ...row,
        profit: row.revenue - row.cost,
        marginPercent: row.revenue > 0 ? ((row.revenue - row.cost) / row.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const byCustomer: ProfitLossCustomerRow[] = Array.from(currentStats.customerAggregation.values())
      .map((row) => ({
        ...row,
        profit: row.revenue - row.cost,
        marginPercent: row.revenue > 0 ? ((row.revenue - row.cost) / row.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const byDay: ProfitLossDayRow[] = Array.from(currentStats.dayAggregation.values())
      .map((row) => ({
        ...row,
        profit: row.revenue - row.cost,
        marginPercent: row.revenue > 0 ? ((row.revenue - row.cost) / row.revenue) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Construir série para o gráfico diário (preenchendo todos os dias do período)
    const dailyChart: ProfitLossDailyPoint[] = [];
    const curDate = new Date(start);
    curDate.setHours(0, 0, 0, 0);
    const stopDate = new Date(end);
    stopDate.setHours(23, 59, 59, 999);

    while (curDate <= stopDate) {
      const dKey = curDate.toISOString().split('T')[0];
      const existing = currentStats.dayAggregation.get(dKey);
      const day = curDate.getDate().toString().padStart(2, '0');
      const month = (curDate.getMonth() + 1).toString().padStart(2, '0');

      dailyChart.push({
        date: dKey,
        dayLabel: `${day}/${month}`,
        revenue: existing ? existing.revenue : 0,
        cost: existing ? existing.cost : 0,
        profit: existing ? existing.profit : 0,
      });

      curDate.setDate(curDate.getDate() + 1);
    }

    const hasData =
      currentStats.filteredSalesCount > 0 ||
      currentStats.revenue > 0 ||
      currentStats.cmv > 0 ||
      currentStats.stockPurchases.totalPurchases > 0 ||
      currentStats.stockPurchases.operationalExpenses > 0;

    return {
      startDate: startDateStr,
      endDate: endDateStr,
      locationId: selectedLocationId || 'all',
      comparePrevious,
      kpis,
      stockPurchases: currentStats.stockPurchases,
      sales: currentStats.sales,
      dailyChart,
      byProduct,
      byCategory,
      byBrand,
      byLocation,
      byCustomer,
      byDay,
      hasData,
    };
  }
}
