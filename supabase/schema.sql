CREATE TABLE public.credits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  film_id uuid NOT NULL,
  profile_id uuid,
  invited_email text,
  role text NOT NULL,
  is_confirmed boolean DEFAULT false,
  CONSTRAINT credits_pkey PRIMARY KEY (id),
  CONSTRAINT credits_film_id_fkey FOREIGN KEY (film_id) REFERENCES public.films(id),
  CONSTRAINT credits_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.films (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  uploader_id uuid NOT NULL,
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  mux_playback_id text,
  mux_asset_id text,
  duration_mins integer,
  poster_url text,
  status text DEFAULT 'processing'::text,
  submission_fee_paid boolean DEFAULT false,
  launch_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT films_pkey PRIMARY KEY (id),
  CONSTRAINT films_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  full_name text,
  username text UNIQUE,
  avatar_url text,
  reputation_score integer DEFAULT 0,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  submission_credits integer NOT NULL DEFAULT 0,
  bio text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  amount numeric NOT NULL,
  razorpay_order_id text,
  status text DEFAULT 'pending'::text,
  type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

