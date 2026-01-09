-- Create integrations table to store WhatsApp, Telegram, etc. configurations
-- Usa IF NOT EXISTS para tornar idempotente
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, -- 'whatsapp', 'telegram', 'webhook', etc.
  webhook_url TEXT, -- URL do webhook do cliente (Evolution API, Twilio, etc.)
  api_key TEXT, -- API key do serviço (Evolution API, Telegram Bot Token, etc.)
  instance_name TEXT, -- Nome da instância (Evolution API)
  phone_number TEXT, -- Número do WhatsApp
  bot_token TEXT, -- Token do bot (Telegram)
  is_active BOOLEAN NOT NULL DEFAULT true,
  webhook_secret TEXT, -- Secret para validar webhooks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, platform)
);

-- Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete own integrations" ON integrations;

-- RLS Policies for integrations
CREATE POLICY "Users can view own integrations"
  ON integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
