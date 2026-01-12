# 🔧 WhatsApp Conectado Mas Não Responde

## ✅ Checklist Rápido

### 1. Webhook Está Configurado?

**Acesse `/debug` e clique em:**
- "Verificar Webhook na Evolution API" - para ver se está configurado
- "Configurar Webhook Automaticamente" - para configurar se não estiver

**Ou verifique manualmente:**
```bash
curl -X GET "https://sua-evolution-api.com/webhook/find/SUA-INSTANCIA" \
  -H "apikey: SUA-API-KEY"
```

**Se não estiver configurado, configure:**
```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/SUA-INSTANCIA" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "url": "https://seu-dominio.com/api/webhook/whatsapp",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

### 2. Webhook Está Recebendo Mensagens?

**Verifique os logs do servidor Next.js:**

Quando você envia uma mensagem, você deve ver no terminal:
```
========== [Webhook whatsapp] Nova Mensagem Recebida ==========
[Webhook whatsapp] ✅ Mensagem extraída: "sua mensagem"
[Webhook whatsapp] 📞 De: 5511999999999
[Webhook whatsapp] 🔄 Processando mensagem...
```

**Se NÃO aparecer nada:**
- ❌ Webhook não está configurado na Evolution API
- ❌ URL do webhook não está acessível publicamente
- ❌ Evolution API não está enviando para o webhook

**Soluções:**
1. Configure o webhook (veja passo 1)
2. Se estiver rodando localmente, use ngrok:
   ```bash
   ngrok http 3000
   # Use a URL do ngrok no webhook
   ```

### 3. Webhook Recebe Mas Não Responde?

**Verifique os logs do servidor:**

Você deve ver:
```
[Webhook WhatsApp] ✅ Mensagem válida: "sua mensagem"
[Webhook WhatsApp] 🔍 Buscando integração...
[Webhook WhatsApp] ✅ Integração encontrada por instância: sua-instancia
[Webhook WhatsApp] 🔑 Buscando API key...
[Webhook WhatsApp] ✅ API key válida encontrada
[Webhook WhatsApp] 🤖 Gerando resposta com IA...
[Webhook WhatsApp] 📤 Enviando resposta...
[Webhook WhatsApp] ✅ Resposta enviada com sucesso!
```

**Se aparecer erro:**

#### Erro: "Nenhuma integração ativa encontrada"
- ✅ Verifique se a integração está marcada como `is_active = true` no banco
- ✅ Verifique se o `instance_name` está correto

#### Erro: "API key não encontrada"
- ✅ Crie uma API key em `/dashboard` ou `/products`
- ✅ Verifique se a API key está marcada como `is_active = true`

#### Erro: "OPENAI_API_KEY não configurada"
- ✅ Configure `OPENAI_API_KEY` no arquivo `.env.local`

#### Erro ao enviar para Evolution API (Status 401, 404, etc.)
- ✅ Verifique se a API key da Evolution API está correta
- ✅ Verifique se a instância está conectada
- ✅ Verifique se o número está no formato correto

### 4. Teste Manual

**Teste 1: Verificar se webhook recebe**
```bash
curl -X POST https://seu-dominio.com/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "text": {"body": "teste"},
    "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
    "instance": "sua-instancia"
  }'
```

**Teste 2: Enviar mensagem real do WhatsApp**
1. Envie uma mensagem real do seu WhatsApp para o número conectado
2. Veja os logs do servidor
3. Verifique se aparece a mensagem sendo processada

**Teste 3: Verificar se Evolution API está funcionando**
```bash
curl -X POST "https://sua-evolution-api.com/message/sendText/SUA-INSTANCIA" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "number": "5511999999999@s.whatsapp.net",
    "text": "Teste manual"
  }'
```

## 🔍 Logs Detalhados

O sistema agora mostra logs muito detalhados. Procure por:

- `========== [Webhook whatsapp] Nova Mensagem Recebida ==========` - Mensagem recebida
- `✅` - Sucesso em alguma etapa
- `❌` - Erro em alguma etapa
- `⚠️` - Aviso (não é erro crítico)

## 📋 Checklist Completo

Antes de pedir ajuda, verifique:

- [ ] Webhook está configurado na Evolution API?
- [ ] URL do webhook está acessível publicamente?
- [ ] Instância está conectada (status "open" ou "connected")?
- [ ] Integração está ativa no banco (`is_active = true`)?
- [ ] API key do usuário existe e está ativa?
- [ ] `OPENAI_API_KEY` está configurada?
- [ ] Logs do servidor mostram mensagem sendo recebida?
- [ ] Logs do servidor mostram algum erro específico?

## 🆘 Ainda Não Funciona?

1. **Envie os logs completos** do servidor quando você envia uma mensagem
2. **Teste o endpoint** `/api/webhook/test` em `/debug`
3. **Verifique Evolution API** diretamente usando os comandos acima
4. **Confirme** que webhook está configurado usando `/debug`
