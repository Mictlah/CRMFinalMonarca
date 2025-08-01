"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Menu, User, LogOut, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { obtenerNotificaciones } from "@/lib/supabase"
import { logout } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0)

  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const { total } = await obtenerNotificaciones()
        setNotificationCount(total)
      } catch (error) {
        console.error("Error cargando notificaciones:", error)
        setNotificationCount(0)
      }
    }

    cargarNotificaciones()

    // Actualizar cada 5 minutos
    const interval = setInterval(cargarNotificaciones, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 h-20 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu button and Logo */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Link href="/" passHref>
              <Image
                src="/images/logo-monarca-transparent.png"
                alt="Transportes Monarca"
                fill
                className="object-contain"
                priority
              />
              </Link>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Transportes Monarca</h1>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <span className="text-base">🇲🇽</span>
                <span className="text-base">🇺🇸</span>
                <span className="text-base">🇨🇦</span>
                <span className="ml-1">Cruzando Norteamérica</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Notifications and User menu */}
        <div className="flex items-center space-x-2">
          {/* Notifications Bell */}
          <Link href="/recordatorios">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
