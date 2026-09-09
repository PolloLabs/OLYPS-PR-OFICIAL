-- ==============================================================================
-- OLYPS PRO — MIGRATION: 20260830000002_create_rbac_and_permissions.sql
-- ETAPA 02.3: RBAC e Permissões Granulares
-- ==============================================================================

-- 1. Create table: public.permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_permissions_key UNIQUE (key)
);

-- 2. Create table: public.roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    scope TEXT NOT NULL DEFAULT 'company' CHECK (scope IN ('platform', 'company')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_roles_key UNIQUE (key)
);

-- 3. Create table: public.role_permissions (N:N relationship between roles and permissions)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);

-- 4. Create indexes for high-speed permission evaluations
CREATE INDEX IF NOT EXISTS idx_permissions_key ON public.permissions(key);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
CREATE INDEX IF NOT EXISTS idx_roles_key ON public.roles(key);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);

-- 5. Helper Function: has_company_permission (Safe Security Definer)
CREATE OR REPLACE FUNCTION public.has_company_permission(
    target_company_id UUID,
    permission_key TEXT,
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
        FROM public.company_users cu
        JOIN public.roles r ON r.key = cu.role
        JOIN public.role_permissions rp ON rp.role_id = r.id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE cu.company_id = target_company_id
          AND cu.user_id = lookup_user_id
          AND cu.status = 'active'
          AND p.key = permission_key
    );
$$;

-- 6. Helper Function: get_user_company_permissions (Returns list of permission keys)
CREATE OR REPLACE FUNCTION public.get_user_company_permissions(
    target_company_id UUID,
    lookup_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (permission_key TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
    SELECT DISTINCT p.key AS permission_key
    FROM public.company_users cu
    JOIN public.roles r ON r.key = cu.role
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE cu.company_id = target_company_id
      AND cu.user_id = lookup_user_id
      AND cu.status = 'active';
$$;

-- 7. Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;

-- 8. RLS Policies
-- SELECT: Authenticated users can view catalog of permissions, roles and mappings
CREATE POLICY permissions_select_policy ON public.permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY roles_select_policy ON public.roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY role_permissions_select_policy ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

-- INSERT / UPDATE / DELETE: Only Platform Super Admin can alter system RBAC catalogs
CREATE POLICY permissions_admin_manage ON public.permissions
    FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY roles_admin_manage ON public.roles
    FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY role_permissions_admin_manage ON public.role_permissions
    FOR ALL TO authenticated
    USING (public.is_platform_admin(auth.uid()))
    WITH CHECK (public.is_platform_admin(auth.uid()));

-- ==============================================================================
-- 9. DETERMINISTIC SEEDS: STANDARD ROLES & PERMISSIONS
-- ==============================================================================

-- 9.1 Insert Default System Roles
INSERT INTO public.roles (key, name, description, scope)
VALUES
    ('company_admin', 'Administrador da Empresa', 'Acesso total às configurações, operações e usuários da empresa.', 'company'),
    ('manager', 'Gerente', 'Gestão operacional de vendas, estoque, compras, clientes e relatórios.', 'company'),
    ('seller', 'Vendedor', 'Operações de atendimento a clientes, pedidos de vendas e PDV.', 'company'),
    ('cashier', 'Operador de Caixa', 'Abertura, fechamento de caixa e operações de PDV.', 'company'),
    ('technician', 'Técnico', 'Gestão e execução de ordens de serviço e reparos técnicos.', 'company'),
    ('stock_manager', 'Estoquista', 'Gestão de estoque, movimentações, conferência e compras.', 'company')
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = now();

-- 9.2 Insert Granular Permissions Catalog
INSERT INTO public.permissions (key, name, description, module, action)
VALUES
    -- Dashboard
    ('dashboard.visualizar', 'Visualizar Dashboard', 'Permite visualizar o painel principal e métricas da empresa', 'dashboard', 'visualizar'),

    -- Clientes
    ('clientes.ler', 'Visualizar Clientes', 'Permite consultar a lista e fichas de clientes', 'clientes', 'ler'),
    ('clientes.criar', 'Criar Clientes', 'Permite cadastrar novos clientes', 'clientes', 'criar'),
    ('clientes.atualizar', 'Atualizar Clientes', 'Permite editar dados de clientes existentes', 'clientes', 'atualizar'),
    ('clientes.excluir', 'Excluir Clientes', 'Permite remover clientes cadastrados', 'clientes', 'excluir'),

    -- Fornecedores
    ('fornecedores.ler', 'Visualizar Fornecedores', 'Permite consultar fornecedores', 'fornecedores', 'ler'),
    ('fornecedores.criar', 'Criar Fornecedores', 'Permite cadastrar novos fornecedores', 'fornecedores', 'criar'),
    ('fornecedores.atualizar', 'Atualizar Fornecedores', 'Permite editar dados de fornecedores', 'fornecedores', 'atualizar'),
    ('fornecedores.excluir', 'Excluir Fornecedores', 'Permite remover fornecedores', 'fornecedores', 'excluir'),

    -- Produtos
    ('produtos.ler', 'Visualizar Produtos', 'Permite consultar o catálogo de produtos', 'produtos', 'ler'),
    ('produtos.criar', 'Criar Produtos', 'Permite cadastrar novos produtos', 'produtos', 'criar'),
    ('produtos.atualizar', 'Atualizar Produtos', 'Permite editar dados de produtos', 'produtos', 'atualizar'),
    ('produtos.excluir', 'Excluir Produtos', 'Permite remover produtos do catálogo', 'produtos', 'excluir'),

    -- Estoque
    ('estoque.visualizar', 'Visualizar Estoque', 'Permite consultar saldos e posições de estoque', 'estoque', 'visualizar'),
    ('estoque.ajustar', 'Ajustar Estoque', 'Permite realizar ajustes e correções de saldo de estoque', 'estoque', 'ajustar'),
    ('estoque.transferir', 'Transferir Estoque', 'Permite realizar transferências entre locais de estoque', 'estoque', 'transferir'),

    -- Vendas
    ('vendas.ler', 'Visualizar Vendas', 'Permite consultar histórico e pedidos de vendas', 'vendas', 'ler'),
    ('vendas.criar', 'Criar Vendas', 'Permite registrar novas vendas e pedidos', 'vendas', 'criar'),
    ('vendas.atualizar', 'Atualizar Vendas', 'Permite editar pedidos de vendas existentes', 'vendas', 'atualizar'),
    ('vendas.cancelar', 'Cancelar Vendas', 'Permite cancelar pedidos e notas de vendas', 'vendas', 'cancelar'),

    -- Compras
    ('compras.ler', 'Visualizar Compras', 'Permite consultar pedidos e ordens de compra', 'compras', 'ler'),
    ('compras.criar', 'Criar Compras', 'Permite emitir novos pedidos de compra', 'compras', 'criar'),
    ('compras.atualizar', 'Atualizar Compras', 'Permite editar pedidos de compra', 'compras', 'atualizar'),
    ('compras.cancelar', 'Cancelar Compras', 'Permite cancelar ordens de compra', 'compras', 'cancelar'),

    -- Reparos
    ('reparos.ler', 'Visualizar Reparos', 'Permite consultar ordens de serviço e reparos', 'reparos', 'ler'),
    ('reparos.criar', 'Criar Reparos', 'Permite abrir novas ordens de serviço de reparo', 'reparos', 'criar'),
    ('reparos.atualizar', 'Atualizar Reparos', 'Permite atualizar laudos e status de reparos', 'reparos', 'atualizar'),
    ('reparos.finalizar', 'Finalizar Reparos', 'Permite concluir ordens de serviço e liberar garantia', 'reparos', 'finalizar'),

    -- PDV
    ('pdv.abrir', 'Abrir PDV', 'Permite realizar abertura de sessão no ponto de venda', 'pdv', 'abrir'),
    ('pdv.vender', 'Operar PDV', 'Permite registrar vendas rápidas no caixa/PDV', 'pdv', 'vender'),
    ('pdv.cancelar', 'Cancelar Item/Venda PDV', 'Permite estornar itens ou vendas no PDV', 'pdv', 'cancelar'),

    -- Financeiro
    ('financeiro.visualizar', 'Visualizar Financeiro', 'Permite consultar extratos, contas a pagar e receber', 'financeiro', 'visualizar'),
    ('financeiro.lancar', 'Lançar Financeiro', 'Permite incluir títulos e despesas financeiras', 'financeiro', 'lancar'),
    ('financeiro.editar', 'Editar Financeiro', 'Permite alterar baixas, títulos e categorias financeiras', 'financeiro', 'editar'),

    -- Relatórios
    ('relatorios.visualizar', 'Visualizar Relatórios', 'Permite consultar relatórios gerenciais e estatísticas', 'relatorios', 'visualizar'),

    -- Usuários & Permissões
    ('usuarios.ler', 'Visualizar Usuários', 'Permite listar os membros da empresa', 'usuarios', 'ler'),
    ('usuarios.criar', 'Adicionar Usuários', 'Permite convidar ou vincular novos membros à empresa', 'usuarios', 'criar'),
    ('usuarios.atualizar', 'Atualizar Usuários', 'Permite alterar perfil e funções dos usuários', 'usuarios', 'atualizar'),
    ('usuarios.suspender', 'Suspender Usuários', 'Permite suspender ou reativar vínculos de membros', 'usuarios', 'suspender'),
    ('usuarios.permissoes', 'Gerenciar Permissões', 'Permite alterar os papéis e permissões da equipe', 'usuarios', 'permissoes'),

    -- Empresa
    ('empresa.configurar', 'Configurar Empresa', 'Permite alterar dados cadastrais e parâmetros da empresa', 'empresa', 'configurar')
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    module = EXCLUDED.module,
    action = EXCLUDED.action;

-- 9.3 Link Role Permissions (Deterministic Mapping)

-- Helper DO block to populate standard role permissions
DO $$
DECLARE
    v_role_id UUID;
    v_perm_id UUID;
BEGIN
    -- 1. COMPANY_ADMIN: All permissions
    SELECT id INTO v_role_id FROM public.roles WHERE key = 'company_admin';
    FOR v_perm_id IN SELECT id FROM public.permissions LOOP
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;

    -- 2. MANAGER
    SELECT id INTO v_role_id FROM public.roles WHERE key = 'manager';
    FOR v_perm_id IN 
        SELECT id FROM public.permissions 
        WHERE module IN ('dashboard', 'clientes', 'fornecedores', 'produtos', 'estoque', 'vendas', 'compras', 'reparos', 'pdv', 'relatorios')
           OR key IN ('financeiro.visualizar', 'usuarios.ler')
    LOOP
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;

    -- 3. SELLER
    SELECT id INTO v_role_id FROM public.roles WHERE key = 'seller';
    FOR v_perm_id IN 
        SELECT id FROM public.permissions 
        WHERE key IN (
            'dashboard.visualizar',
            'clientes.ler', 'clientes.criar', 'clientes.atualizar',
            'produtos.ler',
            'estoque.visualizar',
            'vendas.ler', 'vendas.criar', 'vendas.atualizar',
            'pdv.abrir', 'pdv.vender',
            'reparos.ler', 'reparos.criar'
        )
    LOOP
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;

    -- 4. CASHIER
    SELECT id INTO v_role_id FROM public.roles WHERE key = 'cashier';
    FOR v_perm_id IN 
        SELECT id FROM public.permissions 
        WHERE key IN (
            'dashboard.visualizar',
            'clientes.ler', 'clientes.criar',
            'produtos.ler',
            'vendas.ler', 'vendas.criar',
            'pdv.abrir', 'pdv.vender', 'pdv.cancelar',
            'financeiro.visualizar', 'financeiro.lancar'
        )
    LOOP
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;

    -- 5. TECHNICIAN
    SELECT id INTO v_role_id FROM public.roles WHERE key = 'technician';
    FOR v_perm_id IN 
        SELECT id FROM public.permissions 
        WHERE key IN (
            'dashboard.visualizar',
            'clientes.ler',
            'produtos.ler',
            'estoque.visualizar',
            'reparos.ler', 'reparos.criar', 'reparos.atualizar', 'reparos.finalizar'
        )
    LOOP
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;

    -- 6. STOCK_MANAGER
    SELECT id INTO v_role_id FROM public.roles WHERE key = 'stock_manager';
    FOR v_perm_id IN 
        SELECT id FROM public.permissions 
        WHERE key IN (
            'dashboard.visualizar',
            'fornecedores.ler', 'fornecedores.criar', 'fornecedores.atualizar',
            'produtos.ler', 'produtos.criar', 'produtos.atualizar',
            'estoque.visualizar', 'estoque.ajustar', 'estoque.transferir',
            'compras.ler', 'compras.criar', 'compras.atualizar'
        )
    LOOP
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
END $$;
