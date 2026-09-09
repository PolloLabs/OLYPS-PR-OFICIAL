import React from 'react';
import { X, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import type { Coupon } from '../../../types/index.js';

interface ChangeCouponStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
  actionType: 'activate' | 'inactivate' | 'delete';
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export const ChangeCouponStatusModal: React.FC<ChangeCouponStatusModalProps> = ({
  isOpen,
  onClose,
  coupon,
  actionType,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen || !coupon) return null;

  const isDelete = actionType === 'delete';
  const isActivate = actionType === 'activate';

  const title = isDelete
    ? `Excluir Cupom: ${coupon.code}`
    : isActivate
    ? `Ativar Cupom: ${coupon.code}`
    : `Inativar Cupom: ${coupon.code}`;

  const description = isDelete
    ? 'Tem certeza de que deseja remover este cupom? Ele não poderá mais ser utilizado em novas contratações.'
    : isActivate
    ? 'Ao ativar este cupom, ele passará a ser aceito em checkouts e contratações de assinaturas imediatamente.'
    : 'Ao inativar este cupom, nenhuma nova empresa poderá utilizá-lo até que seja reativado.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        id="modal-change-coupon-status"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isDelete
                  ? 'bg-rose-100 text-rose-700'
                  : isActivate
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isDelete ? (
                <Trash2 className="w-5 h-5" />
              ) : isActivate ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Código:</span>
              <span className="font-mono font-bold text-slate-800">{coupon.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Desconto:</span>
              <span className="font-bold text-slate-800">
                {coupon.discountType === 'percentage'
                  ? `${coupon.discountValue}% OFF`
                  : `R$ ${(coupon.discountValue >= 100 ? coupon.discountValue / 100 : coupon.discountValue).toFixed(2)} OFF`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Utilizações até agora:</span>
              <span className="font-medium text-slate-700">{coupon.usesCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700'
                : isActivate
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>
                {isDelete ? 'Confirmar Exclusão' : isActivate ? 'Ativar Cupom' : 'Inativar Cupom'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
