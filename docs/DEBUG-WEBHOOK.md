# 🔍 Debug - Webhook Não Responde

## 🔎 Checklist de Verificação

### 1. Webhook Está Configurado?

**Verificar na Evolution API:**
1. Acesse seu servidor Evolution API
2. Vá em **Settings** → **Webhooks**
3. Verifique se tem: `https://seu-dominio.com/api/webhook/whatsapp`
4. Se não tiver, configure manualmente ou use o sistema

**Como configurar manualmente:**
```bash
curl -X POST "https://evolutionapi.alfredoia.com.br/webhook/set/sua-instancia" \
  -H "Content-Type: application/json" \
  -H "apikey: sua-api-key" \
  -d '{
    "url": "https://seu-dominio.com/api/webhook/whatsapp",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

### 2. Webhook Está Recebendo Mensagens?

**Teste o endpoint:**
```bash
curl -X POST https://seu-dominio.com/api/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'
```

**Verifique logs:**
- Console do servidor Next.js mostra logs quando recebe mensagens
- Procure por: `[Webhook whatsapp] Recebido:`

### 3. Formato da Mensagem Está Correto?

A Evolution API pode enviar em diferentes formatos. O sistema tenta vários:

**Formato 1 (webhook por eventos):**
```json
{
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net"
    },
    "message": {
      "conversation": "mensagem do cliente"
    },
    "instance": "nome-instancia"
  }
}
```

**Formato 2 (webhook simples):**
```json
{
  "text": {
    "body": "mensagem do cliente"
  },
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net"
  },
  "instance": "nome-instancia"
}
```

### 4. Instância Está Conectada?

**Verificar status:**
1. Acesse `/setup` no sistema
2. Verifique se mostra "WhatsApp Conectado!"
3. Se não, reconecte escaneando o QR Code

### 5. Integração Está Ativa?

**Verificar no banco:**
```sql
SELECT * FROM integrations 
WHERE platform = 'whatsapp' 
AND is_active = true;
```

## 🧪 Testar Manualmente

### Teste 1: Verificar se Webhook Recebe
```bash
curl -X POST https://seu-dominio.com/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "text": {"body": "teste"},
    "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
    "instance": "sua-instancia"
  }'
```

### Teste 2: Verificar Logs
Abra o console do servidor Next.js e envie uma mensagem. Você deve ver:
```
[Webhook whatsapp] Recebido: {...}
[Webhook WhatsApp] Mensagem: "teste", De: 5511999999999, Instância: sua-instancia
[Webhook WhatsApp] Enviando resposta para 5511999999999@s.whatsapp.net via sua-instancia
```

### Teste 3: Verificar Evolution API
```bash
# Verificar se instância está conectada
curl -X GET "https://evolutionapi.alfredoia.com.br/instance/fetchInstances" \
  -H "apikey: sua-api-key"

# Verificar webhook configurado
curl -X GET "https://evolutionapi.alfredoia.com.br/webhook/find/sua-instancia" \
  -H "apikey: sua-api-key"
```

## 🐛 Problemas Comuns

### Problema: Webhook não recebe mensagens

**Solução 1:** Verifique se o webhook está configurado na Evolution API
**Solução 2:** Verifique se a URL está acessível publicamente
**Solução 3:** Use ngrok para testar localmente:
```bash
ngrok http 3000
# Use a URL do ngrok no webhook
```

### Problema: Recebe mas não responde

**Solução 1:** Verifique logs do servidor
**Solução 2:** Verifique se a API Key está correta
**Solução 3:** Verifique se o número está no formato correto

### Problema: Erro ao enviar mensagem

**Solução 1:** Verifique formato do número (deve ser: `5511999999999@s.whatsapp.net`)
**Solução 2:** Verifique API Key da Evolution API
**Solução 3:** Verifique se instância está conectada

## 📊 Logs Úteis

O sistema agora loga:
- Quando recebe mensagem
- Qual mensagem foi extraída
- Para qual número vai enviar
- Se conseguiu enviar ou não

**Procure no console:**
```
[Webhook whatsapp] Recebido: ...
[Webhook WhatsApp] Mensagem: "..."
[Webhook WhatsApp] Enviando resposta para ...
[Webhook WhatsApp] Resposta enviada com sucesso
```

## 🔧 Ajustar Formato da Mensagem

Se a Evolution API usar um formato diferente, ajuste em:
`app/api/webhook/[platform]/route.ts`

Adicione mais opções no parsing:
```typescript
userMessage = body.text?.body || 
             body.message?.conversation || 
             body.novoFormato?.mensagem || // Adicione aqui
             ""
```

## 🆘 Ainda Não Funciona?

1. **Verifique logs completos** do servidor
2. **Teste o endpoint** `/api/webhook/test`
3. **Verifique Evolution API** diretamente
4. **Confirme** que webhook está configurado
5. **Teste** enviando mensagem manualmente via Evolution API
