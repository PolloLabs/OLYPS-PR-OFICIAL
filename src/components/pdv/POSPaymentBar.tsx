import React, { useState } from 'react';
import { PDVFormaPagamento } from '../../types/pdv.types.js';

export interface POSPaymentBarProps {
  total: number;
  onCompleteSale: (forma: PDVFormaPagamento, data: any) => Promise<boolean>;
  loading: boolean;
  onOpenRecentTransactions?: () => void;
  onCancelSale?: () => void;
  isKiosk?: boolean;
}

export const POSPaymentBar: React.FC<POSPaymentBarProps> = ({
  total,
  onCompleteSale,
  loading,
  onOpenRecentTransactions,
  onCancelSale,
  isKiosk = false,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PDVFormaPagamento | null>(null);

  const handlePaymentClick = (forma: PDVFormaPagamento) => {
    if (forma === 'pix') {
      onCompleteSale('pix', { valorPago: total, troco: 0 });
      return;
    }
    setSelectedPayment(forma);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedPayment) return;
    
    const success = await onCompleteSale(selectedPayment, {
      valorPago: total,
      troco: 0,
    });
    
    if (success) {
      setShowPaymentModal(false);
      setSelectedPayment(null);
    }
  };

  const getPaymentLabel = (forma: PDVFormaPagamento) => {
    const labels: Record<PDVFormaPagamento, string> = {
      'cotacao': 'Cotação',
      'credito': 'Crédito',
      'cartao': 'Cartão',
      'multiplo': 'Múltiplo',
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'boleto': 'Boleto',
    };
    return labels[forma] || forma;
  };

  const getPaymentColor = (forma: PDVFormaPagamento) => {
    const colors: Record<PDVFormaPagamento, string> = {
      'cotacao': 'bg-orange-500 hover:bg-orange-600',
      'credito': 'bg-purple-600 hover:bg-purple-700',
      'cartao': 'bg-red-600 hover:bg-red-700',
      'multiplo': 'bg-blue-900 hover:bg-blue-950',
      'dinheiro': 'bg-green-600 hover:bg-green-700',
      'pix': 'bg-emerald-600 hover:bg-emerald-700',
      'boleto': 'bg-yellow-600 hover:bg-yellow-700',
    };
    return colors[forma] || 'bg-gray-600';
  };

  const handleCancel = () => {
    if (onCancelSale) {
      onCancelSale();
    } else {
      onCompleteSale('dinheiro', { valorPago: total, troco: 0 });
    }
  };

  return (
    <>
      <div
        id="pos-payment-bar"
        className={`fixed bottom-0 left-0 right-0 z-40 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto flex-none bg-gray-900 flex flex-col lg:flex-row items-stretch lg:items-center justify-between shadow-2xl transition-all ${
          isKiosk
            ? 'p-2 sm:p-2.5 lg:px-6 lg:py-3 gap-1.5 sm:gap-2 lg:gap-4'
            : 'p-2.5 sm:p-3 lg:px-6 lg:py-4 gap-2 sm:gap-3 lg:gap-4'
        }`}
      >
        {/* Total a Pagar (No mobile fica em linha separada 100% largura; no tablet/desktop ao lado/direita) */}
        <div className="w-full lg:w-auto lg:order-last bg-gradient-to-br from-blue-700 to-blue-900 px-3 py-2 sm:px-5 sm:py-3 lg:px-8 lg:py-4 rounded-lg sm:rounded-xl shadow-md flex items-center justify-between lg:flex-col lg:justify-center min-w-0 lg:min-w-[260px] xl:min-w-[320px]">
          <span className="text-blue-200 text-xs sm:text-xs lg:text-sm font-semibold uppercase tracking-wider block">
            Total a Pagar
          </span>
          <div className="text-white text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-black truncate">
            {total.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              minimumFractionDigits: 2 
            })}
          </div>
        </div>

        {/* Botões de Pagamento: mobile grid-cols-2 (2 por linha), tablet grid-cols-3, desktop linha única */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row lg:flex-1 lg:items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
          {(['cotacao', 'credito', 'cartao', 'dinheiro', 'pix'] as PDVFormaPagamento[]).map((forma) => (
            <button
              key={forma}
              id={`btn-pos-pay-${forma}`}
              type="button"
              onClick={() => handlePaymentClick(forma)}
              disabled={loading}
              aria-label={`Pagar com ${getPaymentLabel(forma)}`}
              className={`w-full lg:w-auto py-2.5 px-2 sm:py-3 sm:px-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-center text-xs sm:text-sm lg:text-base text-white font-bold rounded-lg transition-all transform active:scale-95 lg:hover:scale-105 ${getPaymentColor(forma)} disabled:opacity-50 cursor-pointer touch-manipulation select-none`}
            >
              {getPaymentLabel(forma)}
            </button>
          ))}
          
          <button
            id="btn-pos-cancel-action"
            type="button"
            onClick={handleCancel}
            disabled={loading}
            aria-label="Cancelar venda atual"
            className="w-full lg:w-auto py-2.5 px-2 sm:py-3 sm:px-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-center text-xs sm:text-sm lg:text-base bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg transition-all transform active:scale-95 lg:hover:scale-105 cursor-pointer disabled:opacity-50 touch-manipulation select-none"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Confirmar Pagamento</h3>
            <p className="text-gray-600 mb-4">
              Forma de pagamento: <strong className="text-slate-900">{getPaymentLabel(selectedPayment!)}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              Valor: <strong className="text-2xl text-blue-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-slate-700 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmPayment}
                disabled={loading}
                className={`px-6 py-2 text-white rounded font-medium cursor-pointer ${getPaymentColor(selectedPayment!)} disabled:opacity-50`}
              >
                {loading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default POSPaymentBar;
