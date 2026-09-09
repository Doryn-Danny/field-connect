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
      attendance: {
        Row: {
          created_at: string
          date: string
          distance_meters: number | null
          id: string
          ip_address: string | null
          latitude: number | null
          longitude: number | null
          sign_in_time: string | null
          sign_out_time: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          distance_meters?: number | null
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          sign_in_time?: string | null
          sign_out_time?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          distance_meters?: number | null
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          sign_in_time?: string | null
          sign_out_time?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activities: {
        Row: {
          activity: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          challenges: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          skills_learned: string | null
          solutions: string | null
          student_id: string
          supervisor_comment: string | null
        }
        Insert: {
          activity: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          challenges?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          skills_learned?: string | null
          solutions?: string | null
          student_id: string
          supervisor_comment?: string | null
        }
        Update: {
          activity?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          challenges?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          skills_learned?: string | null
          solutions?: string | null
          student_id?: string
          supervisor_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact: string | null
          created_at: string
          department: string | null
          id: string
          latitude: number | null
          longitude: number | null
          organization_name: string
          radius_meters: number
        }
        Insert: {
          address?: string | null
          contact?: string | null
          created_at?: string
          department?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_name: string
          radius_meters?: number
        }
        Update: {
          address?: string | null
          contact?: string | null
          created_at?: string
          department?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_name?: string
          radius_meters?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          email: string
          end_date: string | null
          full_name: string
          id: string
          organization_id: string | null
          phone: string | null
          program: string | null
          start_date: string | null
          student_no: string
          supervisor_id: string | null
          university: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          end_date?: string | null
          full_name: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          program?: string | null
          start_date?: string | null
          student_no: string
          supervisor_id?: string | null
          university?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          end_date?: string | null
          full_name?: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          program?: string | null
          start_date?: string | null
          student_no?: string
          supervisor_id?: string | null
          university?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisors"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisors: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          organization_id: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          default_radius_meters: number
          gps_required: boolean
          grace_minutes: number
          id: boolean
          work_end: string
          work_start: string
        }
        Insert: {
          default_radius_meters?: number
          gps_required?: boolean
          grace_minutes?: number
          id?: boolean
          work_end?: string
          work_start?: string
        }
        Update: {
          default_radius_meters?: number
          gps_required?: boolean
          grace_minutes?: number
          id?: boolean
          work_end?: string
          work_start?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_student_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      supervises_student: { Args: { _student_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "student"
      approval_status: "pending" | "approved" | "rejected"
      attendance_status: "present" | "late" | "absent" | "half_day" | "leave"
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
      app_role: ["admin", "supervisor", "student"],
      approval_status: ["pending", "approved", "rejected"],
      attendance_status: ["present", "late", "absent", "half_day", "leave"],
    },
  },
} as const
