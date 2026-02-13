-- Migration 005 - Versão Segura (verifica se tabelas existem)
-- Add services catalog to agent configs
ALTER TABLE agent_configs
ADD COLUMN IF NOT EXISTS service_catalog JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add pending reservation fields to appointments (só se a tabela existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS service_name TEXT,
    ADD COLUMN IF NOT EXISTS service_duration_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMP WITH TIME ZONE;

    -- Cria índice só se a tabela existir
    CREATE INDEX IF NOT EXISTS idx_appointments_hold_expires_at ON appointments(hold_expires_at);
  END IF;
END $$;

-- Track onboarding/welcome message for integrations (só se a tabela existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integrations') THEN
    ALTER TABLE integrations
    ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;
