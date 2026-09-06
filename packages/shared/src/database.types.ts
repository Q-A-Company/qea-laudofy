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
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      photo_categories: {
        Row: {
          active: boolean
          display_group: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          display_group: string
          key: string
          label: string
          sort_order: number
        }
        Update: {
          active?: boolean
          display_group?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      photo_upload_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          processed_photos: number
          property_id: string
          status: Database["public"]["Enums"]["batch_status_enum"]
          total_photos: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          processed_photos?: number
          property_id: string
          status?: Database["public"]["Enums"]["batch_status_enum"]
          total_photos?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          processed_photos?: number
          property_id?: string
          status?: Database["public"]["Enums"]["batch_status_enum"]
          total_photos?: number
        }
        Relationships: [
          {
            foreignKeyName: "photo_upload_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          organization_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          agendamento_necessario: boolean
          agendamento_obs: string | null
          andar: string | null
          ano_construcao: number | null
          area_construida: number | null
          area_terreno: number | null
          bairro: Database["public"]["Enums"]["bairro_enum"] | null
          bairro_outro: string | null
          banheiros: number | null
          broker_id: string
          canto_de_pedra: boolean
          caracteristicas_condominio: Json
          caracteristicas_imovel: Json
          cep: string | null
          chave_disponivel: boolean | null
          chave_numero: string | null
          condicoes_obs: string | null
          condominio_nome: string | null
          condominio_valor: number | null
          conjuge_email: string | null
          conjuge_nome: string | null
          conjuge_telefone: string | null
          created_at: string
          created_by: string
          data_entrega_ano: number | null
          data_entrega_mes: number | null
          data_entrega_tipo:
            | Database["public"]["Enums"]["data_entrega_tipo_enum"]
            | null
          descricao: string | null
          descricao_titulo: string | null
          edificio: string | null
          elevadores: number | null
          endereco: string | null
          finalidade: Database["public"]["Enums"]["finalidade_enum"][] | null
          hidrometro: Database["public"]["Enums"]["hidrometro_enum"] | null
          id: string
          imovel_ocupacao:
            | Database["public"]["Enums"]["imovel_ocupacao_enum"]
            | null
          inscricao_iptu: string | null
          iptu_valor: number | null
          localizacao: string | null
          motivo_venda: string | null
          organization_id: string
          permuta_aceita: boolean | null
          permuta_tipo_local: string | null
          placa_instalada: boolean | null
          placa_numero: string | null
          planta_tipo: Database["public"]["Enums"]["planta_tipo_enum"] | null
          posicao: Database["public"]["Enums"]["posicao_enum"][] | null
          proprietario_email: string | null
          proprietario_nome: string | null
          proprietario_telefones: string | null
          quartos: number | null
          quartos_planta_original: number | null
          sol: Database["public"]["Enums"]["sol_enum"][] | null
          status: Database["public"]["Enums"]["property_status"]
          subsolo: boolean | null
          suite_master_index: number | null
          suites: number | null
          suites_planta_original: number | null
          tipo_imovel: Database["public"]["Enums"]["tipo_imovel_enum"][]
          unidades_por_andar: number | null
          updated_at: string
          vagas: number | null
          valor: number | null
          valor_locacao: number | null
        }
        Insert: {
          agendamento_necessario?: boolean
          agendamento_obs?: string | null
          andar?: string | null
          ano_construcao?: number | null
          area_construida?: number | null
          area_terreno?: number | null
          bairro?: Database["public"]["Enums"]["bairro_enum"] | null
          bairro_outro?: string | null
          banheiros?: number | null
          broker_id: string
          canto_de_pedra?: boolean
          caracteristicas_condominio?: Json
          caracteristicas_imovel?: Json
          cep?: string | null
          chave_disponivel?: boolean | null
          chave_numero?: string | null
          condicoes_obs?: string | null
          condominio_nome?: string | null
          condominio_valor?: number | null
          conjuge_email?: string | null
          conjuge_nome?: string | null
          conjuge_telefone?: string | null
          created_at?: string
          created_by: string
          data_entrega_ano?: number | null
          data_entrega_mes?: number | null
          data_entrega_tipo?:
            | Database["public"]["Enums"]["data_entrega_tipo_enum"]
            | null
          descricao?: string | null
          descricao_titulo?: string | null
          edificio?: string | null
          elevadores?: number | null
          endereco?: string | null
          finalidade?: Database["public"]["Enums"]["finalidade_enum"][] | null
          hidrometro?: Database["public"]["Enums"]["hidrometro_enum"] | null
          id?: string
          imovel_ocupacao?:
            | Database["public"]["Enums"]["imovel_ocupacao_enum"]
            | null
          inscricao_iptu?: string | null
          iptu_valor?: number | null
          localizacao?: string | null
          motivo_venda?: string | null
          organization_id?: string
          permuta_aceita?: boolean | null
          permuta_tipo_local?: string | null
          placa_instalada?: boolean | null
          placa_numero?: string | null
          planta_tipo?: Database["public"]["Enums"]["planta_tipo_enum"] | null
          posicao?: Database["public"]["Enums"]["posicao_enum"][] | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_telefones?: string | null
          quartos?: number | null
          quartos_planta_original?: number | null
          sol?: Database["public"]["Enums"]["sol_enum"][] | null
          status?: Database["public"]["Enums"]["property_status"]
          subsolo?: boolean | null
          suite_master_index?: number | null
          suites?: number | null
          suites_planta_original?: number | null
          tipo_imovel: Database["public"]["Enums"]["tipo_imovel_enum"][]
          unidades_por_andar?: number | null
          updated_at?: string
          vagas?: number | null
          valor?: number | null
          valor_locacao?: number | null
        }
        Update: {
          agendamento_necessario?: boolean
          agendamento_obs?: string | null
          andar?: string | null
          ano_construcao?: number | null
          area_construida?: number | null
          area_terreno?: number | null
          bairro?: Database["public"]["Enums"]["bairro_enum"] | null
          bairro_outro?: string | null
          banheiros?: number | null
          broker_id?: string
          canto_de_pedra?: boolean
          caracteristicas_condominio?: Json
          caracteristicas_imovel?: Json
          cep?: string | null
          chave_disponivel?: boolean | null
          chave_numero?: string | null
          condicoes_obs?: string | null
          condominio_nome?: string | null
          condominio_valor?: number | null
          conjuge_email?: string | null
          conjuge_nome?: string | null
          conjuge_telefone?: string | null
          created_at?: string
          created_by?: string
          data_entrega_ano?: number | null
          data_entrega_mes?: number | null
          data_entrega_tipo?:
            | Database["public"]["Enums"]["data_entrega_tipo_enum"]
            | null
          descricao?: string | null
          descricao_titulo?: string | null
          edificio?: string | null
          elevadores?: number | null
          endereco?: string | null
          finalidade?: Database["public"]["Enums"]["finalidade_enum"][] | null
          hidrometro?: Database["public"]["Enums"]["hidrometro_enum"] | null
          id?: string
          imovel_ocupacao?:
            | Database["public"]["Enums"]["imovel_ocupacao_enum"]
            | null
          inscricao_iptu?: string | null
          iptu_valor?: number | null
          localizacao?: string | null
          motivo_venda?: string | null
          organization_id?: string
          permuta_aceita?: boolean | null
          permuta_tipo_local?: string | null
          placa_instalada?: boolean | null
          placa_numero?: string | null
          planta_tipo?: Database["public"]["Enums"]["planta_tipo_enum"] | null
          posicao?: Database["public"]["Enums"]["posicao_enum"][] | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_telefones?: string | null
          quartos?: number | null
          quartos_planta_original?: number | null
          sol?: Database["public"]["Enums"]["sol_enum"][] | null
          status?: Database["public"]["Enums"]["property_status"]
          subsolo?: boolean | null
          suite_master_index?: number | null
          suites?: number | null
          suites_planta_original?: number | null
          tipo_imovel?: Database["public"]["Enums"]["tipo_imovel_enum"][]
          unidades_por_andar?: number | null
          updated_at?: string
          vagas?: number | null
          valor?: number | null
          valor_locacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          ai_confidence: number | null
          ai_raw_response: Json | null
          ai_suggested_category: string | null
          batch_id: string | null
          captured_at: string | null
          created_at: string
          display_order: number | null
          error_message: string | null
          final_category: string | null
          group_key: string | null
          id: string
          original_filename: string | null
          processing_status: Database["public"]["Enums"]["processing_status_enum"]
          property_id: string
          review_status: Database["public"]["Enums"]["review_status_enum"]
          storage_path: string
          upload_order: number
          uploaded_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_raw_response?: Json | null
          ai_suggested_category?: string | null
          batch_id?: string | null
          captured_at?: string | null
          created_at?: string
          display_order?: number | null
          error_message?: string | null
          final_category?: string | null
          group_key?: string | null
          id?: string
          original_filename?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status_enum"]
          property_id: string
          review_status?: Database["public"]["Enums"]["review_status_enum"]
          storage_path: string
          upload_order: number
          uploaded_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_raw_response?: Json | null
          ai_suggested_category?: string | null
          batch_id?: string | null
          captured_at?: string | null
          created_at?: string
          display_order?: number | null
          error_message?: string | null
          final_category?: string | null
          group_key?: string | null
          id?: string
          original_filename?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status_enum"]
          property_id?: string
          review_status?: Database["public"]["Enums"]["review_status_enum"]
          storage_path?: string
          upload_order?: number
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_ai_suggested_category_fkey"
            columns: ["ai_suggested_category"]
            isOneToOne: false
            referencedRelation: "photo_categories"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "property_photos_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "photo_upload_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          docx_storage_path: string
          generated_at: string
          generated_by: string
          id: string
          pdf_storage_path: string | null
          property_id: string
          template_version: string
        }
        Insert: {
          docx_storage_path: string
          generated_at?: string
          generated_by: string
          id?: string
          pdf_storage_path?: string | null
          property_id: string
          template_version: string
        }
        Update: {
          docx_storage_path?: string
          generated_at?: string
          generated_by?: string
          id?: string
          pdf_storage_path?: string | null
          property_id?: string
          template_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      bairro_enum: "barra_da_tijuca" | "recreio" | "outros"
      batch_status_enum: "processando" | "concluido" | "erro_parcial"
      data_entrega_tipo_enum: "a_combinar" | "imediata" | "data"
      finalidade_enum: "venda" | "locacao"
      hidrometro_enum: "individual" | "coletivo"
      imovel_ocupacao_enum: "vazio" | "ocupado"
      planta_tipo_enum: "linear" | "duplex" | "triplex" | "quadriplex"
      posicao_enum: "frente" | "fundos" | "lateral"
      processing_status_enum:
        | "aguardando"
        | "processando"
        | "concluido"
        | "erro"
      property_status: "pendente" | "finalizado" | "publicado"
      review_status_enum: "pendente" | "aceito" | "editado" | "rejeitado"
      sol_enum: "manha" | "tarde"
      tipo_imovel_enum:
        | "apartamento"
        | "casa"
        | "cobertura"
        | "comercial"
        | "loja"
        | "sala"
        | "sitio"
        | "terreno"
      user_role: "admin" | "corretor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bairro_enum: ["barra_da_tijuca", "recreio", "outros"],
      batch_status_enum: ["processando", "concluido", "erro_parcial"],
      data_entrega_tipo_enum: ["a_combinar", "imediata", "data"],
      finalidade_enum: ["venda", "locacao"],
      hidrometro_enum: ["individual", "coletivo"],
      imovel_ocupacao_enum: ["vazio", "ocupado"],
      planta_tipo_enum: ["linear", "duplex", "triplex", "quadriplex"],
      posicao_enum: ["frente", "fundos", "lateral"],
      processing_status_enum: [
        "aguardando",
        "processando",
        "concluido",
        "erro",
      ],
      property_status: ["pendente", "finalizado", "publicado"],
      review_status_enum: ["pendente", "aceito", "editado", "rejeitado"],
      sol_enum: ["manha", "tarde"],
      tipo_imovel_enum: [
        "apartamento",
        "casa",
        "cobertura",
        "comercial",
        "loja",
        "sala",
        "sitio",
        "terreno",
      ],
      user_role: ["admin", "corretor"],
    },
  },
} as const
