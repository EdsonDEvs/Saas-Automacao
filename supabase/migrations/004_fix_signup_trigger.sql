-- Fix para o trigger de criação de perfil
-- Este arquivo corrige o problema de "Database error saving new user"

-- Primeiro, garante que a função tem as permissões corretas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenta criar o perfil
  INSERT INTO public.profiles (id, business_name, phone_number)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Minha Empresa'), 
    NULL
  )
  ON CONFLICT (id) DO NOTHING; -- Se já existir, não faz nada
  
  -- Cria a configuração do agente se não existir
  INSERT INTO public.agent_configs (user_id, agent_name, system_prompt, tone)
  VALUES (
    NEW.id, 
    'Assistente',
    'Você é um assistente virtual amigável e prestativo.',
    'Friendly'
  )
  ON CONFLICT (user_id) DO NOTHING; -- Se já existir, não faz nada
  
  -- Cria a API key se não existir
  INSERT INTO public.api_keys (user_id, key, is_active)
  VALUES (
    NEW.id, 
    uuid_generate_v4()::text,
    true
  )
  ON CONFLICT DO NOTHING; -- Se já existir, não faz nada
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log do erro (visível nos logs do Supabase)
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    -- Retorna NEW mesmo em caso de erro para não bloquear o signup
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recria o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Garante que a função tem permissão para inserir nas tabelas
-- Mesmo com SECURITY DEFINER, às vezes é necessário conceder explicitamente
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.agent_configs TO postgres, service_role;
GRANT ALL ON public.api_keys TO postgres, service_role;
