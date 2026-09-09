import React from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Package,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import type { RepairDashboardSummary } from '../../../types/repair.types.js';

interface StatusCardsProps {
  summary: RepairDashboardSummary | null;
  isLoading?: boolean;
}

export const StatusCards: React.FC<StatusCardsProps> = ({ summary, isLoading }) => {
  const formatBRL = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'stat-total',
      title: 'Total de OS',
      value: summary?.totalJobSheets ?? 0,
      description: 'Ordens cadastradas',
      icon: Wrench,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      id: 'stat-in-progress',
      title: 'Em Bancada / Andamento',
      value: summary?.inProgressCount ?? 0,
      description: `${summary?.pendingCount ?? 0} pendentes de triagem`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      id: 'stat-waiting-parts',
      title: 'Aguardando Peças',
      value: summary?.waitingPartsCount ?? 0,
      description: 'Peças em trânsito/fornecedor',
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      id: 'stat-completed',
      title: 'Concluídas / Entregues',
      value: (summary?.completedCount ?? 0) + (summary?.deliveredCount ?? 0),
      description: `${summary?.deliveredCount ?? 0} entregues ao cliente`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      id: 'stat-revenue',
      title: 'Faturamento de Reparos',
      value: formatBRL(summary?.totalRevenueCents ?? 0),
      description: `Ticket médio: ${formatBRL(summary?.avgTicketCents ?? 0)}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      colSpan: 'sm:col-span-2 lg:col-span-4',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            id={c.id}
            className={`bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow flex items-start justify-between ${
              c.colSpan ? c.colSpan : ''
            }`}
          >
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 tracking-tight">{c.title}</span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{c.value}</div>
              <p className="text-xs text-slate-500">{c.description}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${c.bg} ${c.color} border ${c.border}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
