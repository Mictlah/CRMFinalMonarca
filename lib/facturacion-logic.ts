import { supabase } from "./supabase"
import * as XLSX from "xlsx"

// Tipos para la lógica de facturación
export interface EmbarqueFacturacion {
  id: string
  folio: string
  clienteNombre: string
  numeroLoad: string
  operadorAsignado: { id: string; nombre: string }
  camionAsignado: { id: string; marca: string; modelo: string; numeroEconomico: string }
  fechaAsignacion: string
  montoFacturado?: number
  precioFlete?: number
  estado_facturacion?: "pendiente_facturacion" | "facturado" | "pagado" | "archivado"
  pagado?: boolean
  fechaPago?: string
  moneda_flete?: "MXN" | "USD"
  observacionesFacturacion?: string
  foliosFactura?: {
    folio1?: string
    folio2?: string
    folio3?: string
    folio4?: string
  }
  fechaEnvioCliente?: string
  fechaPagoCliente?: string
  referenciaPago?: string
}

// Función para generar reporte Excel
export const generarReporteExcel = (embarques: EmbarqueFacturacion[], filtros: any) => {
  try {
    // Preparar datos para el reporte
    const datosReporte = embarques.map((embarque) => ({
      Folio: embarque.folio,
      Cliente: embarque.clienteNombre,
      Load: embarque.numeroLoad,
      Operador: embarque.operadorAsignado.nombre,
      Camión: `${embarque.camionAsignado.marca} ${embarque.camionAsignado.modelo} (${embarque.camionAsignado.numeroEconomico})`,
      "Fecha Asignación": new Date(embarque.fechaAsignacion).toLocaleDateString("es-MX"),
      "Monto Flete": embarque.precioFlete || embarque.montoFacturado || 0,
      Moneda: embarque.moneda_flete || "MXN",
      "Estado Facturación": embarque.estado_facturacion || "pendiente_facturacion",
      Pagado: embarque.pagado ? "Sí" : "No",
      "Fecha Pago": embarque.fechaPago ? new Date(embarque.fechaPago).toLocaleDateString("es-MX") : "",
      Observaciones: embarque.observacionesFacturacion || "",
    }))

    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datosReporte)
    const wb = XLSX.utils.book_new()

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Embarques Facturación")

    // Generar nombre de archivo
    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `Reporte_Facturacion_${fechaActual}.xlsx`

    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo)

    return { success: true, mensaje: "Reporte Excel generado exitosamente" }
  } catch (error) {
    console.error("Error generando reporte Excel:", error)
    return { success: false, mensaje: "Error al generar el reporte Excel" }
  }
}

// Función para actualizar estado de facturación
export const actualizarEstadoFacturacion = async (
  embarqueId: string,
  nuevoEstado: string,
  embarquesAsignados: EmbarqueFacturacion[],
  setEmbarquesAsignados: (embarques: EmbarqueFacturacion[]) => void,
) => {
  try {
    console.log(`Actualizando estado de embarque ${embarqueId} a ${nuevoEstado}`)

    // Actualizar estado local inmediatamente
    const embarquesActualizados = embarquesAsignados.map((embarque) =>
      embarque.id === embarqueId ? { ...embarque, estado_facturacion: nuevoEstado as any } : embarque,
    )

    setEmbarquesAsignados(embarquesActualizados)
    localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))

    // Intentar actualizar en base de datos
    const { error } = await supabase
      .from("embarques")
      .update({
        estado_facturacion: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", embarqueId)

    if (error) {
      console.error("Error actualizando en BD:", error)
      // Mantener cambio local aunque falle la BD
    }

    return { success: true }
  } catch (error) {
    console.error("Error en actualizarEstadoFacturacion:", error)
    return { success: false, error }
  }
}

// Función para guardar datos de facturación
export const guardarDatosFacturacion = async (
  embarqueId: string,
  datosFacturacion: any,
  embarquesAsignados: EmbarqueFacturacion[],
  setEmbarquesAsignados: (embarques: EmbarqueFacturacion[]) => void,
) => {
  try {
    // Actualizar estado local
    const embarquesActualizados = embarquesAsignados.map((embarque) =>
      embarque.id === embarqueId
        ? {
            ...embarque,
            foliosFactura: {
              folio1: datosFacturacion.numeroFactura1,
              folio2: datosFacturacion.numeroFactura2,
              folio3: datosFacturacion.numeroFactura3,
            },
            fechaEnvioCliente: datosFacturacion.fechaEnvioCliente,
            fechaPagoCliente: datosFacturacion.fechaPagoCliente,
            referenciaPago: datosFacturacion.referenciaPago,
            observacionesFacturacion: datosFacturacion.observacionesFacturacion,
          }
        : embarque,
    )

    setEmbarquesAsignados(embarquesActualizados)
    localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))

    // Intentar actualizar en base de datos
    const { error } = await supabase
      .from("embarques")
      .update({
        folio_factura_1: datosFacturacion.numeroFactura1 || null,
        folio_factura_2: datosFacturacion.numeroFactura2 || null,
        folio_factura_3: datosFacturacion.numeroFactura3 || null,
        fecha_envio_cliente: datosFacturacion.fechaEnvioCliente || null,
        fecha_pago_cliente: datosFacturacion.fechaPagoCliente || null,
        referencia_pago: datosFacturacion.referenciaPago || null,
        observaciones_facturacion: datosFacturacion.observacionesFacturacion || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", embarqueId)

    if (error) {
      console.error("Error actualizando datos de facturación:", error)
    }

    return { success: true, mensaje: "Datos de facturación guardados exitosamente" }
  } catch (error) {
    console.error("Error en guardarDatosFacturacion:", error)
    return { success: false, mensaje: "Error al guardar los datos de facturación" }
  }
}

// Función para archivar embarque
export const archivarEmbarque = async (
  embarque: EmbarqueFacturacion,
  embarquesAsignados: EmbarqueFacturacion[],
  setEmbarquesAsignados: (embarques: EmbarqueFacturacion[]) => void,
  registrosArchivados: EmbarqueFacturacion[],
  setRegistrosArchivados: (registros: EmbarqueFacturacion[]) => void,
) => {
  try {
    console.log(`Archivando embarque ${embarque.id}`)

    // Crear registro archivado
    const embarqueArchivado = {
      ...embarque,
      estado_facturacion: "archivado" as const,
      fechaArchivado: new Date().toISOString(),
      usuarioArchivo: "Usuario Actual",
      motivoArchivo: "Archivado manualmente desde facturación",
      observacionesArchivo: "Registro archivado para consulta histórica",
    }

    // Actualizar estados locales
    const embarquesActualizados = embarquesAsignados.filter((e) => e.id !== embarque.id)
    const archivosActualizados = [embarqueArchivado, ...registrosArchivados]

    setEmbarquesAsignados(embarquesActualizados)
    setRegistrosArchivados(archivosActualizados)

    // Guardar en localStorage
    localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))
    localStorage.setItem("registrosArchivados", JSON.stringify(archivosActualizados))

    // Intentar actualizar en base de datos
    const { error } = await supabase
      .from("embarques")
      .update({
        estado_facturacion: "archivado",
        fecha_archivado: new Date().toISOString(),
        usuario_archivo: "Usuario Actual",
        motivo_archivo: "Archivado manualmente desde facturación",
        observaciones_archivo: "Registro archivado para consulta histórica",
        updated_at: new Date().toISOString(),
      })
      .eq("id", embarque.id)

    if (error) {
      console.error("Error archivando embarque en BD:", error)
    }

    return { success: true, mensaje: "Embarque archivado exitosamente" }
  } catch (error) {
    console.error("Error en archivarEmbarque:", error)
    return { success: false, mensaje: "Error al archivar embarque" }
  }
}

// Función para verificar límite de crédito
export const verificarLimiteCredito = (
  clienteNombre: string,
  montoFacturado: number,
  monedaFlete: "MXN" | "USD" = "MXN",
  embarques: EmbarqueFacturacion[],
  clientes: any[],
  creditLimits: { [key: string]: { usd: number; mxn: number } },
) => {
  if (!clienteNombre || !clientes || clientes.length === 0) {
    return { exceeded: false, message: "" }
  }

  const cliente = clientes.find((c) => c?.nombre === clienteNombre)
  if (!cliente) return { exceeded: false, message: "" }

  const clienteLimits = creditLimits?.[cliente.id] || { usd: 0, mxn: 0 }

  // Separar embarques por moneda
  const clienteEmbarquesUSD = embarques.filter(
    (e) => e?.clienteNombre === clienteNombre && !e?.pagado && e?.moneda_flete === "USD",
  )
  const clienteEmbarquesMXN = embarques.filter(
    (e) => e?.clienteNombre === clienteNombre && !e?.pagado && (e?.moneda_flete === "MXN" || !e?.moneda_flete),
  )

  const totalPendienteUSD = clienteEmbarquesUSD.reduce((sum, e) => sum + (e?.montoFacturado || 0), 0)
  const totalPendienteMXN = clienteEmbarquesMXN.reduce((sum, e) => sum + (e?.montoFacturado || 0), 0)

  const isExceededUSD = totalPendienteUSD > clienteLimits.usd && clienteLimits.usd > 0
  const isExceededMXN = totalPendienteMXN > clienteLimits.mxn && clienteLimits.mxn > 0

  if (isExceededUSD && isExceededMXN) {
    return { exceeded: true, message: "Crédito Excedido USD y MXN" }
  } else if (isExceededUSD) {
    return { exceeded: true, message: "Crédito Excedido USD" }
  } else if (isExceededMXN) {
    return { exceeded: true, message: "Crédito Excedido MXN" }
  }

  return { exceeded: false, message: "" }
}

// Función para generar análisis de operadores
export const generarAnalisisOperadores = (
  embarquesAsignados: EmbarqueFacturacion[],
  tiposServicio: any[],
  filtros: {
    operador?: string
    fechaInicio?: string
    fechaFin?: string
  },
) => {
  try {
    console.log("Generando análisis de operadores...")

    // Construir filtros de fecha
    const fechaInicio = filtros.fechaInicio ? new Date(filtros.fechaInicio) : new Date("2024-01-01")
    const fechaFin = filtros.fechaFin ? new Date(filtros.fechaFin) : new Date()

    // Filtrar embarques por período
    const embarquesFiltrados = embarquesAsignados.filter((embarque) => {
      const fechaEmbarque = new Date(embarque.fechaAsignacion)
      const coincideFecha = fechaEmbarque >= fechaInicio && fechaEmbarque <= fechaFin
      const coincideOperador = filtros.operador === "todos" || embarque.operadorAsignado?.nombre === filtros.operador
      return coincideFecha && coincideOperador && embarque.estado_facturacion !== "archivado"
    })

    // Procesar embarques y calcular pagos
    const embarquesConPagos = embarquesFiltrados.map((embarque) => {
      // Buscar tipo de servicio para calcular pago
      const tipoServicio = tiposServicio.find((t) => t.id === (embarque as any).tipo_servicio_id)
      const pagoOperador = tipoServicio?.pago_operador || tipoServicio?.precio_base || embarque.precioFlete || 0

      return {
        ...embarque,
        pagoOperador,
        tipoServicioNombre: tipoServicio?.nombre || "Sin especificar",
      }
    })

    // Agrupar por operador
    const operadoresMap = new Map()

    embarquesConPagos.forEach((embarque) => {
      const operadorNombre = embarque.operadorAsignado?.nombre || "Sin asignar"

      if (!operadoresMap.has(operadorNombre)) {
        operadoresMap.set(operadorNombre, {
          nombre: operadorNombre,
          embarques: [],
          totalEmbarques: 0,
          embarquesContingencia: 0,
          totalPagar: 0,
          promedioPorEmbarque: 0,
        })
      }

      const operadorData = operadoresMap.get(operadorNombre)
      operadorData.embarques.push(embarque)
      operadorData.totalEmbarques++
      operadorData.totalPagar += embarque.pagoOperador

      if ((embarque as any).modificadoPorEmergencia) {
        operadorData.embarquesContingencia++
      }
    })

    // Calcular promedios
    const analisisPorOperador = Array.from(operadoresMap.values()).map((operador) => ({
      ...operador,
      promedioPorEmbarque: operador.totalEmbarques > 0 ? Math.round(operador.totalPagar / operador.totalEmbarques) : 0,
    }))

    // Calcular resumen general
    const resumenGeneral = {
      totalOperadores: analisisPorOperador.length,
      totalEmbarques: embarquesConPagos.length,
      totalPagarMXN: analisisPorOperador.reduce((sum, op) => sum + op.totalPagar, 0),
      casosContingencia: embarquesConPagos.filter((e) => (e as any).modificadoPorEmergencia).length,
    }

    return {
      success: true,
      data: {
        analisisPorOperador,
        embarquesFiltradosAnalisis: embarquesConPagos,
        resumenGeneral,
      },
    }
  } catch (error) {
    console.error("Error generando análisis:", error)
    return { success: false, error }
  }
}

// Función para exportar análisis a Excel
export const exportarAnalisisExcel = (analisisData: any, filtros: any) => {
  try {
    const datosExportacion = {
      fecha_exportacion: new Date().toISOString(),
      periodo: `${filtros.fechaInicio || "Inicio"} - ${filtros.fechaFin || "Fin"}`,
      operador_filtro: filtros.operador,
      resumen_general: analisisData.resumenGeneral,
      analisis_por_operador: analisisData.analisisPorOperador,
      embarques_detallados: analisisData.embarquesFiltradosAnalisis?.map((embarque: any) => ({
        folio: embarque.folio,
        cliente: embarque.clienteNombre,
        operador: embarque.operadorAsignado?.nombre,
        fecha: embarque.fechaAsignacion,
        tipo_servicio: embarque.tipoServicioNombre,
        pago_operador: embarque.pagoOperador,
        contingencia: embarque.modificadoPorEmergencia ? "Sí" : "No",
        motivo_modificacion: embarque.motivoModificacion || "",
      })),
    }

    // Crear hojas de Excel
    const wsResumen = XLSX.utils.json_to_sheet([analisisData.resumenGeneral])
    const wsOperadores = XLSX.utils.json_to_sheet(analisisData.analisisPorOperador)
    const wsEmbarques = XLSX.utils.json_to_sheet(datosExportacion.embarques_detallados)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General")
    XLSX.utils.book_append_sheet(wb, wsOperadores, "Análisis Operadores")
    XLSX.utils.book_append_sheet(wb, wsEmbarques, "Embarques Detallados")

    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `Analisis_Operadores_${fechaActual}.xlsx`

    XLSX.writeFile(wb, nombreArchivo)

    return { success: true, mensaje: "Análisis exportado a Excel exitosamente" }
  } catch (error) {
    console.error("Error exportando a Excel:", error)
    return { success: false, mensaje: "Error al exportar el análisis" }
  }
}

// Función para imprimir reporte de operadores
export const imprimirReporteOperadores = (analisisData: any, filtros: any) => {
  try {
    const contenidoImpresion = `
      REPORTE DE ANÁLISIS DE OPERADORES
      ===================================
      
      Período: ${filtros.fechaInicio || "Inicio"} - ${filtros.fechaFin || "Fin"}
      Operador: ${filtros.operador === "todos" ? "Todos los operadores" : filtros.operador}
      Fecha de generación: ${new Date().toLocaleDateString("es-MX")}
      
      RESUMEN GENERAL:
      - Total de operadores: ${analisisData.resumenGeneral?.totalOperadores || 0}
      - Total de embarques: ${analisisData.resumenGeneral?.totalEmbarques || 0}
      - Total a pagar: $${analisisData.resumenGeneral?.totalPagarMXN?.toLocaleString() || 0} MXN
      - Casos de contingencia: ${analisisData.resumenGeneral?.casosContingencia || 0}
      
      DETALLE POR OPERADOR:
      ${
        analisisData.analisisPorOperador
          ?.map(
            (operador: any) => `
      ${operador.nombre}:
      - Embarques: ${operador.totalEmbarques}
      - Casos contingencia: ${operador.embarquesContingencia}
      - Total a pagar: $${operador.totalPagar.toLocaleString()}
      - Promedio por embarque: $${operador.promedioPorEmbarque.toLocaleString()}
      `,
          )
          .join("\n") || "No hay datos disponibles"
      }
    `

    // Crear ventana de impresión
    const ventanaImpresion = window.open("", "_blank")
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Reporte de Operadores</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              pre { white-space: pre-wrap; font-size: 12px; }
            </style>
          </head>
          <body>
            <pre>${contenidoImpresion}</pre>
          </body>
        </html>
      `)
      ventanaImpresion.document.close()
      ventanaImpresion.print()
    }

    return { success: true, mensaje: "Reporte enviado a impresión" }
  } catch (error) {
    console.error("Error imprimiendo reporte:", error)
    return { success: false, mensaje: "Error al imprimir el reporte" }
  }
}

// Función para cargar datos de cliente
export const cargarDatosCliente = async (
  clienteSeleccionado: string,
  fechaInicio: string,
  fechaFin: string,
  embarquesAsignados: EmbarqueFacturacion[],
  clientes: any[],
) => {
  try {
    console.log("Cargando datos de cliente...")

    // Construir filtros de fecha
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : new Date("2024-01-01")
    const fechaFinDate = fechaFin ? new Date(fechaFin) : new Date()

    // Filtrar embarques localmente primero
    const embarquesFiltrados = embarquesAsignados.filter((embarque) => {
      const fechaEmbarque = new Date(embarque.fechaAsignacion)
      const coincideFecha = fechaEmbarque >= fechaInicioDate && fechaEmbarque <= fechaFinDate
      const coincideCliente = clienteSeleccionado === "todos" || embarque.clienteNombre === clienteSeleccionado
      return coincideFecha && coincideCliente
    })

    // Procesar estadísticas
    const pendientes = embarquesFiltrados.filter(
      (e) => e.estado_facturacion === "pendiente_facturacion" || (!e.estado_facturacion && !e.pagado),
    )
    const facturados = embarquesFiltrados.filter((e) => e.estado_facturacion === "facturado")
    const pagados = embarquesFiltrados.filter((e) => e.estado_facturacion === "pagado" || e.pagado)

    // Separar por moneda
    const pendientesMXN = pendientes
      .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
      .reduce((sum, e) => sum + (e.precioFlete || 0), 0)
    const pendientesUSD = pendientes
      .filter((e) => e.moneda_flete === "USD")
      .reduce((sum, e) => sum + (e.precioFlete || 0), 0)
    const facturadosMXN = facturados
      .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
      .reduce((sum, e) => sum + (e.precioFlete || 0), 0)
    const facturadosUSD = facturados
      .filter((e) => e.moneda_flete === "USD")
      .reduce((sum, e) => sum + (e.precioFlete || 0), 0)
    const pagadosMXN = pagados
      .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
      .reduce((sum, e) => sum + (e.precioFlete || 0), 0)
    const pagadosUSD = pagados.filter((e) => e.moneda_flete === "USD").reduce((sum, e) => sum + (e.precioFlete || 0), 0)

    // Estadísticas por cliente si se seleccionó "todos"
    let estadisticasPorCliente = {}
    if (clienteSeleccionado === "todos") {
      const clientesUnicos = Array.from(new Set(embarquesFiltrados.map((e) => e.clienteNombre)))
      estadisticasPorCliente = clientesUnicos.reduce((acc: any, clienteNombre) => {
        const embarquesCliente = embarquesFiltrados.filter((e) => e.clienteNombre === clienteNombre)
        const pendientesCliente = embarquesCliente.filter(
          (e) => e.estado_facturacion === "pendiente_facturacion" || (!e.estado_facturacion && !e.pagado),
        )
        const facturadosCliente = embarquesCliente.filter((e) => e.estado_facturacion === "facturado")
        const pagadosCliente = embarquesCliente.filter((e) => e.estado_facturacion === "pagado" || e.pagado)

        acc[clienteNombre] = {
          total: embarquesCliente.length,
          pendientes: pendientesCliente.length,
          facturados: facturadosCliente.length,
          pagados: pagadosCliente.length,
          montoPendienteMXN: pendientesCliente
            .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
            .reduce((sum, e) => sum + (e.precioFlete || 0), 0),
          montoPendienteUSD: pendientesCliente
            .filter((e) => e.moneda_flete === "USD")
            .reduce((sum, e) => sum + (e.precioFlete || 0), 0),
        }
        return acc
      }, {})
    }

    const estadisticas = {
      totalEmbarques: embarquesFiltrados.length,
      pendientes: pendientes.length,
      facturados: facturados.length,
      pagados: pagados.length,
      pendientesMXN,
      pendientesUSD,
      facturadosMXN,
      facturadosUSD,
      pagadosMXN,
      pagadosUSD,
      estadisticasPorCliente,
      clienteSeleccionado,
    }

    return {
      success: true,
      data: {
        embarquesCliente: embarquesFiltrados,
        estadisticasCliente: estadisticas,
      },
    }
  } catch (error) {
    console.error("Error en cargarDatosCliente:", error)
    return { success: false, error }
  }
}

// Función para exportar datos de cliente
export const exportarDatosCliente = (embarquesCliente: any[], estadisticasCliente: any) => {
  try {
    const datosExportacion = {
      fecha_exportacion: new Date().toISOString(),
      cliente: estadisticasCliente.clienteSeleccionado,
      estadisticas: estadisticasCliente,
      embarques: embarquesCliente.map((embarque) => ({
        folio: embarque.folio,
        cliente: embarque.clienteNombre,
        operador: embarque.operadorAsignado.nombre,
        fecha: embarque.fechaAsignacion,
        monto: embarque.precioFlete,
        moneda: embarque.moneda_flete,
        estado_facturacion: embarque.estado_facturacion,
        pagado: embarque.pagado,
        fecha_pago: embarque.fechaPago,
        observaciones: embarque.observacionesFacturacion,
      })),
    }

    // Crear hojas de Excel
    const wsEstadisticas = XLSX.utils.json_to_sheet([estadisticasCliente])
    const wsEmbarques = XLSX.utils.json_to_sheet(datosExportacion.embarques)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, "Estadísticas")
    XLSX.utils.book_append_sheet(wb, wsEmbarques, "Embarques")

    const fechaActual = new Date().toISOString().split("T")[0]
    const nombreArchivo = `Datos_Cliente_${fechaActual}.xlsx`

    XLSX.writeFile(wb, nombreArchivo)

    return { success: true, mensaje: "Datos de cliente exportados exitosamente" }
  } catch (error) {
    console.error("Error exportando datos de cliente:", error)
    return { success: false, mensaje: "Error al exportar los datos" }
  }
}
