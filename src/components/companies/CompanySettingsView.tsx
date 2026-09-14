import React from 'react';
import { BusinessSettingsView } from './BusinessSettingsView.js';

export interface CompanySettingsViewProps {
  companyId?: string;
  activeCompanyName?: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification?: (notification: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  } | 'success' | 'error', message?: string) => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  companyId = '550e8400-e29b-41d4-a716-446655440001',
  activeCompanyName = 'Farmácia Modelo Ltda',
  userRole = 'company_admin',
  isPlatformAdmin = false,
  onShowNotification,
}) => {
  const handleNotification = (notif: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => {
    if (!onShowNotification) return;
    try {
      (onShowNotification as any)(notif);
    } catch {
      (onShowNotification as any)(notif.type === 'info' ? 'success' : notif.type, notif.message);
    }
  };

  return (
    <BusinessSettingsView
      companyId={companyId}
      activeCompanyName={activeCompanyName}
      userRole={userRole}
      isPlatformAdmin={isPlatformAdmin}
      onShowNotification={handleNotification}
    />
  );
};

export { BusinessSettingsView };
