// ============================================
// TIPOS DO MÓDULO DE RASCUNHOS (DRAFTS) - OLYPS PRO
// ============================================

import type {
  SellRecord,
  SellFormData,
  SellProductItem,
  SellCustomer,
  SellDiscountType,
  SellTaxType,
  SellPayment,
  SellShipping,
} from './sell.types.js';

export interface DraftRecord extends SellRecord {
  status: 'draft';
}

export type DraftFormData = Omit<SellFormData, 'status'> & {
  status: 'draft';
};
