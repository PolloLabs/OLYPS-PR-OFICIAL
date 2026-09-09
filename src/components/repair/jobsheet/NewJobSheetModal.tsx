import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Wrench,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Gamepad2,
  Watch,
  HelpCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  ShieldAlert,
  FileText,
  DollarSign,
  User,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import { useNewJobSheet } from '../../../hooks/repair/useNewJobSheet.js';
import { useRepairSettings } from '../../../hooks/repair/useRepairSettings.js';
import type { ProductBrand } from '../../../types/repair.types.js';

interface NewJobSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess?: () => void;
}

const DEVICE_TYPES = [
  { id: 'Smartphone', label: 'Smartphone', icon: Smartphone },
  { id: 'Notebook', label: 'Notebook', icon: Laptop },
  { id: 'Desktop', label: 'Desktop / PC', icon: Monitor },
  { id: 'Tablet', label: 'Tablet', icon: Tablet },
  { id: 'Console', label: 'Console', icon: Gamepad2 },
  { id: 'Smartwatch', label: 'Smartwatch', icon: Watch },
  { id: 'Outro', label: 'Outro Equipamento', icon: HelpCircle },
];

export const NewJobSheetModal: React.FC<NewJobSheetModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}) => {
  const {
    loading,
    error,
    brands,
    formData,
    handleInputChange,
    handleBrandSelect,
    submitJobSheet,
    resetForm,
  } = useNewJobSheet(companyId);

  const { settings } = useRepairSettings(companyId);

  const [brandSearch, setBrandSearch] = useState('');
  const [isCustomBrandMode, setIsCustomBrandMode] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Set default status when settings are loaded
  useEffect(() => {
    if (settings?.general?.defaultStatusId && !formData.statusId) {
      handleInputChange('statusId', settings.general.defaultStatusId);
    }
  }, [settings, formData.statusId]);

  // Pre-load default template texts if available and form is empty
  useEffect(() => {
    if (isOpen && settings?.general) {
      if (!formData.reportedDefect && settings.general.customerReportedProblem) {
        handleInputChange('reportedDefect', settings.general.customerReportedProblem);
      }
      if (!formData.accessories && settings.general.productConfiguration) {
        handleInputChange('accessories', settings.general.productConfiguration);
      }
    }
  }, [isOpen, settings]);

  // Filtered brands based on search
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase().trim();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  // Filtered device models registered for the selected brand/deviceType
  const suggestedModels = useMemo(() => {
    if (!settings?.deviceModels || !formData.brandName) return [];
    return settings.deviceModels.filter(
      (m) =>
        m.brand.toLowerCase() === formData.brandName.toLowerCase() ||
        (m.deviceType.toLowerCase() === formData.deviceType.toLowerCase() &&
          m.brand.toLowerCase() === formData.brandName.toLowerCase())
    );
  }, [settings, formData.brandName, formData.deviceType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validações
    if (!formData.customerName.trim()) {
      setValidationError('O nome do cliente é obrigatório.');
      return;
    }
    if (!formData.customerPhone.trim()) {
      setValidationError('O telefone do cliente é obrigatório.');
      return;
    }
    if (!formData.brandId && !formData.brandName.trim()) {
      setValidationError('Selecione ou informe a marca do dispositivo.');
      return;
    }
    if (!formData.model.trim()) {
      setValidationError('O modelo do equipamento é obrigatório.');
      return;
    }
    if (!formData.reportedDefect.trim()) {
      setValidationError('O defeito relatado é obrigatório.');
      return;
    }

    const ok = await submitJobSheet();
    if (ok) {
      resetForm();
      setIsCustomBrandMode(false);
      setBrandSearch('');
      onSuccess?.();
      onClose();
    }
  };

  const handleSelectBrandItem = (brand: ProductBrand) => {
    handleBrandSelect(brand.id, brand.name);
    setIsCustomBrandMode(false);
  };

  const handleSelectCustomBrand = () => {
    setIsCustomBrandMode(true);
    handleBrandSelect('', brandSearch.trim() || formData.brandName);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Nova Ordem de Serviço / Folha de Trabalho
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Marcas sincronizadas com o Módulo de Produtos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {(validationError || error) && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError || error}</span>
            </div>
          )}

          {/* SEÇÃO 1: DADOS DO CLIENTE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <User className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Identificação do Cliente
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome do Cliente <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Ex: Roberto Carlos Pereira"
                    className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={formData.customerEmail || ''}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  CPF ou CNPJ <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.customerDocument || ''}
                    onChange={(e) => handleInputChange('customerDocument', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: TIPO DE DISPOSITIVO & MARCA INTEGRADA */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Equipamento e Marca do Catálogo
              </h4>
            </div>

            {/* Seletor de Tipo de Aparelho */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Tipo de Dispositivo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                {DEVICE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.deviceType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleInputChange('deviceType', type.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-xs ring-1 ring-indigo-500/20 font-bold'
                          : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="text-[11px] leading-tight truncate w-full">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELETOR DE MARCA INTEGRADA COM PRODUTOS */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Marca do Equipamento</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    {isCustomBrandMode ? 'Modo: Marca Manual' : 'Catálogo de Marcas'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomBrandMode(!isCustomBrandMode)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {isCustomBrandMode ? 'Escolher do Catálogo' : '+ Digitar outra marca'}
                  </button>
                </div>
              </div>

              {!isCustomBrandMode ? (
                <div>
                  {/* Busca Rápida de Marcas */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Filtrar marcas do catálogo..."
                      className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Pills de marcas ativas */}
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-slate-100">
                    {filteredBrands.map((brand) => {
                      const isSelected =
                        formData.brandId === brand.id ||
                        formData.brandName.toLowerCase() === brand.name.toLowerCase();
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => handleSelectBrandItem(brand)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          <span>{brand.name}</span>
                        </button>
                      );
                    })}

                    {filteredBrands.length === 0 && (
                      <div className="w-full py-2 px-3 text-center text-slate-400 flex items-center justify-center gap-2">
                        <span>Nenhuma marca encontrada.</span>
                        <button
                          type="button"
                          onClick={handleSelectCustomBrand}
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Usar "{brandSearch}"
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={(e) => {
                      handleInputChange('brandName', e.target.value);
                      handleInputChange('brandId', '');
                    }}
                    placeholder="Digite o nome da marca (Ex: OnePlus, Realme, Acer)"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomBrandMode(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
                  >
                    Voltar ao Catálogo
                  </button>
                </div>
              )}

              {formData.brandName && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Marca selecionada: <strong>{formData.brandName}</strong>
                    {formData.brandId && (
                      <span className="text-slate-400 font-normal ml-1">
                        (ID: {formData.brandId})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Modelo e Detalhes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Modelo do Equipamento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Ex: Galaxy S23 Ultra, iPhone 14 Pro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                {/* Modelos sugeridos da marca */}
                {suggestedModels.length > 0 && !formData.model && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-400">Sugestões:</span>
                    {suggestedModels.slice(0, 3).map((sm) => (
                      <button
                        key={sm.id}
                        type="button"
                        onClick={() => handleInputChange('model', sm.modelName)}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded transition-colors"
                      >
                        {sm.modelName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  IMEI ou Número de Série
                </label>
                <input
                  type="text"
                  value={formData.serialNumber || ''}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="Ex: 356789012345678"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cor do Aparelho
                </label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="Ex: Preto espacial, Prata, Azul"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Senha / Padrão de Desbloqueio
                </label>
                <input
                  type="text"
                  value={formData.devicePassword || ''}
                  onChange={(e) => handleInputChange('devicePassword', e.target.value)}
                  placeholder="Ex: 123456 ou Padrão em L"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Acessórios Deixados com o Aparelho
              </label>
              <input
                type="text"
                value={formData.accessories || ''}
                onChange={(e) => handleInputChange('accessories', e.target.value)}
                placeholder="Ex: Carregador original, capa protetora de silicone, película de vidro"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* SEÇÃO 3: DIAGNÓSTICO, VALORES E TÉCNICO */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Defeito Relatado e Diagnóstico Técnico
              </h4>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Defeito Relatado pelo Cliente <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.reportedDefect}
                onChange={(e) => handleInputChange('reportedDefect', e.target.value)}
                placeholder="Ex: Aparelho não carrega, display apresentando listras verdes após queda..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Análise Técnica Prévia / Diagnóstico Inicial
              </label>
              <textarea
                rows={2}
                value={formData.technicalDiagnosis || ''}
                onChange={(e) => handleInputChange('technicalDiagnosis', e.target.value)}
                placeholder="Ex: Conector de carga oxidado, necessidade de troca do módulo frontal..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Técnico Responsável
                </label>
                <input
                  type="text"
                  value={formData.responsibleTechnician || ''}
                  onChange={(e) => handleInputChange('responsibleTechnician', e.target.value)}
                  placeholder="Ex: Rodrigo Alves"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prioridade do Reparo
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Valor Estimado / Orçamento (R$)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.finalValue || ''}
                    onChange={(e) => handleInputChange('finalValue', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Inicial da Ordem de Serviço
              </label>
              <select
                value={formData.statusId || 'pending'}
                onChange={(e) => handleInputChange('statusId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {settings?.statuses && settings.statuses.length > 0 ? (
                  settings.statuses.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.emoji ? `${st.emoji} ` : ''}{st.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="pending">⏳ Pendente / Triagem</option>
                    <option value="in_progress">🔧 Em Andamento / Bancada</option>
                    <option value="waiting_parts">📦 Aguardando Peças</option>
                    <option value="approved">✅ Orçamento Aprovado</option>
                    <option value="completed">🎉 Reparo Concluído</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-white">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Limpar Campos
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Ordem...</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    <span>Cadastrar Ordem de Serviço</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
