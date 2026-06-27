ALTER TABLE IF EXISTS user_feedback ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Drop existing policies on user_feedback if any, so we can re-create them properly
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
