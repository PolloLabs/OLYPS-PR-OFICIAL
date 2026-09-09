import type { UUID } from './common.types.js';
import type { PaginationMeta } from './pagination.types.js';

/**
 * Valid types for platform announcements.
 */
export type AnnouncementType = 'info' | 'warning' | 'critical' | 'maintenance' | 'update';

/**
 * Valid priority levels for platform announcements.
 */
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Valid target audience categories for platform announcements.
 */
export type AnnouncementTargetAudience = 'all' | 'specific_plans' | 'specific_companies';

/**
 * Core interface representing a platform announcement.
 */
export interface PlatformAnnouncement {
  id: UUID | string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  targetAudience: AnnouncementTargetAudience;
  targetPlanIds: string[];
  targetCompanyIds: string[];
  startsAt: string;
  expiresAt: string | null;
  isPublished: boolean;
  createdBy: UUID | string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input payload for creating a new platform announcement.
 */
export interface CreateAnnouncementInput {
  title: string;
  message: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  targetAudience?: AnnouncementTargetAudience;
  targetPlanIds?: string[];
  targetCompanyIds?: string[];
  startsAt?: string;
  expiresAt?: string | null;
  isPublished?: boolean;
}

/**
 * Input payload for updating an existing platform announcement.
 */
export interface UpdateAnnouncementInput {
  title?: string;
  message?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  targetAudience?: AnnouncementTargetAudience;
  targetPlanIds?: string[];
  targetCompanyIds?: string[];
  startsAt?: string;
  expiresAt?: string | null;
  isPublished?: boolean;
}

/**
 * Filters and pagination parameters for querying platform announcements.
 */
export interface AnnouncementFilters {
  search?: string;
  type?: AnnouncementType | 'all';
  priority?: AnnouncementPriority | 'all';
  targetAudience?: AnnouncementTargetAudience | 'all';
  isPublished?: boolean | 'all';
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'starts_at' | 'title' | 'priority' | string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Standard paginated response for announcements.
 */
export interface PaginatedAnnouncementsResponse {
  items: PlatformAnnouncement[];
  meta: PaginationMeta;
}
