import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Search,
  Barcode,
  Info,
  DollarSign,
  Percent,
} from 'lucide-react';
import type { PurchaseItem } from '../../types/purchase.types.js';

interface PurchaseItemsTableProps {
  companyId: string;
  items: PurchaseItem[];
  addItem: (item: Partial<PurchaseItem>) => void;
  updateItem: (index: number, field: string, value: any) => void;
  removeItem: (index: number) => void;
}

interface ProductCatalogOption {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  costPrice?: number;
  salePrice?: number;
}

export const PurchaseItemsTable: React.FC<PurchaseItemsTableProps> = ({
  companyId,
  items,
  addItem,
  updateItem,
  removeItem,
}) => {
  const [catalogProducts, setCatalogProducts] = useState<ProductCatalogOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Carregar produtos do catálogo para auto-complete
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        setLoadingProducts(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('olyps_auth_token') : '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-company-id': companyId,
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`/api/companies/${companyId}/products`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            if (isMounted) {
              setCatalogProducts(
                data.data.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  sku: p.sku || '',
                  barcode: p.barcode || '',
                  costPrice: Number(p.costPrice || p.cost_price || 0),
                  salePrice: Number(p.salePrice || p.sale_price || 0),
                }))
              );
            }
          }
        }
      } catch {
        // Silencioso se offline/mock
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  // Lista de sugestões rápidas se o catálogo estiver vazio
  const sampleProducts: ProductCatalogOption[] =
    catalogProducts.length > 0
      ? catalogProducts
      : [
          { id: 'p-1', name: 'Tela Frontal Samsung Galaxy A14 4G', sku: 'TEL-SMA14', barcode: '7891000101', costPrice: 85.0 },
          { id: 'p-2', name: 'Bateria Original iPhone 11 3110mAh', sku: 'BAT-IPH11', barcode: '7891000102', costPrice: 110.0 },
          { id: 'p-3', name: 'Cabo Carregador Tipo C 20W Turbo', sku: 'CAB-USBC-20W', barcode: '7891000103', costPrice: 14.5 },
          { id: 'p-4', name: 'Fonte Alimentação Bancada 30V 5A', sku: 'FER-FONTE305', barcode: '7891000104', costPrice: 280.0 },
          { id: 'p-5', name: 'Película de Vidro 3D Universal', sku: 'PEL-3D-UNI', barcode: '7891000105', costPrice: 3.5 },
        ];

  const filteredProducts = sampleProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm)
  );

  const handleSelectProduct = (product: ProductCatalogOption) => {
    addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      quantity: 1,
      unitCostBeforeDiscount: product.costPrice || 50,
      discountPercentage: 0,
      taxOnProducts: 0,
      profitMarginPercent: 35,
    });
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleAddBlankItem = () => {
    addItem({
      productId: `manual-${Date.now()}`,
      productName: '',
      sku: '',
      barcode: '',
      quantity: 1,
      unitCostBeforeDiscount: 0,
      discountPercentage: 0,
      taxOnProducts: 0,
      profitMarginPercent: 30,
    });
  };

  // Totais resumidos da tabela
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalSubtotal = items.reduce((sum, item) => sum + (Number(item.subtotalBeforeTax) || 0), 0);
  const totalLines = items.reduce((sum, item) => sum + (Number(item.totalLine) || 0), 0);

  return (
    <div id="purchase-items-table-section" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800">Itens e Produtos da Compra</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddBlankItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Linha Avulsa
          </button>
        </div>
      </div>

      {/* Busca e seleção rápida de produto */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Digite o nome do produto, SKU ou código de barras para adicionar à compra..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Dropdown de sugestões */}
        {showDropdown && searchTerm.trim() && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleSelectProduct(prod)}
                  className="w-full px-4 py-2.5 text-left text-xs hover:bg-indigo-50/60 flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{prod.name}</p>
                    <p className="text-[11px] text-slate-500">
                      SKU: {prod.sku || 'N/A'} | Cód. Barras: {prod.barcode || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right font-semibold text-emerald-600">
                    Custo Sugerido: R$ {(prod.costPrice || 0).toFixed(2)}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 text-center">
                Nenhum produto cadastrado encontrado. Você pode adicionar manualmente clicando em "Adicionar Linha Avulsa".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabela de Produtos */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[200px]">Produto / Descrição</th>
              <th className="py-2.5 px-3 w-20 text-center">Qtd</th>
              <th className="py-2.5 px-3 w-28 text-right">Custo Unit. (R$)</th>
              <th className="py-2.5 px-3 w-20 text-center">Desc. (%)</th>
              <th className="py-2.5 px-3 w-24 text-right">Custo Unit. s/ Imp.</th>
              <th className="py-2.5 px-3 w-24 text-right">Subtotal s/ Imp.</th>
              <th className="py-2.5 px-3 w-20 text-center">Imposto (%)</th>
              <th className="py-2.5 px-3 w-24 text-right">Total Linha (R$)</th>
              <th className="py-2.5 px-3 w-20 text-center">Margem (%)</th>
              <th className="py-2.5 px-3 w-28 text-right">Preço Venda (R$)</th>
              <th className="py-2.5 px-3 w-12 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-500">Nenhum produto adicionado à compra</p>
                    <p className="text-[11px] text-slate-400">
                      Use a barra de busca acima ou clique em "Adicionar Linha Avulsa" para iniciar.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                  {/* # */}
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Nome do Produto */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                      placeholder="Nome do produto..."
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={item.sku || ''}
                        onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                        placeholder="SKU"
                        className="w-24 px-1.5 py-0.5 text-[10px] border border-slate-200 rounded font-mono text-slate-600"
                      />
                      <input
                        type="text"
                        value={item.barcode || ''}
                        onChange={(e) => updateItem(idx, 'barcode', e.target.value)}
                        placeholder="Cód. Barras"
                        className="w-28 px-1.5 py-0.5 text-[10px] border border-slate-200 rounded font-mono text-slate-600"
                      />
                    </div>
                  </td>

                  {/* Quantidade */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </td>

                  {/* Custo Unit. Antes Desconto */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCostBeforeDiscount}
                      onChange={(e) =>
                        updateItem(idx, 'unitCostBeforeDiscount', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </td>

                  {/* Desconto % */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.discountPercentage}
                      onChange={(e) =>
                        updateItem(idx, 'discountPercentage', parseFloat(e.target.value) || 0)
                      }
                      className="w-16 px-1.5 py-1 border border-slate-200 rounded text-center text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Custo Unit. Antes Imposto */}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    R$ {(item.unitCostBeforeTax || 0).toFixed(2)}
                  </td>

                  {/* Subtotal Antes Imposto */}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-medium">
                    R$ {(item.subtotalBeforeTax || 0).toFixed(2)}
                  </td>

                  {/* Imposto % */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.taxOnProducts}
                      onChange={(e) =>
                        updateItem(idx, 'taxOnProducts', parseFloat(e.target.value) || 0)
                      }
                      className="w-16 px-1.5 py-1 border border-slate-200 rounded text-center text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Total Linha */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    R$ {(item.totalLine || 0).toFixed(2)}
                  </td>

                  {/* Margem Lucro % */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="1"
                      value={item.profitMarginPercent}
                      onChange={(e) =>
                        updateItem(idx, 'profitMarginPercent', parseFloat(e.target.value) || 0)
                      }
                      className="w-16 px-1.5 py-1 border border-slate-200 rounded text-center text-xs font-mono focus:ring-1 focus:ring-indigo-500 text-indigo-700 font-semibold"
                    />
                  </td>

                  {/* Preço de Venda Unitário */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                    R$ {(item.unitSalePriceWithTax || 0).toFixed(2)}
                  </td>

                  {/* Ações */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Remover linha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Rodapé da tabela com totais parciais */}
          {items.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 font-bold text-xs text-slate-800 border-t border-slate-300">
                <td colSpan={2} className="py-3 px-3 text-right">
                  Totais Parciais:
                </td>
                <td className="py-3 px-3 text-center font-mono text-indigo-700">{totalQty} un</td>
                <td colSpan={3} className="py-3 px-3 text-right font-mono">
                  Subtotal: R$ {totalSubtotal.toFixed(2)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-right">
                  Total Produtos:
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-900 text-sm">
                  R$ {totalLines.toFixed(2)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default PurchaseItemsTable;
