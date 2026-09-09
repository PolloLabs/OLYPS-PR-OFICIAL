import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest, ApiResponse } from '../../types/index.js';
import { PlatformAdminService } from '../services/platformAdminService.js';

/**
 * Middleware ensuring the authenticated user has active Platform Super Admin privileges.
 * MUST be chained after requireAuth.
 */
export async function requirePlatformAdmin(
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
        message: 'Autenticação necessária antes da verificação de permissão.',
      },
    };
    res.status(401).json(errorResponse);
    return;
  }

  try {
    const isSuperAdmin = await PlatformAdminService.isPlatformAdmin(userId);

    if (!isSuperAdmin) {
      const forbiddenResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PLATFORM_ADMIN_FORBIDDEN',
          message: 'Acesso negado. Esta operação exige privilégios de Super Admin da plataforma.',
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
        code: 'INTERNAL_AUTHORIZATION_ERROR',
        message: 'Erro interno ao validar privilégios de plataforma.',
      },
    };
    res.status(500).json(serverErrorResponse);
  }
}
