import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface POSCardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (
    cardType: 'credit' | 'debit',
    installments: number,
    flag: string
  ) => Promise<boolean>;
}

const CARD_FLAGS = ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'Amex'];

export const POSCardPaymentModal: React.FC<POSCardPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirm,
}) => {
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [installments, setInstallments] = useState<number>(1);
  const [flag, setFlag] = useState<string>('Visa');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStatusMessage('Aproxime, insira ou passe o cartão na maquininha...');

    setTimeout(() => {
      setStatusMessage('Autorizando transação com a adquirente...');
    }, 1000);

    try {
      const ok = await onConfirm(
        cardType,
        cardType === 'credit' ? installments : 1,
        flag
      );
      if (ok) {
        onClose();
      }
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  return (
    <div
      id="modal-pos-card-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-card"
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {!isProcessing && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Pagamento com Cartão
            </h3>
            <p className="text-[11px] text-slate-500">
              Terminal integrado TEF / POS Pinpad
            </p>
          </div>
        </div>

        {isProcessing ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto text-rose-600 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Processando Transação...
              </h4>
              <p className="text-xs text-slate-500 mt-1">{statusMessage}</p>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Criptografia ponta a ponta</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Valor */}
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-lg p-3 text-xs flex justify-between items-center">
              <span className="text-rose-900 font-semibold">Total a Cobrar:</span>
              <span className="font-black text-rose-900 text-lg font-mono">
                R$ {totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Crédito ou Débito */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCardType('credit')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  cardType === 'credit'
                    ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cartão de Crédito
              </button>
              <button
                type="button"
                onClick={() => setCardType('debit')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  cardType === 'debit'
                    ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cartão de Débito
              </button>
            </div>

            {/* Bandeira */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Bandeira do Cartão
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {CARD_FLAGS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFlag(f)}
                    className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      flag === f
                        ? 'border-rose-500 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Parcelas se crédito */}
            {cardType === 'credit' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Parcelamento
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                  className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold"
                >
                  <option value={1}>
                    1x de R$ {totalAmount.toFixed(2)} (À vista)
                  </option>
                  {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={n}>
                      {n}x de R$ {(totalAmount / n).toFixed(2)} sem juros
                    </option>
                  ))}
                </select>
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
                id="btn-confirm-card-sale"
                type="submit"
                disabled={totalAmount <= 0}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Processar na Maquininha</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
