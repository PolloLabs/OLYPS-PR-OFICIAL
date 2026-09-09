import React, { useState } from 'react';
import { PDVFormaPagamento } from '../../types/pdv.types.js';

export interface POSPaymentBarProps {
  total: number;
  onCompleteSale: (forma: PDVFormaPagamento, data: any) => Promise<boolean>;
  loading: boolean;
  onOpenRecentTransactions?: () => void;
  onCancelSale?: () => void;
}

export const POSPaymentBar: React.FC<POSPaymentBarProps> = ({
  total,
  onCompleteSale,
  loading,
  onOpenRecentTransactions,
  onCancelSale,
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
      'credito': 'Venda de crédito',
      'cartao': 'Cartão',
      'multiplo': 'Pagamento múltiplo',
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
      <div id="pos-payment-bar" className="bg-gray-900 p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Botões de Pagamento - lado esquerdo */}
        <div className="flex gap-2 flex-1 flex-wrap items-center">
          {(['cotacao', 'credito', 'cartao', 'dinheiro', 'pix', 'boleto'] as PDVFormaPagamento[]).map((forma) => (
            <button
              key={forma}
              id={`btn-pos-pay-${forma}`}
              onClick={() => handlePaymentClick(forma)}
              disabled={loading}
              className={`px-6 py-4 text-white font-bold rounded-lg transition-all transform hover:scale-105 ${getPaymentColor(forma)} disabled:opacity-50 cursor-pointer`}
            >
              {getPaymentLabel(forma)}
            </button>
          ))}
          
          <button
            id="btn-pos-cancel-action"
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>

        {/* Total a Pagar - lado direito - AMPLIADO */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 px-10 py-6 rounded-xl shadow-2xl min-w-[300px]">
          <span className="text-blue-200 text-sm font-medium uppercase tracking-wider block mb-1">
            Total a Pagar
          </span>
          <div className="text-white text-5xl font-black">
            {total.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              minimumFractionDigits: 2 
            })}
          </div>
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
