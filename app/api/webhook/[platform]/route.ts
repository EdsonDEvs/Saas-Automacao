import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform
    const body = await request.json()

    // Busca a integração baseada no webhook secret ou outros identificadores
    // Por enquanto, vamos buscar pela plataforma e processar
    const supabase = await createClient()

    // Extrai informações da mensagem baseado na plataforma
    let userMessage = ""
    let fromNumber = ""
    let chatId = ""

    if (platform === "whatsapp") {
      // Formato Evolution API
      userMessage = body.text?.body || body.message?.text || body.body?.message || ""
      fromNumber = body.from || body.key?.remoteJid || ""
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

    // Busca todas as integrações ativas desta plataforma
    // Em produção, você deve identificar qual usuário baseado em algum identificador único
    const { data: integrations } = await supabase
      .from("integrations")
      .select("user_id")
      .eq("platform", platform)
      .eq("is_active", true)

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma integração ativa encontrada" },
        { status: 404 }
      )
    }

    // Por enquanto, pega a primeira integração ativa
    // Em produção, você deve identificar qual usuário baseado no número/chat
    const integration = integrations[0]

    // Busca o contexto do agente
    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("key")
      .eq("user_id", integration.user_id)
      .eq("is_active", true)
      .single()

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key não encontrada" },
        { status: 404 }
      )
    }

    // Busca contexto do agente
    const contextResponse = await fetch(
      `${request.nextUrl.origin}/api/v1/context`,
      {
        headers: {
          "x-api-key": apiKey.key,
        },
      }
    )

    if (!contextResponse.ok) {
      return NextResponse.json(
        { error: "Erro ao buscar contexto do agente" },
        { status: 500 }
      )
    }

    const context = await contextResponse.json()

    // Aqui você pode integrar com OpenAI ou outro LLM
    // Por enquanto, retornamos uma resposta simples
    // Em produção, você deve chamar a API de IA aqui

    const response = {
      message: `Olá! Esta é uma resposta automática. Sua mensagem: "${userMessage}". Em produção, isso será processado por IA.`,
      // Adicione aqui a lógica para enviar a resposta de volta para a plataforma
    }

    return NextResponse.json(response)
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
