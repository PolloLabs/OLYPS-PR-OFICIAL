import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import type { UUID, ISODateString } from './common.types.js';
import type { ApiError } from './api.types.js';
import type { ActiveCompanyContext } from './tenant.types.js';

/**
 * Standard authenticated user profile summary extracted from validated auth sessions.
 */
export interface AuthenticatedUser {
  id: UUID;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt?: ISODateString;
}

/**
 * Interface representing an authenticated Express request.
 * Contains the validated Supabase user identity and token.
 */
export interface AuthenticatedRequest extends Request {
  userId?: UUID;
  accessToken?: string;
  user?: User;
  companyContext?: ActiveCompanyContext;
}

/**
 * Request that is guaranteed to have an authenticated user and a validated active company context.
 */
export interface CompanyAuthenticatedRequest extends AuthenticatedRequest {
  userId: UUID;
  companyContext: ActiveCompanyContext;
}

/**
 * Standard API error response interface
 */
export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * Technical health status for Supabase connectivity
 */
export interface SupabaseHealthStatus {
  status: 'ok' | 'unconfigured' | 'error';
  service: 'supabase';
  timestamp: ISODateString;
  configured: boolean;
}
