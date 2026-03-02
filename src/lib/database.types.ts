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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checkins: {
        Row: {
          approved: boolean
          created_at: string
          event_id: string | null
          id: string
          org_id: string
          photo_path: string | null
          ride_occurrence_id: string | null
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          event_id?: string | null
          id?: string
          org_id: string
          photo_path?: string | null
          ride_occurrence_id?: string | null
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          event_id?: string | null
          id?: string
          org_id?: string
          photo_path?: string | null
          ride_occurrence_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_ride_occurrence_id_fkey"
            columns: ["ride_occurrence_id"]
            isOneToOne: false
            referencedRelation: "ride_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          org_id: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          org_id: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          org_id?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string
          secondary_color: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string
          secondary_color?: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          marketing_opt_in: boolean
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          marketing_opt_in?: boolean
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          marketing_opt_in?: boolean
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_entries: {
        Row: {
          checkin_id: string | null
          created_at: string
          id: string
          note: string | null
          org_id: string
          source: Database["public"]["Enums"]["raffle_entry_source"]
          source_id: string | null
          tickets_count: number
          user_id: string
        }
        Insert: {
          checkin_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          org_id: string
          source: Database["public"]["Enums"]["raffle_entry_source"]
          source_id?: string | null
          tickets_count?: number
          user_id: string
        }
        Update: {
          checkin_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          org_id?: string
          source?: Database["public"]["Enums"]["raffle_entry_source"]
          source_id?: string | null
          tickets_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_entries_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: true
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_credits: {
        Row: {
          amount: number
          created_at: string
          id: string
          org_id: string
          referral_code: string
          referrer_user_id: string | null
          registration_id: string
          voided: boolean
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          org_id: string
          referral_code: string
          referrer_user_id?: string | null
          registration_id: string
          voided?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          org_id?: string
          referral_code?: string
          referrer_user_id?: string | null
          registration_id?: string
          voided?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          id: string
          source_count: number
          tier: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          source_count?: number
          tier: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          source_count?: number
          tier?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          amount: number
          bib_issued: boolean
          created_at: string
          distance: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_flag: boolean
          event_id: string
          id: string
          org_id: string
          participant_email: string | null
          participant_name: string | null
          referral_code: string | null
          status: Database["public"]["Enums"]["registration_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
          waiver_accepted: boolean
          waiver_accepted_at: string | null
          waiver_ip: string | null
          waiver_pdf_url: string | null
          waiver_snapshot_text: string | null
          waiver_text_hash: string | null
          waiver_user_agent: string | null
          waiver_version: string | null
        }
        Insert: {
          amount?: number
          bib_issued?: boolean
          created_at?: string
          distance: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_flag?: boolean
          event_id: string
          id?: string
          org_id: string
          participant_email?: string | null
          participant_name?: string | null
          referral_code?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
          waiver_accepted?: boolean
          waiver_accepted_at?: string | null
          waiver_ip?: string | null
          waiver_pdf_url?: string | null
          waiver_snapshot_text?: string | null
          waiver_text_hash?: string | null
          waiver_user_agent?: string | null
          waiver_version?: string | null
        }
        Update: {
          amount?: number
          bib_issued?: boolean
          created_at?: string
          distance?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_flag?: boolean
          event_id?: string
          id?: string
          org_id?: string
          participant_email?: string | null
          participant_name?: string | null
          referral_code?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
          waiver_accepted?: boolean
          waiver_accepted_at?: string | null
          waiver_ip?: string | null
          waiver_pdf_url?: string | null
          waiver_snapshot_text?: string | null
          waiver_text_hash?: string | null
          waiver_user_agent?: string | null
          waiver_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_occurrences: {
        Row: {
          cancelled: boolean
          created_at: string
          date: string
          id: string
          meet_location: string | null
          note: string | null
          notes: string | null
          org_id: string
          route_ridewithgps_url: string | null
          route_strava_url: string | null
          route_wahoo_url: string | null
          series_id: string
        }
        Insert: {
          cancelled?: boolean
          created_at?: string
          date: string
          id?: string
          meet_location?: string | null
          note?: string | null
          notes?: string | null
          org_id: string
          route_ridewithgps_url?: string | null
          route_strava_url?: string | null
          route_wahoo_url?: string | null
          series_id: string
        }
        Update: {
          cancelled?: boolean
          created_at?: string
          date?: string
          id?: string
          meet_location?: string | null
          note?: string | null
          notes?: string | null
          org_id?: string
          route_ridewithgps_url?: string | null
          route_strava_url?: string | null
          route_wahoo_url?: string | null
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_occurrences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_occurrences_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "ride_series"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_series: {
        Row: {
          created_at: string
          day_of_week: number
          description: string | null
          difficulty: Database["public"]["Enums"]["ride_difficulty"]
          id: string
          location: string | null
          meet_location: string | null
          notes: string | null
          org_id: string
          route_ridewithgps_url: string | null
          route_strava_url: string | null
          route_wahoo_url: string | null
          time: string
          title: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          description?: string | null
          difficulty?: Database["public"]["Enums"]["ride_difficulty"]
          id?: string
          location?: string | null
          meet_location?: string | null
          notes?: string | null
          org_id: string
          route_ridewithgps_url?: string | null
          route_strava_url?: string | null
          route_wahoo_url?: string | null
          time: string
          title: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          description?: string | null
          difficulty?: Database["public"]["Enums"]["ride_difficulty"]
          id?: string
          location?: string | null
          meet_location?: string | null
          notes?: string | null
          org_id?: string
          route_ridewithgps_url?: string | null
          route_strava_url?: string | null
          route_wahoo_url?: string | null
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_series_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      referral_leaderboard_v: {
        Row: {
          avatar_url: string | null
          code: string | null
          full_name: string | null
          org_id: string | null
          rank: number | null
          referral_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_referral_code: { Args: { p_name: string }; Returns: string }
      get_my_org_id: { Args: never; Returns: string }
      is_org_admin: { Args: { check_org_id: string }; Returns: boolean }
    }
    Enums: {
      event_status: "draft" | "published" | "cancelled"
      raffle_entry_source: "shop_ride" | "referral" | "bonus" | "event"
      registration_status:
        | "pending"
        | "paid"
        | "refunded"
        | "cancelled"
        | "free"
      ride_difficulty: "easy" | "moderate" | "hard"
      user_role: "admin" | "member"
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
    Enums: {
      event_status: ["draft", "published", "cancelled"],
      raffle_entry_source: ["shop_ride", "referral", "bonus", "event"],
      registration_status: ["pending", "paid", "refunded", "cancelled", "free"],
      ride_difficulty: ["easy", "moderate", "hard"],
      user_role: ["admin", "member"],
    },
  },
} as const

// Convenience row types
export type Org = Tables<"orgs">;
export type Profile = Tables<"profiles">;
export type Event = Tables<"events">;
export type RideSeries = Tables<"ride_series">;
export type RideOccurrence = Tables<"ride_occurrences">;
export type Checkin = Tables<"checkins">;
export type RaffleEntry = Tables<"raffle_entries">;
export type Registration = Tables<"registrations">;
export type ReferralCredit = Tables<"referral_credits">;
export type ReferralCode = Tables<"referral_codes">;
export type ReferralReward = Tables<"referral_rewards">;
