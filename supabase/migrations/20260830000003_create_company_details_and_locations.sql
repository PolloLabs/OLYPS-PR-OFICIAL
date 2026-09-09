-- ==============================================================================
-- OLYPS PRO — MIGRATION: 20260830000003_create_company_details_and_locations.sql
-- ETAPA 03: Módulo Empresas (Dados Cadastrais e Locais Comerciais)
-- ==============================================================================

-- 1. Expand public.companies with enterprise contact, fiscal and address details
ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil',
    ADD COLUMN IF NOT EXISTS postal_code TEXT,
    ADD COLUMN IF NOT EXISTS state_registration TEXT,
    ADD COLUMN IF NOT EXISTS tax_regime TEXT DEFAULT 'simples_nacional',
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

-- 2. Create table: public.commercial_locations (Locais Comerciais / Filiais / Pontos de Venda)
CREATE TABLE IF NOT EXISTS public.commercial_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    document TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    is_main BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create indexes for commercial locations
CREATE INDEX IF NOT EXISTS idx_commercial_locations_company_id ON public.commercial_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_commercial_locations_status ON public.commercial_locations(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.commercial_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_locations FORCE ROW LEVEL SECURITY;

-- 5. RLS Policies for public.commercial_locations
-- SELECT: Active members of the company OR Platform Super Admin
CREATE POLICY commercial_locations_select_policy ON public.commercial_locations
    FOR SELECT
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- INSERT: Company Admin or Platform Super Admin
CREATE POLICY commercial_locations_insert_policy ON public.commercial_locations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- UPDATE: Company Admin or Platform Super Admin
CREATE POLICY commercial_locations_update_policy ON public.commercial_locations
    FOR UPDATE
    TO authenticated
    USING (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- DELETE: Company Admin or Platform Super Admin
CREATE POLICY commercial_locations_delete_policy ON public.commercial_locations
    FOR DELETE
    TO authenticated
    USING (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );
