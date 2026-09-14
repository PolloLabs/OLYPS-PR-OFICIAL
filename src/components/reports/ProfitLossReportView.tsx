import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  PackageMinus,
  Coins,
  Percent,
  Calendar,
  Building2,
  RefreshCw,
  Printer,
  Download,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Package,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DataTable } from '../ui/DataTable.js';
import { exportToCsv, exportToExcel, exportToPdf } from '../../lib/exportUtils.js';
import type {
  DataTableColumn,
  ExportFormat,
} from '../../types/navigation.types.js';
import type {
  ProfitLossReportData,
  ProfitLossProductRow,
  ProfitLossCategoryRow,
  ProfitLossBrandRow,
  ProfitLossLocationRow,
  ProfitLossCustomerRow,
  ProfitLossDayRow,
} from '../../types/profitLoss.types.js';

interface LocationOption {
  id: string;
  name: string;
}

interface ProfitLossReportViewProps {
  activeCompanyId: string;
  activeCompanyName: string;
}

type DatePreset = 'today' | '7d' | '30d' | 'this_month' | 'custom';
type TabType = 'product' | 'category' | 'brand' | 'location' | 'customer' | 'day';

export const ProfitLossReportView: React.FC<ProfitLossReportViewProps> = ({
  activeCompanyId,
  activeCompanyName,
}) => {
  // Preset e datas
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filtro de Loja
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [locations, setLocations] = useState<LocationOption[]>([]);

  // Comparativo anterior
  const [comparePrevious, setComparePrevious] = useState<boolean>(true);

  // Estados de dados
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<ProfitLossReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Aba ativa da tabela detalhada
  const [activeTab, setActiveTab] = useState<TabType>('product');

  // Tooltips e menus
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [hoveredDayPoint, setHoveredDayPoint] = useState<{
    date: string;
    dayLabel: string;
    revenue: number;
    cost: number;
    profit: number;
    x: number;
    y: number;
  } | null>(null);

  // Carregar lojas
  useEffect(() => {
    let isMounted = true;
    async function loadLocations() {
      try {
        const res = await fetch(`/api/companies/${activeCompanyId}/locations`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setLocations(
              json.data.map((l: any) => ({
                id: l.id,
                name: l.name,
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar locais:', err);
      }
    }
    loadLocations();
    return () => {
      isMounted = false;
    };
  }, [activeCompanyId]);

  // Manipular alteração de presets rápidos
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7d') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '30d') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Carregar dados do relatório
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        startDate,
        endDate,
        locationId: selectedLocation,
        comparePrevious: comparePrevious ? 'true' : 'false',
      });

      const res = await fetch(
        `/api/companies/${activeCompanyId}/reports/profit-loss?${query.toString()}`
      );
      if (!res.ok) {
        throw new Error(`Falha ao carregar relatório (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setReportData(json.data);
      } else {
        throw new Error(json.error?.message || 'Erro desconhecido');
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados do DRE:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, startDate, endDate, selectedLocation, comparePrevious]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Formatação de moeda
  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Formatação de porcentagem
  const formatPercent = (val?: number) => {
    const num = Number(val || 0);
    return `${num.toFixed(2)}%`;
  };

  // Componente de Badge de Delta
  const renderDelta = (delta?: number, isPositiveGood: boolean = true) => {
    if (delta === undefined || isNaN(delta)) return null;
    const isZero = Math.abs(delta) < 0.01;
    const isUp = delta > 0;
    const isGood = isPositiveGood ? isUp : !isUp;

    let badgeBg = 'bg-slate-100 text-slate-700';
    if (!isZero) {
      badgeBg = isGood
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-rose-50 text-rose-700 border border-rose-200';
    }

    return (
      <span
        className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeBg}`}
        title={`Variação vs período anterior: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
      >
        {isZero ? (
          <Minus className="w-3 h-3" />
        ) : isUp ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : (
          <ArrowDownRight className="w-3 h-3" />
        )}
        <span>
          {isUp ? '+' : ''}
          {delta.toFixed(1)}%
        </span>
      </span>
    );
  };

  // Exportações do Resumo
  const handleExportSummary = (format: ExportFormat) => {
    if (!reportData) return;
    const filename = `demonstrativo-lucros-perdas-${startDate}-a-${endDate}`;

    const summaryRows = [
      { indicador: 'Receita Líquida de Vendas', valor: reportData.kpis.revenue },
      { indicador: 'Custo das Mercadorias Vendidas (CMV)', valor: reportData.kpis.cmv },
      { indicador: 'Lucro Bruto', valor: reportData.kpis.grossProfit },
      { indicador: 'Margem Bruta (%)', valor: `${reportData.kpis.grossMarginPercent.toFixed(2)}%` },
      { indicador: 'Despesas Operacionais', valor: reportData.stockPurchases.operationalExpenses },
      { indicador: 'Ajustes de Estoque (Perdas/Avarias)', valor: reportData.stockPurchases.stockAdjustments },
      { indicador: 'Estoque Recuperado', valor: reportData.sales.recoveredStock },
      { indicador: 'Total Compras do Período', valor: reportData.stockPurchases.totalPurchases },
      { indicador: 'Estoque Inicial (Abertura)', valor: reportData.stockPurchases.openingStockCost },
      { indicador: 'Estoque Final (Fechamento)', valor: reportData.sales.closingStockCost },
      { indicador: 'Lucro Líquido do Exercício', valor: reportData.kpis.netProfit },
      { indicador: 'Margem Líquida (%)', valor: `${reportData.kpis.netMarginPercent.toFixed(2)}%` },
    ];

    const columns: DataTableColumn<any>[] = [
      { key: 'indicador', header: 'Indicador Financeiro' },
      {
        key: 'valor',
        header: 'Valor / Percentual',
        accessor: (row) =>
          typeof row.valor === 'number' ? formatCurrency(row.valor) : row.valor,
      },
    ];

    if (format === 'csv') {
      exportToCsv(filename, columns, summaryRows);
    } else if (format === 'excel') {
      exportToExcel(filename, columns, summaryRows);
    } else if (format === 'pdf') {
      exportToPdf(filename, `Demonstrativo de Lucros e Perdas — ${activeCompanyName}`, columns, summaryRows);
    }
    setShowExportMenu(false);
  };

  // Impressão nativa limpa
  const handlePrint = () => {
    window.print();
  };

  // Colunas para a aba Por Produto
  const productColumns: DataTableColumn<ProfitLossProductRow>[] = [
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      accessor: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500 font-mono">SKU: {row.sku}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      sortable: true,
      accessor: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {row.category}
        </span>
      ),
    },
    {
      key: 'quantitySold',
      header: 'Qtd Vendida',
      sortable: true,
      accessor: (row) => (
        <span className="font-semibold text-slate-800">{row.quantitySold} un</span>
      ),
    },
    {
      key: 'revenue',
      header: 'Receita (R$)',
      sortable: true,
      accessor: (row) => (
        <span className="font-medium text-slate-900">{formatCurrency(row.revenue)}</span>
      ),
    },
    {
      key: 'cost',
      header: 'Custo Total (R$)',
      sortable: true,
      accessor: (row) => (
        <span className="text-slate-600">{formatCurrency(row.cost)}</span>
      ),
    },
    {
      key: 'profit',
      header: 'Lucro (R$)',
      sortable: true,
      accessor: (row) => {
        const isPositive = row.profit >= 0;
        return (
          <span
            className={`font-semibold ${
              isPositive ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatCurrency(row.profit)}
          </span>
        );
      },
    },
    {
      key: 'marginPercent',
      header: 'Margem %',
      sortable: true,
      accessor: (row) => {
        const isPositive = row.marginPercent >= 0;
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {row.marginPercent.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  // Colunas para Por Categoria
  const categoryColumns: DataTableColumn<ProfitLossCategoryRow>[] = [
    {
      key: 'category',
      header: 'Categoria',
      sortable: true,
      accessor: (row) => <span className="font-semibold text-slate-900">{row.category}</span>,
    },
    {
      key: 'itemsCount',
      header: 'Nº Itens Distintos',
      sortable: true,
    },
    {
      key: 'quantitySold',
      header: 'Volume Vendido',
      sortable: true,
      accessor: (row) => `${row.quantitySold} un`,
    },
    {
      key: 'revenue',
      header: 'Receita Total',
      sortable: true,
      accessor: (row) => formatCurrency(row.revenue),
    },
    {
      key: 'cost',
      header: 'Custo Total',
      sortable: true,
      accessor: (row) => formatCurrency(row.cost),
    },
    {
      key: 'profit',
      header: 'Lucro',
      sortable: true,
      accessor: (row) => (
        <span
          className={`font-semibold ${
            row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {formatCurrency(row.profit)}
        </span>
      ),
    },
    {
      key: 'marginPercent',
      header: 'Margem %',
      sortable: true,
      accessor: (row) => `${row.marginPercent.toFixed(1)}%`,
    },
  ];

  // Colunas para Por Marca
  const brandColumns: DataTableColumn<ProfitLossBrandRow>[] = [
    {
      key: 'brand',
      header: 'Marca / Fabricante',
      sortable: true,
      accessor: (row) => <span className="font-semibold text-slate-900">{row.brand}</span>,
    },
    {
      key: 'itemsCount',
      header: 'Itens Distintos',
      sortable: true,
    },
    {
      key: 'quantitySold',
      header: 'Volume Vendido',
      sortable: true,
      accessor: (row) => `${row.quantitySold} un`,
    },
    {
      key: 'revenue',
      header: 'Receita Total',
      sortable: true,
      accessor: (row) => formatCurrency(row.revenue),
    },
    {
      key: 'cost',
      header: 'Custo Total',
      sortable: true,
      accessor: (row) => formatCurrency(row.cost),
    },
    {
      key: 'profit',
      header: 'Lucro',
      sortable: true,
      accessor: (row) => (
        <span
          className={`font-semibold ${
            row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {formatCurrency(row.profit)}
        </span>
      ),
    },
    {
      key: 'marginPercent',
      header: 'Margem %',
      sortable: true,
      accessor: (row) => `${row.marginPercent.toFixed(1)}%`,
    },
  ];

  // Colunas para Por Loja
  const locationColumns: DataTableColumn<ProfitLossLocationRow>[] = [
    {
      key: 'locationName',
      header: 'Loja / Unidade',
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-900">{row.locationName}</span>
        </div>
      ),
    },
    {
      key: 'salesCount',
      header: 'Qtd Vendas / Cupons',
      sortable: true,
    },
    {
      key: 'quantitySold',
      header: 'Volume de Itens',
      sortable: true,
      accessor: (row) => `${row.quantitySold} un`,
    },
    {
      key: 'revenue',
      header: 'Receita',
      sortable: true,
      accessor: (row) => formatCurrency(row.revenue),
    },
    {
      key: 'cost',
      header: 'Custo (CMV)',
      sortable: true,
      accessor: (row) => formatCurrency(row.cost),
    },
    {
      key: 'profit',
      header: 'Lucro',
      sortable: true,
      accessor: (row) => (
        <span
          className={`font-semibold ${
            row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {formatCurrency(row.profit)}
        </span>
      ),
    },
    {
      key: 'marginPercent',
      header: 'Margem %',
      sortable: true,
      accessor: (row) => `${row.marginPercent.toFixed(1)}%`,
    },
  ];

  // Colunas para Por Cliente
  const customerColumns: DataTableColumn<ProfitLossCustomerRow>[] = [
    {
      key: 'customerName',
      header: 'Cliente / Parceiro',
      sortable: true,
      accessor: (row) => <span className="font-semibold text-slate-900">{row.customerName}</span>,
    },
    {
      key: 'salesCount',
      header: 'Pedidos Faturados',
      sortable: true,
    },
    {
      key: 'revenue',
      header: 'Receita Líquida',
      sortable: true,
      accessor: (row) => formatCurrency(row.revenue),
    },
    {
      key: 'cost',
      header: 'Custo de Mercadorias',
      sortable: true,
      accessor: (row) => formatCurrency(row.cost),
    },
    {
      key: 'profit',
      header: 'Lucro Gerado',
      sortable: true,
      accessor: (row) => (
        <span
          className={`font-semibold ${
            row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {formatCurrency(row.profit)}
        </span>
      ),
    },
    {
      key: 'marginPercent',
      header: 'Margem %',
      sortable: true,
      accessor: (row) => `${row.marginPercent.toFixed(1)}%`,
    },
  ];

  // Colunas para Por Dia
  const dayColumns: DataTableColumn<ProfitLossDayRow>[] = [
    {
      key: 'date',
      header: 'Data',
      sortable: true,
      accessor: (row) => (
        <span className="font-mono font-medium text-slate-800">
          {row.dayLabel} ({row.date})
        </span>
      ),
    },
    {
      key: 'salesCount',
      header: 'Nº Transações',
      sortable: true,
    },
    {
      key: 'revenue',
      header: 'Receita (R$)',
      sortable: true,
      accessor: (row) => formatCurrency(row.revenue),
    },
    {
      key: 'cost',
      header: 'Custo (R$)',
      sortable: true,
      accessor: (row) => formatCurrency(row.cost),
    },
    {
      key: 'profit',
      header: 'Lucro Líquido Diário',
      sortable: true,
      accessor: (row) => (
        <span
          className={`font-semibold ${
            row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {formatCurrency(row.profit)}
        </span>
      ),
    },
    {
      key: 'marginPercent',
      header: 'Margem %',
      sortable: true,
      accessor: (row) => `${row.marginPercent.toFixed(1)}%`,
    },
  ];

  // Exportação da aba ativa
  const handleExportActiveTab = (format: ExportFormat) => {
    if (!reportData) return;
    const filename = `lucro-por-${activeTab}-${startDate}-a-${endDate}`;

    if (activeTab === 'product') {
      if (format === 'csv') exportToCsv(filename, productColumns, reportData.byProduct);
      else if (format === 'excel') exportToExcel(filename, productColumns, reportData.byProduct);
      else if (format === 'pdf') exportToPdf(filename, 'Lucro por Produto', productColumns, reportData.byProduct);
    } else if (activeTab === 'category') {
      if (format === 'csv') exportToCsv(filename, categoryColumns, reportData.byCategory);
      else if (format === 'excel') exportToExcel(filename, categoryColumns, reportData.byCategory);
      else if (format === 'pdf') exportToPdf(filename, 'Lucro por Categoria', categoryColumns, reportData.byCategory);
    } else if (activeTab === 'brand') {
      if (format === 'csv') exportToCsv(filename, brandColumns, reportData.byBrand);
      else if (format === 'excel') exportToExcel(filename, brandColumns, reportData.byBrand);
      else if (format === 'pdf') exportToPdf(filename, 'Lucro por Marca', brandColumns, reportData.byBrand);
    } else if (activeTab === 'location') {
      if (format === 'csv') exportToCsv(filename, locationColumns, reportData.byLocation);
      else if (format === 'excel') exportToExcel(filename, locationColumns, reportData.byLocation);
      else if (format === 'pdf') exportToPdf(filename, 'Lucro por Loja', locationColumns, reportData.byLocation);
    } else if (activeTab === 'customer') {
      if (format === 'csv') exportToCsv(filename, customerColumns, reportData.byCustomer);
      else if (format === 'excel') exportToExcel(filename, customerColumns, reportData.byCustomer);
      else if (format === 'pdf') exportToPdf(filename, 'Lucro por Cliente', customerColumns, reportData.byCustomer);
    } else if (activeTab === 'day') {
      if (format === 'csv') exportToCsv(filename, dayColumns, reportData.byDay);
      else if (format === 'excel') exportToExcel(filename, dayColumns, reportData.byDay);
      else if (format === 'pdf') exportToPdf(filename, 'Lucro por Dia', dayColumns, reportData.byDay);
    }
  };

  // Cálculo de dados para o gráfico diário SVG
  const chartMetrics = useMemo(() => {
    if (!reportData || !reportData.dailyChart.length) {
      return { points: [], maxVal: 1000 };
    }
    const points = reportData.dailyChart;
    let max = 0;
    for (const p of points) {
      if (p.revenue > max) max = p.revenue;
      if (p.cost > max) max = p.cost;
    }
    return {
      points,
      maxVal: max > 0 ? max * 1.15 : 1000,
    };
  }, [reportData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Estilos específicos de impressão */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, header, nav, aside, footer {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-clean {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      {/* Cabeçalho da Empresa para Impressão */}
      <div className="print-only border-b border-slate-300 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{activeCompanyName}</h1>
            <p className="text-sm text-slate-600">
              Demonstrativo de Resultado do Exercício (Lucros &amp; Perdas)
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Período: {startDate} até {endDate}</div>
            <div>Emitido em: {new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>

      {/* Cabeçalho de Ações e Título (Tela) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Relatório de Lucros / Perdas
              </h1>
              <p className="text-sm text-slate-500">
                Apuração financeira gerencial de vendas, custos de estoque (CMV), margens e apuração líquida.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>

          {/* Exportar Resumo Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Resumo</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-20">
                <button
                  type="button"
                  onClick={() => handleExportSummary('csv')}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                >
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSummary('excel')}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Exportar Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSummary('pdf')}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. BARRA DE FILTROS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Presets Rápidos */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Período:
            </span>
            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                datePreset === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('7d')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                datePreset === '7d'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('30d')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                datePreset === '30d'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('this_month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                datePreset === 'this_month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Este Mês
            </button>
          </div>

          {/* Switch de Comparativo */}
          <div className="flex items-center space-x-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={comparePrevious}
                onChange={(e) => setComparePrevious(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-medium text-slate-700">
                Comparar com período anterior
              </span>
            </label>
          </div>
        </div>

        {/* Inputs de Data e Localização */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Data Inicial
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Data Final
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Filial / Localização
            </label>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 bg-white"
              >
                <option value="all">Todas as Lojas / Unidades</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem de Erro se houver */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
          <div>
            <strong>Erro ao carregar dados:</strong> {error}
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded text-xs font-semibold"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* 2. CARDS KPI (LINHA SUPERIOR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Receita */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Receita Líquida
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(reportData?.kpis.revenue)}
            </div>
          </div>
          {comparePrevious && (
            <div className="mt-2 flex items-center space-x-2 text-xs">
              {renderDelta(reportData?.kpis.revenueDelta, true)}
              <span className="text-slate-400">vs período anterior</span>
            </div>
          )}
        </div>

        {/* CMV (Custo) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              CMV (Custos)
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <PackageMinus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(reportData?.kpis.cmv)}
            </div>
          </div>
          {comparePrevious && (
            <div className="mt-2 flex items-center space-x-2 text-xs">
              {renderDelta(reportData?.kpis.cmvDelta, false)}
              <span className="text-slate-400">vs anterior</span>
            </div>
          )}
        </div>

        {/* Lucro Bruto */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lucro Bruto
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold ${
                (reportData?.kpis.grossProfit || 0) >= 0
                  ? 'text-emerald-700'
                  : 'text-rose-600'
              }`}
            >
              {formatCurrency(reportData?.kpis.grossProfit)}
            </div>
          </div>
          {comparePrevious && (
            <div className="mt-2 flex items-center space-x-2 text-xs">
              {renderDelta(reportData?.kpis.grossProfitDelta, true)}
              <span className="text-slate-400">vs anterior</span>
            </div>
          )}
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lucro Líquido
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold ${
                (reportData?.kpis.netProfit || 0) >= 0
                  ? 'text-indigo-700'
                  : 'text-rose-600'
              }`}
            >
              {formatCurrency(reportData?.kpis.netProfit)}
            </div>
          </div>
          {comparePrevious && (
            <div className="mt-2 flex items-center space-x-2 text-xs">
              {renderDelta(reportData?.kpis.netProfitDelta, true)}
              <span className="text-slate-400">vs anterior</span>
            </div>
          )}
        </div>

        {/* Margem % */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Margem Líquida
            </span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold ${
                (reportData?.kpis.netMarginPercent || 0) >= 0
                  ? 'text-purple-700'
                  : 'text-rose-600'
              }`}
            >
              {formatPercent(reportData?.kpis.netMarginPercent)}
            </div>
          </div>
          {comparePrevious && (
            <div className="mt-2 flex items-center space-x-2 text-xs">
              {renderDelta(reportData?.kpis.netMarginDelta, true)}
              <span className="text-slate-400">pontos %</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. DUAS COLUNAS: COMPRAS/ESTOQUE vs VENDAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: COMPRAS / ESTOQUE */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-clean">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Package className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold tracking-wide uppercase">
                Compras &amp; Estoque
              </h2>
            </div>
            <span className="text-xs text-slate-300">Entradas &amp; Custo</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            {/* Estoque Abertura */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">
                  Estoque de Abertura (Inicial)
                </div>
                <div className="text-xs text-slate-500">
                  A preço de venda:{' '}
                  <span className="font-medium text-slate-700">
                    {formatCurrency(reportData?.stockPurchases.openingStockSale)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">
                  {formatCurrency(reportData?.stockPurchases.openingStockCost)}
                </div>
                <div className="text-xs text-slate-400">a preço de custo</div>
              </div>
            </div>

            {/* Total Compras */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">
                  Total de Compras Realizadas
                </div>
                <div className="text-xs text-slate-500">
                  Notas de compras recebidas no período
                </div>
              </div>
              <div className="font-bold text-slate-900">
                {formatCurrency(reportData?.stockPurchases.totalPurchases)}
              </div>
            </div>

            {/* Ajustes de Estoque */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">
                  Ajustes de Estoque (Avarias / Perdas)
                </div>
                <div className="text-xs text-slate-500">
                  Lotes ajustados com impacto contábil
                </div>
              </div>
              <div className="font-bold text-rose-600">
                {formatCurrency(reportData?.stockPurchases.stockAdjustments)}
              </div>
            </div>

            {/* Despesas */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">
                  Despesas Operacionais
                </div>
                <div className="text-xs text-slate-500">
                  Lançamentos de despesas gerais e fixas
                </div>
              </div>
              <div className="font-bold text-slate-900">
                {formatCurrency(reportData?.stockPurchases.operationalExpenses)}
              </div>
            </div>

            {/* Fretes de Compra */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">Fretes de Compra</div>
                <div className="text-xs text-slate-500">Custos com transporte de insumos</div>
              </div>
              <div className="font-medium text-slate-700">
                {formatCurrency(reportData?.stockPurchases.purchaseShipping)}
              </div>
            </div>

            {/* Descontos de Compra */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">Descontos de Compra</div>
                <div className="text-xs text-slate-500">Descontos obtidos de fornecedores</div>
              </div>
              <div className="font-medium text-emerald-700">
                {formatCurrency(reportData?.stockPurchases.purchaseDiscounts)}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: VENDAS */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-clean">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold tracking-wide uppercase">
                Vendas &amp; Faturamento
              </h2>
            </div>
            <span className="text-xs text-slate-300">Saídas &amp; Desempenho</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            {/* Estoque Fechamento */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">
                  Estoque de Fechamento (Final)
                </div>
                <div className="text-xs text-slate-500">
                  A preço de venda:{' '}
                  <span className="font-medium text-slate-700">
                    {formatCurrency(reportData?.sales.closingStockSale)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">
                  {formatCurrency(reportData?.sales.closingStockCost)}
                </div>
                <div className="text-xs text-slate-400">a preço de custo</div>
              </div>
            </div>

            {/* Total Vendas */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">
                  Total de Vendas (Líquido)
                </div>
                <div className="text-xs text-slate-500">
                  Faturamento de PDV e Faturas líquidas
                </div>
              </div>
              <div className="font-bold text-emerald-700">
                {formatCurrency(reportData?.sales.totalSales)}
              </div>
            </div>

            {/* Fretes de Venda */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">Fretes de Venda</div>
                <div className="text-xs text-slate-500">Cobrados de clientes</div>
              </div>
              <div className="font-medium text-slate-700">
                {formatCurrency(reportData?.sales.salesShipping)}
              </div>
            </div>

            {/* Estoque Recuperado */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">Estoque Recuperado</div>
                <div className="text-xs text-slate-500">
                  Valores recuperados nos ajustes de estoque
                </div>
              </div>
              <div className="font-semibold text-emerald-700">
                {formatCurrency(reportData?.sales.recoveredStock)}
              </div>
            </div>

            {/* Descontos de Venda */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">Descontos de Venda</div>
                <div className="text-xs text-slate-500">
                  Concedidos aos clientes no fechamento
                </div>
              </div>
              <div className="font-medium text-slate-600">
                {formatCurrency(reportData?.sales.salesDiscounts)}
              </div>
            </div>

            {/* Reembolsos / Retornos */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="font-semibold text-slate-800">Reembolsos &amp; Devoluções</div>
                <div className="text-xs text-slate-500">Estornos de pedidos efetuados</div>
              </div>
              <div className="font-medium text-slate-600">
                {formatCurrency(reportData?.sales.refunds)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BLOCO DE RESULTADO EM DESTAQUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-clean">
        {/* Card Grande: Lucro Bruto */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Resultado Operacional Bruto
              </span>
              {/* Tooltip com a fórmula */}
              <div className="relative group/tip cursor-help">
                <Info className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tip:block w-72 p-3 bg-slate-950 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-200 z-30">
                  <div className="font-bold text-white mb-1">Fórmula do Lucro Bruto:</div>
                  <code className="text-emerald-300 font-mono block">
                    Receita Líquida − CMV
                  </code>
                  <div className="mt-1 text-slate-400">
                    {formatCurrency(reportData?.kpis.revenue)} −{' '}
                    {formatCurrency(reportData?.kpis.cmv)} ={' '}
                    <span className="text-white font-bold">
                      {formatCurrency(reportData?.kpis.grossProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
              Margem Bruta: {formatPercent(reportData?.kpis.grossMarginPercent)}
            </span>
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-white">
              {formatCurrency(reportData?.kpis.grossProfit)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Receita faturada menos o custo direto dos produtos e perdas anormais de estoque.
            </p>
          </div>
        </div>

        {/* Card Grande: Lucro Líquido */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-900/50 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Resultado Líquido do Exercício
              </span>
              {/* Tooltip com a fórmula */}
              <div className="relative group/tip cursor-help">
                <Info className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tip:block w-80 p-3 bg-slate-950 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-200 z-30">
                  <div className="font-bold text-white mb-1">Fórmula do Lucro Líquido:</div>
                  <code className="text-indigo-300 font-mono block">
                    Lucro Bruto − Despesas − Fretes + Estoque Recuperado − Reembolsos
                  </code>
                  <div className="mt-1 text-slate-400">
                    {formatCurrency(reportData?.kpis.grossProfit)} −{' '}
                    {formatCurrency(reportData?.stockPurchases.operationalExpenses)} +{' '}
                    {formatCurrency(reportData?.sales.recoveredStock)} ={' '}
                    <span className="text-white font-bold">
                      {formatCurrency(reportData?.kpis.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
              Margem Líquida: {formatPercent(reportData?.kpis.netMarginPercent)}
            </span>
          </div>

          <div className="mt-4">
            <div
              className={`text-3xl sm:text-4xl font-extrabold ${
                (reportData?.kpis.netProfit || 0) >= 0
                  ? 'text-emerald-300'
                  : 'text-rose-400'
              }`}
            >
              {formatCurrency(reportData?.kpis.netProfit)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Lucro efetivo retido após deduções de despesas operacionais e custos de logística.
            </p>
          </div>
        </div>
      </div>

      {/* 5. GRÁFICO LEVE (BARRAS CSS/SVG PURO) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs print-clean">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <span>Evolução Diária: Receita vs CMV</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                CSS / SVG Puro
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Acompanhamento diário das vendas faturadas e seus custos de mercadoria no período.
            </p>
          </div>

          {/* Legenda */}
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span>
              <span className="text-slate-700">Receita</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block"></span>
              <span className="text-slate-700">CMV (Custo)</span>
            </div>
          </div>
        </div>

        {/* Visualização SVG Responsiva */}
        <div className="mt-6 relative">
          {chartMetrics.points.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              Nenhuma movimentação diária registrada no período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div
                className="min-w-[600px] h-64 flex items-end justify-between gap-2 pt-6 px-4 border-b border-slate-200 relative"
              >
                {/* Linhas de Grade de Fundo */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-15">
                  <div className="border-b border-slate-400 w-full"></div>
                  <div className="border-b border-slate-400 w-full"></div>
                  <div className="border-b border-slate-400 w-full"></div>
                </div>

                {/* Barras por Dia */}
                {chartMetrics.points.map((pt, idx) => {
                  const revHeightPct = Math.min(
                    100,
                    (pt.revenue / chartMetrics.maxVal) * 100
                  );
                  const costHeightPct = Math.min(
                    100,
                    (pt.cost / chartMetrics.maxVal) * 100
                  );

                  return (
                    <div
                      key={pt.date || idx}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredDayPoint({
                          ...pt,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredDayPoint(null)}
                    >
                      <div className="w-full flex items-end justify-center space-x-1 h-full">
                        {/* Barra Receita */}
                        <div
                          style={{ height: `${Math.max(revHeightPct, 2)}%` }}
                          className="w-1/2 max-w-[14px] bg-emerald-500 hover:bg-emerald-600 rounded-t-xs transition-all duration-200 cursor-pointer"
                        ></div>
                        {/* Barra Custo */}
                        <div
                          style={{ height: `${Math.max(costHeightPct, 2)}%` }}
                          className="w-1/2 max-w-[14px] bg-amber-500 hover:bg-amber-600 rounded-t-xs transition-all duration-200 cursor-pointer"
                        ></div>
                      </div>

                      {/* Rótulo do dia */}
                      <span className="text-[10px] text-slate-500 mt-2 rotate-[-45deg] origin-top-left font-mono">
                        {pt.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tooltip Flutuante */}
          {hoveredDayPoint && (
            <div className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700">
              <div className="font-bold border-b border-slate-700 pb-1 text-slate-300">
                Dia {hoveredDayPoint.dayLabel} ({hoveredDayPoint.date})
              </div>
              <div className="flex justify-between space-x-4 text-emerald-400">
                <span>Receita:</span>
                <span className="font-semibold">
                  {formatCurrency(hoveredDayPoint.revenue)}
                </span>
              </div>
              <div className="flex justify-between space-x-4 text-amber-400">
                <span>Custo:</span>
                <span className="font-semibold">
                  {formatCurrency(hoveredDayPoint.cost)}
                </span>
              </div>
              <div className="flex justify-between space-x-4 text-white border-t border-slate-700 pt-1 font-bold">
                <span>Lucro:</span>
                <span
                  className={
                    hoveredDayPoint.profit >= 0
                      ? 'text-emerald-300'
                      : 'text-rose-400'
                  }
                >
                  {formatCurrency(hoveredDayPoint.profit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. ABAS DE APURAÇÃO DE LUCRO DETALHADA COM DATATABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-clean">
        {/* Barra de Seleção de Abas */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3 no-print">
          <div className="flex items-center justify-between overflow-x-auto gap-2">
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('product')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'product'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Por Produto ({reportData?.byProduct.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('category')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'category'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Por Categoria ({reportData?.byCategory.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('brand')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'brand'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Por Marca ({reportData?.byBrand.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('location')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'location'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Por Loja ({reportData?.byLocation.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('customer')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'customer'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Por Cliente ({reportData?.byCustomer.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('day')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'day'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Por Dia ({reportData?.byDay.length || 0})
              </button>
            </div>
          </div>
        </div>

        {/* Tabela da Aba Ativa */}
        <div className="p-4">
          {activeTab === 'product' && (
            <DataTable<ProfitLossProductRow>
              id="table-profit-product"
              title="Apuração por Produto"
              description="Demonstrativo de margens e rentabilidade agrupado por SKU"
              columns={productColumns}
              data={reportData?.byProduct || []}
              keyExtractor={(item) => item.id}
              loading={loading}
              onExport={handleExportActiveTab}
              emptyMessage="Nenhuma venda de produto no período selecionado."
            />
          )}

          {activeTab === 'category' && (
            <DataTable<ProfitLossCategoryRow>
              id="table-profit-category"
              title="Apuração por Categoria"
              description="Desempenho financeiro e rentabilidade por departamento"
              columns={categoryColumns}
              data={reportData?.byCategory || []}
              keyExtractor={(item) => item.category}
              loading={loading}
              onExport={handleExportActiveTab}
              emptyMessage="Nenhuma categoria faturada no período selecionado."
            />
          )}

          {activeTab === 'brand' && (
            <DataTable<ProfitLossBrandRow>
              id="table-profit-brand"
              title="Apuração por Marca"
              description="Rentabilidade de produtos por fabricante"
              columns={brandColumns}
              data={reportData?.byBrand || []}
              keyExtractor={(item) => item.brand}
              loading={loading}
              onExport={handleExportActiveTab}
              emptyMessage="Nenhuma marca faturada no período selecionado."
            />
          )}

          {activeTab === 'location' && (
            <DataTable<ProfitLossLocationRow>
              id="table-profit-location"
              title="Apuração por Filial / Loja"
              description="Resultados consolidados por unidade operacional"
              columns={locationColumns}
              data={reportData?.byLocation || []}
              keyExtractor={(item) => item.locationId}
              loading={loading}
              onExport={handleExportActiveTab}
              emptyMessage="Nenhuma unidade com vendas registradas no período."
            />
          )}

          {activeTab === 'customer' && (
            <DataTable<ProfitLossCustomerRow>
              id="table-profit-customer"
              title="Apuração por Cliente"
              description="Faturamento e lucro por comprador"
              columns={customerColumns}
              data={reportData?.byCustomer || []}
              keyExtractor={(item) => item.customerId}
              loading={loading}
              onExport={handleExportActiveTab}
              emptyMessage="Nenhum cliente registrado no período selecionado."
            />
          )}

          {activeTab === 'day' && (
            <DataTable<ProfitLossDayRow>
              id="table-profit-day"
              title="Apuração por Dia"
              description="Demonstrativo diário de receitas, custos e lucro apurado"
              columns={dayColumns}
              data={reportData?.byDay || []}
              keyExtractor={(item) => item.date}
              loading={loading}
              onExport={handleExportActiveTab}
              emptyMessage="Nenhum dia com movimentação no período selecionado."
            />
          )}
        </div>
      </div>
    </div>
  );
};
