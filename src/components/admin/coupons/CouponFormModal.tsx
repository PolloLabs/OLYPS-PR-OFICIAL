import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Hash,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type {
  Coupon,
  CouponDiscountType,
  CouponStatus,
  CreateCouponPayload,
  UpdateCouponPayload,
  SubscriptionPlan,
} from '../../../types/index.js';

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateCouponPayload | UpdateCouponPayload) => Promise<boolean>;
  couponToEdit: Coupon | null;
  isSaving: boolean;
  availablePlans: SubscriptionPlan[];
}

export const CouponFormModal: React.FC<CouponFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  couponToEdit,
  isSaving,
  availablePlans,
}) => {
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('10');
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [applyToAllPlans, setApplyToAllPlans] = useState<boolean>(true);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [status, setStatus] = useState<CouponStatus>('active');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (couponToEdit) {
      setCode(couponToEdit.code);
      setName(couponToEdit.name || '');
      setDescription(couponToEdit.description || '');
      setDiscountType(couponToEdit.discountType);
      
      if (couponToEdit.discountType === 'percentage') {
        setDiscountValue(couponToEdit.discountValue.toString());
      } else {
        // fixed amount: cents to BRL if >= 100
        const val = couponToEdit.discountValue >= 100 ? (couponToEdit.discountValue / 100).toFixed(2) : couponToEdit.discountValue.toString();
        setDiscountValue(val);
      }

      setValidFrom(couponToEdit.validFrom ? couponToEdit.validFrom.split('T')[0] : '');
      setValidUntil(couponToEdit.validUntil ? couponToEdit.validUntil.split('T')[0] : '');
      setMaxUses(couponToEdit.maxUses ? couponToEdit.maxUses.toString() : '');
      
      const hasSpecificPlans = Array.isArray(couponToEdit.applicablePlanIds) && couponToEdit.applicablePlanIds.length > 0;
      setApplyToAllPlans(!hasSpecificPlans);
      setSelectedPlanIds(hasSpecificPlans ? (couponToEdit.applicablePlanIds as string[]) : []);
      setStatus(couponToEdit.status);
    } else {
      // Default new coupon state
      setCode('');
      setName('');
      setDescription('');
      setDiscountType('percentage');
      setDiscountValue('10');
      setValidFrom(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setMaxUses('');
      setApplyToAllPlans(true);
      setSelectedPlanIds([]);
      setStatus('active');
    }
    setValidationError(null);
  }, [couponToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize: uppercase, alphanumeric and dashes/underscores
    const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    setCode(sanitized);
  };

  const handlePlanToggle = (planId: string) => {
    if (selectedPlanIds.includes(planId)) {
      setSelectedPlanIds(selectedPlanIds.filter((id) => id !== planId));
    } else {
      setSelectedPlanIds([...selectedPlanIds, planId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 2) {
      setValidationError('O código do cupom deve ter pelo menos 2 caracteres.');
      return;
    }

    const numVal = parseFloat(discountValue.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) {
      setValidationError('Informe um valor de desconto válido e maior que zero.');
      return;
    }

    if (discountType === 'percentage' && numVal > 100) {
      setValidationError('O desconto percentual não pode ultrapassar 100%.');
      return;
    }

    // Convert fixed amount to cents
    const finalDiscountValue = discountType === 'percentage' ? numVal : Math.round(numVal * 100);

    let parsedMaxUses: number | null = null;
    if (maxUses.trim()) {
      const parsed = parseInt(maxUses.trim(), 10);
      if (isNaN(parsed) || parsed <= 0) {
        setValidationError('O limite de utilizações deve ser um número inteiro positivo.');
        return;
      }
      parsedMaxUses = parsed;
    }

    if (!applyToAllPlans && selectedPlanIds.length === 0) {
      setValidationError('Selecione pelo menos um plano aplicável ou marque a opção "Todos os planos".');
      return;
    }

    if (validFrom && validUntil) {
      const d1 = new Date(validFrom);
      const d2 = new Date(validUntil);
      if (d1 > d2) {
        setValidationError('A data inicial de validade não pode ser posterior à data final.');
        return;
      }
    }

    const payload: CreateCouponPayload = {
      code: cleanCode,
      name: name.trim() || null,
      description: description.trim() || null,
      discountType,
      discountValue: finalDiscountValue,
      validFrom: validFrom ? new Date(`${validFrom}T00:00:00Z`).toISOString() : null,
      validUntil: validUntil ? new Date(`${validUntil}T23:59:59Z`).toISOString() : null,
      maxUses: parsedMaxUses,
      applicablePlanIds: applyToAllPlans ? null : selectedPlanIds,
      status,
    };

    const success = await onSave(payload);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-coupon-form"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {couponToEdit ? `Editar Cupom: ${couponToEdit.code}` : 'Criar Novo Cupom de Desconto'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure regras promocionais, percentual ou valor fixo e vigência.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {validationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Row 1: Code and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código do Cupom <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="coupon-input-code"
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="EX: PROMO20, LANCA50"
                  maxLength={30}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold tracking-wider uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                />
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Identificador único digitado no checkout.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome / Identificação da Campanha
              </label>
              <input
                id="coupon-input-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Campanha de Lançamento 20%"
                maxLength={80}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição / Condições Comerciais
            </label>
            <textarea
              id="coupon-input-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Desconto de 20% para os primeiros 100 clientes cadastrados na plataforma."
              rows={2}
              maxLength={255}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Row 3: Discount Type & Value */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Modalidade & Valor do Desconto
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Desconto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      discountType === 'percentage'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Percentual (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed_amount')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      discountType === 'fixed_amount'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Valor Fixo (R$)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {discountType === 'percentage' ? 'Percentual de Desconto (%)' : 'Valor do Desconto em Reais (R$)'}
                </label>
                <div className="relative">
                  <input
                    id="coupon-input-discount-value"
                    type="number"
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    min="0.01"
                    max={discountType === 'percentage' ? '100' : '99999'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  />
                  <div className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">
                    {discountType === 'percentage' ? '%' : 'R$'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Validity Dates and Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Inicial de Vigência
              </label>
              <div className="relative">
                <input
                  id="coupon-input-valid-from"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Final de Validade
              </label>
              <div className="relative">
                <input
                  id="coupon-input-valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Limite de Utilizações
              </label>
              <div className="relative">
                <input
                  id="coupon-input-max-uses"
                  type="number"
                  min="1"
                  step="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Ex: 100 (vazio = ilimitado)"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Row 5: Applicable Plans */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Planos Aplicáveis
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={applyToAllPlans}
                  onChange={(e) => setApplyToAllPlans(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Aplicar a Todos os Planos
              </label>
            </div>

            {!applyToAllPlans && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-500">Selecione quais planos aceitam este cupom:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                  {availablePlans.map((plan) => {
                    const isSelected = selectedPlanIds.includes(plan.id);
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handlePlanToggle(plan.id)}
                        className={`p-2.5 text-left text-xs rounded-xl border flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block font-medium">{plan.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {plan.isFree ? 'Grátis' : `R$ ${(plan.priceCents / 100).toFixed(2)}`}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Status Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="block text-xs font-semibold text-slate-800">Status Operacional</span>
              <span className="text-[11px] text-slate-500">
                {status === 'active' ? 'Cupom ativo e aceito nos checkouts.' : 'Cupom inativo (bloqueado para novos usos).'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  status === 'active' ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    status === 'active' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ${status === 'active' ? 'text-emerald-700' : 'text-slate-500'}`}>
                {status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="coupon-btn-save"
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{couponToEdit ? 'Atualizar Cupom' : 'Cadastrar Cupom'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
