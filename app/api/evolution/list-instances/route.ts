import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Busca configuração da integração
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("webhook_url, api_key, instance_name")
      .eq("user_id", user.id)
      .eq("platform", "whatsapp")
      .maybeSingle()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "Integração não encontrada" },
        { status: 404 }
      )
    }

    // Remove barra final da URL se existir
    const cleanUrl = integration.webhook_url.replace(/\/$/, "")
    
    // Busca todas as instâncias na Evolution API
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
        error: "Erro ao buscar instâncias",
        status: statusResponse.status,
      }, { status: statusResponse.status })
    }

    let instances
    try {
      instances = await statusResponse.json()
    } catch (error) {
      return NextResponse.json({
        error: "Erro ao parsear resposta",
      }, { status: 500 })
    }

    // Normaliza para array
    const instancesArray = Array.isArray(instances) 
      ? instances 
      : (instances.data || instances.instances || [instances])

    // Extrai informações das instâncias
    const instancesInfo = instancesArray.map((inst: any) => {
      const instanceData = inst.instance || inst
      return {
        name: instanceData.instanceName || instanceData.name || "unknown",
        status: instanceData.status || instanceData.state || "unknown",
        connected: instanceData.status === "open" || 
                  instanceData.state === "open" ||
                  instanceData.status === "connected" ||
                  instanceData.state === "connected",
      }
    })

    return NextResponse.json({
      instances: instancesInfo,
      savedInstanceName: integration.instance_name,
      total: instancesInfo.length,
    })
  } catch (error: any) {
    console.error("Erro ao listar instâncias:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao listar instâncias" },
      { status: 500 }
    )
  }
}
