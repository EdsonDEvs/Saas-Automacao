-- Migração alternativa: Se a tabela já existe, apenas cria políticas e triggers
-- Execute este arquivo se a tabela integrations já existe mas faltam políticas/triggers

-- Verifica se a tabela existe e cria apenas o que falta
DO $$
BEGIN
  -- Enable Row Level Security (não causa erro se já estiver habilitado)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integrations') THEN
    ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist (idempotente)
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
