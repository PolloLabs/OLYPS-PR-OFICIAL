import { SellService } from './sellService.js';
import type { SellRecord } from '../../types/sell.types.js';

// ============================================
// SERVIÇO DE RASCUNHOS (DRAFTS) - OLYPS PRO
// ============================================

export class DraftService {
  static async getDrafts(companyId: string): Promise<SellRecord[]> {
    const allSells = await SellService.getSells(companyId);
    return allSells.filter((s) => s.status === 'draft');
  }

  static async getDraftById(
    companyId: string,
    id: string
  ): Promise<SellRecord | null> {
    const sell = await SellService.getSellById(companyId, id);
    if (!sell || sell.status !== 'draft') return null;
    return sell;
  }

  static async createDraft(
    companyId: string,
    payload: any
  ): Promise<SellRecord> {
    const draftPayload = {
      ...payload,
      status: 'draft' as const,
    };
    return SellService.createSell(companyId, draftPayload);
  }

  static async updateDraft(
    companyId: string,
    id: string,
    payload: any
  ): Promise<SellRecord> {
    const draftPayload = {
      ...payload,
      status: 'draft' as const,
    };
    return SellService.updateSell(companyId, id, draftPayload);
  }

  static async deleteDraft(companyId: string, id: string): Promise<boolean> {
    return SellService.deleteSell(companyId, id);
  }
}
