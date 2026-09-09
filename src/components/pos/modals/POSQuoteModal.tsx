import React, { useState } from 'react';
import { X, FileEdit, Clock, CheckCircle, Copy } from 'lucide-react';
import type { POSItem } from '../../../types/pos.types.js';
import type { SellCustomer } from '../../../types/sell.types.js';

interface POSQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: POSItem[];
  customer: SellCustomer | undefined;
  totalAmount: number;
  onSaveQuote: (notes: string, validUntilDays: number) => Promise<any>;
  onNavigateToQuotes?: () => void;
}

export const POSQuoteModal: React.FC<POSQuoteModalProps> = ({
  isOpen,
  onClose,
  items,
  customer,
  totalAmount,
  onSaveQuote,
  onNavigateToQuotes,
}) => {
  const [validDays, setValidDays] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedQuote, setSavedQuote] = useState<any>(null);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const quote = await onSaveQuote(notes, validDays);
      if (quote) {
        setSavedQuote(quote);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSavedQuote(null);
    setNotes('');
    setValidDays(7);
    onClose();
  };

  return (
    <div
      id="modal-pos-quote-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="modal-pos-quote"
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {savedQuote ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Cotação Salva com Sucesso!
            </h3>
            <p className="text-xs text-slate-500">
              A cotação foi registrada no sistema com validade de {validDays} dias.
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-left space-y-1 my-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Número da Cotação:</span>
                <span className="font-mono font-bold text-blue-600">
                  {savedQuote.quoteNumber || 'COT-001'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-semibold text-slate-800">
                  {customer?.name || 'Cliente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validade:</span>
                <span className="font-semibold text-slate-800">
                  {savedQuote.validUntil || '7 dias'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                <span className="font-bold text-slate-700">Total:</span>
                <span className="font-bold text-slate-900">
                  R$ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Permanecer no POS
              </button>
              {onNavigateToQuotes && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateToQuotes();
                  }}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Ver Cotações
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  Salvar como Cotação / Orçamento
                </h3>
                <p className="text-[11px] text-slate-500">
                  Gere um orçamento para o cliente sem baixar estoque
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirm} className="space-y-3.5">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cliente:</span>
                  <span className="font-bold text-slate-800">
                    {customer?.name || 'Cliente Consumidor Fake'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Itens no carrinho:</span>
                  <span className="font-bold text-slate-800">
                    {items.length} produto(s)
                  </span>
                </div>
                <div className="flex justify-between border-t border-amber-200 pt-1">
                  <span className="font-bold text-amber-900">Total da Cotação:</span>
                  <span className="font-black text-amber-900 text-sm">
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Validade da Cotação
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { days: 3, label: '3 dias' },
                    { days: 7, label: '7 dias' },
                    { days: 15, label: '15 dias' },
                    { days: 30, label: '30 dias' },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setValidDays(opt.days)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        validDays === opt.days
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Observações / Termos da Cotação
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Preços válidos mediante disponibilidade..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-save-quote"
                  type="submit"
                  disabled={isSaving || items.length === 0}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Confirmar e Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
