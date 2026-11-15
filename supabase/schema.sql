-- ==============================================================================
-- InternPilot: Production PostgreSQL & Supabase Security Hardening Schema
-- Implements: Row Level Security (RLS), Least Privilege, Private Buckets, & Anti-IDOR
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Corresponds to auth.uid() or student-{email}
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    university TEXT NOT NULL DEFAULT 'Makerere University',
    course TEXT NOT NULL,
    year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 6),
    skills TEXT[] NOT NULL DEFAULT '{}',
    interests TEXT[] NOT NULL DEFAULT '{}',
    experience_summary TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- MANDATORY: Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any previous permissive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;

-- RLS Policy: Students can strictly read only their own profile (IDOR Defense)
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.jwt()->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'admin'
    );

-- RLS Policy: Students can strictly update only their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR auth.jwt()->>'role' = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id
        OR auth.jwt()->>'role' = 'service_role'
    );

-- RLS Policy: Users can only insert a profile bound to their own auth.uid()
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR auth.jwt()->>'role' = 'service_role'
    );


-- 3. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    location TEXT NOT NULL,
    deadline DATE NOT NULL,
    eligibility TEXT NOT NULL,
    requirements TEXT[] NOT NULL DEFAULT '{}',
    link TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Internship', 'Scholarship', 'Fellowship', 'Graduate Trainee')),
    is_verified BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at DATE DEFAULT CURRENT_DATE NOT NULL
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view verified opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Admins can manage opportunities" ON public.opportunities;

-- RLS Policy: Public read access strictly for verified listings
CREATE POLICY "Public can view verified opportunities"
    ON public.opportunities
    FOR SELECT
    USING (is_verified = true);

-- RLS Policy: Only verified admins or backend service role can insert/update/delete
CREATE POLICY "Admins can manage opportunities"
    ON public.opportunities
    FOR ALL
    USING (
        auth.jwt()->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'admin'
    )
    WITH CHECK (
        auth.jwt()->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'admin'
    );


-- 4. APPLICATIONS & TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interviewing', 'accepted', 'rejected')),
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, opportunity_id)
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own applications" ON public.applications;

-- RLS Policy: Strict student data isolation (No IDOR leakage across students)
CREATE POLICY "Users manage own applications"
    ON public.applications
    FOR ALL
    USING (
        auth.uid() = user_id
        OR auth.jwt()->>'role' = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id
        OR auth.jwt()->>'role' = 'service_role'
    );


-- 5. PRIVATE STORAGE BUCKET HARDENING (Resume / CV Uploads)
-- Buckets MUST NEVER be public by default.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-resumes',
    'student-resumes',
    false, -- STRICTLY PRIVATE
    5242880, -- 5 MB MAX
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf'];

-- Storage RLS: Students can only read/write files in their own folder (`userId/*`)
DROP POLICY IF EXISTS "Students manage own resumes" ON storage.objects;
CREATE POLICY "Students manage own resumes"
    ON storage.objects
    FOR ALL
    USING (
        bucket_id = 'student-resumes'
        AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt()->>'role' = 'service_role')
    )
    WITH CHECK (
        bucket_id = 'student-resumes'
        AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt()->>'role' = 'service_role')
    );

