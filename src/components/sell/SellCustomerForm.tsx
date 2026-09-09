import React, { useState } from 'react';
import { Plus, Calendar, Upload, UserPlus, X } from 'lucide-react';
import type {
  SellFormData,
  SellCustomer,
  SellStatus,
} from '../../types/sell.types.js';

interface SellCustomerFormProps {
  formData: SellFormData;
  customers: SellCustomer[];
  onChange: (updates: Partial<SellFormData>) => void;
  onSelectCustomer: (customerId: string) => void;
  onQuickAddCustomer?: (customer: SellCustomer) => void;
  isDraft?: boolean;
}

export const SellCustomerForm: React.FC<SellCustomerFormProps> = ({
  formData,
  customers,
  onChange,
  onSelectCustomer,
  onQuickAddCustomer,
  isDraft = false,
}) => {
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: SellCustomer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      contactNumber: newCustPhone.trim(),
      phone: newCustPhone.trim(),
      billingAddress: newCustAddress.trim(),
      shippingAddress: newCustAddress.trim(),
    };

    if (onQuickAddCustomer) {
      onQuickAddCustomer(newCust);
    }
    onSelectCustomer(newCust.id);
    setShowQuickCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Tamanho do arquivo excede o limite máximo de 5MB.');
        return;
      }
      onChange({
        attachedDocument: file,
        attachedDocumentName: file.name,
      });
    }
  };

  return (
    <div
      id="sell-customer-section"
      className="bg-white rounded-md border border-slate-200 border-t-4 border-t-blue-600 shadow-sm p-5 mb-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cliente:* */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Cliente:*
          </label>
          <div className="flex items-center gap-1.5">
            <select
              id="sell-input-customer"
              value={formData.customerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">Selecionar Cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.contactNumber ? `(${c.contactNumber})` : ''}
                </option>
              ))}
            </select>
            <button
              id="btn-quick-add-customer"
              type="button"
              onClick={() => setShowQuickCustomerModal(true)}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors shadow-2xs shrink-0"
              title="Adicionar Novo Cliente"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prazo de pagamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Prazo de pagamento:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              id="sell-payment-term-type"
              value={formData.paymentTerm}
              onChange={(e) => onChange({ paymentTerm: e.target.value })}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="prazo_de">Prazo de</option>
              <option value="a_vista">À vista</option>
            </select>
            <select
              id="sell-payment-term-days"
              value={formData.paymentTermDays}
              onChange={(e) =>
                onChange({ paymentTermDays: Number(e.target.value) })
              }
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Selecionar</option>
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
              <option value={45}>45 dias</option>
              <option value={60}>60 dias</option>
            </select>
          </div>
        </div>

        {/* Data de venda:* */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Data de venda:*
          </label>
          <div className="relative">
            <input
              id="sell-input-date"
              type="text"
              value={formData.sellDate}
              onChange={(e) => onChange({ sellDate: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-8 pr-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              placeholder="07-09-2026 10:26 AM"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Endereço de cobrança: */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Endereço de cobrança:
          </label>
          <textarea
            id="sell-input-billing-address"
            rows={2}
            value={formData.billingAddress}
            onChange={(e) => onChange({ billingAddress: e.target.value })}
            placeholder="Endereço de cobrança do cliente..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
          />
        </div>

        {/* Endereço de entrega: */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Endereço de entrega:
          </label>
          <textarea
            id="sell-input-shipping-address"
            rows={2}
            value={formData.shippingAddress}
            onChange={(e) => onChange({ shippingAddress: e.target.value })}
            placeholder="Endereço de entrega..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
          />
        </div>

        {/* Status:* (Oculto em rascunhos) */}
        {!isDraft && (
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Status:*
            </label>
            <select
              id="sell-input-status"
              value={formData.status}
              onChange={(e) =>
                onChange({ status: e.target.value as SellStatus })
              }
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">Selecionar</option>
              <option value="final">Final</option>
              <option value="draft">Rascunho</option>
              <option value="proforma">Proforma</option>
              <option value="quotation">Suspenso / Quotação</option>
            </select>
          </div>
        )}

        {/* Esquema da fatura: */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Esquema da fatura:
          </label>
          <select
            id="sell-input-invoice-scheme"
            value={formData.invoiceScheme}
            onChange={(e) => onChange({ invoiceScheme: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            <option value="fatura_facil">Fatura Fácil</option>
            <option value="padrao">Padrão</option>
            <option value="simplificada">Simplificada</option>
          </select>
        </div>

        {/* n. fatura: */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            n. fatura:
          </label>
          <input
            id="sell-input-invoice-number"
            type="text"
            value={formData.invoiceNumber}
            onChange={(e) => onChange({ invoiceNumber: e.target.value })}
            placeholder="n. fatura"
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          <span className="block text-[11px] text-slate-500 mt-1">
            Mantenha em branco para gerar automaticamente
          </span>
        </div>

        {/* documento anexo: */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            documento anexo:
          </label>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Procurar...</span>
              <input
                id="sell-file-input"
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.csv,.zip,.doc,.docx,.jpeg,.jpg,.png"
              />
            </label>
            <span className="text-xs text-slate-600 truncate max-w-xs">
              {formData.attachedDocumentName || 'Nenhum arquivo selecionado'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tamanho máximo do arquivo: 5MB — Formatos: .pdf, .csv, .zip, .doc, .docx, .jpeg, .jpg, .png
          </p>
        </div>
      </div>

      {/* Modal Rápido de Novo Cliente */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Adicionar Novo Cliente Rápido</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome / Razão Social:*
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ex: Novo Cliente Ltda"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Telefone / Contato:
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Endereço:
                </label>
                <textarea
                  rows={2}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade/UF..."
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-sm"
                >
                  Salvar e Selecionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
