import React from 'react';
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
  XCircle,
  Clock,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import type {
  PlatformAnnouncement,
  AnnouncementType,
  AnnouncementPriority,
  SubscriptionPlan,
  CompanyRecord,
} from '../../../types/index.js';

interface AnnouncementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: PlatformAnnouncement | null;
  availablePlans: SubscriptionPlan[];
  availableCompanies: CompanyRecord[];
  onEdit: (announcement: PlatformAnnouncement) => void;
  onToggleStatus: (announcement: PlatformAnnouncement) => void;
  onDelete: (announcement: PlatformAnnouncement) => void;
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return 'Sem expiração';
  try {
    return new Date(isoDate).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export const AnnouncementDetailsModal: React.FC<AnnouncementDetailsModalProps> = ({
  isOpen,
  onClose,
  announcement,
  availablePlans,
  availableCompanies,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  if (!isOpen || !announcement) return null;

  const getTypeBadge = (type: AnnouncementType) => {
    switch (type) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5 mr-1" />
            Alerta Crítico
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Aviso
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Wrench className="w-3.5 h-3.5 mr-1" />
            Manutenção
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Atualização
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <Info className="w-3.5 h-3.5 mr-1" />
            Informativo
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Urgente
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Alta
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            Normal
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
            Baixa
          </span>
        );
    }
  };

  const targetPlanNames = (announcement.targetPlanIds || [])
    .map((id) => availablePlans.find((p) => p.id === id)?.name || id)
    .filter(Boolean);

  const targetCompanyNames = (announcement.targetCompanyIds || [])
    .map((id) => availableCompanies.find((c) => c.id === id)?.name || id)
    .filter(Boolean);

  return (
    <div
      id="announcement-details-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="announcement-details-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Detalhes do Comunicado</h3>
              <p className="text-xs text-slate-500">ID: {announcement.id}</p>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header Badges & Title */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {getTypeBadge(announcement.type)}
              {getPriorityBadge(announcement.priority)}
              {announcement.isPublished ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Publicado
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Rascunho
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {announcement.title}
            </h2>
          </div>

          {/* Message Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Mensagem
            </label>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
              {announcement.message}
            </div>
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Target Audience */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Público-Alvo
              </span>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                {announcement.targetAudience === 'all' && (
                  <>
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Todos os Usuários e Empresas</span>
                  </>
                )}
                {announcement.targetAudience === 'specific_plans' && (
                  <>
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Planos Específicos ({targetPlanNames.length})</span>
                  </>
                )}
                {announcement.targetAudience === 'specific_companies' && (
                  <>
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Empresas Específicas ({targetCompanyNames.length})</span>
                  </>
                )}
              </div>

              {announcement.targetAudience === 'specific_plans' && targetPlanNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetPlanNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              {announcement.targetAudience === 'specific_companies' && targetCompanyNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetCompanyNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Validity Period */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Período de Vigência
              </span>
              <div className="text-xs text-slate-700 space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Início: {formatDate(announcement.startsAt)}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Término: {formatDate(announcement.expiresAt)}</span>
                </div>
              </div>
            </div>

            {/* Creation Date */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Cadastrado em
              </span>
              <span className="text-xs text-slate-700">
                {formatDate(announcement.createdAt)}
              </span>
            </div>

            {/* Last Update */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Última Atualização
              </span>
              <span className="text-xs text-slate-700">
                {formatDate(announcement.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(announcement);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleStatus(announcement);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1.5 ${
                announcement.isPublished
                  ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {announcement.isPublished ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <span>Despublicar</span>
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>Publicar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(announcement);
              }}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Comunicado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
