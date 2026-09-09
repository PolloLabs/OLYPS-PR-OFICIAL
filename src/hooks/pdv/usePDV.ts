import { useState, useCallback, useEffect } from 'react';
import { PDVItem, PDVFormaPagamento, PDVData } from '../../types/pdv.types.js';

export function usePDV(companyId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<PDVItem[]>([]);
  const [cliente, setCliente] = useState<string>('');
  const [desconto, setDesconto] = useState<number>(0);
  const [cashBack, setCashBack] = useState<number>(0);
  const [imposto, setImposto] = useState<number>(0);
  const [envio, setEnvio] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Carregar configuração ao montar
  useEffect(() => {
    const loadSoundConfig = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/invoice-settings`);
        if (response.ok) {
          const data = await response.json();
          setSoundEnabled(data.soundEnabled !== false); // default true
        }
      } catch (err) {
        console.error('Erro ao carregar config de som:', err);
      }
    };
    loadSoundConfig();
  }, [companyId]);

  // Função de som CORRETA (Web Audio API)
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return; // Respeita configuração
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API não suportado');
        return;
      }
      
      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (duration / 1000));
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + (duration / 1000));
      
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, duration + 100);
  } catch (error) {
    console.error('Erro ao tocar som:', error);
  }
}, [soundEnabled]);

const playSuccessSound = useCallback(() => playSound(800, 200, 'sine'), [playSound]);
const playErrorSound = useCallback(() => playSound(400, 500, 'triangle'), [playSound]);
const playBeepSound = useCallback(() => playSound(600, 150, 'sine'), [playSound]);

  // Calcular totais
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - desconto - cashBack + imposto + envio;

  // Adicionar item
  const addItem = useCallback((product: any) => {
    try {
      const existingItem = items.find(item => item.productId === product.id);
      
      if (existingItem) {
        setItems(items.map(item =>
          item.productId === product.id
            ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.precoUnitario }
            : item
        ));
      } else {
        const newItem: PDVItem = {
          id: crypto.randomUUID(),
          productId: product.id,
          nome: product.name || product.nome || 'Produto',
          sku: product.sku || product.codigo,
          precoUnitario: product.price || product.preco || 0,
          quantidade: 1,
          subtotal: product.price || product.preco || 0,
          imTaxPrice: 0,
          // Compatibilidade com POSItem
          productName: product.name || product.nome || 'Produto',
          code: product.code || product.codigo || product.sku || '',
          quantity: 1,
          unitPrice: product.price || product.preco || 0,
          discount: 0,
          taxRate: 0,
        };
        setItems([...items, newItem]);
      }
      
      playSuccessSound();
      setError(null);
    } catch (err) {
      setError('Erro ao adicionar produto: ' + (err as Error).message);
      playErrorSound();
    }
  }, [items, playSuccessSound, playErrorSound]);

  // Remover item
  const removeItem = useCallback((index: number) => {
    try {
      setItems(items.filter((_, i) => i !== index));
      playBeepSound();
    } catch (err) {
      setError('Erro ao remover produto');
      playErrorSound();
    }
  }, [items, playBeepSound, playErrorSound]);

  // Atualizar quantidade
  const updateQuantity = useCallback((index: number, quantidade: number) => {
    if (quantidade < 1) return;
    
    try {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        quantidade,
        subtotal: quantidade * newItems[index].precoUnitario,
      };
      setItems(newItems);
    } catch (err) {
      setError('Erro ao atualizar quantidade');
      playErrorSound();
    }
  }, [items, playErrorSound]);

  // Completar venda
  const handleCompleteSale = useCallback(async (formaPagamento: string, pagamentoData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      if (items.length === 0) {
        setError('Adicione produtos antes de concluir a venda');
        playErrorSound();
        return false;
      }

      const total = subtotal - desconto - cashBack + imposto + envio;

      const pdvData = {
        companyId,
        cliente,
        items,
        subtotal,
        desconto,
        cashBack,
        imposto,
        envio,
        total,
        formaPagamento,
        ...pagamentoData,
        dataVenda: new Date().toISOString(),
      };

      const response = await fetch(`/api/companies/${companyId}/pdv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdvData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao salvar venda');
      }

      const vendaSalva = await response.json();
      
      // SUCESSO: Tocar som e preparar impressão
      playSuccessSound();
      
      // Aguardar renderização e imprimir automaticamente
      setTimeout(() => {
        window.print();
        
        // Limpar carrinho após impressão
        setTimeout(() => {
          setItems([]);
          setDesconto(0);
          setCashBack(0);
          setImposto(0);
          setEnvio(0);
          setCliente('');
          setError(null);
        }, 1000);
      }, 500);

      return vendaSalva;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      playErrorSound();
      return false;
    } finally {
      setLoading(false);
    }
  }, [companyId, cliente, items, subtotal, desconto, cashBack, imposto, envio, playSuccessSound, playErrorSound]);

  // Imprimir cupom
  const handlePrint = useCallback(() => {
    if (items.length === 0) {
      setError('Adicione produtos antes de imprimir');
      playErrorSound();
      return;
    }
    
    playSuccessSound();
    window.print();
  }, [items, playSuccessSound, playErrorSound]);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    try {
      setItems([]);
      setDesconto(0);
      setCashBack(0);
      setImposto(0);
      setEnvio(0);
      setCliente('');
      setError(null);
      setSuccess(null);
      playBeepSound();
    } catch (err) {
      setError('Erro ao limpar carrinho');
      playErrorSound();
    }
  }, [playBeepSound, playErrorSound]);

  return {
    loading,
    error,
    success,
    items,
    cliente,
    desconto,
    cashBack,
    imposto,
    envio,
    subtotal,
    total,
    soundEnabled,
    setSoundEnabled,
    setCliente,
    setDesconto,
    setCashBack,
    setImposto,
    setEnvio,
    addItem,
    removeItem,
    updateQuantity,
    handleCompleteSale,
    handlePrint,
    clearCart,
    playSuccessSound,
    playErrorSound,
    playBeepSound,
  };
}

export default usePDV;
export { playSuccessSound, playErrorSound, playBeepSound, playScanSound } from '../../utils/sounds.js';
