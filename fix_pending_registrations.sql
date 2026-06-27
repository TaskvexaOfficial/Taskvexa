ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all operations" ON pending_registrations;

CREATE POLICY "Allow anon all operations" 
ON pending_registrations 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);
