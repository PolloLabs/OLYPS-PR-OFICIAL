import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import type { POSFilterValues } from '../../types/pos.types.js';

interface POSFiltersProps {
  filters: POSFilterValues;
  onFilterChange: <K extends keyof POSFilterValues>(
    key: K,
    value: POSFilterValues[K]
  ) => void;
  onReset: () => void;
  locations: string[];
  customers: { id: string; name: string }[];
  users: string[];
}

export const POSFilters: React.FC<POSFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  locations,
  customers,
  users,
}) => {
  return (
    <div
      id="pos-filters-container"
      className="bg-white rounded-lg shadow-sm border border-slate-200 border-t-4 border-t-blue-600 p-4 mb-6 transition-all"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-800">Filtros</h2>
        </div>
        <button
          id="btn-pos-reset-filters"
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Localização da empresa */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Localização da empresa:
          </label>
          <select
            id="filter-pos-location"
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All</option>
            <option value="Franquia São Paulo (Loja Online SP)">
              Franquia São Paulo (Loja Online SP)
            </option>
            {locations
              .filter(
                (l) => l !== 'Franquia São Paulo (Loja Online SP)'
              )
              .map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
          </select>
        </div>

        {/* Cliente */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Cliente:</label>
          <select
            id="filter-pos-customer"
            value={filters.customer}
            onChange={(e) => onFilterChange('customer', e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Estado do pagamento */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Estado do pagamento:
          </label>
          <select
            id="filter-pos-payment-status"
            value={filters.paymentStatus}
            onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All</option>
            <option value="paid">Pago</option>
            <option value="partial">Parcial</option>
            <option value="due">Vencido</option>
            <option value="pending">Pendente</option>
          </select>
        </div>

        {/* Intervalo de datas */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Intervalo de datas:
          </label>
          <input
            id="filter-pos-date-range"
            type="text"
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            placeholder="01-01-2026 - 31-12-2026"
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          />
        </div>

        {/* Usuário */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Usuário:</label>
          <select
            id="filter-pos-user"
            value={filters.user}
            onChange={(e) => onFilterChange('user', e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All</option>
            <option value="Admin Geral">Admin Geral</option>
            {users
              .filter((u) => u !== 'Admin Geral')
              .map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
          </select>
        </div>

        {/* Status da remessa */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Status da remessa:
          </label>
          <select
            id="filter-pos-shipping-status"
            value={filters.shippingStatus}
            onChange={(e) => onFilterChange('shippingStatus', e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All</option>
            <option value="delivered">Entregue</option>
            <option value="shipped">Enviado</option>
            <option value="packed">Embalado</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Checkbox Assinaturas */}
      <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-50">
        <input
          id="filter-pos-subscriptions"
          type="checkbox"
          checked={filters.isSubscription}
          onChange={(e) => onFilterChange('isSubscription', e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
        />
        <label
          htmlFor="filter-pos-subscriptions"
          className="text-xs font-medium text-slate-700 cursor-pointer select-none"
        >
          Assinaturas
        </label>
      </div>
    </div>
  );
};
