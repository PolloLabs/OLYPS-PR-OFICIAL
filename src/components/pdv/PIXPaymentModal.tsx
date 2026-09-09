import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface PIXPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  companyId: string;
  onConfirmPayment?: () => void;
}

export const PIXPaymentModal: React.FC<PIXPaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  companyId,
  onConfirmPayment,
}) => {
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Buscar dados PIX da empresa
      fetch(`/api/companies/${companyId}/pix-config`)
        .then((res) => res.json())
        .then((data) => {
          setPixData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Erro ao carregar dados PIX:', err);
          setLoading(false);
        });
    }
  }, [isOpen, companyId]);

  if (!isOpen) return null;

  // Gerar payload PIX (simplificado)
  const generatePIXPayload = () => {
    if (!pixData) return '';

    // Payload PIX simplificado (EMV QR Code)
    const pixKey = pixData.pixKey || '';
    const merchantName = pixData.merchantName || 'TechStore Brasil';
    const merchantCity = pixData.merchantCity || 'SAO PAULO';
    const amount = total.toFixed(2);
    const txId = `PDV${Date.now()}`;

    // Simplificação - em produção usar biblioteca qrcode-pix
    return `00020126580014BR.GOV.BCB.PIX0136${pixKey}5204000053039865802BR5925${merchantName}6009${merchantCity}62070503***6304`;
  };

  const pixPayload = generatePIXPayload();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Pagamento via PIX</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            title="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !pixData ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4 font-semibold">Configuração PIX não encontrada</p>
            <p className="text-sm text-gray-600">
              Acesse Configurações &gt; Configurações de Fatura para cadastrar os dados PIX da empresa.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-gray-600 mb-2">Valor a pagar:</p>
              <p className="text-3xl font-bold text-blue-600">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4 flex justify-center border border-gray-200">
              <QRCodeSVG
                value={pixPayload}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pixData.pixKey || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.pixKey || '');
                      alert('Chave PIX copiada!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Instruções:</strong> Escaneie o QR Code ou copie a chave PIX acima para realizar o pagamento.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConfirmPayment) {
                    onConfirmPayment();
                  }
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium cursor-pointer"
              >
                Já Paguei
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PIXPaymentModal;
