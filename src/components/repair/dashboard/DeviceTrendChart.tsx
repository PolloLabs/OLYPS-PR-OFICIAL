import React from 'react';
import { Smartphone, Laptop, Gamepad2, Tablet, Cpu, Layers } from 'lucide-react';
import type { DeviceTrendData } from '../../../types/repair.types.js';

interface DeviceTrendChartProps {
  data: DeviceTrendData[];
  isLoading?: boolean;
}

export const DeviceTrendChart: React.FC<DeviceTrendChartProps> = ({ data, isLoading }) => {
  const getDeviceIcon = (deviceType: string) => {
    const lower = deviceType.toLowerCase();
    if (lower.includes('smart') || lower.includes('celular') || lower.includes('phone')) {
      return Smartphone;
    }
    if (lower.includes('note') || lower.includes('lap') || lower.includes('pc') || lower.includes('computador')) {
      return Laptop;
    }
    if (lower.includes('console') || lower.includes('game') || lower.includes('playstation') || lower.includes('xbox')) {
      return Gamepad2;
    }
    if (lower.includes('tab') || lower.includes('ipad')) {
      return Tablet;
    }
    return Cpu;
  };

  const getDeviceColor = (index: number) => {
    const colors = [
      'bg-blue-500 text-blue-600 border-blue-200',
      'bg-emerald-500 text-emerald-600 border-emerald-200',
      'bg-purple-500 text-purple-600 border-purple-200',
      'bg-amber-500 text-amber-600 border-amber-200',
      'bg-rose-500 text-rose-600 border-rose-200',
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse h-64">
        <div className="h-5 w-36 bg-slate-100 rounded" />
        <div className="space-y-2 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div id="device-trend-chart" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Categorias de Dispositivos</h3>
              <p className="text-xs text-slate-500">Distribuição operacional por tipo de equipamento</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
            {data.length} categorias
          </span>
        </div>

        <div className="pt-4 space-y-3.5">
          {data.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhuma categoria registrada até o momento.
            </div>
          ) : (
            data.map((item, idx) => {
              const Icon = getDeviceIcon(item.deviceType);
              const colorInfo = getDeviceColor(idx);
              const barColor = colorInfo.split(' ')[0];
              const widthPct = Math.round((item.count / maxCount) * 100);

              return (
                <div key={item.deviceType} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      {item.deviceType}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.count} un.</span>
                      <span className="text-slate-400">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(widthPct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
        <span>Smartphones & Notebooks lideram a demanda</span>
        <span className="font-medium text-slate-700">100% atualizado</span>
      </div>
    </div>
  );
};
