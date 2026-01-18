export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          reputation_score: number;
          role: string;
          created_at: string;
          coins: number;
          bio: string | null;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string | null;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          reputation_score?: number;
          role?: string;
          created_at?: string;
          coins?: number;
          bio?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      films: {
        Row: {
          id: string;
          uploader_id: string;
          title: string;
          slug: string | null;
          description: string | null;
          mux_playback_id: string | null;
          mux_asset_id: string | null;
          duration_mins: number | null;
          poster_url: string | null;
          status: string;
          submission_fee_paid: boolean;
          launch_date: string;
          created_at: string;
          views: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uploader_id: string;
          title: string;
          slug?: string | null;
          description?: string | null;
          mux_playback_id?: string | null;
          mux_asset_id?: string | null;
          duration_mins?: number | null;
          poster_url?: string | null;
          status?: string;
          submission_fee_paid?: boolean;
          launch_date?: string;
          created_at?: string;
          views?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['films']['Insert']>;
      };
      credits: {
        Row: {
          id: string;
          film_id: string;
          profile_id: string | null;
          invited_email: string | null;
          role: string;
          is_confirmed: boolean;
        };
        Insert: {
          id?: string;
          film_id: string;
          profile_id?: string | null;
          invited_email?: string | null;
          role: string;
          is_confirmed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['credits']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string | null;
          amount: number;
          razorpay_order_id: string | null;
          status: string;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          amount: number;
          razorpay_order_id?: string | null;
          status?: string;
          type: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
    };
  };
}

