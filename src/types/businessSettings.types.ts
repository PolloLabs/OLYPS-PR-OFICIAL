export interface CompanyBusinessSettings {
  companyId: string;
  // Identificação & Cadastrais
  name: string;
  startDate?: string;
  defaultProfitPercent: number;
  
  // Moeda & Localização
  currency: string;
  currencySymbolPlacement: 'before' | 'after';
  timezone: string;
  
  // Identidade Visual
  logoUrl?: string; // base64 ou URL da imagem
  logoName?: string;
  
  // Financeiro & Contábil
  fiscalYearStartMonth: number; // 1 a 12 (1 = Janeiro)
  accountingMethod: 'fifo' | 'average_cost';
  
  // Regras de Operação & Auditoria
  transactionEditDays: number; // Dias permitidos para editar transação
  
  // Formatos & Precisão
  dateFormat: string; // 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM/DD/YYYY'
  timeFormat: '12' | '24';
  currencyPrecision: number; // 2, 3 ou 4
  quantityPrecision: number; // 0, 2, 3 ou 4
  
  // Regras Fiscais e Tributárias (Aba Impostos)
  defaultTaxRate?: number; // Taxa padrão em % (ex: 10)
  autoApplyTaxInPOS?: boolean; // Aplicar imposto automaticamente no PDV
  taxCalculationType?: 'inclusive' | 'exclusive'; // Imposto Incluso vs Adicionado
  taxRegime?: 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  taxRates?: CompanyTaxRateItem[];

  updatedAt?: string;
}

export interface CompanyTaxRateItem {
  id: string;
  name: string;
  rate: number; // % (ex: 10, 18, 5)
  type: 'standard' | 'additional';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BusinessSettingsTabId =
  | 'empresa'
  | 'impostos'
  | 'produtos'
  | 'credito'
  | 'vendas'
  | 'pdv'
  | 'compras'
  | 'pagamentos'
  | 'painel'
  | 'sistema'
  | 'prefixos'
  | 'email'
  | 'sms'
  | 'pontos_recompensa'
  | 'modulos'
  | 'etiquetas_personalizadas';

export interface BusinessSettingsTabDefinition {
  id: BusinessSettingsTabId;
  label: string;
  shortDescription: string;
  badge?: string;
}
