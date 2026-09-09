import React from 'react';
import { PlusCircle, RefreshCw, ClipboardList, Wrench } from 'lucide-react';
import { StatusCards } from './StatusCards.js';
import { BrandTrendChart } from './BrandTrendChart.js';
import { DeviceTrendChart } from './DeviceTrendChart.js';
import { ModelTrendChart } from './ModelTrendChart.js';
import { useRepairAnalytics } from '../../../hooks/repair/useRepairAnalytics.js';
import type { JobSheet } from '../../../types/repair.types.js';

interface RepairDashboardProps {
  companyId: string;
  activeCompanyName?: string;
  initialJobSheets?: JobSheet[];
  onNewJobSheet: () => void;
  onViewAllJobSheets: () => void;
}

export const RepairDashboard: React.FC<RepairDashboardProps> = ({
  companyId,
  activeCompanyName,
  initialJobSheets,
  onNewJobSheet,
  onViewAllJobSheets,
}) => {
  const { summary, brandTrends, deviceTrends, modelTrends, isLoading, refresh } =
    useRepairAnalytics({ companyId, initialJobSheets });

  return (
    <div id="repair-dashboard" className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Painel Operacional de Reparos & OS
            </h2>
            <p className="text-xs text-slate-500">
              {activeCompanyName ? `Loja ativa: ${activeCompanyName}` : 'Visão analítica de bancada e produtividade'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            title="Recarregar métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={onViewAllJobSheets}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            <span>Folhas de Trabalho</span>
          </button>

          <button
            type="button"
            onClick={onNewJobSheet}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      {/* 1. Status Cards */}
      <StatusCards summary={summary} isLoading={isLoading} />

      {/* 2. Analytical Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BrandTrendChart data={brandTrends} isLoading={isLoading} />
        <DeviceTrendChart data={deviceTrends} isLoading={isLoading} />
        <ModelTrendChart data={modelTrends} isLoading={isLoading} />
      </div>
    </div>
  );
};
