-- ==============================================================================
-- OLYPS PRO — MIGRATION: 20260830000004_create_subscriptions_and_plans.sql
-- ETAPA 04: Módulo de Assinaturas, Planos, Vigência e Limites Operacionais
-- ==============================================================================

-- 1. Create table: public.subscription_plans (Planos Comerciais e Internos)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly', 'quarterly', 'semiannual', 'lifetime')),
    duration_days INTEGER NOT NULL DEFAULT 30,
    is_free BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create table: public.subscriptions (Assinaturas das Empresas)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'suspended', 'cancelled')),
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON public.subscription_plans(code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_status ON public.subscription_plans(status);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_public ON public.subscription_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_display_order ON public.subscription_plans(display_order);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

-- 5. RLS Policies for public.subscription_plans
-- SELECT: Public can see active and public plans; Authenticated users can view active plans or Super Admins view all
CREATE POLICY subscription_plans_select_public_policy ON public.subscription_plans
    FOR SELECT
    TO anon
    USING (
        status = 'active' AND is_public = true
    );

CREATE POLICY subscription_plans_select_auth_policy ON public.subscription_plans
    FOR SELECT
    TO authenticated
    USING (
        status = 'active' OR public.is_platform_admin(auth.uid())
    );

-- INSERT / UPDATE / DELETE: Only Platform Super Admin
CREATE POLICY subscription_plans_insert_policy ON public.subscription_plans
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

CREATE POLICY subscription_plans_update_policy ON public.subscription_plans
    FOR UPDATE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

CREATE POLICY subscription_plans_delete_policy ON public.subscription_plans
    FOR DELETE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    );

-- 6. RLS Policies for public.subscriptions
-- SELECT: Active members of the company or Platform Super Admin
CREATE POLICY subscriptions_select_policy ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- INSERT / UPDATE / DELETE: Only Platform Super Admin
CREATE POLICY subscriptions_insert_policy ON public.subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

CREATE POLICY subscriptions_update_policy ON public.subscriptions
    FOR UPDATE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

CREATE POLICY subscriptions_delete_policy ON public.subscriptions
    FOR DELETE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    );

-- 7. Seed Initial Official Subscription Plans (Idempotent via ON CONFLICT)
INSERT INTO public.subscription_plans (
    code,
    name,
    description,
    price_cents,
    billing_period,
    duration_days,
    is_free,
    is_public,
    is_featured,
    display_order,
    status,
    features,
    limits
)
VALUES
    (
        'free',
        'Gratuito',
        'Plano de degustação essencial para começar o controle da sua empresa sem custo.',
        0,
        'monthly',
        0,
        true,
        true,
        false,
        1,
        'active',
        '[
            "1 Usuário incluído",
            "1 Local Comercial (Matriz)",
            "Até 50 Produtos cadastrados",
            "Gestão básica de clientes",
            "Suporte comunitário",
            "Sem prazo de expiração obrigatório"
        ]'::jsonb,
        '{
            "max_users": 1,
            "max_locations": 1,
            "max_products": 50,
            "max_clients": 100,
            "has_nfe": false,
            "has_pdv": false
        }'::jsonb
    ),
    (
        'basic',
        'Básico',
        'Ideal para profissionais autônomos, assistências técnicas e pequenas lojas.',
        4900,
        'monthly',
        30,
        false,
        true,
        false,
        2,
        'active',
        '[
            "Até 3 Usuários",
            "1 Local Comercial (Matriz)",
            "Até 500 Produtos cadastrados",
            "Ordens de Serviço e Reparos básicas",
            "PDV Frente de Caixa Rápido",
            "Gestão Financeira e Contas",
            "Suporte padrão por email"
        ]'::jsonb,
        '{
            "max_users": 3,
            "max_locations": 1,
            "max_products": 500,
            "max_clients": 1000,
            "has_nfe": false,
            "has_pdv": true
        }'::jsonb
    ),
    (
        'pro',
        'Profissional',
        'O plano mais completo para lojas, assistências e comércios em expansão acelerada.',
        9900,
        'monthly',
        30,
        false,
        true,
        true,
        3,
        'active',
        '[
            "Até 10 Usuários com controle de permissões",
            "Até 3 Locais Comerciais (Matriz + 2 Filiais)",
            "Produtos e Clientes ilimitados",
            "Emissão Fiscal (NFC-e / NF-e)",
            "PDV Frente de Caixa Multi-operador",
            "Módulo de Reparos & Garantias Completo",
            "Relatórios Gerenciais e DRE",
            "Suporte Prioritário via WhatsApp"
        ]'::jsonb,
        '{
            "max_users": 10,
            "max_locations": 3,
            "max_products": 10000,
            "max_clients": 10000,
            "has_nfe": true,
            "has_pdv": true
        }'::jsonb
    ),
    (
        'premium',
        'Premium Enterprise',
        'Potência máxima para grandes redes, franquias e operações corporativas de alto volume.',
        19900,
        'monthly',
        30,
        false,
        true,
        false,
        4,
        'active',
        '[
            "Usuários Ilimitados",
            "Locais Comerciais e Filiais Ilimitados",
            "Estoque Multi-filial com Transferências em Tempo Real",
            "Emissão Fiscal Ilimitada com Certificado Digital A1",
            "Reparos, Ordens de Serviço e Laudos Técnicos Avançados",
            "Auditoria de Logs e Governança Corporativa",
            "Gerente de Contas Dedicado",
            "Suporte VIP 24/7"
        ]'::jsonb,
        '{
            "max_users": 9999,
            "max_locations": 999,
            "max_products": 999999,
            "max_clients": 999999,
            "has_nfe": true,
            "has_pdv": true
        }'::jsonb
    )
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_cents = EXCLUDED.price_cents,
    billing_period = EXCLUDED.billing_period,
    duration_days = EXCLUDED.duration_days,
    is_free = EXCLUDED.is_free,
    is_public = EXCLUDED.is_public,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order,
    status = EXCLUDED.status,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    updated_at = now();
