import React from 'react';
import {
  FileEdit,
  CheckSquare,
  CreditCard,
  Layers,
  Banknote,
  XCircle,
  History,
} from 'lucide-react';
import type { POSPaymentMethod } from '../../types/pos.types.js';

interface POSPaymentBarProps {
  totalToPay: number;
  isProcessing: boolean;
  onPay: (method: POSPaymentMethod) => void;
  onCancel: () => void;
  onOpenMultiplePayment: () => void;
  onOpenRecentTransactions: () => void;
}

export const POSPaymentBar: React.FC<POSPaymentBarProps> = ({
  totalToPay,
  isProcessing,
  onPay,
  onCancel,
  onOpenMultiplePayment,
  onOpenRecentTransactions,
}) => {
  return (
    <footer
      id="pos-payment-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-2xl px-4 py-2.5 transition-all"
    >
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Botões Coloridos de Ação de Pagamento */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cotação (laranja com ícone lápis) */}
          <button
            id="btn-pos-quote"
            type="button"
            disabled={isProcessing}
            onClick={() => onPay('quote')}
            className="h-10 px-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <FileEdit className="w-4 h-4" />
            <span>Cotação</span>
          </button>

          {/* Venda de crédito (roxo com check) */}
          <button
            id="btn-pos-credit-sale"
            type="button"
            disabled={isProcessing}
            onClick={() => onPay('credit_sale')}
            className="h-10 px-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Venda de crédito</span>
          </button>

          {/* Cartão (vermelho com ícone cartão) */}
          <button
            id="btn-pos-card"
            type="button"
            disabled={isProcessing}
            onClick={() => onPay('card')}
            className="h-10 px-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            <span>Cartão</span>
          </button>

          {/* Pagamento múltiplo (azul escuro) */}
          <button
            id="btn-pos-multiple-pay"
            type="button"
            disabled={isProcessing}
            onClick={onOpenMultiplePayment}
            className="h-10 px-3.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Layers className="w-4 h-4" />
            <span>Pagamento múltiplo</span>
          </button>

          {/* Dinheiro (verde com ícone dinheiro) */}
          <button
            id="btn-pos-cash"
            type="button"
            disabled={isProcessing}
            onClick={() => onPay('cash')}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Banknote className="w-4 h-4" />
            <span>Dinheiro</span>
          </button>

          {/* Cancelar (vermelho com X) */}
          <button
            id="btn-pos-cancel"
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="h-10 px-3.5 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
        </div>

        {/* Display Total a Pagar e Transações Recentes */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Display "Total a pagar 0.00" (fundo azul escuro, texto branco grande) */}
          <div
            id="display-pos-total-pay"
            className="bg-blue-900/90 border border-blue-600/50 px-5 py-2 rounded-lg text-right shadow-inner flex items-baseline gap-2"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Total a pagar
            </span>
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {totalToPay.toFixed(2)}{' '}
              <span className="text-sm font-semibold text-blue-300">R$</span>
            </span>
          </div>

          {/* Botão "Transações recentes" (azul com relógio) à direita */}
          <button
            id="btn-pos-recent-transactions"
            type="button"
            onClick={onOpenRecentTransactions}
            className="h-10 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-all cursor-pointer flex-shrink-0"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Transações recentes</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
