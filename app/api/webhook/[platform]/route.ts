import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateAIResponse } from "@/lib/ai/openai"
import { detectAppointmentIntent } from "@/lib/ai/appointment-detector"

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform
    const body = await request.json()

    // Log para debug (remover em produção ou usar logger adequado)
    console.log(`\n========== [Webhook ${platform}] Nova Mensagem Recebida ==========`)
    console.log(`[Webhook ${platform}] Timestamp:`, new Date().toISOString())
    console.log(`[Webhook ${platform}] Body completo:`, JSON.stringify(body, null, 2))
    console.log(`[Webhook ${platform}] Headers:`, Object.fromEntries(request.headers.entries()))

    // Usa admin client para bypassar RLS (webhook não tem autenticação de usuário)
    const supabase = createAdminClient()

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
      console.log(`[Webhook WhatsApp] ✅ Mensagem extraída: "${userMessage}"`)
      console.log(`[Webhook WhatsApp] 📞 De: ${fromNumber}`)
      console.log(`[Webhook WhatsApp] 🏷️ Instância: ${instanceName}`)
      
      // Ignora mensagens do próprio sistema, status ou vazias
      const isFromMe = body.key?.fromMe || body.data?.key?.fromMe || body.fromMe
      if (isFromMe || !userMessage.trim()) {
        console.log(`[Webhook WhatsApp] ⏭️ Ignorado: fromMe=${isFromMe}, mensagem vazia=${!userMessage.trim()}`)
        return NextResponse.json({ status: "ignored", reason: isFromMe ? "fromMe" : "empty" })
      }
      
      console.log(`[Webhook WhatsApp] 🔄 Processando mensagem...`)
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
      console.error(`[Webhook ${platform}] ❌ Erro: Mensagem não encontrada no body`)
      console.error(`[Webhook ${platform}] Estrutura do body:`, Object.keys(body))
      return NextResponse.json(
        { error: "Mensagem não encontrada", bodyKeys: Object.keys(body) },
        { status: 400 }
      )
    }
    
    console.log(`[Webhook ${platform}] ✅ Mensagem válida: "${userMessage}"`)

    // Busca integração baseada na instância (WhatsApp) ou primeira ativa
    let integration
    
    console.log(`[Webhook ${platform}] 🔍 Buscando integração...`)
    console.log(`[Webhook ${platform}] Instância recebida: "${instanceName}"`)
    
    if (platform === "whatsapp" && instanceName) {
      // Tenta encontrar pela instância primeiro
      const { data: integrationByInstance, error: instanceError } = await supabase
        .from("integrations")
        .select("user_id, webhook_url, api_key, instance_name, bot_token")
        .eq("platform", platform)
        .eq("instance_name", instanceName)
        .eq("is_active", true)
        .maybeSingle()
      
      if (instanceError) {
        console.error(`[Webhook ${platform}] ❌ Erro ao buscar integração por instância:`, instanceError)
      } else if (integrationByInstance) {
        console.log(`[Webhook ${platform}] ✅ Integração encontrada por instância: ${instanceName}`)
      } else {
        console.log(`[Webhook ${platform}] ⚠️ Integração não encontrada por instância: ${instanceName}`)
      }
      
      integration = integrationByInstance
    }
    
    // Se não encontrou, busca todas as ativas e pega a primeira
    if (!integration) {
      console.log(`[Webhook ${platform}] 🔍 Buscando primeira integração ativa...`)
      const { data: integrations, error: integrationsError } = await supabase
        .from("integrations")
        .select("user_id, webhook_url, api_key, instance_name, bot_token")
        .eq("platform", platform)
        .eq("is_active", true)
        .limit(1)

      if (integrationsError) {
        console.error(`[Webhook ${platform}] ❌ Erro ao buscar integrações:`, integrationsError)
        return NextResponse.json(
          { error: "Erro ao buscar integração", details: integrationsError.message },
          { status: 500 }
        )
      }

      if (!integrations || integrations.length === 0) {
        console.error(`[Webhook ${platform}] ❌ Nenhuma integração ativa encontrada`)
        return NextResponse.json(
          { error: "Nenhuma integração ativa encontrada" },
          { status: 404 }
        )
      }
      integration = integrations[0]
      console.log(`[Webhook ${platform}] ✅ Usando primeira integração ativa: ${integration.instance_name}`)
    }

    if (!integration || !integration.user_id) {
      return NextResponse.json(
        { error: "Integração inválida ou incompleta" },
        { status: 404 }
      )
    }

    // Busca o contexto do agente
    console.log(`[Webhook] Buscando API key para user_id: ${integration.user_id}`)
    const { data: apiKey, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("key")
      .eq("user_id", integration.user_id)
      .eq("is_active", true)
      .maybeSingle()

    if (apiKeyError) {
      console.error(`[Webhook ${platform}] ❌ Erro ao buscar API key:`, apiKeyError)
      console.error(`[Webhook ${platform}] Detalhes do erro:`, JSON.stringify(apiKeyError, null, 2))
      return NextResponse.json(
        { error: "Erro ao buscar API key", details: apiKeyError.message, code: apiKeyError.code },
        { status: 500 }
      )
    }

    console.log(`[Webhook ${platform}] ${apiKey ? "✅" : "❌"} API key encontrada:`, apiKey ? "Sim" : "Não")

    if (!apiKey || !apiKey.key) {
      console.error(`[Webhook ${platform}] ❌ API key não encontrada para user_id: ${integration.user_id}`)
      return NextResponse.json(
        { 
          error: "API key não encontrada para este usuário",
          details: `Nenhuma API key ativa encontrada para o usuário ${integration.user_id}. Verifique se o usuário tem uma API key criada.`
        },
        { status: 404 }
      )
    }

    console.log(`[Webhook ${platform}] ✅ API key válida encontrada, buscando contexto do agente...`)

    // Busca contexto do agente diretamente (sem fetch interno para evitar problemas de RLS)
    try {
      const userId = integration.user_id
      console.log(`[Webhook] Buscando contexto para user_id: ${userId}`)

      // Busca configuração do agente
      const { data: agentConfig, error: agentError } = await supabase
        .from("agent_configs")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (agentError) {
        console.error("[Webhook] Erro ao buscar agent config:", agentError)
        return NextResponse.json(
          { error: "Erro ao buscar configuração do agente.", details: agentError.message },
          { status: 500 }
        )
      }

      if (!agentConfig) {
        console.error("[Webhook] Configuração do agente não encontrada")
        return NextResponse.json(
          { error: "Configuração do agente não encontrada." },
          { status: 404 }
        )
      }

      // Busca produtos ativos
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .eq("stock_status", true)
        .order("name", { ascending: true })

      if (productsError) {
        console.error("[Webhook] Erro ao buscar produtos:", productsError)
        return NextResponse.json(
          { error: "Erro ao buscar produtos." },
          { status: 500 }
        )
      }

      // Formata inventário para LLM
      const inventoryText = products
        ?.map(
          (product: any) =>
            `- ${product.name} (R$ ${product.price.toFixed(2)}): ${product.description || "Sem descrição"}`
        )
        .join("\n") || "Nenhum produto disponível no momento."

      // Monta contexto
      const context = {
        agent: {
          name: agentConfig.agent_name,
          persona: agentConfig.system_prompt,
          tone: agentConfig.tone,
        },
        context: agentConfig.system_prompt,
        inventory_text: inventoryText,
      }

      console.log(`[Webhook ${platform}] ✅ Contexto obtido com sucesso para agente: ${context.agent.name}`)
      
      // Detecta se há intenção de agendamento
      const appointmentIntent = detectAppointmentIntent(userMessage, fromNumber)
      console.log(`[Webhook ${platform}] 📅 Intenção de agendamento:`, appointmentIntent)

      let aiResponse: string

      // Se detectou intenção de agendamento, busca horários disponíveis
      if (appointmentIntent.hasIntent) {
        try {
          const date = appointmentIntent.date || new Date().toISOString().split('T')[0]
          const slotsResponse = await fetch(
            `${request.nextUrl.origin}/api/appointments/available-slots?date=${date}&duration=60`,
            {
              headers: {
                'Cookie': request.headers.get('cookie') || '',
              }
            }
          )

          if (slotsResponse.ok) {
            const slotsData = await slotsResponse.json()
            const availableSlots = slotsData.availableSlots || []

            if (availableSlots.length > 0) {
              // Formata os horários disponíveis
              const formattedSlots = availableSlots.slice(0, 5).map((slot: string) => {
                const date = new Date(slot)
                return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              }).join(', ')

              aiResponse = `Ótimo! Vejo que você quer agendar. Aqui estão os horários disponíveis para ${new Date(date).toLocaleDateString('pt-BR')}:\n\n${formattedSlots}\n\nQual horário você prefere?`
            } else {
              aiResponse = `Desculpe, não há horários disponíveis para ${new Date(date).toLocaleDateString('pt-BR')}. Gostaria de verificar outro dia?`
            }
          } else {
            // Se não conseguir buscar horários, usa IA normal
            const openaiKey = process.env.OPENAI_API_KEY
            aiResponse = await generateAIResponse(
              `O cliente quer agendar. Mensagem: ${userMessage}. Responda de forma amigável oferecendo ajuda para agendar.`,
              {
                agentName: context.agent.name || "Assistente",
                persona: context.agent.persona || "",
                tone: context.agent.tone || "amigavel",
                inventory: context.inventory_text || "",
              },
              openaiKey
            )
          }
        } catch (error) {
          console.error(`[Webhook ${platform}] Erro ao buscar horários:`, error)
          // Fallback para resposta normal
          const openaiKey = process.env.OPENAI_API_KEY
          aiResponse = await generateAIResponse(userMessage, {
            agentName: context.agent.name || "Assistente",
            persona: context.agent.persona || "",
            tone: context.agent.tone || "amigavel",
            inventory: context.inventory_text || "",
          }, openaiKey)
        }
      } else {
        // Resposta normal com IA
        console.log(`[Webhook ${platform}] 🤖 Gerando resposta com IA...`)
        const openaiKey = process.env.OPENAI_API_KEY
        if (!openaiKey) {
          console.error(`[Webhook ${platform}] ❌ OPENAI_API_KEY não configurada`)
          return NextResponse.json(
            { error: "Configuração de IA não encontrada" },
            { status: 500 }
          )
        }

        aiResponse = await generateAIResponse(userMessage, {
          agentName: context.agent.name || "Assistente",
          persona: context.agent.persona || "",
          tone: context.agent.tone || "amigavel",
          inventory: context.inventory_text || "",
        }, openaiKey)
      }

      // Envia resposta de volta para a plataforma
      let sendError: string | null = null
      let sendSuccess = false
      
      if (platform === "whatsapp" && integration.webhook_url && integration.instance_name) {
        try {
          const cleanUrl = integration.webhook_url.replace(/\/$/, "")
          
          // Formata número corretamente
          const formattedNumber = fromNumber.includes("@") 
            ? fromNumber 
            : `${fromNumber}@s.whatsapp.net`
          
          console.log(`\n[Webhook WhatsApp] 📤 Enviando resposta...`)
          console.log(`[Webhook WhatsApp] 📞 Para: ${formattedNumber}`)
          console.log(`[Webhook WhatsApp] 🏷️ Instância: ${integration.instance_name}`)
          console.log(`[Webhook WhatsApp] 🔗 URL: ${cleanUrl}/message/sendText/${integration.instance_name}`)
          console.log(`[Webhook WhatsApp] 📝 Resposta (primeiros 100 chars): "${aiResponse.substring(0, 100)}..."`)
          console.log(`[Webhook WhatsApp] 🔑 API Key (primeiros 10 chars): ${integration.api_key.substring(0, 10)}...`)
          
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
            let errorMessage = `Erro ao enviar para Evolution API: Status ${sendResponse.status}`
            
            // Tenta parsear o erro para mensagem mais clara
            try {
              const errorJson = JSON.parse(errorText)
              if (errorJson.response?.message?.[0]?.exists === false) {
                errorMessage = `Número não existe ou não está no WhatsApp: ${formattedNumber}. Este é um número de teste fake. Para testar de verdade, envie uma mensagem real do WhatsApp.`
              } else if (errorJson.error) {
                errorMessage = `Erro da Evolution API: ${errorJson.error} - ${errorText}`
              } else {
                errorMessage = `Erro ao enviar: ${errorText}`
              }
            } catch {
              errorMessage = `Erro ao enviar para Evolution API: Status ${sendResponse.status} - ${errorText}`
            }
            
            sendError = errorMessage
            console.error(`\n[Webhook WhatsApp] ❌ ERRO ao enviar mensagem!`)
            console.error(`[Webhook WhatsApp] Status HTTP: ${sendResponse.status}`)
            console.error(`[Webhook WhatsApp] Resposta completa:`, errorText)
            console.error(`[Webhook WhatsApp] URL tentada: ${cleanUrl}/message/sendText/${integration.instance_name}`)
            console.error(`[Webhook WhatsApp] Instância: ${integration.instance_name}`)
            console.error(`[Webhook WhatsApp] Número: ${formattedNumber}`)
            
            // Se for número de teste fake, avisa mas não falha completamente
            if (formattedNumber.includes("5511999999999")) {
              console.warn(`[Webhook WhatsApp] ⚠️ AVISO: Este é um número de teste fake. O erro é esperado. Para testar de verdade, envie uma mensagem real do WhatsApp.`)
            }
            
            console.error(`========== [Webhook ${platform}] Processamento Concluído com ERRO ==========\n`)
          } else {
            const responseData = await sendResponse.json().catch(() => ({}))
            sendSuccess = true
            console.log(`[Webhook WhatsApp] ✅ Resposta enviada com sucesso!`)
            console.log(`[Webhook WhatsApp] 📊 Resposta da Evolution API:`, JSON.stringify(responseData, null, 2))
            console.log(`========== [Webhook ${platform}] Processamento Concluído ==========\n`)
          }
        } catch (error: any) {
          sendError = `Erro ao enviar resposta: ${error.message}`
          console.error("[Webhook WhatsApp] Erro ao enviar resposta:", error.message, error)
        }
    } else if (platform === "telegram" && (integration as any).bot_token) {
      try {
        // Envia mensagem via Telegram API
        const botToken = (integration as any).bot_token
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
        status: sendError ? "partial_success" : "success",
        message: sendError 
          ? "Mensagem processada, mas houve erro ao enviar para WhatsApp" 
          : "Mensagem processada e resposta enviada",
        response: aiResponse,
        sendSuccess: sendSuccess,
        sendError: sendError || null,
        details: {
          platform,
          instanceName: integration.instance_name,
          fromNumber: fromNumber,
          formattedNumber: platform === "whatsapp" ? (fromNumber.includes("@") ? fromNumber : `${fromNumber}@s.whatsapp.net`) : fromNumber,
        }
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
