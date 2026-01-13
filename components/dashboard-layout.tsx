"use client"

import { Sidebar } from "./sidebar"
import { usePathname } from "next/navigation"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Não aplicar layout em páginas de autenticação
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 w-full">
        <div className="p-4 lg:p-6 lg:pl-8 pt-20 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
