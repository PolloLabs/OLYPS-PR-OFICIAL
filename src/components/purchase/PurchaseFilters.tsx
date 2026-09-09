import React from 'react';
import { Search, RotateCcw, Filter, Building2, Calendar, CheckCircle2, Clock } from 'lucide-react';
import type { PurchaseStatus, PurchasePaymentStatus } from '../../types/purchase.types.js';

export interface PurchaseFilterValues {
  searchTerm: string;
  supplierId: string;
  status: PurchaseStatus | 'all';
  paymentStatus: PurchasePaymentStatus | 'all';
  startDate: string;
  endDate: string;
  locationId: string;
}

interface PurchaseFiltersProps {
  filters: PurchaseFilterValues;
  onFilterChange: (filters: Partial<PurchaseFilterValues>) => void;
  onReset: () => void;
  suppliers: Array<{ id: string; name: string }>;
  locations?: Array<{ id: string; name: string }>;
}

export const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  suppliers,
  locations = [],
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filtros de Pesquisa</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpar Filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Busca por texto */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Buscar por Código, NF ou Fornecedor
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              placeholder="Ex: COMP-2026, NF-123..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50"
            />
          </div>
        </div>

        {/* Fornecedor */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Fornecedor
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.supplierId}
              onChange={(e) => onFilterChange({ supplierId: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50"
            >
              <option value="all">Todos os Fornecedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status da Compra */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Status da Compra
          </label>
          <div className="relative">
            <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value as any })}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50"
            >
              <option value="all">Todos os Status</option>
              <option value="received">Recebido (Estoque Atualizado)</option>
              <option value="pending">Pendente de Entrega</option>
              <option value="ordered">Encomendado</option>
              <option value="requested">Solicitado / Cotação</option>
            </select>
          </div>
        </div>

        {/* Status do Pagamento */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Status do Pagamento
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.paymentStatus}
              onChange={(e) => onFilterChange({ paymentStatus: e.target.value as any })}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50"
            >
              <option value="all">Todos os Pagamentos</option>
              <option value="paid">Totalmente Pago</option>
              <option value="partial">Parcialmente Pago</option>
              <option value="pending">Pendente de Pagamento</option>
            </select>
          </div>
        </div>
      </div>

      {/* Linha secundária de filtros: Período e Localização */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Data Inicial
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Data Final
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Localização da Empresa
          </label>
          <select
            value={filters.locationId}
            onChange={(e) => onFilterChange({ locationId: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50"
          >
            <option value="all">Todas as Localizações</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
