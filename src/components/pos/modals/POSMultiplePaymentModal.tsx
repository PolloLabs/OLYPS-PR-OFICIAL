import React, { useState, useEffect } from 'react';
import { X, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface POSMultiplePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (totalPaid: number, note: string) => Promise<boolean>;
}

export const POSMultiplePaymentModal: React.FC<POSMultiplePaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirm,
}) => {
  const [cash, setCash] = useState<number>(0);
  const [creditCard, setCreditCard] = useState<number>(0);
  const [debitCard, setDebitCard] = useState<number>(0);
  const [pix, setPix] = useState<number>(0);
  const [other, setOther] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCash(totalAmount);
      setCreditCard(0);
      setDebitCard(0);
      setPix(0);
      setOther(0);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const totalInformed =
    (cash || 0) + (creditCard || 0) + (debitCard || 0) + (pix || 0) + (other || 0);
  const difference = totalInformed - totalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalInformed < totalAmount) return;

    setIsProcessing(true);
    try {
      const parts = [];
      if (cash > 0) parts.push(`Dinheiro: R$ ${cash.toFixed(2)}`);
      if (creditCard > 0) parts.push(`Crédito: R$ ${creditCard.toFixed(2)}`);
      if (debitCard > 0) parts.push(`Débito: R$ ${debitCard.toFixed(2)}`);
      if (pix > 0) parts.push(`PIX: R$ ${pix.toFixed(2)}`);
      if (other > 0) parts.push(`Outro: R$ ${other.toFixed(2)}`);

      const note = `Pagamento Múltiplo [${parts.join(', ')}]`;
      const ok = await onConfirm(totalInformed, note);
      if (ok) {
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="modal-pos-multiple-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-multiple"
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
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Pagamento Múltiplo (Divisão de Métodos)
            </h3>
            <p className="text-[11px] text-slate-500">
              Distribua o valor da venda entre duas ou mais formas
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-3 text-xs flex justify-between items-center">
            <span className="text-indigo-900 font-semibold">Total da Venda:</span>
            <span className="font-black text-indigo-900 text-lg font-mono">
              R$ {totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Dinheiro (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cash || ''}
                onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Cartão de Crédito (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={creditCard || ''}
                onChange={(e) => setCreditCard(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Cartão de Débito (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={debitCard || ''}
                onChange={(e) => setDebitCard(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                PIX Instantâneo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pix || ''}
                onChange={(e) => setPix(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Outros / Vale / Cheque (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={other || ''}
              onChange={(e) => setOther(parseFloat(e.target.value) || 0)}
              className="w-full h-8 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-xs"
            />
          </div>

          {/* Sumário */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Informado:</span>
              <span className="font-bold text-slate-900 font-mono">
                R$ {totalInformed.toFixed(2)}
              </span>
            </div>
            {difference < -0.01 ? (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Faltam:</span>
                <span>R$ {Math.abs(difference).toFixed(2)}</span>
              </div>
            ) : difference > 0.01 ? (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Troco:</span>
                <span>R$ {difference.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Valor Exato:</span>
                <span>R$ 0,00</span>
              </div>
            )}
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
              id="btn-confirm-multiple-payment"
              type="submit"
              disabled={isProcessing || totalInformed < totalAmount}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Gravando...' : 'Concluir Pagamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
