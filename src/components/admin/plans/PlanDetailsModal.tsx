import React from 'react';
import {
  X,
  Layers,
  DollarSign,
  Calendar,
  Sliders,
  CheckCircle2,
  Sparkles,
  Shield,
  Eye,
  Tag,
} from 'lucide-react';
import type { SubscriptionPlan } from '../../../types/index.js';

interface PlanDetailsModalProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onEditPlan?: (plan: SubscriptionPlan) => void;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Grátis';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatBillingPeriod(period: string, isFree: boolean): string {
  if (isFree) return 'sem custo';
  switch (period) {
    case 'monthly':
      return 'Mensal';
    case 'yearly':
      return 'Anual';
    case 'quarterly':
      return 'Trimestral';
    case 'semiannual':
      return 'Semestral';
    case 'lifetime':
      return 'Vitalício';
    default:
      return period;
  }
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  plan,
  isOpen,
  onClose,
  onEditPlan,
}) => {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">{plan.name}</h2>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase font-semibold">
                  {plan.code}
                </span>
                {plan.isFeatured && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                    Destaque
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">ID: {plan.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Commercial Header Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500">Valor</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {formatPrice(plan.priceCents)}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500">Periodicidade</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {formatBillingPeriod(plan.billingPeriod, plan.isFree)}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500">Vigência</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {plan.isFree ? 'Sem vencimento' : `${plan.durationDays} dias`}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
              <div className="mt-0.5">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                    plan.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : plan.status === 'archived'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {plan.status === 'active'
                    ? 'Ativo'
                    : plan.status === 'archived'
                    ? 'Arquivado'
                    : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {plan.description && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Descrição Comercial
              </span>
              <p>{plan.description}</p>
            </div>
          )}

          {/* Limites Operacionais */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Limites de Recursos (JSONB)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Máx. Usuários</span>
                <span className="font-bold text-slate-800">
                  {plan.limits?.max_users ?? 'Padrão'}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Máx. Locais / Lojas</span>
                <span className="font-bold text-slate-800">
                  {plan.limits?.max_locations ?? 'Padrão'}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Máx. Produtos</span>
                <span className="font-bold text-slate-800">
                  {plan.limits?.max_products ?? 'Padrão'}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Máx. Clientes</span>
                <span className="font-bold text-slate-800">
                  {plan.limits?.max_clients ?? 'Padrão'}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Módulo PDV</span>
                <span className="font-bold text-slate-800">
                  {plan.limits?.has_pdv ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Emissão Fiscal NF-e</span>
                <span className="font-bold text-slate-800">
                  {plan.limits?.has_nfe ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Reparos / OS</span>
                <span className="font-bold text-slate-800">
                  {plan.limits?.reparar !== false ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
            </div>
          </div>

          {/* Benefícios */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Benefícios Cadastrados ({plan.features?.length || 0})</span>
            </h4>
            {plan.features && plan.features.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">Nenhum benefício configurado.</p>
            )}
          </div>

          {/* Vitrine e Ordenação */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">Visibilidade Pública:</span>{' '}
              {plan.isPublic ? 'Sim (Exibido na vitrine)' : 'Não (Privado/Oculto)'}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Ordem na Vitrine:</span>{' '}
              {plan.displayOrder ?? 10}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Criado em: {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
          </span>
          <div className="flex items-center space-x-2">
            {onEditPlan && (
              <button
                onClick={() => {
                  onClose();
                  onEditPlan(plan);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Editar Plano
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
