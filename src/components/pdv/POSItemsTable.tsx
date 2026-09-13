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
  onSearchEnter?: () => void;
  cartShake?: boolean;
  lastAddedItemId?: string | null;
  isKiosk?: boolean;
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
  onSearchEnter,
  cartShake = false,
  lastAddedItemId = null,
  isKiosk = false,
}) => {
  return (
    <div
      id="pos-items-table-container"
      className={`bg-white rounded-lg shadow-sm border transition-all duration-300 flex flex-col h-full min-h-0 overflow-hidden ${
        cartShake ? 'border-red-500 ring-2 ring-red-400 translate-x-0 animate-[shake_0.4s_ease-in-out]' : 'border-slate-200'
      }`}
    >
      {/* Estilo local para shake feedback */}
      <style>{`
        @keyframes posShakeAnim {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake-short {
          animation: posShakeAnim 0.4s ease-in-out;
        }
      `}</style>

      {/* Barra de Seleção de Cliente e Busca de Produto */}
      <div className="flex-none p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200 space-y-2">
        {/* Seleção de Cliente */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white border border-slate-300 rounded overflow-hidden h-9">
            <span className="px-2.5 text-slate-400 shrink-0">
              <User className="w-4 h-4" />
            </span>
            <select
              id="select-pos-customer"
              value={selectedCustomerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              aria-label="Selecionar cliente"
              className="w-full h-full text-xs text-slate-700 bg-transparent focus:outline-none pr-2 cursor-pointer"
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
            aria-label="Adicionar Novo Cliente"
            className="h-9 w-9 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded flex items-center justify-center shadow-sm transition-colors cursor-pointer flex-shrink-0 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Busca Inteligente de Produto com AutoFocus e Enter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white border border-slate-300 rounded overflow-hidden h-9 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
            <span className="px-2.5 text-slate-400 shrink-0">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="input-pos-product-search"
              type="text"
              autoFocus
              inputMode="search"
              value={productSearch}
              onChange={(e) => onProductSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearchEnter?.();
                }
              }}
              placeholder="Digite o nome / SKU / código (ENTER adiciona)"
              aria-label="Buscar produto por nome, SKU ou código de barras"
              className="w-full h-full text-xs text-slate-700 bg-transparent focus:outline-none pr-2"
            />
          </div>
          <button
            id="btn-pos-add-product-quick"
            type="button"
            onClick={onSearchEnter}
            title="Adicionar primeiro produto filtrado"
            aria-label="Adicionar produto filtrado"
            className="h-9 w-9 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded flex items-center justify-center shadow-sm transition-colors cursor-pointer flex-shrink-0 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ÁREA DE ITENS DO CARRINHO */}
      <div
        id="pos-cart-items-scroll"
        className={`flex-1 overflow-y-auto overflow-x-hidden border-b border-slate-200 ${
          isKiosk ? 'min-h-0' : 'min-h-[220px] sm:min-h-[260px] max-h-[calc(100vh-420px)]'
        }`}
      >
        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium px-4">
            Nenhum produto adicionado na venda atual.
            <div className="text-[11px] text-slate-400 font-normal mt-1">
              Selecione itens no catálogo ao lado ou pesquise pelo código/SKU.
            </div>
          </div>
        ) : (
          <>
            {/* VISUALIZAÇÃO MOBILE (320px - 767px): CARDS VERTICAIS */}
            <div className="block md:hidden p-2 space-y-2">
              {items.map((item) => {
                const isHighlighted =
                  lastAddedItemId === item.id ||
                  lastAddedItemId === item.productId;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-all duration-600 ${
                      isHighlighted
                        ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Linha superior do card: nome, código e lixeira */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold text-slate-800 text-sm truncate"
                          title={item.productName}
                        >
                          {item.productName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <span>{item.code}</span>
                          {item.sku && <span>• {item.sku}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        title="Remover Item"
                        aria-label="Remover Item"
                        className="w-9 h-9 min-w-[36px] min-h-[36px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Linha inferior do card: Stepper touch-friendly (40x40) + Preços empilhados */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      {/* Stepper Touch-Friendly (mínimo 40x40px) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label="Diminuir quantidade"
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded bg-slate-100 active:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer touch-manipulation text-base"
                        >
                          <Minus className="w-4 h-4" />
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
                          aria-label="Quantidade"
                          className="w-12 h-10 text-center text-sm font-bold text-slate-800 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                          aria-label="Aumentar quantidade"
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded bg-slate-100 active:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer touch-manipulation text-base"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Preço Unitário e Subtotal Empilhados */}
                      <div className="text-right">
                        <div className="text-[11px] text-slate-500">
                          Unit: {item.imTaxPrice.toFixed(2)} R$
                        </div>
                        <div className="text-base font-black text-slate-900">
                          {item.subtotal.toFixed(2)} R$
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VISUALIZAÇÃO TABLET / DESKTOP (768px+): TABELA HORIZONTAL */}
            <div className="hidden md:block">
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
                    <th className="py-2.5 px-2 text-center w-28">Quantidade</th>
                    <th className="py-2.5 px-2 text-right w-28">Preço Unit.</th>
                    <th className="py-2.5 px-3 text-right w-24">Subtotal</th>
                    <th className="py-2.5 px-2 text-center w-10">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isHighlighted =
                      lastAddedItemId === item.id ||
                      lastAddedItemId === item.productId;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors duration-600 ${
                          isHighlighted
                            ? 'bg-emerald-50/80'
                            : 'hover:bg-blue-50/30'
                        }`}
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

                        {/* Quantidade com Stepper */}
                        <td className="py-2 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(item.id, item.quantity - 1)
                              }
                              aria-label="Diminuir quantidade"
                              className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
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
                              aria-label="Quantidade"
                              className="w-10 h-7 text-center text-xs font-semibold text-slate-800 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(item.id, item.quantity + 1)
                              }
                              aria-label="Aumentar quantidade"
                              className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Preço Unitário */}
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
                            aria-label="Remover Item"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Rodapé da Tabela de Itens (Totais sempre visíveis) */}
      <div className="flex-none bg-slate-50 p-2.5 sm:p-3 space-y-2 border-t border-slate-200 text-xs">
        {/* Linha 1: Itens e Total */}
        <div className="flex items-center justify-between font-bold text-slate-800 px-1">
          <div>
            Item: <span className="font-semibold text-blue-700">{totals.totalItems.toFixed(2)}</span>
          </div>
          <div>
            Total: <span className="text-base sm:text-lg text-blue-700">{totals.subtotal.toFixed(2)} R$</span>
          </div>
        </div>

        {/* MOBILE: Lista de Ajustes */}
        <div className="grid grid-cols-2 sm:hidden gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
          <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Desconto:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              aria-label="Desconto"
              className="w-14 text-right text-xs font-semibold text-rose-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
            <button
              type="button"
              onClick={onOpenCashbackModal}
              className="font-medium text-slate-700 hover:text-amber-700 cursor-pointer text-left"
            >
              Cashback:
            </button>
            <input
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
              aria-label="Cashback"
              className="w-14 text-right text-xs font-semibold text-amber-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Imposto(+):</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={orderTaxValue}
              onChange={(e) => setOrderTaxValue(parseFloat(e.target.value) || 0)}
              aria-label="Imposto"
              className="w-14 text-right text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Envio(+):</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shippingValue}
              onChange={(e) => setShippingValue(parseFloat(e.target.value) || 0)}
              aria-label="Envio"
              className="w-14 text-right text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* TABLET E DESKTOP: Grid de Ajustes (4 colunas) */}
        <div className="hidden sm:grid sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
          {/* Desconto */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Desconto</span>
            <Info className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="text-slate-400">:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              aria-label="Desconto"
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
              aria-label="Opções de Cashback"
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
              title="Valor de cash back a abater"
              aria-label="Valor de cashback"
              className="w-14 ml-auto text-right text-xs font-semibold text-amber-600 border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Imposto do Pedido */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Imposto(+)</span>
            <Info className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="text-slate-400">:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={orderTaxValue}
              onChange={(e) => setOrderTaxValue(parseFloat(e.target.value) || 0)}
              aria-label="Imposto"
              className="w-14 ml-auto text-right text-xs font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Envio */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200">
            <span className="font-medium text-slate-700">Envio(+)</span>
            <Info className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="text-slate-400">:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shippingValue}
              onChange={(e) => setShippingValue(parseFloat(e.target.value) || 0)}
              aria-label="Envio"
              className="w-14 ml-auto text-right text-xs font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
