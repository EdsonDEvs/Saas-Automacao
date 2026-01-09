"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LogOut, LayoutDashboard, Bot, Package, Code } from "lucide-react"
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
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
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
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <Package className="mr-2 h-4 w-4" />
                Produtos
              </Button>
            </Link>
            <Link href="/integration">
              <Button variant="ghost" size="sm">
                <Code className="mr-2 h-4 w-4" />
                Integração
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
