/**
 * Generic Json type for Supabase database contracts.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Placeholder interface for Supabase generated schema types.
 * 
 * IMPORTANT ARCHITECTURAL RULE:
 * This is a base contract placeholder. Actual database entity tables will be
 * generated and mapped directly from the live PostgreSQL schema during the
 * subsequent database & migration phases (Etapa 02+).
 */
export interface Database {
  public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
