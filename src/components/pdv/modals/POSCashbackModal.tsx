import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SellCustomer } from '../../../types/sell.types.js';

interface POSCashbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  currentCashback: number;
  customer?: SellCustomer;
  onApplyCashback: (value: number) => boolean;
}

export const POSCashbackModal: React.FC<POSCashbackModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  currentCashback,
  customer,
  onApplyCashback,
}) => {
  const [valStr, setValStr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Saldo de fidelidade do cliente (simulado ou padrão R$ 45,00)
  const availableBalance = 45.0;

  useEffect(() => {
    if (isOpen) {
      setValStr(currentCashback > 0 ? currentCashback.toFixed(2) : '');
      setErrorMsg('');
    }
  }, [isOpen, currentCashback]);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(valStr) || 0;

    if (num < 0) {
      setErrorMsg('O valor do cash back não pode ser negativo.');
      return;
    }

    if (num > subtotal) {
      setErrorMsg('Cash back não pode exceder o subtotal');
      return;
    }

    const success = onApplyCashback(num);
    if (success) {
      onClose();
    }
  };

  const handleQuickSet = (amount: number) => {
    const capped = Math.min(amount, subtotal);
    setValStr(capped.toFixed(2));
    setErrorMsg('');
  };

  return (
    <div
      id="modal-pos-cashback-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-cashback"
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Resgate de Cash Back
            </h3>
            <p className="text-[11px] text-slate-500">
              {customer?.name || 'Cliente Consumidor Fake'}
            </p>
          </div>
        </div>

        {/* Card de Saldo Disponível */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs mb-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-amber-900 font-medium">Saldo disponível:</span>
            <span className="font-black text-amber-950 font-mono text-sm">
              R$ {availableBalance.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-amber-800/80 border-t border-amber-200/70 pt-1">
            <span>Subtotal da Venda:</span>
            <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleApply} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Valor a Resgatar (R$)*
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                id="input-pos-cashback-amount"
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={valStr}
                onChange={(e) => {
                  setValStr(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="0,00"
                className="w-full h-10 pl-9 pr-3 text-sm font-bold font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            {errorMsg && (
              <div className="flex items-center gap-1 text-rose-600 text-[11px] font-semibold mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Botões rápidos */}
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block mb-1">
              Atalhos de resgate:
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSet(10)}
                className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
              >
                R$ 10
              </button>
              <button
                type="button"
                onClick={() => handleQuickSet(20)}
                className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
              >
                R$ 20
              </button>
              <button
                type="button"
                onClick={() => handleQuickSet(availableBalance)}
                className="py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded border border-amber-300 transition-colors cursor-pointer"
              >
                Tudo
              </button>
              <button
                type="button"
                onClick={() => handleQuickSet(0)}
                className="py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded border border-rose-200 transition-colors cursor-pointer"
              >
                Zerar
              </button>
            </div>
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
              id="btn-apply-pos-cashback"
              type="submit"
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Aplicar Desconto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
