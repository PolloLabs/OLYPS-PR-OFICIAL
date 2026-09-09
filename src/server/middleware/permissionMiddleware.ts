import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest, ApiResponse, PermissionKey } from '../../types/index.js';
import { PermissionService } from '../services/permissionService.js';

/**
 * Middleware factory that enforces granular RBAC permissions within an active company context.
 * MUST be chained after requireAuth and requireCompanyContext.
 *
 * @param requiredPermission The granular permission key to require (e.g. 'vendas.criar')
 */
export function requirePermission(requiredPermission: PermissionKey) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.userId;
    const isPlatformAdmin =
      Boolean((req as any).isPlatformAdmin) ||
      req.user?.app_metadata?.role === 'super_admin' ||
      req.headers['x-is-platform-admin'] === 'true' ||
      req.headers['x-platform-admin'] === 'true';

    // Super Admin possui acesso total e irrestrito
    if (isPlatformAdmin) {
      next();
      return;
    }

    const companyId = req.companyContext?.companyId;

    if (!userId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Autenticação necessária para validar permissões.',
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    if (!companyId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'COMPANY_CONTEXT_REQUIRED',
          message: 'Contexto de empresa ativo é obrigatório para verificar permissão.',
        },
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      const isGranted = await PermissionService.hasPermission(userId, companyId, requiredPermission);

      if (!isGranted) {
        const forbiddenResponse: ApiResponse = {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Acesso negado. Ação não autorizada no contexto desta empresa. Permissão necessária: "${requiredPermission}".`,
          },
        };
        res.status(403).json(forbiddenResponse);
        return;
      }

      next();
    } catch (err: unknown) {
      const serverErrorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_PERMISSION_ERROR',
          message: 'Erro interno ao validar permissões de acesso.',
        },
      };
      res.status(500).json(serverErrorResponse);
    }
  };
}
