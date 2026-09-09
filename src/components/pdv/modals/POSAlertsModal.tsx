import React, { useState } from 'react';
import { X, AlertTriangle, PackageX, Clock, CheckCircle2, Bell } from 'lucide-react';
import type { POSAlert } from '../../../types/pos.types.js';

interface POSAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: POSAlert[];
  onMarkAsRead: () => void;
}

export const POSAlertsModal: React.FC<POSAlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkAsRead,
}) => {
  const [filter, setFilter] = useState<'all' | 'stock' | 'payment' | 'system'>('all');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return <PackageX className="w-4 h-4 text-rose-500 flex-shrink-0" />;
      case 'payment':
        return <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
            Crítico
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            Atenção
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
            Informativo
          </span>
        );
    }
  };

  return (
    <div
      id="modal-pos-alerts-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-alerts"
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                Alertas do Caixa & Sistema
              </h3>
              <p className="text-[11px] text-slate-500">
                Avisos em tempo real de estoque, pagamentos e caixa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onMarkAsRead}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer pr-6"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Marcar lidos</span>
          </button>
        </div>

        {/* Filtro rápido */}
        <div className="flex items-center gap-1.5 mb-3">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'stock', label: 'Estoque Baixo' },
            { id: 'payment', label: 'Pagamentos' },
            { id: 'system', label: 'Sistema' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lista de Alertas */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhum alerta pendente nesta categoria.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                  alert.isRead
                    ? 'bg-slate-50/60 border-slate-200 opacity-70'
                    : 'bg-white border-amber-200 shadow-xs'
                }`}
              >
                <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-slate-800 truncate">
                      {alert.title}
                    </h4>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {alert.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {alert.createdAt}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
