# 🚀 Deploy na Vercel - Guia Completo

## 📋 Pré-requisitos

1. **Conta na Vercel** - Crie em [vercel.com](https://vercel.com)
2. **Repositório no GitHub** - Seu código deve estar no GitHub
3. **Variáveis de ambiente** - Tenha todas as chaves prontas

## 🔧 Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que seu código está no GitHub:

```bash
# Se ainda não fez commit
git add .
git commit -m "Preparar para deploy"
git push origin main
```

### 2. Conectar com a Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Conecte seu repositório do GitHub
4. Selecione o repositório do projeto

### 3. Configurar o Projeto

A Vercel detecta automaticamente que é um projeto Next.js. Configure:

- **Framework Preset:** Next.js (já detectado)
- **Root Directory:** `./` (raiz do projeto)
- **Build Command:** `npm run build` (padrão)
- **Output Directory:** `.next` (padrão)
- **Install Command:** `npm install` (padrão)

### 4. Configurar Variáveis de Ambiente

**IMPORTANTE:** Configure todas as variáveis de ambiente na Vercel:

1. Na página de configuração do projeto, vá em **"Environment Variables"**
2. Adicione cada variável:

#### Variáveis Obrigatórias:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

#### Variáveis Opcionais (mas recomendadas):

```
OPENAI_API_KEY=sk-sua-chave-aqui
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

**⚠️ IMPORTANTE:**
- `NEXT_PUBLIC_APP_URL` deve ser a URL do seu deploy na Vercel
- Você pode deixar vazio inicialmente e atualizar depois com a URL real
- Ou use: `https://seu-projeto.vercel.app` (substitua pelo nome do seu projeto)

### 5. Fazer o Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (pode levar 2-5 minutos)
3. Quando terminar, você receberá uma URL: `https://seu-projeto.vercel.app`

### 6. Atualizar URL do Webhook

Após o deploy, você precisa:

1. **Atualizar `NEXT_PUBLIC_APP_URL`** na Vercel com a URL real do deploy
2. **Configurar o webhook na Evolution API** com a nova URL:
   ```
   https://seu-projeto.vercel.app/api/webhook/whatsapp
   ```

### 7. Configurar Webhook na Evolution API

Após o deploy, acesse `/debug` no seu site e:
1. Clique em **"Verificar Webhook na Evolution API"**
2. Se não estiver configurado, clique em **"Configurar Webhook Automaticamente"**

Ou configure manualmente:

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

## 🔄 Deploy Automático

A Vercel faz deploy automático sempre que você faz push para o branch principal:

1. Faça alterações no código
2. Commit e push:
   ```bash
   git add .
   git commit -m "Sua mensagem"
   git push origin main
   ```
3. A Vercel detecta automaticamente e faz novo deploy

## 📝 Checklist Pós-Deploy

- [ ] Deploy concluído com sucesso
- [ ] Variáveis de ambiente configuradas
- [ ] `NEXT_PUBLIC_APP_URL` atualizada com a URL real
- [ ] Webhook configurado na Evolution API
- [ ] Testado enviando mensagem no WhatsApp
- [ ] Logs do webhook funcionando

## 🐛 Problemas Comuns

### Erro: "Environment variables not found"

**Solução:** Configure todas as variáveis de ambiente na Vercel (Settings → Environment Variables)

### Erro: "Build failed"

**Solução:** 
- Verifique os logs do build na Vercel
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se não há erros de TypeScript

### Webhook não funciona após deploy

**Solução:**
1. Verifique se `NEXT_PUBLIC_APP_URL` está configurada corretamente
2. Configure o webhook novamente na Evolution API com a URL do Vercel
3. Verifique se a URL está acessível publicamente

### Erro: "Module not found"

**Solução:**
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para verificar se instala corretamente

## 🔐 Segurança

- ✅ **NUNCA** commite arquivos `.env.local` no Git
- ✅ Use variáveis de ambiente na Vercel
- ✅ `SUPABASE_SERVICE_ROLE_KEY` deve ser mantida em segredo
- ✅ `OPENAI_API_KEY` deve ser mantida em segredo

## 📊 Monitoramento

A Vercel fornece:
- Logs em tempo real
- Analytics de performance
- Alertas de erro
- Histórico de deploys

Acesse o dashboard da Vercel para ver tudo isso.

## 🆘 Precisa de Ajuda?

1. Verifique os logs do build na Vercel
2. Verifique os logs do runtime (Runtime Logs)
3. Teste localmente primeiro: `npm run build && npm start`
4. Verifique a documentação da Vercel: [vercel.com/docs](https://vercel.com/docs)
