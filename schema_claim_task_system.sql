-- SQL Migration for Claim Task System
-- Run this in your Supabase SQL Editor to update your database.

-- 1. Alter existing tasks table to support Claim Task System
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS claim_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS max_winners INTEGER DEFAULT 1;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_count INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS claim_timer_minutes INTEGER DEFAULT 5;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS current_claim_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS claim_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Create performance indexes for real-time and filters
CREATE INDEX IF NOT EXISTS idx_tasks_claim_enabled ON public.tasks(claim_enabled);
CREATE INDEX IF NOT EXISTS idx_tasks_current_claim_user ON public.tasks(current_claim_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_claim_expires ON public.tasks(claim_expires_at);

-- 3. Create atomic task claiming RPC function with Row Locking (FOR UPDATE)
CREATE OR REPLACE FUNCTION public.claim_task(
  p_task_id UUID,
  p_user_id UUID,
  p_timer_minutes INT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  claim_expires_at TIMESTAMP WITH TIME ZONE,
  current_claim_user_id UUID
) AS $$
DECLARE
  v_claim_enabled BOOLEAN;
  v_max_winners INTEGER;
  v_completed_count INTEGER;
  v_current_claim_user_id UUID;
  v_claim_expires_at TIMESTAMP WITH TIME ZONE;
  v_status TEXT;
  v_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
BEGIN
  -- Row locking at transaction level
  SELECT 
    t.claim_enabled, 
    t.max_winners, 
    t.completed_count, 
    t.current_claim_user_id, 
    t.claim_expires_at, 
    t.status
  INTO 
    v_claim_enabled, 
    v_max_winners, 
    v_completed_count, 
    v_current_claim_user_id, 
    v_claim_expires_at, 
    v_status
  FROM public.tasks t
  WHERE t.id = p_task_id
  FOR UPDATE;

  -- Task existence check
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found.'::TEXT, NULL::TIMESTAMP WITH TIME ZONE, NULL::UUID;
    RETURN;
  END IF;

  -- Direct standard flow if claim is not enabled
  IF NOT v_claim_enabled THEN
    RETURN QUERY SELECT TRUE, 'Claim system not enabled, standard task flow.'::TEXT, NULL::TIMESTAMP WITH TIME ZONE, NULL::UUID;
    RETURN;
  END IF;

  -- Active task status check
  IF v_status <> 'active' THEN
    RETURN QUERY SELECT FALSE, 'This task is no longer active.'::TEXT, NULL::TIMESTAMP WITH TIME ZONE, NULL::UUID;
    RETURN;
  END IF;

  -- Check winners limits
  IF v_completed_count >= v_max_winners THEN
    UPDATE public.tasks 
    SET status = 'closed'
    WHERE id = p_task_id;
    
    RETURN QUERY SELECT FALSE, 'This task is closed. Maximum winner limit reached.'::TEXT, NULL::TIMESTAMP WITH TIME ZONE, NULL::UUID;
    RETURN;
  END IF;

  -- Check active claims by other users
  IF v_current_claim_user_id IS NOT NULL AND v_claim_expires_at > v_now THEN
    IF v_current_claim_user_id = p_user_id THEN
      RETURN QUERY SELECT TRUE, 'Task already claimed by you.'::TEXT, v_claim_expires_at, v_current_claim_user_id;
      RETURN;
    ELSE
      RETURN QUERY SELECT FALSE, 'This task is currently being completed by another member.'::TEXT, v_claim_expires_at, v_current_claim_user_id;
      RETURN;
    END IF;
  END IF;

  -- Set new claim values
  v_claim_expires_at := v_now + (p_timer_minutes * INTERVAL '1 minute');
  
  UPDATE public.tasks
  SET 
    current_claim_user_id = p_user_id,
    claim_started_at = v_now,
    claim_expires_at = v_claim_expires_at
  WHERE id = p_task_id;

  RETURN QUERY SELECT TRUE, 'Task successfully claimed!'::TEXT, v_claim_expires_at, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create atomic release of expired claims RPC
CREATE OR REPLACE FUNCTION public.release_expired_claim(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_claim_expires_at TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
BEGIN
  SELECT claim_expires_at INTO v_claim_expires_at
  FROM public.tasks
  WHERE id = p_task_id FOR UPDATE;

  IF FOUND AND v_claim_expires_at IS NOT NULL AND v_claim_expires_at <= v_now THEN
    UPDATE public.tasks
    SET 
      current_claim_user_id = NULL,
      claim_started_at = NULL,
      claim_expires_at = NULL
    WHERE id = p_task_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create RPC to manually cancel active claim (e.g. exit button)
CREATE OR REPLACE FUNCTION public.cancel_task_claim(p_task_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.tasks
  SET 
    current_claim_user_id = NULL,
    claim_started_at = NULL,
    claim_expires_at = NULL
  WHERE id = p_task_id AND current_claim_user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create RPC to globally clean up all expired claims across any task in real-time
CREATE OR REPLACE FUNCTION public.release_expired_claims_global()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.tasks
  SET 
    current_claim_user_id = NULL,
    claim_started_at = NULL,
    claim_expires_at = NULL
  WHERE claim_enabled = true 
    AND claim_expires_at IS NOT NULL 
    AND claim_expires_at <= timezone('utc'::text, now());
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

