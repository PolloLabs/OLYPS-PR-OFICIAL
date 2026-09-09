import React, { useState } from 'react';
import {
  ShoppingBag,
  ArrowLeft,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { usePurchaseForm } from '../../hooks/purchase/usePurchaseForm.js';
import { PurchaseHeaderForm } from './PurchaseHeaderForm.js';
import { PurchaseItemsTable } from './PurchaseItemsTable.js';
import { PurchaseDiscountTax } from './PurchaseDiscountTax.js';
import { PurchasePayment } from './PurchasePayment.js';

interface CreatePurchaseProps {
  companyId: string;
  onBack?: () => void;
  onShowNotification?: (notification: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

export const CreatePurchase: React.FC<CreatePurchaseProps> = ({
  companyId,
  onBack,
  onShowNotification,
}) => {
  const handleSaveSuccess = (purchaseNumber?: string) => {
    if (onShowNotification) {
      onShowNotification({
        type: 'success',
        message: 'Compra Registrada com Sucesso!',
        description: purchaseNumber
          ? `O lançamento ${purchaseNumber} foi gravado e os estoques atualizados.`
          : 'A compra foi gravada com sucesso.',
      });
    }
  };

  const {
    loading,
    error,
    success,
    formData,
    updateHeaderField,
    addItem,
    updateItem,
    removeItem,
    updateDiscount,
    updateTax,
    updatePaymentByIndex,
    addPayment,
    removePayment,
    submitPurchase,
    resetForm,
  } = usePurchaseForm(companyId, handleSaveSuccess);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submitPurchase();
    if (ok && onBack) {
      // Pequeno delay para visualizar mensagem antes de redirecionar se desejado
    }
  };

  return (
    <div id="create-purchase-container" className="space-y-6 pb-12">
      {/* Barra de Cabeçalho / Título */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Adicionar Compra</h1>
              <p className="text-xs text-slate-500">
                Lançamento de aquisição de produtos, faturamento e atualização de estoque
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gravando Compra...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Compra
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alertas de Notificação */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="font-semibold">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Ir para Lista de Compras
            </button>
          )}
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Cabeçalho da Compra e Fornecedor */}
        <PurchaseHeaderForm
          companyId={companyId}
          formData={formData}
          updateHeaderField={updateHeaderField}
        />

        {/* 2. Tabela de Itens e Produtos */}
        <PurchaseItemsTable
          companyId={companyId}
          items={formData.items}
          addItem={addItem}
          updateItem={updateItem}
          removeItem={removeItem}
        />

        {/* 3. Descontos, Impostos e Resumo Financeiro */}
        <PurchaseDiscountTax
          formData={formData}
          updateDiscount={updateDiscount}
          updateTax={updateTax}
          updateHeaderField={updateHeaderField}
        />

        {/* 4. Pagamentos e Parcelas */}
        <PurchasePayment
          payments={formData.payments}
          totalNetValue={formData.totalNetValue}
          updatePaymentByIndex={updatePaymentByIndex}
          addPayment={addPayment}
          removePayment={removePayment}
        />

        {/* Barra de Ação Inferior */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileCheck className="w-4 h-4 text-slate-400" />
            <span>Ao salvar, as entradas serão computadas e integradas ao estoque da filial selecionada.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Descartar Alterações
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Compra
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePurchase;
