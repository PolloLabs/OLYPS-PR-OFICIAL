import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit2,
  Copy,
  Trash2,
  AlertTriangle,
  Layers,
  Building2,
  Tag,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Barcode,
  Smartphone,
} from 'lucide-react';
import type {
  Product,
  Category,
  Brand,
  Unit,
  DeviceBrand,
  DeviceModel,
  CommercialLocation,
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
  CatalogModel,
  CatalogColor,
  CatalogSize,
} from '../../types/index.js';
import { ProductFormModal } from './ProductFormModal.js';
import { ProductDetailsModal } from './ProductDetailsModal.js';
import { StockOpeningModal } from './StockOpeningModal.js';

interface ProductsListViewProps {
  companyId: string;
  initialAddModalOpen?: boolean;
}

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('olyps_auth_token') || '' : '';
  const headers = new Headers(options.headers || {});
  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  return fetch(url, {
    ...options,
    headers,
  });
};

const getErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const data = await res.json();
    return data?.error?.message || data?.message || fallback;
  } catch {
    return fallback;
  }
};

export const ProductsListView: React.FC<ProductsListViewProps> = ({
  companyId,
  initialAddModalOpen = false,
}) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [locations, setLocations] = useState<CommercialLocation[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [colors, setColors] = useState<CatalogColor[]>([]);
  const [sizes, setSizes] = useState<CatalogSize[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // Selection for Batch
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(initialAddModalOpen);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Notification Toast state
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Auxiliary Data
  const fetchAuxiliaryData = async () => {
    try {
      const [catRes, brandRes, unitRes, devBrandRes, devModelRes, locRes, modelRes, colorRes, sizeRes] = await Promise.all([
        apiFetch(`/api/companies/${companyId}/categories`),
        apiFetch(`/api/companies/${companyId}/brands`),
        apiFetch(`/api/companies/${companyId}/units`),
        apiFetch(`/api/companies/${companyId}/device-brands`),
        apiFetch(`/api/companies/${companyId}/device-models`),
        apiFetch(`/api/companies/${companyId}/locations`),
        apiFetch(`/api/companies/${companyId}/models`),
        apiFetch(`/api/companies/${companyId}/colors`),
        apiFetch(`/api/companies/${companyId}/sizes`),
      ]);

      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.data || []);
      }
      if (brandRes.ok) {
        const d = await brandRes.json();
        setBrands(d.data || []);
      }
      if (unitRes.ok) {
        const d = await unitRes.json();
        setUnits(d.data || []);
      }
      if (devBrandRes.ok) {
        const d = await devBrandRes.json();
        setDeviceBrands(d.data || []);
      }
      if (devModelRes.ok) {
        const d = await devModelRes.json();
        setDeviceModels(d.data || []);
      }
      if (locRes.ok) {
        const d = await locRes.json();
        setLocations(d.data || []);
      } else {
        // Fallback default main location if locations endpoint not yet populated
        setLocations([
          {
            id: 'loc-matriz',
            companyId,
            name: 'Matriz Principal',
            isMain: true,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
      if (modelRes.ok) {
        const d = await modelRes.json();
        setModels(d.data || []);
      }
      if (colorRes.ok) {
        const d = await colorRes.json();
        setColors(d.data || []);
      }
      if (sizeRes.ok) {
        const d = await sizeRes.json();
        setSizes(d.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares de produtos:', err);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedBrand) params.append('brandId', selectedBrand);
      if (selectedType) params.append('productType', selectedType);
      if (selectedStatus === 'active') params.append('active', 'true');
      if (selectedStatus === 'inactive') params.append('active', 'false');
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const res = await apiFetch(`/api/companies/${companyId}/products?${params.toString()}`);
      if (!res.ok) {
        const errMsg = await getErrorMessage(res, 'Falha ao carregar lista de produtos.');
        throw new Error(errMsg);
      }
      const data = await res.json();
      setProducts(data.data || []);
      if (data.meta) {
        setTotalPages(data.meta.totalPages || 1);
        setTotalCount(data.meta.total || 0);
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao buscar produtos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuxiliaryData();
  }, [companyId]);

  useEffect(() => {
    fetchProducts();
  }, [companyId, searchQuery, selectedCategory, selectedBrand, selectedType, selectedStatus, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const lowStock = products.filter((p) => p.manageStock && (p.currentStock ?? 0) <= p.alertQuantity).length;
    const totalVariations = products.reduce((acc, p) => acc + (p.variations?.length || 1), 0);
    return { total, active, lowStock, totalVariations };
  }, [products]);

  // Form Save Handler
  const handleSaveProduct = async (
    payload: CreateProductPayload | UpdateProductPayload,
    actionType: 'save' | 'save_and_stock' | 'save_and_new'
  ) => {
    let savedProduct: Product | null = null;
    if (productToEdit && !isCopying) {
      const res = await apiFetch(`/api/companies/${companyId}/products/${productToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errMsg = await getErrorMessage(res, 'Erro ao atualizar produto.');
        throw new Error(errMsg);
      }
      const data = await res.json();
      savedProduct = data.data;
      showToast('Produto atualizado com sucesso!');
    } else {
      const res = await apiFetch(`/api/companies/${companyId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errMsg = await getErrorMessage(res, isCopying ? 'Erro ao copiar produto.' : 'Erro ao criar produto.');
        throw new Error(errMsg);
      }
      const data = await res.json();
      savedProduct = data.data;
      showToast(isCopying ? 'Produto copiado com sucesso!' : 'Produto cadastrado com sucesso!');
    }

    await fetchProducts();

    if (actionType === 'save_and_stock' && savedProduct) {
      setStockProduct(savedProduct);
    }
  };

  // Duplicate / Copy Product Handler: opens form pre-filled with clean initial stock for new product
  const handleDuplicate = async (product: Product) => {
    try {
      const res = await apiFetch(`/api/companies/${companyId}/products/${product.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProductToEdit(json.data);
          setIsCopying(true);
          setIsFormModalOpen(true);
          return;
        }
      }
      setProductToEdit(product);
      setIsCopying(true);
      setIsFormModalOpen(true);
    } catch {
      setProductToEdit(product);
      setIsCopying(true);
      setIsFormModalOpen(true);
    }
  };

  // Delete Product Handler
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      const res = await apiFetch(`/api/companies/${companyId}/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errMsg = await getErrorMessage(res, 'Erro ao excluir produto.');
        throw new Error(errMsg);
      }
      showToast('Produto excluído com sucesso!');
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Batch Action Handler
  const handleBatchAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;
    try {
      const res = await apiFetch(`/api/companies/${companyId}/products/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedIds, action }),
      });
      if (!res.ok) {
        const errMsg = await getErrorMessage(res, 'Falha ao processar ação em lote.');
        throw new Error(errMsg);
      }
      showToast(`Ação em lote aplicada com sucesso em ${selectedIds.length} produtos!`);
      setSelectedIds([]);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Stock Opening Save
  const handleSaveStock = async (items: { locationId: string; quantity: number; rackLocation?: string }[]) => {
    if (!stockProduct) return;
    const res = await apiFetch(`/api/companies/${companyId}/products/${stockProduct.id}/stock-opening`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, 'Erro ao salvar estoque inicial.');
      throw new Error(errMsg);
    }
    showToast('Estoque inicial gravado com sucesso!');
    fetchProducts();
  };

  // Quick Create Helpers
  const handleQuickCategory = async (catName: string, code?: string) => {
    const res = await apiFetch(`/api/companies/${companyId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName.trim(), code: code?.trim() || undefined }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, 'Erro ao cadastrar categoria.');
      throw new Error(errMsg);
    }
    const d = await res.json();
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === d.data.id);
      return exists ? prev : [...prev, d.data];
    });
    return d.data;
  };

  const handleQuickBrand = async (brandName: string) => {
    const res = await apiFetch(`/api/companies/${companyId}/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: brandName.trim() }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, 'Erro ao cadastrar marca.');
      throw new Error(errMsg);
    }
    const d = await res.json();
    setBrands((prev) => {
      const exists = prev.some((b) => b.id === d.data.id);
      return exists ? prev : [...prev, d.data];
    });
    return d.data;
  };

  const handleQuickUnit = async (uName: string, shortName: string) => {
    const res = await apiFetch(`/api/companies/${companyId}/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: uName.trim(), shortName: shortName.trim() }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, 'Erro ao cadastrar unidade.');
      throw new Error(errMsg);
    }
    const d = await res.json();
    setUnits((prev) => {
      const exists = prev.some((u) => u.id === d.data.id);
      return exists ? prev : [...prev, d.data];
    });
    return d.data;
  };

  const handleQuickDeviceModel = async (bId: string, modelName: string) => {
    const res = await apiFetch(`/api/companies/${companyId}/device-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceBrandId: bId, name: modelName.trim() }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, 'Erro ao cadastrar modelo de dispositivo.');
      throw new Error(errMsg);
    }
    const d = await res.json();
    setDeviceModels((prev) => {
      const exists = prev.some((dm) => dm.id === d.data.id);
      return exists ? prev : [...prev, d.data];
    });
    return d.data;
  };

  const handleQuickModel = async (modelName: string, brandId?: string, technicalCode?: string) => {
    const res = await apiFetch(`/api/companies/${companyId}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName.trim(), brandId: brandId || undefined, technicalCode: technicalCode?.trim() || undefined }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, 'Erro ao cadastrar modelo.');
      throw new Error(errMsg);
    }
    const d = await res.json();
    setModels((prev) => {
      const exists = prev.some((m) => m.id === d.data.id);
      return exists ? prev : [...prev, d.data];
    });
    return d.data;
  };

  const handleQuickColor = async (colorName: string, hex?: string) => {
    const res = await apiFetch(`/api/companies/${companyId}/colors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: colorName.trim(), hex: hex?.trim() || undefined }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, 'Erro ao cadastrar cor.');
      throw new Error(errMsg);
    }
    const d = await res.json();
    setColors((prev) => {
      const exists = prev.some((c) => c.id === d.data.id);
      return exists ? prev : [...prev, d.data];
    });
    return d.data;
  };

  const handleQuickSize = async (sizeName: string, code?: string) => {
    const res = await apiFetch(`/api/companies/${companyId}/sizes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sizeName.trim(), code: code?.trim() || undefined }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, 'Erro ao cadastrar tamanho.');
      throw new Error(errMsg);
    }
    const d = await res.json();
    setSizes((prev) => {
      const exists = prev.some((s) => s.id === d.data.id);
      return exists ? prev : [...prev, d.data];
    });
    return d.data;
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatMoney = (val?: number | null) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-60 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center space-x-2 transition-all duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-800 text-white'
              : 'bg-rose-800 text-white'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catálogo de Produtos</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {totalCount} cadastrados
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie itens simples, variações de grade, kits/combos, preços de venda e saldos por filial.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchProducts()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsCopying(false);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Produto</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total de Produtos</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Itens mestres no catálogo</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-emerald-600">Produtos Ativos</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</p>
          <span className="text-[11px] text-emerald-600">Disponíveis no sistema</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600">Alerta de Estoque Baixo</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.lowStock}</p>
          <span className="text-[11px] text-amber-600">Abaixo da quantidade mínima</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-purple-600">Variações / SKUs</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{stats.totalVariations}</p>
          <span className="text-[11px] text-purple-600">Grades & Variações ativas</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nome, SKU ou código de barras..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Categoria */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white text-slate-700"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white text-slate-700"
            >
              <option value="">Todas as Marcas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Produto */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white text-slate-700"
            >
              <option value="">Todos os Tipos</option>
              <option value="single">Simples</option>
              <option value="variable">Variável</option>
              <option value="combo">Combo / Kit</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white text-slate-700"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Somente Ativos</option>
              <option value="inactive">Somente Inativos</option>
            </select>
          </div>
        </div>

        {/* Batch Actions Bar (Visible when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in duration-100">
            <span className="text-xs font-semibold text-emerald-900">
              {selectedIds.length} produto(s) selecionado(s)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBatchAction('activate')}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 rounded"
              >
                Ativar
              </button>
              <button
                onClick={() => handleBatchAction('deactivate')}
                className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-white hover:bg-amber-100 border border-amber-300 rounded"
              >
                Desativar
              </button>
              <button
                onClick={() => handleBatchAction('delete')}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 rounded"
              >
                Excluir Selecionados
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={toggleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left">Produto & Identificação</th>
                <th className="px-4 py-3 text-left">Classificação</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-right">Preço de Custo</th>
                <th className="px-4 py-3 text-right">Preço de Venda</th>
                <th className="px-4 py-3 text-right">Estoque Atual</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center w-28">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Carregando produtos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhum produto encontrado.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Clique no botão "Adicionar Produto" para criar o primeiro item do catálogo.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const isLowStock = product.manageStock && (product.currentStock ?? 0) <= product.alertQuantity;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(product.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                      </td>

                      {/* Product Name & SKU */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-9 h-9 rounded object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{product.name}</span>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                              <span>SKU: {product.sku}</span>
                              {product.barcode && (
                                <>
                                  <span>&bull;</span>
                                  <span>{product.barcode}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classification */}
                      <td className="px-4 py-3">
                        <span className="text-slate-800 font-medium block">
                          {product.categoryName || 'Geral'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {product.brandName || 'Sem marca'}
                          {product.modelName ? ` • ${product.modelName}` : ''}
                          {product.colorName ? ` • ${product.colorName}` : ''}
                          {product.sizeName ? ` • ${product.sizeName}` : ''}
                          {' '}&bull; {product.unitShortName || 'Un'}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3">
                        {product.productType === 'variable' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            Variável ({product.variations?.length || 0})
                          </span>
                        ) : product.productType === 'combo' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Combo / Kit
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Simples
                          </span>
                        )}
                      </td>

                      {/* Purchase Cost */}
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatMoney(product.defaultPurchasePrice)}
                      </td>

                      {/* Sale Price & Margin */}
                      <td className="px-4 py-3 text-right font-mono">
                        <span className="font-bold text-emerald-700">
                          {formatMoney(product.defaultSalePrice)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {product.marginPercent}% mg
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-right font-mono">
                        <span
                          className={`font-bold ${
                            isLowStock ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded' : 'text-slate-800'
                          }`}
                        >
                          {product.currentStock ?? 0} {product.unitShortName || 'Un'}
                        </span>
                        {isLowStock && (
                          <span className="block text-[10px] text-rose-500 font-sans font-semibold">
                            Baixo estoque
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            product.active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setDetailsProduct(product)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToEdit(product);
                              setIsCopying(false);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100"
                            title="Editar Produto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStockProduct(product)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                            title="Ajustar Estoque / Prateleiras"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-1 text-slate-400 hover:text-purple-600 rounded hover:bg-slate-100"
                            title="Duplicar Produto"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalCount} total)
          </span>
          <div className="flex items-center space-x-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: OFFICIAL PRODUCT FORM */}
      {isFormModalOpen && (
        <ProductFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setProductToEdit(null);
            setIsCopying(false);
          }}
          productToEdit={productToEdit}
          isCopying={isCopying}
          companyId={companyId}
          locations={locations}
          categories={categories}
          brands={brands}
          units={units}
          models={models}
          colors={colors}
          sizes={sizes}
          deviceBrands={deviceBrands}
          deviceModels={deviceModels}
          onSave={handleSaveProduct}
          onQuickCreateCategory={handleQuickCategory}
          onQuickCreateBrand={handleQuickBrand}
          onQuickCreateModel={handleQuickModel}
          onQuickCreateColor={handleQuickColor}
          onQuickCreateSize={handleQuickSize}
          onQuickCreateUnit={handleQuickUnit}
          onQuickCreateDeviceModel={handleQuickDeviceModel}
        />
      )}

      {/* MODAL: PRODUCT DETAILS */}
      {detailsProduct && (
        <ProductDetailsModal
          isOpen={!!detailsProduct}
          onClose={() => setDetailsProduct(null)}
          product={detailsProduct}
        />
      )}

      {/* MODAL: STOCK OPENING */}
      {stockProduct && (
        <StockOpeningModal
          isOpen={!!stockProduct}
          onClose={() => setStockProduct(null)}
          product={stockProduct}
          locations={locations}
          onSave={handleSaveStock}
        />
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {productToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Excluir Produto</h4>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Tem certeza que deseja excluir o produto{' '}
              <strong className="text-slate-900">{productToDelete.name}</strong> (SKU: {productToDelete.sku})?
              Esta ação removerá suas variações e vínculos.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
