-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL, -- 'support' | 'review' | 'bug' | 'suggestion'
  title TEXT,
  description TEXT NOT NULL,
  category TEXT,
  severity TEXT,
  rating INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);

-- RLS Policies
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can view all feedback" ON user_feedback;
  DROP POLICY IF EXISTS "Users can view their own feedback" ON user_feedback;
  DROP POLICY IF EXISTS "Users can insert their own feedback" ON user_feedback;
  DROP POLICY IF EXISTS "Admins can update feedback" ON user_feedback;
  DROP POLICY IF EXISTS "Admins can delete feedback" ON user_feedback;
END $$;

CREATE POLICY "Admins can view all feedback" 
ON user_feedback FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can update feedback" 
ON user_feedback FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can delete feedback" 
ON user_feedback FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can view their own feedback" 
ON user_feedback FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" 
ON user_feedback FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
