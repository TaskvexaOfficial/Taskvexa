-- RUN THIS IN SUPABASE SQL EDITOR --

CREATE TABLE IF NOT EXISTS public.password_resets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email varchar NOT NULL UNIQUE,
  otp_code varchar NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempts int DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated to do operations (or keep to service_role)
-- If we only use it from the backend, we don't need to add public policies.
