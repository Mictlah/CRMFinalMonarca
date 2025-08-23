"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
import { logout, getCurrentUser, resetPassword } from "@/lib/auth"
import { agregarAuditLog } from "@/lib/audit"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [dateStr, setDateStr] = useState<string>("")
  const [profileOpen, setProfileOpen] = useState(false)
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [pwd1, setPwd1] = useState("")
  const [pwd2, setPwd2] = useState("")
  const [savingPwd, setSavingPwd] = useState(false)

  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  useEffect(() => {
    // Cargar usuario actual
    setCurrentUser(getCurrentUser())

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

  // Mostrar solo fecha completa en español (sin hora)
  useEffect(() => {
    const formatDate = (d: Date) => {
      const s = d.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      return s.replace(",", "") // quitar coma después del día de la semana
    }
    const update = () => setDateStr(formatDate(new Date()))
    update()
    // Actualizar después de medianoche para cambiar el día
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
    const t = setTimeout(update, midnight.getTime() - now.getTime())
    return () => clearTimeout(t)
  }, [])

  const openProfile = async () => {
    setProfileOpen(true)
    try {
      const u = getCurrentUser()
      if (!u) return
      const { data, error } = await supabase
        .from("app_users")
        .select("created_at")
        .eq("id", u.id)
        .single()
      if (!error && data?.created_at) {
        setUserCreatedAt(new Date(data.created_at).toLocaleString())
      } else {
        setUserCreatedAt(null)
      }
    } catch (e) {
      console.warn("No se pudo cargar fecha de registro:", e)
      setUserCreatedAt(null)
    }
  }

  const doResetPassword = async () => {
    const u = getCurrentUser()
    if (!u) { alert("Sesión expirada"); return }
    if (!pwd1 || !pwd2) { alert("Ingresa la nueva contraseña dos veces"); return }
    if (pwd1 !== pwd2) { alert("Las contraseñas no coinciden"); return }
    try {
      setSavingPwd(true)
  await resetPassword(u.id, pwd1)
  try { await agregarAuditLog("ACTUALIZAR", "Seguridad", `Reset de contraseña por ${u.username}`) } catch {}
      alert("Contraseña actualizada")
      setResetOpen(false)
      setPwd1("")
      setPwd2("")
    } catch (e: any) {
      alert("Error: " + (e.message || e))
    } finally {
      setSavingPwd(false)
    }
  }

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
              <DropdownMenuItem onClick={openProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span onClick={() => router.push("/configuracion")}>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* User quick info (to the right of the icon) */}
          <div className="hidden md:flex flex-col items-start ml-2">
            <span className="text-xs text-gray-700 font-medium">{currentUser?.nombre || currentUser?.username || "Usuario"}</span>
            <span className="text-[10px] text-gray-500 leading-tight">{dateStr}</span>
          </div>
          {/* Perfil popup */}
          <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Perfil</DialogTitle>
              </DialogHeader>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Usuario:</span><span className="font-medium">{currentUser?.username || "-"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Nombre:</span><span className="font-medium">{currentUser?.nombre || currentUser?.name || "-"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Registro:</span><span className="font-medium">{userCreatedAt || "-"}</span></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProfileOpen(false)}>Cerrar</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white border-green-700" onClick={() => setResetOpen(true)}>Resetear contraseña</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Reset password dialog */}
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resetear contraseña</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Input type="password" placeholder="Nueva contraseña" value={pwd1} onChange={(e)=>setPwd1(e.target.value)} />
                <Input type="password" placeholder="Confirmar nueva contraseña" value={pwd2} onChange={(e)=>setPwd2(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setResetOpen(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white border-green-700" disabled={savingPwd} onClick={doResetPassword}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
