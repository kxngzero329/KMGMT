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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      availability_exceptions: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          reason: string | null
          start_time: string | null
          type: Database["public"]["Enums"]["exception_type"]
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
          type: Database["public"]["Enums"]["exception_type"]
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
          type?: Database["public"]["Enums"]["exception_type"]
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      booking_settings: {
        Row: {
          buffer_minutes: number
          hold_minutes: number
          id: number
          max_advance_days: number
          min_notice_hours: number
          slot_interval_minutes: number
          timezone: string
          updated_at: string
        }
        Insert: {
          buffer_minutes?: number
          hold_minutes?: number
          id?: number
          max_advance_days?: number
          min_notice_hours?: number
          slot_interval_minutes?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          buffer_minutes?: number
          hold_minutes?: number
          id?: number
          max_advance_days?: number
          min_notice_hours?: number
          slot_interval_minutes?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          blocked_until: string
          booking_reference: string
          client_id: string
          created_at: string
          end_time: string
          hold_expires_at: string | null
          id: string
          notes: string | null
          service_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          blocked_until: string
          booking_reference: string
          client_id: string
          created_at?: string
          end_time: string
          hold_expires_at?: string | null
          id?: string
          notes?: string | null
          service_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          blocked_until?: string
          booking_reference?: string
          client_id?: string
          created_at?: string
          end_time?: string
          hold_expires_at?: string | null
          id?: string
          notes?: string | null
          service_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          age: number
          country: string
          created_at: string
          current_club: string | null
          email: string
          full_name: string
          guardian_consent: boolean
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          help_required: string
          highlight_video_url: string | null
          id: string
          playing_level: string | null
          position: string | null
          previous_clubs: string | null
          situation_description: string | null
          social_profile: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          age: number
          country?: string
          created_at?: string
          current_club?: string | null
          email: string
          full_name: string
          guardian_consent?: boolean
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          help_required: string
          highlight_video_url?: string | null
          id?: string
          playing_level?: string | null
          position?: string | null
          previous_clubs?: string | null
          situation_description?: string | null
          social_profile?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          age?: number
          country?: string
          created_at?: string
          current_club?: string | null
          email?: string
          full_name?: string
          guardian_consent?: boolean
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          help_required?: string
          highlight_video_url?: string | null
          id?: string
          playing_level?: string | null
          position?: string | null
          previous_clubs?: string | null
          situation_description?: string | null
          social_profile?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      contact_enquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          subject?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          provider: string
          provider_payment_id: string | null
          raw_reference: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
          raw_reference?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
          raw_reference?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      represented_players: {
        Row: {
          active: boolean
          age: number | null
          created_at: string
          current_club: string | null
          display_order: number
          id: string
          image_url: string | null
          name: string
          nationality: string | null
          position: string | null
          previous_clubs: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          active?: boolean
          age?: number | null
          created_at?: string
          current_club?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          name: string
          nationality?: string | null
          position?: string | null
          previous_clubs?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          active?: boolean
          age?: number | null
          created_at?: string
          current_club?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          nationality?: string | null
          position?: string | null
          previous_clubs?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          duration_minutes: number
          full_description: string
          id: string
          name: string
          price_cents: number
          short_description: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          duration_minutes: number
          full_description?: string
          id?: string
          name: string
          price_cents: number
          short_description?: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          duration_minutes?: number
          full_description?: string
          id?: string
          name?: string
          price_cents?: number
          short_description?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean
          client_name: string
          content: string
          created_at: string
          display_order: number
          id: string
          role_or_context: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          client_name: string
          content: string
          created_at?: string
          display_order?: number
          id?: string
          role_or_context?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          client_name?: string
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          role_or_context?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_hold: {
        Args: { p_client: Json; p_service_id: string; p_start: string }
        Returns: {
          booking_id: string
          booking_reference: string
          hold_expires_at: string
        }[]
      }
      expire_stale_holds: { Args: never; Returns: number }
      get_available_dates: {
        Args: { p_from: string; p_service_id: string; p_to: string }
        Returns: string[]
      }
      get_available_slots: {
        Args: { p_date: string; p_service_id: string }
        Returns: string[]
      }
      get_booking_public: { Args: { p_booking_id: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
        | "expired"
      enquiry_status: "new" | "read" | "responded" | "archived"
      exception_type: "blocked" | "custom_hours"
      payment_status: "pending" | "paid" | "failed" | "cancelled" | "refunded"
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
      booking_status: [
        "pending_payment",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
        "expired",
      ],
      enquiry_status: ["new", "read", "responded", "archived"],
      exception_type: ["blocked", "custom_hours"],
      payment_status: ["pending", "paid", "failed", "cancelled", "refunded"],
    },
  },
} as const
