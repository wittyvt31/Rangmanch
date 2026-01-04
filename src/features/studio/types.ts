export interface Film {
  id: string;
  uploader_id: string;
  title: string;
  description: string | null;
  duration: number | null;
  poster_url: string | null;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  status: "processing" | "live";
  submission_fee_paid: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Credit {
  id: string;
  film_id: string;
  profile_id: string | null;
  invited_email: string | null;
  role: string;
  is_confirmed: boolean;
  created_at: string;
}

export interface FilmFormData {
  title: string;
  description: string;
  duration: number;
  poster_url: string | null;
  mux_asset_id: string | null;
}

export interface CreditFormData {
  role: string;
  email: string;
}

