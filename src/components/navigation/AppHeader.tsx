import React from 'react';
import {
  Menu,
  ChevronRight,
  Building2,
  ShieldCheck,
  RefreshCw,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { NotificationBellDropdown } from '../notifications/index.js';
import type { CompanyRole } from '../../types/tenant.types.js';

interface AppHeaderProps {
  breadcrumb: { section?: string; main: string; sub?: string };
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  userRole: CompanyRole;
  onChangeUserRole: (role: CompanyRole) => void;
  isPlatformAdmin: boolean;
  onTogglePlatformAdmin: () => void;
  activeCompanyName: string;
  onChangeCompany: (companyName: string) => void;
  availableCompanies: string[];
  isLoading: boolean;
  onRefresh: () => void;
  onNavigate?: (path: string) => void;
  onShowNotification?: (type: 'success' | 'error', message: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  breadcrumb,
  isCollapsed,
  onToggleSidebar,
  userRole,
  onChangeUserRole,
  isPlatformAdmin,
  onTogglePlatformAdmin,
  activeCompanyName,
  onChangeCompany,
  availableCompanies,
  isLoading,
  onRefresh,
  onNavigate,
  onShowNotification,
}) => {
  const roles: Array<{ key: CompanyRole; label: string }> = [
    { key: 'company_admin', label: 'Admin Empresa' },
    { key: 'manager', label: 'Gerente' },
    { key: 'seller', label: 'Vendedor' },
    { key: 'cashier', label: 'Caixa' },
    { key: 'technician', label: 'Técnico' },
    { key: 'stock_manager', label: 'Estoquista' },
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Left Area: Hamburger toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          id="header-mobile-toggle-btn"
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Alternar menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Navegação estrutural" className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-400">OLYPS PRO</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          {breadcrumb.section && (
            <>
              <span className="font-medium text-slate-500">{breadcrumb.section}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </>
          )}
          <span className="font-semibold text-slate-900">{breadcrumb.main}</span>
          {breadcrumb.sub && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-slate-900 px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                {breadcrumb.sub}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right Area: Tenant selector, RBAC simulator, Notifications & Quick actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Active Company Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            id="header-company-switcher-select"
            value={activeCompanyName}
            onChange={(e) => onChangeCompany(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
            title="Selecionar Empresa Ativa"
          >
            {availableCompanies.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
        </div>

        {/* Role Simulator Dropdown (Demonstrates RBAC context changes dynamically) */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1">
          <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-500">Perfil:</span>
          <select
            id="header-role-switcher-select"
            value={userRole}
            onChange={(e) => onChangeUserRole(e.target.value as CompanyRole)}
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer capitalize"
            title="Simular Papel RBAC"
          >
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Super Admin Global Switcher */}
        <button
          id="header-superadmin-toggle-btn"
          type="button"
          onClick={onTogglePlatformAdmin}
          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
            isPlatformAdmin
              ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
          title="Alternar permissão de Super Admin Global"
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${isPlatformAdmin ? 'text-purple-600' : 'text-slate-400'}`} />
          <span className="hidden md:inline">Super Admin:</span>
          <span>{isPlatformAdmin ? 'Ativo' : 'Inativo'}</span>
        </button>

        {/* Central de Notificações */}
        <NotificationBellDropdown
          onNavigate={onNavigate}
          onShowNotification={onShowNotification}
        />

        {/* Refresh Action */}
        <button
          id="header-refresh-btn"
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
          title="Atualizar dados"
          aria-label="Atualizar dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
