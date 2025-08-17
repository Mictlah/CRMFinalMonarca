"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { login } from "@/lib/auth"

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-gray-700 font-medium">
          Usuario
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingresa tu usuario"
            required
            className="pl-10 h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-2 transition-all duration-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700 font-medium">
          Contraseña
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            required
            className="pl-10 pr-12 h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-2 transition-all duration-200"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input type="checkbox" className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
          <span className="ml-2 text-sm text-gray-600">Recordarme</span>
        </label>
        <a href="#" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
            Iniciando sesión...
          </>
        ) : (
          "Iniciar Sesión"
        )}
      </Button>

      <div className="text-center text-sm text-gray-600 mt-6">
        Al iniciar sesión, aceptas nuestros{" "}
        <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">
          Términos de Servicio
        </a>{" "}
        y{" "}
        <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">
          Política de Privacidad
        </a>
      </div>
    </form>
  )
}
