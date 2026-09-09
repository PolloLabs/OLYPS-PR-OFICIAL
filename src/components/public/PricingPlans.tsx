import React, { useState, useEffect } from 'react';
import {
  Check,
  Zap,
  Shield,
  Layers,
  Sparkles,
  Users,
  Store,
  Package,
  FileText,
  CreditCard,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { PublicPlanCard, ApiResponse } from '../../types/index.js';

interface PricingPlansProps {
  /** Optional custom title for the pricing section */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional callback when a user clicks on "Contratar plano" */
  onSelectPlan?: (plan: PublicPlanCard) => void;
  /** Whether to show an embedded badge or header */
  showHeading?: boolean;
}

/**
 * Format price in cents to Brazilian Real currency format (e.g. 4900 -> "R$ 49,00")
 */
function formatCurrency(cents: number): string {
  if (cents === 0) return 'Grátis';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Format billing period label
 */
function formatBillingPeriod(period: string, isFree: boolean): string {
  if (isFree) return 'sem custo';
  switch (period) {
    case 'monthly':
      return '/mês';
    case 'yearly':
      return '/ano';
    case 'quarterly':
      return '/trimestre';
    case 'semiannual':
      return '/semestre';
    case 'lifetime':
      return 'vitalício';
    default:
      return '/mês';
  }
}

/**
 * Reusable Commercial Plans Pricing Cards Component.
 * RULE: Consumes exclusively `GET /api/public/plans`. No hardcoded plans or prices.
 */
export const PricingPlans: React.FC<PricingPlansProps> = ({
  title = 'Planos e Pacotes Transparentes',
  subtitle = 'Escolha o plano ideal para impulsionar e estruturar o crescimento da sua empresa.',
  onSelectPlan,
  showHeading = true,
}) => {
  const [plans, setPlans] = useState<PublicPlanCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanForInfo, setSelectedPlanForInfo] = useState<PublicPlanCard | null>(null);

  const fetchPublicPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/public/plans');
      if (!res.ok) {
        throw new Error(`Erro na consulta (${res.status}): Falha ao carregar catálogo de planos.`);
      }
      const json = (await res.json()) as ApiResponse<PublicPlanCard[]>;
      if (json.success && Array.isArray(json.data)) {
        setPlans(json.data);
      } else {
        throw new Error(json.error?.message || 'Dados inválidos recebidos da API.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os planos no momento.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicPlans();
  }, []);

  const handleContractClick = (plan: PublicPlanCard) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else {
      setSelectedPlanForInfo(plan);
    }
  };

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8" id="public-pricing-plans-section">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        {showHeading && (
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>OLYPS PRO &bull; Catálogo Comercial Oficial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {subtitle}
            </p>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="h-10 bg-slate-200 rounded w-2/3 my-4"></div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="h-3 bg-slate-100 rounded"></div>
                  <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-100 rounded w-4/6"></div>
                </div>
                <div className="h-10 bg-slate-200 rounded mt-6"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-rose-900">Falha ao carregar planos</h3>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
            <button
              onClick={fetchPublicPlans}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar novamente</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && plans.length === 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center max-w-md mx-auto space-y-3">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum plano disponível no momento</h3>
            <p className="text-xs text-slate-500">
              O catálogo de planos está sendo atualizado pelos administradores. Por favor, volte em breve.
            </p>
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && !error && plans.length > 0 && (
          <div
            className={`grid grid-cols-1 ${
              plans.length === 2
                ? 'md:grid-cols-2 max-w-4xl mx-auto'
                : plans.length === 3
                ? 'md:grid-cols-3 max-w-6xl mx-auto'
                : 'md:grid-cols-2 lg:grid-cols-4'
            } gap-6 items-stretch`}
            id="public-plans-cards-grid"
          >
            {plans.map((plan) => {
              const isProFeatured = plan.isFeatured;
              return (
                <div
                  key={plan.id}
                  id={`public-plan-card-${plan.code}`}
                  className={`relative flex flex-col justify-between bg-white rounded-xl transition-all duration-200 ${
                    isProFeatured
                      ? 'border-2 border-blue-600 shadow-lg ring-4 ring-blue-50'
                      : 'border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                  } p-6`}
                >
                  {/* Featured Badge */}
                  {isProFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-sm tracking-wide uppercase">
                        <Zap className="w-3 h-3 fill-current text-amber-300" />
                        <span>Mais Popular</span>
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header Info */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                          {plan.name}
                        </h3>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                          {plan.code}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {/* Price Block */}
                    <div className="pt-2 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline space-x-1">
                        {plan.isFree ? (
                          <span className="text-3xl font-black text-slate-900">Grátis</span>
                        ) : (
                          <>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                              {formatCurrency(plan.priceCents).replace('/mês', '')}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {formatBillingPeriod(plan.billingPeriod, plan.isFree)}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {plan.isFree
                          ? 'Acesso contínuo sem cobrança'
                          : `Vigência padrão de ${plan.durationDays} dias após ativação`}
                      </p>
                    </div>

                    {/* Structured Limits Badges */}
                    {plan.limits && typeof plan.limits === 'object' && (
                      <div className="grid grid-cols-2 gap-1.5 py-1">
                        {plan.limits.max_users !== undefined && (
                          <div className="flex items-center space-x-1 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <Users className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {plan.limits.max_users >= 9999 ? 'Usuários Ilimitados' : `Até ${plan.limits.max_users} usuário(s)`}
                            </span>
                          </div>
                        )}
                        {plan.limits.max_locations !== undefined && (
                          <div className="flex items-center space-x-1 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <Store className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {plan.limits.max_locations >= 999 ? 'Lojas Ilimitadas' : `Até ${plan.limits.max_locations} local(is)`}
                            </span>
                          </div>
                        )}
                        {plan.limits.max_products !== undefined && (
                          <div className="flex items-center space-x-1 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <Package className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {plan.limits.max_products >= 99999 ? 'Produtos Ilimitados' : `Até ${plan.limits.max_products} produtos`}
                            </span>
                          </div>
                        )}
                        {plan.limits.has_nfe !== undefined && (
                          <div className="flex items-center space-x-1 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{plan.limits.has_nfe ? 'Emissão Fiscal NF-e' : 'Sem Emissão Fiscal'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Features List */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Recursos inclusos:
                      </p>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start space-x-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Action Button */}
                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <button
                      id={`btn-contratar-plano-${plan.code}`}
                      onClick={() => handleContractClick(plan)}
                      className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs transition-all duration-150 flex items-center justify-center space-x-2 shadow-sm ${
                        isProFeatured
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                          : plan.isFree
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <span>{plan.isFree ? 'Começar Gratuitamente' : 'Contratar Plano'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Informative Modal when clicking "Contratar plano" (preparatório para checkout na próxima fase) */}
        {selectedPlanForInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-3 text-blue-600">
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Contratação do Plano {selectedPlanForInfo.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedPlanForInfo.isFree
                      ? 'Degustação Gratuita'
                      : `${formatCurrency(selectedPlanForInfo.priceCents)} / ${selectedPlanForInfo.billingPeriod}`}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Fluxo Oficial de Contratação</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-700">
                  Na arquitetura do OLYPS PRO, a contratação pública com registro de empresa e ativação administrativa será disponibilizada no fluxo de onboarding. Para ativar este plano em uma empresa já existente, utilize o painel Super Admin &rarr; Assinaturas.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p className="font-semibold text-slate-700">Resumo dos limites deste pacote:</p>
                <ul className="space-y-1 text-[11px] text-slate-500">
                  <li>&bull; Código do Plano: <strong className="text-slate-700">{selectedPlanForInfo.code}</strong></li>
                  <li>&bull; Vigência: <strong className="text-slate-700">{selectedPlanForInfo.isFree ? 'Sem expiração obrigatória' : `${selectedPlanForInfo.durationDays} dias após ativação`}</strong></li>
                  <li>&bull; Recursos: <strong className="text-slate-700">{selectedPlanForInfo.features.length} benefícios cadastrados</strong></li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedPlanForInfo(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
