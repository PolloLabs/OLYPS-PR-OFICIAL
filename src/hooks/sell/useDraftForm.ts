import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import type {
  SellFormData,
  SellProductItem,
  SellPayment,
  SellCustomer,
  SellPaymentMethod,
  SellDiscountType,
  SellTaxType,
} from '../../types/sell.types.js';

export const initialDraftFormData: SellFormData = {
  companyLocationId: 'loc-sp',
  customerId: 'cust-fake-01',
  billingAddress: 'Cliente Consumidor Fake',
  shippingAddress: 'Cliente Consumidor Fake,',
  paymentTerm: 'prazo_de',
  paymentTermDays: 30,
  sellDate: '07-09-2026 11:04 AM',
  status: 'draft',
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
    shippingAddress: 'Cliente Consumidor Fake,',
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
      paidAt: '07-09-2026 11:04 AM',
      paymentMethod: 'cash',
      paymentNote: '',
      changeReturn: 0,
      balance: 0,
    },
  ],
};

export function useDraftForm(
  companyId: string,
  onShowNotification?: (n: { type: 'success' | 'error' | 'info'; message: string; description?: string }) => void,
  onSuccess?: () => void
) {
  const [formData, setFormData] = useState<SellFormData>(initialDraftFormData);
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
            : 'Cliente Consumidor Fake',
          shippingAddress: c.address
            ? `${c.address}${c.neighborhood ? `, ${c.neighborhood}` : ''}${c.city ? ` - ${c.city}/${c.state || ''}` : ''}`
            : 'Cliente Consumidor Fake,',
        }));
        setCustomers(mapped);
      } else {
        const defaultCustomers: SellCustomer[] = [
          {
            id: 'cust-fake-01',
            name: 'Cliente Consumidor Fake',
            tradeName: 'Consumidor Fake',
            document: '000.000.000-00',
            contactNumber: '+55 11 99999-0000',
            billingAddress: 'Cliente Consumidor Fake',
            shippingAddress: 'Cliente Consumidor Fake,',
          },
          {
            id: 'cust-001',
            name: 'TechCorp Soluções Tecnológicas Ltda',
            tradeName: 'TechCorp Brasil',
            document: '12.345.678/0001-90',
            contactNumber: '+55 11 98877-6655',
            billingAddress: 'Av. Paulista, 1000 - Conj 101, Bela Vista, São Paulo/SP',
            shippingAddress: 'Av. Paulista, 1000 - Conj 101, Bela Vista, São Paulo/SP',
          },
        ];
        setCustomers(defaultCustomers);
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
      ]);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [companyId]);

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
        ]);
      }
    } catch {
      setAvailableProducts([
        {
          id: 'prod-001',
          name: 'Notebook Dell Latitude 5430 Core i7 16GB',
          sku: 'DELL-LAT-5430',
          price: 4850.0,
        },
      ]);
    }
  }, [companyId]);

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, [loadCustomers, loadProducts]);

  // Quando o cliente muda, atualiza endereços
  const handleCustomerChange = (customerId: string) => {
    const selected = customers.find((c) => c.id === customerId);
    setFormData((prev) => ({
      ...prev,
      customerId,
      billingAddress: selected?.billingAddress || 'Cliente Consumidor Fake',
      shippingAddress: selected?.shippingAddress || 'Cliente Consumidor Fake,',
      shipping: {
        ...prev.shipping,
        shippingAddress: selected?.shippingAddress || 'Cliente Consumidor Fake,',
      },
    }));
  };

  // Manipulação de itens de produto
  const handleAddItem = (prod: any) => {
    const unitPrice = Number(prod.price || prod.sellPrice || 0);
    const taxRate = 10;
    const taxAmount = Number(((unitPrice * taxRate) / 100).toFixed(2));
    const imTaxPrice = Number((unitPrice + taxAmount).toFixed(2));
    const subtotal = imTaxPrice;

    const newItem: SellProductItem = {
      id: crypto.randomUUID(),
      productId: prod.id,
      productName: prod.name || prod.title || 'Produto sem nome',
      sku: prod.sku || '',
      barcode: prod.barcode || '',
      quantity: 1,
      unitPrice,
      discountPercentage: 0,
      discountAmount: 0,
      taxRate,
      taxAmount,
      imTaxPrice,
      subtotal,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleUpdateItem = (
    itemId: string,
    field: keyof SellProductItem,
    value: any
  ) => {
    setFormData((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id !== itemId) return item;

        const updated = { ...item, [field]: value };
        const qty = Number(updated.quantity) || 1;
        const price = Number(updated.unitPrice) || 0;
        const discPct = Number(updated.discountPercentage) || 0;
        const taxRate = Number(updated.taxRate) || 0;

        const discAmount = (price * discPct) / 100;
        const priceAfterDiscount = Math.max(0, price - discAmount);
        const taxAmount = (priceAfterDiscount * taxRate) / 100;
        const imTaxPrice = priceAfterDiscount + taxAmount;
        const subtotal = imTaxPrice * qty;

        return {
          ...updated,
          discountAmount: Number(discAmount.toFixed(2)),
          taxAmount: Number(taxAmount.toFixed(2)),
          imTaxPrice: Number(imTaxPrice.toFixed(2)),
          subtotal: Number(subtotal.toFixed(2)),
        };
      });

      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // Cálculos consolidados
  const calculations = useMemo(() => {
    const totalItemsCount = formData.items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0),
      0
    );
    const itemsTotal = formData.items.reduce(
      (acc, it) => acc + (Number(it.subtotal) || 0),
      0
    );

    let discountTotal = 0;
    if (formData.discountType === 'percentage') {
      discountTotal = (itemsTotal * (Number(formData.discountValue) || 0)) / 100;
    } else if (formData.discountType === 'fixed') {
      discountTotal = Number(formData.discountValue) || 0;
    }

    const cashbackTotal = Number(formData.cashbackRedeemedValue) || 0;
    const baseAfterDiscount = Math.max(0, itemsTotal - discountTotal - cashbackTotal);

    let orderTaxTotal = 0;
    if (formData.orderTaxType === 'percentage') {
      orderTaxTotal = (baseAfterDiscount * (Number(formData.orderTaxRate) || 0)) / 100;
    } else if (formData.orderTaxType === 'fixed') {
      orderTaxTotal = Number(formData.orderTaxRate) || 0;
    }

    const shippingCost = Number(formData.shipping.shippingCost) || 0;
    const totalAmount = Math.max(0, baseAfterDiscount + orderTaxTotal + shippingCost);

    const totalPaid = formData.payments.reduce(
      (acc, p) => acc + (Number(p.amount) || 0),
      0
    );
    const balanceDue = Math.max(0, totalAmount - totalPaid);
    const changeReturn = Math.max(0, totalPaid - totalAmount);

    return {
      totalItemsCount,
      itemsTotal: Number(itemsTotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      cashbackTotal: Number(cashbackTotal.toFixed(2)),
      orderTaxTotal: Number(orderTaxTotal.toFixed(2)),
      shippingCost: Number(shippingCost.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      balanceDue: Number(balanceDue.toFixed(2)),
      changeReturn: Number(changeReturn.toFixed(2)),
    };
  }, [formData]);

  // Atualizar pagamento padrão quando totalAmount muda
  useEffect(() => {
    setFormData((prev) => {
      if (prev.payments.length === 1 && prev.payments[0].amount === 0) {
        return {
          ...prev,
          payments: [
            {
              ...prev.payments[0],
              amount: calculations.totalAmount,
              balance: 0,
            },
          ],
        };
      }
      return prev;
    });
  }, [calculations.totalAmount]);

  // Manipulação de pagamentos
  const handleAddPaymentRow = () => {
    const newPayment: SellPayment = {
      id: crypto.randomUUID(),
      advanceBalance: 0,
      amount: calculations.balanceDue > 0 ? calculations.balanceDue : 0,
      paidAt: '07-09-2026 11:04 AM',
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

  const handleUpdatePayment = (
    paymentId: string,
    field: keyof SellPayment,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === paymentId ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleRemovePayment = (paymentId: string) => {
    if (formData.payments.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== paymentId),
    }));
  };

  // Envio do formulário de rascunho
  const handleSubmitDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSaving(true);
    try {
      const customer =
        customers.find((c) => c.id === formData.customerId) ||
        customers[0] || {
          id: 'cust-fake-01',
          name: 'Cliente Consumidor Fake',
          contactNumber: '+55 11 99999-0000',
        };

      const payload = {
        ...formData,
        status: 'draft', // Sempre rascunho
        customerId: customer.id,
        customerName: customer.name,
        contactNumber: customer.contactNumber || '+55 11 99999-0000',
        locationName: 'Franquia São Paulo (Loja Online SP)',
        companyLocationId: formData.companyLocationId || 'loc-sp',
        totalQuantity: calculations.totalItemsCount,
        itemsTotal: calculations.itemsTotal,
        discountTotal: calculations.discountTotal,
        orderTaxTotal: calculations.orderTaxTotal,
        totalAmount: calculations.totalAmount,
        totalPaid: calculations.totalPaid,
        sellDue: calculations.balanceDue,
      };

      await api.post(`/api/companies/${companyId}/sells/drafts`, payload, {
        companyId,
      });

      onShowNotification?.({
        type: 'success',
        message: 'Rascunho salvo com sucesso!',
        description: 'O rascunho foi registrado e pode ser editado a qualquer momento.',
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      onShowNotification?.({
        type: 'error',
        message: 'Erro ao salvar rascunho',
        description: err?.message || 'Verifique os dados e tente novamente.',
      });
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
    calculations,
    handleCustomerChange,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    handleAddPaymentRow,
    handleUpdatePayment,
    handleRemovePayment,
    handleSubmitDraft,
  };
}
