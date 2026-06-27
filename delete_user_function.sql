-- RUN THIS IN SUPABASE SQL EDITOR --

-- 1. Ensure the 'referred_by' column exists safely in profiles table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'referred_by') THEN
    ALTER TABLE public.profiles ADD COLUMN referred_by uuid;
  END IF;
END $$;

-- 2. Add/Fix the foreign key constraint for referrals with ON DELETE SET NULL
-- This prevents deletion errors when a user who has invited others is deleted
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_referred_by_fkey 
FOREIGN KEY (referred_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Function to delete a user from auth.users permanently
-- SECURITY DEFINER allows it to bypass RLS and delete from the 'auth' schema
CREATE OR REPLACE FUNCTION delete_user_permanently(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- SECURITY CHECK: Only allow admins to call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only admins can delete users.';
  END IF;

  -- DELETE from auth.users
  -- This will automatically delete the corresponding record in public.profiles 
  -- because of the ON DELETE CASCADE constraint on the profile's primary key (user_id).
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

