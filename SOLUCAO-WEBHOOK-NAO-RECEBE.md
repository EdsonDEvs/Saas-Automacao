# 🚨 Webhook Não Recebe Mensagens - Solução Rápida

## ❌ Problema: "Não apareceu nada nos logs"

Se você enviou uma mensagem e **não apareceu nada** nos logs do servidor, significa que o webhook **não está recebendo mensagens** da Evolution API.

## ✅ Solução Passo a Passo

### 1. Verificar se Webhook Está Configurado

**Acesse `/debug` e:**
1. Clique em **"Verificar Webhook na Evolution API"**
2. Se mostrar "Webhook não encontrado", clique em **"Configurar Webhook Automaticamente"**

### 2. Verificar URL do Webhook

**IMPORTANTE:** Se você está rodando **localmente** (`localhost:3000`), a Evolution API **NÃO consegue acessar**!

**Soluções:**

#### Opção A: Usar ngrok (para testes)
```bash
# Instale ngrok: https://ngrok.com
ngrok http 3000
```

Você receberá uma URL como: `https://abc123.ngrok.io`

**Configure o webhook com essa URL:**
```
https://abc123.ngrok.io/api/webhook/whatsapp
```

#### Opção B: Deploy em produção
- Deploy no Vercel, Railway, ou outro serviço
- Use a URL pública do deploy
- Configure o webhook com essa URL

### 3. Verificar Status do Webhook no Dashboard

Agora o sistema mostra se o webhook está configurado:
- ✅ **Verde** = Webhook configurado
- ⚠️ **Amarelo** = Webhook não configurado

Se aparecer amarelo, acesse `/debug` e configure.

### 4. Verificar Logs do Servidor

**Quando você envia uma mensagem, deve aparecer:**
```
========== [Webhook whatsapp] Nova Mensagem Recebida ==========
[Webhook whatsapp] ✅ Mensagem extraída: "sua mensagem"
```

**Se NÃO aparecer nada:**
- ❌ Webhook não está configurado
- ❌ URL do webhook não está acessível publicamente
- ❌ Evolution API não está enviando para o webhook

### 5. Configurar Manualmente (se necessário)

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

## 🔍 Verificar se Está Funcionando

1. **Acesse `/dashboard`** - Veja se mostra "Webhook Configurado" (verde)
2. **Envie uma mensagem real** do WhatsApp para o número conectado
3. **Veja os logs do servidor** - Deve aparecer a mensagem sendo processada

## 📋 Checklist

- [ ] Webhook está configurado na Evolution API?
- [ ] URL do webhook está acessível publicamente? (não pode ser localhost)
- [ ] Dashboard mostra "Webhook Configurado" (verde)?
- [ ] Logs do servidor mostram mensagem sendo recebida?

## 🆘 Ainda Não Funciona?

1. **Verifique os logs do servidor** quando você envia uma mensagem
2. **Acesse `/debug`** e teste o webhook
3. **Verifique se a URL está correta** na Evolution API
4. **Confirme que não está usando localhost** (use ngrok ou deploy)
