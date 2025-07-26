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
} from "lucide-react"
import { useState, useEffect } from "react"
import { supabase, obtenerTipoCambioActual, actualizarTipoCambio, type TipoCambio } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
}

interface TipoServicio {
  id: string
  nombre: string
  descripcion?: string
  categoria?: string
  subcategoria?: string
  precio_base?: number
  pago_operador?: number
  monto_base?: number
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
              {modificaciones.length} modificación{modificaciones.length > 1 ? "es" : ""}
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
  const [embarquesAsignados, setEmbarquesAsignados] = useState<EmbarqueAsignado[]>([])
  const [filtroOperador, setFiltroOperador] = useState("todos")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [embarqueEditando, setEmbarqueEditando] = useState<EmbarqueAsignado | null>(null)
  const [showAdvancedQueryModal, setShowAdvancedQueryModal] = useState(false)

  // Estado para el formulario de edición
  const [formData, setFormData] = useState({
    montoFacturado: 0,
    fechaEntrega: "",
    observacionesFacturacion: "",
    pagado: false,
    fechaPago: "",
    estado_facturacion: "pendiente_facturacion",
  })

  const [showCreditModal, setShowCreditModal] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [creditLimits, setCreditLimits] = useState<{ [key: string]: { usd: number; mxn: number } }>({})

  const [tipoCambioActual, setTipoCambioActual] = useState<TipoCambio | null>(null)
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false)
  const [newExchangeRate, setNewExchangeRate] = useState("")

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [embarqueDetalle, setEmbarqueDetalle] = useState<EmbarqueAsignado | null>(null)

  const [activeTab, setActiveTab] = useState("general")
  const [activeAdvancedTab, setActiveAdvancedTab] = useState("ingresos")

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
  const [pagosOperadores, setPagosOperadores] = useState<{ [key: string]: number }>({})

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
  const [showArchivarModal, setShowArchivarModal] = useState(false)
  const [embarqueParaArchivar, setEmbarqueParaArchivar] = useState<EmbarqueAsignado | null>(null)
  const [operadoresContingencia, setOperadoresContingencia] = useState<{
    [key: string]: { original: number; reemplazo: number }
  }>({})
  const [operadoresContingenciaData, setOperadoresContingenciaData] = useState<{
    [key: string]: { original: any; reemplazo: any }
  }>({})

  const [showConfiguracionServiciosModal, setShowConfiguracionServiciosModal] = useState(false)
  const [showRegistrosArchivadosModal, setShowRegistrosArchivadosModal] = useState(false)
  const [registrosArchivados, setRegistrosArchivados] = useState<EmbarqueAsignado[]>([])
  const [filtroFechaArchivo, setFiltroFechaArchivo] = useState("")
  const [filtroFechaArchivoHasta, setFiltroFechaArchivoHasta] = useState("")
  const [searchTermArchivos, setSearchTermArchivos] = useState("")
  const [serviciosCliente, setServiciosCliente] = useState<any[]>([])
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mes-actual")

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

  // Nuevos estados para el modal de clientes
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState("todos")
  const [fechaInicioCliente, setFechaInicioCliente] = useState("")
  const [fechaFinCliente, setFechaFinCliente] = useState("")
  const [embarquesCliente, setEmbarquesCliente] = useState<EmbarqueAsignado[]>([])
  const [estadisticasCliente, setEstadisticasCliente] = useState<any>(null)
  const [loadingClienteData, setLoadingClienteData] = useState(false)

  const [activeDetailTab, setActiveDetailTab] = useState("general")

  // Cargar embarques asignados desde localStorage al montar el componente
  useEffect(() => {
    const cargarDatosIniciales = () => {
      const embarquesGuardados = JSON.parse(localStorage.getItem("embarquesAsignados") || "[]")
      const archivosGuardados = JSON.parse(localStorage.getItem("registrosArchivados") || "[]")

      // Cargar registros archivados
      if (archivosGuardados.length > 0) {
        setRegistrosArchivados(archivosGuardados)
      }

      // Agregar algunos datos simulados si no hay datos guardados
      if (embarquesGuardados.length === 0) {
        const embarquesSimulados = [
          {
            id: "1",
            folio: "EMB-2024-001",
            clienteNombre: "Empresa ABC S.A. de C.V.",
            numeroLoad: "LD-ABC-2024-001",
            direccionEnganche: "Av. Industrial 123, Col. Zona Industrial, Ciudad de México",
            fechaEnganche: "2024-01-20",
            horaEnganche: "08:00",
            comentarios: "Carga frágil, manejar con cuidado",
            operadorAsignado: { id: "1", nombre: "José Martínez" },
            camionAsignado: { id: "1", marca: "Freightliner", modelo: "Cascadia", numeroEconomico: "001" },
            fechaAsignacion: "2024-01-18",
            estado: "asignado",
            montoFacturado: 15500,
            precioFlete: 15500,
            fechaEntrega: "2024-01-22",
            observacionesFacturacion: "Entrega completada sin incidencias",
            pagado: true,
            fechaPago: "2024-01-25",
            moneda_flete: "MXN" as const,
            estado_facturacion: "pagado" as const,
          },
          {
            id: "2",
            folio: "EMB-2024-002",
            clienteNombre: "Comercial XYZ",
            numeroLoad: "LD-XYZ-2024-015",
            direccionEnganche: "Calle Comercio 456, Col. Centro, Guadalajara, Jal.",
            fechaEnganche: "2024-01-22",
            horaEnganche: "10:30",
            comentarios: "Horario estricto de enganche",
            operadorAsignado: { id: "2", nombre: "Pedro García" },
            camionAsignado: { id: "2", marca: "Kenworth", modelo: "T680", numeroEconomico: "002" },
            fechaAsignacion: "2024-01-19",
            estado: "asignado",
            montoFacturado: 12800,
            precioFlete: 12800,
            fechaEntrega: "2024-01-24",
            observacionesFacturacion: "Cliente solicita factura con complemento",
            pagado: false,
            moneda_flete: "MXN" as const,
            estado_facturacion: "facturado" as const,
          },
          {
            id: "3",
            folio: "EMB-2024-003",
            clienteNombre: "Distribuidora 123",
            numeroLoad: "LD-DIS-2024-005",
            direccionEnganche: "Calle Industrial 789, Col. Parque Industrial, Monterrey, N.L.",
            fechaEnganche: "2024-01-21",
            horaEnganche: "14:00",
            comentarios: "Confirmar llegada 1 hora antes",
            operadorAsignado: { id: "1", nombre: "José Martínez" },
            camionAsignado: { id: "3", marca: "Volvo", modelo: "VNL 760", numeroEconomico: "003" },
            fechaAsignacion: "2024-01-20",
            estado: "asignado",
            montoFacturado: 18200,
            precioFlete: 18200,
            fechaEntrega: "2024-01-23",
            observacionesFacturacion: "Ruta larga, combustible adicional",
            pagado: true,
            fechaPago: "2024-01-26",
            moneda_flete: "MXN" as const,
            estado_facturacion: "pagado" as const,
          },
        ]
        setEmbarquesAsignados(embarquesSimulados)
        localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesSimulados))
      } else {
        setEmbarquesAsignados(embarquesGuardados)
      }
    }

    cargarDatosIniciales()
  }, [])

  // Cargar registros archivados desde localStorage al montar el componente
  useEffect(() => {
    const archivosGuardados = JSON.parse(localStorage.getItem("registrosArchivados") || "[]")
    if (archivosGuardados.length > 0) {
      setRegistrosArchivados(archivosGuardados)
    }
  }, [])

  // Load clients and credit limits
  useEffect(() => {
    const loadClientsFromDatabase = async () => {
      try {
        // Load clients from Supabase
        const { data: clientesData, error: clientesError } = await supabase
          .from("clientes")
          .select("*")
          .eq("estado", "activo")
          .order("nombre")

        if (clientesError) {
          console.error("Error loading clients:", clientesError)
          // Fallback to localStorage if database fails
          const clientesGuardados = JSON.parse(localStorage.getItem("clientes") || "[]")
          setClientes(clientesGuardados)
        } else {
          setClientes(clientesData || [])
        }

        // Load credit limits from Supabase - FIXED: using correct column name
        const { data: creditosData, error: creditosError } = await supabase
          .from("creditos_clientes")
          .select("cliente_id, limite_credito_usd")
          .eq("activo", true)

        if (creditosError) {
          console.error("Error loading credit limits:", creditosError)
          // Fallback to localStorage
          const creditosGuardados = JSON.parse(localStorage.getItem("creditLimits") || "{}")
          setCreditLimits(creditosGuardados)
        } else {
          const creditLimitsMap: { [key: string]: number } = {}
          creditosData?.forEach((credito) => {
            creditLimitsMap[credito.cliente_id] = credito.limite_credito_usd || 0
          })
          setCreditLimits(creditLimitsMap)
        }
      } catch (error) {
        console.error("Error in loadClientsFromDatabase:", error)
        // Fallback to localStorage
        const clientesGuardados = JSON.parse(localStorage.getItem("clientes") || "[]")
        const creditosGuardados = JSON.parse(localStorage.getItem("creditLimits") || "{}")
        setClientes(clientesGuardados)
        setCreditLimits(creditosGuardados)
      }
    }

    loadClientsFromDatabase()
  }, [])

  // Load exchange rate
  useEffect(() => {
    const loadExchangeRate = async () => {
      const tipoCambio = await obtenerTipoCambioActual()
      setTipoCambioActual(tipoCambio)
    }
    loadExchangeRate()
  }, [])

  // Load tipos de servicio
  useEffect(() => {
    const loadTiposServicio = async () => {
      try {
        const { data: tiposData, error } = await supabase
          .from("tipos_servicio")
          .select("*")
          .eq("activo", true)
          .order("nombre", { ascending: true })

        if (error) {
          console.error("Error loading tipos de servicio:", error)
          // Fallback data with proper structure
          const tiposDefault: TipoServicio[] = [
            {
              id: "exportacion-cargada-caja-seca-240",
              nombre: "EXPORTACIÓN CARGADA - CAJA SECA 240",
              pago_operador: 1800,
              monto_base: 1800,
              precio_base: 2500,
              descripcion: "Servicio de exportación con contenedor de caja seca cargada - Zona 240",
              activo: true,
            },
            {
              id: "importacion-cargada-caja-seca-240",
              nombre: "IMPORTACIÓN CARGADA - CAJA SECA 240",
              pago_operador: 1700,
              monto_base: 1700,
              precio_base: 2400,
              descripcion: "Servicio de importación con contenedor de caja seca cargada - Zona 240",
              activo: true,
            },
            {
              id: "otro",
              nombre: "OTRO",
              pago_operador: 0,
              monto_base: 0,
              precio_base: 0,
              descripcion: "Servicio personalizado según necesidades específicas del cliente",
              activo: true,
            },
          ]
          setTiposServicio(tiposDefault)
        } else {
          setTiposServicio(tiposData || [])
        }
      } catch (error) {
        console.error("Error:", error)
        // Final fallback
        setTiposServicio([])
      }
    }

    loadTiposServicio()

    const loadOperadoresContingencia = async () => {
      try {
        // Instead of querying the database, use localStorage data for now
        // since the exact column names for emergency modifications need to be verified
        const embarquesGuardados = JSON.parse(localStorage.getItem("embarquesAsignados") || "[]")
        const embarquesContingencia = embarquesGuardados.filter((e: any) => e.modificadoPorEmergencia)

        const operadoresData: { [key: string]: { original: any; reemplazo: any } } = {}
        embarquesContingencia.forEach((embarque: any) => {
          operadoresData[embarque.id] = {
            original: embarque.operadorAsignado || { nombre: "Operador Original", apellidos: "" },
            reemplazo: {
              id: "reemplazo_" + embarque.id,
              nombre: embarque.usuarioModificacion || "Operador de Reemplazo",
              apellidos: "",
            },
          }
        })

        setOperadoresContingenciaData(operadoresData)
      } catch (error) {
        console.error("Error in loadOperadoresContingencia:", error)
        // Fallback to empty data
        setOperadoresContingenciaData({})
      }
    }
    loadOperadoresContingencia()
  }, [])

  // Obtener lista única de operadores
  const operadoresUnicos = Array.from(
    new Set((embarquesAsignados || []).map((embarque) => embarque?.operadorAsignado?.nombre).filter(Boolean)),
  )
    .map((nombre) => {
      const operador = (embarquesAsignados || []).find((e) => e?.operadorAsignado?.nombre === nombre)?.operadorAsignado
      return operador
    })
    .filter(Boolean)

  // Filtrar embarques
  const embarquesFiltrados = (embarquesAsignados || []).filter((embarque) => {
    if (!embarque) return false

    // Excluir embarques archivados de la vista principal
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

  // Filtrar registros archivados
  const registrosArchivadosFiltrados = (registrosArchivados || []).filter((embarque) => {
    if (!embarque) return false

    const coincideBusqueda =
      (embarque.folio || "").toLowerCase().includes(searchTermArchivos.toLowerCase()) ||
      (embarque.clienteNombre || "").toLowerCase().includes(searchTermArchivos.toLowerCase()) ||
      (embarque.operadorAsignado?.nombre || "").toLowerCase().includes(searchTermArchivos.toLowerCase())

    const coincideFechaArchivo =
      !filtroFechaArchivo ||
      (embarque.fechaArchivado && new Date(embarque.fechaArchivado) >= new Date(filtroFechaArchivo))

    const coincideFechaArchivoHasta =
      !filtroFechaArchivoHasta ||
      (embarque.fechaArchivado && new Date(embarque.fechaArchivado) <= new Date(filtroFechaArchivoHasta))

    return coincideBusqueda && coincideFechaArchivo && coincideFechaArchivoHasta
  })

  const saveCreditLimitToDatabase = async (clienteId: string, limit: number) => {
    try {
      // First, try to update existing record
      const { data: existingRecord, error: selectError } = await supabase
        .from("creditos_clientes")
        .select("id")
        .eq("cliente_id", clienteId)
        .single()

      if (existingRecord) {
        // Update existing record - FIXED: using correct column name
        const { error: updateError } = await supabase
          .from("creditos_clientes")
          .update({
            limite_credito_usd: limit,
            updated_at: new Date().toISOString(),
          })
          .eq("cliente_id", clienteId)

        if (updateError) {
          console.error("Error updating credit limit:", updateError)
          return false
        }
      } else {
        // Insert new record - FIXED: using correct column name
        const { error: insertError } = await supabase.from("creditos_clientes").insert({
          cliente_id: clienteId,
          limite_credito_usd: limit,
          activo: true,
        })

        if (insertError) {
          console.error("Error inserting credit limit:", insertError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Error saving credit limit to database:", error)
      return false
    }
  }

  // Update the saveCreditLimit function to also save to database
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

    // También guardar en la base de datos
    await saveCreditLimitToDatabase(clienteId, newLimits[clienteId].usd)
  }

  const checkCreditExceeded = (clienteNombre: string, montoFacturado: number, moneda_flete: "MXN" | "USD" = "MXN") => {
    if (!clienteNombre || !clientes || clientes.length === 0) {
      return { exceeded: false, message: "" }
    }

    const cliente = clientes.find((c) => c?.nombre === clienteNombre)
    if (!cliente) return { exceeded: false, message: "" }

    const clienteLimits = creditLimits?.[cliente.id] || { usd: 0, mxn: 0 }

    // Separar embarques por moneda
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

  const updateExchangeRate = async () => {
    const rate = Number.parseFloat(newExchangeRate)
    if (isNaN(rate) || rate <= 0) {
      alert("Por favor ingresa un tipo de cambio válido")
      return
    }

    const success = await actualizarTipoCambio(rate, "Usuario")
    if (success) {
      const tipoCambio = await obtenerTipoCambioActual()
      setTipoCambioActual(tipoCambio)
      setShowExchangeRateModal(false)
      setNewExchangeRate("")
      alert("Tipo de cambio actualizado exitosamente")
    } else {
      alert("Error al actualizar el tipo de cambio")
    }
  }

  const guardarTipoServicio = async (tipoId: string, nuevoMonto: number) => {
    try {
      // Update using only precio_base column which exists
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

      // Actualizar estado local
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
    })
    setShowEditDialog(true)
  }

  const guardarCambios = async () => {
    if (!embarqueEditando) return

    try {
      // Actualizar en la base de datos
      const { error } = await supabase
        .from("embarques")
        .update({
          precio_flete: formData.montoFacturado,
          fecha_entrega: formData.fechaEntrega || null,
          observaciones_facturacion: formData.observacionesFacturacion || null,
          pagado: formData.pagado,
          fecha_pago: formData.fechaPago || null,
          estado_facturacion: formData.estado_facturacion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarqueEditando.id)

      if (error) {
        console.error("Error actualizando embarque:", error)
        alert("Error al guardar los cambios")
        return
      }

      // Actualizar estado local
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
      fechaPagoCliente: embarque.fechaPagoCliente || "",
      referenciaPago: embarque.referenciaPago || "",
      observacionesFacturacion: embarque.observacionesFacturacion || "",
    })
    setShowFacturacionModal(true)
  }

  const guardarDatosFacturacion = async () => {
    if (!embarqueFacturacion) return

    try {
      // Actualizar en la base de datos
      const { error } = await supabase
        .from("embarques")
        .update({
          folio_factura_1: facturacionData.numeroFactura1 || null,
          folio_factura_2: facturacionData.numeroFactura2 || null,
          folio_factura_3: facturacionData.numeroFactura3 || null,
          fecha_envio_cliente: facturacionData.fechaEnvioCliente || null,
          fecha_pago_cliente: facturacionData.fechaPagoCliente || null,
          referencia_pago: facturacionData.referenciaPago || null,
          observaciones_facturacion: facturacionData.observacionesFacturacion || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarqueFacturacion.id)

      if (error) {
        console.error("Error actualizando datos de facturación:", error)
        // Intentar guardar localmente si falla la BD
        console.log("Guardando localmente debido a error en BD")
      }

      // Actualizar el estado local siempre
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
              fechaPagoCliente: facturacionData.fechaPagoCliente,
              referenciaPago: facturacionData.referenciaPago,
              observacionesFacturacion: facturacionData.observacionesFacturacion,
            }
          : embarque,
      )

      setEmbarquesAsignados(embarquesActualizados)
      localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))

      setShowFacturacionModal(false)
      setEmbarqueFacturacion(null)

      // Limpiar el formulario
      setFacturacionData({
        numeroFactura1: "",
        numeroFactura2: "",
        numeroFactura3: "",
        fechaEnvioCliente: "",
        fechaPagoCliente: "",
        referenciaPago: "",
        observacionesFacturacion: "",
      })

      alert("Datos de facturación guardados exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar los datos de facturación, pero se mantuvo el cambio local")
    }
  }

  // Implementación de la función generarReporteExcel
  const generarReporteExcel = () => {
    try {
      // Preparar los datos para el reporte
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

      // En un entorno real, aquí se generaría el archivo Excel
      // Por ahora, simulamos la descarga
      alert("Reporte Excel generado exitosamente (simulado)")

      // Aquí se podría implementar la generación real del Excel usando una librería como xlsx
      // Por ejemplo:
      // const ws = XLSX.utils.json_to_sheet(datosReporte.embarques);
      // const wb = XLSX.utils.book_new();
      // XLSX.utils.book_append_sheet(wb, ws, "Embarques");
      // XLSX.writeFile(wb, `Reporte_Embarques_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Error al generar reporte Excel:", error)
      alert("Error al generar el reporte Excel")
    }
  }

  const verDetallesEmbarque = (embarque: EmbarqueAsignado) => {
    setEmbarqueDetalle(embarque)

    // Cargar datos de facturación en el formulario
    setFacturacionFormData({
      folio1: embarque.foliosFactura?.folio1 || "",
      folio2: embarque.foliosFactura?.folio2 || "",
      folio3: embarque.foliosFactura?.folio3 || "",
      folio4: embarque.foliosFactura?.folio4 || "",
      cantidadFinalFacturada: embarque.cantidadFinalFacturada || embarque.montoFacturado || 0,
      observacionesFacturacion: embarque.observacionesFacturacion || "",
    })

    setShowDetailModal(true)
  }

  const guardarInformacionFacturacion = async () => {
    if (!embarqueDetalle) return

    try {
      // Actualizar en la base de datos
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

      // Actualizar el estado local
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

      // Actualizar el detalle mostrado
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

  const archivarEmbarque = async () => {
    if (!embarqueParaArchivar) return

    try {
      console.log(`Archivando embarque ${embarqueParaArchivar.id}`)

      // Crear el registro archivado
      const embarqueArchivado = {
        ...embarqueParaArchivar,
        estado_facturacion: "archivado" as const,
        fechaArchivado: new Date().toISOString(),
        usuarioArchivo: "Usuario Actual",
        motivoArchivo: "Archivado manualmente desde facturación",
        observacionesArchivo: "Registro archivado para consulta histórica",
      }

      // Actualizar estados locales inmediatamente
      const embarquesActualizados = embarquesAsignados.filter((e) => e.id !== embarqueParaArchivar.id)
      const archivosActualizados = [embarqueArchivado, ...registrosArchivados]

      setEmbarquesAsignados(embarquesActualizados)
      setRegistrosArchivados(archivosActualizados)

      // Guardar en localStorage inmediatamente
      localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))
      localStorage.setItem("registrosArchivados", JSON.stringify(archivosActualizados))

      console.log(`Embarque ${embarqueParaArchivar.id} archivado localmente`)

      // Cerrar modal inmediatamente
      setShowArchivarModal(false)
      setEmbarqueParaArchivar(null)

      // Intentar actualizar en la base de datos en segundo plano
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
        .eq("id", embarqueParaArchivar.id)

      if (error) {
        console.error("Error archivando embarque en BD:", error)
      } else {
        console.log(`Embarque ${embarqueParaArchivar.id} archivado exitosamente en BD`)
      }

      alert("Embarque archivado exitosamente y movido a registros archivados")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al archivar embarque, pero se mantuvo el cambio local")
    }
  }

  // Agregar estilos CSS para scrollbar personalizado
  const scrollbarStyles = `
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    height: 8px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`

  const handlePeriodoChange = (periodo: string) => {
    setPeriodoSeleccionado(periodo)
    const hoy = new Date()
    let fechaInicio = new Date()
    let fechaFin = new Date()

    switch (periodo) {
      case "mes-actual":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        break
      case "mes-anterior":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
        break
      case "dos-meses":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)
        fechaFin = hoy
        break
      case "seis-meses":
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1)
        fechaFin = hoy
        break
      case "personalizado":
        return // No cambiar las fechas para permitir selección manual
    }

    setFechaInicioAnalisis(fechaInicio.toISOString().split("T")[0])
    setFechaFinAnalisis(fechaFin.toISOString().split("T")[0])
  }

  const cargarRegistrosArchivados = async () => {
    try {
      // First, check if the estado_facturacion column exists
      const { data: columnCheck, error: columnError } = await supabase
        .rpc("check_column_exists", {
          table_name: "embarques",
          column_name: "estado_facturacion",
        })
        .single()

      let embarquesArchivados = []

      if (columnError || !columnCheck) {
        // Column doesn't exist or RPC function doesn't exist, use fallback
        console.warn("Column estado_facturacion doesn't exist yet. Using fallback method.")

        // Try to get all embarques and filter locally
        const { data: allEmbarques, error: allError } = await supabase
          .from("embarques")
          .select("*")
          .order("updated_at", { ascending: false })

        if (allError) {
          console.error("Error loading all embarques:", allError)
          // Use localStorage as final fallback
          const archivados = embarquesAsignados.filter((e) => e.estado_facturacion === "archivado")
          setRegistrosArchivados(archivados)
          return
        }

        // Filter for archived records (you might need to adjust this logic based on your data)
        embarquesArchivados =
          allEmbarques?.filter(
            (embarque: any) =>
              embarque.estado === "archivado" ||
              embarque.observaciones?.includes("archivado") ||
              embarque.observaciones?.includes("Archivado"),
          ) || []
      } else {
        // Column exists, use normal query
        const { data, error } = await supabase
          .from("embarques")
          .select("*")
          .eq("estado_facturacion", "archivado")
          .order("fecha_archivado", { ascending: false })

        if (error) {
          console.error("Error loading archived records:", error)
          // Fallback to localStorage
          const archivados = embarquesAsignados.filter((e) => e.estado_facturacion === "archivado")
          setRegistrosArchivados(archivados)
          return
        }

        embarquesArchivados = data || []
      }

      // Convert database records to EmbarqueAsignado format
      const archivadosFormateados = embarquesArchivados.map((embarque: any) => ({
        id: embarque.id,
        folio: embarque.folio || `EMB-${embarque.id}`,
        clienteNombre: embarque.cliente_nombre || "Cliente no especificado",
        numeroLoad: embarque.numero_load || embarque.load_number || "N/A",
        direccionEnganche: embarque.direccion_enganche || embarque.direccion_recolecta || "No especificada",
        fechaEnganche: embarque.fecha_enganche || embarque.fecha_recolecta || new Date().toISOString().split("T")[0],
        horaEnganche: embarque.hora_enganche || embarque.hora_recolecta || "00:00",
        comentarios: embarque.comentarios || embarque.observaciones || "",
        operadorAsignado: {
          id: embarque.operador_id || "1",
          nombre: embarque.operador_nombre || "Operador no especificado",
        },
        camionAsignado: {
          id: embarque.camion_id || "1",
          marca: embarque.camion_marca || "Marca",
          modelo: embarque.camion_modelo || "Modelo",
          numeroEconomico: embarque.camion_numero_economico || "000",
        },
        fechaAsignacion: embarque.created_at || embarque.fecha_creacion || new Date().toISOString().split("T")[0],
        estado: "archivado",
        montoFacturado: embarque.precio_flete || 0,
        precioFlete: embarque.precio_flete || 0,
        fechaEntrega: embarque.fecha_entrega || "",
        observacionesFacturacion: embarque.observaciones_facturacion || embarque.observaciones || "",
        pagado: embarque.pagado || false,
        fechaPago: embarque.fecha_pago || "",
        moneda_flete: embarque.moneda_flete || embarque.currency || "MXN",
        estado_facturacion: "archivado",
        fechaArchivado: embarque.fecha_archivado || embarque.updated_at,
        usuarioArchivo: embarque.usuario_archivo || "Sistema",
        motivoArchivo: embarque.motivo_archivo || "Archivado automáticamente",
        observacionesArchivo: embarque.observaciones_archivo || "",
      }))

      setRegistrosArchivados(archivadosFormateados)
    } catch (error) {
      console.error("Error in cargarRegistrosArchivados:", error)
      // Final fallback to localStorage
      const archivados = embarquesAsignados.filter((e) => e.estado_facturacion === "archivado")
      setRegistrosArchivados(archivados)
    }
  }

  const exportarRegistrosArchivados = () => {
    const datosExportacion = {
      fecha_exportacion: new Date().toISOString(),
      total_registros: registrosArchivadosFiltrados.length,
      filtros_aplicados: {
        busqueda: searchTermArchivos,
        fecha_desde: filtroFechaArchivo,
        fecha_hasta: filtroFechaArchivoHasta,
      },
      registros: registrosArchivadosFiltrados.map((embarque) => ({
        folio: embarque.folio,
        cliente: embarque.clienteNombre,
        operador: embarque.operadorAsignado.nombre,
        monto_flete: embarque.precioFlete,
        moneda: embarque.moneda_flete,
        fecha_archivado: embarque.fechaArchivado,
        usuario_archivo: embarque.usuarioArchivo,
        motivo_archivo: embarque.motivoArchivo,
        observaciones_archivo: embarque.observacionesArchivo,
      })),
    }

    console.log("Exportando registros archivados:", datosExportacion)
    alert("Registros archivados exportados exitosamente (simulado)")
  }

  const cargarDatosCliente = async () => {
    setLoadingClienteData(true)
    try {
      console.log("Cargando datos de cliente...")

      // Construir filtros de fecha
      const fechaInicio = fechaInicioCliente ? new Date(fechaInicioCliente) : new Date("2024-01-01")
      const fechaFin = fechaFinCliente ? new Date(fechaFinCliente) : new Date()

      // Obtener embarques desde la base de datos
      let query = supabase
        .from("embarques")
        .select(`
          *,
          operadores!inner(id, nombre, apellidos),
          camiones!inner(id, marca, modelo, numero_economico),
          clientes!inner(id, nombre, rfc)
        `)
        .gte("fecha_creacion", fechaInicio.toISOString().split("T")[0])
        .lte("fecha_creacion", fechaFin.toISOString().split("T")[0])
        .order("fecha_creacion", { ascending: false })

      // Filtrar por cliente específico si se seleccionó uno
      if (clienteSeleccionado !== "todos") {
        const cliente = clientes.find((c) => c.nombre === clienteSeleccionado)
        if (cliente) {
          query = query.eq("cliente_id", cliente.id)
        }
      }

      const { data: embarquesBD, error } = await query

      if (error) {
        console.error("Error cargando embarques desde BD:", error)
        // Fallback a datos locales
        const embarquesFiltrados = embarquesAsignados.filter((embarque) => {
          const fechaEmbarque = new Date(embarque.fechaAsignacion)
          const coincideFecha = fechaEmbarque >= fechaInicio && fechaEmbarque <= fechaFin
          const coincideCliente = clienteSeleccionado === "todos" || embarque.clienteNombre === clienteSeleccionado
          return coincideFecha && coincideCliente
        })
        procesarDatosCliente(embarquesFiltrados)
        return
      }

      // Formatear datos de la BD
      const embarquesFormateados = (embarquesBD || []).map((embarque) => ({
        id: embarque.id,
        folio: embarque.folio || `EMB-${embarque.id}`,
        clienteNombre: embarque.clientes?.nombre || embarque.cliente_nombre || "Cliente no especificado",
        numeroLoad: embarque.numero_load || embarque.load_number || "N/A",
        fechaAsignacion: embarque.fecha_creacion || embarque.updated_at,
        operadorAsignado: {
          id: embarque.operadores?.id || "1",
          nombre: `${embarque.operadores?.nombre || "Operador"} ${embarque.operadores?.apellidos || ""}`.trim(),
        },
        camionAsignado: {
          id: embarque.camiones?.id || "1",
          marca: embarque.camiones?.marca || "Marca",
          modelo: embarque.camiones?.modelo || "Modelo",
          numeroEconomico: embarque.camiones?.numero_economico || "000",
        },
        montoFacturado: embarque.precio_flete || 0,
        precioFlete: embarque.precio_flete || 0,
        moneda_flete: embarque.moneda_flete || embarque.currency || "MXN",
        estado_facturacion: embarque.estado_facturacion || "pendiente_facturacion",
        pagado: embarque.pagado || false,
        fechaPago: embarque.fecha_pago,
        fechaEntrega: embarque.fecha_entrega,
        observacionesFacturacion: embarque.observaciones_facturacion,
        direccionEnganche: embarque.direccion_enganche || "No especificada",
        horaEnganche: embarque.hora_enganche || "00:00",
        comentarios: embarque.comentarios || "",
      }))

      procesarDatosCliente(embarquesFormateados)
    } catch (error) {
      console.error("Error en cargarDatosCliente:", error)
      // Fallback final a datos locales
      const embarquesFiltrados = embarquesAsignados.filter((embarque) => {
        const fechaEmbarque = new Date(embarque.fechaAsignacion)
        const fechaInicio = fechaInicioCliente ? new Date(fechaInicioCliente) : new Date("2024-01-01")
        const fechaFin = fechaFinCliente ? new Date(fechaFinCliente) : new Date()
        const coincideFecha = fechaEmbarque >= fechaInicio && fechaEmbarque <= fechaFin
        const coincideCliente = clienteSeleccionado === "todos" || embarque.clienteNombre === clienteSeleccionado
        return coincideFecha && coincideCliente
      })
      procesarDatosCliente(embarquesFiltrados)
    } finally {
      setLoadingClienteData(false)
    }
  }

  const procesarDatosCliente = (embarques: any[]) => {
    setEmbarquesCliente(embarques)

    // Calcular estadísticas
    const pendientes = embarques.filter(
      (e) => e.estado_facturacion === "pendiente_facturacion" || (!e.estado_facturacion && !e.pagado),
    )
    const facturados = embarques.filter((e) => e.estado_facturacion === "facturado")
    const pagados = embarques.filter((e) => e.estado_facturacion === "pagado" || e.pagado)

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
      const clientesUnicos = Array.from(new Set(embarques.map((e) => e.clienteNombre)))
      estadisticasPorCliente = clientesUnicos.reduce((acc, clienteNombre) => {
        const embarquesCliente = embarques.filter((e) => e.clienteNombre === clienteNombre)
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
          montoFacturadoMXN: facturadosCliente
            .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
            .reduce((sum, e) => sum + (e.precioFlete || 0), 0),
          montoFacturadoUSD: facturadosCliente
            .filter((e) => e.moneda_flete === "USD")
            .reduce((sum, e) => sum + (e.precioFlete || 0), 0),
          montoPagadoMXN: pagadosCliente
            .filter((e) => e.moneda_flete === "MXN" || !e.moneda_flete)
            .reduce((sum, e) => sum + (e.precioFlete || 0), 0),
          montoPagadoUSD: pagadosCliente
            .filter((e) => e.moneda_flete === "USD")
            .reduce((sum, e) => sum + (e.precioFlete || 0), 0),
        }
        return acc
      }, {})
    }

    setEstadisticasCliente({
      totalEmbarques: embarques.length,
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
    })
  }

  const exportarDatosCliente = () => {
    const datosExportacion = {
      fecha_exportacion: new Date().toISOString(),
      cliente: clienteSeleccionado,
      periodo: `${fechaInicioCliente || "Inicio"} - ${fechaFinCliente || "Fin"}`,
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

    console.log("Exportando datos de cliente:", datosExportacion)
    alert("Datos de cliente exportados exitosamente (simulado)")
  }

// Función para generar análisis de operadores
const generarAnalisisOperadores = async () => {
  try {
    console.log("Generando análisis de operadores...")
    
    // Construir filtros de fecha
    const fechaInicio = fechaInicioAnalisis ? new Date(fechaInicioAnalisis) : new Date("2024-01-01")
    const fechaFin = fechaFinAnalisis ? new Date(fechaFinAnalisis) : new Date()
    
    // Filtrar embarques por período
    const embarquesFiltrados = embarquesAsignados.filter((embarque) => {
      const fechaEmbarque = new Date(embarque.fechaAsignacion)
      const coincideFecha = fechaEmbarque >= fechaInicio && fechaEmbarque <= fechaFin
      const coincideOperador = filtroAnalisisOperador === "todos" || embarque.operadorAsignado?.nombre === filtroAnalisisOperador
      return coincideFecha && coincideOperador && embarque.estado_facturacion !== "archivado"
    })

    // Procesar embarques y calcular pagos
    const embarquesConPagos = embarquesFiltrados.map((embarque) => {
      // Buscar tipo de servicio para calcular pago
      const tipoServicio = tiposServicio.find(t => t.id === embarque.tipo_servicio_id)
      const pagoOperador = tipoServicio?.pago_operador || tipoServicio?.precio_base || embarque.precioFlete || 0
      
      return {
        ...embarque,
        pagoOperador,
        tipoServicioNombre: tipoServicio?.nombre || "Sin especificar"
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
          promedioPorEmbarque: 0
        })
      }
      
      const operadorData = operadoresMap.get(operadorNombre)
      operadorData.embarques.push(embarque)
      operadorData.totalEmbarques++
      operadorData.totalPagar += embarque.pagoOperador
      
      if (embarque.modificadoPorEmergencia) {
        operadorData.embarquesContingencia++
      }
    })

    // Calcular promedios
    const analisisPorOperador = Array.from(operadoresMap.values()).map(operador => ({
      ...operador,
      promedioPorEmbarque: operador.totalEmbarques > 0 ? Math.round(operador.totalPagar / operador.totalEmbarques) : 0
    }))

    // Calcular resumen general
    const resumenGeneral = {
      totalOperadores: analisisPorOperador.length,
      totalEmbarques: embarquesConPagos.length,
      totalPagarMXN: analisisPorOperador.reduce((sum, op) => sum + op.totalPagar, 0),
      casosContingencia: embarquesConPagos.filter(e => e.modificadoPorEmergencia).length
    }

    // Actualizar estado
    setAnalisisData({
      analisisPorOperador,
      embarquesFiltradosAnalisis: embarquesConPagos,
      resumenGeneral
    })

    console.log("Análisis generado exitosamente:", { analisisPorOperador, resumenGeneral })
    
  } catch (error) {
    console.error("Error generando análisis:", error)
    alert("Error al generar el análisis de operadores")
  }
}

// Función para exportar análisis a Excel
const exportarAnalisisExcel = () => {
  try {
    const datosExportacion = {
      fecha_exportacion: new Date().toISOString(),
      periodo: `${fechaInicioAnalisis || "Inicio"} - ${fechaFinAnalisis || "Fin"}`,
      operador_filtro: filtroAnalisisOperador,
      resumen_general: analisisData.resumenGeneral,
      analisis_por_operador: analisisData.analisisPorOperador,
      embarques_detallados: analisisData.embarquesFiltradosAnalisis?.map(embarque => ({
        folio: embarque.folio,
        cliente: embarque.clienteNombre,
        operador: embarque.operadorAsignado?.nombre,
        fecha: embarque.fechaAsignacion,
        tipo_servicio: embarque.tipoServicioNombre,
        pago_operador: embarque.pagoOperador,
        contingencia: embarque.modificadoPorEmergencia ? "Sí" : "No",
        motivo_modificacion: embarque.motivoModificacion || ""
      })),
      casos_contingencia: Object.entries(operadoresContingencia).map(([embarqueId, division]) => ({
        embarque_id: embarqueId,
        pago_original: division.original,
        pago_reemplazo: division.reemplazo,
        total: division.original + division.reemplazo
      }))
    }

    console.log("Exportando análisis a Excel:", datosExportacion)
    alert("Análisis exportado a Excel exitosamente (simulado)")
    
    // Aquí se implementaría la generación real del Excel
    // usando una librería como xlsx o similar
    
  } catch (error) {
    console.error("Error exportando a Excel:", error)
    alert("Error al exportar el análisis")
  }
}

// Función para imprimir reporte de operadores
const imprimirReporteOperadores = () => {
  try {
    const contenidoImpresion = `
      REPORTE DE ANÁLISIS DE OPERADORES
      ===================================
      
      Período: ${fechaInicioAnalisis || "Inicio"} - ${fechaFinAnalisis || "Fin"}
      Operador: ${filtroAnalisisOperador === "todos" ? "Todos los operadores" : filtroAnalisisOperador}
      Fecha de generación: ${new Date().toLocaleDateString("es-MX")}
      
      RESUMEN GENERAL:
      - Total de operadores: ${analisisData.resumenGeneral?.totalOperadores || 0}
      - Total de embarques: ${analisisData.resumenGeneral?.totalEmbarques || 0}
      - Total a pagar: $${analisisData.resumenGeneral?.totalPagarMXN?.toLocaleString() || 0} MXN
      - Casos de contingencia: ${analisisData.resumenGeneral?.casosContingencia || 0}
      
      DETALLE POR OPERADOR:
      ${analisisData.analisisPorOperador?.map(operador => `
      ${operador.nombre}:
      - Embarques: ${operador.totalEmbarques}
      - Casos contingencia: ${operador.embarquesContingencia}
      - Total a pagar: $${operador.totalPagar.toLocaleString()}
      - Promedio por embarque: $${operador.promedioPorEmbarque.toLocaleString()}
      `).join('\n') || 'No hay datos disponibles'}
    `

    // Crear ventana de impresión
    const ventanaImpresion = window.open('', '_blank')
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
    
  } catch (error) {
    console.error("Error imprimiendo reporte:", error)
    alert("Error al imprimir el reporte")
  }
}

// Función para guardar configuración de contingencia
const guardarConfiguracionContingencia = async () => {
  try {
    console.log("Guardando configuración de contingencia:", operadoresContingencia)
    
    // Guardar en localStorage
    localStorage.setItem("operadoresContingencia", JSON.stringify(operadoresContingencia))
    
    // Aquí se podría guardar en la base de datos
    // const { error } = await supabase
    //   .from("configuracion_contingencia")
    //   .upsert(Object.entries(operadoresContingencia).map(([embarqueId, config]) => ({
    //     embarque_id: embarqueId,
    //     pago_operador_original: config.original,
    //     pago_operador_reemplazo: config.reemplazo,
    //     fecha_configuracion: new Date().toISOString()
    //   })))
    
    alert("Configuración de contingencia guardada exitosamente")
    
  } catch (error) {
    console.error("Error guardando configuración:", error)
    alert("Error al guardar la configuración de contingencia")
  }
}

// Función para generar recibos de operadores
const generarRecibosOperadores = () => {
  try {
    if (!analisisData.analisisPorOperador || analisisData.analisisPorOperador.length === 0) {
      alert("No hay datos de análisis disponibles. Genera el análisis primero.")
      return
    }

    analisisData.analisisPorOperador.forEach((operador, index) => {
      setTimeout(() => {
        const pagoContingencia = Object.values(operadoresContingencia)
          .filter(caso => caso.reemplazo > 0)
          .reduce((sum, caso) => sum + caso.reemplazo, 0)
        
        const totalFinal = operador.totalPagar + pagoContingencia

        const contenidoRecibo = `
          RECIBO DE PAGO - OPERADOR
          ========================
          
          Operador: ${operador.nombre}
          Período: ${fechaInicioAnalisis || "Inicio"} - ${fechaFinAnalisis || "Fin"}
          Fecha de emisión: ${new Date().toLocaleDateString("es-MX")}
          
          DETALLE DE PAGOS:
          - Embarques normales: ${operador.totalEmbarques - operador.embarquesContingencia}
          - Pago por embarques normales: $${(operador.totalPagar - (operador.embarquesContingencia * (operador.totalPagar / operador.totalEmbarques))).toLocaleString()}
          - Casos de contingencia: ${operador.embarquesContingencia}
          - Pago por contingencia: $${pagoContingencia.toLocaleString()}
          
          TOTAL A PAGAR: $${totalFinal.toLocaleString()} MXN
          
          EMBARQUES DETALLADOS:
          ${operador.embarques?.map(embarque => `
          - ${embarque.folio} | ${embarque.clienteNombre} | $${embarque.pagoOperador?.toLocaleString()} | ${embarque.modificadoPorEmergencia ? 'CONTINGENCIA' : 'NORMAL'}
          `).join('') || 'No hay embarques disponibles'}
        `

        const ventanaRecibo = window.open('', '_blank')
        if (ventanaRecibo) {
          ventanaRecibo.document.write(`
            <html>
              <head>
                <title>Recibo - ${operador.nombre}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  pre { white-space: pre-wrap; font-size: 12px; }
                  .header { text-align: center; margin-bottom: 20px; }
                  .total { font-weight: bold; font-size: 16px; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>TRANSPORTES MONARCA</h2>
                  <p>Recibo de Pago - Operador</p>
                </div>
                <pre>${contenidoRecibo}</pre>
                <div style="margin-top: 40px; text-align: center;">
                  <button onclick="window.print()">Imprimir</button>
                  <button onclick="window.close()">Cerrar</button>
                </div>
              </body>
            </html>
          `)
          ventanaRecibo.document.close()
        }
      }, index * 500) // Delay para evitar bloqueo del navegador
    })
    
  } catch (error) {
    console.error("Error generando recibos:", error)
    alert("Error al generar los recibos de operadores")
  }
}

  // Create helper RPC function if it doesn't exist
  useEffect(() => {
    const createHelperFunction = async () => {
      try {
        await supabase.rpc("create_check_column_function")
      } catch (error) {
        // Function might already exist or user doesn't have permissions
        console.log("Helper function creation skipped:", error)
      }
    }
    createHelperFunction()
  }, [])

  return (
    <MainLayout>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
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
            <Button onClick={() => setShowExchangeRateModal(true)} variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              TC: ${tipoCambioActual?.usd_to_mxn.toFixed(4) || "17.50"}
            </Button>
          </div>
        </div>

       {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Embarques</p>
                  <p className="text-2xl font-bold">
                    {
                      [...embarquesFiltrados, ...registrosArchivados].filter(
                        (e) => new Date(e.fechaAsignacion).getFullYear() === new Date().getFullYear(),
                      ).length
                    }
                  </p>
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
                    {[...embarquesFiltrados, ...registrosArchivados]
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
                    {[...embarquesFiltrados, ...registrosArchivados]
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
                    {embarquesFiltrados.filter((e) => e.pagado && e.estado_facturacion !== "archivado").length}
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
                    {embarquesFiltrados.filter((e) => !e.pagado && e.estado_facturacion !== "archivado").length}
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
                  <p className="text-2xl font-bold text-purple-600">{registrosArchivados.length}</p>
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
            <Button onClick={() => setShowClienteModal(true)} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              CLIENTE
            </Button>
            <Button onClick={() => setShowAnalisisOperadoresModal(true)} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Operadores
            </Button>
            <Button onClick={() => setShowTiposServicioModal(true)} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Tipos de Servicio
            </Button>
            <Button onClick={() => setShowConfiguracionServiciosModal(true)} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Configurar Servicios
            </Button>
            <Button
              onClick={() => {
                cargarRegistrosArchivados()
                setShowRegistrosArchivadosModal(true)
              }}
              variant="outline"
            >
              <Package className="h-4 w-4 mr-2" />
              Registros Archivados
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
            <div className="space-y-4">
              {embarquesFiltrados
                .sort((a, b) => {
                  // Primero intentar ordenar por folio (números más altos arriba)
                  const folioA = Number.parseInt(a.folio.split("-").pop() || "0")
                  const folioB = Number.parseInt(b.folio.split("-").pop() || "0")

                  if (folioA !== folioB) {
                    return folioB - folioA // Folios más altos primero
                  }

                  // Si los folios son iguales, ordenar por fecha más reciente
                  return new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
                })
                .map((embarque) => (
                  <div
                    key={embarque.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                      embarque.modificadoPorEmergencia ||
                      embarque.requiereAtencionEspecial ||
                      embarque.alertaModificacion
                        ? "border-red-500"
                        : ""
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
                          <p className="font-bold text-lg text-blue-600">{embarque.folio}</p>
                          <p className="text-sm text-gray-500">Load: {embarque.numeroLoad}</p>
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
                            if (value === "archivado") {
                              setEmbarqueParaArchivar(embarque)
                              setShowArchivarModal(true)
                              return
                            }

                            try {
                              console.log(`Cambiando estado de ${embarque.id} a ${value}`)

                              // Actualizar inmediatamente el estado local
                              const embarquesActualizados = embarquesAsignados.map((e) =>
                                e.id === embarque.id ? { ...e, estado_facturacion: value } : e,
                              )

                              setEmbarquesAsignados(embarquesActualizados)

                              // Guardar inmediatamente en localStorage
                              localStorage.setItem("embarquesAsignados", JSON.stringify(embarquesActualizados))

                              console.log(`Estado local actualizado para embarque ${embarque.id}`)

                              // Intentar actualizar en la base de datos (sin bloquear la UI)
                              const { error } = await supabase
                                .from("embarques")
                                .update({
                                  estado_facturacion: value,
                                  updated_at: new Date().toISOString(),
                                })
                                .eq("id", embarque.id)

                              if (error) {
                                console.error("Error updating billing status:", error)
                                // No revertir cambios locales, mantener el cambio visual
                                console.log("Cambio mantenido localmente a pesar del error en BD")
                              } else {
                                console.log(`Estado actualizado exitosamente en BD para embarque ${embarque.id}`)
                              }
                            } catch (error) {
                              console.error("Error:", error)
                              // Mantener cambios locales incluso si hay error
                              console.log("Cambio mantenido localmente a pesar del error")
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
                            <SelectItem value="archivado">Archivar Registro</SelectItem>
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
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Cliente:</p>
                        <p className="text-gray-600">{embarque.clienteNombre}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Operador(es):</p>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          {embarque.modificadoPorEmergencia && operadoresContingenciaData[embarque.id] ? (
                            <div className="text-gray-600 text-sm">
                              <div>
                                <strong>Original:</strong> {operadoresContingenciaData[embarque.id].original?.nombre}{" "}
                                {operadoresContingenciaData[embarque.id].original?.apellidos}
                              </div>
                              <div>
                                <strong>Reemplazo:</strong> {operadoresContingenciaData[embarque.id].reemplazo?.nombre}{" "}
                                {operadoresContingenciaData[embarque.id].reemplazo?.apellidos}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-600">{embarque.operadorAsignado.nombre}</span>
                          )}
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
                                return tipoServicio ? tipoServicio.nombre : embarque.tipo_servicio_id
                              }
                              return embarque.tipoServicio || "Sin especificar"
                            })()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Camión:</p>
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-green-600" />
                          <span className="text-gray-600">
                            {embarque.camionAsignado.marca} {embarque.camionAsignado.modelo} (
                            {embarque.camionAsignado.numeroEconomico})
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Fecha Asignación:</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {new Date(embarque.fechaAsignacion).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Monto Flete:</p>
                        <p className="text-gray-600 font-bold">
                          $
                          {embarque.precioFlete?.toLocaleString() ||
                            embarque.montoFacturado?.toLocaleString() ||
                            "No definido"}{" "}
                          {embarque.moneda_flete || "MXN"}
                        </p>
                      </div>
                      {embarque.fechaEntrega && (
                        <div>
                          <p className="font-medium text-gray-700">Fecha Entrega:</p>
                          <p className="text-gray-600">{new Date(embarque.fechaEntrega).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="font-medium text-gray-700 text-sm">Dirección de Enganche:</p>
                      <div className="flex items-start space-x-2 mt-1">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-gray-600 text-sm">{embarque.direccionEnganche}</p>
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
                            defaultValue={tipo.pago_operador || tipo.precio_base || 0}
                            onChange={(e) => {
                              const nuevoMonto = Number(e.target.value)
                              if (!isNaN(nuevoMonto)) {
                                setPagosOperadores((prev) => ({
                                  ...prev,
                                  [tipo.id]: nuevoMonto,
                                }))
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
                            <strong>Precio Base:</strong> ${(tipo.precio_base || 0).toLocaleString()}
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

              {tiposServicio.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No se encontraron tipos de servicio</p>
                  <p className="text-sm text-gray-400 mt-1">Los tipos de servicio configurados aparecerán aquí</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para configurar servicios */}
        <Dialog open={showConfiguracionServiciosModal} onOpenChange={setShowConfiguracionServiciosModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configuración de Servicios</DialogTitle>
              <DialogDescription>
                Gestionar la configuración de los servicios ofrecidos a los clientes, incluyendo la asignación de
                precios base y la definición de parámetros específicos para cada servicio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Configuración Detallada de Servicios</h3>
                <p className="text-sm text-blue-800">
                  Ajusta los parámetros de cada servicio para adaptarlos a las necesidades específicas de tus clientes.
                  Define precios base, márgenes de ganancia y otros factores relevantes para optimizar la rentabilidad
                  de cada servicio.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  • Los cambios se guardan automáticamente en la base de datos • Los precios base se establecen en pesos
                  mexicanos (MXN)
                </p>
              </div>

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
                          <Label htmlFor={`precio-${tipo.id}`} className="text-sm text-gray-700">
                            Precio Base (MXN):
                          </Label>
                          <Input
                            type="number"
                            id={`precio-${tipo.id}`}
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
                          Este precio base se utilizará para calcular el costo total del servicio.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para consultas de cliente */}
        <Dialog open={showClienteModal} onOpenChange={setShowClienteModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Consulta de Clientes - Estados de Facturación</DialogTitle>
              <DialogDescription>
                Consultar embarques por cliente, estado de facturación y rango de fechas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Filtros */}
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="cliente-seleccionado">Cliente:</Label>
                  <Select value={clienteSeleccionado} onValueChange={setClienteSeleccionado}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los clientes</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.nombre}>
                          {cliente.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="fecha-inicio-cliente">Fecha Inicio:</Label>
                  <Input
                    type="date"
                    id="fecha-inicio-cliente"
                    value={fechaInicioCliente}
                    onChange={(e) => setFechaInicioCliente(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="fecha-fin-cliente">Fecha Fin:</Label>
                  <Input
                    type="date"
                    id="fecha-fin-cliente"
                    value={fechaFinCliente}
                    onChange={(e) => setFechaFinCliente(e.target.value)}
                  />
                </div>
                <Button onClick={cargarDatosCliente} disabled={loadingClienteData}>
                  {loadingClienteData ? "Cargando..." : "Consultar"}
                </Button>
                <Button onClick={exportarDatosCliente} variant="outline" disabled={!estadisticasCliente}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>

              {/* Estadísticas generales */}
              {estadisticasCliente && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Resumen -{" "}
                    {estadisticasCliente.clienteSeleccionado === "todos"
                      ? "Todos los clientes"
                      : estadisticasCliente.clienteSeleccionado}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Pendientes de Facturación</p>
                            <p className="text-2xl font-bold text-yellow-900">{estadisticasCliente.pendientes}</p>
                            <div className="text-sm text-yellow-700 mt-1">
                              <p>MXN: ${estadisticasCliente.pendientesMXN.toLocaleString()}</p>
                              <p>USD: ${estadisticasCliente.pendientesUSD.toLocaleString()}</p>
                            </div>
                          </div>
                          <Calendar className="h-8 w-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">Facturados</p>
                            <p className="text-2xl font-bold text-blue-900">{estadisticasCliente.facturados}</p>
                            <div className="text-sm text-blue-700 mt-1">
                              <p>MXN: ${estadisticasCliente.facturadosMXN.toLocaleString()}</p>
                              <p>USD: ${estadisticasCliente.facturadosUSD.toLocaleString()}</p>
                            </div>
                          </div>
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">Pagados</p>
                            <p className="text-2xl font-bold text-green-900">{estadisticasCliente.pagados}</p>
                            <div className="text-sm text-green-700 mt-1">
                              <p>MXN: ${estadisticasCliente.pagadosMXN.toLocaleString()}</p>
                              <p>USD: ${estadisticasCliente.pagadosUSD.toLocaleString()}</p>
                            </div>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Estadísticas por cliente si se seleccionó "todos" */}
                  {estadisticasCliente.clienteSeleccionado === "todos" &&
                    Object.keys(estadisticasCliente.estadisticasPorCliente).length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-700 mb-4">Resumen por Cliente</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Cliente
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Total
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Pendientes
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Facturados
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Pagados
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Pendiente MXN
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Pendiente USD
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {Object.entries(estadisticasCliente.estadisticasPorCliente).map(
                                ([clienteNombre, stats]: [string, any]) => (
                                  <tr key={clienteNombre}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      <div className="max-w-32 truncate" title={clienteNombre}>
                                        {clienteNombre}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                      <Badge variant="outline">{stats.total}</Badge>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                                      {stats.pendientes}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                      {stats.facturados}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                      {stats.pagados}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                      ${stats.montoPendienteMXN.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                      ${stats.montoPendienteUSD.toLocaleString()}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  {/* Lista detallada de embarques */}
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-4">
                      Embarques Detallados ({embarquesCliente.length})
                    </h4>
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Operador
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {embarquesCliente.map((embarque) => (
                            <tr key={embarque.id}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {embarque.folio}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                <div className="max-w-32 truncate" title={embarque.clienteNombre}>
                                  {embarque.clienteNombre}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {embarque.operadorAsignado.nombre}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(embarque.fechaAsignacion).toLocaleDateString("es-MX")}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                ${embarque.precioFlete.toLocaleString()} {embarque.moneda_flete}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <Badge
                                  variant={
                                    embarque.estado_facturacion === "pagado" || embarque.pagado
                                      ? "default"
                                      : embarque.estado_facturacion === "facturado"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className={
                                    embarque.estado_facturacion === "pagado" || embarque.pagado
                                      ? "bg-green-100 text-green-800"
                                      : embarque.estado_facturacion === "facturado"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {embarque.estado_facturacion === "pagado" || embarque.pagado
                                    ? "Pagado"
                                    : embarque.estado_facturacion === "facturado"
                                      ? "Facturado"
                                      : "Pendiente"}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {embarque.fechaPago ? new Date(embarque.fechaPago).toLocaleDateString("es-MX") : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {loadingClienteData && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <span className="ml-2 text-gray-600">Cargando datos de cliente...</span>
                </div>
              )}

              {!estadisticasCliente && !loadingClienteData && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Selecciona un cliente y rango de fechas para consultar</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Haz clic en "Consultar" para cargar los datos de facturación
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para actualizar tipo de cambio */}
        <Dialog open={showExchangeRateModal} onOpenChange={setShowExchangeRateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Tipo de Cambio</DialogTitle>
              <DialogDescription>
                Tipo de cambio actual: ${tipoCambioActual?.usd_to_mxn.toFixed(4) || "17.50"} MXN por USD
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nuevo-tipo-cambio">Nuevo Tipo de Cambio (USD a MXN):</Label>
                <Input
                  type="number"
                  step="0.0001"
                  id="nuevo-tipo-cambio"
                  value={newExchangeRate}
                  onChange={(e) => setNewExchangeRate(e.target.value)}
                  placeholder="17.5000"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowExchangeRateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={updateExchangeRate}>Actualizar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para ver detalles del embarque */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Embarque - {embarqueDetalle?.folio}</DialogTitle>
              <DialogDescription>Información completa del embarque y su historial</DialogDescription>
            </DialogHeader>

            {embarqueDetalle && (
              <div className="space-y-6">
                <div className="flex space-x-4">
                  <Button
                    variant={activeDetailTab === "general" ? "default" : "outline"}
                    onClick={() => setActiveDetailTab("general")}
                  >
                    General
                  </Button>
                  <Button
                    variant={activeDetailTab === "facturacion" ? "default" : "outline"}
                    onClick={() => setActiveDetailTab("facturacion")}
                  >
                    Facturación
                  </Button>
                  <Button
                    variant={activeDetailTab === "modificaciones" ? "default" : "outline"}
                    onClick={() => setActiveDetailTab("modificaciones")}
                  >
                    Modificaciones
                  </Button>
                </div>

                {activeDetailTab === "general" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Información del Embarque</h3>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Folio:</strong> {embarqueDetalle.folio}
                          </p>
                          <p>
                            <strong>Cliente:</strong> {embarqueDetalle.clienteNombre}
                          </p>
                          <p>
                            <strong>Número de Load:</strong> {embarqueDetalle.numeroLoad}
                          </p>
                          <p>
                            <strong>Fecha de Asignación:</strong>{" "}
                            {new Date(embarqueDetalle.fechaAsignacion).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Estado:</strong> {embarqueDetalle.estado}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Asignación</h3>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Operador:</strong> {embarqueDetalle.operadorAsignado.nombre}
                          </p>
                          <p>
                            <strong>Camión:</strong> {embarqueDetalle.camionAsignado.marca}{" "}
                            {embarqueDetalle.camionAsignado.modelo} ({embarqueDetalle.camionAsignado.numeroEconomico})
                          </p>
                          <p>
                            <strong>Fecha de Enganche:</strong> {embarqueDetalle.fechaEnganche}
                          </p>
                          <p>
                            <strong>Hora de Enganche:</strong> {embarqueDetalle.horaEnganche}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Dirección de Enganche</h3>
                      <p className="text-sm text-gray-600">{embarqueDetalle.direccionEnganche}</p>
                    </div>
                    {embarqueDetalle.comentarios && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Comentarios</h3>
                        <p className="text-sm text-gray-600">{embarqueDetalle.comentarios}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "facturacion" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">Información de Facturación</h3>
                      <Button onClick={() => setShowFacturacionEditModal(true)} size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Folios de Factura</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>Folio 1:</strong> {embarqueDetalle.foliosFactura?.folio1 || "No asignado"}
                          </p>
                          <p>
                            <strong>Folio 2:</strong> {embarqueDetalle.foliosFactura?.folio2 || "No asignado"}
                          </p>
                          <p>
                            <strong>Folio 3:</strong> {embarqueDetalle.foliosFactura?.folio3 || "No asignado"}
                          </p>
                          <p>
                            <strong>Folio 4:</strong> {embarqueDetalle.foliosFactura?.folio4 || "No asignado"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Montos</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>Precio Flete:</strong> $
                            {(embarqueDetalle.precioFlete || embarqueDetalle.montoFacturado || 0).toLocaleString()}{" "}
                            {embarqueDetalle.moneda_flete || "MXN"}
                          </p>
                          <p>
                            <strong>Cantidad Final Facturada:</strong> $
                            {(
                              embarqueDetalle.cantidadFinalFacturada ||
                              embarqueDetalle.precioFlete ||
                              embarqueDetalle.montoFacturado ||
                              0
                            ).toLocaleString()}{" "}
                            {embarqueDetalle.moneda_flete || "MXN"}
                          </p>
                          <p>
                            <strong>Estado de Pago:</strong>{" "}
                            <Badge variant={embarqueDetalle.pagado ? "default" : "secondary"}>
                              {embarqueDetalle.pagado ? "Pagado" : "Pendiente"}
                            </Badge>
                          </p>
                          {embarqueDetalle.fechaPago && (
                            <p>
                              <strong>Fecha de Pago:</strong> {new Date(embarqueDetalle.fechaPago).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {embarqueDetalle.observacionesFacturacion && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Observaciones de Facturación</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {embarqueDetalle.observacionesFacturacion}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "modificaciones" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Historial de Modificaciones</h3>
                    <ModificacionesHistory embarqueId={embarqueDetalle.id} />
                  </div>
                )}
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
                    onChange={(e) => setFacturacionFormData((prev) => ({ ...prev, folio1: e.target.value }))}
                    placeholder="Folio 1"
                  />
                </div>
                <div>
                  <Label htmlFor="folio2">Folio Factura 2:</Label>
                  <Input
                    id="folio2"
                    value={facturacionFormData.folio2}
                    onChange={(e) => setFacturacionFormData((prev) => ({ ...prev, folio2: e.target.value }))}
                    placeholder="Folio 2"
                  />
                </div>
                <div>
                  <Label htmlFor="folio3">Folio Factura 3:</Label>
                  <Input
                    id="folio3"
                    value={facturacionFormData.folio3}
                    onChange={(e) => setFacturacionFormData((prev) => ({ ...prev, folio3: e.target.value }))}
                    placeholder="Folio 3"
                  />
                </div>
                <div>
                  <Label htmlFor="folio4">Folio Factura 4:</Label>
                  <Input
                    id="folio4"
                    value={facturacionFormData.folio4}
                    onChange={(e) => setFacturacionFormData((prev) => ({ ...prev, folio4: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, montoFacturado: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="fecha-entrega">Fecha de Entrega:</Label>
                <Input
                  type="date"
                  id="fecha-entrega"
                  value={formData.fechaEntrega}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fechaEntrega: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="observaciones">Observaciones de Facturación:</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observacionesFacturacion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observacionesFacturacion: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pagado"
                  checked={formData.pagado}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pagado: e.target.checked }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, fechaPago: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="estado-facturacion">Estado de Facturación:</Label>
                <Select
                  value={formData.estado_facturacion}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, estado_facturacion: value as any }))}
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

        {/* Modal para análisis de operadores - VERSIÓN COMPLETA */}
        <Dialog open={showAnalisisOperadoresModal} onOpenChange={setShowAnalisisOperadoresModal}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Análisis de Operadores - Pagos y Rendimiento</DialogTitle>
              <DialogDescription>
                Consultar embarques asignados por operador, calcular pagos por tipo de servicio y gestionar casos de contingencia
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Filtros principales */}
              <div className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="operador-analisis">Operador:</Label>
                  <Select value={filtroAnalisisOperador} onValueChange={setFiltroAnalisisOperador}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los operadores</SelectItem>
                      {operadoresUnicos.map((operador) => (
                        <SelectItem key={operador.id} value={operador.nombre}>
                          {operador.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="periodo-analisis">Período:</Label>
                  <Select value={periodoSeleccionado} onValueChange={handlePeriodoChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mes-actual">Mes Actual</SelectItem>
                      <SelectItem value="mes-anterior">Mes Anterior</SelectItem>
                      <SelectItem value="dos-meses">Últimos 2 Meses</SelectItem>
                      <SelectItem value="tres-meses">Últimos 3 Meses</SelectItem>
                      <SelectItem value="seis-meses">Últimos 6 Meses</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {periodoSeleccionado === "personalizado" && (
                  <>
                    <div className="flex-1 min-w-[150px]">
                      <Label htmlFor="fecha-inicio-analisis">Fecha Inicio:</Label>
                      <Input
                        type="date"
                        id="fecha-inicio-analisis"
                        value={fechaInicioAnalisis}
                        onChange={(e) => setFechaInicioAnalisis(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <Label htmlFor="fecha-fin-analisis">Fecha Fin:</Label>
                      <Input
                        type="date"
                        id="fecha-fin-analisis"
                        value={fechaFinAnalisis}
                        onChange={(e) => setFechaFinAnalisis(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <Button onClick={generarAnalisisOperadores}>
                  Generar Análisis
                </Button>
                <Button onClick={exportarAnalisisExcel} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={imprimirReporteOperadores} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>

              {/* Sistema de pestañas */}
              <div className="flex space-x-4 border-b">
                <Button
                  variant={activeAnalisisTab === "resumen" ? "default" : "outline"}
                  onClick={() => setActiveAnalisisTab("resumen")}
                  size="sm"
                >
                  Resumen General
                </Button>
                <Button
                  variant={activeAnalisisTab === "detallado" ? "default" : "outline"}
                  onClick={() => setActiveAnalisisTab("detallado")}
                  size="sm"
                >
                  Análisis Detallado
                </Button>
                <Button
                  variant={activeAnalisisTab === "contingencia" ? "default" : "outline"}
                  onClick={() => setActiveAnalisisTab("contingencia")}
                  size="sm"
                >
                  Casos de Contingencia
                </Button>
                <Button
                  variant={activeAnalisisTab === "pagos" ? "default" : "outline"}
                  onClick={() => setActiveAnalisisTab("pagos")}
                  size="sm"
                >
                  Cálculo de Pagos
                </Button>
              </div>

              {/* Contenido de las pestañas */}
              {activeAnalisisTab === "resumen" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Resumen General de Operadores</h3>
                  
                  {analisisData.resumenGeneral && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">Total Operadores</p>
                              <p className="text-2xl font-bold text-blue-900">{analisisData.resumenGeneral.totalOperadores}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">Total Embarques</p>
                              <p className="text-2xl font-bold text-green-900">{analisisData.resumenGeneral.totalEmbarques}</p>
                            </div>
                            <Package className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-800">Total a Pagar MXN</p>
                              <p className="text-2xl font-bold text-purple-900">
                                ${analisisData.resumenGeneral.totalPagarMXN?.toLocaleString() || 0}
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-800">Casos Contingencia</p>
                              <p className="text-2xl font-bold text-orange-900">{analisisData.resumenGeneral.casosContingencia || 0}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Tabla resumen por operador */}
                  {analisisData.analisisPorOperador && analisisData.analisisPorOperador.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Embarques</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contingencia</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total a Pagar</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promedio/Embarque</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analisisData.analisisPorOperador.map((operador, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {operador.nombre}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                <Badge variant="outline">{operador.totalEmbarques}</Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {operador.embarquesContingencia > 0 ? (
                                  <Badge variant="destructive">{operador.embarquesContingencia}</Badge>
                                ) : (
                                  <Badge variant="secondary">0</Badge>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                ${operador.totalPagar.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                ${operador.promedioPorEmbarque.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <Badge variant={operador.embarquesContingencia > 0 ? "destructive" : "default"}>
                                  {operador.embarquesContingencia > 0 ? "Requiere Revisión" : "Normal"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeAnalisisTab === "detallado" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Análisis Detallado por Operador</h3>
                  
                  {analisisData.embarquesFiltradosAnalisis && analisisData.embarquesFiltradosAnalisis.length > 0 ? (
                    <div className="space-y-4">
                      {analisisData.analisisPorOperador.map((operadorData, index) => (
                        <Card key={index} className="border-gray-200">
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg text-gray-800">{operadorData.nombre}</CardTitle>
                              <div className="flex space-x-2">
                                <Badge variant="outline">{operadorData.totalEmbarques} embarques</Badge>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  ${operadorData.totalPagar.toLocaleString()}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo Servicio</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pago Operador</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {operadorData.embarques.map((embarque) => (
                                    <tr key={embarque.id} className={embarque.modificadoPorEmergencia ? "bg-red-50" : ""}>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {embarque.folio}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                        <div className="max-w-32 truncate" title={embarque.clienteNombre}>
                                          {embarque.clienteNombre}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(embarque.fechaAsignacion).toLocaleDateString("es-MX")}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                        <div className="max-w-32 truncate" title={embarque.tipoServicioNombre}>
                                          {embarque.tipoServicioNombre || "Sin especificar"}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-green-600">
                                        ${embarque.pagoOperador?.toLocaleString() || 0}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        {embarque.modificadoPorEmergencia ? (
                                          <Badge variant="destructive" className="text-xs">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Contingencia
                                          </Badge>
                                        ) : (
                                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                            Normal
                                          </Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No se encontraron datos para el período seleccionado</p>
                      <p className="text-sm text-gray-400 mt-1">Ajusta los filtros y genera el análisis nuevamente</p>
                    </div>
                  )}
                </div>
              )}

              {activeAnalisisTab === "contingencia" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Gestión de Casos de Contingencia</h3>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">¿Qué son los casos de contingencia?</h4>
                    <p className="text-sm text-orange-800 mb-2">
                      Los casos de contingencia ocurren cuando un embarque asignado originalmente a un operador debe ser 
                      reasignado a otro operador por situaciones de emergencia (enfermedad, accidente, etc.).
                    </p>
                    <p className="text-xs text-orange-700">
                      • <strong>Operador Original:</strong> Quien tenía la asignación inicial del embarque<br/>
                      • <strong>Operador de Reemplazo:</strong> Quien finalmente realizó el embarque<br/>
                      • <strong>División de Pago:</strong> Puedes asignar manualmente cómo dividir el pago entre ambos operadores
                    </p>
                  </div>

                  {/* Casos de contingencia encontrados */}
                  {analisisData.embarquesFiltradosAnalisis && (
                    <div className="space-y-4">
                      {analisisData.embarquesFiltradosAnalisis
                        .filter(e => e.modificadoPorEmergencia)
                        .map((embarque) => (
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
                                    <p><strong>Cliente:</strong> {embarque.clienteNombre}</p>
                                    <p><strong>Fecha:</strong> {new Date(embarque.fechaAsignacion).toLocaleDateString("es-MX")}</p>
                                    <p><strong>Tipo de Servicio:</strong> {embarque.tipoServicioNombre || "Sin especificar"}</p>
                                    <p><strong>Pago Base:</strong> ${embarque.pagoOperador?.toLocaleString() || 0}</p>
                                    {embarque.motivoModificacion && (
                                      <p><strong>Motivo:</strong> {embarque.motivoModificacion}</p>
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
                                        <span className="text-sm font-medium text-gray-700">Operador Original:</span>
                                        <Badge variant="outline">Original</Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">
                                        {operadoresContingenciaData[embarque.id]?.original?.nombre || "No especificado"}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <Label htmlFor={`pago-original-${embarque.id}`} className="text-xs">Pago:</Label>
                                        <Input
                                          type="number"
                                          id={`pago-original-${embarque.id}`}
                                          defaultValue={operadoresContingencia[embarque.id]?.original || 0}
                                          onChange={(e) => {
                                            const valor = Number(e.target.value)
                                            setOperadoresContingencia(prev => ({
                                              ...prev,
                                              [embarque.id]: {
                                                ...prev[embarque.id],
                                                original: valor
                                              }
                                            }))
                                          }}
                                          className="w-24 text-xs"
                                          placeholder="0"
                                        />
                                        <span className="text-xs text-gray-500">\
