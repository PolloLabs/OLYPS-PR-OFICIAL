import React from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type {
  PurchasePayment as IPurchasePayment,
  PaymentMethod,
} from '../../types/purchase.types.js';

interface PurchasePaymentProps {
  payments: IPurchasePayment[];
  totalNetValue: number;
  updatePaymentByIndex: (index: number, field: string, value: any) => void;
  addPayment: () => void;
  removePayment: (index: number) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Dinheiro em Espécie' },
  { value: 'pix', label: 'PIX (Instantâneo)' },
  { value: 'bank_transfer', label: 'Transferência Bancária (TED/DOC)' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'check', label: 'Cheque' },
  { value: 'other', label: 'Outro Método' },
];

export const PurchasePayment: React.FC<PurchasePaymentProps> = ({
  payments,
  totalNetValue,
  updatePaymentByIndex,
  addPayment,
  removePayment,
}) => {
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const remainingBalance = Math.max(0, totalNetValue - totalPaid);
  const isFullyPaid = totalNetValue > 0 && totalPaid >= totalNetValue;

  return (
    <div id="purchase-payment-section" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800">Pagamento e Parcelamento</h2>
        </div>

        <button
          type="button"
          onClick={addPayment}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Linha de Pagamento
        </button>
      </div>

      {/* Lista de Pagamentos */}
      <div className="space-y-3">
        {payments.map((p, idx) => {
          const dateStr =
            p.paidAt instanceof Date && !isNaN(p.paidAt.getTime())
              ? p.paidAt.toISOString().split('T')[0]
              : typeof p.paidAt === 'string'
                ? (p.paidAt as string).split('T')[0]
                : '';

          return (
            <div
              key={p.id || idx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              {/* Saldo Adiantamento */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Saldo Adiantado (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.advanceBalance}
                  onChange={(e) =>
                    updatePaymentByIndex(idx, 'advanceBalance', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>

              {/* Valor do Pagamento */}
              <div className="md:col-span-3 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Valor Pago (R$) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={p.amount}
                    onChange={(e) =>
                      updatePaymentByIndex(idx, 'amount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono font-semibold text-slate-800"
                    required
                  />
                  <span className="text-xs text-slate-400 absolute left-2.5 top-1.5 font-mono">
                    R$
                  </span>
                </div>
              </div>

              {/* Data do Pagamento */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Data do Pagamento
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      updatePaymentByIndex(idx, 'paidAt', val ? new Date(val + 'T12:00:00') : new Date());
                    }}
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Método de Pagamento
                </label>
                <select
                  value={p.paymentMethod}
                  onChange={(e) =>
                    updatePaymentByIndex(idx, 'paymentMethod', e.target.value as PaymentMethod)
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nota de Pagamento */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Nota / Comprovante
                </label>
                <input
                  type="text"
                  value={p.paymentNote || ''}
                  onChange={(e) => updatePaymentByIndex(idx, 'paymentNote', e.target.value)}
                  placeholder="Ex: Cód. Transação 8931"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              {/* Ação: Remover */}
              <div className="md:col-span-1 flex justify-center pb-0.5">
                <button
                  type="button"
                  disabled={payments.length <= 1}
                  onClick={() => removePayment(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                  title="Remover pagamento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo de Liquidação */}
      <div className="mt-4 p-4 rounded-lg bg-slate-100/70 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
              Total Pago
            </span>
            <span className="text-base font-bold text-slate-900 font-mono">
              R$ {totalPaid.toFixed(2)}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
              Saldo Restante / A Pagar
            </span>
            <span
              className={`text-base font-bold font-mono ${
                remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              R$ {remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          {isFullyPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Totalmente Quitado
            </span>
          ) : remainingBalance > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Pagamento Parcial / A Prazo
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PurchasePayment;
