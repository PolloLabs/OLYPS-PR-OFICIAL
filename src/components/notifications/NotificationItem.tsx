import React from 'react';
import {
  Bell,
  CreditCard,
  ShieldAlert,
  Megaphone,
  Check,
  ExternalLink,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import type { Notification, NotificationCategory, NotificationPriority } from '../../types/index.js';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  isMarking: boolean;
  onNavigate?: (url: string) => void;
}

function formatNotificationTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24 && now.getDate() === date.getDate()) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1 || (diffDays < 2 && now.getDate() - date.getDate() === 1)) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function getCategoryMeta(category: NotificationCategory) {
  switch (category) {
    case 'subscription':
      return {
        label: 'Assinatura',
        icon: CreditCard,
        bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'security':
      return {
        label: 'Segurança',
        icon: ShieldAlert,
        bg: 'bg-purple-100 text-purple-700 border-purple-200',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'announcement':
      return {
        label: 'Comunicado',
        icon: Megaphone,
        bg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'system':
    default:
      return {
        label: 'Sistema',
        icon: Bell,
        bg: 'bg-blue-100 text-blue-700 border-blue-200',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      };
  }
}

function getPriorityMeta(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent':
      return {
        label: 'Urgente',
        className: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      };
    case 'high':
      return {
        label: 'Alta',
        className: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
      };
    case 'normal':
      return {
        label: 'Normal',
        className: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
      };
    case 'low':
    default:
      return {
        label: 'Baixa',
        className: 'bg-slate-50 text-slate-400 border-slate-200 font-normal',
      };
  }
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  isMarking,
  onNavigate,
}) => {
  const categoryMeta = getCategoryMeta(notification.category);
  const priorityMeta = getPriorityMeta(notification.priority);
  const CategoryIcon = categoryMeta.icon;

  const handleItemClick = (e: React.MouseEvent) => {
    // If clicking a specific action button, avoid double firing
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }

    if (!notification.isRead) {
      onMarkAsRead(notification.id as string);
    }

    if (notification.actionUrl) {
      handleActionClick();
    }
  };

  const handleActionClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id as string);
    }

    if (!notification.actionUrl) return;

    if (
      notification.actionUrl.startsWith('http://') ||
      notification.actionUrl.startsWith('https://')
    ) {
      window.open(notification.actionUrl, '_blank', 'noopener,noreferrer');
    } else {
      if (onNavigate) {
        onNavigate(notification.actionUrl);
      } else {
        const cleanPath = notification.actionUrl.replace(/^#/, '');
        window.location.hash = cleanPath;
      }
    }
  };

  return (
    <div
      id={`notification-item-${notification.id}`}
      onClick={handleItemClick}
      className={`p-3.5 border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer group relative ${
        !notification.isRead
          ? 'bg-indigo-50/40 hover:bg-indigo-50/70 border-l-4 border-l-indigo-600'
          : 'bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent text-slate-700'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Category Icon */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${categoryMeta.bg}`}
        >
          <CategoryIcon className="w-4 h-4" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${categoryMeta.badgeBg}`}
              >
                {categoryMeta.label}
              </span>
              {notification.priority !== 'normal' && notification.priority !== 'low' && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityMeta.className}`}
                >
                  {priorityMeta.label}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1 text-[11px] text-slate-400 shrink-0">
              <Clock className="w-3 h-3" />
              <span>{formatNotificationTime(notification.createdAt)}</span>
            </div>
          </div>

          <h4
            className={`text-xs font-bold leading-tight mb-1 truncate ${
              !notification.isRead ? 'text-slate-900' : 'text-slate-700'
            }`}
          >
            {notification.title}
          </h4>

          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          {/* Action Link / Button if present */}
          {notification.actionUrl && (
            <div className="mt-2 flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick();
                }}
                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <span>Acessar</span>
                {notification.actionUrl.startsWith('http') ? (
                  <ExternalLink className="w-3 h-3" />
                ) : (
                  <ArrowRight className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Actions (Mark as Read button) */}
        {!notification.isRead && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id as string);
            }}
            disabled={isMarking}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-colors shadow-2xs shrink-0 self-center"
            title="Marcar como lida"
            aria-label="Marcar como lida"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
