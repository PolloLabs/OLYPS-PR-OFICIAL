-- ==============================================================================
-- OLYPS PRO — MIGRATION: 20260830000006_create_coupons_and_discounts.sql
-- ETAPA 05.3: Módulo de Cupons de Desconto, Validação e Histórico de Utilização
-- ==============================================================================

-- 1. Create table: public.coupons (Cupons de Desconto Promocionais)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
    applicable_plan_ids JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 2. Create table: public.coupon_usages (Histórico e Auditoria de Utilização de Cupons)
CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID,
    original_price_cents INTEGER NOT NULL CHECK (original_price_cents >= 0),
    discount_cents INTEGER NOT NULL CHECK (discount_cents >= 0),
    final_price_cents INTEGER NOT NULL CHECK (final_price_cents >= 0),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add coupon reference columns to public.subscriptions without affecting subscription_plans.price_cents
ALTER TABLE public.subscriptions 
    ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS coupon_code TEXT,
    ADD COLUMN IF NOT EXISTS original_price_cents INTEGER,
    ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS final_price_cents INTEGER;

-- 4. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON public.coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_company_id ON public.coupon_usages(company_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_subscription_id ON public.coupon_usages(subscription_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons FORCE ROW LEVEL SECURITY;

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages FORCE ROW LEVEL SECURITY;

-- 6. RLS Policies for public.coupons
-- SELECT: Authenticated users can query active coupons for checkout validation; Super Admins can view all
CREATE POLICY coupons_select_auth_policy ON public.coupons
    FOR SELECT
    TO authenticated
    USING (
        (status = 'active' AND deleted_at IS NULL) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY coupons_select_anon_policy ON public.coupons
    FOR SELECT
    TO anon
    USING (
        status = 'active' AND deleted_at IS NULL
    );

-- INSERT / UPDATE / DELETE: Super Admin only
CREATE POLICY coupons_insert_policy ON public.coupons
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

CREATE POLICY coupons_update_policy ON public.coupons
    FOR UPDATE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    )
    WITH CHECK (
        public.is_platform_admin(auth.uid())
    );

CREATE POLICY coupons_delete_policy ON public.coupons
    FOR DELETE
    TO authenticated
    USING (
        public.is_platform_admin(auth.uid())
    );

-- 7. RLS Policies for public.coupon_usages
CREATE POLICY coupon_usages_select_policy ON public.coupon_usages
    FOR SELECT
    TO authenticated
    USING (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

CREATE POLICY coupon_usages_insert_policy ON public.coupon_usages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_company_member(company_id, auth.uid()) OR public.is_platform_admin(auth.uid())
    );

-- 8. Seed Initial Official Promotional Coupons (Idempotent via ON CONFLICT)
INSERT INTO public.coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    valid_from,
    valid_until,
    max_uses,
    uses_count,
    applicable_plan_ids,
    status
) VALUES 
(
    'LANCA20',
    'Lançamento Oficial 20% OFF',
    'Desconto especial de 20% para novas empresas em qualquer plano comercial pago.',
    'percentage',
    20.00,
    now() - INTERVAL '30 days',
    now() + INTERVAL '180 days',
    500,
    14,
    '[]'::jsonb,
    'active'
),
(
    'PROMO50',
    'Campanha Acelera 50% OFF',
    'Super desconto promocional de 50% aplicável em planos profissionais.',
    'percentage',
    50.00,
    now() - INTERVAL '10 days',
    now() + INTERVAL '60 days',
    100,
    38,
    '[]'::jsonb,
    'active'
),
(
    'BEMVINDO100',
    'Cupom Fixo Boas-Vindas R$ 100',
    'Desconto fixo de R$ 100,00 na primeira mensalidade para novos clientes OLYPS.',
    'fixed_amount',
    10000.00,
    now() - INTERVAL '15 days',
    now() + INTERVAL '90 days',
    200,
    72,
    '[]'::jsonb,
    'active'
),
(
    'OLYPS10',
    'Cupom Parceiro 10% OFF',
    'Desconto de 10% contínuo para empresas indicadas por parceiros comerciais.',
    'percentage',
    10.00,
    now() - INTERVAL '5 days',
    now() + INTERVAL '365 days',
    NULL,
    5,
    '[]'::jsonb,
    'active'
)
ON CONFLICT (code) DO NOTHING;
