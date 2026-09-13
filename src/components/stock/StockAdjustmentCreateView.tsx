import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Search,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  Loader2,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import type { StockAdjustmentType } from '../../types/stockAdjustment.types.js';
import type { CommercialLocation, Product } from '../../types/index.js';

interface StockAdjustmentCreateViewProps {
  companyId: string;
  onNavigateToList: () => void;
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

interface FormItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string | null;
  currentStock: number;
  quantity: number; // can be positive or negative
  unitCost: number;
}

export const StockAdjustmentCreateView: React.FC<StockAdjustmentCreateViewProps> = ({
  companyId,
  onNavigateToList,
  onShowNotification,
}) => {
  // Form fields
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [isLoadingRef, setIsLoadingRef] = useState<boolean>(true);
  const [adjustmentDate, setAdjustmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [locationId, setLocationId] = useState<string>('');
  const [type, setType] = useState<StockAdjustmentType>('normal');
  const [reason, setReason] = useState<string>('');
  const [totalRecovered, setTotalRecovered] = useState<number>(0);
  const [items, setItems] = useState<FormItem[]>([]);

  // Locations & Products data
  const [locations, setLocations] = useState<CommercialLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);

  // Autocomplete search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Validation & Saving
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1. Fetch next sequential reference number
  useEffect(() => {
    let isMounted = true;
    async function fetchNextRef() {
      try {
        setIsLoadingRef(true);
        const res = await fetch(`/api/companies/${companyId}/stock-adjustments/next-reference`);
        const data = await res.json();
        if (isMounted && data.success && data.data?.referenceNumber) {
          setReferenceNumber(data.data.referenceNumber);
        } else if (isMounted) {
          setReferenceNumber('AJE-0001');
        }
      } catch {
        if (isMounted) setReferenceNumber('AJE-0001');
      } finally {
        if (isMounted) setIsLoadingRef(false);
      }
    }
    fetchNextRef();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  // 2. Fetch locations
  useEffect(() => {
    let isMounted = true;
    async function fetchLocations() {
      try {
        setIsLoadingLocations(true);
        const res = await fetch(`/api/companies/${companyId}/locations`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data)) {
          setLocations(data.data);
          if (data.data.length > 0) {
            const mainLoc = data.data.find((l: CommercialLocation) => l.isMain) || data.data[0];
            setLocationId(mainLoc.id);
          }
        }
      } catch {
        // Falha silenciosa
      } finally {
        if (isMounted) setIsLoadingLocations(false);
      }
    }
    fetchLocations();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  // 3. Autocomplete products search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `/api/companies/${companyId}/products?search=${encodeURIComponent(
            searchQuery.trim()
          )}&pageSize=10`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSearchResults(data.data);
          setIsDropdownOpen(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [companyId, searchQuery]);

  // Close autocomplete on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Adicionar produto da busca à tabela de itens
  const handleSelectProduct = (product: Product) => {
    const existingIndex = items.findIndex((i) => i.productId === product.id);
    if (existingIndex >= 0) {
      // Já está na tabela: incrementa a quantidade em 1
      setItems((prev) =>
        prev.map((item, idx) => {
          if (idx === existingIndex) {
            const newQty = item.quantity >= 0 ? item.quantity + 1 : item.quantity - 1;
            return { ...item, quantity: newQty };
          }
          return item;
        })
      );
    } else {
      // Determina custo unitário inicial
      const costPrice =
        Number(product.defaultPurchasePrice) ||
        Number(product.defaultSalePrice) * 0.7 ||
        0;

      // Se o tipo for anormal, padrão negativo (-1); se normal, padrão positivo (+1)
      const initialQty = type === 'abnormal' ? -1 : 1;

      const newItem: FormItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku || `SKU-${product.id.slice(0, 6)}`,
        barcode: product.barcode || null,
        currentStock: Number(product.currentStock || 0),
        quantity: initialQty,
        unitCost: costPrice,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Alterar quantidade de um item
  const handleQuantityChange = (index: number, val: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: val } : item))
    );
  };

  // Alterar preço unitário de um item
  const handleUnitCostChange = (index: number, val: number) => {
    const safeVal = isNaN(val) ? 0 : Math.max(0, val);
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, unitCost: safeVal } : item))
    );
  };

  // Remover item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Cálculos ao vivo
  const calculatedTotalAmount = items.reduce((acc, item) => {
    return acc + Math.abs(item.quantity) * (item.unitCost || 0);
  }, 0);

  // Atualizar sugestão de total recuperado quando o tipo ou total mudar
  useEffect(() => {
    if (type === 'abnormal' && totalRecovered === 0 && calculatedTotalAmount > 0) {
      // Sugere 30% como recuperação inicial padrão se ainda estiver zerado
      setTotalRecovered(Math.round(calculatedTotalAmount * 0.3 * 100) / 100);
    } else if (type === 'normal') {
      setTotalRecovered(0);
    }
  }, [type, calculatedTotalAmount]);

  // Validações
  const errors = {
    referenceNumber: !referenceNumber.trim() ? 'O número de referência é obrigatório.' : '',
    adjustmentDate: !adjustmentDate ? 'A data do ajuste é obrigatória.' : '',
    locationId: !locationId ? 'Selecione uma localização/loja.' : '',
    items: items.length === 0 ? 'Adicione ao menos um produto para o ajuste.' : '',
    reason:
      type === 'abnormal' && !reason.trim()
        ? 'A razão do ajuste é obrigatória para ajustes anormais (avaria, perda, furto).'
        : '',
  };

  const isFormValid =
    !errors.referenceNumber &&
    !errors.adjustmentDate &&
    !errors.locationId &&
    !errors.items &&
    !errors.reason;

  // Submissão do Ajuste
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      referenceNumber: true,
      adjustmentDate: true,
      locationId: true,
      items: true,
      reason: true,
    });

    if (!isFormValid) {
      onShowNotification('error', 'Por favor, corrija os campos obrigatórios destacados.');
      return;
    }

    const selectedLoc = locations.find((l) => l.id === locationId);

    setIsSubmitting(true);
    try {
      const payload = {
        referenceNumber: referenceNumber.trim(),
        adjustmentDate,
        locationId,
        locationName: selectedLoc?.name || 'Loja Principal',
        type,
        totalAmount: calculatedTotalAmount,
        totalRecovered: type === 'abnormal' ? Number(totalRecovered) : 0,
        reason: reason.trim(),
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          barcode: item.barcode,
          currentStock: item.currentStock,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      };

      const res = await fetch(`/api/companies/${companyId}/stock-adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Erro ao salvar ajuste de estoque.');
      }

      onShowNotification('success', 'Ajuste de estoque registrado com sucesso!');
      onNavigateToList();
    } catch (err: any) {
      onShowNotification('error', err.message || 'Falha ao registrar ajuste de estoque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="stock-adjustment-create-view" className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-back-to-list"
            onClick={onNavigateToList}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl border border-slate-200/80 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-6 h-6 text-blue-600" />
              Adicionar Ajuste de Estoque
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Lance ajustes manuais de estoque, inventário ou perdas com atualização imediata no saldo dos produtos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToList}
          className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SEÇÃO 1: Cabeçalho & Dados Principais */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            1. Informações Básicas do Ajuste
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nº de Referência */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nº de Referência <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="input-reference-number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, referenceNumber: true }))}
                  placeholder="Ex: AJE-0001"
                  className={`w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 ${
                    touched.referenceNumber && errors.referenceNumber
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                      : 'border-slate-200'
                  }`}
                />
                {isLoadingRef && (
                  <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 top-3" />
                )}
              </div>
              {touched.referenceNumber && errors.referenceNumber && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {errors.referenceNumber}
                </p>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Data do Ajuste <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="input-adjustment-date"
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, adjustmentDate: true }))}
                  className={`w-full text-xs px-3.5 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 ${
                    touched.adjustmentDate && errors.adjustmentDate
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                      : 'border-slate-200'
                  }`}
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
              {touched.adjustmentDate && errors.adjustmentDate && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {errors.adjustmentDate}
                </p>
              )}
            </div>

            {/* Localização / Loja */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Localização / Loja <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="select-location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, locationId: true }))}
                  disabled={isLoadingLocations}
                  className={`w-full text-xs px-3.5 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 ${
                    touched.locationId && errors.locationId
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                      : 'border-slate-200'
                  }`}
                >
                  <option value="">Selecione uma loja...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.isMain ? '(Principal)' : ''}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
              {touched.locationId && errors.locationId && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {errors.locationId}
                </p>
              )}
            </div>

            {/* Tipo de Ajuste em Controle Segmentado */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipo de Ajuste <span className="text-rose-500">*</span>
              </label>
              <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  type="button"
                  id="btn-type-normal"
                  onClick={() => setType('normal')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'normal'
                      ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Normal</span>
                </button>
                <button
                  type="button"
                  id="btn-type-abnormal"
                  onClick={() => setType('abnormal')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    type === 'abnormal'
                      ? 'bg-white text-rose-700 shadow-2xs border border-rose-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Anormal</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {type === 'normal'
                  ? 'Inventário periódico ou conferência de rotina.'
                  : 'Avaria, dano físico, vencimento ou furto.'}
              </p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: Busca de Produtos com Autocomplete */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              2. Itens do Ajuste
            </h2>
            <span className="text-xs text-slate-500">
              Produtos adicionados: <strong>{items.length}</strong>
            </span>
          </div>

          {/* Autocomplete Search Bar */}
          <div ref={searchContainerRef} className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                id="input-product-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setIsDropdownOpen(true);
                }}
                placeholder="Buscar produto por nome, SKU ou código de barras para adicionar..."
                className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 shadow-2xs placeholder:text-slate-400"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3.5 top-2.5" />
              )}
            </div>

            {/* Dropdown Results */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelectProduct(prod)}
                    className="w-full text-left p-3 hover:bg-blue-50/60 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                        {prod.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">SKU: {prod.sku || '—'}</span>
                        {prod.barcode && <span>| EAN: {prod.barcode}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-500 block">Estoque Atual:</span>
                      <span className="text-xs font-bold text-slate-800">
                        {prod.currentStock || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isDropdownOpen && !isSearching && searchQuery.trim() && searchResults.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 z-30 p-4 text-center text-xs text-slate-500">
                Nenhum produto encontrado com o termo "{searchQuery}".
              </div>
            )}
          </div>

          {touched.items && errors.items && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errors.items}</span>
            </div>
          )}

          {/* Tabela de Itens Ajustados */}
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Nenhum produto adicionado ao ajuste.</p>
              <p className="text-[11px] text-slate-400">
                Use a caixa de busca acima para localizar e adicionar itens à conferência de estoque.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="px-3.5 py-3">Produto</th>
                      <th className="px-3 py-3">SKU</th>
                      <th className="px-3 py-3 text-center">Estoque Atual</th>
                      <th className="px-3 py-3 text-center min-w-[140px]">Qtd a Ajustar (+/−)</th>
                      <th className="px-3 py-3 text-center">Estoque Após Ajuste</th>
                      <th className="px-3 py-3 text-right">Preço Unit. (R$)</th>
                      <th className="px-3 py-3 text-right">Subtotal</th>
                      <th className="px-3 py-3 text-center w-12">Remover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, index) => {
                      const stockAfter = item.currentStock + item.quantity;
                      const isIncreasing = item.quantity > 0;
                      const subtotal = Math.abs(item.quantity) * item.unitCost;

                      return (
                        <tr key={item.productId} className="hover:bg-slate-50/50">
                          {/* Produto */}
                          <td className="px-3.5 py-3 font-semibold text-slate-800">
                            {item.productName}
                          </td>

                          {/* SKU */}
                          <td className="px-3 py-3 font-mono text-[11px] text-slate-500">
                            {item.sku}
                          </td>

                          {/* ESTOQUE ATUAL */}
                          <td className="px-3 py-3 text-center font-bold text-slate-700 bg-slate-50/60">
                            {item.currentStock}
                          </td>

                          {/* QTD A AJUSTAR (+/- com Stepper e Input) */}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold"
                                title="Diminuir"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                type="number"
                                step="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(index, parseInt(e.target.value, 10) || 0)
                                }
                                className={`w-16 text-center text-xs font-bold py-1 px-1 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  isIncreasing
                                    ? 'text-emerald-700 bg-emerald-50/40 border-emerald-300'
                                    : item.quantity < 0
                                    ? 'text-rose-700 bg-rose-50/40 border-rose-300'
                                    : 'text-slate-700 bg-slate-50 border-slate-200'
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold"
                                title="Aumentar"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* ESTOQUE APÓS AJUSTE (Calculado ao vivo) */}
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                stockAfter < 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : isIncreasing
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {stockAfter}
                            </span>
                          </td>

                          {/* Preço Unitário */}
                          <td className="px-3 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) =>
                                handleUnitCostChange(index, parseFloat(e.target.value) || 0)
                              }
                              className="w-24 text-right text-xs font-medium py-1 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 text-slate-800"
                            />
                          </td>

                          {/* Subtotal */}
                          <td className="px-3 py-3 text-right font-bold text-slate-800">
                            {Number(subtotal).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>

                          {/* Remover */}
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remover produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 3: Razão & Totais ao Vivo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Razão do Ajuste */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Motivo / Razão do Ajuste{' '}
              {type === 'abnormal' ? (
                <span className="text-rose-500 font-semibold normal-case">
                  (Obrigatório para tipo Anormal)*
                </span>
              ) : (
                <span className="text-slate-400 font-normal normal-case">(Opcional)</span>
              )}
            </label>

            <textarea
              id="textarea-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, reason: true }))}
              placeholder={
                type === 'abnormal'
                  ? 'Descreva a ocorrência que justificou o ajuste (ex: lote avariado durante descarga, extravio identificado em auditoria, produto vencido descartado)...'
                  : 'Observações complementares sobre a conferência ou contagem de estoque (opcional)...'
              }
              className={`w-full text-xs p-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none ${
                touched.reason && errors.reason
                  ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                  : 'border-slate-200'
              }`}
            />

            {touched.reason && errors.reason && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errors.reason}
              </p>
            )}
          </div>

          {/* Card de Totais ao Vivo */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Totais em Tempo Real
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
                  <span className="text-slate-500">Itens no Lote:</span>
                  <span className="font-bold text-slate-800">{items.length} produto(s)</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Valor Total Ajustado:</span>
                  <span className="text-base font-bold text-slate-900">
                    {Number(calculatedTotalAmount).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>

                {type === 'abnormal' && (
                  <div className="pt-1">
                    <label className="block text-xs font-bold text-emerald-800 mb-1">
                      Valor Total Recuperado (R$):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      id="input-total-recovered"
                      value={totalRecovered}
                      onChange={(e) => setTotalRecovered(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-bold px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800"
                    />
                    <p className="text-[10px] text-emerald-600 mt-1">
                      Indenizações, salvados ou ressarcimentos obtidos.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações do Formulário */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onNavigateToList}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                id="btn-save-stock-adjustment"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Ajuste</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
