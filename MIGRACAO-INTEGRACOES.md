# ⚠️ IMPORTANTE: Execute esta migração no Supabase

## Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá em: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em **"SQL Editor"**
   - Ou acesse diretamente: https://supabase.com/dashboard/project/[seu-projeto]/sql

3. **Execute a migração**
   - Clique em **"New query"**
   - Cole o SQL abaixo
   - Clique em **"Run"** (ou pressione `Ctrl+Enter`)

## SQL para Executar

```sql
-- Create integrations table to store WhatsApp, Telegram, etc. configurations
-- Usa IF NOT EXISTS para tornar idempotente (pode executar várias vezes)
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
```

## ⚠️ Se a Tabela Já Existe

Se você receber o erro `relation "integrations" already exists`, significa que a tabela já foi criada mas faltam as políticas RLS ou triggers.

**Solução:** Execute o arquivo `002_integrations_fix.sql` ao invés do `002_integrations.sql`. Ele só cria as políticas e triggers que faltam, sem tentar criar a tabela novamente.

## ✅ Verificação

Após executar, você deve ver a mensagem de sucesso. A tabela `integrations` será criada (ou as políticas/triggers serão adicionadas) e você poderá usar a página de configuração normalmente.

## 🔄 Após Executar

1. Recarregue a página `/setup` no navegador
2. Tente configurar novamente
3. O erro não deve mais aparecer!
