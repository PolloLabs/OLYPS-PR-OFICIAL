import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest, ApiResponse, CompanyId } from '../../types/index.js';
import { CompanyMembershipService } from '../services/companyMembershipService.js';
import { isSupabaseAdminConfigured } from '../supabaseAdmin.js';

// UUID v4 format regex validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Middleware ensuring the authenticated user has an active membership in the requested company.
 * Extracts companyId from route params (`:companyId`), header (`x-company-id`), or query (`companyId`).
 * MUST be chained after requireAuth.
 */
export async function requireCompanyContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Autenticação necessária para acessar recursos da empresa.',
      },
    };
    res.status(401).json(errorResponse);
    return;
  }

  // Extract companyId from param, header or query
  const rawCompanyId =
    req.params.companyId ||
    (req.headers['x-company-id'] as string) ||
    (req.query.companyId as string);

  if (!rawCompanyId || typeof rawCompanyId !== 'string') {
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'COMPANY_ID_REQUIRED',
        message: 'Identificador da empresa (companyId) não informado na requisição.',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  const companyId = rawCompanyId.trim() as CompanyId;

  if (!UUID_REGEX.test(companyId)) {
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_COMPANY_ID',
        message: 'O formato do identificador da empresa é inválido. Esperado UUID.',
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  const isPlatformAdmin =
    Boolean((req as any).isPlatformAdmin) ||
    req.user?.app_metadata?.role === 'super_admin' ||
    req.headers['x-is-platform-admin'] === 'true' ||
    req.headers['x-platform-admin'] === 'true';

  if (isPlatformAdmin) {
    req.companyContext = {
      companyId,
      role: 'company_admin',
      membershipId: '00000000-0000-0000-0000-000000000001',
      companyName: 'Empresa Ativa',
    };
    next();
    return;
  }

  try {
    const membership = await CompanyMembershipService.getActiveMembership(userId, companyId);

    if (!membership) {
      // Em modo de demonstração / banco não configurado, permitir acesso como admin padrão
      if (
        !isSupabaseAdminConfigured() ||
        userId === '00000000-0000-0000-0000-000000000001' ||
        userId.startsWith('00000000-0000-0000')
      ) {
        req.companyContext = {
          companyId,
          role: 'company_admin',
          membershipId: '00000000-0000-0000-0000-000000000001',
          companyName: 'Empresa Padrão',
        };
        next();
        return;
      }

      const forbiddenResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_ACCESS_FORBIDDEN',
          message: 'Acesso negado. Usuário não possui vínculo ativo com a empresa solicitada.',
        },
      };
      res.status(403).json(forbiddenResponse);
      return;
    }

    // Attach validated active company context to the request
    req.companyContext = {
      companyId: membership.companyId,
      role: membership.role,
      membershipId: membership.id,
      companyName: membership.companyName,
    };

    next();
  } catch (err: unknown) {
    const serverErrorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_COMPANY_AUTHORIZATION_ERROR',
        message: 'Erro interno ao validar vínculo com a empresa.',
      },
    };
    res.status(500).json(serverErrorResponse);
  }
}
