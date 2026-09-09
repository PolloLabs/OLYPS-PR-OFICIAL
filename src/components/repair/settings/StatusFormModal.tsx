import React, { useState, useEffect } from 'react';
import { X, Save, Palette, Hash, Tag, Smile } from 'lucide-react';
import type { RepairStatus } from '../../../types/repair.types.js';

interface StatusFormModalProps {
  isOpen: boolean;
  status: RepairStatus | null;
  onClose: () => void;
  onSave: (data: Omit<RepairStatus, 'id'> | Partial<RepairStatus>) => Promise<void>;
}

const PRESET_COLORS = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#ec4899', // Pink
  '#64748b', // Slate
  '#84cc16', // Lime
];

const PRESET_EMOJIS = ['⏳', '🔧', '📦', '✅', '🎯', '🚀', '❌', '⚠️', '🔍', '💡', '🛡️', '💬'];

export const StatusFormModal: React.FC<StatusFormModalProps> = ({
  isOpen,
  status,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [sortOrder, setSortOrder] = useState(1);
  const [emoji, setEmoji] = useState('🔧');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status) {
      setName(status.name);
      setColor(status.color);
      setSortOrder(status.sortOrder);
      setEmoji(status.emoji || '🔧');
    } else {
      setName('');
      setColor('#3b82f6');
      setSortOrder(1);
      setEmoji('🔧');
    }
    setError(null);
  }, [status, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do status é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        color,
        sortOrder: Number(sortOrder) || 1,
        emoji,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar status';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <span>{status ? 'Editar Status de OS' : 'Novo Status de OS'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Nome do Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome do Status *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Em Testes Finais, Aguardando Aprovação..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Ordem de Exibição */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Ordem de Exibição / Sequência</span>
            </label>
            <input
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Emoji / Ícone */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-slate-400" />
              <span>Emoji do Status</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl p-2 bg-slate-100 rounded-lg border border-slate-200 min-w-10 text-center">
                {emoji}
              </span>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                placeholder="Emoji"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`p-1.5 rounded-lg border text-sm transition-transform active:scale-95 ${
                    emoji === e
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Cor do Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>Cor Identificadora</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg border border-slate-300 shadow-2xs shrink-0"
                style={{ backgroundColor: color }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs uppercase"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border border-black/10 transition-transform active:scale-95 ${
                    color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-slate-800 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Preview Badge */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Pré-visualização do Badge:
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-2xs"
              style={{ backgroundColor: color }}
            >
              <span>{emoji}</span>
              <span>{name || 'Nome do Status'}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Status'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
