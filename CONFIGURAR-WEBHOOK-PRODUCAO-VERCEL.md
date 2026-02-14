# 🚀 Configurar Webhook em Produção - Vercel

## 📋 Visão Geral

Com seu app hospedado no Vercel (`https://saas-automacao.vercel.app`), você pode configurar o webhook do WhatsApp para usar essa URL diretamente, sem precisar do ngrok.

## ✅ Passo 1: Configurar Variável de Ambiente no Vercel

1. **Acesse o painel do Vercel:**
   - Vá para: https://vercel.com/dashboard
   - Selecione seu projeto `Saas-Automacao`

2. **Configure a variável de ambiente:**
   - Vá em **Settings** → **Environment Variables**
   - Adicione uma nova variável:
     - **Name:** `NEXT_PUBLIC_APP_URL`
     - **Value:** `https://saas-automacao.vercel.app`
     - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Clique em **Save**

3. **Redeploy (se necessário):**
   - O Vercel detecta mudanças automaticamente, mas você pode forçar um redeploy:
     - Vá em **Deployments**
     - Clique nos três pontos (⋯) do último deploy
     - Selecione **Redeploy**

## 🔧 Passo 2: Configurar Webhook na Evolution API

Você tem **3 opções** para configurar o webhook:

### Opção A: Configuração Automática (Recomendado)

O sistema tenta configurar automaticamente quando você:
- Cria uma nova instância
- Verifica o status da conexão

**URL do webhook que será usada:**
```
https://saas-automacao.vercel.app/api/webhook/whatsapp
```

**Como funciona:**
1. Acesse `/dashboard` no seu app
2. Configure ou reconecte sua instância do WhatsApp
3. O sistema tentará configurar o webhook automaticamente

### Opção B: Configuração Manual via Interface da Evolution API

Se a configuração automática não funcionar:

1. **Acesse o painel da Evolution API:**
   - URL: `https://evolutionapi.alfredoia.com.br` (ou sua URL)
   - Faça login (se necessário)

2. **Navegue até a configuração de Webhooks:**
   - Vá em **Settings** → **Webhooks**
   - Ou **Instances** → Selecione sua instância → **Webhooks**

3. **Configure o webhook:**
   - **URL do Webhook:** `https://saas-automacao.vercel.app/api/webhook/whatsapp`
   - **Events:** Selecione os eventos:
     - ✅ MESSAGES_UPSERT
     - ✅ MESSAGES_UPDATE
     - ✅ MESSAGES_DELETE
     - ✅ SEND_MESSAGE
     - ✅ CONNECTION_UPDATE
     - ✅ QRCODE_UPDATED
   - **Webhook by Events:** Desmarcado
   - **Webhook Base64:** Desmarcado

4. **Salve a configuração**

### Opção C: Configuração via API (cURL)

Se você preferir usar a linha de comando:

```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/NOME-DA-INSTANCIA" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "url": "https://saas-automacao.vercel.app/api/webhook/whatsapp",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "MESSAGES_DELETE",
      "SEND_MESSAGE",
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED"
    ]
  }'
```

**Substitua:**
- `NOME-DA-INSTANCIA` pelo nome da sua instância
- `SUA-API-KEY` pela sua API Key da Evolution API
- `https://sua-evolution-api.com` pela URL da sua Evolution API

## 🧪 Passo 3: Verificar se Está Funcionando

### Método 1: Teste Manual

1. **Envie uma mensagem** para o WhatsApp conectado
2. **Verifique os logs do Vercel:**
   - Vá em **Deployments** → Selecione o último deploy → **Functions** → Clique na função
   - Procure por: `[Webhook whatsapp] Recebido:`
   - Ou: `[Webhook WhatsApp] ✅ Mensagem extraída`

### Método 2: Verificar Status no Dashboard

1. Acesse `/dashboard` no seu app
2. Verifique se o status mostra:
   - ✅ **Conectado**
   - ✅ **Webhook configurado**

### Método 3: Verificar na Evolution API

1. Acesse o painel da Evolution API
2. Vá em **Instances** → Sua instância → **Webhooks**
3. Verifique se aparece: `https://saas-automacao.vercel.app/api/webhook/whatsapp`

## 🔍 Troubleshooting

### Problema: Webhook não está recebendo mensagens

**Soluções:**

1. **Verifique se a URL está correta:**
   - Deve ser: `https://saas-automacao.vercel.app/api/webhook/whatsapp`
   - **NÃO** use `http://` (deve ser HTTPS)
   - **NÃO** adicione barra no final

2. **Verifique se a instância está conectada:**
   - No dashboard, verifique se mostra "Conectado"
   - Se não, reconecte escaneando o QR Code novamente

3. **Verifique os logs do Vercel:**
   - Vá em **Deployments** → **Functions**
   - Procure por erros relacionados ao webhook

4. **Teste a URL manualmente:**
   ```bash
   curl -X POST https://saas-automacao.vercel.app/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
   - Deve retornar um erro (esperado, pois não é um webhook válido)
   - Mas confirma que a rota está acessível

### Problema: Erro 401 ao configurar webhook

**Solução:**
- Verifique se a API Key está correta
- Tente usar o header `Authorization: Bearer SUA-API-KEY` em vez de `apikey`

### Problema: Webhook configurado mas não funciona

**Soluções:**

1. **Verifique os eventos selecionados:**
   - Certifique-se de que `MESSAGES_UPSERT` está marcado
   - Este é o evento principal para receber mensagens

2. **Verifique se o webhook está ativo:**
   - Na Evolution API, verifique se o webhook não está desabilitado

3. **Teste enviando uma mensagem:**
   - Envie uma mensagem real do WhatsApp
   - Verifique os logs do Vercel imediatamente após

## 📝 Notas Importantes

1. **HTTPS é obrigatório:**
   - O Vercel já fornece HTTPS automaticamente
   - Não use `http://` na URL do webhook

2. **URL pública:**
   - A URL do Vercel é pública e acessível de qualquer lugar
   - Não precisa de ngrok ou outros túneis

3. **Variáveis de ambiente:**
   - Após adicionar `NEXT_PUBLIC_APP_URL`, faça um redeploy
   - O Vercel pode levar alguns minutos para atualizar

4. **Múltiplos ambientes:**
   - Se você tem Preview/Development, configure URLs diferentes:
     - Production: `https://saas-automacao.vercel.app`
     - Preview: `https://saas-automacao-git-*.vercel.app` (dinâmico)
     - Development: `http://localhost:3000` (só funciona com ngrok)

## ✅ Checklist Final

- [ ] Variável `NEXT_PUBLIC_APP_URL` configurada no Vercel
- [ ] Redeploy feito (se necessário)
- [ ] Webhook configurado na Evolution API
- [ ] URL do webhook: `https://saas-automacao.vercel.app/api/webhook/whatsapp`
- [ ] Eventos selecionados corretamente
- [ ] Instância conectada no dashboard
- [ ] Teste enviando uma mensagem
- [ ] Logs do Vercel mostram recebimento de mensagens

## 🎉 Pronto!

Depois de seguir esses passos, seu webhook estará funcionando em produção e você não precisará mais do ngrok!

O sistema receberá mensagens automaticamente e o agente IA responderá conforme configurado.
