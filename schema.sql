-- Create Tables and Columns for complete referral system

-- 1. Ensure profiles table has the right columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_referral_earnings NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tasks_pending INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS uid TEXT;


-- 2. Create referral_earnings table
CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES profiles(id) NOT NULL,
  referred_user_id UUID REFERENCES profiles(id) NOT NULL,
  task_completion_id UUID NOT NULL, -- references task_submissions(id)
  commission_percentage NUMERIC DEFAULT 5,
  commission_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred ON referral_earnings(referred_user_id);

-- RLS Policies for referral_earnings
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

-- Referrers can see their earnings
CREATE POLICY "Referrers can see their own earnings" 
ON referral_earnings FOR SELECT 
TO authenticated 
USING (auth.uid() = referrer_user_id);

-- Enable insert for all users to prevent RLS write blocks
CREATE POLICY "Enable insert for all users on referral_earnings" 
ON referral_earnings FOR INSERT 
WITH CHECK (true);

-- Admins can do everything
CREATE POLICY "Admins can do everything on referral_earnings" 
ON referral_earnings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
