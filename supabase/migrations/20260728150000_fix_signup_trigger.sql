-- Ensure signup trigger works whether the enum uses 'listener' or 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    default_role := 'listener'::public.app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    default_role := 'user'::public.app_role;
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
