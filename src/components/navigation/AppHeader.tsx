import React from 'react';
import {
  Menu,
  ChevronRight,

  ShieldCheck,
  RefreshCw,

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
      
      {/* Right Area: Tenant selector, RBAC simulator, Notifications & Quick actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        

       
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
