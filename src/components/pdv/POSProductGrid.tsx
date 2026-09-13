import React, { useState } from 'react';
import { Package } from 'lucide-react';
import type { POSProduct } from '../../types/pdv.types.js';

interface POSProductGridProps {
  products: POSProduct[];
  categories: string[];
  brands: string[];
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
  selectedBrand: string;
  onSelectBrand: (val: string) => void;
  onAddProduct: (prod: POSProduct) => void;
  isLoading?: boolean;
  isKiosk?: boolean;
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
  isLoading = false,
  isKiosk = false,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div
      id="pos-product-grid-container"
      className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-0 overflow-hidden"
    >
      {/* Barra de Filtros: Categorias e Marcas */}
      <div className="flex-none p-2 sm:p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2">
        {/* Dropdown Categorias */}
        <div>
          <select
            id="select-pos-category"
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            aria-label="Filtrar por Categoria"
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 capitalize font-medium cursor-pointer"
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
            aria-label="Filtrar por Marca"
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 capitalize font-medium cursor-pointer"
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

      {/* Grid de Produtos com Imagens */}
      <div
        id="pos-products-grid-scroll"
        className={`flex-1 p-2 sm:p-3 overflow-y-auto overflow-x-hidden ${
          isKiosk ? 'min-h-0' : 'min-h-[220px] sm:min-h-[280px] max-h-[calc(100vh-340px)]'
        }`}
      >
        {isLoading ? (
          /* Skeleton simples na grade enquanto carrega */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-lg p-2 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-slate-200 rounded mb-2" />
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-1.5" />
                <div className="h-2.5 bg-slate-200 rounded w-1/2 mt-auto" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Nenhum produto encontrado</p>
            <p className="text-xs text-slate-400 mt-1 text-center max-w-xs">
              Tente buscar por outro termo ou alterar os filtros de categoria e marca.
            </p>
          </div>
        ) : (
          <div
            id="grid-pos-catalog"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5"
          >
            {products.map((product) => {
              const hasImage = Boolean(product.imageUrl) && !failedImages[product.id];
              const initialLetter = product.name ? product.name.trim().charAt(0).toUpperCase() : 'P';

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onAddProduct(product)}
                  aria-label={`Adicionar ${product.name} ao carrinho`}
                  className="group relative flex flex-col bg-white border border-slate-200 rounded-lg p-2 text-left hover:border-blue-500 hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 overflow-hidden touch-manipulation"
                >
                  {/* Imagem do Produto ou Fallback com Caixa e Inicial */}
                  <div className="w-full aspect-square bg-slate-100 rounded flex items-center justify-center overflow-hidden mb-2 relative">
                    {hasImage ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={() => handleImageError(product.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400 bg-slate-100">
                        <Package className="w-7 h-7 text-slate-400 mb-1 opacity-70" />
                        <span className="text-xs font-bold text-slate-600 uppercase">
                          {initialLetter}
                        </span>
                      </div>
                    )}

                    {/* Badge de Preço */}
                    <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                      {product.imTaxPrice.toFixed(2)} R$
                    </span>
                  </div>

                  {/* Nome e Código */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 w-full">
                    <h4
                      className="text-[11px] font-semibold text-slate-800 line-clamp-2 text-ellipsis leading-tight group-hover:text-blue-600 transition-colors"
                      title={`${product.name} (${product.code})`}
                    >
                      {product.name}
                    </h4>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-mono text-blue-700 font-semibold truncate max-w-[60%]">
                        ({product.code})
                      </span>
                      <span className="text-[9px] text-slate-400 shrink-0">
                        Est: {product.stock}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
