import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { format, addDays, setHours, setMinutes, isBefore, isAfter, addMinutes } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date") // YYYY-MM-DD
    const duration = parseInt(searchParams.get("duration") || "60") // minutos

    if (!date) {
      return NextResponse.json(
        { error: "Parâmetro 'date' é obrigatório (formato: YYYY-MM-DD)" },
        { status: 400 }
      )
    }

    // Busca configurações de agendamento
    const { data: settings, error: settingsError } = await supabase
      .from("appointment_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (settingsError || !settings) {
      // Retorna configuração padrão se não encontrar
      const defaultSettings = {
        start_time: "09:00:00",
        end_time: "18:00:00",
        available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        buffer_minutes: 15,
        timezone: "America/Sao_Paulo",
      }
      return NextResponse.json({
        availableSlots: generateSlots(date, duration, defaultSettings, user.id, supabase),
      })
    }

    // Busca agendamentos existentes para o dia
    const startOfDay = new Date(date + "T00:00:00")
    const endOfDay = new Date(date + "T23:59:59")

    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("appointment_date, duration_minutes")
      .eq("user_id", user.id)
      .gte("appointment_date", startOfDay.toISOString())
      .lte("appointment_date", endOfDay.toISOString())
      .in("status", ["scheduled", "confirmed"])

    const availableSlots = generateSlots(date, duration, settings, user.id, supabase, existingAppointments || [])

    return NextResponse.json({ availableSlots })
  } catch (error: any) {
    console.error("Erro ao buscar horários disponíveis:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar horários disponíveis" },
      { status: 500 }
    )
  }
}

function generateSlots(
  date: string,
  duration: number,
  settings: any,
  userId: string,
  supabase: any,
  existingAppointments: any[] = []
): string[] {
  const slots: string[] = []
  const timezone = settings.timezone || "America/Sao_Paulo"
  
  // Verifica se o dia está nos dias disponíveis
  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  if (!settings.available_days.includes(dayOfWeek)) {
    return []
  }

  // Parse dos horários
  const [startHour, startMin] = settings.start_time.split(":").map(Number)
  const [endHour, endMin] = settings.end_time.split(":").map(Number)
  const bufferMinutes = settings.buffer_minutes || 15

  // Cria slots de 30 em 30 minutos
  let currentTime = setMinutes(setHours(new Date(date), startHour), startMin)
  const endTime = setMinutes(setHours(new Date(date), endHour), endMin)

  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, duration)
    
    // Verifica se o slot cabe no horário disponível
    if (slotEnd <= endTime) {
      // Verifica se não conflita com agendamentos existentes
      const hasConflict = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.appointment_date)
        const aptEnd = addMinutes(aptStart, apt.duration_minutes || 60)
        
        // Verifica sobreposição
        return (
          (currentTime >= aptStart && currentTime < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (currentTime <= aptStart && slotEnd >= aptEnd)
        )
      })

      if (!hasConflict) {
        slots.push(currentTime.toISOString())
      }
    }

    // Avança para o próximo slot (30 minutos + buffer)
    currentTime = addMinutes(currentTime, 30 + bufferMinutes)
  }

  return slots
}
