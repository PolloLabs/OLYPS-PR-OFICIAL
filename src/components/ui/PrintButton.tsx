import React from 'react';
import { Printer } from 'lucide-react';

export interface PrintButtonProps {
  id?: string;
  onPrint: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  id,
  onPrint,
  disabled = false,
  className = '',
  title = 'Imprimir listagem',
}) => {
  return (
    <button
      id={id || 'global-print-btn'}
      type="button"
      onClick={onPrint}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Printer className="w-3.5 h-3.5 text-slate-500" />
      <span>Imprimir</span>
    </button>
  );
};
