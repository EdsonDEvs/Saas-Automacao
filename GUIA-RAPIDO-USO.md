# 🚀 Guia Rápido de Uso - SaaS Automação

## 📋 Checklist Inicial

- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Migration aplicada no Supabase
- [ ] Dependências instaladas (`npm install`)

## 🎯 Fluxo de Uso

### 1️⃣ **Primeiro Acesso (Setup)**

1. Faça login/cadastro
2. Vá em **Configurações** → **Setup**
3. Selecione **WhatsApp**
4. Clique em **Conectar WhatsApp** (não precisa preencher nada!)
5. Escaneie o QR Code com seu WhatsApp
6. Aguarde a conexão (automático)
7. Pronto! Sistema configurado automaticamente

### 2️⃣ **Configurar o Agente IA**

1. Vá em **Agente** no menu
2. Configure:
   - Nome do agente
   - Tom de voz
   - Regras de negócio
   - **Serviços e Durações** (ex: Corte: 60min, Lavagem: 30min)

### 3️⃣ **Configurar Google Calendar (Opcional)**

1. Vá em **Agendamentos** → **Configurações**
2. Clique em **Conectar Google Calendar**
3. Autorize o acesso
4. Configure horários disponíveis

### 4️⃣ **Testar o Sistema**

1. Envie uma mensagem para o WhatsApp conectado
2. O agente IA responde automaticamente
3. Teste agendamento: "Quero agendar um corte para amanhã às 14h"
4. O sistema:
   - Detecta a intenção
   - Reserva o slot por 10 minutos
   - Pede confirmação
   - Cria evento no Google Calendar (se configurado)

## 🔧 Variáveis de Ambiente Necessárias

### Obrigatórias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `EVOLUTION_API_URL` ⭐ **NOVO**
- `EVOLUTION_API_KEY` ⭐ **NOVO**

### Opcionais (para agendamentos):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_APP_URL`

## 🎨 Recursos Disponíveis

- ✅ **Onboarding One-Click**: Conecta WhatsApp sem configurar nada
- ✅ **Agendamento Transacional**: Reserva slots por 10 minutos
- ✅ **Sincronização Bidirecional**: Google Calendar ↔ Sistema
- ✅ **Calendário Visual**: FullCalendar na página de agendamentos
- ✅ **Serviços por Nicho**: Configure durações diferentes por serviço

## 🐛 Troubleshooting

### WhatsApp não conecta?
- Verifique se `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` estão corretos
- Confirme que o servidor Evolution API está rodando

### Agendamentos não aparecem?
- Verifique se aplicou a migration `005_agent_services_and_pending_appointments.sql`
- Confirme que o Google Calendar está conectado (se usar)

### Erro ao criar instância?
- Verifique logs do servidor Evolution API
- Confirme que a API Key tem permissões para criar instâncias
