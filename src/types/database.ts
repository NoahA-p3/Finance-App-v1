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
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          updated_at?: string;
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
