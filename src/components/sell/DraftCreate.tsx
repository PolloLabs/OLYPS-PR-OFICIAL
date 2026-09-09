import React from 'react';
import { ArrowLeft, Save, Info, Building2 } from 'lucide-react';
import { useDraftForm } from '../../hooks/sell/useDraftForm.js';
import { SellCustomerForm } from './SellCustomerForm.js';
import { SellProductsTable } from './SellProductsTable.js';
import { SellDiscountTax } from './SellDiscountTax.js';
import { SellShipping } from './SellShipping.js';
import { SellPaymentSection } from './SellPayment.js';

interface DraftCreateProps {
  companyId: string;
  onNavigateToList: () => void;
  onShowNotification?: (n: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

export const DraftCreate: React.FC<DraftCreateProps> = ({
  companyId,
  onNavigateToList,
  onShowNotification,
}) => {
  const {
    formData,
    setFormData,
    customers,
    availableProducts,
    isSaving,
    calculations,
    handleCustomerChange,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    handleAddPaymentRow,
    handleUpdatePayment,
    handleRemovePayment,
    handleSubmitDraft,
  } = useDraftForm(companyId, onShowNotification, () => {
    onNavigateToList();
  });

  return (
    <div id="draft-create-page" className="p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-sells-from-draft"
            type="button"
            onClick={onNavigateToList}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Voltar para Lista de Vendas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Adicionar rascunho
            </h1>
            <p className="text-xs text-slate-500">
              Criação de proposta ou pedido em rascunho sem reserva definitiva de estoque
            </p>
          </div>
        </div>

        {/* Dropdown de Localização: "Franquia São Paulo (Loja Online SP)" + ícone de informação azul */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center gap-2 text-xs text-slate-700 bg-white border border-slate-300 rounded px-3 py-1.5 shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              id="draft-header-location-select"
              value={formData.companyLocationId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  companyLocationId: e.target.value,
                }))
              }
              className="bg-transparent border-none text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="loc-sp">
                Franquia São Paulo (Loja Online SP)
              </option>
              <option value="loc-rj">Filial Rio de Janeiro</option>
              <option value="loc-matriz">Matriz Central</option>
            </select>
            <Info
              className="w-4 h-4 text-blue-600 cursor-pointer shrink-0"
              title="Localização padrão de emissão do rascunho"
            />
          </div>
        </div>
      </div>

      {/* FORMULÁRIO COMPLETO DE RASCUNHO */}
      <form onSubmit={handleSubmitDraft}>
        {/* SEÇÃO 1: DADOS DO CLIENTE (sem campo Status) */}
        <SellCustomerForm
          formData={formData}
          customers={customers}
          isDraft={true}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
          onSelectCustomer={handleCustomerChange}
          onQuickAddCustomer={(newCust) => {
            setFormData((prev) => ({
              ...prev,
              customerId: newCust.id,
              billingAddress: newCust.billingAddress || 'Cliente Consumidor Fake',
              shippingAddress:
                newCust.shippingAddress || 'Cliente Consumidor Fake,',
              shipping: {
                ...prev.shipping,
                shippingAddress:
                  newCust.shippingAddress || 'Cliente Consumidor Fake,',
              },
            }));
          }}
        />

        {/* SEÇÃO 2: PRODUTOS */}
        <SellProductsTable
          items={formData.items}
          availableProducts={availableProducts}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
        />

        {/* SEÇÃO 3: DESCONTO E IMPOSTOS */}
        <SellDiscountTax
          formData={formData}
          calculatedDiscount={calculations.discountTotal}
          calculatedCashback={calculations.cashbackTotal}
          calculatedOrderTax={calculations.orderTaxTotal}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />

        {/* SEÇÃO 4: ENVIO */}
        <SellShipping
          formData={formData}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />

        {/* SEÇÃO 5: PAGAMENTO */}
        <SellPaymentSection
          formData={formData}
          totalPayable={calculations.totalAmount}
          balanceDue={calculations.balanceDue}
          changeReturn={calculations.changeReturn}
          onUpdatePayment={handleUpdatePayment}
          onAddPaymentLine={handleAddPaymentRow}
          onRemovePaymentLine={handleRemovePayment}
          onSetExactPayment={(amount) => {
            setFormData((prev) => ({
              ...prev,
              payments: [
                {
                  id: crypto.randomUUID(),
                  advanceBalance: 0,
                  amount,
                  paidAt: '07-09-2026 11:04 AM',
                  paymentMethod: 'cash',
                  paymentNote: '',
                  changeReturn: 0,
                  balance: 0,
                },
              ],
            }));
          }}
        />

        {/* BOTÃO SALVAR CENTRALIZADO NO FINAL */}
        <div className="flex justify-center pt-4 mb-10">
          <button
            id="btn-save-draft"
            type="submit"
            disabled={isSaving}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer focus:ring-4 focus:ring-blue-200"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando Rascunho...' : 'Salvar Rascunho'}</span>
          </button>
        </div>
      </form>

      {/* FOOTER OBRIGATÓRIO CONFORME ESPECIFICAÇÃO */}
      <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500 font-medium">
        PDV INTELIGENTE - V5.31 | Copyright © 2026 All rights reserved.
      </footer>
    </div>
  );
};
