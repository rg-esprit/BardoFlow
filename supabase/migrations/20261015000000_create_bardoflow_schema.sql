-- BardoFlow Database Schema Migration (bardoflow schema)
-- Strictly isolated in the `bardoflow` schema per AGENTS.md rules

CREATE SCHEMA IF NOT EXISTS bardoflow;

-- 1. Tasks Table
CREATE TABLE IF NOT EXISTS bardoflow.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    deadline timestamptz,
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    department text NOT NULL DEFAULT 'General',
    assignee_name text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Meetings Table
CREATE TABLE IF NOT EXISTS bardoflow.meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    meeting_date timestamptz NOT NULL,
    location text,
    meeting_type text NOT NULL DEFAULT 'general' CHECK (meeting_type IN ('general', 'departmental', 'core_team', 'one_on_one')),
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    link text,
    created_at timestamptz DEFAULT now()
);

-- 3. Activities Table
CREATE TABLE IF NOT EXISTS bardoflow.activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    activity_type text NOT NULL DEFAULT 'task',
    created_at timestamptz DEFAULT now()
);

-- Trigger for auto-updating updated_at on bardoflow.tasks
CREATE OR REPLACE FUNCTION bardoflow.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_tasks_updated_at ON bardoflow.tasks;
CREATE TRIGGER tr_tasks_updated_at
BEFORE UPDATE ON bardoflow.tasks
FOR EACH ROW
EXECUTE FUNCTION bardoflow.set_updated_at();

-- Schema & Table Grants
GRANT USAGE ON SCHEMA bardoflow TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA bardoflow TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA bardoflow GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Row Level Security & Policies
ALTER TABLE bardoflow.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bardoflow.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bardoflow.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to tasks for anon and authenticated" ON bardoflow.tasks;
CREATE POLICY "Allow all access to tasks for anon and authenticated"
ON bardoflow.tasks
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to meetings for anon and authenticated" ON bardoflow.meetings;
CREATE POLICY "Allow all access to meetings for anon and authenticated"
ON bardoflow.meetings
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to activities for anon and authenticated" ON bardoflow.activities;
CREATE POLICY "Allow all access to activities for anon and authenticated"
ON bardoflow.activities
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
