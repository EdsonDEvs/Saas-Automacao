"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

function AppointmentSettingsContent() {
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [settings, setSettings] = useState({
    default_duration_minutes: 60,
    start_time: "09:00",
    end_time: "18:00",
    buffer_minutes: 15,
    timezone: "America/Sao_Paulo",
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkGoogleCalendar()
    loadSettings()
    
    // Verifica se veio do callback do Google
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    
    if (success === "connected") {
      toast({
        title: "✅ Conectado!",
        description: "Google Calendar conectado com sucesso",
      })
      checkGoogleCalendar()
    } else if (error) {
      toast({
        title: "❌ Erro",
        description: `Erro ao conectar: ${error}`,
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

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
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("appointment_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (data) {
        setSettings({
          default_duration_minutes: data.default_duration_minutes || 60,
          start_time: data.start_time?.substring(0, 5) || "09:00",
          end_time: data.end_time?.substring(0, 5) || "18:00",
          buffer_minutes: data.buffer_minutes || 15,
          timezone: data.timezone || "America/Sao_Paulo",
          available_days: data.available_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
        })
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    }
  }

  const connectGoogleCalendar = async () => {
    setConnecting(true)
    try {
      const response = await fetch("/api/google-calendar/auth")
      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error("Não foi possível obter URL de autenticação")
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao conectar Google Calendar",
        variant: "destructive",
      })
      setConnecting(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("appointment_settings")
        .upsert({
          user_id: user.id,
          default_duration_minutes: settings.default_duration_minutes,
          start_time: `${settings.start_time}:00`,
          end_time: `${settings.end_time}:00`,
          buffer_minutes: settings.buffer_minutes,
          timezone: settings.timezone,
          available_days: settings.available_days,
          is_active: true,
        }, {
          onConflict: "user_id"
        })

      if (error) throw error

      toast({
        title: "✅ Salvo!",
        description: "Configurações salvas com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const daysOfWeek = [
    { value: "monday", label: "Segunda" },
    { value: "tuesday", label: "Terça" },
    { value: "wednesday", label: "Quarta" },
    { value: "thursday", label: "Quinta" },
    { value: "friday", label: "Sexta" },
    { value: "saturday", label: "Sábado" },
    { value: "sunday", label: "Domingo" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
        <h1 className="text-3xl font-bold mb-6">Configurações de Agendamento</h1>

        {/* Google Calendar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>
              Conecte sua conta do Google Calendar para sincronizar agendamentos
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
              <Button
                onClick={connectGoogleCalendar}
                disabled={connecting}
                variant={googleCalendarConnected ? "outline" : "default"}
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    {googleCalendarConnected ? "Reconectar" : "Conectar Google Calendar"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Horários */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Horários</CardTitle>
            <CardDescription>
              Configure os horários disponíveis para agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Horário de Início</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={settings.start_time}
                  onChange={(e) => setSettings({ ...settings, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">Horário de Fim</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={settings.end_time}
                  onChange={(e) => setSettings({ ...settings, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duração Padrão (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={settings.default_duration_minutes}
                  onChange={(e) => setSettings({ ...settings, default_duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div>
                <Label htmlFor="buffer">Tempo entre Agendamentos (minutos)</Label>
                <Input
                  id="buffer"
                  type="number"
                  value={settings.buffer_minutes}
                  onChange={(e) => setSettings({ ...settings, buffer_minutes: parseInt(e.target.value) || 15 })}
                />
              </div>
            </div>

            <div>
              <Label>Dias Disponíveis</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={settings.available_days.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newDays = settings.available_days.includes(day.value)
                        ? settings.available_days.filter((d) => d !== day.value)
                        : [...settings.available_days, day.value]
                      setSettings({ ...settings, available_days: newDays })
                    }}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={saveSettings} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AppointmentSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    }>
      <AppointmentSettingsContent />
    </Suspense>
  )
}
