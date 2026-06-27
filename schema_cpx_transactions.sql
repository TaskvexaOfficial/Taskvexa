-- ====================================================================
-- CPX RESEARCH S2S CALLBACK TRANSACTION SCHEMAS
-- ====================================================================
-- Run this script inside your Supabase SQL Editor (https://database.new)
-- This creates a secure, resilient logging system to record survey completions,
-- prevent duplicate rewards, and handle cancellation/chargeback operations.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.cpx_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trans_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    coins INTEGER NOT NULL,
    status INTEGER NOT NULL DEFAULT 1, -- 1 = completed/credited, 2 = cancelled/reversed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for rapid duplicate lookup and verification
CREATE INDEX IF NOT EXISTS idx_cpx_transactions_trans_id ON public.cpx_transactions(trans_id);
CREATE INDEX IF NOT EXISTS idx_cpx_transactions_user_id ON public.cpx_transactions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.cpx_transactions ENABLE ROW LEVEL SECURITY;

-- 1. Security: Only direct database administrators (or backend standard Service Role) can create or update entries
CREATE POLICY "Admins can manage cpx_transactions" 
ON public.cpx_transactions FOR ALL 
TO service_role
USING (true);

-- 2. Security: Authenticated users can view their own transaction completion history
CREATE POLICY "Users can select their own cpx_transactions" 
ON public.cpx_transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

SELECT 'SUCCESS: Table public.cpx_transactions and matching security policies created successfully.' AS status;
