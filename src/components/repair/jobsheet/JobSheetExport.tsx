import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { JobSheet } from '../../../types/repair.types.js';

interface JobSheetExportProps {
  jobSheets: JobSheet[];
}

export const JobSheetExport: React.FC<JobSheetExportProps> = ({ jobSheets }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatBRL = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const getExportData = () => {
    return jobSheets.map((item) => ({
      'Número OS': item.jobSheetNumber,
      'Cliente': item.customerName,
      'Telefone': item.customerPhone,
      'Dispositivo': item.deviceType,
      'Marca': item.brand,
      'Modelo': item.model,
      'Nº de Série': item.serialNumber || 'N/A',
      'Defeito Relatado': item.reportedDefect,
      'Técnico': item.technicianName || 'Não atribuído',
      'Status': item.status,
      'Prioridade': item.priority,
      'Orçamento (R$)': formatBRL(item.estimatedCostCents),
      'Valor Final (R$)': formatBRL(item.finalCostCents),
      'Garantia (dias)': item.warrantyDays || 90,
      'Data de Entrada': new Date(item.createdAt).toLocaleDateString('pt-BR'),
    }));
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const data = getExportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordens de Serviço');
      XLSX.writeFile(workbook, `Relatorio_Reparos_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setSuccessMessage('Planilha Excel gerada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const data = getExportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Ordens_Servico_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMessage('Arquivo CSV exportado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {successMessage && (
        <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1 animate-fade-in">
          <Check className="w-3.5 h-3.5" />
          {successMessage}
        </span>
      )}

      <button
        type="button"
        onClick={handleExportExcel}
        disabled={isExporting || jobSheets.length === 0}
        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
        title="Exportar dados para Excel (.xlsx)"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
        <span>Excel</span>
      </button>

      <button
        type="button"
        onClick={handleExportCSV}
        disabled={isExporting || jobSheets.length === 0}
        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
        title="Exportar dados para CSV"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>CSV</span>
      </button>
    </div>
  );
};
