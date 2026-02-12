# 🔧 Como Configurar Webhook Manualmente - Evolution API 2.3.7

## ⚠️ Problema Identificado

A Evolution API 2.3.7 parece não aceitar configuração de webhook via API REST para o endpoint `/webhook/set/`. Todos os formatos testados retornam erro 400 sem mensagem de erro.

## ✅ Solução: Configurar Manualmente

### Opção 1: Via Interface Web da Evolution API

1. **Acesse o painel da Evolution API:**
   - URL: `https://evolutionapi.alfredoia.com.br`
   - Faça login (se necessário)

2. **Navegue até a configuração de Webhooks:**
   - Vá em **Settings** → **Webhooks**
   - Ou **Instances** → Selecione sua instância → **Webhooks**

3. **Configure o webhook:**
   - **URL do Webhook:** `http://localhost:3000/api/webhook/whatsapp`
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

### Opção 2: Via Arquivo de Configuração (se aplicável)

Se sua Evolution API permite configuração via arquivo `.env`:

```env
WEBHOOK_GLOBAL_URL=http://localhost:3000/api/webhook/whatsapp
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_EVENTS=MESSAGES_UPSERT,MESSAGES_UPDATE,MESSAGES_DELETE,SEND_MESSAGE,CONNECTION_UPDATE,QRCODE_UPDATED
```

### Opção 3: Verificar se há API diferente

Algumas versões da Evolution API podem ter endpoints diferentes. Tente:

1. Verificar a documentação específica da sua versão
2. Verificar se há um endpoint `/webhook/create` ou `/webhook/update`
3. Verificar se precisa configurar durante a criação da instância

## 🧪 Como Verificar se Funcionou

Depois de configurar manualmente:

1. **Envie uma mensagem de teste** para o WhatsApp conectado
2. **Verifique os logs** do seu servidor Next.js
3. **Procure por:** `[Webhook whatsapp] Recebido:`

Se aparecer essa mensagem nos logs, o webhook está funcionando!

## 📝 Nota Importante

Se você estiver em **desenvolvimento local** (`localhost:3000`), o webhook **NÃO funcionará** porque a Evolution API não consegue acessar `localhost` de fora do seu computador.

### Soluções para Desenvolvimento Local:

1. **Use ngrok** para expor seu localhost:
   ```bash
   ngrok http 3000
   ```
   Depois use a URL do ngrok no webhook: `https://seu-id.ngrok.io/api/webhook/whatsapp`

2. **Use um serviço de tunnel** como:
   - ngrok
   - localtunnel
   - cloudflared

3. **Deploy em produção** (Vercel, Railway, etc.) e use a URL de produção

## 🔄 Próximos Passos

Depois de configurar o webhook manualmente:

1. ✅ O sistema começará a receber mensagens automaticamente
2. ✅ O agente IA responderá às mensagens
3. ✅ Os agendamentos serão processados automaticamente

O sistema já está preparado para receber e processar as mensagens - só precisa que o webhook esteja configurado!
