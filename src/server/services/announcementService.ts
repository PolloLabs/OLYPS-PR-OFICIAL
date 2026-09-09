import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import { NotificationService } from './notificationService.js';
import type {
  UUID,
  PlatformAnnouncement,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementTargetAudience,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementFilters,
  PaginatedAnnouncementsResponse,
  PaginationMeta,
} from '../../types/index.js';

interface DatabaseAnnouncementRow {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  target_audience: string;
  target_plan_ids: string[] | null;
  target_company_ids: string[] | null;
  starts_at: string;
  expires_at: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapAnnouncementRow(row: DatabaseAnnouncementRow): PlatformAnnouncement {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: (row.type as AnnouncementType) || 'info',
    priority: (row.priority as AnnouncementPriority) || 'normal',
    targetAudience: (row.target_audience as AnnouncementTargetAudience) || 'all',
    targetPlanIds: Array.isArray(row.target_plan_ids) ? row.target_plan_ids : [],
    targetCompanyIds: Array.isArray(row.target_company_ids) ? row.target_company_ids : [],
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isPublished: Boolean(row.is_published),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// In-memory fallback for local environments
let FALLBACK_ANNOUNCEMENTS: PlatformAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Manutenção Programada do Sistema',
    message: 'Realizaremos melhorias de infraestrutura no próximo domingo das 02h às 04h (horário de Brasília). O sistema poderá apresentar breves instabilidades.',
    type: 'maintenance',
    priority: 'high',
    targetAudience: 'all',
    targetPlanIds: [],
    targetCompanyIds: [],
    startsAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    isPublished: true,
    createdBy: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ann-2',
    title: 'Nova Funcionalidade: Gestão de Cupons',
    message: 'Agora você pode criar e gerenciar cupons promocionais com controle de vigência e planos específicos.',
    type: 'update',
    priority: 'normal',
    targetAudience: 'all',
    targetPlanIds: [],
    targetCompanyIds: [],
    startsAt: new Date(Date.now() - 7200000).toISOString(),
    expiresAt: null,
    isPublished: true,
    createdBy: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

/**
 * Service managing platform announcements with filtering, publication controls, and targeting.
 */
export class AnnouncementService {
  /**
   * Creates a new announcement.
   */
  public static async createAnnouncement(
    input: CreateAnnouncementInput,
    createdBy?: UUID | string | null
  ): Promise<PlatformAnnouncement> {
    if (!input.title || input.title.trim() === '') {
      throw new Error('O título do comunicado é obrigatório.');
    }
    if (!input.message || input.message.trim() === '') {
      throw new Error('A mensagem do comunicado é obrigatória.');
    }

    const payload = {
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type || 'info',
      priority: input.priority || 'normal',
      target_audience: input.targetAudience || 'all',
      target_plan_ids: input.targetPlanIds || [],
      target_company_ids: input.targetCompanyIds || [],
      starts_at: input.startsAt || new Date().toISOString(),
      expires_at: input.expiresAt || null,
      is_published: input.isPublished ?? false,
      created_by: createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseAdminConfigured()) {
      const newAnn: PlatformAnnouncement = {
        id: `ann-${Date.now()}`,
        title: payload.title,
        message: payload.message,
        type: payload.type as AnnouncementType,
        priority: payload.priority as AnnouncementPriority,
        targetAudience: payload.target_audience as AnnouncementTargetAudience,
        targetPlanIds: payload.target_plan_ids,
        targetCompanyIds: payload.target_company_ids,
        startsAt: payload.starts_at,
        expiresAt: payload.expires_at,
        isPublished: payload.is_published,
        createdBy: payload.created_by,
        createdAt: payload.created_at,
        updatedAt: payload.updated_at,
      };
      FALLBACK_ANNOUNCEMENTS.unshift(newAnn);
      if (newAnn.isPublished) {
        await NotificationService.createNotificationsForAnnouncement(newAnn);
      }
      return newAnn;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('platform_announcements')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao criar comunicado: ${error?.message || 'Erro desconhecido'}`);
    }

    const created = mapAnnouncementRow(data as DatabaseAnnouncementRow);
    if (created.isPublished) {
      await NotificationService.createNotificationsForAnnouncement(created);
    }

    return created;
  }

  /**
   * Lists announcements with filtering and pagination.
   */
  public static async getAnnouncements(
    filters: AnnouncementFilters = {}
  ): Promise<PaginatedAnnouncementsResponse> {
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    if (!isSupabaseAdminConfigured()) {
      let filtered = [...FALLBACK_ANNOUNCEMENTS];

      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(query) ||
            a.message.toLowerCase().includes(query)
        );
      }

      if (filters.type && filters.type !== 'all') {
        filtered = filtered.filter((a) => a.type === filters.type);
      }

      if (filters.priority && filters.priority !== 'all') {
        filtered = filtered.filter((a) => a.priority === filters.priority);
      }

      if (filters.targetAudience && filters.targetAudience !== 'all') {
        filtered = filtered.filter((a) => a.targetAudience === filters.targetAudience);
      }

      if (filters.isPublished !== undefined && filters.isPublished !== 'all') {
        filtered = filtered.filter((a) => a.isPublished === Boolean(filters.isPublished));
      }

      if (filters.activeOnly) {
        const now = new Date();
        filtered = filtered.filter((a) => {
          if (!a.isPublished) return false;
          if (new Date(a.startsAt) > now) return false;
          if (a.expiresAt && new Date(a.expiresAt) < now) return false;
          return true;
        });
      }

      // Sort
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const items = filtered.slice(offset, offset + pageSize);

      const meta: PaginationMeta = {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      return { items, meta };
    }

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('platform_announcements')
      .select('*', { count: 'exact' });

    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
    }

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    if (filters.targetAudience && filters.targetAudience !== 'all') {
      query = query.eq('target_audience', filters.targetAudience);
    }

    if (filters.isPublished !== undefined && filters.isPublished !== 'all') {
      query = query.eq('is_published', Boolean(filters.isPublished));
    }

    if (filters.activeOnly) {
      const nowIso = new Date().toISOString();
      query = query
        .eq('is_published', true)
        .lte('starts_at', nowIso)
        .or(`expires_at.is.null,expires_at.gte.${nowIso}`);
    }

    const sortBy = filters.sortBy || 'created_at';
    const sortAscending = filters.sortDirection === 'asc';

    query = query
      .order(sortBy, { ascending: sortAscending })
      .range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar comunicados: ${error.message}`);
    }

    const items = (data || []).map((row) => mapAnnouncementRow(row as DatabaseAnnouncementRow));
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const meta: PaginationMeta = {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return { items, meta };
  }

  /**
   * Retrieves an announcement by its ID.
   */
  public static async getAnnouncementById(id: UUID | string): Promise<PlatformAnnouncement | null> {
    if (!id) return null;

    if (!isSupabaseAdminConfigured()) {
      const found = FALLBACK_ANNOUNCEMENTS.find((a) => a.id === id);
      return found ? { ...found } : null;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('platform_announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    return mapAnnouncementRow(data as DatabaseAnnouncementRow);
  }

  /**
   * Updates an existing announcement.
   */
  public static async updateAnnouncement(
    id: UUID | string,
    input: UpdateAnnouncementInput
  ): Promise<PlatformAnnouncement> {
    const existing = await this.getAnnouncementById(id);
    if (!existing) {
      throw new Error('Comunicado não encontrado para atualização.');
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updatePayload.title = input.title.trim();
    if (input.message !== undefined) updatePayload.message = input.message.trim();
    if (input.type !== undefined) updatePayload.type = input.type;
    if (input.priority !== undefined) updatePayload.priority = input.priority;
    if (input.targetAudience !== undefined) updatePayload.target_audience = input.targetAudience;
    if (input.targetPlanIds !== undefined) updatePayload.target_plan_ids = input.targetPlanIds;
    if (input.targetCompanyIds !== undefined) updatePayload.target_company_ids = input.targetCompanyIds;
    if (input.startsAt !== undefined) updatePayload.starts_at = input.startsAt;
    if (input.expiresAt !== undefined) updatePayload.expires_at = input.expiresAt;
    if (input.isPublished !== undefined) updatePayload.is_published = input.isPublished;

    if (!isSupabaseAdminConfigured()) {
      const index = FALLBACK_ANNOUNCEMENTS.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Comunicado não encontrado.');

      const updated: PlatformAnnouncement = {
        ...FALLBACK_ANNOUNCEMENTS[index],
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.message !== undefined && { message: input.message.trim() }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.targetAudience !== undefined && { targetAudience: input.targetAudience }),
        ...(input.targetPlanIds !== undefined && { targetPlanIds: input.targetPlanIds }),
        ...(input.targetCompanyIds !== undefined && { targetCompanyIds: input.targetCompanyIds }),
        ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
        ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        updatedAt: new Date().toISOString(),
      };
      FALLBACK_ANNOUNCEMENTS[index] = updated;
      if (updated.isPublished) {
        await NotificationService.createNotificationsForAnnouncement(updated);
      }
      return updated;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('platform_announcements')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar comunicado: ${error?.message || 'Erro desconhecido'}`);
    }

    const updated = mapAnnouncementRow(data as DatabaseAnnouncementRow);
    if (updated.isPublished) {
      await NotificationService.createNotificationsForAnnouncement(updated);
    }

    return updated;
  }

  /**
   * Publishes an announcement.
   */
  public static async publishAnnouncement(id: UUID | string): Promise<PlatformAnnouncement> {
    return this.updateAnnouncement(id, { isPublished: true });
  }

  /**
   * Unpublishes an announcement.
   */
  public static async unpublishAnnouncement(id: UUID | string): Promise<PlatformAnnouncement> {
    return this.updateAnnouncement(id, { isPublished: false });
  }

  /**
   * Deletes an announcement.
   */
  public static async deleteAnnouncement(id: UUID | string): Promise<boolean> {
    if (!isSupabaseAdminConfigured()) {
      const prevLength = FALLBACK_ANNOUNCEMENTS.length;
      FALLBACK_ANNOUNCEMENTS = FALLBACK_ANNOUNCEMENTS.filter((a) => a.id !== id);
      return FALLBACK_ANNOUNCEMENTS.length < prevLength;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('platform_announcements')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Falha ao excluir comunicado: ${error.message}`);
    }

    return true;
  }
}
