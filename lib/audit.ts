import { getCurrentUser } from "./auth"

export interface AuditLogEntry {
  id: string
  timestamp: string
  usuario: string
  accion: "CREAR" | "ACTUALIZAR" | "ELIMINAR" | "EXPORTAR" | "LOGIN" | "LOGOUT"
  modulo: string
  detalles: string
  ip?: string
}

// Función optimizada para agregar entradas al audit log
export const agregarAuditLog = (accion: AuditLogEntry["accion"], modulo: string, detalles: string) => {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser) return // No registrar si no hay usuario

    const nuevaEntrada: AuditLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      usuario: currentUser.nombre,
      accion,
      modulo,
      detalles,
      ip: "192.168.1.1", // En producción obtener IP real
    }

    // Obtener logs existentes
    const logsExistentes = JSON.parse(localStorage.getItem("auditLogs") || "[]")

    // Mantener solo las últimas 500 entradas para optimizar memoria
    const logsActualizados = [nuevaEntrada, ...logsExistentes].slice(0, 500)

    // Guardar de forma asíncrona para no bloquear la UI
    setTimeout(() => {
      localStorage.setItem("auditLogs", JSON.stringify(logsActualizados))
    }, 0)
  } catch (error) {
    console.error("Error al registrar audit log:", error)
  }
}

// Función para obtener logs con paginación
export const obtenerAuditLogs = (pagina = 1, limite = 50) => {
  try {
    const logs = JSON.parse(localStorage.getItem("auditLogs") || "[]")
    const inicio = (pagina - 1) * limite
    const fin = inicio + limite

    return {
      logs: logs.slice(inicio, fin),
      total: logs.length,
      pagina,
      totalPaginas: Math.ceil(logs.length / limite),
    }
  } catch (error) {
    console.error("Error al obtener audit logs:", error)
    return { logs: [], total: 0, pagina: 1, totalPaginas: 0 }
  }
}

// Función para limpiar logs antiguos (ejecutar periódicamente)
export const limpiarLogsAntiguos = (diasRetencion = 30) => {
  try {
    const logs = JSON.parse(localStorage.getItem("auditLogs") || "[]")
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - diasRetencion)

    const logsActuales = logs.filter((log: AuditLogEntry) => new Date(log.timestamp) > fechaLimite)

    localStorage.setItem("auditLogs", JSON.stringify(logsActuales))
    return logs.length - logsActuales.length // Retorna cantidad eliminada
  } catch (error) {
    console.error("Error al limpiar logs antiguos:", error)
    return 0
  }
}
