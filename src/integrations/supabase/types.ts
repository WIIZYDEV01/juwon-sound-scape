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
      songs: {
        Row: {
          id: string;
          title: string;
          artist_name: string;
          uploaded_by: string;
          cover_url: string | null;
          audio_url: string;
          duration: number;
          plays: number;
          genre: string | null;
          lyrics: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist_name: string;
          uploaded_by?: string;
          cover_url?: string | null;
          audio_url: string;
          duration?: number;
          plays?: number;
          genre?: string | null;
          lyrics?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist_name?: string;
          uploaded_by?: string;
          cover_url?: string | null;
          audio_url?: string;
          duration?: number;
          plays?: number;
          genre?: string | null;
          lyrics?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      liked_songs: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          song_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      play_history: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          played_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          played_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          song_id?: string;
          played_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          plan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          plan?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          plan?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
