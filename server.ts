import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { validateServerEnv } from './src/server/config/env.js';
import { isSupabaseAdminConfigured } from './src/server/supabaseAdmin.js';
import { requireAuth } from './src/server/middleware/authMiddleware.js';
import { requirePlatformAdmin } from './src/server/middleware/platformAdminMiddleware.js';
import { requireCompanyContext } from './src/server/middleware/companyContextMiddleware.js';
import { requirePermission } from './src/server/middleware/permissionMiddleware.js';
import { PlatformAdminService } from './src/server/services/platformAdminService.js';
import { CompanyMembershipService } from './src/server/services/companyMembershipService.js';
import { PermissionService } from './src/server/services/permissionService.js';
import { CompanyService } from './src/server/services/companyService.js';
import { SubscriptionPlanService } from './src/server/services/subscriptionPlanService.js';
import { SubscriptionService } from './src/server/services/subscriptionService.js';
import { CustomerGroupService } from './src/server/services/customerGroupService.js';
import { CustomerService } from './src/server/services/customerService.js';
import { SupplierService } from './src/server/services/supplierService.js';
import { ContactImportService } from './src/server/services/contactImportService.js';
import { CouponService } from './src/server/services/couponService.js';
import { AnnouncementService } from './src/server/services/announcementService.js';
import { NotificationService } from './src/server/services/notificationService.js';
import { ProductService } from './src/server/services/productService.js';
import { ProductImportService } from './src/server/services/productImportService.js';
import { RepairService } from './src/server/services/repairService.js';
import { RepairBrandService } from './src/server/services/repairBrandService.js';
import { PurchaseService } from './src/server/services/purchaseService.js';
import { SellService } from './src/server/services/sellService.js';
import { POSService } from './src/server/services/posService.js';
import { DraftService } from './src/server/services/draftService.js';
import { ContactService } from './src/server/services/contactService.js';
import type {
  SupabaseHealthStatus,
  ApiResponse,
  PlatformAdminStatus,
  PlatformDashboardSummary,
  PlatformCompanyDetails,
  CompanyRecord,
  CompanyStatus,
  AuthenticatedRequest,
  CompanySummary,
  ActiveCompanyContext,
  UserPermissionsPayload,
  PermissionCheckResult,
  CommercialLocation,
  CreateCompanyPayload,
  UpdateCompanyPayload,
  CreateLocationPayload,
  UpdateLocationPayload,
  SubscriptionPlan,
  SubscriptionRecord,
  PublicPlanCard,
  CompanySubscriptionSummary,
  PlanLimits,
  CreatePlanPayload,
  UpdatePlanPayload,
  CreateSubscriptionPayload,
  PlanStatus,
  SubscriptionStatus,
  SubscriptionQueryParams,
  CompanyUserMember,
  InviteCompanyUserPayload,
  UpdateCompanyUserRolePayload,
  UpdateCompanyUserStatusPayload,
  CompanyUsersListResponse,
  CompanyRole,
  MembershipStatus,
  CustomerGroup,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  Supplier,
  CreateSupplierPayload,
  UpdateSupplierPayload,
  ContactImportPreview,
  ContactImportPayload,
  ContactImportResult,
  ContactTargetType,
  Coupon,
  CreateCouponPayload,
  UpdateCouponPayload,
  CouponStatus,
  CouponDiscountType,
  CouponValidationResult,
  CouponUsageRecord,
  PaginatedResult,
  UUID,
  SortDirection,
  PlatformAnnouncement,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  PaginatedAnnouncementsResponse,
  Notification,
  PaginatedNotificationsResponse,
} from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


async function startServer() {
  const app = express();
  const PORT = 3000;

  // Validate server environment on boot (logs warnings if keys are missing, without exposing values)
  validateServerEnv();

  app.use(express.json());

  // Technical Health Check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Supabase Technical Connectivity Health Check endpoint
  app.get('/api/health/supabase', (req, res) => {
    const isConfigured = isSupabaseAdminConfigured();
    const response: SupabaseHealthStatus = {
      status: isConfigured ? 'ok' : 'unconfigured',
      service: 'supabase',
      timestamp: new Date().toISOString(),
      configured: isConfigured,
    };
    res.status(isConfigured ? 200 : 200).json(response);
  });

  // Technical Platform Super Admin Status endpoint (protected)
  app.get('/api/platform/admin-status', requireAuth, requirePlatformAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const response: ApiResponse<PlatformAdminStatus> = {
      success: true,
      data: {
        authorized: true,
        userId: authReq.userId,
        role: 'super_admin',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(200).json(response);
  });

  // Global Platform Super Admin Dashboard Metrics Summary
  app.get('/api/platform/dashboard/summary', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const summary = await PlatformAdminService.getDashboardSummary();
      const response: ApiResponse<PlatformDashboardSummary> = {
        success: true,
        data: summary,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'DASHBOARD_SUMMARY_ERROR',
          message: 'Erro interno ao consultar indicadores globais da plataforma.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Global Platform Super Admin: Paginated and filterable companies listing
  app.get('/api/platform/companies', requireAuth, requirePlatformAdmin, async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
    const sortByParam = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
    const sortDirParam = typeof req.query.sortDirection === 'string' ? req.query.sortDirection : undefined;

    const validStatuses: Array<CompanyStatus | 'all'> = ['active', 'inactive', 'suspended', 'pending', 'all'];
    const status = statusParam && validStatuses.includes(statusParam as CompanyStatus | 'all')
      ? (statusParam as CompanyStatus | 'all')
      : undefined;

    const validSortCols: Array<'name' | 'created_at' | 'status' | 'slug'> = ['name', 'created_at', 'status', 'slug'];
    const sortBy = sortByParam && validSortCols.includes(sortByParam as 'name' | 'created_at' | 'status' | 'slug')
      ? (sortByParam as 'name' | 'created_at' | 'status' | 'slug')
      : undefined;

    const sortDirection: SortDirection = sortDirParam === 'asc' ? 'asc' : 'desc';

    try {
      const result = await PlatformAdminService.listCompanies({
        page,
        pageSize,
        search,
        status,
        sortBy,
        sortDirection,
      });

      const response: ApiResponse<CompanyRecord[]> = {
        success: true,
        data: result.companies,
        meta: {
          pagination: result.pagination,
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANIES_FETCH_ERROR',
          message: 'Erro interno ao listar empresas da plataforma.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Global Platform Super Admin: Retrieve specific company details with member count
  app.get('/api/platform/companies/:companyId', requireAuth, requirePlatformAdmin, async (req, res) => {
    const companyId = req.params.companyId as UUID;

    if (!companyId || !UUID_REGEX.test(companyId)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_COMPANY_ID',
          message: 'Identificador de empresa inválido. Deve ser um UUID v4.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const companyDetails = await PlatformAdminService.getCompanyDetails(companyId);

      if (!companyDetails) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Empresa não encontrada na plataforma.',
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const response: ApiResponse<PlatformCompanyDetails> = {
        success: true,
        data: companyDetails,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_DETAILS_ERROR',
          message: 'Erro interno ao consultar detalhes da empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Global Platform Super Admin: Administratively update company status
  app.patch('/api/platform/companies/:companyId/status', requireAuth, requirePlatformAdmin, async (req, res) => {
    const companyId = req.params.companyId as UUID;

    if (!companyId || !UUID_REGEX.test(companyId)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_COMPANY_ID',
          message: 'Identificador de empresa inválido. Deve ser um UUID v4.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { status } = req.body as { status?: string };
    const validStatuses: CompanyStatus[] = ['active', 'inactive', 'suspended', 'pending'];

    if (!status || !validStatuses.includes(status as CompanyStatus)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Status inválido. Valores aceitos: ${validStatuses.join(', ')}.`,
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const updatedCompany = await PlatformAdminService.updateCompanyStatus(companyId, status as CompanyStatus);

      if (!updatedCompany) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Empresa não encontrada para atualização de status.',
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const response: ApiResponse<CompanyRecord> = {
        success: true,
        data: updatedCompany,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_STATUS_UPDATE_ERROR',
          message: 'Erro interno ao atualizar status da empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Global Platform Super Admin: Create new company
  app.post('/api/platform/companies', requireAuth, requirePlatformAdmin, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as CreateCompanyPayload;

    if (!body || !body.name || body.name.trim().length === 0) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'O nome da empresa é obrigatório.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const createdCompany = await CompanyService.createCompany(body, authReq.userId);

      if (!createdCompany) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COMPANY_CREATE_FAILED',
            message: 'Não foi possível cadastrar a empresa. Verifique os dados.',
          },
        };
        res.status(500).json(errorResponse);
        return;
      }

      const response: ApiResponse<CompanyRecord> = {
        success: true,
        data: createdCompany,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(201).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_CREATE_ERROR',
          message: 'Erro interno ao criar empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Global Platform Super Admin: Update full company details
  app.put('/api/platform/companies/:companyId', requireAuth, requirePlatformAdmin, async (req, res) => {
    const companyId = req.params.companyId as UUID;

    if (!companyId || !UUID_REGEX.test(companyId)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_COMPANY_ID',
          message: 'Identificador de empresa inválido. Deve ser um UUID v4.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    const body = req.body as UpdateCompanyPayload;

    try {
      const updatedCompany = await CompanyService.updateCompany(companyId, body);

      if (!updatedCompany) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COMPANY_UPDATE_FAILED',
            message: 'Não foi possível atualizar os dados da empresa.',
          },
        };
        res.status(500).json(errorResponse);
        return;
      }

      const response: ApiResponse<CompanyRecord> = {
        success: true,
        data: updatedCompany,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_UPDATE_ERROR',
          message: 'Erro interno ao atualizar empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Tenant / Company Config: Retrieve current company details
  app.get('/api/companies/:companyId', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId as UUID;

    try {
      const company = await CompanyService.getCompanyById(companyId);

      if (!company) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Empresa não encontrada.',
          },
        };
        res.status(404).json(errorResponse);
        return;
      }

      const response: ApiResponse<CompanyRecord> = {
        success: true,
        data: company,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_FETCH_ERROR',
          message: 'Erro ao consultar dados da empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Tenant / Company Config: Update current company master details
  app.put('/api/companies/:companyId', requireAuth, requireCompanyContext, requirePermission('empresa.configurar'), async (req, res) => {
    const companyId = req.params.companyId as UUID;
    const body = req.body as UpdateCompanyPayload;

    try {
      const updated = await CompanyService.updateCompany(companyId, body);

      if (!updated) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COMPANY_UPDATE_FAILED',
            message: 'Falha ao salvar dados da empresa.',
          },
        };
        res.status(500).json(errorResponse);
        return;
      }

      const response: ApiResponse<CompanyRecord> = {
        success: true,
        data: updated,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_UPDATE_ERROR',
          message: 'Erro interno ao salvar configurações da empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // ==============================================================================
  // COMMERCIAL LOCATIONS ENDPOINTS (03.5)
  // ==============================================================================

  // List all commercial locations for active company
  app.get('/api/companies/:companyId/locations', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId as UUID;

    try {
      const locations = await CompanyService.listLocations(companyId);
      const response: ApiResponse<CommercialLocation[]> = {
        success: true,
        data: locations,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'LOCATIONS_FETCH_ERROR',
          message: 'Erro ao listar locais comerciais.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Create a new commercial location
  app.post('/api/companies/:companyId/locations', requireAuth, requireCompanyContext, requirePermission('empresa.configurar'), async (req, res) => {
    const companyId = req.params.companyId as UUID;
    const body = req.body as CreateLocationPayload;

    if (!body || !body.name || body.name.trim().length === 0) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_LOCATION_NAME',
          message: 'O nome do local comercial é obrigatório.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const created = await CompanyService.createLocation(companyId, body);

      if (!created) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'LOCATION_CREATE_FAILED',
            message: 'Não foi possível cadastrar o local comercial.',
          },
        };
        res.status(500).json(errorResponse);
        return;
      }

      const response: ApiResponse<CommercialLocation> = {
        success: true,
        data: created,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(201).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'LOCATION_CREATE_ERROR',
          message: 'Erro interno ao cadastrar local comercial.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Update a commercial location
  app.put('/api/companies/:companyId/locations/:locationId', requireAuth, requireCompanyContext, requirePermission('empresa.configurar'), async (req, res) => {
    const companyId = req.params.companyId as UUID;
    const locationId = req.params.locationId as UUID;
    const body = req.body as UpdateLocationPayload;

    try {
      const updated = await CompanyService.updateLocation(companyId, locationId, body);

      if (!updated) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'LOCATION_UPDATE_FAILED',
            message: 'Não foi possível atualizar o local comercial.',
          },
        };
        res.status(500).json(errorResponse);
        return;
      }

      const response: ApiResponse<CommercialLocation> = {
        success: true,
        data: updated,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'LOCATION_UPDATE_ERROR',
          message: 'Erro interno ao atualizar local comercial.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Delete a commercial location
  app.delete('/api/companies/:companyId/locations/:locationId', requireAuth, requireCompanyContext, requirePermission('empresa.configurar'), async (req, res) => {
    const companyId = req.params.companyId as UUID;
    const locationId = req.params.locationId as UUID;

    try {
      const deleted = await CompanyService.deleteLocation(companyId, locationId);

      if (!deleted) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'LOCATION_DELETE_FAILED',
            message: 'Não foi possível excluir o local comercial.',
          },
        };
        res.status(500).json(errorResponse);
        return;
      }

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'LOCATION_DELETE_ERROR',
          message: 'Erro interno ao excluir local comercial.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });


  // Technical Endpoint: List all companies the authenticated user has active membership in
  app.get('/api/companies/my', requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    if (!userId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Autenticação necessária.',
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    try {
      const companies = await CompanyMembershipService.listUserCompanies(userId);
      const response: ApiResponse<CompanySummary[]> = {
        success: true,
        data: companies,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_FETCH_ERROR',
          message: 'Erro ao buscar empresas associadas ao usuário.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Technical Endpoint: Validate and retrieve active authorized context for a specific company
  app.get('/api/companies/:companyId/context', requireAuth, requireCompanyContext, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const response: ApiResponse<ActiveCompanyContext> = {
      success: true,
      data: authReq.companyContext,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(200).json(response);
  });

  // Technical Endpoint: List effective permissions for user within the active company context
  app.get('/api/companies/:companyId/permissions', requireAuth, requireCompanyContext, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const companyContext = authReq.companyContext;

    if (!userId || !companyContext) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'CONTEXT_MISSING',
          message: 'Contexto de autenticação e empresa ausente.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const permissions = await PermissionService.getUserPermissions(userId, companyContext.companyId);
      const response: ApiResponse<UserPermissionsPayload> = {
        success: true,
        data: {
          companyId: companyContext.companyId,
          companyName: companyContext.companyName,
          role: companyContext.role,
          permissions,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PERMISSIONS_FETCH_ERROR',
          message: 'Erro ao consultar catálogo de permissões do usuário.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // Technical Endpoint: Check a specific granular permission for the user in the company context
  app.get('/api/companies/:companyId/permissions/check/:permission', requireAuth, requireCompanyContext, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const companyContext = authReq.companyContext;
    const permissionKey = req.params.permission;

    if (!userId || !companyContext || !permissionKey) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Parâmetros de permissão incompletos.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const isGranted = await PermissionService.hasPermission(userId, companyContext.companyId, permissionKey);

      if (!isGranted) {
        const forbiddenResponse: ApiResponse = {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Acesso negado. O papel "${companyContext.role}" não possui a permissão "${permissionKey}".`,
          },
        };
        res.status(403).json(forbiddenResponse);
        return;
      }

      const response: ApiResponse<PermissionCheckResult> = {
        success: true,
        data: {
          authorized: true,
          permission: permissionKey,
          companyId: companyContext.companyId,
          role: companyContext.role,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PERMISSION_CHECK_ERROR',
          message: 'Erro interno ao validar permissão específica.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // ==============================================================================
  // FASE 05.1: GESTÃO DE USUÁRIOS DA EMPRESA (MEMBROS, RBAC E CONTROLE DE LIMITES)
  // ==============================================================================

  // 1. List users of the current company (with active subscription max_users quota metadata)
  app.get('/api/companies/:companyId/users', requireAuth, requireCompanyContext, requirePermission('usuarios.ler'), async (req, res) => {
    const companyId = req.params.companyId as UUID;
    const { search, role, status } = req.query as { search?: string; role?: string; status?: string };

    try {
      const result = await CompanyMembershipService.listCompanyUsers(companyId, { search, role, status });
      const response: ApiResponse<CompanyUsersListResponse> = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: unknown) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'USERS_FETCH_ERROR',
          message: err instanceof Error ? err.message : 'Erro ao consultar lista de usuários da empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 2. Invite/Add a new user to the company (strictly enforcing active subscription max_users limit)
  app.post('/api/companies/:companyId/users', requireAuth, requireCompanyContext, requirePermission('usuarios.criar'), async (req, res) => {
    const companyId = req.params.companyId as UUID;
    const body = req.body as InviteCompanyUserPayload;

    if (!body || !body.email) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'O e-mail do colaborador é obrigatório.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await CompanyMembershipService.addCompanyUser(companyId, body);

      if (!result.success || !result.data) {
        const isQuotaError = result.error?.includes('Limite de usuários atingido');
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: isQuotaError ? 'USER_LIMIT_EXCEEDED' : 'USER_ADD_FAILED',
            message: result.error || 'Não foi possível adicionar o usuário.',
          },
        };
        res.status(isQuotaError ? 403 : 400).json(errorResponse);
        return;
      }

      const response: ApiResponse<CompanyUserMember> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(201).json(response);
    } catch (err: unknown) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'USER_ADD_ERROR',
          message: err instanceof Error ? err.message : 'Erro interno ao adicionar colaborador.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 3. Update user role in the company
  app.patch('/api/companies/:companyId/users/:userId/role', requireAuth, requireCompanyContext, requirePermission('usuarios.permissoes'), async (req, res) => {
    const companyId = req.params.companyId as UUID;
    const userId = req.params.userId as UUID;
    const body = req.body as UpdateCompanyUserRolePayload;

    if (!body || !body.role) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'O novo papel do usuário é obrigatório.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await CompanyMembershipService.updateUserRole(companyId, userId, body.role);

      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'USER_ROLE_UPDATE_FAILED',
            message: result.error || 'Falha ao atualizar papel do usuário.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<CompanyUserMember> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: unknown) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'USER_ROLE_UPDATE_ERROR',
          message: err instanceof Error ? err.message : 'Erro interno ao atualizar papel.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 4. Update user status (activate / suspend) in the company (with max_users check on activation)
  app.patch('/api/companies/:companyId/users/:userId/status', requireAuth, requireCompanyContext, requirePermission('usuarios.suspender'), async (req, res) => {
    const companyId = req.params.companyId as UUID;
    const userId = req.params.userId as UUID;
    const body = req.body as UpdateCompanyUserStatusPayload;

    if (!body || !body.status) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'O novo status do usuário é obrigatório.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await CompanyMembershipService.updateUserStatus(companyId, userId, body.status);

      if (!result.success || !result.data) {
        const isQuotaError = result.error?.includes('limite');
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: isQuotaError ? 'USER_LIMIT_EXCEEDED' : 'USER_STATUS_UPDATE_FAILED',
            message: result.error || 'Falha ao atualizar status do usuário.',
          },
        };
        res.status(isQuotaError ? 403 : 400).json(errorResponse);
        return;
      }

      const response: ApiResponse<CompanyUserMember> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: unknown) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'USER_STATUS_UPDATE_ERROR',
          message: err instanceof Error ? err.message : 'Erro interno ao atualizar status.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // ==============================================================================
  // ETAPA 04: ASSINATURAS E PACOTES — ENDPOINTS PÚBLICOS E ADMINISTRATIVOS
  // ==============================================================================

  // 1. Public Endpoint: Commercial Plans for Landing Page Cards (No auth required)
  app.get('/api/public/plans', async (req, res) => {
    try {
      const publicPlans = await SubscriptionPlanService.getPublicPlans();
      const response: ApiResponse<PublicPlanCard[]> = {
        success: true,
        data: publicPlans,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PUBLIC_PLANS_FETCH_ERROR',
          message: 'Erro ao consultar catálogo comercial público de planos.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 2. Super Admin: List all subscription plans (active, inactive, archived)
  app.get('/api/platform/subscription-plans', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
      const searchParam = typeof req.query.search === 'string' ? req.query.search : undefined;

      const validStatuses: Array<PlanStatus | 'all'> = ['active', 'inactive', 'archived', 'all'];
      const status = statusParam && validStatuses.includes(statusParam as PlanStatus | 'all')
        ? (statusParam as PlanStatus | 'all')
        : 'all';

      const plans = await SubscriptionPlanService.listPlans({ status, search: searchParam });
      const response: ApiResponse<SubscriptionPlan[]> = {
        success: true,
        data: plans,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PLANS_LIST_ERROR',
          message: 'Erro interno ao listar planos de assinatura.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 3. Super Admin: Get single subscription plan by ID
  app.get('/api/platform/subscription-plans/:planId', requireAuth, requirePlatformAdmin, async (req, res) => {
    const planId = req.params.planId;
    if (!planId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do plano não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const plan = await SubscriptionPlanService.getPlanById(planId);
      if (!plan) {
        const notFoundResponse: ApiResponse = {
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Plano não encontrado.',
          },
        };
        res.status(404).json(notFoundResponse);
        return;
      }

      const response: ApiResponse<SubscriptionPlan> = {
        success: true,
        data: plan,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PLAN_FETCH_ERROR',
          message: 'Erro ao consultar detalhes do plano.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 4. Super Admin: Create a new subscription plan
  app.post('/api/platform/subscription-plans', requireAuth, requirePlatformAdmin, async (req, res) => {
    const body = req.body as CreatePlanPayload;
    if (!body || !body.name || !body.code) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Nome e código do plano são obrigatórios.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await SubscriptionPlanService.createPlan(body);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'PLAN_CREATION_FAILED',
            message: result.error || 'Erro ao cadastrar novo plano.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<SubscriptionPlan> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(201).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PLAN_CREATION_ERROR',
          message: 'Erro interno ao criar plano.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 5. Super Admin: Update an existing subscription plan
  app.put('/api/platform/subscription-plans/:planId', requireAuth, requirePlatformAdmin, async (req, res) => {
    const planId = req.params.planId;
    const body = req.body as UpdatePlanPayload;

    if (!planId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do plano não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await SubscriptionPlanService.updatePlan(planId, body);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'PLAN_UPDATE_FAILED',
            message: result.error || 'Erro ao atualizar plano.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<SubscriptionPlan> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PLAN_UPDATE_ERROR',
          message: 'Erro interno ao atualizar plano.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 6. Super Admin: Update subscription plan status (active / inactive / archived)
  app.patch('/api/platform/subscription-plans/:planId/status', requireAuth, requirePlatformAdmin, async (req, res) => {
    const planId = req.params.planId;
    const { status } = req.body as { status: PlanStatus };

    if (!planId || !status) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'ID do plano e novo status são obrigatórios.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await SubscriptionPlanService.updatePlanStatus(planId, status);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'STATUS_UPDATE_FAILED',
            message: result.error || 'Falha ao alterar status do plano.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<SubscriptionPlan> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'STATUS_UPDATE_ERROR',
          message: 'Erro interno ao alterar status do plano.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 7. Super Admin: List subscriptions with filtering and pagination
  app.get('/api/platform/subscriptions', requireAuth, requirePlatformAdmin, async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
    const companyId = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
    const planId = typeof req.query.planId === 'string' ? req.query.planId : undefined;
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;

    const validStatuses: Array<SubscriptionStatus | 'all'> = ['pending', 'active', 'expired', 'suspended', 'cancelled', 'all'];
    const status = statusParam && validStatuses.includes(statusParam as SubscriptionStatus | 'all')
      ? (statusParam as SubscriptionStatus | 'all')
      : 'all';

    try {
      const result = await SubscriptionService.listSubscriptions({
        companyId,
        planId,
        status,
        page,
        pageSize,
      });

      const response: ApiResponse<{
        subscriptions: SubscriptionRecord[];
        pagination: typeof result.pagination;
      }> = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'SUBSCRIPTIONS_LIST_ERROR',
          message: 'Erro interno ao consultar lista de assinaturas.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 8. Super Admin: Get single subscription by ID
  app.get('/api/platform/subscriptions/:subscriptionId', requireAuth, requirePlatformAdmin, async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    if (!subscriptionId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID da assinatura não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const sub = await SubscriptionService.getSubscriptionById(subscriptionId);
      if (!sub) {
        const notFoundResponse: ApiResponse = {
          success: false,
          error: {
            code: 'SUBSCRIPTION_NOT_FOUND',
            message: 'Assinatura não encontrada.',
          },
        };
        res.status(404).json(notFoundResponse);
        return;
      }

      const response: ApiResponse<SubscriptionRecord> = {
        success: true,
        data: sub,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'SUBSCRIPTION_FETCH_ERROR',
          message: 'Erro ao consultar detalhes da assinatura.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 9. Super Admin: Create a new subscription for a company
  app.post('/api/platform/subscriptions', requireAuth, requirePlatformAdmin, async (req, res) => {
    const body = req.body as CreateSubscriptionPayload;
    if (!body || !body.companyId || !body.planId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Empresa (companyId) e Plano (planId) são obrigatórios.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await SubscriptionService.createSubscription(body);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'SUBSCRIPTION_CREATION_FAILED',
            message: result.error || 'Erro ao registrar assinatura.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<SubscriptionRecord> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(201).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'SUBSCRIPTION_CREATION_ERROR',
          message: 'Erro interno ao criar assinatura.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 10. Super Admin: Activate a pending subscription (Server calculates started_at and expires_at)
  app.patch('/api/platform/subscriptions/:subscriptionId/activate', requireAuth, requirePlatformAdmin, async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const { notes } = req.body as { notes?: string };

    if (!subscriptionId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID da assinatura não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await SubscriptionService.activateSubscription(subscriptionId, notes);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'ACTIVATION_FAILED',
            message: result.error || 'Falha ao ativar assinatura.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<SubscriptionRecord> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ACTIVATION_ERROR',
          message: 'Erro interno ao ativar assinatura no servidor.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 11. Super Admin: Suspend a subscription
  app.patch('/api/platform/subscriptions/:subscriptionId/suspend', requireAuth, requirePlatformAdmin, async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const { reason, notes } = req.body as { reason?: string; notes?: string };

    if (!subscriptionId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID da assinatura não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await SubscriptionService.suspendSubscription(subscriptionId, reason, notes);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'SUSPENSION_FAILED',
            message: result.error || 'Falha ao suspender assinatura.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<SubscriptionRecord> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'SUSPENSION_ERROR',
          message: 'Erro interno ao suspender assinatura.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 12. Super Admin: Cancel a subscription
  app.patch('/api/platform/subscriptions/:subscriptionId/cancel', requireAuth, requirePlatformAdmin, async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const { reason, notes } = req.body as { reason?: string; notes?: string };

    if (!subscriptionId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID da assinatura não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await SubscriptionService.cancelSubscription(subscriptionId, reason, notes);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'CANCELLATION_FAILED',
            message: result.error || 'Falha ao cancelar assinatura.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<SubscriptionRecord> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'CANCELLATION_ERROR',
          message: 'Erro interno ao cancelar assinatura.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 13. Tenant / Company Consultation: View current subscription, vigência, features and limits
  app.get('/api/companies/:companyId/subscription', requireAuth, requireCompanyContext, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const companyContext = authReq.companyContext;
    const targetCompanyId = req.params.companyId;

    if (!companyContext || companyContext.companyId !== targetCompanyId) {
      // Platform Admin exception check
      const isSuperAdmin = await PlatformAdminService.isPlatformAdmin(authReq.userId);
      if (!isSuperAdmin) {
        const forbiddenResponse: ApiResponse = {
          success: false,
          error: {
            code: 'FORBIDDEN_COMPANY_ACCESS',
            message: 'Acesso negado. Você só pode consultar a assinatura da sua própria empresa.',
          },
        };
        res.status(403).json(forbiddenResponse);
        return;
      }
    }

    try {
      const summary = await SubscriptionService.getCompanySubscription(targetCompanyId);
      const response: ApiResponse<CompanySubscriptionSummary> = {
        success: true,
        data: summary,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_SUBSCRIPTION_ERROR',
          message: 'Erro interno ao consultar dados da assinatura da empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 14. Tenant / Operational Limits Check: View structured quotas (max_users, max_locations, etc.)
  app.get('/api/companies/:companyId/subscription/limits', requireAuth, requireCompanyContext, async (req, res) => {
    const targetCompanyId = req.params.companyId;
    try {
      const limits = await SubscriptionService.getSubscriptionLimits(targetCompanyId);
      const response: ApiResponse<PlanLimits> = {
        success: true,
        data: limits,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'LIMITS_FETCH_ERROR',
          message: 'Erro ao consultar limites operacionais da empresa.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // ==============================================================================
  // MÓDULO 05 — REPARAR & ORDENS DE SERVIÇO
  // ==============================================================================

  // List job sheets with filters
  app.get('/api/companies/:companyId/repairs', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const { status, priority, brand, deviceType, search } = req.query;
      const items = await RepairService.listJobSheets(companyId, {
        status: status as string,
        priority: priority as string,
        brand: brand as string,
        deviceType: deviceType as string,
        search: search as string,
      });
      res.status(200).json({ success: true, data: items });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao listar ordens de serviço' } });
    }
  });

  // Buscar marcas sincronizadas (Produtos + Reparar)
  app.get(['/api/companies/:companyId/repair/brands', '/api/companies/:companyId/repairs/brands'], requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const brands = await RepairBrandService.getBrands(companyId);
      res.status(200).json({ success: true, data: brands });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err?.message || 'Erro ao buscar marcas sincronizadas' } });
    }
  });

  // Criar marca (sincroniza com Produtos)
  app.post(['/api/companies/:companyId/repair/brands', '/api/companies/:companyId/repairs/brands'], requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const brand = await RepairBrandService.createBrand(companyId, req.body);
      res.status(201).json({ success: true, data: brand });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err?.message || 'Erro ao criar marca' } });
    }
  });

  // Atualizar marca
  app.patch(['/api/companies/:companyId/repair/brands/:id', '/api/companies/:companyId/repairs/brands/:id'], requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const updated = await RepairBrandService.updateBrand(companyId, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err?.message || 'Erro ao atualizar marca' } });
    }
  });

  // Excluir marca (apenas se não for sincronizada de Produtos)
  app.delete(['/api/companies/:companyId/repair/brands/:id', '/api/companies/:companyId/repairs/brands/:id'], requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await RepairBrandService.deleteBrand(companyId, id);
      res.status(200).json({ success: true, message: 'Marca excluída com sucesso' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err?.message || 'Erro ao excluir marca' } });
    }
  });

  // Analytics summary for repair dashboard
  app.get('/api/companies/:companyId/repairs/analytics', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const [summary, brandTrends, deviceTrends, modelTrends] = await Promise.all([
        RepairService.getAnalyticsSummary(companyId),
        RepairService.getBrandTrends(companyId),
        RepairService.getDeviceTrends(companyId),
        RepairService.getModelTrends(companyId),
      ]);
      res.status(200).json({
        success: true,
        data: { summary, brandTrends, deviceTrends, modelTrends },
      });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao obter métricas de reparos' } });
    }
  });

  // Create job sheet
  app.post('/api/companies/:companyId/repairs', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const created = await RepairService.createJobSheet(companyId, req.body);
      res.status(201).json({ success: true, data: created });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao criar ordem de serviço' } });
    }
  });

  // Update job sheet
  app.patch('/api/companies/:companyId/repairs/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const updated = await RepairService.updateJobSheet(companyId, id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: { message: 'Ordem de serviço não encontrada' } });
        return;
      }
      res.status(200).json({ success: true, data: updated });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao atualizar ordem de serviço' } });
    }
  });

  // Delete job sheet
  app.delete('/api/companies/:companyId/repairs/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const success = await RepairService.deleteJobSheet(companyId, id);
      res.status(200).json({ success });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao excluir ordem de serviço' } });
    }
  });

  // ------------------------------------------------------------------------------
  // REPAIR SETTINGS (STATUSES, DEVICE MODELS, GENERAL, LABEL)
  // ------------------------------------------------------------------------------

  // Get complete repair settings bundle
  app.get('/api/companies/:companyId/repair-settings', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getCompleteSettings(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao obter configurações do módulo de reparo' } });
    }
  });

  // Statuses
  app.get('/api/companies/:companyId/repair-settings/statuses', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getRepairStatuses(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao listar status de reparo' } });
    }
  });

  app.post('/api/companies/:companyId/repair-settings/statuses', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.createRepairStatus(companyId, req.body);
      res.status(201).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao criar status de reparo' } });
    }
  });

  app.patch('/api/companies/:companyId/repair-settings/statuses/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const data = await RepairService.updateRepairStatus(companyId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao atualizar status de reparo' } });
    }
  });

  app.put('/api/companies/:companyId/repair-settings/statuses/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const data = await RepairService.updateRepairStatus(companyId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao atualizar status de reparo' } });
    }
  });

  app.delete('/api/companies/:companyId/repair-settings/statuses/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await RepairService.deleteRepairStatus(companyId, id);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao remover status de reparo' } });
    }
  });

  // Device Models
  app.get('/api/companies/:companyId/repair-settings/device-models', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getDeviceModels(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao listar modelos de dispositivos' } });
    }
  });

  app.post('/api/companies/:companyId/repair-settings/device-models', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.createDeviceModel(companyId, req.body);
      res.status(201).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao criar modelo de dispositivo' } });
    }
  });

  app.patch('/api/companies/:companyId/repair-settings/device-models/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const data = await RepairService.updateDeviceModel(companyId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao atualizar modelo de dispositivo' } });
    }
  });

  app.put('/api/companies/:companyId/repair-settings/device-models/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const data = await RepairService.updateDeviceModel(companyId, id, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao atualizar modelo de dispositivo' } });
    }
  });

  app.delete('/api/companies/:companyId/repair-settings/device-models/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await RepairService.deleteDeviceModel(companyId, id);
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao excluir modelo de dispositivo' } });
    }
  });

  // General Settings
  app.get('/api/companies/:companyId/repair-settings/general', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getRepairSettings(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao obter configurações gerais de reparo' } });
    }
  });

  app.patch('/api/companies/:companyId/repair-settings/general', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.updateRepairSettings(companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao salvar configurações gerais de reparo' } });
    }
  });

  app.put('/api/companies/:companyId/repair-settings/general', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.updateRepairSettings(companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao salvar configurações gerais de reparo' } });
    }
  });

  // Label Settings
  app.get('/api/companies/:companyId/repair-settings/label', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.getLabelSettings(companyId);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao obter configurações de etiqueta' } });
    }
  });

  app.patch('/api/companies/:companyId/repair-settings/label', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.updateLabelSettings(companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao salvar configurações de etiqueta' } });
    }
  });

  app.put('/api/companies/:companyId/repair-settings/label', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = req.params.companyId;
    try {
      const data = await RepairService.updateLabelSettings(companyId, req.body);
      res.status(200).json({ success: true, data });
    } catch {
      res.status(500).json({ success: false, error: { message: 'Erro ao salvar configurações de etiqueta' } });
    }
  });

  // ==============================================================================
  // ETAPA 05.3: CUPONS E DESCONTOS (SUPER ADMIN & VALIDAÇÃO PÚBLICA)
  // ==============================================================================

  // 1. Super Admin: List all coupons with search, status, and pagination
  app.get('/api/platform/coupons', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
      const discountTypeParam = typeof req.query.discountType === 'string' ? req.query.discountType : undefined;

      const validStatuses: Array<CouponStatus | 'all'> = ['active', 'inactive', 'all'];
      const status = statusParam && validStatuses.includes(statusParam as CouponStatus | 'all')
        ? (statusParam as CouponStatus | 'all')
        : 'all';

      const validDiscountTypes: Array<CouponDiscountType | 'all'> = ['percentage', 'fixed_amount', 'all'];
      const discountType = discountTypeParam && validDiscountTypes.includes(discountTypeParam as CouponDiscountType | 'all')
        ? (discountTypeParam as CouponDiscountType | 'all')
        : 'all';

      const result = await CouponService.listCoupons({
        search,
        status,
        discountType,
        page,
        pageSize,
      });

      const response: ApiResponse<{
        coupons: Coupon[];
        pagination: typeof result.pagination;
      }> = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COUPONS_LIST_ERROR',
          message: 'Erro interno ao consultar lista de cupons promocionais.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 2. Super Admin: Get single coupon by ID
  app.get('/api/platform/coupons/:couponId', requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId as UUID;
    if (!couponId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do cupom não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const coupon = await CouponService.getCouponById(couponId);
      if (!coupon) {
        const notFoundResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COUPON_NOT_FOUND',
            message: 'Cupom de desconto não encontrado.',
          },
        };
        res.status(404).json(notFoundResponse);
        return;
      }

      const response: ApiResponse<Coupon> = {
        success: true,
        data: coupon,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COUPON_FETCH_ERROR',
          message: 'Erro ao consultar detalhes do cupom.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 3. Super Admin: Create a new promotional coupon
  app.post('/api/platform/coupons', requireAuth, requirePlatformAdmin, async (req, res) => {
    const body = req.body as CreateCouponPayload;
    if (!body || !body.code || !body.discountType || body.discountValue === undefined) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Código, tipo de desconto e valor do desconto são obrigatórios.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await CouponService.createCoupon(body);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COUPON_CREATE_FAILED',
            message: result.error || 'Erro ao cadastrar cupom de desconto.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<Coupon> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(201).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COUPON_CREATE_ERROR',
          message: 'Erro interno ao salvar novo cupom no servidor.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 4. Super Admin: Update an existing coupon
  app.put('/api/platform/coupons/:couponId', requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId as UUID;
    const body = req.body as UpdateCouponPayload;

    if (!couponId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do cupom não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await CouponService.updateCoupon(couponId, body);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COUPON_UPDATE_FAILED',
            message: result.error || 'Erro ao atualizar dados do cupom.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<Coupon> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COUPON_UPDATE_ERROR',
          message: 'Erro interno ao atualizar cupom.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 5. Super Admin: Toggle or change coupon status (active / inactive)
  app.patch('/api/platform/coupons/:couponId/status', requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId as UUID;
    const { status } = req.body as { status: CouponStatus };

    if (!couponId || !status || !['active', 'inactive'].includes(status)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'ID do cupom e status válido (active/inactive) são obrigatórios.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await CouponService.updateCouponStatus(couponId, status);
      if (!result.success || !result.data) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'STATUS_UPDATE_FAILED',
            message: result.error || 'Falha ao alterar status do cupom.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<Coupon> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'STATUS_UPDATE_ERROR',
          message: 'Erro interno ao alterar status do cupom.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 6. Super Admin: Soft delete coupon
  app.delete('/api/platform/coupons/:couponId', requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId as UUID;
    if (!couponId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do cupom não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const result = await CouponService.deleteCoupon(couponId);
      if (!result.success) {
        const errorResponse: ApiResponse = {
          success: false,
          error: {
            code: 'COUPON_DELETE_FAILED',
            message: result.error || 'Falha ao excluir cupom.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COUPON_DELETE_ERROR',
          message: 'Erro interno ao remover cupom.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 7. Super Admin: List redemption history / usages of a coupon
  app.get('/api/platform/coupons/:couponId/usages', requireAuth, requirePlatformAdmin, async (req, res) => {
    const couponId = req.params.couponId as UUID;
    try {
      const usages = await CouponService.listCouponUsages(couponId);
      const response: ApiResponse<CouponUsageRecord[]> = {
        success: true,
        data: usages,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COUPON_USAGES_ERROR',
          message: 'Erro ao consultar histórico de utilizações do cupom.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 8. Public / Tenant Endpoint: Validate Coupon Code against a Commercial Plan
  // Computes original price, discount amount, and final price without altering base catalog price
  app.post('/api/public/coupons/validate', async (req, res) => {
    const { code, planId, companyId } = req.body as { code?: string; planId?: UUID; companyId?: UUID };

    if (!code || !planId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Código do cupom e ID do plano são obrigatórios para validação.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const validation = await CouponService.validateCoupon(code, planId, companyId);
      const response: ApiResponse<CouponValidationResult> = {
        success: true,
        data: validation,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COUPON_VALIDATION_ERROR',
          message: 'Erro interno ao validar cupom de desconto.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 9. Platform Admin Endpoint: Validate Coupon
  app.post('/api/platform/coupons/validate', requireAuth, requirePlatformAdmin, async (req, res) => {
    const { code, planId, companyId } = req.body as { code?: string; planId?: UUID; companyId?: UUID };

    if (!code || !planId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Código do cupom e ID do plano são obrigatórios.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const validation = await CouponService.validateCoupon(code, planId, companyId);
      const response: ApiResponse<CouponValidationResult> = {
        success: true,
        data: validation,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COUPON_VALIDATION_ERROR',
          message: 'Erro ao validar cupom.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // ==============================================================================
  // ETAPA 05.4: COMUNICADOS DA PLATAFORMA (SUPER ADMIN)
  // ==============================================================================

  // 1. Super Admin: List all announcements with search, filters, and pagination
  app.get('/api/platform/announcements', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const type = typeof req.query.type === 'string' ? (req.query.type as any) : undefined;
      const priority = typeof req.query.priority === 'string' ? (req.query.priority as any) : undefined;
      const targetAudience = typeof req.query.targetAudience === 'string' ? (req.query.targetAudience as any) : undefined;
      const isPublished = req.query.isPublished !== undefined
        ? (req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : 'all')
        : undefined;
      const activeOnly = req.query.activeOnly === 'true';
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
      const sortDirection = req.query.sortDirection === 'asc' ? 'asc' : req.query.sortDirection === 'desc' ? 'desc' : undefined;

      const result = await AnnouncementService.getAnnouncements({
        search,
        type,
        priority,
        targetAudience,
        isPublished,
        activeOnly,
        page,
        pageSize,
        sortBy,
        sortDirection,
      });

      const response: ApiResponse<PaginatedAnnouncementsResponse> = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ANNOUNCEMENTS_LIST_ERROR',
          message: err.message || 'Erro ao listar comunicados.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 2. Super Admin: Get single announcement by ID
  app.get('/api/platform/announcements/:id', requireAuth, requirePlatformAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do comunicado não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const announcement = await AnnouncementService.getAnnouncementById(id);
      if (!announcement) {
        const notFoundResponse: ApiResponse = {
          success: false,
          error: {
            code: 'ANNOUNCEMENT_NOT_FOUND',
            message: 'Comunicado não encontrado.',
          },
        };
        res.status(404).json(notFoundResponse);
        return;
      }

      const response: ApiResponse<PlatformAnnouncement> = {
        success: true,
        data: announcement,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ANNOUNCEMENT_FETCH_ERROR',
          message: err.message || 'Erro ao buscar detalhes do comunicado.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 3. Super Admin: Create a new announcement
  app.post('/api/platform/announcements', requireAuth, requirePlatformAdmin, async (req, res) => {
    const body = req.body as CreateAnnouncementInput;
    const authReq = req as AuthenticatedRequest;

    if (!body || !body.title || !body.title.trim() || !body.message || !body.message.trim()) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Título e mensagem do comunicado são obrigatórios.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const created = await AnnouncementService.createAnnouncement(body, authReq.userId);
      const response: ApiResponse<PlatformAnnouncement> = {
        success: true,
        data: created,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(201).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ANNOUNCEMENT_CREATE_ERROR',
          message: err.message || 'Erro ao criar comunicado.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 4. Super Admin: Update an existing announcement
  app.put('/api/platform/announcements/:id', requireAuth, requirePlatformAdmin, async (req, res) => {
    const { id } = req.params;
    const body = req.body as UpdateAnnouncementInput;

    if (!id) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do comunicado não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const updated = await AnnouncementService.updateAnnouncement(id, body);
      const response: ApiResponse<PlatformAnnouncement> = {
        success: true,
        data: updated,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ANNOUNCEMENT_UPDATE_ERROR',
          message: err.message || 'Erro ao atualizar comunicado.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 5. Super Admin: Publish or unpublish announcement status
  app.patch('/api/platform/announcements/:id/status', requireAuth, requirePlatformAdmin, async (req, res) => {
    const { id } = req.params;
    const { isPublished } = req.body as { isPublished?: boolean };

    if (!id || typeof isPublished !== 'boolean') {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'ID do comunicado e status de publicação (isPublished boolean) são obrigatórios.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const updated = isPublished
        ? await AnnouncementService.publishAnnouncement(id)
        : await AnnouncementService.unpublishAnnouncement(id);

      const response: ApiResponse<PlatformAnnouncement> = {
        success: true,
        data: updated,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'STATUS_UPDATE_ERROR',
          message: err.message || 'Erro ao alterar status de publicação do comunicado.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 6. Super Admin: Delete announcement
  app.delete('/api/platform/announcements/:id', requireAuth, requirePlatformAdmin, async (req, res) => {
    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do comunicado não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      await AnnouncementService.deleteAnnouncement(id);
      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'ANNOUNCEMENT_DELETE_ERROR',
          message: err.message || 'Erro ao excluir comunicado.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // ==============================================================================
  // ETAPA 05.4: NOTIFICAÇÕES DO USUÁRIO (/api/notifications)
  // ==============================================================================

  // 1. User: List notifications with search, filters, and pagination
  app.get('/api/notifications', requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const category = typeof req.query.category === 'string' ? (req.query.category as any) : undefined;
      const priority = typeof req.query.priority === 'string' ? (req.query.priority as any) : undefined;
      const companyId = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
      const isRead = req.query.isRead !== undefined
        ? (req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : 'all')
        : undefined;

      const result = await NotificationService.getUserNotifications(authReq.userId, {
        search,
        category,
        priority,
        companyId,
        isRead,
        page,
        pageSize,
      });

      const response: ApiResponse<PaginatedNotificationsResponse> = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'NOTIFICATIONS_LIST_ERROR',
          message: err.message || 'Erro ao listar notificações.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 2. User: Get unread notification count
  app.get('/api/notifications/unread-count', requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const unreadCount = await NotificationService.getUnreadCount(authReq.userId);
      const response: ApiResponse<{ unreadCount: number }> = {
        success: true,
        data: { unreadCount },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'NOTIFICATIONS_COUNT_ERROR',
          message: err.message || 'Erro ao obter contagem de notificações não lidas.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // 3. User: Mark single notification as read
  app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    if (!id) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID da notificação não fornecido.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const updated = await NotificationService.markAsRead(id, authReq.userId);
      const response: ApiResponse<Notification> = {
        success: true,
        data: updated,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const isNotFound = err.message?.includes('não encontrada') || err.message?.includes('não pertence');
      const statusCode = isNotFound ? 404 : 500;
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: isNotFound ? 'NOTIFICATION_NOT_FOUND' : 'NOTIFICATION_READ_ERROR',
          message: err.message || 'Erro ao marcar notificação como lida.',
        },
      };
      res.status(statusCode).json(errorResponse);
    }
  });

  // 4. User: Mark all notifications as read
  app.patch('/api/notifications/read-all', requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const count = await NotificationService.markAllAsRead(authReq.userId);
      const response: ApiResponse<{ count: number; markedAll: boolean }> = {
        success: true,
        data: { count, markedAll: true },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
    } catch (err: any) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'NOTIFICATIONS_READ_ALL_ERROR',
          message: err.message || 'Erro ao marcar todas as notificações como lidas.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  // ==============================================================================
  // 15. Contatos: Grupos de Clientes (/api/companies/:companyId/customer-groups)
  // ==============================================================================
  app.get(
    '/api/companies/:companyId/customer-groups',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.ler'),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const groups = await ContactService.listCustomerGroups(companyId);
        const response: ApiResponse<CustomerGroup[]> = {
          success: true,
          data: groups,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
        res.status(200).json(response);
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CUSTOMER_GROUPS_FETCH_ERROR',
            message: err.message || 'Erro ao listar grupos de clientes.',
          },
        });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/customer-groups',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.criar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body as CreateCustomerGroupPayload;
      try {
        const created = await ContactService.createCustomerGroup(companyId, payload);
        const response: ApiResponse<CustomerGroup> = {
          success: true,
          data: created,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
        res.status(201).json(response);
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CUSTOMER_GROUP_CREATE_ERROR',
            message: err.message || 'Erro ao criar grupo de clientes.',
          },
        });
      }
    }
  );

  app.get(
    '/api/companies/:companyId/customer-groups/:groupId',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.ler'),
    async (req, res) => {
      const { companyId, groupId } = req.params;
      try {
        const group = await ContactService.getCustomerGroupById(companyId, groupId);
        if (!group) {
          res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Grupo de clientes não encontrado.',
            },
          });
          return;
        }
        res.status(200).json({
          success: true,
          data: group,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CUSTOMER_GROUP_FETCH_ERROR',
            message: err.message || 'Erro ao buscar grupo de clientes.',
          },
        });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/customer-groups/:groupId',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.atualizar'),
    async (req, res) => {
      const { companyId, groupId } = req.params;
      const payload = req.body as UpdateCustomerGroupPayload;
      try {
        const updated = await ContactService.updateCustomerGroup(companyId, groupId, payload);
        res.status(200).json({
          success: true,
          data: updated,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CUSTOMER_GROUP_UPDATE_ERROR',
            message: err.message || 'Erro ao atualizar grupo de clientes.',
          },
        });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/customer-groups/:groupId',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.excluir'),
    async (req, res) => {
      const { companyId, groupId } = req.params;
      try {
        await ContactService.deleteCustomerGroup(companyId, groupId);
        res.status(200).json({
          success: true,
          data: { message: 'Grupo de clientes excluído com sucesso.' },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CUSTOMER_GROUP_DELETE_ERROR',
            message: err.message || 'Erro ao excluir grupo de clientes.',
          },
        });
      }
    }
  );

  // Shorthand customer-groups endpoints (context resolution from header/query)
  app.get('/api/customer-groups', requireAuth, async (req, res) => {
    const companyId =
      (req.headers['x-company-id'] as string) ||
      (req.query.companyId as string) ||
      '550e8400-e29b-41d4-a716-446655440001';
    try {
      const groups = await ContactService.listCustomerGroups(companyId);
      res.status(200).json({
        success: true,
        data: groups,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: err.message || 'Erro ao buscar grupos.' },
      });
    }
  });

  app.post('/api/customer-groups', requireAuth, async (req, res) => {
    const companyId =
      (req.headers['x-company-id'] as string) ||
      (req.query.companyId as string) ||
      '550e8400-e29b-41d4-a716-446655440001';
    try {
      const created = await ContactService.createCustomerGroup(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: err.message || 'Erro ao criar grupo.' },
      });
    }
  });

  // ==============================================================================
  // 16. Contatos: Clientes (/api/companies/:companyId/customers)
  // ==============================================================================
  app.get(
    '/api/companies/:companyId/customers',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.ler'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = (req.query.search as string) || undefined;
      const status = (req.query.status as any) || undefined;
      const personType = (req.query.personType as any) || undefined;
      const groupId = (req.query.customerGroupId as string) || (req.query.groupId as string) || undefined;

      try {
        const result = await ContactService.listCustomers(companyId, {
          page,
          pageSize,
          search,
          status,
          personType,
          customerGroupId: groupId,
        });

        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            ...result.meta,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CUSTOMERS_FETCH_ERROR',
            message: err.message || 'Erro ao listar clientes.',
          },
        });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/customers',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.criar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body as CreateCustomerPayload;
      try {
        const created = await ContactService.createCustomer(companyId, payload);
        res.status(201).json({
          success: true,
          data: created,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CUSTOMER_CREATE_ERROR',
            message: err.message || 'Erro ao criar cliente.',
          },
        });
      }
    }
  );

  app.get(
    '/api/companies/:companyId/customers/:customerId',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.ler'),
    async (req, res) => {
      const { companyId, customerId } = req.params;
      try {
        const customer = await ContactService.getCustomerById(companyId, customerId);
        if (!customer) {
          res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Cliente não encontrado.',
            },
          });
          return;
        }
        res.status(200).json({
          success: true,
          data: customer,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CUSTOMER_FETCH_ERROR',
            message: err.message || 'Erro ao buscar dados do cliente.',
          },
        });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/customers/:customerId',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.atualizar'),
    async (req, res) => {
      const { companyId, customerId } = req.params;
      const payload = req.body as UpdateCustomerPayload;
      try {
        const updated = await ContactService.updateCustomer(companyId, customerId, payload);
        res.status(200).json({
          success: true,
          data: updated,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CUSTOMER_UPDATE_ERROR',
            message: err.message || 'Erro ao atualizar cliente.',
          },
        });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/customers/:customerId',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.excluir'),
    async (req, res) => {
      const { companyId, customerId } = req.params;
      try {
        await ContactService.deleteCustomer(companyId, customerId);
        res.status(200).json({
          success: true,
          data: { message: 'Cliente excluído com sucesso.' },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'CUSTOMER_DELETE_ERROR',
            message: err.message || 'Erro ao excluir cliente.',
          },
        });
      }
    }
  );

  // Shorthand customers endpoints
  app.get('/api/customers', requireAuth, async (req, res) => {
    const companyId =
      (req.headers['x-company-id'] as string) ||
      (req.query.companyId as string) ||
      '550e8400-e29b-41d4-a716-446655440001';
    try {
      const result = await ContactService.listCustomers(companyId, req.query as any);
      res.status(200).json({
        success: true,
        data: result.data,
        meta: { ...result.meta, timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: err.message || 'Erro ao buscar clientes.' },
      });
    }
  });

  app.post('/api/customers', requireAuth, async (req, res) => {
    const companyId =
      (req.headers['x-company-id'] as string) ||
      (req.query.companyId as string) ||
      '550e8400-e29b-41d4-a716-446655440001';
    try {
      const created = await ContactService.createCustomer(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: err.message || 'Erro ao criar cliente.' },
      });
    }
  });

  // ==============================================================================
  // 17. Contatos: Fornecedores (/api/companies/:companyId/suppliers)
  // ==============================================================================
  app.get(
    '/api/companies/:companyId/suppliers',
    requireAuth,
    requireCompanyContext,
    requirePermission('fornecedores.ler'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = (req.query.search as string) || undefined;
      const status = (req.query.status as any) || undefined;
      const personType = (req.query.personType as any) || undefined;
      const category = (req.query.category as string) || undefined;

      try {
        const result = await ContactService.listSuppliers(companyId, {
          page,
          pageSize,
          search,
          status,
          personType,
          category,
        });

        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            ...result.meta,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'SUPPLIERS_FETCH_ERROR',
            message: err.message || 'Erro ao listar fornecedores.',
          },
        });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/suppliers',
    requireAuth,
    requireCompanyContext,
    requirePermission('fornecedores.criar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body as CreateSupplierPayload;
      try {
        const created = await ContactService.createSupplier(companyId, payload);
        res.status(201).json({
          success: true,
          data: created,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SUPPLIER_CREATE_ERROR',
            message: err.message || 'Erro ao criar fornecedor.',
          },
        });
      }
    }
  );

  app.get(
    '/api/companies/:companyId/suppliers/:supplierId',
    requireAuth,
    requireCompanyContext,
    requirePermission('fornecedores.ler'),
    async (req, res) => {
      const { companyId, supplierId } = req.params;
      try {
        const supplier = await ContactService.getSupplierById(companyId, supplierId);
        if (!supplier) {
          res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Fornecedor não encontrado.',
            },
          });
          return;
        }
        res.status(200).json({
          success: true,
          data: supplier,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'SUPPLIER_FETCH_ERROR',
            message: err.message || 'Erro ao buscar dados do fornecedor.',
          },
        });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/suppliers/:supplierId',
    requireAuth,
    requireCompanyContext,
    requirePermission('fornecedores.atualizar'),
    async (req, res) => {
      const { companyId, supplierId } = req.params;
      const payload = req.body as UpdateSupplierPayload;
      try {
        const updated = await ContactService.updateSupplier(companyId, supplierId, payload);
        res.status(200).json({
          success: true,
          data: updated,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SUPPLIER_UPDATE_ERROR',
            message: err.message || 'Erro ao atualizar fornecedor.',
          },
        });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/suppliers/:supplierId',
    requireAuth,
    requireCompanyContext,
    requirePermission('fornecedores.excluir'),
    async (req, res) => {
      const { companyId, supplierId } = req.params;
      try {
        await ContactService.deleteSupplier(companyId, supplierId);
        res.status(200).json({
          success: true,
          data: { message: 'Fornecedor excluído com sucesso.' },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'SUPPLIER_DELETE_ERROR',
            message: err.message || 'Erro ao excluir fornecedor.',
          },
        });
      }
    }
  );

  // Shorthand suppliers endpoints
  app.get('/api/suppliers', requireAuth, async (req, res) => {
    const companyId =
      (req.headers['x-company-id'] as string) ||
      (req.query.companyId as string) ||
      '550e8400-e29b-41d4-a716-446655440001';
    try {
      const result = await ContactService.listSuppliers(companyId, req.query as any);
      res.status(200).json({
        success: true,
        data: result.data,
        meta: { ...result.meta, timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FETCH_ERROR', message: err.message || 'Erro ao buscar fornecedores.' },
      });
    }
  });

  app.post('/api/suppliers', requireAuth, async (req, res) => {
    const companyId =
      (req.headers['x-company-id'] as string) ||
      (req.query.companyId as string) ||
      '550e8400-e29b-41d4-a716-446655440001';
    try {
      const created = await ContactService.createSupplier(companyId, req.body);
      res.status(201).json({
        success: true,
        data: created,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: err.message || 'Erro ao criar fornecedor.' },
      });
    }
  });

  // ==============================================================================
  // 18. Contatos: Importação em Lote (/api/companies/:companyId/contacts/import)
  // ==============================================================================
  app.post(
    '/api/companies/:companyId/contacts/import/preview',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.criar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const { targetType, rows } = req.body as {
        targetType: ContactTargetType;
        rows: Array<Record<string, any>>;
      };

      if (!targetType || !Array.isArray(rows)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_IMPORT_PAYLOAD',
            message: 'Tipo de destino (targetType) e lista de linhas (rows) são obrigatórios.',
          },
        });
        return;
      }

      try {
        const preview = await ContactImportService.generatePreview(companyId, targetType, rows);
        res.status(200).json({
          success: true,
          data: preview,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'IMPORT_PREVIEW_ERROR',
            message: err.message || 'Erro ao gerar prévia de importação.',
          },
        });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/contacts/import/confirm',
    requireAuth,
    requireCompanyContext,
    requirePermission('clientes.criar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body as ContactImportPayload;

      if (!payload || !payload.targetType || !Array.isArray(payload.items)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONFIRM_PAYLOAD',
            message: 'Payload inválido para confirmação de importação.',
          },
        });
        return;
      }

      try {
        const result = await ContactImportService.executeImport(companyId, payload);
        res.status(200).json({
          success: true,
          data: result,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'IMPORT_EXECUTE_ERROR',
            message: err.message || 'Erro ao processar importação.',
          },
        });
      }
    }
  );

  // ==============================================================================
  // FASE 06 - PRODUTOS & CATÁLOGO API ENDPOINTS
  // ==============================================================================

  // 0. Import Products Preview & Execute
  app.post(
    '/api/companies/:companyId/products/import/preview',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const { headers, rows } = req.body as {
        headers: string[];
        rows: string[][];
      };

      if (!Array.isArray(headers) || !Array.isArray(rows)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRODUCT_IMPORT_PAYLOAD',
            message: 'Cabeçalhos (headers) e linhas (rows) são obrigatórios no payload.',
          },
        });
        return;
      }

      try {
        const preview = await ProductImportService.generatePreview(companyId, headers, rows);
        res.status(200).json({
          success: true,
          data: preview,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'PRODUCT_IMPORT_PREVIEW_ERROR',
            message: err.message || 'Erro ao validar planilha de produtos.',
          },
        });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/products/import/confirm',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      const payload = req.body;

      if (!payload || !Array.isArray(payload.items)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRODUCT_CONFIRM_PAYLOAD',
            message: 'Lista de produtos validados (items) é obrigatória para confirmação.',
          },
        });
        return;
      }

      try {
        const result = await ProductImportService.executeImport(companyId, payload);
        res.status(200).json({
          success: true,
          data: result,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'PRODUCT_IMPORT_EXECUTE_ERROR',
            message: err.message || 'Erro ao executar importação de produtos.',
          },
        });
      }
    }
  );

  // 1. List Products
  app.get(
    '/api/companies/:companyId/products',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const result = await ProductService.listProducts(companyId, req.query as any);
        res.status(200).json({
          success: true,
          data: result.data,
          meta: result.meta,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: { code: 'LIST_PRODUCTS_ERROR', message: err.message || 'Erro ao listar produtos.' },
        });
      }
    }
  );

  // 1b. Get Next Sequential SKU for Company (Multi-tenant isolated)
  app.get(
    '/api/companies/:companyId/products/next-sku',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const nextSku = await ProductService.getNextSku(companyId);
        res.status(200).json({
          success: true,
          data: { nextSku },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: { code: 'GET_NEXT_SKU_ERROR', message: err.message || 'Erro ao gerar próximo SKU.' },
        });
      }
    }
  );

  // 2. Get Single Product
  app.get(
    '/api/companies/:companyId/products/:productId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const product = await ProductService.getProductById(companyId, productId);
        if (!product) {
          res.status(404).json({
            success: false,
            error: { code: 'PRODUCT_NOT_FOUND', message: 'Produto não encontrado.' },
          });
          return;
        }
        res.status(200).json({ success: true, data: product });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: { code: 'GET_PRODUCT_ERROR', message: err.message || 'Erro ao obter produto.' },
        });
      }
    }
  );

  // 3. Create Product
  app.post(
    '/api/companies/:companyId/products',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const newProduct = await ProductService.createProduct(companyId, req.body);
        res.status(201).json({ success: true, data: newProduct });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: { code: 'CREATE_PRODUCT_ERROR', message: err.message || 'Erro ao criar produto.' },
        });
      }
    }
  );

  // 4. Update Product
  app.put(
    '/api/companies/:companyId/products/:productId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const updated = await ProductService.updateProduct(companyId, productId, req.body);
        res.status(200).json({ success: true, data: updated });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: { code: 'UPDATE_PRODUCT_ERROR', message: err.message || 'Erro ao atualizar produto.' },
        });
      }
    }
  );

  // 5. Delete Product
  app.delete(
    '/api/companies/:companyId/products/:productId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const success = await ProductService.deleteProduct(companyId, productId);
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: { code: 'DELETE_PRODUCT_ERROR', message: err.message || 'Erro ao excluir produto.' },
        });
      }
    }
  );

  // 6. Duplicate Product
  app.post(
    '/api/companies/:companyId/products/:productId/duplicate',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const copy = await ProductService.duplicateProduct(companyId, productId);
        res.status(201).json({ success: true, data: copy });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_PRODUCT_ERROR', message: err.message || 'Erro ao duplicar produto.' },
        });
      }
    }
  );

  // 7. Stock Opening
  app.post(
    '/api/companies/:companyId/products/:productId/stock-opening',
    requireAuth,
    requireCompanyContext,
    requirePermission('estoque.ajustar'),
    async (req, res) => {
      const { companyId, productId } = req.params;
      try {
        const result = await ProductService.saveStockOpening(companyId, productId, req.body);
        res.status(200).json({ success: result });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: { code: 'STOCK_OPENING_ERROR', message: err.message || 'Erro ao registrar estoque inicial.' },
        });
      }
    }
  );

  // 8. Batch Action
  app.post(
    '/api/companies/:companyId/products/batch',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      const companyId = req.params.companyId;
      try {
        const result = await ProductService.batchAction(companyId, req.body);
        res.status(200).json({ success: true, data: result });
      } catch (err: any) {
        res.status(400).json({
          success: false,
          error: { code: 'BATCH_PRODUCT_ERROR', message: err.message || 'Erro na ação em lote.' },
        });
      }
    }
  );

  // 9. Categories Endpoints
  app.get(
    '/api/companies/:companyId/categories',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const categories = await ProductService.listCategories(req.params.companyId);
        res.status(200).json({ success: true, data: categories });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/categories',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const cat = await ProductService.createCategory(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: cat });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/categories/:categoryId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      try {
        const cat = await ProductService.updateCategory(req.params.companyId, req.params.categoryId, req.body);
        res.status(200).json({ success: true, data: cat });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/categories/:categoryId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      try {
        const success = await ProductService.deleteCategory(req.params.companyId, req.params.categoryId);
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // 10. Brands Endpoints
  app.get(
    '/api/companies/:companyId/brands',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const brands = await ProductService.listBrands(req.params.companyId);
        res.status(200).json({ success: true, data: brands });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/brands',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const brand = await ProductService.createBrand(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: brand });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/brands/:brandId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      try {
        const brand = await ProductService.updateBrand(req.params.companyId, req.params.brandId, req.body);
        res.status(200).json({ success: true, data: brand });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/brands/:brandId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      try {
        const success = await ProductService.deleteBrand(req.params.companyId, req.params.brandId);
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // 11. Units Endpoints
  app.get(
    '/api/companies/:companyId/units',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const units = await ProductService.listUnits(req.params.companyId);
        res.status(200).json({ success: true, data: units });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/units',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const unit = await ProductService.createUnit(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: unit });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/units/:unitId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      try {
        const unit = await ProductService.updateUnit(req.params.companyId, req.params.unitId, req.body);
        res.status(200).json({ success: true, data: unit });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/units/:unitId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      try {
        const success = await ProductService.deleteUnit(req.params.companyId, req.params.unitId);
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // 11.1. Variation Templates Endpoints (Grade / Variações)
  app.get(
    ['/api/companies/:companyId/variation-templates', '/api/companies/:companyId/variations'],
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const list = await ProductService.listVariationTemplates(req.params.companyId);
        res.status(200).json({ success: true, data: list });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    ['/api/companies/:companyId/variation-templates', '/api/companies/:companyId/variations'],
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const item = await ProductService.createVariationTemplate(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: item });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.put(
    ['/api/companies/:companyId/variation-templates/:id', '/api/companies/:companyId/variations/:id'],
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      try {
        const item = await ProductService.updateVariationTemplate(
          req.params.companyId,
          req.params.id,
          req.body
        );
        res.status(200).json({ success: true, data: item });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.delete(
    ['/api/companies/:companyId/variation-templates/:id', '/api/companies/:companyId/variations/:id'],
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      try {
        const success = await ProductService.deleteVariationTemplate(
          req.params.companyId,
          req.params.id
        );
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // 11.2. Warranties Endpoints (Garantias de Produtos)
  app.get(
    ['/api/companies/:companyId/warranties', '/api/companies/:companyId/garantias'],
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const list = await ProductService.listWarranties(req.params.companyId);
        res.status(200).json({ success: true, data: list });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    ['/api/companies/:companyId/warranties', '/api/companies/:companyId/garantias'],
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const item = await ProductService.createWarranty(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: item });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.put(
    ['/api/companies/:companyId/warranties/:id', '/api/companies/:companyId/garantias/:id'],
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      try {
        const item = await ProductService.updateWarranty(
          req.params.companyId,
          req.params.id,
          req.body
        );
        res.status(200).json({ success: true, data: item });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.delete(
    ['/api/companies/:companyId/warranties/:id', '/api/companies/:companyId/garantias/:id'],
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      try {
        const success = await ProductService.deleteWarranty(
          req.params.companyId,
          req.params.id
        );
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // 12. Device Brands & Models Endpoints
  app.get(
    '/api/companies/:companyId/device-brands',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const brands = await ProductService.listDeviceBrands(req.params.companyId);
        res.status(200).json({ success: true, data: brands });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.get(
    '/api/companies/:companyId/device-models',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const brandId = req.query.brandId as string | undefined;
        const models = await ProductService.listDeviceModels(req.params.companyId, brandId);
        res.status(200).json({ success: true, data: models });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/device-models',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const model = await ProductService.createDeviceModel(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: model });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // 13. Catalog Models Endpoints (Reutilizáveis do Catálogo)
  app.get(
    '/api/companies/:companyId/models',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const brandId = req.query.brandId as string | undefined;
        const models = await ProductService.listModels(req.params.companyId, brandId);
        res.status(200).json({ success: true, data: models });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/models',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const model = await ProductService.createModel(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: model });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/models/:modelId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      try {
        const model = await ProductService.updateModel(req.params.companyId, req.params.modelId, req.body);
        res.status(200).json({ success: true, data: model });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/models/:modelId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      try {
        const success = await ProductService.deleteModel(req.params.companyId, req.params.modelId);
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // 14. Catalog Colors Endpoints (Reutilizáveis do Catálogo)
  app.get(
    '/api/companies/:companyId/colors',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const colors = await ProductService.listColors(req.params.companyId);
        res.status(200).json({ success: true, data: colors });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/colors',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const color = await ProductService.createColor(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: color });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/colors/:colorId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      try {
        const color = await ProductService.updateColor(req.params.companyId, req.params.colorId, req.body);
        res.status(200).json({ success: true, data: color });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/colors/:colorId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      try {
        const success = await ProductService.deleteColor(req.params.companyId, req.params.colorId);
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // 15. Catalog Sizes Endpoints (Reutilizáveis do Catálogo)
  app.get(
    '/api/companies/:companyId/sizes',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.ler'),
    async (req, res) => {
      try {
        const sizes = await ProductService.listSizes(req.params.companyId);
        res.status(200).json({ success: true, data: sizes });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.post(
    '/api/companies/:companyId/sizes',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.criar'),
    async (req, res) => {
      try {
        const size = await ProductService.createSize(req.params.companyId, req.body);
        res.status(201).json({ success: true, data: size });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.put(
    '/api/companies/:companyId/sizes/:sizeId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.atualizar'),
    async (req, res) => {
      try {
        const size = await ProductService.updateSize(req.params.companyId, req.params.sizeId, req.body);
        res.status(200).json({ success: true, data: size });
      } catch (err: any) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    }
  );

  app.delete(
    '/api/companies/:companyId/sizes/:sizeId',
    requireAuth,
    requireCompanyContext,
    requirePermission('produtos.excluir'),
    async (req, res) => {
      try {
        const success = await ProductService.deleteSize(req.params.companyId, req.params.sizeId);
        res.status(200).json({ success });
      } catch (err: any) {
        res.status(500).json({ success: false, error: { message: err.message } });
      }
    }
  );

  // ============================================
  // PURCHASES ENDPOINTS (Compras)
  // ============================================
  app.get('/api/companies/:companyId/purchases', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const purchases = await PurchaseService.getPurchases(companyId);
      res.status(200).json({ success: true, data: purchases });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar compras.' } });
    }
  });

  app.get('/api/purchases', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = (req as any).companyId || (req.query.companyId as string) || (req.headers['x-company-id'] as string) || '550e8400-e29b-41d4-a716-446655440001';
    try {
      const purchases = await PurchaseService.getPurchases(companyId);
      res.status(200).json({ success: true, data: purchases });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar compras.' } });
    }
  });

  app.get('/api/companies/:companyId/purchases/:purchaseId', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, purchaseId } = req.params;
    try {
      const purchase = await PurchaseService.getPurchaseById(companyId, purchaseId);
      res.status(200).json({ success: true, data: purchase });
    } catch (err: any) {
      res.status(404).json({ success: false, error: { message: err.message || 'Compra não encontrada.' } });
    }
  });

  app.post('/api/companies/:companyId/purchases', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const purchase = await PurchaseService.createPurchase(companyId, req.body);
      res.status(201).json({ success: true, data: purchase });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao criar compra.' } });
    }
  });

  app.post('/api/purchases', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = (req as any).companyId || req.body.companyId || (req.headers['x-company-id'] as string) || '550e8400-e29b-41d4-a716-446655440001';
    try {
      const purchase = await PurchaseService.createPurchase(companyId, req.body);
      res.status(201).json({ success: true, data: purchase });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao criar compra.' } });
    }
  });

  app.put('/api/companies/:companyId/purchases/:purchaseId', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, purchaseId } = req.params;
    try {
      const updated = await PurchaseService.updatePurchase(companyId, purchaseId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao atualizar compra.' } });
    }
  });

  app.delete('/api/companies/:companyId/purchases/:purchaseId', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, purchaseId } = req.params;
    try {
      await PurchaseService.deletePurchase(companyId, purchaseId);
      res.status(200).json({ success: true, message: 'Compra excluída com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao excluir compra.' } });
    }
  });

  // ============================================
  // PURCHASE RETURNS ENDPOINTS (Devoluções)
  // ============================================
  app.get('/api/companies/:companyId/purchase-returns', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const returns = await PurchaseService.getPurchaseReturns(companyId);
      res.status(200).json({ success: true, data: returns });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar devoluções.' } });
    }
  });

  app.get('/api/purchase-returns', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = (req as any).companyId || (req.query.companyId as string) || (req.headers['x-company-id'] as string) || '550e8400-e29b-41d4-a716-446655440001';
    try {
      const returns = await PurchaseService.getPurchaseReturns(companyId);
      res.status(200).json({ success: true, data: returns });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar devoluções.' } });
    }
  });

  app.post('/api/companies/:companyId/purchase-returns', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const returnRecord = await PurchaseService.createPurchaseReturn(companyId, req.body);
      res.status(201).json({ success: true, data: returnRecord });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao registrar devolução.' } });
    }
  });

  app.delete('/api/companies/:companyId/purchase-returns/:returnId', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, returnId } = req.params;
    try {
      await PurchaseService.deletePurchaseReturn(companyId, returnId);
      res.status(200).json({ success: true, message: 'Devolução excluída com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao excluir devolução.' } });
    }
  });

  // ============================================
  // SELLS ENDPOINTS (Vendas)
  // ============================================
  app.get('/api/companies/:companyId/sells', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const sells = await SellService.getSells(companyId);
      res.status(200).json({ success: true, data: sells });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar vendas.' } });
    }
  });

  app.get('/api/sells', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = (req as any).companyId || (req.query.companyId as string) || (req.headers['x-company-id'] as string) || '550e8400-e29b-41d4-a716-446655440001';
    try {
      const sells = await SellService.getSells(companyId);
      res.status(200).json({ success: true, data: sells });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar vendas.' } });
    }
  });

  app.get('/api/companies/:companyId/sells/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const sell = await SellService.getSellById(companyId, id);
      if (!sell) {
        return res.status(404).json({ success: false, error: { message: 'Venda não encontrada.' } });
      }
      res.status(200).json({ success: true, data: sell });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar detalhes da venda.' } });
    }
  });

  app.post('/api/companies/:companyId/sells', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const sell = await SellService.createSell(companyId, req.body);
      res.status(201).json({ success: true, data: sell });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao registrar venda.' } });
    }
  });

  app.post('/api/sells', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = (req as any).companyId || req.body.companyId || (req.headers['x-company-id'] as string) || '550e8400-e29b-41d4-a716-446655440001';
    try {
      const sell = await SellService.createSell(companyId, req.body);
      res.status(201).json({ success: true, data: sell });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao registrar venda.' } });
    }
  });

  app.patch('/api/companies/:companyId/sells/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const updated = await SellService.updateSell(companyId, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao atualizar venda.' } });
    }
  });

  app.delete('/api/companies/:companyId/sells/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await SellService.deleteSell(companyId, id);
      res.status(200).json({ success: true, message: 'Venda excluída com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao excluir venda.' } });
    }
  });

  // ============================================
  // POS ENDPOINTS (Ponto de Venda)
  // ============================================
  app.get('/api/companies/:companyId/pos', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const records = await POSService.getPOSRecords(companyId);
      res.status(200).json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar registros de POS.' } });
    }
  });

  app.get('/api/pos', requireAuth, requireCompanyContext, async (req, res) => {
    const companyId = (req as any).companyId || (req.query.companyId as string) || (req.headers['x-company-id'] as string) || '550e8400-e29b-41d4-a716-446655440001';
    try {
      const records = await POSService.getPOSRecords(companyId);
      res.status(200).json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar registros de POS.' } });
    }
  });

  app.get('/api/companies/:companyId/pos/products', requireAuth, requireCompanyContext, async (req, res) => {
    try {
      const products = await POSService.getCatalogProducts();
      res.status(200).json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar catálogo do POS.' } });
    }
  });

  app.get('/api/companies/:companyId/pos/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const record = await POSService.getPOSById(companyId, id);
      if (!record) {
        return res.status(404).json({ success: false, error: { message: 'Registro de POS não encontrado.' } });
      }
      res.status(200).json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar detalhes do POS.' } });
    }
  });

  app.post(['/api/companies/:companyId/pos', '/api/companies/:companyId/pdv'], async (req, res) => {
    const { companyId } = req.params;
    try {
      const record = await POSService.createPOSRecord(companyId, req.body);
      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao registrar venda no POS.' } });
    }
  });

  app.post(['/api/pos', '/api/pdv'], async (req, res) => {
    const companyId = (req as any).companyId || req.body.companyId || (req.headers['x-company-id'] as string) || '550e8400-e29b-41d4-a716-446655440001';
    try {
      const record = await POSService.createPOSRecord(companyId, req.body);
      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao registrar venda no POS.' } });
    }
  });

  app.delete('/api/companies/:companyId/pos/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      await POSService.deletePOSRecord(companyId, id);
      res.status(200).json({ success: true, message: 'Registro de POS excluído com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao excluir registro de POS.' } });
    }
  });

  // Endpoints de Configurações de Fatura e PIX
  const invoiceSettingsStore = new Map<string, any>();
  const defaultInvoiceSettings = {
    pixKey: 'financeiro@techstore.com.br',
    pixKeyType: 'email',
    merchantName: 'TechStore Brasil Matriz',
    merchantCity: 'SAO PAULO',
    bankName: 'Banco Itaú',
    bankCode: '341',
    agency: '0452',
    account: '98765-4',
    accountType: 'corrente',
    soundEnabled: true,
  };

  app.get('/api/companies/:companyId/invoice-settings', async (req, res) => {
    const { companyId } = req.params;
    const settings = invoiceSettingsStore.get(companyId) || defaultInvoiceSettings;
    res.status(200).json({ success: true, data: settings, ...settings });
  });

  app.post('/api/companies/:companyId/invoice-settings', async (req, res) => {
    const { companyId } = req.params;
    const current = invoiceSettingsStore.get(companyId) || defaultInvoiceSettings;
    const updated = { ...current, ...req.body };
    invoiceSettingsStore.set(companyId, updated);
    res.status(200).json({ success: true, data: updated, ...updated });
  });

  app.get('/api/companies/:companyId/pix-config', async (req, res) => {
    const { companyId } = req.params;
    const settings = invoiceSettingsStore.get(companyId) || defaultInvoiceSettings;
    res.status(200).json({
      success: true,
      pixKey: settings.pixKey,
      merchantName: settings.merchantName,
      merchantCity: settings.merchantCity,
      pixKeyType: settings.pixKeyType,
    });
  });

  app.post('/api/companies/:companyId/pos/expense', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const expense = await POSService.createExpense(companyId, req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao lançar despesa no POS.' } });
    }
  });

  // Endpoints gerais de despesas (/api/companies/:companyId/expenses)
  app.get('/api/companies/:companyId/expenses', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const expenses = await POSService.getExpenses(companyId);
      res.status(200).json({ success: true, data: expenses });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar despesas.' } });
    }
  });

  app.post('/api/companies/:companyId/expenses', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const expense = await POSService.createExpense(companyId, req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao registrar despesa.' } });
    }
  });

  // Endpoints de Cotações do POS (/api/companies/:companyId/sells/quotes)
  app.get('/api/companies/:companyId/sells/quotes', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const quotes = await POSService.getQuotes(companyId);
      res.status(200).json({ success: true, data: quotes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar cotações.' } });
    }
  });

  app.post('/api/companies/:companyId/sells/quotes', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const quote = await POSService.createQuote(companyId, req.body);
      res.status(201).json({ success: true, data: quote });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao registrar cotação.' } });
    }
  });

  // Endpoints de Caixa do POS (/api/companies/:companyId/cash-register)
  app.get('/api/companies/:companyId/cash-register', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const register = await POSService.getCashRegister(companyId);
      res.status(200).json({ success: true, data: register });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar status da gaveta/caixa.' } });
    }
  });

  app.post('/api/companies/:companyId/cash-register', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const register = await POSService.updateCashRegister(companyId, req.body);
      res.status(200).json({ success: true, data: register });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao atualizar dados do caixa.' } });
    }
  });

  // Endpoints de Alertas do POS (/api/companies/:companyId/pos/alerts)
  app.get('/api/companies/:companyId/pos/alerts', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const alerts = await POSService.getAlerts(companyId);
      res.status(200).json({ success: true, data: alerts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar alertas do POS.' } });
    }
  });

  // ============================================
  // DRAFTS ENDPOINTS (Rascunhos de Venda)
  // ============================================
  app.get('/api/companies/:companyId/sells/drafts', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const drafts = await DraftService.getDrafts(companyId);
      res.status(200).json({ success: true, data: drafts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message || 'Erro ao buscar rascunhos.' } });
    }
  });

  app.post('/api/companies/:companyId/sells/drafts', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId } = req.params;
    try {
      const draft = await DraftService.createDraft(companyId, req.body);
      res.status(201).json({ success: true, data: draft });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao criar rascunho.' } });
    }
  });

  app.patch('/api/companies/:companyId/sells/drafts/:id', requireAuth, requireCompanyContext, async (req, res) => {
    const { companyId, id } = req.params;
    try {
      const updated = await DraftService.updateDraft(companyId, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message || 'Erro ao atualizar rascunho.' } });
    }
  });

  // ============================================
  // PDV / POS REDIRECTS (Acesso Direto e Retrocompatibilidade)
  // ============================================
  app.get(['/pos', '/pos/create', '/pdv', '/pdv/create'], (req, res) => {
    res.redirect('/#/pdv/create');
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OLYPS PRO server running on port ${PORT}`);
  });
}

startServer();
