import type { UUID } from './index.js';
import type { Brand as CoreProductBrand } from './product.types.js';

// Product Brand referenced in Repair module
export type ProductBrandReference = CoreProductBrand;

export interface ProductBrand {
  id: string;
  name: string;
  status?: string;
  active?: boolean;
  description?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type JobSheetStatus =
  | 'pending'
  | 'in_progress'
  | 'waiting_parts'
  | 'approved'
  | 'completed'
  | 'cancelled'
  | 'delivered';

export type JobSheetPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface JobSheet {
  id: UUID;
  companyId: UUID;
  jobSheetNumber: string; // Ex: OS-2026-001
  number?: string; // Alias for jobSheetNumber
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerDocument?: string;
  deviceType: string; // Ex: Smartphone, Notebook, Console, Tablet
  brand: string; // Ex: Apple, Samsung, Dell
  brandId?: string;
  brandName?: string;
  model: string; // Ex: iPhone 15 Pro, Galaxy S24
  serialNumber?: string;
  color?: string;
  devicePassword?: string;
  accessories?: string; // Carregador, capa, etc.
  reportedDefect: string;
  technicalDiagnosis?: string;
  solutionApplied?: string;
  technicianName?: string;
  responsibleTechnician?: string;
  status: JobSheetStatus;
  statusId?: string;
  priority: JobSheetPriority;
  estimatedCostCents: number;
  finalCostCents: number;
  finalValue?: number;
  partsCostCents?: number;
  laborCostCents?: number;
  warrantyDays?: number;
  checklist?: ChecklistItem[];
  notes?: string;
  deliveryDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobSheetFormState {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerDocument?: string;
  deviceType: string;
  brandId: string;
  brandName: string;
  model: string;
  serialNumber?: string;
  color?: string;
  devicePassword?: string;
  accessories?: string;
  reportedDefect: string;
  technicalDiagnosis?: string;
  responsibleTechnician?: string;
  priority: JobSheetPriority | string;
  finalValue: number;
  statusId: string;
  notes?: string;
}

export interface NewJobSheetData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerDocument?: string;
  deviceType: string;
  brand?: string;
  brandId?: string;
  brandName?: string;
  model: string;
  serialNumber?: string;
  color?: string;
  devicePassword?: string;
  accessories?: string;
  reportedDefect: string;
  technicalDiagnosis?: string;
  technicianName?: string;
  responsibleTechnician?: string;
  priority: JobSheetPriority | string;
  status?: JobSheetStatus;
  statusId?: string;
  finalValue?: number;
  finalCostCents?: number;
  estimatedCostCents?: number;
  partsCostCents?: number;
  laborCostCents?: number;
  warrantyDays?: number;
  companyId?: string;
  notes?: string;
}

export interface CreateJobSheetPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerDocument?: string;
  deviceType: string;
  brand?: string;
  brandId?: string;
  brandName?: string;
  model: string;
  serialNumber?: string;
  color?: string;
  devicePassword?: string;
  accessories?: string;
  reportedDefect: string;
  technicalDiagnosis?: string;
  technicianName?: string;
  responsibleTechnician?: string;
  priority?: JobSheetPriority;
  status?: JobSheetStatus;
  statusId?: string;
  estimatedCostCents?: number;
  finalCostCents?: number;
  finalValue?: number;
  partsCostCents?: number;
  laborCostCents?: number;
  warrantyDays?: number;
  notes?: string;
}

export interface UpdateJobSheetPayload extends Partial<CreateJobSheetPayload> {
  solutionApplied?: string;
  deliveryDate?: string | null;
}

export interface RepairStatusMetric {
  status: JobSheetStatus;
  label: string;
  count: number;
  percentage: number;
  totalCostCents: number;
}

export interface RepairDashboardSummary {
  totalJobSheets: number;
  pendingCount: number;
  inProgressCount: number;
  waitingPartsCount: number;
  completedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  totalRevenueCents: number;
  avgTicketCents: number;
  statusMetrics: RepairStatusMetric[];
}

export interface BrandTrendData {
  brand: string;
  count: number;
  revenueCents: number;
  percentage: number;
}

export interface DeviceTrendData {
  deviceType: string;
  count: number;
  percentage: number;
}

export interface ModelTrendData {
  model: string;
  brand: string;
  count: number;
  percentage: number;
}

export interface JobSheetFilterState {
  status: JobSheetStatus | 'all';
  priority: JobSheetPriority | 'all';
  brand: string;
  deviceType: string;
  search: string;
  startDate?: string;
  endDate?: string;
}

// ==============================================================================
// CONFIGURAÇÕES DO MÓDULO DE REPAROS
// ==============================================================================

// Status de OS
export interface RepairStatus {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  emoji?: string;
}

// Modelo de dispositivo
export interface DeviceModel {
  id: string;
  modelName: string;
  deviceType: string; // Smartphone, Tablet, Notebook, etc.
  brand: string;
  repairChecklist: string[]; // Lista de verificações
}

// Configurações gerais de reparo
export interface RepairSettings {
  defaultStatusId: string;
  workOrderPrefix: string;
  defaultRepairChecklist: string;
  productConfiguration: string;
  customerReportedProblem: string;
  productCondition: string;
  termsAndConditions: string;
}

// Configurações de Label (Etiqueta Térmica / PDF)
export interface LabelSettings {
  labelWidthMM: number;
  labelHeightMM: number;
  customerInfo: {
    name: boolean;
    address: boolean;
    phone: boolean;
    alternatePhone: boolean;
    email: boolean;
  };
  labelDetails: {
    salesPerson: boolean;
    barcode: boolean;
    status: boolean;
    dueDate: boolean;
  };
  labelInformation: {
    technician: boolean;
    problem: boolean;
  };
  deviceInfo: {
    imeiSerial: boolean;
    brandModel: boolean;
    location: boolean;
    password: boolean;
  };
}

// Configurações completas do módulo
export interface RepairModuleSettings {
  statuses: RepairStatus[];
  deviceModels: DeviceModel[];
  general: RepairSettings;
  label: LabelSettings;
}

// ============================================
// MARCAS SINCRONIZADAS (REPARAR <-> PRODUTOS)
// ============================================
export interface RepairBrand {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive';
  syncedFromProducts: boolean; // true se veio de Produtos
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BrandFormData {
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive';
}

export interface BrandSync {
  brandId: string;
  syncedAt: string;
  source: 'products' | 'repair';
}
