import React from 'react';
import { Tag, TrendingUp } from 'lucide-react';
import type { BrandTrendData } from '../../../types/repair.types.js';

interface BrandTrendChartProps {
  data: BrandTrendData[];
  isLoading?: boolean;
}

export const BrandTrendChart: React.FC<BrandTrendChartProps> = ({ data, isLoading }) => {
  const formatBRL = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

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

  const topBrands = data.slice(0, 5);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div id="brand-trend-chart" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Marcas Mais Atendidas</h3>
              <p className="text-xs text-slate-500">Volume e receita gerada por fabricante</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
            Top {topBrands.length}
          </span>
        </div>

        <div className="pt-4 space-y-3.5">
          {topBrands.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Nenhuma OS registrada para gerar tendências.
            </div>
          ) : (
            topBrands.map((item, idx) => {
              const widthPct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.brand} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      <span className="w-4 text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                      {item.brand}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-medium">{item.count} OS ({item.percentage}%)</span>
                      <span className="font-semibold text-slate-900">{formatBRL(item.revenueCents)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          Métrica acumulada
        </span>
        <span>Base em ordens ativas</span>
      </div>
    </div>
  );
};
