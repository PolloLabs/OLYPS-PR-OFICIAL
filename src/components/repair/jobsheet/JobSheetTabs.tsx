import React from 'react';
import type { JobSheetStatus } from '../../../types/repair.types.js';

export type JobSheetTabType = JobSheetStatus | 'all';

interface JobSheetTabsProps {
  activeTab: JobSheetTabType;
  counts: Record<JobSheetTabType, number>;
  onTabChange: (tab: JobSheetTabType) => void;
}

export const JobSheetTabs: React.FC<JobSheetTabsProps> = ({ activeTab, counts, onTabChange }) => {
  const tabs: { id: JobSheetTabType; label: string; badgeColor: string }[] = [
    { id: 'all', label: 'Todas as OS', badgeColor: 'bg-slate-100 text-slate-700' },
    { id: 'pending', label: 'Pendentes', badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'in_progress', label: 'Em Bancada', badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'waiting_parts', label: 'Aguardando Peças', badgeColor: 'bg-purple-100 text-purple-800' },
    { id: 'completed', label: 'Concluídas', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'delivered', label: 'Entregues', badgeColor: 'bg-indigo-100 text-indigo-800' },
    { id: 'cancelled', label: 'Canceladas', badgeColor: 'bg-slate-200 text-slate-600' },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id] || 0;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              isActive
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-slate-800 text-white' : tab.badgeColor
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
