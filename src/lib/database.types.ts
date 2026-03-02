export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "admin" | "member";
          created_at: string;
        };
        Insert: {
          id: string;
          org_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "member";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          description: string | null;
          date: string;
          location: string | null;
          image_url: string | null;
          status: "draft" | "published" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          description?: string | null;
          date: string;
          location?: string | null;
          image_url?: string | null;
          status?: "draft" | "published" | "cancelled";
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          location?: string | null;
          image_url?: string | null;
          status?: "draft" | "published" | "cancelled";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      ride_series: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          description: string | null;
          day_of_week: number;
          time: string;
          location: string | null;
          difficulty: "easy" | "moderate" | "hard";
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          description?: string | null;
          day_of_week: number;
          time: string;
          location?: string | null;
          difficulty?: "easy" | "moderate" | "hard";
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          description?: string | null;
          day_of_week?: number;
          time?: string;
          location?: string | null;
          difficulty?: "easy" | "moderate" | "hard";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ride_series_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      ride_occurrences: {
        Row: {
          id: string;
          series_id: string;
          org_id: string;
          date: string;
          cancelled: boolean;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          org_id: string;
          date: string;
          cancelled?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          org_id?: string;
          date?: string;
          cancelled?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ride_occurrences_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "ride_series";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ride_occurrences_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      checkins: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          event_id: string | null;
          ride_occurrence_id: string | null;
          photo_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          event_id?: string | null;
          ride_occurrence_id?: string | null;
          photo_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          event_id?: string | null;
          ride_occurrence_id?: string | null;
          photo_path?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checkins_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_ride_occurrence_id_fkey";
            columns: ["ride_occurrence_id"];
            isOneToOne: false;
            referencedRelation: "ride_occurrences";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "admin" | "member";
      event_status: "draft" | "published" | "cancelled";
      ride_difficulty: "easy" | "moderate" | "hard";
    };
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row types
export type Org = Database["public"]["Tables"]["orgs"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type RideSeries = Database["public"]["Tables"]["ride_series"]["Row"];
export type RideOccurrence = Database["public"]["Tables"]["ride_occurrences"]["Row"];
export type Checkin = Database["public"]["Tables"]["checkins"]["Row"];
