import { useState, useCallback } from 'react';
import type {
  PurchaseFormData,
  PurchaseItem,
  DiscountType,
  TaxType,
  PaymentMethod,
} from '../../types/purchase.types.js';
import {
  calculateItemTotals,
  calculatePurchaseTotals,
} from '../../server/services/purchaseService.js';

export function usePurchaseForm(companyId: string, onSaveSuccess?: (purchaseNumber?: string) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<PurchaseFormData>({
    supplierId: '',
    referenceNumber: '',
    purchaseDate: new Date(),
    status: '',
    address: '',
    companyLocationId: '',
    paymentTerm: '',
    paymentTermDays: 30,
    items: [],
    discountType: 'none',
    discountValue: 0,
    discountTotal: 0,
    taxType: 'none',
    taxTotal: 0,
    totalItems: 0,
    totalNetValue: 0,
    payments: [
      {
        id: crypto.randomUUID(),
        advanceBalance: 0,
        amount: 0,
        paidAt: new Date(),
        paymentMethod: 'cash' as PaymentMethod,
        paymentNote: '',
      },
    ],
    additionalNotes: '',
  });

  // Atualizar campo do cabeçalho
  const updateHeaderField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Adicionar item
  const addItem = useCallback((product: Partial<PurchaseItem>) => {
    const calculated = calculateItemTotals(product);
    setFormData((prev) => {
      const newItems = [...prev.items, calculated];
      const totals = calculatePurchaseTotals(
        newItems,
        prev.discountType,
        prev.discountValue,
        prev.taxType,
        prev.taxTotal
      );
      return {
        ...prev,
        items: newItems,
        totalItems: totals.totalItems,
        totalNetValue: totals.totalNetValue,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
      };
    });
  }, []);

  // Atualizar item
  const updateItem = useCallback((index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      if (!newItems[index]) return prev;
      const updated = { ...newItems[index], [field]: value };
      newItems[index] = calculateItemTotals(updated);
      const totals = calculatePurchaseTotals(
        newItems,
        prev.discountType,
        prev.discountValue,
        prev.taxType,
        prev.taxTotal
      );
      return {
        ...prev,
        items: newItems,
        totalItems: totals.totalItems,
        totalNetValue: totals.totalNetValue,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
      };
    });
  }, []);

  // Remover item
  const removeItem = useCallback((index: number) => {
    setFormData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totals = calculatePurchaseTotals(
        newItems,
        prev.discountType,
        prev.discountValue,
        prev.taxType,
        prev.taxTotal
      );
      return {
        ...prev,
        items: newItems,
        totalItems: totals.totalItems,
        totalNetValue: totals.totalNetValue,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
      };
    });
  }, []);

  // Atualizar desconto
  const updateDiscount = useCallback((type: DiscountType, value: number) => {
    setFormData((prev) => {
      const totals = calculatePurchaseTotals(prev.items, type, value, prev.taxType, prev.taxTotal);
      return {
        ...prev,
        discountType: type,
        discountValue: value,
        discountTotal: totals.discountTotal,
        totalNetValue: totals.totalNetValue,
      };
    });
  }, []);

  // Atualizar imposto
  const updateTax = useCallback((type: TaxType, value: number) => {
    setFormData((prev) => {
      const totals = calculatePurchaseTotals(prev.items, prev.discountType, prev.discountValue, type, value);
      return {
        ...prev,
        taxType: type,
        taxTotal: totals.taxTotal,
        totalNetValue: totals.totalNetValue,
      };
    });
  }, []);

  // Atualizar pagamento
  const updatePayment = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => ({ ...p, [field]: value })),
    }));
  }, []);

  // Atualizar pagamento específico por índice
  const updatePaymentByIndex = useCallback((index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newPayments = [...prev.payments];
      if (!newPayments[index]) return prev;
      newPayments[index] = { ...newPayments[index], [field]: value };
      return {
        ...prev,
        payments: newPayments,
      };
    });
  }, []);

  // Adicionar pagamento
  const addPayment = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 0,
          paidAt: new Date(),
          paymentMethod: 'cash',
          paymentNote: '',
        },
      ],
    }));
  }, []);

  // Remover pagamento
  const removePayment = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.payments.length <= 1) return prev;
      return {
        ...prev,
        payments: prev.payments.filter((_, i) => i !== index),
      };
    });
  }, []);

  // Submeter compra
  const submitPurchase = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validações
      if (!formData.supplierId) {
        throw new Error('Fornecedor é obrigatório');
      }
      if (!formData.status) {
        throw new Error('Status de compra é obrigatório');
      }
      if (!formData.companyLocationId) {
        throw new Error('Localização da empresa é obrigatória');
      }
      if (formData.items.length === 0) {
        throw new Error('Adicione pelo menos um produto');
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('olyps_auth_token') : '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const payload = {
        companyId,
        supplierId: formData.supplierId,
        referenceNumber: formData.referenceNumber,
        purchaseDate: formData.purchaseDate,
        status: formData.status,
        address: formData.address,
        companyLocationId: formData.companyLocationId,
        paymentTerm: formData.paymentTerm,
        paymentTermDays: formData.paymentTermDays,
        items: formData.items,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        discountTotal: formData.discountTotal,
        taxType: formData.taxType,
        taxTotal: formData.taxTotal,
        totalItems: formData.totalItems,
        totalNetValue: formData.totalNetValue,
        payments: formData.payments,
        additionalNotes: formData.additionalNotes,
        attachedFileName: formData.attachedFile?.name,
      };

      const res = await fetch(`/api/companies/${companyId}/purchases`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || 'Erro ao registrar compra');
      }

      const resData = await res.json();
      const pNum = resData.data?.purchaseNumber || '';
      const successMsg = pNum
        ? `Compra ${pNum} registrada com sucesso!`
        : 'Compra criada com sucesso!';

      setSuccess(successMsg);
      if (onSaveSuccess) {
        onSaveSuccess(pNum);
      }
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Resetar formulário
  const resetForm = useCallback(() => {
    setFormData({
      supplierId: '',
      referenceNumber: '',
      purchaseDate: new Date(),
      status: '',
      address: '',
      companyLocationId: '',
      paymentTerm: '',
      paymentTermDays: 30,
      items: [],
      discountType: 'none',
      discountValue: 0,
      discountTotal: 0,
      taxType: 'none',
      taxTotal: 0,
      totalItems: 0,
      totalNetValue: 0,
      payments: [
        {
          id: crypto.randomUUID(),
          advanceBalance: 0,
          amount: 0,
          paidAt: new Date(),
          paymentMethod: 'cash',
          paymentNote: '',
        },
      ],
      additionalNotes: '',
    });
    setError(null);
    setSuccess(null);
  }, []);

  return {
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
    updatePayment,
    updatePaymentByIndex,
    addPayment,
    removePayment,
    submitPurchase,
    resetForm,
  };
}
