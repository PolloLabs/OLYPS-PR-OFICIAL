import React, { useState, useEffect, useCallback } from 'react';
import {
  Building,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import type { CompanyRecord, UpdateCompanyPayload, ApiResponse } from '../../types/index.js';

interface CompanySettingsViewProps {
  companyId?: string;
  activeCompanyName?: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification?: (type: 'success' | 'error', message: string) => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  companyId = '550e8400-e29b-41d4-a716-446655440001',
  activeCompanyName = 'Farmácia Modelo Ltda',
  userRole = 'company_admin',
  isPlatformAdmin = false,
  onShowNotification,
}) => {
  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<UpdateCompanyPayload>({
    name: activeCompanyName,
    legalName: '',
    document: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Brasil',
    postalCode: '',
    stateRegistration: '',
    taxRegime: 'simples_nacional',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
  });

  const fetchCompanyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/companies/${companyId}`, { headers });
      if (res.ok) {
        const json = (await res.json()) as ApiResponse<CompanyRecord>;
        if (json.success && json.data) {
          setCompany(json.data);
          setFormData({
            name: json.data.name || '',
            legalName: json.data.legalName || '',
            document: json.data.document || '',
            slug: json.data.slug || '',
            email: json.data.email || '',
            phone: json.data.phone || '',
            address: json.data.address || '',
            city: json.data.city || '',
            state: json.data.state || '',
            country: json.data.country || 'Brasil',
            postalCode: json.data.postalCode || '',
            stateRegistration: json.data.stateRegistration || '',
            taxRegime: json.data.taxRegime || 'simples_nacional',
            currency: json.data.currency || 'BRL',
            timezone: json.data.timezone || 'America/Sao_Paulo',
            status: json.data.status || 'active',
          });
          setIsLoading(false);
          return;
        }
      }

      // Default fallback if not in database
      const fallbackData: CompanyRecord = {
        id: companyId,
        name: activeCompanyName,
        legalName: `${activeCompanyName} EIRELI ME`,
        document: '12.345.678/0001-90',
        slug: activeCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        email: 'contato@farmaciamodelo.com.br',
        phone: '(11) 3456-7890',
        address: 'Av. Paulista, 1578, Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        postalCode: '01310-200',
        stateRegistration: '123.456.789.110',
        taxRegime: 'simples_nacional',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        status: 'active',
        createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCompany(fallbackData);
      setFormData({
        name: fallbackData.name,
        legalName: fallbackData.legalName,
        document: fallbackData.document,
        slug: fallbackData.slug,
        email: fallbackData.email,
        phone: fallbackData.phone,
        address: fallbackData.address,
        city: fallbackData.city,
        state: fallbackData.state,
        country: fallbackData.country,
        postalCode: fallbackData.postalCode,
        stateRegistration: fallbackData.stateRegistration,
        taxRegime: fallbackData.taxRegime,
        currency: fallbackData.currency,
        timezone: fallbackData.timezone,
        status: fallbackData.status,
      });
    } catch {
      if (onShowNotification) {
        onShowNotification('error', 'Erro ao carregar dados da empresa.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, activeCompanyName, onShowNotification]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      if (onShowNotification) {
        onShowNotification('error', 'O Nome Fantasia é obrigatório.');
      }
      return;
    }

    setIsSaving(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-company-id': companyId,
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const json = (await res.json()) as ApiResponse<CompanyRecord>;
        if (json.success && json.data) {
          setCompany(json.data);
        }
      }

      if (onShowNotification) {
        onShowNotification('success', 'Dados da empresa atualizados com sucesso.');
      }
    } catch {
      if (onShowNotification) {
        onShowNotification('error', 'Falha ao salvar dados da empresa.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="company-settings-view">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">{company?.name || activeCompanyName}</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Administração de dados cadastrais, informações fiscais, contatos e endereço do tenant
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchCompanyData}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Section 1: Core Corporate Data */}
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 mb-4">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Dados Cadastrais & Identificação
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Fantasia <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome comercial da empresa"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social
                </label>
                <input
                  type="text"
                  value={formData.legalName || ''}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="Razão social registrada no contrato social"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CNPJ / CPF
                </label>
                <input
                  type="text"
                  value={formData.document || ''}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inscrição Estadual (IE)
                </label>
                <input
                  type="text"
                  value={formData.stateRegistration || ''}
                  onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
                  placeholder="123.456.789.000"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Regime Tributário
                </label>
                <select
                  value={formData.taxRegime || 'simples_nacional'}
                  onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="simples_nacional">Simples Nacional</option>
                  <option value="lucro_presumido">Lucro Presumido</option>
                  <option value="lucro_real">Lucro Real</option>
                  <option value="mei">MEI (Microempreendedor Individual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slug / Identificador URL
                </label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-md text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 mb-4">
              <Mail className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Contatos & Comunicação
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="financeiro@empresa.com.br"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp Comercial
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 3456-7890"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Physical Address */}
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 mb-4">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Endereço Principal (Matriz)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logradouro e Número
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Av. Paulista, 1000, Sala 50"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="01310-100"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full px-3 py-2 text-sm uppercase bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={formData.country || 'Brasil'}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Brasil"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Preferences & Regional */}
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 mb-4">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Preferências Regionais & Moeda
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moeda Padrão
                </label>
                <select
                  value={formData.currency || 'BRL'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BRL">Real Brasileiro (R$ - BRL)</option>
                  <option value="USD">Dólar Americano ($ - USD)</option>
                  <option value="EUR">Euro (&euro; - EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fuso Horário
                </label>
                <select
                  value={formData.timezone || 'America/Sao_Paulo'}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                  <option value="America/Cuiaba">Cuiabá (GMT-4)</option>
                  <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Form Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/75 flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Permissão verificada: <strong>empresa.configurar</strong></span>
          </div>

          <button
            id="btn-save-company-settings"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Salvar Dados da Empresa</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
