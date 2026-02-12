# 🔍 Verificar Variáveis de Ambiente

## ⚠️ Problema: "Erro ao configurar webhook"

Se você está vendo esse erro, verifique se as seguintes variáveis estão configuradas:

### No arquivo `.env.local` (desenvolvimento local):

```env
EVOLUTION_API_URL=https://seu-servidor-evolution.com
EVOLUTION_API_KEY=sua-chave-evolution
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Como verificar:

1. **Abra o arquivo `.env.local`** na raiz do projeto
2. **Confirme que tem essas 3 variáveis:**
   - `EVOLUTION_API_URL` - URL do seu servidor Evolution API
   - `EVOLUTION_API_KEY` - Chave de API do Evolution
   - `NEXT_PUBLIC_APP_URL` - URL do seu app (localhost em dev, ou URL da Vercel em produção)

### ⚠️ Importante:

- **`EVOLUTION_API_URL`** e **`EVOLUTION_API_KEY`** são do **servidor Evolution API** (não do Supabase)
- Essas são as credenciais do servidor Evolution que você está usando
- Se você não tem um servidor Evolution, precisa configurar um primeiro

### 🔧 Depois de configurar:

1. **Reinicie o servidor** (`npm run dev`)
2. **Recarregue a página** do dashboard
3. **Clique novamente** no botão "🔧 Configurar Webhook Agora"

### 📝 Logs para debug:

Agora quando clicar no botão, você verá no console do navegador (F12) uma mensagem de erro mais detalhada mostrando:
- Status HTTP do erro
- Mensagem de erro da Evolution API
- URL que foi tentada

Isso ajuda a identificar o problema exato.
