import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Save,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import type {
  SubscriptionPlan,
  CreatePlanPayload,
  UpdatePlanPayload,
  PlanBillingPeriod,
  PlanStatus,
} from '../../../types/index.js';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreatePlanPayload | UpdatePlanPayload) => Promise<void>;
  planToEdit: SubscriptionPlan | null;
  isSaving: boolean;
  nextDisplayOrder?: number;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  planToEdit,
  isSaving,
  nextDisplayOrder = 1,
}) => {
  const isEditing = Boolean(planToEdit);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [priceBrl, setPriceBrl] = useState('0,00');
  const [billingPeriod, setBillingPeriod] = useState<PlanBillingPeriod>('monthly');
  const [isFree, setIsFree] = useState(false);
  const [durationDays, setDurationDays] = useState(30);

  // Features list
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Structured Limits
  const [maxUsers, setMaxUsers] = useState(1);
  const [maxLocations, setMaxLocations] = useState(1);
  const [maxProducts, setMaxProducts] = useState(100);
  const [maxClients, setMaxClients] = useState(500);
  const [hasNfe, setHasNfe] = useState(false);
  const [hasPdv, setHasPdv] = useState(true);
  const [reparar, setReparar] = useState(true);

  // Publication & Ordering
  const [isPublic, setIsPublic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [status, setStatus] = useState<PlanStatus>('active');

  const [formError, setFormError] = useState<string | null>(null);

  // Populate when modal opens or planToEdit changes
  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name || '');
      setCode(planToEdit.code || '');
      setDescription(planToEdit.description || '');
      setPriceBrl((planToEdit.priceCents / 100).toFixed(2).replace('.', ','));
      setBillingPeriod(planToEdit.billingPeriod || 'monthly');
      setIsFree(Boolean(planToEdit.isFree));
      setDurationDays(planToEdit.isFree ? 0 : (planToEdit.durationDays || 30));
      setFeatures(Array.isArray(planToEdit.features) ? [...planToEdit.features] : []);
      
      const limits = planToEdit.limits || {};
      setMaxUsers(typeof limits.max_users === 'number' ? limits.max_users : 1);
      setMaxLocations(typeof limits.max_locations === 'number' ? limits.max_locations : 1);
      setMaxProducts(typeof limits.max_products === 'number' ? limits.max_products : 100);
      setMaxClients(typeof limits.max_clients === 'number' ? limits.max_clients : 500);
      setHasNfe(Boolean(limits.has_nfe));
      setHasPdv(Boolean(limits.has_pdv));
      setReparar(limits.reparar !== false);

      setIsPublic(planToEdit.isPublic !== undefined ? Boolean(planToEdit.isPublic) : true);
      setIsFeatured(Boolean(planToEdit.isFeatured));
      setDisplayOrder(planToEdit.displayOrder ?? 1);
      setStatus(planToEdit.status || 'active');
    } else {
      // Default new plan values with clean fresh state
      setName('');
      setCode('');
      setDescription('');
      setPriceBrl('0,00');
      setBillingPeriod('monthly');
      setIsFree(false);
      setDurationDays(30);
      setFeatures([]);
      setMaxUsers(1);
      setMaxLocations(1);
      setMaxProducts(100);
      setMaxClients(500);
      setHasNfe(false);
      setHasPdv(true);
      setReparar(true);
      setIsPublic(true);
      setIsFeatured(false);
      setDisplayOrder(nextDisplayOrder);
      setStatus('active');
    }
    setNewFeatureText('');
    setFormError(null);
  }, [planToEdit, isOpen, nextDisplayOrder]);

  // Handle Free toggle
  const handleToggleFree = (checked: boolean) => {
    setIsFree(checked);
    if (checked) {
      setPriceBrl('0,00');
      setDurationDays(0);
    } else {
      if (priceBrl === '0,00') setPriceBrl('49,00');
      if (durationDays === 0) setDurationDays(30);
    }
  };

  // Add Feature
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures((prev) => [...prev, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  // Remove Feature
  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-slugify code from name if creating new
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && (!code || code === slugify(name))) {
      setCode(slugify(val));
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('O nome do plano é obrigatório.');
      return;
    }

    if (!code.trim()) {
      setFormError('O código identificador do plano é obrigatório.');
      return;
    }

    // Parse price to cents
    let priceCents = 0;
    if (!isFree) {
      const cleanPrice = priceBrl.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanPrice);
      if (isNaN(parsed) || parsed < 0) {
        setFormError('Por favor informe um preço válido.');
        return;
      }
      priceCents = Math.round(parsed * 100);
    }

    const payload: CreatePlanPayload = {
      name: name.trim(),
      code: code.trim().toLowerCase(),
      description: description.trim() || undefined,
      priceCents,
      billingPeriod,
      durationDays: isFree ? 0 : Math.max(0, Number(durationDays) || 30),
      isFree,
      isPublic,
      isFeatured,
      displayOrder: Number(displayOrder) || 10,
      status,
      features,
      limits: {
        max_users: Number(maxUsers) || 1,
        max_locations: Number(maxLocations) || 1,
        max_products: Number(maxProducts) || 50,
        max_clients: Number(maxClients) || 100,
        has_nfe: Boolean(hasNfe),
        has_pdv: Boolean(hasPdv),
        reparar: Boolean(reparar),
      },
    };

    try {
      await onSave(payload);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar plano.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Editar Plano: ${planToEdit?.name}` : 'Cadastrar Novo Plano Comercial'}
              </h2>
              <p className="text-xs text-slate-500">
                Defina precificação, vigência padrão, limites de recursos e visibilidade na vitrine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Informações Comerciais */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Informações Comerciais e Preço</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Profissional, Básico, Degustação"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Código Único (Slug) *</span>
                  {isEditing && (
                    <span className="text-[10px] text-amber-600 font-normal">
                      Cuidado ao alterar código ativo
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: pro, basic, free"
                  value={code}
                  onChange={(e) => setCode(slugify(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição Comercial
              </label>
              <textarea
                rows={2}
                placeholder="Breve resumo comercial exibido na Landing Page e no resumo de faturamento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Gratuidade e Preço */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => handleToggleFree(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Plano Gratuito (Sem cobrança / Degustação)
                  </span>
                </label>
                {isFree && (
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Vigência contínua sem vencimento compulsório
                  </span>
                )}
              </div>

              {!isFree && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preço (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="49,00"
                        value={priceBrl}
                        onChange={(e) => setPriceBrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Periodicidade de Cobrança
                    </label>
                    <select
                      value={billingPeriod}
                      onChange={(e) => setBillingPeriod(e.target.value as PlanBillingPeriod)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="monthly">Mensal (/mês)</option>
                      <option value="quarterly">Trimestral (/trimestre)</option>
                      <option value="semiannual">Semestral (/semestre)</option>
                      <option value="yearly">Anual (/ano)</option>
                      <option value="lifetime">Vitalício (Único)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Vigência do Pacote */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Vigência e Duração da Assinatura</span>
            </h3>

            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2 text-xs text-blue-900">
              <div className="flex items-start space-x-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  <strong>Regra de Ouro da Vigência:</strong> Para planos pagos, a contagem de vigência inicia
                  <strong> somente quando o Super Admin ativa a assinatura</strong>. O padrão dos planos pagos atuais é de 30 dias.
                </p>
              </div>

              {!isFree && (
                <div className="pt-2 max-w-xs">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duração em Dias (padrão 30 dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Limites Operacionais Estruturados */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Limites e Cotas Operacionais (JSONB)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Máx. Usuários (max_users)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">9999 = Ilimitado</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Máx. Locais (max_locations)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxLocations}
                  onChange={(e) => setMaxLocations(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">999 = Ilimitado</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Máx. Produtos (max_products)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(parseInt(e.target.value, 10) || 50)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">99999 = Ilimitado</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Máx. Clientes (max_clients)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxClients}
                  onChange={(e) => setMaxClients(parseInt(e.target.value, 10) || 100)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">99999 = Ilimitado</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hasPdv}
                  onChange={(e) => setHasPdv(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Módulo PDV Frente de Caixa (has_pdv)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hasNfe}
                  onChange={(e) => setHasNfe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Emissão Fiscal NFC-e / NF-e (has_nfe)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  id="plan-limit-reparar"
                  checked={reparar}
                  onChange={(e) => setReparar(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Reparar (Módulo de Reparos / Ordem de Serviço)</span>
              </label>
            </div>
          </div>

          {/* Section 4: Lista Dinâmica de Benefícios / Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>4. Benefícios Comerciais (Lista de Recursos)</span>
            </h3>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Adicionar novo benefício (ex: Suporte VIP 24h, Relatórios Avançados)..."
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {features.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">
                  Nenhum benefício adicionado ainda. Insira itens acima para destacar na vitrine pública.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {features.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-700 shadow-2xs"
                    >
                      <span className="truncate pr-2">&bull; {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remover benefício"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Publicação, Destaque e Ordenação */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>5. Publicação e Governança</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Operacional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlanStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Ativo (Habilitado)</option>
                  <option value="inactive">Inativo (Oculto)</option>
                  <option value="archived">Arquivado (Legado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ordem de Exibição (display_order)
                </label>
                <input
                  type="number"
                  min={1}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Público na Vitrine (is_public)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Destaque "Mais Popular" (is_featured)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Plano'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
