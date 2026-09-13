import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Clock,
  Store,
  Globe,
  ShoppingBag,
  Info,
  Search,
  Check,
  Users,
  Sliders,
  HelpCircle,
  Smartphone,
  CheckSquare,
  Square,
  ShieldCheck,
  SlidersHorizontal,
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
  availablePlans?: SubscriptionPlan[];
}

// Exemplos de catálogo para busca e seleção inteligente
const CATALOG_CATEGORIES = [
  'Smartphones & Celulares',
  'Acessórios & Cabos',
  'Fones de Ouvido & Áudio',
  'Informática & Notebooks',
  'Peças de Reposição',
  'Películas & Capas',
  'Serviços & Assistência',
  'Carregadores & Baterias',
];

const CATALOG_BRANDS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Motorola',
  'Sony',
  'JBL',
  'Anker',
  'Baseus',
  'Kingston',
  'Sandisk',
];

const CATALOG_PRODUCTS = [
  { id: 'p-1', name: 'Smartphone OLYPS X Pro 128GB', price: 2499.0, category: 'Smartphones & Celulares', brand: 'Apple' },
  { id: 'p-2', name: 'Fone Bluetooth Pro Noise Cancelling', price: 299.9, category: 'Fones de Ouvido & Áudio', brand: 'JBL' },
  { id: 'p-3', name: 'Carregador Turbo 65W GaN Type-C', price: 159.0, category: 'Carregadores & Baterias', brand: 'Baseus' },
  { id: 'p-4', name: 'Cabo USB-C Trançado Reforçado 2m', price: 49.9, category: 'Acessórios & Cabos', brand: 'Anker' },
  { id: 'p-5', name: 'Película de Vidro 9D Blindada', price: 35.0, category: 'Películas & Capas', brand: 'OLYPS' },
  { id: 'p-6', name: 'Troca de Tela LCD Display Original', price: 450.0, category: 'Serviços & Assistência', brand: 'Samsung' },
];

const CUSTOMER_GROUPS = [
  { id: 'grp-varejo', name: 'Consumidor Final (Varejo)' },
  { id: 'grp-atacado', name: 'Atacado & Lojistas' },
  { id: 'grp-vip', name: 'Clientes VIP (Fidelidade OLYPS)' },
  { id: 'grp-corp', name: 'Corporativo / Contratos PJ' },
  { id: 'grp-novos', name: 'Novos Clientes Cadastrados' },
];

export const CouponFormModal: React.FC<CouponFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  couponToEdit,
  isSaving,
  availablePlans = [],
}) => {
  // 1. Identidade
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isAutoCode, setIsAutoCode] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');

  // 2. Tipo & Valor
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('15');

  // 3. Abrangência Inteligente (Abas)
  const [scopeTab, setScopeTab] = useState<'all' | 'categories' | 'brands' | 'products'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');

  // 4. Vigência
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [status, setStatus] = useState<CouponStatus>('active');

  // 5. Aplicação
  const [channel, setChannel] = useState<'both' | 'pos' | 'online'>('both');
  const [priority, setPriority] = useState<number>(5);
  const [hasCustomerGroupRestriction, setHasCustomerGroupRestriction] = useState<boolean>(false);
  const [selectedCustomerGroups, setSelectedCustomerGroups] = useState<string[]>([]);
  const [maxUses, setMaxUses] = useState<string>('');

  // 6. Preview em tempo real - Base de cálculo
  const [simulatedPrice, setSimulatedPrice] = useState<number>(250.0);

  // Validação em tempo real
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Inicialização / Edição
  useEffect(() => {
    if (couponToEdit) {
      setName(couponToEdit.name || '');
      setCode(couponToEdit.code || '');
      setIsAutoCode(false);

      // Tenta recuperar metadados de configuração salvos na descrição caso existam
      let cleanDesc = couponToEdit.description || '';
      try {
        const match = cleanDesc.match(/<!--OLYPS_CFG:(.*?)-->/);
        if (match && match[1]) {
          const cfg = JSON.parse(match[1]);
          if (cfg.channel) setChannel(cfg.channel);
          if (cfg.priority) setPriority(cfg.priority);
          if (cfg.scopeTab) setScopeTab(cfg.scopeTab);
          if (Array.isArray(cfg.categories)) setSelectedCategories(cfg.categories);
          if (Array.isArray(cfg.brands)) setSelectedBrands(cfg.brands);
          if (Array.isArray(cfg.products)) setSelectedProducts(cfg.products);
          if (cfg.hasCustomerGroups !== undefined) setHasCustomerGroupRestriction(cfg.hasCustomerGroups);
          if (Array.isArray(cfg.customerGroups)) setSelectedCustomerGroups(cfg.customerGroups);
          cleanDesc = cleanDesc.replace(/<!--OLYPS_CFG:.*?-->/, '').trim();
        }
      } catch {
        // ignora se parsing falhar
      }

      setDescription(cleanDesc);
      setDiscountType(couponToEdit.discountType);

      if (couponToEdit.discountType === 'percentage') {
        setDiscountValue(couponToEdit.discountValue.toString());
      } else {
        const val =
          couponToEdit.discountValue >= 100
            ? (couponToEdit.discountValue / 100).toFixed(2)
            : couponToEdit.discountValue.toString();
        setDiscountValue(val);
      }

      setValidFrom(couponToEdit.validFrom ? couponToEdit.validFrom.split('T')[0] : '');
      setValidUntil(couponToEdit.validUntil ? couponToEdit.validUntil.split('T')[0] : '');
      setMaxUses(couponToEdit.maxUses ? couponToEdit.maxUses.toString() : '');
      setStatus(couponToEdit.status);
    } else {
      // Estado padrão para Novo Desconto
      const today = new Date().toISOString().split('T')[0];
      const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      setName('');
      setCode('DESC15');
      setIsAutoCode(true);
      setDescription('');
      setDiscountType('percentage');
      setDiscountValue('15');
      setScopeTab('all');
      setSelectedCategories([]);
      setSelectedBrands([]);
      setSelectedProducts([]);
      setValidFrom(today);
      setValidUntil(next30);
      setStatus('active');
      setChannel('both');
      setPriority(5);
      setHasCustomerGroupRestriction(false);
      setSelectedCustomerGroups([]);
      setMaxUses('');
      setSimulatedPrice(250.0);
    }

    setTouched({});
    setSubmitAttempted(false);
    setGlobalError(null);
  }, [couponToEdit, isOpen]);

  // Atualiza código sugerido automaticamente caso esteja em modo auto
  useEffect(() => {
    if (!couponToEdit && isAutoCode && name.trim()) {
      const generated = name
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 14);

      if (generated.length >= 2) {
        setCode(generated);
      }
    }
  }, [name, isAutoCode, couponToEdit]);

  // Validação inline em tempo real
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Nome do desconto é obrigatório.';
    }

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 2) {
      errs.code = 'Código identificador deve ter pelo menos 2 caracteres.';
    }

    const numVal = parseFloat(discountValue.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) {
      errs.discountValue = 'Informe um valor de desconto válido e maior que zero.';
    } else if (discountType === 'percentage' && numVal > 100) {
      errs.discountValue = 'O desconto percentual não pode ultrapassar 100%.';
    }

    if (validFrom && validUntil) {
      if (new Date(validFrom) > new Date(validUntil)) {
        errs.dates = 'Data de início não pode ser posterior à data de término.';
      }
    }

    if (maxUses.trim()) {
      const parsed = parseInt(maxUses.trim(), 10);
      if (isNaN(parsed) || parsed <= 0) {
        errs.maxUses = 'O limite de utilizações deve ser um número inteiro positivo.';
      }
    }

    return errs;
  }, [name, code, discountValue, discountType, validFrom, validUntil, maxUses]);

  const hasErrors = Object.keys(errors).length > 0;

  // Cálculo em Tempo Real para o Preview ao Vivo
  const calculatedDiscount = useMemo(() => {
    const numVal = parseFloat(discountValue.replace(',', '.')) || 0;
    const basePrice = Math.max(0, simulatedPrice);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (basePrice * Math.min(100, Math.max(0, numVal))) / 100;
    } else {
      discountAmount = Math.min(basePrice, Math.max(0, numVal));
    }

    const finalPrice = Math.max(0, basePrice - discountAmount);
    const savingsPercent = basePrice > 0 ? ((discountAmount / basePrice) * 100).toFixed(0) : '0';

    return {
      basePrice,
      discountAmount,
      finalPrice,
      savingsPercent,
    };
  }, [simulatedPrice, discountValue, discountType]);

  if (!isOpen) return null;

  // Handlers para Presets Rápidos de Vigência
  const applyDatePreset = (preset: 'today' | '7days' | '30days' | 'none') => {
    const todayStr = new Date().toISOString().split('T')[0];
    setValidFrom(todayStr);

    if (preset === 'today') {
      setValidUntil(todayStr);
    } else if (preset === '7days') {
      const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setValidUntil(d.toISOString().split('T')[0]);
    } else if (preset === '30days') {
      const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setValidUntil(d.toISOString().split('T')[0]);
    } else if (preset === 'none') {
      setValidUntil('');
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setGlobalError(null);

    if (hasErrors) {
      // Marca todos os campos como tocados para exibir erros inline
      setTouched({
        name: true,
        code: true,
        discountValue: true,
        dates: true,
      });
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const numVal = parseFloat(discountValue.replace(',', '.'));
    const finalDiscountValue = discountType === 'percentage' ? numVal : Math.round(numVal * 100);

    let parsedMaxUses: number | null = null;
    if (maxUses.trim()) {
      parsedMaxUses = parseInt(maxUses.trim(), 10);
    }

    // Serialização inteligente de metadados na descrição sem tocar no banco
    const metadataPayload = {
      channel,
      priority,
      scopeTab,
      categories: selectedCategories,
      brands: selectedBrands,
      products: selectedProducts,
      hasCustomerGroups: hasCustomerGroupRestriction,
      customerGroups: selectedCustomerGroups,
    };

    const combinedDescription = `${description.trim() ? description.trim() + ' ' : ''}<!--OLYPS_CFG:${JSON.stringify(
      metadataPayload
    )}-->`;

    const payload: CreateCouponPayload = {
      code: cleanCode,
      name: name.trim() || null,
      description: combinedDescription,
      discountType,
      discountValue: finalDiscountValue,
      validFrom: validFrom ? new Date(`${validFrom}T00:00:00Z`).toISOString() : null,
      validUntil: validUntil ? new Date(`${validUntil}T23:59:59Z`).toISOString() : null,
      maxUses: parsedMaxUses,
      applicablePlanIds: null,
      status,
    };

    try {
      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch {
      setGlobalError('Falha ao registrar desconto. Verifique se o código já está em uso.');
    }
  };

  // Filtros de busca de abrangência
  const filteredCategories = CATALOG_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredBrands = CATALOG_BRANDS.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );
  const filteredProducts = CATALOG_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div
      id="modal-discount-create-edit-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="modal-discount-form"
        className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]"
      >
        {/* 1. HEADER MODERNO */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/10 text-white rounded-xl backdrop-blur-xs border border-white/15 shadow-inner">
              <Tag className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  {couponToEdit ? 'Editar Desconto Comercial' : 'Novo Desconto'}
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-400/20">
                  Vender &bull; Políticas Comerciais
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Defina taxas promocionais, canais de venda, vigência e regras de abrangência
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Fechar modal de desconto"
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. CORPO DO MODAL EM 2 COLUNAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {globalError && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{globalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUNA ESQUERDA: FORMULÁRIO OPERACIONAL (7 ou 8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              {/* SEÇÃO 1: IDENTIDADE */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Identidade &bull; Nome e Descrição
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nome do Desconto <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-discount-name"
                      type="text"
                      value={name}
                      onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (touched.name) setTouched((p) => ({ ...p, name: false }));
                      }}
                      placeholder="Ex: Promoção Dia das Mães, Liquida Verão"
                      maxLength={80}
                      className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl outline-none transition-all shadow-2xs ${
                        touched.name && errors.name
                          ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                          : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                    {touched.name && errors.name && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Código do Cupom / Desconto */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Código Identificador <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAutoCode(!isAutoCode)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                      >
                        {isAutoCode ? 'Editar Manual' : 'Sugerir Auto'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="input-discount-code"
                        type="text"
                        value={code}
                        disabled={isAutoCode && !couponToEdit}
                        onBlur={() => setTouched((p) => ({ ...p, code: true }))}
                        onChange={(e) => {
                          setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                          setIsAutoCode(false);
                        }}
                        placeholder="EX: PROMO15"
                        maxLength={25}
                        className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider uppercase border rounded-xl outline-none transition-all shadow-2xs ${
                          isAutoCode && !couponToEdit ? 'bg-slate-100/80 text-slate-600 cursor-not-allowed' : 'bg-white'
                        } ${
                          touched.code && errors.code
                            ? 'border-rose-500 ring-2 ring-rose-100'
                            : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                    </div>
                    {touched.code && errors.code && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors.code}
                      </p>
                    )}
                  </div>
                </div>

                {/* Descrição Opcional */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Descrição & Condições Comerciais <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    id="input-discount-description"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Instruções para a equipe de caixa ou condições especiais aplicáveis..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs resize-none"
                  />
                </div>
              </div>

              {/* SEÇÃO 2: TIPO DE DESCONTO & VALOR */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Percent className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Tipo de Desconto &bull; Percentual ou Fixo
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {/* Controle Segmentado Animado */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Modalidade do Desconto
                    </label>
                    <div className="relative p-1 bg-slate-100 rounded-xl flex items-center border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setDiscountType('percentage')}
                        className={`relative flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer z-10 ${
                          discountType === 'percentage' ? 'text-indigo-900' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>Percentual (%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDiscountType('fixed_amount')}
                        className={`relative flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer z-10 ${
                          discountType === 'fixed_amount' ? 'text-indigo-900' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Valor Fixo (R$)</span>
                      </button>

                      {/* Pill animado de fundo com motion */}
                      <motion.div
                        layoutId="discountTypeTabBackground"
                        className="absolute top-1 bottom-1 bg-white rounded-lg shadow-xs border border-slate-200/60"
                        style={{
                          left: discountType === 'percentage' ? '4px' : 'calc(50% + 2px)',
                          width: 'calc(50% - 6px)',
                        }}
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    </div>
                  </div>

                  {/* Valor com Máscara / Formatação */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Valor do Desconto <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                        {discountType === 'percentage' ? '%' : 'R$'}
                      </div>
                      <input
                        id="input-discount-value"
                        type="text"
                        inputMode="decimal"
                        value={discountValue}
                        onBlur={() => setTouched((p) => ({ ...p, discountValue: true }))}
                        onChange={(e) => {
                          // Sanitiza para apenas números e vírgula/ponto
                          const val = e.target.value.replace(/[^0-9.,]/g, '');
                          setDiscountValue(val);
                          if (touched.discountValue) setTouched((p) => ({ ...p, discountValue: false }));
                        }}
                        placeholder={discountType === 'percentage' ? '15' : '25,00'}
                        className={`w-full pl-11 pr-3.5 py-2.5 text-sm font-bold border rounded-xl outline-none transition-all shadow-2xs ${
                          touched.discountValue && errors.discountValue
                            ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
                            : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white'
                        }`}
                      />
                    </div>
                    {touched.discountValue && errors.discountValue && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors.discountValue}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: ABRANGÊNCIA INTELIGENTE (ABAS) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Abrangência Inteligente
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {scopeTab === 'all'
                      ? 'Todos os itens'
                      : scopeTab === 'categories'
                      ? `${selectedCategories.length} categoria(s)`
                      : scopeTab === 'brands'
                      ? `${selectedBrands.length} marca(s)`
                      : `${selectedProducts.length} produto(s)`}
                  </span>
                </div>

                {/* Abas de Abrangência */}
                <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setScopeTab('all')}
                    className={`flex-1 min-w-[70px] py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      scopeTab === 'all'
                        ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeTab('categories')}
                    className={`flex-1 min-w-[90px] py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      scopeTab === 'categories'
                        ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Categorias
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeTab('brands')}
                    className={`flex-1 min-w-[80px] py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      scopeTab === 'brands'
                        ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Marcas
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeTab('products')}
                    className={`flex-1 min-w-[110px] py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      scopeTab === 'products'
                        ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Produtos Específicos
                  </button>
                </div>

                {/* Conteúdo da Aba 1: Todos */}
                {scopeTab === 'all' && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-indigo-950">Desconto Global para Todo o Catálogo</h5>
                      <p className="text-[11px] text-indigo-800/80 mt-0.5">
                        Esta regra será aplicada automaticamente a qualquer produto, plano ou serviço elegível no momento da venda.
                      </p>
                    </div>
                  </div>
                )}

                {/* Conteúdo da Aba 2: Categorias */}
                {scopeTab === 'categories' && (
                  <div className="space-y-3">
                    {/* Chips Selecionados */}
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {selectedCategories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-lg"
                          >
                            {cat}
                            <button
                              type="button"
                              onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}
                              className="hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Busca */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Buscar categoria..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Lista com checkboxes */}
                    <div className="max-h-36 overflow-y-auto space-y-1 p-1 border border-slate-100 rounded-xl">
                      {filteredCategories.map((cat) => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                          <label
                            key={cat}
                            className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-xs text-slate-700 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedCategories((p) => p.filter((c) => c !== cat));
                                } else {
                                  setSelectedCategories((p) => [...p, cat]);
                                }
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span>{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Conteúdo da Aba 3: Marcas */}
                {scopeTab === 'brands' && (
                  <div className="space-y-3">
                    {/* Chips Selecionados */}
                    {selectedBrands.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {selectedBrands.map((brand) => (
                          <span
                            key={brand}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-lg"
                          >
                            {brand}
                            <button
                              type="button"
                              onClick={() => setSelectedBrands((prev) => prev.filter((b) => b !== brand))}
                              className="hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Busca */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        placeholder="Buscar marca..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Lista com checkboxes */}
                    <div className="max-h-36 overflow-y-auto space-y-1 p-1 border border-slate-100 rounded-xl">
                      {filteredBrands.map((b) => {
                        const isSelected = selectedBrands.includes(b);
                        return (
                          <label
                            key={b}
                            className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-xs text-slate-700 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedBrands((p) => p.filter((item) => item !== b));
                                } else {
                                  setSelectedBrands((p) => [...p, b]);
                                }
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span>{b}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Conteúdo da Aba 4: Produtos Específicos */}
                {scopeTab === 'products' && (
                  <div className="space-y-3">
                    {/* Chips Selecionados */}
                    {selectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {selectedProducts.map((prodId) => {
                          const item = CATALOG_PRODUCTS.find((p) => p.id === prodId);
                          return (
                            <span
                              key={prodId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-lg"
                            >
                              {item?.name || prodId}
                              <button
                                type="button"
                                onClick={() => setSelectedProducts((prev) => prev.filter((p) => p !== prodId))}
                                className="hover:text-rose-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Busca */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar produto por nome ou categoria..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Lista com seleção de produtos */}
                    <div className="max-h-36 overflow-y-auto space-y-1 p-1 border border-slate-100 rounded-xl">
                      {filteredProducts.map((prod) => {
                        const isSelected = selectedProducts.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedProducts((p) => p.filter((id) => id !== prod.id));
                              } else {
                                setSelectedProducts((p) => [...p, prod.id]);
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{prod.name}</span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 shrink-0">
                              R$ {prod.price.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO 4: VIGÊNCIA & PRESETS RÁPIDOS */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Vigência &bull; Período de Validade
                    </h4>
                  </div>

                  {/* Switch Moderno "Ativo" */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        status === 'active' ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          status === 'active' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-xs font-bold ${
                        status === 'active' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {/* Presets Rápidos */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Presets Rápidos de Validade
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyDatePreset('today')}
                      className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('7days')}
                      className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      7 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('30days')}
                      className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      30 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('none')}
                      className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      Sem Prazo
                    </button>
                  </div>
                </div>

                {/* Campos de Data Início / Fim */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Início</label>
                    <div className="relative">
                      <input
                        id="input-discount-valid-from"
                        type="date"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Término</label>
                    <div className="relative">
                      <input
                        id="input-discount-valid-until"
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                    {!validUntil && (
                      <span className="text-[10px] text-slate-400 mt-1 block">Sem data limite definida.</span>
                    )}
                  </div>
                </div>
                {errors.dates && (
                  <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.dates}
                  </p>
                )}
              </div>

              {/* SEÇÃO 5: APLICAÇÃO (CANAL, PRIORIDADE, GRUPO DE CLIENTES) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Aplicação &bull; Canal, Prioridade e Regras
                  </h4>
                </div>

                {/* 1. Canal de Venda */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Canal de Aplicação
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setChannel('pos')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        channel === 'pos'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-2xs ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Store className="w-4 h-4 text-indigo-600" />
                      <span>PDV (Balcão)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChannel('online')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        channel === 'online'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-2xs ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <span>Online</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChannel('both')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        channel === 'both'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-2xs ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 text-indigo-600" />
                      <span>Ambos os Canais</span>
                    </button>
                  </div>
                </div>

                {/* 2. Prioridade 1-10 com Tooltip Explicativo */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Prioridade da Regra (1 a 10)</label>
                      <div className="group relative cursor-pointer">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl z-30 leading-snug">
                          A prioridade define qual desconto prevalece caso múltiplos descontos ou promoções concorram no mesmo pedido.
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                      Nível {priority} {priority >= 8 ? '(Alta)' : priority <= 3 ? '(Baixa)' : '(Média)'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>1 (Mínima)</span>
                    <span>5 (Padrão)</span>
                    <span>10 (Prioridade Absoluta)</span>
                  </div>
                </div>

                {/* 3. Grupo de Clientes (Opcional, Switch) */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-slate-800">
                        Restringir por Grupo de Clientes
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Se ativado, somente clientes vinculados aos grupos selecionados recebem o desconto.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasCustomerGroupRestriction(!hasCustomerGroupRestriction)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        hasCustomerGroupRestriction ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          hasCustomerGroupRestriction ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {hasCustomerGroupRestriction && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                      {CUSTOMER_GROUPS.map((grp) => {
                        const isSelected = selectedCustomerGroups.includes(grp.id);
                        return (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCustomerGroups((p) => p.filter((id) => id !== grp.id));
                              } else {
                                setSelectedCustomerGroups((p) => [...p, grp.id]);
                              }
                            }}
                            className={`p-2 text-left rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate pr-1">{grp.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: PREVIEW AO VIVO EM TEMPO REAL (5 ou 4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-0">
              <div className="bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 p-5 rounded-2xl border border-indigo-100/80 shadow-md space-y-4">
                {/* Header do Preview */}
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      Preview ao Vivo (Simulação)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                    Tempo Real
                  </span>
                </div>

                {/* Card de Demonstração do Produto */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                      <Smartphone className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block truncate">
                        {scopeTab === 'categories' && selectedCategories.length > 0
                          ? selectedCategories[0]
                          : 'Produto de Exemplo'}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        Smartphone OLYPS X Pro 128GB
                      </h5>
                      <span className="text-[11px] text-slate-400 font-mono">SKU-OLY-2026</span>
                    </div>
                  </div>

                  {/* Preços: Original Riscado vs Final Calculado */}
                  <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Preço Original
                      </span>
                      <span className="text-sm text-slate-400 line-through font-mono">
                        R$ {calculatedDiscount.basePrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Preço c/ Desconto
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                        R$ {calculatedDiscount.finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Pill de Economia em Destaque */}
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Economia do Cliente:
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      - R$ {calculatedDiscount.discountAmount.toFixed(2)}{' '}
                      <span className="text-[11px]">({calculatedDiscount.savingsPercent}% OFF)</span>
                    </span>
                  </div>

                  {/* Simulador de Valor Base */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Simular com outro valor base:</span>
                      <span className="font-bold text-slate-700">R$ {simulatedPrice.toFixed(0)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[50, 100, 250, 1000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSimulatedPrice(val)}
                          className={`py-1 text-[11px] font-mono rounded-lg border transition-colors cursor-pointer ${
                            simulatedPrice === val
                              ? 'bg-slate-900 text-white border-slate-900 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          R${val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resumo das Regras Ativas */}
                <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Resumo das Regras Configuradas
                  </span>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-500" />
                      Modalidade:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {discountType === 'percentage'
                        ? `${discountValue || 0}% de Desconto`
                        : `R$ ${discountValue || '0,00'} Fixo`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <Store className="w-3 h-3 text-indigo-500" />
                      Canal:
                    </span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {channel === 'both' ? 'Ambos (PDV + Online)' : channel === 'pos' ? 'PDV Balcão' : 'Online'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
                      Prioridade:
                    </span>
                    <span className="font-semibold text-slate-800">Nível {priority} de 10</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      Validade:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {validUntil
                        ? new Date(validUntil).toLocaleDateString('pt-BR')
                        : 'Indeterminada (Sem prazo)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Status:
                    </span>
                    <span
                      className={`font-bold ${
                        status === 'active' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {status === 'active' ? 'Ativo na Operação' : 'Inativo (Pausado)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. RODAPÉ DO MODAL (BOTAO SALVAR COM SPINNER + CANCELAR + VALIDAÇÃO INLINE) */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            {hasErrors && submitAttempted ? (
              <span className="text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Existem campos pendentes no formulário.
              </span>
            ) : (
              <span>* Campos obrigatórios devidamente preenchidos.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="discount-btn-save"
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{couponToEdit ? 'Atualizar Desconto' : 'Salvar Desconto'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

