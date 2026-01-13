import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthUrl } from "@/lib/google-calendar/client"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const authUrl = getAuthUrl()
    
    // Salva o state para verificação depois (opcional, mas recomendado)
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')
    const urlWithState = `${authUrl}&state=${state}`

    return NextResponse.json({ authUrl: urlWithState })
  } catch (error: any) {
    console.error("Erro ao gerar URL de autenticação:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar URL de autenticação" },
      { status: 500 }
    )
  }
}
