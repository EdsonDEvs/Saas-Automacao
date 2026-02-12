import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEvolutionMessage } from "@/lib/evolution/send-message"
import { getNgrokUrl } from "@/lib/ngrok/get-url"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { instanceName } = body

    let integrationQuery = supabase
      .from("integrations")
      .select("id, webhook_url, api_key, instance_name, phone_number, welcome_sent_at")
      .eq("user_id", user.id)
      .eq("platform", "whatsapp")

    if (instanceName) {
      integrationQuery = integrationQuery.eq("instance_name", instanceName)
    }

    const { data: integration } = await integrationQuery.maybeSingle()

    // Se não encontrou integração ou está incompleta, usa variáveis de ambiente
    const webhookUrl = integration?.webhook_url || process.env.EVOLUTION_API_URL
    const apiKey = integration?.api_key || process.env.EVOLUTION_API_KEY
    const finalInstanceName = instanceName || integration?.instance_name

    if (!webhookUrl || !apiKey || !finalInstanceName) {
      return NextResponse.json(
        { 
          error: "Integração WhatsApp incompleta. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY no servidor ou complete a integração no setup.",
          details: {
            hasIntegration: !!integration,
            hasWebhookUrl: !!webhookUrl,
            hasApiKey: !!apiKey,
            hasInstanceName: !!finalInstanceName,
          }
        },
        { status: 400 }
      )
    }

    // Se a integração não tinha os dados, atualiza ela
    if (integration && (!integration.webhook_url || !integration.api_key)) {
      await supabase
        .from("integrations")
        .update({
          webhook_url: webhookUrl,
          api_key: apiKey,
        })
        .eq("id", integration.id)
    }

    // Tenta detectar URL do ngrok automaticamente (se estiver rodando)
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    
    // Se estiver em localhost, tenta detectar ngrok
    if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
      try {
        const ngrokUrl = await getNgrokUrl()
        if (ngrokUrl) {
          appUrl = ngrokUrl
          console.log(`[One-Click Onboarding] ✅ ngrok detectado: ${ngrokUrl}`)
        } else {
          console.warn(`[One-Click Onboarding] ⚠️ ngrok não detectado. Use ngrok para expor localhost ou configure NEXT_PUBLIC_APP_URL`)
        }
      } catch (error) {
        console.warn(`[One-Click Onboarding] ⚠️ Erro ao detectar ngrok:`, error)
      }
    }
    
    const webhookUrlToSet = `${appUrl}/api/webhook/whatsapp`

    // Para Evolution API 2.3.7, tenta primeiro obter a configuração atual da instância
    // para entender o formato esperado
    let instanceConfig: any = null
    try {
      const configResponse = await fetch(
        `${webhookUrl.replace(/\/$/, "")}/instance/fetchInstances`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
        }
      )
      
      if (configResponse.ok) {
        const configData = await configResponse.json().catch(() => null)
        if (configData && Array.isArray(configData)) {
          instanceConfig = configData.find((inst: any) => inst.instance?.instanceName === finalInstanceName)
          console.log(`[One-Click Onboarding] Configuração atual da instância:`, JSON.stringify(instanceConfig, null, 2))
        }
      }
    } catch (error) {
      console.log(`[One-Click Onboarding] Não foi possível obter configuração da instância:`, error)
    }

    // Tenta diferentes formatos de payload que a Evolution API pode aceitar
    // Para Evolution API 2.3.7, o formato esperado é com propriedade "webhook"
    const payloadFormats = [
      // Formato 1: webhook apenas com url (mais simples - tenta primeiro)
      {
        webhook: {
          url: webhookUrlToSet,
        },
      },
      // Formato 2: webhook com url e events
      {
        webhook: {
          url: webhookUrlToSet,
          events: ["MESSAGES_UPSERT"],
        },
      },
      // Formato 3: webhook como objeto completo
      {
        webhook: {
          url: webhookUrlToSet,
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
        },
      },
      // Formato 4: webhook como string
      {
        webhook: webhookUrlToSet,
      },
      // Formato 5: propriedades no nível raiz (formato antigo - fallback)
      {
        url: webhookUrlToSet,
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
      },
    ]

    // Formatos específicos para /instance/update (quando precisa atualizar a instância inteira)
    const instanceUpdateFormats = [
      // Formato mais simples primeiro
      {
        webhook: {
          url: webhookUrlToSet,
        },
      },
      // Formato completo
      {
        webhook: {
          url: webhookUrlToSet,
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
        },
      },
    ]

    let webhookResponse: Response | null = null
    let lastError: any = null

    // Para Evolution API 2.3.7, o endpoint correto é /webhook/instance
    // Formato: propriedades no nível raiz (sem propriedade "webhook")
    // Baseado na documentação: https://doc.evolution-api.com/v2/pt/configuration/webhooks
    const endpoints = [
      { 
        path: `/webhook/instance`, 
        method: "POST", 
        formats: [
          // Formato correto da documentação Evolution API 2.3.7
          {
            url: webhookUrlToSet,
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
            instanceName: finalInstanceName,
          },
        ]
      },
      // Fallback: tenta endpoint antigo também
      { path: `/webhook/set/${finalInstanceName}`, method: "POST", formats: payloadFormats },
    ]

    // Tenta todos os endpoints e formatos até encontrar um que funcione
    endpointLoop: for (const endpointConfig of endpoints) {
      const url = `${webhookUrl.replace(/\/$/, "")}${endpointConfig.path}`
      
      for (const payload of endpointConfig.formats) {
        try {
          const payloadKey = Object.keys(payload)[0]
          console.log(`[One-Click Onboarding] Tentando ${endpointConfig.method} ${url} com formato:`, payloadKey)
          console.log(`[One-Click Onboarding] Payload:`, JSON.stringify(payload, null, 2))
          
          // Tenta com apikey header
          webhookResponse = await fetch(url, {
            method: endpointConfig.method,
            headers: {
              "Content-Type": "application/json",
              apikey: apiKey,
            },
            body: JSON.stringify(payload),
          })

          if (webhookResponse.ok) {
            const responseData = await webhookResponse.json().catch(() => ({}))
            console.log(`[One-Click Onboarding] ✅ Webhook configurado! Endpoint: ${endpointConfig.path}, Formato:`, payloadKey)
            console.log(`[One-Click Onboarding] Resposta:`, responseData)
            break endpointLoop
          }

          // Se falhar com 401, tenta com Authorization
          if (webhookResponse.status === 401) {
            console.log(`[One-Click Onboarding] ⚠️ 401 com apikey, tentando Authorization Bearer...`)
            webhookResponse = await fetch(url, {
              method: endpointConfig.method,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify(payload),
            })

            if (webhookResponse.ok) {
              const responseData = await webhookResponse.json().catch(() => ({}))
              console.log(`[One-Click Onboarding] ✅ Webhook configurado! Endpoint: ${endpointConfig.path}, Formato:`, payloadKey)
              console.log(`[One-Click Onboarding] Resposta:`, responseData)
              break endpointLoop
            }
          }

          // Se for 404, não tenta outros formatos neste endpoint
          if (webhookResponse.status === 404) {
            const errorText = await webhookResponse.text().catch(() => "")
            console.log(`[One-Click Onboarding] ⚠️ Endpoint ${endpointConfig.path} não existe (404), tentando próximo endpoint...`)
            continue endpointLoop
          }

          // Se ainda falhar, salva o erro e tenta próximo formato
          const errorText = await webhookResponse.text().catch(() => "")
          lastError = {
            status: webhookResponse.status,
            body: errorText,
            endpoint: endpointConfig.path,
            method: endpointConfig.method,
            payload: payloadKey,
          }
          console.log(`[One-Click Onboarding] ⚠️ ${endpointConfig.method} ${endpointConfig.path} com formato ${payloadKey} falhou (${webhookResponse.status}):`, errorText.substring(0, 300))
        } catch (error: any) {
          lastError = { 
            error: error.message, 
            endpoint: endpointConfig.path,
            method: endpointConfig.method,
            payload: Object.keys(payload)[0] 
          }
          console.log(`[One-Click Onboarding] ⚠️ Erro de rede ao tentar ${endpointConfig.path}:`, error.message)
          continue
        }
      }
    }

    const webhookConfigured = webhookResponse?.ok || false
    let webhookError = null
    
    if (!webhookResponse || !webhookResponse.ok) {
      if (lastError) {
        webhookError = lastError
        console.error(`[One-Click Onboarding] ❌ Erro ao configurar webhook após tentar todos os formatos:`, lastError)
      } else if (webhookResponse) {
        try {
          const errorText = await webhookResponse.text()
          webhookError = {
            status: webhookResponse.status,
            statusText: webhookResponse.statusText,
            body: errorText,
          }
        } catch (e) {
          webhookError = {
            status: webhookResponse.status,
            statusText: webhookResponse.statusText,
          }
        }
      } else {
        webhookError = {
          error: "Nenhuma resposta da Evolution API",
        }
      }
      
      // Se não conseguiu configurar via API, retorna instruções para configurar manualmente
      console.warn(`[One-Click Onboarding] ⚠️ Não foi possível configurar webhook via API.`)
      console.warn(`[One-Click Onboarding] ⚠️ Configure manualmente no painel da Evolution API:`)
      console.warn(`[One-Click Onboarding] ⚠️ URL: ${webhookUrlToSet}`)
    } else {
      console.log(`[One-Click Onboarding] ✅ Webhook configurado com sucesso!`)
    }

    let welcomeSent = false
    const phoneNumber = integration?.phone_number
    if (phoneNumber && !integration?.welcome_sent_at) {
      const formattedNumber = phoneNumber.includes("@")
        ? phoneNumber
        : `${phoneNumber}@s.whatsapp.net`
      await sendEvolutionMessage({
        baseUrl: webhookUrl,
        apiKey: apiKey,
        instanceName: finalInstanceName,
        to: formattedNumber,
        text: "✅ Tudo pronto! Seu WhatsApp foi conectado e o agente de agendamentos já está ativo.",
      })
      const integrationId = integration?.id
      if (integrationId) {
        await supabase
          .from("integrations")
          .update({ welcome_sent_at: new Date().toISOString() })
          .eq("id", integrationId)
      }
      welcomeSent = true
    }

    return NextResponse.json({
      success: webhookConfigured,
      webhookConfigured,
      webhookUrl: webhookUrlToSet,
      welcomeSent,
      error: webhookError ? `Erro ${webhookError.status}: ${webhookError.body || webhookError.statusText}` : null,
      details: webhookError,
      manualConfigRequired: !webhookConfigured,
      manualConfigInstructions: !webhookConfigured ? {
        message: "Configure o webhook manualmente no painel da Evolution API",
        url: webhookUrlToSet,
        steps: [
          "1. Acesse o painel da Evolution API",
          "2. Vá em Settings → Webhooks",
          "3. Adicione a URL do webhook",
          "4. Selecione os eventos necessários",
          "5. Salve a configuração"
        ]
      } : null,
    })
  } catch (error: any) {
    console.error("Erro no onboarding one-click:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao executar onboarding" },
      { status: 500 }
    )
  }
}
