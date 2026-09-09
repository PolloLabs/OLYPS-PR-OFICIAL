import React, { useState } from 'react';
import {
  Tag,
  Smartphone,
  Cpu,
  Sliders,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useRepairSettings } from '../../../hooks/repair/useRepairSettings.js';
import { StatusTab } from './StatusTab.js';
import { DevicesTab } from './DevicesTab.js';
import { DeviceModelsTab } from './DeviceModelsTab.js';
import { RepairConfigTab } from './RepairConfigTab.js';
import { LabelConfigTab } from './LabelConfigTab.js';

interface RepairSettingsProps {
  companyId: string;
  onBackToWorksheets?: () => void;
  onBackToDashboard?: () => void;
}

type TabType = 'status' | 'devices' | 'device-models' | 'repair-config' | 'label-config';

export const RepairSettings: React.FC<RepairSettingsProps> = ({
  companyId,
  onBackToWorksheets,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [initialModelCategory, setInitialModelCategory] = useState<string | undefined>(undefined);

  const {
    settings,
    loading,
    error,
    createStatus,
    updateStatus,
    deleteStatus,
    createDeviceModel,
    updateDeviceModel,
    deleteDeviceModel,
    updateGeneralSettings,
    updateLabelSettings,
  } = useRepairSettings(companyId);

  const handleNavigateToModels = (deviceType?: string) => {
    setInitialModelCategory(deviceType);
    setActiveTab('device-models');
  };

  const tabs = [
    { id: 'status' as TabType, label: 'Status da OS', icon: Tag },
    { id: 'devices' as TabType, label: 'Dispositivos', icon: Smartphone },
    { id: 'device-models' as TabType, label: 'Modelos de Dispositivos', icon: Cpu },
    { id: 'repair-config' as TabType, label: 'Configurações de Reparo', icon: Sliders },
    { id: 'label-config' as TabType, label: 'Etiqueta / Label', icon: Printer },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Carregando configurações de assistência técnica...</span>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3 my-4">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm">Não foi possível carregar as configurações</h3>
          <p className="text-xs text-rose-700 mt-1">{error || 'Configurações indisponíveis'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToWorksheets && (
            <button
              type="button"
              onClick={onBackToWorksheets}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              title="Voltar para a Folha de Trabalho"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                <Wrench className="w-3 h-3" />
                Módulo 05 — Reparar
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Configurações de Assistência Técnica
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize o fluxo de atendimento, checklists, modelos de equipamentos e etiquetas térmicas da oficina.
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ver Dashboard Analítico</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-px scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'device-models') {
                  setInitialModelCategory(undefined);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="transition-all">
        {activeTab === 'status' && (
          <StatusTab
            statuses={settings.statuses}
            generalSettings={settings.general}
            onCreateStatus={createStatus}
            onUpdateStatus={updateStatus}
            onDeleteStatus={deleteStatus}
            onSetDefaultStatus={async (statusId) => {
              await updateGeneralSettings({ defaultStatusId: statusId });
            }}
          />
        )}

        {activeTab === 'devices' && (
          <DevicesTab
            deviceModels={settings.deviceModels}
            onNavigateToModels={handleNavigateToModels}
            onOpenNewModel={(type) => {
              setInitialModelCategory(type);
              setActiveTab('device-models');
            }}
          />
        )}

        {activeTab === 'device-models' && (
          <DeviceModelsTab
            deviceModels={settings.deviceModels}
            onCreateModel={createDeviceModel}
            onUpdateModel={updateDeviceModel}
            onDeleteModel={deleteDeviceModel}
          />
        )}

        {activeTab === 'repair-config' && (
          <RepairConfigTab
            settings={settings.general}
            statuses={settings.statuses}
            onSave={updateGeneralSettings}
          />
        )}

        {activeTab === 'label-config' && (
          <LabelConfigTab
            settings={settings.label}
            onSave={updateLabelSettings}
          />
        )}
      </div>
    </div>
  );
};
