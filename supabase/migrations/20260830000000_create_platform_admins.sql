-- ==============================================================================
-- OLYPS PRO — MIGRATION: 20260830000000_create_platform_admins.sql
-- ETAPA 02.1: Fundação do Super Admin e Autorização de Plataforma
-- ==============================================================================

-- 1. Create table for Platform Super Admins
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_platform_admins_user UNIQUE (user_id)
);

-- 2. Create index for fast status verification
CREATE INDEX IF NOT EXISTS idx_platform_admins_lookup 
    ON public.platform_admins(user_id) 
    WHERE is_active = true;

-- 3. Create security definer function to verify platform admin status safely
CREATE OR REPLACE FUNCTION public.is_platform_admin(lookup_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.platform_admins
        WHERE user_id = lookup_user_id
          AND is_active = true
    );
$$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins FORCE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- SELECT: Super Admins can see all records; users can verify their own record.
CREATE POLICY platform_admins_select_policy ON public.platform_admins
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR public.is_platform_admin(auth.uid())
    );

-- INSERT: Strictly restricted to existing active Super Admins (prevents self-elevation).
CREATE POLICY platform_admins_insert_policy ON public.platform_admins
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

-- UPDATE: Strictly restricted to existing active Super Admins.
CREATE POLICY platform_admins_update_policy ON public.platform_admins
    FOR UPDATE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

-- DELETE: Strictly restricted to existing active Super Admins.
CREATE POLICY platform_admins_delete_policy ON public.platform_admins
    FOR DELETE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    );
