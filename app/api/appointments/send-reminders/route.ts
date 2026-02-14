import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEvolutionMessage } from "@/lib/evolution/send-message"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * API Route para enviar lembretes de agendamentos
 * 
 * Esta rota deve ser chamada por um cron job (Vercel Cron, por exemplo)
 * para verificar e enviar lembretes automaticamente.
 * 
 * Exemplo de configuração no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/appointments/send-reminders",
 *     "schedule": "0 * * * *" // A cada hora
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verifica se é uma chamada autorizada (cron job ou com secret)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const now = new Date()
    
    console.log(`[Reminders] 🔔 Verificando lembretes às ${now.toISOString()}`)

    // Busca todas as configurações de lembretes ativas
    const { data: reminderSettings, error: settingsError } = await supabase
      .from("appointment_reminder_settings")
      .select("*")
      .eq("enabled", true)

    if (settingsError) {
      console.error("[Reminders] Erro ao buscar configurações:", settingsError)
      return NextResponse.json(
        { error: "Erro ao buscar configurações de lembretes" },
        { status: 500 }
      )
    }

    if (!reminderSettings || reminderSettings.length === 0) {
      console.log("[Reminders] Nenhuma configuração de lembrete ativa")
      return NextResponse.json({
        success: true,
        remindersSent: 0,
        message: "Nenhuma configuração de lembrete ativa"
      })
    }

    let totalRemindersSent = 0
    const errors: string[] = []

    // Processa cada configuração de lembrete
    for (const settings of reminderSettings) {
      try {
        // Calcula a data/hora do lembrete (X horas antes do agendamento)
        const reminderTime = new Date(now)
        reminderTime.setHours(reminderTime.getHours() + settings.reminder_hours_before)

        // Busca agendamentos que precisam de lembrete
        const { data: appointments, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .eq("user_id", settings.user_id)
          .eq("reminder_sent", false)
          .in("status", ["scheduled", "confirmed"])
          .gte("appointment_date", now.toISOString())
          .lte("appointment_date", reminderTime.toISOString())
          .not("customer_phone", "is", null)

        if (appointmentsError) {
          console.error(`[Reminders] Erro ao buscar agendamentos para user ${settings.user_id}:`, appointmentsError)
          errors.push(`Erro ao buscar agendamentos: ${appointmentsError.message}`)
          continue
        }

        if (!appointments || appointments.length === 0) {
          console.log(`[Reminders] Nenhum agendamento para lembrar para user ${settings.user_id}`)
          continue
        }

        // Busca integração WhatsApp do usuário
        const { data: integration, error: integrationError } = await supabase
          .from("integrations")
          .select("webhook_url, api_key, instance_name")
          .eq("user_id", settings.user_id)
          .eq("platform", "whatsapp")
          .eq("is_active", true)
          .single()

        if (integrationError || !integration) {
          console.warn(`[Reminders] Nenhuma integração WhatsApp ativa para user ${settings.user_id}`)
          continue
        }

        // Envia lembrete para cada agendamento
        for (const appointment of appointments) {
          try {
            // Formata mensagem de lembrete
            const appointmentDate = new Date(appointment.appointment_date)
            const formattedDate = format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            const formattedTime = format(appointmentDate, "HH:mm", { locale: ptBR })

            let message = settings.reminder_message_template
            .replace("{customer_name}", appointment.customer_name)
            .replace("{appointment_date}", formattedDate)
            .replace("{appointment_time}", formattedTime)
            .replace("{service_name}", appointment.service_name || "serviço")

            // Formata número do telefone
            let phoneNumber = appointment.customer_phone
            if (!phoneNumber.includes("@")) {
              phoneNumber = `${phoneNumber}@s.whatsapp.net`
            }

            // Envia mensagem via Evolution API
            await sendEvolutionMessage({
              baseUrl: integration.webhook_url,
              apiKey: integration.api_key,
              instanceName: integration.instance_name,
              to: phoneNumber,
              text: message,
            })

            // Marca lembrete como enviado
            const { error: updateError } = await supabase
              .from("appointments")
              .update({
                reminder_sent: true,
                reminder_sent_at: now.toISOString(),
              })
              .eq("id", appointment.id)

            if (updateError) {
              console.error(`[Reminders] Erro ao atualizar status do lembrete:`, updateError)
            } else {
              totalRemindersSent++
              console.log(`[Reminders] ✅ Lembrete enviado para ${appointment.customer_name} (${appointment.customer_phone})`)
            }
          } catch (error: any) {
            const errorMsg = `Erro ao enviar lembrete para agendamento ${appointment.id}: ${error.message}`
            console.error(`[Reminders] ${errorMsg}`)
            errors.push(errorMsg)
          }
        }
      } catch (error: any) {
        const errorMsg = `Erro ao processar lembretes para user ${settings.user_id}: ${error.message}`
        console.error(`[Reminders] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: totalRemindersSent,
      errors: errors.length > 0 ? errors : undefined,
      message: `${totalRemindersSent} lembrete(s) enviado(s) com sucesso`
    })
  } catch (error: any) {
    console.error("[Reminders] Erro ao processar lembretes:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar lembretes" },
      { status: 500 }
    )
  }
}
