export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
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
      company_memberships: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          role: "member" | "owner";
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          role?: "member" | "owner";
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          role?: "member" | "owner";
          user_id?: string;
        };
      };
      company_settings: {
        Row: {
          base_currency: string;
          company_id: string;
          created_at: string;
          fiscal_year_start_month: number;
          updated_at: string;
        };
        Insert: {
          base_currency?: string;
          company_id: string;
          created_at?: string;
          fiscal_year_start_month?: number;
          updated_at?: string;
        };
        Update: {
          base_currency?: string;
          company_id?: string;
          created_at?: string;
          fiscal_year_start_month?: number;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
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
          created_at: string;
          id: string;
          path: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          path: string;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          path?: string;
          transaction_id?: string | null;
          user_id?: string;
        };
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string | null;
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
