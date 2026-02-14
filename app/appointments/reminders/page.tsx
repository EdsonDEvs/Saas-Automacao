"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Bell, Clock, MessageSquare } from "lucide-react"

export default function AppointmentRemindersPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    enabled: true,
    reminder_hours_before: 24,
    reminder_message_template: "Olá {customer_name}! Este é um lembrete do seu agendamento para {appointment_date} às {appointment_time}. Esperamos você!",
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from("appointment_reminder_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = não encontrado (ok, vamos criar)
        console.error("Erro ao carregar configurações:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar configurações",
          variant: "destructive",
        })
        return
      }

      if (data) {
        setSettings({
          enabled: data.enabled,
          reminder_hours_before: data.reminder_hours_before,
          reminder_message_template: data.reminder_message_template,
        })
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("appointment_reminder_settings")
        .upsert({
          user_id: user.id,
          enabled: settings.enabled,
          reminder_hours_before: settings.reminder_hours_before,
          reminder_message_template: settings.reminder_message_template,
        }, {
          onConflict: "user_id"
        })

      if (error) {
        console.error("Erro ao salvar configurações:", error)
        toast({
          title: "Erro",
          description: "Erro ao salvar configurações",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      })
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lembretes de Agendamentos</h1>
        <p className="text-muted-foreground mt-2">
          Configure lembretes automáticos para seus clientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Lembretes
          </CardTitle>
          <CardDescription>
            Configure quando e como enviar lembretes de agendamentos via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar/Desativar */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Ativar Lembretes</Label>
              <p className="text-sm text-muted-foreground">
                Enviar lembretes automaticamente para clientes com agendamentos
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          {/* Horas antes do agendamento */}
          <div className="space-y-2">
            <Label htmlFor="reminder_hours_before" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horas Antes do Agendamento
            </Label>
            <Input
              id="reminder_hours_before"
              type="number"
              min="1"
              max="168"
              value={settings.reminder_hours_before}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reminder_hours_before: parseInt(e.target.value) || 24,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Quantas horas antes do agendamento enviar o lembrete (1-168 horas)
            </p>
          </div>

          {/* Template da mensagem */}
          <div className="space-y-2">
            <Label htmlFor="reminder_message_template" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Template da Mensagem
            </Label>
            <Textarea
              id="reminder_message_template"
              rows={4}
              value={settings.reminder_message_template}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reminder_message_template: e.target.value,
                })
              }
              placeholder="Olá {customer_name}! Este é um lembrete do seu agendamento para {appointment_date} às {appointment_time}. Esperamos você!"
            />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Variáveis disponíveis:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><code className="bg-muted px-1 rounded">{"{customer_name}"}</code> - Nome do cliente</li>
                <li><code className="bg-muted px-1 rounded">{"{appointment_date}"}</code> - Data do agendamento</li>
                <li><code className="bg-muted px-1 rounded">{"{appointment_time}"}</code> - Horário do agendamento</li>
                <li><code className="bg-muted px-1 rounded">{"{service_name}"}</code> - Nome do serviço</li>
              </ul>
            </div>
          </div>

          {/* Botão salvar */}
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

      {/* Informações sobre o cron job */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Processo Automático</h3>
            <p className="text-sm text-muted-foreground">
              O sistema verifica automaticamente agendamentos que precisam de lembrete e envia mensagens via WhatsApp.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Configuração do Cron Job</h3>
            <p className="text-sm text-muted-foreground">
              Para ativar os lembretes automáticos, você precisa configurar um cron job no Vercel.
            </p>
            <div className="bg-muted p-4 rounded-lg mt-2">
              <p className="text-sm font-mono">
                Adicione no arquivo <code>vercel.json</code>:
              </p>
              <pre className="text-xs mt-2 overflow-x-auto">
{`{
  "crons": [{
    "path": "/api/appointments/send-reminders",
    "schedule": "0 * * * *"
  }]
}`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Isso executará a verificação a cada hora. Ajuste o schedule conforme necessário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
