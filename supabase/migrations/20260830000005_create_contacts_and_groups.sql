-- ==============================================================================
-- OLYPS PRO — MIGRATION: 20260830000005_create_contacts_and_groups.sql
-- ETAPA 05.2: Módulo Contatos (Clientes, Fornecedores e Grupos de Clientes)
-- ==============================================================================

-- 1. Create table: public.customer_groups (Grupos de Segmentação de Clientes)
CREATE TABLE IF NOT EXISTS public.customer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    price_table TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_customer_groups_company_name UNIQUE (company_id, name)
);

-- 2. Create table: public.customers (Clientes Pessoas Físicas e Jurídicas)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_group_id UUID REFERENCES public.customer_groups(id) ON DELETE SET NULL,
    person_type TEXT NOT NULL DEFAULT 'legal' CHECK (person_type IN ('individual', 'legal')),
    name TEXT NOT NULL,
    trade_name TEXT,
    document TEXT,
    state_registration TEXT,
    municipal_registration TEXT,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    website TEXT,
    contact_name TEXT,
    address TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Brasil',
    credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create table: public.suppliers (Fornecedores e Distribuidores)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    person_type TEXT NOT NULL DEFAULT 'legal' CHECK (person_type IN ('individual', 'legal')),
    name TEXT NOT NULL,
    trade_name TEXT,
    document TEXT,
    state_registration TEXT,
    municipal_registration TEXT,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    website TEXT,
    contact_name TEXT,
    address TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Brasil',
    category TEXT,
    payment_terms TEXT,
    bank_info JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes for Performance and Tenant Isolation
CREATE INDEX IF NOT EXISTS idx_customer_groups_company_id ON public.customer_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_groups_status ON public.customer_groups(status);

CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_group_id ON public.customers(customer_group_id);
CREATE INDEX IF NOT EXISTS idx_customers_document ON public.customers(document);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_document ON public.suppliers(document);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_groups FORCE ROW LEVEL SECURITY;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers FORCE ROW LEVEL SECURITY;

-- 6. RLS Policies for public.customer_groups
CREATE POLICY customer_groups_select_policy ON public.customer_groups
    FOR SELECT
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY customer_groups_insert_policy ON public.customer_groups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY customer_groups_update_policy ON public.customer_groups
    FOR UPDATE
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY customer_groups_delete_policy ON public.customer_groups
    FOR DELETE
    TO authenticated
    USING (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- 7. RLS Policies for public.customers
CREATE POLICY customers_select_policy ON public.customers
    FOR SELECT
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY customers_insert_policy ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY customers_update_policy ON public.customers
    FOR UPDATE
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY customers_delete_policy ON public.customers
    FOR DELETE
    TO authenticated
    USING (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- 8. RLS Policies for public.suppliers
CREATE POLICY suppliers_select_policy ON public.suppliers
    FOR SELECT
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY suppliers_insert_policy ON public.suppliers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY suppliers_update_policy ON public.suppliers
    FOR UPDATE
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY suppliers_delete_policy ON public.suppliers
    FOR DELETE
    TO authenticated
    USING (
        public.is_company_admin(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );
