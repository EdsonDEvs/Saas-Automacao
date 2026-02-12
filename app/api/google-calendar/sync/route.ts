import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGoogleCalendarClient, refreshAccessToken } from "@/lib/google-calendar/client"
import { sendEvolutionMessage } from "@/lib/evolution/send-message"

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.GOOGLE_CAL_SYNC_SECRET
    if (cronSecret && request.headers.get("x-cron-secret") !== cronSecret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: configs, error: configError } = await supabase
      .from("google_calendar_configs")
      .select("*")
      .eq("is_active", true)

    if (configError) {
      return NextResponse.json(
        { error: "Erro ao buscar configs do Google Calendar" },
        { status: 500 }
      )
    }

    const results: any[] = []

    for (const config of configs || []) {
      let accessToken = config.access_token
      if (config.token_expires_at && new Date(config.token_expires_at) < new Date()) {
        if (!config.refresh_token) {
          results.push({ user_id: config.user_id, error: "Refresh token ausente" })
          continue
        }
        const refreshed = await refreshAccessToken(config.refresh_token)
        accessToken = refreshed.access_token
        const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        await supabase
          .from("google_calendar_configs")
          .update({
            access_token: accessToken,
            token_expires_at: expiresAt,
          })
          .eq("user_id", config.user_id)
      }

      const calendar = getGoogleCalendarClient(accessToken, config.refresh_token || undefined)

      const { data: appointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", config.user_id)
        .in("status", ["scheduled", "confirmed"])
        .not("google_calendar_event_id", "is", null)

      const { data: integration } = await supabase
        .from("integrations")
        .select("webhook_url, api_key, instance_name")
        .eq("user_id", config.user_id)
        .eq("platform", "whatsapp")
        .eq("is_active", true)
        .maybeSingle()

      let cancelledCount = 0

      for (const appointment of appointments || []) {
        const eventId = appointment.google_calendar_event_id
        if (!eventId) continue

        let eventStatus: string | null = null
        try {
          const response = await calendar.events.get({
            calendarId: config.calendar_id || "primary",
            eventId,
          })
          eventStatus = response.data.status || null
        } catch (error: any) {
          if (error?.code === 404) {
            eventStatus = "cancelled"
          } else {
            console.error("Erro ao consultar evento:", error)
          }
        }

        if (eventStatus === "cancelled") {
          await supabase
            .from("appointments")
            .update({ status: "cancelled" })
            .eq("id", appointment.id)

          cancelledCount += 1

          if (integration?.webhook_url && integration.api_key && integration.instance_name) {
            const formattedNumber = appointment.customer_phone.includes("@")
              ? appointment.customer_phone
              : `${appointment.customer_phone}@s.whatsapp.net`
            const appointmentDate = new Date(appointment.appointment_date)
            const formattedDate = appointmentDate.toLocaleDateString("pt-BR")
            const formattedTime = appointmentDate.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
            const serviceLabel = appointment.service_name
              ? ` de ${appointment.service_name}`
              : ""

            try {
              await sendEvolutionMessage({
                baseUrl: integration.webhook_url,
                apiKey: integration.api_key,
                instanceName: integration.instance_name,
                to: formattedNumber,
                text: `⚠️ O agendamento${serviceLabel} marcado para ${formattedDate} às ${formattedTime} foi cancelado pelo profissional. Posso ajudar a remarcar?`,
              })
            } catch (sendError) {
              console.error("Erro ao notificar cliente:", sendError)
            }
          }
        }
      }

      results.push({ user_id: config.user_id, cancelled: cancelledCount })
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("Erro ao sincronizar Google Calendar:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao sincronizar Google Calendar" },
      { status: 500 }
    )
  }
}
