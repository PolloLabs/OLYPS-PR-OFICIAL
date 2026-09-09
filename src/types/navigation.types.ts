import React from 'react';
import type { PermissionKey } from './tenant.types.js';

export type NavigationScope = 'platform' | 'company' | 'all';

export type ViewType =
  | 'list'
  | 'form'
  | 'report'
  | 'import'
  | 'settings'
  | 'pos'
  | 'super_admin'
  | 'custom';

export interface SidebarSubItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  permission?: PermissionKey;
  badge?: string;
  scope?: NavigationScope;
  description?: string;
  viewType?: ViewType;
  parentId?: string;
  createPath?: string;
  listPath?: string;
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  permission?: PermissionKey;
  badge?: string;
  scope?: NavigationScope;
  description?: string;
  moduleNumber?: string;
  viewType?: ViewType;
  children?: SidebarSubItem[];
  createPath?: string;
  listPath?: string;
}

export interface SidebarSection {
  id: string;
  title?: string;
  moduleNumber?: string;
  items: SidebarMenuItem[];
}

export interface NavigationState {
  activeItemId: string;
  activeSubItemId?: string;
  activePath: string;
  expandedGroups: Record<string, boolean>;
  isCollapsed: boolean;
}

export type PageSizeOption = 25 | 50 | 75 | 100 | 'all';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}
