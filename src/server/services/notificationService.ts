import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import type {
  UUID,
  Notification,
  NotificationCategory,
  NotificationPriority,
  CreateNotificationInput,
  NotificationFilters,
  PaginatedNotificationsResponse,
  PaginationMeta,
  PlatformAnnouncement,
} from '../../types/index.js';

interface DatabaseNotificationRow {
  id: string;
  user_id: string;
  company_id: string | null;
  announcement_id: string | null;
  title: string;
  message: string;
  category: string;
  priority: string;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}

function mapNotificationRow(row: DatabaseNotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    companyId: row.company_id,
    announcementId: row.announcement_id,
    title: row.title,
    message: row.message,
    category: (row.category as NotificationCategory) || 'system',
    priority: (row.priority as NotificationPriority) || 'normal',
    readAt: row.read_at,
    isRead: row.read_at !== null,
    actionUrl: row.action_url,
    createdAt: row.created_at,
  };
}

// In-memory fallback for local environments
let FALLBACK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'default-user',
    companyId: null,
    announcementId: 'ann-1',
    title: 'Manutenção Programada do Sistema',
    message: 'Realizaremos melhorias de infraestrutura no próximo domingo das 02h às 04h.',
    category: 'system',
    priority: 'high',
    readAt: null,
    isRead: false,
    actionUrl: null,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'default-user',
    companyId: null,
    announcementId: null,
    title: 'Bem-vindo à Plataforma OLYPS PRO',
    message: 'Sua conta foi ativada com sucesso. Explore os recursos no menu lateral.',
    category: 'system',
    priority: 'normal',
    readAt: new Date(Date.now() - 3600000).toISOString(),
    isRead: true,
    actionUrl: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

/**
 * Service managing user notifications with strict user_id boundaries.
 */
export class NotificationService {
  /**
   * Creates a notification for a target user.
   */
  public static async createNotification(
    input: CreateNotificationInput
  ): Promise<Notification> {
    if (!input.userId) {
      throw new Error('O ID do destinatário (userId) é obrigatório.');
    }
    if (!input.title || input.title.trim() === '') {
      throw new Error('O título da notificação é obrigatório.');
    }
    if (!input.message || input.message.trim() === '') {
      throw new Error('A mensagem da notificação é obrigatória.');
    }

    const payload = {
      user_id: input.userId,
      company_id: input.companyId || null,
      announcement_id: input.announcementId || null,
      title: input.title.trim(),
      message: input.message.trim(),
      category: input.category || 'system',
      priority: input.priority || 'normal',
      read_at: null,
      action_url: input.actionUrl || null,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseAdminConfigured()) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: payload.user_id,
        companyId: payload.company_id,
        announcementId: payload.announcement_id,
        title: payload.title,
        message: payload.message,
        category: payload.category as NotificationCategory,
        priority: payload.priority as NotificationPriority,
        readAt: null,
        isRead: false,
        actionUrl: payload.action_url,
        createdAt: payload.created_at,
      };
      FALLBACK_NOTIFICATIONS.unshift(newNotif);
      return newNotif;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao criar notificação: ${error?.message || 'Erro desconhecido'}`);
    }

    return mapNotificationRow(data as DatabaseNotificationRow);
  }

  /**
   * Lists notifications belonging to a specific user with filtering and pagination.
   */
  public static async getUserNotifications(
    userId: UUID | string,
    filters: NotificationFilters = {}
  ): Promise<PaginatedNotificationsResponse> {
    if (!userId) {
      throw new Error('Identificador do usuário é obrigatório.');
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(filters.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    if (!isSupabaseAdminConfigured()) {
      // Allow 'default-user' fallback for demo
      let userList = FALLBACK_NOTIFICATIONS.filter(
        (n) => n.userId === userId || n.userId === 'default-user'
      );

      if (filters.category && filters.category !== 'all') {
        userList = userList.filter((n) => n.category === filters.category);
      }

      if (filters.priority && filters.priority !== 'all') {
        userList = userList.filter((n) => n.priority === filters.priority);
      }

      if (filters.isRead !== undefined && filters.isRead !== 'all') {
        userList = userList.filter((n) => n.isRead === Boolean(filters.isRead));
      }

      if (filters.companyId) {
        userList = userList.filter((n) => n.companyId === filters.companyId);
      }

      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase();
        userList = userList.filter(
          (n) =>
            n.title.toLowerCase().includes(query) ||
            n.message.toLowerCase().includes(query)
        );
      }

      userList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const unreadCount = userList.filter((n) => !n.isRead).length;
      const total = userList.length;
      const totalPages = Math.ceil(total / pageSize);
      const items = userList.slice(offset, offset + pageSize);

      const meta: PaginationMeta = {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      return { items, meta, unreadCount };
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Query unread count for the user
    const { count: unreadCountResult } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    const unreadCount = unreadCountResult || 0;

    // Build paginated query
    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    if (filters.isRead !== undefined && filters.isRead !== 'all') {
      if (filters.isRead) {
        query = query.not('read_at', 'is', null);
      } else {
        query = query.is('read_at', null);
      }
    }

    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar notificações: ${error.message}`);
    }

    const items = (data || []).map((row) =>
      mapNotificationRow(row as DatabaseNotificationRow)
    );
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

    return { items, meta, unreadCount };
  }

  /**
   * Returns the count of unread notifications for a user.
   */
  public static async getUnreadCount(userId: UUID | string): Promise<number> {
    if (!userId) return 0;

    if (!isSupabaseAdminConfigured()) {
      return FALLBACK_NOTIFICATIONS.filter(
        (n) => (n.userId === userId || n.userId === 'default-user') && !n.isRead
      ).length;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Erro ao contar notificações não lidas:', error.message);
      return 0;
    }

    return count || 0;
  }

  /**
   * Marks a single notification as read, strictly verifying ownership.
   */
  public static async markAsRead(
    notificationId: UUID | string,
    userId: UUID | string
  ): Promise<Notification> {
    if (!notificationId || !userId) {
      throw new Error('Parâmetros notificationId e userId são obrigatórios.');
    }

    const nowIso = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      const notif = FALLBACK_NOTIFICATIONS.find(
        (n) =>
          n.id === notificationId &&
          (n.userId === userId || n.userId === 'default-user')
      );
      if (!notif) {
        throw new Error('Notificação não encontrada ou não pertence ao usuário.');
      }
      notif.readAt = nowIso;
      notif.isRead = true;
      return { ...notif };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: nowIso })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(
        `Falha ao marcar notificação como lida: ${error?.message || 'Notificação não encontrada.'}`
      );
    }

    return mapNotificationRow(data as DatabaseNotificationRow);
  }

  /**
   * Marks all notifications of a user as read.
   */
  public static async markAllAsRead(userId: UUID | string): Promise<number> {
    if (!userId) {
      throw new Error('Parâmetro userId é obrigatório.');
    }

    const nowIso = new Date().toISOString();

    if (!isSupabaseAdminConfigured()) {
      let count = 0;
      FALLBACK_NOTIFICATIONS.forEach((n) => {
        if ((n.userId === userId || n.userId === 'default-user') && !n.isRead) {
          n.readAt = nowIso;
          n.isRead = true;
          count++;
        }
      });
      return count;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: nowIso })
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id');

    if (error) {
      throw new Error(`Falha ao marcar notificações como lidas: ${error.message}`);
    }

    return (data || []).length;
  }

  /**
   * Generates notifications for an announcement based on its target audience.
   * Only executes if the announcement is published (`isPublished === true`).
   * Ensures idempotency: will not create duplicate notifications for the same user and announcement (announcement_id + user_id).
   */
  public static async createNotificationsForAnnouncement(
    announcement: PlatformAnnouncement
  ): Promise<{ createdCount: number; skippedCount: number }> {
    if (!announcement || !announcement.id || !announcement.isPublished) {
      return { createdCount: 0, skippedCount: 0 };
    }

    const announcementId = announcement.id;
    const title = announcement.title;
    const message = announcement.message;
    const priority = announcement.priority || 'normal';
    const targetAudience = announcement.targetAudience || 'all';

    // 1. SUPABASE ADMIN MODE
    if (isSupabaseAdminConfigured()) {
      const supabaseAdmin = getSupabaseAdmin();

      // Step A: Determine eligible recipients (userId, companyId)
      let eligibleRecipients: Array<{ userId: string; companyId: string | null }> = [];

      if (targetAudience === 'all') {
        // Enviar para todos os usuários elegíveis das empresas existentes
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('company_users')
          .select('user_id, company_id')
          .eq('status', 'active');

        if (usersError) {
          throw new Error(
            `Erro ao buscar usuários para público 'all': ${usersError.message}`
          );
        }

        eligibleRecipients = (usersData || []).map((row: any) => ({
          userId: row.user_id,
          companyId: row.company_id || null,
        }));
      } else if (targetAudience === 'specific_companies') {
        // Enviar somente para usuários pertencentes às empresas existentes em target_company_ids
        const targetCompanyIds = announcement.targetCompanyIds || [];
        if (targetCompanyIds.length === 0) {
          return { createdCount: 0, skippedCount: 0 };
        }

        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('company_users')
          .select('user_id, company_id')
          .in('company_id', targetCompanyIds)
          .eq('status', 'active');

        if (usersError) {
          throw new Error(
            `Erro ao buscar usuários para público 'specific_companies': ${usersError.message}`
          );
        }

        eligibleRecipients = (usersData || []).map((row: any) => ({
          userId: row.user_id,
          companyId: row.company_id || null,
        }));
      } else if (targetAudience === 'specific_plans') {
        // Enviar somente para usuários pertencentes a empresas cuja assinatura vigente esteja ativa no plano compatível
        const targetPlanIds = announcement.targetPlanIds || [];
        if (targetPlanIds.length === 0) {
          return { createdCount: 0, skippedCount: 0 };
        }

        // Buscar assinaturas ordenadas por created_at desc para resolver a assinatura vigente de cada empresa
        const { data: subsData, error: subsError } = await supabaseAdmin
          .from('subscriptions')
          .select('company_id, plan_id, status, expires_at, created_at')
          .order('created_at', { ascending: false });

        if (subsError) {
          throw new Error(
            `Erro ao buscar assinaturas para público 'specific_plans': ${subsError.message}`
          );
        }

        const nowTime = Date.now();
        const latestSubByCompany = new Map<string, { planId: string; status: string; expiresAt: string | null }>();

        // Determina a assinatura mais recente/vigente de cada empresa
        for (const sub of (subsData || [])) {
          if (sub.company_id && !latestSubByCompany.has(sub.company_id)) {
            latestSubByCompany.set(sub.company_id, {
              planId: sub.plan_id,
              status: sub.status,
              expiresAt: sub.expires_at || null,
            });
          }
        }

        // Filtra empresas cuja assinatura vigente é ACTIVE, pertence aos planos alvo e está dentro da vigência
        const matchingCompanyIds: string[] = [];
        for (const [companyId, sub] of latestSubByCompany.entries()) {
          const isTargetPlan = targetPlanIds.includes(sub.planId);
          const isActive = sub.status === 'active';
          const isNotExpired = !sub.expiresAt || new Date(sub.expiresAt).getTime() > nowTime;

          if (isTargetPlan && isActive && isNotExpired) {
            matchingCompanyIds.push(companyId);
          }
        }

        if (matchingCompanyIds.length === 0) {
          return { createdCount: 0, skippedCount: 0 };
        }

        // Buscar usuários das empresas identificadas
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('company_users')
          .select('user_id, company_id')
          .in('company_id', matchingCompanyIds)
          .eq('status', 'active');

        if (usersError) {
          throw new Error(
            `Erro ao buscar usuários das empresas com planos selecionados: ${usersError.message}`
          );
        }

        eligibleRecipients = (usersData || []).map((row: any) => ({
          userId: row.user_id,
          companyId: row.company_id || null,
        }));
      }

      // Deduplica destinatários por userId
      const uniqueRecipientMap = new Map<string, { userId: string; companyId: string | null }>();
      for (const rec of eligibleRecipients) {
        if (rec.userId && !uniqueRecipientMap.has(rec.userId)) {
          uniqueRecipientMap.set(rec.userId, rec);
        }
      }

      const uniqueRecipients = Array.from(uniqueRecipientMap.values());
      if (uniqueRecipients.length === 0) {
        return { createdCount: 0, skippedCount: 0 };
      }

      // Step B: Verificar notificações já existentes para este comunicado (Idempotência por announcement_id + user_id)
      const { data: existingNotifs, error: existingError } = await supabaseAdmin
        .from('notifications')
        .select('user_id')
        .eq('announcement_id', announcementId);

      if (existingError) {
        throw new Error(
          `Erro ao verificar notificações existentes para o comunicado: ${existingError.message}`
        );
      }

      const alreadyNotifiedUserIds = new Set(
        (existingNotifs || []).map((n: any) => n.user_id)
      );

      const pendingRecipients = uniqueRecipients.filter(
        (r) => !alreadyNotifiedUserIds.has(r.userId)
      );

      if (pendingRecipients.length === 0) {
        return { createdCount: 0, skippedCount: alreadyNotifiedUserIds.size };
      }

      // Step C: Preparar registros de notificação e inserir
      const nowIso = new Date().toISOString();
      const rowsToInsert = pendingRecipients.map((r) => ({
        user_id: r.userId,
        company_id: r.companyId,
        announcement_id: announcementId,
        title: title.trim(),
        message: message.trim(),
        category: 'announcement',
        priority: priority,
        read_at: null,
        action_url: null,
        created_at: nowIso,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(rowsToInsert);

      if (insertError) {
        throw new Error(
          `Falha ao criar notificações para o comunicado: ${insertError.message}`
        );
      }

      return {
        createdCount: rowsToInsert.length,
        skippedCount: alreadyNotifiedUserIds.size,
      };
    }

    // 2. FALLBACK IN-MEMORY MODE (Para desenvolvimento local sem Supabase configurado)
    const fallbackRecipients: Array<{ userId: string; companyId: string | null }> = [
      { userId: '990e8400-e29b-41d4-a716-446655440001', companyId: '550e8400-e29b-41d4-a716-446655440001' },
      { userId: '990e8400-e29b-41d4-a716-446655440002', companyId: '550e8400-e29b-41d4-a716-446655440001' },
      { userId: '990e8400-e29b-41d4-a716-446655440003', companyId: '550e8400-e29b-41d4-a716-446655440001' },
      { userId: 'default-user', companyId: null },
    ];

    let filteredRecipients = [...fallbackRecipients];

    if (targetAudience === 'specific_companies') {
      const targetCompanyIds = announcement.targetCompanyIds || [];
      filteredRecipients = filteredRecipients.filter(
        (r) => r.companyId && targetCompanyIds.includes(r.companyId)
      );
    } else if (targetAudience === 'specific_plans') {
      const targetPlanIds = announcement.targetPlanIds || [];
      if (targetPlanIds.length === 0) {
        filteredRecipients = [];
      }
    }

    let createdCount = 0;
    let skippedCount = 0;
    const nowIso = new Date().toISOString();

    for (const rec of filteredRecipients) {
      const alreadyExists = FALLBACK_NOTIFICATIONS.some(
        (n) => n.announcementId === announcementId && n.userId === rec.userId
      );
      if (alreadyExists) {
        skippedCount++;
        continue;
      }

      const newNotif: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: rec.userId,
        companyId: rec.companyId,
        announcementId: announcementId,
        title: title.trim(),
        message: message.trim(),
        category: 'announcement',
        priority: priority,
        readAt: null,
        isRead: false,
        actionUrl: null,
        createdAt: nowIso,
      };
      FALLBACK_NOTIFICATIONS.unshift(newNotif);
      createdCount++;
    }

    return { createdCount, skippedCount };
  }
}
