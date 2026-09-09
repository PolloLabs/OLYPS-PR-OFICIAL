import React from 'react';
import { Package, Image as ImageIcon } from 'lucide-react';
import type { POSProduct } from '../../types/pos.types.js';

interface POSProductGridProps {
  products: POSProduct[];
  categories: string[];
  brands: string[];
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
  selectedBrand: string;
  onSelectBrand: (val: string) => void;
  onAddProduct: (prod: POSProduct) => void;
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  products,
  categories,
  brands,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  onAddProduct,
}) => {
  return (
    <div
      id="pos-product-grid-container"
      className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden"
    >
      {/* Barra de Filtros: Categorias e Marcas */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2">
        {/* Dropdown Categorias */}
        <div>
          <select
            id="select-pos-category"
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 capitalize font-medium"
          >
            <option value="all">todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown Marcas */}
        <div>
          <select
            id="select-pos-brand"
            value={selectedBrand}
            onChange={(e) => onSelectBrand(e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 capitalize font-medium"
          >
            <option value="all">Todas as marcas</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Produtos com Imagens (4 colunas) */}
      <div className="flex-1 p-3 overflow-y-auto min-h-[300px] max-h-[calc(100vh-340px)]">
        {products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">Nenhum produto encontrado</p>
            <p className="text-[11px] text-slate-400">
              Tente alterar os filtros de categoria ou marca.
            </p>
          </div>
        ) : (
          <div
            id="grid-pos-catalog"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5"
          >
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onAddProduct(product)}
                className="group relative flex flex-col bg-white border border-slate-200 rounded-lg p-2 text-left hover:border-blue-500 hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 overflow-hidden"
              >
                {/* Imagem do Produto */}
                <div className="w-full aspect-square bg-slate-100 rounded flex items-center justify-center overflow-hidden mb-2 relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        // Fallback em caso de erro na imagem
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}

                  {/* Badge de Preço */}
                  <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                    {product.imTaxPrice.toFixed(2)} R$
                  </span>
                </div>

                {/* Nome e Código */}
                <div className="flex-1 flex flex-col justify-between">
                  <h4
                    className="text-[11px] font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors"
                    title={`${product.name} (${product.code})`}
                  >
                    {product.name}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono text-blue-700 font-semibold">
                      ({product.code})
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Est: {product.stock}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
