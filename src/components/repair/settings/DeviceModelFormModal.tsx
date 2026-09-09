import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Cpu, CheckSquare, Sparkles } from 'lucide-react';
import type { DeviceModel } from '../../../types/repair.types.js';

interface DeviceModelFormModalProps {
  isOpen: boolean;
  model: DeviceModel | null;
  onClose: () => void;
  onSave: (data: Omit<DeviceModel, 'id'> | Partial<DeviceModel>) => Promise<void>;
}

const COMMON_DEVICE_TYPES = [
  'Smartphone',
  'Tablet',
  'Notebook',
  'Console',
  'Smartwatch',
  'Computador Desktop',
  'Monitor / TV',
  'Outros',
];

const COMMON_BRANDS = [
  'Apple',
  'Samsung',
  'Dell',
  'Sony',
  'Lenovo',
  'Motorola',
  'Xiaomi',
  'Asus',
  'LG',
  'Nintendo',
  'Microsoft',
  'HP',
  'Acer',
];

const CHECKLIST_PRESETS: Record<string, string[]> = {
  Smartphone: [
    'Tela OLED / Touch Screen',
    'Conector de Carga / USB',
    'Bateria e Saúde / Ciclos',
    'Câmeras Frontal e Traseira',
    'Microfones e Alto-Falantes',
    'Biometria / Face ID',
    'Carcaça e Botões Físicos',
  ],
  Notebook: [
    'Display LCD / Backlight',
    'Teclado e Trackpad',
    'Portas USB / HDMI / Type-C',
    'Bateria e Fonte de Alimentação',
    'Cooler e Ventilação / Pasta Térmica',
    'Armazenamento SSD e Memória RAM',
  ],
  Console: [
    'Leitor Óptico / Drive',
    'Porta HDMI e Saída de Vídeo',
    'Ventoinha e Refrigeração / Metal Líquido',
    'Conexão Bluetooth e Pareamento de Controles',
    'Fonte Interna de Energia',
  ],
  Tablet: [
    'Display Touch e Caneta / Stylus',
    'Conector de Carregamento',
    'Bateria',
    'Câmeras e Sensores',
    'Alto-falantes Estéreo',
  ],
};

export const DeviceModelFormModal: React.FC<DeviceModelFormModalProps> = ({
  isOpen,
  model,
  onClose,
  onSave,
}) => {
  const [modelName, setModelName] = useState('');
  const [deviceType, setDeviceType] = useState('Smartphone');
  const [brand, setBrand] = useState('Apple');
  const [customBrand, setCustomBrand] = useState('');
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (model) {
      setModelName(model.modelName);
      setDeviceType(model.deviceType);
      if (COMMON_BRANDS.includes(model.brand)) {
        setBrand(model.brand);
        setCustomBrand('');
      } else {
        setBrand('Outra');
        setCustomBrand(model.brand);
      }
      setChecklist(model.repairChecklist || []);
    } else {
      setModelName('');
      setDeviceType('Smartphone');
      setBrand('Apple');
      setCustomBrand('');
      setChecklist(CHECKLIST_PRESETS['Smartphone'] || []);
    }
    setNewChecklistItem('');
    setError(null);
  }, [model, isOpen]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist((prev) => [...prev, newChecklistItem.trim()]);
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = () => {
    const preset = CHECKLIST_PRESETS[deviceType];
    if (preset) {
      setChecklist([...preset]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) {
      setError('O nome do modelo é obrigatório.');
      return;
    }

    const finalBrand = brand === 'Outra' ? customBrand.trim() : brand;
    if (!finalBrand) {
      setError('A marca do equipamento é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        modelName: modelName.trim(),
        deviceType,
        brand: finalBrand,
        repairChecklist: checklist,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar modelo';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>{model ? 'Editar Modelo de Dispositivo' : 'Novo Modelo de Dispositivo'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Tipo de Aparelho */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tipo de Dispositivo *</label>
            <select
              value={deviceType}
              onChange={(e) => {
                const newType = e.target.value;
                setDeviceType(newType);
                if (checklist.length === 0 && CHECKLIST_PRESETS[newType]) {
                  setChecklist(CHECKLIST_PRESETS[newType]);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
            >
              {COMMON_DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Marca *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                {COMMON_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="Outra">Outra Marca...</option>
              </select>
            </div>

            {brand === 'Outra' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Digite a Marca *</label>
                <input
                  type="text"
                  required
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Nome do Fabricante"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Nome do Modelo */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome do Modelo *</label>
            <input
              type="text"
              required
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Ex: iPhone 15 Pro Max, Galaxy S24 Ultra, ThinkPad X1..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Checklist de Reparo / Triagem */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Checklist Técnico de Triagem & Reparo</span>
              </label>
              {CHECKLIST_PRESETS[deviceType] && (
                <button
                  type="button"
                  onClick={handleApplyPreset}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                  title="Carregar itens sugeridos para este tipo de equipamento"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sugerir Itens</span>
                </button>
              )}
            </div>

            {/* Inclusão de Novo Item */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Adicionar item de verificação (ex: Teste de Touch ID)..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 text-xs"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Lista Atual de Itens */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {checklist.length === 0 ? (
                <p className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded border border-slate-200 text-center">
                  Nenhum item configurado no checklist deste modelo.
                </p>
              ) : (
                checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-800 font-medium">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remover este item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
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
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Modelo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
