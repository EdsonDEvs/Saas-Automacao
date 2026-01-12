# 🔧 Problema: Mensagem Não Chega no WhatsApp

## ⚠️ IMPORTANTE: Erro com Número de Teste

**Se você está testando com o número `5511999999999` e recebe este erro:**

```json
{"status":400,"error":"Bad Request","response":{"message":[{"jid":"5511999999999@s.whatsapp.net","exists":false}]}}
```

**Isso é NORMAL!** O número `5511999999999` é um número de teste fake que não existe no WhatsApp. O erro `"exists": false` é esperado.

**Para testar de verdade:**
1. Conecte seu WhatsApp no sistema (`/setup`)
2. Envie uma mensagem **real** do seu WhatsApp para o número conectado
3. O sistema deve responder automaticamente

---

## ❌ Sintoma Real
- ✅ Webhook recebe a mensagem
- ✅ Resposta é gerada com sucesso
- ✅ Status 200 no teste
- ❌ **Mas a mensagem não chega no WhatsApp** (quando enviando mensagem real)

## 🔍 Possíveis Causas

### 1. Número no Formato Errado

**Problema:** O número pode estar em formato incorreto para a Evolution API.

**Solução:**
- Verifique o formato do número no payload
- Deve ser: `5511999999999@s.whatsapp.net` (com @s.whatsapp.net)
- Ou apenas: `5511999999999` (sem @s.whatsapp.net) - depende da versão da Evolution API

**Como verificar:**
1. Veja os logs do servidor
2. Procure por: `[Webhook WhatsApp] Enviando resposta para...`
3. Verifique o formato do número

---

### 2. Instância Não Está Conectada

**Problema:** A instância do WhatsApp pode estar desconectada.

**Solução:**
1. Acesse `/setup` no sistema
2. Verifique se mostra "WhatsApp Conectado!" ✅
3. Se não, reconecte escaneando o QR Code

**Verificar na Evolution API:**
```bash
curl -X GET "https://sua-evolution-api.com/instance/fetchInstances" \
  -H "apikey: SUA-API-KEY"
```

Verifique se o status da instância é `"open"` ou `"connected"`.

---

### 3. API Key da Evolution API Incorreta

**Problema:** A API Key pode estar errada ou expirada.

**Solução:**
1. Acesse `/setup` no sistema
2. Verifique se a API Key está correta
3. Teste a API Key manualmente:

```bash
curl -X GET "https://sua-evolution-api.com/instance/fetchInstances" \
  -H "apikey: SUA-API-KEY"
```

Se retornar erro 401, a API Key está incorreta.

---

### 4. URL da Evolution API Incorreta

**Problema:** A URL pode estar errada ou inacessível.

**Solução:**
1. Verifique se a URL está correta em `/setup`
2. Teste se a URL está acessível:

```bash
curl -X GET "https://sua-evolution-api.com/instance/fetchInstances" \
  -H "apikey: SUA-API-KEY"
```

Se não conseguir conectar, a URL está errada ou o servidor está offline.

---

### 5. Endpoint de Envio Incorreto

**Problema:** O endpoint pode estar diferente na sua versão da Evolution API.

**Solução:**
Verifique a documentação da sua versão da Evolution API. O endpoint pode ser:
- `/message/sendText/{instance}` (padrão)
- `/message/send/{instance}`
- `/sendText/{instance}`

**Como verificar:**
1. Veja os logs do servidor
2. Procure por: `[Webhook WhatsApp] URL: ...`
3. Teste o endpoint manualmente:

```bash
curl -X POST "https://sua-evolution-api.com/message/sendText/NOME-INSTANCIA" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "number": "5511999999999@s.whatsapp.net",
    "text": "Teste"
  }'
```

---

### 6. Número de Teste é Fake ⚠️ **ERRO COMUM**

**Problema:** No teste, estamos usando um número fake (`5511999999999`).

**Erro que aparece:**
```json
{
  "status": 400,
  "error": "Bad Request",
  "response": {
    "message": [{
      "jid": "5511999999999@s.whatsapp.net",
      "exists": false,
      "number": "5511999999999@s.whatsapp.net"
    }]
  }
}
```

**O que significa:**
- `"exists": false` = O número não existe no WhatsApp
- Este é um número de teste fake
- **O erro é esperado e normal!**

**Solução:**
- ✅ O teste funciona para verificar se o webhook processa corretamente
- ❌ Mas não vai enviar mensagem real porque o número não existe
- ✅ **Para testar de verdade, envie uma mensagem real do WhatsApp para o número conectado**

**Como testar de verdade:**
1. Conecte seu WhatsApp no sistema (`/setup`)
2. Envie uma mensagem real do seu WhatsApp para o número conectado
3. O sistema deve responder automaticamente
4. Se não responder, aí sim há um problema real

---

## 🧪 Como Testar Corretamente

### Passo 1: Verificar se Instância Está Conectada
```bash
curl -X GET "https://sua-evolution-api.com/instance/fetchInstances" \
  -H "apikey: SUA-API-KEY"
```

### Passo 2: Enviar Mensagem Manualmente via Evolution API
```bash
curl -X POST "https://sua-evolution-api.com/message/sendText/NOME-INSTANCIA" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "number": "5511999999999@s.whatsapp.net",
    "text": "Teste manual"
  }'
```

Se isso funcionar, o problema está no webhook. Se não funcionar, o problema está na Evolution API.

### Passo 3: Enviar Mensagem Real do WhatsApp
1. Envie uma mensagem real do WhatsApp para o número conectado
2. Verifique os logs do servidor
3. Procure por: `[Webhook WhatsApp] Enviando resposta...`
4. Veja se há erros

---

## 📊 Verificar Logs

**No servidor Next.js, procure por:**

```
[Webhook WhatsApp] Enviando resposta para 5511999999999@s.whatsapp.net via nome-instancia
[Webhook WhatsApp] URL: https://evolution-api.com/message/sendText/nome-instancia
[Webhook WhatsApp] Payload: {"number":"5511999999999@s.whatsapp.net","text":"..."}
[Webhook WhatsApp] Erro ao enviar: Status 401 ...
```

**Se aparecer erro:**
- Status 401 = API Key incorreta
- Status 404 = Instância não encontrada
- Status 500 = Erro no servidor Evolution API
- Timeout = URL incorreta ou servidor offline

---

## ✅ Checklist de Verificação

Antes de pedir ajuda, verifique:

- [ ] Instância está conectada (`/setup` mostra "Conectado!")
- [ ] API Key está correta (teste manualmente)
- [ ] URL da Evolution API está correta e acessível
- [ ] Número está no formato correto
- [ ] Endpoint de envio está correto
- [ ] Logs do servidor mostram tentativa de envio
- [ ] Teste manual via curl funciona

---

## 🔧 Solução Rápida

Se nada funcionar:

1. **Reconecte a instância:**
   - Acesse `/setup`
   - Desconecte e reconecte
   - Escaneie o QR Code novamente

2. **Verifique configuração:**
   - URL da Evolution API
   - API Key
   - Nome da instância

3. **Teste manualmente:**
   - Use curl para enviar mensagem
   - Se funcionar, o problema está no webhook
   - Se não funcionar, o problema está na Evolution API

4. **Verifique logs:**
   - Console do servidor Next.js
   - Logs da Evolution API (se tiver acesso)

---

## 💡 Dicas Importantes

1. **Número de teste é fake:** O número `5511999999999` usado no teste não existe. Para testar de verdade, envie uma mensagem real.

2. **Formato do número:** Depende da versão da Evolution API:
   - Algumas aceitam: `5511999999999@s.whatsapp.net`
   - Outras aceitam: `5511999999999` (sem @s.whatsapp.net)

3. **Instância deve estar conectada:** Se a instância não estiver conectada, nenhuma mensagem será enviada.

4. **Verifique sempre os logs:** Os logs mostram exatamente o que está acontecendo.

---

## 🆘 Ainda Não Funciona?

1. **Copie os logs completos** do servidor
2. **Teste manualmente** com curl
3. **Verifique** se a Evolution API está funcionando
4. **Entre em contato** com suporte com essas informações
