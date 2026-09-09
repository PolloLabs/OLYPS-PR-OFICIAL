-- ==============================================================================
-- FASE 05.4 - Migration: Announcements & Notifications
-- Título: Criação de Comunicados Globais e Central de Notificações
-- Arquivo: supabase/migrations/20260830000007_create_announcements_and_notifications.sql
-- ==============================================================================

-- 1. TABELA DE COMUNICADOS GLOBAIS DA PLATAFORMA (platform_announcements)
CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info'
        CHECK (type IN ('info', 'warning', 'critical', 'maintenance', 'update')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience VARCHAR(30) NOT NULL DEFAULT 'all'
        CHECK (target_audience IN ('all', 'specific_plans', 'specific_companies')),
    target_plan_ids UUID[] DEFAULT '{}',
    target_company_ids UUID[] DEFAULT '{}',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para platform_announcements
CREATE INDEX IF NOT EXISTS idx_platform_announcements_published_dates 
    ON public.platform_announcements(is_published, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_platform_announcements_target_audience 
    ON public.platform_announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_platform_announcements_created_at 
    ON public.platform_announcements(created_at DESC);

-- 2. TABELA DE NOTIFICAÇÕES DE USUÁRIO (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    announcement_id UUID NULL REFERENCES public.platform_announcements(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'system'
        CHECK (category IN ('system', 'subscription', 'security', 'announcement')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read_at TIMESTAMPTZ NULL,
    action_url VARCHAR(500) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id 
    ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_announcement_id 
    ON public.notifications(announcement_id);

-- 3. TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at_platform_announcements()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_announcements_updated_at ON public.platform_announcements;
CREATE TRIGGER trg_platform_announcements_updated_at
    BEFORE UPDATE ON public.platform_announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_platform_announcements();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para platform_announcements:
-- Super Admins têm acesso total.
-- Usuários autenticados podem visualizar comunicados publicados e vigentes.
CREATE POLICY "Super admins can manage platform announcements"
    ON public.platform_announcements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.platform_admins pa
            WHERE pa.user_id = auth.uid() AND pa.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.platform_admins pa
            WHERE pa.user_id = auth.uid() AND pa.status = 'active'
        )
    );

CREATE POLICY "Authenticated users can view active published announcements"
    ON public.platform_announcements
    FOR SELECT
    TO authenticated
    USING (
        is_published = true 
        AND starts_at <= NOW() 
        AND (expires_at IS NULL OR expires_at >= NOW())
    );

-- Políticas para notifications:
-- Usuários podem visualizar, ler e atualizar apenas suas próprias notificações.
CREATE POLICY "Users can view and manage their own notifications"
    ON public.notifications
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all notifications"
    ON public.notifications
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.platform_admins pa
            WHERE pa.user_id = auth.uid() AND pa.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.platform_admins pa
            WHERE pa.user_id = auth.uid() AND pa.status = 'active'
        )
    );
