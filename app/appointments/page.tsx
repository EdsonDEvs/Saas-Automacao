"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, User, Phone, Mail, Settings, CheckCircle2, XCircle, Bell } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction"
import ptBrLocale from "@fullcalendar/core/locales/pt-br"

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadAppointments()
    checkGoogleCalendar()
    const stylesheetUrls = [
      "https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.20/index.css",
      "https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.20/index.css",
      "https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.20/index.css",
      "https://cdn.jsdelivr.net/npm/@fullcalendar/list@6.1.20/index.css",
    ]

    stylesheetUrls.forEach((url) => {
      if (document.querySelector(`link[href="${url}"]`)) return
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = url
      document.head.appendChild(link)
    })
  }, [])

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("appointment_date", { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error: any) {
      console.error("Erro ao carregar agendamentos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkGoogleCalendar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("google_calendar_configs")
        .select("is_active")
        .eq("user_id", user.id)
        .single()

      setGoogleCalendarConnected(data?.is_active || false)
    } catch (error) {
      setGoogleCalendarConnected(false)
    }
  }

  const syncGoogleCalendar = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/google-calendar/sync", {
        method: "POST",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao sincronizar Google Calendar")
      }
      await loadAppointments()
      toast({
        title: "Sincronizado",
        description: "Sincronização concluída com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao sincronizar Google Calendar",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
      scheduled: { label: "Agendado", variant: "default" },
      confirmed: { label: "Confirmado", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "destructive" },
      completed: { label: "Concluído", variant: "secondary" },
    }

    const statusInfo = statusMap[status] || { label: status, variant: "default" as const }

    return (
      <span className={`px-2 py-1 rounded text-xs ${
        statusInfo.variant === "destructive" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
        statusInfo.variant === "secondary" ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90" :
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      }`}>
        {statusInfo.label}
      </span>
    )
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus agendamentos e integração com Google Calendar
          </p>
        </div>
        <div className="flex gap-2">
            <Link href="/appointments/reminders">
              <Button variant="outline">
                <Bell className="mr-2 h-4 w-4" />
                Lembretes
              </Button>
            </Link>
            <Link href="/appointments/settings">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
            </Link>
        </div>
      </div>

      {/* Status do Google Calendar */}
      <Card className="mb-6">
          <CardHeader>
            <CardTitle>Integração Google Calendar</CardTitle>
            <CardDescription>
              Status da conexão com o Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {googleCalendarConnected ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-500">Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-red-500">Não Conectado</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {googleCalendarConnected && (
                  <Button variant="outline" onClick={syncGoogleCalendar} disabled={syncing}>
                    {syncing ? "Sincronizando..." : "Sincronizar agora"}
                  </Button>
                )}
                <Link href="/appointments/settings">
                  <Button variant={googleCalendarConnected ? "outline" : "default"}>
                    {googleCalendarConnected ? "Reconfigurar" : "Conectar Google Calendar"}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
      </Card>

      {/* Calendário */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>Visualização dos agendamentos no calendário</CardDescription>
        </CardHeader>
        <CardContent>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={calendarEvents}
            height="auto"
            locale={ptBrLocale}
          />
        </CardContent>
      </Card>

      {/* Lista de Agendamentos */}
      <Card>
          <CardHeader>
            <CardTitle>Agendamentos</CardTitle>
            <CardDescription>
              {appointments.length} agendamento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum agendamento encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {format(new Date(appointment.appointment_date), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{appointment.customer_name}</span>
                          </div>
                          {appointment.customer_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{appointment.customer_phone}</span>
                            </div>
                          )}
                          {appointment.customer_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{appointment.customer_email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Duração: {appointment.duration_minutes} minutos</span>
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  )
}
