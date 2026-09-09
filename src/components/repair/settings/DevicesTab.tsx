import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  Gamepad2,
  Watch,
  Monitor,
  Tv,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { DeviceModel } from '../../../types/repair.types.js';

interface DevicesTabProps {
  deviceModels: DeviceModel[];
  onNavigateToModels?: (deviceType?: string) => void;
  onOpenNewModel?: (deviceType?: string) => void;
}

interface DeviceCategoryMeta {
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const KNOWN_CATEGORIES: DeviceCategoryMeta[] = [
  {
    type: 'Smartphone',
    label: 'Smartphones & Celulares',
    description: 'Aparelhos móveis iOS, Android, telas OLED, baterias e módulos de câmera.',
    icon: Smartphone,
    accentColor: 'from-blue-500 to-indigo-600',
  },
  {
    type: 'Tablet',
    label: 'Tablets & iPads',
    description: 'Dispositivos touch de grande formato, iPads, Galaxy Tabs e mesas digitalizadoras.',
    icon: Tablet,
    accentColor: 'from-teal-500 to-emerald-600',
  },
  {
    type: 'Notebook',
    label: 'Notebooks & MacBooks',
    description: 'Laptops, ultrabooks, MacBooks, troca de teclado, tela e reparo em placa.',
    icon: Laptop,
    accentColor: 'from-violet-500 to-purple-600',
  },
  {
    type: 'Console',
    label: 'Videogames & Consoles',
    description: 'PlayStation, Xbox, Nintendo Switch, refrigeração, leitores e controles.',
    icon: Gamepad2,
    accentColor: 'from-amber-500 to-orange-600',
  },
  {
    type: 'Smartwatch',
    label: 'Smartwatches & Wearables',
    description: 'Apple Watch, Galaxy Watch, pulseiras inteligentes e sensores biométricos.',
    icon: Watch,
    accentColor: 'from-rose-500 to-pink-600',
  },
  {
    type: 'Computador Desktop',
    label: 'Computadores Desktop & PC Gamer',
    description: 'Workstations, gabinetes gamer, fontes, placas de vídeo e upgrade de hardware.',
    icon: Monitor,
    accentColor: 'from-cyan-500 to-blue-600',
  },
  {
    type: 'Monitor / TV',
    label: 'Monitores & Smart TVs',
    description: 'Displays LED/OLED, fontes chaveadas, placas T-CON e conectores HDMI.',
    icon: Tv,
    accentColor: 'from-indigo-500 to-sky-600',
  },
];

export const DevicesTab: React.FC<DevicesTabProps> = ({
  deviceModels,
  onNavigateToModels,
  onOpenNewModel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Stats calculation per category
  const categoryStats = KNOWN_CATEGORIES.map((cat) => {
    const modelsInCat = deviceModels.filter((m) => m.deviceType === cat.type);
    const brands = Array.from(new Set(modelsInCat.map((m) => m.brand)));
    return {
      ...cat,
      modelsCount: modelsInCat.length,
      brands,
      models: modelsInCat,
    };
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Categorias de Dispositivos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visão geral das categorias de equipamentos atendidos pela assistência técnica e seus modelos cadastrados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenNewModel && onOpenNewModel()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Modelo</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryStats.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.type;

          return (
            <div
              key={cat.type}
              className={`bg-white rounded-xl border transition-all p-4 shadow-2xs flex flex-col justify-between ${
                isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Category Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{cat.label}</h3>
                      <span className="text-[11px] font-medium text-slate-500">
                        {cat.modelsCount} {cat.modelsCount === 1 ? 'modelo cadastrado' : 'modelos cadastrados'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {cat.description}
                </p>

                {/* Brands summary */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Marcas Homologadas ({cat.brands.length}):
                  </span>
                  {cat.brands.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Nenhum modelo cadastrado</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {cat.brands.map((b) => (
                        <span
                          key={b}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToModels && onNavigateToModels(cat.type)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <span>Ver Modelos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenNewModel && onOpenNewModel(cat.type)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                  title={`Adicionar novo modelo de ${cat.type}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checklist Standardization Tip */}
      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-3 text-xs text-slate-700">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900 mb-0.5">Padronização de Checklists por Categoria</h4>
          <p className="text-slate-600 leading-relaxed">
            Ao cadastrar um novo modelo de aparelho na aba <strong>Modelos de Dispositivos</strong>, os itens de checklist técnico de entrada e saída (como tela, bateria, câmeras, touch, conectores) são carregados automaticamente para orientar o técnico de bancada na inspeção.
          </p>
        </div>
      </div>
    </div>
  );
};
