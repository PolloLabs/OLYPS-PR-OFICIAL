import React from 'react';
import type { PageSizeOption } from '../../types/navigation.types.js';

export interface PageSizeSelectorProps {
  id?: string;
  value: PageSizeOption;
  onChange: (value: PageSizeOption) => void;
  disabled?: boolean;
  className?: string;
}

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [25, 50, 75, 100, 'all'];

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  id = 'global-page-size-selector',
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-1.5 text-xs text-slate-600 ${className}`}>
      <span className="font-medium">Mostrar</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'all') {
            onChange('all');
          } else {
            onChange(Number(val) as PageSizeOption);
          }
        }}
        className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Selecionar quantidade de registros por página"
      >
        {PAGE_SIZE_OPTIONS.map((opt) => (
          <option key={String(opt)} value={opt}>
            {opt === 'all' ? 'Todos' : opt}
          </option>
        ))}
      </select>
      <span className="font-medium">registros</span>
    </div>
  );
};
