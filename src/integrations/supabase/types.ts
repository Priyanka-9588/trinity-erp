export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      buyer_master: {
        Row: {
          category: string | null
          cin_no: string | null
          company_id: string | null
          contact_number: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          credit_period: string | null
          email_address: string | null
          gstin: string | null
          id: string
          msme_id: string | null
          pan_no: string | null
          party_address: string | null
          party_code: string
          party_name: string
          party_type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          category?: string | null
          cin_no?: string | null
          company_id?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          credit_period?: string | null
          email_address?: string | null
          gstin?: string | null
          id?: string
          msme_id?: string | null
          pan_no?: string | null
          party_address?: string | null
          party_code: string
          party_name: string
          party_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          category?: string | null
          cin_no?: string | null
          company_id?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          credit_period?: string | null
          email_address?: string | null
          gstin?: string | null
          id?: string
          msme_id?: string | null
          pan_no?: string | null
          party_address?: string | null
          party_code?: string
          party_name?: string
          party_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_master_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          cin_no: string | null
          code: string
          contact_number: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          pan_no: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          cin_no?: string | null
          code: string
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          pan_no?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          cin_no?: string | null
          code?: string
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          pan_no?: string | null
          website?: string | null
        }
        Relationships: []
      }
      purchase_item_master: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          hsn_code: string | null
          id: string
          item_code: string
          item_group: string | null
          item_name: string
          item_type: string | null
          lead_time: string | null
          machine_name: string | null
          price: number | null
          tax: number | null
          unit_price: number | null
          uom: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          item_code: string
          item_group?: string | null
          item_name: string
          item_type?: string | null
          lead_time?: string | null
          machine_name?: string | null
          price?: number | null
          tax?: number | null
          unit_price?: number | null
          uom?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          item_code?: string
          item_group?: string | null
          item_name?: string
          item_type?: string | null
          lead_time?: string | null
          machine_name?: string | null
          price?: number | null
          tax?: number | null
          unit_price?: number | null
          uom?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_item_master_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          amount: number
          created_at: string | null
          discount: number | null
          id: string
          item_description: string
          make: string | null
          po_id: string | null
          quantity: number
          unit: string
          unit_rate: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          discount?: number | null
          id?: string
          item_description: string
          make?: string | null
          po_id?: string | null
          quantity: number
          unit: string
          unit_rate: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          discount?: number | null
          id?: string
          item_description?: string
          make?: string | null
          po_id?: string | null
          quantity?: number
          unit?: string
          unit_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          basic_amount: number | null
          cgst: number | null
          company_id: string | null
          created_at: string | null
          delivery_date: string | null
          freight: number | null
          grand_total: number | null
          id: string
          igst: number | null
          other_instructions: string | null
          payment_terms: string | null
          po_date: string | null
          po_number: string
          sgst: number | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          basic_amount?: number | null
          cgst?: number | null
          company_id?: string | null
          created_at?: string | null
          delivery_date?: string | null
          freight?: number | null
          grand_total?: number | null
          id?: string
          igst?: number | null
          other_instructions?: string | null
          payment_terms?: string | null
          po_date?: string | null
          po_number: string
          sgst?: number | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          basic_amount?: number | null
          cgst?: number | null
          company_id?: string | null
          created_at?: string | null
          delivery_date?: string | null
          freight?: number | null
          grand_total?: number | null
          id?: string
          igst?: number | null
          other_instructions?: string | null
          payment_terms?: string | null
          po_date?: string | null
          po_number?: string
          sgst?: number | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_master"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_item_master: {
        Row: {
          company_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          hsn_code: string | null
          id: string
          item_code: string
          item_group: string | null
          item_name: string
          item_type: string | null
          lead_time: string | null
          machine_name: string | null
          price: number | null
          tax: number | null
          unit_price: number | null
          uom: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          item_code: string
          item_group?: string | null
          item_name: string
          item_type?: string | null
          lead_time?: string | null
          machine_name?: string | null
          price?: number | null
          tax?: number | null
          unit_price?: number | null
          uom?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          item_code?: string
          item_group?: string | null
          item_name?: string
          item_type?: string | null
          lead_time?: string | null
          machine_name?: string | null
          price?: number | null
          tax?: number | null
          unit_price?: number | null
          uom?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_item_master_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_master: {
        Row: {
          category: string | null
          cin_no: string | null
          company_id: string | null
          contact_number: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          credit_period: string | null
          email_address: string | null
          gstin: string | null
          id: string
          msme_id: string | null
          pan_no: string | null
          party_address: string | null
          party_code: string
          party_name: string
          party_type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          category?: string | null
          cin_no?: string | null
          company_id?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          credit_period?: string | null
          email_address?: string | null
          gstin?: string | null
          id?: string
          msme_id?: string | null
          pan_no?: string | null
          party_address?: string | null
          party_code: string
          party_name: string
          party_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          category?: string | null
          cin_no?: string | null
          company_id?: string | null
          contact_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          credit_period?: string | null
          email_address?: string | null
          gstin?: string | null
          id?: string
          msme_id?: string | null
          pan_no?: string | null
          party_address?: string | null
          party_code?: string
          party_name?: string
          party_type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_master_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
