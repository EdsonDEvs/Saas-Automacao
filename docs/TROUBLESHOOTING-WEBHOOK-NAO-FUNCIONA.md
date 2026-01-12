# 🔧 Webhook Não Funciona - Guia de Solução

## ❌ Problema: "Coloquei a URL na Evolution mas nada acontece"

### 🔍 Checklist Rápido

1. ✅ **Webhook está configurado na Evolution API?**
2. ✅ **URL do webhook está acessível publicamente?**
3. ✅ **Instância está conectada?**
4. ✅ **Webhook está recebendo mensagens?**

---

## 📋 Passo a Passo para Resolver

### 1️⃣ Verificar se Webhook Está Configurado

**Na Evolution API:**
1. Acesse seu servidor Evolution API
2. Vá em **Settings** → **Webhooks**
3. Verifique se aparece: `https://seu-dominio.com/api/webhook/whatsapp`
4. Se **NÃO** aparecer, você precisa configurar

**Como configurar manualmente:**

```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/NOME-DA-INSTANCIA" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "url": "https://seu-dominio.com/api/webhook/whatsapp",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

**Ou use o sistema:**
1. Acesse `/setup` no sistema
2. Clique em "Configurar Webhook" (se disponível)
3. Ou acesse `/debug` e clique em "Verificar Webhook na Evolution API"

---

### 2️⃣ Verificar se URL Está Acessível Publicamente

**Problema comum:** Se você está rodando localmente (`localhost:3000`), a Evolution API **NÃO consegue** acessar!

**Soluções:**

#### Opção A: Usar ngrok (para testes)
```bash
# Instale ngrok: https://ngrok.com
ngrok http 3000
```

Você receberá uma URL como: `https://abc123.ngrok.io`

**Use essa URL no webhook:**
```
https://abc123.ngrok.io/api/webhook/whatsapp
```

#### Opção B: Deploy em produção
- Deploy no Vercel, Railway, ou outro serviço
- Use a URL pública do deploy
- Configure o webhook com essa URL

#### Opção C: Servidor próprio com domínio
- Configure um domínio apontando para seu servidor
- Use HTTPS
- Configure o webhook com essa URL

---

### 3️⃣ Verificar se Instância Está Conectada

**No sistema:**
1. Acesse `/setup`
2. Verifique se mostra "WhatsApp Conectado!" ✅
3. Se não, escaneie o QR Code novamente

**Na Evolution API:**
```bash
curl -X GET "https://sua-evolution-api.com/instance/fetchInstances" \
  -H "apikey: SUA-API-KEY"
```

Verifique se o status da instância é `"open"` ou `"connected"`

---

### 4️⃣ Testar se Webhook Está Recebendo

**Opção 1: Usar a página de Debug**
1. Acesse `/debug` no sistema
2. Clique em "Enviar Teste"
3. Verifique se aparece "Sucesso!"

**Opção 2: Testar manualmente com curl**
```bash
curl -X POST "https://seu-dominio.com/api/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "text": {"body": "teste"},
    "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
    "instance": "NOME-DA-INSTANCIA"
  }'
```

**Opção 3: Verificar logs do servidor**
- Abra o console do servidor Next.js
- Envie uma mensagem no WhatsApp
- Procure por: `[Webhook whatsapp] Recebido:`

---

### 5️⃣ Verificar Configuração no Sistema

**Verificar se integração está salva:**
1. Acesse `/setup`
2. Verifique se os dados estão preenchidos:
   - ✅ URL da Evolution API
   - ✅ API Key
   - ✅ Nome da Instância
   - ✅ Número do WhatsApp

**Verificar no banco (opcional):**
```sql
SELECT * FROM integrations 
WHERE platform = 'whatsapp' 
AND is_active = true;
```

---

## 🐛 Problemas Comuns e Soluções

### ❌ "Webhook não recebe mensagens"

**Causas:**
- URL não está acessível publicamente (localhost)
- Webhook não está configurado na Evolution API
- URL está errada

**Solução:**
1. Use ngrok ou faça deploy
2. Configure webhook manualmente na Evolution API
3. Verifique se a URL está correta

---

### ❌ "Recebe mas não responde"

**Causas:**
- API Key da Evolution API está errada
- Instância não está conectada
- Formato do número está errado
- OpenAI API Key não configurada

**Solução:**
1. Verifique API Key no sistema
2. Verifique se instância está conectada
3. Configure `OPENAI_API_KEY` no `.env.local`
4. Verifique logs do servidor

---

### ❌ "Erro ao enviar mensagem"

**Causas:**
- API Key incorreta
- Instância desconectada
- Formato do número incorreto

**Solução:**
1. Verifique API Key
2. Reconecte a instância
3. Verifique formato: `5511999999999@s.whatsapp.net`

---

## 🧪 Teste Completo

### Passo 1: Verificar Webhook na Evolution API
```bash
curl -X GET "https://sua-evolution-api.com/webhook/find/NOME-INSTANCIA" \
  -H "apikey: SUA-API-KEY"
```

Deve retornar a URL do webhook configurada.

### Passo 2: Testar Webhook
```bash
curl -X POST "https://seu-dominio.com/api/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "text": {"body": "teste"},
    "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
    "instance": "NOME-INSTANCIA"
  }'
```

Deve retornar `{"status": "success", ...}`

### Passo 3: Enviar Mensagem Real
1. Envie uma mensagem no WhatsApp para o número conectado
2. Verifique logs do servidor
3. Deve aparecer: `[Webhook whatsapp] Recebido:`
4. Deve aparecer: `[Webhook WhatsApp] Resposta enviada com sucesso`

---

## 📊 Verificar Logs

**No servidor Next.js, procure por:**
```
[Webhook whatsapp] Recebido: {...}
[Webhook WhatsApp] Mensagem: "...", De: ..., Instância: ...
[Webhook WhatsApp] Enviando resposta para ...
[Webhook WhatsApp] Resposta enviada com sucesso
```

**Se não aparecer nada:**
- Webhook não está recebendo mensagens
- Verifique se está configurado na Evolution API
- Verifique se URL está acessível

---

## ✅ Checklist Final

Antes de pedir ajuda, verifique:

- [ ] Webhook está configurado na Evolution API
- [ ] URL do webhook está acessível publicamente (não localhost)
- [ ] Instância está conectada (status "open")
- [ ] Integração está salva no sistema (`/setup`)
- [ ] API Key está correta
- [ ] Teste manual funciona (`/debug`)
- [ ] Logs do servidor mostram mensagens recebidas

---

## 🆘 Ainda Não Funciona?

1. **Acesse `/debug`** no sistema
2. **Clique em "Enviar Teste"** - veja o erro
3. **Clique em "Verificar Webhook"** - veja se está configurado
4. **Verifique logs** do servidor
5. **Teste manualmente** com curl
6. **Verifique** se Evolution API está acessível

---

## 💡 Dicas Importantes

1. **Sempre use HTTPS** em produção
2. **Não use localhost** - use ngrok ou deploy
3. **Verifique logs** sempre que algo não funcionar
4. **Teste manualmente** antes de esperar mensagens reais
5. **Mantenha API Keys seguras** - nunca exponha no frontend

---

## 📞 Próximos Passos

Se seguiu todos os passos e ainda não funciona:

1. Copie os logs do servidor
2. Copie a resposta do teste em `/debug`
3. Verifique se todas as configurações estão corretas
4. Entre em contato com suporte com essas informações
