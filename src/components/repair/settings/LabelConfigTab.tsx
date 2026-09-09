import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Save,
  CheckCircle2,
  Tag,
  User,
  Smartphone,
  Info,
  Sliders,
  QrCode,
  Barcode,
} from 'lucide-react';
import type { LabelSettings } from '../../../types/repair.types.js';

interface LabelConfigTabProps {
  settings: LabelSettings;
  onSave: (data: Partial<LabelSettings>) => Promise<LabelSettings>;
}

export const LabelConfigTab: React.FC<LabelConfigTabProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<LabelSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
      const msg = err instanceof Error ? err.message : 'Erro ao salvar configurações de etiqueta';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintTest = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=600,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teste de Impressão - Etiqueta Térmica</title>
          <style>
            @page {
              size: ${formData.labelWidthMM}mm ${formData.labelHeightMM}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 6px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
              font-size: 10px;
              line-height: 1.2;
              color: #000;
              background: #fff;
              width: ${formData.labelWidthMM}mm;
              height: ${formData.labelHeightMM}mm;
              box-sizing: border-box;
            }
            .barcode-line {
              font-family: monospace;
              letter-spacing: 2px;
              font-weight: bold;
              text-align: center;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header & Action Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-4 z-20 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Configuração de Etiqueta Térmica & PDF</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalize as dimensões e os dados que serão impressos na etiqueta fixada nos aparelhos em bancada.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvo com sucesso!</span>
            </span>
          )}
          <button
            type="button"
            onClick={handlePrintTest}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shrink-0"
            title="Abrir pré-visualização de impressão real"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Testar Impressão</span>
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Etiqueta'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Grid: Settings vs Real-Time Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Controls & Checkboxes (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Dimensões da Etiqueta */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
              <Sliders className="w-4 h-4" />
              <span>Dimensões do Rolo / Etiqueta Térmica</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Largura (mm) *</label>
                <input
                  type="number"
                  min={30}
                  max={150}
                  value={formData.labelWidthMM}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelWidthMM: parseInt(e.target.value, 10) || 60,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 50mm, 60mm, 80mm</span>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Altura (mm) *</label>
                <input
                  type="number"
                  min={20}
                  max={150}
                  value={formData.labelHeightMM}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelHeightMM: parseInt(e.target.value, 10) || 40,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 30mm, 40mm, 50mm</span>
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
              <User className="w-4 h-4" />
              <span>Informações do Cliente</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.customerInfo.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerInfo: { ...formData.customerInfo, name: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Nome do Cliente</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.customerInfo.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerInfo: { ...formData.customerInfo, phone: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Telefone Principal</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.customerInfo.alternatePhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerInfo: { ...formData.customerInfo, alternatePhone: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Telefone Recado</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.customerInfo.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerInfo: { ...formData.customerInfo, email: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">E-mail</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.customerInfo.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerInfo: { ...formData.customerInfo, address: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Endereço</span>
              </label>
            </div>
          </div>

          {/* Dados do Dispositivo */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
              <Smartphone className="w-4 h-4" />
              <span>Dados do Equipamento</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.deviceInfo.brandModel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deviceInfo: { ...formData.deviceInfo, brandModel: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Marca & Modelo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.deviceInfo.imeiSerial}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deviceInfo: { ...formData.deviceInfo, imeiSerial: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">IMEI / Serial</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.deviceInfo.location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deviceInfo: { ...formData.deviceInfo, location: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Localização / Gaveta</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.deviceInfo.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deviceInfo: { ...formData.deviceInfo, password: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Senha / Padrão</span>
              </label>
            </div>
          </div>

          {/* Detalhes da OS & Atendimento */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
              <Tag className="w-4 h-4" />
              <span>Detalhes da Ordem de Serviço</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.labelDetails.barcode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelDetails: { ...formData.labelDetails, barcode: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Código de Barras</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.labelDetails.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelDetails: { ...formData.labelDetails, status: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Status da OS</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.labelDetails.dueDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelDetails: { ...formData.labelDetails, dueDate: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Previsão de Entrega</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.labelDetails.salesPerson}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelDetails: { ...formData.labelDetails, salesPerson: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Atendente / Vendedor</span>
              </label>
            </div>
          </div>

          {/* Informações Técnicas */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
              <Info className="w-4 h-4" />
              <span>Informações Técnicas</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.labelInformation.technician}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelInformation: { ...formData.labelInformation, technician: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Técnico Responsável</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.labelInformation.problem}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      labelInformation: { ...formData.labelInformation, problem: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Defeito Relatado</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Thermal Label Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>Prévia em Tempo Real ({formData.labelWidthMM}mm × {formData.labelHeightMM}mm)</span>
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Escala 1:1
              </span>
            </div>

            {/* Simulated Thermal Label (White with thermal print aesthetic) */}
            <div className="bg-slate-800/80 p-6 rounded-lg flex items-center justify-center overflow-auto min-h-[340px]">
              <div
                ref={printRef}
                style={{
                  width: `${formData.labelWidthMM * 4}px`,
                  minHeight: `${formData.labelHeightMM * 4}px`,
                }}
                className="bg-white text-slate-900 p-3 rounded shadow-lg border border-slate-300 flex flex-col justify-between text-[11px] font-mono leading-tight select-none transition-all"
              >
                {/* Header: OS Number & Company */}
                <div>
                  <div className="flex items-start justify-between border-b border-black pb-1 mb-1.5">
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">OLYPS ASSISTÊNCIA</div>
                      <div className="text-[9px] text-slate-600">ORDEM DE SERVIÇO</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm tracking-tight text-black">OS-2026-001</div>
                      {formData.labelDetails.dueDate && (
                        <div className="text-[9px] text-slate-600">Prev: 28/09 18h</div>
                      )}
                    </div>
                  </div>

                  {/* Device Section */}
                  {(formData.deviceInfo.brandModel || formData.deviceInfo.imeiSerial || formData.deviceInfo.location || formData.deviceInfo.password) && (
                    <div className="mb-1.5 border-b border-slate-300 pb-1">
                      {formData.deviceInfo.brandModel && (
                        <div className="font-bold text-xs">Apple iPhone 15 Pro Max</div>
                      )}
                      {formData.deviceInfo.imeiSerial && (
                        <div className="text-[10px]">IMEI: 354892019482910</div>
                      )}
                      <div className="flex justify-between text-[10px] text-slate-700">
                        {formData.deviceInfo.location && <span>Gaveta: B-04</span>}
                        {formData.deviceInfo.password && <span>Senha: 123456</span>}
                      </div>
                    </div>
                  )}

                  {/* Customer Section */}
                  {(formData.customerInfo.name || formData.customerInfo.phone || formData.customerInfo.email || formData.customerInfo.address) && (
                    <div className="mb-1.5 border-b border-slate-300 pb-1 text-[10px]">
                      {formData.customerInfo.name && (
                        <div className="font-semibold text-slate-900">Cli: Carlos Eduardo Mendes</div>
                      )}
                      {formData.customerInfo.phone && <div>Tel: (11) 98765-4321</div>}
                      {formData.customerInfo.address && <div className="text-[9px]">Av. Paulista, 1000 - SP</div>}
                      {formData.customerInfo.email && <div className="text-[9px]">carlos@email.com</div>}
                    </div>
                  )}

                  {/* Technical Defect */}
                  {formData.labelInformation.problem && (
                    <div className="text-[10px] text-slate-800 mb-1">
                      <strong>Defeito:</strong> Display sem imagem / touch inoperante após queda.
                    </div>
                  )}

                  {formData.labelInformation.technician && (
                    <div className="text-[9px] text-slate-600">
                      Técnico Resp: Rodrigo Alves
                    </div>
                  )}
                </div>

                {/* Footer: Barcode / QR Code & Status */}
                <div className="mt-2 pt-1 border-t border-black text-center">
                  {formData.labelDetails.barcode && (
                    <div className="flex flex-col items-center my-0.5">
                      <Barcode className="w-full h-8 text-black" />
                      <span className="text-[9px] tracking-widest font-mono font-bold">
                        *OS-2026-001*
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] font-bold mt-1">
                    {formData.labelDetails.status && (
                      <span className="uppercase bg-black text-white px-1 py-0.5 rounded text-[8px]">
                        EM BANCADA
                      </span>
                    )}
                    {formData.labelDetails.salesPerson && (
                      <span className="text-slate-600">Atend: Patrícia</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Compatível com impressoras térmicas Zebra, Elgin, Argox, Bematech e EPSON via Spooler ou PDF nativo.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};
