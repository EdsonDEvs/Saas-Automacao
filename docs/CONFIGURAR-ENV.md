# 🔧 Configurar Variáveis de Ambiente

## Variáveis Obrigatórias

### Supabase

1. **NEXT_PUBLIC_SUPABASE_URL**
   - URL do seu projeto Supabase
   - Exemplo: `https://seu-projeto.supabase.co`
   - Onde encontrar: Supabase Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Chave pública (anon key) do Supabase
   - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Onde encontrar: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY** ⚠️ IMPORTANTE
   - Chave de service role do Supabase (BYPASSA RLS)
   - **NUNCA exponha esta chave no frontend!**
   - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Onde encontrar: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
   - **Usada apenas no servidor para webhooks**

### OpenAI (Opcional - necessário para respostas com IA)

4. **OPENAI_API_KEY**
   - Chave da API da OpenAI
   - Exemplo: `sk-...`
   - Onde encontrar: https://platform.openai.com/api-keys

### Aplicação (Opcional)

5. **NEXT_PUBLIC_APP_URL**
   - URL pública da sua aplicação
   - Exemplo: `https://seu-dominio.com` ou `http://localhost:3000` (desenvolvimento)
   - Usado para gerar URLs de webhook

## Como Configurar

### 1. Crie o arquivo `.env.local` na raiz do projeto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# OpenAI (opcional)
OPENAI_API_KEY=sk-sua-chave-aqui

# Aplicação (opcional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## ⚠️ Importante

- **NUNCA** commite o arquivo `.env.local` no Git
- O arquivo `.env.local` já está no `.gitignore`
- A `SUPABASE_SERVICE_ROLE_KEY` é **CRÍTICA** - ela bypassa todas as políticas de segurança (RLS)
- Use apenas no servidor, nunca no frontend
- Mantenha essas chaves seguras!

## Verificação

Após configurar, você pode verificar se está funcionando:

1. Acesse `/debug` no sistema
2. Teste o webhook
3. Verifique os logs do servidor

Se aparecer erro sobre variáveis de ambiente, verifique se todas estão configuradas corretamente.
