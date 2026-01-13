# 📅 Configurar Google Calendar - Guia Completo

## 📋 Pré-requisitos

1. **Conta Google** - Você precisa de uma conta Google
2. **Google Cloud Project** - Criar um projeto no Google Cloud Console
3. **Variáveis de Ambiente** - Configurar as credenciais

## 🔧 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique em **"Criar Projeto"** ou selecione um projeto existente
3. Dê um nome ao projeto (ex: "SaaS Automação")
4. Clique em **"Criar"**

### 2. Habilitar Google Calendar API

1. No menu lateral, vá em **"APIs e Serviços"** → **"Biblioteca"**
2. Procure por **"Google Calendar API"**
3. Clique em **"Ativar"**

### 3. Criar Credenciais OAuth 2.0

1. Vá em **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"Criar Credenciais"** → **"ID do cliente OAuth"**
3. Se for a primeira vez, configure a tela de consentimento OAuth:
   - Tipo de usuário: **Externo**
   - Nome do app: **SaaS Automação**
   - Email de suporte: Seu email
   - Clique em **"Salvar e Continuar"**
   - Adicione seu email como testador
   - Clique em **"Salvar e Continuar"**
4. Configure o ID do cliente OAuth:
   - Tipo de aplicativo: **Aplicativo da Web**
   - Nome: **SaaS Automação Web Client**
   - **URIs de redirecionamento autorizados:**
     - Para desenvolvimento: `http://localhost:3000/api/google-calendar/callback`
     - Para produção: `https://seu-dominio.vercel.app/api/google-calendar/callback`
   - Clique em **"Criar"**
5. **Copie o Client ID e Client Secret**

### 4. Configurar Variáveis de Ambiente

Adicione no `.env.local` (desenvolvimento) e na Vercel (produção):

```env
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_REDIRECT_URI=https://seu-dominio.vercel.app/api/google-calendar/callback
```

**⚠️ IMPORTANTE:**
- Para desenvolvimento local, use: `http://localhost:3000/api/google-calendar/callback`
- Para produção, use a URL do seu deploy na Vercel
- O `GOOGLE_REDIRECT_URI` deve corresponder exatamente ao que você configurou no Google Cloud Console

### 5. Conectar no Sistema

1. Acesse `/appointments/settings` no sistema
2. Clique em **"Conectar Google Calendar"**
3. Faça login na sua conta Google
4. Autorize o acesso ao Google Calendar
5. Pronto! O sistema está conectado

## 🔐 Permissões Necessárias

O sistema solicita as seguintes permissões:
- **Ver e editar eventos do Google Calendar** - Para criar e gerenciar agendamentos
- **Ver eventos do Google Calendar** - Para verificar conflitos de horário

## ✅ Verificar se Está Funcionando

1. Acesse `/appointments/settings`
2. Deve aparecer **"Conectado"** em verde
3. Configure os horários disponíveis
4. Teste criando um agendamento

## 🐛 Problemas Comuns

### Erro: "redirect_uri_mismatch"

**Causa:** A URI de redirecionamento não corresponde ao configurado no Google Cloud Console.

**Solução:**
1. Verifique se `GOOGLE_REDIRECT_URI` está correto
2. Verifique se está configurado no Google Cloud Console
3. Certifique-se de que não há espaços ou caracteres extras

### Erro: "access_denied"

**Causa:** O usuário negou as permissões ou a conta não está autorizada.

**Solução:**
1. Verifique se a conta está na lista de testadores (se o app ainda não está publicado)
2. Tente novamente e autorize todas as permissões

### Erro: "invalid_client"

**Causa:** Client ID ou Client Secret incorretos.

**Solução:**
1. Verifique se as variáveis de ambiente estão corretas
2. Certifique-se de que copiou o Client ID e Secret corretos do Google Cloud Console

## 📝 Notas Importantes

- O sistema armazena o **refresh token** para renovar automaticamente o acesso
- Os tokens expiram após 1 hora, mas são renovados automaticamente
- Se o refresh token expirar, será necessário reconectar

## 🆘 Precisa de Ajuda?

1. Verifique os logs do servidor
2. Verifique se as variáveis de ambiente estão configuradas
3. Verifique se a Google Calendar API está habilitada
4. Verifique se as URIs de redirecionamento estão corretas
