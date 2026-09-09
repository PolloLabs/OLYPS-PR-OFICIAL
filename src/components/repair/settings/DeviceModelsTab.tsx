import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Cpu, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
import type { DeviceModel } from '../../../types/repair.types.js';
import { DeviceModelFormModal } from './DeviceModelFormModal.js';

interface DeviceModelsTabProps {
  deviceModels: DeviceModel[];
  onCreateModel: (data: Omit<DeviceModel, 'id'>) => Promise<DeviceModel>;
  onUpdateModel: (id: string, data: Partial<DeviceModel>) => Promise<DeviceModel>;
  onDeleteModel: (id: string) => Promise<void>;
}

export const DeviceModelsTab: React.FC<DeviceModelsTabProps> = ({
  deviceModels,
  onCreateModel,
  onUpdateModel,
  onDeleteModel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<DeviceModel | null>(null);
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter options
  const uniqueTypes = Array.from(new Set(deviceModels.map((m) => m.deviceType))).sort();
  const uniqueBrands = Array.from(new Set(deviceModels.map((m) => m.brand))).sort();

  const filteredModels = deviceModels.filter((m) => {
    const matchesSearch =
      m.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.deviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || m.deviceType === selectedType;
    const matchesBrand = selectedBrand === 'all' || m.brand === selectedBrand;
    return matchesSearch && matchesType && matchesBrand;
  });

  const handleOpenCreate = () => {
    setEditingModel(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (model: DeviceModel) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (data: Omit<DeviceModel, 'id'> | Partial<DeviceModel>) => {
    if (editingModel) {
      await onUpdateModel(editingModel.id, data);
    } else {
      await onCreateModel(data as Omit<DeviceModel, 'id'>);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o modelo "${name}"?`)) {
      setDeletingId(id);
      try {
        await onDeleteModel(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Modelos de Equipamentos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os aparelhos aceitos e padronize os checklists técnicos de entrada e reparo.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Modelo</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por modelo, marca ou tipo..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800"
          />
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Tipo:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="all">Todos os Tipos</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Brand */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Marca:</span>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
          >
            <option value="all">Todas as Marcas</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Modelo do Equipamento</th>
                <th className="py-3 px-4">Marca</th>
                <th className="py-3 px-4">Tipo de Dispositivo</th>
                <th className="py-3 px-4">Checklist Técnico</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum modelo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredModels.map((m) => {
                  const isExpanded = expandedModelId === m.id;
                  const checklistCount = m.repairChecklist?.length || 0;

                  return (
                    <React.Fragment key={m.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                              <Cpu className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-semibold text-slate-900">{m.modelName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{m.brand}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {m.deviceType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setExpandedModelId(isExpanded ? null : m.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-medium transition-colors"
                          >
                            <CheckSquare className="w-3 h-3 text-indigo-500" />
                            <span>{checklistCount} {checklistCount === 1 ? 'item' : 'itens'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 ml-0.5" />
                            ) : (
                              <ChevronDown className="w-3 h-3 ml-0.5" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Editar Modelo"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === m.id}
                              onClick={() => handleDelete(m.id, m.modelName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Excluir Modelo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Checklist View */}
                      {isExpanded && (
                        <tr className="bg-indigo-50/40">
                          <td colSpan={5} className="py-3 px-6 border-y border-indigo-100">
                            <div className="text-xs">
                              <span className="font-semibold text-indigo-900 block mb-1.5">
                                Itens de Inspeção e Checklist de Reparo para {m.modelName}:
                              </span>
                              {checklistCount === 0 ? (
                                <p className="text-slate-500 italic">Nenhum item configurado.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {m.repairChecklist.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 p-1.5 bg-white rounded border border-indigo-100 text-slate-800"
                                    >
                                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="truncate">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <DeviceModelFormModal
        isOpen={isModalOpen}
        model={editingModel}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
      />
    </div>
  );
};
