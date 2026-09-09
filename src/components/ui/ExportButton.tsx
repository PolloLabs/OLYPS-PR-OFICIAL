import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet, File } from 'lucide-react';
import type { ExportFormat } from '../../types/navigation.types.js';

export interface ExportButtonProps {
  id?: string;
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  id,
  onExport,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (format: ExportFormat) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        id={id || 'global-export-dropdown-btn'}
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Opções de Exportação"
        title="Exportar dados"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>Exportar</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-1 w-44 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 border border-slate-200 divide-y divide-slate-100 focus:outline-none z-30 animate-fadeIn"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleSelect('csv')}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
              role="menuitem"
            >
              <File className="w-3.5 h-3.5 text-blue-600" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelect('excel')}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
              role="menuitem"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel (XLSX)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelect('pdf')}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
              role="menuitem"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
