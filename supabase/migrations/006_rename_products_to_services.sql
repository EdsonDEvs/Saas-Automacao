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
