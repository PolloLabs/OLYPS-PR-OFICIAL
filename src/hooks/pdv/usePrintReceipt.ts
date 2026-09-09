import { useState, useCallback } from 'react';
import type { POSItem, CompletedSaleReceipt } from '../../types/pdv.types.js';

interface UsePrintReceiptOptions {
  items: POSItem[];
  completedSaleReceipt?: CompletedSaleReceipt | null;
  onNotification?: (n: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

export const usePrintReceipt = ({ items, completedSaleReceipt, onNotification }: UsePrintReceiptOptions) => {
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handlePrint = useCallback(() => {
    const hasItems = (items && items.length > 0) || (completedSaleReceipt && completedSaleReceipt.items.length > 0);
    if (!hasItems) {
      onNotification?.({
        type: 'error',
        message: 'Adicione produtos antes de imprimir',
        description: 'O carrinho está vazio. Adicione pelo menos um item para imprimir o cupom.',
      });
      return false;
    }

    // Abre o diálogo de impressão do navegador com fallback seguro
    try {
      setIsReceiptModalOpen(true);
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.warn('Erro ao chamar window.print():', err);
        }
      }, 300);
    } catch (e) {
      console.error('Falha ao abrir impressão:', e);
    }
    return true;
  }, [items, completedSaleReceipt, onNotification]);

  const openReceiptModal = useCallback(() => {
    const hasItems = (items && items.length > 0) || (completedSaleReceipt && completedSaleReceipt.items.length > 0);
    if (!hasItems) {
      onNotification?.({
        type: 'error',
        message: 'Adicione produtos antes de imprimir',
        description: 'O carrinho está vazio.',
      });
      return;
    }
    setIsReceiptModalOpen(true);
  }, [items, completedSaleReceipt, onNotification]);

  const closeReceiptModal = useCallback(() => {
    setIsReceiptModalOpen(false);
  }, []);

  return {
    isReceiptModalOpen,
    handlePrint,
    openReceiptModal,
    closeReceiptModal,
  };
};
