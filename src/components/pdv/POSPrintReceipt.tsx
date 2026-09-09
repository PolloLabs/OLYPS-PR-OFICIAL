import React, { useEffect } from 'react';
import { PDVItem } from '../../types/pdv.types.js';

export interface POSPrintReceiptProps {
  items: PDVItem[] | any[];
  subtotal: number;
  desconto?: number;
  discountValue?: number;
  cashBack?: number;
  cashbackValue?: number;
  imposto?: number;
  orderTaxValue?: number;
  envio?: number;
  shippingValue?: number;
  total?: number;
  totalToPay?: number;
  cliente?: string;
  customer?: any;
  formaPagamento?: string;
  paymentMethod?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onPrint?: () => void;
  completedSaleReceipt?: any;
  autoPrint?: boolean;
  onPrintComplete?: () => void;
}

export const POSPrintReceipt: React.FC<POSPrintReceiptProps> = ({
  items,
  subtotal,
  desconto = 0,
  discountValue = 0,
  cashBack = 0,
  cashbackValue = 0,
  imposto = 0,
  orderTaxValue = 0,
  envio = 0,
  shippingValue = 0,
  total = 0,
  totalToPay = 0,
  cliente,
  customer,
  formaPagamento,
  paymentMethod,
  isOpen,
  onClose,
  onPrint,
  completedSaleReceipt,
  autoPrint = false,
  onPrintComplete,
}) => {
  const dataVenda = new Date().toLocaleString('pt-BR');
  
  // Valores normalizados
  const effectiveItems = (completedSaleReceipt?.items?.length ? completedSaleReceipt.items : items) || [];
  const effectiveSubtotal = completedSaleReceipt ? completedSaleReceipt.subtotal : subtotal;
  const effectiveDiscount = completedSaleReceipt ? (completedSaleReceipt.discountValue ?? 0) : (desconto || discountValue || 0);
  const effectiveCashback = completedSaleReceipt ? (completedSaleReceipt.cashbackValue ?? 0) : (cashBack || cashbackValue || 0);
  const effectiveTax = completedSaleReceipt ? (completedSaleReceipt.orderTaxValue ?? 0) : (imposto || orderTaxValue || 0);
  const effectiveShipping = completedSaleReceipt ? (completedSaleReceipt.shippingValue ?? 0) : (envio || shippingValue || 0);
  const effectiveTotal = completedSaleReceipt ? (completedSaleReceipt.totalToPay ?? completedSaleReceipt.total ?? 0) : (total || totalToPay || 0);
  const effectiveCliente = cliente || customer?.name || (typeof customer === 'string' ? customer : undefined);
  const effectivePayment = formaPagamento || paymentMethod || completedSaleReceipt?.paymentMethod || 'Dinheiro';

  // Auto-impressão quando o componente é montado e autoPrint está habilitado
  useEffect(() => {
    if (autoPrint && effectiveItems.length > 0) {
      // Aguardar renderização completa do DOM
      const timer = setTimeout(() => {
        const printElement = document.getElementById('pos-print-receipt-container');
        if (printElement) {
          try {
            window.print();
            onPrintComplete?.();
          } catch (err) {
            console.warn('Erro ao chamar window.print():', err);
          }
        }
      }, 400); // 400ms para garantir renderização
      
      return () => clearTimeout(timer);
    }
  }, [autoPrint, effectiveItems.length, onPrintComplete]);

  return (
    <>
      {/* Bloco dedicado para impressão física / térmica 80mm */}
      <div
        id="pos-print-receipt-container"
        className="print-only"
        style={{ width: '80mm', fontFamily: 'monospace', fontSize: '12px' }}
      >
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>TechStore Brasil Matriz</h2>
          <p style={{ margin: '3px 0', fontSize: '10px' }}>Franquia São Paulo (Loja Online SP)</p>
          <p style={{ margin: '3px 0', fontSize: '10px' }}>CNPJ: 00.000.000/0000-00</p>
          <p style={{ margin: '3px 0', fontSize: '10px' }}>{dataVenda}</p>
        </div>

        {/* Cliente */}
        {effectiveCliente && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Cliente:</strong> {effectiveCliente}
          </div>
        )}

        {/* Itens */}
        <div style={{ marginBottom: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '5px 0' }}>Produto</th>
                <th style={{ textAlign: 'center', padding: '5px 0' }}>Qtd</th>
                <th style={{ textAlign: 'right', padding: '5px 0' }}>Unit.</th>
                <th style={{ textAlign: 'right', padding: '5px 0' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {effectiveItems.map((item: any) => {
                const name = item.nome || item.productName || item.name || 'Item';
                const qty = item.quantidade ?? item.quantity ?? 1;
                const price = Number(item.precoUnitario ?? item.unitPrice ?? item.price ?? 0);
                const sub = Number(item.subtotal ?? (price * qty));
                return (
                  <tr key={item.id || Math.random()}>
                    <td style={{ padding: '3px 0', fontSize: '10px' }}>{name}</td>
                    <td style={{ textAlign: 'center', padding: '3px 0' }}>{qty}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>
                      {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>
                      {sub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Subtotal:</span>
            <span>{effectiveSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          {effectiveDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: 'red' }}>
              <span>Desconto (-):</span>
              <span>{effectiveDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )}
          {effectiveCashback > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: 'green' }}>
              <span>Cash Back (-):</span>
              <span>{effectiveCashback.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )}
          {effectiveTax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Imposto (+):</span>
              <span>{effectiveTax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )}
          {effectiveShipping > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Envio (+):</span>
              <span>{effectiveShipping.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '10px', 
            paddingTop: '10px', 
            borderTop: '2px solid #000',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            <span>TOTAL:</span>
            <span>{effectiveTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          {effectivePayment && (
            <div style={{ marginTop: '10px' }}>
              <strong>Forma de Pagamento:</strong> {effectivePayment}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center',
          borderTop: '1px dashed #000',
          paddingTop: '10px'
        }}>
          <p style={{ margin: '5px 0' }}>Obrigado pela preferência!</p>
          <p style={{ margin: '5px 0', fontSize: '10px' }}>PDV INTELIGENTE - V5.31</p>
          <p style={{ margin: '5px 0', fontSize: '10px' }}>Copyright © 2026 All rights reserved.</p>
        </div>

        {/* CSS para impressão */}
        <style>{`
          @media screen {
            .print-only {
              display: none !important;
            }
          }
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body * {
              visibility: hidden !important;
            }
            .print-only, .print-only * {
              visibility: visible !important;
            }
            .print-only {
              display: block !important;
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              background: white !important;
              color: black !important;
              z-index: 9999 !important;
            }
            /* Forçar impressão de cores de fundo */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </div>

      {/* Modal opcional de visualização prévia na tela */}
      {isOpen && (
        <div
          id="modal-print-receipt-preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 print:hidden"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative border border-slate-200">
            <h3 className="font-bold text-base text-slate-800 mb-3">Pré-visualização do Cupom</h3>
            <div className="bg-slate-50 p-4 border border-slate-200 rounded font-mono text-xs text-slate-800 mb-4 max-h-96 overflow-y-auto">
              <div className="text-center font-bold mb-2">TechStore Brasil Matriz</div>
              <div className="text-center text-[10px] text-slate-500 mb-2">Franquia São Paulo</div>
              {effectiveCliente && <div className="mb-2"><strong>Cliente:</strong> {effectiveCliente}</div>}
              <div className="border-t border-b border-dashed border-slate-300 py-2 my-2 space-y-1">
                {effectiveItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.nome || item.productName} x{item.quantidade || item.quantity}</span>
                    <span>{(item.subtotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-sm pt-2">
                <span>TOTAL:</span>
                <span>{effectiveTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Fechar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onPrint) onPrint();
                  else window.print();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
              >
                Imprimir Cupom
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default POSPrintReceipt;
