import React, { useState, useEffect } from 'react';
import { X, Layers, Building2, Save, MapPin, AlertCircle } from 'lucide-react';
import type { Product, CommercialLocation } from '../../types/index.js';

interface StockOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  locations: CommercialLocation[];
  onSave: (items: { locationId: string; quantity: number; rackLocation?: string }[]) => Promise<void>;
}

export const StockOpeningModal: React.FC<StockOpeningModalProps> = ({
  isOpen,
  onClose,
  product,
  locations,
  onSave,
}) => {
  const [stockRows, setStockRows] = useState<{
    locationId: string;
    locationName: string;
    quantity: number;
    rackLocation: string;
  }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product && locations.length > 0) {
      const rows = locations.map((loc) => {
        const existingLoc = product.locations?.find((pl) => pl.locationId === loc.id);
        return {
          locationId: loc.id,
          locationName: loc.name,
          quantity: existingLoc ? existingLoc.currentStock : 0,
          rackLocation: existingLoc ? existingLoc.rackLocation || '' : '',
        };
      });
      setStockRows(rows);
    }
  }, [product, locations]);

  const handleQtyChange = (locId: string, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setStockRows((prev) =>
      prev.map((r) => (r.locationId === locId ? { ...r, quantity: num } : r))
    );
  };

  const handleRackChange = (locId: string, val: string) => {
    setStockRows((prev) =>
      prev.map((r) => (r.locationId === locId ? { ...r, rackLocation: val } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const items = stockRows.map((r) => ({
        locationId: r.locationId,
        quantity: r.quantity,
        rackLocation: r.rackLocation || undefined,
      }));
      await onSave(items);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar estoque inicial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Estoque Inicial & Prateleiras</h3>
            <p className="text-xs text-slate-500">
              Produto: <span className="font-semibold text-slate-800">{product.name}</span> (SKU: {product.sku})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Local / Filial</th>
                  <th className="px-4 py-3 text-left">Prateleira / Gaveta</th>
                  <th className="px-4 py-3 text-right">Saldo Inicial ({product.unitShortName || 'Un'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {stockRows.map((row) => (
                  <tr key={row.locationId}>
                    <td className="px-4 py-2.5 font-medium text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {row.locationName}
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={row.rackLocation}
                        onChange={(e) => handleRackChange(row.locationId, e.target.value)}
                        placeholder="Ex: Prateleira B-04"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-emerald-500 focus:outline-hidden"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleQtyChange(row.locationId, e.target.value)}
                        className="w-24 px-2 py-1 text-xs text-right font-mono font-bold border border-slate-200 rounded focus:border-emerald-500 focus:outline-hidden"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center space-x-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Estoque'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
