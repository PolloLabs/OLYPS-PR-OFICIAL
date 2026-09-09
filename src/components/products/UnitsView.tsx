import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Edit2, Trash2, Search, X, AlertCircle } from 'lucide-react';
import type { Unit } from '../../types/index.js';

interface UnitsViewProps {
  companyId: string;
}

export const UnitsView: React.FC<UnitsViewProps> = ({ companyId }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [allowDecimal, setAllowDecimal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/units`);
      if (res.ok) {
        const d = await res.json();
        setUnits(d.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [companyId]);

  const handleOpenAdd = () => {
    setEditingUnit(null);
    setName('');
    setShortName('');
    setAllowDecimal(false);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (u: Unit) => {
    setEditingUnit(u);
    setName(u.name);
    setShortName(u.shortName);
    setAllowDecimal(u.allowDecimal);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingUnit) {
        const res = await fetch(`/api/companies/${companyId}/units/${editingUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, shortName, allowDecimal }),
        });
        if (!res.ok) throw new Error('Falha ao atualizar unidade.');
      } else {
        const res = await fetch(`/api/companies/${companyId}/units`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, shortName, allowDecimal }),
        });
        if (!res.ok) throw new Error('Falha ao criar unidade.');
      }
      setModalOpen(false);
      fetchUnits();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta unidade?')) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/units/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchUnits();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = units.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.shortName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Ruler className="w-6 h-6 text-emerald-600" />
            Unidades de Medida
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie grandezas de comercialização (Unidade, Peça, Quilo, Metro, Caixa).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Unidade</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou sigla..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden"
          />
        </div>
        <span className="text-xs text-slate-500">{filtered.length} unidade(s)</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Nome da Unidade</th>
              <th className="px-4 py-3 text-left">Sigla / Abreviatura</th>
              <th className="px-4 py-3 text-center">Permite Decimal?</th>
              <th className="px-4 py-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Carregando unidades...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma unidade cadastrada.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{u.shortName}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        u.allowDecimal ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.allowDecimal ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {errorMsg && (
                <div className="p-2.5 rounded bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Unidade *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Peça, Metro, Litro"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sigla / Abreviatura (Ex: PC, M, L) *
                </label>
                <input
                  type="text"
                  required
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="Ex: PC"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="allowDecimal"
                  checked={allowDecimal}
                  onChange={(e) => setAllowDecimal(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="allowDecimal" className="text-xs font-medium text-slate-700">
                  Permite quantidade fracionada / decimal (ex: 1.50 metros)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
