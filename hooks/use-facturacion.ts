"use client"

import { useState, useEffect, useCallback } from "react"
import {
  generarReporteExcel,
  actualizarEstadoFacturacion,
  guardarDatosFacturacion,
  archivarEmbarque,
  verificarLimiteCredito,
  generarAnalisisOperadores,
  exportarAnalisisExcel,
  imprimirReporteOperadores,
  cargarDatosCliente,
  exportarDatosCliente,
  type EmbarqueFacturacion,
} from "@/lib/facturacion-logic"

export const useFacturacion = () => {
  const [embarquesAsignados, setEmbarquesAsignados] = useState<EmbarqueFacturacion[]>([])
  const [registrosArchivados, setRegistrosArchivados] = useState<EmbarqueFacturacion[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [creditLimits, setCreditLimits] = useState<{ [key: string]: { usd: number; mxn: number } }>({})
  const [tiposServicio, setTiposServicio] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = () => {
      const embarquesGuardados = JSON.parse(localStorage.getItem("embarquesAsignados") || "[]")
      const archivosGuardados = JSON.parse(localStorage.getItem("registrosArchivados") || "[]")
      const clientesGuardados = JSON.parse(localStorage.getItem("clientes") || "[]")
      const creditosGuardados = JSON.parse(localStorage.getItem("creditLimits") || "{}")
      const tiposGuardados = JSON.parse(localStorage.getItem("tiposServicio") || "[]")

      setEmbarquesAsignados(embarquesGuardados)
      setRegistrosArchivados(archivosGuardados)
      setClientes(clientesGuardados)
      setCreditLimits(creditosGuardados)
      setTiposServicio(tiposGuardados)
    }

    cargarDatosIniciales()
  }, [])

  // Función para generar reporte Excel
  const handleGenerarReporteExcel = useCallback(
    (filtros: any) => {
      return generarReporteExcel(embarquesAsignados, filtros)
    },
    [embarquesAsignados],
  )

  // Función para actualizar estado de facturación
  const handleActualizarEstadoFacturacion = useCallback(
    async (embarqueId: string, nuevoEstado: string) => {
      return await actualizarEstadoFacturacion(embarqueId, nuevoEstado, embarquesAsignados, setEmbarquesAsignados)
    },
    [embarquesAsignados],
  )

  // Función para guardar datos de facturación
  const handleGuardarDatosFacturacion = useCallback(
    async (embarqueId: string, datosFacturacion: any) => {
      return await guardarDatosFacturacion(embarqueId, datosFacturacion, embarquesAsignados, setEmbarquesAsignados)
    },
    [embarquesAsignados],
  )

  // Función para archivar embarque
  const handleArchivarEmbarque = useCallback(
    async (embarque: EmbarqueFacturacion) => {
      return await archivarEmbarque(
        embarque,
        embarquesAsignados,
        setEmbarquesAsignados,
        registrosArchivados,
        setRegistrosArchivados,
      )
    },
    [embarquesAsignados, registrosArchivados],
  )

  // Función para verificar límite de crédito
  const handleVerificarLimiteCredito = useCallback(
    (clienteNombre: string, montoFacturado: number, monedaFlete: "MXN" | "USD" = "MXN") => {
      return verificarLimiteCredito(
        clienteNombre,
        montoFacturado,
        monedaFlete,
        embarquesAsignados,
        clientes,
        creditLimits,
      )
    },
    [embarquesAsignados, clientes, creditLimits],
  )

  // Función para generar análisis de operadores
  const handleGenerarAnalisisOperadores = useCallback(
    (filtros: any) => {
      return generarAnalisisOperadores(embarquesAsignados, tiposServicio, filtros)
    },
    [embarquesAsignados, tiposServicio],
  )

  // Función para exportar análisis a Excel
  const handleExportarAnalisisExcel = useCallback((analisisData: any, filtros: any) => {
    return exportarAnalisisExcel(analisisData, filtros)
  }, [])

  // Función para imprimir reporte de operadores
  const handleImprimirReporteOperadores = useCallback((analisisData: any, filtros: any) => {
    return imprimirReporteOperadores(analisisData, filtros)
  }, [])

  // Función para cargar datos de cliente
  const handleCargarDatosCliente = useCallback(
    async (clienteSeleccionado: string, fechaInicio: string, fechaFin: string) => {
      setLoading(true)
      try {
        const resultado = await cargarDatosCliente(
          clienteSeleccionado,
          fechaInicio,
          fechaFin,
          embarquesAsignados,
          clientes,
        )
        return resultado
      } finally {
        setLoading(false)
      }
    },
    [embarquesAsignados, clientes],
  )

  // Función para exportar datos de cliente
  const handleExportarDatosCliente = useCallback((embarquesCliente: any[], estadisticasCliente: any) => {
    return exportarDatosCliente(embarquesCliente, estadisticasCliente)
  }, [])

  // Función para guardar límite de crédito
  const handleGuardarLimiteCredito = useCallback(
    (clienteId: string, currency: "usd" | "mxn", limit: number) => {
      const currentLimits = creditLimits[clienteId] || { usd: 0, mxn: 0 }
      const newLimits = {
        ...creditLimits,
        [clienteId]: {
          ...currentLimits,
          [currency]: limit,
        },
      }
      setCreditLimits(newLimits)
      localStorage.setItem("creditLimits", JSON.stringify(newLimits))
    },
    [creditLimits],
  )

  return {
    // Estados
    embarquesAsignados,
    registrosArchivados,
    clientes,
    creditLimits,
    tiposServicio,
    loading,

    // Setters
    setEmbarquesAsignados,
    setRegistrosArchivados,
    setClientes,
    setCreditLimits,
    setTiposServicio,

    // Funciones
    generarReporteExcel: handleGenerarReporteExcel,
    actualizarEstadoFacturacion: handleActualizarEstadoFacturacion,
    guardarDatosFacturacion: handleGuardarDatosFacturacion,
    archivarEmbarque: handleArchivarEmbarque,
    verificarLimiteCredito: handleVerificarLimiteCredito,
    generarAnalisisOperadores: handleGenerarAnalisisOperadores,
    exportarAnalisisExcel: handleExportarAnalisisExcel,
    imprimirReporteOperadores: handleImprimirReporteOperadores,
    cargarDatosCliente: handleCargarDatosCliente,
    exportarDatosCliente: handleExportarDatosCliente,
    guardarLimiteCredito: handleGuardarLimiteCredito,
  }
}
