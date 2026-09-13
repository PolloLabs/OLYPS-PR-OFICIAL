import React from 'react';
import { X, Calendar, MapPin, User, AlertTriangle, CheckCircle2, DollarSign, Package } from 'lucide-react';
import type { StockAdjustment } from '../../types/stockAdjustment.types.js';

interface StockAdjustmentDetailModalProps {
  adjustment: StockAdjustment | null;
  onClose: () => void;
}

export const StockAdjustmentDetailModal: React.FC<StockAdjustmentDetailModalProps> = ({
  adjustment,
  onClose,
}) => {
  if (!adjustment) return null;

  const isAbnormal = adjustment.type === 'abnormal';

  return (
    <div
      id="modal-stock-adjustment-detail"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isAbnormal
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}
            >
              {isAbnormal ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Ajuste de Estoque: {adjustment.referenceNumber}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isAbnormal
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isAbnormal ? 'Anormal' : 'Normal'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Registrado em {new Date(adjustment.createdAt).toLocaleDateString('pt-BR')} às{' '}
                {new Date(adjustment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-detail-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Data do Ajuste</span>
                <span className="font-semibold text-slate-700">
                  {new Date(adjustment.adjustmentDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Localização / Loja</span>
                <span className="font-semibold text-slate-700">{adjustment.locationName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Responsável</span>
                <span className="font-semibold text-slate-700">{adjustment.addedBy || 'Administrador'}</span>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Motivo / Justificativa
            </span>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
              {adjustment.reason || <span className="text-slate-400 italic">Nenhum motivo detalhado informado.</span>}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-500" />
                Itens Ajustados ({adjustment.items.length})
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="px-3.5 py-2.5">Produto</th>
                      <th className="px-3.5 py-2.5">SKU</th>
                      <th className="px-3.5 py-2.5 text-center">Estoque Anterior</th>
                      <th className="px-3.5 py-2.5 text-center">Qtd Ajustada</th>
                      <th className="px-3.5 py-2.5 text-center">Estoque Final</th>
                      <th className="px-3.5 py-2.5 text-right">Custo Unit.</th>
                      <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {adjustment.items.map((item) => {
                      const isPositive = item.quantity > 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="px-3.5 py-3 font-semibold text-slate-800">{item.productName}</td>
                          <td className="px-3.5 py-3 font-mono text-[11px] text-slate-500">{item.sku}</td>
                          <td className="px-3.5 py-3 text-center text-slate-600">{item.currentStock}</td>
                          <td className="px-3.5 py-3 text-center font-bold">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                isPositive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPositive ? `+${item.quantity}` : item.quantity}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center font-bold text-slate-700">{item.stockAfter}</td>
                          <td className="px-3.5 py-3 text-right text-slate-600">
                            {Number(item.unitCost).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                          <td className="px-3.5 py-3 text-right font-bold text-slate-800">
                            {Number(item.subtotal).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Valor Total Ajustado:</span>
              </div>
              <span className="text-base font-bold text-slate-900">
                {Number(adjustment.totalAmount).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            {isAbnormal && (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">Valor Recuperado:</span>
                </div>
                <span className="text-base font-bold text-emerald-700">
                  {Number(adjustment.totalRecovered || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            id="btn-close-detail"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
