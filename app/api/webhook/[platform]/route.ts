import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateAIResponse } from "@/lib/ai/openai"

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform
    const body = await request.json()

    // Log para debug (remover em produção ou usar logger adequado)
    console.log(`[Webhook ${platform}] Recebido:`, JSON.stringify(body, null, 2))

    const supabase = await createClient()

    // Extrai informações da mensagem baseado na plataforma
    let userMessage = ""
    let fromNumber = ""
    let chatId = ""
    let instanceName = ""

    if (platform === "whatsapp") {
      // Evolution API pode enviar em diferentes formatos dependendo da versão
      // Formato 1: body.data (webhook por eventos)
      if (body.data) {
        const data = body.data
        userMessage = data.text?.body || 
                     data.message?.conversation || 
                     data.message?.extendedTextMessage?.text ||
                     data.message?.conversation ||
                     ""
        fromNumber = data.key?.remoteJid || data.from || ""
        instanceName = data.instance || body.instance || ""
      }
      // Formato 2: body direto (webhook simples)
      else {
        userMessage = body.text?.body || 
                     body.message?.conversation || 
                     body.message?.extendedTextMessage?.text ||
                     body.conversation ||
                     body.body?.message || 
                     ""
        
        fromNumber = body.key?.remoteJid || body.from || ""
        instanceName = body.instance || body.instanceName || ""
      }
      
      // Limpa número (remove @s.whatsapp.net e @c.us)
      if (fromNumber) {
        fromNumber = fromNumber.replace("@s.whatsapp.net", "").replace("@c.us", "")
      }
      
      // Log extraído
      console.log(`[Webhook WhatsApp] Mensagem: "${userMessage}", De: ${fromNumber}, Instância: ${instanceName}`)
      
      // Ignora mensagens do próprio sistema, status ou vazias
      const isFromMe = body.key?.fromMe || body.data?.key?.fromMe || body.fromMe
      if (isFromMe || !userMessage.trim()) {
        console.log(`[Webhook WhatsApp] Ignorado: fromMe=${isFromMe}, mensagem vazia=${!userMessage.trim()}`)
        return NextResponse.json({ status: "ignored", reason: isFromMe ? "fromMe" : "empty" })
      }
    } else if (platform === "telegram") {
      // Formato Telegram
      userMessage = body.message?.text || ""
      chatId = body.message?.chat?.id?.toString() || ""
      fromNumber = body.message?.from?.id?.toString() || ""
    } else {
      // Webhook genérico
      userMessage = body.message || body.text || body.body?.message || ""
    }

    if (!userMessage) {
      return NextResponse.json(
        { error: "Mensagem não encontrada" },
        { status: 400 }
      )
    }

    // Busca integração baseada na instância (WhatsApp) ou primeira ativa
    let integration
    
    if (platform === "whatsapp" && instanceName) {
      // Tenta encontrar pela instância primeiro
      const { data: integrationByInstance, error: instanceError } = await supabase
        .from("integrations")
        .select("user_id, webhook_url, api_key, instance_name")
        .eq("platform", platform)
        .eq("instance_name", instanceName)
        .eq("is_active", true)
        .maybeSingle()
      
      if (instanceError) {
        console.error("[Webhook] Erro ao buscar integração por instância:", instanceError)
      }
      
      integration = integrationByInstance
    }
    
    // Se não encontrou, busca todas as ativas e pega a primeira
    if (!integration) {
      const { data: integrations, error: integrationsError } = await supabase
        .from("integrations")
        .select("user_id, webhook_url, api_key, instance_name")
        .eq("platform", platform)
        .eq("is_active", true)
        .limit(1)

      if (integrationsError) {
        console.error("[Webhook] Erro ao buscar integrações:", integrationsError)
        return NextResponse.json(
          { error: "Erro ao buscar integração", details: integrationsError.message },
          { status: 500 }
        )
      }

      if (!integrations || integrations.length === 0) {
        return NextResponse.json(
          { error: "Nenhuma integração ativa encontrada" },
          { status: 404 }
        )
      }
      integration = integrations[0]
    }

    if (!integration || !integration.user_id) {
      return NextResponse.json(
        { error: "Integração inválida ou incompleta" },
        { status: 404 }
      )
    }

    // Busca o contexto do agente
    const { data: apiKey, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("key")
      .eq("user_id", integration.user_id)
      .eq("is_active", true)
      .maybeSingle()

    if (apiKeyError) {
      console.error("[Webhook] Erro ao buscar API key:", apiKeyError)
      return NextResponse.json(
        { error: "Erro ao buscar API key", details: apiKeyError.message },
        { status: 500 }
      )
    }

    if (!apiKey || !apiKey.key) {
      return NextResponse.json(
        { error: "API key não encontrada para este usuário" },
        { status: 404 }
      )
    }

    // Busca contexto do agente
    try {
      const contextUrl = `${request.nextUrl.origin}/api/v1/context`
      console.log(`[Webhook] Buscando contexto em: ${contextUrl}`)
      
      const contextResponse = await fetch(contextUrl, {
        headers: {
          "x-api-key": apiKey.key,
        },
      })

      if (!contextResponse.ok) {
        const errorText = await contextResponse.text()
        console.error(`[Webhook] Erro ao buscar contexto: ${contextResponse.status}`, errorText)
        return NextResponse.json(
          { 
            error: "Erro ao buscar contexto do agente",
            details: errorText || `Status: ${contextResponse.status}`
          },
          { status: contextResponse.status || 500 }
        )
      }

      const context = await contextResponse.json()
      
      if (!context || !context.agent) {
        console.error("[Webhook] Contexto inválido recebido:", context)
        return NextResponse.json(
          { error: "Contexto do agente inválido ou incompleto" },
          { status: 500 }
        )
      }

      // Gera resposta com IA
      const openaiKey = process.env.OPENAI_API_KEY
      if (!openaiKey) {
        console.error("[Webhook] OPENAI_API_KEY não configurada")
        return NextResponse.json(
          { error: "Configuração de IA não encontrada" },
          { status: 500 }
        )
      }

      const aiResponse = await generateAIResponse(userMessage, {
        agentName: context.agent.name || "Assistente",
        persona: context.agent.persona || "",
        tone: context.agent.tone || "amigavel",
        inventory: context.inventory_text || "",
      }, openaiKey)

      // Envia resposta de volta para a plataforma
      if (platform === "whatsapp" && integration.webhook_url && integration.instance_name) {
      try {
        const cleanUrl = integration.webhook_url.replace(/\/$/, "")
        
        // Formata número corretamente
        const formattedNumber = fromNumber.includes("@") 
          ? fromNumber 
          : `${fromNumber}@s.whatsapp.net`
        
        console.log(`[Webhook WhatsApp] Enviando resposta para ${formattedNumber} via ${integration.instance_name}`)
        
        const sendPayload = {
          number: formattedNumber,
          text: aiResponse,
        }
        
        let sendResponse = await fetch(
          `${cleanUrl}/message/sendText/${integration.instance_name}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": integration.api_key,
            },
            body: JSON.stringify(sendPayload),
          }
        )

        // Se falhar, tenta com Authorization
        if (!sendResponse.ok && sendResponse.status === 401) {
          console.log(`[Webhook WhatsApp] Tentando com Authorization header`)
          sendResponse = await fetch(
            `${cleanUrl}/message/sendText/${integration.instance_name}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${integration.api_key}`,
              },
              body: JSON.stringify(sendPayload),
            }
          )
        }

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text()
          console.error(`[Webhook WhatsApp] Erro ao enviar: Status ${sendResponse.status}`, errorText)
        } else {
          const responseData = await sendResponse.json().catch(() => ({}))
          console.log(`[Webhook WhatsApp] Resposta enviada com sucesso:`, responseData)
        }
      } catch (error: any) {
        console.error("[Webhook WhatsApp] Erro ao enviar resposta:", error.message, error)
      }
    } else if (platform === "telegram" && integration.bot_token) {
      try {
        // Envia mensagem via Telegram API
        await fetch(`https://api.telegram.org/bot${integration.bot_token}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: aiResponse,
          }),
        })
      } catch (error) {
        console.error("Erro ao enviar resposta para Telegram:", error)
      }
    }

      // Retorna resposta para confirmação
      return NextResponse.json({
        status: "success",
        message: "Mensagem processada e resposta enviada",
        response: aiResponse,
      })
    } catch (contextError: any) {
      console.error("[Webhook] Erro ao processar contexto:", contextError)
      return NextResponse.json(
        { 
          error: "Erro ao processar contexto do agente",
          details: contextError.message 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}

// GET para verificação de webhook (Telegram)
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  return NextResponse.json({ status: "ok", platform: params.platform })
}
