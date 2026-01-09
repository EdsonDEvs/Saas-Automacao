import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Endpoint de teste para verificar se o webhook está funcionando
 * Use: POST /api/webhook/test com body de exemplo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Simula o processamento
    const supabase = await createClient()
    
    // Busca integrações ativas
    const { data: integrations } = await supabase
      .from("integrations")
      .select("user_id, webhook_url, api_key, instance_name, platform")
      .eq("platform", "whatsapp")
      .eq("is_active", true)
      .limit(1)

    return NextResponse.json({
      status: "ok",
      message: "Webhook de teste recebido",
      body: body,
      integrationsFound: integrations?.length || 0,
      integration: integrations?.[0] || null,
      webhookUrl: `${request.nextUrl.origin}/api/webhook/whatsapp`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Endpoint de teste do webhook",
    webhookUrl: `${request.nextUrl.origin}/api/webhook/whatsapp`,
    instructions: "Envie um POST com um body de exemplo da Evolution API para testar",
  })
}
