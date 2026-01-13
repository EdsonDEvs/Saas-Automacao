# 📅 Sistema de Agendamentos com Google Calendar

## ✅ Funcionalidades Implementadas

1. **Integração com Google Calendar** - Sincronização automática de agendamentos
2. **Detecção de Intenção** - O sistema detecta quando o cliente quer agendar via WhatsApp
3. **Busca de Horários Disponíveis** - Mostra horários livres automaticamente
4. **Configuração de Horários** - Defina seus horários de atendimento
5. **Visualização de Agendamentos** - Veja todos os agendamentos em um só lugar

## 🚀 Como Usar

### 1. Configurar Google Calendar

1. Siga o guia em `docs/CONFIGURAR-GOOGLE-CALENDAR.md`
2. Configure as variáveis de ambiente:
   ```env
   GOOGLE_CLIENT_ID=seu-client-id
   GOOGLE_CLIENT_SECRET=seu-client-secret
   GOOGLE_REDIRECT_URI=https://seu-dominio.vercel.app/api/google-calendar/callback
   ```
3. Acesse `/appointments/settings` e clique em "Conectar Google Calendar"

### 2. Configurar Horários Disponíveis

1. Acesse `/appointments/settings`
2. Configure:
   - Horário de início e fim
   - Duração padrão dos agendamentos
   - Tempo entre agendamentos (buffer)
   - Dias da semana disponíveis
3. Clique em "Salvar Configurações"

### 3. Como Funciona no WhatsApp

Quando um cliente envia uma mensagem como:
- "Quero agendar"
- "Tem horário disponível?"
- "Posso marcar para amanhã às 14h?"

O sistema:
1. Detecta a intenção de agendamento
2. Busca horários disponíveis
3. Responde com os horários disponíveis
4. O cliente escolhe um horário
5. O sistema cria o agendamento no Google Calendar automaticamente

### 4. Visualizar Agendamentos

1. Acesse `/appointments`
2. Veja todos os agendamentos
3. Filtre por status (agendado, confirmado, cancelado, concluído)

## 📋 Estrutura do Banco de Dados

### Tabelas Criadas:

1. **appointments** - Armazena os agendamentos
2. **google_calendar_configs** - Configurações de conexão com Google Calendar
3. **appointment_settings** - Configurações de horários disponíveis

## 🔧 APIs Disponíveis

- `GET /api/google-calendar/auth` - Gera URL de autenticação
- `GET /api/google-calendar/callback` - Callback do OAuth
- `POST /api/google-calendar/create-event` - Cria evento no Google Calendar
- `GET /api/appointments/available-slots` - Busca horários disponíveis

## 📝 Próximos Passos (Opcional)

- [ ] Confirmar agendamento automaticamente quando cliente escolhe horário
- [ ] Enviar lembretes antes do agendamento
- [ ] Permitir cancelamento via WhatsApp
- [ ] Integração com outros calendários (Outlook, etc.)

## 🆘 Problemas?

Consulte `docs/CONFIGURAR-GOOGLE-CALENDAR.md` para problemas comuns.
