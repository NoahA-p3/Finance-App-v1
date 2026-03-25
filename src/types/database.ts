export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          company_id: string | null;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
      };
      companies: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          country_code: string | null;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          postal_code: string | null;
          updated_at: string;
          vat_registered: boolean;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          country_code?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          postal_code?: string | null;
          updated_at?: string;
          vat_registered?: boolean;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          country_code?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          postal_code?: string | null;
          updated_at?: string;
          vat_registered?: boolean;
        };
      };
      company_invitations: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          invited_by: string;
          invited_email: string;
          role: CompanyRoleKey;
          status: "accepted" | "expired" | "pending" | "revoked";
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          invited_by: string;
          invited_email: string;
          role: CompanyRoleKey;
          status?: "accepted" | "expired" | "pending" | "revoked";
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          invited_by?: string;
          invited_email?: string;
          role?: CompanyRoleKey;
          status?: "accepted" | "expired" | "pending" | "revoked";
          updated_at?: string;
        };
      };
      company_memberships: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          role: CompanyRoleKey;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          role?: CompanyRoleKey;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          role?: CompanyRoleKey;
          user_id?: string;
        };
      };
      company_settings: {
        Row: {
          base_currency: string;
          branch_label: string | null;
          cvr_number: string | null;
          company_id: string;
          created_at: string;
          fiscal_year_start_month: number;
          invoice_due_days: number | null;
          invoice_prefix: string | null;
          invoice_terms: string | null;
          logo_content_type: string | null;
          logo_file_name: string | null;
          logo_file_size_bytes: number | null;
          logo_storage_path: string | null;
          updated_at: string;
          department_label: string | null;
        };
        Insert: {
          base_currency?: string;
          branch_label?: string | null;
          cvr_number?: string | null;
          company_id: string;
          created_at?: string;
          fiscal_year_start_month?: number;
          invoice_due_days?: number | null;
          invoice_prefix?: string | null;
          invoice_terms?: string | null;
          logo_content_type?: string | null;
          logo_file_name?: string | null;
          logo_file_size_bytes?: number | null;
          logo_storage_path?: string | null;
          updated_at?: string;
          department_label?: string | null;
        };
        Update: {
          base_currency?: string;
          branch_label?: string | null;
          cvr_number?: string | null;
          company_id?: string;
          created_at?: string;
          fiscal_year_start_month?: number;
          invoice_due_days?: number | null;
          invoice_prefix?: string | null;
          invoice_terms?: string | null;
          logo_content_type?: string | null;
          logo_file_name?: string | null;
          logo_file_size_bytes?: number | null;
          logo_storage_path?: string | null;
          updated_at?: string;
          department_label?: string | null;
        };
      };
      permissions: {
        Row: {
          created_at: string;
          description: string;
          key: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          key: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          key?: string;
        };
      };
      profiles: {
        Row: {
          active_company_id: string | null;
          created_at: string;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          phone_country_code: string | null;
          phone_number: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          active_company_id?: string | null;
          created_at?: string;
          email: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          phone_country_code?: string | null;
          phone_number?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          active_company_id?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone_country_code?: string | null;
          phone_number?: string | null;
          updated_at?: string;
          username?: string | null;
        };
      };
      receipts: {
        Row: {
          company_id: string | null;
          created_at: string;
          id: string;
          path: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          path: string;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          path?: string;
          transaction_id?: string | null;
          user_id?: string;
        };
      };
      role_permissions: {
        Row: {
          created_at: string;
          permission_key: string;
          role_key: CompanyRoleKey;
        };
        Insert: {
          created_at?: string;
          permission_key: string;
          role_key: CompanyRoleKey;
        };
        Update: {
          created_at?: string;
          permission_key?: string;
          role_key?: CompanyRoleKey;
        };
      };
      roles: {
        Row: {
          created_at: string;
          display_name: string;
          is_advanced: boolean;
          key: CompanyRoleKey;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          is_advanced?: boolean;
          key: CompanyRoleKey;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          is_advanced?: boolean;
          key?: CompanyRoleKey;
        };
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string | null;
          company_id: string | null;
          created_at: string;
          date: string;
          description: string;
          id: string;
          receipt_id: string | null;
          type: "expense" | "revenue";
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          date: string;
          description: string;
          id?: string;
          receipt_id?: string | null;
          type: "expense" | "revenue";
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          date?: string;
          description?: string;
          id?: string;
          receipt_id?: string | null;
          type?: "expense" | "revenue";
          user_id?: string;
        };
      };
    };
  };
};

export type CompanyRoleKey =
  | "accountant"
  | "auditor"
  | "integration_admin"
  | "owner"
  | "payroll_only"
  | "read_only"
  | "sales_only"
  | "staff";
