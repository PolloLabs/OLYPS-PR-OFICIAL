import React from 'react';
import { Building2, CheckCircle2, AlertOctagon, Clock, Users, Shield } from 'lucide-react';
import type { PlatformDashboardSummary } from '../../types/index.js';

interface DashboardSummaryCardsProps {
  summary: PlatformDashboardSummary;
  isLoading: boolean;
}

export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
  summary,
  isLoading,
}) => {
  const cards = [
    {
      id: 'metric-card-total-companies',
      label: 'Total de Empresas',
      value: summary.totalCompanies,
      icon: Building2,
      color: 'text-slate-900',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200',
      description: 'Tenants registrados',
    },
    {
      id: 'metric-card-active-companies',
      label: 'Empresas Ativas',
      value: summary.activeCompanies,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'Operando normalmente',
    },
    {
      id: 'metric-card-suspended-companies',
      label: 'Empresas Suspensas',
      value: summary.suspendedCompanies,
      icon: AlertOctagon,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'Acesso bloqueado temporariamente',
    },
    {
      id: 'metric-card-pending-companies',
      label: 'Pendentes / Inativas',
      value: summary.pendingCompanies + summary.inactiveCompanies,
      icon: Clock,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      description: `${summary.pendingCompanies} pendentes, ${summary.inactiveCompanies} inativas`,
    },
    {
      id: 'metric-card-memberships',
      label: 'Usuários Vinculados',
      value: summary.totalMemberships,
      icon: Users,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Memberships ativos em empresas',
    },
    {
      id: 'metric-card-platform-admins',
      label: 'Super Admins',
      value: summary.totalPlatformAdmins,
      icon: Shield,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Acesso global de governança',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className={`bg-white rounded-lg border ${card.borderColor} p-4 shadow-sm transition-all hover:shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
              <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-bold ${card.color}`}>
                {isLoading ? '...' : card.value}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
