# ⚡ Deploy Rápido na Vercel

## 🚀 Passos Rápidos

### 1. Preparar Código
```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

### 2. Conectar na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. **"Add New Project"** → Conecte GitHub → Selecione repositório
3. Clique em **"Deploy"**

### 3. Configurar Variáveis de Ambiente

Na Vercel, vá em **Settings → Environment Variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
OPENAI_API_KEY=sk-sua-chave
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

**⚠️ IMPORTANTE:** 
- Após o primeiro deploy, atualize `NEXT_PUBLIC_APP_URL` com a URL real que a Vercel gerar
- Exemplo: Se o projeto for `meu-saas`, a URL será `https://meu-saas.vercel.app`

### 4. Configurar Webhook

Após o deploy, acesse seu site em `/debug` e:
- Clique em **"Configurar Webhook Automaticamente"**

Ou manualmente:
```bash
curl -X POST "https://sua-evolution-api.com/webhook/set/SUA-INSTANCIA" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "url": "https://seu-projeto.vercel.app/api/webhook/whatsapp",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

## ✅ Pronto!

Agora seu webhook está configurado e funcionando na Vercel.

**Dica:** A Vercel faz deploy automático sempre que você faz push no GitHub!
