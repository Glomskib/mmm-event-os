-- Add welcome email tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN welcome_email_sent_at timestamptz;
