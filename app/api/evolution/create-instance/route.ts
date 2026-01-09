import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureUserProfileServer } from "@/lib/supabase/ensure-profile-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    let { evolutionApiUrl, evolutionApiKey, instanceName } = body

    if (!evolutionApiUrl || !evolutionApiKey || !instanceName) {
      return NextResponse.json(
        { error: "URL da API, API Key e Nome da Instância são obrigatórios" },
        { status: 400 }
      )
    }

    // Normaliza o nome da instância (remove espaços, converte para minúsculas)
    instanceName = instanceName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!instanceName) {
      return NextResponse.json(
        { error: "Nome da instância inválido. Use apenas letras, números e hífens." },
        { status: 400 }
      )
    }

    // Remove barra final da URL se existir
    const cleanUrl = evolutionApiUrl.replace(/\/$/, "")
    
    // Tenta diferentes formatos de autenticação
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Tenta primeiro com header "apikey" (formato mais comum)
    headers["apikey"] = evolutionApiKey
    
    // Também tenta com Authorization como fallback
    // headers["Authorization"] = `Bearer ${evolutionApiKey}`

    // Cria instância na Evolution API
    let createResponse = await fetch(`${cleanUrl}/instance/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        instanceName: instanceName,
        token: `${instanceName}-${user.id}`, // Token único
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    })

    // Se falhar com apikey, tenta com Authorization
    if (!createResponse.ok && createResponse.status === 401) {
      const newHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${evolutionApiKey}`,
      }
      
      createResponse = await fetch(`${cleanUrl}/instance/create`, {
        method: "POST",
        headers: newHeaders,
        body: JSON.stringify({
          instanceName: instanceName,
          token: `${instanceName}-${user.id}`,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      })
    }

    // Se ainda falhar, tenta sem token (algumas versões não precisam)
    if (!createResponse.ok && createResponse.status === 401) {
      createResponse = await fetch(`${cleanUrl}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evolutionApiKey,
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      })
    }

    if (!createResponse.ok) {
      let errorMessage = "Erro ao criar instância"
      try {
        const errorData = await createResponse.json()
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
      } catch {
        const errorText = await createResponse.text()
        errorMessage = errorText || `Status ${createResponse.status}: ${createResponse.statusText}`
      }
      
      return NextResponse.json(
        { 
          error: `Erro ao criar instância: ${errorMessage}`,
          details: `Verifique se a URL (${cleanUrl}) e a API Key estão corretas. Status: ${createResponse.status}`
        },
        { status: createResponse.status }
      )
    }

    let instanceData
    try {
      instanceData = await createResponse.json()
    } catch (error) {
      console.error("Erro ao parsear resposta:", error)
      return NextResponse.json(
        { error: "Resposta inválida da Evolution API" },
        { status: 500 }
      )
    }

    // Salva a integração no banco
    await ensureUserProfileServer()
    
    const { error: dbError } = await supabase
      .from("integrations")
      .upsert({
        user_id: user.id,
        platform: "whatsapp",
        webhook_url: cleanUrl,
        api_key: evolutionApiKey,
        instance_name: instanceName,
        is_active: false, // Ainda não está conectado
      }, {
        onConflict: "user_id,platform"
      })

    if (dbError) {
      console.error("Erro ao salvar integração:", dbError)
    }

    // Tenta buscar QR Code se não veio na resposta
    let qrcode = instanceData.qrcode?.base64 || instanceData.base64 || null
    
    if (!qrcode) {
      // Tenta buscar QR Code separadamente
      try {
        const qrResponse = await fetch(`${cleanUrl}/instance/connect/${instanceName}`, {
          method: "GET",
          headers: {
            "apikey": evolutionApiKey,
          },
        })
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json()
          qrcode = qrData.qrcode?.base64 || qrData.base64 || null
        }
      } catch (error) {
        console.error("Erro ao buscar QR Code:", error)
      }
    }

    return NextResponse.json({
      success: true,
      instanceName: instanceName,
      qrcode: qrcode,
    })
  } catch (error: any) {
    console.error("Erro ao criar instância:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao criar instância" },
      { status: 500 }
    )
  }
}

