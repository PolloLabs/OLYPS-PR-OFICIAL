import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Edit,
  Printer,
  Trash2,
  CheckCircle,
  Clock,
  Package,
  Send,
  AlertTriangle,
} from 'lucide-react';
import type { JobSheet, JobSheetStatus } from '../../../types/repair.types.js';

interface JobSheetActionsProps {
  jobSheet: JobSheet;
  onView: (jobSheet: JobSheet) => void;
  onEdit: (jobSheet: JobSheet) => void;
  onStatusChange: (jobSheet: JobSheet, newStatus: JobSheetStatus) => void;
  onPrint: (jobSheet: JobSheet) => void;
  onDelete: (jobSheet: JobSheet) => void;
}

export const JobSheetActions: React.FC<JobSheetActionsProps> = ({
  jobSheet,
  onView,
  onEdit,
  onStatusChange,
  onPrint,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        title="Opções da OS"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onView(jobSheet);
            }}
            className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Ver Detalhes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onEdit(jobSheet);
            }}
            className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Edit className="w-3.5 h-3.5 text-slate-400" />
            <span>Editar Ordem</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onPrint(jobSheet);
            }}
            className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Imprimir OS</span>
          </button>

          <div className="border-t border-slate-100 my-1" />

          {/* Quick status transitions */}
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Mudar Status
          </div>

          {jobSheet.status !== 'in_progress' && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onStatusChange(jobSheet, 'in_progress');
              }}
              className="w-full px-3 py-1.5 text-left text-blue-700 hover:bg-blue-50 flex items-center gap-2"
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Para Bancada</span>
            </button>
          )}

          {jobSheet.status !== 'waiting_parts' && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onStatusChange(jobSheet, 'waiting_parts');
              }}
              className="w-full px-3 py-1.5 text-left text-purple-700 hover:bg-purple-50 flex items-center gap-2"
            >
              <Package className="w-3.5 h-3.5 text-purple-500" />
              <span>Aguardar Peças</span>
            </button>
          )}

          {jobSheet.status !== 'completed' && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onStatusChange(jobSheet, 'completed');
              }}
              className="w-full px-3 py-1.5 text-left text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Concluir Reparo</span>
            </button>
          )}

          {jobSheet.status !== 'delivered' && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onStatusChange(jobSheet, 'delivered');
              }}
              className="w-full px-3 py-1.5 text-left text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-indigo-500" />
              <span>Entregar ao Cliente</span>
            </button>
          )}

          <div className="border-t border-slate-100 my-1" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDelete(jobSheet);
            }}
            className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Excluir OS</span>
          </button>
        </div>
      )}
    </div>
  );
};
