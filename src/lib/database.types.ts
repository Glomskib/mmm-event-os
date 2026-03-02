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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approved_by: string | null
          body_html: string | null
          body_json: Json | null
          channel_targets: Json | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          media_urls: string[] | null
          org_id: string
          publish_result: Json | null
          published_url: string | null
          rejected_by: string | null
          reviewer_notes: string | null
          scheduled_for: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          body_html?: string | null
          body_json?: Json | null
          channel_targets?: Json | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          org_id: string
          publish_result?: Json | null
          published_url?: string | null
          rejected_by?: string | null
          reviewer_notes?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          body_html?: string | null
          body_json?: Json | null
          channel_targets?: Json | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          org_id?: string
          publish_result?: Json | null
          published_url?: string | null
          rejected_by?: string | null
          reviewer_notes?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          approved: boolean
          created_at: string
          event_id: string | null
          id: string
          location_confirmed: boolean
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
          location_confirmed?: boolean
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
          location_confirmed?: boolean
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
          early_bird_deadline: string | null
          id: string
          image_url: string | null
          location: string | null
          org_id: string
          series_key: string
          slug: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          early_bird_deadline?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          org_id: string
          series_key?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          early_bird_deadline?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          org_id?: string
          series_key?: string
          slug?: string | null
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
      film_votes: {
        Row: {
          created_at: string
          film_id: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          film_id: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          film_id?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "film_votes_film_id_fkey"
            columns: ["film_id"]
            isOneToOne: false
            referencedRelation: "films"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_votes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "film_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      films: {
        Row: {
          active: boolean
          added_by: string | null
          created_at: string
          description: string | null
          id: string
          org_id: string
          poster_url: string | null
          title: string
          trailer_url: string | null
        }
        Insert: {
          active?: boolean
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          org_id: string
          poster_url?: string | null
          title: string
          trailer_url?: string | null
        }
        Update: {
          active?: boolean
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          org_id?: string
          poster_url?: string | null
          title?: string
          trailer_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "films_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "films_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      hhh_legacy_entries: {
        Row: {
          id: string
          user_id: string
          year: number
          miles: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          miles?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          miles?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hhh_shopify_imports: {
        Row: {
          id: string
          org_id: string
          order_id: string
          order_name: string | null
          email: string
          first_name: string | null
          last_name: string | null
          distance_label: string | null
          miles: number
          event_year: number
          financial_status: string | null
          imported_at: string
          matched_user_id: string | null
          matched_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          org_id: string
          order_id: string
          order_name?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          distance_label?: string | null
          miles?: number
          event_year: number
          financial_status?: string | null
          imported_at?: string
          matched_user_id?: string | null
          matched_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          order_id?: string
          order_name?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          distance_label?: string | null
          miles?: number
          event_year?: number
          financial_status?: string | null
          imported_at?: string
          matched_user_id?: string | null
          matched_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hhh_shopify_imports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hhh_shopify_imports_matched_user_id_fkey"
            columns: ["matched_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          id: string
          org_id: string
          entity_type: Database["public"]["Enums"]["media_entity_type"]
          entity_id: string
          kind: Database["public"]["Enums"]["media_kind"]
          placement: Database["public"]["Enums"]["media_placement"]
          title: string | null
          caption: string | null
          url: string
          thumb_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          entity_type: Database["public"]["Enums"]["media_entity_type"]
          entity_id: string
          kind: Database["public"]["Enums"]["media_kind"]
          placement?: Database["public"]["Enums"]["media_placement"]
          title?: string | null
          caption?: string | null
          url: string
          thumb_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          entity_type?: Database["public"]["Enums"]["media_entity_type"]
          entity_id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          placement?: Database["public"]["Enums"]["media_placement"]
          title?: string | null
          caption?: string | null
          url?: string
          thumb_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_winner_history: {
        Row: {
          announced_at: string | null
          created_at: string
          film_id: string
          id: string
          month: string
          org_id: string
          vote_count: number
        }
        Insert: {
          announced_at?: string | null
          created_at?: string
          film_id: string
          id?: string
          month: string
          org_id: string
          vote_count?: number
        }
        Update: {
          announced_at?: string | null
          created_at?: string
          film_id?: string
          id?: string
          month?: string
          org_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_winner_history_film_id_fkey"
            columns: ["film_id"]
            isOneToOne: false
            referencedRelation: "films"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_winner_history_org_id_fkey"
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
          welcome_email_sent_at: string | null
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
          welcome_email_sent_at?: string | null
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
          welcome_email_sent_at?: string | null
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
          early_merch_perk: string[]
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
          early_merch_perk?: string[]
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
          early_merch_perk?: string[]
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
      sponsor_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          sponsor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          sponsor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_contacts_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_interactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          occurred_at: string
          sponsor_id: string
          summary: string
          type: Database["public"]["Enums"]["sponsor_interaction_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          occurred_at?: string
          sponsor_id: string
          summary: string
          type: Database["public"]["Enums"]["sponsor_interaction_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          occurred_at?: string
          sponsor_id?: string
          summary?: string
          type?: Database["public"]["Enums"]["sponsor_interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_interactions_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          address: string | null
          committed_amount: number | null
          created_at: string
          expected_amount: number | null
          id: string
          name: string
          next_followup_at: string | null
          notes: string | null
          org_id: string
          owner_profile_id: string | null
          status: Database["public"]["Enums"]["sponsor_status"]
          website: string | null
        }
        Insert: {
          address?: string | null
          committed_amount?: number | null
          created_at?: string
          expected_amount?: number | null
          id?: string
          name: string
          next_followup_at?: string | null
          notes?: string | null
          org_id: string
          owner_profile_id?: string | null
          status?: Database["public"]["Enums"]["sponsor_status"]
          website?: string | null
        }
        Update: {
          address?: string | null
          committed_amount?: number | null
          created_at?: string
          expected_amount?: number | null
          id?: string
          name?: string
          next_followup_at?: string | null
          notes?: string | null
          org_id?: string
          owner_profile_id?: string | null
          status?: Database["public"]["Enums"]["sponsor_status"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_email_templates: {
        Row: {
          body_markdown: string
          created_at: string
          id: string
          name: string
          org_id: string
          subject: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          body_markdown: string
          created_at?: string
          id?: string
          name: string
          org_id: string
          subject: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          subject?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_email_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          meta: Json | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          meta?: Json | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          meta?: Json | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      hhh_legacy_leaderboard_v: {
        Row: {
          user_id: string | null
          display_name: string | null
          email: string | null
          manual_miles: number | null
          imported_miles: number | null
          auto_miles: number | null
          hhh_reg_count: number | null
          last_hhh_year: number | null
          total_hhh_miles: number | null
        }
        Relationships: []
      }
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
      media_entity_type: "event" | "ride_series" | "ride_occurrence" | "sponsor" | "page"
      media_kind: "image" | "video" | "embed"
      media_placement: "hero" | "gallery" | "section" | "banner"
      raffle_entry_source: "shop_ride" | "referral" | "bonus" | "event" | "early_bonus"
      registration_status:
        | "pending"
        | "paid"
        | "refunded"
        | "cancelled"
        | "free"
      ride_difficulty: "easy" | "moderate" | "hard"
      sponsor_interaction_type: "email" | "call" | "meeting" | "text"
      sponsor_status:
        | "prospect"
        | "contacted"
        | "negotiating"
        | "committed"
        | "paid"
        | "declined"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      event_status: ["draft", "published", "cancelled"],
      media_entity_type: ["event", "ride_series", "ride_occurrence", "sponsor", "page"],
      media_kind: ["image", "video", "embed"],
      media_placement: ["hero", "gallery", "section", "banner"],
      raffle_entry_source: ["shop_ride", "referral", "bonus", "event", "early_bonus"],
      registration_status: ["pending", "paid", "refunded", "cancelled", "free"],
      ride_difficulty: ["easy", "moderate", "hard"],
      sponsor_interaction_type: ["email", "call", "meeting", "text"],
      sponsor_status: [
        "prospect",
        "contacted",
        "negotiating",
        "committed",
        "paid",
        "declined",
      ],
      user_role: ["admin", "member"],
    },
  },
} as const
