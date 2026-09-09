import React from 'react';
import { Cpu, ChevronRight } from 'lucide-react';
import type { ModelTrendData } from '../../../types/repair.types.js';

interface ModelTrendChartProps {
  data: ModelTrendData[];
  isLoading?: boolean;
}

export const ModelTrendChart: React.FC<ModelTrendChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse h-64">
        <div className="h-5 w-36 bg-slate-100 rounded" />
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const topModels = data.slice(0, 6);
  const maxCount = Math.max(...topModels.map((m) => m.count), 1);

  return (
    <div id="model-trend-chart" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Modelos Mais Frequentes</h3>
              <p className="text-xs text-slate-500">Aparelhos com maior índice de entrada na bancada</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
            Top {topModels.length}
          </span>
        </div>

        <div className="pt-4 space-y-3">
          {topModels.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhum modelo registrado até o momento.
            </div>
          ) : (
            topModels.map((item, idx) => {
              const widthPct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={`${item.brand}-${item.model}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <span className="text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                      <span className="font-semibold text-slate-800 truncate">{item.model}</span>
                      <span className="text-[11px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                        {item.brand}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 text-xs shrink-0">{item.count} OS</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Monitoramento preventivo de peças</span>
        <span className="flex items-center gap-0.5 text-purple-600 font-medium cursor-pointer hover:underline">
          Ver estoque <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
