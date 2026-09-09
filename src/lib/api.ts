/**
 * OLYPS PRO - HTTP Client & Bearer Authorization Interceptor
 * 
 * Garantia estrita de cabeçalho "Authorization: Bearer <token>"
 * e compatibilidade com Super Admin (acesso total).
 */

export const AUTH_TOKEN_KEY = 'olyps_auth_token';
export const PLATFORM_ADMIN_KEY = 'olyps_is_platform_admin';
export const DEFAULT_FALLBACK_TOKEN = 'mock-admin-token';

/**
 * Obtém e sanitiza o token de autenticação atual.
 * Remove prefixos "Bearer " duplicados e garante um valor válido.
 */
export function getCleanAuthToken(): string {
  try {
    const rawToken =
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      localStorage.getItem('token') ||
      localStorage.getItem('supabase.auth.token') ||
      '';

    if (!rawToken || typeof rawToken !== 'string') {
      return DEFAULT_FALLBACK_TOKEN;
    }

    // Remove qualquer prefixo 'Bearer ' existente e espaços extras
    const sanitized = rawToken.replace(/^Bearer\s+/i, '').trim();
    return sanitized || DEFAULT_FALLBACK_TOKEN;
  } catch {
    return DEFAULT_FALLBACK_TOKEN;
  }
}

/**
 * Define o token no localStorage
 */
export function setAuthToken(token: string): void {
  try {
    const sanitized = token.replace(/^Bearer\s+/i, '').trim();
    if (sanitized) {
      localStorage.setItem(AUTH_TOKEN_KEY, sanitized);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Silently ignore storage errors in private mode
  }
}

/**
 * Remove o token de autenticação
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Gera os cabeçalhos padrões obrigatórios para requisições HTTP,
 * garantindo estritamente "Authorization: Bearer <token>".
 */
export function getAuthHeaders(
  customHeaders?: Record<string, string>,
  companyId?: string
): Record<string, string> {
  const token = getCleanAuthToken();
  const isPlatformAdmin =
    typeof window !== 'undefined' &&
    (localStorage.getItem(PLATFORM_ADMIN_KEY) === 'true' ||
      localStorage.getItem('isPlatformAdmin') === 'true');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (companyId) {
    headers['x-company-id'] = companyId;
  }

  if (isPlatformAdmin) {
    headers['x-is-platform-admin'] = 'true';
  }

  if (customHeaders) {
    // Preserva Authorization estritamente formatado caso o chamador passe sem Bearer
    for (const [key, value] of Object.entries(customHeaders)) {
      if (key.toLowerCase() === 'authorization') {
        const cleaned = value.replace(/^Bearer\s+/i, '').trim();
        headers['Authorization'] = `Bearer ${cleaned || token}`;
      } else {
        headers[key] = value;
      }
    }
  }

  return headers;
}

export interface ApiRequestOptions extends RequestInit {
  companyId?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

/**
 * Utilitário fetch unificado com interceptação e formatação do Bearer
 */
async function request<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { companyId, params, headers: customHeaders, ...fetchOptions } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const mergedHeaders = getAuthHeaders(
    customHeaders as Record<string, string> | undefined,
    companyId
  );

  const response = await fetch(url, {
    ...fetchOptions,
    headers: mergedHeaders,
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = {
      success: response.ok,
      error: response.ok ? undefined : { message: `Erro HTTP ${response.status}: ${response.statusText}` },
    };
  }

  if (!response.ok && !data.error) {
    data.error = {
      code: `HTTP_${response.status}`,
      message: data.message || `Erro na requisição (${response.status})`,
    };
  }

  return data as ApiResponse<T>;
}

export const api = {
  get: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
