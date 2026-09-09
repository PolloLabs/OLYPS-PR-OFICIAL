import React from 'react';
import { Pencil } from 'lucide-react';

export interface EditButtonProps {
  id?: string;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const EditButton: React.FC<EditButtonProps> = ({
  id,
  onClick,
  title = 'Editar registro',
  disabled = false,
  className = '',
  size = 'md',
}) => {
  const sizeClasses =
    size === 'sm' ? 'w-7 h-7 p-1 text-xs' : 'w-8 h-8 p-1.5 text-xs';

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400 ${sizeClasses} ${className}`}
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
  );
};
