-- ==============================================================================
-- OLYPS PRO — MIGRATION: 20260830000001_create_companies_and_company_users.sql
-- ETAPA 02.2: Fundação Multi-tenant N:N (Empresas e Vínculos de Usuários)
-- ==============================================================================

-- 1. Create table: public.companies
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    document TEXT,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_companies_slug UNIQUE (slug)
);

-- 2. Create index for companies lookup
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- 3. Create table: public.company_users (N:N relationship)
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('company_admin', 'manager', 'seller', 'cashier', 'technician', 'stock_manager')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_company_users_membership UNIQUE (company_id, user_id)
);

-- 4. Create indexes for company_users lookup and multi-tenant resolution
CREATE INDEX IF NOT EXISTS idx_company_users_user_lookup ON public.company_users(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_company_users_company_lookup ON public.company_users(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON public.company_users(status);

-- 5. Helper Function: is_company_member (Safe Security Definer with protected search_path)
CREATE OR REPLACE FUNCTION public.is_company_member(
    target_company_id UUID,
    lookup_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_users
        WHERE company_id = target_company_id
          AND user_id = lookup_user_id
          AND status = 'active'
    );
$$;

-- 6. Helper Function: is_company_admin (Checks if user is company_admin of given company)
CREATE OR REPLACE FUNCTION public.is_company_admin(
    target_company_id UUID,
    lookup_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_users
        WHERE company_id = target_company_id
          AND user_id = lookup_user_id
          AND role = 'company_admin'
          AND status = 'active'
    );
$$;

-- 7. Enable RLS on both tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies FORCE ROW LEVEL SECURITY;

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users FORCE ROW LEVEL SECURITY;

-- 8. RLS Policies for public.companies
-- SELECT: Users can only view companies where they have an active membership OR if they are Platform Super Admin
CREATE POLICY companies_select_policy ON public.companies
    FOR SELECT
    TO authenticated
    USING (
        public.is_company_member(id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- UPDATE: Only company_admin of that company or Platform Super Admin
CREATE POLICY companies_update_policy ON public.companies
    FOR UPDATE
    TO authenticated
    USING (
        public.is_company_admin(id, auth.uid()) OR public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_company_admin(id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- INSERT: Only Platform Super Admin can insert new companies in this foundation phase (controlled provisioning)
CREATE POLICY companies_insert_policy ON public.companies
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

-- DELETE: Prohibited for tenant users (only Super Admin if required)
CREATE POLICY companies_delete_policy ON public.companies
    FOR DELETE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    );

-- 9. RLS Policies for public.company_users
-- SELECT: Users can see their own memberships, or memberships in companies where they are active members
CREATE POLICY company_users_select_policy ON public.company_users
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- INSERT: Only company_admin of that company or Platform Super Admin can add users (prevents self-addition)
CREATE POLICY company_users_insert_policy ON public.company_users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- UPDATE: Only company_admin or Super Admin can update roles/status (prevents self-elevation from seller -> company_admin)
CREATE POLICY company_users_update_policy ON public.company_users
    FOR UPDATE
    TO authenticated
    USING (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- DELETE: Only company_admin or Super Admin can delete/remove memberships
CREATE POLICY company_users_delete_policy ON public.company_users
    FOR DELETE
    TO authenticated
    USING (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );
