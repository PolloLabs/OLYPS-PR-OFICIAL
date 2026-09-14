import fs from 'fs';
import path from 'path';
import type { CompanyBusinessSettings, CompanyTaxRateItem } from '../../types/businessSettings.types.js';
import { CompanyService } from './companyService.js';

const DATA_DIR = path.join(process.cwd(), '.data', 'company-settings');
const memoryCache = new Map<string, CompanyBusinessSettings>();

const DEFAULT_TAX_RATES: CompanyTaxRateItem[] = [
  { id: 'tax-1', name: 'ICMS Padrão', rate: 18, type: 'standard', isActive: true, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'tax-2', name: 'Simples Nacional Faixa 1', rate: 4, type: 'standard', isActive: true, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'tax-3', name: 'ISS Serviços', rate: 5, type: 'additional', isActive: true, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'tax-4', name: 'PIS/COFINS Geral', rate: 9.25, type: 'additional', isActive: false, createdAt: '2026-01-15T00:00:00.000Z' },
];

function ensureDirExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(companyId: string): string {
  return path.join(DATA_DIR, `settings_${companyId}.json`);
}

export class BusinessSettingsService {
  /**
   * Obtém as configurações de negócio e parâmetros gerais da empresa
   */
  public static async getSettings(companyId: string, fallbackName?: string): Promise<CompanyBusinessSettings> {
    if (memoryCache.has(companyId)) {
      return memoryCache.get(companyId)!;
    }

    ensureDirExists();
    const filePath = getFilePath(companyId);

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as CompanyBusinessSettings;
        
        // Garantir defaults para campos tributários se não existirem no arquivo salvo
        if (parsed.defaultTaxRate === undefined) parsed.defaultTaxRate = 10;
        if (parsed.autoApplyTaxInPOS === undefined) parsed.autoApplyTaxInPOS = false;
        if (!parsed.taxCalculationType) parsed.taxCalculationType = 'exclusive';
        if (!parsed.taxRegime) parsed.taxRegime = 'simples_nacional';
        if (!parsed.taxRates || parsed.taxRates.length === 0) {
          parsed.taxRates = [...DEFAULT_TAX_RATES];
        }

        memoryCache.set(companyId, parsed);
        return parsed;
      } catch (err) {
        console.warn(`[BusinessSettings] Falha ao ler arquivo de configurações para empresa ${companyId}:`, err);
      }
    }

    // Tenta carregar nome da empresa a partir do CompanyService
    let companyName = fallbackName || 'TechStore Brasil Matriz';
    let companyCurrency = 'BRL';
    let companyTimezone = 'America/Sao_Paulo';

    try {
      const companyRecord = await CompanyService.getCompanyById(companyId as any);
      if (companyRecord) {
        if (companyRecord.name) companyName = companyRecord.name;
        if (companyRecord.currency) companyCurrency = companyRecord.currency;
        if (companyRecord.timezone) companyTimezone = companyRecord.timezone;
      }
    } catch {
      // Non-blocking fallback
    }

    const defaultSettings: CompanyBusinessSettings = {
      companyId,
      name: companyName,
      startDate: '2026-01-15',
      defaultProfitPercent: 25,
      currency: companyCurrency,
      currencySymbolPlacement: 'before',
      timezone: companyTimezone,
      logoUrl: '',
      logoName: '',
      fiscalYearStartMonth: 1, // Janeiro
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
      taxRates: [...DEFAULT_TAX_RATES],
      updatedAt: new Date().toISOString(),
    };

    memoryCache.set(companyId, defaultSettings);
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`[BusinessSettings] Falha ao gravar seed padrão para empresa ${companyId}:`, err);
    }

    return defaultSettings;
  }

  /**
   * Salva e atualiza as configurações da empresa com persistência imediata em disco
   */
  public static async saveSettings(
    companyId: string,
    payload: Partial<CompanyBusinessSettings>
  ): Promise<CompanyBusinessSettings> {
    const current = await this.getSettings(companyId, payload.name);

    const updated: CompanyBusinessSettings = {
      ...current,
      ...payload,
      companyId,
      updatedAt: new Date().toISOString(),
    };

    // Atualiza nome da empresa no CompanyService se tiver sido alterado
    if (payload.name && payload.name.trim() && payload.name !== current.name) {
      try {
        await CompanyService.updateCompany(companyId as any, {
          name: payload.name.trim(),
          currency: payload.currency || current.currency,
          timezone: payload.timezone || current.timezone,
        });
      } catch (updateErr) {
        console.warn(`[BusinessSettings] Falha ao sincronizar dados básicos no CompanyService:`, updateErr);
      }
    }

    memoryCache.set(companyId, updated);
    ensureDirExists();
    const filePath = getFilePath(companyId);

    try {
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (writeErr) {
      console.warn(`[BusinessSettings] Falha ao persistir em disco para empresa ${companyId}:`, writeErr);
    }

    return updated;
  }
}
