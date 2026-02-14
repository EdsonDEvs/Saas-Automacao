"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LogOut, LayoutDashboard, Bot, Package, Code, AlertCircle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Navbar() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    })
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="border-b-2 border-primary/30 dark:border-border bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 bg-gradient-to-r from-primary/10 via-transparent to-info/10 dark:from-transparent dark:to-transparent">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-xl font-bold">
            SaaS Automação
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/agent">
              <Button variant="ghost" size="sm">
                <Bot className="mr-2 h-4 w-4" />
                Agente
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="ghost" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Serviços
              </Button>
            </Link>
            <Link href="/setup">
              <Button variant="ghost" size="sm">
                <Code className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </Link>
            <Link href="/integration">
              <Button variant="ghost" size="sm">
                <Code className="mr-2 h-4 w-4" />
                Integração
              </Button>
            </Link>
            <Link href="/appointments">
              <Button variant="ghost" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Agendamentos
              </Button>
            </Link>
            <Link href="/debug">
              <Button variant="ghost" size="sm">
                <AlertCircle className="mr-2 h-4 w-4" />
                Debug
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </nav>
  )
}
