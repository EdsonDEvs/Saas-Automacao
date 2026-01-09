import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let instanceName = searchParams.get("instance")

    if (!instanceName) {
      return NextResponse.json(
        { error: "Nome da instância é obrigatório" },
        { status: 400 }
      )
    }

    // Decodifica o nome da instância
    instanceName = decodeURIComponent(instanceName)

    // Busca configuração da integração
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("webhook_url, api_key, instance_name")
      .eq("user_id", user.id)
      .eq("platform", "whatsapp")
      .eq("instance_name", instanceName)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "Integração não encontrada", details: integrationError?.message },
        { status: 404 }
      )
    }

    if (!integration) {
      return NextResponse.json(
        { error: "Integração não encontrada" },
        { status: 404 }
      )
    }

    // Remove barra final da URL se existir
    const cleanUrl = integration.webhook_url.replace(/\/$/, "")
    
    // Busca QR Code na Evolution API
    let qrResponse = await fetch(
      `${cleanUrl}/instance/connect/${instanceName}`,
      {
        method: "GET",
        headers: {
          "apikey": integration.api_key,
        },
      }
    )

    // Se falhar, tenta com Authorization
    if (!qrResponse.ok && qrResponse.status === 401) {
      qrResponse = await fetch(
        `${cleanUrl}/instance/connect/${instanceName}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${integration.api_key}`,
          },
        }
      )
    }

    if (!qrResponse.ok) {
      let errorMessage = "Erro ao buscar QR Code"
      try {
        const errorData = await qrResponse.json()
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
      } catch {
        const errorText = await qrResponse.text()
        errorMessage = errorText || `Status ${qrResponse.status}`
      }
      return NextResponse.json(
        { error: `Erro ao buscar QR Code: ${errorMessage}` },
        { status: qrResponse.status }
      )
    }

    const qrData = await qrResponse.json()

    return NextResponse.json({
      qrcode: qrData.qrcode?.base64 || qrData.base64 || null,
      code: qrData.code || null,
    })
  } catch (error: any) {
    console.error("Erro ao buscar QR Code:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar QR Code" },
      { status: 500 }
    )
  }
}
