import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppSidebar } from './components/navigation/AppSidebar.js';
import { AppHeader } from './components/navigation/AppHeader.js';
import { ModulePlaceholderView } from './components/navigation/ModulePlaceholderView.js';
import { DashboardSummaryCards } from './components/admin/DashboardSummaryCards.js';
import { CompaniesTable } from './components/admin/CompaniesTable.js';
import { CompanyDetailsModal } from './components/admin/CompanyDetailsModal.js';
import { ChangeStatusModal } from './components/admin/ChangeStatusModal.js';
import { CompanyFormModal } from './components/companies/CompanyFormModal.js';
import { CompanySettingsView } from './components/companies/CompanySettingsView.js';
import { CommercialLocationsView } from './components/companies/CommercialLocationsView.js';
import { UsersManagementView } from './components/admin/users/UsersManagementView.js';
import { SubscriptionPlansView } from './components/admin/plans/SubscriptionPlansView.js';
import { SubscriptionsView } from './components/admin/subscriptions/SubscriptionsView.js';
import { CouponsManagementView } from './components/admin/coupons/index.js';
import { AnnouncementsManagementView } from './components/admin/announcements/index.js';
import {
  CustomersView,
  SuppliersView,
  CustomerGroupsView,
  ContactImportView,
} from './components/contacts/index.js';
import { ProductsListView } from './components/products/ProductsListView.js';
import { CategoriesView } from './components/products/CategoriesView.js';
import { BrandsView } from './components/products/BrandsView.js';
import { UnitsView } from './components/products/UnitsView.js';
import { VariationsView } from './components/products/VariationsView.js';
import { WarrantiesView } from './components/products/WarrantiesView.js';
import { ProductImportView } from './components/products/ProductImportView.js';
import { RepairDashboard } from './components/repair/dashboard/RepairDashboard.js';
import { JobSheetList } from './components/repair/jobsheet/JobSheetList.js';
import { RepairSettings } from './components/repair/settings/RepairSettings.js';
import { RepairBrands } from './components/repair/brands/RepairBrands.js';
import { CreatePurchase } from './components/purchase/CreatePurchase.js';
import { PurchaseList } from './components/purchase/PurchaseList.js';
import { PurchaseReturnList } from './components/purchase/PurchaseReturnList.js';
import { SellList } from './components/sell/SellList.js';
import { SellCreate } from './components/sell/SellCreate.js';
import { DraftCreate } from './components/sell/DraftCreate.js';
import { POSList } from './components/pdv/POSList.js';
import { POSCreate } from './components/pdv/POSCreate.js';
import { InvoiceSettings } from './components/settings/InvoiceSettings.js';
import { PricingPlans } from './components/public/PricingPlans.js';
import { ErrorBoundary } from './components/ui/ErrorBoundary.js';
import { OFFICIAL_NAVIGATION_CONFIG } from './config/navigationConfig.js';
import { Shield, CheckCircle, AlertCircle, Eye, Layers, Lock, X } from 'lucide-react';
import type { CompanySubscriptionSummary } from './types/subscription.types.js';
import type {
  PlatformDashboardSummary,
  CompanyRecord,
  CompanyStatus,
  PaginationMeta,
  SortDirection,
  PlatformCompanyDetails,
  ApiResponse,
  SidebarMenuItem,
  SidebarSubItem,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from './types/index.js';
import type { CompanyRole } from './types/tenant.types.js';

// Initial default summary state
const INITIAL_SUMMARY: PlatformDashboardSummary = {
  totalCompanies: 4,
  activeCompanies: 2,
  suspendedCompanies: 1,
  pendingCompanies: 1,
  inactiveCompanies: 0,
  totalMemberships: 14,
  totalPlatformAdmins: 2,
  serverTimestamp: new Date().toISOString(),
};

// Initial default companies state for initial preview
const MOCK_COMPANIES: CompanyRecord[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'TechStore Brasil Matriz',
    legalName: 'TechStore Solucoes em Tecnologia LTDA',
    document: '12.345.678/0001-90',
    slug: 'techstore-br',
    status: 'active',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-08-20T14:30:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'AutoPeças & Acessórios Premium',
    legalName: 'Distribuidora AutoPecas Premium EIRELI',
    document: '98.765.432/0001-10',
    slug: 'autopecas-premium',
    status: 'active',
    createdAt: '2026-02-01T08:15:00.000Z',
    updatedAt: '2026-08-25T11:45:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Assistência Técnica Express',
    legalName: 'Express Repair & Hardware Servicos ME',
    document: '45.123.789/0001-55',
    slug: 'express-repair',
    status: 'suspended',
    createdAt: '2026-03-10T14:20:00.000Z',
    updatedAt: '2026-08-28T09:00:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Mega Varejo & Logística',
    legalName: 'Mega Varejo Comercial S/A',
    document: '33.987.654/0001-22',
    slug: 'mega-varejo',
    status: 'pending',
    createdAt: '2026-08-29T16:00:00.000Z',
    updatedAt: '2026-08-29T16:00:00.000Z',
  },
];

export default function App() {
  // Navigation state (Default active: PDV - Terminal Ponto de Venda)
  const [activeItemId, setActiveItemId] = useState<string>('nav-sales');
  const [activeSubItemId, setActiveSubItemId] = useState<string | undefined>('sub-sales-pos');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'nav-super-admin': false,
    'nav-users-mgmt': false,
    'nav-contacts': false,
    'nav-products': false,
    'nav-repair': false,
    'nav-purchases': false,
    'nav-sales': true,
    'nav-stock-adjust': false,
    'nav-expenses': false,
    'nav-reports': false,
    'nav-modules': false,
    'nav-settings': false,
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Active Context & RBAC Simulator
  const [activeCompanyName, setActiveCompanyName] = useState<string>('TechStore Brasil Matriz');
  const [userRole, setUserRole] = useState<CompanyRole>('company_admin');
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean>(true);

  // Platform Dashboard & Companies State
  const [summary, setSummary] = useState<PlatformDashboardSummary>(INITIAL_SUMMARY);
  const [companies, setCompanies] = useState<CompanyRecord[]>(MOCK_COMPANIES);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: MOCK_COMPANIES.length,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'status' | 'slug'>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals state
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<PlatformCompanyDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [companyForStatusChange, setCompanyForStatusChange] = useState<CompanyRecord | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Company Form Modal state (Create & Edit)
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState<boolean>(false);
  const [companyToEdit, setCompanyToEdit] = useState<CompanyRecord | null>(null);
  const [isSavingCompany, setIsSavingCompany] = useState<boolean>(false);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback(
    (
      typeOrObj:
        | 'success'
        | 'error'
        | { type: 'success' | 'error' | 'info'; message: string; description?: string },
      maybeMsg?: string
    ) => {
      let type: 'success' | 'error' = 'success';
      let message = '';

      if (typeof typeOrObj === 'object' && typeOrObj !== null) {
        type = typeOrObj.type === 'error' ? 'error' : 'success';
        message = typeOrObj.description
          ? `${typeOrObj.message}: ${typeOrObj.description}`
          : typeOrObj.message;
      } else {
        type = typeOrObj === 'error' ? 'error' : 'success';
        message = maybeMsg || '';
      }

      setFeedback({ type, message });
      if (type === 'success') {
        setTimeout(() => {
          setFeedback((prev) => (prev?.type === 'success' ? null : prev));
        }, 4500);
      }
    },
    []
  );

  // Find active navigation item object
  const activeNavContext = useMemo(() => {
    for (const section of OFFICIAL_NAVIGATION_CONFIG) {
      for (const item of section.items) {
        if (item.id === activeItemId) {
          const subItem = item.children?.find((c) => c.id === activeSubItemId);
          return {
            section: section.title,
            item,
            subItem,
            breadcrumb: {
              main: item.label,
              sub: subItem?.label,
            },
          };
        }
      }
    }
    const defaultItem = OFFICIAL_NAVIGATION_CONFIG[0].items[0];
    const defaultSub = defaultItem.children?.[0];
    return {
      section: OFFICIAL_NAVIGATION_CONFIG[0].title,
      item: defaultItem,
      subItem: defaultSub,
      breadcrumb: {
        main: defaultItem.label,
        sub: defaultSub?.label,
      },
    };
  }, [activeItemId, activeSubItemId]);

  // Navigate directly by path
  // Navigate directly by path
  const handleNavigateByPath = useCallback((targetPath: string) => {
    let resolvedPath = targetPath === '/produtos/variacoes' ? '/variation-templates' : targetPath;
    if (resolvedPath === '' || resolvedPath === '/' || resolvedPath === '/dashboard') resolvedPath = '/vendas/pos';
    if (resolvedPath === '/purchases') resolvedPath = '/compras';
    if (resolvedPath === '/purchase-return') resolvedPath = '/compras/retorno';
    if (resolvedPath === '/sells' || resolvedPath === '/vendas') resolvedPath = '/vendas';
    if (resolvedPath === '/sells/create' || resolvedPath === '/vendas/adicionar') resolvedPath = '/vendas/adicionar';
    if (resolvedPath === '/pos' || resolvedPath === '/vendas/pos-lista' || resolvedPath === '/pdv/lista' || resolvedPath === '/pos-lista') resolvedPath = '/vendas/pos-lista';
    if (resolvedPath === '/pos/create' || resolvedPath === '/vendas/pos' || resolvedPath === '/pdv' || resolvedPath === '/pdv/create') resolvedPath = '/vendas/pos';
    if (resolvedPath === '/vendas/rascunho' || resolvedPath.includes('status=draft')) resolvedPath = '/vendas/rascunho';
    window.location.hash = resolvedPath === '/vendas/pos' ? '/pdv/create' : resolvedPath;
    for (const section of OFFICIAL_NAVIGATION_CONFIG) {
      for (const item of section.items) {
        if (item.path === resolvedPath || item.path === targetPath) {
          setActiveItemId(item.id);
          setActiveSubItemId(undefined);
          return;
        }
        if (item.children) {
          for (const sub of item.children) {
            if (sub.path === resolvedPath || sub.path === targetPath) {
              setActiveItemId(item.id);
              setActiveSubItemId(sub.id);
              setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
              return;
            }
          }
        }
      }
    }
    // Generic feedback
    showNotification('success', `Navegação para a rota ${targetPath} executada.`);
  }, []);

  // Listen to browser URL hash changes for page refresh and back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#/, '');

      // Redirecionamento de rota inicial / raiz / dashboard / pos para PDV (/pdv/create)
      if (!rawHash || rawHash === '/' || rawHash === '/dashboard' || rawHash === '/pos' || rawHash === '/pos/create' || rawHash === '/pdv') {
        window.location.hash = '#/pdv/create';
        setActiveItemId('nav-sales');
        setActiveSubItemId('sub-sales-pos');
        setExpandedGroups((prev) => ({ ...prev, 'nav-sales': true }));
        return;
      }

      let currentHash = rawHash === '/produtos/variacoes' ? '/variation-templates' : rawHash;
      if (currentHash === '/purchases') currentHash = '/compras';
      if (currentHash === '/purchase-return') currentHash = '/compras/retorno';
      if (currentHash === '/sells') currentHash = '/vendas';
      if (currentHash === '/sells/create') currentHash = '/vendas/adicionar';
      if (currentHash === '/pos' || currentHash === '/pdv/lista' || currentHash === '/pos-lista') currentHash = '/vendas/pos-lista';
      if (currentHash === '/pos/create' || currentHash === '/pdv' || currentHash === '/pdv/create') currentHash = '/vendas/pos';
      if (currentHash === '/vendas/rascunho' || currentHash.includes('status=draft')) currentHash = '/vendas/rascunho';
      if (currentHash) {
        for (const section of OFFICIAL_NAVIGATION_CONFIG) {
          for (const item of section.items) {
            if (item.path === currentHash || item.path === rawHash) {
              setActiveItemId(item.id);
              setActiveSubItemId(undefined);
              return;
            }
            if (item.children) {
              for (const sub of item.children) {
                if (sub.path === currentHash || sub.path === rawHash) {
                  setActiveItemId(item.id);
                  setActiveSubItemId(sub.id);
                  setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
                  return;
                }
              }
            }
          }
        }
      }
    };

    // Run on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch or filter data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      if (authToken) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        };

        const [sumRes, compRes] = await Promise.all([
          fetch('/api/platform/dashboard/summary', { headers }),
          fetch(
            `/api/platform/companies?page=${pagination.page}&pageSize=${pagination.pageSize}&search=${encodeURIComponent(
              searchQuery
            )}&status=${statusFilter}&sortBy=${sortBy}&sortDirection=${sortDirection}`,
            { headers }
          ),
        ]);

        if (sumRes.ok && compRes.ok) {
          const sumData = (await sumRes.json()) as ApiResponse<PlatformDashboardSummary>;
          const compData = (await compRes.json()) as ApiResponse<CompanyRecord[]>;

          if (sumData.success && sumData.data) {
            setSummary(sumData.data);
          }
          if (compData.success && compData.data) {
            setCompanies(compData.data);
            if (compData.meta && typeof compData.meta === 'object' && 'pagination' in compData.meta) {
              setPagination(compData.meta.pagination as PaginationMeta);
            }
          }
          setIsLoading(false);
          return;
        }
      }

      // Filter local fallback state
      let filtered = [...MOCK_COMPANIES];
      if (statusFilter !== 'all') {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q) ||
            (c.document && c.document.includes(q)) ||
            (c.legalName && c.legalName.toLowerCase().includes(q))
        );
      }

      filtered.sort((a, b) => {
        const valA = a[sortBy] || '';
        const valB = b[sortBy] || '';
        if (sortDirection === 'asc') {
          return valA > valB ? 1 : -1;
        }
        return valA < valB ? 1 : -1;
      });

      setCompanies(filtered);
      setPagination((prev) => ({
        ...prev,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / prev.pageSize),
      }));
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchQuery, statusFilter, sortBy, sortDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle navigation group toggling
  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Handle selecting main menu item
  const handleSelectMainItem = (item: SidebarMenuItem) => {
    setActiveItemId(item.id);
    if (item.children && item.children.length > 0) {
      const firstChild = item.children[0];
      setActiveSubItemId(firstChild.id);
      setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
      if (firstChild.path) {
        window.location.hash = firstChild.path;
      }
    } else {
      setActiveSubItemId(undefined);
      if (item.path) {
        window.location.hash = item.path;
      }
    }
  };

  // Handle selecting sub-menu item
  const handleSelectSubItem = (subItem: SidebarSubItem, parentItem: SidebarMenuItem) => {
    setActiveItemId(parentItem.id);
    setActiveSubItemId(subItem.id);
    setExpandedGroups((prev) => ({ ...prev, [parentItem.id]: true }));
    if (subItem.path) {
      window.location.hash = subItem.path;
    }
  };

  // Handle viewing company details
  const handleViewDetails = async (company: CompanyRecord) => {
    setIsLoadingDetails(true);
    setSelectedCompanyDetails(null);

    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      if (authToken) {
        const res = await fetch(`/api/platform/companies/${company.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (res.ok) {
          const json = (await res.json()) as ApiResponse<PlatformCompanyDetails>;
          if (json.success && json.data) {
            setSelectedCompanyDetails(json.data);
            setIsLoadingDetails(false);
            return;
          }
        }
      }

      // Mock details fallback
      setSelectedCompanyDetails({
        ...company,
        memberCount: 3,
        members: [
          {
            id: 'mem-1',
            userId: '550e8400-e29b-41d4-a716-446655440010',
            role: 'company_admin',
            status: 'active',
            joinedAt: company.createdAt,
            lastAccessedAt: company.updatedAt,
          },
          {
            id: 'mem-2',
            userId: '550e8400-e29b-41d4-a716-446655440011',
            role: 'manager',
            status: 'active',
            joinedAt: company.createdAt,
            lastAccessedAt: company.updatedAt,
          },
          {
            id: 'mem-3',
            userId: '550e8400-e29b-41d4-a716-446655440012',
            role: 'seller',
            status: 'active',
            joinedAt: company.createdAt,
            lastAccessedAt: company.updatedAt,
          },
        ],
      });
    } catch {
      showNotification('error', 'Erro ao carregar detalhes da empresa.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle opening status change modal
  const handleChangeStatus = (company: CompanyRecord) => {
    setCompanyForStatusChange(company);
  };

  // Confirm status change
  const handleConfirmStatusChange = async (companyId: string, newStatus: CompanyStatus) => {
    setIsUpdatingStatus(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      if (authToken) {
        const res = await fetch(`/api/platform/companies/${companyId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          const errJson = (await res.json()) as ApiResponse;
          throw new Error(errJson.error?.message || 'Falha ao atualizar status.');
        }
      }

      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c))
      );

      setSummary((prev) => {
        const active = companies.filter((c) => (c.id === companyId ? newStatus === 'active' : c.status === 'active')).length;
        const suspended = companies.filter((c) => (c.id === companyId ? newStatus === 'suspended' : c.status === 'suspended')).length;
        const pending = companies.filter((c) => (c.id === companyId ? newStatus === 'pending' : c.status === 'pending')).length;
        const inactive = companies.filter((c) => (c.id === companyId ? newStatus === 'inactive' : c.status === 'inactive')).length;

        return {
          ...prev,
          activeCompanies: active,
          suspendedCompanies: suspended,
          pendingCompanies: pending,
          inactiveCompanies: inactive,
        };
      });

      if (selectedCompanyDetails && selectedCompanyDetails.id === companyId) {
        setSelectedCompanyDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      showNotification('success', `Status da empresa atualizado para "${newStatus}" com sucesso.`);
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Erro ao alterar status.');
      throw err;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open Create Company Modal
  const handleOpenCreateCompany = () => {
    setCompanyToEdit(null);
    setIsCompanyFormOpen(true);
  };

  // Open Edit Company Modal
  const handleOpenEditCompany = (company: CompanyRecord) => {
    setCompanyToEdit(company);
    setIsCompanyFormOpen(true);
  };

  // Handle Save Company (Create / Update)
  const handleSaveCompany = async (payload: CreateCompanyPayload | UpdateCompanyPayload) => {
    setIsSavingCompany(true);
    try {
      const authToken = localStorage.getItem('olyps_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      if (companyToEdit) {
        // Edit existing company
        const res = await fetch(`/api/platform/companies/${companyToEdit.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = (await res.json()) as ApiResponse<CompanyRecord>;
          if (json.success && json.data) {
            setCompanies((prev) => prev.map((c) => (c.id === companyToEdit.id ? json.data! : c)));
          }
        } else {
          // Optimistic local update
          setCompanies((prev) =>
            prev.map((c) => (c.id === companyToEdit.id ? { ...c, ...(payload as Partial<CompanyRecord>), updatedAt: new Date().toISOString() } : c))
          );
        }
        showNotification('success', `Empresa "${payload.name}" atualizada com sucesso.`);
      } else {
        // Create new company
        const res = await fetch('/api/platform/companies', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = (await res.json()) as ApiResponse<CompanyRecord>;
          if (json.success && json.data) {
            setCompanies((prev) => [json.data!, ...prev]);
          }
        } else {
          // Optimistic local create
          const newCompany: CompanyRecord = {
            id: `comp-${Date.now()}`,
            name: payload.name || 'Nova Empresa',
            legalName: payload.legalName || null,
            document: payload.document || null,
            slug: payload.slug || 'nova-empresa',
            email: payload.email || null,
            phone: payload.phone || null,
            address: payload.address || null,
            city: payload.city || null,
            state: payload.state || null,
            country: payload.country || 'Brasil',
            postalCode: payload.postalCode || null,
            stateRegistration: payload.stateRegistration || null,
            taxRegime: payload.taxRegime || 'simples_nacional',
            currency: payload.currency || 'BRL',
            timezone: payload.timezone || 'America/Sao_Paulo',
            status: payload.status || 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCompanies((prev) => [newCompany, ...prev]);
        }
        showNotification('success', `Empresa "${payload.name}" cadastrada com sucesso.`);
      }

      setIsCompanyFormOpen(false);
      setCompanyToEdit(null);
    } catch {
      showNotification('error', 'Falha ao salvar dados da empresa.');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const isSuperAdminCompaniesView =
    activeItemId === 'nav-super-admin' &&
    (activeSubItemId === 'sub-sa-companies' || !activeSubItemId);

  const isSuperAdminSubscriptionsView =
    activeItemId === 'nav-super-admin' && activeSubItemId === 'sub-sa-subscriptions';

  const isSuperAdminPlansView =
    activeItemId === 'nav-super-admin' && activeSubItemId === 'sub-sa-packages';

  const isSuperAdminCouponsView =
    (activeItemId === 'nav-super-admin' && activeSubItemId === 'sub-sa-coupons') ||
    activeNavContext.subItem?.path === '/superadmin/cupons' ||
    activeNavContext.item?.path === '/superadmin/cupons';

  const isSuperAdminCommunicatorView =
    (activeItemId === 'nav-super-admin' && activeSubItemId === 'sub-sa-communicator') ||
    activeNavContext.subItem?.path === '/superadmin/comunicador' ||
    activeNavContext.item?.path === '/superadmin/comunicador';

  const isCompanySettingsView =
    activeItemId === 'nav-settings' && activeSubItemId === 'sub-set-companies';

  const isCommercialLocationsView =
    activeItemId === 'nav-settings' && activeSubItemId === 'sub-set-locations';

  const isInvoiceSettingsView =
    (activeItemId === 'nav-settings' && activeSubItemId === 'sub-set-invoices') ||
    activeNavContext.subItem?.path === '/configuracoes/faturas' ||
    activeNavContext.item?.path === '/configuracoes/faturas' ||
    activeNavContext.subItem?.path === '/configuracoes/fatura' ||
    activeNavContext.item?.path === '/configuracoes/fatura';

  const isUsersManagementView =
    (activeItemId === 'nav-users-mgmt' && activeSubItemId === 'sub-users-list') ||
    activeNavContext.subItem?.path === '/usuarios' ||
    activeNavContext.item?.path === '/usuarios';

  const isCustomersView =
    (activeItemId === 'nav-contacts' && (activeSubItemId === 'sub-contacts-customers' || !activeSubItemId)) ||
    activeNavContext.subItem?.path === '/contatos/clientes' ||
    activeNavContext.item?.path === '/contatos/clientes';

  const isSuppliersView =
    (activeItemId === 'nav-contacts' && activeSubItemId === 'sub-contacts-suppliers') ||
    activeNavContext.subItem?.path === '/contatos/fornecedores' ||
    activeNavContext.item?.path === '/contatos/fornecedores';

  const isCustomerGroupsView =
    (activeItemId === 'nav-contacts' && activeSubItemId === 'sub-contacts-groups') ||
    activeNavContext.subItem?.path === '/contatos/grupos' ||
    activeNavContext.item?.path === '/contatos/grupos';

  const isContactImportView =
    (activeItemId === 'nav-contacts' && activeSubItemId === 'sub-contacts-import') ||
    activeNavContext.subItem?.path === '/contatos/importar' ||
    activeNavContext.item?.path === '/contatos/importar';

  // FASE 06 - Produtos Views
  const isProductsListView =
    (activeItemId === 'nav-products' && (activeSubItemId === 'sub-products-list' || !activeSubItemId)) ||
    activeNavContext.subItem?.path === '/produtos' ||
    activeNavContext.item?.path === '/produtos';

  const isProductAddView =
    (activeItemId === 'nav-products' && activeSubItemId === 'sub-products-add') ||
    activeNavContext.subItem?.path === '/produtos/adicionar' ||
    activeNavContext.item?.path === '/produtos/adicionar';

  const isProductVariationsView =
    (activeItemId === 'nav-products' && activeSubItemId === 'sub-products-variations') ||
    activeNavContext.subItem?.path === '/variation-templates' ||
    activeNavContext.item?.path === '/variation-templates' ||
    activeNavContext.subItem?.path === '/produtos/variacoes' ||
    activeNavContext.item?.path === '/produtos/variacoes';

  const isProductUnitsView =
    (activeItemId === 'nav-products' && activeSubItemId === 'sub-products-units') ||
    activeNavContext.subItem?.path === '/produtos/unidades' ||
    activeNavContext.item?.path === '/produtos/unidades';

  const isProductCategoriesView =
    (activeItemId === 'nav-products' && activeSubItemId === 'sub-products-categories') ||
    activeNavContext.subItem?.path === '/produtos/categorias' ||
    activeNavContext.item?.path === '/produtos/categorias';

  const isProductBrandsView =
    (activeItemId === 'nav-products' && activeSubItemId === 'sub-products-brands') ||
    activeNavContext.subItem?.path === '/produtos/marcas' ||
    activeNavContext.item?.path === '/produtos/marcas';

  const isProductWarrantiesView =
    (activeItemId === 'nav-products' && activeSubItemId === 'sub-products-warranties') ||
    activeNavContext.subItem?.path === '/produtos/garantias' ||
    activeNavContext.item?.path === '/produtos/garantias';

  const isProductImportView =
    (activeItemId === 'nav-products' && activeSubItemId === 'sub-products-import') ||
    activeNavContext.subItem?.path === '/produtos/importar' ||
    activeNavContext.item?.path === '/produtos/importar';

  const isRepairBrandsView =
    (activeItemId === 'nav-repair' && activeSubItemId === 'sub-repair-brands') ||
    activeNavContext.subItem?.path === '/reparos/marcas' ||
    activeNavContext.subItem?.path === '/repair/brands' ||
    activeNavContext.item?.path === '/reparos/marcas' ||
    activeNavContext.item?.path === '/repair/brands';

  const isRepairSettingsView =
    (activeItemId === 'nav-repair' && activeSubItemId === 'sub-repair-settings') ||
    activeNavContext.subItem?.path === '/reparos/configuracoes' ||
    activeNavContext.subItem?.path === '/repair/repair-settings' ||
    activeNavContext.item?.path === '/reparos/configuracoes' ||
    activeNavContext.item?.path === '/repair/repair-settings';

  const isRepairJobSheetsView =
    !isRepairBrandsView &&
    !isRepairSettingsView &&
    ((activeItemId === 'nav-repair' && activeSubItemId === 'sub-repair-worksheets') ||
      (activeItemId === 'nav-repair' && activeSubItemId === 'sub-repair-add-worksheet') ||
      activeNavContext.subItem?.path === '/reparos/folha-de-trabalho' ||
      activeNavContext.subItem?.path === '/reparos/adicionar-folha' ||
      (activeItemId === 'nav-repair' && !activeSubItemId && activeNavContext.subItem?.path !== '/reparos/configuracoes'));

  const isCreatePurchaseView =
    (activeItemId === 'nav-purchases' && activeSubItemId === 'sub-purchases-add') ||
    activeNavContext.subItem?.path === '/compras/adicionar' ||
    activeNavContext.item?.path === '/compras/adicionar';

  const isPurchasesListView =
    (activeItemId === 'nav-purchases' && (activeSubItemId === 'sub-purchases-list' || !activeSubItemId)) ||
    activeNavContext.subItem?.path === '/compras' ||
    activeNavContext.item?.path === '/compras' ||
    activeNavContext.subItem?.path === '/purchases' ||
    activeNavContext.item?.path === '/purchases';

  const isPurchaseReturnsView =
    (activeItemId === 'nav-purchases' && activeSubItemId === 'sub-purchases-returns') ||
    activeNavContext.subItem?.path === '/compras/retorno' ||
    activeNavContext.item?.path === '/compras/retorno' ||
    activeNavContext.subItem?.path === '/purchase-return' ||
    activeNavContext.item?.path === '/purchase-return';

  const isCreateSellView =
    (activeItemId === 'nav-sales' && activeSubItemId === 'sub-sales-add') ||
    activeNavContext.subItem?.path === '/vendas/adicionar' ||
    activeNavContext.item?.path === '/vendas/adicionar' ||
    activeNavContext.subItem?.path === '/sells/create' ||
    activeNavContext.item?.path === '/sells/create';

  const isSellsListView =
    (activeItemId === 'nav-sales' && (activeSubItemId === 'sub-sales-all' || !activeSubItemId)) ||
    activeNavContext.subItem?.path === '/vendas' ||
    activeNavContext.item?.path === '/vendas' ||
    activeNavContext.subItem?.path === '/sells' ||
    activeNavContext.item?.path === '/sells';

  const isPOSCreateView =
    (activeItemId === 'nav-sales' && activeSubItemId === 'sub-sales-pos') ||
    activeNavContext.subItem?.path === '/vendas/pos' ||
    activeNavContext.item?.path === '/vendas/pos' ||
    activeNavContext.subItem?.path === '/pos/create' ||
    activeNavContext.item?.path === '/pos/create' ||
    activeNavContext.subItem?.path === '/pdv/create' ||
    activeNavContext.item?.path === '/pdv/create' ||
    activeNavContext.subItem?.path === '/pdv' ||
    activeNavContext.item?.path === '/pdv' ||
    window.location.hash === '#/pdv/create' ||
    window.location.hash === '#/pdv' ||
    window.location.hash === '#/pos/create' ||
    window.location.hash === '#/pos';

  const isPOSListView =
    (activeItemId === 'nav-sales' && activeSubItemId === 'sub-sales-pos-list') ||
    activeNavContext.subItem?.path === '/vendas/pos-lista' ||
    activeNavContext.item?.path === '/vendas/pos-lista' ||
    activeNavContext.subItem?.path === '/pdv/lista' ||
    activeNavContext.item?.path === '/pdv/lista' ||
    activeNavContext.subItem?.path === '/pos-lista' ||
    activeNavContext.item?.path === '/pos-lista' ||
    activeNavContext.subItem?.path === '/pos' ||
    activeNavContext.item?.path === '/pos';

  const isDraftCreateView =
    (activeItemId === 'nav-sales' && activeSubItemId === 'sub-sales-drafts') ||
    activeNavContext.subItem?.path === '/vendas/rascunho' ||
    activeNavContext.item?.path === '/vendas/rascunho' ||
    activeNavContext.subItem?.path === '/sells/create?status=draft' ||
    activeNavContext.item?.path === '/sells/create?status=draft' ||
    window.location.hash.includes('status=draft');

  const [repairViewMode, setRepairViewMode] = useState<'list' | 'dashboard'>('list');

  // Find active tenant company ID
  const activeCompanyRecord = companies.find((c) => c.name === activeCompanyName);
  const currentCompanyId = activeCompanyRecord?.id || '550e8400-e29b-41d4-a716-446655440001';

  // Active Company Subscription State & Vigência
  const [activeCompanySubscription, setActiveCompanySubscription] = useState<CompanySubscriptionSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!currentCompanyId) return;

    const loadCompanySubscription = async () => {
      try {
        const authToken = localStorage.getItem('olyps_auth_token') || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-company-id': currentCompanyId,
        };
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const res = await fetch(`/api/companies/${currentCompanyId}/subscription`, { headers });
        if (res.ok && isMounted) {
          const resData = (await res.json()) as ApiResponse<CompanySubscriptionSummary>;
          if (resData.success && resData.data) {
            setActiveCompanySubscription(resData.data);
          }
        }
      } catch (err) {
        console.warn('[WARN] Falha ao consultar assinatura da empresa:', err);
      }
    };

    loadCompanySubscription();

    return () => {
      isMounted = false;
    };
  }, [currentCompanyId]);

  // Compatibility rule: if reparar !== false, it is enabled. Super Admin always sees everything.
  const hasRepairModule = useMemo(() => {
    if (isPlatformAdmin) return true;
    if (!activeCompanySubscription?.limits) return true;
    return activeCompanySubscription.limits.reparar !== false;
  }, [isPlatformAdmin, activeCompanySubscription]);

  const isRepairRoute =
    activeItemId === 'nav-repair' ||
    activeNavContext.item?.id === 'nav-repair' ||
    Boolean(activeNavContext.subItem?.path?.startsWith('/reparos')) ||
    Boolean(activeNavContext.subItem?.path?.startsWith('/repair')) ||
    Boolean(activeNavContext.item?.path?.startsWith('/reparos')) ||
    Boolean(activeNavContext.item?.path?.startsWith('/repair'));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-row overflow-hidden">
      {/* 1. App Navigation Sidebar */}
      <AppSidebar
        sections={OFFICIAL_NAVIGATION_CONFIG}
        activeItemId={activeItemId}
        activeSubItemId={activeSubItemId}
        expandedGroups={expandedGroups}
        isCollapsed={isCollapsed}
        userRole={userRole}
        isPlatformAdmin={isPlatformAdmin}
        hasRepairModule={hasRepairModule}
        activeCompanyName={activeCompanyName}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        onToggleGroup={handleToggleGroup}
        onSelectMainItem={handleSelectMainItem}
        onSelectSubItem={handleSelectSubItem}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Header with Breadcrumbs & Context Control */}
        <AppHeader
          breadcrumb={activeNavContext.breadcrumb}
          isCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed((prev) => !prev)}
          userRole={userRole}
          onChangeUserRole={setUserRole}
          isPlatformAdmin={isPlatformAdmin}
          onTogglePlatformAdmin={() => setIsPlatformAdmin((prev) => !prev)}
          activeCompanyName={activeCompanyName}
          onChangeCompany={setActiveCompanyName}
          availableCompanies={MOCK_COMPANIES.map((c) => c.name)}
          isLoading={isLoading}
          onRefresh={fetchData}
          onNavigate={handleNavigateByPath}
          onShowNotification={showNotification}
        />

        {/* Dynamic Main Content Container */}
        <main className={`flex-1 w-full mx-auto ${isPOSCreateView ? 'p-0 max-w-none' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6'}`}>
          {/* Notification Alert */}
          {feedback && !isPOSCreateView && (
            <div
              id="platform-feedback-alert"
              className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium transition-all ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border-red-500 text-red-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                id="btn-close-platform-alert"
                type="button"
                onClick={() => setFeedback(null)}
                title="Fechar notificação"
                className={`p-1 rounded transition-colors cursor-pointer ${
                  feedback.type === 'success'
                    ? 'text-emerald-700 hover:bg-emerald-100'
                    : 'text-red-700 hover:bg-red-100'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <ErrorBoundary>
            {isSuperAdminCompaniesView ? (
            <>
              {/* Global Platform Overview Section */}
              <section id="dashboard-summary-section">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Super Admin &bull; Indicadores Globais da Plataforma
                    </h2>
                    <p className="text-xs text-slate-500">
                      Métricas consolidadas de empresas, acessos e governança de instâncias OLYPS PRO
                    </p>
                  </div>
                </div>
                <DashboardSummaryCards summary={summary} isLoading={isLoading} />
              </section>

              {/* Global Companies Management Section */}
              <section id="companies-management-section" className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Todas as Empresas
                    </h2>
                    <p className="text-xs text-slate-500">
                      Consulta, auditoria e controle administrativo de status de tenants
                    </p>
                  </div>
                </div>

                <CompaniesTable
                  companies={companies}
                  pagination={pagination}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSearchChange={setSearchQuery}
                  onStatusFilterChange={setStatusFilter}
                  onSortChange={setSortBy}
                  onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                  onViewDetails={handleViewDetails}
                  onChangeStatus={handleChangeStatus}
                  onCreateCompany={handleOpenCreateCompany}
                  onEditCompany={handleOpenEditCompany}
                />
              </section>
            </>
          ) : isSuperAdminSubscriptionsView ? (
            /* 04.4 Assinaturas de Pacote Super Admin */
            <SubscriptionsView
              companies={companies}
              onShowNotification={showNotification}
            />
          ) : isSuperAdminPlansView ? (
            /* 04.4 Gestão de Planos Comerciais Super Admin */
            <SubscriptionPlansView
              onShowNotification={showNotification}
            />
          ) : isSuperAdminCouponsView ? (
            /* FASE 05.3 Gestão de Cupons e Descontos Super Admin */
            <CouponsManagementView
              onShowNotification={showNotification}
            />
          ) : isSuperAdminCommunicatorView ? (
            /* FASE 05.4 Comunicador Global do Super Admin */
            <AnnouncementsManagementView
              onShowNotification={showNotification}
            />
          ) : isCompanySettingsView ? (
            /* 03.4 Dados da Empresa View */
            <CompanySettingsView
              companyId={currentCompanyId}
              activeCompanyName={activeCompanyName}
              userRole={userRole}
              isPlatformAdmin={isPlatformAdmin}
              onShowNotification={showNotification}
            />
          ) : isCommercialLocationsView ? (
            /* 03.5 Locais Comerciais View */
            <CommercialLocationsView
              companyId={currentCompanyId}
              activeCompanyName={activeCompanyName}
              userRole={userRole}
              isPlatformAdmin={isPlatformAdmin}
              onShowNotification={showNotification}
            />
          ) : isInvoiceSettingsView ? (
            /* Configurações de Fatura e PIX View */
            <InvoiceSettings
              companyId={currentCompanyId}
              onShowNotification={showNotification}
            />
          ) : isUsersManagementView ? (
            /* 05.1 Gestão de Usuários da Empresa View */
            <UsersManagementView
              companyId={currentCompanyId}
              activeCompanyName={activeCompanyName}
              userRole={userRole}
              isPlatformAdmin={isPlatformAdmin}
              onShowNotification={showNotification}
            />
          ) : isCustomersView ? (
            /* 05.2 Base de Clientes */
            <CustomersView
              companyId={currentCompanyId}
              activeCompanyName={activeCompanyName}
              userRole={userRole}
              isPlatformAdmin={isPlatformAdmin}
              onShowNotification={showNotification}
            />
          ) : isSuppliersView ? (
            /* 05.2 Base de Fornecedores */
            <SuppliersView
              companyId={currentCompanyId}
              activeCompanyName={activeCompanyName}
              userRole={userRole}
              isPlatformAdmin={isPlatformAdmin}
              onShowNotification={showNotification}
            />
          ) : isCustomerGroupsView ? (
            /* 05.2 Grupos de Clientes */
            <CustomerGroupsView
              companyId={currentCompanyId}
              activeCompanyName={activeCompanyName}
              userRole={userRole}
              isPlatformAdmin={isPlatformAdmin}
              onShowNotification={showNotification}
            />
          ) : isContactImportView ? (
            /* 05.2 Importação de Contatos em Lote */
            <ContactImportView
              companyId={currentCompanyId}
              activeCompanyName={activeCompanyName}
              userRole={userRole}
              isPlatformAdmin={isPlatformAdmin}
              onShowNotification={showNotification}
            />
          ) : isProductsListView ? (
            /* FASE 06 - Lista de Produtos */
            <ProductsListView
              companyId={currentCompanyId}
              initialAddModalOpen={false}
            />
          ) : isProductAddView ? (
            /* FASE 06 - Adicionar Produto (Abertura Direta do Formulário Oficial) */
            <ProductsListView
              companyId={currentCompanyId}
              initialAddModalOpen={true}
            />
          ) : isProductVariationsView ? (
            /* FASE 06 - Variações & Grades de Produtos */
            <VariationsView
              companyId={currentCompanyId}
              onShowNotification={showNotification}
            />
          ) : isProductUnitsView ? (
            /* FASE 06 - Unidades de Medida */
            <UnitsView
              companyId={currentCompanyId}
            />
          ) : isProductCategoriesView ? (
            /* FASE 06 - Categorias de Produtos */
            <CategoriesView
              companyId={currentCompanyId}
            />
          ) : isProductBrandsView ? (
            /* FASE 06 - Marcas & Fabricantes */
            <BrandsView
              companyId={currentCompanyId}
            />
          ) : isProductWarrantiesView ? (
            /* FASE 06 - Garantias de Produtos */
            <WarrantiesView
              companyId={currentCompanyId}
              onShowNotification={showNotification}
            />
          ) : isProductImportView ? (
            /* FASE 06 - Importação de Produtos (37 Colunas) */
            <ProductImportView
              companyId={currentCompanyId}
              activeCompanyName={activeCompanyName}
              onNavigate={handleNavigateByPath}
              onShowNotification={showNotification}
            />
          ) : !isPlatformAdmin && !hasRepairModule && isRepairRoute ? (
            /* Recurso Bloqueado por Plano (Reparos Desabilitado) */
            <div
              id="repair-module-blocked-card"
              className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4"
            >
              <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Recurso não incluído no seu plano
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  O módulo Reparar não está disponível no plano atual da sua empresa. Entre em contato com o suporte ou faça upgrade do seu plano.
                </p>
              </div>
              <div className="pt-3 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleNavigateByPath('/dashboard')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Voltar ao Painel
                </button>
              </div>
            </div>
          ) : isRepairBrandsView ? (
            /* Módulo 05 — Marcas de Reparo (Sincronizado com Produtos) */
            <RepairBrands companyId={currentCompanyId} />
          ) : isRepairSettingsView ? (
            /* Módulo 05 — Configurações de Reparo */
            <RepairSettings
              companyId={currentCompanyId}
              onBackToWorksheets={() => {
                handleNavigateByPath('/reparos/folha-de-trabalho');
                setRepairViewMode('list');
              }}
              onBackToDashboard={() => {
                handleNavigateByPath('/reparos/folha-de-trabalho');
                setRepairViewMode('dashboard');
              }}
            />
          ) : isRepairJobSheetsView ? (
            /* Módulo 05 — Reparar & Ordens de Serviço */
            repairViewMode === 'dashboard' ? (
              <RepairDashboard
                companyId={currentCompanyId}
                activeCompanyName={activeCompanyName}
                onNewJobSheet={() => setRepairViewMode('list')}
                onViewAllJobSheets={() => setRepairViewMode('list')}
              />
            ) : (
              <JobSheetList
                companyId={currentCompanyId}
                activeCompanyName={activeCompanyName}
                onOpenDashboard={() => setRepairViewMode('dashboard')}
                onOpenSettings={() => handleNavigateByPath('/reparos/configuracoes')}
                onShowNotification={showNotification}
              />
            )
          ) : isCreatePurchaseView ? (
            /* Módulo 06 — Adicionar Compra */
            <CreatePurchase
              companyId={currentCompanyId}
              onBack={() => handleNavigateByPath('/compras')}
              onShowNotification={showNotification}
            />
          ) : isPurchasesListView ? (
            /* Módulo 06 — Lista de Compras */
            <PurchaseList
              companyId={currentCompanyId}
              onNavigateToCreate={() => handleNavigateByPath('/compras/adicionar')}
              onNavigateToReturn={() => handleNavigateByPath('/compras/retorno')}
              onShowNotification={showNotification}
            />
          ) : isPurchaseReturnsView ? (
            /* Módulo 06 — Lista de Retorno de Compras */
            <PurchaseReturnList
              companyId={currentCompanyId}
              onShowNotification={showNotification}
            />
          ) : isPOSCreateView ? (
            /* Módulo 07 — Terminal de POS (Ponto de Venda) */
            <POSCreate
              companyId={currentCompanyId}
              onNavigateBack={() => handleNavigateByPath('/vendas/pos-lista')}
              onNavigate={handleNavigateByPath}
              onShowNotification={showNotification}
            />
          ) : isPOSListView ? (
            /* Módulo 07 — Lista de POS */
            <POSList
              companyId={currentCompanyId}
              onNavigateToCreate={() => handleNavigateByPath('/vendas/pos')}
              onShowNotification={showNotification}
            />
          ) : isDraftCreateView ? (
            /* Módulo 07 — Adicionar Rascunho */
            <DraftCreate
              companyId={currentCompanyId}
              onNavigateToList={() => handleNavigateByPath('/vendas')}
              onShowNotification={showNotification}
            />
          ) : isCreateSellView ? (
            /* Módulo 07 — Adicionar Venda */
            <SellCreate
              companyId={currentCompanyId}
              onNavigateToList={() => handleNavigateByPath('/vendas')}
              onShowNotification={showNotification}
            />
          ) : isSellsListView ? (
            /* Módulo 07 — Todas as Vendas */
            <SellList
              companyId={currentCompanyId}
              onNavigateToAdd={() => handleNavigateByPath('/vendas/adicionar')}
              onShowNotification={showNotification}
            />
          ) : (
            /* Operational Module Workspace View */
            <ModulePlaceholderView
              item={activeNavContext.item}
              subItem={activeNavContext.subItem}
              userRole={userRole}
              activeCompanyName={activeCompanyName}
              isPlatformAdmin={isPlatformAdmin}
              onNavigate={handleNavigateByPath}
              onShowNotification={showNotification}
            />
          )}
          </ErrorBoundary>
        </main>

        {/* Modals */}
        <CompanyFormModal
          isOpen={isCompanyFormOpen}
          onClose={() => {
            setIsCompanyFormOpen(false);
            setCompanyToEdit(null);
          }}
          onSave={handleSaveCompany}
          companyToEdit={companyToEdit}
          isSaving={isSavingCompany}
        />

        <CompanyDetailsModal
          details={selectedCompanyDetails}
          isLoading={isLoadingDetails}
          onClose={() => setSelectedCompanyDetails(null)}
          onChangeStatusFromModal={(companyId) => {
            const comp = companies.find((c) => c.id === companyId);
            if (comp) {
              handleChangeStatus(comp);
            }
          }}
        />

        <ChangeStatusModal
          company={companyForStatusChange}
          isOpen={Boolean(companyForStatusChange)}
          isUpdating={isUpdatingStatus}
          onClose={() => setCompanyForStatusChange(null)}
          onConfirm={handleConfirmStatusChange}
        />

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">OLYPS PRO</span>
              <span>&bull;</span>
              <span>Fase 02.9 &mdash; Auditoria de Funcionalidade, Navegação e Componentes Globais</span>
            </div>
            <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>13 Módulos &bull; DataTable Global &bull; RBAC Ativo</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
