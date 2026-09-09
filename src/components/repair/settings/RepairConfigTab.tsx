import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Sliders, FileText, CheckSquare, Layers } from 'lucide-react';
import type { RepairSettings, RepairStatus } from '../../../types/repair.types.js';
import { RichTextEditor } from './RichTextEditor.js';

interface RepairConfigTabProps {
  settings: RepairSettings;
  statuses: RepairStatus[];
  onSave: (data: Partial<RepairSettings>) => Promise<RepairSettings>;
}

export const RepairConfigTab: React.FC<RepairConfigTabProps> = ({
  settings,
  statuses,
  onSave,
}) => {
  const [formData, setFormData] = useState<RepairSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header & Save Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-4 z-20 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Configurações Gerais de Reparo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina prefixo das OSs, status padrão de abertura, checklist padrão e termos contratuais de garantia.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configurações salvas!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}

      {/* Grid: Identificação & Numeração */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
          <Sliders className="w-4 h-4" />
          <span>Numeração & Status Inicial</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Prefixo da OS */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Prefixo da Ordem de Serviço (OS) *
            </label>
            <input
              type="text"
              required
              value={formData.workOrderPrefix}
              onChange={(e) => setFormData({ ...formData, workOrderPrefix: e.target.value })}
              placeholder="Ex: OS-2026-, REP-, AST-"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono text-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Exemplo gerado: <strong>{formData.workOrderPrefix || 'OS-'}001</strong>
            </span>
          </div>

          {/* Status Inicial Padrão */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Status Padrão na Criação da OS *
            </label>
            <select
              value={formData.defaultStatusId}
              onChange={(e) => setFormData({ ...formData, defaultStatusId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-900"
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji ? `${s.emoji} ` : ''}{s.name}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Este status será pré-selecionado automaticamente ao abrir uma nova folha de serviço.
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Campos Padrão e Modelos de Texto */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
          <Layers className="w-4 h-4" />
          <span>Modelos e Textos Padrão para Triagem</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Configuração do Produto / Acessórios */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Acessórios / Configuração do Produto Padrão
            </label>
            <textarea
              rows={3}
              value={formData.productConfiguration}
              onChange={(e) => setFormData({ ...formData, productConfiguration: e.target.value })}
              placeholder="Ex: Aparelho com capa de silicone, sem carregador..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Condição do Equipamento na Entrada */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Condição Física do Produto na Entrada
            </label>
            <textarea
              rows={3}
              value={formData.productCondition}
              onChange={(e) => setFormData({ ...formData, productCondition: e.target.value })}
              placeholder="Ex: Marcas normais de uso, película trincada, sem parafusos espanados..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Problema Relatado pelo Cliente */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Exemplo / Sugestão de Defeito Relatado
            </label>
            <input
              type="text"
              value={formData.customerReportedProblem}
              onChange={(e) => setFormData({ ...formData, customerReportedProblem: e.target.value })}
              placeholder="Ex: Aparelho não liga, sem sinal de carregamento ou display trincado."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>
        </div>

        {/* Checklist Padrão */}
        <div className="pt-2 text-xs">
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>Checklist Geral Padrão da Assistência (Um item por linha)</span>
          </label>
          <textarea
            rows={5}
            value={formData.defaultRepairChecklist}
            onChange={(e) => setFormData({ ...formData, defaultRepairChecklist: e.target.value })}
            placeholder="1. Teste de ligar e desligar&#10;2. Teste de carregamento&#10;3. Teste de áudio e microfone..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono text-slate-900"
          />
        </div>
      </div>

      {/* Termos e Condições / Contrato da Folha */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
              <FileText className="w-4 h-4" />
              <span>Termos, Condições e Cláusulas Contratuais de Garantia</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Este texto será impresso no rodapé da Ordem de Serviço ou enviado digitalmente ao cliente para aceite.
            </p>
          </div>
        </div>

        <RichTextEditor
          value={formData.termsAndConditions}
          onChange={(val) => setFormData({ ...formData, termsAndConditions: val })}
          placeholder="Escreva os termos de garantia, prazos para retirada e regras de assistência técnica..."
        />
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>
    </form>
  );
};
