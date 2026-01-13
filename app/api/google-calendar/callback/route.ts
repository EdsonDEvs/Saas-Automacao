import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { OAuth2Client } from "google-auth-library"
import { redirect } from "next/navigation"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return redirect("/login?error=not_authenticated")
    }

    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")

    if (!code) {
      return redirect("/appointments/settings?error=no_code")
    }

    // Decodifica o state (opcional)
    let userId = user.id
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
        userId = decodedState.userId || user.id
      } catch {
        // Se não conseguir decodificar, usa o user.id atual
      }
    }

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return redirect("/appointments/settings?error=no_tokens")
    }

    // Calcula quando o token expira
    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString() // Default: 1 hora

    // Salva ou atualiza a configuração do Google Calendar
    const { error } = await supabase
      .from("google_calendar_configs")
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        is_active: true,
      }, {
        onConflict: "user_id"
      })

    if (error) {
      console.error("Erro ao salvar configuração:", error)
      return redirect("/appointments/settings?error=save_failed")
    }

    return redirect("/appointments/settings?success=connected")
  } catch (error: any) {
    console.error("Erro no callback do Google Calendar:", error)
    return redirect("/appointments/settings?error=callback_failed")
  }
}
