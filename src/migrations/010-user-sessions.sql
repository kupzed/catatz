-- Migration: 010-user-sessions
-- Description: Tabel untuk mencatat sesi aktif (active sessions) pengguna

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    auth_session_id TEXT, -- nullable, karena kita melacak di app level jika tidak bisa mapping auth session persis
    device_id TEXT, -- untuk mencocokkan cookie di client
    device_name TEXT,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    location TEXT,
    user_agent TEXT,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

-- Indexes untuk pencarian cepat (middleware akan selalu query ke tabel ini)
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON public.user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked_at ON public.user_sessions(revoked_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active_at ON public.user_sessions(last_active_at DESC);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa melihat session miliknya sendiri
CREATE POLICY "Users can view own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: User bisa insert session miliknya sendiri
CREATE POLICY "Users can insert own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: User bisa update session miliknya sendiri
CREATE POLICY "Users can update own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Note: User tidak diizinkan DELETE (hard delete), cukup update revoked_at
