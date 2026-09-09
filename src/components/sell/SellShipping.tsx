import React from 'react';
import { Info, Upload } from 'lucide-react';
import type { SellFormData, SellShippingStatus } from '../../types/sell.types.js';

interface SellShippingProps {
  formData: SellFormData;
  onChange: (updates: Partial<SellFormData>) => void;
}

export const SellShipping: React.FC<SellShippingProps> = ({
  formData,
  onChange,
}) => {
  const handleShippingChange = (updates: Partial<typeof formData.shipping>) => {
    onChange({
      shipping: {
        ...formData.shipping,
        ...updates,
      },
    });
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Tamanho do arquivo excede o limite máximo de 5MB.');
        return;
      }
      onChange({
        shippingDocument: file,
        shipping: {
          ...formData.shipping,
          shippingDocumentName: file.name,
        },
      });
    }
  };

  return (
    <div
      id="sell-shipping-section"
      className="bg-white rounded-md border border-slate-200 border-t-4 border-t-blue-600 shadow-sm p-5 mb-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Detalhes de envio */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Detalhes de envio:
          </label>
          <textarea
            id="sell-shipping-details"
            rows={2}
            value={formData.shipping.shippingDetails || ''}
            onChange={(e) =>
              handleShippingChange({ shippingDetails: e.target.value })
            }
            placeholder="Instruções de envio, transportadora, etc..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Endereço de entrega */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Endereço de entrega:
          </label>
          <textarea
            id="sell-shipping-address"
            rows={2}
            value={formData.shipping.shippingAddress || ''}
            onChange={(e) =>
              handleShippingChange({ shippingAddress: e.target.value })
            }
            placeholder="Endereço de destino da mercadoria..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Custos de envio com ícone de informação */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Custos de envio:
          </label>
          <div className="relative">
            <input
              id="sell-shipping-cost"
              type="number"
              step="0.01"
              min={0}
              value={formData.shipping.shippingCost}
              onChange={(e) =>
                handleShippingChange({
                  shippingCost: Number(e.target.value) || 0,
                })
              }
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded pr-8 pl-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
            <div
              className="absolute right-2.5 top-2 text-slate-400 hover:text-blue-600 cursor-pointer"
              title="Valor de frete cobrado do cliente adicionado ao total"
            >
              <Info className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Status da remessa */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Status da remessa:
          </label>
          <select
            id="sell-shipping-status"
            value={formData.shipping.shippingStatus}
            onChange={(e) =>
              handleShippingChange({
                shippingStatus: e.target.value as SellShippingStatus,
              })
            }
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="">Selecionar</option>
            <option value="pending">Pendente</option>
            <option value="ordered">Pedido</option>
            <option value="packed">Embalado</option>
            <option value="shipped">Em Trânsito / Enviado</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Entregue a */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Entregue a:
          </label>
          <input
            id="sell-delivered-to"
            type="text"
            value={formData.shipping.deliveredTo || ''}
            onChange={(e) =>
              handleShippingChange({ deliveredTo: e.target.value })
            }
            placeholder="Nome de quem recebeu..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Entregador */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Entregador:
          </label>
          <select
            id="sell-delivery-person"
            value={formData.shipping.deliveryPerson || ''}
            onChange={(e) =>
              handleShippingChange({ deliveryPerson: e.target.value })
            }
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="">Selecionar</option>
            <option value="Carlos Eduardo">Carlos Eduardo (Motoboy)</option>
            <option value="Jadlog Express">Transportadora Jadlog Express</option>
            <option value="Correios SEDEX">Correios SEDEX</option>
            <option value="Balcão">Retirada em Balcão</option>
          </select>
        </div>

        {/* Enviando documentos */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Enviando documentos:
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Procurar...</span>
              <input
                id="sell-shipping-document-input"
                type="file"
                onChange={handleDocumentUpload}
                className="hidden"
                accept=".pdf,.csv,.zip,.doc,.docx,.jpeg,.jpg,.png"
              />
            </label>
            <span className="text-xs text-slate-600 truncate max-w-sm">
              {formData.shipping.shippingDocumentName ||
                'Nenhum documento de envio selecionado'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tamanho máximo do arquivo: 5MB — Formatos: .pdf, .csv, .zip, .doc, .docx, .jpeg, .jpg, .png
          </p>
        </div>
      </div>
    </div>
  );
};
