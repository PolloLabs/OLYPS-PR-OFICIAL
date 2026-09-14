import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Landmark,
  Boxes,
  CreditCard,
  TrendingUp,
  Store,
  ShoppingBag,
  Wallet,
  LayoutDashboard,
  Cpu,
  Hash,
  Mail,
  MessageSquare,
  Award,
  Blocks,
  Tags,
  Search,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Sparkles,
  ChevronRight,
  Info,
  Percent,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';
import type {
  CompanyBusinessSettings,
  BusinessSettingsTabId,
  CompanyTaxRateItem,
} from '../../types/businessSettings.types.js';
import type { ApiResponse } from '../../types/api.types.js';

interface BusinessSettingsViewProps {
  companyId: string;
  activeCompanyName?: string;
  userRole?: string;
  isPlatformAdmin?: boolean;
  onShowNotification?: (notification: {
    type: 'success' | 'error' | 'info';
    message: string;
    description?: string;
  }) => void;
}

interface TabItemConfig {
  id: BusinessSettingsTabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const ALL_TABS: TabItemConfig[] = [
  {
    id: 'empresa',
    label: 'Empresa',
    description: 'Parâmetros corporativos fundamentais, moeda, ano fiscal e identidade visual',
    icon: Building2,
    features: ['Dados cadastrais', 'Moeda e fuso horário', 'Logotipo da loja', 'Ano fiscal e métodos contábeis'],
  },
  {
    id: 'impostos',
    label: 'Impostos',
    description: 'Tributações, regras de alíquotas fiscais, regimes tributários e retenções',
    icon: Landmark,
    features: ['Regime tributário', 'Alíquotas de ICMS/ISS', 'PIS/COFINS', 'Regras fiscais por estado'],
  },
  {
    id: 'produtos',
    label: 'Produtos',
    description: 'Configurações de catálogo, SKUs, alertas de estoque mínimo e numeração',
    icon: Boxes,
    features: ['Padrão de SKU', 'Validade e lotes', 'Alerta de estoque baixo', 'Unidades e conversões'],
  },
  {
    id: 'credito',
    label: 'Credito',
    description: 'Políticas de limite de crédito para clientes, prazos e regras de inadimplência',
    icon: CreditCard,
    features: ['Limite padrão de crédito', 'Bloqueio automático por atraso', 'Juros e mora', 'Análise de risco'],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    description: 'Parâmetros de orçamentos, comissões de vendedores e descontos permitidos',
    icon: TrendingUp,
    features: ['Desconto máximo permitido', 'Validade de orçamentos', 'Regras de comissão', 'Venda fracionada'],
  },
  {
    id: 'pdv',
    label: 'PDV',
    description: 'Comportamento do Ponto de Venda, teclas de atalho, caixas e impressão de cupom',
    icon: Store,
    features: ['Fechamento cego de caixa', 'Atalhos de teclado rápidos', 'Impressão térmica automática', 'Sangrias e suprimentos'],
  },
  {
    id: 'compras',
    label: 'Compras',
    description: 'Regras de recebimento de mercadorias, conferência cega e ordens de compra',
    icon: ShoppingBag,
    features: ['Aprovação de pedidos de compra', 'Conferência cega de notas', 'Custo de frete rateado', 'Lançamento de XML'],
  },
  {
    id: 'pagamentos',
    label: 'Pagamentos',
    description: 'Métodos aceitos, credenciadoras de cartão, integração PIX e contas bancárias',
    icon: Wallet,
    features: ['Gateways e maquininhas', 'Chaves PIX e conciliação', 'Contas financeiras', 'Taxas de cartão'],
  },
  {
    id: 'painel',
    label: 'Painel',
    description: 'Widgets do dashboard principal, metas exibidas e relatórios rápidos da gerência',
    icon: LayoutDashboard,
    features: ['Gráficos padrão exibidos', 'Indicadores de metas', 'Filtro inicial de lojas', 'Privacidade de faturamento'],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    description: 'Configurações de sessão, tempo de expiração, backups e temas visuais',
    icon: Cpu,
    features: ['Tempo de expiração de sessão', 'Backup automatizado', 'Logs operacionais', 'Modo de depuração'],
  },
  {
    id: 'prefixos',
    label: 'Prefixos',
    description: 'Prefixos e sequências de numeração para pedidos, faturas, compras e reparos',
    icon: Hash,
    features: ['Prefixo de vendas (VEN-)', 'Prefixo de compras (COM-)', 'Prefixo de O.S. (OS-)', 'Sequência numérica'],
  },
  {
    id: 'email',
    label: 'E-mail',
    description: 'Servidor SMTP para envio de faturas, orçamentos e relatórios aos clientes',
    icon: Mail,
    features: ['Configuração SMTP/TLS', 'Remetente padrão', 'Templates de e-mail', 'Teste de envio de mensagens'],
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Provedores de mensagens SMS para avisos de entrega, status de ordens e cobranças',
    icon: MessageSquare,
    features: ['Provedor de SMS', 'Mensagens de boas-vindas', 'Avisos de prontidão de reparo', 'Alerta de vencimento'],
  },
  {
    id: 'pontos_recompensa',
    label: 'Pontos de Recompensa',
    description: 'Programa de fidelidade, conversão de pontos por compras e resgates no caixa',
    icon: Award,
    features: ['Equivalência de pontos (R$ gastos = pts)', 'Validade dos pontos', 'Resgate mínimo no PDV', 'Níveis de cliente'],
  },
  {
    id: 'modulos',
    label: 'Módulos',
    description: 'Ativação e desativação de módulos complementares no sistema para a empresa',
    icon: Blocks,
    features: ['Módulo de Reparos/Assistência', 'Módulo de Restaurante/Mesas', 'CRM & Funil de Vendas', 'Cobranças automáticas'],
  },
  {
    id: 'etiquetas_personalizadas',
    label: 'Etiquetas Personalizadas',
    description: 'Modelos de etiquetas de gôndola, joalheria, código de barras e precificação',
    icon: Tags,
    features: ['Etiquetas térmicas Zebra/Argox', 'Etiquetas de folhas A4 (Pimaco)', 'Campos customizáveis', 'Impressão de QR Code'],
  },
];

const TIMEZONE_OPTIONS = [
  { value: 'America/Sao_Paulo', label: 'Brasília / Sudeste / Sul (UTC-3)' },
  { value: 'America/Manaus', label: 'Amazonas - Manaus (UTC-4)' },
  { value: 'America/Cuiaba', label: 'Mato Grosso / MS - Cuiabá (UTC-4)' },
  { value: 'America/Fortaleza', label: 'Nordeste - Fortaleza (UTC-3)' },
  { value: 'America/Belem', label: 'Norte - Belém / Pará (UTC-3)' },
  { value: 'America/Recife', label: 'Nordeste - Recife (UTC-3)' },
  { value: 'America/Porto_Velho', label: 'Rondônia - Porto Velho (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Acre - Rio Branco (UTC-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-2)' },
];

const MONTHS_OPTIONS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export const BusinessSettingsView: React.FC<BusinessSettingsViewProps> = ({
  companyId,
  activeCompanyName = 'TechStore Brasil Matriz',
  userRole = 'company_admin',
  isPlatformAdmin = false,
  onShowNotification,
}) => {
  // Controle de permissão RBAC: apenas admin da empresa ou platform_admin pode configurar
  const hasAccess = useMemo(() => {
    if (isPlatformAdmin) return true;
    const role = (userRole || '').toLowerCase();
    return role.includes('admin') || role.includes('gerente') || role === 'owner' || role === 'super_admin';
  }, [userRole, isPlatformAdmin]);

  // Estados de navegação
  const [activeTab, setActiveTab] = useState<BusinessSettingsTabId>('empresa');
  const [tabSearchQuery, setTabSearchQuery] = useState('');

  // Estados dos dados da aba Empresa
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [settings, setSettings] = useState<CompanyBusinessSettings>({
    companyId,
    name: activeCompanyName,
    startDate: '2026-01-15',
    defaultProfitPercent: 25,
    currency: 'BRL',
    currencySymbolPlacement: 'before',
    timezone: 'America/Sao_Paulo',
    logoUrl: '',
    logoName: '',
    fiscalYearStartMonth: 1,
    accountingMethod: 'fifo',
    transactionEditDays: 30,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    currencyPrecision: 2,
    quantityPrecision: 2,
    defaultTaxRate: 10,
    autoApplyTaxInPOS: false,
    taxCalculationType: 'exclusive',
    taxRegime: 'simples_nacional',
    taxRates: [],
  });

  // Estados específicos da Aba Impostos (CRUD de Taxas)
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<CompanyTaxRateItem | null>(null);
  const [taxForm, setTaxForm] = useState<{
    name: string;
    rate: string;
    type: 'standard' | 'additional';
    isActive: boolean;
  }>({
    name: '',
    rate: '',
    type: 'standard',
    isActive: true,
  });
  const [taxFormError, setTaxFormError] = useState<string | null>(null);
  const [taxToDelete, setTaxToDelete] = useState<CompanyTaxRateItem | null>(null);
  const [isSavingTax, setIsSavingTax] = useState(false);
  const [taxSearchQuery, setTaxSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega as configurações da empresa do endpoint backend
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || localStorage.getItem('token') || '';
      const isPlatformAdminContext = isPlatformAdmin || localStorage.getItem('olyps_is_platform_admin') === 'true';
      const headers: Record<string, string> = {
        'x-company-id': companyId,
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      if (isPlatformAdminContext) {
        headers['x-platform-admin'] = 'true';
      }

      const res = await fetch(`/api/companies/${companyId}/business-settings`, { headers });
      if (res.ok) {
        const json = (await res.json()) as ApiResponse<CompanyBusinessSettings>;
        if (json.success && json.data) {
          setSettings({
            ...json.data,
            defaultTaxRate: json.data.defaultTaxRate !== undefined ? json.data.defaultTaxRate : 10,
            autoApplyTaxInPOS: json.data.autoApplyTaxInPOS !== undefined ? json.data.autoApplyTaxInPOS : false,
            taxCalculationType: json.data.taxCalculationType || 'exclusive',
            taxRegime: json.data.taxRegime || 'simples_nacional',
            taxRates: json.data.taxRates || [],
          });
          setIsLoading(false);
          return;
        }
      }

      // Fallback para endpoint legado /settings se disponível
      const fallbackRes = await fetch(`/api/companies/${companyId}/settings`, { headers });
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        if (json.success && json.data) {
          setSettings((prev) => ({
            ...prev,
            ...json.data,
            defaultTaxRate: json.data.defaultTaxRate !== undefined ? json.data.defaultTaxRate : (prev.defaultTaxRate ?? 10),
            autoApplyTaxInPOS: json.data.autoApplyTaxInPOS !== undefined ? json.data.autoApplyTaxInPOS : (prev.autoApplyTaxInPOS ?? false),
            taxCalculationType: json.data.taxCalculationType || prev.taxCalculationType || 'exclusive',
            taxRegime: json.data.taxRegime || prev.taxRegime || 'simples_nacional',
            taxRates: json.data.taxRates || prev.taxRates || [],
          }));
        }
      }
    } catch (err) {
      console.warn('[BusinessSettings] Falha ao carregar configurações:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [companyId]);

  // Filtro de abas por busca rápida
  const filteredTabs = useMemo(() => {
    if (!tabSearchQuery.trim()) return ALL_TABS;
    const q = tabSearchQuery.toLowerCase().trim();
    return ALL_TABS.filter(
      (tab) => tab.label.toLowerCase().includes(q) || tab.description.toLowerCase().includes(q)
    );
  }, [tabSearchQuery]);

  // Manipulador de upload de logo (limite de 300KB)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_KB = 300;
    const fileSizeKb = file.size / 1024;

    if (fileSizeKb > MAX_SIZE_KB) {
      onShowNotification?.({
        type: 'error',
        message: 'Arquivo de logo muito grande',
        description: `O arquivo selecionado possui ${fileSizeKb.toFixed(0)} KB. O tamanho máximo permitido é de ${MAX_SIZE_KB} KB.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setSettings((prev) => ({
        ...prev,
        logoUrl: base64Data,
        logoName: file.name,
      }));
      onShowNotification?.({
        type: 'info',
        message: 'Logo carregada no formulário',
        description: 'Clique em "Salvar configurações" para confirmar e persistir a alteração.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({
      ...prev,
      logoUrl: '',
      logoName: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função auxiliar centralizada de persistência em disco/servidor
  const persistSettingsToServer = async (payload: CompanyBusinessSettings): Promise<CompanyBusinessSettings> => {
    const authToken = localStorage.getItem('olyps_auth_token') || localStorage.getItem('token') || '';
    const isPlatformAdminContext = isPlatformAdmin || localStorage.getItem('olyps_is_platform_admin') === 'true';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-company-id': companyId,
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    if (isPlatformAdminContext) {
      headers['x-platform-admin'] = 'true';
    }

    const res = await fetch(`/api/companies/${companyId}/business-settings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Não foi possível salvar as configurações no servidor.');
    }

    const json = (await res.json()) as ApiResponse<CompanyBusinessSettings>;
    if (json.success && json.data) {
      setSettings(json.data);
      return json.data;
    }
    return payload;
  };

  // Salvar configurações gerais (Aba Empresa)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação inline
    if (!settings.name || !settings.name.trim()) {
      setNameError('O nome da empresa é obrigatório.');
      setActiveTab('empresa');
      return;
    }
    setNameError(null);

    setIsSaving(true);
    try {
      await persistSettingsToServer(settings);

      onShowNotification?.({
        type: 'success',
        message: 'Configurações salvas com sucesso',
        description: 'Os parâmetros da empresa foram atualizados e sincronizados no sistema.',
      });
    } catch (err: any) {
      console.error('[BusinessSettings] Erro ao salvar:', err);
      onShowNotification?.({
        type: 'error',
        message: 'Erro ao salvar configurações',
        description: err.message || 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar Regras da Empresa (Aba Impostos)
  const handleSaveTaxRules = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await persistSettingsToServer(settings);
      onShowNotification?.({
        type: 'success',
        message: 'Regras de impostos salvas com sucesso',
        description: 'Alíquota padrão e parâmetros fiscais sincronizados com o PDV e catálogo.',
      });
    } catch (err: any) {
      console.error('[BusinessSettings] Erro ao salvar regras de impostos:', err);
      onShowNotification?.({
        type: 'error',
        message: 'Erro ao salvar regras tributárias',
        description: err.message || 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Funções de CRUD de Taxas de Imposto
  const handleOpenAddTax = () => {
    setEditingTax(null);
    setTaxForm({
      name: '',
      rate: '',
      type: 'standard',
      isActive: true,
    });
    setTaxFormError(null);
    setIsTaxModalOpen(true);
  };

  const handleOpenEditTax = (tax: CompanyTaxRateItem) => {
    setEditingTax(tax);
    setTaxForm({
      name: tax.name,
      rate: String(tax.rate),
      type: tax.type,
      isActive: tax.isActive,
    });
    setTaxFormError(null);
    setIsTaxModalOpen(true);
  };

  const handleSaveTaxItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxForm.name.trim()) {
      setTaxFormError('O nome da taxa é obrigatório.');
      return;
    }
    const numericRate = parseFloat(taxForm.rate);
    if (isNaN(numericRate) || numericRate < 0 || numericRate > 100) {
      setTaxFormError('A alíquota deve ser um número válido entre 0 e 100%.');
      return;
    }
    setTaxFormError(null);

    const currentRates = settings.taxRates ? [...settings.taxRates] : [];
    let updatedRates: CompanyTaxRateItem[];

    if (editingTax) {
      updatedRates = currentRates.map((t) =>
        t.id === editingTax.id
          ? {
              ...t,
              name: taxForm.name.trim(),
              rate: numericRate,
              type: taxForm.type,
              isActive: taxForm.isActive,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
    } else {
      const newTax: CompanyTaxRateItem = {
        id: `tax-${Date.now()}`,
        name: taxForm.name.trim(),
        rate: numericRate,
        type: taxForm.type,
        isActive: taxForm.isActive,
        createdAt: new Date().toISOString(),
      };
      updatedRates = [...currentRates, newTax];
    }

    setIsSavingTax(true);
    try {
      const updatedSettings: CompanyBusinessSettings = {
        ...settings,
        taxRates: updatedRates,
      };
      await persistSettingsToServer(updatedSettings);
      setSettings(updatedSettings);
      setIsTaxModalOpen(false);
      onShowNotification?.({
        type: 'success',
        message: editingTax ? 'Taxa atualizada com sucesso' : 'Nova taxa cadastrada com sucesso',
        description: `A taxa ${taxForm.name} (${numericRate}%) foi salva.`,
      });
    } catch (err: any) {
      onShowNotification?.({
        type: 'error',
        message: 'Erro ao salvar taxa',
        description: err.message,
      });
    } finally {
      setIsSavingTax(false);
    }
  };

  const handleToggleTaxStatus = async (taxId: string) => {
    const currentRates = settings.taxRates ? [...settings.taxRates] : [];
    const updatedRates = currentRates.map((t) =>
      t.id === taxId ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t
    );
    const updatedSettings = {
      ...settings,
      taxRates: updatedRates,
    };
    setSettings(updatedSettings);
    try {
      await persistSettingsToServer(updatedSettings);
      onShowNotification?.({
        type: 'info',
        message: 'Status da taxa atualizado',
      });
    } catch (err) {
      console.error('Erro ao atualizar status da taxa:', err);
    }
  };

  const handleDeleteTax = async () => {
    if (!taxToDelete) return;
    const currentRates = settings.taxRates ? [...settings.taxRates] : [];
    const updatedRates = currentRates.filter((t) => t.id !== taxToDelete.id);
    const updatedSettings = {
      ...settings,
      taxRates: updatedRates,
    };
    setSettings(updatedSettings);
    const deletedName = taxToDelete.name;
    setTaxToDelete(null);
    try {
      await persistSettingsToServer(updatedSettings);
      onShowNotification?.({
        type: 'success',
        message: 'Taxa excluída com sucesso',
        description: `A taxa "${deletedName}" foi removida.`,
      });
    } catch (err: any) {
      onShowNotification?.({
        type: 'error',
        message: 'Erro ao excluir taxa',
        description: err.message,
      });
    }
  };

  // Filtragem de taxas para a tabela
  const filteredTaxRates = useMemo(() => {
    const list = settings.taxRates || [];
    if (!taxSearchQuery.trim()) return list;
    const q = taxSearchQuery.toLowerCase();
    return list.filter((t) => t.name.toLowerCase().includes(q) || String(t.rate).includes(q));
  }, [settings.taxRates, taxSearchQuery]);

  // Se o usuário não tiver permissão de admin
  if (!hasAccess) {
    return (
      <div id="company-settings-access-denied" className="p-8 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full text-amber-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Acesso Restrito ao Painel de Configurações</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Apenas usuários com perfil de Administrador da Empresa ou Super Admin possuem autorização para alterar parâmetros fiscais, contábeis e operacionais.
          </p>
          <div className="pt-2 text-xs font-mono text-slate-500 bg-white/70 py-1.5 px-3 rounded inline-block">
            Permissão necessária: <span className="font-semibold text-amber-700">empresa.configurar</span> (Seu perfil atual: {userRole})
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="company-settings-view-root" className="space-y-6">
      {/* Header com Identificação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-1">
            <span>Configurações</span>
            <span>&bull;</span>
            <span className="text-slate-700 font-semibold">Configurações da Empresa</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Configurações da Empresa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento global de preferências de negócios, parâmetros operacionais e regras fiscais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Autorizado
          </span>
          {activeTab === 'empresa' && (
            <button
              id="btn-save-settings-top"
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Salvando...' : 'Salvar configurações'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Layout com Abas Verticais à Esquerda e Conteúdo à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Navegação Vertical por Abas */}
        <div className="lg:col-span-3 space-y-3">
          {/* Seletor Mobile (aparece apenas em telas pequenas) */}
          <div className="block lg:hidden bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <label className="block text-xs font-bold text-slate-700">Seção de Configuração:</label>
            <select
              id="select-mobile-settings-tab"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as BusinessSettingsTabId)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {ALL_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Navegação Desktop */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Campo de Busca Rápida de Abas */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-search-settings-tabs"
                  type="text"
                  placeholder="Buscar aba..."
                  value={tabSearchQuery}
                  onChange={(e) => setTabSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
                {tabSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTabSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Abas */}
            <nav className="p-1.5 max-h-[calc(100vh-280px)] overflow-y-auto divide-y divide-slate-50" aria-label="Abas de Configurações">
              {filteredTabs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Nenhuma aba encontrada com "{tabSearchQuery}"
                </div>
              ) : (
                filteredTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-btn-${tab.id}`}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border-l-3 border-indigo-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-3 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{tab.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 ml-1" />}
                    </button>
                  );
                })
              )}
            </nav>
          </div>
        </div>

        {/* Coluna Direita: Conteúdo da Aba Selecionada */}
        <div className="lg:col-span-9">
          {activeTab === 'empresa' ? (
            /* ============================================================ */
            /* ABA 1: EMPRESA (TOTALMENTE FUNCIONAL & PERSISTIDA)          */
            /* ============================================================ */
            <form id="form-business-settings-company" onSubmit={handleSave} className="space-y-6">
              {/* Card 1: Identificação & Benefício */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-800">Identificação & Dados Básicos</h2>
                  </div>
                  <span className="text-xs text-slate-400">* Campos obrigatórios</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Nome da Empresa */}
                  <div className="sm:col-span-2 space-y-1">
                    <label htmlFor="input-company-name" className="block text-xs font-semibold text-slate-700">
                      Nome da empresa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-company-name"
                      type="text"
                      required
                      value={settings.name}
                      onChange={(e) => {
                        setSettings((prev) => ({ ...prev, name: e.target.value }));
                        if (nameError) setNameError(null);
                      }}
                      placeholder="Ex: TechStore Brasil Matriz"
                      className={`w-full text-xs px-3 py-2 bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 ${
                        nameError
                          ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-indigo-500'
                      }`}
                    />
                    {nameError && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {nameError}
                      </p>
                    )}
                  </div>

                  {/* Data de Início */}
                  <div className="space-y-1">
                    <label htmlFor="input-company-start-date" className="block text-xs font-semibold text-slate-700">
                      Data de início
                    </label>
                    <div className="relative">
                      <input
                        id="input-company-start-date"
                        type="date"
                        value={settings.startDate || ''}
                        onChange={(e) => setSettings((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Percentual de benefício padrão */}
                  <div className="space-y-1">
                    <label htmlFor="input-default-profit-percent" className="block text-xs font-semibold text-slate-700">
                      % de benefício padrão
                    </label>
                    <div className="relative">
                      <input
                        id="input-default-profit-percent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1000"
                        value={settings.defaultProfitPercent}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            defaultProfitPercent: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full text-xs pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Margem aplicada por padrão ao cadastrar itens</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Moeda, Posição & Fuso Horário */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-800">Moeda & Localização</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Moeda (BRL fixo com label) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Moeda do Sistema
                    </label>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                      <span className="font-semibold">Real Brasileiro (BRL)</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded font-mono">
                        R$
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Moeda padrão nacional (fixa BRL)</span>
                  </div>

                  {/* Posição do símbolo */}
                  <div className="space-y-1">
                    <label htmlFor="select-currency-placement" className="block text-xs font-semibold text-slate-700">
                      Posição do símbolo
                    </label>
                    <select
                      id="select-currency-placement"
                      value={settings.currencySymbolPlacement}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          currencySymbolPlacement: e.target.value as 'before' | 'after',
                        }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="before">Antes do valor (ex: R$ 100,00)</option>
                      <option value="after">Depois do valor (ex: 100,00 R$)</option>
                    </select>
                    <span className="text-[11px] text-slate-400">Formatação nas faturas e cupons PDV</span>
                  </div>

                  {/* Fuso horário */}
                  <div className="space-y-1">
                    <label htmlFor="select-timezone" className="block text-xs font-semibold text-slate-700">
                      Fuso horário (Brasil)
                    </label>
                    <select
                      id="select-timezone"
                      value={settings.timezone}
                      onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TIMEZONE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-400">Para carimbos de data/hora nas vendas</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Upload de Logotipo com Preview */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-800">Logotipo da Empresa</h2>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Limite máximo: 300 KB</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Visualizador de Preview */}
                  <div className="relative w-36 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group">
                    {settings.logoUrl ? (
                      <>
                        <img
                          src={settings.logoUrl}
                          alt="Logo da empresa"
                          className="max-w-full max-h-full object-contain p-1.5"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          title="Remover logotipo"
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-400 font-medium">Sem logotipo</span>
                      </div>
                    )}
                  </div>

                  {/* Controles de Upload */}
                  <div className="space-y-2 flex-1">
                    <input
                      ref={fileInputRef}
                      id="input-company-logo-file"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-300"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{settings.logoUrl ? 'Substituir logo' : 'Selecionar arquivo'}</span>
                      </button>
                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Remover logo
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Formatos aceitos: PNG, JPG ou WebP. Dimensões recomendadas: 200x80px em fundo transparente.
                      O logotipo será renderizado no topo dos cupons fiscais e relatórios gerenciais.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Ano Fiscal & Contabilidade */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-800">Ano Fiscal & Métodos Contábeis</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mês de início do ano fiscal */}
                  <div className="space-y-1">
                    <label htmlFor="select-fiscal-month" className="block text-xs font-semibold text-slate-700">
                      Mês de início do ano fiscal
                    </label>
                    <select
                      id="select-fiscal-month"
                      value={settings.fiscalYearStartMonth}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          fiscalYearStartMonth: parseInt(e.target.value, 10) || 1,
                        }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {MONTHS_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-400">Referência para relatórios anuais de DRE</span>
                  </div>

                  {/* Método de contabilização */}
                  <div className="space-y-1">
                    <label htmlFor="select-accounting-method" className="block text-xs font-semibold text-slate-700">
                      Método de contabilização de estoque
                    </label>
                    <select
                      id="select-accounting-method"
                      value={settings.accountingMethod}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          accountingMethod: e.target.value as 'fifo' | 'average_cost',
                        }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="fifo">FIFO (Primeiro a Entrar, Primeiro a Sair - PEPS)</option>
                      <option value="average_cost">Custo Médio Ponderado Móvel</option>
                    </select>
                    <span className="text-[11px] text-slate-400">Determina o cálculo de CMV das vendas</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Regras de Edição, Formatos & Precisão */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-800">Regras de Auditoria, Formatos & Precisão</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Dias para edição de transação */}
                  <div className="space-y-1">
                    <label htmlFor="input-transaction-edit-days" className="block text-xs font-semibold text-slate-700">
                      Dias para edição de transação
                    </label>
                    <input
                      id="input-transaction-edit-days"
                      type="number"
                      min="0"
                      max="365"
                      value={settings.transactionEditDays}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          transactionEditDays: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[11px] text-slate-400">Dias permitidos para alterar venda/compra lançada</span>
                  </div>

                  {/* Formato de data */}
                  <div className="space-y-1">
                    <label htmlFor="select-date-format" className="block text-xs font-semibold text-slate-700">
                      Formato de data
                    </label>
                    <select
                      id="select-date-format"
                      value={settings.dateFormat}
                      onChange={(e) => setSettings((prev) => ({ ...prev, dateFormat: e.target.value }))}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (ex: 14/09/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ex: 2026-09-14)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (ex: 14-09-2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (ex: 09/14/2026)</option>
                    </select>
                    <span className="text-[11px] text-slate-400">Padrão visual em todas as tabelas</span>
                  </div>

                  {/* Formato de hora */}
                  <div className="space-y-1">
                    <label htmlFor="select-time-format" className="block text-xs font-semibold text-slate-700">
                      Formato de hora
                    </label>
                    <select
                      id="select-time-format"
                      value={settings.timeFormat}
                      onChange={(e) => setSettings((prev) => ({ ...prev, timeFormat: e.target.value as '12' | '24' }))}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="24">24 Horas (ex: 14:30)</option>
                      <option value="12">12 Horas (ex: 02:30 PM)</option>
                    </select>
                    <span className="text-[11px] text-slate-400">Exibição nos cupons e comprovantes</span>
                  </div>

                  {/* Precisão de moeda */}
                  <div className="space-y-1">
                    <label htmlFor="select-currency-precision" className="block text-xs font-semibold text-slate-700">
                      Precisão de moeda (decimais)
                    </label>
                    <select
                      id="select-currency-precision"
                      value={settings.currencyPrecision}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          currencyPrecision: parseInt(e.target.value, 10) || 2,
                        }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="2">2 casas decimais (R$ 0,00)</option>
                      <option value="3">3 casas decimais (R$ 0,000)</option>
                      <option value="4">4 casas decimais (R$ 0,0000)</option>
                    </select>
                    <span className="text-[11px] text-slate-400">Casas pós-vírgula nos totais</span>
                  </div>

                  {/* Precisão de quantidade */}
                  <div className="space-y-1">
                    <label htmlFor="select-quantity-precision" className="block text-xs font-semibold text-slate-700">
                      Precisão de quantidade
                    </label>
                    <select
                      id="select-quantity-precision"
                      value={settings.quantityPrecision}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          quantityPrecision: parseInt(e.target.value, 10) || 2,
                        }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="0">0 casas (Apenas inteiros: 1 un, 5 un)</option>
                      <option value="2">2 casas decimais (0,00 kg / mt)</option>
                      <option value="3">3 casas decimais (0,000 kg)</option>
                      <option value="4">4 casas decimais (0,0000)</option>
                    </select>
                    <span className="text-[11px] text-slate-400">Para balanças e vendas fracionadas</span>
                  </div>
                </div>
              </div>

              {/* Barra Inferior com Botão Salvar */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  {settings.updatedAt && (
                    <span>Última atualização em: {new Date(settings.updatedAt).toLocaleString('pt-BR')}</span>
                  )}
                </div>

                <button
                  id="btn-save-settings-bottom"
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando alterações...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar configurações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : activeTab === 'impostos' ? (
            /* ============================================================ */
            /* ABA IMPOSTOS: REGRA PADRÃO, CRUD DE TAXAS E SINCRONIZAÇÃO   */
            /* ============================================================ */
            <div id="tab-content-impostos" className="space-y-6">
              {/* Cabeçalho da Seção de Impostos */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">Impostos e Parâmetros Tributários</h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Sincronizado
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Defina a alíquota padrão, o modo de cálculo no PDV (incluso vs adicionado) e gerencie o catálogo de taxas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveTaxRules()}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Regra da Empresa</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 1: REGRA PADRÃO DA EMPRESA */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800">Regra Padrão da Empresa</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Aplicada ao Frente de Caixa e inicialização de novos produtos</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Taxa de imposto padrão (%) */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-default-tax-rate" className="block text-xs font-semibold text-slate-700">
                      Taxa de imposto padrão (%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Percent className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="input-default-tax-rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.defaultTaxRate ?? 10}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSettings((prev) => ({
                            ...prev,
                            defaultTaxRate: isNaN(val) ? 0 : Math.max(0, Math.min(100, val)),
                          }));
                        }}
                        placeholder="10.00"
                        className="w-full text-xs pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">%</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Alíquota utilizada como referência para cálculo no carrinho e novos itens.
                    </span>
                  </div>

                  {/* Modo de Apuração do Imposto (Incluso vs Adicionado) */}
                  <div className="space-y-1.5">
                    <label htmlFor="select-tax-calculation-type" className="block text-xs font-semibold text-slate-700">
                      Modo de Cálculo do Imposto <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-tax-calculation-type"
                      value={settings.taxCalculationType || 'exclusive'}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          taxCalculationType: e.target.value as 'inclusive' | 'exclusive',
                        }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="exclusive">Imposto ADICIONADO ao preço (Soma no total da venda)</option>
                      <option value="inclusive">Imposto INCLUSO no preço (Já contido no valor dos itens)</option>
                    </select>
                    <span className="text-[11px] text-slate-500">
                      Define se a alíquota encarece a venda ou se é embutida no preço de custo/venda.
                    </span>
                  </div>

                  {/* Switch Aplicar imposto automaticamente no PDV */}
                  <div className="space-y-1.5 p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <span className="block text-xs font-semibold text-slate-800">
                        Aplicar imposto automaticamente no PDV
                      </span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Calcula o imposto nos itens do carrinho conforme o modo configurado. Se o operador editar manualmente, o valor digitado prevalece até a próxima venda.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.autoApplyTaxInPOS}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          autoApplyTaxInPOS: !prev.autoApplyTaxInPOS,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        settings.autoApplyTaxInPOS ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          settings.autoApplyTaxInPOS ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Regime Tributário */}
                  <div className="space-y-1.5">
                    <label htmlFor="select-tax-regime" className="block text-xs font-semibold text-slate-700">
                      Regime Tributário da Empresa
                    </label>
                    <select
                      id="select-tax-regime"
                      value={settings.taxRegime || 'simples_nacional'}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          taxRegime: e.target.value as 'simples_nacional' | 'lucro_presumido' | 'lucro_real',
                        }))
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="simples_nacional">Simples Nacional (ME / EPP)</option>
                      <option value="lucro_presumido">Lucro Presumido</option>
                      <option value="lucro_real">Lucro Real</option>
                    </select>
                    <span className="text-[11px] text-slate-500">
                      Classificação contábil utilizada para declarações fiscais e apuração de DRE.
                    </span>
                  </div>
                </div>

                {/* Caixa Informativa do Modo Selecionado (Anti-Cobrança Dupla) */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                    settings.taxCalculationType === 'inclusive'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                  }`}
                >
                  <div className="mt-0.5">
                    {settings.taxCalculationType === 'inclusive' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowRightLeft className="w-5 h-5 text-indigo-600 shrink-0" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">
                      {settings.taxCalculationType === 'inclusive'
                        ? 'Proteção Anti-Cobrança Dupla Ativa (Modo Incluso)'
                        : 'Modo Adicionado ao Total (Imposto Exclusivo)'}
                    </p>
                    <p className="leading-relaxed opacity-90">
                      {settings.taxCalculationType === 'inclusive'
                        ? `No modo INCLUSO, o preço unitário do produto já contempla os tributos. O PDV não adiciona valores no campo Imposto(+), evitando cobrança em dobro ao cliente, e exibe o selo "Imposto incluso no preço (${settings.defaultTaxRate}%)" além da coluna de imposto contido.`
                        : `No modo ADICIONADO, o PDV soma ${settings.defaultTaxRate}% sobre o subtotal no campo Imposto(+), aumentando o valor a pagar do pedido.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 2: TAXAS DE IMPOSTO PERSONALIZADAS (CRUD COMPLETO) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">Catálogo de Taxas de Imposto</h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {settings.taxRates?.length || 0} {settings.taxRates?.length === 1 ? 'cadastrada' : 'cadastradas'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cadastre alíquotas adicionais (ISS, ICMS, PIS, COFINS) para aplicação específica por produto ou serviço.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Busca rápida */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar taxa..."
                        value={taxSearchQuery}
                        onChange={(e) => setTaxSearchQuery(e.target.value)}
                        className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddTax}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Taxa</span>
                    </button>
                  </div>
                </div>

                {/* Tabela de Taxas */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Nome da Taxa</th>
                        <th className="px-4 py-3">Alíquota (%)</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTaxRates.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Landmark className="w-8 h-8 text-slate-300" />
                              <p className="text-xs font-medium text-slate-600">Nenhuma taxa de imposto encontrada</p>
                              <p className="text-[11px] text-slate-400 max-w-xs">
                                {taxSearchQuery
                                  ? 'Nenhum resultado para a busca. Limpe o campo de busca ou adicione uma nova taxa.'
                                  : 'Clique no botão "+ Nova Taxa" para cadastrar alíquotas fiscais personalizadas.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTaxRates.map((tax) => (
                          <tr key={tax.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                  <Percent className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block">{tax.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {tax.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                                {Number(tax.rate).toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {tax.type === 'standard' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Padrão
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  Adicional
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleTaxStatus(tax.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
                                  tax.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                                title={tax.isActive ? 'Clique para desativar' : 'Clique para ativar'}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${tax.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span>{tax.isActive ? 'Ativa' : 'Inativa'}</span>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTax(tax)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                  title="Editar taxa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTaxToDelete(tax)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Excluir taxa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CARD 3: PAINEL DE SINCRONIZAÇÃO EM TEMPO REAL */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-800">Painel de Sincronização dos Módulos</h3>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado em tempo real
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Módulo PDV */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                        <Store className="w-4 h-4 text-indigo-600" />
                        <span>Frente de Caixa (PDV)</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          settings.autoApplyTaxInPOS
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {settings.autoApplyTaxInPOS ? 'Automático' : 'Manual'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Modo:{' '}
                      <strong className="text-slate-700 font-medium">
                        {settings.taxCalculationType === 'inclusive' ? 'Imposto Incluso' : 'Adicionado (+)'}
                      </strong>
                      . Alíquota padrão: <strong className="text-slate-700">{settings.defaultTaxRate ?? 10}%</strong>. Respeita edição manual do operador.
                    </p>
                  </div>

                  {/* Módulo Produtos */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                        <Boxes className="w-4 h-4 text-indigo-600" />
                        <span>Cadastro de Produtos</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sincronizado
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Novos produtos iniciam pré-configurados com alíquota padrão de{' '}
                      <strong className="text-slate-700">{settings.defaultTaxRate ?? 10}%</strong> e tipo de preço{' '}
                      <strong className="text-slate-700">
                        {settings.taxCalculationType === 'inclusive' ? 'Incluso' : 'Exclusivo'}
                      </strong>.
                    </p>
                  </div>

                  {/* Módulo Relatórios */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span>Relatórios & DRE</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ativo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Regime:{' '}
                      <strong className="text-slate-700 capitalize">
                        {(settings.taxRegime || 'simples_nacional').replace('_', ' ')}
                      </strong>. Os impostos apurados são consolidados no Relatório de Lucros e Perdas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* DEMAIS 14 ABAS: SHELLS PRONTOS, ELEGANTES E PROFISSIONAIS   */
            /* ============================================================ */
            (() => {
              const currentTabConfig = ALL_TABS.find((t) => t.id === activeTab);
              if (!currentTabConfig) return null;
              const TabIcon = currentTabConfig.icon;

              return (
                <div id={`tab-shell-${activeTab}`} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  {/* Cabeçalho da Seção */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <TabIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">{currentTabConfig.label}</h2>
                        <p className="text-xs text-slate-500">{currentTabConfig.description}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Módulo preparado
                    </span>
                  </div>

                  {/* Card de Estado Vazio Elegante */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-8 text-center space-y-4 max-w-2xl mx-auto">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
                      <TabIcon className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800">
                        Seção de {currentTabConfig.label} estruturada
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Módulo preparado — funcionalidades serão ativadas na próxima fase.
                        Todos os endpoints e esquemas de dados correspondentes já estão mapeados na arquitetura.
                      </p>
                    </div>

                    {/* Lista de Recursos Futuros */}
                    <div className="pt-2 text-left bg-white rounded-lg p-4 border border-slate-200 max-w-md mx-auto space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Recursos previstos nesta seção:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {currentTabConfig.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('empresa')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Voltar para configurações da Empresa</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL ADICIONAR / EDITAR TAXA DE IMPOSTO                    */}
      {/* ============================================================ */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingTax ? 'Editar Taxa de Imposto' : 'Nova Taxa de Imposto'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingTax ? 'Atualize as propriedades da taxa fiscal' : 'Cadastre uma nova alíquota fiscal'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTaxModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTaxItem} className="p-5 space-y-4">
              {taxFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{taxFormError}</span>
                </div>
              )}

              {/* Nome da taxa */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Nome da Taxa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ICMS 18%, ISS Serviços, Simples Nacional"
                  value={taxForm.name}
                  onChange={(e) => setTaxForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Alíquota (%) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Alíquota (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="0.00"
                    value={taxForm.rate}
                    onChange={(e) => setTaxForm((prev) => ({ ...prev, rate: e.target.value }))}
                    className="w-full text-xs pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">%</span>
                </div>
              </div>

              {/* Tipo de Taxa */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Tipo de Taxa</label>
                <select
                  value={taxForm.type}
                  onChange={(e) =>
                    setTaxForm((prev) => ({
                      ...prev,
                      type: e.target.value as 'standard' | 'additional',
                    }))
                  }
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="standard">Padrão (Geral da Empresa)</option>
                  <option value="additional">Adicional (Específica / Opcional)</option>
                </select>
              </div>

              {/* Status Ativa / Inativa */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <span className="block text-xs font-semibold text-slate-800">Status da Taxa</span>
                  <span className="text-[11px] text-slate-500">
                    {taxForm.isActive ? 'Disponível para seleção nos cadastros' : 'Ocultada nos cadastros'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={taxForm.isActive}
                  onClick={() => setTaxForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    taxForm.isActive ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      taxForm.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaxModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTax}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingTax ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingTax ? 'Atualizar Taxa' : 'Salvar Taxa'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE TAXA                    */}
      {/* ============================================================ */}
      {taxToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Excluir Taxa de Imposto</h3>
                <p className="text-xs text-slate-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir a taxa <strong className="text-slate-900 font-semibold">{taxToDelete.name}</strong> ({taxToDelete.rate}%)?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTaxToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteTax}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
