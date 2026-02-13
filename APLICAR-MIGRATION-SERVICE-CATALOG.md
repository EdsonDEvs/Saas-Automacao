# Como Aplicar a Migration de service_catalog

## ⚠️ Erro Atual

Você está vendo o erro:
```
Could not find the 'service_catalog' column of 'agent_configs' in the schema cache
```

Ou ao tentar executar a migration:
```
ERROR: 42P01: relation "appointments" does not exist
```

Isso significa que:
1. A coluna `service_catalog` não existe na tabela `agent_configs`
2. A tabela `appointments` pode não existir ainda (se você viu esse erro)

## 🔄 Ordem das Migrations

Se você ainda não aplicou todas as migrations, siga esta ordem:

1. **Migration 001**: Schema inicial (profiles, agent_configs, products, etc.)
2. **Migration 002**: Correções de integrações
3. **Migration 003**: Tabelas de agendamentos (appointments, google_calendar_configs, etc.)
4. **Migration 004**: Correções de signup
5. **Migration 005**: service_catalog e campos de agendamento pendente ⬅️ **Esta migration**
6. **Migration 006**: Renomear products para services

## 📋 Solução: Aplicar a Migration 005

### 1. Acesse o Supabase Dashboard

1. Vá para [https://app.supabase.com](https://app.supabase.com)
2. Faça login na sua conta
3. Selecione o projeto do SaaS Automação

### 2. Acesse o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### 3. Execute a Migration

**⚠️ IMPORTANTE:** Use a versão segura da migration abaixo. Ela verifica se as tabelas existem antes de modificá-las, então funciona mesmo se você ainda não aplicou a migration 003.

**Opção A - Versão Segura (Recomendada):**

Copie e cole este SQL:

```sql
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
```

**Nota:** Esta versão verifica se as tabelas `appointments` e `integrations` existem antes de tentar modificá-las, evitando erros se essas tabelas ainda não foram criadas.

**Opção B - Se você já aplicou a migration 003:**

Se você tem certeza de que a tabela `appointments` já existe, pode usar a versão original:

```sql
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
```

**Recomendação:** Use a **Opção A** (versão segura) para evitar erros.

### 4. Execute a Query

1. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
2. Aguarde a confirmação de sucesso

### 5. Verifique se Funcionou

Execute esta query para verificar se a coluna foi criada:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agent_configs'
AND column_name = 'service_catalog';
```

Você deve ver a coluna `service_catalog` com tipo `jsonb`.

## ✅ Após a Migration

Depois de aplicar a migration:

1. **Recarregue a aplicação** no navegador (F5 ou Ctrl+R)
2. **Acesse a página `/agent`** - deve funcionar normalmente agora
3. **Tente salvar as configurações do agente** - não deve mais dar erro

## 🔄 O que a Migration Faz

Esta migration adiciona:

1. **`service_catalog`** na tabela `agent_configs`:
   - Tipo: JSONB
   - Valor padrão: `[]` (array vazio)
   - Permite armazenar catálogo de serviços do agente

2. **Campos de agendamento pendente** na tabela `appointments`:
   - `service_name`: Nome do serviço
   - `service_duration_minutes`: Duração em minutos
   - `hold_expires_at`: Data de expiração da reserva temporária

3. **Índice** para melhorar performance nas consultas de agendamentos pendentes

4. **`welcome_sent_at`** na tabela `integrations`:
   - Rastreia quando a mensagem de boas-vindas foi enviada

## ❓ Problemas?

Se encontrar algum erro:

1. **Erro de permissão**: Certifique-se de que você tem permissões de administrador no Supabase
2. **Coluna já existe**: Se a coluna já existir, a migration não fará nada (usa `IF NOT EXISTS`)
3. **Tabela não existe**: Se a tabela `agent_configs` não existir, você precisa aplicar as migrations anteriores primeiro

## 📝 Notas

- A migration é **idempotente** (pode ser executada múltiplas vezes sem problemas)
- Os dados existentes não serão afetados
- A coluna terá valor padrão `[]` para registros existentes
