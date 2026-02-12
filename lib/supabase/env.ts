export function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env['\uFEFFNEXT_PUBLIC_SUPABASE_URL']
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env['\uFEFFNEXT_PUBLIC_SUPABASE_ANON_KEY']
  const normalizedUrl = url?.trim()
  const normalizedAnonKey = anonKey?.trim()

  if (!normalizedUrl || !normalizedAnonKey) {
    throw new Error(
      "Variáveis do Supabase ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local."
    )
  }

  return { url: normalizedUrl, anonKey: normalizedAnonKey }
}
