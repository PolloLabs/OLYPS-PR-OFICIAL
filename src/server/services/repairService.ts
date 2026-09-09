import type { UUID } from '../../types/index.js';
import { ProductService } from './productService.js';
import type {
  JobSheet,
  CreateJobSheetPayload,
  UpdateJobSheetPayload,
  RepairDashboardSummary,
  BrandTrendData,
  DeviceTrendData,
  ModelTrendData,
  JobSheetStatus,
  JobSheetPriority,
  RepairStatusMetric,
  RepairStatus,
  DeviceModel,
  RepairSettings,
  LabelSettings,
  RepairModuleSettings,
  ProductBrand,
  NewJobSheetData,
  JobSheetFormState,
} from '../../types/repair.types.js';

// Status labels mapping
const STATUS_LABELS: Record<JobSheetStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento / Bancada',
  waiting_parts: 'Aguardando Peças',
  approved: 'Orçamento Aprovado',
  completed: 'Reparo Concluído',
  cancelled: 'Cancelado',
  delivered: 'Entregue ao Cliente',
};

// Initial realistic seed data for development
const INITIAL_JOB_SHEETS: JobSheet[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    jobSheetNumber: 'OS-2026-001',
    customerId: 'cust-1',
    customerName: 'Carlos Eduardo Mendes',
    customerPhone: '(11) 98765-4321',
    customerEmail: 'carlos.mendes@email.com',
    deviceType: 'Smartphone',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    serialNumber: 'DN6ZQ9Y80D',
    color: 'Titânio Natural',
    accessories: 'Capa transparente, película quebrada',
    reportedDefect: 'Display trincado após queda; touch com falhas no canto superior direito.',
    technicalDiagnosis: 'Necessária troca do módulo frontal OLED original e calibração do Face ID.',
    technicianName: 'Rodrigo Alves',
    status: 'in_progress',
    priority: 'urgent',
    estimatedCostCents: 189000,
    finalCostCents: 189000,
    partsCostCents: 120000,
    laborCostCents: 69000,
    warrantyDays: 90,
    notes: 'Cliente solicitou urgência para retirada no mesmo dia.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    jobSheetNumber: 'OS-2026-002',
    customerId: 'cust-2',
    customerName: 'Mariana Silveira Ramos',
    customerPhone: '(11) 97123-8899',
    customerEmail: 'mari.silveira@empresa.com.br',
    deviceType: 'Notebook',
    brand: 'Dell',
    model: 'Inspiron 15 3520',
    serialNumber: '8H2K9P3',
    color: 'Prata',
    accessories: 'Fonte original e mouse sem fio',
    reportedDefect: 'Superaquecimento constante, ventoinha com barulho estranho e lentidão crítica.',
    technicalDiagnosis: 'Cooler com rolamento danificado e pasta térmica ressecada. Necessária substituição e limpeza química.',
    technicianName: 'Felipe Santos',
    status: 'waiting_parts',
    priority: 'normal',
    estimatedCostCents: 38000,
    finalCostCents: 38000,
    partsCostCents: 16000,
    laborCostCents: 22000,
    warrantyDays: 90,
    notes: 'Peça solicitada ao fornecedor Dell. Previsão de chegada: amanhã.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    jobSheetNumber: 'OS-2026-003',
    customerId: 'cust-3',
    customerName: 'Lucas Ferreira Lima',
    customerPhone: '(11) 96543-2109',
    customerEmail: 'lucas.lima@tech.io',
    deviceType: 'Console',
    brand: 'Sony',
    model: 'PlayStation 5 Slim',
    serialNumber: 'CFI-2000B',
    color: 'Branco',
    accessories: 'Cabo HDMI e cabo de força',
    reportedDefect: 'Não liga após surto de energia na rede elétrica.',
    technicalDiagnosis: 'Fonte interna queimada no circuito primário (fusível e MOSFETs rompidos).',
    solutionApplied: 'Substituição completa do módulo da fonte de alimentação e testes de estresse.',
    technicianName: 'Rodrigo Alves',
    status: 'completed',
    priority: 'high',
    estimatedCostCents: 65000,
    finalCostCents: 65000,
    partsCostCents: 38000,
    laborCostCents: 27000,
    warrantyDays: 180,
    notes: 'Aparelho testado por 4 horas contínuas em jogos 4K.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    jobSheetNumber: 'OS-2026-004',
    customerId: 'cust-4',
    customerName: 'Fernanda Barbosa Costa',
    customerPhone: '(11) 95544-3322',
    customerEmail: 'fernanda.costa@advocacia.com',
    deviceType: 'Smartphone',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    serialNumber: 'R5CW30XYZ',
    color: 'Cinza Titânio',
    accessories: 'Caneta S-Pen inclusa',
    reportedDefect: 'Bateria descarrega muito rápido (menos de 3 horas) e conector USB-C esquentando.',
    technicalDiagnosis: 'Sub-placa de carga em curto e ciclo de bateria excedido (820 ciclos).',
    technicianName: 'Felipe Santos',
    status: 'pending',
    priority: 'normal',
    estimatedCostCents: 49000,
    finalCostCents: 49000,
    partsCostCents: 28000,
    laborCostCents: 21000,
    warrantyDays: 90,
    notes: 'Aguardando confirmação do cliente sobre o orçamento.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    jobSheetNumber: 'OS-2026-005',
    customerId: 'cust-5',
    customerName: 'Gabriel Nogueira Prado',
    customerPhone: '(11) 94433-2211',
    customerEmail: 'gnprado@gmail.com',
    deviceType: 'Tablet',
    brand: 'Apple',
    model: 'iPad Air 5ª Geração (M1)',
    serialNumber: 'DMPX4029Q1',
    color: 'Azul',
    accessories: 'Smart Folio case',
    reportedDefect: 'Vidro quebrado após impacto, display LCD intacto.',
    technicalDiagnosis: 'Troca do vidro / touch laminado com cola OCA.',
    solutionApplied: 'Troca efetuada com sucesso em câmara de vácuo, calibração ok.',
    technicianName: 'Rodrigo Alves',
    status: 'delivered',
    priority: 'normal',
    estimatedCostCents: 85000,
    finalCostCents: 85000,
    partsCostCents: 42000,
    laborCostCents: 43000,
    warrantyDays: 90,
    deliveryDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    jobSheetNumber: 'OS-2026-006',
    customerId: 'cust-6',
    customerName: 'Juliana Camargo Dias',
    customerPhone: '(11) 93322-1100',
    deviceType: 'Smartphone',
    brand: 'Xiaomi',
    model: 'Redmi Note 13 Pro 5G',
    color: 'Midnight Black',
    reportedDefect: 'Aparelho reiniciando em loop infinito após atualização de sistema.',
    technicalDiagnosis: 'Falha de partição de boot. Recuperação via firmware oficial EDL.',
    technicianName: 'Felipe Santos',
    status: 'completed',
    priority: 'low',
    estimatedCostCents: 22000,
    finalCostCents: 22000,
    partsCostCents: 0,
    laborCostCents: 22000,
    warrantyDays: 30,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

let JOB_SHEETS_STORE: JobSheet[] = [...INITIAL_JOB_SHEETS];
export const jobSheetsStore = new Map<string, JobSheet>();
INITIAL_JOB_SHEETS.forEach((item) => {
  jobSheetsStore.set(item.id, item);
});

// ============================================
// INTEGRAÇÃO COM MARCAS DE PRODUTOS
// ============================================

/**
 * Buscar marcas de produtos para uso em Reparar
 */
export async function getBrandsForRepair(companyId: string): Promise<ProductBrand[]> {
  const defaultBrands: ProductBrand[] = [
    { id: '1', name: 'Samsung', status: 'active', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', name: 'Apple', status: 'active', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', name: 'Motorola', status: 'active', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '4', name: 'Xiaomi', status: 'active', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '5', name: 'LG', status: 'active', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '6', name: 'Lenovo', status: 'active', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  try {
    const brands = await ProductService.listBrands(companyId as UUID);
    if (brands && brands.length > 0) {
      return brands.map((b) => ({
        id: b.id,
        name: b.name,
        status: b.active ? 'active' : 'inactive',
        active: b.active,
        description: b.description,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }));
    }
  } catch (err) {
    console.warn('Fallback to default brands in getBrandsForRepair:', err);
  }

  return defaultBrands;
}

/**
 * Gerar número sequencial da OS
 */
export async function generateJobSheetNumber(companyId: string, _statusId?: string): Promise<string> {
  const year = new Date().getFullYear();
  let prefix = 'OS';
  try {
    const settings = await getRepairSettings(companyId);
    if (settings && settings.workOrderPrefix) {
      prefix = settings.workOrderPrefix.replace(/[-_/\s]+$/, '');
    }
  } catch {
    prefix = 'OS';
  }
  const count = (JOB_SHEETS_STORE.filter((j) => j.companyId === companyId).length) + 1;
  const padded = String(count).padStart(4, '0');

  // If prefix already contains the year (e.g. 'OS-2026'), don't duplicate it
  if (prefix.includes(String(year))) {
    return `${prefix}-${padded}`;
  }
  return `${prefix}-${year}-${padded}`;
}

/**
 * Criar nova Job Sheet/OS com marca vinculada
 */
export async function createJobSheet(
  companyId: string,
  data: NewJobSheetData | CreateJobSheetPayload
): Promise<JobSheet> {
  // Validações
  if (!data.customerName || !data.customerPhone) {
    throw new Error('Nome e telefone do cliente são obrigatórios');
  }

  const brandName = data.brandName || data.brand;
  if (!data.brandId && !brandName) {
    throw new Error('Marca é obrigatória');
  }

  if (!data.model) {
    throw new Error('Modelo é obrigatório');
  }

  if (!data.reportedDefect) {
    throw new Error('Defeito relatado é obrigatório');
  }

  // Gerar número da OS
  const statusId = data.statusId || (data.status as string) || 'pending';
  const jobSheetNumber = await generateJobSheetNumber(companyId, statusId);

  const validStatus: JobSheetStatus = (
    ['pending', 'in_progress', 'waiting_parts', 'approved', 'completed', 'cancelled', 'delivered'].includes(statusId)
      ? statusId
      : 'pending'
  ) as JobSheetStatus;

  const finalCostCents = data.finalValue !== undefined
    ? Math.round(Number(data.finalValue) * 100)
    : (data.finalCostCents || data.estimatedCostCents || 0);

  const finalValue = data.finalValue !== undefined
    ? Number(data.finalValue)
    : (finalCostCents / 100);

  // Criar Job Sheet
  const newJobSheet: JobSheet = {
    id: crypto.randomUUID() as UUID,
    companyId: companyId as UUID,
    jobSheetNumber,
    number: jobSheetNumber,
    customerId: `cust-${Date.now()}`,
    customerName: data.customerName.trim(),
    customerPhone: data.customerPhone.trim(),
    customerEmail: data.customerEmail?.trim(),
    customerDocument: data.customerDocument?.trim(),
    deviceType: (data.deviceType || 'Smartphone').trim(),
    brand: (brandName || '').trim(),
    brandId: data.brandId,
    brandName: (brandName || '').trim(),
    model: data.model.trim(),
    serialNumber: data.serialNumber?.trim(),
    color: data.color?.trim(),
    devicePassword: data.devicePassword?.trim(),
    accessories: data.accessories?.trim(),
    reportedDefect: data.reportedDefect.trim(),
    technicalDiagnosis: data.technicalDiagnosis?.trim() || '',
    responsibleTechnician: (data.responsibleTechnician || (data as any).technicianName || '').trim(),
    technicianName: (data.responsibleTechnician || (data as any).technicianName || '').trim(),
    priority: (data.priority as JobSheetPriority) || 'normal',
    status: validStatus,
    statusId,
    estimatedCostCents: data.estimatedCostCents || finalCostCents,
    finalCostCents,
    finalValue,
    partsCostCents: data.partsCostCents || 0,
    laborCostCents: data.laborCostCents || 0,
    warrantyDays: data.warrantyDays !== undefined ? data.warrantyDays : 90,
    notes: data.notes?.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Persistir em memory store
  jobSheetsStore.set(newJobSheet.id, newJobSheet);
  JOB_SHEETS_STORE.unshift(newJobSheet);

  return newJobSheet;
}

export class RepairService {
  /**
   * Buscar marcas de produtos para uso em Reparar
   */
  public static async getBrandsForRepair(companyId: string): Promise<ProductBrand[]> {
    return getBrandsForRepair(companyId);
  }

  /**
   * Gerar número sequencial da OS
   */
  public static async generateJobSheetNumber(companyId: string, statusId?: string): Promise<string> {
    return generateJobSheetNumber(companyId, statusId);
  }
  /**
   * List all JobSheets for a company with optional filters
   */
  public static async listJobSheets(
    companyId: UUID,
    filters?: {
      status?: string;
      priority?: string;
      brand?: string;
      deviceType?: string;
      search?: string;
    }
  ): Promise<JobSheet[]> {
    let items = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);

    if (filters?.status && filters.status !== 'all') {
      items = items.filter((j) => j.status === filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      items = items.filter((j) => j.priority === filters.priority);
    }
    if (filters?.brand && filters.brand !== 'all') {
      items = items.filter((j) => j.brand.toLowerCase() === filters.brand?.toLowerCase());
    }
    if (filters?.deviceType && filters.deviceType !== 'all') {
      items = items.filter((j) => j.deviceType.toLowerCase() === filters.deviceType?.toLowerCase());
    }
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (j) =>
          j.jobSheetNumber.toLowerCase().includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          j.customerPhone.includes(q) ||
          j.model.toLowerCase().includes(q) ||
          j.brand.toLowerCase().includes(q) ||
          j.reportedDefect.toLowerCase().includes(q)
      );
    }

    // Sort by latest updated/created
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get single JobSheet by ID
   */
  public static async getJobSheetById(companyId: UUID, id: UUID): Promise<JobSheet | null> {
    return JOB_SHEETS_STORE.find((j) => j.companyId === companyId && j.id === id) || null;
  }

  /**
   * Create a new JobSheet
   */
  public static async createJobSheet(
    companyId: UUID,
    payload: CreateJobSheetPayload | NewJobSheetData
  ): Promise<JobSheet> {
    return createJobSheet(companyId, payload);
  }

  /**
   * Update an existing JobSheet
   */
  public static async updateJobSheet(
    companyId: UUID,
    id: UUID,
    payload: UpdateJobSheetPayload
  ): Promise<JobSheet | null> {
    const index = JOB_SHEETS_STORE.findIndex((j) => j.companyId === companyId && j.id === id);
    if (index === -1) return null;

    const current = JOB_SHEETS_STORE[index];
    const updated: JobSheet = {
      ...current,
      customerName: payload.customerName !== undefined ? payload.customerName.trim() : current.customerName,
      customerPhone: payload.customerPhone !== undefined ? payload.customerPhone.trim() : current.customerPhone,
      customerEmail: payload.customerEmail !== undefined ? payload.customerEmail?.trim() : current.customerEmail,
      deviceType: payload.deviceType !== undefined ? payload.deviceType.trim() : current.deviceType,
      brand: payload.brand !== undefined ? payload.brand.trim() : current.brand,
      brandId: payload.brandId !== undefined ? payload.brandId : current.brandId,
      brandName: payload.brandName !== undefined ? payload.brandName : current.brandName,
      model: payload.model !== undefined ? payload.model.trim() : current.model,
      serialNumber: payload.serialNumber !== undefined ? payload.serialNumber?.trim() : current.serialNumber,
      reportedDefect: payload.reportedDefect !== undefined ? payload.reportedDefect.trim() : current.reportedDefect,
      technicalDiagnosis: payload.technicalDiagnosis !== undefined ? payload.technicalDiagnosis?.trim() : current.technicalDiagnosis,
      solutionApplied: payload.solutionApplied !== undefined ? payload.solutionApplied?.trim() : current.solutionApplied,
      technicianName: payload.technicianName !== undefined ? payload.technicianName?.trim() : current.technicianName,
      responsibleTechnician: payload.responsibleTechnician !== undefined ? payload.responsibleTechnician?.trim() : (payload.technicianName || current.responsibleTechnician),
      status: payload.status !== undefined ? payload.status : current.status,
      priority: payload.priority !== undefined ? payload.priority : current.priority,
      estimatedCostCents: payload.estimatedCostCents !== undefined ? payload.estimatedCostCents : current.estimatedCostCents,
      finalCostCents: payload.finalCostCents !== undefined ? payload.finalCostCents : current.finalCostCents,
      finalValue: payload.finalValue !== undefined ? payload.finalValue : (payload.finalCostCents ? payload.finalCostCents / 100 : current.finalValue),
      partsCostCents: payload.partsCostCents !== undefined ? payload.partsCostCents : current.partsCostCents,
      laborCostCents: payload.laborCostCents !== undefined ? payload.laborCostCents : current.laborCostCents,
      warrantyDays: payload.warrantyDays !== undefined ? payload.warrantyDays : current.warrantyDays,
      notes: payload.notes !== undefined ? payload.notes?.trim() : current.notes,
      deliveryDate: payload.deliveryDate !== undefined ? payload.deliveryDate : current.deliveryDate,
      updatedAt: new Date().toISOString(),
    };

    JOB_SHEETS_STORE[index] = updated;
    jobSheetsStore.set(updated.id, updated);
    return updated;
  }

  /**
   * Delete a JobSheet
   */
  public static async deleteJobSheet(companyId: UUID, id: UUID): Promise<boolean> {
    const before = JOB_SHEETS_STORE.length;
    JOB_SHEETS_STORE = JOB_SHEETS_STORE.filter((j) => !(j.companyId === companyId && j.id === id));
    jobSheetsStore.delete(id);
    return JOB_SHEETS_STORE.length < before;
  }

  /**
   * Analytics Summary
   */
  public static async getAnalyticsSummary(companyId: UUID): Promise<RepairDashboardSummary> {
    const companySheets = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    const total = companySheets.length;

    let pendingCount = 0;
    let inProgressCount = 0;
    let waitingPartsCount = 0;
    let completedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let totalRevenueCents = 0;

    const statusMap: Record<JobSheetStatus, { count: number; totalCost: number }> = {
      pending: { count: 0, totalCost: 0 },
      in_progress: { count: 0, totalCost: 0 },
      waiting_parts: { count: 0, totalCost: 0 },
      approved: { count: 0, totalCost: 0 },
      completed: { count: 0, totalCost: 0 },
      cancelled: { count: 0, totalCost: 0 },
      delivered: { count: 0, totalCost: 0 },
    };

    for (const sheet of companySheets) {
      statusMap[sheet.status].count += 1;
      statusMap[sheet.status].totalCost += sheet.finalCostCents || 0;
      totalRevenueCents += sheet.finalCostCents || 0;

      if (sheet.status === 'pending') pendingCount++;
      else if (sheet.status === 'in_progress') inProgressCount++;
      else if (sheet.status === 'waiting_parts') waitingPartsCount++;
      else if (sheet.status === 'completed') completedCount++;
      else if (sheet.status === 'delivered') deliveredCount++;
      else if (sheet.status === 'cancelled') cancelledCount++;
    }

    const statusMetrics: RepairStatusMetric[] = (Object.keys(statusMap) as JobSheetStatus[]).map((st) => ({
      status: st,
      label: STATUS_LABELS[st],
      count: statusMap[st].count,
      percentage: total > 0 ? Math.round((statusMap[st].count / total) * 100) : 0,
      totalCostCents: statusMap[st].totalCost,
    }));

    return {
      totalJobSheets: total,
      pendingCount,
      inProgressCount,
      waitingPartsCount,
      completedCount,
      deliveredCount,
      cancelledCount,
      totalRevenueCents,
      avgTicketCents: total > 0 ? Math.round(totalRevenueCents / total) : 0,
      statusMetrics,
    };
  }

  /**
   * Brand Trends
   */
  public static async getBrandTrends(companyId: UUID): Promise<BrandTrendData[]> {
    const companySheets = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    const total = companySheets.length;

    const brandMap: Record<string, { count: number; revenueCents: number }> = {};
    for (const s of companySheets) {
      const b = s.brand || 'Outras';
      if (!brandMap[b]) brandMap[b] = { count: 0, revenueCents: 0 };
      brandMap[b].count++;
      brandMap[b].revenueCents += s.finalCostCents || 0;
    }

    return Object.entries(brandMap)
      .map(([brand, data]) => ({
        brand,
        count: data.count,
        revenueCents: data.revenueCents,
        percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Device Trends
   */
  public static async getDeviceTrends(companyId: UUID): Promise<DeviceTrendData[]> {
    const companySheets = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    const total = companySheets.length;

    const devMap: Record<string, number> = {};
    for (const s of companySheets) {
      const d = s.deviceType || 'Outros';
      devMap[d] = (devMap[d] || 0) + 1;
    }

    return Object.entries(devMap)
      .map(([deviceType, count]) => ({
        deviceType,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Model Trends
   */
  public static async getModelTrends(companyId: UUID): Promise<ModelTrendData[]> {
    const companySheets = JOB_SHEETS_STORE.filter((j) => j.companyId === companyId);
    const total = companySheets.length;

    const modelMap: Record<string, { brand: string; count: number }> = {};
    for (const s of companySheets) {
      const m = s.model || 'Desconhecido';
      if (!modelMap[m]) modelMap[m] = { brand: s.brand, count: 0 };
      modelMap[m].count++;
    }

    return Object.entries(modelMap)
      .map(([model, data]) => ({
        model,
        brand: data.brand,
        count: data.count,
        percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // ==============================================================================
  // MÓDULO DE CONFIGURAÇÕES DE REPARO
  // ==============================================================================

  public static async getRepairStatuses(companyId: string): Promise<RepairStatus[]> {
    return getRepairStatuses(companyId);
  }

  public static async createRepairStatus(companyId: string, status: Omit<RepairStatus, 'id'>): Promise<RepairStatus> {
    return createRepairStatus(companyId, status);
  }

  public static async updateRepairStatus(companyId: string, statusId: string, data: Partial<RepairStatus>): Promise<RepairStatus> {
    return updateRepairStatus(companyId, statusId, data);
  }

  public static async deleteRepairStatus(companyId: string, statusId: string): Promise<void> {
    return deleteRepairStatus(companyId, statusId);
  }

  public static async getDeviceModels(companyId: string): Promise<DeviceModel[]> {
    return getDeviceModels(companyId);
  }

  public static async createDeviceModel(companyId: string, model: Omit<DeviceModel, 'id'>): Promise<DeviceModel> {
    return createDeviceModel(companyId, model);
  }

  public static async updateDeviceModel(companyId: string, modelId: string, data: Partial<DeviceModel>): Promise<DeviceModel> {
    return updateDeviceModel(companyId, modelId, data);
  }

  public static async deleteDeviceModel(companyId: string, modelId: string): Promise<void> {
    return deleteDeviceModel(companyId, modelId);
  }

  public static async getRepairSettings(companyId: string): Promise<RepairSettings> {
    return getRepairSettings(companyId);
  }

  public static async updateRepairSettings(companyId: string, settings: Partial<RepairSettings>): Promise<RepairSettings> {
    return updateRepairSettings(companyId, settings);
  }

  public static async getLabelSettings(companyId: string): Promise<LabelSettings> {
    return getLabelSettings(companyId);
  }

  public static async updateLabelSettings(companyId: string, settings: Partial<LabelSettings>): Promise<LabelSettings> {
    return updateLabelSettings(companyId, settings);
  }

  public static async getCompleteSettings(companyId: string): Promise<RepairModuleSettings> {
    const [statuses, deviceModels, general, label] = await Promise.all([
      getRepairStatuses(companyId),
      getDeviceModels(companyId),
      getRepairSettings(companyId),
      getLabelSettings(companyId),
    ]);
    return { statuses, deviceModels, general, label };
  }
}

// In-Memory Storage for Settings
interface CompanyRepairConfigStore {
  statuses: RepairStatus[];
  deviceModels: DeviceModel[];
  general: RepairSettings;
  label: LabelSettings;
}

const DEFAULT_STATUSES: RepairStatus[] = [
  { id: 'status-pending', name: 'Pendente / Triagem', color: '#f59e0b', sortOrder: 1, emoji: '⏳' },
  { id: 'status-in-progress', name: 'Em Bancada / Reparo', color: '#3b82f6', sortOrder: 2, emoji: '🔧' },
  { id: 'status-waiting-parts', name: 'Aguardando Peças', color: '#8b5cf6', sortOrder: 3, emoji: '📦' },
  { id: 'status-approved', name: 'Orçamento Aprovado', color: '#06b6d4', sortOrder: 4, emoji: '✅' },
  { id: 'status-completed', name: 'Reparo Concluído', color: '#10b981', sortOrder: 5, emoji: '🎯' },
  { id: 'status-delivered', name: 'Entregue ao Cliente', color: '#6366f1', sortOrder: 6, emoji: '🚀' },
  { id: 'status-cancelled', name: 'Cancelado / Sem Reparo', color: '#64748b', sortOrder: 7, emoji: '❌' },
];

const DEFAULT_DEVICE_MODELS: DeviceModel[] = [
  {
    id: 'model-iphone-15-pm',
    modelName: 'iPhone 15 Pro Max',
    deviceType: 'Smartphone',
    brand: 'Apple',
    repairChecklist: ['Tela OLED / Touch', 'Face ID e Câmera TrueDepth', 'Bateria e Conector USB-C', 'Alto-Falante e Auricular', 'Carcaça e Botões de Ação'],
  },
  {
    id: 'model-galaxy-s24-ultra',
    modelName: 'Galaxy S24 Ultra',
    deviceType: 'Smartphone',
    brand: 'Samsung',
    repairChecklist: ['Tela Dynamic AMOLED', 'S-Pen e Conector', 'Biometria Ultrassônica', 'Câmeras 200MP e Zoom', 'Carregamento por Indução e Bateria'],
  },
  {
    id: 'model-macbook-pro-14',
    modelName: 'MacBook Pro M3 14"',
    deviceType: 'Notebook',
    brand: 'Apple',
    repairChecklist: ['Display Liquid Retina XDR', 'Teclado Magic Keyboard e Trackpad', 'Portas Thunderbolt / HDMI / SD', 'Bateria e Ciclos', 'Limpeza Interna e Pasta Térmica'],
  },
  {
    id: 'model-dell-xps-15',
    modelName: 'Dell XPS 15',
    deviceType: 'Notebook',
    brand: 'Dell',
    repairChecklist: ['Tela 4K Touch', 'Teclado Retroiluminado', 'Cooler e Dissipação', 'Bateria e Fonte', 'Portas USB-C / Thunderbolt'],
  },
  {
    id: 'model-ps5',
    modelName: 'PlayStation 5',
    deviceType: 'Console',
    brand: 'Sony',
    repairChecklist: ['Leitor Óptico Blu-Ray', 'Porta HDMI 2.1', 'Metal Líquido e Refrigeração', 'Fonte Interna de Alimentação', 'Conexão Bluetooth e Controles'],
  },
  {
    id: 'model-ipad-pro-129',
    modelName: 'iPad Pro 12.9" M2',
    deviceType: 'Tablet',
    brand: 'Apple',
    repairChecklist: ['Display Liquid Retina XDR', 'Suporte Apple Pencil 2', 'Bateria de 10.758 mAh', 'Câmera Traseira com LiDAR', 'Face ID e Microfones'],
  },
];

const DEFAULT_GENERAL_SETTINGS: RepairSettings = {
  defaultStatusId: 'status-pending',
  workOrderPrefix: 'OS-2026-',
  defaultRepairChecklist: '1. Teste de ligar e desligar\n2. Teste de carregamento e porta de dados\n3. Verificação de tela, touch e iluminação\n4. Teste de som, microfone e alto-falantes\n5. Teste de câmeras e sensores\n6. Teste de conectividade Wi-Fi e Bluetooth',
  productConfiguration: 'Aparelho entregue com carregador original, capa protetora de silicone e película de vidro.',
  customerReportedProblem: 'Aparelho não liga após queda ou apresenta superaquecimento ao carregar.',
  productCondition: 'Marcas normais de uso nas bordas, sem trincados no vidro traseiro.',
  termsAndConditions: `<h3>Termos e Condições de Serviço</h3>
<p>1. <strong>Prazo de Análise:</strong> O prazo estimado de diagnóstico técnico é de até 48 horas úteis a contar da entrada.</p>
<p>2. <strong>Retirada de Equipamentos:</strong> Equipamentos não retirados em até 90 (noventa) dias após notificação de conclusão poderão ser desmobilizados para cobertura de custos operacionais conforme legislação vigente.</p>
<p>3. <strong>Garantia Legal:</strong> Garantia legal de 90 dias exclusivamente sobre os componentes substituídos e serviços executados, com exclusão de danos por umidade, queda ou intervenção de terceiros.</p>`,
};

const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  labelWidthMM: 60,
  labelHeightMM: 40,
  customerInfo: {
    name: true,
    address: false,
    phone: true,
    alternatePhone: false,
    email: false,
  },
  labelDetails: {
    salesPerson: false,
    barcode: true,
    status: true,
    dueDate: true,
  },
  labelInformation: {
    technician: true,
    problem: true,
  },
  deviceInfo: {
    imeiSerial: true,
    brandModel: true,
    location: true,
    password: false,
  },
};

const REPAIR_SETTINGS_STORE: Map<string, CompanyRepairConfigStore> = new Map();

function getCompanyStore(companyId: string): CompanyRepairConfigStore {
  if (!REPAIR_SETTINGS_STORE.has(companyId)) {
    REPAIR_SETTINGS_STORE.set(companyId, {
      statuses: [...DEFAULT_STATUSES],
      deviceModels: [...DEFAULT_DEVICE_MODELS],
      general: { ...DEFAULT_GENERAL_SETTINGS },
      label: { ...DEFAULT_LABEL_SETTINGS },
    });
  }
  return REPAIR_SETTINGS_STORE.get(companyId)!;
}

// Status Functions
export async function getRepairStatuses(companyId: string): Promise<RepairStatus[]> {
  const store = getCompanyStore(companyId);
  return [...store.statuses].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createRepairStatus(companyId: string, status: Omit<RepairStatus, 'id'>): Promise<RepairStatus> {
  const store = getCompanyStore(companyId);
  const newStatus: RepairStatus = {
    id: `status-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...status,
    sortOrder: status.sortOrder ?? store.statuses.length + 1,
  };
  store.statuses.push(newStatus);
  return newStatus;
}

export async function updateRepairStatus(companyId: string, statusId: string, data: Partial<RepairStatus>): Promise<RepairStatus> {
  const store = getCompanyStore(companyId);
  const index = store.statuses.findIndex((s) => s.id === statusId);
  if (index === -1) {
    throw new Error(`Status ${statusId} não encontrado.`);
  }
  store.statuses[index] = { ...store.statuses[index], ...data };
  return store.statuses[index];
}

export async function deleteRepairStatus(companyId: string, statusId: string): Promise<void> {
  const store = getCompanyStore(companyId);
  store.statuses = store.statuses.filter((s) => s.id !== statusId);
}

// Device Models Functions
export async function getDeviceModels(companyId: string): Promise<DeviceModel[]> {
  const store = getCompanyStore(companyId);
  return [...store.deviceModels];
}

export async function createDeviceModel(companyId: string, model: Omit<DeviceModel, 'id'>): Promise<DeviceModel> {
  const store = getCompanyStore(companyId);
  const newModel: DeviceModel = {
    id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...model,
    repairChecklist: model.repairChecklist || [],
  };
  store.deviceModels.push(newModel);
  return newModel;
}

export async function updateDeviceModel(companyId: string, modelId: string, data: Partial<DeviceModel>): Promise<DeviceModel> {
  const store = getCompanyStore(companyId);
  const index = store.deviceModels.findIndex((m) => m.id === modelId);
  if (index === -1) {
    throw new Error(`Modelo ${modelId} não encontrado.`);
  }
  store.deviceModels[index] = { ...store.deviceModels[index], ...data };
  return store.deviceModels[index];
}

export async function deleteDeviceModel(companyId: string, modelId: string): Promise<void> {
  const store = getCompanyStore(companyId);
  store.deviceModels = store.deviceModels.filter((m) => m.id !== modelId);
}

// General Settings Functions
export async function getRepairSettings(companyId: string): Promise<RepairSettings> {
  const store = getCompanyStore(companyId);
  return { ...store.general };
}

export async function updateRepairSettings(companyId: string, settings: Partial<RepairSettings>): Promise<RepairSettings> {
  const store = getCompanyStore(companyId);
  store.general = { ...store.general, ...settings };
  return { ...store.general };
}

// Label Settings Functions
export async function getLabelSettings(companyId: string): Promise<LabelSettings> {
  const store = getCompanyStore(companyId);
  return JSON.parse(JSON.stringify(store.label));
}

export async function updateLabelSettings(companyId: string, settings: Partial<LabelSettings>): Promise<LabelSettings> {
  const store = getCompanyStore(companyId);
  store.label = {
    ...store.label,
    ...settings,
    customerInfo: { ...store.label.customerInfo, ...(settings.customerInfo || {}) },
    labelDetails: { ...store.label.labelDetails, ...(settings.labelDetails || {}) },
    labelInformation: { ...store.label.labelInformation, ...(settings.labelInformation || {}) },
    deviceInfo: { ...store.label.deviceInfo, ...(settings.deviceInfo || {}) },
  };
  return JSON.parse(JSON.stringify(store.label));
}
