import React from 'react';
import { RotateCcw, XCircle, AlertTriangle } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const POSResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-pos-reset-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-reset"
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Limpar Carrinho?
            </h3>
            <p className="text-[11px] text-slate-500">
              Deseja realmente remover todos os itens?
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded border border-slate-100">
          Todos os produtos adicionados, descontos e configurações desta venda serão descartados.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Não, Voltar
          </button>
          <button
            id="btn-confirm-reset-cart"
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Sim, Limpar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};

interface CancelConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const POSCancelConfirmModal: React.FC<CancelConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-pos-cancel-sale-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-cancel-sale"
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Cancelar Venda Atual?
            </h3>
            <p className="text-[11px] text-slate-500">
              Esta ação encerra o atendimento em andamento
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded border border-slate-100">
          A venda em andamento será cancelada e o terminal retornará ao estado inicial com o cliente padrão.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Continuar Venda
          </button>
          <button
            id="btn-confirm-cancel-sale"
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Sim, Cancelar Venda
          </button>
        </div>
      </div>
    </div>
  );
};
