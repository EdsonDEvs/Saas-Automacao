import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserProfileServer } from "@/lib/supabase/ensure-profile-server"
import { getServicesTable } from "@/lib/supabase/get-services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bot, Package, Code, CheckCircle2, XCircle, MessageCircle } from "lucide-react"
import { WhatsAppStatusCard } from "@/components/whatsapp-status-card"

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
    .eq("user_id", user.id)

  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("key, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  // Busca integração WhatsApp
  const { data: whatsappIntegration } = await supabase
    .from("integrations")
    .select("instance_name, is_active, phone_number")
    .eq("user_id", user.id)
    .eq("platform", "whatsapp")
    .maybeSingle()

  return (
    <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {profile?.business_name || "Usuário"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Status do WhatsApp
              </CardTitle>
              <CardDescription>Status da conexão do WhatsApp</CardDescription>
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
                    <XCircle className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold text-gray-400">Não Configurado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Status do Agente
              </CardTitle>
              <CardDescription>Status atual do seu agente IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {agentConfig?.is_active ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-500">Ativo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-red-500">Inativo</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {agentConfig?.agent_name || "Sem nome"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Serviços
              </CardTitle>
              <CardDescription>Total de serviços cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{services?.length || 0}</p>
              <Link href="/services">
                <Button variant="outline" className="mt-4 w-full">
                  Gerenciar Serviços
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Integração
              </CardTitle>
              <CardDescription>Configurações de API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {apiKey ? (
                  <div className="rounded-md bg-muted p-2 text-xs font-mono">
                    {apiKey.key.substring(0, 20)}...
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma chave ativa
                  </p>
                )}
                <Link href="/integration">
                  <Button variant="outline" className="mt-2 w-full">
                    Ver Configurações
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Link href="/setup">
                  <Button className="w-full">
                    <Code className="mr-2 h-4 w-4" />
                    Configurar WhatsApp/Telegram
                  </Button>
                </Link>
                <Link href="/agent">
                  <Button variant="outline" className="w-full">
                    <Bot className="mr-2 h-4 w-4" />
                    Configurar Agente
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" className="w-full">
                    <Package className="mr-2 h-4 w-4" />
                    Adicionar Serviço
                  </Button>
                </Link>
                <Link href="/integration">
                  <Button variant="outline" className="w-full">
                    <Code className="mr-2 h-4 w-4" />
                    Ver API Key
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
