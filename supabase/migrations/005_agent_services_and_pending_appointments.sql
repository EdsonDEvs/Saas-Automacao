-- Add services catalog to agent configs
ALTER TABLE agent_configs
ADD COLUMN IF NOT EXISTS service_catalog JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add pending reservation fields to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS service_name TEXT,
ADD COLUMN IF NOT EXISTS service_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_appointments_hold_expires_at ON appointments(hold_expires_at);

-- Track onboarding/welcome message for integrations
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMP WITH TIME ZONE;
