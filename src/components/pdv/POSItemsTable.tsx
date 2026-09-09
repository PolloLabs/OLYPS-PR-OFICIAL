import React, { useState } from 'react';
import {
  User,
  Plus,
  Search,
  Info,
  Trash2,
  Minus,
  Edit2,
  HelpCircle,
} from 'lucide-react';
import type { POSItem } from '../../types/pdv.types.js';
import type { SellCustomer } from '../../types/sell.types.js';

interface POSItemsTableProps {
  items: POSItem[];
  customers: SellCustomer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  onOpenCustomerModal: () => void;
  productSearch: string;
  onProductSearchChange: (val: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  totals: {
    totalItems: number;
    subtotal: number;
    discountValue: number;
    cashbackValue: number;
    orderTaxValue: number;
    shippingValue: number;
    totalToPay: number;
  };
  discountValue: number;
  setDiscountValue: (val: number) => void;
  cashbackValue: number;
  setCashbackValue: (val: number) => void;
  onUpdateCashBack?: (val: number) => boolean;
  onOpenCashbackModal?: () => void;
  orderTaxValue: number;
  setOrderTaxValue: (val: number) => void;
  shippingValue: number;
  setShippingValue: (val: number) => void;
}

export const POSItemsTable: React.FC<POSItemsTableProps> = ({
  items,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onOpenCustomerModal,
  productSearch,
  onProductSearchChange,
  onUpdateQuantity,
  onRemoveItem,
  totals,
  discountValue,
  setDiscountValue,
  cashbackValue,
  setCashbackValue,
  onUpdateCashBack,
  onOpenCashbackModal,
  orderTaxValue,
  setOrderTaxValue,
  shippingValue,
  setShippingValue,
}) => {
  const [activeEditingField, setActiveEditingField] = useState<string | null>(
    null
  );

  return (
    <div
      id="pos-items-table-container"
      className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden"
    >
      {/* Barra de Seleção de Cliente e Busca de Produto */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
        {/* Seleção de Cliente */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white border border-slate-300 rounded overflow-hidden h-9">
            <span className="px-2.5 text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <select
              id="select-pos-customer"
              value={selectedCustomerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="w-full h-full text-xs text-slate-700 bg-transparent focus:outline-none pr-2"
            >
              <option value="cust-fake-01">Cliente Consumidor Fake</option>
              {customers
                .filter((c) => c.id !== 'cust-fake-01')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.contactNumber ? `(${c.contactNumber})` : ''}
                  </option>
                ))}
            </select>
          </div>
          <button
            id="btn-pos-add-customer"
            type="button"
            onClick={onOpenCustomerModal}
            title="Adicionar Cliente"
            className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center shadow-sm transition-colors cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Busca de Produto */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white border border-slate-300 rounded overflow-hidden h-9">
            <span className="px-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="input-pos-product-search"
              type="text"
              value={productSearch}
              onChange={(e) => onProductSearchChange(e.target.value)}
              placeholder="Digite o nome do produto / SKU / código de barras"
              className="w-full h-full text-xs text-slate-700 bg-transparent focus:outline-none pr-2"
            />
          </div>
          <button
            id="btn-pos-add-product-quick"
            type="button"
            title="Adicionar Produto Rápido"
            className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center shadow-sm transition-colors cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabela de Itens (com scroll) */}
      <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[calc(100vh-420px)] border-b border-slate-200">
        <table
          id="table-pos-items"
          className="w-full text-left text-xs text-slate-700"
        >
          <thead className="bg-slate-100/80 sticky top-0 z-10 text-[11px] font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">
                <div className="flex items-center gap-1">
                  <span>Produto</span>
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </th>
              <th className="py-2.5 px-2 text-center w-24">Quantidade</th>
              <th className="py-2.5 px-2 text-right w-28">Im Tax Price</th>
              <th className="py-2.5 px-3 text-right w-24">Subtotal</th>
              <th className="py-2.5 px-2 text-center w-10">X</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-slate-400 font-medium"
                >
                  Nenhum produto adicionado na venda atual.
                  <div className="text-[11px] text-slate-400 font-normal mt-1">
                    Selecione itens no catálogo ao lado ou pesquise pelo código/SKU.
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  {/* Produto */}
                  <td className="py-2 px-3">
                    <div className="font-semibold text-slate-800 line-clamp-1">
                      {item.productName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{item.code}</span>
                      {item.sku && <span>• {item.sku}</span>}
                    </div>
                  </td>

                  {/* Quantidade */}
                  <td className="py-2 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateQuantity(
                            item.id,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-9 h-6 text-center text-xs font-semibold text-slate-800 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Im Tax Price */}
                  <td className="py-2 px-2 text-right font-medium text-slate-700">
                    {item.imTaxPrice.toFixed(2)} R$
                  </td>

                  {/* Subtotal */}
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {item.subtotal.toFixed(2)} R$
                  </td>

                  {/* Remover X */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      title="Remover Item"
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé da Tabela de Itens */}
      <div className="bg-slate-50 p-3 space-y-2 border-t border-slate-200 text-xs">
        {/* Linha 1: Itens e Total */}
        <div className="flex items-center justify-between font-bold text-slate-800 px-1">
          <div>
            Item: <span className="font-semibold text-blue-700">{totals.totalItems.toFixed(2)}</span>
          </div>
          <div>
            Total: <span className="text-base text-blue-700">{totals.subtotal.toFixed(2)} R$</span>
          </div>
        </div>

        {/* Linha 2: Desconto, Cashback, Imposto, Envio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
          {/* Desconto */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Desconto</span>
            <Info className="w-3 h-3 text-blue-500" />
            <span className="text-slate-400">:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className="w-14 ml-auto text-right text-xs font-semibold text-rose-600 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Cashback */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200">
            <button
              type="button"
              id="btn-pos-open-cashback-modal"
              onClick={onOpenCashbackModal}
              title="Clique para abrir opções de Cash Back"
              className="flex items-center gap-1 text-slate-700 hover:text-amber-700 font-medium transition-colors cursor-pointer group"
            >
              <span className="group-hover:underline">Cash back (-)</span>
              <Edit2 className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-slate-400">:</span>
            <input
              id="input-pos-cashback"
              type="number"
              min="0"
              step="0.01"
              value={cashbackValue === 0 ? '' : cashbackValue}
              placeholder="0.00"
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                if (onUpdateCashBack) {
                  onUpdateCashBack(val);
                } else {
                  setCashbackValue(val);
                }
              }}
              title="Valor de cash back a abater (não pode exceder o subtotal)"
              className="w-14 ml-auto text-right text-xs font-semibold text-amber-600 border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Imposto do Pedido */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Imposto(+)</span>
            <Info className="w-3 h-3 text-blue-500" />
            <span className="text-slate-400">:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={orderTaxValue}
              onChange={(e) => setOrderTaxValue(parseFloat(e.target.value) || 0)}
              className="w-14 ml-auto text-right text-xs font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Envio */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Envio(+)</span>
            <Info className="w-3 h-3 text-blue-500" />
            <span className="text-slate-400">:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shippingValue}
              onChange={(e) => setShippingValue(parseFloat(e.target.value) || 0)}
              className="w-14 ml-auto text-right text-xs font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
