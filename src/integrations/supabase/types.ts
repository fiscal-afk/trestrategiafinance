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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      configuracoes: {
        Row: {
          area_cliente_tr: string | null
          frase_mes: string
          id: number
          logo_tr: string | null
          updated_at: string
          whatsapp_tr: string | null
        }
        Insert: {
          area_cliente_tr?: string | null
          frase_mes?: string
          id?: number
          logo_tr?: string | null
          updated_at?: string
          whatsapp_tr?: string | null
        }
        Update: {
          area_cliente_tr?: string | null
          frase_mes?: string
          id?: number
          logo_tr?: string | null
          updated_at?: string
          whatsapp_tr?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          arquivo: string
          created_at: string
          empresa_id: string
          extraido: Json | null
          id: string
          nome_arquivo: string | null
          relatorio_id: string | null
          tipo: string
        }
        Insert: {
          arquivo: string
          created_at?: string
          empresa_id: string
          extraido?: Json | null
          id?: string
          nome_arquivo?: string | null
          relatorio_id?: string | null
          tipo: string
        }
        Update: {
          arquivo?: string
          created_at?: string
          empresa_id?: string
          extraido?: Json | null
          id?: string
          nome_arquivo?: string | null
          relatorio_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_relatorio_id_fkey"
            columns: ["relatorio_id"]
            isOneToOne: false
            referencedRelation: "relatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          area_cliente: string | null
          cnpj: string
          created_at: string
          email: string | null
          id: string
          nome_fantasia: string | null
          numero_interno: number | null
          razao_social: string
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          area_cliente?: string | null
          cnpj: string
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          numero_interno?: number | null
          razao_social: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          area_cliente?: string | null
          cnpj?: string
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          numero_interno?: number | null
          razao_social?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      relatorios: {
        Row: {
          aliquota: number
          aliquota_anterior: number | null
          competencia: string
          created_at: string
          crescimento: number | null
          empresa_id: string
          faturamento_anual: number
          faturamento_mensal: number
          faturamento_mes_anterior: number | null
          id: string
          imposto: number
          pdf_url: string | null
          status: string
          updated_at: string
          vencimento: string | null
        }
        Insert: {
          aliquota?: number
          aliquota_anterior?: number | null
          competencia: string
          created_at?: string
          crescimento?: number | null
          empresa_id: string
          faturamento_anual?: number
          faturamento_mensal?: number
          faturamento_mes_anterior?: number | null
          id?: string
          imposto?: number
          pdf_url?: string | null
          status?: string
          updated_at?: string
          vencimento?: string | null
        }
        Update: {
          aliquota?: number
          aliquota_anterior?: number | null
          competencia?: string
          created_at?: string
          crescimento?: number | null
          empresa_id?: string
          faturamento_anual?: number
          faturamento_mensal?: number
          faturamento_mes_anterior?: number | null
          id?: string
          imposto?: number
          pdf_url?: string | null
          status?: string
          updated_at?: string
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
