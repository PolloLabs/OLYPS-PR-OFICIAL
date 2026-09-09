import React from 'react';
import { X, CheckCircle, AlertTriangle, Calendar, ShieldCheck, Zap } from 'lucide-react';
import type { SubscriptionRecord } from '../../../types/index.js';

interface ActivateSubscriptionModalProps {
  subscription: SubscriptionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subscriptionId: string) => Promise<void>;
  isActivating: boolean;
}

export const ActivateSubscriptionModal: React.FC<ActivateSubscriptionModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onConfirm,
  isActivating,
}) => {
  if (!isOpen || !subscription) return null;

  const isFreePlan = subscription.plan?.isFree;
  const durationDays = subscription.plan?.durationDays ?? 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center space-x-2 text-emerald-800">
            <Zap className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold">Ativar Assinatura</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <p className="text-slate-700">
              Empresa: <strong className="text-slate-900">{subscription.companyName || subscription.companyId}</strong>
            </p>
            <p className="text-slate-700">
              Plano: <strong className="text-slate-900">{subscription.plan?.name}</strong> ({subscription.plan?.code})
            </p>
            <p className="text-slate-500 text-[11px]">
              Status atual: <span className="font-semibold uppercase">{subscription.status}</span>
            </p>
          </div>

          {/* Golden Rule Warning */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-2">
            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-blue-950">Início Oficial da Vigência</p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {isFreePlan ? (
                    'Este é um plano gratuito com acesso contínuo. Ao ativar, a empresa terá acesso aos recursos sem data de expiração compulsória.'
                  ) : (
                    <>
                      Ao ativar uma assinatura paga, a <strong>vigência começa no exato momento da ativação</strong>.
                      O backend OLYPS PRO calculará e gravará a data de vencimento com base na duração configurada de <strong>{durationDays} dias</strong>.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isActivating}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(subscription.id)}
            disabled={isActivating}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isActivating ? 'Ativando...' : 'Confirmar e Ativar Vigência'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
