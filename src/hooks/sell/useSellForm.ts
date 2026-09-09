import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import type {
  SellFormData,
  SellProductItem,
  SellPayment,
  SellCustomer,
  SellStatus,
  SellPaymentMethod,
  SellDiscountType,
  SellTaxType,
} from '../../types/sell.types.js';

export const initialSellFormData: SellFormData = {
  companyLocationId: 'loc-sp',
  customerId: '',
  billingAddress: '',
  shippingAddress: '',
  paymentTerm: 'prazo_de',
  paymentTermDays: 30,
  sellDate: '07-09-2026 10:26 AM',
  status: 'final',
  invoiceScheme: 'fatura_facil',
  invoiceNumber: '',
  items: [],
  discountType: 'percentage',
  discountValue: 0,
  discountTotal: 0,
  cashbackRedeemed: 0,
  cashbackAccessible: 150.0,
  cashbackRedeemedValue: 0,
  orderTaxRate: 0,
  orderTaxType: 'none',
  orderTaxTotal: 0,
  saleNote: '',
  shipping: {
    shippingDetails: '',
    shippingAddress: '',
    shippingCost: 0,
    shippingStatus: 'pending',
    deliveredTo: '',
    deliveryPerson: '',
  },
  payments: [
    {
      id: crypto.randomUUID(),
      advanceBalance: 0,
      amount: 0,
      paidAt: '07-09-2026 10:26 AM',
      paymentMethod: 'cash',
      paymentNote: '',
      changeReturn: 0,
      balance: 0,
    },
  ],
};

export function useSellForm(
  companyId: string,
  onShowNotification?: (n: { type: 'success' | 'error' | 'info'; message: string; description?: string }) => void,
  onSuccess?: () => void
) {
  const [formData, setFormData] = useState<SellFormData>(initialSellFormData);
  const [customers, setCustomers] = useState<SellCustomer[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Carregar clientes da empresa
  const loadCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      const res = await api.get<{ success: boolean; data: any[] }>(
        `/api/companies/${companyId}/customers`,
        { companyId }
      );
      const data = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(data) && data.length > 0) {
        const mapped: SellCustomer[] = data.map((c: any) => ({
          id: c.id,
          name: c.name || c.contactName || 'Cliente',
          tradeName: c.tradeName,
          document: c.document,
          contactNumber: c.phone || c.mobile || '',
          phone: c.phone || c.mobile,
          email: c.email,
          billingAddress: c.address
            ? `${c.address}${c.neighborhood ? `, ${c.neighborhood}` : ''}${c.city ? ` - ${c.city}/${c.state || ''}` : ''}`
            : 'Endereço não informado',
          shippingAddress: c.address
            ? `${c.address}${c.neighborhood ? `, ${c.neighborhood}` : ''}${c.city ? ` - ${c.city}/${c.state || ''}` : ''}`
            : 'Endereço não informado',
        }));
        setCustomers(mapped);

        // Preselecionar o primeiro cliente se nenhum selecionado
        if (!formData.customerId && mapped[0]) {
          setFormData((prev) => ({
            ...prev,
            customerId: mapped[0].id,
            billingAddress: mapped[0].billingAddress || '',
            shippingAddress: mapped[0].shippingAddress || '',
            shipping: {
              ...prev.shipping,
              shippingAddress: mapped[0].shippingAddress || '',
            },
          }));
        }
      } else {
        // Mock fallback de clientes de teste
        const defaultCustomers: SellCustomer[] = [
          {
            id: 'cust-001',
            name: 'TechCorp Soluções Tecnológicas Ltda',
            tradeName: 'TechCorp Brasil',
            document: '12.345.678/0001-90',
            contactNumber: '+55 11 98877-6655',
            billingAddress: 'Av. Paulista, 1000 - Conj 101, Bela Vista, São Paulo/SP',
            shippingAddress: 'Av. Paulista, 1000 - Conj 101, Bela Vista, São Paulo/SP',
          },
          {
            id: 'cust-002',
            name: 'Inova Digital Comércio e Serviços',
            tradeName: 'Inova Digital',
            document: '98.765.432/0001-10',
            contactNumber: '+55 11 97711-2233',
            billingAddress: 'Rua Bela Cintra, 450, Consolação, São Paulo/SP',
            shippingAddress: 'Rua Bela Cintra, 450, Consolação, São Paulo/SP',
          },
          {
            id: 'cust-003',
            name: 'Consultoria Alfa & Gestão',
            tradeName: 'Alfa Gestão',
            document: '45.123.789/0001-55',
            contactNumber: '+55 21 99123-4567',
            billingAddress: 'Av. Rio Branco, 156 - Sala 802, Centro, Rio de Janeiro/RJ',
            shippingAddress: 'Av. Rio Branco, 156 - Sala 802, Centro, Rio de Janeiro/RJ',
          },
        ];
        setCustomers(defaultCustomers);
        if (!formData.customerId) {
          setFormData((prev) => ({
            ...prev,
            customerId: defaultCustomers[0].id,
            billingAddress: defaultCustomers[0].billingAddress || '',
            shippingAddress: defaultCustomers[0].shippingAddress || '',
            shipping: {
              ...prev.shipping,
              shippingAddress: defaultCustomers[0].shippingAddress || '',
            },
          }));
        }
      }
    } catch {
      // Fallback
      const defaultCustomers: SellCustomer[] = [
        {
          id: 'cust-001',
          name: 'TechCorp Soluções Tecnológicas Ltda',
          contactNumber: '+55 11 98877-6655',
          billingAddress: 'Av. Paulista, 1000 - Conj 101, São Paulo/SP',
          shippingAddress: 'Av. Paulista, 1000 - Conj 101, São Paulo/SP',
        },
        {
          id: 'cust-002',
          name: 'Inova Digital Comércio e Serviços',
          contactNumber: '+55 11 97711-2233',
          billingAddress: 'Rua Bela Cintra, 450, São Paulo/SP',
          shippingAddress: 'Rua Bela Cintra, 450, São Paulo/SP',
        },
      ];
      setCustomers(defaultCustomers);
      if (!formData.customerId) {
        setFormData((prev) => ({
          ...prev,
          customerId: defaultCustomers[0].id,
          billingAddress: defaultCustomers[0].billingAddress || '',
          shippingAddress: defaultCustomers[0].shippingAddress || '',
          shipping: {
            ...prev.shipping,
            shippingAddress: defaultCustomers[0].shippingAddress || '',
          },
        }));
      }
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [companyId, formData.customerId]);

  // Carregar produtos da empresa
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>(
        `/api/companies/${companyId}/products`,
        { companyId }
      );
      const data = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(data) && data.length > 0) {
        setAvailableProducts(data);
      } else {
        setAvailableProducts([
          {
            id: 'prod-001',
            name: 'Notebook Dell Latitude 5430 Core i7 16GB',
            sku: 'DELL-LAT-5430',
            barcode: '7891234567890',
            price: 4850.0,
          },
          {
            id: 'prod-002',
            name: 'Monitor Dell 27 4K UHD UltraSharp',
            sku: 'DELL-MON-4K',
            barcode: '7891234567891',
            price: 2200.0,
          },
          {
            id: 'prod-003',
            name: 'Teclado Mecânico Logitech MX Keys',
            sku: 'LOGI-MX-KEYS',
            barcode: '7891234567892',
            price: 650.0,
          },
          {
            id: 'prod-004',
            name: 'Mouse Sem Fio Logitech MX Master 3S',
            sku: 'LOGI-MX-MASTER',
            barcode: '7891234567894',
            price: 520.0,
          },
        ]);
      }
    } catch {
      setAvailableProducts([
        {
          id: 'prod-001',
          name: 'Notebook Dell Latitude 5430 Core i7 16GB',
          sku: 'DELL-LAT-5430',
          barcode: '7891234567890',
          price: 4850.0,
        },
        {
          id: 'prod-002',
          name: 'Monitor Dell 27 4K UHD UltraSharp',
          sku: 'DELL-MON-4K',
          barcode: '7891234567891',
          price: 2200.0,
        },
      ]);
    }
  }, [companyId]);

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, [loadCustomers, loadProducts]);

  // Ao selecionar um cliente, atualizar endereços automaticamente
  const handleSelectCustomer = (customerId: string) => {
    const selected = customers.find((c) => c.id === customerId);
    setFormData((prev) => ({
      ...prev,
      customerId,
      billingAddress: selected?.billingAddress || '',
      shippingAddress: selected?.shippingAddress || '',
      shipping: {
        ...prev.shipping,
        shippingAddress: selected?.shippingAddress || '',
      },
    }));
  };

  // Gerenciamento de itens de produto
  const handleAddItem = (product: any) => {
    const unitPrice = Number(product.price || product.sellingPrice || product.unitPrice) || 100.0;
    const existingIndex = formData.items.findIndex((item) => item.productId === product.id);

    if (existingIndex >= 0) {
      // Incrementar quantidade
      const updated = [...formData.items];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + 1;
      const discountAmount =
        existing.discountPercentage > 0
          ? (unitPrice * newQty * existing.discountPercentage) / 100
          : 0;
      const baseSubtotal = unitPrice * newQty - discountAmount;
      const taxAmount = (baseSubtotal * existing.taxRate) / 100;
      const imTaxPrice =
        newQty > 0 ? (unitPrice * (100 - existing.discountPercentage) / 100) * (1 + existing.taxRate / 100) : 0;
      const subtotal = baseSubtotal + taxAmount;

      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        discountAmount,
        taxAmount,
        imTaxPrice,
        subtotal,
      };
      setFormData((prev) => ({ ...prev, items: updated }));
    } else {
      // Adicionar novo item
      const quantity = 1;
      const discountPercentage = 0;
      const discountAmount = 0;
      const taxRate = 0;
      const taxAmount = 0;
      const imTaxPrice = unitPrice;
      const subtotal = unitPrice;

      const newItem: SellProductItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        sku: product.sku || '',
        barcode: product.barcode || '',
        quantity,
        unitPrice,
        discountPercentage,
        discountAmount,
        taxRate,
        taxAmount,
        imTaxPrice,
        subtotal,
      };

      setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }
  };

  const handleUpdateItem = (itemId: string, updates: Partial<SellProductItem>) => {
    setFormData((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const merged = { ...item, ...updates };

        const qty = Number(merged.quantity) || 0;
        const price = Number(merged.unitPrice) || 0;
        const discPercent = Number(merged.discountPercentage) || 0;
        const taxRate = Number(merged.taxRate) || 0;

        const discAmount = (price * qty * discPercent) / 100;
        const baseSubtotal = Math.max(0, price * qty - discAmount);
        const taxAmount = (baseSubtotal * taxRate) / 100;
        const subtotal = baseSubtotal + taxAmount;

        const singleBase = price * (1 - discPercent / 100);
        const imTaxPrice = singleBase * (1 + taxRate / 100);

        return {
          ...merged,
          quantity: qty,
          unitPrice: price,
          discountPercentage: discPercent,
          discountAmount: discAmount,
          taxRate,
          taxAmount,
          imTaxPrice,
          subtotal,
        };
      });

      return { ...prev, items: updatedItems };
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // Totais calculados
  const calculated = useMemo(() => {
    const totalItemsCount = formData.items.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0),
      0
    );
    const itemsSubtotal = formData.items.reduce(
      (acc, item) => acc + (Number(item.subtotal) || 0),
      0
    );

    // Desconto global
    let discountCalculated = 0;
    if (formData.discountType === 'percentage') {
      discountCalculated = (itemsSubtotal * (Number(formData.discountValue) || 0)) / 100;
    } else if (formData.discountType === 'fixed') {
      discountCalculated = Number(formData.discountValue) || 0;
    }

    // Cashback
    const cashbackRedeemedVal = Math.min(
      Number(formData.cashbackRedeemed) || 0,
      Number(formData.cashbackAccessible) || 0
    );

    const afterDiscountSubtotal = Math.max(
      0,
      itemsSubtotal - discountCalculated - cashbackRedeemedVal
    );

    // Imposto do pedido
    let orderTaxCalculated = 0;
    if (formData.orderTaxType === 'percentage') {
      orderTaxCalculated = (afterDiscountSubtotal * (Number(formData.orderTaxRate) || 0)) / 100;
    } else if (formData.orderTaxType === 'fixed') {
      orderTaxCalculated = Number(formData.orderTaxRate) || 0;
    }

    // Custo de envio
    const shippingCost = Number(formData.shipping.shippingCost) || 0;

    // Total a pagar
    const totalPayable = Math.max(0, afterDiscountSubtotal + orderTaxCalculated + shippingCost);

    // Pagamentos e saldo
    const totalPaymentsPaid = formData.payments.reduce(
      (acc, p) => acc + (Number(p.amount) || 0),
      0
    );
    const balanceDue = Math.max(0, totalPayable - totalPaymentsPaid);
    const changeReturn = Math.max(0, totalPaymentsPaid - totalPayable);

    return {
      totalItemsCount,
      itemsSubtotal,
      discountCalculated,
      cashbackRedeemedVal,
      orderTaxCalculated,
      shippingCost,
      totalPayable,
      totalPaymentsPaid,
      balanceDue,
      changeReturn,
    };
  }, [formData]);

  // Sincronizar o valor do primeiro pagamento com o total a pagar por conveniência
  const handleSetExactPayment = () => {
    setFormData((prev) => {
      const updatedPayments = [...prev.payments];
      if (updatedPayments[0]) {
        updatedPayments[0] = {
          ...updatedPayments[0],
          amount: calculated.totalPayable,
        };
      }
      return { ...prev, payments: updatedPayments };
    });
  };

  // Atualizar pagamento
  const handleUpdatePayment = (index: number, updates: Partial<SellPayment>) => {
    setFormData((prev) => {
      const updated = [...prev.payments];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
      }
      return { ...prev, payments: updated };
    });
  };

  // Adicionar linha de pagamento
  const handleAddPaymentLine = () => {
    const remaining = calculated.balanceDue;
    const newPayment: SellPayment = {
      id: crypto.randomUUID(),
      advanceBalance: 0,
      amount: remaining > 0 ? remaining : 0,
      paidAt: formData.sellDate || '07-09-2026 10:26 AM',
      paymentMethod: 'cash',
      paymentNote: '',
      changeReturn: 0,
      balance: 0,
    };
    setFormData((prev) => ({
      ...prev,
      payments: [...prev.payments, newPayment],
    }));
  };

  // Remover linha de pagamento
  const handleRemovePaymentLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  };

  // Salvar venda
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.customerId) {
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Campo obrigatório',
          description: 'Por favor, selecione um Cliente.',
        });
      }
      return;
    }

    if (formData.items.length === 0) {
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Produtos obrigatórios',
          description: 'Adicione pelo menos um produto à venda.',
        });
      }
      return;
    }

    try {
      setIsSaving(true);
      const selectedCust = customers.find((c) => c.id === formData.customerId);

      const payload = {
        companyId,
        companyLocationId: formData.companyLocationId,
        locationName:
          formData.companyLocationId === 'loc-sp'
            ? 'Franquia São Paulo'
            : formData.companyLocationId === 'loc-rj'
              ? 'Filial Rio de Janeiro'
              : 'Matriz',
        customerId: formData.customerId,
        customerName: selectedCust?.name || 'Cliente Balcão',
        contactNumber: selectedCust?.contactNumber || selectedCust?.phone || '',
        billingAddress: formData.billingAddress,
        shippingAddress: formData.shippingAddress,
        paymentTerm: formData.paymentTerm,
        paymentTermDays: formData.paymentTermDays,
        sellDate: formData.sellDate,
        status: (formData.status as SellStatus) || 'final',
        invoiceScheme: formData.invoiceScheme,
        invoiceNumber: formData.invoiceNumber,
        attachedDocumentName: formData.attachedDocumentName,
        items: formData.items,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue) || 0,
        discountTotal: calculated.discountCalculated,
        cashback: {
          redeemed: Number(formData.cashbackRedeemed) || 0,
          accessible: Number(formData.cashbackAccessible) || 0,
          redeemedValue: calculated.cashbackRedeemedVal,
        },
        orderTaxRate: Number(formData.orderTaxRate) || 0,
        orderTaxType: formData.orderTaxType,
        orderTaxTotal: calculated.orderTaxCalculated,
        saleNote: formData.saleNote,
        shipping: {
          ...formData.shipping,
          shippingCost: calculated.shippingCost,
        },
        totalQuantity: calculated.totalItemsCount,
        itemsTotal: calculated.itemsSubtotal,
        totalAmount: calculated.totalPayable,
        totalPaid: calculated.totalPaymentsPaid,
        sellDue: calculated.balanceDue,
        payments: formData.payments,
      };

      const res = await api.post<{ success: boolean; data: any }>(
        `/api/companies/${companyId}/sells`,
        payload,
        { companyId }
      );

      if (onShowNotification) {
        onShowNotification({
          type: 'success',
          message: 'Venda Adicionada com Sucesso!',
          description: `Fatura ${(res as any)?.data?.invoiceNumber || formData.invoiceNumber || 'gerada'} registrada no sistema.`,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Erro ao salvar venda:', err);
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: 'Erro ao registrar venda',
          description: err.message || 'Verifique os campos obrigatórios e tente novamente.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    setFormData,
    customers,
    availableProducts,
    isLoadingCustomers,
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
  };
}
