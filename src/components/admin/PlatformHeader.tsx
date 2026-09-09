import React from 'react';
import { ShieldCheck, RefreshCw, Server, Activity } from 'lucide-react';
import type { PlatformAdminStatus } from '../../types/index.js';

interface PlatformHeaderProps {
  adminStatus: PlatformAdminStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const PlatformHeader: React.FC<PlatformHeaderProps> = ({
  adminStatus,
  isLoading,
  onRefresh,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold tracking-wider text-sm shadow-sm">
              OP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">OLYPS PRO</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Painel de Controle Global da Plataforma
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Nível de Autorização:</span>
              <strong className="font-semibold text-slate-900">
                {adminStatus?.role === 'super_admin' ? 'Super Administrador' : 'Acesso Global'}
              </strong>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </div>

            <button
              id="refresh-platform-data-btn"
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
