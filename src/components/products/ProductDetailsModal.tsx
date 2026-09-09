import React from 'react';
import {
  X,
  Package,
  Barcode,
  Tag,
  DollarSign,
  Layers,
  MapPin,
  ShieldCheck,
  Smartphone,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  Weight,
} from 'lucide-react';
import type { Product } from '../../types/index.js';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!isOpen || !product) return null;

  const formatMoney = (val?: number | null) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getProductTypeBadge = (type: string) => {
    switch (type) {
      case 'variable':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Variável</span>;
      case 'combo':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Combo / Kit</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Simples</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                {getProductTypeBadge(product.productType)}
                {!product.active && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                    Inativo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                SKU: <span className="font-mono font-bold text-slate-700">{product.sku}</span> &bull; Código: {product.barcode || 'Sem código de barras'} ({product.barcodeType})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Preço de Custo</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {formatMoney(product.defaultPurchasePrice)}
              </p>
              <span className="text-[10px] text-slate-400">Margem: {product.marginPercent}%</span>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200">
              <span className="text-xs text-emerald-700 font-medium">Preço de Venda</span>
              <p className="text-base font-bold text-emerald-800 mt-1">
                {formatMoney(product.defaultSalePrice)}
              </p>
              <span className="text-[10px] text-emerald-600">
                {product.salePriceTaxType === 'inclusive' ? 'Impostos inclusos' : 'Impostos exclusivos'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Estoque Total</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {product.currentStock ?? 0} {product.unitShortName || 'Un'}
              </p>
              <span className="text-[10px] text-amber-600">
                Alerta: &le; {product.alertQuantity} {product.unitShortName || 'Un'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Garantia</span>
              <p className="text-base font-bold text-slate-800 mt-1">
                {product.warrantyDuration ? `${product.warrantyDuration} ${product.warrantyUnit === 'days' ? 'dias' : product.warrantyUnit === 'months' ? 'meses' : 'anos'}` : 'Sem garantia'}
              </p>
              <span className="text-[10px] text-slate-400">
                {product.enableImeiSerial ? 'Exige IMEI/Série' : 'Sem serial obrigatório'}
              </span>
            </div>
          </div>

          {/* Classification & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Classificação & Identificação
              </h4>
              <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Unidade:</span>
                  <span className="font-semibold text-slate-800">{product.unitName || 'Unidade'} ({product.unitShortName || 'Un'})</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Marca:</span>
                  <span className="font-semibold text-slate-800">{product.brandName || 'Não definida'}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Modelo:</span>
                  <span className="font-semibold text-slate-800">{product.modelName || 'Não informado'}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Categoria:</span>
                  <span className="font-semibold text-slate-800">{product.categoryName || 'Não categorizado'} {product.categoryCode ? `(${product.categoryCode})` : ''}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Cor:</span>
                  <span className="font-semibold text-slate-800">{product.colorName || 'Não informada'}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Tamanho:</span>
                  <span className="font-semibold text-slate-800">{product.sizeName || 'Único'}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Peso:</span>
                  <span className="font-semibold text-slate-800">{product.weight ? `${product.weight} g` : 'Não informado'}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Tempo de Preparo:</span>
                  <span className="font-semibold text-slate-800">{product.preparationTime ? `${product.preparationTime} minutos` : 'Pronta entrega'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Políticas de Operação & Venda
              </h4>
              <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Gerenciamento de Estoque:</span>
                  <span className={`font-semibold ${product.manageStock ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {product.manageStock ? 'Ativo' : 'Desativado'}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Disponível para Venda:</span>
                  <span className={`font-semibold ${!product.notForSale ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {!product.notForSale ? 'Sim (Disponível no PDV)' : 'Não (Insumo / Uso Interno)'}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Rastreio por IMEI/Serial:</span>
                  <span className="font-semibold text-slate-800">
                    {product.enableImeiSerial ? 'Obrigatório no PDV' : 'Desativado'}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Regime de Impostos:</span>
                  <span className="font-semibold text-slate-800">{product.applicableTax || 'Padrão da Empresa'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Operational Notes */}
          {(product.description || product.operationalNotes) && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Descrições & Orientações
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.description && (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 block mb-1">Descrição Comercial</span>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}
                {product.operationalNotes && (
                  <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200">
                    <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Observações Operacionais / Oficina
                    </span>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{product.operationalNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Device Model Compatibilities (Crucial for Tech Assist & Parts) */}
          {product.deviceModels && product.deviceModels.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-600" />
                Modelos de Dispositivos Compatíveis ({product.deviceModels.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.deviceModels.map((dm) => (
                  <span
                    key={dm.id}
                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    <span className="font-bold mr-1">{dm.deviceBrandName || 'Marca'}:</span>
                    {dm.name} {dm.technicalCode ? `(${dm.technicalCode})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Locations & Physical Racks */}
          {product.locations && product.locations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-600" />
                Distribuição por Filial / Local Comercial & Prateleira
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-slate-700">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Local / Filial</th>
                      <th className="px-4 py-2.5 text-left">Prateleira / Gaveta</th>
                      <th className="px-4 py-2.5 text-right">Estoque Inicial</th>
                      <th className="px-4 py-2.5 text-right">Estoque Atual</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {product.locations.map((loc) => (
                      <tr key={loc.id}>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{loc.locationName || 'Filial'}</td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono">{loc.rackLocation || 'Não especificada'}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{loc.initialStock}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900 font-mono">{loc.currentStock}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${loc.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {loc.isAvailable ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Variations Table (if Variable product) */}
          {product.productType === 'variable' && product.variations && product.variations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                Variações do Produto ({product.variations.length})
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-slate-700">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Variação</th>
                      <th className="px-4 py-2.5 text-left">SKU</th>
                      <th className="px-4 py-2.5 text-left">Código de Barras</th>
                      <th className="px-4 py-2.5 text-right">Preço de Custo</th>
                      <th className="px-4 py-2.5 text-right">Margem</th>
                      <th className="px-4 py-2.5 text-right">Preço de Venda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {product.variations.map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{v.name}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">{v.sku}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">{v.barcode || '-'}</td>
                        <td className="px-4 py-2.5 text-right font-mono">{formatMoney(v.purchasePrice)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">{v.marginPercent}%</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700 font-mono">{formatMoney(v.salePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
