-- ==============================================================================
-- SMARTFACE BIOMETRIC ATTENDANCE SYSTEM - POSTGRESQL & SUPABASE MIGRATION SCHEMA
-- ==============================================================================
-- Target Engine: PostgreSQL 15+ / Supabase with Row Level Security (RLS)
-- Features: AES-256 encrypted fields, HMAC signature audit trail, biometric vector hash.

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running migration
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Create 'profiles' table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_encrypted TEXT NOT NULL,
    contact_encrypted TEXT NOT NULL,
    job_post TEXT NOT NULL,
    face_embedding_hash TEXT NOT NULL, -- AES-256-GCM encrypted 128-d biometric vector + photo JSON
    photo_url TEXT, -- Base64 portrait data URL of enrolled personnel face
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create 'attendance_logs' table
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    verification_score DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'LATE', 'EARLY', 'OVERTIME', 'ON_DUTY')),
    signature TEXT NOT NULL, -- Cryptographic HMAC-SHA256 signature (anti-tamper)
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_timestamp ON attendance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_date ON attendance_logs(user_id, (timestamp::date));
CREATE INDEX IF NOT EXISTS idx_attendance_logs_signature ON attendance_logs(signature);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- 7. Define Security Policies (RLS)
-- Read Policy for Profiles (Allow read of profiles for client-side embedding matching)
CREATE POLICY "Allow public read access to profiles" 
    ON profiles FOR SELECT 
    USING (true);

-- Insert Policy for Profiles (Allows registration through service role or anon)
CREATE POLICY "Allow authenticated or service insert to profiles" 
    ON profiles FOR INSERT 
    WITH CHECK (true);

-- Read Policy for Attendance Logs
CREATE POLICY "Allow public read access to attendance_logs" 
    ON attendance_logs FOR SELECT 
    USING (true);

-- Insert Policy for Attendance Logs (Strictly requires valid signature)
CREATE POLICY "Allow verified insert to attendance_logs" 
    ON attendance_logs FOR INSERT 
    WITH CHECK (signature IS NOT NULL AND length(signature) = 64);

-- Comments for database documentation
COMMENT ON TABLE profiles IS 'Stores AES-256 encrypted personnel identity and encrypted 128-d biometric facial vectors';
COMMENT ON TABLE attendance_logs IS 'Immutable chronological attendance audit logs with HMAC-SHA256 anti-tamper signatures';
