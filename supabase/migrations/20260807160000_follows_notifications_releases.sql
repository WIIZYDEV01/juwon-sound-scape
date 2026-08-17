-- Follows + in-app notifications (run in Supabase SQL Editor when ready)
-- Enables artist follow + new-release notification storage.
-- Sync jobs should run server-side (Edge Function / cron), not on every page load.

CREATE TABLE IF NOT EXISTS public.artist_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_artist_id TEXT NOT NULL,
  artist_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, provider_artist_id)
);

ALTER TABLE public.artist_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own follows" ON public.artist_follows;
CREATE POLICY "Users manage own follows" ON public.artist_follows
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'new_release',
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.provider_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_release_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT,
  release_date TIMESTAMPTZ,
  artwork_url TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_release_id)
);
