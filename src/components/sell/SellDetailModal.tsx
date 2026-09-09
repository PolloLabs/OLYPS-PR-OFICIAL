import React from 'react';
import { X, Printer, CheckCircle, Clock, AlertTriangle, FileText, Package, CreditCard, Truck } from 'lucide-react';
import type { SellRecord } from '../../types/sell.types.js';

interface SellDetailModalProps {
  sell: SellRecord | null;
  onClose: () => void;
}

export const SellDetailModal: React.FC<SellDetailModalProps> = ({ sell, onClose }) => {
  if (!sell) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" /> Pago
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Parcial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Devedor
          </span>
        );
    }
  };

  return (
    <div
      id="sell-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="sell-detail-modal"
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Fatura: {sell.invoiceNumber}
                </h3>
                {getStatusBadge(sell.paymentStatus)}
              </div>
              <p className="text-xs text-slate-500">
                Data da venda: {sell.sellDate} | Local: {sell.locationName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-sell-modal"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              id="btn-close-sell-modal"
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Dados do Cliente e Localização */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wide">
                Dados do Cliente:
              </span>
              <p className="font-semibold text-slate-900 text-sm mt-1">{sell.customerName}</p>
              {sell.contactNumber && (
                <p className="text-slate-600 mt-0.5">Contato: {sell.contactNumber}</p>
              )}
              {sell.billingAddress && (
                <p className="text-slate-600 mt-0.5">Endereço de Cobrança: {sell.billingAddress}</p>
              )}
              {sell.shippingAddress && (
                <p className="text-slate-600 mt-0.5">Endereço de Entrega: {sell.shippingAddress}</p>
              )}
            </div>
            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wide">
                Informações da Venda:
              </span>
              <p className="text-slate-700 mt-1">
                <strong className="text-slate-900">Status da Venda:</strong> {sell.status.toUpperCase()}
              </p>
              <p className="text-slate-700 mt-0.5">
                <strong className="text-slate-900">Prazo de Pagamento:</strong> {sell.paymentTerm} ({sell.paymentTermDays || 0} dias)
              </p>
              <p className="text-slate-700 mt-0.5">
                <strong className="text-slate-900">Vendedor:</strong> {sell.userName || 'Admin Geral'}
              </p>
              {sell.isSubscription && (
                <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-700 rounded">
                  Assinatura Recorrente
                </span>
              )}
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">Itens Faturados</h4>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Produto</th>
                    <th className="px-3 py-2 text-center">Qtd</th>
                    <th className="px-3 py-2 text-right">Preço Unit.</th>
                    <th className="px-3 py-2 text-right">Desconto (%)</th>
                    <th className="px-3 py-2 text-right">Taxa (%)</th>
                    <th className="px-3 py-2 text-right">Preço c/ Imposto</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {sell.items && sell.items.length > 0 ? (
                    sell.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-900">{item.productName}</div>
                          {item.sku && (
                            <span className="text-[11px] text-slate-500">SKU: {item.sku}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center font-medium">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {Number(item.unitPrice).toFixed(2)} R$
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(item.discountPercentage || 0)}%
                        </td>
                        <td className="px-3 py-2 text-right">{Number(item.taxRate || 0)}%</td>
                        <td className="px-3 py-2 text-right">
                          {Number(item.imTaxPrice || item.unitPrice).toFixed(2)} R$
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {Number(item.subtotal).toFixed(2)} R$
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-slate-500">
                        Nenhum item registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Financeiro e Envio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Detalhes de Envio */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase">Dados de Remessa</h4>
              </div>
              <p className="text-slate-700">
                <strong>Status de Envio:</strong> {sell.shipping?.shippingStatus || 'Pendente'}
              </p>
              <p className="text-slate-700 mt-1">
                <strong>Detalhes:</strong> {sell.shipping?.shippingDetails || 'Não informado'}
              </p>
              <p className="text-slate-700 mt-1">
                <strong>Entregue a:</strong> {sell.shipping?.deliveredTo || 'Não informado'}
              </p>
              <p className="text-slate-700 mt-1">
                <strong>Custos de Envio:</strong> {Number(sell.shipping?.shippingCost || 0).toFixed(2)} R$
              </p>
            </div>

            {/* Totais */}
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal dos Produtos:</span>
                <span className="font-semibold">{Number(sell.itemsTotal || 0).toFixed(2)} R$</span>
              </div>
              {sell.discountTotal > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto Aplicado:</span>
                  <span>(-) {Number(sell.discountTotal).toFixed(2)} R$</span>
                </div>
              )}
              {sell.cashback && sell.cashback.redeemedValue > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Cashback Resgatado:</span>
                  <span>(-) {Number(sell.cashback.redeemedValue).toFixed(2)} R$</span>
                </div>
              )}
              {sell.orderTaxTotal > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Imposto do Pedido:</span>
                  <span>(+) {Number(sell.orderTaxTotal).toFixed(2)} R$</span>
                </div>
              )}
              {Number(sell.shipping?.shippingCost || 0) > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Frete / Envio:</span>
                  <span>(+) {Number(sell.shipping?.shippingCost || 0).toFixed(2)} R$</span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Valor Total:</span>
                <span className="text-blue-700">{Number(sell.totalAmount).toFixed(2)} R$</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-700">
                <span>Total Pago:</span>
                <span>{Number(sell.totalPaid).toFixed(2)} R$</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-700">
                <span>Vender Devedor:</span>
                <span>{Number(sell.sellDue).toFixed(2)} R$</span>
              </div>
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">Pagamentos Registrados</h4>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Método</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Nota / Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sell.payments && sell.payments.length > 0 ? (
                    sell.payments.map((pay, i) => (
                      <tr key={pay.id || i}>
                        <td className="px-3 py-2 text-slate-700">{pay.paidAt}</td>
                        <td className="px-3 py-2 font-medium capitalize text-slate-900">
                          {pay.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="px-3 py-2 font-bold text-emerald-700">
                          {Number(pay.amount).toFixed(2)} R$
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {pay.paymentNote || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-3 text-slate-500">
                        Nenhum pagamento registrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
