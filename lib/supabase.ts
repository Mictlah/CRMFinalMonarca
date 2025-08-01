import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.")
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Tipos TypeScript para las tablas
export interface Operador {
  id: string
  nombre: string
  apellidos: string
  telefono?: string
  email?: string
  licencia?: string
  numero_apto_medico?: string
  fecha_vencimiento_licencia?: string
  fecha_vencimiento_apto_medico?: string
  numero_visa?: string
  fecha_vencimiento_visa?: string
  numero_fast?: string
  fecha_vencimiento_fast?: string
  tipo_sangre?: string
  direccion?: string
  fecha_nacimiento?: string
  curp?: string
  rfc?: string
  nss?: string
  telefono_emergencia?: string
  contactos_emergencia?: string // JSON con hasta 4 contactos
  documentos?: string // JSON para documentos
  observaciones?: string // Campo de observaciones
  estado: string
  fecha_registro: string
  updated_at: string
}

export interface Cliente {
  id: string
  nombre: string
  empresa?: string
  telefono?: string
  email?: string
  direccion?: string
  rfc?: string
  estado: string
  fecha_registro: string
  updated_at: string
}

export interface RepresentanteCliente {
  id: string
  cliente_id: string
  nombre: string
  apellidos?: string
  telefono?: string
  email?: string
  puesto?: string
  activo: boolean
  fecha_creacion: string
  updated_at: string
}

export interface ContactoCliente {
  id: string
  cliente_id: string
  nombre: string
  telefono?: string
  email?: string
  puesto?: string
  es_principal: boolean
  activo: boolean
  fecha_creacion: string
  updated_at: string
}

export interface TipoServicio {
  id: string
  nombre: string
  descripcion?: string
  precio_base?: number // Este es el campo para el pago al operador
  activo: boolean
  orden_visualizacion?: number
  fecha_creacion?: string
  updated_at: string
}

export interface CreditoCliente {
  id: string
  cliente_id: string
  limite_credito_usd: number
  activo: boolean
  notas_tipo_cambio?: string
  fecha_creacion: string
  updated_at: string
}

export interface Camion {
  id: string
  numero_economico: string
  marca?: string
  modelo?: string
  año?: number
  placas?: string
  kilometraje: number
  estado: string
  fecha_registro: string
  updated_at: string
  observaciones?: string
}

export interface MarcaCamion {
  id: string
  nombre: string
  activa: boolean
  fecha_creacion: string
  updated_at: string
}

export interface MarcaRemolque {
  id: string
  nombre: string
  activa: boolean
  fecha_creacion: string
  updated_at: string
}

export interface Remolque {
  id: string
  numero_economico: string
  tipo?: string
  marca?: string
  modelo?: string
  año?: number
  numero_serie?: string
  capacidad?: number
  placas?: string
  fecha_ultima_inspeccion?: string
  proxima_inspeccion?: string
  poliza_seguro?: string
  vigencia_seguro?: string
  estado: string
  ubicacion?: string
  comentarios?: string
  activo?: boolean
  fecha_registro: string
  updated_at: string
}

export interface Embarque {
  id: string
  folio: string
  cliente_id?: string
  operador_id?: string
  camion_id?: string
  remolque_id?: string
  origen: string
  destino: string
  lugar_recolecta?: string
  fecha_recolecta?: string
  hora_recolecta?: string
  contenido?: string
  peso?: number
  estado: string
  fecha_creacion: string
  fecha_entrega?: string
  hora_entrega?: string
  observaciones?: string
  updated_at: string
  // Nuevos campos
  direccion_recolecta?: string
  direccion_entrega?: string
  tiempo_entrega?: string
  tiempo_recolecta?: string
  load_number?: string
  patente_agente_aduanal?: string
  aduana_cruce?: string
  dueno_mercancia?: string
  representante_cliente?: string
  info_representante?: any
  carta_porte?: string
  tipo_servicio_id?: string
  precio_flete?: number
  currency?: "MXN" | "USD"
  // Relaciones
  cliente?: Cliente
  operador?: Operador
  camion?: Camion
  remolque?: Remolque
  remolque_manual?: boolean
  remolque_numero_economico?: string
  remolque_placa?: string
}

export interface Recordatorio {
  id: string
  titulo: string
  descripcion?: string
  fecha_vencimiento: string
  tipo?: string
  prioridad: string
  estado: string
  operador_id?: string
  camion_id?: string
  fecha_creacion: string
  updated_at: string
  // Relaciones
  operador?: Operador
  camion?: Camion
}

export interface FotoEmbarque {
  id: string
  embarque_id: string
  nombre_archivo: string
  url_blob: string
  tamano_bytes?: number
  tipo_mime?: string
  fecha_subida: string
  subido_por?: string
  created_at?: string
  updated_at?: string
  latitud?: number | null
  longitud?: number | null 
}

export interface OperadorPagoContingencia {
  id: string
  embarque_id: string
  operador_original_id?: string
  operador_reemplazo_id?: string
  monto_original: number
  monto_reemplazo: number
  fecha_registro: string
  registrado_por?: string
  updated_at: string
}

export interface OperadorConfirmacionEmbarque {
  id: string
  embarque_id: string
  operador_nombre: string
  fecha_confirmacion: string
}

// Función para generar folio automático
export const generarFolioAutomatico = async (): Promise<string> => {
  try {
    const currentYear = new Date().getFullYear()

    // Obtener o crear la secuencia para el año actual
    const { data: sequence, error: sequenceError } = await supabase
      .from("folio_sequence")
      .select("last_number")
      .eq("year", currentYear)
      .single()

    if (sequenceError) {
      // Si no existe, crear la secuencia para el año actual
      const { error: insertError } = await supabase.from("folio_sequence").insert({ year: currentYear, last_number: 1 })

      if (insertError) {
        console.error("Error creando secuencia:", insertError)
        // Fallback al método anterior
        return generarFolioFallback()
      }

      return `EMB${currentYear}001`
    }

    // Incrementar el número
    const newNumber = (sequence.last_number || 0) + 1

    // Actualizar la secuencia
    const { error: updateError } = await supabase
      .from("folio_sequence")
      .update({ last_number: newNumber })
      .eq("year", currentYear)

    if (updateError) {
      console.error("Error actualizando secuencia:", updateError)
      return generarFolioFallback()
    }

    // Formatear el folio con ceros a la izquierda
    const folioNumber = newNumber.toString().padStart(3, "0")
    return `EMB${currentYear}${folioNumber}`
  } catch (error) {
    console.error("Error generando folio:", error)
    return generarFolioFallback()
  }
}

// Función de respaldo para generar folio
const generarFolioFallback = (): string => {
  const fecha = new Date()
  const año = fecha.getFullYear()
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0")
  const dia = fecha.getDate().toString().padStart(2, "0")
  const hora = fecha.getHours().toString().padStart(2, "0")
  const minuto = fecha.getMinutes().toString().padStart(2, "0")
  const segundo = fecha.getSeconds().toString().padStart(2, "0")

  return `EMB${año}${mes}${dia}${hora}${minuto}${segundo}`
}

// Función para obtener representantes de un cliente
export const obtenerRepresentantesCliente = async (clienteId: string): Promise<RepresentanteCliente[]> => {
  try {
    const { data, error } = await supabase
      .from("representantes_clientes")
      .select("*")
      .eq("cliente_id", clienteId)
      .eq("activo", true)
      .order("nombre")

    if (error) {
      console.error("Error obteniendo representantes:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

// Función para obtener contactos de un cliente
export const obtenerContactosCliente = async (clienteId: string): Promise<ContactoCliente[]> => {
  try {
    const { data, error } = await supabase
      .from("contactos_clientes")
      .select("*")
      .eq("cliente_id", clienteId)
      .eq("activo", true)
      .order("es_principal", { ascending: false })
      .order("nombre")

    if (error) {
      console.error("Error obteniendo contactos:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

// Función para obtener tipos de servicio activos
export const obtenerTiposServicio = async (): Promise<TipoServicio[]> => {
  try {
    const { data, error } = await supabase.from("tipos_servicio").select("*").eq("activo", true).order("nombre")

    if (error) {
      // Si la tabla no existe, devolver array vacío en lugar de error
      if (error.message.includes('relation "public.tipos_servicio" does not exist')) {
        console.warn("Tabla tipos_servicio no existe aún. Ejecuta el script SQL correspondiente.")
        return []
      }
      console.error("Error obteniendo tipos de servicio:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

// Función para guardar contactos de un cliente
export const guardarContactosCliente = async (clienteId: string, contactos: any[]): Promise<boolean> => {
  try {
    // Primero, desactivar todos los contactos existentes
    const { error: updateError } = await supabase
      .from("contactos_clientes")
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq("cliente_id", clienteId)

    if (updateError) {
      console.error("Error desactivando contactos:", updateError)
      return false
    }

    // Luego, insertar los nuevos contactos
    const contactosParaInsertar = contactos
      .filter((c) => c.nombre.trim() || c.telefono.trim() || c.email.trim())
      .map((contacto, index) => ({
        cliente_id: clienteId,
        nombre: contacto.nombre.trim(),
        telefono: contacto.telefono.trim() || null,
        email: contacto.email.trim() || null,
        es_principal: index === 0, // El primer contacto es principal
        activo: true,
      }))

    if (contactosParaInsertar.length > 0) {
      const { error: insertError } = await supabase.from("contactos_clientes").insert(contactosParaInsertar)

      if (insertError) {
        console.error("Error insertando contactos:", insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error guardando contactos:", error)
    return false
  }
}

// Función para crear recordatorios de cumpleaños
export const crearRecordatoriosCumpleanos = async (diasAnticipacion = 2): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc("crear_recordatorios_cumpleanos", {
      dias_anticipacion: diasAnticipacion,
    })

    if (error) {
      console.error("Error creando recordatorios de cumpleaños:", error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error("Error:", error)
    return 0
  }
}

// Función para obtener notificaciones (corregida)
export const obtenerNotificaciones = async () => {
  try {
    const hoy = new Date()
    const enUnMes = new Date()
    enUnMes.setMonth(enUnMes.getMonth() + 1)

    // Formatear fechas para la consulta
    const fechaHoy = hoy.toISOString().split("T")[0]
    const fechaUnMes = enUnMes.toISOString().split("T")[0]

    // Obtener recordatorios próximos a vencer (sin joins problemáticos)
    const { data: recordatorios, error: errorRecordatorios } = await supabase
      .from("recordatorios")
      .select("*")
      .eq("estado", "pendiente")
      .gte("fecha_vencimiento", fechaHoy)
      .lte("fecha_vencimiento", fechaUnMes)
      .order("fecha_vencimiento", { ascending: true })

    if (errorRecordatorios) {
      console.error("Error obteniendo recordatorios:", errorRecordatorios)
      return { recordatorios: [], total: 0 }
    }

    // Obtener información adicional por separado si es necesario
    const recordatoriosConInfo = await Promise.all(
      (recordatorios || []).map(async (recordatorio) => {
        let operador = null
        let camion = null

        // Obtener operador si existe
        if (recordatorio.operador_id) {
          const { data: operadorData } = await supabase
            .from("operadores")
            .select("id, nombre, apellidos")
            .eq("id", recordatorio.operador_id)
            .single()
          operador = operadorData
        }

        // Obtener camión si existe
        if (recordatorio.camion_id) {
          const { data: camionData } = await supabase
            .from("camiones")
            .select("id, numero_economico")
            .eq("id", recordatorio.camion_id)
            .single()
          camion = camionData
        }

        return {
          ...recordatorio,
          operador,
          camion,
        }
      }),
    )

    return {
      recordatorios: recordatoriosConInfo,
      total: recordatoriosConInfo.length,
    }
  } catch (error) {
    console.error("Error en obtenerNotificaciones:", error)
    return { recordatorios: [], total: 0 }
  }
}

// Función para marcar recordatorio como completado
export const completarRecordatorio = async (id: string) => {
  try {
    const { error } = await supabase
      .from("recordatorios")
      .update({
        estado: "completado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error completando recordatorio:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error en completarRecordatorio:", error)
    return false
  }
}

// Función para obtener estadísticas del dashboard
export const obtenerEstadisticasDashboard = async () => {
  try {
    // Obtener conteos de cada tabla
    const [
      { count: totalCamiones },
      { count: totalOperadores },
      { count: totalClientes },
      { count: recordatoriosPendientes },
    ] = await Promise.all([
      supabase.from("camiones").select("*", { count: "exact", head: true }),
      supabase.from("operadores").select("*", { count: "exact", head: true }),
      supabase.from("clientes").select("*", { count: "exact", head: true }),
      supabase.from("recordatorios").select("*", { count: "exact", head: true }).eq("estado", "pendiente"),
    ])

    return {
      totalCamiones: totalCamiones || 0,
      totalOperadores: totalOperadores || 0,
      totalClientes: totalClientes || 0,
      recordatoriosPendientes: recordatoriosPendientes || 0,
    }
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    return {
      totalCamiones: 0,
      totalOperadores: 0,
      totalClientes: 0,
      recordatoriosPendientes: 0,
    }
  }
}

// Función para obtener embarques
export const obtenerEmbarques = async () => {
  try {
    const { data, error } = await supabase
      .from("embarques")
      .select(`
      *,
      cliente:clientes(nombre),
      operador:operadores(nombre, apellidos),
      camion:camiones(numero_economico),
      remolque:remolques(numero_economico)
    `)
      .order("fecha_creacion", { ascending: false })

    if (error) {
      console.error("Error obteniendo embarques:", error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error:", error)
    return { data: [], error }
  }
}

// Función para obtener recordatorios
export const obtenerRecordatorios = async () => {
  try {
    const { data, error } = await supabase
      .from("recordatorios")
      .select(`
      *,
      operador:operadores(nombre, apellidos),
      camion:camiones(numero_economico)
    `)
      .order("fecha_vencimiento", { ascending: true })

    if (error) {
      console.error("Error obteniendo recordatorios:", error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

// Función para obtener IDs de embarques modificados
export const obtenerEmbarquesModificadosIds = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.from("embarque_modificaciones").select("embarque_id")

    if (error) {
      console.error("Error al obtener IDs de embarques modificados:", error)
      return []
    }

    // Extraer y devolver IDs únicos
    const ids = data.map((row) => row.embarque_id)
    return Array.from(new Set(ids))
  } catch (error) {
    console.error("Excepción al obtener IDs de embarques modificados:", error)
    return []
  }
}

// Nuevas funciones para fotos de embarques
export const obtenerFotosEmbarque = async (embarqueId: string): Promise<FotoEmbarque[]> => {
  try {
    console.log("Obteniendo fotos para embarque:", embarqueId)

    const { data, error } = await supabase
      .from("fotos_embarques")
      .select("*")
      .eq("embarque_id", embarqueId)
      .order("fecha_subida", { ascending: false })

    if (error) {
      console.error("Error obteniendo fotos del embarque:", error)
      return []
    }

    console.log("Fotos encontradas:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Excepción al obtener fotos del embarque:", error)
    return []
  }
}

export const guardarFotoEmbarque = async (
  foto: Omit<FotoEmbarque, "id" | "created_at" | "updated_at" | "fecha_subida">
): Promise<FotoEmbarque | null> => {
  try {
    console.log("📦 Enviando metadata a Supabase:", foto)

    const { data, error } = await supabase
      .from("fotos_embarques")
      .insert({
        ...foto,
        fecha_subida: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error al guardar metadata:", error)
      return null
    }

    console.log("✅ Metadata guardada:", data)
    return data
  } catch (error) {
    console.error("❌ Excepción en guardarFotoEmbarque:", error)
    return null
  }
}

export const guardarConfirmacionOperador = async (embarqueId: string, operadorNombre: string): Promise<boolean> => {
  try {
    console.log("Guardando confirmación operador:", { embarqueId, operadorNombre })

    const { error } = await supabase.from("operador_confirmaciones_embarque").insert({
      embarque_id: embarqueId,
      operador_nombre: operadorNombre,
      fecha_confirmacion: new Date().toISOString(),
    })

    if (error) {
      console.error("Error guardando confirmación:", error)
      return false
    }

    console.log("Confirmación guardada exitosamente")
    return true
  } catch (error) {
    console.error("Excepción al guardar confirmación:", error)
    return false
  }
}

export const obtenerConfirmacionOperador = async (embarqueId: string): Promise<OperadorConfirmacionEmbarque | null> => {
  try {
    console.log("Obteniendo confirmación para embarque:", embarqueId)

    const { data, error } = await supabase
      .from("operador_confirmaciones_embarque")
      .select("*")
      .eq("embarque_id", embarqueId)
      .order("fecha_confirmacion", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code !== "PGRST116") {
        // Ignorar el error "No rows found" que es esperado si no hay confirmación
        console.error("Error obteniendo confirmación:", error)
      }
      return null
    }

    console.log("Confirmación encontrada:", data)
    return data
  } catch (error) {
    console.error("Excepción al obtener confirmación:", error)
    return null
  }
}

// Función para buscar embarque por folio
export const buscarEmbarquePorFolio = async (folio: string): Promise<Embarque | null> => {
  try {
    console.log("Buscando embarque por folio:", folio)

    const { data, error } = await supabase
      .from("embarques")
      .select(`
        *,
        cliente:clientes(nombre),
        operador:operadores(nombre, apellidos),
        remolque:remolques(numero_economico, placas)
      `)
      .eq("folio", folio)
      .single()

    if (error) {
      console.error("Error buscando embarque por folio:", error)
      return null
    }

    console.log("Embarque encontrado:", data)
    return data
  } catch (error) {
    console.error("Excepción al buscar embarque por folio:", error)
    return null
  }
}

// Función para corregir fotos huérfanas
export const corregirFotosHuerfanas = async (folio: string): Promise<boolean> => {
  try {
    console.log("Corrigiendo fotos huérfanas para folio:", folio)

    // Primero buscar el embarque
    const embarque = await buscarEmbarquePorFolio(folio)
    if (!embarque) {
      console.error("No se encontró embarque con folio:", folio)
      return false
    }

    // Buscar fotos que contengan el folio en el nombre o URL
    const { data: fotosHuerfanas, error: errorFotos } = await supabase
      .from("fotos_embarques")
      .select("*")
      .or(`nombre_archivo.ilike.%${folio}%,url_blob.ilike.%${folio}%`)

    if (errorFotos) {
      console.error("Error buscando fotos huérfanas:", errorFotos)
      return false
    }

    if (!fotosHuerfanas || fotosHuerfanas.length === 0) {
      console.log("No se encontraron fotos huérfanas para el folio:", folio)
      return true
    }

    console.log("Fotos huérfanas encontradas:", fotosHuerfanas.length)

    // Actualizar las fotos huérfanas con el ID correcto del embarque
    const { error: errorUpdate } = await supabase
      .from("fotos_embarques")
      .update({ embarque_id: embarque.id })
      .or(`nombre_archivo.ilike.%${folio}%,url_blob.ilike.%${folio}%`)

    if (errorUpdate) {
      console.error("Error actualizando fotos huérfanas:", errorUpdate)
      return false
    }

    console.log("Fotos huérfanas corregidas exitosamente")
    return true
  } catch (error) {
    console.error("Excepción al corregir fotos huérfanas:", error)
    return false
  }
}
