"use client"

export interface User {
  id: string
  username: string
  role: "admin" | "operator" | "client"
  name: string
  nombre: string // Agregamos este campo para compatibilidad
}

// Usuarios de prueba (en producción esto vendría de la base de datos)
const testUsers: User[] = [
  {
    id: "1",
    username: "admin",
    role: "admin",
    name: "Administrador",
    nombre: "Administrador",
  },
  {
    id: "2",
    username: "operador",
    role: "operator",
    name: "Operador",
    nombre: "Operador",
  },
  {
    id: "3",
    username: "cliente",
    role: "client",
    name: "Cliente",
    nombre: "Cliente",
  },
]

// Contraseñas de prueba (en producción esto estaría hasheado)
const testPasswords: Record<string, string> = {
  admin: "admin123",
  operador: "op123",
  cliente: "client123",
}

export async function login(username: string, password: string): Promise<User | null> {
  try {
    console.log("Función login llamada con:", { username, password })

    // Buscar usuario (case insensitive)
    const user = testUsers.find((u) => u.username.toLowerCase() === username.toLowerCase())
    console.log("Usuario encontrado:", user)

    if (!user) {
      console.log("Usuario no encontrado")
      return null
    }

    // Verificar contraseña
    const expectedPassword = testPasswords[user.username]
    console.log("Contraseña esperada:", expectedPassword, "Contraseña recibida:", password)

    if (expectedPassword !== password) {
      console.log("Contraseña incorrecta")
      return null
    }

    // Guardar en localStorage
    localStorage.setItem("user", JSON.stringify(user))
    console.log("Usuario guardado en localStorage:", user)

    return user
  } catch (error) {
    console.error("Error en login:", error)
    return null
  }
}

export function logout(): void {
  localStorage.removeItem("user")
  console.log("Usuario deslogueado")
}

export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null

    const user = JSON.parse(userStr)
    console.log("Usuario actual obtenido:", user)
    return user
  } catch (error) {
    console.error("Error obteniendo usuario:", error)
    return null
  }
}

export function isAuthenticated(): boolean {
  const authenticated = getCurrentUser() !== null
  console.log("Usuario autenticado:", authenticated)
  return authenticated
}

export function hasRole(requiredRole: User["role"]): boolean {
  const user = getCurrentUser()
  if (!user) return false

  // Admin tiene acceso a todo
  if (user.role === "admin") return true

  // Verificar rol específico
  return user.role === requiredRole
}

// Función para verificar contraseña del audit log
export function verifyAuditPassword(password: string): boolean {
  const correctPassword = "Adele.2013"
  console.log("Verificando contraseña audit log:", { password, correctPassword })
  return password === correctPassword
}
