import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Building2,
  Truck,
  Users,
  Check,
  XCircle,
  FileText,
} from 'lucide-react';
import type {
  ContactImportPreviewResponse,
  ContactImportExecuteResponse,
} from '../../types/index.js';

interface ContactImportViewProps {
  companyId: string;
  activeCompanyName: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

const CUSTOMER_SAMPLE_CSV = `name,document,person_type,email,phone,mobile,trade_name,city,state,address
Empresa Alfa Ltda,12.345.678/0001-90,legal,contato@alfa.com.br,1133334444,11988887777,Alfa Tech,São Paulo,SP,"Av. Paulista, 1000"
João Silva,123.456.789-00,individual,joao@gmail.com,,11977776666,,Campinas,SP,"Rua das Flores, 123"
Beta Soluções,98.765.432/0001-10,legal,suporte@beta.com.br,1140001122,11966665555,Beta Corp,Rio de Janeiro,RJ,"Av. Atlântica, 500"`;

const SUPPLIER_SAMPLE_CSV = `name,document,person_type,email,phone,mobile,trade_name,category,payment_terms,city,state
Distribuidora Gama,11.222.333/0001-44,legal,vendas@gama.com,1133330000,11955554444,Gama Insumos,Matéria-Prima,30 DDL,Guarulhos,SP
Tech Services Ltda,44.555.666/0001-77,legal,comercial@tech.com,1144442222,11944443333,Tech Softwares,Serviços de TI,À Vista,São Paulo,SP`;

export const ContactImportView: React.FC<ContactImportViewProps> = ({
  companyId,
  activeCompanyName,
  onShowNotification,
}) => {
  const [targetType, setTargetType] = useState<'customer' | 'supplier'>('customer');
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1 = Upload/Paste, 2 = Preview/Validation, 3 = Confirmation/Result

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ContactImportPreviewResponse | null>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [importResult, setImportResult] = useState<ContactImportExecuteResponse | null>(null);

  // Download Sample Template
  const handleDownloadSample = () => {
    const content = targetType === 'customer' ? CUSTOMER_SAMPLE_CSV : SUPPLIER_SAMPLE_CSV;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `modelo_importacao_${targetType === 'customer' ? 'clientes' : 'fornecedores'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || '');
    };
    reader.readAsText(file);
  };

  // Process & Validate Preview
  const handleGeneratePreview = async () => {
    if (!csvContent.trim()) {
      onShowNotification('error', 'Por favor, selecione um arquivo CSV ou cole os dados.');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const res = await fetch(`/api/companies/${companyId}/contacts/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          targetType,
          csvContent,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setPreviewData(json.data);
        setCurrentStep(2);
      } else {
        onShowNotification('error', json.error?.message || 'Falha ao processar arquivo.');
      }
    } catch {
      onShowNotification('error', 'Erro de conexão ao gerar pré-visualização.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Execute Confirmed Import
  const handleExecuteImport = async () => {
    if (!previewData || previewData.validRowsCount === 0) {
      onShowNotification('error', 'Não há registros válidos para importar.');
      return;
    }

    setIsExecuting(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const res = await fetch(`/api/companies/${companyId}/contacts/import/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          targetType,
          rows: previewData.rows,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setImportResult(json.data);
        setCurrentStep(3);
        onShowNotification('success', `Importação de ${json.data.importedCount} contatos realizada com sucesso!`);
      } else {
        onShowNotification('error', json.error?.message || 'Erro ao efetivar importação.');
      }
    } catch {
      onShowNotification('error', 'Erro de comunicação ao efetivar importação.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setCsvContent('');
    setFileName(null);
    setPreviewData(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6" id="contact-import-view">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Importação de Contatos em Lote</h1>
          <p className="text-xs text-slate-500 mt-1">
            Importe listas de clientes ou fornecedores a partir de planilhas CSV para <strong className="text-slate-700">{activeCompanyName}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadSample}
          className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Baixar Planilha Modelo ({targetType === 'customer' ? 'Clientes' : 'Fornecedores'})</span>
        </button>
      </div>

      {/* Stepper Progress */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`p-3 rounded-lg border flex items-center space-x-3 transition-colors ${
            currentStep === 1
              ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900'
              : currentStep > 1
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-400'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 1
                ? 'bg-indigo-600 text-white'
                : currentStep > 1
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
          </div>
          <div className="text-xs font-semibold">1. Seleção & Dados</div>
        </div>

        <div
          className={`p-3 rounded-lg border flex items-center space-x-3 transition-colors ${
            currentStep === 2
              ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900'
              : currentStep > 2
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-400'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 2
                ? 'bg-indigo-600 text-white'
                : currentStep > 2
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
          </div>
          <div className="text-xs font-semibold">2. Prévia & Validação</div>
        </div>

        <div
          className={`p-3 rounded-lg border flex items-center space-x-3 transition-colors ${
            currentStep === 3
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
              : 'bg-white border-slate-200 text-slate-400'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 3
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            3
          </div>
          <div className="text-xs font-semibold">3. Conclusão</div>
        </div>
      </div>

      {/* STEP 1: Upload / Input */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          {/* Target Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Tipo de Contato de Destino
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <button
                type="button"
                onClick={() => setTargetType('customer')}
                className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  targetType === 'customer'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Base de Clientes</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Importar compradores, clientes PF/PJ com endereço e grupo.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('supplier')}
                className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  targetType === 'supplier'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Base de Fornecedores</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Importar parceiros comerciais, categorias e termos de pagamento.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Arquivo CSV ou Dados Tabulados
            </label>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="csv-upload-input"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="csv-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-3 bg-white shadow-xs border border-slate-200 rounded-full text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  {fileName ? (
                    <span className="text-indigo-600 font-bold">{fileName}</span>
                  ) : (
                    'Clique para selecionar seu arquivo .CSV ou arraste para cá'
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Formatos suportados: CSV separado por vírgula ou ponto e vírgula.
                </div>
              </label>
            </div>
          </div>

          {/* Direct CSV Text Area (Alternative) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">
                Ou cole o conteúdo CSV diretamente:
              </label>
              <button
                type="button"
                onClick={() =>
                  setCsvContent(targetType === 'customer' ? CUSTOMER_SAMPLE_CSV : SUPPLIER_SAMPLE_CSV)
                }
                className="text-[11px] text-indigo-600 hover:underline font-medium"
              >
                Carregar Exemplo Rápido
              </button>
            </div>
            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="name,document,person_type,email,phone,city,state..."
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
            />
          </div>

          {/* Action */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleGeneratePreview}
              disabled={isLoadingPreview || !csvContent.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isLoadingPreview ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando Estrutura...</span>
                </>
              ) : (
                <>
                  <span>Gerar Prévia & Validar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Preview & Validation */}
      {currentStep === 2 && previewData && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total de Linhas
                </span>
                <span className="text-xl font-bold text-slate-900">{previewData.totalRows}</span>
              </div>
              <FileSpreadsheet className="w-6 h-6 text-slate-400" />
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Linhas Válidas
                </span>
                <span className="text-xl font-bold text-emerald-800">{previewData.validRowsCount}</span>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                  Linhas com Erro
                </span>
                <span className="text-xl font-bold text-rose-800">{previewData.invalidRowsCount}</span>
              </div>
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
          </div>

          {/* Detailed Preview Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pré-visualização dos Registros ({targetType === 'customer' ? 'Clientes' : 'Fornecedores'})
              </span>
              <span className="text-[11px] text-slate-500">
                Apenas linhas válidas serão gravadas no banco de dados.
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                    <th className="py-2.5 px-3">Linha</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Nome / Razão</th>
                    <th className="py-2.5 px-3">Documento</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">E-mail</th>
                    <th className="py-2.5 px-3">Cidade/UF</th>
                    <th className="py-2.5 px-3">Diagnóstico / Erros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {previewData.rows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/60'}
                    >
                      <td className="py-2 px-3 font-mono text-slate-500">#{row.rowIndex}</td>
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Válido
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Inválido
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{row.name || '—'}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{row.document || '—'}</td>
                      <td className="py-2 px-3">{row.personType === 'legal' ? 'PJ' : 'PF'}</td>
                      <td className="py-2 px-3 text-slate-600">{row.email || '—'}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {row.city ? `${row.city}/${row.state || ''}` : '—'}
                      </td>
                      <td className="py-2 px-3">
                        {row.errors.length > 0 ? (
                          <div className="space-y-0.5">
                            {row.errors.map((err, i) => (
                              <span
                                key={i}
                                className="block text-[11px] font-medium text-rose-600"
                              >
                                &bull; {err}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">Pronto para importar</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              disabled={isExecuting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Voltar e Ajustar Dados
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isExecuting || previewData.validRowsCount === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gravando no Banco de Dados...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Importação de {previewData.validRowsCount} Contatos</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Result / Confirmation */}
      {currentStep === 3 && importResult && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Importação Concluída com Sucesso!</h2>
            <p className="text-xs text-slate-500">
              Os contatos foram persistidos na empresa <strong className="text-slate-700">{activeCompanyName}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Cadastrados
              </span>
              <span className="text-2xl font-bold text-emerald-800">{importResult.importedCount}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Ignorados / Falhas
              </span>
              <span className="text-2xl font-bold text-slate-700">{importResult.failedCount}</span>
            </div>
          </div>

          {importResult.errors && importResult.errors.length > 0 && (
            <div className="text-left max-w-lg mx-auto p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-xs font-bold text-rose-800 block mb-2">Relatório de Inconsistências:</span>
              <ul className="text-xs text-rose-700 list-disc list-inside space-y-1">
                {importResult.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs inline-flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Realizar Nova Importação</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
