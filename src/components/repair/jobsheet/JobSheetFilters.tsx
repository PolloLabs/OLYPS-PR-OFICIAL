import React from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import type { JobSheetFilterState, JobSheetStatus, JobSheetPriority } from '../../../types/repair.types.js';

interface JobSheetFiltersProps {
  filters: JobSheetFilterState;
  brands: string[];
  deviceTypes: string[];
  onFilterChange: (filters: Partial<JobSheetFilterState>) => void;
  onResetFilters: () => void;
}

export const JobSheetFilters: React.FC<JobSheetFiltersProps> = ({
  filters,
  brands,
  deviceTypes,
  onFilterChange,
  onResetFilters,
}) => {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.brand !== 'all' ||
    filters.deviceType !== 'all';

  return (
    <div id="jobsheet-filters" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search input */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por OS, cliente, modelo, defeito..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Brand select */}
        <div>
          <select
            value={filters.brand}
            onChange={(e) => onFilterChange({ brand: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">Todas as Marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Device type select */}
        <div>
          <select
            value={filters.deviceType}
            onChange={(e) => onFilterChange({ deviceType: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">Todos os Aparelhos</option>
            {deviceTypes.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Priority select */}
        <div>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value as JobSheetPriority | 'all' })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="normal">Normal</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">Filtros aplicados</span>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
};
