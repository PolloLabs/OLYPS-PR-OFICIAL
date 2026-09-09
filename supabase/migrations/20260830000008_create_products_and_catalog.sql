-- ==============================================================================
-- FASE 06 - Migration: Products & Catalog
-- Título: Criação das Estruturas do Módulo de Produtos, Variações, Catálogo e Estoque Inicial
-- Arquivo: supabase/migrations/20260830000008_create_products_and_catalog.sql
-- ==============================================================================

-- 1. TABELA DE CATEGORIAS (categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NULL,
    description TEXT NULL,
    parent_id UUID NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_categories_company_name_parent UNIQUE (company_id, name, parent_id),
    CONSTRAINT uq_categories_company_id UNIQUE (company_id, id),
    CONSTRAINT chk_categories_not_self_parent CHECK (id <> parent_id)
);

CREATE INDEX IF NOT EXISTS idx_categories_company_id ON public.categories(company_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 2. TABELA DE MARCAS (brands)
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_brands_company_name UNIQUE (company_id, name),
    CONSTRAINT uq_brands_company_id UNIQUE (company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_brands_company_id ON public.brands(company_id);

-- 3. TABELA DE UNIDADES DE MEDIDA (units)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    short_name VARCHAR(10) NOT NULL,
    allow_decimal BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_units_company_short_name UNIQUE (company_id, short_name),
    CONSTRAINT uq_units_company_id UNIQUE (company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_units_company_id ON public.units(company_id);

-- 4. TABELA DE MARCAS DE DISPOSITIVOS / FABRICANTES (device_brands)
CREATE TABLE IF NOT EXISTS public.device_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_brands_company_name UNIQUE (company_id, name),
    CONSTRAINT uq_device_brands_company_id UNIQUE (company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_device_brands_company_id ON public.device_brands(company_id);

-- 5. TABELA DE MODELOS DE DISPOSITIVOS (device_models)
CREATE TABLE IF NOT EXISTS public.device_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    device_brand_id UUID NOT NULL REFERENCES public.device_brands(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    technical_code VARCHAR(100) NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_models_company_brand_name UNIQUE (company_id, device_brand_id, name),
    CONSTRAINT uq_device_models_company_id UNIQUE (company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_device_models_company_id ON public.device_models(company_id);
CREATE INDEX IF NOT EXISTS idx_device_models_brand ON public.device_models(device_brand_id);

-- 6. TABELA MESTRA DE PRODUTOS (products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    barcode_type VARCHAR(20) NOT NULL DEFAULT 'C128'
        CHECK (barcode_type IN ('C128', 'C39', 'EAN13', 'EAN8', 'UPCA', 'UPCE')),
    barcode VARCHAR(100) NULL,
    product_type VARCHAR(20) NOT NULL DEFAULT 'single'
        CHECK (product_type IN ('single', 'variable', 'combo')),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    brand_id UUID NULL REFERENCES public.brands(id) ON DELETE SET NULL,
    category_id UUID NULL REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NULL,
    operational_notes TEXT NULL,
    image_url TEXT NULL,
    brochure_url TEXT NULL,
    brochure_name VARCHAR(255) NULL,
    weight NUMERIC(10,3) NULL,
    preparation_time INTEGER NULL,
    manage_stock BOOLEAN NOT NULL DEFAULT true,
    alert_quantity NUMERIC(12,3) NOT NULL DEFAULT 5.000,
    enable_imei_serial BOOLEAN NOT NULL DEFAULT false,
    not_for_sale BOOLEAN NOT NULL DEFAULT false,
    applicable_tax VARCHAR(50) NULL,
    sale_price_tax_type VARCHAR(20) NOT NULL DEFAULT 'exclusive'
        CHECK (sale_price_tax_type IN ('inclusive', 'exclusive')),
    default_purchase_price NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    margin_percent NUMERIC(7,2) NOT NULL DEFAULT 0.00,
    default_sale_price NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    warranty_duration INTEGER NULL,
    warranty_unit VARCHAR(20) NOT NULL DEFAULT 'days'
        CHECK (warranty_unit IN ('days', 'months', 'years')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_products_company_sku UNIQUE (company_id, sku),
    CONSTRAINT uq_products_company_id UNIQUE (company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(company_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(company_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(company_id, active);
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_barcode ON public.products(company_id, barcode) WHERE barcode IS NOT NULL;

-- 7. TABELA DE VARIAÇÕES DE PRODUTOS (product_variations)
CREATE TABLE IF NOT EXISTS public.product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100) NULL,
    purchase_price NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    margin_percent NUMERIC(7,2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_variations_company_sku UNIQUE (company_id, sku),
    CONSTRAINT uq_variations_company_product_id UNIQUE (company_id, product_id, id),
    CONSTRAINT uq_variations_company_id UNIQUE (company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON public.product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_company_id ON public.product_variations(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_variations_barcode ON public.product_variations(company_id, barcode) WHERE barcode IS NOT NULL;

-- 8. TABELA DE COMPATIBILIDADE COM MODELOS DE DISPOSITIVOS (product_device_models)
CREATE TABLE IF NOT EXISTS public.product_device_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    device_model_id UUID NOT NULL REFERENCES public.device_models(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_device_models UNIQUE (product_id, device_model_id)
);

CREATE INDEX IF NOT EXISTS idx_product_device_models_product ON public.product_device_models(product_id);
CREATE INDEX IF NOT EXISTS idx_product_device_models_device ON public.product_device_models(device_model_id);

-- 9. TABELA DE ESTOQUE E ALOCAÇÃO POR LOCAL COMERCIAL (product_locations)
CREATE TABLE IF NOT EXISTS public.product_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES public.product_variations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.commercial_locations(id) ON DELETE CASCADE,
    rack_location VARCHAR(100) NULL,
    manage_stock BOOLEAN NOT NULL DEFAULT true,
    initial_stock NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    min_stock NUMERIC(12,3) NULL,
    max_stock NUMERIC(12,3) NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_locations_var_loc UNIQUE (variation_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_product_locations_company ON public.product_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_product_locations_prod ON public.product_locations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_locations_loc ON public.product_locations(location_id);

-- 10. TABELA DE COMPONENTES DE COMBO (product_combos)
CREATE TABLE IF NOT EXISTS public.product_combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    combo_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    component_variation_id UUID NOT NULL REFERENCES public.product_variations(id) ON DELETE RESTRICT,
    quantity NUMERIC(12,3) NOT NULL DEFAULT 1.000,
    unit_price NUMERIC(15,4) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_combos_item UNIQUE (combo_product_id, component_variation_id),
    CONSTRAINT chk_product_combos_qty CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_product_combos_combo_id ON public.product_combos(combo_product_id);

-- 11. TABELA DE MÍDIAS E DOCUMENTOS DE PRODUTOS (product_media)
CREATE TABLE IF NOT EXISTS public.product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variation_id UUID NULL REFERENCES public.product_variations(id) ON DELETE SET NULL,
    media_type VARCHAR(20) NOT NULL DEFAULT 'image'
        CHECK (media_type IN ('image', 'document', 'manual', 'brochure')),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NULL,
    mime_type VARCHAR(100) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_media_product ON public.product_media(product_id);

-- 12. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company categories" ON public.categories
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company categories" ON public.categories
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company brands" ON public.brands
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company brands" ON public.brands
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company units" ON public.units
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company units" ON public.units
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company device brands" ON public.device_brands
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company device brands" ON public.device_brands
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company device models" ON public.device_models
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company device models" ON public.device_models
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company products" ON public.products
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company products" ON public.products
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company variations" ON public.product_variations
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company variations" ON public.product_variations
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company product locations" ON public.product_locations
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company product locations" ON public.product_locations
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company product combos" ON public.product_combos
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company product combos" ON public.product_combos
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Users can view own company product media" ON public.product_media
    FOR SELECT USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "Users can manage own company product media" ON public.product_media
    FOR ALL USING (public.is_company_member(company_id, auth.uid()));
