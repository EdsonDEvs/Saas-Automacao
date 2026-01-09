import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com service role key para operações administrativas
 * Bypassa RLS (Row Level Security) - use com cuidado!
 * 
 * Use apenas em:
 * - Webhooks (sem autenticação de usuário)
 * - Operações administrativas do servidor
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
