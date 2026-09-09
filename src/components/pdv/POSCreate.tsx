import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MinusCircle,
  Wrench,
  AlertTriangle,
  Save,
  RotateCcw,
  Calculator,
  Archive,
  X,
  ArrowLeft,
  Building2,
  DollarSign,
  Plus,
  Printer,
  AlertCircle,
  Menu,
  Bell,
} from 'lucide-react';
import { usePOS } from '../../hooks/pdv/usePOS.js';
import { usePrintReceipt } from '../../hooks/pdv/usePrintReceipt.js';
import { POSItemsTable } from './POSItemsTable.js';
import { POSProductGrid } from './POSProductGrid.js';
import { POSPaymentBar } from './POSPaymentBar.js';
import { POSPrintReceipt } from './POSPrintReceipt.js';
import { PIXPaymentModal } from './PIXPaymentModal.js';

// Modais especializados de alta precisão
import { POSExpenseModal } from './modals/POSExpenseModal.js';
import { POSAlertsModal } from './modals/POSAlertsModal.js';
import { POSQuoteModal } from './modals/POSQuoteModal.js';
import { POSCashRegisterModal } from './modals/POSCashRegisterModal.js';
import { POSCalculatorModal } from './modals/POSCalculatorModal.js';
import { POSCreditSaleModal } from './modals/POSCreditSaleModal.js';
import { POSCardPaymentModal } from './modals/POSCardPaymentModal.js';
import { POSCashPaymentModal } from './modals/POSCashPaymentModal.js';
import { POSMultiplePaymentModal } from './modals/POSMultiplePaymentModal.js';
import { POSCashbackModal } from './modals/POSCashbackModal.js';
import {
  POSResetConfirmModal,
  POSCancelConfirmModal,
} from './modals/POSConfirmationModals.js';
import type { POSPaymentMethod, PDVFormaPagamento } from '../../types/pdv.types.js';

interface POSCreateProps {
  companyId: string;
  onNavigateBack: () => void;
  onNavigate?: (path: string) => void;
  onShowNotification?: (n: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

interface BreadcrumbProps {
  items: string[];
}

function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
      {items.map((item, idx) => (
        <React.Fragment key={item}>
          {idx > 0 && <span className="text-slate-300">/</span>}
          <span
            className={
              idx === items.length - 1
                ? 'font-bold text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }
          >
            {item}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

export const POSCreate: React.FC<POSCreateProps> = ({
  companyId,
  onNavigateBack,
  onNavigate,
  onShowNotification,
}) => {
  const {
    items,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    filteredProducts,
    categories,
    brands,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    productSearch,
    setProductSearch,
    discountValue,
    setDiscountValue,
    cashbackValue,
    setCashbackValue,
    updateCashBack,
    orderTaxValue,
    setOrderTaxValue,
    shippingValue,
    setShippingValue,
    totals,
    isProcessingPayment,
    addProductToCart,
    updateItemQuantity,
    removeItem,
    processSale,
    handlePrint: posHandlePrint,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    isRecentTransactionsOpen,
    setIsRecentTransactionsOpen,
    isMultiplePaymentOpen,
    setIsMultiplePaymentOpen,
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    isCalculatorOpen,
    setIsCalculatorOpen,
    isAlertsModalOpen,
    setIsAlertsModalOpen,
    isCashRegisterModalOpen,
    setIsCashRegisterModalOpen,
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    isCreditSaleModalOpen,
    setIsCreditSaleModalOpen,
    isCardPaymentModalOpen,
    setIsCardPaymentModalOpen,
    isCashPaymentModalOpen,
    setIsCashPaymentModalOpen,
    isCashbackModalOpen,
    setIsCashbackModalOpen,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
    recentTransactions,
    alerts,
    unreadAlertsCount,
    markAlertsAsRead,
    cashRegister,
    handleAddExpense,
    handleSaveQuote,
    handleUpdateCashRegister,
    processCreditSale,
    processCardSale,
    processCashSale,
    handleCompleteSale,
    completedSaleReceipt,
    resetCartAndCustomer,
    cancelCurrentSale,
    handlePrint,
    errorMessage,
    clearError,
  } = usePOS(companyId, onShowNotification);

  // Data e hora em tempo real (atualizado a cada segundo)
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Atualiza a cada segundo
    
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Modal PIX
  const [isPIXModalOpen, setIsPIXModalOpen] = useState(false);

  // Hook de impressão térmica de cupom (80mm)
  const {
    isReceiptModalOpen,
    handlePrint: triggerPrintReceipt,
    openReceiptModal,
    closeReceiptModal,
  } = usePrintReceipt({
    items,
    onNotification: onShowNotification,
    completedSaleReceipt,
  });

  // Estado de novo cliente rápido
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Envio de novo cliente rápido
  const submitNewCustomer = () => {
    if (!newCustName.trim()) {
      onShowNotification?.({
        type: 'error',
        message: 'Informe o nome do cliente.',
      });
      return;
    }
    const newId = `cust-${Date.now()}`;
    customers.push({
      id: newId,
      name: newCustName.trim(),
      contactNumber: newCustPhone.trim() || '+55 11 99999-0000',
    });
    setSelectedCustomerId(newId);
    setIsCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    onShowNotification?.({
      type: 'success',
      message: 'Cliente selecionado',
      description: newCustName,
    });
  };

  // Interceptador dos botões de pagamento da barra inferior
  const handlePaymentMethod = (method: POSPaymentMethod) => {
    if (items.length === 0) {
      onShowNotification?.({
        type: 'error',
        message: 'Carrinho vazio',
        description: 'Adicione pelo menos um produto antes de processar.',
      });
      return;
    }

    if (method === 'quote') {
      setIsQuoteModalOpen(true);
    } else if (method === 'credit_sale') {
      setIsCreditSaleModalOpen(true);
    } else if (method === 'card') {
      setIsCardPaymentModalOpen(true);
    } else if (method === 'cash') {
      setIsCashPaymentModalOpen(true);
    } else {
      handleCompleteSale(method);
    }
  };

  return (
    <div
      id="pos-point-of-sale"
      className="min-h-screen bg-slate-100 flex flex-col pb-20 select-none"
    >
      {/* HEADER SUPERIOR */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 sticky top-0 z-30 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Lado Esquerdo: Menu, Breadcrumbs e Configurações */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <button
            id="btn-pos-menu"
            type="button"
            onClick={onNavigateBack}
            className="p-2 hover:bg-gray-100 rounded text-slate-700 transition-colors cursor-pointer"
            title="Menu / Voltar ao Painel"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div style={{ display: 'none' }}>
            <Breadcrumb items={['OLYPS PRO', 'Vender', 'PDV']} />
          </div>
          {/* Localização dropdown */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <select
              id="select-pos-location"
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              defaultValue="sp"
            >
              <option value="sp">
                Franquia São Paulo (Loja Online SP)
              </option>
              <option value="rj">Filial Rio de Janeiro</option>
              <option value="mg">Filial Belo Horizonte</option>
            </select>
          </div>

          {/* Data e Hora atual */}
          <div className="hidden lg:flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-600 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span id="pos-current-date">{formatDateTime(currentDateTime)}</span>
          </div>
        </div>

        {/* Lado Direito: Ações, Alertas e Operações */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bell Alertas */}
          <div className="relative">
            <button
              id="btn-pos-icon-alert"
              type="button"
              onClick={() => setIsAlertsModalOpen(true)}
              title="Alertas do Caixa e Estoque"
              className="p-2 hover:bg-gray-100 rounded text-slate-600 hover:text-slate-800 transition-colors relative flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertsCount > 0 && (
                <span
                  id="badge-pos-alerts-count"
                  className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow"
                >
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>

          {/* Refresh / Reset com Confirmação */}
          <button
            id="btn-pos-icon-refresh"
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            title="Resetar / Limpar Carrinho"
            className="p-2 hover:bg-gray-100 rounded text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* 1. "Adicionar despesa" (roxo com ícone menos) */}
          <button
            id="btn-pos-quick-expense"
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="h-8 px-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Adicionar despesa</span>
          </button>

          {/* 2. "Reparar" (azul com ícone chave) */}
          <button
            id="btn-pos-quick-repair"
            type="button"
            onClick={() => {
              if (onNavigate) {
                onNavigate('/reparos/folha-de-trabalho');
              } else {
                window.location.hash = '#/reparos/folha-de-trabalho';
              }
            }}
            className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reparar</span>
          </button>

          {/* 4. Ícone Salvar / Disquete (azul - Salvar Cotação) */}
          <button
            id="btn-pos-icon-save"
            type="button"
            onClick={() => {
              if (items.length === 0) {
                onShowNotification?.({
                  type: 'error',
                  message: 'Carrinho vazio',
                  description:
                    'Adicione produtos para salvar como cotação.',
                });
                return;
              }
              setIsQuoteModalOpen(true);
            }}
            title="Salvar Carrinho como Cotação / Orçamento"
            className="w-8 h-8 rounded bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* 6. Ícone Calculadora (verde) */}
          <button
            id="btn-pos-icon-calculator"
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            title="Calculadora Rápida"
            className="w-8 h-8 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
          </button>

          {/* 7. Ícone Caixa / Gaveta (verde claro / teal) */}
          <button
            id="btn-pos-icon-drawer"
            type="button"
            onClick={() => setIsCashRegisterModalOpen(true)}
            title="Gaveta do Caixa (Conferência e Sangria)"
            className="w-8 h-8 rounded bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4" />
          </button>

          {/* 8. Ícone Impressora */}
          <button
            id="btn-pos-icon-print"
            type="button"
            onClick={handlePrint}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center justify-center cursor-pointer shadow-xs"
            title="Imprimir cupom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>

          {/* 9. Ícone X (vermelho - Cancelar Venda Atual) */}
          <button
            id="btn-pos-icon-close"
            type="button"
            onClick={() => setIsCancelConfirmOpen(true)}
            title="Cancelar Venda Atual"
            className="w-8 h-8 rounded bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ícone Voltar (azul/slate - Voltar para Lista de POS) */}
          <button
            id="btn-pos-icon-back"
            type="button"
            onClick={() => {
              if (onNavigate) {
                onNavigate('/vendas/pos-lista');
              } else {
                onNavigateBack();
              }
            }}
            title="Voltar para Lista de POS"
            className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* BANNER DE ERRO COM CARD VISUAL E BOTÃO FECHAR */}
      {errorMessage && (
        <div id="pos-error-banner" className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-2 shadow-sm rounded-r-md">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Erro na operação</h3>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
            <button
              id="btn-close-pos-error"
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700 ml-4 flex-shrink-0 cursor-pointer p-1 rounded hover:bg-red-100 transition-colors"
              title="Fechar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* CORPO DO POS: 2 COLUNAS (60% Venda Atual / 40% Catálogo) */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* Coluna Esquerda: Venda Atual (60% -> 7 colunas em telas grandes) */}
        <div className="lg:col-span-7 flex flex-col">
          <POSItemsTable
            items={items}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
            onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
            productSearch={productSearch}
            onProductSearchChange={setProductSearch}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeItem}
            totals={totals}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            cashbackValue={cashbackValue}
            setCashbackValue={setCashbackValue}
            onUpdateCashBack={updateCashBack}
            onOpenCashbackModal={() => setIsCashbackModalOpen(true)}
            orderTaxValue={orderTaxValue}
            setOrderTaxValue={setOrderTaxValue}
            shippingValue={shippingValue}
            setShippingValue={setShippingValue}
          />
        </div>

        {/* Coluna Direita: Catálogo de Produtos (40% -> 5 colunas em telas grandes) */}
        <div className="lg:col-span-5 flex flex-col">
          <POSProductGrid
            products={filteredProducts}
            categories={categories}
            brands={brands}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            onAddProduct={addProductToCart}
          />
        </div>
      </main>

      {/* BARRA INFERIOR DE PAGAMENTO FIXA */}
      <POSPaymentBar
        total={totals.totalToPay}
        loading={isProcessingPayment}
        onCompleteSale={async (forma: PDVFormaPagamento, data: any) => {
          if (items.length === 0) {
            onShowNotification?.({
              type: 'error',
              message: 'Carrinho vazio',
              description: 'Adicione produtos antes de processar pagamento.',
            });
            return false;
          }
          if (forma === 'pix') {
            setIsPIXModalOpen(true);
            return true;
          }
          const methodMap: Record<PDVFormaPagamento, POSPaymentMethod> = {
            cotacao: 'quote',
            credito: 'credit_sale',
            cartao: 'card',
            multiplo: 'multiple',
            dinheiro: 'cash',
            pix: 'pix',
            boleto: 'other',
          };
          const method = methodMap[forma] || 'cash';
          return await handleCompleteSale(method, data?.valorPago, data?.customNote, true);
        }}
        onCancelSale={() => setIsCancelConfirmOpen(true)}
        onOpenRecentTransactions={() => setIsRecentTransactionsOpen(true)}
      />

      {/* MODAL 1: Adicionar Despesa Rápida */}
      <POSExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
      />

      {/* MODAL 2: Alertas do Caixa e Sistema */}
      <POSAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        onMarkAsRead={markAlertsAsRead}
      />

      {/* MODAL 3: Salvar como Cotação */}
      <POSQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        items={items}
        customer={selectedCustomer}
        totalAmount={totals.totalToPay}
        onSaveQuote={handleSaveQuote}
        onNavigateToQuotes={() => {
          if (onNavigate) {
            onNavigate('/vendas/cotacoes');
          }
        }}
      />

      {/* MODAL 4: Gaveta do Caixa e Conferência */}
      <POSCashRegisterModal
        isOpen={isCashRegisterModalOpen}
        onClose={() => setIsCashRegisterModalOpen(false)}
        cashRegister={cashRegister}
        onUpdateRegister={handleUpdateCashRegister}
      />

      {/* MODAL 5: Calculadora Rápida */}
      <POSCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onApplyDiscount={(discount) => {
          setDiscountValue(discount);
          onShowNotification?.({
            type: 'success',
            message: 'Desconto aplicado',
            description: `R$ ${discount.toFixed(2)} aplicado ao total.`,
          });
        }}
      />

      {/* MODAL 6: Venda a Crédito / A Prazo */}
      <POSCreditSaleModal
        isOpen={isCreditSaleModalOpen}
        onClose={() => setIsCreditSaleModalOpen(false)}
        totalAmount={totals.totalToPay}
        customer={selectedCustomer}
        onConfirm={processCreditSale}
      />

      {/* MODAL 7: Pagamento com Cartão */}
      <POSCardPaymentModal
        isOpen={isCardPaymentModalOpen}
        onClose={() => setIsCardPaymentModalOpen(false)}
        totalAmount={totals.totalToPay}
        onConfirm={processCardSale}
      />

      {/* MODAL 8: Pagamento em Dinheiro */}
      <POSCashPaymentModal
        isOpen={isCashPaymentModalOpen}
        onClose={() => setIsCashPaymentModalOpen(false)}
        totalAmount={totals.totalToPay}
        onConfirm={processCashSale}
      />

      {/* MODAL 9: Pagamento Múltiplo */}
      <POSMultiplePaymentModal
        isOpen={isMultiplePaymentOpen}
        onClose={() => setIsMultiplePaymentOpen(false)}
        totalAmount={totals.totalToPay}
        onConfirm={async (totalPaid, note) => {
          return await processSale('multiple', totalPaid, note);
        }}
      />

      {/* MODAL 10: Confirmação de Reset / Limpeza do Carrinho */}
      <POSResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetCartAndCustomer}
      />

      {/* MODAL 11: Confirmação de Cancelamento da Venda Atual */}
      <POSCancelConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={cancelCurrentSale}
      />

      {/* MODAL 12: Transações Recentes do Caixa */}
      {isRecentTransactionsOpen && (
        <div
          id="modal-pos-recent-transactions-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div
            id="modal-pos-recent-transactions"
            className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={() => setIsRecentTransactionsOpen(false)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Transações Recentes do Caixa
            </h3>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhuma transação recente encontrada neste turno.
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-blue-600 font-mono">
                        {tx.invoiceNumber}
                      </div>
                      <div className="text-slate-700 font-medium">
                        {tx.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tx.sellDate} • {tx.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono">
                        {tx.totalAmount.toFixed(2)} R$
                      </div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {tx.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 13: Adicionar Cliente Rápido */}
      {isCustomerModalOpen && (
        <div
          id="modal-pos-customer-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div
            id="modal-pos-customer"
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Adicionar Cliente Rápido
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nome do Cliente*
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo..."
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+55 11 9..."
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                id="btn-pos-save-quick-customer"
                type="button"
                onClick={submitNewCustomer}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Salvar e Selecionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 14: Resgate de Cash Back */}
      <POSCashbackModal
        isOpen={isCashbackModalOpen}
        onClose={() => setIsCashbackModalOpen(false)}
        subtotal={totals.subtotal}
        currentCashback={cashbackValue}
        customer={selectedCustomer}
        onApplyCashback={updateCashBack}
      />

      {/* MODAL PIX */}
      <PIXPaymentModal
        isOpen={isPIXModalOpen}
        onClose={() => setIsPIXModalOpen(false)}
        total={totals.totalToPay}
        companyId={companyId}
        onConfirmPayment={() => {
          handleCompleteSale('pix', totals.totalToPay, undefined, true);
        }}
      />

      {/* COMPONENTE E MODAL DE IMPRESSÃO DE CUPOM TÉRMICO (80mm) */}
      <POSPrintReceipt
        items={items}
        customer={selectedCustomer}
        subtotal={totals.subtotal}
        discountValue={totals.discountValue}
        cashbackValue={totals.cashbackValue}
        orderTaxValue={totals.orderTaxValue}
        shippingValue={totals.shippingValue}
        totalToPay={totals.totalToPay}
        completedSaleReceipt={completedSaleReceipt}
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
        onPrint={() => {
          try {
            window.print();
          } catch (err) {
            console.warn('Erro ao chamar window.print():', err);
          }
        }}
      />
    </div>
  );
};
