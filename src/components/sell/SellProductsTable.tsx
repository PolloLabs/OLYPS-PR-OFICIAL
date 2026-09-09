import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Package } from 'lucide-react';
import type { SellProductItem } from '../../types/sell.types.js';

interface SellProductsTableProps {
  items: SellProductItem[];
  availableProducts: any[];
  onAddItem: (product: any) => void;
  onUpdateItem: (itemId: string, updates: Partial<SellProductItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export const SellProductsTable: React.FC<SellProductsTableProps> = ({
  items,
  availableProducts,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Filtrar produtos disponíveis pela busca
  const filteredCatalog = availableProducts.filter((p) => {
    if (!searchTerm.trim()) return false;
    const q = searchTerm.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || '').toLowerCase().includes(q);
    const barMatch = (p.barcode || '').toLowerCase().includes(q);
    return nameMatch || skuMatch || barMatch;
  });

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalQuantity = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const totalSubtotal = items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);

  return (
    <div
      id="sell-products-section"
      className="bg-white rounded-md border border-slate-200 border-t-4 border-t-blue-600 shadow-sm p-5 mb-5"
    >
      {/* Campo de Busca de Produtos */}
      <div className="mb-4 relative" ref={dropdownRef}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="sell-product-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (searchTerm.trim()) setShowDropdown(true);
              }}
              placeholder="Digite o nome do produto / SKU / código de barras"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
          <button
            id="btn-open-catalog-modal"
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors shadow-2xs shrink-0 flex items-center gap-1 font-medium"
            title="Adicionar ou Selecionar do Catálogo"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Catálogo</span>
          </button>
        </div>

        {/* Dropdown de Autocompletar */}
        {showDropdown && filteredCatalog.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredCatalog.map((prod) => (
              <div
                key={prod.id}
                onClick={() => {
                  onAddItem(prod);
                  setSearchTerm('');
                  setShowDropdown(false);
                }}
                className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-800">{prod.name}</div>
                  <div className="text-[11px] text-slate-500">
                    SKU: {prod.sku || 'N/A'} | Cód. Barras: {prod.barcode || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-700">
                    {Number(prod.price || prod.sellingPrice || prod.unitPrice || 0).toFixed(2)} R$
                  </span>
                  <span className="block text-[10px] text-emerald-600 font-medium">
                    Clique para adicionar
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de Produtos */}
      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-3.5 py-2.5">Produto</th>
              <th className="px-3 py-2.5 w-24 text-center">Quantidade</th>
              <th className="px-3 py-2.5 w-28 text-right">preço unitário</th>
              <th className="px-3 py-2.5 w-24 text-right">Discount</th>
              <th className="px-3 py-2.5 w-24 text-right">Taxa</th>
              <th className="px-3 py-2.5 w-28 text-right">Im Tax Price</th>
              <th className="px-3 py-2.5 w-28 text-right">Subtotal</th>
              <th className="px-3 py-2.5 w-12 text-center">X</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  {/* Produto */}
                  <td className="px-3.5 py-2">
                    <div className="font-semibold text-slate-800">
                      {item.productName}
                    </div>
                    {item.sku && (
                      <div className="text-[11px] text-slate-400">SKU: {item.sku}</div>
                    )}
                  </td>

                  {/* Quantidade */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateItem(item.id, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-16 text-center bg-slate-50 border border-slate-300 rounded py-1 px-1 text-slate-800 focus:outline-none focus:border-blue-500 text-xs font-semibold"
                    />
                  </td>

                  {/* preço unitário */}
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) =>
                        onUpdateItem(item.id, {
                          unitPrice: Number(e.target.value) || 0,
                        })
                      }
                      className="w-20 text-right bg-slate-50 border border-slate-300 rounded py-1 px-1.5 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </td>

                  {/* Discount (%) */}
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discountPercentage}
                        onChange={(e) =>
                          onUpdateItem(item.id, {
                            discountPercentage: Number(e.target.value) || 0,
                          })
                        }
                        className="w-14 text-right bg-slate-50 border border-slate-300 rounded py-1 px-1 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                      />
                      <span className="text-slate-500 text-[11px]">%</span>
                    </div>
                  </td>

                  {/* Taxa (%) */}
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.taxRate}
                        onChange={(e) =>
                          onUpdateItem(item.id, {
                            taxRate: Number(e.target.value) || 0,
                          })
                        }
                        className="w-14 text-right bg-slate-50 border border-slate-300 rounded py-1 px-1 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                      />
                      <span className="text-slate-500 text-[11px]">%</span>
                    </div>
                  </td>

                  {/* Im Tax Price */}
                  <td className="px-3 py-2 text-right font-medium text-slate-700">
                    {Number(item.imTaxPrice || item.unitPrice).toFixed(2)}
                  </td>

                  {/* Subtotal */}
                  <td className="px-3 py-2 text-right font-bold text-slate-900">
                    {Number(item.subtotal).toFixed(2)}
                  </td>

                  {/* X (Remover) */}
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors"
                      title="Remover produto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-400">
                  Nenhum produto adicionado. Digite o nome acima ou clique no botão Catálogo.
                </td>
              </tr>
            )}
          </tbody>

          {/* Rodapé da tabela com Totais */}
          <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
            <tr>
              <td className="px-3.5 py-2.5">
                Total de Linhas: {items.length}
              </td>
              <td className="px-3 py-2.5 text-center font-bold">
                Item: {totalQuantity.toFixed(2)}
              </td>
              <td colSpan={4} className="px-3 py-2.5 text-right uppercase text-[11px] text-slate-600">
                Total dos Produtos:
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-blue-800">
                Total: {totalSubtotal.toFixed(2)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal de Catálogo Completo */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Catálogo de Produtos Disponíveis</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 text-xs">
              {availableProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-blue-50/50 transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-800">{p.name}</div>
                    <div className="text-[11px] text-slate-500">
                      SKU: {p.sku || 'N/A'} | Cód. Barras: {p.barcode || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-sm">
                      {Number(p.price || p.sellingPrice || p.unitPrice || 0).toFixed(2)} R$
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onAddItem(p);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
