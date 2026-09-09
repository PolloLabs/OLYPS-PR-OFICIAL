import React from 'react';
import { Filter, Calendar, RotateCcw } from 'lucide-react';
import type { SellFilterValues } from '../../types/sell.types.js';

interface SellFiltersProps {
  filters: SellFilterValues;
  onFilterChange: (newFilters: Partial<SellFilterValues>) => void;
  onReset: () => void;
}

export const SellFilters: React.FC<SellFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div
      id="sell-filters-card"
      className="bg-white rounded-md border border-slate-200 border-t-4 border-t-blue-600 shadow-sm p-4 mb-5"
    >
      {/* Cabeçalho dos Filtros */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
          <Filter className="w-5 h-5 text-blue-600" />
          <span>Filtros</span>
        </div>
        <button
          id="btn-reset-filters"
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpar Filtros</span>
        </button>
      </div>

      {/* Grid de Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Localização da empresa */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Localização da empresa:
          </label>
          <select
            id="filter-location"
            value={filters.locationId}
            onChange={(e) => onFilterChange({ locationId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All</option>
            <option value="loc-sp">Franquia São Paulo</option>
            <option value="loc-rj">Filial Rio de Janeiro</option>
            <option value="loc-matriz">Matriz</option>
          </select>
        </div>

        {/* Cliente */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Cliente:
          </label>
          <select
            id="filter-customer"
            value={filters.customerId}
            onChange={(e) => onFilterChange({ customerId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All</option>
            <option value="cust-001">TechCorp Soluções Tecnológicas Ltda</option>
            <option value="cust-002">Inova Digital Comércio e Serviços</option>
            <option value="cust-003">Consultoria Alfa & Gestão</option>
          </select>
        </div>

        {/* Estado do pagamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Estado do pagamento:
          </label>
          <select
            id="filter-payment-status"
            value={filters.paymentStatus}
            onChange={(e) =>
              onFilterChange({ paymentStatus: e.target.value as any })
            }
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All</option>
            <option value="paid">Pago</option>
            <option value="partial">Parcial</option>
            <option value="due">Pendente / Devedor</option>
          </select>
        </div>

        {/* Intervalo de datas */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Intervalo de datas:
          </label>
          <div className="relative">
            <input
              id="filter-date-range"
              type="text"
              value={filters.dateRange}
              onChange={(e) => onFilterChange({ dateRange: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-8 pr-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
              placeholder="01-01-2026 - 31-12-2026"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Usuário */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Usuário:
          </label>
          <select
            id="filter-user"
            value={filters.userId}
            onChange={(e) => onFilterChange({ userId: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All</option>
            <option value="Admin Geral">Admin Geral</option>
            <option value="Vendedor Loja">Vendedor Loja</option>
          </select>
        </div>

        {/* Status da remessa */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Status da remessa:
          </label>
          <select
            id="filter-shipping-status"
            value={filters.shippingStatus}
            onChange={(e) =>
              onFilterChange({ shippingStatus: e.target.value as any })
            }
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All</option>
            <option value="delivered">Entregue</option>
            <option value="shipped">Enviado</option>
            <option value="packed">Embalado</option>
            <option value="ordered">Pedido</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Checkbox Assinaturas */}
        <div className="flex items-center gap-2 pt-5">
          <input
            id="filter-subscriptions"
            type="checkbox"
            checked={filters.onlySubscriptions}
            onChange={(e) =>
              onFilterChange({ onlySubscriptions: e.target.checked })
            }
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="filter-subscriptions"
            className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
          >
            Assinaturas
          </label>
        </div>
      </div>
    </div>
  );
};
