export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      character: {
        Row: {
          character_introduction: string
          created_at: string
          id: number
          name: string
          role: string
          story_id: number
          traits: Json | null
          updated_at: string
        }
        Insert: {
          character_introduction: string
          created_at: string
          id?: number
          name: string
          role: string
          story_id: number
          traits?: Json | null
          updated_at: string
        }
        Update: {
          character_introduction?: string
          created_at?: string
          id?: number
          name?: string
          role?: string
          story_id?: number
          traits?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "story"
            referencedColumns: ["id"]
          },
        ]
      }
      environment: {
        Row: {
          created_at: string
          id: number
          sensory_details: string
          setting: string
          story_id: number
          unique_features: Json | null
          updated_at: string
        }
        Insert: {
          created_at: string
          id?: number
          sensory_details: string
          setting: string
          story_id: number
          unique_features?: Json | null
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: number
          sensory_details?: string
          setting?: string
          story_id?: number
          unique_features?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "environment_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: true
            referencedRelation: "story"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          plan: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          plan?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          plan?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      story: {
        Row: {
          created_at: string
          id: number
          language: string
          status: string
          story_content: string
          synopsis: string
          title: string
          updated_at: string
          user_query: string
        }
        Insert: {
          created_at: string
          id?: number
          language: string
          status: string
          story_content: string
          synopsis: string
          title: string
          updated_at: string
          user_query: string
        }
        Update: {
          created_at?: string
          id?: number
          language?: string
          status?: string
          story_content?: string
          synopsis?: string
          title?: string
          updated_at?: string
          user_query?: string
        }
        Relationships: []
      }
      theme: {
        Row: {
          age_group: string
          conflict_concept: string
          created_at: string
          id: number
          moral_lesson: string
          story_id: number
          updated_at: string
        }
        Insert: {
          age_group: string
          conflict_concept: string
          created_at: string
          id?: number
          moral_lesson: string
          story_id: number
          updated_at: string
        }
        Update: {
          age_group?: string
          conflict_concept?: string
          created_at?: string
          id?: number
          moral_lesson?: string
          story_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: true
            referencedRelation: "story"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
