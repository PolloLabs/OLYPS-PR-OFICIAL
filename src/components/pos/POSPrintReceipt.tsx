import React from 'react';
import { Printer, X, Check, Building2, User, Calendar, Receipt } from 'lucide-react';
import type { POSItem } from '../../types/pos.types.js';
import type { SellCustomer } from '../../types/sell.types.js';

interface POSPrintReceiptProps {
  items: POSItem[];
  customer?: SellCustomer;
  subtotal: number;
  discountValue: number;
  cashbackValue: number;
  orderTaxValue: number;
  shippingValue: number;
  totalToPay: number;
  locationName?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  date?: string;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
}

export const POSPrintReceipt: React.FC<POSPrintReceiptProps> = ({
  items,
  customer,
  subtotal,
  discountValue,
  cashbackValue,
  orderTaxValue,
  shippingValue,
  totalToPay,
  locationName = 'Franquia São Paulo (Loja Online SP)',
  paymentMethod = 'Dinheiro',
  invoiceNumber = 'POS-REC-2026',
  date = '07-09-2026 11:03',
  isOpen,
  onClose,
  onPrint,
}) => {
  return (
    <>
      {/* 
        ESTRUTURA DEDICADA PARA IMPRESSÃO TÉRMICA (80mm) 
        Este bloco é oculto na tela normal pela classe "hidden print:block", 
        mas quando window.print() é acionado, @media print o torna visível
      */}
      <div
        id="pos-receipt-print"
        className="hidden print:block font-mono text-[11px] text-black bg-white leading-tight p-2"
        style={{ width: '80mm', maxWidth: '80mm' }}
      >
        {/* Cabeçalho */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <div className="font-bold text-sm uppercase tracking-wider">
            OLYPS PRO
          </div>
          <div className="text-[10px] uppercase">{locationName}</div>
          <div className="text-[9px] text-black">CNPJ: 12.345.678/0001-90</div>
          <div className="text-[9px]">Rua Augusta, 1200 - São Paulo/SP</div>
        </div>

        {/* Metadados */}
        <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>DOC: {invoiceNumber}</span>
            <span>DATA: {date}</span>
          </div>
          <div className="flex justify-between">
            <span>OPERADOR: Admin Master</span>
            <span>TERMINAL: POS-01</span>
          </div>
          {customer && (
            <div className="pt-0.5">
              <span>CLIENTE: {customer.name}</span>
              {customer.contactNumber && (
                <span className="block text-[9px]">TEL: {customer.contactNumber}</span>
              )}
            </div>
          )}
        </div>

        {/* Itens */}
        <div className="py-1.5 border-b border-dashed border-black">
          <div className="text-[10px] font-bold grid grid-cols-12 pb-1 border-b border-black">
            <span className="col-span-6">ITEM</span>
            <span className="col-span-2 text-center">QTD</span>
            <span className="col-span-2 text-right">UN</span>
            <span className="col-span-2 text-right">TOT</span>
          </div>

          <div className="space-y-1 pt-1">
            {items.map((it, idx) => (
              <div key={it.id || idx} className="text-[10px]">
                <div className="font-semibold truncate">{it.productName}</div>
                <div className="grid grid-cols-12 text-[9px] text-gray-800">
                  <span className="col-span-6 text-gray-600 truncate">{it.code}</span>
                  <span className="col-span-2 text-center">{it.quantity}x</span>
                  <span className="col-span-2 text-right">
                    {it.imTaxPrice.toFixed(2)}
                  </span>
                  <span className="col-span-2 text-right font-bold">
                    {it.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totais */}
        <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          {discountValue > 0 && (
            <div className="flex justify-between">
              <span>DESCONTO (-):</span>
              <span>- R$ {discountValue.toFixed(2)}</span>
            </div>
          )}
          {cashbackValue > 0 && (
            <div className="flex justify-between font-semibold">
              <span>CASH BACK (-):</span>
              <span>- R$ {cashbackValue.toFixed(2)}</span>
            </div>
          )}
          {orderTaxValue > 0 && (
            <div className="flex justify-between">
              <span>IMPOSTO (+):</span>
              <span>+ R$ {orderTaxValue.toFixed(2)}</span>
            </div>
          )}
          {shippingValue > 0 && (
            <div className="flex justify-between">
              <span>ENVIO (+):</span>
              <span>+ R$ {shippingValue.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-bold pt-1 border-t border-black">
            <span>TOTAL:</span>
            <span>R$ {totalToPay.toFixed(2)}</span>
          </div>
        </div>

        {/* Pagamento */}
        <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>FORMA DE PAGTO:</span>
            <span className="font-bold uppercase">{paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>VALOR PAGO:</span>
            <span>R$ {totalToPay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TROCO:</span>
            <span>R$ 0,00</span>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center pt-2 text-[9px] space-y-0.5">
          <div className="font-bold">Obrigado pela preferência!</div>
          <div>Volte sempre!</div>
          <div className="text-[8px] text-gray-700 tracking-wider">
            PDV INTELIGENTE - V5.31
          </div>
        </div>
      </div>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE CUPOM (TELA) */}
      {isOpen && (
        <div
          id="modal-pos-print-receipt-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print"
        >
          <div
            id="modal-pos-print-receipt"
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  Impressão de Cupom (80mm)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pré-visualização do recibo térmico não fiscal
                </p>
              </div>
            </div>

            {/* Simulação física da bobina 80mm */}
            <div className="flex-1 overflow-y-auto bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/70 font-mono text-xs text-slate-800 shadow-inner">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-black text-sm uppercase tracking-wider text-slate-900">
                  OLYPS PRO
                </div>
                <div className="text-[10px] text-slate-600 uppercase">
                  {locationName}
                </div>
                <div className="text-[10px] text-slate-500">
                  CNPJ: 12.345.678/0001-90
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5 text-slate-600">
                <div className="flex justify-between">
                  <span>DOC: {invoiceNumber}</span>
                  <span>{date}</span>
                </div>
                {customer && (
                  <div className="font-semibold text-slate-800 truncate">
                    Cliente: {customer.name}
                  </div>
                )}
              </div>

              {/* Tabela de produtos */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5">
                <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 border-b border-slate-200 pb-1">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qtd</span>
                  <span className="col-span-4 text-right">Subtotal</span>
                </div>
                {items.map((it) => (
                  <div key={it.id} className="text-[11px]">
                    <div className="font-bold text-slate-900 truncate">
                      {it.productName}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>
                        {it.quantity}x R$ {it.imTaxPrice.toFixed(2)}
                      </span>
                      <span className="font-bold text-slate-800">
                        R$ {it.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais do Recibo */}
              <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Desconto (-):</span>
                    <span>- R$ {discountValue.toFixed(2)}</span>
                  </div>
                )}
                {cashbackValue > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Cash Back (-):</span>
                    <span>- R$ {cashbackValue.toFixed(2)}</span>
                  </div>
                )}
                {orderTaxValue > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Imposto (+):</span>
                    <span>+ R$ {orderTaxValue.toFixed(2)}</span>
                  </div>
                )}
                {shippingValue > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Envio (+):</span>
                    <span>+ R$ {shippingValue.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>R$ {totalToPay.toFixed(2)}</span>
                </div>
              </div>

              {/* Forma de Pagamento e Rodapé */}
              <div className="py-2 border-b border-dashed border-slate-300 text-[11px] flex justify-between">
                <span className="text-slate-600">Forma de Pagamento:</span>
                <span className="font-bold text-slate-800">{paymentMethod}</span>
              </div>

              <div className="pt-3 text-center space-y-0.5 text-[10px] text-slate-500">
                <div className="font-bold text-slate-700">
                  Obrigado pela preferência!
                </div>
                <div>PDV INTELIGENTE - V5.31</div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                id="btn-confirm-print-receipt"
                type="button"
                onClick={() => {
                  onPrint();
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
