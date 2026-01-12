# ✅ Checklist de Deploy na Vercel

## 📋 Antes do Deploy

- [ ] Código está no GitHub
- [ ] Todas as dependências estão no `package.json`
- [ ] Projeto compila localmente: `npm run build`
- [ ] Testes locais funcionando: `npm run dev`

## 🔧 Configuração na Vercel

- [ ] Conta criada na Vercel
- [ ] Repositório conectado
- [ ] Projeto criado na Vercel

## 🔐 Variáveis de Ambiente

Configure todas na Vercel (Settings → Environment Variables):

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY` (opcional, mas recomendado)
- [ ] `NEXT_PUBLIC_APP_URL` (atualizar após primeiro deploy)

## 🚀 Deploy

- [ ] Deploy inicial concluído
- [ ] Build sem erros
- [ ] Site acessível na URL da Vercel

## 🔗 Pós-Deploy

- [ ] `NEXT_PUBLIC_APP_URL` atualizada com URL real
- [ ] Webhook configurado na Evolution API
- [ ] Testado enviando mensagem no WhatsApp
- [ ] Logs do webhook funcionando

## ✅ Tudo Pronto!

Se todos os itens estão marcados, seu deploy está completo e funcionando!
