import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal.js';

export interface DeleteButtonProps {
  id?: string;
  onDelete?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  id,
  onDelete,
  onClick,
  title = 'Excluir registro',
  confirmTitle = 'Confirmar Exclusão',
  confirmMessage = 'Tem certeza que deseja excluir este registro? Esta ação é irreversível.',
  disabled = false,
  className = '',
  size = 'md',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
      return;
    }
    if (onDelete) {
      setIsModalOpen(true);
    }
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    if (onDelete) {
      onDelete();
    }
  };

  const sizeClasses =
    size === 'sm' ? 'w-7 h-7 p-1 text-xs' : 'w-8 h-8 p-1.5 text-xs';

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        className={`inline-flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-400 ${sizeClasses} ${className}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {onDelete && (
        <ConfirmModal
          isOpen={isModalOpen}
          title={confirmTitle}
          message={confirmMessage}
          onConfirm={handleConfirm}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
