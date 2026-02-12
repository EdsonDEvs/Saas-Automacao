# Como Aplicar a Migration

## Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `supabase/migrations/005_agent_services_and_pending_appointments.sql`
4. Clique em **Run**

## Opção 2: Via CLI (se tiver configurado)

```bash
supabase db push
```

## O que a migration adiciona:

- Campo `service_catalog` em `agent_configs` (serviços e durações)
- Campos `service_name`, `service_duration_minutes`, `hold_expires_at` em `appointments` (reservas pendentes)
- Campo `welcome_sent_at` em `integrations` (controle de mensagem de boas-vindas)
- Índices para performance
