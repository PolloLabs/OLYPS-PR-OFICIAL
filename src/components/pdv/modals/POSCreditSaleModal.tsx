import React, { useState } from 'react';
import { X, CheckSquare, Calendar, CreditCard, User, AlertCircle } from 'lucide-react';
import type { SellCustomer } from '../../../types/sell.types.js';

interface POSCreditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customer: SellCustomer | undefined;
  onConfirm: (installments: number, firstDueDate: string, notes?: string) => Promise<boolean>;
}

export const POSCreditSaleModal: React.FC<POSCreditSaleModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  customer,
  onConfirm,
}) => {
  const [installments, setInstallments] = useState<number>(3);
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const installmentValue = totalAmount / (installments || 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const ok = await onConfirm(installments, firstDueDate, notes);
      if (ok) {
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="modal-pos-credit-sale-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-credit-sale"
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Venda a Crédito / A Prazo (Fiado)
            </h3>
            <p className="text-[11px] text-slate-500">
              Gera contas a receber e parcelamento vinculado ao cliente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Cliente e Total */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-lg p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-purple-600" />
                Cliente:
              </span>
              <span className="font-bold text-slate-800">
                {customer?.name || 'Cliente Consumidor Fake'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-purple-200 pt-1">
              <span className="font-bold text-purple-900">Total a Prazo:</span>
              <span className="font-black text-purple-900 text-sm">
                R$ {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Parcelas */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Número de Parcelas (1x a 12x)*
            </label>
            <select
              id="select-credit-installments"
              value={installments}
              onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}x de R$ {(totalAmount / n).toFixed(2)} (Total: R${' '}
                  {totalAmount.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Destaque do Parcelamento */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600">Valor de Cada Parcela:</span>
            <span className="text-base font-black text-purple-700 font-mono">
              {installments}x de R$ {installmentValue.toFixed(2)}
            </span>
          </div>

          {/* Vencimento da 1ª Parcela */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Vencimento da 1ª Parcela*
            </label>
            <div className="relative">
              <input
                id="input-credit-due-date"
                type="date"
                required
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                className="w-full h-9 px-3 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              As parcelas subsequentes vencerão a cada 30 dias após esta data.
            </p>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Observações do Carnê / Notificação
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Acordado via WhatsApp, assina carnê..."
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-credit-sale"
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? 'Processando...' : 'Confirmar Venda a Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
