import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Building,
  LogOut,
  UserCheck,
  CreditCard,
} from 'lucide-react';
import { SidebarItem } from './SidebarItem.js';
import type {
  SidebarSection,
  SidebarMenuItem,
  SidebarSubItem,
} from '../../types/navigation.types.js';
import type { CompanyRole } from '../../types/tenant.types.js';

interface AppSidebarProps {
  sections: SidebarSection[];
  activeItemId: string;
  activeSubItemId?: string;
  expandedGroups: Record<string, boolean>;
  isCollapsed: boolean;
  userRole: CompanyRole;
  isPlatformAdmin: boolean;
  hasRepairModule?: boolean;
  activeCompanyName?: string;
  onToggleCollapse: () => void;
  onToggleGroup: (groupId: string) => void;
  onSelectMainItem: (item: SidebarMenuItem) => void;
  onSelectSubItem: (subItem: SidebarSubItem, parentItem: SidebarMenuItem) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  sections,
  activeItemId,
  activeSubItemId,
  expandedGroups,
  isCollapsed,
  userRole,
  isPlatformAdmin,
  hasRepairModule = true,
  activeCompanyName,
  onToggleCollapse,
  onToggleGroup,
  onSelectMainItem,
  onSelectSubItem,
}) => {
  return (
    <aside
      id="app-main-sidebar"
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-200 select-none z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      aria-label="Navegação Principal do Sistema"
    >
      {/* Sidebar Header: Brand & Applet Context */}
      <div className="h-16 border-b border-slate-200 px-3 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs tracking-wider shrink-0 shadow-xs">
              OP
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight truncate">
                  OLYPS PRO
                </span>
                {isPlatformAdmin && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                    SUPER
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {activeCompanyName || 'Gestão Empresarial'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs tracking-wider shadow-xs">
              OP
            </div>
          </div>
        )}

        {/* Collapse Toggle Button (Top) */}
        {!isCollapsed && (
          <button
            id="sidebar-toggle-collapse-btn"
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Recolher menu lateral"
            aria-label="Recolher menu lateral"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {/* Destaque: Acesso Rápido ao PDV (Ponto de Venda) */}
        <div className="mb-3 px-0.5">
          <button
            id="sidebar-quick-pdv-btn"
            type="button"
            onClick={() => {
              window.location.hash = '#/pdv/create';
            }}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 gap-2.5'
            } rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer shadow-xs ${
              activeSubItemId === 'sub-sales-pos' || (typeof window !== 'undefined' && (window.location.hash.includes('pdv') || window.location.hash.includes('pos')))
                ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-400/40'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-900 border border-blue-200/80'
            }`}
            title="Acessar PDV (Ponto de Venda)"
          >
            <CreditCard className="w-4 h-4 shrink-0 text-current" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full text-left">
                <span className="font-extrabold tracking-wide">PDV</span>
                <span className="text-[10px] bg-blue-700/80 text-white px-2 py-0.5 rounded-full font-bold">
                  CAIXA
                </span>
              </div>
            )}
          </button>
        </div>

        {sections.map((section) => {
          // Ocultar sec-repair se reparar === false e não for Super Admin
          if (section.id === 'sec-repair' && !isPlatformAdmin && hasRepairModule === false) {
            return null;
          }

          // Filter items based on platform scope and feature flags
          const visibleItems = section.items.filter((item) => {
            if (item.scope === 'platform' && !isPlatformAdmin) {
              return false;
            }
            if (item.id === 'nav-repair' && !isPlatformAdmin && hasRepairModule === false) {
              return false;
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.id} id={`sidebar-section-${section.id}`} className="space-y-1">
              {visibleItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  isActive={activeItemId === item.id}
                  activeSubItemId={activeSubItemId}
                  isExpanded={Boolean(expandedGroups[item.id])}
                  isCollapsedSidebar={isCollapsed}
                  onToggleExpand={onToggleGroup}
                  onSelectMain={onSelectMainItem}
                  onSelectSub={onSelectSubItem}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer: User Context & Expand Button */}
      <div className="border-t border-slate-200 p-2 bg-slate-50/75">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5 px-2 py-1.5 rounded-md bg-white border border-slate-200 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-900 block truncate">
                  Admin Master
                </span>
                <span className="text-[10px] text-slate-500 capitalize block truncate">
                  {userRole.replace('_', ' ')}
                </span>
              </div>
              {isPlatformAdmin && (
                <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" title="Super Admin" />
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-500 font-mono">v2.9 &bull; OLYPS PRO</span>
              <button
                id="sidebar-quick-collapse-btn"
                type="button"
                onClick={onToggleCollapse}
                className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1"
                aria-label="Recolher Sidebar"
              >
                <span>Recolher</span>
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 py-1">
            <button
              id="sidebar-expand-btn"
              type="button"
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Expandir menu lateral"
              aria-label="Expandir menu lateral"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
