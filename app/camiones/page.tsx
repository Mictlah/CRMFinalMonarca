"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Truck, Plus, Search, Edit, Trash2, Download, Gauge, Calendar, Shield, AlertTriangle, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase, type Camion, type MarcaCamion } from "@/lib/supabase"

export default function CamionesPage() {
  // Helper variables and stubs for missing functions
  const [marcasTableExists, setMarcasTableExists] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingMarca, setEditingMarca] = useState(false)
  const [marcaFormData, setMarcaFormData] = useState({ nombre: "" })
  const [loadingMarcas, setLoadingMarcas] = useState(false)

  // Consulta real a Supabase para cargar camiones
  const cargarCamiones = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("camiones").select("*")
      if (error) {
        console.error("Error cargando camiones:", error)
        setCamiones([])
      } else {
        setCamiones(data || [])
      }
    } catch (error) {
      console.error("Error inesperado cargando camiones:", error)
      setCamiones([])
    } finally {
      setLoading(false)
    }
  }
  // Cargar camiones al montar el componente
  useEffect(() => {
    cargarCamiones()
  }, [])

  // Stub for limpiarFormulario
  const limpiarFormulario = () => {
    setFormData({})
    setEditingCamion(null)
  }

  // Stub for guardarCamion
  const guardarCamion = async () => {
    setSaving(true)
    // TODO: Implement actual save logic
    setSaving(false)
  }

  // Stub for limpiarFormularioMarca
  const limpiarFormularioMarca = () => {
    setMarcaFormData({ nombre: "" })
    setEditingMarca(false)
  }

  // Stub for guardarMarca
  const guardarMarca = async () => {
    // TODO: Implement actual save logic
    limpiarFormularioMarca()
  }

  // Stub for editarMarca
  const editarMarca = (marca: MarcaCamion) => {
    setEditingMarca(true)
    setMarcaFormData({ nombre: marca.nombre })
  }

  // Stub for eliminarMarca
  const eliminarMarca = async (id: string) => {
    // TODO: Implement actual delete logic
    return
  }
  // Main state variables
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingCamion, setEditingCamion] = useState<Camion | null>(null)
  const [formData, setFormData] = useState<any>({
    numero_economico: "",
    marca: "",
    modelo: "",
    año: "",
    numero_serie: "",
    placas: "",
    kilometraje: "",
    estado: "",
    ultima_verificacion: "",
    frecuencia_verificacion: "",
    poliza_seguro_mexicano: "",
    fecha_vencimiento_seguro_mexicano: "",
    poliza_seguro_americano: "",
    fecha_vencimiento_seguro_americano: "",
    comentarios: "",
    tag_americano: "",
    tag_mexicano: "",
    numero_base: "",
    numeros_adicionales: [],
  })
  const [tieneRegistrosKilometraje, setTieneRegistrosKilometraje] = useState(false)
  const [registrosKilometrajeTableExists, setRegistrosKilometrajeTableExists] = useState(true)
  const [registrosMantenimientoTableExists, setRegistrosMantenimientoTableExists] = useState(true)
  const [marcas, setMarcas] = useState<MarcaCamion[]>([])
  const marcasDefault = ["Kenworth", "Freightliner", "Volvo", "International", "Peterbilt"]
  const [showMarcasForm, setShowMarcasForm] = useState(false)
  // Cambiar la línea existente de activeTab para que maneje tanto el formulario como los detalles
  const [activeTab, setActiveTab] = useState("basica")
  const [loading, setLoading] = useState(false)
  const [selectedCamionKilometraje, setSelectedCamionKilometraje] = useState<Camion | null>(null)
  const [kilometrajeFormData, setKilometrajeFormData] = useState<any>({})
  const [historialKilometraje, setHistorialKilometraje] = useState<any[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [historialMantenimiento, setHistorialMantenimiento] = useState<any[]>([])
  const [showKilometrajeForm, setShowKilometrajeForm] = useState(false)
  const [showMantenimientoForm, setShowMantenimientoForm] = useState(false)
  const [selectedCamionMantenimiento, setSelectedCamionMantenimiento] = useState<Camion | null>(null)
  const [mantenimientoFormData, setMantenimientoFormData] = useState<any>({})
  const [camionDetalle, setCamionDetalle] = useState<Camion | null>(null)
  const [showDetallesCamion, setShowDetallesCamion] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<any>(null)
  const [editRegistroFormData, setEditRegistroFormData] = useState<any>({})
  const [showEditRegistroForm, setShowEditRegistroForm] = useState(false)
  const [editingRegistroMantenimiento, setEditingRegistroMantenimiento] = useState<any>(null)
  const [editMantenimientoFormData, setEditMantenimientoFormData] = useState<any>({})
  const [showEditMantenimientoForm, setShowEditMantenimientoForm] = useState(false)
  const [loadingHistorialMantenimiento, setLoadingHistorialMantenimiento] = useState(false)
  const [currentPageKilometraje, setCurrentPageKilometraje] = useState(1)
  const [recordsPerPageKilometraje, setRecordsPerPageKilometraje] = useState(10) // Default to 10 records per page

  const eliminarCamion = async (id: string) => {
    try {
      // Obtener información del camión
      const camion = camiones.find((c) => c.id === id)
      if (!camion) {
        alert("Camión no encontrado")
        return
      }

      // 1. Verificar si el camión está siendo usado en embarques ACTIVOS
      const { data: embarquesActivos, error: errorEmbarques } = await supabase
        .from("embarques")
        .select("id, folio, estado")
        .eq("camion_id", id)
        .in("estado", ["pendiente", "en-transito", "en-proceso", "asignado"])

      if (errorEmbarques) {
        console.error("Error verificando embarques:", errorEmbarques)
        alert("Error al verificar si el camión está en uso")
        return
      }

      if (embarquesActivos && embarquesActivos.length > 0) {
        const folios = embarquesActivos.map((e) => e.folio).join(", ")
        alert(
          `❌ NO SE PUEDE ELIMINAR\n\nEl camión ${camion.numero_economico} está asignado a ${embarquesActivos.length} embarque(s) activo(s):\n${folios}\n\n🔄 ACCIÓN REQUERIDA:\nPrimero debes reasignar estos embarques a otro camión o completar/cancelar los embarques antes de poder eliminar esta unidad.`,
        )
        return
      }
      // Validación adicional: impedir eliminar si hay embarques no archivados
      const { data: embarquesNoArchivados, error: errorNoArchivados } = await supabase
        .from("embarques")
        .select("id, folio, estado_facturacion")
        .eq("camion_id", id)
        .not("estado_facturacion", "eq", "archivado")

      if (errorNoArchivados) {
        console.error("Error verificando embarques no archivados:", errorNoArchivados)
        alert("Error al verificar embarques no archivados")
        return
      }

      if (embarquesNoArchivados && embarquesNoArchivados.length > 0) {
        const foliosNoArchivados = embarquesNoArchivados.map((e) => e.folio).join(", ")
        alert(
          `❌ NO SE PUEDE ELIMINAR\n\nEl camión ${camion.numero_economico} tiene embarques que aún no están archivados en facturación y cobranza:\n${foliosNoArchivados}\n\n🔄 ACCIÓN REQUERIDA:\nDebes archivar estos embarques antes de poder eliminar esta unidad.`,
        )
        return
      }

      // 2. Verificar si el camión NO está marcado como "fuera-de-servicio"
      if (camion.estado !== "fuera-de-servicio") {
        const confirmarCambioEstado = confirm(
          `⚠️ CAMBIO DE ESTADO REQUERIDO\n\nEl camión ${
            camion.numero_economico
          } debe estar marcado como "Fuera de Servicio" antes de poder eliminarlo.\n\n📋 ESTADO ACTUAL: ${camion.estado.toUpperCase()}\n\n¿Deseas cambiar el estado a "Fuera de Servicio" ahora?\n\n(Después podrás proceder con la eliminación)`,
        )

        if (!confirmarCambioEstado) {
          return
        }

        // Cambiar estado a fuera de servicio
        const { error: errorCambioEstado } = await supabase
          .from("camiones")
          .update({
            estado: "fuera-de-servicio",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (errorCambioEstado) {
          console.error("Error cambiando estado:", errorCambioEstado)
          alert("Error al cambiar el estado del camión")
          return
        }

        alert(
          `✅ ESTADO ACTUALIZADO\n\nEl camión ${camion.numero_economico} ha sido marcado como "Fuera de Servicio".\n\n🗑️ Ahora puedes eliminarlo definitivamente si es necesario usando nuevamente el botón de eliminar.`,
        )

        await cargarCamiones() // Recargar la lista para mostrar el nuevo estado
        return
      }

      // 3. Verificar embarques completados/históricos
      const { data: embarquesHistoricos, error: errorHistoricos } = await supabase
        .from("embarques")
        .select("id")
        .eq("camion_id", id)

      if (errorHistoricos) {
        console.error("Error verificando embarques históricos:", errorHistoricos)
      }

      // 4. Verificar registros de kilometraje
      let tieneRegistrosKilometraje = false
      if (registrosKilometrajeTableExists) {
        try {
          const { data: registrosKm, error: errorKm } = await supabase
            .from("registros_kilometraje")
            .select("id")
            .eq("camion_id", id)
            .limit(1)

          if (!errorKm && registrosKm && registrosKm.length > 0) {
            tieneRegistrosKilometraje = true
          }
        } catch (error) {
          console.log("Error verificando registros de kilometraje:", error)
        }
      }

      // 5. Verificar registros de mantenimiento
      let tieneRegistrosMantenimiento = false
      if (registrosMantenimientoTableExists) {
        try {
          const { data: registrosMant, error: errorMant } = await supabase
            .from("registros_mantenimiento")
            .select("id")
            .eq("camion_id", id)
            .limit(1)

          if (!errorMant && registrosMant && registrosMant.length > 0) {
            tieneRegistrosMantenimiento = true
          }
        } catch (error) {
          console.log("Error verificando registros de mantenimiento:", error)
        }
      }

      // 6. Verificar recordatorios relacionados
      const { data: recordatoriosRelacionados, error: errorRecordatorios } = await supabase
        .from("recordatorios")
        .select("id, titulo, estado")
        .eq("camion_id", id)

      if (errorRecordatorios) {
        console.error("Error verificando recordatorios:", errorRecordatorios)
      }

      // 7. Construir mensaje de advertencia final con todos los datos que se eliminarán
      let mensajeAdvertencia = `🚨 ADVERTENCIA - ELIMINACIÓN DEFINITIVA\n\n`
      mensajeAdvertencia += `Estás a punto de ELIMINAR PERMANENTEMENTE el camión:\n`
      mensajeAdvertencia += `🚛 ${camion.numero_economico} - ${camion.marca} ${camion.modelo}\n\n`

      mensajeAdvertencia += `📊 DATOS QUE SE ELIMINARÁN:\n`

      if (embarquesHistoricos && embarquesHistoricos.length > 0) {
        mensajeAdvertencia += `• ${embarquesHistoricos.length} embarque(s) histórico(s)\n`
      }

      if (tieneRegistrosKilometraje) {
        mensajeAdvertencia += `• Historial completo de kilometraje y viajes\n`
      }

      if (tieneRegistrosMantenimiento) {
        mensajeAdvertencia += `• Historial completo de mantenimientos\n`
      }

      if (recordatoriosRelacionados && recordatoriosRelacionados.length > 0) {
        const pendientes = recordatoriosRelacionados.filter((r) => r.estado === "pendiente").length
        mensajeAdvertencia += `• ${recordatoriosRelacionados.length} recordatorio(s) (${pendientes} pendientes)\n`
      }

      mensajeAdvertencia += `• Toda la información técnica y documentos\n\n`
      mensajeAdvertencia += `⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER\n\n`
      mensajeAdvertencia += `¿Estás COMPLETAMENTE SEGURO de que deseas eliminar esta unidad y todos sus datos asociados?`

      const confirmarEliminacionFinal = confirm(mensajeAdvertencia)

      if (!confirmarEliminacionFinal) {
        return
      }

      // 8. Proceder con la eliminación en orden correcto
      console.log("Iniciando eliminación completa del camión:", camion.numero_economico)

      // Eliminar registros de kilometraje
      if (tieneRegistrosKilometraje) {
        const { error: errorEliminandoKm } = await supabase.from("registros_kilometraje").delete().eq("camion_id", id)

        if (errorEliminandoKm) {
          console.error("Error eliminando registros de kilometraje:", errorEliminandoKm)
          alert("Error al eliminar registros de kilometraje")
          return
        }
      }

      // Eliminar registros de mantenimiento
      if (tieneRegistrosMantenimiento) {
        const { error: errorEliminandoMant } = await supabase
          .from("registros_mantenimiento")
          .delete()
          .eq("camion_id", id)

        if (errorEliminandoMant) {
          console.error("Error eliminando registros de mantenimiento:", errorEliminandoMant)
          alert("Error al eliminar registros de mantenimiento")
          return
        }
      }

      // Eliminar recordatorios relacionados
      if (recordatoriosRelacionados && recordatoriosRelacionados.length > 0) {
        const { error: errorEliminandoRecordatorios } = await supabase
          .from("recordatorios")
          .delete()
          .eq("camion_id", id)

        if (errorEliminandoRecordatorios) {
          console.error("Error eliminando recordatorios:", errorEliminandoRecordatorios)
          alert("Error al eliminar recordatorios relacionados")
          return
        }
      }

      // Eliminar embarques históricos
      if (embarquesHistoricos && embarquesHistoricos.length > 0) {
        const { error: errorEliminandoEmbarques } = await supabase.from("embarques").delete().eq("camion_id", id)

        if (errorEliminandoEmbarques) {
          console.error("Error eliminando embarques históricos:", errorEliminandoEmbarques)
          alert("Error al eliminar embarques relacionados")
          return
        }
      }

      // Finally, eliminar el camión
      const { error } = await supabase.from("camiones").delete().eq("id", id)

      if (error) {
        console.error("Error eliminando camión:", error)
        alert("Error al eliminar el camión")
        return
      }

      // Mensaje de confirmación
      let mensajeExito = `✅ ELIMINACIÓN COMPLETADA\n\n`
      mensajeExito += `El camión ${camion.numero_economico} ha sido eliminado exitosamente junto con:\n`

      if (embarquesHistoricos && embarquesHistoricos.length > 0) {
        mensajeExito += `• ${embarquesHistoricos.length} embarque(s) histórico(s)\n`
      }
      if (tieneRegistrosKilometraje) {
        mensajeExito += `• Historial de kilometraje\n`
      }
      if (tieneRegistrosMantenimiento) {
        mensajeExito += `• Historial de mantenimientos\n`
      }
      if (recordatoriosRelacionados && recordatoriosRelacionados.length > 0) {
        mensajeExito += `• ${recordatoriosRelacionados.length} recordatorio(s)\n`
      }

      alert(mensajeExito)
      await cargarCamiones() // Recargar la lista
    } catch (error) {
      console.error("Error en eliminación:", error)
      alert("Error inesperado al eliminar el camión")
    }
  }

  const cambiarEstadoFueraServicio = async (id: string) => {
    try {
      const camion = camiones.find((c) => c.id === id)
      if (!camion) return

      const nuevoEstado = camion.estado === "fuera-de-servicio" ? "disponible" : "fuera-de-servicio"

      const { error } = await supabase
        .from("camiones")
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Error cambiando estado:", error)
        alert("Error al cambiar estado del camión")
        return
      }

      alert(
        `Camión ${camion.numero_economico} ${
          nuevoEstado === "fuera-de-servicio" ? "marcado como fuera de servicio" : "reactivado"
        }`,
      )
      await cargarCamiones() // Recargar la lista
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cambiar estado del camión")
    }
  }

  const camionesFiltrados = camiones.filter(
    (camion) =>
      camion.numero_economico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (camion.marca && camion.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (camion.modelo && camion.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (camion.placas && camion.placas.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getEstadoBadge = (estado: string) => {
    const estados = {
      disponible: { color: "bg-green-100 text-green-800", label: "Disponible" },
      "en-uso": { color: "bg-blue-100 text-blue-800", label: "En Uso" },
      mantenimiento: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Mantenimiento",
      },
      "fuera-de-servicio": {
        color: "bg-red-100 text-red-800",
        label: "Fuera de Servicio",
      },
    }

    const estadoInfo = estados[estado as keyof typeof estados] || {
      color: "bg-gray-100 text-gray-800",
      label: estado,
    }

    return <Badge className={`${estadoInfo.color} hover:${estadoInfo.color}`}>{estadoInfo.label}</Badge>
  }

  const verificarVencimientos = (camion: Camion) => {
    const alertas = []

    if (camion.observaciones) {
      try {
        const datos = JSON.parse(camion.observaciones)

        // Verificar seguro mexicano
        if (datos.fecha_vencimiento_seguro_mexicano) {
          const fechaVencimiento = new Date(datos.fecha_vencimiento_seguro_mexicano)
          const hoy = new Date()
          const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

          if (diasRestantes <= 30) {
            alertas.push({
              tipo: "seguro_mexicano",
              dias: Math.abs(diasRestantes),
              vencido: diasRestantes <= 0,
              fecha: fechaVencimiento.toLocaleDateString(),
              mensaje:
                diasRestantes <= 0
                  ? `Seguro Mexicano vencido hace ${Math.abs(diasRestantes)} días`
                  : `Seguro Mexicano vence en ${diasRestantes} días`,
            })
          }
        }

        // Verificar seguro americano
        if (datos.fecha_vencimiento_seguro_americano) {
          const fechaVencimiento = new Date(datos.fecha_vencimiento_seguro_americano)
          const hoy = new Date()
          const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

          if (diasRestantes <= 30) {
            alertas.push({
              tipo: "seguro_americano",
              dias: Math.abs(diasRestantes),
              vencido: diasRestantes <= 0,
              fecha: fechaVencimiento.toLocaleDateString(),
              mensaje:
                diasRestantes <= 0
                  ? `Seguro Americano vencido hace ${Math.abs(diasRestantes)} días`
                  : `Seguro Americano vence en ${diasRestantes} días`,
            })
          }
        }

        // Verificar verificación
        if (datos.frecuencia_verificacion) {
          const proximaVerificacion = new Date(datos.frecuencia_verificacion)
          const hoy = new Date()
          const diasRestantes = Math.ceil((proximaVerificacion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

          if (diasRestantes <= 15) {
            alertas.push({
              tipo: "verificacion",
              dias: Math.abs(diasRestantes),
              vencido: diasRestantes <= 0,
              fecha: proximaVerificacion.toLocaleDateString(),
              mensaje:
                diasRestantes <= 0
                  ? `Verificación vencida hace ${Math.abs(diasRestantes)} días`
                  : `Verificación en ${Math.abs(diasRestantes)} días`,
            })
          }
        }
      } catch (error) {
        // Ignorar errores de parsing
      }
    }

    return alertas
  }

  const descargarExcel = () => {
    if (camiones.length === 0) {
      alert("No hay camiones para descargar")
      return
    }

    const headers = ["Número Económico", "Marca", "Modelo", "Año", "Placas", "Kilometraje", "Estado", "Fecha Registro"]

    const csvContent = [
      headers.join(","),
      ...camiones.map((camion) =>
        [
          `"${camion.numero_economico}"`,
          `"${camion.marca || ""}"`,
          `"${camion.modelo || ""}"`,
          `"${camion.año || ""}"`,
          `"${camion.placas || ""}"`,
          `"${camion.kilometraje}"`,
          `"${camion.estado}"`,
          `"${camion.fecha_registro}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `camiones_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Obtener marcas disponibles (de la BD o por defecto)
  const getMarcasDisponibles = () => {
    if (marcasTableExists && marcas.length > 0) {
      return marcas.map((marca) => marca.nombre)
    }
    return marcasDefault
  }

  const limpiarFormularioKilometraje = () => {
    setKilometrajeFormData({
      kilometraje_actual: "",
      tramo_recorrido: "",
      fecha_viaje: "",
      comentarios_viaje: "",
    })
    setSelectedCamionKilometraje(null)
  }

  const verificarTablaRegistrosKilometraje = async () => {
    try {
      const { data, error } = await supabase.from("registros_kilometraje").select("id").limit(1)

      if (error) {
        if (error.message.includes("does not exist") || error.code === "42P01") {
          console.log("Tabla registros_kilometraje no existe")
          setRegistrosKilometrajeTableExists(false)
        } else {
          console.error("Error verificando tabla registros_kilometraje:", error)
          setRegistrosKilometrajeTableExists(false)
        }
      } else {
        setRegistrosKilometrajeTableExists(true)
      }
    } catch (error) {
      console.error("Error en verificarTablaRegistrosKilometraje:", error)
      setRegistrosKilometrajeTableExists(false)
    }
  }

  const verificarTablaRegistrosMantenimiento = async () => {
    try {
      const { data, error } = await supabase.from("registros_mantenimiento").select("id").limit(1)

      if (error) {
        if (error.message.includes("does not exist") || error.code === "42P01") {
          console.log("Tabla registros_mantenimiento no existe")
          setRegistrosMantenimientoTableExists(false)
        } else {
          console.error("Error verificando tabla registros_mantenimiento:", error)
          setRegistrosMantenimientoTableExists(false)
        }
      } else {
        setRegistrosMantenimientoTableExists(true)
      }
    } catch (error) {
      console.error("Error en verificarTablaRegistrosMantenimiento:", error)
      setRegistrosMantenimientoTableExists(false)
    }
  }

  const guardarKilometraje = async () => {
    if (!registrosKilometrajeTableExists) {
      alert(
        "La tabla de registros de kilometraje no existe. Por favor ejecuta el script de migración de base de datos.",
      )
      return
    }

    if (
      !selectedCamionKilometraje ||
      !kilometrajeFormData.kilometraje_actual ||
      !kilometrajeFormData.tramo_recorrido ||
      !kilometrajeFormData.fecha_viaje
    ) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    try {
      const kilometrajeActual = Number.parseInt(kilometrajeFormData.kilometraje_actual)
      const kilometrajeAgregado = kilometrajeActual - selectedCamionKilometraje.kilometraje

      if (kilometrajeAgregado <= 0) {
        alert("El kilometraje actual debe ser mayor al kilometraje anterior del camión")
        return
      }

      // Actualizar el kilometraje del camión
      const { error: errorCamion } = await supabase
        .from("camiones")
        .update({
          kilometraje: kilometrajeActual,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCamionKilometraje.id)

      if (errorCamion) {
        console.error("Error actualizando kilometraje:", errorCamion)
        alert("Error al actualizar kilometraje del camión")
        return
      }

      // Crear registro de viaje
      const registroViaje = {
        camion_id: selectedCamionKilometraje.id,
        kilometraje_anterior: selectedCamionKilometraje.kilometraje,
        kilometraje_agregado: kilometrajeAgregado,
        kilometraje_nuevo: kilometrajeActual,
        tramo_recorrido: kilometrajeFormData.tramo_recorrido,
        fecha_viaje: kilometrajeFormData.fecha_viaje,
        comentarios: kilometrajeFormData.comentarios_viaje,
        fecha_registro: new Date().toISOString(),
      }

      // Intentar guardar en tabla de registros de viaje
      const { error: errorViaje } = await supabase.from("registros_kilometraje").insert(registroViaje)

      if (errorViaje) {
        console.log("Tabla de registros de kilometraje no existe, solo se actualizó el camión")
      }

      // Verificar si se alcanzaron los 30,000 km para programar mantenimiento
      const kilometrajeAnterior = selectedCamionKilometraje.kilometraje
      const nuevoKilometrajeTotal = kilometrajeActual

      // Calcular en qué múltiplo de 30,000 estaba antes y en cuál está ahora
      const multiploAnterior = Math.floor(kilometrajeAnterior / 30000)
      const multiploNuevo = Math.floor(nuevoKilometrajeTotal / 30000)

      // Si cambió de múltiplo, significa que cruzó una marca de 30,000 km
      if (multiploNuevo > multiploAnterior) {
        const kilometrajeMeta = multiploNuevo * 30000

        // Mostrar popup de alerta inmediatamente
        const mensaje = `¡ATENCIÓN - MANTENIMIENTO REQUERIDO!\n\nEl camión ${
          selectedCamionKilometraje.numero_economico
        } ha alcanzado ${kilometrajeMeta.toLocaleString()} kilómetros.\n\nSe ha programado automáticamente un recordatorio de mantenimiento que aparecerá en:\n• La sección de Recordatorios\n• Las notificaciones del sistema (campana)\n\n¿Desea continuar?`

        if (confirm(mensaje)) {
          await programarMantenimientoPorKilometraje(
            selectedCamionKilometraje.id,
            selectedCamionKilometraje.numero_economico,
            kilometrajeMeta,
          )
        }
      }

      // Actualizar el camión seleccionado con el nuevo kilometraje
      setSelectedCamionKilometraje({
        ...selectedCamionKilometraje,
        kilometraje: kilometrajeActual,
      })

      // Limpiar solo los campos del formulario, mantener el camión seleccionado
      setKilometrajeFormData({
        kilometraje_actual: "",
        tramo_recorrido: "",
        fecha_viaje: new Date().toISOString().split("T")[0],
        comentarios_viaje: "",
      })

      await cargarCamiones()

      // Recargar historial si estamos en la ventana de detalles
      if (camionDetalle && camionDetalle.id === selectedCamionKilometraje.id) {
        await cargarHistorialKilometraje(selectedCamionKilometraje.id)
      }

      alert("Kilometraje registrado exitosamente")
    } catch (error) {
      console.error("Error guardando kilometraje:", error)
      alert("Error al guardar kilometraje")
    }
  }

  const programarMantenimientoPorKilometraje = async (
    camionId: string,
    numeroEconomico: string,
    kilometraje: number,
  ) => {
    try {
      const fechaActual = new Date()

      const recordatorio = {
        titulo: `🔧 MANTENIMIENTO PROGRAMADO - Camión ${numeroEconomico}`,
        descripcion: `MANTENIMIENTO REQUERIDO: El camión ha alcanzado ${kilometraje.toLocaleString()} kilómetros. Es necesario realizar mantenimiento preventivo según el programa de la empresa. Revisar: motor, frenos, suspensión, fluidos y sistemas generales.`,
        fecha_vencimiento: fechaActual.toISOString(),
        tipo: "mantenimiento_programado",
        prioridad: "alta",
        estado: "pendiente",
        camion_id: camionId,
      }

      const { error } = await supabase.from("recordatorios").insert(recordatorio)

      if (error) {
        console.error("Error creando recordatorio de mantenimiento:", error)
        alert("Error al crear el recordatorio de mantenimiento")
      } else {
        // Mostrar confirmación de que se creó el recordatorio
        alert(
          `✅ RECORDATORIO CREADO\n\nSe ha programado un recordatorio de mantenimiento para el camión ${numeroEconomico}.\n\nPodrás verlo en:\n• Sección Recordatorios\n• Notificaciones (campana) en el header`,
        )
      }
    } catch (error) {
      console.error("Error programando mantenimiento:", error)
      alert("Error al programar el mantenimiento")
    }
  }

  const cargarHistorialKilometraje = async (camionId: string) => {
    try {
      setLoadingHistorial(true)
      const { data, error } = await supabase
        .from("registros_kilometraje")
        .select("*")
        .eq("camion_id", camionId)
        .order("fecha_registro", { ascending: false })

      if (error) {
        console.log("Tabla de registros de kilometraje no existe")
        setHistorialKilometraje([])
      } else {
        setHistorialKilometraje(data || [])
      }
    } catch (error) {
      console.error("Error cargando historial:", error)
      setHistorialKilometraje([])
    } finally {
      setLoadingHistorial(false)
    }
  }

  const cargarHistorialMantenimiento = async (camionId: string) => {
    try {
      setLoadingHistorialMantenimiento(true)
      const { data, error } = await supabase
        .from("registros_mantenimiento")
        .select("*")
        .eq("camion_id", camionId)
        .order("fecha_mantenimiento", { ascending: false })

      if (error) {
        console.log("Tabla de registros de mantenimiento no existe")
        setHistorialMantenimiento([])
      } else {
        setHistorialMantenimiento(data || [])
      }
    } catch (error) {
      console.error("Error cargando historial de mantenimiento:", error)
      setHistorialMantenimiento([])
    } finally {
      setLoadingHistorialMantenimiento(false)
    }
  }

  const eliminarRegistroKilometraje = async (registroId: string, camionId: string, kilometrajeEliminado: number) => {
    try {
      const { error } = await supabase.from("registros_kilometraje").delete().eq("id", registroId)

      if (error) {
        alert("Error al eliminar registro")
        return
      }

      // Actualizar el kilometraje del camión restando el kilometraje eliminado
      const camionActual = camiones.find((c) => c.id === camionId)
      if (camionActual) {
        const nuevoKilometraje = Math.max(0, camionActual.kilometraje - kilometrajeEliminado)

        await supabase
          .from("camiones")
          .update({
            kilometraje: nuevoKilometraje,
            updated_at: new Date().toISOString(),
          })
          .eq("id", camionId)
      }

      await cargarCamiones()
      await cargarHistorialKilometraje(camionId)
    } catch (error) {
      console.error("Error eliminando registro:", error)
      alert("Error al eliminar registro")
    }
  }

  const editarRegistroKilometraje = (registro: any) => {
    setEditingRegistro(registro)
    setEditRegistroFormData({
      kilometraje_agregado: registro.kilometraje_agregado?.toString() || "",
      tramo_recorrido: registro.tramo_recorrido || "",
      fecha_viaje: registro.fecha_viaje || "",
      comentarios_viaje: registro.comentarios || "",
    })
    setShowEditRegistroForm(true)
  }

  const guardarEdicionRegistro = async () => {
    if (
      !editingRegistro ||
      !editRegistroFormData.kilometraje_agregado ||
      !editRegistroFormData.tramo_recorrido ||
      !editRegistroFormData.fecha_viaje
    ) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    try {
      const nuevoKilometrajeAgregado = Number.parseInt(editRegistroFormData.kilometraje_agregado)
      const diferencia = nuevoKilometrajeAgregado - editingRegistro.kilometraje_agregado

      // Actualizar el registro
      const { error } = await supabase
        .from("registros_kilometraje")
        .update({
          kilometraje_agregado: nuevoKilometrajeAgregado,
          kilometraje_nuevo: editingRegistro.kilometraje_anterior + nuevoKilometrajeAgregado,
          tramo_recorrido: editRegistroFormData.tramo_recorrido,
          fecha_viaje: editRegistroFormData.fecha_viaje,
          comentarios: editRegistroFormData.comentarios_viaje,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRegistro.id)

      if (error) {
        alert("Error al actualizar registro")
        return
      }

      // Actualizar el kilometraje del camión
      if (camionDetalle && diferencia !== 0) {
        const nuevoKilometrajeTotal = camionDetalle.kilometraje + diferencia

        await supabase
          .from("camiones")
          .update({
            kilometraje: Math.max(0, nuevoKilometrajeTotal),
            updated_at: new Date().toISOString(),
          })
          .eq("id", camionDetalle.id)
      }

      alert("Registro actualizado exitosamente")
      setShowEditRegistroForm(false)
      setEditingRegistro(null)
      await cargarCamiones()
      await cargarHistorialKilometraje(camionDetalle.id)
    } catch (error) {
      console.error("Error actualizando registro:", error)
      alert("Error al actualizar registro")
    }
  }

  const cancelarEdicionRegistro = () => {
    setShowEditRegistroForm(false)
    setEditingRegistro(null)
    setEditRegistroFormData({
      kilometraje_agregado: "",
      tramo_recorrido: "",
      fecha_viaje: "",
      comentarios_viaje: "",
    })
  }

  const editarRegistroMantenimiento = (registro: any) => {
    setEditingRegistroMantenimiento(registro)
    setEditMantenimientoFormData({
      fecha_mantenimiento: registro.fecha_mantenimiento || "",
      tipo_mantenimiento: registro.tipo_mantenimiento || "",
      detalles_mantenimiento: registro.detalles_mantenimiento || "",
      proximo_mantenimiento: registro.proximo_mantenimiento || "",
    })
    setShowEditMantenimientoForm(true)
  }

  const guardarEdicionMantenimiento = async () => {
    if (
      !editingRegistroMantenimiento ||
      !editMantenimientoFormData.fecha_mantenimiento ||
      !editMantenimientoFormData.detalles_mantenimiento
    ) {
      alert("Por favor completa los campos obligatorios: fecha y detalles")
      return
    }

    try {
      const { error } = await supabase
        .from("registros_mantenimiento")
        .update({
          fecha_mantenimiento: editMantenimientoFormData.fecha_mantenimiento,
          tipo_mantenimiento: editMantenimientoFormData.tipo_mantenimiento,
          detalles_mantenimiento: editMantenimientoFormData.detalles_mantenimiento,
          proximo_mantenimiento: editMantenimientoFormData.proximo_mantenimiento,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRegistroMantenimiento.id)

      if (error) {
        alert("Error al actualizar registro de mantenimiento")
        return
      }

      alert("Registro de mantenimiento actualizado exitosamente")
      setShowEditMantenimientoForm(false)
      setEditingRegistroMantenimiento(null)
      await cargarHistorialMantenimiento(camionDetalle.id)
    } catch (error) {
      console.error("Error actualizando registro de mantenimiento:", error)
      alert("Error al actualizar registro de mantenimiento")
    }
  }

  const cancelarEdicionMantenimiento = () => {
    setShowEditMantenimientoForm(false)
    setEditingRegistroMantenimiento(null)
    setEditMantenimientoFormData({
      fecha_mantenimiento: "",
      tipo_mantenimiento: "",
      detalles_mantenimiento: "",
      proximo_mantenimiento: "",
    })
  }

  const eliminarRegistroMantenimiento = async (registroId: string) => {
    try {
      const { error } = await supabase.from("registros_mantenimiento").delete().eq("id", registroId)

      if (error) {
        alert("Error al eliminar registro de mantenimiento")
        return
      }

      alert("Registro de mantenimiento eliminado exitosamente")
      await cargarHistorialMantenimiento(camionDetalle.id)
    } catch (error) {
      console.error("Error eliminando registro de mantenimiento:", error)
      alert("Error al eliminar registro de mantenimiento")
    }
  }

  const seleccionarCamionKilometraje = (camion: Camion) => {
    setSelectedCamionKilometraje(camion)
    setKilometrajeFormData({
      kilometraje_actual: "",
      tramo_recorrido: "",
      fecha_viaje: new Date().toISOString().split("T")[0],
      comentarios_viaje: "",
    })
  }

  const verDetallesCamion = (camion: Camion) => {
    setCamionDetalle(camion)
    setActiveTab("informacion") // Establecer pestaña inicial para detalles
    setShowDetallesCamion(true)
    cargarHistorialKilometraje(camion.id)
    cargarHistorialMantenimiento(camion.id)
  }

  const limpiarFormularioMantenimiento = () => {
    setMantenimientoFormData({
      fecha_mantenimiento: "",
      detalles_mantenimiento: "",
      proximo_mantenimiento: "",
      tipo_mantenimiento: "",
    })
    setSelectedCamionMantenimiento(null)
  }

  const guardarMantenimiento = async () => {
    if (
      !selectedCamionMantenimiento ||
      !mantenimientoFormData.fecha_mantenimiento ||
      !mantenimientoFormData.detalles_mantenimiento
    ) {
      alert("Por favor completa los campos obligatorios: fecha de mantenimiento y detalles")
      return
    }

    try {
      // Guardar registro de mantenimiento en la tabla si existe
      if (registrosMantenimientoTableExists) {
        const registroMantenimiento = {
          camion_id: selectedCamionMantenimiento.id,
          fecha_mantenimiento: mantenimientoFormData.fecha_mantenimiento,
          tipo_mantenimiento: mantenimientoFormData.tipo_mantenimiento || "general",
          detalles_mantenimiento: mantenimientoFormData.detalles_mantenimiento,
          proximo_mantenimiento: mantenimientoFormData.proximo_mantenimiento || null,
          kilometraje_actual: selectedCamionMantenimiento.kilometraje,
          fecha_registro: new Date().toISOString(),
        }

        const { error: errorMantenimiento } = await supabase
          .from("registros_mantenimiento")
          .insert(registroMantenimiento)

        if (errorMantenimiento) {
          console.error("Error guardando registro de mantenimiento:", errorMantenimiento)
          alert("Error al guardar el registro de mantenimiento")
          return
        }
      }

      // Crear recordatorio para el mantenimiento realizado
      const recordatorioRealizado = {
        titulo: `Mantenimiento Realizado - Camión ${selectedCamionMantenimiento.numero_economico}`,
        descripcion: `${
          mantenimientoFormData.tipo_mantenimiento || "Mantenimiento"
        }: ${mantenimientoFormData.detalles_mantenimiento}`,
        fecha_vencimiento: mantenimientoFormData.fecha_mantenimiento,
        tipo: "mantenimiento_realizado",
        prioridad: "media",
        estado: "completado",
        camion_id: selectedCamionMantenimiento.id,
      }

      await supabase.from("recordatorios").insert(recordatorioRealizado)

      // Si hay fecha de próximo mantenimiento, crear recordatorio con aviso 2 semanas antes
      if (mantenimientoFormData.proximo_mantenimiento) {
        const fechaProximoMantenimiento = new Date(mantenimientoFormData.proximo_mantenimiento)
        const fechaRecordatorio = new Date(fechaProximoMantenimiento)
        fechaRecordatorio.setDate(fechaRecordatorio.getDate() - 14) // 2 semanas antes

        const recordatorioProximo = {
          titulo: `Próximo Mantenimiento - Camión ${selectedCamionMantenimiento.numero_economico}`,
          descripcion: `Mantenimiento programado para el ${fechaProximoMantenimiento.toLocaleDateString()}. Último mantenimiento: ${
            mantenimientoFormData.detalles_mantenimiento
          }`,
          fecha_vencimiento: fechaRecordatorio.toISOString(),
          tipo: "mantenimiento_programado",
          prioridad: "alta",
          estado: "pendiente",
          camion_id: selectedCamionMantenimiento.id,
        }

        await supabase.from("recordatorios").insert(recordatorioProximo)
      }

      alert("Mantenimiento registrado exitosamente. Los recordatorios han sido creados.")
      limpiarFormularioMantenimiento()
      setShowMantenimientoForm(false)

      // Recargar historial de mantenimiento si estamos en la ventana de detalles
      if (camionDetalle && camionDetalle.id === selectedCamionMantenimiento.id) {
        await cargarHistorialMantenimiento(selectedCamionMantenimiento.id)
      }
    } catch (error) {
      console.error("Error guardando mantenimiento:", error)
      alert("Error al guardar el mantenimiento")
    }
  }

  const descargarExcelCamion = (camion: Camion) => {
    if (!camion) {
      alert("No hay información del camión para descargar")
      return
    }

    // Preparar datos básicos del camión
    let datosAdicionales = {}
    if (camion.observaciones) {
      try {
        datosAdicionales = JSON.parse(camion.observaciones)
      } catch (error) {
        console.log("No se pudieron parsear datos adicionales")
      }
    }

    // Crear contenido CSV
    const csvContent = []

    // Información básica del camión
    const x = 1
    csvContent.push("INFORMACIÓN BÁSICA DEL CAMIÓN")
    csvContent.push("Campo,Valor")
    csvContent.push(`"Número Económico","${camion.numero_economico}"`)
    csvContent.push(`"Marca","${camion.marca || "No especificado"}"`)
    csvContent.push(`"Modelo","${camion.modelo || "No especificado"}"`)
    csvContent.push(`"Año","${camion.año || "No especificado"}"`)
    csvContent.push(`"Placas","${camion.placas || "No especificado"}"`)
    csvContent.push(`"Kilometraje Actual","${camion.kilometraje.toLocaleString()} km"`)
    csvContent.push(`"Estado","${camion.estado}"`)
    csvContent.push(`"Fecha de Registro","${new Date(camion.fecha_registro).toLocaleDateString()}"`)

    // Información adicional
    if (datosAdicionales.numero_serie) {
      csvContent.push(`"Número de Serie","${datosAdicionales.numero_serie}"`)
    }
    if (datosAdicionales.poliza_seguro) {
      csvContent.push(`"Póliza de Seguro","${datosAdicionales.poliza_seguro}"`)
    }
    if (datosAdicionales.fecha_vencimiento_seguro) {
      csvContent.push(
        `"Vencimiento Seguro","${new Date(datosAdicionales.fecha_vencimiento_seguro).toLocaleDateString()}"`,
      )
    }
    if (datosAdicionales.ultima_verificacion) {
      csvContent.push(`"Última Verificación","${new Date(datosAdicionales.ultima_verificacion).toLocaleDateString()}"`)
    }
    if (datosAdicionales.frecuencia_verificacion) {
      csvContent.push(
        `"Próxima Verificación","${new Date(datosAdicionales.frecuencia_verificacion).toLocaleDateString()}"`,
      )
    }
    if (datosAdicionales.comentarios) {
      csvContent.push(`"Comentarios","${datosAdicionales.comentarios}"`)
    }

    csvContent.push("")
    csvContent.push("")

    // Historial de kilometraje
    csvContent.push("HISTORIAL DE KILOMETRAJE")
    if (historialKilometraje.length > 0) {
      csvContent.push("Fecha Viaje,Tramo Recorrido,Km Agregados,Km Anterior,Km Nuevo,Comentarios,Fecha Registro")
      historialKilometraje.forEach((registro) => {
        csvContent.push(
          [
            `"${registro.fecha_viaje ? new Date(registro.fecha_viaje).toLocaleDateString() : "No especificado"}"`,
            `"${registro.tramo_recorrido || "No especificado"}"`,
            `"${registro.kilometraje_agregado?.toLocaleString() || 0}"`,
            `"${registro.kilometraje_anterior?.toLocaleString() || 0}"`,
            `"${registro.kilometraje_nuevo?.toLocaleString() || 0}"`,
            `"${registro.comentarios || "Sin comentarios"}"`,
            `"${new Date(registro.fecha_registro).toLocaleDateString()}"`,
          ].join(","),
        )
      })
    } else {
      csvContent.push("No hay registros de kilometraje")
    }

    csvContent.push("")
    csvContent.push("")

    // Historial de mantenimiento
    csvContent.push("HISTORIAL DE MANTENIMIENTO")
    if (historialMantenimiento.length > 0) {
      csvContent.push("Fecha Mantenimiento,Tipo,Detalles,Próximo Mantenimiento,Kilometraje,Fecha Registro")
      historialMantenimiento.forEach((registro) => {
        csvContent.push(
          [
            `"${new Date(registro.fecha_mantenimiento).toLocaleDateString()}"`,
            `"${registro.tipo_mantenimiento || "General"}"`,
            `"${registro.detalles_mantenimiento || "Sin detalles"}"`,
            `"${
              registro.proximo_mantenimiento
                ? new Date(registro.proximo_mantenimiento).toLocaleDateString()
                : "No programado"
            }"`,
            `"${registro.kilometraje_actual?.toLocaleString() || 0} km"`,
            `"${new Date(registro.fecha_registro).toLocaleDateString()}"`,
          ].join(","),
        )
      })
    } else {
      csvContent.push("No hay registros de mantenimiento")
    }

    // Crear y descargar archivo
    const blob = new Blob(["\ufeff" + csvContent.join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `camion_${camion.numero_economico}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando camiones...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Tractocamiones</h1>
            <p className="text-gray-600 mt-2">Administrar flota de camiones</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={descargarExcel} disabled={camiones.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowMarcasForm(true)}
              disabled={!marcasTableExists}
              title={!marcasTableExists ? "Ejecuta el script de migración para habilitar esta función" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              Gestionar Marcas
            </Button>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => limpiarFormulario()}
                  className="bg-[#16A34A] hover:bg-[#12813a] text-white font-semibold"
                >

                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Camión
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCamion ? "Editar Camión" : "Nuevo Camión"}</DialogTitle>
                  <DialogDescription>Completa la información del camión</DialogDescription>
                </DialogHeader>

                <div className="w-full">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab("basica")}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "basica"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Información Básica
                      </button>
                      <button
                        onClick={() => setActiveTab("documentos")}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "documentos"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Documentos y Verificaciones
                      </button>
                      <button
                        onClick={() => setActiveTab("tags")}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "tags"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Tags y Números
                      </button>
                      <button
                        onClick={() => setActiveTab("comentarios")}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "comentarios"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Comentarios
                      </button>
                    </nav>
                  </div>

                  <div className="mt-6">
                    {activeTab === "basica" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="numero_economico">Número Económico *</Label>
                            <Input
                              id="numero_economico"
                              value={formData.numero_economico}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  numero_economico: e.target.value,
                                })
                              }
                              placeholder="Ej: CAM001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="marca">Marca *</Label>
                            <Select
                              value={formData.marca}
                              onValueChange={(value) => setFormData({ ...formData, marca: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar marca" />
                              </SelectTrigger>
                              <SelectContent>
                                {getMarcasDisponibles().map((marca) => (
                                  <SelectItem key={marca} value={marca}>
                                    {marca}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="modelo">Modelo *</Label>
                            <Input
                              id="modelo"
                              value={formData.modelo}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  modelo: e.target.value,
                                })
                              }
                              placeholder="Ej: T680"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="año">Año</Label>
                            <Input
                              id="año"
                              type="number"
                              min="1990"
                              max="2030"
                              value={formData.año}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  año: e.target.value,
                                })
                              }
                              placeholder="Ej: 2020"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="numero_serie">Número de Serie</Label>
                            <Input
                              id="numero_serie"
                              value={formData.numero_serie}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  numero_serie: e.target.value,
                                })
                              }
                              placeholder="Número de serie del vehículo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="placas">Placas</Label>
                            <Input
                              id="placas"
                              value={formData.placas}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  placas: e.target.value,
                                })
                              }
                              placeholder="Ej: ABC-123-D"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="kilometraje">
                              Kilometraje Inicial {!editingCamion && "*"}
                              {editingCamion && tieneRegistrosKilometraje && (
                                <span className="text-red-600 text-xs ml-2">
                                  (No editable - tiene registros de viajes)
                                </span>
                              )}
                            </Label>
                            <Input
                              id="kilometraje"
                              type="number"
                              min="0"
                              value={formData.kilometraje}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  kilometraje: e.target.value,
                                })
                              }
                              placeholder={
                                editingCamion
                                  ? "Kilometraje actual del camión"
                                  : "Kilometraje inicial del camión (opcional)"
                              }
                              disabled={editingCamion && tieneRegistrosKilometraje}
                              className={
                                editingCamion && tieneRegistrosKilometraje ? "bg-gray-100 cursor-not-allowed" : ""
                              }
                            />
                            {editingCamion && tieneRegistrosKilometraje ? (
                              <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                <strong>Bloqueado:</strong> No se puede modificar el kilometraje porque este camión ya
                                tiene registros de viajes en la bitácora. Para cambiar el kilometraje inicial, primero
                                elimina todos los registros de viajes desde la ventana de detalles del camión.
                              </p>
                            ) : editingCamion ? (
                              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                <strong>Editable:</strong> Este camión no tiene registros de viajes, por lo que puedes
                                modificar su kilometraje actual.
                              </p>
                            ) : (
                              <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                                <strong>Importante:</strong> Una vez que registres viajes para este camión, no podrás
                                modificar este valor inicial. Los registros de viajes se calcularán basándose en este
                                kilometraje de referencia.
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select
                              value={formData.estado}
                              onValueChange={(value) => setFormData({ ...formData, estado: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="disponible">Disponible</SelectItem>
                                <SelectItem value="en-uso">En Uso</SelectItem>
                                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                                <SelectItem value="fuera-de-servicio">Fuera de Servicio</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "documentos" && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900">Verificación y Mantenimiento</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ultima_verificacion">Última Verificación</Label>
                              <Input
                                id="ultima_verificacion"
                                type="date"
                                value={formData.ultima_verificacion}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ultima_verificacion: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="proxima_verificacion">Próxima Verificación</Label>
                              <Input
                                id="proxima_verificacion"
                                type="date"
                                value={formData.frecuencia_verificacion}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    frecuencia_verificacion: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900">Información del Seguro Mexicano</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="poliza_seguro_mexicano">Póliza de Seguro Mexicano</Label>
                              <Input
                                id="poliza_seguro_mexicano"
                                value={formData.poliza_seguro_mexicano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    poliza_seguro_mexicano: e.target.value,
                                  })
                                }
                                placeholder="Número de póliza mexicana"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fecha_vencimiento_seguro_mexicano">
                                Fecha de Vencimiento del Seguro Mexicano
                              </Label>
                              <Input
                                id="fecha_vencimiento_seguro_mexicano"
                                type="date"
                                value={formData.fecha_vencimiento_seguro_mexicano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fecha_vencimiento_seguro_mexicano: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900">Información del Seguro Americano</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="poliza_seguro_americano">Póliza de Seguro Americano</Label>
                              <Input
                                id="poliza_seguro_americano"
                                value={formData.poliza_seguro_americano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    poliza_seguro_americano: e.target.value,
                                  })
                                }
                                placeholder="Número de póliza americana"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fecha_vencimiento_seguro_americano">
                                Fecha de Vencimiento del Seguro Americano
                              </Label>
                              <Input
                                id="fecha_vencimiento_seguro_americano"
                                type="date"
                                value={formData.fecha_vencimiento_seguro_americano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fecha_vencimiento_seguro_americano: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "tags" && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900">Tags y Números de Identificación</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tag_americano">Número de Tag Americano</Label>
                              <Input
                                id="tag_americano"
                                value={formData.tag_americano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    tag_americano: e.target.value,
                                  })
                                }
                                placeholder="Ej: USA123456"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tag_mexicano">Número de Tag Mexicano</Label>
                              <Input
                                id="tag_mexicano"
                                value={formData.tag_mexicano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    tag_mexicano: e.target.value,
                                  })
                                }
                                placeholder="Ej: MEX789012"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="numero_base">Número de Base</Label>
                              <Input
                                id="numero_base"
                                value={formData.numero_base}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    numero_base: e.target.value,
                                  })
                                }
                                placeholder="Ej: BASE001"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium text-gray-900">Números Adicionales</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (formData.numeros_adicionales.length < 5) {
                                  setFormData({
                                    ...formData,
                                    numeros_adicionales: [...formData.numeros_adicionales, { nombre: "", numero: "" }],
                                  })
                                }
                              }}
                              disabled={formData.numeros_adicionales.length >= 5}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Número
                            </Button>
                          </div>

                          {formData.numeros_adicionales.length > 0 && (
                            <div className="space-y-3">
                              {formData.numeros_adicionales.map((item, index) => (
                                <div
                                  key={index}
                                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-lg bg-gray-50"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor={`nombre_adicional_${index}`}>Nombre del Registro</Label>
                                    <Input
                                      id={`nombre_adicional_${index}`}
                                      value={item.nombre}
                                      onChange={(e) => {
                                        const nuevosNumeros = [...formData.numeros_adicionales]
                                        nuevosNumeros[index].nombre = e.target.value

                                        setFormData({
                                          ...formData,
                                          numeros_adicionales: nuevosNumeros,
                                        })
                                      }}
                                      placeholder="Ej: Número de Permiso SCT"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`numero_adicional_${index}`}>Número</Label>
                                    <div className="flex space-x-2">
                                      <Input
                                        id={`numero_adicional_${index}`}
                                        value={item.numero}
                                        onChange={(e) => {
                                          const nuevosNumeros = [...formData.numeros_adicionales]
                                          nuevosNumeros[index].numero = e.target.value
                                          setFormData({
                                            ...formData,
                                            numeros_adicionales: nuevosNumeros,
                                          })
                                        }}
                                        placeholder="Ej: SCT123456"
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const nuevosNumeros = formData.numeros_adicionales.filter(
                                            (_, i) => i !== index,
                                          )
                                          setFormData({
                                            ...formData,
                                            numeros_adicionales: nuevosNumeros,
                                          })
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {formData.numeros_adicionales.length === 0 && (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                              <p>No hay números adicionales registrados</p>
                              <p className="text-sm">
                                Haz clic en "Agregar Número" para añadir registros personalizados
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "comentarios" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="comentarios">Comentarios Adicionales</Label>
                          <Textarea
                            id="comentarios"
                            value={formData.comentarios}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                comentarios: e.target.value,
                              })
                            }
                            placeholder="Comentarios adicionales sobre el camión..."
                            rows={6}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 mt-8 pt-6 border-t">
                    <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button onClick={guardarCamion} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : editingCamion ? (
                        "Actualizar Camión"
                      ) : (
                        "Guardar Camión"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alerta si la tabla de marcas no existe */}
        {!marcasTableExists && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Tabla de marcas no encontrada</p>
                  <p className="text-sm">
                    Se están usando marcas por defecto. Ejecuta el script de migración para habilitar la gestión de
                    marcas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas rpidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tractocamiones</p>
                  <p className="text-2xl font-bold">{camiones.length}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">
                    {camiones.filter((c) => c.estado === "disponible").length}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Uso</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {camiones.filter((c) => c.estado === "en-uso").length}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {camiones.filter((c) => c.estado === "mantenimiento").length}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número económico, marca, modelo o placas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de camiones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {camionesFiltrados.map((camion) => {
            const alertas = verificarVencimientos(camion)
            let datosAdicionales = {
              poliza_seguro: "",
              fecha_vencimiento_seguro: "",
              comentarios: "",
            }

            if (camion.observaciones) {
              try {
                datosAdicionales = {
                  ...datosAdicionales,
                  ...JSON.parse(camion.observaciones),
                }
              } catch (error) {
                // Ignorar errores de parsing
              }
            }

            return (
              <Card key={camion.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{camion.numero_economico}</CardTitle>
                      <CardDescription>
                        {camion.marca} {camion.modelo} {camion.año && `(${camion.año})`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getEstadoBadge(camion.estado)}
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" onClick={() => verDetallesCamion(camion)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cambiarEstadoFueraServicio(camion.id)}
                          className={
                            camion.estado === "fuera-de-servicio"
                              ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                          }
                          title={
                            camion.estado === "fuera-de-servicio" ? "Reactivar unidad" : "Marcar como fuera de servicio"
                          }
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar camión?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el camión y todos sus
                                recordatorios asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => eliminarCamion(camion.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alertas.length > 0 && (
                    <div className="space-y-2">
                      {alertas.map((alerta, index) => (
                        <div
                          key={index}
                          className={`flex items-start justify-between p-3 rounded-lg border ${
                            alerta.vencido
                              ? "bg-red-50 border-red-200 text-red-800"
                              : "bg-yellow-50 border-yellow-200 text-yellow-800"
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <AlertTriangle
                              className={`h-4 w-4 mt-0.5 ${alerta.vencido ? "text-red-600" : "text-yellow-600"}`}
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {alerta.tipo === "seguro_mexicano"
                                  ? "🛡️ Seguro MX"
                                  : alerta.tipo === "seguro_americano"
                                    ? "🇺🇸 Seguro US"
                                    : alerta.tipo === "seguro"
                                      ? "🛡️ Seguro"
                                      : "🔍 Verificación"}
                              </p>
                              <p className="text-xs">
                                {alerta.vencido ? "Vencido el" : "Vence el"}: {alerta.fecha}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                alerta.vencido ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {alerta.vencido ? `${alerta.dias} días vencido` : `${alerta.dias} días restantes`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    {camion.placas && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">Placas:</span>
                        <span>{camion.placas}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm">
                      <Gauge className="h-4 w-4 text-gray-400" />
                      <span>{camion.kilometraje.toLocaleString()} km</span>
                    </div>
                    {datosAdicionales.poliza_seguro && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span>Seguro: {datosAdicionales.poliza_seguro}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Registrado: {new Date(camion.fecha_registro).toLocaleDateString()}</span>
                    </div>
                    {datosAdicionales.comentarios && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Comentarios:</span>
                        <p className="mt-1">{datosAdicionales.comentarios}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {camionesFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No se encontraron camiones</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de Gestión de Marcas */}
      {marcasTableExists && (
        <Dialog open={showMarcasForm} onOpenChange={setShowMarcasForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestión de Marcas de Camiones</DialogTitle>
              <DialogDescription>Administrar marcas disponibles para los camiones</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Formulario para nueva marca */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{editingMarca ? "Editar Marca" : "Nueva Marca"}</h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Nombre de la marca"
                    value={marcaFormData.nombre}
                    onChange={(e) => setMarcaFormData({ nombre: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={guardarMarca}>{editingMarca ? "Actualizar" : "Agregar"}</Button>
                  {editingMarca && (
                    <Button variant="outline" onClick={limpiarFormularioMarca}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {/* Lista de marcas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Marcas Registradas</h3>
                {loadingMarcas ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando marcas...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {marcas.map((marca) => (
                      <div key={marca.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{marca.nombre}</span>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" onClick={() => editarMarca(marca)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar marca?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no afectará los camiones ya registrados. Si la marca está en uso, se
                                  marcará como inactiva.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => eliminarMarca(marca.id)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {marcas.length === 0 && !loadingMarcas && (
                  <p className="text-center text-gray-500 py-4">No hay marcas registradas</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowMarcasForm(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Captura de Kilometraje */}
      <Dialog open={showKilometrajeForm} onOpenChange={setShowKilometrajeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Captura de Kilometraje</DialogTitle>
            <DialogDescription>Selecciona un camión y registra el kilometraje del viaje realizado</DialogDescription>
          </DialogHeader>
          {!registrosKilometrajeTableExists && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Tabla de registros de kilometraje no encontrada</p>
                  <p className="text-sm">
                    Ejecuta el script de migración para crear la tabla y habilitar el almacenamiento de registros.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {!selectedCamionKilometraje ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Seleccionar Camión</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {camiones
                    .filter((c) => c.estado !== "fuera-de-servicio")
                    .map((camion) => (
                      <Card
                        key={camion.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => seleccionarCamionKilometraje(camion)}
                      >
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <p className="font-semibold">{camion.numero_economico}</p>
                            <p className="text-sm text-gray-600">
                              {camion.marca} {camion.modelo}
                            </p>
                            <p className="text-sm text-gray-500">
                              Kilometraje actual: {camion.kilometraje.toLocaleString()} km
                            </p>
                            <Badge className={getEstadoBadge(camion.estado).props.className}>
                              {getEstadoBadge(camion.estado).props.children}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Información del camión seleccionado */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Camión Seleccionado: {selectedCamionKilometraje.numero_economico}
                  </h3>
                  <p className="text-blue-700">
                    {selectedCamionKilometraje.marca} {selectedCamionKilometraje.modelo}
                  </p>
                  <p className="text-blue-600">
                    Kilometraje actual: {selectedCamionKilometraje.kilometraje.toLocaleString()} km
                  </p>
                </div>

                {/* Formulario de captura */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Datos del Viaje</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kilometraje_actual">Kilometraje Actual del Camión *</Label>
                      <Input
                        id="kilometraje_actual"
                        type="number"
                        min={selectedCamionKilometraje?.kilometraje || 0}
                        value={kilometrajeFormData.kilometraje_actual}
                        onChange={(e) =>
                          setKilometrajeFormData({
                            ...kilometrajeFormData,
                            kilometraje_actual: e.target.value,
                          })
                        }
                        placeholder="Kilometraje que marca actualmente el camión"
                      />
                      <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                        <strong>Instrucciones:</strong> Ingresa el kilometraje que actualmente marca el odómetro del
                        camión. El sistema calculará automáticamente los kilómetros recorridos.
                      </p>
                      {kilometrajeFormData.kilometraje_actual && (
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                          <p className="text-sm text-green-700">
                            <strong>Kilómetros recorridos:</strong>{" "}
                            {Math.max(
                              0,
                              Number.parseInt(kilometrajeFormData.kilometraje_actual || "0") -
                                selectedCamionKilometraje.kilometraje,
                            ).toLocaleString()}{" "}
                            km
                          </p>
                          <p className="text-xs text-green-600">
                            (Desde {selectedCamionKilometraje.kilometraje.toLocaleString()} km hasta{" "}
                            {Number.parseInt(kilometrajeFormData.kilometraje_actual || "0").toLocaleString()} km)
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha_viaje">Fecha del Viaje *</Label>
                      <Input
                        id="fecha_viaje"
                        type="date"
                        value={kilometrajeFormData.fecha_viaje}
                        onChange={(e) =>
                          setKilometrajeFormData({
                            ...kilometrajeFormData,
                            fecha_viaje: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tramo_recorrido">Tramo Recorrido *</Label>
                    <Input
                      id="tramo_recorrido"
                      value={kilometrajeFormData.tramo_recorrido}
                      onChange={(e) =>
                        setKilometrajeFormData({
                          ...kilometrajeFormData,
                          tramo_recorrido: e.target.value,
                        })
                      }
                      placeholder="Ej: Ciudad de México - Guadalajara"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comentarios_viaje">Comentarios del Viaje</Label>
                    <Textarea
                      id="comentarios_viaje"
                      value={kilometrajeFormData.comentarios_viaje}
                      onChange={(e) =>
                        setKilometrajeFormData({
                          ...kilometrajeFormData,
                          comentarios_viaje: e.target.value,
                        })
                      }
                      placeholder="Comentarios adicionales sobre el viaje..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setShowKilometrajeForm(false)

                      // Si hay un camión seleccionado para kilometraje, actualizar sus datos y mostrar detalles
                      if (selectedCamionKilometraje) {
                        // Recargar los datos del camión desde la base de datos para obtener el kilometraje actualizado
                        try {
                          const { data: camionActualizado, error } = await supabase
                            .from("camiones")
                            .select("*")
                            .eq("id", selectedCamionKilometraje.id)
                            .single()

                          if (!error && camionActualizado) {
                            // Actualizar el camión en el estado local
                            setCamiones((prev) =>
                              prev.map((c) => (c.id === camionActualizado.id ? camionActualizado : c)),
                            )

                            // Establecer como camión de detalle y mostrar la ventana de detalles
                            setCamionDetalle(camionActualizado)
                            setShowDetallesCamion(true)

                            // Cargar el historial actualizado
                            await cargarHistorialKilometraje(camionActualizado.id)
                            await cargarHistorialMantenimiento(camionActualizado.id)
                          }
                        } catch (error) {
                          console.error("Error recargando datos del camión:", error)
                          // En caso de error, usar los datos que tenemos
                          setCamionDetalle(selectedCamionKilometraje)
                          setShowDetallesCamion(true)
                          await cargarHistorialKilometraje(selectedCamionKilometraje.id)
                          await cargarHistorialMantenimiento(selectedCamionKilometraje.id)
                        }
                      }

                      // Limpiar el formulario de kilometraje
                      limpiarFormularioKilometraje()
                    }}
                  >
                    Finalizar Captura
                  </Button>
                  <Button onClick={guardarKilometraje}>Guardar y Continuar</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Detalles del Camión */}
      <Dialog open={showDetallesCamion} onOpenChange={setShowDetallesCamion}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Detalles del Camión - {camionDetalle?.numero_economico}
            </DialogTitle>
            <DialogDescription className="text-gray-600">Información completa y gestión de la unidad</DialogDescription>
          </DialogHeader>

          {camionDetalle && (
            <div className="space-y-6">
              {/* Alertas de Vencimiento - Mostrar primero si existen */}
              {(() => {
                const alertas = verificarVencimientos(camionDetalle)
                if (alertas.length > 0) {
                  return (
                    <div className="flex flex-wrap gap-2">
                      {alertas.map((alerta, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-1 text-xs text-red-700 bg-red-100 px-2 py-1 rounded-md border border-red-200 flex-shrink-0"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span className="whitespace-nowrap">{alerta.mensaje}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              })()}

              {/* Sistema de Pestañas */}
              <div className="w-full">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab("informacion")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "informacion"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Información Básica
                    </button>
                    <button
                      onClick={() => setActiveTab("documentos")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "documentos"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Documentos y Seguros
                    </button>
                    <button
                      onClick={() => setActiveTab("kilometraje")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "kilometraje"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Historial de Kilometraje
                    </button>
                    <button
                      onClick={() => setActiveTab("mantenimiento")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "mantenimiento"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Historial de Mantenimiento
                    </button>
                    <button
                      onClick={() => setActiveTab("acciones")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "acciones"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Comentarios
                    </button>
                  </nav>
                </div>

                <div className="mt-6">
                  {/* Pestaña de Información Básica */}
                  {activeTab === "informacion" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {" "}
                        {/* Reduced gap */}
                        {/* Información Principal */}
                        <div className="p-4 bg-white rounded-lg">
                          {" "}
                          {/* Removed Card, added padding and background */}
                          <div className="flex items-center space-x-2 mb-4">
                            {" "}
                            {/* Replaced CardHeader */}
                            <Truck className="h-5 w-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Datos del Vehículo</h3>{" "}
                            {/* Replaced CardTitle */}
                          </div>
                          <div className="space-y-3">
                            {" "}
                            {/* Replaced CardContent, reduced space-y */}
                            <div className="grid grid-cols-2 gap-3">
                              {" "}
                              {/* Reduced gap */}
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Número Económico
                                </Label>
                                <p className="text-base font-medium text-gray-900">{camionDetalle.numero_economico}</p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Estado
                                </Label>
                                <div className="mt-1">{getEstadoBadge(camionDetalle.estado)}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {" "}
                              {/* Reduced gap */}
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Marca
                                </Label>
                                <p className="text-base font-medium text-gray-900">
                                  {camionDetalle.marca || "No especificado"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Modelo
                                </Label>
                                <p className="text-base font-medium text-gray-900">
                                  {camionDetalle.modelo || "No especificado"}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {" "}
                              {/* Reduced gap */}
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Año</Label>
                                <p className="text-base font-medium text-gray-900">
                                  {camionDetalle.año || "No especificado"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Placas
                                </Label>
                                <p className="text-base font-medium text-gray-900">
                                  {camionDetalle.placas || "No especificado"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Kilometraje y Fechas */}
                        <div className="p-4 bg-white rounded-lg">
                          {" "}
                          {/* Removed Card, added padding and background */}
                          <div className="flex items-center space-x-2 mb-4">
                            {" "}
                            {/* Replaced CardHeader */}
                            <Gauge className="h-5 w-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Kilometraje y Registro</h3>{" "}
                            {/* Replaced CardTitle */}
                          </div>
                          <div className="space-y-3">
                            {" "}
                            {/* Replaced CardContent, reduced space-y */}
                            <div className="text-center p-3 bg-gray-100 rounded-lg">
                              {" "}
                              {/* Adjusted padding, removed border */}
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Kilometraje Actual
                              </Label>
                              <p className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                                <Gauge className="h-5 w-5 mr-2" />
                                {camionDetalle.kilometraje.toLocaleString()} km
                              </p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {" "}
                              {/* Reduced gap */}
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Fecha de Registro
                                </Label>
                                <p className="text-base font-medium text-gray-900 flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  {new Date(camionDetalle.fecha_registro).toLocaleDateString()}
                                </p>
                              </div>
                              {camionDetalle.observaciones &&
                                (() => {
                                  try {
                                    const datos = JSON.parse(camionDetalle.observaciones)
                                    return (
                                      datos.numero_serie && (
                                        <div>
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Número de Serie
                                          </Label>
                                          <p className="text-base font-medium text-gray-900 bg-gray-100 p-2 rounded">
                                            {" "}
                                            {/* Adjusted styling */}
                                            {datos.numero_serie}
                                          </p>
                                        </div>
                                      )
                                    )
                                  } catch (error) {
                                    return null
                                  }
                                })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tags y Números Adicionales */}
                      {camionDetalle.observaciones &&
                        (() => {
                          try {
                            const datos = JSON.parse(camionDetalle.observaciones)
                            const tieneTagsONumeros =
                              datos.tag_americano ||
                              datos.tag_mexicano ||
                              datos.numero_base ||
                              (datos.numeros_adicionales && datos.numeros_adicionales.length > 0)

                            if (tieneTagsONumeros) {
                              return (
                                <div className="p-4 bg-white rounded-lg">
                                  {" "}
                                  {/* Removed Card, added padding and background */}
                                  <div className="flex items-center space-x-2 mb-4">
                                    {" "}
                                    {/* Replaced CardHeader */}
                                    <span className="text-gray-600 text-lg font-semibold">#</span>{" "}
                                    {/* Adjusted styling */}
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      Tags y Números de Identificación
                                    </h3>{" "}
                                    {/* Replaced CardTitle */}
                                  </div>
                                  <div className="space-y-3">
                                    {" "}
                                    {/* Replaced CardContent, reduced space-y */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {" "}
                                      {/* Reduced gap */}
                                      {datos.tag_americano && (
                                        <div className="bg-gray-100 p-3 rounded-lg">
                                          {" "}
                                          {/* Adjusted styling */}
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Tag Americano
                                          </Label>
                                          <p className="text-base font-medium text-gray-900">{datos.tag_americano}</p>
                                        </div>
                                      )}
                                      {datos.tag_mexicano && (
                                        <div className="bg-gray-100 p-3 rounded-lg">
                                          {" "}
                                          {/* Adjusted styling */}
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Tag Mexicano
                                          </Label>
                                          <p className="text-base font-medium text-gray-900">{datos.tag_mexicano}</p>
                                        </div>
                                      )}
                                      {datos.numero_base && (
                                        <div className="bg-gray-100 p-3 rounded-lg">
                                          {" "}
                                          {/* Adjusted styling */}
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Número de Base
                                          </Label>
                                          <p className="text-base font-medium text-gray-900">{datos.numero_base}</p>
                                        </div>
                                      )}
                                    </div>
                                    {datos.numeros_adicionales && datos.numeros_adicionales.length > 0 && (
                                      <div className="space-y-2 mt-4">
                                        {" "}
                                        {/* Adjusted margin-top */}
                                        <Label className="text-sm font-medium text-gray-700">Números Adicionales</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {" "}
                                          {/* Reduced gap */}
                                          {datos.numeros_adicionales.map((item, index) => (
                                            <div key={index} className="bg-gray-100 p-3 rounded-lg">
                                              {" "}
                                              {/* Adjusted styling */}
                                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                {item.nombre}
                                              </Label>
                                              <p className="text-base font-medium text-gray-900">{item.numero}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          } catch (error) {
                            return null
                          }
                        })()}

                      {/* Comentarios */}
                    </div>
                  )}

                  {/* Pestaña de Documentos y Seguros */}
                  {activeTab === "documentos" && (
                    <div className="space-y-4">
                      {" "}
                      {/* Reduced space-y */}
                      {camionDetalle.observaciones &&
                        (() => {
                          try {
                            const datosAdicionales = JSON.parse(camionDetalle.observaciones)
                            return (
                              <>
                                {/* Verificaciones */}
                                {(datosAdicionales.ultima_verificacion || datosAdicionales.frecuencia_verificacion) && (
                                  <div className="p-4 bg-white rounded-lg">
                                    {" "}
                                    {/* Removed Card, added padding and background */}
                                    <div className="flex items-center space-x-2 mb-4">
                                      {" "}
                                      {/* Replaced CardHeader */}
                                      <Shield className="h-5 w-5 text-gray-600" />
                                      <h3 className="text-lg font-semibold text-gray-900">Verificaciones</h3>{" "}
                                      {/* Replaced CardTitle */}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {" "}
                                      {/* Reduced gap */}
                                      {datosAdicionales.ultima_verificacion && (
                                        <div className="bg-gray-100 p-3 rounded-lg">
                                          {" "}
                                          {/* Adjusted styling */}
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Última Verificación
                                          </Label>
                                          <p className="text-base font-medium text-gray-900">
                                            {new Date(datosAdicionales.ultima_verificacion).toLocaleDateString()}
                                          </p>
                                        </div>
                                      )}
                                      {datosAdicionales.frecuencia_verificacion && (
                                        <div className="bg-gray-100 p-3 rounded-lg">
                                          {" "}
                                          {/* Adjusted styling */}
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Próxima Verificación
                                          </Label>
                                          <p className="text-base font-medium text-gray-900">
                                            {new Date(datosAdicionales.frecuencia_verificacion).toLocaleDateString()}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Seguro Mexicano */}
                                {(datosAdicionales.poliza_seguro_mexicano ||
                                  datosAdicionales.fecha_vencimiento_seguro_mexicano) && (
                                  <div className="p-4 bg-white rounded-lg">
                                    {" "}
                                    {/* Removed Card, added padding and background */}
                                    <div className="flex items-center space-x-2 mb-4">
                                      {" "}
                                      {/* Replaced CardHeader */}
                                      <Shield className="h-5 w-5 text-gray-600" />
                                      <h3 className="text-lg font-semibold text-gray-900">Seguro Mexicano</h3>{" "}
                                      {/* Replaced CardTitle */}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {" "}
                                      {/* Reduced gap */}
                                      {datosAdicionales.poliza_seguro_mexicano && (
                                        <div>
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Número de Póliza
                                          </Label>
                                          <p className="text-base font-medium text-gray-900 bg-gray-100 p-3 rounded">
                                            {" "}
                                            {/* Adjusted styling */}
                                            {datosAdicionales.poliza_seguro_mexicano}
                                          </p>
                                        </div>
                                      )}
                                      {datosAdicionales.fecha_vencimiento_seguro_mexicano && (
                                        <div>
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Fecha de Vencimiento
                                          </Label>
                                          <p className="text-base font-medium text-gray-900 bg-gray-100 p-3 rounded">
                                            {" "}
                                            {/* Adjusted styling */}
                                            {new Date(
                                              datosAdicionales.fecha_vencimiento_seguro_mexicano,
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Seguro Americano */}
                                {(datosAdicionales.poliza_seguro_americano ||
                                  datosAdicionales.fecha_vencimiento_seguro_americano) && (
                                  <div className="p-4 bg-white rounded-lg">
                                    {" "}
                                    {/* Removed Card, added padding and background */}
                                    <div className="flex items-center space-x-2 mb-4">
                                      {" "}
                                      {/* Replaced CardHeader */}
                                      <Shield className="h-5 w-5 text-gray-600" />
                                      <h3 className="text-lg font-semibold text-gray-900">Seguro Americano</h3>{" "}
                                      {/* Replaced CardTitle */}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {" "}
                                      {/* Reduced gap */}
                                      {datosAdicionales.poliza_seguro_americano && (
                                        <div>
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Número de Póliza
                                          </Label>
                                          <p className="text-base font-medium text-gray-900 bg-gray-100 p-3 rounded">
                                            {" "}
                                            {/* Adjusted styling */}
                                            {datosAdicionales.poliza_seguro_americano}
                                          </p>
                                        </div>
                                      )}
                                      {datosAdicionales.fecha_vencimiento_seguro_americano && (
                                        <div>
                                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Fecha de Vencimiento
                                          </Label>
                                          <p className="text-base font-medium text-gray-900 bg-gray-100 p-3 rounded">
                                            {" "}
                                            {/* Adjusted styling */}
                                            {new Date(
                                              datosAdicionales.fecha_vencimiento_seguro_americano,
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          } catch (error) {
                            return (
                              <div className="p-4 bg-white rounded-lg text-center py-8">
                                {" "}
                                {/* Removed Card, added padding and background */}
                                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">No hay información de documentos disponible</p>
                              </div>
                            )
                          }
                        })()}
                    </div>
                  )}

                  {/* Pestaña de Historial de Kilometraje */}
                  {activeTab === "kilometraje" && (
                    <div className="space-y-4">
                      {" "}
                      {/* Reduced space-y */}
                      <div className="p-4 bg-white rounded-lg">
                        {" "}
                        {/* Removed Card, added padding and background */}
                        <div className="flex items-center justify-between w-full mb-4">
                          {" "}
                          {/* Replaced CardHeader */}
                          <div className="flex items-center space-x-2">
                            <Gauge className="h-5 w-5 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Historial de Kilometraje</h3>{" "}
                            {/* Replaced CardTitle */}
                          </div>
                          <div className="flex items-center space-x-3">
                            {" "}
                            {/* Reduced space-x */}
                            {/* Resumen compacto */}
                            <div className="flex items-center space-x-4">
                              {" "}
                              {/* Adjusted padding, reduced space-x */}
                              <div className="text-center">
                                <p className="text-xs text-purple-700 font-medium">Actual</p>{" "}
                                {/* Adjusted text color */}
                                <p className="text-lg font-bold text-purple-900">
                                  {camionDetalle.kilometraje.toLocaleString()} km
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-purple-700 font-medium">Total Viajes</p>{" "}
                                {/* Adjusted text color */}
                                <p className="text-lg font-semibold text-purple-900">{historialKilometraje.length}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                setShowDetallesCamion(false)
                                seleccionarCamionKilometraje(camionDetalle)
                                setShowKilometrajeForm(true)
                              }}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Gauge className="h-4 w-4 mr-2" />
                              Capturar Kilometraje
                            </Button>
                          </div>
                        </div>
                        {historialKilometraje.length > 0 && (
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="records-per-page-kilometraje">Registros por página:</Label>
                              <Select
                                value={String(recordsPerPageKilometraje)}
                                onValueChange={(value) => {
                                  setRecordsPerPageKilometraje(Number(value))
                                  setCurrentPageKilometraje(1) // Reset to first page when changing per page
                                }}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="15">15</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value={String(historialKilometraje.length)}>Todos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        <div className="space-y-3">
                          {" "}
                          {/* Replaced CardContent, reduced space-y */}
                          {loadingHistorial ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Cargando historial...</p>
                            </div>
                          ) : historialKilometraje.length > 0 ? (
                            <>
                              <div className="space-y-4">
                                {/* Tabla de historial */}
                                <div className="border rounded-lg overflow-hidden">
                                  <div className="bg-gray-50 px-4 py-3 border-b">
                                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      <div className="col-span-2">Fecha</div>
                                      <div className="col-span-3">Tramo</div>
                                      <div className="col-span-2">Km Agregados</div>
                                      <div className="col-span-2">Km Total</div>
                                      <div className="col-span-2">Comentarios</div>
                                      <div className="col-span-1">Acciones</div>
                                    </div>
                                  </div>
                                  <div className="max-h-96 overflow-y-auto">
                                    {/* Apply pagination logic here */}
                                    {(() => {
                                      const indexOfLastRecord = currentPageKilometraje * recordsPerPageKilometraje
                                      const indexOfFirstRecord = indexOfLastRecord - recordsPerPageKilometraje
                                      const currentRecords = historialKilometraje.slice(
                                        indexOfFirstRecord,
                                        indexOfLastRecord,
                                      )

                                      return currentRecords.map((registro, index) => (
                                        <div
                                          key={registro.id || index}
                                          className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                                        >
                                          <div className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-2">
                                              <p className="text-sm font-medium text-gray-900">
                                                {new Date(
                                                  registro.fecha_viaje || registro.fecha_registro,
                                                ).toLocaleDateString()}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {new Date(
                                                  registro.fecha_viaje || registro.fecha_registro,
                                                ).toLocaleDateString("es-ES", {
                                                  weekday: "short",
                                                })}
                                              </p>
                                            </div>
                                            <div className="col-span-3">
                                              <p className="text-sm text-gray-900 font-medium">
                                                {registro.tramo_recorrido || "No especificado"}
                                              </p>
                                            </div>
                                            <div className="col-span-2">
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                +{registro.kilometraje_agregado?.toLocaleString() || 0} km
                                              </span>
                                            </div>
                                            <div className="col-span-2">
                                              <p className="text-sm font-semibold text-gray-900">
                                                {registro.kilometraje_nuevo?.toLocaleString() || 0} km
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                (desde {registro.kilometraje_anterior?.toLocaleString() || 0})
                                              </p>
                                            </div>
                                            <div className="col-span-2">
                                              {registro.comentarios ? (
                                                <p
                                                  className="text-xs text-gray-600 truncate"
                                                  title={registro.comentarios}
                                                >
                                                  {registro.comentarios}
                                                </p>
                                              ) : (
                                                <span className="text-xs text-gray-400">Sin comentarios</span>
                                              )}
                                            </div>
                                            <div className="col-span-1">
                                              <div className="flex space-x-1">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => editarRegistroKilometraje(registro)}
                                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-7 w-7"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    if (
                                                      confirm(
                                                        "¿Estás seguro de eliminar este registro? El kilometraje del camión se ajustará automáticamente.",
                                                      )
                                                    ) {
                                                      eliminarRegistroKilometraje(
                                                        registro.id,
                                                        camionDetalle.id,
                                                        registro.kilometraje_agregado || 0,
                                                      )
                                                    }
                                                  }}
                                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-7 w-7"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    })()}
                                  </div>
                                </div>
                              </div>
                              {/* Pagination Controls */}
                              {historialKilometraje.length > recordsPerPageKilometraje && (
                                <div className="flex justify-center items-center space-x-2 mt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPageKilometraje((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPageKilometraje === 1}
                                  >
                                    Anterior
                                  </Button>
                                  {Array.from(
                                    { length: Math.ceil(historialKilometraje.length / recordsPerPageKilometraje) },
                                    (_, i) => (
                                      <Button
                                        key={i + 1}
                                        variant={currentPageKilometraje === i + 1 ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPageKilometraje(i + 1)}
                                      >
                                        {i + 1}
                                      </Button>
                                    ),
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setCurrentPageKilometraje((prev) =>
                                        Math.min(
                                          Math.ceil(historialKilometraje.length / recordsPerPageKilometraje),
                                          prev + 1,
                                        ),
                                      )
                                    }
                                    disabled={
                                      currentPageKilometraje ===
                                      Math.ceil(historialKilometraje.length / recordsPerPageKilometraje)
                                    }
                                  >
                                    Siguiente
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-12">
                              <Gauge className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg text-gray-500 mb-2">No hay registros de kilometraje</p>
                              <p className="text-sm text-gray-400 mb-4">
                                Cuando captures kilometraje de esta unidad, se mostrarán aquí los detalles de cada viaje
                              </p>
                              <Button
                                onClick={() => {
                                  setShowDetallesCamion(false)
                                  seleccionarCamionKilometraje(camionDetalle)
                                  setShowKilometrajeForm(true)
                                }}
                                className="mt-2"
                              >
                                <Gauge className="h-4 w-4 mr-2" />
                                Capturar Primer Kilometraje
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pestaña de Historial de Mantenimiento */}
                  {activeTab === "mantenimiento" && (
                    <div className="space-y-4">
                      {" "}
                      {/* Reduced space-y */}
                      <div className="p-4 bg-white rounded-lg">
                        {" "}
                        {/* Removed Card, added padding and background */}
                        <div className="flex items-center justify-between w-full mb-4">
                          {" "}
                          {/* Replaced CardHeader */}
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Historial de Mantenimiento</h3>{" "}
                            {/* Replaced CardTitle */}
                          </div>
                          <div className="flex items-center space-x-3">
                            {" "}
                            {/* Reduced space-x */}
                            {/* Resumen compacto */}
                            <div className="flex items-center space-x-4">
                              {" "}
                              {/* Adjusted padding, reduced space-x */}
                              <div className="text-center">
                                <p className="text-xs text-gray-700 font-medium">Total</p> {/* Adjusted text color */}
                                <p className="text-lg font-bold text-gray-900">{historialMantenimiento.length}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-700 font-medium">Último</p> {/* Adjusted text color */}
                                <p className="text-sm font-semibold text-gray-900">
                                  {historialMantenimiento.length > 0
                                    ? new Date(historialMantenimiento[0].fecha_mantenimiento).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedCamionMantenimiento(camionDetalle)
                                setMantenimientoFormData({
                                  fecha_mantenimiento: new Date().toISOString().split("T")[0],
                                  detalles_mantenimiento: "",
                                  proximo_mantenimiento: "",
                                  tipo_mantenimiento: "",
                                })
                                setShowMantenimientoForm(true)
                              }}
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Registrar Mantenimiento
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {" "}
                          {/* Replaced CardContent, reduced space-y */}
                          {!registrosMantenimientoTableExists && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                              <div className="flex items-center space-x-2 text-yellow-800">
                                <AlertTriangle className="h-5 w-5" />
                                <div>
                                  <p className="font-medium">Tabla de registros de mantenimiento no encontrada</p>
                                  <p className="text-sm">
                                    Ejecuta el script de migración para crear la tabla y habilitar el almacenamiento de
                                    registros.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {loadingHistorialMantenimiento ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
                              <p className="mt-4 text-gray-600">Cargando historial de mantenimiento...</p>
                            </div>
                          ) : historialMantenimiento.length > 0 ? (
                            <div className="space-y-4">
                              {/* Tabla de historial */}
                              <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b">
                                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    <div className="col-span-2">Fecha</div>
                                    <div className="col-span-2">Tipo</div>
                                    <div className="col-span-3">Detalles</div>
                                    <div className="col-span-2">Próximo</div>
                                    <div className="col-span-2">Kilometraje</div>
                                    <div className="col-span-1">Acciones</div>
                                  </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                  {historialMantenimiento.map((registro, index) => (
                                    <div
                                      key={registro.id || index}
                                      className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-2">
                                          <p className="text-sm font-medium text-gray-900">
                                            {new Date(registro.fecha_mantenimiento).toLocaleDateString()}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {new Date(registro.fecha_mantenimiento).toLocaleDateString("es-ES", {
                                              weekday: "short",
                                            })}
                                          </p>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {registro.tipo_mantenimiento || "General"}
                                          </span>
                                        </div>
                                        <div className="col-span-3">
                                          <p
                                            className="text-sm text-gray-900 truncate"
                                            title={registro.detalles_mantenimiento}
                                          >
                                            {registro.detalles_mantenimiento || "Sin detalles"}
                                          </p>
                                        </div>
                                        <div className="col-span-2">
                                          {registro.proximo_mantenimiento ? (
                                            <p className="text-sm text-gray-900">
                                              {new Date(registro.proximo_mantenimiento).toLocaleDateString()}
                                            </p>
                                          ) : (
                                            <span className="text-xs text-gray-400">No programado</span>
                                          )}
                                        </div>
                                        <div className="col-span-2">
                                          <p className="text-sm font-medium text-gray-900">
                                            {registro.kilometraje_actual?.toLocaleString() || 0} km
                                          </p>
                                        </div>
                                        <div className="col-span-1">
                                          <div className="flex space-x-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => editarRegistroMantenimiento(registro)}
                                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-7 w-7"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                if (
                                                  confirm(
                                                    "¿Estás seguro de eliminar este registro de mantenimiento? Esta acción no se puede deshacer.",
                                                  )
                                                ) {
                                                  eliminarRegistroMantenimiento(registro.id)
                                                }
                                              }}
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-7 w-7"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg text-gray-500 mb-2">No hay registros de mantenimiento</p>
                              <p className="text-sm text-gray-400 mb-4">
                                Cuando registres mantenimientos de esta unidad, se mostrarán aquí con todos los detalles
                              </p>
                              <Button
                                onClick={() => {
                                  setSelectedCamionMantenimiento(camionDetalle)
                                  setMantenimientoFormData({
                                    fecha_mantenimiento: new Date().toISOString().split("T")[0],
                                    detalles_mantenimiento: "",
                                    proximo_mantenimiento: "",
                                    tipo_mantenimiento: "",
                                  })
                                  setShowMantenimientoForm(true)
                                }}
                                className="mt-2"
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Registrar Primer Mantenimiento
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pestaña de Acciones de Gestión */}
                  {activeTab === "acciones" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-lg">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Comentarios Adicionales</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="comentarios_camion">Comentarios</Label>
                            <Textarea
                              id="comentarios_camion"
                              value={(() => {
                                if (camionDetalle.observaciones) {
                                  try {
                                    const datos = JSON.parse(camionDetalle.observaciones)
                                    return datos.comentarios || ""
                                  } catch (error) {
                                    return ""
                                  }
                                }
                                return ""
                              })()}
                              onChange={(e) => {
                                // TODO: Implementar lógica para guardar comentarios
                                console.log("Comentario actualizado:", e.target.value)
                              }}
                              placeholder="Escribe comentarios adicionales sobre este camión..."
                              rows={6}
                              className="w-full"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                // TODO: Implementar lógica para cancelar cambios
                                console.log("Cancelar cambios en comentarios")
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => {
                                // TODO: Implementar lógica para guardar comentarios
                                console.log("Guardar comentarios")
                              }}
                            >
                              Guardar Comentarios
                            </Button>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>Nota:</strong> Los comentarios se guardarán automáticamente y estarán disponibles
                              en la vista principal de camiones y en los reportes exportados.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer con botón de cerrar */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => descargarExcelCamion(camionDetalle)}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Descargar Excel</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => cambiarEstadoFueraServicio(camionDetalle.id)}
                    className={`flex items-center space-x-2 ${
                      camionDetalle.estado === "fuera-de-servicio"
                        ? "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                        : "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      {camionDetalle.estado === "fuera-de-servicio"
                        ? "Reactivar Unidad"
                        : "Marcar como Fuera de Servicio"}
                    </span>
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setShowDetallesCamion(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
        {/* Diálogo de Edición de Registro de Kilometraje */}
        <Dialog open={showEditRegistroForm} onOpenChange={setShowEditRegistroForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Registro de Kilometraje</DialogTitle>
              <DialogDescription>Modifica los datos del viaje registrado</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_kilometraje_agregado">Kilometraje Recorrido *</Label>
                  <Input
                    id="edit_kilometraje_agregado"
                    type="number"
                    min="1"
                    value={editRegistroFormData.kilometraje_agregado}
                    onChange={(e) =>
                      setEditRegistroFormData({
                        ...editRegistroFormData,
                        kilometraje_agregado: e.target.value,
                      })
                    }
                    placeholder="Kilómetros recorridos en este viaje"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_fecha_viaje">Fecha del Viaje *</Label>
                  <Input
                    id="edit_fecha_viaje"
                    type="date"
                    value={editRegistroFormData.fecha_viaje}
                    onChange={(e) =>
                      setEditRegistroFormData({
                        ...editRegistroFormData,
                        fecha_viaje: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_tramo_recorrido">Tramo Recorrido *</Label>
                <Input
                  id="edit_tramo_recorrido"
                  value={editRegistroFormData.tramo_recorrido}
                  onChange={(e) =>
                    setEditRegistroFormData({
                      ...editRegistroFormData,
                      tramo_recorrido: e.target.value,
                    })
                  }
                  placeholder="Ej: Ciudad de México - Guadalajara"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_comentarios_viaje">Comentarios del Viaje</Label>
                <Textarea
                  id="edit_comentarios_viaje"
                  value={editRegistroFormData.comentarios_viaje}
                  onChange={(e) =>
                    setEditRegistroFormData({
                      ...editRegistroFormData,
                      comentarios_viaje: e.target.value,
                    })
                  }
                  placeholder="Comentarios adicionales sobre el viaje..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={cancelarEdicionRegistro}>
                  Cancelar
                </Button>
                <Button onClick={guardarEdicionRegistro}>Guardar Cambios</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Diálogo de Edición de Registro de Mantenimiento */}
        <Dialog open={showEditMantenimientoForm} onOpenChange={setShowEditMantenimientoForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Registro de Mantenimiento</DialogTitle>
              <DialogDescription>Modifica los datos del mantenimiento registrado</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_fecha_mantenimiento">Fecha de Mantenimiento *</Label>
                  <Input
                    id="edit_fecha_mantenimiento"
                    type="date"
                    value={editMantenimientoFormData.fecha_mantenimiento}
                    onChange={(e) =>
                      setEditMantenimientoFormData({
                        ...editMantenimientoFormData,
                        fecha_mantenimiento: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_tipo_mantenimiento">Tipo de Mantenimiento</Label>
                  <Select
                    value={editMantenimientoFormData.tipo_mantenimiento}
                    onValueChange={(value) =>
                      setEditMantenimientoFormData({
                        ...editMantenimientoFormData,
                        tipo_mantenimiento: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="revision">Revisión General</SelectItem>
                      <SelectItem value="cambio_aceite">Cambio de Aceite</SelectItem>
                      <SelectItem value="frenos">Sistema de Frenos</SelectItem>
                      <SelectItem value="suspension">Suspensión</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="transmision">Transmisión</SelectItem>
                      <SelectItem value="electrico">Sistema Eléctrico</SelectItem>
                      <SelectItem value="neumaticos">Neumáticos</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_detalles_mantenimiento">Detalles del Mantenimiento *</Label>
                <Textarea
                  id="edit_detalles_mantenimiento"
                  value={editMantenimientoFormData.detalles_mantenimiento}
                  onChange={(e) =>
                    setEditMantenimientoFormData({
                      ...editMantenimientoFormData,
                      detalles_mantenimiento: e.target.value,
                    })
                  }
                  placeholder="Describe detalladamente el trabajo realizado..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_proximo_mantenimiento">Fecha del Próximo Mantenimiento</Label>
                <Input
                  id="edit_proximo_mantenimiento"
                  type="date"
                  value={editMantenimientoFormData.proximo_mantenimiento}
                  onChange={(e) =>
                    setEditMantenimientoFormData({
                      ...editMantenimientoFormData,
                      proximo_mantenimiento: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={cancelarEdicionMantenimiento}>
                  Cancelar
                </Button>
                <Button onClick={guardarEdicionMantenimiento}>Guardar Cambios</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Dialog>

      {/* Diálogo de Registro de Mantenimiento */}
      <Dialog open={showMantenimientoForm} onOpenChange={setShowMantenimientoForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registro de Mantenimiento</DialogTitle>
            <DialogDescription>Registra el mantenimiento realizado y programa el próximo</DialogDescription>
          </DialogHeader>

          {selectedCamionMantenimiento && (
            <div className="space-y-6">
              {/* Información del camión */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">
                  Camión: {selectedCamionMantenimiento.numero_economico}
                </h3>
                <p className="text-blue-700">
                  {selectedCamionMantenimiento.marca} {selectedCamionMantenimiento.modelo}
                </p>
                <p className="text-blue-600">
                  Kilometraje actual: {selectedCamionMantenimiento.kilometraje.toLocaleString()} km
                </p>
              </div>

              {/* Formulario de mantenimiento */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_mantenimiento">Fecha de Mantenimiento *</Label>
                    <Input
                      id="fecha_mantenimiento"
                      type="date"
                      value={mantenimientoFormData.fecha_mantenimiento}
                      onChange={(e) =>
                        setMantenimientoFormData({
                          ...mantenimientoFormData,
                          fecha_mantenimiento: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_mantenimiento">Tipo de Mantenimiento</Label>
                    <Select
                      value={mantenimientoFormData.tipo_mantenimiento}
                      onValueChange={(value) =>
                        setMantenimientoFormData({
                          ...mantenimientoFormData,
                          tipo_mantenimiento: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventivo">Preventivo</SelectItem>
                        <SelectItem value="correctivo">Correctivo</SelectItem>
                        <SelectItem value="revision">Revisión General</SelectItem>
                        <SelectItem value="cambio_aceite">Cambio de Aceite</SelectItem>
                        <SelectItem value="frenos">Sistema de Frenos</SelectItem>
                        <SelectItem value="suspension">Suspensión</SelectItem>
                        <SelectItem value="motor">Motor</SelectItem>
                        <SelectItem value="transmision">Transmisión</SelectItem>
                        <SelectItem value="electrico">Sistema Eléctrico</SelectItem>
                        <SelectItem value="neumaticos">Neumáticos</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detalles_mantenimiento">Detalles del Mantenimiento *</Label>
                  <Textarea
                    id="detalles_mantenimiento"
                    value={mantenimientoFormData.detalles_mantenimiento}
                    onChange={(e) =>
                      setMantenimientoFormData({
                        ...mantenimientoFormData,
                        detalles_mantenimiento: e.target.value,
                      })
                    }
                    placeholder="Describe detalladamente el trabajo realizado, piezas cambiadas, observaciones, etc."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proximo_mantenimiento">Fecha del Próximo Mantenimiento</Label>
                  <Input
                    id="proximo_mantenimiento"
                    type="date"
                    value={mantenimientoFormData.proximo_mantenimiento}
                    onChange={(e) =>
                      setMantenimientoFormData({
                        ...mantenimientoFormData,
                        proximo_mantenimiento: e.target.value,
                      })
                    }
                  />
                  <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                    <strong>Nota:</strong> Si especificas una fecha para el próximo mantenimiento, se creará
                    automáticamente un recordatorio que te avisará 2 semanas antes de la fecha programada. Este
                    recordatorio aparecerá en la campanita de notificaciones del header y en la sección de
                    recordatorios.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowMantenimientoForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarMantenimiento}>Registrar Mantenimiento</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

const editarCamion = (camionDetalle: Camion) => {
  // TODO: Implement actual edit logic
  alert(`Editando camión ${camionDetalle.numero_economico}`)
}
