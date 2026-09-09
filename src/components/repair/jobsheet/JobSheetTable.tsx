import React from 'react';
import {
  Smartphone,
  Laptop,
  Gamepad2,
  Tablet,
  Cpu,
  User,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { JobSheetActions } from './JobSheetActions.js';
import type { JobSheet, JobSheetStatus, JobSheetPriority } from '../../../types/repair.types.js';

interface JobSheetTableProps {
  jobSheets: JobSheet[];
  isLoading?: boolean;
  onView: (jobSheet: JobSheet) => void;
  onEdit: (jobSheet: JobSheet) => void;
  onStatusChange: (jobSheet: JobSheet, newStatus: JobSheetStatus) => void;
  onPrint: (jobSheet: JobSheet) => void;
  onDelete: (jobSheet: JobSheet) => void;
}

export const JobSheetTable: React.FC<JobSheetTableProps> = ({
  jobSheets,
  isLoading,
  onView,
  onEdit,
  onStatusChange,
  onPrint,
  onDelete,
}) => {
  const formatBRL = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: JobSheetStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'in_progress':
        return {
          label: 'Em Bancada',
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'waiting_parts':
        return {
          label: 'Aguardando Peças',
          classes: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'approved':
        return {
          label: 'Aprovado',
          classes: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        };
      case 'completed':
        return {
          label: 'Concluído',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'delivered':
        return {
          label: 'Entregue',
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          classes: 'bg-slate-100 text-slate-600 border-slate-200',
        };
      default:
        return {
          label: status,
          classes: 'bg-slate-50 text-slate-600 border-slate-200',
        };
    }
  };

  const getPriorityBadge = (priority: JobSheetPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'low':
        return 'bg-slate-50 text-slate-500 border-slate-100';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    const lower = deviceType.toLowerCase();
    if (lower.includes('smart') || lower.includes('celular') || lower.includes('phone')) return Smartphone;
    if (lower.includes('note') || lower.includes('lap') || lower.includes('computador')) return Laptop;
    if (lower.includes('console') || lower.includes('game')) return Gamepad2;
    if (lower.includes('tab') || lower.includes('ipad')) return Tablet;
    return Cpu;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (jobSheets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">Nenhuma Ordem de Serviço encontrada</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Tente ajustar os filtros acima ou registre uma nova ordem de serviço para iniciar a bancada.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">OS & Data</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Aparelho</th>
              <th className="py-3 px-4">Defeito Relatado</th>
              <th className="py-3 px-4">Técnico</th>
              <th className="py-3 px-4">Prioridade</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Valor Final</th>
              <th className="py-3 px-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {jobSheets.map((sheet) => {
              const DeviceIcon = getDeviceIcon(sheet.deviceType);
              const statusBadge = getStatusBadge(sheet.status);

              return (
                <tr key={sheet.id} className="hover:bg-slate-50/75 transition-colors group">
                  {/* OS & Data */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onView(sheet)}
                      className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline block"
                    >
                      {sheet.jobSheetNumber}
                    </button>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(sheet.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{sheet.customerName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {sheet.customerPhone}
                    </div>
                  </td>

                  {/* Aparelho */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded text-slate-600">
                        <DeviceIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{sheet.model}</div>
                        <div className="text-[11px] text-slate-400">
                          {sheet.brand} • {sheet.deviceType}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Defeito */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="line-clamp-2 text-slate-600 text-[11px] leading-relaxed">
                      {sheet.reportedDefect}
                    </div>
                  </td>

                  {/* Técnico */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-700 font-medium">
                      {sheet.technicianName || '—'}
                    </span>
                  </td>

                  {/* Prioridade */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                        sheet.priority
                      )}`}
                    >
                      {sheet.priority.toUpperCase()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge.classes}`}
                    >
                      {statusBadge.label}
                    </span>
                  </td>

                  {/* Valor Final */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-slate-900">
                    {formatBRL(sheet.finalCostCents)}
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <JobSheetActions
                      jobSheet={sheet}
                      onView={onView}
                      onEdit={onEdit}
                      onStatusChange={onStatusChange}
                      onPrint={onPrint}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
