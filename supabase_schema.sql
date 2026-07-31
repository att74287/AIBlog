-- =========================================================
-- SecCom Anonymous Vault - Supabase Database Schema
-- Run this script inside your Supabase SQL Editor
-- =========================================================

-- 1. Vault Users Table (User & Admin Credentials)
CREATE TABLE IF NOT EXISTS public.vault_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  passkey TEXT NOT NULL,
  role TEXT DEFAULT 'User',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clean old demo users and seed clean user/user and admin/admin accounts
TRUNCATE TABLE public.vault_users;

INSERT INTO public.vault_users (username, passkey, role, status)
VALUES 
  ('admin', 'admin', 'Admin', 'Active'),
  ('user', 'user', 'User', 'Active')
ON CONFLICT (username) DO UPDATE SET passkey = EXCLUDED.passkey, role = EXCLUDED.role;

-- 2. Room Encrypted Messages Table
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room TEXT NOT NULL DEFAULT '#general-vault',
  sender TEXT NOT NULL,
  cipher TEXT NOT NULL,
  text TEXT NOT NULL,
  auto_burn INT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Direct Encrypted Messages Table (Admin <-> User)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user TEXT NOT NULL,
  sender TEXT NOT NULL,
  cipher TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'delivered',
  is_pinned BOOLEAN DEFAULT false,
  is_ghost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pinned Direct Messages Table
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user TEXT UNIQUE NOT NULL,
  message_id TEXT NOT NULL,
  message_data JSONB NOT NULL,
  pinned_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Gateway Login History & Security Audit Table
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  ip TEXT NOT NULL,
  status TEXT NOT NULL,
  device TEXT,
  risk TEXT DEFAULT 'LOW',
  used_credentials JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Allow Public Read/Write
ALTER TABLE public.vault_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on vault_users" ON public.vault_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on vault_users" ON public.vault_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on vault_users" ON public.vault_users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on vault_users" ON public.vault_users FOR DELETE USING (true);

CREATE POLICY "Allow public select on room_messages" ON public.room_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on room_messages" ON public.room_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on room_messages" ON public.room_messages FOR DELETE USING (true);

CREATE POLICY "Allow public select on direct_messages" ON public.direct_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on direct_messages" ON public.direct_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on direct_messages" ON public.direct_messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on direct_messages" ON public.direct_messages FOR DELETE USING (true);

CREATE POLICY "Allow public select on pinned_messages" ON public.pinned_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on pinned_messages" ON public.pinned_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on pinned_messages" ON public.pinned_messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on pinned_messages" ON public.pinned_messages FOR DELETE USING (true);

CREATE POLICY "Allow public select on login_history" ON public.login_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on login_history" ON public.login_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on login_history" ON public.login_history FOR DELETE USING (true);

-- Enable Realtime Replication on tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_history;
