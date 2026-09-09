import React from 'react';
import { Gift } from 'lucide-react';
import type {
  SellFormData,
  SellDiscountType,
  SellTaxType,
} from '../../types/sell.types.js';

interface SellDiscountTaxProps {
  formData: SellFormData;
  calculatedDiscount: number;
  calculatedCashback: number;
  calculatedOrderTax: number;
  onChange: (updates: Partial<SellFormData>) => void;
}

export const SellDiscountTax: React.FC<SellDiscountTaxProps> = ({
  formData,
  calculatedDiscount,
  calculatedCashback,
  calculatedOrderTax,
  onChange,
}) => {
  return (
    <div
      id="sell-discount-tax-section"
      className="bg-white rounded-md border border-slate-200 border-t-4 border-t-blue-600 shadow-sm p-5 mb-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Desconto */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              tipo de desconto:*
            </label>
            <select
              id="sell-discount-type"
              value={formData.discountType}
              onChange={(e) =>
                onChange({ discountType: e.target.value as SellDiscountType })
              }
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="percentage">Porcentagem</option>
              <option value="fixed">Fixo</option>
              <option value="none">Nenhum</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Valor do desconto:*
            </label>
            <input
              id="sell-discount-value"
              type="number"
              step="0.01"
              min={0}
              value={formData.discountValue}
              onChange={(e) =>
                onChange({ discountValue: Number(e.target.value) || 0 })
              }
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="pt-1">
            <span className="text-xs font-bold text-slate-700">
              Valor do desconto:(-) {calculatedDiscount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Coluna 2: Cash back */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Cash back
          </label>
          <div className="p-4 bg-slate-100/75 border border-slate-200 rounded-md space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Redeemed:
              </label>
              <div className="relative">
                <input
                  id="sell-cashback-redeemed"
                  type="number"
                  step="0.01"
                  min={0}
                  max={formData.cashbackAccessible}
                  value={formData.cashbackRedeemed}
                  onChange={(e) =>
                    onChange({ cashbackRedeemed: Number(e.target.value) || 0 })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded pl-8 pr-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
                <Gift className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            <div className="flex justify-between text-xs text-slate-700">
              <span className="font-medium">Acessível:</span>
              <span className="font-semibold text-slate-900">
                {formData.cashbackAccessible.toFixed(2)} R$
              </span>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between text-xs font-bold text-emerald-700">
              <span>Valor Resgatado:</span>
              <span>(-) {calculatedCashback.toFixed(2)} R$</span>
            </div>
          </div>
        </div>

        {/* Coluna 3: Imposto do Pedido & Nota de Venda */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Imposto do Pedido:*
            </label>
            <select
              id="sell-order-tax-select"
              value={formData.orderTaxType === 'none' ? 'none' : `${formData.orderTaxRate}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'none') {
                  onChange({ orderTaxType: 'none', orderTaxRate: 0 });
                } else {
                  onChange({
                    orderTaxType: 'percentage',
                    orderTaxRate: Number(val),
                  });
                }
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="none">nenhum</option>
              <option value="5">ISS 5%</option>
              <option value="12">ICMS 12%</option>
              <option value="18">ICMS 18%</option>
            </select>
          </div>

          <div className="pt-0.5">
            <span className="text-xs font-bold text-slate-700">
              Imposto do Pedido:(+) {calculatedOrderTax.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Nota de venda:
            </label>
            <textarea
              id="sell-sale-note"
              rows={3}
              value={formData.saleNote}
              onChange={(e) => onChange({ saleNote: e.target.value })}
              placeholder="Observações da venda comercial..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
