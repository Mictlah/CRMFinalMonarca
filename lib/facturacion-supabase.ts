import { supabase } from "./supabase"

// Tipos específicos para facturación
export interface EstadoFacturacion {
  pendiente_facturacion: "Pendiente Facturación"
  facturado: "Facturado"
  pagado: "Pagado"
  archivado: "Archivado"
}

export interface DatosFacturacion {
  embarque_id: string
  folio_factura_1?: string
  folio_factura_2?: string
  folio_factura_3?: string
  folio_factura_4?: string
  cantidad_final_facturada?: number
  observaciones_facturacion?: string
  fecha_envio_cliente?: string
  fecha_pago_cliente?: string
  referencia_pago?: string
  estado_facturacion: keyof EstadoFacturacion
}

export interface AnalisisOperador {
  nombre: string
  totalEmbarques: number
  embarquesContingencia: number
  totalPagar: number
  promedioPorEmbarque: number
  embarques: any[]
}

export interface EstadisticasCliente {
  totalEmbarques: number
  pendientes: number
  facturados: number
  pagados: number
  pendientesMXN: number
  pendientesUSD: number
  facturadosMXN: number
  facturadosUSD: number
  pagadosMXN: number
  pagadosUSD: number
  estadisticasPorCliente?: { [key: string]: any }
  clienteSeleccionado: string
}

// Función para obtener embarques con información completa para facturación
export const obtenerEmbarquesFacturacion = async (filtros?: {
  fechaInicio?: string
  fechaFin?: string
  clienteId?: string
  operadorId?: string
  estadoFacturacion?: keyof EstadoFacturacion
}) => {
  try {
    let query = supabase
      .from("embarques")
      .select(`
        *,
        cliente:clientes(id, nombre, rfc, empresa),
        operador:operadores(id, nombre, apellidos, telefono),
        camion:camiones(id, numero_economico, marca, modelo),
        remolque:remolques(id, numero_economico, tipo),
        tipo_servicio:tipos_servicio(id, nombre, precio_base, pago_operador)
      `)
      .order("fecha_creacion", { ascending: false })

    // Aplicar filtros
    if (filtros?.fechaInicio) {
      query = query.gte("fecha_creacion", filtros.fechaInicio)
    }
    if (filtros?.fechaFin) {
      query = query.lte("fecha_creacion", filtros.fechaFin)
    }
    if (filtros?.clienteId) {
      query = query.eq("cliente_id", filtros.clienteId)
    }
    if (filtros?.operadorId) {
      query = query.eq("operador_id", filtros.operadorId)
    }
    if (filtros?.estadoFacturacion) {
      query = query.eq("estado_facturacion", filtros.estadoFacturacion)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo embarques para facturación:", error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error en obtenerEmbarquesFacturacion:", error)
    return { data: [], error }
  }
}

// Función para actualizar estado de facturación
export const actualizarEstadoFacturacion = async (
  embarqueId: string,
  nuevoEstado: keyof EstadoFacturacion,
  datosAdicionales?: Partial<DatosFacturacion>,
) => {
  try {
    const updateData: any = {
      estado_facturacion: nuevoEstado,
      updated_at: new Date().toISOString(),
    }

    // Agregar datos adicionales si se proporcionan
    if (datosAdicionales) {
      Object.assign(updateData, datosAdicionales)
    }

    // Si se marca como pagado, actualizar fecha de pago
    if (nuevoEstado === "pagado" && !updateData.fecha_pago_cliente) {
      updateData.fecha_pago_cliente = new Date().toISOString().split("T")[0]
      updateData.pagado = true
    }

    // Si se archiva, agregar datos de archivo
    if (nuevoEstado === "archivado") {
      updateData.fecha_archivado = new Date().toISOString()
      updateData.usuario_archivo = "Usuario Actual"
      updateData.motivo_archivo = updateData.motivo_archivo || "Archivado desde facturación"
    }

    const { data, error } = await supabase.from("embarques").update(updateData).eq("id", embarqueId).select().single()

    if (error) {
      console.error("Error actualizando estado de facturación:", error)
      return { success: false, error, data: null }
    }

    return { success: true, error: null, data }
  } catch (error) {
    console.error("Error en actualizarEstadoFacturacion:", error)
    return { success: false, error, data: null }
  }
}

// Función para guardar datos de facturación
export const guardarDatosFacturacion = async (datosFacturacion: DatosFacturacion) => {
  try {
    const { embarque_id, ...datosUpdate } = datosFacturacion

    const { data, error } = await supabase
      .from("embarques")
      .update({
        ...datosUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", embarque_id)
      .select()
      .single()

    if (error) {
      console.error("Error guardando datos de facturación:", error)
      return { success: false, error, data: null }
    }

    return { success: true, error: null, data }
  } catch (error) {
    console.error("Error en guardarDatosFacturacion:", error)
    return { success: false, error, data: null }
  }
}

// Función para obtener estadísticas de cliente
export const obtenerEstadisticasCliente = async (
  clienteId?: string,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<{ success: boolean; data?: EstadisticasCliente; error?: any }> => {
  try {
    let query = supabase.from("embarques").select(`
        *,
        cliente:clientes(id, nombre, rfc)
      `)

    // Aplicar filtros
    if (clienteId && clienteId !== "todos") {
      query = query.eq("cliente_id", clienteId)
    }
    if (fechaInicio) {
      query = query.gte("fecha_creacion", fechaInicio)
    }
    if (fechaFin) {
      query = query.lte("fecha_creacion", fechaFin)
    }

    const { data: embarques, error } = await query

    if (error) {
      console.error("Error obteniendo estadísticas de cliente:", error)
      return { success: false, error }
    }

    // Procesar estadísticas
    const pendientes =
      embarques?.filter(
        (e) => e.estado_facturacion === "pendiente_facturacion" || (!e.estado_facturacion && !e.pagado),
      ) || []

    const facturados = embarques?.filter((e) => e.estado_facturacion === "facturado") || []
    const pagados = embarques?.filter((e) => e.estado_facturacion === "pagado" || e.pagado) || []

    // Separar por moneda
    const pendientesMXN = pendientes
      .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
      .reduce((sum, e) => sum + (e.precio_flete || 0), 0)

    const pendientesUSD = pendientes
      .filter((e) => e.moneda_flete === "USD")
      .reduce((sum, e) => sum + (e.precio_flete || 0), 0)

    const facturadosMXN = facturados
      .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
      .reduce((sum, e) => sum + (e.precio_flete || 0), 0)

    const facturadosUSD = facturados
      .filter((e) => e.moneda_flete === "USD")
      .reduce((sum, e) => sum + (e.precio_flete || 0), 0)

    const pagadosMXN = pagados
      .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
      .reduce((sum, e) => sum + (e.precio_flete || 0), 0)

    const pagadosUSD = pagados
      .filter((e) => e.moneda_flete === "USD")
      .reduce((sum, e) => sum + (e.precio_flete || 0), 0)

    const estadisticas: EstadisticasCliente = {
      totalEmbarques: embarques?.length || 0,
      pendientes: pendientes.length,
      facturados: facturados.length,
      pagados: pagados.length,
      pendientesMXN,
      pendientesUSD,
      facturadosMXN,
      facturadosUSD,
      pagadosMXN,
      pagadosUSD,
      clienteSeleccionado: clienteId || "todos",
    }

    return { success: true, data: estadisticas }
  } catch (error) {
    console.error("Error en obtenerEstadisticasCliente:", error)
    return { success: false, error }
  }
}

// Función para generar análisis de operadores
export const generarAnalisisOperadores = async (filtros?: {
  operadorId?: string
  fechaInicio?: string
  fechaFin?: string
}): Promise<{
  success: boolean
  data?: { analisisPorOperador: AnalisisOperador[]; resumenGeneral: any }
  error?: any
}> => {
  try {
    let query = supabase
      .from("embarques")
      .select(`
        *,
        operador:operadores(id, nombre, apellidos),
        tipo_servicio:tipos_servicio(id, nombre, precio_base, pago_operador)
      `)
      .neq("estado_facturacion", "archivado")

    // Aplicar filtros
    if (filtros?.operadorId && filtros.operadorId !== "todos") {
      query = query.eq("operador_id", filtros.operadorId)
    }
    if (filtros?.fechaInicio) {
      query = query.gte("fecha_creacion", filtros.fechaInicio)
    }
    if (filtros?.fechaFin) {
      query = query.lte("fecha_creacion", filtros.fechaFin)
    }

    const { data: embarques, error } = await query

    if (error) {
      console.error("Error generando análisis de operadores:", error)
      return { success: false, error }
    }

    // Procesar embarques y calcular pagos
    const embarquesConPagos =
      embarques?.map((embarque) => {
        const pagoOperador =
          embarque.tipo_servicio?.pago_operador || embarque.tipo_servicio?.precio_base || embarque.precio_flete || 0

        return {
          ...embarque,
          pagoOperador,
          tipoServicioNombre: embarque.tipo_servicio?.nombre || "Sin especificar",
        }
      }) || []

    // Agrupar por operador
    const operadoresMap = new Map<string, AnalisisOperador>()

    embarquesConPagos.forEach((embarque) => {
      const operadorNombre = embarque.operador?.nombre || "Sin asignar"

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

      const operadorData = operadoresMap.get(operadorNombre)!
      operadorData.embarques.push(embarque)
      operadorData.totalEmbarques++
      operadorData.totalPagar += embarque.pagoOperador

      // Verificar si es caso de contingencia (basado en modificaciones)
      if (embarque.observaciones?.includes("modificado") || embarque.observaciones?.includes("emergencia")) {
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
      casosContingencia: analisisPorOperador.reduce((sum, op) => sum + op.embarquesContingencia, 0),
    }

    return {
      success: true,
      data: {
        analisisPorOperador,
        resumenGeneral,
      },
    }
  } catch (error) {
    console.error("Error en generarAnalisisOperadores:", error)
    return { success: false, error }
  }
}

// Función para obtener historial de modificaciones
export const obtenerHistorialModificaciones = async (embarqueId: string) => {
  try {
    const { data, error } = await supabase
      .from("embarque_modificaciones")
      .select("*")
      .eq("embarque_id", embarqueId)
      .order("fecha_modificacion", { ascending: false })

    if (error) {
      console.error("Error obteniendo historial de modificaciones:", error)
      return { success: false, data: [], error }
    }

    return { success: true, data: data || [], error: null }
  } catch (error) {
    console.error("Error en obtenerHistorialModificaciones:", error)
    return { success: false, data: [], error }
  }
}

// Función para obtener registros archivados
export const obtenerRegistrosArchivados = async (filtros?: {
  fechaInicio?: string
  fechaFin?: string
  busqueda?: string
}) => {
  try {
    let query = supabase
      .from("embarques")
      .select(`
        *,
        cliente:clientes(nombre),
        operador:operadores(nombre, apellidos)
      `)
      .eq("estado_facturacion", "archivado")
      .order("fecha_archivado", { ascending: false })

    // Aplicar filtros
    if (filtros?.fechaInicio) {
      query = query.gte("fecha_archivado", filtros.fechaInicio)
    }
    if (filtros?.fechaFin) {
      query = query.lte("fecha_archivado", filtros.fechaFin)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error obteniendo registros archivados:", error)
      return { success: false, data: [], error }
    }

    // Filtrar por búsqueda si se proporciona
    let registrosFiltrados = data || []
    if (filtros?.busqueda) {
      const termino = filtros.busqueda.toLowerCase()
      registrosFiltrados = registrosFiltrados.filter(
        (registro) =>
          registro.folio?.toLowerCase().includes(termino) ||
          registro.cliente?.nombre?.toLowerCase().includes(termino) ||
          registro.operador?.nombre?.toLowerCase().includes(termino),
      )
    }

    return { success: true, data: registrosFiltrados, error: null }
  } catch (error) {
    console.error("Error en obtenerRegistrosArchivados:", error)
    return { success: false, data: [], error }
  }
}

// Función para verificar límites de crédito
export const verificarLimiteCredito = async (clienteId: string) => {
  try {
    // Obtener límite de crédito del cliente
    const { data: credito, error: creditoError } = await supabase
      .from("creditos_clientes")
      .select("limite_credito_usd, limite_credito_mxn")
      .eq("cliente_id", clienteId)
      .eq("activo", true)
      .single()

    if (creditoError) {
      console.error("Error obteniendo límite de crédito:", creditoError)
      return { success: false, exceeded: false, error: creditoError }
    }

    // Obtener embarques pendientes de pago
    const { data: embarquesPendientes, error: embarquesError } = await supabase
      .from("embarques")
      .select("precio_flete, moneda_flete")
      .eq("cliente_id", clienteId)
      .eq("pagado", false)
      .neq("estado_facturacion", "archivado")

    if (embarquesError) {
      console.error("Error obteniendo embarques pendientes:", embarquesError)
      return { success: false, exceeded: false, error: embarquesError }
    }

    // Calcular totales por moneda
    const totalPendienteUSD =
      embarquesPendientes?.filter((e) => e.moneda_flete === "USD").reduce((sum, e) => sum + (e.precio_flete || 0), 0) ||
      0

    const totalPendienteMXN =
      embarquesPendientes
        ?.filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
        .reduce((sum, e) => sum + (e.precio_flete || 0), 0) || 0

    // Verificar si se exceden los límites
    const excedeUSD = totalPendienteUSD > (credito?.limite_credito_usd || 0) && (credito?.limite_credito_usd || 0) > 0
    const excedeMXN = totalPendienteMXN > (credito?.limite_credito_mxn || 0) && (credito?.limite_credito_mxn || 0) > 0

    return {
      success: true,
      exceeded: excedeUSD || excedeMXN,
      details: {
        excedeUSD,
        excedeMXN,
        totalPendienteUSD,
        totalPendienteMXN,
        limiteUSD: credito?.limite_credito_usd || 0,
        limiteMXN: credito?.limite_credito_mxn || 0,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error en verificarLimiteCredito:", error)
    return { success: false, exceeded: false, error }
  }
}
