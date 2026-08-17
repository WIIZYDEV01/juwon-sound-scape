-- De Soundwave: run this once in Supabase SQL Editor for project elyjmqmluldzlptxmabi
-- Authentication > Providers > Email: turn OFF "Confirm email" for local testing

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'artist', 'listener');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'listener',
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'listener')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'artist')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_url TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  plays INTEGER NOT NULL DEFAULT 0,
  genre TEXT,
  lyrics TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view songs" ON public.songs;
CREATE POLICY "Anyone can view songs" ON public.songs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert songs" ON public.songs;
CREATE POLICY "Users can insert songs" ON public.songs
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own songs" ON public.songs;
CREATE POLICY "Users can update own songs" ON public.songs
  FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid()) WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own songs" ON public.songs;
CREATE POLICY "Users can delete own songs" ON public.songs
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.liked_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, song_id)
);

ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own likes" ON public.liked_songs;
CREATE POLICY "Users can view own likes" ON public.liked_songs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can like songs" ON public.liked_songs;
CREATE POLICY "Users can like songs" ON public.liked_songs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unlike songs" ON public.liked_songs;
CREATE POLICY "Users can unlike songs" ON public.liked_songs
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.play_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own history" ON public.play_history;
CREATE POLICY "Users can view own history" ON public.play_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert history" ON public.play_history;
CREATE POLICY "Users can insert history" ON public.play_history
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view audio" ON storage.objects;
CREATE POLICY "Anyone can view audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio');

DROP POLICY IF EXISTS "Authenticated can upload audio" ON storage.objects;
CREATE POLICY "Authenticated can upload audio" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio');

DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;
CREATE POLICY "Anyone can view covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Authenticated can upload covers" ON storage.objects;
CREATE POLICY "Authenticated can upload covers" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');
