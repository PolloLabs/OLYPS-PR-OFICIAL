import React from 'react';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { useSellForm } from '../../hooks/sell/useSellForm.js';
import { SellCustomerForm } from './SellCustomerForm.js';
import { SellProductsTable } from './SellProductsTable.js';
import { SellDiscountTax } from './SellDiscountTax.js';
import { SellShipping } from './SellShipping.js';
import { SellPaymentSection } from './SellPayment.js';

interface SellCreateProps {
  companyId: string;
  onNavigateToList: () => void;
  onShowNotification?: (n: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

export const SellCreate: React.FC<SellCreateProps> = ({
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
    calculated,
    handleSelectCustomer,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    handleUpdatePayment,
    handleAddPaymentLine,
    handleRemovePaymentLine,
    handleSetExactPayment,
    handleSubmit,
  } = useSellForm(companyId, onShowNotification, () => {
    onNavigateToList();
  });

  return (
    <div id="sell-create-page" className="p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-sells"
            type="button"
            onClick={onNavigateToList}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Voltar para Todas as Vendas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Adicionar venda
            </h1>
            <p className="text-xs text-slate-500">
              Preencha os dados do pedido comercial para emissão de fatura e baixa de estoque
            </p>
          </div>
        </div>

        {/* Dropdown de Localização / Franquia */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded px-3 py-1.5 shadow-2xs">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium text-slate-700">Franquia:</span>
            <select
              id="sell-header-location-select"
              value={formData.companyLocationId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  companyLocationId: e.target.value,
                }))
              }
              className="bg-transparent border-none text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="loc-sp">Franquia São Paulo</option>
              <option value="loc-rj">Filial Rio de Janeiro</option>
              <option value="loc-matriz">Matriz</option>
            </select>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO COMPLETO DE ADICIONAR VENDA */}
      <form onSubmit={handleSubmit}>
        {/* SEÇÃO 1: DADOS DO CLIENTE */}
        <SellCustomerForm
          formData={formData}
          customers={customers}
          onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
          onSelectCustomer={handleSelectCustomer}
          onQuickAddCustomer={(newCust) => {
            setFormData((prev) => ({
              ...prev,
              customerId: newCust.id,
              billingAddress: newCust.billingAddress || '',
              shippingAddress: newCust.shippingAddress || '',
              shipping: {
                ...prev.shipping,
                shippingAddress: newCust.shippingAddress || '',
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
          calculatedDiscount={calculated.discountCalculated}
          calculatedCashback={calculated.cashbackRedeemedVal}
          calculatedOrderTax={calculated.orderTaxCalculated}
          onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
        />

        {/* SEÇÃO 4: ENVIO */}
        <SellShipping
          formData={formData}
          onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
        />

        {/* SEÇÃO 5: PAGAMENTO */}
        <SellPaymentSection
          formData={formData}
          totalPayable={calculated.totalPayable}
          balanceDue={calculated.balanceDue}
          changeReturn={calculated.changeReturn}
          onUpdatePayment={handleUpdatePayment}
          onAddPaymentLine={handleAddPaymentLine}
          onRemovePaymentLine={handleRemovePaymentLine}
          onSetExactPayment={handleSetExactPayment}
        />

        {/* BOTÃO SALVAR CENTRALIZADO NO FINAL */}
        <div className="flex justify-center pt-4">
          <button
            id="btn-save-sell"
            type="submit"
            disabled={isSaving}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer focus:ring-4 focus:ring-blue-200"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando Venda...' : 'Salvar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
