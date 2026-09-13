import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { StockAdjustment } from '../../types/stockAdjustment.types.js';

interface StockAdjustmentDeleteModalProps {
  adjustment: StockAdjustment | null;
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StockAdjustmentDeleteModal: React.FC<StockAdjustmentDeleteModalProps> = ({
  adjustment,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !adjustment) return null;

  return (
    <div
      id="modal-stock-adjustment-delete"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (!isDeleting && e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col p-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900">
          Excluir Ajuste de Estoque?
        </h3>

        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Tem certeza de que deseja excluir o ajuste{' '}
          <strong className="text-slate-800 font-semibold">{adjustment.referenceNumber}</strong>?
        </p>

        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-normal">
          ⚠️ <strong>Atenção:</strong> Ao confirmar, o saldo em estoque de todos os{' '}
          <strong>{adjustment.items.length} produto(s)</strong> deste ajuste será automaticamente{' '}
          <strong>revertido</strong> ao valor anterior à movimentação.
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            id="btn-cancel-delete"
            disabled={isDeleting}
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirm-delete"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <span>Confirmar Exclusão</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
