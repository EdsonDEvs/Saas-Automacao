# 🚀 Solução Rápida - WhatsApp Não Responde

## ✅ Checklist Rápido

### 1. Verificar se Webhook Está Configurado

**Na Evolution API:**
1. Acesse: `https://evolutionapi.alfredoia.com.br` (ou seu servidor)
2. Vá em **Settings** → **Webhooks**
3. Verifique se tem a URL: `https://seu-dominio.com/api/webhook/whatsapp`
4. **Se não tiver**, configure manualmente (veja abaixo)

### 2. Usar Página de Debug

1. Acesse `/debug` no sistema
2. Clique em **"Verificar Webhook na Evolution API"**
3. Clique em **"Enviar Teste"** para testar o webhook
4. Veja os resultados e erros

### 3. Verificar Logs do Servidor

Abra o console do servidor Next.js e procure por:
```
[Webhook whatsapp] Recebido: ...
```

**Se não aparecer nada:** Webhook não está recebendo mensagens
**Se aparecer mas der erro:** Veja o erro específico

## 🔧 Configurar Webhook Manualmente

Se o webhook não foi configurado automaticamente:

```bash
curl -X POST "https://evolutionapi.alfredoia.com.br/webhook/set/SUA-INSTANCIA" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "url": "https://seu-dominio.com/api/webhook/whatsapp",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

Substitua:
- `SUA-INSTANCIA` = nome da sua instância (ex: barbearia-barn)
- `SUA-API-KEY` = sua API key
- `https://seu-dominio.com` = URL do seu sistema

## 🧪 Testar Agora

### Opção 1: Página de Debug
1. Acesse `/debug`
2. Clique em "Enviar Teste"
3. Veja o resultado

### Opção 2: Teste Manual
```bash
curl -X POST https://seu-dominio.com/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "text": {"body": "teste"},
    "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
    "instance": "sua-instancia"
  }'
```

## 📋 O Que Verificar

1. ✅ Webhook configurado na Evolution API?
2. ✅ Instância está conectada? (status "open")
3. ✅ URL do webhook está acessível publicamente?
4. ✅ Logs mostram mensagens recebidas?
5. ✅ Erros nos logs ao enviar resposta?

## 🆘 Problemas Comuns

### "Nenhuma integração ativa encontrada"
- Verifique se a instância está marcada como `is_active = true` no banco
- Ou reconecte o WhatsApp em `/setup`

### "Erro ao enviar mensagem"
- Verifique API Key da Evolution API
- Verifique se instância está conectada
- Verifique formato do número

### Webhook não recebe nada
- Verifique se está configurado na Evolution API
- Teste a URL manualmente
- Verifique se está acessível publicamente

## 💡 Próximos Passos

1. Use a página `/debug` para testar
2. Verifique logs do servidor
3. Configure webhook manualmente se necessário
4. Teste enviando mensagem real
