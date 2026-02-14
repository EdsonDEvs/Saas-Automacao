import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserProfileServer } from "@/lib/supabase/ensure-profile-server"
import { getServicesTable } from "@/lib/supabase/get-services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bot, Package, CheckCircle2, XCircle, MessageCircle, Calendar, Clock, Users, TrendingUp } from "lucide-react"
import { WhatsAppStatusCard } from "@/components/whatsapp-status-card"
import { DashboardCalendar } from "@/components/dashboard-calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Garante que o perfil existe
  try {
    await ensureUserProfileServer()
  } catch (error) {
    console.error("Erro ao garantir perfil:", error)
  }

  // Fetch profile and agent config
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: agentConfig } = await supabase
    .from("agent_configs")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Tenta usar 'services', se não existir usa 'products' como fallback
  const tableName = await getServicesTable(supabase)
  const { data: services } = await supabase
    .from(tableName)
    .select("id")
    .eq("user_id", user.id);

  // Busca integração WhatsApp
  const { data: whatsappIntegration } = await supabase
    .from("integrations")
    .select("instance_name, is_active, phone_number")
    .eq("user_id", user.id)
    .eq("platform", "whatsapp")
    .maybeSingle()

  // Busca agendamentos
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Agendamentos de hoje
  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .gte("appointment_date", startOfToday.toISOString())
    .lte("appointment_date", endOfToday.toISOString())
    .order("appointment_date", { ascending: true })

  // Agendamentos desta semana
  const { data: weekAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .gte("appointment_date", startOfWeek.toISOString())
    .lte("appointment_date", endOfWeek.toISOString())

  // Agendamentos deste mês
  const { data: monthAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .gte("appointment_date", startOfMonth.toISOString())
    .lte("appointment_date", endOfMonth.toISOString())

  // Próximos agendamentos (próximos 7 dias)
  const nextWeek = new Date(now)
  nextWeek.setDate(now.getDate() + 7)
  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .gte("appointment_date", now.toISOString())
    .lte("appointment_date", nextWeek.toISOString())
    .in("status", ["scheduled", "confirmed"])
    .order("appointment_date", { ascending: true })
    .limit(5)

  // Estatísticas
  const totalAppointments = monthAppointments?.length || 0
  const confirmedAppointments = (monthAppointments?.filter((a: any) => a.status === "confirmed" || a.status === "scheduled") || []).length
  const cancelledAppointments = (monthAppointments?.filter((a: any) => a.status === "cancelled") || []).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com background colorido - DESTACADO */}
      <div className="mb-8 animate-slide-down p-8 rounded-2xl bg-gradient-to-r from-primary/20 via-info/15 to-success/20 dark:from-primary/10 dark:via-info/10 dark:to-success/10 border-l-4 border-primary dark:border-primary/70 shadow-xl ring-2 ring-primary/20 dark:ring-primary/30">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary via-info to-success dark:from-primary dark:via-info dark:to-success bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-lg text-foreground/90 dark:text-white/90 mt-2 font-semibold">
          Bem-vindo, <span className="font-extrabold text-primary dark:text-primary text-xl">{profile?.business_name || "Usuário"}</span>
        </p>
      </div>

      {/* Cards de Status */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary dark:border-l-primary shadow-xl ring-2 ring-primary/20 dark:ring-primary/30 bg-gradient-to-br from-card to-primary/10 dark:to-primary/5 animate-slide-up hover:scale-[1.02] transition-transform">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              Status do WhatsApp
            </CardTitle>
            <CardDescription className="text-base font-medium">Status da conexão do WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            {whatsappIntegration ? (
              <WhatsAppStatusCard 
                instanceName={whatsappIntegration.instance_name || ""}
                phoneNumber={whatsappIntegration.phone_number || ""}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-gray-400 dark:text-white/70" />
                  <span className="font-semibold text-gray-400 dark:text-white/90">Não Configurado</span>
                </div>
                <p className="text-sm text-muted-foreground dark:text-white/80">
                  Configure o WhatsApp em Configurações
                </p>
                <Link href="/setup">
                  <Button variant="outline" className="mt-2 w-full" size="sm">
                    Configurar WhatsApp
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success dark:border-l-success shadow-xl ring-2 ring-success/20 dark:ring-success/30 bg-gradient-to-br from-card to-success/10 dark:to-success/5 hover-lift animate-slide-up hover:scale-[1.02] transition-transform" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-success/10 dark:bg-success/20">
                <Bot className="h-5 w-5 text-success" />
              </div>
              Agente IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agentConfig?.is_active ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/50 shadow-sm dark:shadow-green-500/20 w-fit">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 animate-scale-in" />
                  <span className="text-base font-bold text-green-700 dark:text-green-300">Ativo</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/50 shadow-sm dark:shadow-red-500/20 w-fit">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-base font-bold text-red-700 dark:text-red-300">Inativo</span>
                </div>
              )}
              <p className="text-sm font-semibold text-foreground/70 dark:text-white/80">
                {agentConfig?.agent_name || "Sem nome"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info dark:border-l-info shadow-xl ring-2 ring-info/20 dark:ring-info/30 bg-gradient-to-br from-card to-info/10 dark:to-info/5 hover-lift animate-slide-up hover:scale-[1.02] transition-transform" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-info/10 dark:bg-info/20">
                <Package className="h-5 w-5 text-info" />
              </div>
              Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold bg-gradient-to-br from-info to-info/70 bg-clip-text text-transparent mb-2">
              {services?.length || 0}
            </div>
            <p className="text-sm font-semibold text-foreground/75 dark:text-white/90">
              Total cadastrado
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning dark:border-l-warning shadow-xl ring-2 ring-warning/20 dark:ring-warning/30 bg-gradient-to-br from-card to-warning/10 dark:to-warning/5 hover-lift animate-slide-up hover:scale-[1.02] transition-transform" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-warning/10 dark:bg-warning/20">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold bg-gradient-to-br from-warning to-warning/70 bg-clip-text text-transparent mb-2">
              {totalAppointments}
            </div>
            <p className="text-sm font-semibold text-foreground/75 dark:text-white/90">
              {confirmedAppointments} confirmados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Estatísticas com background - DESTACADA */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-info/15 via-primary/10 to-warning/15 dark:from-info/10 dark:via-primary/5 dark:to-warning/10 border-2 border-info/40 dark:border-info/30 shadow-xl ring-2 ring-info/20 dark:ring-info/20 mb-6">
        <h2 className="text-2xl font-extrabold mb-6 text-info dark:text-info flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/20 dark:bg-info/30">
            <Calendar className="h-6 w-6" />
          </div>
          Estatísticas de Agendamentos
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary dark:border-l-primary shadow-lg ring-1 ring-primary/20 dark:ring-primary/20 bg-gradient-to-br from-card to-primary/10 dark:to-primary/5 hover-lift animate-slide-up hover:scale-[1.01] transition-transform" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-primary mb-2">{todayAppointments?.length || 0}</div>
            <p className="text-sm font-semibold text-foreground/80 dark:text-white/80 mt-1">
              Agendamentos para hoje
            </p>
            {todayAppointments && todayAppointments.length > 0 && (
              <div className="mt-4 space-y-2">
                {todayAppointments.slice(0, 3).map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{apt.customer_name}</span>
                    <span className="text-muted-foreground dark:text-foreground/90">
                      {format(new Date(apt.appointment_date), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info dark:border-l-info shadow-lg ring-1 ring-info/20 dark:ring-info/20 bg-gradient-to-br from-card to-info/10 dark:to-info/5 hover-lift animate-slide-up hover:scale-[1.01] transition-transform" style={{ animationDelay: "0.5s" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-info/10 dark:bg-info/20">
                <Clock className="h-5 w-5 text-info" />
              </div>
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-info mb-2">{weekAppointments?.length || 0}</div>
            <p className="text-sm font-semibold text-foreground/80 dark:text-white/80 mt-1">
              Agendamentos esta semana
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-foreground/90">Confirmados:</span>
                <span className="font-bold text-green-600 dark:text-green-400 px-2 py-0.5 rounded bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/50">{weekAppointments?.filter((a: any) => a.status === "confirmed" || a.status === "scheduled").length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-foreground/90">Cancelados:</span>
                <span className="font-bold text-red-600 dark:text-red-400 px-2 py-0.5 rounded bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/50">{weekAppointments?.filter((a: any) => a.status === "cancelled").length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success dark:border-l-success shadow-lg ring-1 ring-success/20 dark:ring-success/20 bg-gradient-to-br from-card to-success/10 dark:to-success/5 hover-lift animate-slide-up hover:scale-[1.01] transition-transform" style={{ animationDelay: "0.6s" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-success/10 dark:bg-success/20">
                <Users className="h-5 w-5 text-success" />
              </div>
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-success mb-2">{monthAppointments?.length || 0}</div>
            <p className="text-sm font-semibold text-foreground/80 dark:text-white/80 mt-1">
              Total de agendamentos
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-foreground/90">Taxa de confirmação:</span>
                <span className="font-bold text-green-600 dark:text-green-400 px-2 py-0.5 rounded bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/50">
                  {totalAppointments > 0 
                    ? Math.round((confirmedAppointments / totalAppointments) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-foreground/90">Cancelamentos:</span>
                <span className="font-bold text-red-600 dark:text-red-400 px-2 py-0.5 rounded bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/50">{cancelledAppointments}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Calendário e Próximos Agendamentos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendário - DESTACADO */}
        <Card className="border-l-4 border-l-primary dark:border-l-primary shadow-xl ring-2 ring-primary/20 dark:ring-primary/30 bg-gradient-to-br from-card to-primary/10 dark:to-primary/5 animate-slide-up hover:scale-[1.01] transition-transform" style={{ animationDelay: "0.7s" }}>
          <CardHeader className="bg-gradient-to-r from-primary/20 to-transparent dark:from-primary/10 border-b-2 border-primary/40 dark:border-primary/30 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 rounded-lg bg-primary/15 dark:bg-primary/25">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              Calendário
            </CardTitle>
            <CardDescription className="text-base font-medium mt-2">Visualização dos agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCalendar userId={user.id} />
          </CardContent>
        </Card>

        {/* Próximos Agendamentos - DESTACADO */}
        <Card className="border-l-4 border-l-info dark:border-l-info shadow-xl ring-2 ring-info/20 dark:ring-info/30 bg-gradient-to-br from-card to-info/10 dark:to-info/5 animate-slide-up hover:scale-[1.01] transition-transform" style={{ animationDelay: "0.8s" }}>
          <CardHeader className="bg-gradient-to-r from-info/20 to-transparent dark:from-info/10 border-b-2 border-info/40 dark:border-info/30 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 rounded-lg bg-info/15 dark:bg-info/25">
                <Clock className="h-6 w-6 text-info" />
              </div>
              Próximos Agendamentos
            </CardTitle>
            <CardDescription className="text-base font-medium mt-2">Próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((apt: any) => {
                  const appointmentDate = new Date(apt.appointment_date)
                  const statusColors: Record<string, string> = {
                    scheduled: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/50 border border-green-500/30 dark:shadow-green-500/20 font-semibold shadow-sm",
                    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50 border border-blue-500/30 dark:shadow-blue-500/20 font-semibold shadow-sm",
                    cancelled: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50 border border-red-500/30 dark:shadow-red-500/20 font-semibold shadow-sm",
                    completed: "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-white/90 dark:border-gray-500/50 border border-gray-500/30 font-semibold shadow-sm",
                  }
                  
                  return (
                    <div key={apt.id} className="flex items-start justify-between p-3 rounded-lg border-2 border-info/30 dark:border-border bg-gradient-to-r from-info/8 to-transparent dark:from-transparent hover:from-info/15 dark:hover:from-accent hover:shadow-sm transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{apt.customer_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${statusColors[apt.status] || "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-white/90 dark:border-gray-500/50 border border-gray-500/30 font-semibold shadow-sm"}`}>
                            {apt.status === "scheduled" ? "Agendado" : 
                             apt.status === "confirmed" ? "Confirmado" :
                             apt.status === "cancelled" ? "Cancelado" :
                             apt.status === "completed" ? "Concluído" : apt.status}
                          </span>
                        </div>
                        {apt.service_name && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {apt.service_name}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(appointmentDate, "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(appointmentDate, "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <Link href="/appointments">
                  <Button variant="outline" className="w-full mt-4">
                    Ver Todos os Agendamentos
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhum agendamento nos próximos 7 dias
                </p>
                <Link href="/appointments">
                  <Button variant="outline" className="mt-4">
                    Ver Agendamentos
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas Simplificadas */}
      <Card className="animate-slide-up" style={{ animationDelay: "0.9s" }}>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/appointments">
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Agendamentos
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" className="w-full">
                <Package className="mr-2 h-4 w-4" />
                Gerenciar Serviços
              </Button>
            </Link>
            <Link href="/agent">
              <Button variant="outline" className="w-full">
                <Bot className="mr-2 h-4 w-4" />
                Configurar Agente
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
