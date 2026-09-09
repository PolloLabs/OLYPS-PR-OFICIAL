import type { UUID, ISODateString } from './common.types.js';

export type PersonType = 'individual' | 'legal';
export type ContactStatus = 'active' | 'inactive' | 'blocked';
export type CustomerGroupStatus = 'active' | 'inactive';
export type ContactTargetType = 'customer' | 'supplier' | 'customers' | 'suppliers';
export type ContactType = 'customer' | 'supplier' | 'both';

export interface Contact {
  id: UUID;
  companyId: UUID;
  contactType?: ContactType;
  personType: PersonType;
  name: string;
  tradeName?: string | null;
  document?: string | null; // CPF ou CNPJ
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  contactName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  notes?: string | null;
  status: ContactStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt?: ISODateString | null;
}

export type Group = CustomerGroup;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    total?: number;
    hasPrevPage?: boolean;
  };
}

export interface CustomerGroup {
  id: UUID;
  companyId: UUID;
  name: string;
  description: string | null;
  discountPercentage: number;
  priceTable: string | null;
  status: CustomerGroupStatus;
  customerCount?: number;
  customersCount?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt?: ISODateString | null;
}

export interface CreateCustomerGroupPayload {
  name: string;
  description?: string | null;
  discountPercentage?: number;
  priceTable?: string | null;
  status?: CustomerGroupStatus;
}

export interface UpdateCustomerGroupPayload {
  name?: string;
  description?: string | null;
  discountPercentage?: number;
  priceTable?: string | null;
  status?: CustomerGroupStatus;
}

export interface Customer {
  id: UUID;
  companyId: UUID;
  customerGroupId: UUID | null;
  customerGroupName?: string | null;
  personType: PersonType;
  name: string;
  tradeName: string | null;
  document: string | null; // CPF ou CNPJ
  stateRegistration: string | null;
  municipalRegistration: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  contactName: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  creditLimit: number;
  notes: string | null;
  status: ContactStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt?: ISODateString | null;
}

export interface CreateCustomerPayload {
  customerGroupId?: UUID | null;
  personType: PersonType;
  name: string;
  tradeName?: string | null;
  document?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  contactName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  creditLimit?: number;
  notes?: string | null;
  status?: ContactStatus;
}

export interface UpdateCustomerPayload {
  customerGroupId?: UUID | null;
  personType?: PersonType;
  name?: string;
  tradeName?: string | null;
  document?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  contactName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  creditLimit?: number;
  notes?: string | null;
  status?: ContactStatus;
}

export interface Supplier {
  id: UUID;
  companyId: UUID;
  personType: PersonType;
  name: string;
  tradeName: string | null;
  document: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  contactName: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  category: string | null;
  paymentTerms: string | null;
  bankInfo: {
    bankName?: string;
    agency?: string;
    accountNumber?: string;
    pixKey?: string;
    [key: string]: any;
  };
  notes: string | null;
  status: ContactStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt?: ISODateString | null;
}

export interface CreateSupplierPayload {
  personType: PersonType;
  name: string;
  tradeName?: string | null;
  document?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  contactName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  category?: string | null;
  paymentTerms?: string | null;
  bankInfo?: {
    bankName?: string;
    agency?: string;
    accountNumber?: string;
    pixKey?: string;
    [key: string]: any;
  };
  notes?: string | null;
  status?: ContactStatus;
}

export interface UpdateSupplierPayload {
  personType?: PersonType;
  name?: string;
  tradeName?: string | null;
  document?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  contactName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  category?: string | null;
  paymentTerms?: string | null;
  bankInfo?: {
    bankName?: string;
    agency?: string;
    accountNumber?: string;
    pixKey?: string;
    [key: string]: any;
  };
  notes?: string | null;
  status?: ContactStatus;
}

export interface ContactImportItem {
  rowNumber?: number;
  rowIndex?: number;
  personType: PersonType;
  name: string;
  tradeName?: string | null;
  document?: string | null;
  stateRegistration?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  customerGroupId?: string | null;
  customerGroupName?: string | null;
  category?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  isValid?: boolean;
  errors?: string[];
}

export type ContactImportRow = ContactImportItem;

export interface ContactImportPreview {
  targetType: ContactTargetType;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  items: ContactImportItem[];
  validRowsCount?: number;
  invalidRowsCount?: number;
  rows?: ContactImportItem[];
}

export type ContactImportPreviewResponse = ContactImportPreview;

export interface ContactImportPayload {
  targetType: ContactTargetType;
  items?: ContactImportItem[];
  rows?: ContactImportItem[];
}

export type ContactImportExecutePayload = ContactImportPayload;

export interface ContactImportResult {
  targetType: ContactTargetType;
  importedCount: number;
  errorsCount?: number;
  failedCount?: number;
  errors?: string[];
}

export type ContactImportExecuteResponse = ContactImportResult;
