# Como Aplicar a Migration de Products para Services

## ⚠️ Importante

O código agora funciona com **fallback automático**: se a tabela `services` não existir, ele usa `products` automaticamente. Isso permite que você continue usando o sistema enquanto aplica a migration.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard

1. Vá para [https://app.supabase.com](https://app.supabase.com)
2. Faça login na sua conta
3. Selecione o projeto do SaaS Automação

### 2. Acesse o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### 3. Execute a Migration

Copie e cole o conteúdo do arquivo `supabase/migrations/006_rename_products_to_services.sql`:

```sql
-- Migration: Renomear tabela 'products' para 'services'
-- Esta migration renomeia a tabela e todas as referências relacionadas

-- Renomear a tabela
ALTER TABLE IF EXISTS products RENAME TO services;

-- Renomear as políticas RLS (se existirem)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Users can view own products') THEN
    ALTER POLICY "Users can view own products" ON services RENAME TO "Users can view own services";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Users can insert own products') THEN
    ALTER POLICY "Users can insert own products" ON services RENAME TO "Users can insert own services";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Users can update own products') THEN
    ALTER POLICY "Users can update own products" ON services RENAME TO "Users can update own services";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Users can delete own products') THEN
    ALTER POLICY "Users can delete own products" ON services RENAME TO "Users can delete own services";
  END IF;
END $$;

-- Atualizar o trigger
DROP TRIGGER IF EXISTS update_products_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. Execute a Query

1. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
2. Aguarde a confirmação de sucesso

### 5. Verifique se Funcionou

Execute esta query para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('services', 'products');
```

Você deve ver apenas `services` na lista (não deve aparecer `products`).

## ✅ Após a Migration

Depois de aplicar a migration:

1. **Recarregue a aplicação** no navegador
2. **Teste a página `/services`** - deve funcionar normalmente
3. **Verifique o dashboard** - deve mostrar a contagem de serviços

## 🔄 Fallback Automático

O código está preparado para funcionar com ambas as tabelas:

- **Antes da migration**: Usa `products` automaticamente
- **Depois da migration**: Usa `services` automaticamente

Não é necessário reiniciar o servidor ou fazer deploy após aplicar a migration.

## ❓ Problemas?

Se encontrar algum erro:

1. Verifique se você tem permissões de administrador no Supabase
2. Certifique-se de que não há dados sendo usados na tabela `products` no momento
3. Verifique os logs do Supabase para mais detalhes

## 📝 Notas

- A migration é **idempotente** (pode ser executada múltiplas vezes sem problemas)
- Os dados existentes em `products` serão preservados em `services`
- As políticas RLS serão atualizadas automaticamente
