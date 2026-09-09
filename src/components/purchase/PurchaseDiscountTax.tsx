import React from 'react';
import { Tag, Receipt, FileText, Calculator } from 'lucide-react';
import type { DiscountType, TaxType, PurchaseFormData } from '../../types/purchase.types.js';

interface PurchaseDiscountTaxProps {
  formData: PurchaseFormData;
  updateDiscount: (type: DiscountType, value: number) => void;
  updateTax: (type: TaxType, value: number) => void;
  updateHeaderField: (field: string, value: any) => void;
}

export const PurchaseDiscountTax: React.FC<PurchaseDiscountTaxProps> = ({
  formData,
  updateDiscount,
  updateTax,
  updateHeaderField,
}) => {
  const itemsSubtotal = formData.items.reduce(
    (sum, item) => sum + (Number(item.totalLine) || 0),
    0
  );

  return (
    <div id="purchase-discount-tax-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna 1: Desconto e Impostos Gerais */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Tag className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800">Desconto e Imposto Geral</h2>
        </div>

        {/* Desconto */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Tipo de Desconto Geral</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={formData.discountType}
              onChange={(e) => updateDiscount(e.target.value as DiscountType, formData.discountValue)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="none">Sem Desconto</option>
              <option value="percentage">Porcentagem (%)</option>
              <option value="fixed">Valor Fixo (R$)</option>
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              disabled={formData.discountType === 'none'}
              value={formData.discountValue}
              onChange={(e) =>
                updateDiscount(formData.discountType, parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 font-mono"
            />
          </div>
          {formData.discountType !== 'none' && (
            <p className="text-[11px] text-emerald-600 font-medium">
              Desconto Aplicado: - R$ {(formData.discountTotal || 0).toFixed(2)}
            </p>
          )}
        </div>

        {/* Imposto */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">Imposto Geral da Compra</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={formData.taxType}
              onChange={(e) => updateTax(e.target.value as TaxType, formData.taxTotal)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="none">Sem Imposto Adicional</option>
              <option value="percentage">Alíquota (%)</option>
              <option value="fixed">Valor Fixo (R$)</option>
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              disabled={formData.taxType === 'none'}
              value={formData.taxTotal}
              onChange={(e) => updateTax(formData.taxType, parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 font-mono"
            />
          </div>
          {formData.taxType !== 'none' && (
            <p className="text-[11px] text-indigo-600 font-medium">
              Total Imposto Adicional: + R$ {(formData.taxTotal || 0).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Coluna 2: Observações Adicionais */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800">Observações & Instruções</h2>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Notas Adicionais da Compra
          </label>
          <textarea
            rows={4}
            value={formData.additionalNotes}
            onChange={(e) => updateHeaderField('additionalNotes', e.target.value)}
            placeholder="Informações adicionais sobre transporte, conferência de carga, avarias ou acordos comerciais com o fornecedor..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          />
        </div>
      </div>

      {/* Coluna 3: Resumo Financeiro da Compra */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold tracking-tight">Resumo Financeiro</h2>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Quantidade Total de Itens:</span>
              <span className="font-semibold text-white font-mono">
                {formData.totalItems || formData.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)} un
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>Subtotal dos Produtos:</span>
              <span className="font-mono text-white">
                R$ {itemsSubtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-400">
              <span>Desconto Geral:</span>
              <span className="font-mono">
                - R$ {(formData.discountTotal || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-indigo-300">
              <span>Impostos / Taxas:</span>
              <span className="font-mono">
                + R$ {(formData.taxTotal || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-700">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Valor Líquido Total
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              R$ {(formData.totalNetValue || itemsSubtotal).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDiscountTax;
