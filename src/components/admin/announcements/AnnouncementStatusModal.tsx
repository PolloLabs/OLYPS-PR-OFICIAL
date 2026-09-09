import React from 'react';
import { AlertTriangle, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import type { PlatformAnnouncement } from '../../../types/index.js';

interface AnnouncementStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: PlatformAnnouncement | null;
  actionType: 'publish' | 'unpublish' | 'delete';
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

export const AnnouncementStatusModal: React.FC<AnnouncementStatusModalProps> = ({
  isOpen,
  onClose,
  announcement,
  actionType,
  onConfirm,
  isProcessing,
}) => {
  if (!isOpen || !announcement) return null;

  const isDelete = actionType === 'delete';
  const isPublish = actionType === 'publish';

  return (
    <div
      id="announcement-status-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="announcement-status-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-xs text-white ${
                isDelete
                  ? 'bg-rose-600'
                  : isPublish
                  ? 'bg-emerald-600'
                  : 'bg-amber-600'
              }`}
            >
              {isDelete ? (
                <Trash2 className="w-5 h-5" />
              ) : isPublish ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isDelete
                  ? 'Excluir Comunicado'
                  : isPublish
                  ? 'Publicar Comunicado'
                  : 'Despublicar Comunicado'}
              </h3>
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

        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">Comunicado:</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{announcement.title}</p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isDelete
              ? 'Tem certeza de que deseja excluir permanentemente este comunicado da plataforma? Esta ação não pode ser desfeita.'
              : isPublish
              ? 'Ao publicar, este comunicado ficará imediatamente visível para todos os usuários ou empresas pertencentes ao público-alvo configurado.'
              : 'Ao despublicar, este comunicado retornará ao status de rascunho e não será mais exibido aos usuários.'}
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors disabled:opacity-50 ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700'
                : isPublish
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isProcessing
              ? 'Processando...'
              : isDelete
              ? 'Sim, Excluir'
              : isPublish
              ? 'Sim, Publicar'
              : 'Sim, Despublicar'}
          </button>
        </div>
      </div>
    </div>
  );
};
