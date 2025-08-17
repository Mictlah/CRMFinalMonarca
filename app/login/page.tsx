"use client"

import { LoginForm } from "@/components/auth/login-form"
import { useState, useEffect } from "react"
import { getLoginImageByTime, getGreetingByTime } from "@/lib/login-images"

export default function LoginPage() {
  const [backgroundImage, setBackgroundImage] = useState("")
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const updateContent = () => {
      setBackgroundImage(getLoginImageByTime())
      setGreeting(getGreetingByTime())
    }

    // Actualizar inmediatamente
    updateContent()

    const interval = setInterval(updateContent, 300000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Left side - Welcome section with dynamic background image */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Dynamic background image */}
          <div className="absolute inset-0">
            <img
              src={backgroundImage || "/placeholder.svg?height=1080&width=1920&query=white trucks on highway"}
              alt="Tractocamiones en carretera"
              className="w-full h-full object-cover transition-opacity duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
          </div>

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Bienvenido de
              <br />
              <span className="text-amber-400">Vuelta</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-md">
              Gestiona tu flota de transporte con toda confianza, somos parte de tu equipo.
            </p>

            {/* Company info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇲🇽</span>
                  <span className="text-2xl">🇺🇸</span>
                  <span className="text-2xl">🇨🇦</span>
                </div>
                <span className="font-medium">Transportes Internacionales Monarca</span>
              </div>

              <div className="text-sm text-amber-300 font-medium">{greeting}, Usuario</div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            {/* Mobile header - only visible on small screens */}
            <div className="lg:hidden text-center mb-8">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20MONARCA-Qr7vd747xwSM8JxAy9kmgezl3mcHRh.png"
                alt="Transportes Internacionales Monarca"
                className="w-16 h-16 mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Transportes Internacionales Monarca</h1>
              <p className="text-gray-600">Sistema de Gestión de Transporte</p>
            </div>

            <div className="text-center mb-6">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20MONARCA-Qr7vd747xwSM8JxAy9kmgezl3mcHRh.png"
                alt="Transportes Internacionales Monarca"
                className="w-16 h-16 mx-auto mb-4"
              />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
              <p className="text-gray-600">Ingresa tus credenciales para acceder al sistema</p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>

      <footer className="bg-gray-50 border-t border-gray-200 py-4 px-8">
        <div className="text-center text-sm text-gray-500">
          Made by: <span className="font-medium text-gray-700">Kleos Digital 2025</span> for{" "}
          <span className="font-medium text-gray-700">Transportes Internacionales Monarca</span>{" "}
          <span className="text-gray-400">v1.0</span>
        </div>
      </footer>
    </div>
  )
}
