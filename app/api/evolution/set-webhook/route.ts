import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { instanceName } = body

    if (!instanceName) {
      return NextResponse.json(
        { error: "Nome da instância é obrigatório" },
        { status: 400 }
      )
    }

    // Busca configuração da integração
    const { data: integration } = await supabase
      .from("integrations")
      .select("webhook_url, api_key, instance_name")
      .eq("user_id", user.id)
      .eq("platform", "whatsapp")
      .eq("instance_name", instanceName)
      .single()

    if (!integration) {
      return NextResponse.json(
        { error: "Integração não encontrada" },
        { status: 404 }
      )
    }

    // Gera URL do webhook
    const webhookUrl = `${request.nextUrl.origin}/api/webhook/whatsapp`

    // Configura webhook na Evolution API
    const webhookResponse = await fetch(
      `${integration.webhook_url}/webhook/set/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": integration.api_key,
        },
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "MESSAGES_DELETE",
            "SEND_MESSAGE",
            "CONNECTION_UPDATE",
            "QRCODE_UPDATED",
          ],
        }),
      }
    )

    if (!webhookResponse.ok) {
      const error = await webhookResponse.text()
      return NextResponse.json(
        { error: `Erro ao configurar webhook: ${error}` },
        { status: webhookResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      webhookUrl: webhookUrl,
    })
  } catch (error: any) {
    console.error("Erro ao configurar webhook:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao configurar webhook" },
      { status: 500 }
    )
  }
}
