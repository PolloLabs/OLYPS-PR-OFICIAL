import React, { useState, useEffect } from 'react';
import { X, Plus, Building2, Layers, AlertCircle, HelpCircle, Check, Tag, Sparkles } from 'lucide-react';
import type {
  SubscriptionPlan,
  CompanyRecord,
  CreateSubscriptionPayload,
  CouponValidationResult,
  ApiResponse,
} from '../../../types/index.js';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateSubscriptionPayload) => Promise<void>;
  companies: CompanyRecord[];
  plans: SubscriptionPlan[];
  isSaving: boolean;
}

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companies,
  plans,
  isSaving,
}) => {
  const [companyId, setCompanyId] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');
  const [couponCode, setCouponCode] = useState<string>('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [couponValidation, setCouponValidation] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (companies.length > 0 && !companyId) {
        setCompanyId(companies[0].id);
      }
      if (plans.length > 0 && !planId) {
        const activePlan = plans.find((p) => p.status === 'active') || plans[0];
        setPlanId(activePlan.id);
      }
      setCouponCode('');
      setCouponValidation(null);
      setCouponError(null);
      setNotes('');
      setError(null);
    }
  }, [isOpen, companies, plans, companyId, planId]);

  // Re-validate coupon if plan or company changes
  useEffect(() => {
    if (couponCode.trim() && planId) {
      handleValidateCoupon(couponCode.trim());
    } else {
      setCouponValidation(null);
      setCouponError(null);
    }
  }, [planId, companyId]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === planId);
  const selectedCompany = companies.find((c) => c.id === companyId);

  const handleValidateCoupon = async (codeToValidate: string) => {
    const clean = codeToValidate.trim().toUpperCase();
    if (!clean || !planId) {
      setCouponValidation(null);
      setCouponError(null);
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/platform/coupons/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: clean,
          planId,
          companyId: companyId || undefined,
        }),
      });

      const json: ApiResponse<CouponValidationResult> = await res.json();
      if (json.success && json.data) {
        if (json.data.isValid) {
          setCouponValidation(json.data);
          setCouponError(null);
        } else {
          setCouponValidation(null);
          setCouponError(json.data.errorReason || 'Cupom inválido ou não aplicável.');
        }
      } else {
        setCouponValidation(null);
        setCouponError(json.error?.message || 'Cupom não encontrado.');
      }
    } catch {
      setCouponValidation(null);
      setCouponError('Erro ao validar cupom.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleApplyCouponClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      handleValidateCoupon(couponCode.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId) {
      setError('Selecione uma empresa.');
      return;
    }

    if (!planId) {
      setError('Selecione um plano.');
      return;
    }

    try {
      await onSave({
        companyId,
        planId,
        couponCode: couponValidation?.isValid ? couponValidation.coupon?.code : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao vincular assinatura.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Vincular Nova Assinatura</h2>
              <p className="text-xs text-slate-500">
                Atribua um plano comercial a uma empresa cadastrada com suporte a cupons
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Empresa Cliente *
            </label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} {comp.document ? `(${comp.document})` : ''} - Status: {comp.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plano Comercial *
            </label>
            <select
              required
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.code}) - {plan.isFree ? 'Grátis' : `R$ ${(plan.priceCents / 100).toFixed(2)}`} - Vigência: {plan.isFree ? 'Sem expiração' : `${plan.durationDays} dias`}
                </option>
              ))}
            </select>
          </div>

          {/* Cupom Promocional (FASE 05.3) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Cupom de Desconto (Opcional - FASE 05.3)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                    setCouponValidation(null);
                    setCouponError(null);
                  }}
                  placeholder="EX: PROMO20, LANCA50"
                  maxLength={30}
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="button"
                onClick={handleApplyCouponClick}
                disabled={!couponCode.trim() || isValidatingCoupon}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                {isValidatingCoupon ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Validar</span>
              </button>
            </div>

            {/* Validation Feedback */}
            {couponValidation?.isValid && couponValidation.coupon && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1 text-emerald-800 animate-in fade-in duration-200">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Cupom {couponValidation.coupon.code} Aplicado!
                  </span>
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                    {couponValidation.coupon.discountType === 'percentage'
                      ? `${couponValidation.coupon.discountValue}% OFF`
                      : `${formatCentsToBRL(couponValidation.discountCents || 0)} OFF`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-emerald-200/60 text-emerald-900">
                  <span>Desconto calculado:</span>
                  <strong className="font-mono">- {formatCentsToBRL(couponValidation.discountCents || 0)}</strong>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-900">
                  <span>Valor final da assinatura:</span>
                  <span className="text-emerald-700 font-mono text-xs">
                    {formatCentsToBRL(couponValidation.finalPriceCents || 0)}
                  </span>
                </div>
              </div>
            )}

            {couponError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{couponError}</span>
              </div>
            )}
          </div>

          {selectedPlan && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">
                Resumo do Plano Selecionado:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <strong>Preço Base do Plano:</strong>{' '}
                  <span className={couponValidation?.isValid ? 'line-through text-slate-400' : ''}>
                    {selectedPlan.isFree ? 'Grátis' : formatCentsToBRL(selectedPlan.priceCents)}
                  </span>
                  {couponValidation?.isValid && (
                    <span className="block text-emerald-700 font-bold">
                      {formatCentsToBRL(couponValidation.finalPriceCents || 0)}
                    </span>
                  )}
                </div>
                <div>
                  <strong>Vigência:</strong> {selectedPlan.isFree ? 'Sem vencimento' : `${selectedPlan.durationDays} dias`}
                </div>
                <div>
                  <strong>Usuários Máx:</strong> {selectedPlan.limits?.max_users ?? 'Padrão'}
                </div>
                <div>
                  <strong>Locais Máx:</strong> {selectedPlan.limits?.max_locations ?? 'Padrão'}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                * O preço cadastrado do plano permanece intacto. O desconto do cupom é registrado na assinatura gerada.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Administrativas (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Contrato assinado presencialmente, voucher comercial, etc."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Vincular Assinatura'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

