"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DollarSign,
  Users,
  Truck,
  Package,
  Calendar,
  Download,
  Search,
  MapPin,
  FileText,
  Edit,
  AlertTriangle,
  Save,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase, obtenerEmbarquesModificadosIds, obtenerTiposServicio } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EmbarqueAsignado {
  id: string
  folio: string
  clienteNombre: string
  numeroLoad: string
  direccionEnganche: string
  fechaEnganche: string
  horaEnganche: string
  comentarios: string
  operadorAsignado: {
    id: string
    nombre: string
  }
  camionAsignado: {
    id: string
    marca: string
    modelo: string
    numeroEconomico: string
  }
  fechaAsignacion: string
  estado: string
  montoFacturado?: number
  fechaEntrega?: string
  observacionesFacturacion?: string
  pagado?: boolean
  fechaPago?: string
  moneda_flete?: "MXN" | "USD"
  modificadoPorEmergencia?: boolean
  requiereAtencionEspecial?: boolean
  alertaModificacion?: string
  mensajeParaFacturacion?: string
  fechaModificacionEmergencia?: string
  usuarioModificacion?: string
  motivoModificacion?: string
  // Nuevos campos
  foliosFactura?: {
    folio1?: string
    folio2?: string
    folio3?: string
    folio4?: string
  }
  cantidadFinalFacturada?: number
  tipoServicio?: string
  estado_facturacion?: "pendiente_facturacion" | "facturado" | "pagado" | "archivado"
  precioFlete?: number
  tipo_servicio_id?: string
  fechaArchivado?: string
  usuarioArchivo?: string
  motivoArchivo?: string
  observacionesArchivo?: string
  fechaEnvioCliente?: string
  fechaPagoCliente?: string
  referenciaPago?: string
  // Campos de la base de datos que pueden venir directamente
  cliente_id?: string
  load_number?: string
  direccion_recolecta?: string
  direccion_entrega?: string
  carta_porte?: string
  numero_factura_1?: string
  numero_factura_2?: string
  numero_factura_3?: string
  numero_factura_4?: string
  cantidad_final_facturada?: number
  referencia_pago?: string
  updated_at?: string
  fecha_creacion?: string // Added for consistency with DB column

  // Campos para contingencia
  operadorOriginalId?: string
  operadorOriginalNombre?: string
  operadorReemplazoId?: string
  operadorReemplazoNombre?: string
  montoOriginalContingencia?: number
  montoReemplazoContingencia?: number
  pagoOperador?: number // Base payment for the service type
  tipoServicioNombre?: string // Added for easier access in tables
}

interface TipoServicio {
  id: string
  nombre: string
  descripcion?: string
  categoria?: string
  subcategoria?: string
  precio_base?: number // Este es el campo para el pago al operador
  activo: boolean
  orden_visualizacion?: number
  fecha_creacion?: string
  updated_at?: string
}

const ModificacionesHistory = ({ embarqueId }: { embarqueId: string }) => {
  const [modificaciones, setModificaciones] = useState<any[]>([])
  const [loadingMods, setLoadingMods] = useState(true)

  useEffect(() => {
    const cargarModificaciones = async () => {
      try {
        const { data, error } = await supabase
          .from("embarque_modificaciones")
          .select("*")
          .eq("embarque_id", embarqueId)
          .order("fecha_modificacion", { ascending: false })

        if (error) {
          console.error("Error cargando modificaciones:", error)
          setModificaciones([])
        } else {
          setModificaciones(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
        setModificaciones([])
      } finally {
        setLoadingMods(false)
      }
    }

    cargarModificaciones()
  }, [embarqueId])

  if (loadingMods) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        <span className="ml-2 text-sm text-gray-600">Cargando historial de modificaciones...</span>
      </div>
    )
  }

  if (modificaciones.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">Sin modificaciones registradas</p>
            <p className="text-sm text-gray-500 mt-1">
              Este embarque no ha sido modificado desde su asignación original.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-800">Resumen de Modificaciones</CardTitle>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
              {modificaciones.length} modificación
              {modificaciones.length > 1 ? "es" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Este embarque ha sido modificado por situaciones de emergencia o contingencia. A continuación se muestra el
            historial detallado de cada modificación realizada.
          </p>
        </CardContent>
      </Card>

      {modificaciones.map((mod, index) => (
        <Card key={mod.id || index} className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">{modificaciones.length - index}</span>
                </div>
                <div>
                  <CardTitle className="text-base text-gray-800">
                    Modificación #{modificaciones.length - index}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(mod.fecha_modificacion).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                {mod.usuario_modificacion || "Sistema"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Justificación */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Justificación</h4>
              <p className="text-sm text-gray-700">{mod.razon || "Sin justificación registrada"}</p>
            </div>

            {/* Cambios realizados */}
            <div className="space-y-3">
              {/* Cambio de Operador */}
              {(mod.operador_original_nombre || mod.operador_nuevo_nombre) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-600" />
                    Cambio de Operador
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Operador Anterior
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border">
                        {mod.operador_original_nombre || "No especificado"}
                      </p>
                      {mod.sueldo_operador_original && (
                        <p className="text-xs text-gray-600 mt-1">
                          Sueldo: ${mod.sueldo_operador_original} {mod.moneda_sueldo_operador_original || "MXN"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Operador Nuevo</p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-medium">
                        {mod.operador_nuevo_nombre || "No especificado"}
                      </p>
                      {mod.sueldo_operador_nuevo && (
                        <p className="text-xs text-gray-600 mt-1">
                          Sueldo: ${mod.sueldo_operador_nuevo} {mod.moneda_sueldo_operador_nuevo || "MXN"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cambio de Tractocamión */}
              {(mod.camion_original_numero || mod.camion_nuevo_numero) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-gray-600" />
                    Cambio de Tractocamión
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Tractocamión Anterior
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-mono">
                        {mod.camion_original_numero || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Tractocamión Nuevo
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-mono font-medium">
                        {mod.camion_nuevo_numero || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cambio de Remolque */}
              {(mod.remolque_original_numero || mod.remolque_nuevo_numero) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-600" />
                    Cambio de Remolque
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Remolque Anterior
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-mono">
                        {mod.remolque_original_numero || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Remolque Nuevo</p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-mono font-medium">
                        {mod.remolque_nuevo_numero || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cambio de Precio de Flete */}
              {(mod.precio_flete_original || mod.precio_flete_nuevo) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-600" />
                    Cambio de Precio de Flete
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Precio Anterior</p>
                      <p className="text-lg font-bold text-gray-800 bg-gray-100 p-2 rounded border">
                        {mod.precio_flete_original
                          ? `$${mod.precio_flete_original.toLocaleString()} ${mod.moneda_flete_original || "MXN"}`
                          : "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Precio Nuevo</p>
                      <p className="text-lg font-bold text-gray-800 bg-gray-100 p-2 rounded border-2 border-gray-400">
                        {mod.precio_flete_nuevo
                          ? `$${mod.precio_flete_nuevo.toLocaleString()} ${mod.moneda_flete_nueva || "MXN"}`
                          : "No especificado"}
                      </p>
                    </div>
                  </div>
                  {mod.flete_en_falso && (
                    <div className="mt-3 bg-gray-100 border border-gray-300 rounded p-2">
                      <p className="text-sm text-gray-800 font-medium flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-gray-600" />
                        Marcado como flete en falso
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Información de auditoría */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>ID de Registro: {mod.id?.slice(-8) || "N/A"}</span>
                <span>Modificación por emergencia/contingencia</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function FacturacionCobranzaPage() {
  const [contingencyPaymentsDb, setContingencyPaymentsDb] = useState<{
    [embarqueId: string]: {
      monto_original: number
      monto_reemplazo: number
      operador_original_id: string
      operador_reemplazo_id: string
    }
  }>({})
  const [embarquesModificadosIds, setEmbarquesModificadosIds] = useState<string[]>([])

  const [loadingEmbarques, setLoadingEmbarques] = useState(true)
  const [loadingTiposServicio, setLoadingTiposServicio] = useState(true)

  useEffect(() => {
    obtenerEmbarquesModificadosIds().then(setEmbarquesModificadosIds)
  }, [])

  const [showAnalisisOperadoresModal, setShowAnalisisOperadoresModal] = useState(false)
  const [analisisData, setAnalisisData] = useState<any>({
    analisisPorOperador: [],
    embarquesFiltradosAnalisis: [],
    resumenGeneral: null,
  })
  const [filtroAnalisisOperador, setFiltroAnalisisOperador] = useState("todos")
  const [fechaInicioAnalisis, setFechaInicioAnalisis] = useState("")
  const [fechaFinAnalisis, setFechaFinAnalisis] = useState("")
  const [activeAnalisisTab, setActiveAnalisisTab] = useState("resumen")
  const [operadoresContingencia, setOperadoresContingencia] = useState<{
    [key: string]: { original: number; reemplazo: number }
  }>({})
  const [operadoresContingenciaData, setOperadoresContingenciaData] = useState<{
    [key: string]: { original: any; reemplazo: any }
  }>({})
  const [loadingAnalisis, setLoadingAnalisis] = useState(false)

  const [showPagosOperadoresModal, setShowPagosOperadoresModal] = useState(false)
  const [filtroPagosOperadorId, setFiltroPagosOperadorId] = useState("todos")
  const [fechaInicioPagos, setFechaInicioPagos] = useState("")
  const [fechaFinPagos, setFechaFinPagos] = useState("")
  const [embarquesOperadorFiltrados, setEmbarquesOperadorFiltrados] = useState<EmbarqueAsignado[]>([])
  const [loadingPagos, setLoadingPagos] = useState(false)
  const [activePagosTab, setActivePagosTab] = useState("detalle") // New state for tabs in Pagos modal
  const [filtroPeriodoPagos, setFiltroPeriodoPagos] = useState("custom") // New state for period filter

  const setPeriodoActual = (tipo: "mes" | "año") => {
    const hoy = new Date()
    if (tipo === "mes") {
      setFechaInicioAnalisis(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10))
      setFechaFinAnalisis(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10))
    } else {
      setFechaInicioAnalisis(new Date(hoy.getFullYear(), 0, 1).toISOString().slice(0, 10))
      setFechaFinAnalisis(new Date(hoy.getFullYear(), 11, 31).toISOString().slice(0, 10))
    }
  }

  const generarAnalisisOperadores = async () => {
    setLoadingAnalisis(true)
    try {
      const fechaInicio = fechaInicioAnalisis ? new Date(fechaInicioAnalisis) : new Date("2024-01-01")
      const fechaFin = fechaFinAnalisis ? new Date(fechaFinAnalisis) : new Date()
      fechaFin.setHours(23, 59, 59, 999)

      const embarquesFiltrados = embarquesAsignados.filter((embarque) => {
        const fechaEmbarque = new Date(embarque.fecha_creacion!)
        const coincideFecha = fechaEmbarque >= fechaInicio && fechaEmbarque <= fechaFin
        const coincideOperador =
          filtroAnalisisOperador === "todos" || embarque.operadorAsignado?.nombre === filtroAnalisisOperador
        return coincideFecha && coincideOperador && embarque.estado_facturacion !== "archivado"
      })

      const embarquesConPagos = embarquesFiltrados.map((embarque) => {
        const tipoServicio = tiposServicio.find((t) => t.id === embarque.tipo_servicio_id)
        const pagoOperador = tipoServicio?.precio_base || 0
        return {
          ...embarque,
          pagoOperador,
          tipoServicioNombre: tipoServicio?.nombre || "Sin especificar",
        }
      })

      const operadoresMap = new Map()
      for (const embarque of embarquesConPagos) {
        const nombre = embarque.operadorAsignado?.nombre || "Sin asignar"
        if (!operadoresMap.has(nombre)) {
          operadoresMap.set(nombre, [])
        }
        operadoresMap.get(nombre).push(embarque)
      }
      const analisisPorOperador = Array.from(operadoresMap.entries()).map(([nombre, embarques]) => {
        const totalPagos = embarques.reduce((sum, e) => sum + (e.pagoOperador || 0), 0)
        const embarquesContingencia = embarques.filter((e) => embarquesModificadosIds.includes(e.id)).length
        return {
          nombre,
          totalPagos,
          cantidadEmbarques: embarques.length,
          embarques,
          embarquesContingencia,
          promedioPorEmbarque: embarques.length > 0 ? totalPagos / embarques.length : 0,
        }
      })
      const resumenGeneral = {
        totalPagos: embarquesConPagos.reduce((sum, e) => sum + (e.pagoOperador || 0), 0),
        totalEmbarques: embarquesConPagos.length,
        operadores: analisisPorOperador.length,
        casosContingencia: embarquesConPagos.filter((e) => embarquesModificadosIds.includes(e.id)).length,
      }
      setAnalisisData({
        analisisPorOperador,
        embarquesFiltradosAnalisis: embarquesConPagos,
        resumenGeneral,
      })
    } catch (error) {
      console.error("Error al generar el análisis de operadores:", error)
      alert("Error al generar el análisis de operadores. Por favor, intente de nuevo.")
    } finally {
      setLoadingAnalisis(false)
    }
  }

  const exportarAnalisisExcel = () => {
    let csv = "Operador,Folio,Cliente,Fecha,Tipo Servicio,Pago Operador\n"
    analisisData.embarquesFiltradosAnalisis.forEach((e: EmbarqueAsignado) => {
      csv += `${e.operadorAsignado?.nombre || ""},${e.folio},${
        e.clienteNombre
      },${e.fechaAsignacion},${e.tipoServicioNombre},${e.pagoOperador}\n`
    })
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "analisis_operadores.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const [showArchivadosModal, setShowArchivadosModal] = useState(false)
  const [embarquesArchivados, setEmbarquesArchivados] = useState<EmbarqueAsignado[]>([])
  const [loadingArchivados, setLoadingArchivados] = useState(false)

  useEffect(() => {
    if (!showArchivadosModal) return
    setLoadingArchivados(true)
    const cargarArchivados = async () => {
      try {
        const { data, error } = await supabase
          .from("embarques")
          .select(
            `*,
       cliente:clientes(*),
       operador:operadores(*),
       camion:camiones(*)`,
          )
          .eq("estado_facturacion", "archivado")
          .order("fecha_archivado", { ascending: false })

        if (error) {
          console.error("Error cargando embarques archivados:", error)
          setEmbarquesArchivados([])
        } else {
          const embarquesFormateados = (data || []).map((embarque) => ({
            ...embarque,
            clienteNombre: embarque.cliente?.nombre || "Cliente no especificado",
            operadorAsignado: embarque.operador
              ? {
                  id: embarque.operador.id,
                  nombre: `${embarque.operador.nombre} ${embarque.operador.apellidos || ""}`.trim(),
                }
              : { id: "", nombre: "Sin asignar" },
            camionAsignado: embarque.camion
              ? {
                  id: embarque.camion.id,
                  marca: embarque.camion.marca,
                  modelo: embarque.camion.modelo,
                  numeroEconomico: embarque.camion.numero_economico,
                }
              : {
                  id: "",
                  marca: "Sin asignar",
                  modelo: "",
                  numeroEconomico: "",
                },
          }))
          setEmbarquesArchivados(embarquesFormateados)
        }
      } catch (error) {
        console.error("Error cargando embarques archivados:", error)
        setEmbarquesArchivados([])
      } finally {
        setLoadingArchivados(false)
      }
    }
    cargarArchivados()
  }, [showArchivadosModal])

  async function archivarEmbarque(embarque: EmbarqueAsignado) {
    const fechaArchivado = new Date().toISOString()
    const usuarioArchivo = "Usuario Actual"
    const motivoArchivo = "Archivado manualmente desde facturación"
    const observacionesArchivo = "Registro archivado para consulta histórica"

    const { error } = await supabase
      .from("embarques")
      .update({
        estado_facturacion: "archivado",
        fecha_archivado: fechaArchivado,
        usuario_archivo: usuarioArchivo,
        motivo_archivo: motivoArchivo,
        observaciones_archivo: observacionesArchivo,
        updated_at: fechaArchivado,
      })
      .eq("id", embarque.id)

    if (error) {
      alert("Error al archivar el embarque en Supabase: " + (error.message || ""))
      return
    }

    const actualizados = embarquesAsignados.map((e) =>
      e.id === embarque.id
        ? {
            ...e,
            estado_facturacion: "archivado",
            fechaArchivado,
            usuarioArchivo,
            motivoArchivo,
            observacionesArchivo,
            updated_at: fechaArchivado,
          }
        : e,
    )
    setEmbarquesAsignados(actualizados)
    localStorage.setItem("embarquesAsignados", JSON.stringify(actualizados))
    alert("Embarque archivado exitosamente en Supabase.")
  }
  const [embarquesAsignados, setEmbarquesAsignados] = useState<EmbarqueAsignado[]>([])
  const [filtroOperador, setFiltroOperador] = useState("todos")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [embarqueEditando, setEmbarqueEditando] = useState<EmbarqueAsignado | null>(null)

  const [formData, setFormData] = useState({
    montoFacturado: 0,
    fechaEntrega: "",
    observacionesFacturacion: "",
    pagado: false,
    fechaPago: "",
    estado_facturacion: "pendiente_facturacion",
    numeroFactura1: "",
    numeroFactura2: "",
    numeroFactura3: "",
    fechaEnvioCliente: "",
    referenciaPago: "",
  })

  const [showCreditModal, setShowCreditModal] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [creditLimits, setCreditLimits] = useState<{
    [key: string]: { usd: number; mxn: number }
  }>({})

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [embarqueDetalle, setEmbarqueDetalle] = useState<EmbarqueAsignado | null>(null)

  const [activeTab, setActiveTab] = useState("general")

  const [showFacturacionEditModal, setShowFacturacionEditModal] = useState(false)
  const [facturacionFormData, setFacturacionFormData] = useState({
    folio1: "",
    folio2: "",
    folio3: "",
    folio4: "",
    cantidadFinalFacturada: 0,
    observacionesFacturacion: "",
  })

  const [showTiposServicioModal, setShowTiposServicioModal] = useState(false)
  const [tiposServicio, setTiposServicio] = useState<TipoServicio[]>([])

  const [showFacturacionModal, setShowFacturacionModal] = useState(false)
  const [embarqueFacturacion, setEmbarqueFacturacion] = useState<EmbarqueAsignado | null>(null)
  const [facturacionData, setFacturacionData] = useState({
    numeroFactura1: "",
    numeroFactura2: "",
    numeroFactura3: "",
    fechaEnvioCliente: "",
    fechaPagoCliente: "",
    referenciaPago: "",
    observacionesFacturacion: "",
  })

  const [activeDetailTab, setActiveDetailTab] = useState("general")

  useEffect(() => {
    const cargarEmbarquesFacturados = async () => {
      setLoadingEmbarques(true)
      try {
        const { data, error } = await supabase
          .from("embarques")
          .select(
            `
       *,
       cliente:clientes(*),
       operador:operadores(*),
       camion:camiones(*),
       remolque:remolques(*)
     `,
          )
          .neq("estado_facturacion", "archivado")
          .order("fecha_creacion", { ascending: false })

        if (error) {
          console.error("Error cargando embarques facturados:", error)
          setEmbarquesAsignados([])
        } else {
          const embarquesFormateados = (data || []).map((embarque) => ({
            ...embarque,
            clienteNombre: embarque.cliente?.nombre || "Cliente no especificado",
            operadorAsignado: embarque.operador
              ? {
                  id: embarque.operador.id,
                  nombre: `${embarque.operador.nombre} ${embarque.operador.apellidos || ""}`.trim(),
                }
              : { id: "", nombre: "Sin asignar" },
            camionAsignado: embarque.camion
              ? {
                  id: embarque.camion.id,
                  marca: embarque.camion.marca,
                  modelo: embarque.camion.modelo,
                  numeroEconomico: embarque.camion.numero_economico,
                }
              : {
                  id: "",
                  marca: "Sin asignar",
                  modelo: "",
                  numeroEconomico: "",
                },
            folio_factura_1: embarque.folio_factura_1,
            folio_factura_2: embarque.folio_factura_2,
            folio_factura_3: embarque.folio_factura_3,
            folio_factura_4: embarque.folio_factura_4,
            fecha_envio_cliente: embarque.fecha_envio_cliente,
            fecha_pago: embarque.fecha_pago,
            referencia_pago: embarque.referencia_pago,
            observaciones_facturacion: embarque.observaciones_facturacion,
            fecha_creacion: embarque.fecha_creacion,
            direccionRecolecta: embarque.direccion_recolecta || "",
            direccionEnganche: embarque.direccion_entrega || "",
          }))
          setEmbarquesAsignados(embarquesFormateados)
        }
      } catch (error) {
        console.error("Error cargando embarques facturados:", error)
        setEmbarquesAsignados([])
      } finally {
        setLoadingEmbarques(false)
      }
    }
    cargarEmbarquesFacturados()
  }, [])

  useEffect(() => {
    const loadClientsFromDatabase = async () => {
      try {
        const { data: clientesData, error: clientesError } = await supabase
          .from("clientes")
          .select("*")
          .eq("estado", "activo")
          .order("nombre")

        if (clientesError) {
          console.error("Error loading clients:", clientesError)
          const clientesGuardados = JSON.parse(localStorage.getItem("clientes") || "[]")
          setClientes(clientesGuardados)
        } else {
          setClientes(clientesData || [])
        }

        const { data: creditosData, error: creditosError } = await supabase
          .from("creditos_clientes")
          .select("cliente_id, limite_credito_usd, limite_credito_mxn")
          .eq("activo", true)

        if (creditosError && creditosError.code !== "PGRST116") {
          console.error("Error checking existing credit limit:", creditosError)
          return
        }

        if (creditosError) {
          console.error("Error loading credit limits:", creditosError)
          const creditosGuardados = JSON.parse(localStorage.getItem("creditLimits") || "{}")
          setCreditLimits(creditosGuardados)
        } else {
          const creditLimitsMap: {
            [key: string]: { usd: number; mxn: number }
          } = {}
          creditosData?.forEach((credito) => {
            creditLimitsMap[credito.cliente_id] = {
              usd: credito.limite_credito_usd || 0,
              mxn: credito.limite_credito_mxn || 0,
            }
          })
          setCreditLimits(creditLimitsMap)
        }
      } catch (error) {
        console.error("Error in loadClientsFromDatabase:", error)
        const clientesGuardados = JSON.parse(localStorage.getItem("clientes") || "[]")
        const creditosGuardados = JSON.parse(localStorage.getItem("creditLimits") || "{}")
        setClientes(clientesGuardados)
        setCreditLimits(creditosGuardados)
      }
    }

    loadClientsFromDatabase()
  }, [])

  useEffect(() => {
    const loadTiposServicio = async () => {
      setLoadingTiposServicio(true)
      try {
        const tiposData = await obtenerTiposServicio()
        setTiposServicio(tiposData || [])
      } catch (error) {
        console.error("Error loading tipos de servicio:", error)
        const tiposDefault: TipoServicio[] = [
          {
            id: "exportacion-cargada-caja-seca-240",
            nombre: "EXPORTACIÓN CARGADA - CAJA SECA 240",
            precio_base: 1800,
            descripcion: "Servicio de exportación con contenedor de caja seca cargada - Zona 240",
            activo: true,
          },
          {
            id: "importacion-cargada-caja-seca-240",
            nombre: "IMPORTACIÓN CARGADA - CAJA SECA 240",
            precio_base: 1700,
            descripcion: "Servicio de importación con contenedor de caja seca cargada - Zona 240",
            activo: true,
          },
          {
            id: "otro",
            nombre: "OTRO",
            precio_base: 0,
            descripcion: "Servicio personalizado según necesidades específicas del cliente",
            activo: true,
          },
        ]
        setTiposServicio(tiposDefault)
      } finally {
        setLoadingTiposServicio(false)
      }
    }

    loadTiposServicio()
  }, [])

  const operadoresUnicos = Array.from(
    new Set((embarquesAsignados || []).map((embarque) => embarque?.operadorAsignado?.nombre).filter(Boolean)),
  )
    .map((nombre) => {
      const operador = (embarquesAsignados || []).find((e) => e?.operadorAsignado?.nombre === nombre)?.operadorAsignado
      return operador
    })
    .filter(Boolean)

  const embarquesFiltrados = (embarquesAsignados || []).filter((embarque) => {
    if (!embarque) return false
    if (embarque.estado !== "finalizado") return false
    if (embarque.estado_facturacion === "archivado") return false

    const coincideBusqueda =
      (embarque.folio || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (embarque.clienteNombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (embarque.numeroLoad || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (embarque.operadorAsignado?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase())

    const coincideOperador = filtroOperador === "todos" || embarque.operadorAsignado?.nombre === filtroOperador

    const coincideFecha = !filtroFecha || new Date(embarque.fechaAsignacion || "") >= new Date(filtroFecha)

    const coincideFechaHasta =
      !filtroFechaHasta || new Date(embarque.fechaAsignacion || "") <= new Date(filtroFechaHasta)

    return coincideBusqueda && coincideOperador && coincideFecha && coincideFechaHasta
  })

  const saveCreditLimit = async (clienteId: string, currency: "usd" | "mxn", limit: number) => {
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

    try {
      const { data: existingRecord, error: selectError } = await supabase
        .from("creditos_clientes")
        .select("id")
        .eq("cliente_id", clienteId)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 means no rows found
        console.error("Error checking existing credit limit:", selectError)
        return
      }

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from("creditos_clientes")
          .update({
            limite_credito_usd: newLimits[clienteId].usd,
            limite_credito_mxn: newLimits[clienteId].mxn,
            updated_at: new Date().toISOString(),
          })
          .eq("cliente_id", clienteId)

        if (updateError) {
          console.error("Error updating credit limits:", updateError)
        }
      } else {
        const { error: insertError } = await supabase.from("creditos_clientes").insert({
          cliente_id: clienteId,
          limite_credito_usd: newLimits[clienteId].usd,
          limite_credito_mxn: newLimits[clienteId].mxn,
          activo: true,
        })

        if (insertError) {
          console.error("Error inserting credit limits:", insertError)
        }
      }
    } catch (error) {
      console.error("Error saving credit limits to database:", error)
    }
  }

  const checkCreditExceeded = (clienteNombre: string, montoFacturado: number, moneda_flete: "MXN" | "USD" = "MXN") => {
    if (!clienteNombre || !clientes || clientes.length === 0) {
      return { exceeded: false, message: "" }
    }

    const cliente = clientes.find((c) => c?.nombre === clienteNombre)
    if (!cliente) return { exceeded: false, message: "" }

    const clienteLimits = creditLimits?.[cliente.id] || { usd: 0, mxn: 0 }

    const clienteEmbarquesUSD = (embarquesFiltrados || []).filter(
      (e) => e?.clienteNombre === clienteNombre && !e?.pagado && e?.moneda_flete === "USD",
    )
    const clienteEmbarquesMXN = (embarquesFiltrados || []).filter(
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

  const guardarTipoServicio = async (tipoId: string, nuevoMonto: number) => {
    try {
      const { error } = await supabase
        .from("tipos_servicio")
        .update({
          precio_base: nuevoMonto,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tipoId)

      if (error) {
        console.error("Error updating tipo servicio:", error)
        alert(`Error al actualizar el tipo de servicio: ${error.message}`)
        return
      }

      setTiposServicio((prev) =>
        prev.map((tipo) =>
          tipo.id === tipoId
            ? {
                ...tipo,
                precio_base: nuevoMonto,
              }
            : tipo,
        ),
      )
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar el tipo de servicio")
    }
  }

  const editarEmbarque = (embarque: EmbarqueAsignado) => {
    setEmbarqueEditando(embarque)
    setFormData({
      montoFacturado: embarque.montoFacturado || embarque.precioFlete || 0,
      fechaEntrega: embarque.fechaEntrega || "",
      observacionesFacturacion: embarque.observacionesFacturacion || "",
      pagado: embarque.pagado || false,
      fechaPago: embarque.fechaPago || "",
      estado_facturacion: embarque.estado_facturacion || "pendiente_facturacion",
      numeroFactura1: embarque.numero_factura_1 || "",
      numeroFactura2: embarque.numero_factura_2 || "",
      numeroFactura3: embarque.numero_factura_3 || "",
      fechaEnvioCliente: embarque.fechaEnvioCliente || "",
      referenciaPago: embarque.referenciaPago || "",
    })
    setShowEditDialog(true)
  }

  const guardarCambios = async () => {
    if (!embarqueEditando) return

    try {
      const { error } = await supabase
        .from("embarques")
        .update({
          precio_flete: formData.montoFacturado,
          fecha_entrega: formData.fechaEntrega || null,
          observaciones_facturacion: formData.observacionesFacturacion || null,
          pagado: formData.pagado,
          fecha_pago: formData.fechaPago || null,
          estado_facturacion: formData.estado_facturacion,
          numero_factura_1: formData.numeroFactura1 || null,
          numero_factura_2: formData.numeroFactura2 || null,
          numero_factura_3: formData.numeroFactura3 || null,
          fecha_envio_cliente: formData.fechaEnvioCliente || null,
          referencia_pago: formData.referenciaPago || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarqueEditando.id)

      if (error) {
        console.error("Error actualizando embarque:", error)
        alert("Error al guardar los cambios")
        return
      }

      const embarquesActualizados = embarquesAsignados.map((embarque) =>
        embarque.id === embarqueEditando.id
          ? {
              ...embarque,
              montoFacturado: formData.montoFacturado,
              precioFlete: formData.montoFacturado,
              fechaEntrega: formData.fechaEntrega,
              observacionesFacturacion: formData.observacionesFacturacion,
              pagado: formData.pagado,
              fechaPago: formData.fechaPago,
              estado_facturacion: formData.estado_facturacion,
            }
          : embarque,
      )

      setEmbarquesAsignados(embarquesActualizados)
      localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))
      setShowEditDialog(false)
      setEmbarqueEditando(null)
      alert("Cambios guardados exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar los cambios")
    }
  }

  const abrirModalFacturacion = (embarque: EmbarqueAsignado) => {
    setEmbarqueFacturacion(embarque)
    setFacturacionData({
      numeroFactura1: embarque.foliosFactura?.folio1 || "",
      numeroFactura2: embarque.foliosFactura?.folio2 || "",
      numeroFactura3: embarque.foliosFactura?.folio3 || "",
      fechaEnvioCliente: embarque.fechaEnvioCliente || "",
      fechaPagoCliente: embarque.fechaPago || "",
      referenciaPago: embarque.referenciaPago || "",
      observacionesFacturacion: embarque.observacionesFacturacion || "",
    })
    setShowFacturacionModal(true)
  }

  const guardarDatosFacturacion = async () => {
    if (!embarqueFacturacion) return

    try {
      const { error } = await supabase
        .from("embarques")
        .update({
          folio_factura_1: facturacionData.numeroFactura1 || null,
          folio_factura_2: facturacionData.numeroFactura2 || null,
          folio_factura_3: facturacionData.numeroFactura3 || null,
          fecha_envio_cliente: facturacionData.fechaEnvioCliente || null,
          fecha_pago: facturacionData.fechaPagoCliente || null,
          referencia_pago: facturacionData.referenciaPago || null,
          observaciones_facturacion: facturacionData.observacionesFacturacion || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarqueFacturacion.id)

      if (error) {
        console.error("Error actualizando datos de facturación:", error)
        alert(
          "Error: los datos de facturación NO se guardaron en la base de datos.\n\n" +
            (error.message || error.details || ""),
        )
        return
      }

      const embarquesActualizados = embarquesAsignados.map((embarque) =>
        embarque.id === embarqueFacturacion.id
          ? {
              ...embarque,
              foliosFactura: {
                folio1: facturacionData.numeroFactura1,
                folio2: facturacionData.numeroFactura2,
                folio3: facturacionData.numeroFactura3,
              },
              fechaEnvioCliente: facturacionData.fechaEnvioCliente,
              fechaPago: facturacionData.fechaPagoCliente,
              referenciaPago: facturacionData.referenciaPago,
              observacionesFacturacion: facturacionData.observacionesFacturacion,
            }
          : embarque,
      )

      setEmbarquesAsignados(embarquesActualizados)
      localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))

      alert("¡Registro de facturación guardado exitosamente en Supabase!")

      setShowFacturacionModal(false)
      setEmbarqueFacturacion(null)

      setFacturacionData({
        numeroFactura1: "",
        numeroFactura2: "",
        numeroFactura3: "",
        fechaEnvioCliente: "",
        fechaPagoCliente: "",
        referenciaPago: "",
        observacionesFacturacion: "",
      })
    } catch (error) {
      console.error("Error:", error)
      let msg = ""
      if (typeof error === "object" && error && "message" in error) {
        msg = (error as any).message
      }
      alert("Error al guardar los datos de facturación.\n\n" + msg)
    }
  }

  const generarReporteExcel = () => {
    try {
      const datosReporte = {
        periodo: `${filtroFecha || "Inicio"} - ${filtroFechaHasta || "Fin"}`,
        operador: filtroOperador === "todos" ? "Todos los operadores" : filtroOperador,
        totalEmbarques: embarquesFiltrados.length,
        montoTotal: embarquesFiltrados.reduce((sum, e) => sum + (e.montoFacturado || 0), 0),
        embarques: embarquesFiltrados.map((e) => ({
          folio: e.folio,
          cliente: e.clienteNombre,
          operador: e.operadorAsignado.nombre,
          camion: `${e.camionAsignado.marca} ${e.camionAsignado.modelo} (${e.camionAsignado.numeroEconomico})`,
          fechaAsignacion: e.fechaAsignacion,
          montoFacturado: e.montoFacturado || e.precioFlete || 0,
          moneda: e.moneda_flete || "MXN",
          pagado: e.pagado ? "Sí" : "No",
          estado: e.estado_facturacion || "pendiente_facturacion",
        })),
      }

      console.log("Generando reporte Excel:", datosReporte)

      alert("Reporte Excel generado exitosamente (simulado)")
    } catch (error) {
      console.error("Error al generar reporte Excel:", error)
      alert("Error al generar el reporte Excel")
    }
  }

  const verDetallesEmbarque = (embarque: EmbarqueAsignado) => {
    setEmbarqueDetalle(embarque)

    setFacturacionFormData({
      folio1: embarque.numero_factura_1 || "",
      folio2: embarque.numero_factura_2 || "",
      folio3: embarque.numero_factura_3 || "",
      folio4: embarque.numero_factura_4 || "",
      cantidadFinalFacturada: embarque.cantidad_final_facturada || embarque.precioFlete || 0,
      observacionesFacturacion: embarque.observaciones_facturacion || "",
    })

    setShowDetailModal(true)
  }

  const guardarInformacionFacturacion = async () => {
    if (!embarqueDetalle) return

    try {
      const { error } = await supabase
        .from("embarques")
        .update({
          folio_factura_1: facturacionFormData.folio1 || null,
          folio_factura_2: facturacionFormData.folio2 || null,
          folio_factura_3: facturacionFormData.folio3 || null,
          folio_factura_4: facturacionFormData.folio4 || null,
          cantidad_final_facturada: facturacionFormData.cantidadFinalFacturada || null,
          observaciones_facturacion: facturacionFormData.observacionesFacturacion || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarqueDetalle.id)

      if (error) {
        console.error("Error actualizando información de facturación:", error)
        alert("Error al guardar la información de facturación")
        return
      }

      const embarquesActualizados = embarquesAsignados.map((embarque) =>
        embarque.id === embarqueDetalle.id
          ? {
              ...embarque,
              foliosFactura: {
                folio1: facturacionFormData.folio1,
                folio2: facturacionFormData.folio2,
                folio3: facturacionFormData.folio3,
                folio4: facturacionFormData.folio4,
              },
              cantidadFinalFacturada: facturacionFormData.cantidadFinalFacturada,
              observacionesFacturacion: facturacionFormData.observacionesFacturacion,
            }
          : embarque,
      )

      setEmbarquesAsignados(embarquesActualizados)
      localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))

      setEmbarqueDetalle({
        ...embarqueDetalle,
        foliosFactura: {
          folio1: facturacionFormData.folio1,
          folio2: facturacionFormData.folio2,
          folio3: facturacionFormData.folio3,
          folio4: facturacionFormData.folio4,
        },
        cantidadFinalFacturada: facturacionFormData.cantidadFinalFacturada,
        observacionesFacturacion: facturacionFormData.observacionesFacturacion,
      })

      setShowFacturacionEditModal(false)
      alert("Información de facturación actualizada exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar la información de facturación")
    }
  }

  const [showClientesModal, setShowClientesModal] = useState(false)
  const [clientesTab, setClientesTab] = useState("porCliente")
  const [clientesPeriodo, setClientesPeriodo] = useState({
    desde: "",
    hasta: "",
  })
  const [clienteSeleccionado, setClienteSeleccionado] = useState("")

  const operacionesPorPeriodo = embarquesAsignados.filter((e) => {
    if (!clientesPeriodo.desde && !clientesPeriodo.hasta) return true
    const fecha = new Date(e.fechaAsignacion)
    const desde = clientesPeriodo.desde ? new Date(clientesPeriodo.desde) : null
    const hasta = clientesPeriodo.hasta ? new Date(clientesPeriodo.hasta) : null
    if (desde && fecha < desde) return false
    if (hasta && fecha > hasta) return false
    return true
  })

  const operacionesPorCliente = clientes
    .map((cliente) => ({
      cliente,
      operaciones: operacionesPorPeriodo.filter((e) => e.clienteNombre === cliente.nombre),
    }))
    .filter((c) => c.operaciones.length > 0)

  const operacionesPorTipoServicio = tiposServicio
    .map((tipo) => ({
      tipo,
      operaciones: operacionesPorPeriodo.filter((e) => e.tipoServicio === tipo.nombre),
    }))
    .filter((t) => t.operaciones.length > 0)

  const guardarDivisionPagoContingencia = async (embarque: EmbarqueAsignado) => {
    const currentDivision = operadoresContingencia[embarque.id]
    if (!currentDivision) {
      alert("No hay división de pago para guardar.")
      return
    }

    const originalOperatorId = embarque.operadorOriginalId || embarque.operadorAsignado?.id
    const replacementOperatorId = embarque.operadorReemplazoId

    if (!originalOperatorId && !replacementOperatorId) {
      alert("No se pudo identificar a los operadores para guardar la división de pago.")
      return
    }

    try {
      const { error } = await supabase.from("operador_pagos_contingencia").upsert(
        {
          embarque_id: embarque.id,
          operador_original_id: originalOperatorId,
          operador_reemplazo_id: replacementOperatorId,
          monto_original: currentDivision.original,
          monto_reemplazo: currentDivision.reemplazo,
          registrado_por: "Usuario Actual",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "embarque_id" },
      )

      if (error) {
        console.error("Error guardando división de pago de contingencia:", error)
        alert("Error al guardar la división de pago: " + error.message)
      } else {
        alert("División de pago guardada exitosamente.")
        setContingencyPaymentsDb((prev) => ({
          ...prev,
          [embarque.id]: {
            monto_original: currentDivision.original,
            monto_reemplazo: currentDivision.reemplazo,
            operador_original_id: originalOperatorId || "",
            operador_reemplazo_id: replacementOperatorId || "",
          },
        }))
      }
    } catch (error) {
      console.error("Error en guardarDivisionPagoContingencia:", error)
      alert("Error al guardar la división de pago.")
    }
  }

  useEffect(() => {
    if (!showAnalisisOperadoresModal || embarquesModificadosIds.length === 0) {
      return
    }

    const loadContingencyPayments = async () => {
      try {
        const { data, error } = await supabase
          .from("operador_pagos_contingencia")
          .select("*")
          .in("embarque_id", embarquesModificadosIds)

        if (error) {
          console.error("Error cargando pagos de contingencia:", error)
          return
        }

        const paymentsMap: typeof contingencyPaymentsDb = {}
        data.forEach((payment) => {
          paymentsMap[payment.embarque_id] = {
            monto_original: payment.monto_original,
            monto_reemplazo: payment.monto_reemplazo,
            operador_original_id: payment.operador_original_id,
            operador_reemplazo_id: payment.operador_reemplazo_id,
          }
        })
        setContingencyPaymentsDb(paymentsMap)

        const initialContingencyState: typeof operadoresContingencia = {}
        data.forEach((payment) => {
          initialContingencyState[payment.embarque_id] = {
            original: payment.monto_original,
            reemplazo: payment.monto_reemplazo,
          }
        })
        setOperadoresContingencia(initialContingencyState)
      } catch (error) {
        console.error("Error en loadContingencyPayments:", error)
      }
    }

    loadContingencyPayments()
  }, [showAnalisisOperadoresModal, embarquesModificadosIds])

  const consultarPagosOperador = useCallback(async () => {
    setLoadingPagos(true)
    setEmbarquesOperadorFiltrados([])
    try {
      let query = supabase
        .from("embarques")
        .select(
          `
        *,
        cliente:clientes(nombre),
        operador:operadores(id, nombre, apellidos),
        tipo_servicio:tipos_servicio(nombre, precio_base)
      `,
        )
        .eq("estado", "finalizado")
        .neq("estado_facturacion", "archivado")

      if (filtroPagosOperadorId && filtroPagosOperadorId !== "todos") {
        query = query.eq("operador_id", filtroPagosOperadorId)
      }

      if (fechaInicioPagos) {
        query = query.gte("fecha_creacion", fechaInicioPagos)
      }
      if (fechaFinPagos) {
        query = query.lte("fecha_creacion", fechaFinPagos)
      }

      const { data, error } = await query.order("fecha_creacion", { ascending: false })

      if (error) {
        console.error("Error al consultar pagos de operador:", error)
        alert("Error al consultar pagos de operador: " + error.message)
        setEmbarquesOperadorFiltrados([])
        return
      }

      const embarquesFormateados: EmbarqueAsignado[] = await Promise.all(
        (data || []).map(async (embarque: any) => {
          const formattedEmbarque: EmbarqueAsignado = {
            ...embarque,
            clienteNombre: embarque.cliente?.nombre || "Cliente no especificado",
            operadorAsignado: embarque.operador
              ? {
                  id: embarque.operador.id,
                  nombre: `${embarque.operador.nombre} ${embarque.operador.apellidos || ""}`.trim(),
                }
              : { id: "", nombre: "Sin asignar" },
            tipoServicioNombre: embarque.tipo_servicio?.nombre || "Sin especificar",
            pagoOperador: embarque.tipo_servicio?.precio_base || 0,
            fechaAsignacion: embarque.fecha_creacion,
            modificadoPorEmergencia: embarquesModificadosIds.includes(embarque.id),
          }

          if (formattedEmbarque.modificadoPorEmergencia) {
            // Fetch modification details
            const { data: modData, error: modError } = await supabase
              .from("embarque_modificaciones")
              .select("operador_original_id, operador_original_nombre, operador_nuevo_id, operador_nuevo_nombre, razon")
              .eq("embarque_id", embarque.id)
              .order("fecha_modificacion", { ascending: false })
              .limit(1)
              .single()

            if (modError && modError.code !== "PGRST116") {
              console.error("Error fetching modification details:", modError)
            } else if (modData) {
              formattedEmbarque.operadorOriginalId = modData.operador_original_id
              formattedEmbarque.operadorOriginalNombre = modData.operador_original_nombre
              formattedEmbarque.operadorReemplazoId = modData.operador_nuevo_id
              formattedEmbarque.operadorReemplazoNombre = modData.operador_nuevo_nombre
              formattedEmbarque.motivoModificacion = modData.razon
            }

            // Fetch existing contingency payment
            const { data: contingencyPaymentData, error: contingencyPaymentError } = await supabase
              .from("operador_pagos_contingencia")
              .select("monto_original, monto_reemplazo")
              .eq("embarque_id", embarque.id)
              .single()

            if (contingencyPaymentError && contingencyPaymentError.code !== "PGRST116") {
              console.error("Error fetching contingency payment:", contingencyPaymentError)
            } else if (contingencyPaymentData) {
              formattedEmbarque.montoOriginalContingencia = contingencyPaymentData.monto_original
              formattedEmbarque.montoReemplazoContingencia = contingencyPaymentData.monto_reemplazo
            } else {
              // Default split if no contingency payment recorded yet
              formattedEmbarque.montoOriginalContingencia = formattedEmbarque.pagoOperador
              formattedEmbarque.montoReemplazoContingencia = 0
            }
          }
          return formattedEmbarque
        }),
      )

      setEmbarquesOperadorFiltrados(embarquesFormateados)

      // Initialize contingency payment state for the modal
      const initialContingencyState: typeof operadoresContingencia = {}
      embarquesFormateados.forEach((e) => {
        if (e.modificadoPorEmergencia) {
          initialContingencyState[e.id] = {
            original: e.montoOriginalContingencia || 0,
            reemplazo: e.montoReemplazoContingencia || 0,
          }
        }
      })
      setOperadoresContingencia(initialContingencyState)
    } catch (error) {
      console.error("Excepción al consultar pagos de operador:", error)
      alert("Error inesperado al consultar pagos de operador.")
    } finally {
      setLoadingPagos(false)
    }
  }, [filtroPagosOperadorId, fechaInicioPagos, fechaFinPagos, embarquesModificadosIds, tiposServicio]) // Add dependencies

  // Effect to re-run consultaPagosOperador when modal opens
  useEffect(() => {
    if (showPagosOperadoresModal) {
      consultarPagosOperador()
    }
  }, [showPagosOperadoresModal, consultarPagosOperador])

  const handleContingencyPaymentChange = (
    embarqueId: string,
    field: "original" | "reemplazo",
    value: number,
    basePayment: number,
  ) => {
    setOperadoresContingencia((prev) => {
      const current = prev[embarqueId] || { original: 0, reemplazo: 0 }
      let newOriginal = current.original
      let newReemplazo = current.reemplazo

      if (field === "original") {
        newOriginal = value
        newReemplazo = basePayment - value
      } else {
        newReemplazo = value
        newOriginal = basePayment - value
      }

      return {
        ...prev,
        [embarqueId]: {
          original: newOriginal,
          reemplazo: newReemplazo,
        },
      }
    })
  }

  const saveContingencyPayment = async (embarque: EmbarqueAsignado) => {
    const currentDivision = operadoresContingencia[embarque.id]
    if (!currentDivision) {
      alert("No hay división de pago para guardar.")
      return
    }

    const totalSum = currentDivision.original + currentDivision.reemplazo
    if (Math.abs(totalSum - (embarque.pagoOperador || 0)) > 0.01) {
      // Allow for small floating point inaccuracies
      alert("La suma de los pagos no coincide con el pago base del embarque. Por favor, ajusta los montos.")
      return
    }

    try {
      const { error } = await supabase.from("operador_pagos_contingencia").upsert(
        {
          embarque_id: embarque.id,
          operador_original_id: embarque.operadorOriginalId || embarque.operadorAsignado?.id,
          operador_reemplazo_id: embarque.operadorReemplazoId,
          monto_original: currentDivision.original,
          monto_reemplazo: currentDivision.reemplazo,
          fecha_registro: new Date().toISOString(), // Use current date for registration
          registrado_por: "Usuario Actual", // Replace with actual authenticated user
          updated_at: new Date().toISOString(),
        },
        { onConflict: "embarque_id", ignoreDuplicates: false },
      )

      if (error) {
        console.error("Error guardando división de pago de contingencia:", error)
        alert("Error al guardar la división de pago: " + error.message)
      } else {
        alert("División de pago guardada exitosamente.")
        // Optionally, refresh the list or update the specific embarque in state
        setEmbarquesOperadorFiltrados((prev) =>
          prev.map((e) =>
            e.id === embarque.id
              ? {
                  ...e,
                  montoOriginalContingencia: currentDivision.original,
                  montoReemplazoContingencia: currentDivision.reemplazo,
                }
              : e,
          ),
        )
      }
    } catch (error) {
      console.error("Error en saveContingencyPayment:", error)
      alert("Error inesperado al guardar la división de pago.")
    }
  }

  const handlePeriodoPagosChange = (value: string) => {
    setFiltroPeriodoPagos(value)
    const hoy = new Date()
    let inicio = ""
    let fin = ""

    if (value === "current_month") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10)
    } else if (value === "last_month") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10)
      fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().slice(0, 10)
    } else if (value === "last_2_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10) // Start of last month
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10) // End of current month
    } else if (value === "last_3_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1).toISOString().slice(0, 10) // Start of 2 months ago
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10) // End of current month
    } else if (value === "last_6_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1).toISOString().slice(0, 10) // Start of 5 months ago
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10) // End of current month
    } else {
      // "custom" or "todos"
      inicio = ""
      fin = ""
    }
    setFechaInicioPagos(inicio)
    setFechaFinPagos(fin)
  }

  const operadorDesgloseData = useMemo(() => {
    const desgloseMap = new Map<
      string,
      {
        operador: { id: string; nombre: string }
        totalPagos: number
        totalPagosMesActual: number
        cantidadEmbarques: number
        embarquesContingencia: number
      }
    >()

    const hoy = new Date()
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const finMesActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    finMesActual.setHours(23, 59, 59, 999)

    embarquesOperadorFiltrados.forEach((embarque) => {
      const operadorId = embarque.operadorAsignado?.id || "unknown"
      const operadorNombre = embarque.operadorAsignado?.nombre || "Sin asignar"
      // Use the split payment if it exists, otherwise use the base payment
      const pago = embarque.modificadoPorEmergencia
        ? (operadoresContingencia[embarque.id]?.original || 0) + (operadoresContingencia[embarque.id]?.reemplazo || 0)
        : embarque.pagoOperador || 0

      if (!desgloseMap.has(operadorId)) {
        desgloseMap.set(operadorId, {
          operador: { id: operadorId, nombre: operadorNombre },
          totalPagos: 0,
          totalPagosMesActual: 0,
          cantidadEmbarques: 0,
          embarquesContingencia: 0,
        })
      }
      const data = desgloseMap.get(operadorId)!
      data.totalPagos += pago
      data.cantidadEmbarques++
      if (embarque.modificadoPorEmergencia) {
        data.embarquesContingencia++
      }

      const fechaEmbarque = new Date(embarque.fechaAsignacion!)
      if (fechaEmbarque >= inicioMesActual && fechaEmbarque <= finMesActual) {
        data.totalPagosMesActual += pago
      }
    })
    return Array.from(desgloseMap.values())
  }, [embarquesOperadorFiltrados, operadoresContingencia])

  const exportarDesgloseOperadoresExcel = () => {
    let csv = "Operador,Total Pagos,Total Pagos Mes Actual,Cantidad Embarques,Casos Contingencia\n"
    operadorDesgloseData.forEach((data) => {
      csv += `${data.operador.nombre},${data.totalPagos},${data.totalPagosMesActual},${data.cantidadEmbarques},${data.embarquesContingencia}\n`
    })
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "desglose_operadores.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPagosFiltrados = useMemo(() => {
    return embarquesOperadorFiltrados.reduce((sum, embarque) => {
      const pago = embarque.modificadoPorEmergencia
        ? (operadoresContingencia[embarque.id]?.original || 0) + (operadoresContingencia[embarque.id]?.reemplazo || 0)
        : embarque.pagoOperador || 0
      return sum + pago
    }, 0)
  }, [embarquesOperadorFiltrados, operadoresContingencia])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facturación / Cobranza</h1>
            <p className="text-gray-600 mt-2">
              Consultar embarques finalizados desde Asignación de Embarques, generar reportes y gestionar facturación
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={generarReporteExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar Reportes
            </Button>
            <Button onClick={() => setShowAnalisisOperadoresModal(true)} variant="outline">
              <Users className="h-4 w-4 mr-2 text-green-700" />
              Análisis Operadores
            </Button>
            <Button onClick={() => setShowPagosOperadoresModal(true)} variant="outline">
              <DollarSign className="h-4 w-4 mr-2 text-blue-700" />
              Pagos
            </Button>
            {/* Modal Análisis de Operadores */}
            <Dialog open={showAnalisisOperadoresModal} onOpenChange={setShowAnalisisOperadoresModal}>
              <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Análisis de Operadores - Pagos y Rendimiento</DialogTitle>
                  <DialogDescription>
                    Consultar embarques asignados por operador, calcular pagos por tipo de servicio y gestionar casos de
                    contingencia
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Input
                    type="date"
                    value={fechaInicioAnalisis}
                    onChange={(e) => setFechaInicioAnalisis(e.target.value)}
                    className="w-36"
                    placeholder="Desde"
                  />
                  <Input
                    type="date"
                    value={fechaFinAnalisis}
                    onChange={(e) => setFechaFinAnalisis(e.target.value)}
                    className="w-36"
                    placeholder="Hasta"
                  />
                  <select
                    value={filtroAnalisisOperador}
                    onChange={(e) => setFiltroAnalisisOperador(e.target.value)}
                    className="border rounded px-2 py-1"
                    disabled={loadingEmbarques}
                  >
                    <option value="todos">Todos los operadores</option>
                    {operadoresUnicos.map((operador) => (
                      <option key={operador?.id} value={operador?.nombre}>
                        {operador?.nombre}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={generarAnalisisOperadores}
                    variant="default"
                    disabled={loadingEmbarques || loadingTiposServicio || loadingAnalisis}
                  >
                    {loadingAnalisis ? "Generando..." : "Generar Análisis"}
                  </Button>
                  <Button onClick={() => setPeriodoActual("mes")} variant="outline">
                    Mes actual
                  </Button>
                  <Button onClick={() => setPeriodoActual("año")} variant="outline">
                    Año actual
                  </Button>
                  <Button
                    onClick={exportarAnalisisExcel}
                    variant="outline"
                    disabled={!analisisData.embarquesFiltradosAnalisis.length}
                  >
                    Exportar Excel
                  </Button>
                </div>
                {loadingAnalisis ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Generando análisis...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-2 mb-4">
                      <Button
                        variant={activeAnalisisTab === "resumen" ? "default" : "outline"}
                        onClick={() => setActiveAnalisisTab("resumen")}
                      >
                        Resumen
                      </Button>
                      <Button
                        variant={activeAnalisisTab === "porOperador" ? "default" : "outline"}
                        onClick={() => setActiveAnalisisTab("porOperador")}
                      >
                        Por Operador
                      </Button>
                      <Button
                        variant={activeAnalisisTab === "detalle" ? "default" : "outline"}
                        onClick={() => setActiveAnalisisTab("detalle")}
                      >
                        Detalle
                      </Button>
                      <Button
                        variant={activeAnalisisTab === "contingencia" ? "default" : "outline"}
                        onClick={() => setActiveAnalisisTab("contingencia")}
                      >
                        Casos de Contingencia
                      </Button>
                    </div>
                    {analisisData.resumenGeneral === null && (
                      <div className="text-center py-8 text-gray-500">
                        Por favor, haz clic en "Generar Análisis" para ver los datos.
                      </div>
                    )}
                    {activeAnalisisTab === "resumen" && analisisData.resumenGeneral && (
                      <div className="mb-6">
                        <h3 className="font-bold text-lg mb-2">Resumen General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-gray-700 font-medium">Total Operadores</p>
                            <p className="text-2xl font-bold text-blue-700">{analisisData.resumenGeneral.operadores}</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-gray-700 font-medium">Total Embarques</p>
                            <p className="text-2xl font-bold text-green-700">
                              {analisisData.resumenGeneral.totalEmbarques}
                            </p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-gray-700 font-medium">Total a Pagar MXN</p>
                            <p className="text-2xl font-bold text-purple-700">
                              ${analisisData.resumenGeneral.totalPagos.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-orange-800">Casos Contingencia</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {analisisData.resumenGeneral.casosContingencia || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeAnalisisTab === "porOperador" && analisisData.analisisPorOperador.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-lg mb-2">Pagos y Embarques por Operador</h3>
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">Operador</th>
                                <th className="px-2 py-1 text-left">Total Pagos</th>
                                <th className="px-2 py-1 text-left">Cantidad Embarques</th>
                                <th className="px-2 py-1 text-left">Contingencia</th>
                                <th className="px-2 py-1 text-left">Promedio/Embarque</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analisisData.analisisPorOperador.map((op: any) => (
                                <tr key={op.nombre} className="border-b">
                                  <td className="px-2 py-1">{op.nombre}</td>
                                  <td className="px-2 py-1">${op.totalPagos.toLocaleString()}</td>
                                  <td className="px-2 py-1">{op.cantidadEmbarques}</td>
                                  <td className="px-2 py-1">
                                    {op.embarquesContingencia > 0 ? (
                                      <Badge variant="destructive">{op.embarquesContingencia}</Badge>
                                    ) : (
                                      "0"
                                    )}
                                  </td>
                                  <td className="px-2 py-1">${op.promedioPorEmbarque.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {activeAnalisisTab === "detalle" && analisisData.embarquesFiltradosAnalisis.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-lg mb-2">Detalle de Embarques por Operador</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">Folio</th>
                                <th className="px-2 py-1 text-left">Operador</th>
                                <th className="px-2 py-1 text-left">Cliente</th>
                                <th className="px-2 py-1 text-left">Fecha</th>
                                <th className="px-2 py-1 text-left">Tipo Servicio</th>
                                <th className="px-2 py-1 text-left">Pago Operador</th>
                                <th className="px-2 py-1 text-left">Contingencia</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analisisData.embarquesFiltradosAnalisis.map((e: any) => (
                                <tr key={e.id} className="border-b">
                                  <td className="px-2 py-1">{e.folio}</td>
                                  <td className="px-2 py-1">{e.operadorAsignado?.nombre}</td>
                                  <td className="px-2 py-1">{e.clienteNombre}</td>
                                  <td className="px-2 py-1">{e.fechaAsignacion}</td>
                                  <td className="px-2 py-1">{e.tipoServicioNombre}</td>
                                  <td className="px-2 py-1">${e.pagoOperador?.toLocaleString?.() ?? ""}</td>
                                  <td className="px-2 py-1">
                                    {e.modificadoPorEmergencia ? <Badge variant="destructive">Sí</Badge> : "No"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {activeAnalisisTab === "contingencia" &&
                      analisisData.embarquesFiltradosAnalisis.filter((e) => embarquesModificadosIds.includes(e.id))
                        .length > 0 && (
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-800">Gestión de Casos de Contingencia</h3>

                          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <h4 className="font-semibold text-orange-900 mb-2">¿Qué son los casos de contingencia?</h4>
                            <p className="text-sm text-orange-800 mb-2">
                              Los casos de contingencia ocurren cuando un embarque asignado originalmente a un operador
                              debe ser reasignado a otro operador por situaciones de emergencia (enfermedad, accidente,
                              etc.).
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              • <strong>Operador Original:</strong> Quien tenía la asignación inicial del embarque
                              <br />• <strong>Operador de Reemplazo:</strong> Quien finalmente realizó el embarque
                              <br />• <strong>División de Pago:</strong> Puedes asignar manualmente cómo dividir el pago
                              entre ambos operadores
                            </p>
                          </div>

                          {/* Casos de contingencia encontrados */}
                          {analisisData.embarquesFiltradosAnalisis && (
                            <div className="space-y-4">
                              {analisisData.embarquesFiltradosAnalisis
                                .filter((e) => embarquesModificadosIds.includes(e.id))
                                .map((embarque: EmbarqueAsignado) => (
                                  <Card key={embarque.id} className="border-red-300 bg-red-50">
                                    <CardHeader>
                                      <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg text-red-800 flex items-center">
                                          <AlertTriangle className="h-5 w-5 mr-2" />
                                          Caso de Contingencia - {embarque.folio}
                                        </CardTitle>
                                        <Badge variant="destructive">Requiere Atención</Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Información del embarque */}
                                        <div>
                                          <h4 className="font-medium text-gray-700 mb-3">Información del Embarque</h4>
                                          <div className="space-y-2 text-sm">
                                            <p>
                                              <strong>Cliente:</strong> {embarque.clienteNombre}
                                            </p>
                                            <p>
                                              <strong>Fecha:</strong>{" "}
                                              {new Date(embarque.fechaAsignacion).toLocaleDateString("es-MX")}
                                            </p>
                                            <p>
                                              <strong>Tipo de Servicio:</strong>{" "}
                                              {embarque.tipoServicioNombre || "Sin especificar"}
                                            </p>
                                            <p>
                                              <strong>Pago Base:</strong> $
                                              {embarque.pagoOperador?.toLocaleString() || 0}
                                            </p>
                                            {embarque.motivoModificacion && (
                                              <p>
                                                <strong>Motivo:</strong> {embarque.motivoModificacion}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Gestión de operadores */}
                                        <div>
                                          <h4 className="font-medium text-gray-700 mb-3">Gestión de Operadores</h4>
                                          <div className="space-y-4">
                                            {/* Operador Original */}
                                            <div className="bg-white p-3 rounded border">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                  Operador Original:
                                                </span>
                                                <Badge variant="outline">Original</Badge>
                                              </div>
                                              <p className="text-sm text-gray-600 mb-2">
                                                {embarque.operadorOriginalNombre ||
                                                  embarque.operadorAsignado?.nombre ||
                                                  "No especificado"}
                                              </p>
                                              <div className="flex items-center space-x-2">
                                                <Label htmlFor={`pago-original-${embarque.id}`} className="text-xs">
                                                  Pago:
                                                </Label>
                                                <Input
                                                  type="number"
                                                  id={`pago-original-${embarque.id}`}
                                                  value={operadoresContingencia[embarque.id]?.original || 0}
                                                  onChange={(e) => {
                                                    const valor = Number(e.target.value)
                                                    if (!isNaN(valor)) {
                                                      handleContingencyPaymentChange(
                                                        embarque.id,
                                                        "original",
                                                        valor,
                                                        embarque.pagoOperador || 0,
                                                      )
                                                    }
                                                  }}
                                                  className="w-24 text-right"
                                                />
                                              </div>
                                            </div>

                                            {/* Operador de Reemplazo */}
                                            <div className="bg-white p-3 rounded border">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                  Operador de Reemplazo:
                                                </span>
                                                <Badge variant="default">Reemplazo</Badge>
                                              </div>
                                              <p className="text-sm text-gray-600 mb-2">
                                                {embarque.operadorReemplazoNombre ||
                                                  embarque.usuarioModificacion ||
                                                  "No especificado"}
                                              </p>
                                              <div className="flex items-center space-x-2">
                                                <Label htmlFor={`pago-reemplazo-${embarque.id}`} className="text-xs">
                                                  Pago:
                                                </Label>
                                                <Input
                                                  type="number"
                                                  id={`pago-reemplazo-${embarque.id}`}
                                                  value={operadoresContingencia[embarque.id]?.reemplazo || 0}
                                                  onChange={(e) => {
                                                    const valor = Number(e.target.value)
                                                    if (!isNaN(valor)) {
                                                      handleContingencyPaymentChange(
                                                        embarque.id,
                                                        "reemplazo",
                                                        valor,
                                                        embarque.pagoOperador || 0,
                                                      )
                                                    }
                                                  }}
                                                  className="w-24 text-right"
                                                />
                                              </div>
                                            </div>

                                            {/* Resumen de la división */}
                                            <div className="bg-gray-100 p-3 rounded border border-gray-200">
                                              <p className="text-sm font-medium text-gray-700">
                                                Total División: $
                                                {(
                                                  (operadoresContingencia[embarque.id]?.original || 0) +
                                                  (operadoresContingencia[embarque.id]?.reemplazo || 0)
                                                ).toLocaleString()}
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                Pago base del embarque: ${(embarque.pagoOperador || 0).toLocaleString()}
                                              </p>
                                              {(operadoresContingencia[embarque.id]?.original || 0) +
                                                (operadoresContingencia[embarque.id]?.reemplazo || 0) !==
                                                (embarque.pagoOperador || 0) && (
                                                <p className="text-xs text-red-600 font-semibold mt-1">
                                                  La suma no coincide con el pago base.
                                                </p>
                                              )}
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                              <Button
                                                size="sm"
                                                onClick={() => saveContingencyPayment(embarque)}
                                                disabled={
                                                  Math.abs(
                                                    (operadoresContingencia[embarque.id]?.original || 0) +
                                                      (operadoresContingencia[embarque.id]?.reemplazo || 0) -
                                                      (embarque.pagoOperador || 0),
                                                  ) > 0.01
                                                }
                                              >
                                                <Save className="h-4 w-4 mr-2" />
                                                Guardar División de Pago
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    {activeAnalisisTab === "contingencia" &&
                      analisisData.embarquesFiltradosAnalisis.filter((e) => embarquesModificadosIds.includes(e.id))
                        .length === 0 &&
                      analisisData.resumenGeneral && (
                        <div className="text-center py-8 text-gray-500">
                          No se encontraron casos de contingencia para el período y filtros seleccionados.
                        </div>
                      )}
                  </>
                )}
              </DialogContent>
            </Dialog>
            {/* NUEVO MODAL: Pagos de Operadores */}
            <Dialog open={showPagosOperadoresModal} onOpenChange={setShowPagosOperadoresModal}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Pagos a Operadores</DialogTitle>
                  <DialogDescription>
                    Consulta los embarques asignados a un operador en un rango de fechas para gestionar sus pagos.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap gap-2 mb-4 items-end">
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="select-operador-pagos">Operador</Label>
                    <Select
                      value={filtroPagosOperadorId}
                      onValueChange={(value) => setFiltroPagosOperadorId(value)}
                      disabled={loadingEmbarques}
                    >
                      <SelectTrigger id="select-operador-pagos">
                        <SelectValue placeholder="Selecciona un operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los operadores</SelectItem>
                        {operadoresUnicos
                          .filter((operador) => operador?.id)
                          .map((operador) => (
                            <SelectItem key={operador.id} value={operador.id}>
                              {operador.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label htmlFor="filtro-periodo-pagos">Periodo</Label>
                    <Select value={filtroPeriodoPagos} onValueChange={handlePeriodoPagosChange}>
                      <SelectTrigger id="filtro-periodo-pagos">
                        <SelectValue placeholder="Selecciona un periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Personalizado</SelectItem>
                        <SelectItem value="current_month">Mes actual</SelectItem>
                        <SelectItem value="last_month">Mes anterior</SelectItem>
                        <SelectItem value="last_2_months">Últimos 2 meses</SelectItem>
                        <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                        <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label htmlFor="fecha-inicio-pagos">Desde</Label>
                    <Input
                      type="date"
                      id="fecha-inicio-pagos"
                      value={fechaInicioPagos}
                      onChange={(e) => {
                        setFechaInicioPagos(e.target.value)
                        setFiltroPeriodoPagos("custom")
                      }}
                      disabled={filtroPeriodoPagos !== "custom"}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label htmlFor="fecha-fin-pagos">Hasta</Label>
                    <Input
                      type="date"
                      id="fecha-fin-pagos"
                      value={fechaFinPagos}
                      onChange={(e) => {
                        setFechaFinPagos(e.target.value)
                        setFiltroPeriodoPagos("custom")
                      }}
                      disabled={filtroPeriodoPagos !== "custom"}
                    />
                  </div>
                  <Button onClick={consultarPagosOperador} disabled={loadingPagos}>
                    {loadingPagos ? "Consultando..." : "Iniciar Consulta"}
                  </Button>
                </div>

                <Tabs value={activePagosTab} onValueChange={setActivePagosTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="detalle">Detalle de Embarques</TabsTrigger>
                    <TabsTrigger value="desglose">Desglose Individual por Operador</TabsTrigger>
                  </TabsList>
                  <TabsContent value="detalle">
                    {loadingPagos ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Cargando embarques...</span>
                      </div>
                    ) : embarquesOperadorFiltrados.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No se encontraron embarques para los filtros seleccionados.
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 text-right text-lg font-bold text-gray-800">
                          Total Pagos Filtrados: ${totalPagosFiltrados.toLocaleString()}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">Folio</th>
                                <th className="px-2 py-1 text-left">Cliente</th>
                                <th className="px-2 py-1 text-left">Tipo de Servicio</th>
                                <th className="px-2 py-1 text-left">Fecha Asignación</th>
                                <th className="px-2 py-1 text-left">Pago Base</th>
                                <th className="px-2 py-1 text-left">Contingencia</th>
                                <th className="px-2 py-1 text-left">Operador Original</th>
                                <th className="px-2 py-1 text-left">Pago Original</th>
                                <th className="px-2 py-1 text-left">Operador Reemplazo</th>
                                <th className="px-2 py-1 text-left">Pago Reemplazo</th>
                                <th className="px-2 py-1 text-left">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {embarquesOperadorFiltrados.map((embarque) => (
                                <tr key={embarque.id} className="border-b">
                                  <td className="px-2 py-1">{embarque.folio}</td>
                                  <td className="px-2 py-1">{embarque.clienteNombre}</td>
                                  <td className="px-2 py-1">{embarque.tipoServicioNombre}</td>
                                  <td className="px-2 py-1">
                                    {new Date(embarque.fechaAsignacion!).toLocaleDateString()}
                                  </td>
                                  <td className="px-2 py-1">${embarque.pagoOperador?.toLocaleString()}</td>
                                  <td className="px-2 py-1">
                                    {embarque.modificadoPorEmergencia ? <Badge variant="destructive">Sí</Badge> : "No"}
                                  </td>
                                  {embarque.modificadoPorEmergencia ? (
                                    <>
                                      <td className="px-2 py-1 text-xs">
                                        {embarque.operadorOriginalNombre || embarque.operadorAsignado?.nombre}
                                      </td>
                                      <td className="px-2 py-1">
                                        <Input
                                          type="number"
                                          value={operadoresContingencia[embarque.id]?.original || 0}
                                          onChange={(e) => {
                                            const val = Number(e.target.value)
                                            if (!isNaN(val))
                                              handleContingencyPaymentChange(
                                                embarque.id,
                                                "original",
                                                val,
                                                embarque.pagoOperador || 0,
                                              )
                                          }}
                                          className="w-24 text-right text-xs"
                                        />
                                      </td>
                                      <td className="px-2 py-1 text-xs">{embarque.operadorReemplazoNombre || "N/A"}</td>
                                      <td className="px-2 py-1">
                                        <Input
                                          type="number"
                                          value={operadoresContingencia[embarque.id]?.reemplazo || 0}
                                          onChange={(e) => {
                                            const val = Number(e.target.value)
                                            if (!isNaN(val))
                                              handleContingencyPaymentChange(
                                                embarque.id,
                                                "reemplazo",
                                                val,
                                                embarque.pagoOperador || 0,
                                              )
                                          }}
                                          className="w-24 text-right text-xs"
                                        />
                                      </td>
                                      <td className="px-2 py-1">
                                        <Button
                                          size="sm"
                                          onClick={() => saveContingencyPayment(embarque)}
                                          disabled={
                                            Math.abs(
                                              (operadoresContingencia[embarque.id]?.original || 0) +
                                                (operadoresContingencia[embarque.id]?.reemplazo || 0) -
                                                (embarque.pagoOperador || 0),
                                            ) > 0.01
                                          }
                                        >
                                          <Save className="h-3 w-3" />
                                        </Button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-2 py-1" colSpan={5}>
                                        {embarque.operadorAsignado?.nombre}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="desglose">
                    {loadingPagos ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Calculando desglose...</span>
                      </div>
                    ) : operadorDesgloseData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No se encontraron datos de desglose para los filtros seleccionados.
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-end mb-4">
                          <Button onClick={exportarDesgloseOperadoresExcel} variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar Desglose Excel
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">Operador</th>
                                <th className="px-2 py-1 text-left">Total Pagos (Periodo Filtrado)</th>
                                <th className="px-2 py-1 text-left">Total Pagos (Mes Actual)</th>
                                <th className="px-2 py-1 text-left">Cantidad Embarques</th>
                                <th className="px-2 py-1 text-left">Casos Contingencia</th>
                              </tr>
                            </thead>
                            <tbody>
                              {operadorDesgloseData.map((data) => (
                                <tr key={data.operador.id} className="border-b">
                                  <td className="px-2 py-1 font-medium">{data.operador.nombre}</td>
                                  <td className="px-2 py-1">${data.totalPagos.toLocaleString()}</td>
                                  <td className="px-2 py-1">${data.totalPagosMesActual.toLocaleString()}</td>
                                  <td className="px-2 py-1">{data.cantidadEmbarques}</td>
                                  <td className="px-2 py-1">
                                    {data.embarquesContingencia > 0 ? (
                                      <Badge variant="destructive">{data.embarquesContingencia}</Badge>
                                    ) : (
                                      "0"
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setShowArchivadosModal(true)} variant="outline">
              <Package className="h-4 w-4 mr-2 text-purple-600" />
              Archivados
            </Button>
          </div>

          {/* Modal Embarques Archivados */}
          <Dialog open={showArchivadosModal} onOpenChange={setShowArchivadosModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Embarques Archivados</DialogTitle>
                <DialogDescription>
                  Consulta todos los embarques archivados para consulta histórica y auditoría.
                </DialogDescription>
              </DialogHeader>
              {loadingArchivados ? (
                <div className="py-8 text-center text-gray-500">Cargando embarques archivados...</div>
              ) : embarquesArchivados.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No hay embarques archivados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left">Folio</th>
                        <th className="px-2 py-1 text-left">Cliente</th>
                        <th className="px-2 py-1 text-left">Load</th>
                        <th className="px-2 py-1 text-left">Valor Facturado</th>
                        <th className="px-2 py-1 text-left">Fecha Pago Factura</th>
                        <th className="px-2 py-1 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {embarquesArchivados.map((embarque) => (
                        <tr key={embarque.id} className="border-b">
                          <td className="px-2 py-1">{embarque.folio}</td>
                          <td className="px-2 py-1">{embarque.clienteNombre}</td>
                          <td className="px-2 py-1">{embarque.load_number}</td>
                          <td className="px-2 py-1">
                            ${embarque.precioFlete?.toLocaleString() || 0}
                            {embarque.moneda_flete ? ` ${embarque.moneda_flete}` : ""}
                          </td>
                          <td className="px-2 py-1">
                            {embarque.fecha_pago ? new Date(embarque.fecha_pago).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-2 py-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEmbarqueDetalle(embarque)
                                setShowDetailModal(true)
                              }}
                            >
                              Ver Detalles
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={showClientesModal} onOpenChange={setShowClientesModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Operaciones por Cliente</DialogTitle>
                <DialogDescription>
                  Visualiza todas las operaciones realizadas por cliente, por periodo y por tipo de servicio. Puedes ver
                  si la factura ya fue pagada o no.
                </DialogDescription>
              </DialogHeader>
              <div className="mb-4">
                <div className="flex space-x-2 border-b mb-4">
                  <button
                    className={`px-4 py-2 font-semibold ${
                      clientesTab === "porCliente" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-600"
                    }`}
                    onClick={() => setClientesTab("porCliente")}
                  >
                    Por Cliente
                  </button>
                  <button
                    className={`px-4 py-2 font-semibold ${
                      clientesTab === "porPeriodo" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-600"
                    }`}
                    onClick={() => setClientesTab("porPeriodo")}
                  >
                    Por Periodo
                  </button>
                  <button
                    className={`px-4 py-2 font-semibold ${
                      clientesTab === "porTipoServicio" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-600"
                    }`}
                    onClick={() => setClientesTab("porTipoServicio")}
                  >
                    Por Tipo de Servicio
                  </button>
                </div>
                {/* Filtros de periodo */}
                {(clientesTab === "porCliente" ||
                  clientesTab === "porTipoServicio" ||
                  clientesTab === "porPeriodo") && (
                  <div className="flex items-center space-x-4 mb-4">
                    <div>
                      <Label>Desde</Label>
                      <Input
                        type="date"
                        value={clientesPeriodo.desde}
                        onChange={(e) =>
                          setClientesPeriodo((p) => ({
                            ...p,
                            desde: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Hasta</Label>
                      <Input
                        type="date"
                        value={clientesPeriodo.hasta}
                        onChange={(e) =>
                          setClientesPeriodo((p) => ({
                            ...p,
                            hasta: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Contenido de pestañas */}
              {clientesTab === "porCliente" && (
                <div>
                  {operacionesPorCliente.length === 0 && (
                    <p className="text-gray-500">No hay operaciones para mostrar.</p>
                  )}
                  {operacionesPorCliente.map(({ cliente, operaciones }) => (
                    <div key={cliente.id} className="mb-6 border-b pb-4">
                      <h3 className="font-bold text-lg text-blue-700 mb-2">{cliente.nombre}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-1 text-left">Folio</th>
                              <th className="px-2 py-1 text-left">Fecha</th>
                              <th className="px-2 py-1 text-left">Tipo Servicio</th>
                              <th className="px-2 py-1 text-left">Monto</th>
                              <th className="px-2 py-1 text-left">Moneda</th>
                              <th className="px-2 py-1 text-left">Pagado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {operaciones.map((op) => (
                              <tr key={op.id} className="border-b">
                                <td className="px-2 py-1">{op.folio}</td>
                                <td className="px-2 py-1">{op.fechaAsignacion}</td>
                                <td className="px-2 py-1">{op.tipoServicio || "-"}</td>
                                <td className="px-2 py-1">${op.montoFacturado || op.precioFlete || 0}</td>
                                <td className="px-2 py-1">{op.moneda_flete || "MXN"}</td>
                                <td className="px-2 py-1">
                                  {op.pagado ? (
                                    <span className="text-green-600 font-semibold">Pagado</span>
                                  ) : (
                                    <span className="text-yellow-600 font-semibold">Pendiente</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {clientesTab === "porPeriodo" && (
                <div>
                  {operacionesPorPeriodo.length === 0 && (
                    <p className="text-gray-500">No hay operaciones para mostrar.</p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 py-1 text-left">Folio</th>
                          <th className="px-2 py-1 text-left">Cliente</th>
                          <th className="px-2 py-1 text-left">Tipo Servicio</th>
                          <th className="px-2 py-1 text-left">Monto</th>
                          <th className="px-2 py-1 text-left">Moneda</th>
                          <th className="px-2 py-1 text-left">Pagado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operacionesPorPeriodo.map((op) => (
                          <tr key={op.id} className="border-b">
                            <td className="px-2 py-1">{op.folio}</td>
                            <td className="px-2 py-1">{op.clienteNombre}</td>
                            <td className="px-2 py-1">{op.tipoServicio || "-"}</td>
                            <td className="px-2 py-1">${op.montoFacturado || op.precioFlete || 0}</td>
                            <td className="px-2 py-1">{op.moneda_flete || "MXN"}</td>
                            <td className="px-2 py-1">
                              {op.pagado ? (
                                <span className="text-green-600 font-semibold">Pagado</span>
                              ) : (
                                <span className="text-yellow-600 font-semibold">Pendiente</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {clientesTab === "porTipoServicio" && (
                <div>
                  {operacionesPorTipoServicio.length === 0 && (
                    <p className="text-gray-500">No hay operaciones para mostrar.</p>
                  )}
                  {operacionesPorTipoServicio.map(({ tipo, operaciones }) => (
                    <div key={tipo.id} className="mb-6 border-b pb-4">
                      <h3 className="font-bold text-lg text-blue-700 mb-2">{tipo.nombre}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-1 text-left">Folio</th>
                              <th className="px-2 py-1 text-left">Cliente</th>
                              <th className="px-2 py-1 text-left">Fecha</th>
                              <th className="px-2 py-1 text-left">Monto</th>
                              <th className="px-2 py-1 text-left">Moneda</th>
                              <th className="px-2 py-1 text-left">Pagado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {operaciones.map((op) => (
                              <tr key={op.id} className="border-b">
                                <td className="px-2 py-1">{op.folio}</td>
                                <td className="px-2 py-1">{op.clienteNombre}</td>
                                <td className="px-2 py-1">{op.fechaAsignacion}</td>
                                <td className="px-2 py-1">${op.montoFacturado || op.precioFlete || 0}</td>
                                <td className="px-2 py-1">{op.moneda_flete || "MXN"}</td>
                                <td className="px-2 py-1">
                                  {op.pagado ? (
                                    <span className="text-green-600 font-semibold">Pagado</span>
                                  ) : (
                                    <span className="text-yellow-600 font-semibold">Pendiente</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Embarques</p>
                  <p className="text-2xl font-bold">{embarquesFiltrados.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Flete Año MXN</p>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {embarquesFiltrados
                      .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
                      .filter((e) => new Date(e.fechaAsignacion).getFullYear() === new Date().getFullYear())
                      .reduce((sum, e) => sum + (e.precioFlete || e.montoFacturado || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Flete Año USD</p>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {embarquesFiltrados
                      .filter((e) => e.moneda_flete === "USD")
                      .filter((e) => new Date(e.fechaAsignacion).getFullYear() === new Date().getFullYear())
                      .reduce((sum, e) => sum + (e.precioFlete || e.montoFacturado || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {embarquesFiltrados.filter((e) => e.pagado).length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {embarquesFiltrados.filter((e) => !e.pagado).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Archivados</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {embarquesFiltrados.filter((e) => e.estado_facturacion === "archivado").length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda y Consultas Avanzadas */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por folio, cliente, load, operador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setShowCreditModal(true)} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Crédito Cliente
            </Button>
            <Button onClick={() => setShowTiposServicioModal(true)} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Tipos de Servicio
            </Button>
          </div>
        </div>

        {/* Lista de embarques */}
        <Card>
          <CardHeader>
            <CardTitle>Embarques Asignados</CardTitle>
            <CardDescription>Lista detallada de todos los embarques con asignación</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEmbarques ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                <span className="ml-2 text-sm text-gray-600">Cargando embarques...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {embarquesFiltrados
                  .sort((a, b) => {
                    // ...existing code...
                    const folioA = Number.parseInt(a.folio.split("-").pop() || "0")
                    const folioB = Number.parseInt(b.folio.split("-").pop() || "0")
                    if (folioA !== folioB) {
                      return folioB - folioA
                    }
                    return new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
                  })
                  .map((embarque) => (
                    <div
                      key={embarque.id}
                      className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                        embarquesModificadosIds.includes(embarque.id) ? "border-red-500" : ""
                      } ${
                        embarque.estado_facturacion === "facturado"
                          ? "bg-blue-50 border-blue-200"
                          : embarque.estado_facturacion === "pagado"
                            ? "bg-green-50 border-green-200"
                            : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Package className="h-8 w-8 text-blue-600" />
                          <div>
                            <div className="flex items-center">
                              <p className="font-bold text-lg text-blue-600">{embarque.folio}</p>
                              {embarquesModificadosIds.includes(embarque.id) && (
                                <Badge variant="destructive" className="ml-2 bg-red-600 text-white animate-pulse">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  CONTINGENCIA
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">Load: {embarque.load_number || "-"}</p>
                          </div>
                          {(() => {
                            const creditCheck = checkCreditExceeded(
                              embarque.clienteNombre,
                              embarque.montoFacturado || 0,
                              embarque.moneda_flete,
                            )
                            return (
                              creditCheck.exceeded && (
                                <Badge variant="destructive" className="ml-2">
                                  {creditCheck.message}
                                </Badge>
                              )
                            )
                          })()}
                          {/* Si quieres mantener el badge de emergencia anterior, puedes dejarlo aquí: */}
                          {embarque.modificadoPorEmergencia && (
                            <Badge variant="destructive" className="ml-2 bg-red-600 text-white">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              MODIFICADO POR EMERGENCIA
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={embarque.estado_facturacion || "pendiente_facturacion"}
                            onValueChange={async (value) => {
                              try {
                                // ...existing code...
                                const embarquesActualizados = embarquesAsignados.map((e) =>
                                  e.id === embarque.id ? { ...e, estado_facturacion: value } : e,
                                )
                                setEmbarquesAsignados(embarquesActualizados)
                                localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))
                                await supabase
                                  .from("embarques")
                                  .update({
                                    estado_facturacion: value,
                                    updated_at: new Date().toISOString(),
                                  })
                                  .eq("id", embarque.id)
                              } catch (error) {
                                // ...existing code...
                              }
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente_facturacion">Pendiente Facturación</SelectItem>
                              <SelectItem value="facturado">Facturado</SelectItem>
                              <SelectItem value="pagado">Pagado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => abrirModalFacturacion(embarque)}>
                            <FileText className="h-4 w-4 mr-1" />
                            Facturación
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => verDetallesEmbarque(embarque)}>
                            <FileText className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => editarEmbarque(embarque)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {embarque.estado_facturacion === "pagado" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-purple-600 text-purple-700 hover:bg-purple-50 bg-transparent"
                              onClick={() => archivarEmbarque(embarque)}
                            >
                              <Package className="h-4 w-4 mr-1 text-purple-600" />
                              Archivar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Cliente:</p>
                          <p className="text-gray-600">
                            {/* Mostrar nombre real del cliente usando el ID */}
                            {clientes.find((c) => c.id === embarque.cliente_id)?.nombre || embarque.cliente_id}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Operador:</p>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-600">{embarque.operadorAsignado?.nombre || "Sin asignar"}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Tipo de Servicio:</p>
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-purple-600" />
                            <span className="text-gray-600 text-sm">
                              {(() => {
                                if (embarque.tipo_servicio_id) {
                                  const tipoServicio = tiposServicio.find((t) => t.id === embarque.tipo_servicio_id)
                                  return tipoServicio ? tipoServicio.nombre : `ID: ${embarque.tipo_servicio_id}`
                                }
                                return "No asignado"
                              })()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Camión:</p>
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">
                              <strong>Camión:</strong> {embarque.camionAsignado?.marca || "Sin asignar"}{" "}
                              {embarque.camionAsignado?.modelo || ""} ({embarque.camionAsignado?.numeroEconomico || ""})
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Carta Porte:</p>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{embarque.carta_porte || "-"}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Monto Flete:</p>
                          <p className="text-gray-600 font-bold">
                            ${embarque.precio_flete?.toLocaleString() || "No definido"} {embarque.moneda_flete || "MXN"}
                          </p>
                        </div>
                        {embarque.fechaEntrega && (
                          <div>
                            <p className="font-medium text-gray-700">Fecha Entrega:</p>
                            <p className="text-gray-600">{new Date(embarque.fechaEntrega).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="font-medium text-gray-700 text-sm">Dirección de Recolecta:</p>
                          <div className="flex items-start space-x-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-gray-600 text-sm">{embarque.direccionRecolecta}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 text-sm">Dirección de Enganche:</p>
                          <div className="flex items-start space-x-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-gray-600 text-sm">{embarque.direccion_entrega}</p>
                          </div>
                        </div>
                      </div>
                      {embarque.observacionesFacturacion && (
                        <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-700 text-sm mb-1">Observaciones de Facturación:</p>
                          <p className="text-gray-600 text-sm">{embarque.observacionesFacturacion}</p>
                        </div>
                      )}
                    </div>
                  ))}

                {embarquesFiltrados.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No se encontraron embarques asignados</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Los embarques asignados desde "Asignación de Embarques" aparecerán aquí
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal para gestión de tipos de servicio */}
        <Dialog open={showTiposServicioModal} onOpenChange={setShowTiposServicioModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestión de Tipos de Servicio</DialogTitle>
              <DialogDescription>
                Asignar precios a cada tipo de servicio para calcular automáticamente los pagos a operadores
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Tabulador de Pagos a Operadores</h3>
                <p className="text-sm text-blue-800">
                  Define el monto que pagarás a tus operadores por cada tipo de servicio. Cuando asignes un embarque con
                  un tipo de servicio específico, el sistema calculará automáticamente el pago correspondiente al
                  operador basándose en estos valores.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  • Los montos se establecen en pesos mexicanos (MXN) • Los cambios se guardan automáticamente en la
                  base de datos
                </p>
              </div>

              {loadingTiposServicio ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Cargando tipos de servicio...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tiposServicio.map((tipo) => (
                    <Card key={tipo.id} className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold text-gray-800">{tipo.nombre}</CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          {tipo.descripcion || "Sin descripción"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`pago-operador-${tipo.id}`} className="text-sm text-gray-700">
                              Pago Operador (MXN):
                            </Label>
                            <Input
                              type="number"
                              id={`pago-operador-${tipo.id}`}
                              defaultValue={tipo.precio_base || 0}
                              onChange={(e) => {
                                const nuevoMonto = Number(e.target.value)
                                if (!isNaN(nuevoMonto)) {
                                  guardarTipoServicio(tipo.id, nuevoMonto)
                                }
                              }}
                              className="w-24 text-right"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Este monto se pagará al operador por cada embarque de este tipo de servicio.
                          </p>
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <p>
                              <strong>Precio Base (Cliente):</strong> ${(tipo.precio_base || 0).toLocaleString()}
                            </p>
                            <p>
                              <strong>Categoría:</strong> {tipo.categoria || "General"}
                            </p>
                            {tipo.subcategoria && (
                              <p>
                                <strong>Subcategoría:</strong> {tipo.subcategoria}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {tiposServicio.length === 0 && !loadingTiposServicio && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No se encontraron tipos de servicio</p>
                  <p className="text-sm text-gray-400 mt-1">Los tipos de servicio configurados aparecerán aquí</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Embarque - {embarqueDetalle?.folio}</DialogTitle>
            </DialogHeader>

            {embarqueDetalle && (
              <div className="space-y-4">
                {/* Navegación por pestañas */}
                <div className="border-b">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "general"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("general")}
                    >
                      Información General
                    </button>
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "facturacion"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("facturacion")}
                    >
                      Datos de Facturación
                    </button>
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "modificaciones"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("modificaciones")}
                    >
                      Historial de Cambios
                    </button>
                  </nav>
                </div>

                {/* Contenido de pestañas */}
                <div className="mt-4">
                  {/* Tab: Información General */}
                  {activeDetailTab === "general" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900">Información del Embarque</h3>
                          <div className="space-y-1">
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Folio:</span>
                              <span>{embarqueDetalle.folio}</span>
                            </p>
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Cliente:</span>
                              <span>{embarqueDetalle.clienteNombre}</span>
                            </p>
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Load:</span>
                              <span>{embarqueDetalle.load_number}</span>
                            </p>
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Fecha Creacion:</span>
                              <span>{new Date(embarqueDetalle.updated_at!).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900">Detalles de Operación</h3>
                          <div className="space-y-1">
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Operador:</span>
                              <span>{embarqueDetalle.operadorAsignado?.nombre || "Sin asignar"}</span>
                            </p>
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Unidad:</span>
                              <span>{embarqueDetalle.camionAsignado?.numeroEconomico || "N/A"}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {embarqueDetalle.comentarios && (
                        <div className="border-t pt-4 mt-4">
                          <h3 className="font-medium text-gray-900 mb-2">Comentarios</h3>
                          <p className="text-sm text-gray-600">{embarqueDetalle.comentarios}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Facturación */}
                  {activeDetailTab === "facturacion" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900">Datos de Facturación</h3>
                          <div className="space-y-1">
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Valor Facturado:</span>
                              <span>
                                ${embarqueDetalle.precio_flete?.toLocaleString() || 0} {embarqueDetalle.moneda_flete}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Fecha Pago:</span>
                              <span>
                                {embarqueDetalle.fecha_pago
                                  ? new Date(embarqueDetalle.fecha_pago).toLocaleDateString()
                                  : "-"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Estado:</span>
                              <Badge variant={embarqueDetalle.pagado ? "default" : "secondary"}>
                                {embarqueDetalle.pagado ? "Pagado" : "Pendiente"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900">Documentos de Facturación</h3>
                          <div className="space-y-1">
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Número Factura 1:</span>
                              <span>{embarqueDetalle.folio_factura_1 || "-"}</span>
                            </div>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Número Factura 2:</span>
                              <span>{embarqueDetalle.folio_factura_2 || "-"}</span>
                            </div>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Número Factura 3:</span>
                              <span>{embarqueDetalle.folio_factura_3 || "-"}</span>
                            </div>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Fecha Envío Cliente:</span>
                              <span>
                                {embarqueDetalle.fecha_envio_cliente
                                  ? new Date(embarqueDetalle.fecha_envio_cliente).toLocaleDateString()
                                  : "-"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Fecha Pago Cliente:</span>
                              <span>
                                {embarqueDetalle.fecha_pago
                                  ? new Date(embarqueDetalle.fecha_pago).toLocaleDateString()
                                  : "-"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Referencia de Pago:</span>
                              <span>{embarqueDetalle.referencia_pago || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {embarqueDetalle.observacionesFacturacion && (
                        <div className="border-t pt-4 mt-4">
                          <h3 className="font-medium text-gray-900 mb-2">Observaciones</h3>
                          <p className="text-sm text-gray-600">{embarqueDetalle.observacionesFacturacion}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Modificaciones */}
                  {activeDetailTab === "modificaciones" && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Historial de Modificaciones</h3>
                      <ModificacionesHistory embarqueId={embarqueDetalle.id} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal para editar información de facturación */}
        <Dialog open={showFacturacionEditModal} onOpenChange={setShowFacturacionEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Información de Facturación</DialogTitle>
              <DialogDescription>Actualizar los folios de factura y montos</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="folio1">Folio Factura 1:</Label>
                  <Input
                    id="folio1"
                    value={facturacionFormData.folio1}
                    onChange={(e) =>
                      setFacturacionFormData((prev) => ({
                        ...prev,
                        folio1: e.target.value,
                      }))
                    }
                    placeholder="Folio 1"
                  />
                </div>
                <div>
                  <Label htmlFor="folio2">Folio Factura 2:</Label>
                  <Input
                    id="folio2"
                    value={facturacionFormData.folio2}
                    onChange={(e) =>
                      setFacturacionFormData((prev) => ({
                        ...prev,
                        folio2: e.target.value,
                      }))
                    }
                    placeholder="Folio 2"
                  />
                </div>
                <div>
                  <Label htmlFor="folio3">Folio Factura 3:</Label>
                  <Input
                    id="folio3"
                    value={facturacionFormData.folio3}
                    onChange={(e) =>
                      setFacturacionFormData((prev) => ({
                        ...prev,
                        folio3: e.target.value,
                      }))
                    }
                    placeholder="Folio 3"
                  />
                </div>
                <div>
                  <Label htmlFor="folio4">Folio Factura 4:</Label>
                  <Input
                    id="folio4"
                    value={facturacionFormData.folio4}
                    onChange={(e) =>
                      setFacturacionFormData((prev) => ({
                        ...prev,
                        folio4: e.target.value,
                      }))
                    }
                    placeholder="Folio 4"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cantidad-final">Cantidad Final Facturada:</Label>
                <Input
                  type="number"
                  id="cantidad-final"
                  value={facturacionFormData.cantidadFinalFacturada}
                  onChange={(e) =>
                    setFacturacionFormData((prev) => ({
                      ...prev,
                      cantidadFinalFacturada: Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="observaciones-facturacion">Observaciones:</Label>
                <Textarea
                  id="observaciones-facturacion"
                  value={facturacionFormData.observacionesFacturacion}
                  onChange={(e) =>
                    setFacturacionFormData((prev) => ({
                      ...prev,
                      observacionesFacturacion: e.target.value,
                    }))
                  }
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowFacturacionEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={guardarInformacionFacturacion}>Guardar Cambios</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para editar embarque */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Embarque</DialogTitle>
              <DialogDescription>Modificar información de facturación del embarque</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="monto-facturado">Monto Facturado:</Label>
                <Input
                  type="number"
                  id="monto-facturado"
                  value={formData.montoFacturado}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      montoFacturado: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="fecha-entrega">Fecha de Entrega:</Label>
                <Input
                  type="date"
                  id="fecha-entrega"
                  value={formData.fechaEntrega}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fechaEntrega: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="observaciones">Observaciones de Facturación:</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observacionesFacturacion}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      observacionesFacturacion: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pagado"
                  checked={formData.pagado}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pagado: e.target.checked,
                    }))
                  }
                />
                <Label htmlFor="pagado">Marcado como pagado</Label>
              </div>
              {formData.pagado && (
                <div>
                  <Label htmlFor="fecha-pago">Fecha de Pago:</Label>
                  <Input
                    type="date"
                    id="fecha-pago"
                    value={formData.fechaPago}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fechaPago: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
              <div>
                <Label htmlFor="estado-facturacion">Estado de Facturación:</Label>
                <Select
                  value={formData.estado_facturacion}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      estado_facturacion: value as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente_facturacion">Pendiente Facturación</SelectItem>
                    <SelectItem value="facturado">Facturado</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={guardarCambios}>Guardar Cambios</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para gestión de crédito de clientes */}
        <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestión de Crédito de Clientes</DialogTitle>
              <DialogDescription>
                Configurar límites de crédito y monitorear el estado de pagos por cliente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Control de Crédito</h3>
                <p className="text-sm text-blue-800">
                  Establece límites de crédito para cada cliente y monitorea automáticamente cuando se excedan los
                  límites establecidos. Los embarques con crédito excedido se marcarán con una alerta roja.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  • Los límites se establecen por separado para MXN y USD • Los cambios se guardan automáticamente
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientes.map((cliente) => {
                  const clienteEmbarquesUSD = embarquesFiltrados.filter(
                    (e) => e.clienteNombre === cliente.nombre && !e.pagado && e.moneda_flete === "USD",
                  )
                  const clienteEmbarquesMXN = embarquesFiltrados.filter(
                    (e) =>
                      e.clienteNombre === cliente.nombre && !e.pagado && (e.moneda_flete === "MXN" || !e.moneda_flete),
                  )

                  const totalPendienteUSD = clienteEmbarquesUSD.reduce((sum, e) => sum + (e.montoFacturado || 0), 0)
                  const totalPendienteMXN = clienteEmbarquesMXN.reduce((sum, e) => sum + (e.montoFacturado || 0), 0)

                  const limiteUSD = creditLimits[cliente.id]?.usd || 0
                  const limiteMXN = creditLimits[cliente.id]?.mxn || 0

                  const excedeUSD = totalPendienteUSD > limiteUSD && limiteUSD > 0
                  const excedeMXN = totalPendienteMXN > limiteMXN && limiteMXN > 0

                  return (
                    <Card
                      key={cliente.id}
                      className={`border-gray-200 ${excedeUSD || excedeMXN ? "border-red-300 bg-red-50" : ""}`}
                    >
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold text-gray-800">{cliente.nombre}</CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          RFC: {cliente.rfc || "No especificado"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Límites de crédito */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`limite-usd-${cliente.id}`} className="text-xs text-gray-600">
                                Límite USD:
                              </Label>
                              <Input
                                type="number"
                                id={`limite-usd-${cliente.id}`}
                                defaultValue={limiteUSD}
                                onChange={(e) => {
                                  const limite = Number(e.target.value)
                                  if (!isNaN(limite)) {
                                    saveCreditLimit(cliente.id, "usd", limite)
                                  }
                                }}
                                className="text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`limite-mxn-${cliente.id}`} className="text-xs text-gray-600">
                                Límite MXN:
                              </Label>
                              <Input
                                type="number"
                                id={`limite-mxn-${cliente.id}`}
                                defaultValue={limiteMXN}
                                onChange={(e) => {
                                  const limite = Number(e.target.value)
                                  if (!isNaN(limite)) {
                                    saveCreditLimit(cliente.id, "mxn", limite)
                                  }
                                }}
                                className="text-xs"
                              />
                            </div>
                          </div>

                          {/* Estado actual */}
                          <div className="bg-gray-50 p-3 rounded text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="font-medium text-gray-700">Pendiente USD:</p>
                                <p className={`font-bold ${excedeUSD ? "text-red-600" : "text-gray-600"}`}>
                                  ${totalPendienteUSD.toLocaleString()}
                                </p>
                                <p className="text-gray-500">de ${limiteUSD.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">Pendiente MXN:</p>
                                <p className={`font-bold ${excedeMXN ? "text-red-600" : "text-gray-600"}`}>
                                  ${totalPendienteMXN.toLocaleString()}
                                </p>
                                <p className="text-gray-500">de ${limiteMXN.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-gray-600">
                                Embarques pendientes: {clienteEmbarquesUSD.length + clienteEmbarquesMXN.length}
                              </p>
                            </div>
                          </div>

                          {(excedeUSD || excedeMXN) && (
                            <div className="bg-red-100 border border-red-300 rounded p-2">
                              <p className="text-red-800 text-xs font-medium flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Crédito Excedido
                              </p>
                              <p className="text-red-700 text-xs mt-1">
                                Este cliente ha excedido su límite de crédito establecido.
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {clientes.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No se encontraron clientes</p>
                  <p className="text-sm text-gray-400 mt-1">Los clientes registrados aparecerán aquí</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para facturación */}
        <Dialog open={showFacturacionModal} onOpenChange={setShowFacturacionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Datos de Facturación - {embarqueFacturacion?.folio}</DialogTitle>
              <DialogDescription>Registrar información de facturación y pago del embarque</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numero-factura-1">Número de Factura 1:</Label>
                  <Input
                    id="numero-factura-1"
                    value={facturacionData.numeroFactura1}
                    onChange={(e) =>
                      setFacturacionData((prev) => ({
                        ...prev,
                        numeroFactura1: e.target.value,
                      }))
                    }
                    placeholder="Factura 1"
                  />
                </div>
                <div>
                  <Label htmlFor="numero-factura-2">Número de Factura 2:</Label>
                  <Input
                    id="numero-factura-2"
                    value={facturacionData.numeroFactura2}
                    onChange={(e) =>
                      setFacturacionData((prev) => ({
                        ...prev,
                        numeroFactura2: e.target.value,
                      }))
                    }
                    placeholder="Factura 2"
                  />
                </div>
                <div>
                  <Label htmlFor="numero-factura-3">Número de Factura 3:</Label>
                  <Input
                    id="numero-factura-3"
                    value={facturacionData.numeroFactura3}
                    onChange={(e) =>
                      setFacturacionData((prev) => ({
                        ...prev,
                        numeroFactura3: e.target.value,
                      }))
                    }
                    placeholder="Factura 3"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha-envio-cliente">Fecha Envío Cliente:</Label>
                  <Input
                    type="date"
                    id="fecha-envio-cliente"
                    value={facturacionData.fechaEnvioCliente}
                    onChange={(e) =>
                      setFacturacionData((prev) => ({
                        ...prev,
                        fechaEnvioCliente: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="fecha-pago-cliente">Fecha Pago Cliente:</Label>
                  <Input
                    type="date"
                    id="fecha-pago-cliente"
                    value={facturacionData.fechaPagoCliente}
                    onChange={(e) =>
                      setFacturacionData((prev) => ({
                        ...prev,
                        fechaPagoCliente: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="referencia-pago">Referencia de Pago:</Label>
                <Input
                  id="referencia-pago"
                  value={facturacionData.referenciaPago}
                  onChange={(e) =>
                    setFacturacionData((prev) => ({
                      ...prev,
                      referenciaPago: e.target.value,
                    }))
                  }
                  placeholder="Referencia bancaria o número de transferencia"
                />
              </div>
              <div>
                <Label htmlFor="observaciones-facturacion-modal">Observaciones:</Label>
                <Textarea
                  id="observaciones-facturacion-modal"
                  value={facturacionData.observacionesFacturacion}
                  onChange={(e) =>
                    setFacturacionData((prev) => ({
                      ...prev,
                      observacionesFacturacion: e.target.value,
                    }))
                  }
                  placeholder="Observaciones adicionales sobre la facturación..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowFacturacionModal(false)}>
                Cancelar
              </Button>
              <Button onClick={guardarDatosFacturacion}>Guardar Datos</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
