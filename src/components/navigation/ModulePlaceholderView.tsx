import React, { useState } from 'react';
import {
  ShieldCheck,
  Info,
  Layers,
  ArrowLeft,
  Upload,
  Save,
  CheckCircle2,
  FileText,
  Sliders,
  Store,
  CreditCard,
  Building2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { DataTable } from '../ui/DataTable.js';
import { ActionButton } from '../ui/ActionButton.js';
import { CreateButton } from '../ui/CreateButton.js';
import { exportToCsv, exportToExcel, exportToPdf } from '../../lib/exportUtils.js';
import type {
  SidebarMenuItem,
  SidebarSubItem,
  DataTableColumn,
  ExportFormat,
} from '../../types/navigation.types.js';
import type { CompanyRole } from '../../types/tenant.types.js';

interface ModulePlaceholderViewProps {
  item: SidebarMenuItem;
  subItem?: SidebarSubItem;
  userRole: CompanyRole;
  activeCompanyName: string;
  isPlatformAdmin: boolean;
  onNavigate: (path: string) => void;
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

export const ModulePlaceholderView: React.FC<ModulePlaceholderViewProps> = ({
  item,
  subItem,
  userRole,
  activeCompanyName,
  isPlatformAdmin,
  onNavigate,
  onShowNotification,
}) => {
  const currentItem = subItem || item;
  const Icon = currentItem.icon;
  const title = currentItem.label;
  const description =
    currentItem.description || 'Módulo operacional oficial do OLYPS PRO';
  const permission = currentItem.permission;
  const path = currentItem.path || item.path || '';
  const viewType = currentItem.viewType || 'list';
  const createPath = currentItem.createPath;
  const listPath = currentItem.listPath;

  // Form submission state for technical placeholder
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSimulateCreate = () => {
    if (createPath) {
      onNavigate(createPath);
    } else {
      onShowNotification(
        'success',
        `Ação [+ Adicionar] acionada para o módulo "${title}". A interface de cadastro foi preparada.`
      );
    }
  };

  const handleSimulateSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onShowNotification(
        'success',
        `Estrutura funcional do formulário validada. O CRUD e persistência real serão integrados na fase de negócio.`
      );
      if (listPath) {
        onNavigate(listPath);
      }
    }, 600);
  };

  const handleExport = (format: ExportFormat) => {
    const cleanFilename = (title || 'relatorio-modulo')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    if (format === 'csv') {
      exportToCsv(cleanFilename, defaultColumns, []);
    } else if (format === 'excel') {
      exportToExcel(cleanFilename, defaultColumns, []);
    } else if (format === 'pdf') {
      exportToPdf(cleanFilename, title || 'Relatório Oficial', defaultColumns, []);
    }

    onShowNotification(
      'success',
      `Arquivo [${format.toUpperCase()}] de "${title}" gerado para download com sucesso.`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Sample table columns for lists
  const defaultColumns: DataTableColumn<Record<string, unknown>>[] = [
    { key: 'code', header: 'Código / Ref', sortable: true, width: '120px' },
    { key: 'name', header: 'Descrição / Nome', sortable: true },
    { key: 'category', header: 'Categoria / Tipo', sortable: true, width: '180px' },
    { key: 'status', header: 'Status', sortable: true, width: '120px' },
    { key: 'updatedAt', header: 'Última Atualização', sortable: true, width: '160px' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-slate-900 text-white rounded-lg shadow-xs shrink-0 mt-0.5">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {title}
                </h2>
                {item.moduleNumber && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-800 rounded border border-slate-300">
                    Módulo {item.moduleNumber}
                  </span>
                )}
                {subItem && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded border border-blue-200">
                    {item.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{description}</p>
              <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-600 flex-wrap">
                <span className="font-semibold text-slate-900">Tenant Ativo:</span>
                <span className="font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {activeCompanyName}
                </span>
                <span>&bull;</span>
                <span className="font-semibold text-slate-900">Perfil:</span>
                <span className="capitalize font-mono">{userRole.replace('_', ' ')}</span>
                <span>&bull;</span>
                <span className="font-semibold text-slate-900">Rota:</span>
                <code className="font-mono text-blue-600 bg-blue-50/75 px-1.5 py-0.2 rounded border border-blue-200">
                  {path}
                </code>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {listPath && (
              <ActionButton
                variant="outline"
                size="sm"
                icon={ArrowLeft}
                onClick={() => onNavigate(listPath)}
              >
                Voltar à Lista
              </ActionButton>
            )}
            {createPath && (
              <CreateButton
                label={`+ Adicionar ${title.replace('Lista de ', '')}`}
                onClick={() => onNavigate(createPath)}
                size="sm"
              />
            )}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Fase 02.9 Ativa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic View Representation based on viewType */}

      {/* 1. Form View (Adicionar ...) */}
      {viewType === 'form' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Formulário de Cadastro &mdash; {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estrutura de entrada de dados com validações e campos operacionais
              </p>
            </div>
          </div>

          <form onSubmit={handleSimulateSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Identificador / Nome Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Informe o nome ou descrição...`}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Código de Referência / SKU
                </label>
                <input
                  type="text"
                  placeholder="Ex: REF-2026-001"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoria / Grupo
                </label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer">
                  <option value="">Selecione uma categoria...</option>
                  <option value="geral">Geral / Padrão</option>
                  <option value="especial">Especial / Prioritário</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Valor / Preço Estimado (R$)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status Inicial
                </label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer">
                  <option value="active">Ativo</option>
                  <option value="draft">Rascunho</option>
                  <option value="pending">Pendente de Aprovação</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Empresa / Estabelecimento
                </label>
                <input
                  type="text"
                  disabled
                  value={activeCompanyName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observações Operacionais / Instruções
              </label>
              <textarea
                rows={3}
                placeholder="Detalhes adicionais para controle de auditoria..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            {/* Form Footer Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              {listPath ? (
                <ActionButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => onNavigate(listPath)}
                >
                  Cancelar e Voltar
                </ActionButton>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Preencha os campos obrigatórios (*)
                </span>
              )}

              <ActionButton
                type="submit"
                variant="primary"
                size="md"
                icon={Save}
                isLoading={isSubmitting}
              >
                Salvar Registro
              </ActionButton>
            </div>
          </form>
        </div>
      )}

      {/* 2. Import View (Importar ...) */}
      {viewType === 'import' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Assistente de Importação em Massa
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Envie planilhas CSV ou Excel nos formatos homologados para processamento em lote
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-800">
              Arraste e solte seu arquivo aqui, ou clique para selecionar
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Formatos aceitos: .csv, .xlsx, .xls (Máximo 25MB)
            </p>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                  onShowNotification(
                    'success',
                    `Arquivo "${e.target.files[0].name}" carregado para validação.`
                  );
                }
              }}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="mt-4 inline-flex items-center px-3.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              Procurar Arquivo no Computador
            </label>

            {selectedFile && (
              <div className="mt-3 inline-flex items-center space-x-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Arquivo selecionado: {selectedFile.name}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <ActionButton
              variant="outline"
              size="sm"
              onClick={() => {
                onShowNotification(
                  'success',
                  'Planilha modelo baixada com sucesso no seu computador.'
                );
              }}
            >
              Baixar Planilha Modelo (.xlsx)
            </ActionButton>

            <ActionButton
              variant="primary"
              size="sm"
              onClick={() => {
                onShowNotification(
                  'success',
                  'Arquivo processado pelo validador estrutural. Importação pronta para integração na fase de negócio.'
                );
              }}
            >
              Processar e Validar Importação
            </ActionButton>
          </div>
        </div>
      )}

      {/* 3. POS View (Frente de Caixa) */}
      {viewType === 'pos' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Terminal de Frente de Caixa &mdash; POS OLYPS PRO
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Operação rápida de caixa, leitura de código de barras e emissão de comprovantes
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">
              Caixa Aberto
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escaneie o código de barras ou digite o nome do produto..."
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                <ActionButton
                  variant="primary"
                  size="md"
                  onClick={() =>
                    onShowNotification(
                      'success',
                      'Busca de código de barras executada com sucesso.'
                    )
                  }
                >
                  Buscar
                </ActionButton>
              </div>

              <div className="border border-slate-200 rounded-lg p-8 text-center text-slate-400 bg-slate-50/50">
                <Store className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">
                  Nenhum item lançado no cupom fiscal atual
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Passe o leitor de código de barras ou pesquise o item acima
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Resumo da Venda
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">R$ 0,00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Descontos:</span>
                  <span className="font-mono">R$ 0,00</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total Geral:</span>
                  <span className="font-mono text-emerald-700">R$ 0,00</span>
                </div>
              </div>

              <ActionButton
                variant="success"
                size="lg"
                className="w-full"
                onClick={() =>
                  onShowNotification(
                    'success',
                    'Frente de caixa funcional. Integração com SAT/NFC-e e TEF pronta para a fase de negócio.'
                  )
                }
              >
                Finalizar Venda (F2)
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* 4. List View (Default) — Standard DataTable */}
      {(viewType === 'list' || viewType === 'report' || viewType === 'settings' || viewType === 'custom') && (
        <DataTable
          id={`table-${item.id}`}
          title={`Registros de ${title}`}
          description={`Consulta consolidada de dados e operações do módulo ${title}`}
          columns={defaultColumns}
          data={[]}
          onCreate={createPath ? () => onNavigate(createPath) : handleSimulateCreate}
          createButtonLabel={`+ Adicionar ${title.replace('Lista de ', '').replace('Todas as ', '')}`}
          onExport={handleExport}
          onPrint={handlePrint}
          emptyMessage={`Não há registros cadastrados para ${title}.`}
          emptyCreateLabel={`Adicionar primeiro registro de ${title.replace('Lista de ', '')}`}
        />
      )}

      {/* Module Architecture & RBAC Validation Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Security & RBAC Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Controle de Acesso RBAC &amp; Tenant
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Permissão Exigida:</span>
              <code className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {permission || 'Acesso Livre / Autenticado'}
              </code>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Escopo da Rota:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {item.scope === 'platform'
                  ? 'Global (Super Admin)'
                  : 'Empresa / Multi-Tenant'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Autorização Backend:</span>
              <span className="inline-flex items-center text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                requireCompanyPermission
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Phase Roadmap Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Arquitetura &amp; Prontidão
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-slate-600 leading-relaxed">
              A estrutura oficial de navegação dos 13 módulos do <strong>OLYPS PRO</strong>,
              tabelas padronizadas, paginação 25/50/75/100/Todos, exportações e formulários estão
              auditados e consolidados na <strong>Fase 02.9</strong>.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
              <Info className="w-4 h-4 text-slate-600 shrink-0" />
              <span>
                As rotas de negócio, persistência no Supabase e regras fiscais serão
                implementadas progressivamente a partir da <strong>Fase 03</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
