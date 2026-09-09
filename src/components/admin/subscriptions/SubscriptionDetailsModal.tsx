import React from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Shield,
  Sliders,
  CheckCircle,
  AlertTriangle,
  PauseCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import type { SubscriptionRecord } from '../../../types/index.js';

interface SubscriptionDetailsModalProps {
  subscription: SubscriptionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onActivate?: (sub: SubscriptionRecord) => void;
  onSuspend?: (sub: SubscriptionRecord) => void;
  onCancel?: (sub: SubscriptionRecord) => void;
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export const SubscriptionDetailsModal: React.FC<SubscriptionDetailsModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onActivate,
  onSuspend,
  onCancel,
}) => {
  if (!isOpen || !subscription) return null;

  const plan = subscription.plan;
  const isFree = plan?.isFree;

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Ativa</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Aguardando Ativação</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <PauseCircle className="w-3.5 h-3.5" />
            <span>Suspensa</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Expirada</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelada</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Assinatura: {subscription.companyName || subscription.companyId}
                </h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500">ID da Assinatura: {subscription.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Main Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase text-[10px]">
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresa / Tenant</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {subscription.companyName || 'Empresa OLYPS'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">ID: {subscription.companyId}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase text-[10px]">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Plano Contratado</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {plan?.name} <span className="font-mono text-xs font-normal">({plan?.code})</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {isFree ? 'Plano Gratuito' : `R$ ${((plan?.priceCents || 0) / 100).toFixed(2)} / ${plan?.billingPeriod}`}
              </p>
            </div>
          </div>

          {/* Vigência & Prazos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Controle de Vigência e Vencimento</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Início da Vigência</span>
                <span className="font-bold text-slate-800">{formatDate(subscription.startedAt)}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Data de Vencimento</span>
                <span className="font-bold text-slate-800">
                  {isFree ? 'Sem vencimento compulsório' : formatDate(subscription.expiresAt)}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Ativada Em</span>
                <span className="font-bold text-slate-800">{formatDate(subscription.activatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Status & Event History */}
          {(subscription.suspendedAt || subscription.cancelledAt || subscription.cancellationReason || subscription.notes) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Auditoria e Ocorrências</span>
              </h4>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-slate-700">
                {subscription.suspendedAt && (
                  <p>
                    <strong className="text-amber-700">Data de Suspensão:</strong> {formatDate(subscription.suspendedAt)}
                  </p>
                )}
                {subscription.cancelledAt && (
                  <p>
                    <strong className="text-rose-700">Data de Cancelamento:</strong> {formatDate(subscription.cancelledAt)}
                  </p>
                )}
                {subscription.cancellationReason && (
                  <p>
                    <strong>Motivo do Cancelamento:</strong> {subscription.cancellationReason}
                  </p>
                )}
                {subscription.notes && (
                  <p>
                    <strong>Observações:</strong> {subscription.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Limites Operacionais do Plano */}
          {plan?.limits && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Limites Operacionais Aplicados</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Usuários Máx</span>
                  <span className="font-bold text-slate-800">{plan.limits.max_users}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Locais Máx</span>
                  <span className="font-bold text-slate-800">{plan.limits.max_locations}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Produtos Máx</span>
                  <span className="font-bold text-slate-800">{plan.limits.max_products}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Emissão Fiscal</span>
                  <span className="font-bold text-slate-800">{plan.limits.has_nfe ? 'Sim' : 'Não'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {subscription.status === 'pending' && onActivate && (
              <button
                onClick={() => {
                  onClose();
                  onActivate(subscription);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Ativar Assinatura
              </button>
            )}
            {subscription.status === 'active' && onSuspend && (
              <button
                onClick={() => {
                  onClose();
                  onSuspend(subscription);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
              >
                Suspender
              </button>
            )}
            {(subscription.status === 'active' || subscription.status === 'suspended') && onCancel && (
              <button
                onClick={() => {
                  onClose();
                  onCancel(subscription);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
