-- Migration 007: Sistema de Lembretes de Agendamentos
-- Cria tabela de configurações de lembretes
CREATE TABLE IF NOT EXISTS appointment_reminder_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_hours_before INTEGER NOT NULL DEFAULT 24, -- Horas antes do agendamento para enviar lembrete
  reminder_message_template TEXT NOT NULL DEFAULT 'Olá {customer_name}! Este é um lembrete do seu agendamento para {appointment_date} às {appointment_time}. Esperamos você!',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Adiciona campos de rastreamento de lembretes na tabela appointments
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false;
    
    -- Cria índice para melhorar performance nas consultas de lembretes
    CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent ON appointments(reminder_sent, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_reminder_date ON appointments(appointment_date) WHERE reminder_sent = false AND status IN ('scheduled', 'confirmed');
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE appointment_reminder_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own reminder settings" ON appointment_reminder_settings;
DROP POLICY IF EXISTS "Users can insert own reminder settings" ON appointment_reminder_settings;
DROP POLICY IF EXISTS "Users can update own reminder settings" ON appointment_reminder_settings;
DROP POLICY IF EXISTS "Users can delete own reminder settings" ON appointment_reminder_settings;

-- RLS Policies for appointment_reminder_settings
CREATE POLICY "Users can view own reminder settings"
  ON appointment_reminder_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder settings"
  ON appointment_reminder_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminder settings"
  ON appointment_reminder_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminder settings"
  ON appointment_reminder_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_appointment_reminder_settings_updated_at ON appointment_reminder_settings;

CREATE TRIGGER update_appointment_reminder_settings_updated_at
  BEFORE UPDATE ON appointment_reminder_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user_id ON appointment_reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_enabled ON appointment_reminder_settings(enabled) WHERE enabled = true;
