import { useState, useCallback, useEffect } from 'react';
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
  const [isReadyToPrint, setIsReadyToPrint] = useState(false);

  // Quando o modal abre, aguardar renderização completa antes de permitir impressão
  useEffect(() => {
    if (isReceiptModalOpen) {
      // Aguardar 2 ciclos de renderização para garantir que o elemento está no DOM
      const timer1 = setTimeout(() => {
        setIsReadyToPrint(true);
      }, 100);
      
      return () => clearTimeout(timer1);
    } else {
      setIsReadyToPrint(false);
    }
  }, [isReceiptModalOpen]);

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
      // A impressão será disparada automaticamente quando isReadyToPrint for true
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
    setIsReadyToPrint(false);
  }, []);

  const triggerPrint = useCallback(() => {
    if (!isReadyToPrint) {
      console.warn('Impressão ainda não está pronta. Aguarde a renderização.');
      return;
    }
    
    // Verificar se o elemento de impressão existe no DOM
    const printElement = document.getElementById('pos-print-receipt-container');
    if (!printElement) {
      console.error('Elemento de impressão não encontrado no DOM!');
      onNotification?.({
        type: 'error',
        message: 'Erro ao imprimir',
        description: 'Não foi possível encontrar o cupom na página.',
      });
      return;
    }

    try {
      window.print();
    } catch (err) {
      console.warn('Erro ao chamar window.print():', err);
    }
  }, [isReadyToPrint, onNotification]);

  return {
    isReceiptModalOpen,
    isReadyToPrint,
    handlePrint,
    triggerPrint,
    openReceiptModal,
    closeReceiptModal,
  };
};
