import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
  X,
} from 'lucide-react';
import { NotificationItem } from './NotificationItem.js';
import type {
  Notification,
  NotificationCategory,
  NotificationPriority,
  PaginatedNotificationsResponse,
  PaginationMeta,
  ApiResponse,
} from '../../types/index.js';

interface NotificationBellDropdownProps {
  onNavigate?: (path: string) => void;
  onShowNotification?: (type: 'success' | 'error', message: string) => void;
}

export const NotificationBellDropdown: React.FC<NotificationBellDropdownProps> = ({
  onNavigate,
  onShowNotification,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(false);

  // List data state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Action states
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Helper for auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const authToken = localStorage.getItem('olyps_auth_token') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
  };

  // Safe JSON fetch wrapper to handle non-JSON responses and network disconnects gracefully
  const safeFetchJson = async <T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (res.ok) {
        if (isJson) {
          const json = await res.json();
          return { ok: true, status: res.status, data: json };
        }
        return { ok: false, status: res.status, error: 'Resposta não está no formato JSON' };
      }

      // Non-ok response
      if (isJson) {
        const errorJson = await res.json().catch(() => null);
        return {
          ok: false,
          status: res.status,
          error: errorJson?.error?.message || errorJson?.message || `Erro ${res.status}`,
        };
      }
      return { ok: false, status: res.status, error: `Erro ${res.status}` };
    } catch (err: any) {
      return { ok: false, status: 0, error: err?.message || 'Falha na conexão' };
    }
  };

  // 1. Fetch Unread Count
  const fetchUnreadCount = useCallback(async () => {
    setIsLoadingCount(true);
    try {
      const result = await safeFetchJson<ApiResponse<{ unreadCount: number }>>(
        '/api/notifications/unread-count',
        { headers: getAuthHeaders() }
      );
      if (result.ok && result.data?.success && result.data.data) {
        setUnreadCount(result.data.data.unreadCount || 0);
      }
    } finally {
      setIsLoadingCount(false);
    }
  }, []);

  // 2. Fetch Notifications List
  const fetchNotifications = useCallback(
    async (pageToLoad = pagination.page) => {
      setIsLoadingList(true);
      setListError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', pageToLoad.toString());
        params.set('pageSize', pagination.pageSize.toString());

        if (statusFilter === 'unread') params.set('isRead', 'false');
        if (statusFilter === 'read') params.set('isRead', 'true');
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        if (priorityFilter !== 'all') params.set('priority', priorityFilter);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const result = await safeFetchJson<ApiResponse<PaginatedNotificationsResponse>>(
          `/api/notifications?${params.toString()}`,
          { headers: getAuthHeaders() }
        );

        if (result.ok && result.data?.success && result.data.data) {
          setNotifications(result.data.data.items || []);
          if (result.data.data.meta) {
            setPagination(result.data.data.meta);
          }
          if (typeof result.data.data.unreadCount === 'number') {
            setUnreadCount(result.data.data.unreadCount);
          }
        } else {
          setListError(result.error || 'Falha ao carregar notificações.');
        }
      } catch (err: any) {
        setListError(err?.message || 'Erro ao carregar notificações.');
      } finally {
        setIsLoadingList(false);
      }
    },
    [
      pagination.page,
      pagination.pageSize,
      statusFilter,
      categoryFilter,
      priorityFilter,
      searchQuery,
    ]
  );

  // Initial load of unread count and periodic poll
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // When dropdown opens or filters change, fetch notifications
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 3. Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      const result = await safeFetchJson<ApiResponse<Notification>>(
        `/api/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
        }
      );
      if (result.ok && result.data?.success) {
        // Optimistically update list
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        // Decrement unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setMarkingId(null);
    }
  };

  // 4. Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const result = await safeFetchJson<ApiResponse<{ updatedCount: number }>>(
        '/api/notifications/read-all',
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
        }
      );
      if (result.ok && result.data?.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        if (onShowNotification) {
          onShowNotification('success', 'Todas as notificações foram marcadas como lidas.');
        }
      } else {
        if (onShowNotification) {
          onShowNotification('error', result.error || 'Falha ao marcar todas como lidas.');
        }
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification('error', err?.message || 'Erro ao processar ação.');
      }
    } finally {
      setIsMarkingAll(false);
    }
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    Boolean(searchQuery.trim());

  const resetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="relative inline-block text-left">
      {/* 1. Bell Trigger Button */}
      <button
        ref={buttonRef}
        id="notification-bell-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Abrir central de notificações"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-lg border transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
          isOpen
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs'
        }`}
        title="Central de Notificações"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-in zoom-in-50"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="notification-dropdown-panel"
          className="fixed inset-x-2 top-18 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[420px] max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-xs tracking-tight">
                Notificações
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll || isLoadingList}
                  className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                  title="Marcar todas as notificações como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Marcar todas como lidas</span>
                  <span className="sm:hidden">Lidas</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`p-1.5 rounded-md transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Filtrar notificações"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => fetchNotifications(1)}
                disabled={isLoadingList}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors sm:hidden"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Filter Bar */}
          {showFilters && (
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  placeholder="Buscar no título ou texto..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Status Filter */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Todas</option>
                    <option value="unread">Não lidas</option>
                    <option value="read">Lidas</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Categoria
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value as any);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Todas</option>
                    <option value="system">Sistema</option>
                    <option value="subscription">Assinatura</option>
                    <option value="security">Segurança</option>
                    <option value="announcement">Comunicado</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Prioridade
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value as any);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Todas</option>
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {listError ? (
              <div className="p-6 text-center text-rose-700 space-y-1">
                <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-1" />
                <p className="text-xs font-semibold">{listError}</p>
                <button
                  type="button"
                  onClick={() => fetchNotifications()}
                  className="mt-2 text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Tentar novamente
                </button>
              </div>
            ) : isLoadingList ? (
              <div className="p-10 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs font-medium">Carregando notificações...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">
                  {hasActiveFilters ? 'Nenhuma notificação encontrada' : 'Nenhuma notificação recente'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {hasActiveFilters
                    ? 'Tente remover os filtros de busca aplicados.'
                    : 'Você está em dia com todos os comunicados e avisos.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onMarkAsRead={handleMarkAsRead}
                  isMarking={markingId === item.id}
                  onNavigate={(url) => {
                    setIsOpen(false);
                    if (onNavigate) {
                      onNavigate(url);
                    } else {
                      const cleanPath = url.replace(/^#/, '');
                      window.location.hash = cleanPath;
                    }
                  }}
                />
              ))
            )}
          </div>

          {/* Footer with Pagination */}
          <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="text-[11px] text-slate-500">
              Página <strong className="text-slate-800">{pagination.page}</strong> de{' '}
              <strong className="text-slate-800">{pagination.totalPages || 1}</strong>
              {pagination.total > 0 && ` (${pagination.total})`}
            </span>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || isLoadingList}
                onClick={() => {
                  const newPage = pagination.page - 1;
                  setPagination((prev) => ({ ...prev, page: newPage }));
                  fetchNotifications(newPage);
                }}
                className="p-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage || isLoadingList}
                onClick={() => {
                  const newPage = pagination.page + 1;
                  setPagination((prev) => ({ ...prev, page: newPage }));
                  fetchNotifications(newPage);
                }}
                className="p-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Próxima página"
                aria-label="Próxima página"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
