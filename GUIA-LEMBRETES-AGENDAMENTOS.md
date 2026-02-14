# 🔔 Sistema de Lembretes de Agendamentos

## 📋 Visão Geral

O sistema de lembretes permite enviar mensagens automáticas via WhatsApp para clientes que têm agendamentos, configurando o horário ideal para enviar esses lembretes.

## ✨ Funcionalidades

- ✅ **Configuração personalizada** - Defina quantas horas antes do agendamento enviar o lembrete
- ✅ **Template de mensagem** - Personalize a mensagem com variáveis dinâmicas
- ✅ **Ativação/Desativação** - Controle quando os lembretes devem ser enviados
- ✅ **Envio automático** - Sistema verifica e envia lembretes automaticamente via cron job
- ✅ **Rastreamento** - Sistema marca quais lembretes já foram enviados

## 🚀 Como Usar

### 1. Aplicar Migration

Primeiro, aplique a migration que cria as tabelas necessárias:

```sql
-- Execute no Supabase SQL Editor
-- Arquivo: supabase/migrations/007_appointment_reminders.sql
```

Ou via CLI:

```bash
supabase migration up
```

### 2. Configurar Lembretes

1. Acesse `/appointments/reminders` no sistema
2. Configure:
   - **Ativar Lembretes**: Marque para ativar o sistema
   - **Horas Antes do Agendamento**: Quantas horas antes enviar (ex: 24 horas)
   - **Template da Mensagem**: Personalize a mensagem usando variáveis:
     - `{customer_name}` - Nome do cliente
     - `{appointment_date}` - Data do agendamento
     - `{appointment_time}` - Horário do agendamento
     - `{service_name}` - Nome do serviço

3. Clique em **Salvar Configurações**

### 3. Configurar Cron Job no Vercel

Para que os lembretes sejam enviados automaticamente, configure um cron job no Vercel:

1. **Crie o arquivo `vercel.json`** na raiz do projeto (já criado):
```json
{
  "crons": [
    {
      "path": "/api/appointments/send-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. **Faça deploy** no Vercel

3. **O cron job executará** a cada hora e verificará agendamentos que precisam de lembrete

#### Opções de Schedule

- `"0 * * * *"` - A cada hora (recomendado)
- `"*/30 * * * *"` - A cada 30 minutos
- `"0 */2 * * *"` - A cada 2 horas
- `"0 9,15 * * *"` - Às 9h e 15h todos os dias

### 4. Proteção com Secret (Opcional)

Para proteger o endpoint do cron job, você pode adicionar um secret:

1. **No Vercel**, adicione uma variável de ambiente:
   - Name: `CRON_SECRET`
   - Value: (uma string aleatória segura)

2. **Atualize o `vercel.json`**:
```json
{
  "crons": [
    {
      "path": "/api/appointments/send-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

O código já verifica automaticamente se há um `CRON_SECRET` configurado.

## 📊 Como Funciona

1. **Cron Job Executa**: A cada hora (ou conforme configurado)
2. **Busca Configurações**: Sistema busca todas as configurações de lembretes ativas
3. **Identifica Agendamentos**: Para cada configuração, busca agendamentos que:
   - Estão com status "scheduled" ou "confirmed"
   - Ainda não receberam lembrete (`reminder_sent = false`)
   - Estão dentro da janela de tempo (agendamento está X horas no futuro)
   - Têm número de telefone cadastrado
4. **Envia Lembretes**: Para cada agendamento encontrado:
   - Formata a mensagem usando o template
   - Envia via WhatsApp usando Evolution API
   - Marca como enviado (`reminder_sent = true`)
5. **Registra Logs**: Sistema registra todos os envios e erros

## 🎨 Exemplo de Template

```
Olá {customer_name}! 

Este é um lembrete do seu agendamento para {appointment_date} às {appointment_time}.

Serviço: {service_name}

Esperamos você! 🎉
```

## 🔍 Verificar se Está Funcionando

### Método 1: Logs do Vercel

1. Acesse o dashboard do Vercel
2. Vá em **Deployments** → Selecione o último deploy
3. Clique em **Functions** → `/api/appointments/send-reminders`
4. Verifique os logs:
   - `[Reminders] 🔔 Verificando lembretes...`
   - `[Reminders] ✅ Lembrete enviado para...`

### Método 2: Teste Manual

Você pode chamar o endpoint manualmente para testar:

```bash
curl -X GET "https://seu-dominio.vercel.app/api/appointments/send-reminders" \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

### Método 3: Verificar no Banco de Dados

```sql
-- Ver agendamentos com lembretes enviados
SELECT 
  customer_name,
  appointment_date,
  reminder_sent,
  reminder_sent_at
FROM appointments
WHERE reminder_sent = true
ORDER BY reminder_sent_at DESC;
```

## ⚙️ Configurações Avançadas

### Múltiplos Lembretes

Atualmente o sistema envia apenas um lembrete por agendamento. Para enviar múltiplos lembretes (ex: 24h e 2h antes), você precisaria:

1. Criar múltiplas configurações com diferentes `reminder_hours_before`
2. Modificar a lógica para permitir múltiplos lembretes por agendamento

### Personalização por Serviço

Para personalizar mensagens por tipo de serviço, você pode:

1. Adicionar campo `service_reminder_template` na tabela `services`
2. Modificar a lógica para usar o template do serviço quando disponível

## 🐛 Troubleshooting

### Lembretes não estão sendo enviados

**Verifique:**

1. ✅ Configuração está ativa (`enabled = true`)
2. ✅ Cron job está configurado no Vercel
3. ✅ Integração WhatsApp está ativa
4. ✅ Agendamentos têm número de telefone
5. ✅ Agendamentos estão no status correto ("scheduled" ou "confirmed")
6. ✅ Agendamentos estão dentro da janela de tempo

### Erro: "Nenhuma integração WhatsApp ativa"

**Solução:**
- Verifique se há uma integração WhatsApp ativa em `/setup`
- Certifique-se de que `is_active = true` na tabela `integrations`

### Erro: "Erro ao enviar mensagem"

**Solução:**
- Verifique se a Evolution API está funcionando
- Verifique se a instância está conectada
- Verifique os logs do Vercel para mais detalhes

## 📝 Estrutura do Banco de Dados

### Tabela: `appointment_reminder_settings`

```sql
- id: UUID (PK)
- user_id: UUID (FK para profiles)
- enabled: BOOLEAN
- reminder_hours_before: INTEGER
- reminder_message_template: TEXT
- timezone: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Campos Adicionados em `appointments`:

```sql
- reminder_sent: BOOLEAN (default: false)
- reminder_sent_at: TIMESTAMP (quando foi enviado)
```

## ✅ Checklist de Implementação

- [ ] Migration aplicada (`007_appointment_reminders.sql`)
- [ ] Configurações de lembrete criadas em `/appointments/reminders`
- [ ] Cron job configurado no `vercel.json`
- [ ] Deploy feito no Vercel
- [ ] Integração WhatsApp ativa
- [ ] Teste manual executado
- [ ] Logs verificados

## 🎉 Pronto!

Agora seus clientes receberão lembretes automáticos de seus agendamentos via WhatsApp! 🚀
