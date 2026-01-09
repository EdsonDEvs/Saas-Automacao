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
      .maybeSingle()

    if (integrationError) {
      console.error("Erro ao buscar integração:", integrationError)
      return NextResponse.json(
        { error: "Erro ao buscar integração", details: integrationError.message },
        { status: 500 }
      )
    }

    if (!integration) {
      return NextResponse.json(
        { error: "Integração não encontrada", status: "not_found" },
        { status: 404 }
      )
    }

    // Remove barra final da URL se existir
    const cleanUrl = integration.webhook_url.replace(/\/$/, "")
    
    // Verifica status na Evolution API
    let statusResponse = await fetch(
      `${cleanUrl}/instance/fetchInstances`,
      {
        method: "GET",
        headers: {
          "apikey": integration.api_key,
        },
      }
    )

    // Se falhar, tenta com Authorization
    if (!statusResponse.ok && statusResponse.status === 401) {
      statusResponse = await fetch(
        `${cleanUrl}/instance/fetchInstances`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${integration.api_key}`,
          },
        }
      )
    }

    if (!statusResponse.ok) {
      return NextResponse.json({
        connected: false,
        status: "error",
      })
    }

    let instances
    try {
      instances = await statusResponse.json()
    } catch (error) {
      console.error("Erro ao parsear resposta:", error)
      return NextResponse.json({
        connected: false,
        status: "error",
        error: "Resposta inválida da Evolution API",
      })
    }

    // Pode retornar array ou objeto
    const instancesArray = Array.isArray(instances) ? instances : (instances.data || [instances])
    const instance = instancesArray.find((inst: any) => {
      const name = inst.instance?.instanceName || inst.instanceName || inst.name
      return name === instanceName
    })

    if (!instance) {
      return NextResponse.json({
        connected: false,
        status: "not_found",
      })
    }

    const instanceData = instance.instance || instance
    const isConnected = instanceData.status === "open" || instanceData.state === "open"

    // Atualiza status no banco e configura webhook automaticamente
    if (isConnected) {
      await supabase
        .from("integrations")
        .update({ is_active: true })
        .eq("user_id", user.id)
        .eq("platform", "whatsapp")

      // Configura webhook automaticamente
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'https://seu-dominio.com'
        const webhookUrl = `${baseUrl}/api/webhook/whatsapp`
        await fetch(
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
      } catch (error) {
        console.error("Erro ao configurar webhook automaticamente:", error)
        // Não falha se não conseguir configurar webhook
      }
    }

    return NextResponse.json({
      connected: isConnected,
      status: instanceData.status || instanceData.state || "unknown",
      qrcode: instanceData.qrcode?.base64 || instanceData.qrcode || null,
    })
  } catch (error: any) {
    console.error("Erro ao verificar status:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao verificar status" },
      { status: 500 }
    )
  }
}
