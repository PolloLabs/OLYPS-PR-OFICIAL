import React from 'react';
import { DollarSign, Calendar, Plus, Trash2 } from 'lucide-react';
import type {
  SellFormData,
  SellPaymentMethod,
} from '../../types/sell.types.js';

interface SellPaymentProps {
  formData: SellFormData;
  totalPayable: number;
  balanceDue: number;
  changeReturn: number;
  onUpdatePayment: (index: number, updates: any) => void;
  onAddPaymentLine: () => void;
  onRemovePaymentLine: (index: number) => void;
  onSetExactPayment: () => void;
}

export const SellPaymentSection: React.FC<SellPaymentProps> = ({
  formData,
  totalPayable,
  balanceDue,
  changeReturn,
  onUpdatePayment,
  onAddPaymentLine,
  onRemovePaymentLine,
  onSetExactPayment,
}) => {
  return (
    <div
      id="sell-payment-section"
      className="bg-white rounded-md border border-slate-200 border-t-4 border-t-blue-600 shadow-sm p-5 mb-6"
    >
      {/* Topo da Seção de Pagamento */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Total a pagar:
          </span>
          <span
            id="sell-display-total-payable"
            onClick={onSetExactPayment}
            title="Clique para preencher o valor exato no pagamento"
            className="text-lg sm:text-xl font-extrabold text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-1 cursor-pointer hover:bg-blue-100 transition-colors"
          >
            {totalPayable.toFixed(2)} R$
          </span>
        </div>

        <button
          id="btn-add-payment-line"
          type="button"
          onClick={onAddPaymentLine}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adicionar pagamento</span>
        </button>
      </div>

      {/* Lista de Pagamentos */}
      <div className="space-y-6">
        {formData.payments.map((payment, index) => (
          <div
            key={payment.id || index}
            className="p-4 bg-slate-50/70 border border-slate-200 rounded-md relative"
          >
            {formData.payments.length > 1 && (
              <button
                type="button"
                onClick={() => onRemovePaymentLine(index)}
                className="absolute right-3 top-3 text-rose-500 hover:text-rose-700 p-1"
                title="Remover linha de pagamento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Saldo adiantado */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saldo adiantado:
                </label>
                <div className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5">
                  {Number(payment.advanceBalance || 0).toFixed(2)} R$
                </div>
              </div>

              {/* Quantidade:* */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantidade:*
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={payment.amount}
                    onChange={(e) =>
                      onUpdatePayment(index, {
                        amount: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded pl-8 pr-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                    placeholder="0.00"
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Pago em:* */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pago em:*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={payment.paidAt}
                    onChange={(e) =>
                      onUpdatePayment(index, { paidAt: e.target.value })
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded pl-8 pr-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="07-09-2026 10:26 AM"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Método de pagamento:* */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de pagamento:*
                </label>
                <select
                  value={payment.paymentMethod}
                  onChange={(e) =>
                    onUpdatePayment(index, {
                      paymentMethod: e.target.value as SellPaymentMethod,
                    })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="cash">Dinheiro</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="pix">PIX</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="check">Cheque</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>

            {/* Nota de pagamento */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nota de pagamento:
              </label>
              <textarea
                rows={2}
                value={payment.paymentNote || ''}
                onChange={(e) =>
                  onUpdatePayment(index, { paymentNote: e.target.value })
                }
                placeholder="Observações do pagamento..."
                className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé da Seção de Pagamento: Alterar o retorno (troco) & Balance (saldo devedor) */}
      <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-md">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Alterar o retorno:</span>
          <span
            id="sell-display-change-return"
            className="font-bold text-slate-900 bg-white border border-slate-300 px-3 py-1 rounded"
          >
            {changeReturn.toFixed(2)} R$
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Balance:</span>
          <span
            id="sell-display-balance"
            className={`font-bold px-3 py-1 rounded border ${
              balanceDue > 0
                ? 'text-rose-700 bg-rose-50 border-rose-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}
          >
            {balanceDue.toFixed(2)} R$
          </span>
        </div>
      </div>
    </div>
  );
};
