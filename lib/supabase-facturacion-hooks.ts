"use client"

import { useState, useEffect } from "react"
import {
  obtenerEmbarquesFacturacion,
  obtenerEstadisticasCliente,
  generarAnalisisOperadores,
  obtenerRegistrosArchivados,
  verificarLimiteCredito,
} from "./facturacion-supabase"

// Hook para manejar embarques de facturación
export const useEmbarquesFacturacion = (filtros?: any) => {
  const [embarques, setEmbarques] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const cargarEmbarques = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await obtenerEmbarquesFacturacion(filtros)

      if (error) {
        setError(error)
      } else {
        setEmbarques(data)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEmbarques()
  }, [JSON.stringify(filtros)])

  return {
    embarques,
    loading,
    error,
    recargar: cargarEmbarques,
  }
}

// Hook para estadísticas de cliente
export const useEstadisticasCliente = () => {
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const cargarEstadisticas = async (clienteId?: string, fechaInicio?: string, fechaFin?: string) => {
    setLoading(true)
    setError(null)

    try {
      const { success, data, error } = await obtenerEstadisticasCliente(clienteId, fechaInicio, fechaFin)

      if (!success) {
        setError(error)
      } else {
        setEstadisticas(data)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return {
    estadisticas,
    loading,
    error,
    cargarEstadisticas,
  }
}

// Hook para análisis de operadores
export const useAnalisisOperadores = () => {
  const [analisis, setAnalisis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const generarAnalisis = async (filtros?: any) => {
    setLoading(true)
    setError(null)

    try {
      const { success, data, error } = await generarAnalisisOperadores(filtros)

      if (!success) {
        setError(error)
      } else {
        setAnalisis(data)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return {
    analisis,
    loading,
    error,
    generarAnalisis,
  }
}

// Hook para registros archivados
export const useRegistrosArchivados = () => {
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const cargarRegistros = async (filtros?: any) => {
    setLoading(true)
    setError(null)

    try {
      const { success, data, error } = await obtenerRegistrosArchivados(filtros)

      if (!success) {
        setError(error)
      } else {
        setRegistros(data)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return {
    registros,
    loading,
    error,
    cargarRegistros,
  }
}

// Hook para verificación de crédito
export const useVerificacionCredito = () => {
  const [verificacion, setVerificacion] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const verificarCredito = async (clienteId: string) => {
    setLoading(true)
    setError(null)

    try {
      const resultado = await verificarLimiteCredito(clienteId)

      if (!resultado.success) {
        setError(resultado.error)
      } else {
        setVerificacion(resultado)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return {
    verificacion,
    loading,
    error,
    verificarCredito,
  }
}
