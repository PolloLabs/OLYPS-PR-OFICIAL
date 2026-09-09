import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api.js';
import type {
  POSProduct,
  POSItem,
  POSPaymentMethod,
  POSRecord,
  POSCashRegister,
  POSAlert,
  POSQuote,
  POSTotals,
  CompletedSaleReceipt,
} from '../../types/pdv.types.js';
import type { SellCustomer } from '../../types/sell.types.js';
import { DEFAULT_POS_PRODUCTS } from '../../server/services/pdvService.js';
import { playSuccessSound, playErrorSound, playBeepSound, setSoundEnabled } from '../../utils/sounds.js';

export function usePOS(
  companyId: string,
  onNotification?: (n: { type: 'success' | 'error' | 'info'; message: string; description?: string }) => void
) {
  // Carregar configuração de som das configurações de faturas
  useEffect(() => {
    const loadSoundConfig = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/invoice-settings`);
        if (response.ok) {
          const data = await response.json();
          const isEnabled = data.soundEnabled !== false;
          setSoundEnabled(isEnabled);
        }
      } catch (err) {
        console.error('Erro ao carregar config de som:', err);
      }
    };
    loadSoundConfig();
  }, [companyId]);

  // Estado de erro do PDV (persistente até ação bem-sucedida ou dispensa manual)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Estado da venda atual
  const [items, setItems] = useState<POSItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-fake-01');
  const [customers, setCustomers] = useState<SellCustomer[]>([]);
  const [products, setProducts] = useState<POSProduct[]>(DEFAULT_POS_PRODUCTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [completedSaleReceipt, setCompletedSaleReceipt] = useState<CompletedSaleReceipt | null>(null);

  // Filtros do catálogo
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');

  // Ajustes da venda atual
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [cashbackValue, setCashbackValue] = useState<number>(0);
  const [orderTaxValue, setOrderTaxValue] = useState<number>(0);
  const [shippingValue, setShippingValue] = useState<number>(0);

  // Modais de suporte
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isRecentTransactionsOpen, setIsRecentTransactionsOpen] = useState<boolean>(false);
  const [isMultiplePaymentOpen, setIsMultiplePaymentOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState<boolean>(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [isCreditSaleModalOpen, setIsCreditSaleModalOpen] = useState<boolean>(false);
  const [isCardPaymentModalOpen, setIsCardPaymentModalOpen] = useState<boolean>(false);
  const [isCashPaymentModalOpen, setIsCashPaymentModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState<boolean>(false);
  const [isCashbackModalOpen, setIsCashbackModalOpen] = useState<boolean>(false);

  const [recentTransactions, setRecentTransactions] = useState<POSRecord[]>([]);
  const [alerts, setAlerts] = useState<POSAlert[]>([]);
  const [cashRegister, setCashRegister] = useState<POSCashRegister | null>(null);

  // Carregar produtos
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: POSProduct[] }>(
        `/api/companies/${companyId}/pos/products`,
        { companyId }
      );
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setProducts(res.data);
      } else {
        setProducts(DEFAULT_POS_PRODUCTS);
      }
    } catch {
      setProducts(DEFAULT_POS_PRODUCTS);
    }
  }, [companyId]);

  // Carregar clientes
  const loadCustomers = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>(
        `/api/companies/${companyId}/customers`,
        { companyId }
      );
      const data = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(data) && data.length > 0) {
        const mapped: SellCustomer[] = data.map((c: any) => ({
          id: c.id,
          name: c.name || c.contactName || 'Cliente',
          contactNumber: c.phone || c.mobile || '',
          billingAddress: c.address || '',
          shippingAddress: c.address || '',
        }));
        setCustomers(mapped);
      } else {
        setCustomers([
          {
            id: 'cust-fake-01',
            name: 'Cliente Consumidor Fake',
            contactNumber: '+55 11 99999-0000',
            billingAddress: 'Cliente Consumidor Fake',
            shippingAddress: 'Cliente Consumidor Fake,',
          },
          {
            id: 'cust-fake-02',
            name: 'Marcos Silveira Informática',
            contactNumber: '+55 11 98844-3322',
            billingAddress: 'Rua Augusta, 1200, São Paulo/SP',
            shippingAddress: 'Rua Augusta, 1200, São Paulo/SP',
          },
          {
            id: 'cust-fake-03',
            name: 'Oficina do Celular Express',
            contactNumber: '+55 11 97722-1100',
            billingAddress: 'Av. Ibirapuera, 500, São Paulo/SP',
            shippingAddress: 'Av. Ibirapuera, 500, São Paulo/SP',
          },
        ]);
      }
    } catch {
      setCustomers([
        {
          id: 'cust-fake-01',
          name: 'Cliente Consumidor Fake',
          contactNumber: '+55 11 99999-0000',
          billingAddress: 'Cliente Consumidor Fake',
          shippingAddress: 'Cliente Consumidor Fake,',
        },
        {
          id: 'cust-fake-02',
          name: 'Marcos Silveira Informática',
          contactNumber: '+55 11 98844-3322',
        },
      ]);
    }
  }, [companyId]);

  // Carregar transações recentes
  const loadRecentTransactions = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: POSRecord[] }>(
        `/api/companies/${companyId}/pos`,
        { companyId }
      );
      if (res?.data && Array.isArray(res.data)) {
        setRecentTransactions(res.data.slice(0, 15));
      }
    } catch {
      // Ignorar fallback silencioso
    }
  }, [companyId]);

  // Carregar alertas do caixa
  const loadAlerts = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: POSAlert[] }>(
        `/api/companies/${companyId}/pos/alerts`,
        { companyId }
      );
      if (res?.data && Array.isArray(res.data)) {
        setAlerts(res.data);
      }
    } catch {
      // Fallback
    }
  }, [companyId]);

  // Carregar gaveta / caixa
  const loadCashRegister = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: POSCashRegister }>(
        `/api/companies/${companyId}/cash-register`,
        { companyId }
      );
      if (res?.data) {
        setCashRegister(res.data);
      }
    } catch {
      // Fallback
    }
  }, [companyId]);

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadRecentTransactions();
    loadAlerts();
    loadCashRegister();
  }, [loadProducts, loadCustomers, loadRecentTransactions, loadAlerts, loadCashRegister]);

  // Categorias únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Marcas únicas
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [products]);

  // Produtos filtrados no catálogo
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchBrand = selectedBrand === 'all' || p.brand === selectedBrand;
      const term = productSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.includes(term));
      return matchCategory && matchBrand && matchSearch;
    });
  }, [products, selectedCategory, selectedBrand, productSearch]);

  // Adicionar produto ao carrinho
  const addProductToCart = useCallback((product: POSProduct, quantity: number = 1) => {
    setErrorMessage(null);
    playSuccessSound();
    setItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const current = updated[existingIdx];
        const newQty = current.quantity + quantity;
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          subtotal: Number((newQty * current.imTaxPrice).toFixed(2)),
        };
        return updated;
      }

      const newItem: POSItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        code: product.code,
        sku: product.sku,
        quantity,
        unitPrice: product.price,
        imTaxPrice: product.imTaxPrice,
        subtotal: Number((quantity * product.imTaxPrice).toFixed(2)),
        discount: 0,
        taxRate: 10,
        imageUrl: product.imageUrl,
      };
      return [...prev, newItem];
    });

    onNotification?.({
      type: 'info',
      message: 'Item adicionado',
      description: `${product.name} (${product.code})`,
    });
  }, [onNotification]);

  // Atualizar quantidade de um item
  const updateItemQuantity = useCallback((itemId: string, newQty: number) => {
    if (newQty <= 0) {
      playBeepSound(500, 150);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              quantity: newQty,
              subtotal: Number((newQty * it.imTaxPrice).toFixed(2)),
            }
          : it
      )
    );
  }, []);

  // Remover item do carrinho
  const removeItem = useCallback((itemId: string) => {
    playBeepSound(500, 150);
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  }, []);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setItems([]);
    setDiscountValue(0);
    setCashbackValue(0);
    setOrderTaxValue(0);
    setShippingValue(0);
  }, []);

  // Totais calculados
  const totals: POSTotals = useMemo(() => {
    const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);
    const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
    const finalTotal = Math.max(
      0,
      subtotal - discountValue - cashbackValue + orderTaxValue + shippingValue
    );
    return {
      totalItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountValue: Number(discountValue.toFixed(2)),
      cashbackValue: Number(cashbackValue.toFixed(2)),
      cashBack: Number(cashbackValue.toFixed(2)),
      orderTaxValue: Number(orderTaxValue.toFixed(2)),
      shippingValue: Number(shippingValue.toFixed(2)),
      totalToPay: Number(finalTotal.toFixed(2)),
    };
  }, [items, discountValue, cashbackValue, orderTaxValue, shippingValue]);

  // Atualizar Cash Back com validação de limite (não pode exceder subtotal)
  const updateCashBack = useCallback(
    (value: number) => {
      const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
      if (value > subtotal) {
        onNotification?.({
          type: 'error',
          message: 'Cash back não pode exceder o subtotal',
          description: `O valor informado (R$ ${value.toFixed(2)}) é maior que o subtotal da venda (R$ ${subtotal.toFixed(2)}).`,
        });
        return false;
      }
      const sanitized = Math.max(0, Number(value.toFixed(2)));
      setCashbackValue(sanitized);
      return true;
    },
    [items, onNotification]
  );

  // Disparo de impressão de cupom térmico 80mm
  const handlePrint = useCallback(() => {
    if (items.length === 0) {
      setErrorMessage('Adicione produtos antes de imprimir');
      playErrorSound();
      return false;
    }

    try {
      playSuccessSound();
      window.print();
      return true;
    } catch (error) {
      console.warn('Erro ao acionar impressora:', error);
      return false;
    }
  }, [items]);

  // Finalizar venda no PDV com salvamento seguro e disparo automático de impressão
  const handleCompleteSale = useCallback(
    async (
      paymentMethod: POSPaymentMethod,
      amountPaid?: number,
      customNote?: string,
      autoPrint: boolean = false  // Alterado para false - impressão é tratada pelo hook usePrintReceipt
    ) => {
      if (items.length === 0) {
        const msg = 'Carrinho vazio. Adicione pelo menos um produto para finalizar a venda.';
        setErrorMessage(msg);
        playErrorSound();
        onNotification?.({
          type: 'error',
          message: 'Carrinho vazio',
          description: msg,
        });
        return false;
      }

      setIsProcessingPayment(true);
      try {
        const customer =
          customers.find((c) => c.id === selectedCustomerId) ||
          customers[0] || {
            id: 'cust-fake-01',
            name: 'Cliente Consumidor Fake',
            contactNumber: '+55 11 99999-0000',
          };

        const methodLabels: Record<POSPaymentMethod, string> = {
          cash: 'Dinheiro',
          card: 'Cartão de Crédito/Débito',
          credit_sale: 'Venda a Crédito',
          multiple: 'Pagamento Múltiplo',
          quote: 'Cotação / Orçamento',
          pix: 'PIX',
          other: 'Outro',
        };

        const totalPaid =
          amountPaid !== undefined ? amountPaid : totals.totalToPay;

        const payload = {
          customerId: customer.id,
          customerName: customer.name,
          contactNumber: customer.contactNumber || '+55 11 99999-0000',
          locationName: 'Franquia São Paulo (Loja Online SP)',
          companyLocationId: 'loc-sp',
          sellDate: new Date().toLocaleString('pt-BR'),
          paymentMethod: methodLabels[paymentMethod] || 'Dinheiro',
          totalAmount: totals.totalToPay,
          totalPaid,
          discountValue: totals.discountValue,
          cashbackValue: totals.cashbackValue,
          cashBack: totals.cashbackValue,
          orderTaxValue: totals.orderTaxValue,
          shippingValue: totals.shippingValue,
          items: [...items],
          notes: customNote || '',
          shippingStatus: 'delivered',
        };

        const res = await api.post<POSRecord>(
          `/api/companies/${companyId}/pos`,
          payload,
          { companyId }
        );

        const generatedInvoiceNumber = res?.data?.invoiceNumber || `PDV-${Date.now().toString().slice(-6)}`;

        // Guarda snapshot dos dados da venda para o cupom térmico
        const receiptSnapshot: CompletedSaleReceipt = {
          items: [...items],
          customer,
          subtotal: totals.subtotal,
          discountValue: totals.discountValue,
          cashbackValue: totals.cashbackValue,
          orderTaxValue: totals.orderTaxValue,
          shippingValue: totals.shippingValue,
          totalToPay: totals.totalToPay,
          paymentMethod: methodLabels[paymentMethod] || 'Dinheiro',
          invoiceNumber: generatedInvoiceNumber,
          date: new Date().toLocaleString('pt-BR'),
        };
        setCompletedSaleReceipt(receiptSnapshot);

        // Sucesso na venda: limpa qualquer erro e emite o som de confirmação
        setErrorMessage(null);
        playSuccessSound();

        onNotification?.({
          type: 'success',
          message: 'Venda concluída! Cupom gerado automaticamente.',
          description: `Fatura ${generatedInvoiceNumber} - Total: R$ ${totals.totalToPay.toFixed(2)}`,
        });

        // Só limpa o carrinho APÓS a impressão
        if (autoPrint) {
          setTimeout(() => {
            try {
              // A impressão agora é tratada pelo hook usePrintReceipt e seu useEffect
              // que aguarda a renderização completa do componente POSPrintReceipt
              // Não chamamos window.print() diretamente aqui para evitar impressão em branco
            } catch (printErr) {
              console.warn('Falha ao abrir diálogo de impressão:', printErr);
            } finally {
              // Limpeza do carrinho somente após disparar impressão
              clearCart();
              loadRecentTransactions();
            }
          }, 500);
        } else {
          clearCart();
          loadRecentTransactions();
        }

        return true;
      } catch (err: any) {
        const errorMsg = err?.message || 'Ocorreu um erro no processamento do PDV.';
        setErrorMessage(errorMsg);
        playErrorSound();
        onNotification?.({
          type: 'error',
          message: 'Erro ao registrar venda',
          description: errorMsg,
        });
        return false;
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [
      items,
      customers,
      selectedCustomerId,
      totals,
      companyId,
      onNotification,
      clearCart,
      loadRecentTransactions,
    ]
  );

  // processSale mantido como alias para compatibilidade
  const processSale = handleCompleteSale;

  // Registrar despesa rápida
  const handleAddExpense = useCallback(
    async (amount: number, category: string, note: string) => {
      try {
        await api.post(
          `/api/companies/${companyId}/pos/expense`,
          { amount, category, note },
          { companyId }
        );
        onNotification?.({
          type: 'success',
          message: 'Despesa registrada',
          description: `Valor: ${amount.toFixed(2)} R$ - ${category}`,
        });
        setIsExpenseModalOpen(false);
      } catch {
        onNotification?.({
          type: 'error',
          message: 'Erro ao salvar despesa',
        });
      }
    },
    [companyId, onNotification]
  );

  // Salvar venda como cotação (/api/companies/:companyId/sells/quotes)
  const handleSaveQuote = useCallback(
    async (notes?: string, validUntilDays: number = 7) => {
      if (items.length === 0) {
        onNotification?.({
          type: 'error',
          message: 'Carrinho vazio',
          description: 'Adicione pelo menos um produto para gerar uma cotação.',
        });
        return null;
      }

      setIsProcessingPayment(true);
      try {
        const customer =
          customers.find((c) => c.id === selectedCustomerId) ||
          customers[0] || {
            id: 'cust-fake-01',
            name: 'Cliente Consumidor Fake',
          };

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + validUntilDays);
        const validUntil = `${String(targetDate.getDate()).padStart(2, '0')}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${targetDate.getFullYear()}`;

        const payload = {
          customerId: customer.id,
          customerName: customer.name,
          validUntil,
          totalAmount: totals.totalToPay,
          discountValue: totals.discountValue,
          cashbackValue: totals.cashbackValue,
          cashBack: totals.cashbackValue,
          items,
          notes: notes || 'Cotação criada diretamente no terminal POS.',
        };

        const res = await api.post<POSQuote>(
          `/api/companies/${companyId}/sells/quotes`,
          payload,
          { companyId }
        );

        onNotification?.({
          type: 'success',
          message: 'Cotação salva com sucesso!',
          description: `Cotação ${res?.data?.quoteNumber || 'COT-001'} gerada. Total: R$ ${totals.totalToPay.toFixed(2)}`,
        });

        setIsQuoteModalOpen(false);
        return res?.data;
      } catch (err: any) {
        onNotification?.({
          type: 'error',
          message: 'Erro ao salvar cotação',
          description: err?.message || 'Falha na requisição.',
        });
        return null;
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [items, customers, selectedCustomerId, totals, companyId, onNotification]
  );

  // Abertura / Fechamento da gaveta do caixa (/api/companies/:companyId/cash-register)
  const handleUpdateCashRegister = useCallback(
    async (payload: Partial<POSCashRegister>) => {
      try {
        const res = await api.post<POSCashRegister>(
          `/api/companies/${companyId}/cash-register`,
          payload,
          { companyId }
        );
        if (res?.data) {
          setCashRegister(res.data);
        }
        onNotification?.({
          type: 'success',
          message: payload.isOpen === false ? 'Caixa fechado com sucesso!' : 'Registro do caixa atualizado!',
          description: payload.notes || 'Operação registrada com sucesso.',
        });
        setIsCashRegisterModalOpen(false);
      } catch (err: any) {
        onNotification?.({
          type: 'error',
          message: 'Erro ao atualizar gaveta/caixa',
          description: err?.message || 'Falha na requisição.',
        });
      }
    },
    [companyId, onNotification]
  );

  // Marcar alertas como lidos
  const markAlertsAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    onNotification?.({
      type: 'info',
      message: 'Alertas marcados como lidos',
    });
  }, [onNotification]);

  // Venda a Crédito (/api/companies/:companyId/sells)
  const processCreditSale = useCallback(
    async (installments: number, firstDueDate: string, notes?: string) => {
      const note = `Venda a Crédito em ${installments}x de R$ ${(totals.totalToPay / installments).toFixed(2)}. 1º Vcto: ${firstDueDate}. ${notes || ''}`;
      const result = await processSale('credit_sale', 0, note);
      setIsCreditSaleModalOpen(false);
      return result;
    },
    [totals.totalToPay, processSale]
  );

  // Pagamento com Cartão com simulação de 2s (/api/companies/:companyId/sells)
  const processCardSale = useCallback(
    async (cardType: 'credit' | 'debit', installments: number, flag: string) => {
      setIsProcessingPayment(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const note = `Cartão ${cardType === 'credit' ? 'Crédito' : 'Débito'} (${flag}) - ${installments}x`;
      const result = await processSale('card', totals.totalToPay, note);
      setIsCardPaymentModalOpen(false);
      return result;
    },
    [totals.totalToPay, processSale]
  );

  // Pagamento em Dinheiro com troco
  const processCashSale = useCallback(
    async (amountReceived: number, change: number) => {
      const note = `Dinheiro Recebido: R$ ${amountReceived.toFixed(2)}, Troco: R$ ${change.toFixed(2)}`;
      const result = await processSale('cash', totals.totalToPay, note);
      setIsCashPaymentModalOpen(false);
      return result;
    },
    [totals.totalToPay, processSale]
  );

  // Resetar carrinho e voltar cliente padrão
  const resetCartAndCustomer = useCallback(() => {
    clearCart();
    setSelectedCustomerId('cust-fake-01');
    setDiscountValue(0);
    setCashbackValue(0);
    setOrderTaxValue(0);
    setShippingValue(0);
    setIsResetConfirmOpen(false);
    onNotification?.({
      type: 'info',
      message: 'Carrinho e seleções resetados com sucesso.',
    });
  }, [clearCart, onNotification]);

  // Cancelar venda atual com confirmação
  const cancelCurrentSale = useCallback(() => {
    clearCart();
    setSelectedCustomerId('cust-fake-01');
    setDiscountValue(0);
    setCashbackValue(0);
    setOrderTaxValue(0);
    setShippingValue(0);
    setIsCancelConfirmOpen(false);
    onNotification?.({
      type: 'info',
      message: 'Venda atual cancelada.',
    });
  }, [clearCart, onNotification]);

  const unreadAlertsCount = useMemo(
    () => alerts.filter((a) => !a.isRead).length,
    [alerts]
  );

  return {
    items,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    products,
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
    cashBack: cashbackValue,
    updateCashBack,
    orderTaxValue,
    setOrderTaxValue,
    shippingValue,
    setShippingValue,
    totals,
    isLoading,
    isProcessingPayment,
    errorMessage,
    error: errorMessage,
    setErrorMessage,
    setError: setErrorMessage,
    clearError,
    addProductToCart,
    updateItemQuantity,
    removeItem,
    clearCart,
    processSale,
    handlePrint,
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
    setCompletedSaleReceipt,
    resetCartAndCustomer,
    cancelCurrentSale,
    loadRecentTransactions,
  };
}

export const usePDV = usePOS;
