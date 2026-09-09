import type { UUID } from './common.types.js';
import type { PaginationMeta } from './pagination.types.js';

/**
 * Valid category types for user and system notifications.
 */
export type NotificationCategory = 'system' | 'subscription' | 'security' | 'announcement';

/**
 * Valid priority levels for notifications.
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Core interface representing a notification in the platform.
 */
export interface Notification {
  id: UUID | string;
  userId: UUID | string;
  companyId: UUID | string | null;
  announcementId: UUID | string | null;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  readAt: string | null;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

/**
 * Input payload for creating a notification.
 */
export interface CreateNotificationInput {
  userId: UUID | string;
  companyId?: UUID | string | null;
  announcementId?: UUID | string | null;
  title: string;
  message: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  actionUrl?: string | null;
}

/**
 * Filters and query options for listing notifications.
 */
export interface NotificationFilters {
  category?: NotificationCategory | 'all';
  priority?: NotificationPriority | 'all';
  isRead?: boolean | 'all';
  companyId?: UUID | string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Standard paginated response for notifications.
 */
export interface PaginatedNotificationsResponse {
  items: Notification[];
  meta: PaginationMeta;
  unreadCount: number;
}
