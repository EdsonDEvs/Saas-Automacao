"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"

interface DashboardCalendarProps {
  userId: string
}

export function DashboardCalendar({ userId }: DashboardCalendarProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carrega CSS do FullCalendar
    const stylesheetUrls = [
      "https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.20/index.css",
      "https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.20/index.css",
    ]

    stylesheetUrls.forEach((url) => {
      if (document.querySelector(`link[href="${url}"]`)) return
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = url
      document.head.appendChild(link)
    })

    loadAppointments()
  }, [userId])

  const loadAppointments = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", userId)
        .order("appointment_date", { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
    } finally {
      setLoading(false)
    }
  }

  const calendarEvents = appointments.map((appointment) => {
    const start = new Date(appointment.appointment_date)
    const end = new Date(start)
    const duration =
      appointment.service_duration_minutes || appointment.duration_minutes || 60
    end.setMinutes(end.getMinutes() + duration)

    const title = appointment.service_name
      ? `${appointment.service_name} - ${appointment.customer_name}`
      : appointment.customer_name

    const statusColors: Record<string, string> = {
      scheduled: "#16a34a",
      confirmed: "#16a34a",
      pending: "#f59e0b",
      cancelled: "#ef4444",
      completed: "#6b7280",
    }

    return {
      id: appointment.id,
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      color: statusColors[appointment.status] || "#2563eb",
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Carregando calendário...</div>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next",
          center: "title",
          right: "",
        }}
        events={calendarEvents}
        height="auto"
        locale={ptBrLocale}
        eventDisplay="block"
        dayMaxEvents={3}
        moreLinkClick="popover"
      />
    </div>
  )
}
