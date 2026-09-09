import React, { useState, useEffect } from 'react';
import { X, Banknote, CheckCircle, ArrowRight } from 'lucide-react';

interface POSCashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (amountReceived: number, change: number) => Promise<boolean>;
}

export const POSCashPaymentModal: React.FC<POSCashPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirm,
}) => {
  const [receivedStr, setReceivedStr] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setReceivedStr(totalAmount.toFixed(2));
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const receivedNum = parseFloat(receivedStr) || 0;
  const change = Math.max(0, receivedNum - totalAmount);
  const remaining = Math.max(0, totalAmount - receivedNum);

  const handleQuickAdd = (add: number) => {
    setReceivedStr((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + add).toFixed(2);
    });
  };

  const handleSetExact = () => {
    setReceivedStr(totalAmount.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (receivedNum < totalAmount) return;

    setIsProcessing(true);
    try {
      const ok = await onConfirm(receivedNum, change);
      if (ok) {
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="modal-pos-cash-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-cash"
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
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Pagamento em Dinheiro
            </h3>
            <p className="text-[11px] text-slate-500">
              Conferência de cédulas e cálculo automático de troco
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Total */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-xs flex justify-between items-center">
            <span className="text-emerald-900 font-semibold">Total a Pagar:</span>
            <span className="font-black text-emerald-900 text-xl font-mono">
              R$ {totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Campo Valor Recebido */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Valor Recebido do Cliente (R$)*
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">
                R$
              </span>
              <input
                id="input-cash-received"
                type="number"
                step="0.01"
                required
                autoFocus
                value={receivedStr}
                onChange={(e) => setReceivedStr(e.target.value)}
                className="w-full h-11 pl-10 pr-3 text-lg font-black font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Botões Rápidos de Cédula */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Valores Rápidos / Adicionar:
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={handleSetExact}
                className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Exato
              </button>
              {[10, 20, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Troco ou Faltante */}
          {remaining > 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex justify-between items-center text-xs">
              <span className="font-bold text-amber-800">Faltante:</span>
              <span className="font-black text-amber-900 text-base font-mono">
                R$ {remaining.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-300 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-emerald-900 block">
                  Troco a Devolver:
                </span>
                <span className="text-[10px] text-emerald-700">
                  Gaveta abrirá para troco
                </span>
              </div>
              <span className="font-black text-emerald-900 text-xl font-mono">
                R$ {change.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-cash-sale"
              type="submit"
              disabled={isProcessing || receivedNum < totalAmount}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isProcessing ? 'Finalizando...' : 'Finalizar Venda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
