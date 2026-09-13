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
  Maximize2,
  Minimize2,
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
import type { POSPaymentMethod, PDVFormaPagamento, POSProduct } from '../../types/pdv.types.js';

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
    isLoading,
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

  // Modo Kiosk (Tela Cheia)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    const posElem = document.getElementById('pos-point-of-sale') || document.documentElement;
    if (!document.fullscreenElement && !isFullscreen) {
      posElem.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen API request failed or restricted in iframe:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Proteção Anti-Perda: aviso beforeunload quando o carrinho tiver itens
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (items.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [items.length]);

  // Feedback Visual: Shake vermelho para ações inválidas (ex: carrinho vazio)
  const [cartShake, setCartShake] = useState(false);
  const triggerCartShake = () => {
    setCartShake(true);
    setTimeout(() => setCartShake(false), 450);
  };

  // Feedback Visual: Highlight verde rápido (fade 600ms) no produto adicionado
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const handleAddProductWithHighlight = (prod: POSProduct) => {
    addProductToCart(prod);
    setLastAddedItemId(prod.id);
    setTimeout(() => {
      setLastAddedItemId(null);
    }, 650);
  };

  // Busca Inteligente: Tecla ENTER adiciona o primeiro produto filtrado
  const handleSearchEnter = () => {
    if (filteredProducts.length > 0) {
      handleAddProductWithHighlight(filteredProducts[0]);
      setProductSearch('');
    }
  };

  // Data e hora em tempo real (atualizado a cada segundo)
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
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
      triggerCartShake();
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
      className={
        isFullscreen
          ? "fixed inset-0 z-50 h-screen h-[100dvh] max-h-[100dvh] w-screen max-w-[100vw] bg-slate-100 flex flex-col overflow-hidden select-none"
          : "min-h-screen bg-slate-100 flex flex-col pb-48 sm:pb-36 lg:pb-0 select-none overflow-x-hidden"
      }
    >
      {/* HEADER SUPERIOR */}
      <header className="flex-none bg-white border-b border-slate-200 px-3 sm:px-4 py-2 sticky top-0 z-30 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Lado Esquerdo: Menu, Breadcrumbs e Configurações */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            id="btn-pos-menu"
            type="button"
            onClick={onNavigateBack}
            aria-label="Menu / Voltar ao Painel"
            className="p-2 hover:bg-gray-100 rounded text-slate-700 transition-colors cursor-pointer touch-manipulation"
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

        {/* Lado Direito: Ações, Alertas e Operações (grid-cols-6 mobile/tablet, flex desktop) */}
        <div className="w-full lg:w-auto grid grid-cols-6 sm:grid-cols-6 lg:flex lg:items-center gap-1.5 sm:gap-2">
          {/* 1. Resetar / Limpar Carrinho (RotateCcw) */}
          <button
            id="btn-pos-icon-refresh"
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            aria-label="Resetar / Limpar Carrinho"
            title="Resetar / Limpar Carrinho"
            className="w-full sm:w-auto h-9 sm:h-8 p-2 hover:bg-gray-100 rounded text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* 2. Sino de Notificações / Alertas (Único no PDV, ao lado de Adicionar despesa/Reparar) */}
          <div className="relative flex justify-center">
            <button
              id="btn-pos-icon-alert"
              type="button"
              onClick={() => setIsAlertsModalOpen(true)}
              aria-label="Alertas do Caixa e Estoque"
              title="Alertas do Caixa e Estoque"
              className="w-full sm:w-auto h-9 sm:h-8 p-2 hover:bg-gray-100 rounded text-slate-600 hover:text-slate-800 transition-colors relative flex items-center justify-center cursor-pointer touch-manipulation"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span
                  id="badge-pos-alerts-count"
                  className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow"
                >
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>

          {/* 3. "Adicionar despesa" (roxo com ícone menos) */}
          <button
            id="btn-pos-quick-expense"
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            aria-label="Adicionar despesa"
            title="Adicionar despesa"
            className="w-full sm:w-auto h-9 sm:h-8 px-2 sm:px-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer touch-manipulation"
          >
            <MinusCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden md:inline">Adicionar despesa</span>
          </button>

          {/* 4. "Reparar" (azul com ícone chave) */}
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
            aria-label="Ir para Reparos"
            title="Ir para Reparos"
            className="w-full sm:w-auto h-9 sm:h-8 px-2 sm:px-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer touch-manipulation"
          >
            <Wrench className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden md:inline">Reparar</span>
          </button>

          {/* 5. Ícone Salvar / Disquete (azul - Salvar Cotação) */}
          <button
            id="btn-pos-icon-save"
            type="button"
            onClick={() => {
              if (items.length === 0) {
                triggerCartShake();
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
            aria-label="Salvar Carrinho como Cotação / Orçamento"
            title="Salvar Carrinho como Cotação / Orçamento"
            className="w-full sm:w-auto h-9 sm:h-8 px-2 rounded bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer touch-manipulation"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* 6. Ícone Calculadora (verde) */}
          <button
            id="btn-pos-icon-calculator"
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            aria-label="Calculadora Rápida"
            title="Calculadora Rápida"
            className="w-full sm:w-auto h-9 sm:h-8 px-2 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer touch-manipulation"
          >
            <Calculator className="w-4 h-4" />
          </button>

          {/* 7. Ícone Caixa / Gaveta (verde claro / teal) */}
          <button
            id="btn-pos-icon-drawer"
            type="button"
            onClick={() => setIsCashRegisterModalOpen(true)}
            aria-label="Gaveta do Caixa"
            title="Gaveta do Caixa (Conferência e Sangria)"
            className="w-full sm:w-auto h-9 sm:h-8 px-2 rounded bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer touch-manipulation"
          >
            <Archive className="w-4 h-4" />
          </button>

          {/* 8. Ícone Impressora */}
          <button
            id="btn-pos-icon-print"
            type="button"
            onClick={handlePrint}
            aria-label="Imprimir cupom"
            className="w-full sm:w-auto h-9 sm:h-8 px-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center justify-center cursor-pointer shadow-xs touch-manipulation"
            title="Imprimir cupom"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* 9. Modo Kiosk (Tela Cheia) - visível em todos os tamanhos incluindo celular */}
          <button
            id="btn-pos-kiosk-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Modo Kiosk (Tela Cheia)'}
            title={isFullscreen ? 'Sair da tela cheia (Kiosk)' : 'Modo Kiosk (Tela Cheia)'}
            className="flex w-full sm:w-auto h-9 sm:h-8 px-2 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white rounded items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer touch-manipulation"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-amber-300" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
            <span className="hidden xl:inline text-xs font-medium">Kiosk</span>
          </button>

          {/* 10. Ícone X (vermelho - Cancelar Venda Atual) */}
          <button
            id="btn-pos-icon-close"
            type="button"
            onClick={() => setIsCancelConfirmOpen(true)}
            aria-label="Cancelar Venda Atual"
            title="Cancelar Venda Atual"
            className="w-full sm:w-auto h-9 sm:h-8 px-2 rounded bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 11. Ícone Voltar (azul/slate - Voltar para Lista de POS) */}
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
            aria-label="Voltar para Lista de POS"
            title="Voltar para Lista de POS"
            className="w-full sm:w-auto h-9 sm:h-8 px-2 rounded bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer touch-manipulation"
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
              aria-label="Fechar erro"
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

      {/* CORPO DO POS: 2 COLUNAS (60% Venda Atual / 40% Catálogo em Desktop; Empilhado no Mobile/Tablet) */}
      <main
        id="pos-main-content"
        className={`w-full mx-auto p-2 sm:p-3 items-stretch ${
          isFullscreen
            ? "flex-1 min-h-0 max-h-full overflow-hidden flex flex-col lg:grid lg:grid-cols-12 gap-2.5 sm:gap-3"
            : "flex-1 max-w-[1920px] grid grid-cols-12 gap-3 overflow-x-hidden"
        }`}
      >
        {/* Coluna Esquerda: Venda Atual (Carrinho) */}
        <div
          className={`flex flex-col min-h-0 overflow-hidden ${
            isFullscreen
              ? "flex-1 min-h-0 h-1/2 lg:h-full lg:col-span-7"
              : "col-span-12 lg:col-span-7"
          }`}
        >
          <POSItemsTable
            items={items}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
            onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
            productSearch={productSearch}
            onProductSearchChange={setProductSearch}
            onSearchEnter={handleSearchEnter}
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
            cartShake={cartShake}
            lastAddedItemId={lastAddedItemId}
            isKiosk={isFullscreen}
          />
        </div>

        {/* Coluna Direita: Catálogo de Produtos */}
        <div
          className={`flex flex-col min-h-0 overflow-hidden ${
            isFullscreen
              ? "flex-1 min-h-0 h-1/2 lg:h-full lg:col-span-5"
              : "col-span-12 lg:col-span-5"
          }`}
        >
          <POSProductGrid
            products={filteredProducts}
            categories={categories}
            brands={brands}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
            onAddProduct={handleAddProductWithHighlight}
            isLoading={isLoading}
            isKiosk={isFullscreen}
          />
        </div>
      </main>

      {/* BARRA INFERIOR DE PAGAMENTO FIXA */}
      <POSPaymentBar
        total={totals.totalToPay}
        loading={isProcessingPayment}
        isKiosk={isFullscreen}
        onCompleteSale={async (forma: PDVFormaPagamento, data: any) => {
          if (items.length === 0) {
            triggerCartShake();
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
