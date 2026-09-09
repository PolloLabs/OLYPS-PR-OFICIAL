import React, { useState, useEffect } from 'react';
import {
  Truck,
  Building2,
  Calendar,
  FileText,
  Clock,
  MapPin,
  Upload,
  AlertCircle,
  Plus,
} from 'lucide-react';
import type { PurchaseFormData, PurchaseSupplier } from '../../types/purchase.types.js';

interface PurchaseHeaderFormProps {
  companyId: string;
  formData: PurchaseFormData;
  updateHeaderField: (field: string, value: any) => void;
}

interface CompanyLocationOption {
  id: string;
  name: string;
  address?: string;
}

export const PurchaseHeaderForm: React.FC<PurchaseHeaderFormProps> = ({
  companyId,
  formData,
  updateHeaderField,
}) => {
  const [suppliers, setSuppliers] = useState<PurchaseSupplier[]>([]);
  const [locations, setLocations] = useState<CompanyLocationOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Carregar Fornecedores e Localizações da Empresa
  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('olyps_auth_token') : '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-company-id': companyId,
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // 1. Fornecedores
        try {
          const resSuppliers = await fetch(`/api/companies/${companyId}/suppliers`, { headers });
          if (resSuppliers.ok) {
            const data = await resSuppliers.json();
            if (data.success && Array.isArray(data.data)) {
              if (isMounted) setSuppliers(data.data);
            }
          }
        } catch {
          // Fallback para fornecedores padrão
        }

        // 2. Localizações
        try {
          const resLoc = await fetch(`/api/companies/${companyId}/locations`, { headers });
          if (resLoc.ok) {
            const data = await resLoc.json();
            if (data.success && Array.isArray(data.data)) {
              if (isMounted) setLocations(data.data);
            }
          }
        } catch {
          // Fallback
        }
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  // Lista padrão de fornecedores se nenhum retornado da API
  const supplierList: PurchaseSupplier[] =
    suppliers.length > 0
      ? suppliers
      : [
          {
            id: 'sup-1',
            name: 'Distribuidora Tech Brasil Ltda',
            tradeName: 'Tech Brasil',
            document: '12.345.678/0001-90',
            address: 'Av. das Nações Unidas, 14200 - São Paulo, SP',
            phone: '(11) 3456-7890',
            email: 'vendas@techbrasil.com.br',
          },
          {
            id: 'sup-2',
            name: 'Mega Eletrônicos & Peças Importadas',
            tradeName: 'Mega Peças',
            document: '98.765.432/0001-11',
            address: 'Rua Santa Ifigênia, 450 - São Paulo, SP',
            phone: '(11) 2233-4455',
            email: 'contato@megapieces.com.br',
          },
          {
            id: 'sup-3',
            name: 'Global Acessórios & Componentes',
            tradeName: 'Global Componentes',
            document: '45.678.901/0001-23',
            address: 'Rodovia Anhanguera, km 110 - Campinas, SP',
            phone: '(19) 3344-5566',
            email: 'comercial@globalcomp.com.br',
          },
        ];

  // Lista padrão de localizações se não houver
  const locationList: CompanyLocationOption[] =
    locations.length > 0
      ? locations
      : [
          { id: 'loc-main', name: 'Matriz - Loja Principal', address: 'Av. Paulista, 1000' },
          { id: 'loc-depot', name: 'Depósito e Almoxarifado Central', address: 'Rua das Indústrias, 250' },
          { id: 'loc-branch-1', name: 'Filial Shopping Norte', address: 'Av. Marginal Norte, 500' },
        ];

  // Auto-selecionar primeira localização se não estiver preenchido
  useEffect(() => {
    if (!formData.companyLocationId && locationList.length > 0) {
      updateHeaderField('companyLocationId', locationList[0].id);
    }
  }, [formData.companyLocationId, locationList, updateHeaderField]);

  // Formatar data para input type="date"
  const formattedDate =
    formData.purchaseDate instanceof Date && !isNaN(formData.purchaseDate.getTime())
      ? formData.purchaseDate.toISOString().split('T')[0]
      : typeof formData.purchaseDate === 'string'
        ? (formData.purchaseDate as string).split('T')[0]
        : '';

  const handleSupplierChange = (supId: string) => {
    updateHeaderField('supplierId', supId);
    const selected = supplierList.find((s) => s.id === supId);
    if (selected && selected.address && !formData.address) {
      updateHeaderField('address', selected.address);
    }
  };

  return (
    <div id="purchase-header-form" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
        <FileText className="w-5 h-5 text-indigo-600" />
        <h2 className="text-base font-bold text-slate-800">Dados da Compra e Fornecedor</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fornecedor */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Fornecedor <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              required
            >
              <option value="">Selecione o fornecedor...</option>
              {supplierList.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} {sup.document ? `(${sup.document})` : ''}
                </option>
              ))}
            </select>
            <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Número de Referência */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Número de Referência / NF-e</label>
          <input
            type="text"
            value={formData.referenceNumber}
            onChange={(e) => updateHeaderField('referenceNumber', e.target.value)}
            placeholder="Ex: NF-e 001.458.922"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Data da Compra */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Data da Compra <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={formattedDate}
              onChange={(e) => {
                const val = e.target.value;
                updateHeaderField('purchaseDate', val ? new Date(val + 'T12:00:00') : new Date());
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Status da Compra */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Status da Compra <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => updateHeaderField('status', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            required
          >
            <option value="">Selecione o status...</option>
            <option value="received">Recebido (Estoque Atualizado)</option>
            <option value="pending">Pendente (Aguardando Entrega)</option>
            <option value="requested">Solicitado (Pedido Enviado)</option>
          </select>
        </div>

        {/* Localização da Empresa */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Localização / Filial de Entrada <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.companyLocationId}
              onChange={(e) => updateHeaderField('companyLocationId', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              required
            >
              <option value="">Selecione a filial/loja...</option>
              {locationList.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Termo de Pagamento */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Condição / Termo de Pagamento</label>
          <div className="relative">
            <select
              value={formData.paymentTerm}
              onChange={(e) => {
                const term = e.target.value;
                updateHeaderField('paymentTerm', term);
                if (term === 'a_vista') updateHeaderField('paymentTermDays', 0);
                if (term === '30_dias') updateHeaderField('paymentTermDays', 30);
                if (term === '60_dias') updateHeaderField('paymentTermDays', 60);
                if (term === '90_dias') updateHeaderField('paymentTermDays', 90);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="">Selecione a condição...</option>
              <option value="a_vista">À Vista (0 dias)</option>
              <option value="15_dias">15 Dias</option>
              <option value="30_dias">30 Dias</option>
              <option value="45_dias">45 Dias</option>
              <option value="60_dias">60 Dias</option>
              <option value="90_dias">90 Dias</option>
              <option value="personalizado">Personalizado</option>
            </select>
            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Dias do Prazo */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Dias de Prazo</label>
          <input
            type="number"
            min="0"
            value={formData.paymentTermDays}
            onChange={(e) => updateHeaderField('paymentTermDays', Number(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder="30"
          />
        </div>

        {/* Anexo de Documento */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Anexar Documento / Fatura</label>
          <label className="flex items-center gap-2 px-3 py-2 text-xs border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors">
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="truncate">
              {formData.attachedFile ? formData.attachedFile.name : 'Selecionar arquivo (XML, PDF)...'}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateHeaderField('attachedFile', file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Endereço / Notas de Entrega */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Endereço do Fornecedor / Observações de Logística
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateHeaderField('address', e.target.value)}
            placeholder="Endereço completo de faturamento ou coleta da mercadoria..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>
    </div>
  );
};

export default PurchaseHeaderForm;
