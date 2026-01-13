import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getGoogleCalendarClient, refreshAccessToken } from "@/lib/google-calendar/client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      summary, 
      description, 
      startDateTime, 
      endDateTime, 
      customerEmail,
      customerName,
      customerPhone,
      timezone = 'America/Sao_Paulo'
    } = body

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "Campos obrigatórios: summary, startDateTime, endDateTime" },
        { status: 400 }
      )
    }

    // Busca configuração do Google Calendar
    const { data: calendarConfig, error: configError } = await supabase
      .from("google_calendar_configs")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (configError || !calendarConfig) {
      return NextResponse.json(
        { error: "Google Calendar não configurado. Configure primeiro em /appointments/settings" },
        { status: 404 }
      )
    }

    // Verifica se o token expirou e renova se necessário
    let accessToken = calendarConfig.access_token
    if (calendarConfig.token_expires_at && new Date(calendarConfig.token_expires_at) < new Date()) {
      if (!calendarConfig.refresh_token) {
        return NextResponse.json(
          { error: "Token expirado e refresh token não disponível. Reconecte o Google Calendar." },
          { status: 401 }
        )
      }

      try {
        const refreshed = await refreshAccessToken(calendarConfig.refresh_token)
        accessToken = refreshed.access_token

        // Atualiza o token no banco
        const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        await supabase
          .from("google_calendar_configs")
          .update({
            access_token: accessToken,
            token_expires_at: expiresAt,
          })
          .eq("user_id", user.id)
      } catch (refreshError) {
        console.error("Erro ao renovar token:", refreshError)
        return NextResponse.json(
          { error: "Erro ao renovar token de acesso. Reconecte o Google Calendar." },
          { status: 401 }
        )
      }
    }

    // Cria o evento no Google Calendar
    const calendar = getGoogleCalendarClient(accessToken, calendarConfig.refresh_token || undefined)
    
    const event = {
      summary,
      description: description || `Agendamento com ${customerName || 'Cliente'}`,
      start: {
        dateTime: startDateTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: timezone,
      },
      attendees: customerEmail ? [{ email: customerEmail }] : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 30 }, // 30 minutos antes
        ],
      },
    }

    const response = await calendar.events.insert({
      calendarId: calendarConfig.calendar_id || 'primary',
      requestBody: event,
    })

    const eventId = response.data.id

    // Salva o agendamento no banco
    const adminSupabase = createAdminClient()
    const { data: appointment, error: appointmentError } = await adminSupabase
      .from("appointments")
      .insert({
        user_id: user.id,
        customer_name: customerName || 'Cliente',
        customer_phone: customerPhone || '',
        customer_email: customerEmail,
        appointment_date: startDateTime,
        duration_minutes: Math.floor((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / 60000),
        status: 'scheduled',
        google_calendar_event_id: eventId,
      })
      .select()
      .single()

    if (appointmentError) {
      console.error("Erro ao salvar agendamento:", appointmentError)
      // Tenta deletar o evento do Google Calendar se criou mas não salvou no banco
      if (eventId) {
        try {
          await calendar.events.delete({
            calendarId: calendarConfig.calendar_id || 'primary',
            eventId: eventId,
          })
        } catch (deleteError) {
          console.error("Erro ao deletar evento do Google Calendar:", deleteError)
        }
      }
      return NextResponse.json(
        { error: "Erro ao salvar agendamento no banco de dados" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment,
      googleEventId: eventId,
      googleEventLink: response.data.htmlLink,
    })
  } catch (error: any) {
    console.error("Erro ao criar evento no Google Calendar:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao criar evento no Google Calendar" },
      { status: 500 }
    )
  }
}
