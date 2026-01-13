# 🔧 Correção: Erro ao Fazer Cadastro

## ❌ Problema

Ao tentar criar uma conta, aparece o erro:
- **"Database error saving new user"**
- **Status 500** no console do navegador

## 🔍 Causa

O trigger `handle_new_user()` que cria automaticamente o perfil do usuário está falhando devido a:
1. Problemas de permissão com Row Level Security (RLS)
2. A função não está capturando erros adequadamente
3. Conflitos ao tentar inserir dados

## ✅ Solução

### Passo 1: Aplicar a Migração

Execute a migração `004_fix_signup_trigger.sql` no Supabase:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo de `supabase/migrations/004_fix_signup_trigger.sql`
4. Clique em **Run**

### Passo 2: Verificar Permissões

Certifique-se de que:
- A função `handle_new_user()` tem `SECURITY DEFINER`
- As políticas RLS estão configuradas corretamente
- O trigger está ativo

### Passo 3: Testar

1. Tente criar uma nova conta
2. Se ainda der erro, verifique os logs do Supabase em **Logs** → **Postgres Logs**

## 🔄 Fallback Automático

O código já foi atualizado para criar o perfil manualmente se o trigger falhar. Isso garante que o cadastro funcione mesmo se houver problemas com o trigger.

## 📝 O que a Correção Faz

1. **Melhora a função do trigger:**
   - Adiciona tratamento de erros
   - Usa `ON CONFLICT DO NOTHING` para evitar erros de duplicação
   - Retorna NEW mesmo em caso de erro (não bloqueia o signup)

2. **Adiciona fallback no código:**
   - Verifica se o perfil foi criado após 2 segundos
   - Se não foi criado, tenta criar manualmente
   - Garante que o usuário consegue continuar mesmo se o trigger falhar

3. **Melhora as permissões:**
   - Garante que a função tem acesso às tabelas necessárias

## 🆘 Se Ainda Não Funcionar

1. Verifique os logs do Supabase
2. Verifique se a migração `001_initial_schema.sql` foi executada
3. Verifique se há alguma constraint violada
4. Tente criar o perfil manualmente via SQL:

```sql
-- Substitua USER_ID pelo ID do usuário
INSERT INTO public.profiles (id, business_name, phone_number)
VALUES ('USER_ID', 'Nome da Empresa', NULL)
ON CONFLICT (id) DO NOTHING;
```
