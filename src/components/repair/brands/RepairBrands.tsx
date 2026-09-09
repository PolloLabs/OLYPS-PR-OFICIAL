import React, { useState } from 'react';
import {
  Search,
  Download,
  Printer,
  Plus,
  Edit,
  Trash2,
  Tag,
  Info,
  Layers,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useRepairBrands } from '../../../hooks/repair/useRepairBrands.js';
import type { RepairBrand, BrandFormData } from '../../../types/repair.types.js';

interface RepairBrandsProps {
  companyId: string;
}

export const RepairBrands: React.FC<RepairBrandsProps> = ({ companyId }) => {
  const {
    brands,
    allBrandsCount,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    createBrand,
    updateBrand,
    deleteBrand,
    refetch,
  } = useRepairBrands(companyId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<RepairBrand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    description: '',
    category: 'Eletrônicos',
    status: 'active',
  });

  // Abrir modal para criar
  const handleCreate = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      description: '',
      category: 'Eletrônicos',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (brand: RepairBrand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      category: brand.category || 'Eletrônicos',
      status: brand.status,
    });
    setIsModalOpen(true);
  };

  // Salvar (criar ou editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBrand) {
      const success = await updateBrand(editingBrand.id, formData);
      if (success) {
        setIsModalOpen(false);
        setEditingBrand(null);
      }
    } else {
      const success = await createBrand(formData);
      if (success) {
        setIsModalOpen(false);
      }
    }
  };

  // Excluir
  const handleDelete = async (brandId: string) => {
    const success = await deleteBrand(brandId);
    if (success) {
      alert('Marca excluída com sucesso! Ela foi removida de Produtos e Reparar.');
    }
  };

  // Exportar CSV
  const exportToCSV = () => {
    const headers = ['Código/Ref', 'Descrição/Nome', 'Categoria/Tipo', 'Status', 'Última Atualização'];
    const rows = brands.map((b) => [
      b.id.substring(0, 8),
      b.name,
      b.category || 'Eletrônicos',
      b.status === 'active' ? 'Ativo' : 'Inativo',
      new Date(b.updatedAt).toLocaleDateString('pt-BR'),
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'marcas-reparar.csv';
    link.click();
  };

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="repair-brands-view" className="p-6 bg-slate-50/60 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Registros de Marcas</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">
                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                Sincronizado com Produtos
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Consulta consolidada de dados e operações do módulo Marcas com catálogo unificado de equipamentos.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Busca */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome ou descrição..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>

            <button
              type="button"
              onClick={exportToCSV}
              className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Exportar CSV
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Imprimir
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 font-semibold transition-all shadow-xs shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Adicionar Marcas
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border-b border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-md font-medium hover:bg-rose-100"
            >
              Tentar novamente
            </button>
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <p className="text-slate-800 font-semibold text-sm">Não há registros cadastrados para Marcas.</p>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Nenhum registro encontrado para exibição nesta listagem com os filtros atuais.
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeiro registro de Marcas
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Código / Ref
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Descrição / Nome
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Categoria / Tipo
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Última Atualização
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-xs">
                  {brands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">
                        {brand.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-xs">{brand.name}</div>
                        {brand.description && (
                          <div className="text-slate-500 text-[11px] truncate max-w-xs">{brand.description}</div>
                        )}
                        {brand.syncedFromProducts && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                            Sincronizado de Produtos
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {brand.category || 'Eletrônicos'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            brand.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {brand.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {new Date(brand.updatedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(brand)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(brand.id)}
                            className={`p-1.5 transition-colors rounded-lg ${
                              brand.syncedFromProducts
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
                            title={
                              brand.syncedFromProducts
                                ? 'Não é possível excluir marcas sincronizadas de Produtos aqui'
                                : 'Excluir'
                            }
                            disabled={brand.syncedFromProducts}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-slate-50/60 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Exibindo <strong>{brands.length}</strong> de <strong>{allBrandsCount}</strong> registros
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">
                  {editingBrand ? `Editar Marca: ${editingBrand.name}` : 'Adicionar Nova Marca'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Nome da Marca <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Samsung, Apple, Motorola, Xiaomi..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da marca, linhas de produtos atendidas..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Categoria / Tipo</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Smartphones">Smartphones</option>
                    <option value="Notebooks">Notebooks</option>
                    <option value="Tablets">Tablets</option>
                    <option value="Acessórios">Acessórios</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Alerta de sincronização */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-900 leading-relaxed">
                    <p className="font-bold">Sincronização Automática com Produtos</p>
                    <p className="mt-0.5 text-indigo-700">
                      Esta marca será automaticamente sincronizada entre os módulos <strong>Produtos</strong> e{' '}
                      <strong>Reparar</strong>. Ao criar ou editar aqui, a alteração refletirá em ambos os módulos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {loading ? 'Salvando...' : 'Salvar Marca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairBrands;
