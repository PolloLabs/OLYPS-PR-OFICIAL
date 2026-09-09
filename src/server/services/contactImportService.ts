import { getSupabaseAdmin, isSupabaseAdminConfigured } from '../supabaseAdmin.js';
import { CustomerService } from './customerService.js';
import { SupplierService } from './supplierService.js';
import { CustomerGroupService } from './customerGroupService.js';
import type {
  UUID,
  ContactTargetType,
  ContactImportItem,
  ContactImportPreview,
  ContactImportPayload,
  ContactImportResult,
  PersonType,
} from '../../types/index.js';

export class ContactImportService {
  /**
   * Validate and generate a preview of contacts before insertion
   */
  static async generatePreview(
    companyId: UUID,
    targetType: ContactTargetType,
    rawRows: Array<Record<string, any>>
  ): Promise<ContactImportPreview> {
    const isCustomer = targetType === 'customer' || targetType === 'customers';
    const existingGroups = isCustomer ? await CustomerGroupService.listByCompany(companyId) : [];
    const groupMap = new Map<string, string>();
    existingGroups.forEach((g) => {
      groupMap.set(g.name.toLowerCase(), g.id);
    });

    const items: ContactImportItem[] = [];

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 1;
      const errors: string[] = [];

      const rawName = String(row.name || row.nome || row.razao_social || '').trim();
      const rawTradeName = String(row.tradeName || row.trade_name || row.nome_fantasia || '').trim();
      const rawDoc = String(row.document || row.cpf_cnpj || row.documento || '').replace(/\D/g, '');
      const rawEmail = String(row.email || '').trim();
      const rawPhone = String(row.phone || row.telefone || row.celular || '').trim();
      const rawCity = String(row.city || row.cidade || '').trim();
      const rawState = String(row.state || row.uf || row.estado || '').trim();
      const rawGroupName = String(row.customerGroupName || row.grupo || row.group || '').trim();
      const rawCategory = String(row.category || row.categoria || '').trim();
      const rawPersonType = String(row.personType || row.tipo || '').toLowerCase();

      // Determine person type (individual or legal)
      let personType: PersonType = 'legal';
      if (rawPersonType === 'pf' || rawPersonType === 'fisica' || rawPersonType === 'individual' || rawDoc.length === 11) {
        personType = 'individual';
      }

      // Validations
      if (!rawName) {
        errors.push('Nome ou Razão Social é obrigatório.');
      }

      if (rawDoc) {
        if (personType === 'individual' && rawDoc.length !== 11) {
          errors.push('CPF deve conter 11 dígitos numéricos.');
        } else if (personType === 'legal' && rawDoc.length !== 14) {
          errors.push('CNPJ deve conter 14 dígitos numéricos.');
        }
      }

      if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        errors.push('Formato de e-mail inválido.');
      }

      items.push({
        rowNumber,
        personType,
        name: rawName || 'Não informado',
        tradeName: rawTradeName || null,
        document: rawDoc || null,
        email: rawEmail || null,
        phone: rawPhone || null,
        city: rawCity || null,
        state: rawState || null,
        customerGroupName: rawGroupName || null,
        category: rawCategory || null,
        isValid: errors.length === 0,
        errors,
      });
    });

    const totalRows = items.length;
    const validRows = items.filter((i) => i.isValid).length;
    const invalidRows = totalRows - validRows;

    return {
      targetType,
      totalRows,
      validRows,
      invalidRows,
      items,
    };
  }

  /**
   * Execute batch import after user confirmation
   */
  static async executeImport(
    companyId: UUID,
    payload: ContactImportPayload
  ): Promise<ContactImportResult> {
    const { targetType } = payload;
    const items = payload.items || payload.rows || [];
    if (!items || items.length === 0) {
      throw new Error('Nenhum registro fornecido para importação.');
    }

    const isCustomer = targetType === 'customer' || targetType === 'customers';
    let importedCount = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    // Pre-fetch groups if importing customers
    const existingGroups = isCustomer ? await CustomerGroupService.listByCompany(companyId) : [];
    const groupNameMap = new Map<string, string>();
    existingGroups.forEach((g) => groupNameMap.set(g.name.toLowerCase(), g.id));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (isCustomer) {
          let groupId = item.customerGroupId;
          // Resolve group by name if specified
          if (!groupId && item.notes && groupNameMap.has(item.notes.toLowerCase())) {
            groupId = groupNameMap.get(item.notes.toLowerCase());
          }

          await CustomerService.create(companyId, {
            customerGroupId: groupId || null,
            personType: item.personType || 'legal',
            name: item.name,
            tradeName: item.tradeName,
            document: item.document,
            stateRegistration: item.stateRegistration,
            email: item.email,
            phone: item.phone,
            address: item.address,
            neighborhood: item.neighborhood,
            city: item.city,
            state: item.state,
            postalCode: item.postalCode,
            status: 'active',
            notes: item.notes,
          });
          importedCount++;
        } else {
          await SupplierService.create(companyId, {
            personType: item.personType || 'legal',
            name: item.name,
            tradeName: item.tradeName,
            document: item.document,
            stateRegistration: item.stateRegistration,
            email: item.email,
            phone: item.phone,
            address: item.address,
            neighborhood: item.neighborhood,
            city: item.city,
            state: item.state,
            postalCode: item.postalCode,
            category: item.category,
            status: 'active',
            notes: item.notes,
          });
          importedCount++;
        }
      } catch (err: any) {
        errorsCount++;
        errors.push(`Linha ${i + 1} (${item.name}): ${err.message}`);
      }
    }

    return {
      targetType,
      importedCount,
      errorsCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
