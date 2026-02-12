# 🔧 Troubleshooting Webhook - Evolution API 2.3.7

## Problema: "instance requires property 'webhook'"

Se você está vendo esse erro, significa que a Evolution API 2.3.7 está esperando um formato específico de payload que ainda não identificamos.

## 🧪 Teste Manual

Para identificar o formato correto, teste manualmente usando `curl` ou Postman:

### Teste 1: Formato mais simples
```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/minha-empresattt" \
  -H "Content-Type: application/json" \
  -H "apikey: sua-api-key" \
  -d '{
    "webhook": {
      "url": "http://localhost:3000/api/webhook/whatsapp"
    }
  }'
```

### Teste 2: Com events
```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/minha-empresattt" \
  -H "Content-Type: application/json" \
  -H "apikey: sua-api-key" \
  -d '{
    "webhook": {
      "url": "http://localhost:3000/api/webhook/whatsapp",
      "events": ["MESSAGES_UPSERT"]
    }
  }'
```

### Teste 3: Formato completo
```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/minha-empresattt" \
  -H "Content-Type: application/json" \
  -H "apikey: sua-api-key" \
  -d '{
    "webhook": {
      "url": "http://localhost:3000/api/webhook/whatsapp",
      "webhook_by_events": false,
      "webhook_base64": false,
      "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE"]
    }
  }'
```

### Teste 4: Propriedades no nível raiz (formato antigo)
```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/minha-empresattt" \
  -H "Content-Type: application/json" \
  -H "apikey: sua-api-key" \
  -d '{
    "url": "http://localhost:3000/api/webhook/whatsapp",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

## 📋 O que fazer:

1. **Teste cada formato acima** e veja qual retorna sucesso (200 OK)
2. **Copie o formato que funcionou** e me envie
3. **Ou verifique a documentação** da sua Evolution API 2.3.7

## 🔍 Verificar Documentação

A Evolution API 2.3.7 pode ter documentação específica:
- GitHub: https://github.com/EvolutionAPI/evolution-api
- Documentação: https://doc.evolution-api.com

Procure por:
- "webhook configuration"
- "set webhook"
- "instance webhook"

## 💡 Alternativa: Configurar Manualmente

Se nada funcionar automaticamente, você pode configurar o webhook manualmente:

1. Acesse o painel da Evolution API
2. Vá em **Settings** → **Webhooks**
3. Adicione manualmente: `http://localhost:3000/api/webhook/whatsapp`
4. Salve

Depois disso, o sistema deve começar a receber mensagens automaticamente.
