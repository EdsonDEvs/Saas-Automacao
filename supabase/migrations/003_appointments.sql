-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'cancelled', 'completed'
  notes TEXT,
  google_calendar_event_id TEXT, -- ID do evento no Google Calendar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create google_calendar_configs table
CREATE TABLE IF NOT EXISTS google_calendar_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  access_token TEXT, -- Token de acesso OAuth
  refresh_token TEXT, -- Token de refresh OAuth
  token_expires_at TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT NOT NULL DEFAULT 'primary', -- ID do calendário do Google
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create appointment_settings table (horários disponíveis, duração padrão, etc.)
CREATE TABLE IF NOT EXISTS appointment_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  default_duration_minutes INTEGER NOT NULL DEFAULT 60,
  available_days TEXT[] NOT NULL DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], -- Dias da semana disponíveis
  start_time TIME NOT NULL DEFAULT '09:00:00', -- Horário de início (formato HH:MM:SS)
  end_time TIME NOT NULL DEFAULT '18:00:00', -- Horário de fim
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  buffer_minutes INTEGER NOT NULL DEFAULT 15, -- Tempo entre agendamentos
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON appointments;

DROP POLICY IF EXISTS "Users can view own google calendar config" ON google_calendar_configs;
DROP POLICY IF EXISTS "Users can insert own google calendar config" ON google_calendar_configs;
DROP POLICY IF EXISTS "Users can update own google calendar config" ON google_calendar_configs;
DROP POLICY IF EXISTS "Users can delete own google calendar config" ON google_calendar_configs;

DROP POLICY IF EXISTS "Users can view own appointment settings" ON appointment_settings;
DROP POLICY IF EXISTS "Users can insert own appointment settings" ON appointment_settings;
DROP POLICY IF EXISTS "Users can update own appointment settings" ON appointment_settings;
DROP POLICY IF EXISTS "Users can delete own appointment settings" ON appointment_settings;

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for google_calendar_configs
CREATE POLICY "Users can view own google calendar config"
  ON google_calendar_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own google calendar config"
  ON google_calendar_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own google calendar config"
  ON google_calendar_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own google calendar config"
  ON google_calendar_configs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for appointment_settings
CREATE POLICY "Users can view own appointment settings"
  ON appointment_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointment settings"
  ON appointment_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointment settings"
  ON appointment_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointment settings"
  ON appointment_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
DROP TRIGGER IF EXISTS update_google_calendar_configs_updated_at ON google_calendar_configs;
DROP TRIGGER IF EXISTS update_appointment_settings_updated_at ON appointment_settings;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_calendar_configs_updated_at
  BEFORE UPDATE ON google_calendar_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_settings_updated_at
  BEFORE UPDATE ON appointment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
