import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  RefreshCw,
  XCircle,
  FileText,
  Check,
  Package,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  OFFICIAL_PRODUCT_IMPORT_COLUMNS,
  generateOfficialCsvTemplate,
  validateHeaders,
  validateRow,
} from '../../config/productImportColumns.js';
import type {
  ProductImportPreview,
  ProductImportResult,
  ProductImportRowItem,
} from '../../types/productImport.types.js';

interface ProductImportViewProps {
  companyId: string;
  activeCompanyName: string;
  onNavigate?: (path: string) => void;
  onShowNotification: (type: 'success' | 'error', message: string) => void;
}

export const ProductImportView: React.FC<ProductImportViewProps> = ({
  companyId,
  activeCompanyName,
  onNavigate,
  onShowNotification,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showInstructionsTable, setShowInstructionsTable] = useState(true);

  // Parsing & Preview state
  const [isParsing, setIsParsing] = useState(false);
  const [previewData, setPreviewData] = useState<ProductImportPreview | null>(null);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download official 37-column CSV template
  const handleDownloadTemplate = () => {
    const csvContent = generateOfficialCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_produtos_37_colunas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowNotification('success', 'Modelo oficial CSV (37 colunas) baixado com sucesso!');
  };

  // Process File Selection
  const handleFileChange = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onShowNotification('error', 'Por favor, selecione um arquivo no formato .CSV.');
      return;
    }

    setSelectedFile(file);
    parseCsvFile(file);
  };

  // Parse CSV File with PapaParse and perform 37-column validation
  const parseCsvFile = (file: File) => {
    setIsParsing(true);
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (results) => {
        try {
          const rawData = results.data;
          if (!rawData || rawData.length === 0) {
            setIsParsing(false);
            onShowNotification('error', 'O arquivo selecionado está vazio.');
            return;
          }

          const rawHeaders = rawData[0].map((h) => (h || '').trim());
          const rawRows = rawData.slice(1);

          if (rawRows.length === 0) {
            setIsParsing(false);
            onShowNotification('error', 'O arquivo contém apenas o cabeçalho, sem produtos cadastrados.');
            return;
          }

          // Call preview endpoint to generate validation
          const token = localStorage.getItem('olyps_auth_token') || '';
          const response = await fetch(`/api/companies/${companyId}/products/import/preview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              headers: rawHeaders,
              rows: rawRows,
            }),
          });

          if (!response.ok) {
            // Local client-side fallback validation if network issue
            const headerValidation = validateHeaders(rawHeaders);
            const items: ProductImportRowItem[] = rawRows
              .filter((r) => r.length > 0 && r.some((c) => c && c.trim().length > 0))
              .map((row, idx) => validateRow(row, idx + 1, headerValidation.mapping));

            const localPreview: ProductImportPreview = {
              totalRows: items.length,
              validRows: items.filter((i) => i.isValid).length,
              invalidRows: items.filter((i) => !i.isValid).length,
              columnValidation: {
                valid: headerValidation.valid,
                detectedCount: headerValidation.detectedCount,
                expectedCount: headerValidation.expectedCount,
                missingColumns: headerValidation.errors,
              },
              items,
            };

            setPreviewData(localPreview);
            setCurrentStep(2);
            setIsParsing(false);
            return;
          }

          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            setPreviewData(resJson.data);
            setCurrentStep(2);
            onShowNotification(
              'success',
              `Arquivo lido com sucesso: ${resJson.data.totalRows} linhas detectadas (${resJson.data.validRows} válidas).`
            );
          } else {
            throw new Error(resJson.error?.message || 'Falha ao processar pré-visualização.');
          }
        } catch (err: any) {
          onShowNotification('error', `Erro ao ler arquivo: ${err.message}`);
        } finally {
          setIsParsing(false);
        }
      },
      error: (err) => {
        setIsParsing(false);
        onShowNotification('error', `Erro ao processar CSV: ${err.message}`);
      },
    });
  };

  // Execute real import
  const handleExecuteImport = async () => {
    if (!previewData || previewData.validRows === 0) {
      onShowNotification('error', 'Não há produtos válidos para importar.');
      return;
    }

    setIsExecuting(true);
    try {
      const validItems = previewData.items
        .filter((item) => item.isValid)
        .map((item) => item.parsed);

      const token = localStorage.getItem('olyps_auth_token') || '';
      const response = await fetch(`/api/companies/${companyId}/products/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          items: validItems,
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error?.message || 'Falha na persistência dos produtos.');
      }

      setImportResult(resJson.data);
      setCurrentStep(3);
      onShowNotification(
        'success',
        `Importação concluída! ${resJson.data.importedCount} produtos foram persistidos com sucesso.`
      );
    } catch (err: any) {
      onShowNotification('error', `Erro na importação: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset to initial step
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Catálogo de Produtos</span>
            <span>&bull;</span>
            <span className="text-slate-800 font-medium">Importar Produtos (37 Colunas)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Importação em Massa de Produtos</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Empresa ativa: <span className="font-semibold text-slate-800">{activeCompanyName}</span> &mdash; Carga e persistência homologada via arquivo CSV com validação das 37 colunas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-download-sample-template"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Baixar Modelo CSV Oficial (37 Colunas)
          </button>
        </div>
      </div>

      {/* Stepper Wizard */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Step 1 */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 1
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-500 border border-slate-300'
              }`}
            >
              1
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Seleção do Arquivo</p>
              <p className="text-[11px] text-slate-500">Upload do CSV & Regras</p>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

          {/* Step 2 */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 2
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-500 border border-slate-300'
              }`}
            >
              2
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Validação Estrutural</p>
              <p className="text-[11px] text-slate-500">Conferência das 37 Colunas</p>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

          {/* Step 3 */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === 3
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-500 border border-slate-300'
              }`}
            >
              3
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Persistência Real</p>
              <p className="text-[11px] text-slate-500">Carga no Banco de Dados</p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Upload & Instructions */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* File Upload Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Arquivo para importar
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione o arquivo .CSV do seu dispositivo contendo o cabeçalho com as 37 colunas homologadas
                </p>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/40 hover:bg-slate-50/80'
              }`}
            >
              <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">
                Arraste e solte seu arquivo .CSV aqui, ou clique para procurar no seu computador
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Formato aceito exclusivamente: <span className="font-semibold text-slate-700">.CSV</span> codificado em UTF-8
              </p>

              <input
                ref={fileInputRef}
                type="file"
                id="file-import-products-input"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <label
                  htmlFor="file-import-products-input"
                  id="label-browse-file"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Procurar Arquivo no Dispositivo
                </label>

                <button
                  type="button"
                  id="btn-download-template-action"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Baixar Planilha Modelo
                </button>
              </div>

              {isParsing && (
                <div className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Lendo e validando estrutura do CSV...</span>
                </div>
              )}
            </div>
          </div>

          {/* Instructions Table: 37 Columns Specification */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div
              onClick={() => setShowInstructionsTable(!showInstructionsTable)}
              className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Documentação Técnica: Tabela das 37 Colunas Homologadas
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Padrão OLYPS PRO
                </span>
              </div>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-800 p-1"
                aria-label="Alternar instruções"
              >
                {showInstructionsTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showInstructionsTable && (
              <div className="p-4">
                <p className="text-xs text-slate-600 mb-3">
                  A planilha deve seguir rigorosamente a ordem das 37 colunas especificadas abaixo. Colunas obrigatórias não podem conter valores vazios.
                </p>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-16 text-center">Nº</th>
                        <th className="py-2.5 px-3 w-64">Nome da Coluna</th>
                        <th className="py-2.5 px-3 w-28 text-center">Requisito</th>
                        <th className="py-2.5 px-3">Instruções e Valores Aceitos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {OFFICIAL_PRODUCT_IMPORT_COLUMNS.map((col) => (
                        <tr key={col.number} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-600">
                            {col.number}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {col.name}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {col.required ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Obrigatório
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Opcional
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 leading-relaxed">
                            {col.instruction}
                            {col.options && (
                              <div className="mt-1 text-[11px] text-emerald-700 font-mono">
                                Opções: {col.options.join(', ')}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Preview & Validation */}
      {currentStep === 2 && previewData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total de Linhas
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {previewData.totalRows}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Detectadas no arquivo</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Linhas Válidas
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {previewData.validRows}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Prontas para importar</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Linhas com Erros
              </p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {previewData.invalidRows}
              </p>
              <p className="text-[11px] text-rose-600 mt-0.5">Necessitam correção</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Colunas Detectadas
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {previewData.columnValidation.detectedCount} / 37
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {previewData.columnValidation.valid ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> 37 colunas conformes
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 inline" /> Atenção na ordem
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Validation Messages / Errors Alert if any */}
          {previewData.invalidRows > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-rose-900">
                    Inconsistências detectadas em {previewData.invalidRows} linha(s):
                  </h4>
                  <p className="text-xs text-rose-700 mt-1">
                    As linhas marcadas com erro não serão importadas ou poderão falhar durante a persistência.
                    Revise os detalhes abaixo antes de prosseguir.
                  </p>

                  <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
                    {previewData.items
                      .filter((item) => !item.isValid)
                      .flatMap((item) => item.errors)
                      .slice(0, 10)
                      .map((err, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] text-rose-800 bg-rose-100/60 px-2.5 py-1 rounded border border-rose-200 font-mono"
                        >
                          Linha {err.rowNumber} &bull; Coluna {err.columnNumber} ({err.columnName}):{' '}
                          <span className="font-semibold">{err.message}</span>
                          {err.value && (
                            <span className="text-rose-600 ml-1">(Valor: &ldquo;{err.value}&rdquo;)</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pré-visualização dos Produtos Identificados
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mostrando os registros interpretados a partir do arquivo CSV ({previewData.items.length} itens)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Trocar Arquivo
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 sticky top-0 border-b border-slate-200 z-10">
                  <tr className="text-slate-700 font-semibold">
                    <th className="py-2.5 px-3 text-center w-12">#</th>
                    <th className="py-2.5 px-3 w-20 text-center">Status</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Nome do Produto</th>
                    <th className="py-2.5 px-3 w-28">SKU</th>
                    <th className="py-2.5 px-3 w-20">Unidade</th>
                    <th className="py-2.5 px-3 w-28">Tipo</th>
                    <th className="py-2.5 px-3 w-28">Ger. Estoque</th>
                    <th className="py-2.5 px-3 w-28 text-right">P. Compra</th>
                    <th className="py-2.5 px-3 w-28 text-right">P. Venda</th>
                    <th className="py-2.5 px-3 w-28 text-right">Estoque Inic.</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Filial / Local</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.items.map((item) => {
                    const p = item.parsed;
                    return (
                      <tr
                        key={item.rowNumber}
                        className={item.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                      >
                        <td className="py-2 px-3 text-center font-mono text-slate-500 font-semibold">
                          {item.rowNumber}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.isValid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Check className="w-2.5 h-2.5 mr-1" /> Válido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-2.5 h-2.5 mr-1" /> Erro
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">{p.name || <span className="text-rose-500 italic">Vazio</span>}</div>
                          {p.brand && <span className="text-[10px] text-slate-500">Marca: {p.brand} &bull; </span>}
                          {p.category && <span className="text-[10px] text-slate-500">Cat: {p.category}</span>}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          {p.sku || <span className="text-slate-400 italic">Automático</span>}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {p.unit || <span className="text-rose-500">N/A</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-700 capitalize">
                          {p.productType}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.manageStock ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.manageStock ? 'Sim (1)' : 'Não (0)'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          {p.purchasePriceIncTax !== undefined
                            ? `R$ ${p.purchasePriceIncTax.toFixed(2)}`
                            : p.purchasePriceExcTax !== undefined
                            ? `R$ ${p.purchasePriceExcTax.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                          {p.sellingPrice !== undefined ? `R$ ${p.sellingPrice.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {p.openingStock !== undefined ? p.openingStock : '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {p.location || <span className="text-slate-400 italic">Matriz Padrão</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancelar e Escolher Outro Arquivo
            </button>

            <button
              type="button"
              id="btn-import-products-confirm"
              onClick={handleExecuteImport}
              disabled={isExecuting || previewData.validRows === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Persistindo Produtos no Banco de Dados...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar {previewData.validRows} Produto(s)
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Result & Completion */}
      {currentStep === 3 && importResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">
              Importação de Produtos Concluída com Sucesso!
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-lg mx-auto">
              Os dados foram processados e gravados de forma permanente no banco de dados da empresa{' '}
              <span className="font-semibold text-slate-800">{activeCompanyName}</span>.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Processados</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{importResult.totalRows}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Persistidos</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{importResult.importedCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Falhas</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{importResult.errorsCount}</p>
            </div>
          </div>

          {/* Imported products list preview */}
          {importResult.importedProducts && importResult.importedProducts.length > 0 && (
            <div className="max-w-2xl mx-auto text-left border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-800 flex justify-between">
                <span>Produtos Gravados com Sucesso:</span>
                <span className="text-emerald-700 font-mono">{importResult.importedProducts.length} itens</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {importResult.importedProducts.slice(0, 15).map((p) => (
                  <div key={p.id} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      <span className="ml-2 font-mono text-[11px] text-slate-500">({p.sku})</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {p.initialStock ? (
                        <span className="font-semibold text-emerald-700">
                          Estoque Inicial: {p.initialStock} {p.locationName ? `(${p.locationName})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">Sem estoque inicial</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              id="btn-view-products-list"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('/produtos');
                } else {
                  window.location.hash = '/produtos';
                }
              }}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Package className="w-4 h-4 mr-2" />
              Ver Produtos no Catálogo
            </button>

            <button
              type="button"
              id="btn-import-more-products"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Importar Nova Planilha
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
