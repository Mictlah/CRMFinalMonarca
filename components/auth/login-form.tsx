"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import { login } from "@/lib/auth"
import Image from "next/image"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Verificar que los campos no estén vacíos
    if (!username.trim() || !password.trim()) {
      setError("Por favor ingrese usuario y contraseña")
      setLoading(false)
      return
    }

    try {
      console.log("Intentando login con:", { username, password }) // Para debug
      const user = await login(username, password)

      if (user) {
        console.log("Login exitoso:", user) // Para debug
        router.push("/")
      } else {
        setError("Usuario o contraseña incorrectos")
        console.log("Login fallido para usuario:", username) // Para debug
      }
    } catch (error) {
      console.error("Error en login:", error)
      setError("Error al iniciar sesión. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center shadow-lg">
                <Image
                  src="/images/logo-monarca-transparent.png"
                  alt="Logo Transportes Monarca"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Transportes Monarca
            </CardTitle>
            <CardDescription className="text-gray-600">Sistema de Gestión de Transporte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  required
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    required
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-800 mb-2">Credenciales de prueba:</h4>
              <div className="text-sm text-amber-700 space-y-1">
                <div>
                  <strong>Admin:</strong> admin / admin123
                </div>
                <div>
                  <strong>Operador:</strong> operador / op123
                </div>
                <div>
                  <strong>Cliente:</strong> cliente / client123
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-300">
                <div className="text-xs text-amber-600">
                  <strong>Contraseña para limpiar Audit Log:</strong> Adele.2013
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
