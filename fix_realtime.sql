-- Enable realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for the profiles table (for referral stats)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
