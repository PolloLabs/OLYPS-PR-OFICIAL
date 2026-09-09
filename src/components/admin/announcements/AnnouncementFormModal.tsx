import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Building2,
  Users,
  CheckCircle2,
  Save,
} from 'lucide-react';
import type {
  PlatformAnnouncement,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementTargetAudience,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  SubscriptionPlan,
  CompanyRecord,
  ApiResponse,
} from '../../../types/index.js';

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcementToEdit: PlatformAnnouncement | null;
  onSave: (payload: CreateAnnouncementInput | UpdateAnnouncementInput) => Promise<void>;
  isSaving: boolean;
}

export const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
  isOpen,
  onClose,
  announcementToEdit,
  onSave,
  isSaving,
}) => {
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [targetAudience, setTargetAudience] = useState<AnnouncementTargetAudience>('all');
  const [targetPlanIds, setTargetPlanIds] = useState<string[]>([]);
  const [targetCompanyIds, setTargetCompanyIds] = useState<string[]>([]);
  const [startsAt, setStartsAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(false);

  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyRecord[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper to format ISO to datetime-local value (YYYY-MM-DDTHH:mm)
  const formatIsoToDateTimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  // Fetch plans and companies for target selection
  useEffect(() => {
    if (!isOpen) return;

    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const authToken = localStorage.getItem('olyps_auth_token') || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        // Fetch Plans
        const plansRes = await fetch('/api/platform/subscription-plans', { headers });
        if (plansRes.ok) {
          const json = await plansRes.json();
          if (json.success && Array.isArray(json.data)) {
            setAvailablePlans(json.data);
          }
        }

        // Fetch Companies
        const compRes = await fetch('/api/platform/companies?pageSize=100', { headers });
        if (compRes.ok) {
          const json = await compRes.json();
          if (json.success && json.data) {
            const items = Array.isArray(json.data) ? json.data : json.data.items || [];
            setAvailableCompanies(items);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar planos/empresas para segmentação:', err);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [isOpen]);

  // Populate or reset form values
  useEffect(() => {
    if (!isOpen) {
      setFormError(null);
      return;
    }

    if (announcementToEdit) {
      setTitle(announcementToEdit.title);
      setMessage(announcementToEdit.message);
      setType(announcementToEdit.type);
      setPriority(announcementToEdit.priority);
      setTargetAudience(announcementToEdit.targetAudience);
      setTargetPlanIds(announcementToEdit.targetPlanIds || []);
      setTargetCompanyIds(announcementToEdit.targetCompanyIds || []);
      setStartsAt(formatIsoToDateTimeLocal(announcementToEdit.startsAt));
      setExpiresAt(formatIsoToDateTimeLocal(announcementToEdit.expiresAt));
      setIsPublished(announcementToEdit.isPublished);
    } else {
      // Default new announcement
      setTitle('');
      setMessage('');
      setType('info');
      setPriority('normal');
      setTargetAudience('all');
      setTargetPlanIds([]);
      setTargetCompanyIds([]);
      setStartsAt(formatIsoToDateTimeLocal(new Date().toISOString()));
      setExpiresAt('');
      setIsPublished(true);
    }
    setFormError(null);
  }, [announcementToEdit, isOpen]);

  if (!isOpen) return null;

  const handleTogglePlan = (planId: string) => {
    setTargetPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  const handleToggleCompany = (companyId: string) => {
    setTargetCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('O título do comunicado é obrigatório.');
      return;
    }
    if (!message.trim()) {
      setFormError('A mensagem do comunicado é obrigatória.');
      return;
    }

    if (targetAudience === 'specific_plans' && targetPlanIds.length === 0) {
      setFormError('Selecione ao menos um plano de assinatura para o público-alvo.');
      return;
    }

    if (targetAudience === 'specific_companies' && targetCompanyIds.length === 0) {
      setFormError('Selecione ao menos uma empresa para o público-alvo.');
      return;
    }

    const payload: CreateAnnouncementInput = {
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      targetAudience,
      targetPlanIds: targetAudience === 'specific_plans' ? targetPlanIds : [],
      targetCompanyIds: targetAudience === 'specific_companies' ? targetCompanyIds : [],
      startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isPublished,
    };

    try {
      await onSave(payload);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar comunicado.');
    }
  };

  return (
    <div
      id="announcement-form-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="announcement-form-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {announcementToEdit ? 'Editar Comunicado Global' : 'Novo Comunicado da Plataforma'}
              </h3>
              <p className="text-xs text-slate-500">
                Transmissão de informativos, avisos de manutenção e atualizações
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Título do Comunicado *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Manutenção Programada dos Servidores"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Type & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Mensagem *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="info">ℹ️ Informativo (Info)</option>
                <option value="update">✨ Atualização / Novidade</option>
                <option value="warning">⚠️ Aviso / Atenção</option>
                <option value="critical">🚨 Alerta Crítico</option>
                <option value="maintenance">🛠️ Manutenção do Sistema</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nível de Prioridade *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Conteúdo / Mensagem Completa *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o comunicado com todos os detalhes necessários para os clientes e usuários..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Target Audience Selector */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Público-Alvo / Segmentação *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => setTargetAudience('all')}
                className={`p-3 rounded-lg border text-left flex flex-col transition-all ${
                  targetAudience === 'all'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold text-xs">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Todos os Usuários</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  Exibido globalmente para todas as empresas
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('specific_plans')}
                className={`p-3 rounded-lg border text-left flex flex-col transition-all ${
                  targetAudience === 'specific_plans'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold text-xs">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Planos Específicos</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  Segmentado por pacotes de assinatura
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('specific_companies')}
                className={`p-3 rounded-lg border text-left flex flex-col transition-all ${
                  targetAudience === 'specific_companies'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold text-xs">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Empresas Específicas</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  Segmentado por lista de tenants
                </span>
              </button>
            </div>

            {/* Plans Multi-Select */}
            {targetAudience === 'specific_plans' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Selecione os planos que visualizarão este comunicado:
                </span>
                {availablePlans.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nenhum plano encontrado.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {availablePlans.map((plan) => (
                      <label
                        key={plan.id}
                        className="flex items-center space-x-2 text-xs text-slate-700 p-1.5 rounded-md hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={targetPlanIds.includes(plan.id)}
                          onChange={() => handleTogglePlan(plan.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="font-medium truncate">{plan.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Companies Multi-Select */}
            {targetAudience === 'specific_companies' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Selecione as empresas que visualizarão este comunicado:
                </span>
                {availableCompanies.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nenhuma empresa encontrada.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {availableCompanies.map((comp) => (
                      <label
                        key={comp.id}
                        className="flex items-center space-x-2 text-xs text-slate-700 p-1.5 rounded-md hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={targetCompanyIds.includes(comp.id)}
                          onChange={() => handleToggleCompany(comp.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="font-medium truncate">{comp.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schedule / Validity Dates */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Vigência e Período de Exibição
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">
                  Início da Exibição *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">
                  Expiração (Opcional - Em branco para sem expiração)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Publish Checkbox */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-950 block">
                Publicar Imediatamente
              </span>
              <span className="text-[11px] text-indigo-700">
                Se desmarcado, o comunicado será salvo como rascunho.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : announcementToEdit ? 'Atualizar Comunicado' : 'Criar Comunicado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
