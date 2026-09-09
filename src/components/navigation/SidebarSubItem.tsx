import React from 'react';
import type { SidebarSubItem as SidebarSubItemType } from '../../types/navigation.types.js';

interface SidebarSubItemProps {
  item: SidebarSubItemType;
  isActive: boolean;
  onSelect: (item: SidebarSubItemType) => void;
}

export const SidebarSubItem: React.FC<SidebarSubItemProps> = ({
  item,
  isActive,
  onSelect,
}) => {
  const Icon = item.icon;

  return (
    <button
      id={`subnav-item-${item.id}`}
      type="button"
      onClick={() => onSelect(item)}
      className={`w-full group flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
        isActive
          ? 'bg-slate-900 text-white font-semibold shadow-xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
        }`}
      />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span
          className={`ml-auto px-1.5 py-0.2 rounded text-[10px] font-semibold ${
            isActive
              ? 'bg-slate-800 text-slate-200'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
};
