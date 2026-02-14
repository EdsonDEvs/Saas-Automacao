"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  LogOut,
  LayoutDashboard,
  Bot,
  Calendar,
  Code,
  AlertCircle,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Agente",
    href: "/agent",
    icon: Bot,
  },
  {
    name: "Serviços",
    href: "/services",
    icon: Calendar,
  },
  {
    name: "Agendamentos",
    href: "/appointments",
    icon: Calendar,
  },
  {
    name: "Integração",
    href: "/integration",
    icon: Code,
  },
  {
    name: "Configurar",
    href: "/setup",
    icon: Settings,
  },
  {
    name: "Debug",
    href: "/debug",
    icon: AlertCircle,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Carrega o estado do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  // Salva o estado no localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    })
    router.push("/login")
    router.refresh()
  }

  // Não mostrar sidebar em páginas de autenticação
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-background"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-background border-r-2 border-primary/40 dark:border-primary/10 shadow-lg transition-all duration-300 ease-in-out lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-background via-primary/8 to-background dark:via-transparent">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b-2 border-primary/20 dark:border-border bg-gradient-to-r from-primary/10 to-transparent dark:from-transparent px-4">
            <Link 
              href="/dashboard" 
              className={cn(
                "flex items-center space-x-2 overflow-hidden transition-all",
                isCollapsed && "w-0 opacity-0"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold whitespace-nowrap">SaaS Automação</span>
            </Link>
            {/* Logo apenas ícone quando colapsado */}
            {isCollapsed && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
            )}
            {/* Botão de colapsar (desktop) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex h-8 w-8"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto bg-gradient-to-b from-transparent via-primary/3 to-transparent dark:via-transparent">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all relative group border-l-2",
                    isActive
                      ? "bg-gradient-to-r from-primary/15 to-primary/8 text-primary border-l-primary shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/8 hover:to-transparent hover:text-primary border-l-transparent hover:border-l-primary/50 dark:hover:border-l-primary/30",
                    isCollapsed ? "justify-center" : "space-x-3"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={cn(
                      "whitespace-nowrap transition-all duration-300",
                      isCollapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                    )}
                  >
                    {item.name}
                  </span>
                  {/* Tooltip quando colapsado */}
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t p-4 space-y-2">
            <div className={cn(
              "flex items-center px-3",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              {!isCollapsed && (
                <span className="text-sm text-muted-foreground">Tema</span>
              )}
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              className={cn(
                "w-full text-muted-foreground hover:text-foreground",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              onClick={handleLogout}
              title={isCollapsed ? "Sair" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div 
        className={cn(
          "hidden lg:block flex-shrink-0 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )} 
      />
    </>
  )
}
