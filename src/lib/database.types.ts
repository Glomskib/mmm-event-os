export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
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
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "admin" | "member";
      event_status: "draft" | "published" | "cancelled";
      ride_difficulty: "easy" | "moderate" | "hard";
    };
  };
}
