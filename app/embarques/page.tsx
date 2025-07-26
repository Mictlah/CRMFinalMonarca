"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Truck,
  Eye,
  RefreshCw,
  Printer,
} from "lucide-react"
import { useState, useEffect } from "react"
import {
  supabase,
  type Embarque,
  type Cliente,
  type Operador,
  type Camion,
  type Remolque,
  type ContactoCliente,
  type TipoServicio,
  obtenerContactosCliente,
} from "@/lib/supabase"

export default function EmbarquesPage() {
  const [embarques, setEmbarques] = useState<Embarque[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [remolques, setRemolques] = useState<Remolque[]>([])
  const [contactos, setContactos] = useState<ContactoCliente[]>([])
  const [tiposServicio, setTiposServicio] = useState<TipoServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [embarqueEditando, setEmbarqueEditando] = useState<Embarque | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [embarqueDetalle, setEmbarqueDetalle] = useState<Embarque | null>(null)
  const [showServicesModal, setShowServicesModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelingEmbarque, setCancelingEmbarque] = useState<Embarque | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [proximoFolio, setProximoFolio] = useState("")

  // Estado para el formulario
  const [formData, setFormData] = useState({
    folio: "",
    cliente_id: "",
    camion_id: "",
    remolque_id: "",
    contenido: "",
    peso: "",
    observaciones: "",
    direccion_recolecta: "",
    direccion_entrega: "",
    fecha_recolecta: "",
    hora_recolecta: "",
    fecha_entrega: "",
    hora_entrega: "",
    load_number: "",
    patente_agente_aduanal: "",
    aduana_cruce: "",
    dueno_mercancia: "",
    representante_cliente: "",
    carta_porte: "",
    tipo_servicio_id: "",
    remolque_manual: false,
    remolque_numero_economico: "",
    remolque_placa: "",
  })

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
    cargarProximoFolio()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadEmbarques(),
        loadClientes(),
        loadOperadores(),
        loadCamiones(),
        loadRemolques(),
        loadTiposServicio(),
      ])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmbarques = async () => {
    try {
      const { data, error } = await supabase
        .from("embarques")
        .select(`
          *,
          cliente:clientes(*),
          operador:operadores(*),
          camion:camiones(*),
          remolque:remolques(*)
        `)
        .order("fecha_creacion", { ascending: false })

      if (error) {
        console.error("Error loading embarques:", error)
        return
      }

      setEmbarques(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase.from("clientes").select("*").eq("estado", "activo").order("nombre")

      if (error) {
        console.error("Error loading clientes:", error)
        return
      }

      setClientes(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const loadOperadores = async () => {
    try {
      const { data, error } = await supabase.from("operadores").select("*").eq("estado", "activo").order("nombre")

      if (error) {
        console.error("Error loading operadores:", error)
        return
      }

      setOperadores(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const loadCamiones = async () => {
    try {
      const { data, error } = await supabase.from("camiones").select("*").order("numero_economico")

      if (error) {
        console.error("Error loading camiones:", error)
        return
      }

      setCamiones(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const loadRemolques = async () => {
    try {
      const { data, error } = await supabase.from("remolques").select("*").order("numero_economico")

      if (error) {
        console.error("Error loading remolques:", error)
        return
      }

      setRemolques(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const loadTiposServicio = async () => {
    try {
      const { data, error } = await supabase.from("tipos_servicio").select("*").eq("activo", true).order("nombre")

      if (error) {
        console.warn("Tabla tipos_servicio no existe aún:", error)
        setTiposServicio([])
        return
      }

      setTiposServicio(data || [])
    } catch (error) {
      console.warn("Error loading tipos servicio (tabla puede no existir):", error)
      setTiposServicio([])
    }
  }

  const generarFolioEspecifico = async () => {
    try {
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, "0")

      const baseFormat = `TIM-${year}${month}`

      const { data: existingEmbarques, error } = await supabase
        .from("embarques")
        .select("folio")
        .like("folio", `${baseFormat}-%`)
        .order("folio", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error getting existing folios:", error)
        return `${baseFormat}-001`
      }

      if (!existingEmbarques || existingEmbarques.length === 0) {
        return `${baseFormat}-001`
      }

      const lastFolio = existingEmbarques[0].folio
      const consecutiveMatch = lastFolio.match(/-(\d{3})$/)

      if (!consecutiveMatch) {
        return `${baseFormat}-001`
      }

      const lastConsecutive = Number.parseInt(consecutiveMatch[1])
      const nextConsecutive = (lastConsecutive + 1).toString().padStart(3, "0")

      return `${baseFormat}-${nextConsecutive}`
    } catch (error) {
      console.error("Error generating folio:", error)
      return "Error al generar"
    }
  }

  const cargarProximoFolio = async () => {
    try {
      const folio = await generarFolioEspecifico()
      setProximoFolio(folio)
    } catch (error) {
      console.error("Error generando folio:", error)
      setProximoFolio("Error al generar")
    }
  }

  const cargarContactos = async (clienteId: string) => {
    if (!clienteId || clienteId === "none") {
      setContactos([])
      return
    }

    try {
      console.log("Cargando contactos para cliente:", clienteId)
      const contactosData = await obtenerContactosCliente(clienteId)
      console.log("Contactos cargados:", contactosData)
      setContactos(contactosData)
    } catch (error) {
      console.error("Error cargando contactos:", error)
      setContactos([])
    }
  }

  const resetForm = () => {
    setFormData({
      folio: "",
      cliente_id: "",
      camion_id: "",
      remolque_id: "",
      contenido: "",
      peso: "",
      observaciones: "",
      direccion_recolecta: "",
      direccion_entrega: "",
      fecha_recolecta: "",
      hora_recolecta: "",
      fecha_entrega: "",
      hora_entrega: "",
      load_number: "",
      patente_agente_aduanal: "",
      aduana_cruce: "",
      dueno_mercancia: "",
      representante_cliente: "",
      carta_porte: "",
      tipo_servicio_id: "",
      remolque_manual: false,
      remolque_numero_economico: "",
      remolque_placa: "",
    })
    setEmbarqueEditando(null)
    setContactos([])
    if (!embarqueEditando) {
      cargarProximoFolio()
    }
  }

  const handleCreate = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const handleEdit = async (embarque: Embarque) => {
    setFormData({
      folio: embarque.folio,
      cliente_id: embarque.cliente_id || "",
      camion_id: embarque.camion_id || "",
      remolque_id: embarque.remolque_id || "",
      direccion_recolecta: embarque.direccion_recolecta || "",
      direccion_entrega: embarque.direccion_entrega || "",
      fecha_recolecta: embarque.fecha_recolecta || "",
      hora_recolecta: embarque.hora_recolecta || "",
      fecha_entrega: embarque.fecha_entrega || "",
      hora_entrega: embarque.hora_entrega || "",
      contenido: embarque.contenido || "",
      peso: embarque.peso?.toString() || "",
      observaciones: embarque.observaciones || "",
      load_number: embarque.load_number || "",
      patente_agente_aduanal: embarque.patente_agente_aduanal || "",
      aduana_cruce: embarque.aduana_cruce || "",
      dueno_mercancia: embarque.dueno_mercancia || "",
      representante_cliente: embarque.representante_cliente || "",
      carta_porte: embarque.carta_porte || "",
      tipo_servicio_id: embarque.tipo_servicio_id || "",
      remolque_manual:
        !embarque.remolque_id && (embarque.remolque_numero_economico || embarque.remolque_placa) ? true : false,
      remolque_numero_economico: embarque.remolque_numero_economico || "",
      remolque_placa: embarque.remolque_placa || "",
    })

    if (embarque.cliente_id) {
      await cargarContactos(embarque.cliente_id)
    }

    setEmbarqueEditando(embarque)
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!formData.direccion_recolecta || !formData.direccion_entrega) {
      alert("Por favor completa los campos obligatorios (dirección de recolecta y dirección de entrega)")
      return
    }

    try {
      setSaving(true)

      let folio = formData.folio

      if (!embarqueEditando) {
        folio = await generarFolioEspecifico()
      }

      let infoContacto = null
      if (formData.representante_cliente && formData.representante_cliente !== "none") {
        const contacto = contactos.find((c) => c.id === formData.representante_cliente)
        if (contacto) {
          infoContacto = {
            id: contacto.id,
            nombre: contacto.nombre,
            telefono: contacto.telefono,
            email: contacto.email,
            puesto: contacto.puesto,
            es_principal: contacto.es_principal,
          }
        }
      }

      const embarqueData: any = {
        folio,
        cliente_id: formData.cliente_id && formData.cliente_id !== "none" ? formData.cliente_id : null,
        operador_id: null,
        camion_id: formData.camion_id && formData.camion_id !== "none" ? formData.camion_id : null,
        remolque_id: formData.remolque_id && formData.remolque_id !== "none" ? formData.remolque_id : null,
        origen: formData.direccion_recolecta || "Por definir",
        destino: formData.direccion_entrega || "Por definir",
        direccion_recolecta: formData.direccion_recolecta,
        direccion_entrega: formData.direccion_entrega,
        fecha_recolecta: formData.fecha_recolecta || null,
        hora_recolecta: formData.hora_recolecta || null,
        fecha_entrega: formData.fecha_entrega || null,
        hora_entrega: formData.hora_entrega || null,
        contenido: formData.contenido || null,
        peso: formData.peso ? Number.parseFloat(formData.peso) : null,
        estado: embarqueEditando ? embarqueEditando.estado : "creado",
        load_number: formData.load_number || null,
        patente_agente_aduanal: formData.patente_agente_aduanal || null,
        aduana_cruce: formData.aduana_cruce || null,
        dueno_mercancia: formData.dueno_mercancia || null,
        representante_cliente:
          formData.representante_cliente && formData.representante_cliente !== "none"
            ? formData.representante_cliente
            : null,
        info_representante: infoContacto,
        carta_porte: formData.carta_porte || null,
        tipo_servicio_id:
          formData.tipo_servicio_id && formData.tipo_servicio_id !== "none" ? formData.tipo_servicio_id : null,
        updated_at: new Date().toISOString(),
        remolque_numero_economico: formData.remolque_manual ? formData.remolque_numero_economico : null,
        remolque_placa: formData.remolque_manual ? formData.remolque_placa : null,
      }

      try {
        embarqueData.observaciones = formData.observaciones || null
      } catch (error) {
        console.warn("Campo observaciones no disponible en el esquema actual")
      }

      console.log("Datos a guardar:", embarqueData)

      if (embarqueEditando) {
        const { error } = await supabase.from("embarques").update(embarqueData).eq("id", embarqueEditando.id)

        if (error) {
          console.error("Error actualizando embarque:", error)
          alert(`Error al actualizar embarque: ${error.message}`)
          return
        }
      } else {
        const { error } = await supabase.from("embarques").insert(embarqueData)

        if (error) {
          console.error("Error creando embarque:", error)
          alert(`Error al crear embarque: ${error.message}`)
          return
        }
      }

      alert(embarqueEditando ? "Embarque actualizado exitosamente" : "Embarque creado exitosamente")
      resetForm()
      setShowCreateModal(false)
      setShowEditModal(false)
      await loadEmbarques()
    } catch (error) {
      console.error("Error guardando embarque:", error)
      alert(`Error al guardar embarque: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (embarque: Embarque) => {
    try {
      const { error } = await supabase.from("embarques").delete().eq("id", embarque.id)

      if (error) {
        console.error("Error eliminando embarque:", error)
        alert("Error al eliminar embarque")
        return
      }

      alert("Embarque eliminado exitosamente")
      await loadEmbarques()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar embarque")
    }
  }

  const handleViewDetails = (embarque: Embarque) => {
    setEmbarqueDetalle(embarque)
    setShowDetailModal(true)
  }

  const cancelarEmbarque = async () => {
    if (!cancelingEmbarque || !cancelReason.trim()) {
      alert("Por favor ingresa una justificación para la cancelación")
      return
    }

    try {
      setSaving(true)

      const updateData: any = {
        estado: "cancelado",
        updated_at: new Date().toISOString(),
      }

      try {
        updateData.observaciones = `${cancelingEmbarque.observaciones || ""}

[CANCELADO] ${cancelReason}`.trim()
      } catch (error) {
        console.warn("Campo observaciones no disponible, guardando justificación en campo alternativo")
      }

      const { error } = await supabase.from("embarques").update(updateData).eq("id", cancelingEmbarque.id)

      if (error) {
        console.error("Error cancelando embarque:", error)
        alert("Error al cancelar embarque")
        return
      }

      alert("Embarque cancelado exitosamente")
      setShowCancelModal(false)
      setCancelingEmbarque(null)
      setCancelReason("")
      await loadEmbarques()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cancelar embarque")
    } finally {
      setSaving(false)
    }
  }

  const updateEstado = async (embarque: Embarque, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from("embarques")
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarque.id)

      if (error) {
        console.error("Error updating estado:", error)
        alert("Error al actualizar el estado")
        return
      }

      await loadEmbarques()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar el estado")
    }
  }

  const marcarComoCompletado = async (embarque: Embarque) => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from("embarques")
        .update({
          estado: "listo-para-asignar",
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarque.id)

      if (error) {
        console.error("Error actualizando embarque:", error)
        alert("Error al marcar como completado")
        return
      }

      alert("Embarque marcado como completado y enviado a asignación")
      await loadEmbarques()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al marcar como completado")
    } finally {
      setSaving(false)
    }
  }

  const getServiceDisplayName = (serviceId: string) => {
    // Primero buscar en la base de datos
    const tipoFromDB = tiposServicio.find((tipo) => tipo.id === serviceId)
    if (tipoFromDB) {
      return tipoFromDB.nombre
    }

    // Fallback a nombres hardcodeados
    const serviceNames = {
      "exportacion-cargada-caja-seca-240": "EXPORTACIÓN CARGADA - CAJA SECA 240",
      "exportacion-cargada-larmex-240": "EXPORTACIÓN CARGADA - CAJA SECA (LARMEX) 240",
      "exportacion-cargada-thermo-agricultura-240": "EXPORTACIÓN CARGADA - THERMO (AGRICULTURA) 240",
      "exportacion-cargada-plataforma-240": "EXPORTACIÓN CARGADA - PLATAFORMA 240",
      "importacion-cargada-caja-seca-240": "IMPORTACIÓN CARGADA - CAJA SECA 240",
      "importacion-cargada-plataforma-240": "IMPORTACIÓN CARGADA - PLATAFORMA 240",
      "importacion-vacia-caja-seca-thermo-240": "IMPORTACIÓN VACÍA - CAJA SECA/THERMO 240",
      "importacion-cargada-plataforma-amarre-240": "IMPORTACIÓN CARGADA - PLATAFORMA CON AMARRE 240",
      "importacion-en-tractor-240": "IMPORTACIÓN - EN TRACTOR 240",
      "exportacion-cargada-caja-seca-800": "EXPORTACIÓN CARGADA - CAJA SECA 800",
      "exportacion-vacia-caja-seca-800": "EXPORTACIÓN VACÍA - CAJA SECA 800",
      "exportacion-en-tractor-800": "EXPORTACIÓN - EN TRACTOR 800",
      "exportacion-cargada-plataforma-800": "EXPORTACIÓN CARGADA - PLATAFORMA 800",
      "importacion-cargada-caja-seca-800": "IMPORTACIÓN CARGADA - CAJA SECA 800",
      "importacion-vacia-plataforma-800": "IMPORTACIÓN VACÍA - PLATAFORMA 800",
      "pagos-extras": "PAGOS EXTRAS",
      "horas-rojo-amarillo": "HORAS ROJO/AMARILLO",
      "cargas-descargas": "CARGAS/DESCARGAS",
      "movimientos-en-falso": "MOVIMIENTOS EN FALSO",
      "movimientos-locales": "MOVIMIENTOS LOCALES",
      otro: "OTRO",
    }
    return serviceNames[serviceId] || serviceId
  }

  const imprimirFormulario = () => {
    const printContent = `
      <html>
        <head>
          <title>Formulario de Embarque - ${embarqueEditando ? formData.folio : proximoFolio}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .value { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .full-width { grid-column: 1 / -1; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TRANSPORTES MONARCA</h1>
            <h2>FORMULARIO DE EMBARQUE</h2>
            <p>Folio: <span class="value">${embarqueEditando ? formData.folio : proximoFolio}</span></p>
          </div>
          
          <div class="section">
            <h3>INFORMACIÓN BÁSICA</h3>
            <div class="grid">
              <div class="field">
                <span class="label">Carta Porte:</span> <span class="value">${formData.carta_porte}</span>
              </div>
              <div class="field">
                <span class="label">Cliente:</span> <span class="value">${clientes.find((c) => c.id === formData.cliente_id)?.nombre || ""}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>DIRECCIONES</h3>
            <div class="field full-width">
              <span class="label">Dirección de Recolecta:</span><br>
              <span class="value" style="width: 100%; min-height: 40px; display: block;">${formData.direccion_recolecta}</span>
            </div>
            <div class="field full-width">
              <span class="label">Dirección de Entrega:</span><br>
              <span class="value" style="width: 100%; min-height: 40px; display: block;">${formData.direccion_entrega}</span>
            </div>
          </div>

          <div class="section">
            <h3>FECHAS Y HORARIOS</h3>
            <div class="grid">
              <div class="field">
                <span class="label">Fecha Recolecta:</span> <span class="value">${formData.fecha_recolecta}</span>
              </div>
              <div class="field">
                <span class="label">Hora Recolecta:</span> <span class="value">${formData.hora_recolecta}</span>
              </div>
              <div class="field">
                <span class="label">Fecha Entrega:</span> <span class="value">${formData.fecha_entrega}</span>
              </div>
              <div class="field">
                <span class="label">Hora Entrega:</span> <span class="value">${formData.hora_entrega}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>VEHÍCULOS</h3>
            <div class="grid">
              <div class="field">
                <span class="label">Tractocamión:</span> <span class="value">${camiones.find((c) => c.id === formData.camion_id)?.numero_economico || ""}</span>
              </div>
              <div class="field">
                <span class="label">Remolque:</span> <span class="value">${remolques.find((r) => r.id === formData.remolque_id)?.numero_economico || ""}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>DETALLES DE CARGA</h3>
            <div class="grid">
              <div class="field">
                <span class="label">Contenido:</span> <span class="value">${formData.contenido}</span>
              </div>
              <div class="field">
                <span class="label">Peso (kg):</span> <span class="value">${formData.peso}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>OBSERVACIONES</h3>
            <div class="field full-width">
              <span class="value" style="width: 100%; min-height: 60px; display: block;">${formData.observaciones}</span>
            </div>
          </div>

          <div style="margin-top: 50px;">
            <div class="grid">
              <div style="text-align: center;">
                <div style="border-top: 1px solid #000; margin-top: 50px; padding-top: 5px;">
                  FIRMA AUTORIZADA
                </div>
              </div>
              <div style="text-align: center;">
                <div style="border-top: 1px solid #000; margin-top: 50px; padding-top: 5px;">
                  FECHA: ${new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Filtrar embarques
  const embarquesFiltrados = embarques.filter((embarque) => {
    const coincideBusqueda =
      embarque.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (embarque.load_number && embarque.load_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (embarque.cliente?.nombre && embarque.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (embarque.direccion_recolecta && embarque.direccion_recolecta.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (embarque.direccion_entrega && embarque.direccion_entrega.toLowerCase().includes(searchTerm.toLowerCase()))

    const coincideEstado =
      filtroEstado === "todos" ||
      embarque.estado === filtroEstado ||
      (filtroEstado === "activos" &&
        embarque.estado !== "cancelado" &&
        embarque.estado !== "archivado" &&
        embarque.estado !== "finalizado")

    return coincideBusqueda && coincideEstado
  })

  const getEstadoBadge = (estado: string, embarque?: Embarque) => {
    if (
      estado === "creado" &&
      embarque &&
      embarque.updated_at &&
      new Date(embarque.updated_at).getTime() > new Date(embarque.fecha_creacion).getTime()
    ) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Modificado</Badge>
    }

    const estados = {
      creado: { color: "bg-blue-100 text-blue-800", label: "Creado" },
      "listo-para-asignar": { color: "bg-green-100 text-green-800", label: "Listo para Asignar" },
      asignado: { color: "bg-yellow-100 text-yellow-800", label: "Asignado" },
      "en-transito": { color: "bg-orange-100 text-orange-800", label: "En Tránsito" },
      finalizado: { color: "bg-green-100 text-green-800", label: "Finalizado" },
      entregado: { color: "bg-green-100 text-green-800", label: "Entregado" },
      cancelado: { color: "bg-red-100 text-red-800", label: "Cancelado" },
      archivado: { color: "bg-purple-100 text-purple-800", label: "Archivado" },
    }

    const estadoInfo = estados[estado as keyof typeof estados] || { color: "bg-gray-100 text-gray-800", label: estado }

    return <Badge className={`${estadoInfo.color} hover:${estadoInfo.color}`}>{estadoInfo.label}</Badge>
  }

  const getVehicleStatusBadge = (estado: string) => {
    return estado === "disponible" || estado === "activo" ? (
      <Badge className="bg-green-100 text-green-800 text-xs ml-2">Activo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 text-xs ml-2">Inactivo</Badge>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Cargando embarques...</span>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Embarques</h1>
            <p className="text-gray-600 mt-2">Administrar embarques y asignaciones</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Embarque
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Año {new Date().getFullYear()}</p>
                  <p className="text-2xl font-bold">
                    {
                      embarques.filter((e) => new Date(e.fecha_creacion).getFullYear() === new Date().getFullYear())
                        .length
                    }
                  </p>
                  <p className="text-xs text-gray-500">Embarques del año actual</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cancelados Año</p>
                  <p className="text-2xl font-bold text-red-600">
                    {
                      embarques.filter(
                        (e) =>
                          e.estado === "cancelado" &&
                          new Date(e.fecha_creacion).getFullYear() === new Date().getFullYear(),
                      ).length
                    }
                  </p>
                  <p className="text-xs text-gray-500">Cancelados en {new Date().getFullYear()}</p>
                </div>
                <Package className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Tránsito</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {embarques.filter((e) => e.estado === "en-transito").length}
                  </p>
                  <p className="text-xs text-gray-500">Actualmente en ruta</p>
                </div>
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Finalizados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {embarques.filter((e) => e.estado === "finalizado").length}
                  </p>
                  <p className="text-xs text-gray-500">Completados exitosamente</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Eficiencia</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {embarques.filter((e) => new Date(e.fecha_creacion).getFullYear() === new Date().getFullYear())
                      .length > 0
                      ? Math.round(
                          (embarques.filter(
                            (e) =>
                              e.estado === "finalizado" &&
                              new Date(e.fecha_creacion).getFullYear() === new Date().getFullYear(),
                          ).length /
                            embarques.filter(
                              (e) => new Date(e.fecha_creacion).getFullYear() === new Date().getFullYear(),
                            ).length) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-gray-500">Tasa de entrega anual</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por folio, dirección o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="creado">Creado</SelectItem>
                <SelectItem value="listo-para-asignar">Listo para Asignar</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="en-transito">En Tránsito</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="archivado">Archivado</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Lista de embarques */}
        <div className="grid grid-cols-1 gap-4">
          {embarquesFiltrados.map((embarque) => (
            <Card key={embarque.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Folio: {embarque.folio}</CardTitle>
                    <CardDescription>
                      {embarque.cliente?.nombre && `Cliente: ${embarque.cliente.nombre}`}
                      {embarque.operador && ` • Operador: ${embarque.operador.nombre} ${embarque.operador.apellidos}`}
                      {embarque.info_representante &&
                        ` • Representante: ${embarque.info_representante.nombre} ${embarque.info_representante.apellidos || ""}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getEstadoBadge(embarque.estado, embarque)}
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(embarque)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>

                      {embarque.estado === "creado" && (
                        <Button variant="outline" size="sm" onClick={() => marcarComoCompletado(embarque)}>
                          <Package className="h-4 w-4 mr-1" />
                          Completar y Enviar
                        </Button>
                      )}

                      {embarque.estado === "listo-para-asignar" && (
                        <Badge className="bg-green-100 text-green-800">Listo para Asignar</Badge>
                      )}

                      <Button variant="outline" size="sm" onClick={() => handleEdit(embarque)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCancelingEmbarque(embarque)
                          setShowCancelModal(true)
                        }}
                        disabled={embarque.estado === "listo-para-asignar"}
                      >
                        Cancelar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={embarque.estado === "listo-para-asignar"}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar embarque?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el embarque.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(embarque)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Recolecta</p>
                      {embarque.direccion_recolecta && (
                        <p className="text-xs text-gray-500">{embarque.direccion_recolecta}</p>
                      )}
                    </div>
                  </div>
                  {embarque.fecha_recolecta && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Fecha Recolecta</p>
                        <p className="text-gray-600">
                          {new Date(embarque.fecha_recolecta).toLocaleDateString()}
                          {embarque.hora_recolecta && ` ${embarque.hora_recolecta}`}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Entrega</p>
                      {embarque.direccion_entrega && (
                        <p className="text-xs text-gray-500">{embarque.direccion_entrega}</p>
                      )}
                    </div>
                  </div>
                  {embarque.fecha_entrega && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Fecha Entrega</p>
                        <p className="text-gray-600">
                          {new Date(embarque.fecha_entrega).toLocaleDateString()}
                          {embarque.hora_entrega && ` ${embarque.hora_entrega}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm border-t pt-3">
                  {embarque.camion && (
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Camión</p>
                        <p className="text-xs text-gray-500">{embarque.camion.numero_economico}</p>
                      </div>
                    </div>
                  )}
                  {(embarque.remolque || embarque.remolque_numero_economico) && (
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Remolque</p>
                        <p className="text-xs text-gray-500">
                          {embarque.remolque?.numero_economico || embarque.remolque_numero_economico}
                          {embarque.remolque_numero_economico && !embarque.remolque && (
                            <span className="ml-1 text-blue-600">(Manual)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {embarque.tipo_servicio_id && (
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Tipo de Servicio</p>
                        <p className="text-xs text-gray-500">{getServiceDisplayName(embarque.tipo_servicio_id)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {(embarque.load_number ||
                  embarque.patente_agente_aduanal ||
                  embarque.aduana_cruce ||
                  embarque.dueno_mercancia) && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Información Aduanal</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {embarque.load_number && (
                        <div>
                          <span className="font-medium">Load:</span> {embarque.load_number}
                        </div>
                      )}
                      {embarque.patente_agente_aduanal && (
                        <div>
                          <span className="font-medium">Patente:</span> {embarque.patente_agente_aduanal}
                        </div>
                      )}
                      {embarque.aduana_cruce && (
                        <div>
                          <span className="font-medium">Aduana:</span> {embarque.aduana_cruce}
                        </div>
                      )}
                      {embarque.dueno_mercancia && (
                        <div>
                          <span className="font-medium">Dueño:</span> {embarque.dueno_mercancia}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {embarque.contenido && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Contenido:</strong> {embarque.contenido}
                    </p>
                  </div>
                )}

                {embarque.observaciones && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Observaciones:</strong> {embarque.observaciones}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Creado: {new Date(embarque.fecha_creacion).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {embarquesFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No se encontraron embarques</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>}
            </CardContent>
          </Card>
        )}

        {/* Modal para crear/editar embarque */}
        <Dialog
          open={showCreateModal || showEditModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateModal(false)
              setShowEditModal(false)
              setEmbarqueEditando(null)
              resetForm()
            }
          }}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{embarqueEditando ? "Modificar Embarque" : "Nuevo Embarque"}</DialogTitle>
              <DialogDescription>Completa la información del embarque</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="basica" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basica">Información Básica</TabsTrigger>
                      <TabsTrigger value="direcciones">Direcciones</TabsTrigger>
                      <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
                      <TabsTrigger value="detalles">Detalles</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basica" className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="folio">Folio</Label>
                          <Input
                            id="folio"
                            value={embarqueEditando ? formData.folio : proximoFolio}
                            disabled
                            className="bg-gray-50 font-mono"
                            placeholder="Generando folio..."
                          />
                          <p className="text-xs text-gray-500">
                            {embarqueEditando ? "Folio asignado" : "Folio que se asignará automáticamente"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="carta_porte">Número de Carta Porte</Label>
                          <Input
                            id="carta_porte"
                            value={formData.carta_porte}
                            onChange={(e) => setFormData({ ...formData, carta_porte: e.target.value })}
                            placeholder="Número de carta porte"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tipo_servicio_id">Tipo de Servicio</Label>
                          <Select
                            value={formData.tipo_servicio_id || "none"}
                            onValueChange={(value) =>
                              setFormData({ ...formData, tipo_servicio_id: value === "none" ? "" : value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  formData.tipo_servicio_id
                                    ? getServiceDisplayName(formData.tipo_servicio_id)
                                    : "Seleccionar tipo de servicio"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {tiposServicio.length > 0 ? (
                                tiposServicio.map((tipo) => (
                                  <SelectItem key={tipo.id} value={tipo.id}>
                                    {tipo.nombre}
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  {/* Fallback a valores hardcodeados si no hay datos en BD */}
                                  <SelectItem value="exportacion-cargada-caja-seca-240">
                                    EXPORTACIÓN CARGADA - CAJA SECA 240
                                  </SelectItem>
                                  <SelectItem value="exportacion-cargada-larmex-240">
                                    EXPORTACIÓN CARGADA - CAJA SECA (LARMEX) 240
                                  </SelectItem>
                                  <SelectItem value="exportacion-cargada-thermo-agricultura-240">
                                    EXPORTACIÓN CARGADA - THERMO (AGRICULTURA) 240
                                  </SelectItem>
                                  <SelectItem value="exportacion-cargada-plataforma-240">
                                    EXPORTACIÓN CARGADA - PLATAFORMA 240
                                  </SelectItem>
                                  <SelectItem value="importacion-cargada-caja-seca-240">
                                    IMPORTACIÓN CARGADA - CAJA SECA 240
                                  </SelectItem>
                                  <SelectItem value="importacion-cargada-plataforma-240">
                                    IMPORTACIÓN CARGADA - PLATAFORMA 240
                                  </SelectItem>
                                  <SelectItem value="importacion-vacia-caja-seca-thermo-240">
                                    IMPORTACIÓN VACÍA - CAJA SECA/THERMO 240
                                  </SelectItem>
                                  <SelectItem value="importacion-cargada-plataforma-amarre-240">
                                    IMPORTACIÓN CARGADA - PLATAFORMA CON AMARRE 240
                                  </SelectItem>
                                  <SelectItem value="importacion-en-tractor-240">
                                    IMPORTACIÓN - EN TRACTOR 240
                                  </SelectItem>
                                  <SelectItem value="exportacion-cargada-caja-seca-800">
                                    EXPORTACIÓN CARGADA - CAJA SECA 800
                                  </SelectItem>
                                  <SelectItem value="exportacion-vacia-caja-seca-800">
                                    EXPORTACIÓN VACÍA - CAJA SECA 800
                                  </SelectItem>
                                  <SelectItem value="exportacion-en-tractor-800">
                                    EXPORTACIÓN - EN TRACTOR 800
                                  </SelectItem>
                                  <SelectItem value="exportacion-cargada-plataforma-800">
                                    EXPORTACIÓN CARGADA - PLATAFORMA 800
                                  </SelectItem>
                                  <SelectItem value="importacion-cargada-caja-seca-800">
                                    IMPORTACIÓN CARGADA - CAJA SECA 800
                                  </SelectItem>
                                  <SelectItem value="importacion-vacia-plataforma-800">
                                    IMPORTACIÓN VACÍA - PLATAFORMA 800
                                  </SelectItem>
                                  <SelectItem value="pagos-extras">PAGOS EXTRAS</SelectItem>
                                  <SelectItem value="horas-rojo-amarillo">HORAS ROJO/AMARILLO</SelectItem>
                                  <SelectItem value="cargas-descargas">CARGAS/DESCARGAS</SelectItem>
                                  <SelectItem value="movimientos-en-falso">MOVIMIENTOS EN FALSO</SelectItem>
                                  <SelectItem value="movimientos-locales">MOVIMIENTOS LOCALES</SelectItem>
                                  <SelectItem value="otro">OTRO</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cliente_id">Cliente</Label>
                          <Select
                            value={formData.cliente_id}
                            onValueChange={(value) => {
                              console.log("Cliente seleccionado:", value)
                              setFormData({ ...formData, cliente_id: value, representante_cliente: "" })
                              cargarContactos(value)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {clientes.map((cliente) => (
                                <SelectItem key={cliente.id} value={cliente.id}>
                                  {cliente.nombre} {cliente.empresa && `- ${cliente.empresa}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="representante_cliente">Contacto del Cliente</Label>
                        <Select
                          value={formData.representante_cliente}
                          onValueChange={(value) => setFormData({ ...formData, representante_cliente: value })}
                          disabled={!formData.cliente_id || formData.cliente_id === "none"}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !formData.cliente_id || formData.cliente_id === "none"
                                  ? "Primero selecciona un cliente"
                                  : contactos.length === 0
                                    ? "No hay contactos registrados"
                                    : "Seleccionar contacto"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin asignar</SelectItem>
                            {contactos.length > 0
                              ? contactos.map((contacto) => (
                                  <SelectItem key={contacto.id} value={contacto.id}>
                                    {contacto.nombre} {contacto.puesto && `- ${contacto.puesto}`}
                                    {contacto.es_principal && " (Principal)"}
                                  </SelectItem>
                                ))
                              : formData.cliente_id &&
                                formData.cliente_id !== "none" && (
                                  <SelectItem value="no-contacts" disabled>
                                    No hay contactos registrados para este cliente
                                  </SelectItem>
                                )}
                          </SelectContent>
                        </Select>
                        {formData.cliente_id && formData.cliente_id !== "none" && (
                          <p className="text-xs text-gray-500">
                            {contactos.length > 0
                              ? `${contactos.length} contacto(s) disponible(s)`
                              : "No hay contactos registrados para este cliente"}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="direcciones" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Información de Recolecta</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="direccion_recolecta">Dirección de Recolecta *</Label>
                            <Textarea
                              id="direccion_recolecta"
                              value={formData.direccion_recolecta}
                              onChange={(e) => setFormData({ ...formData, direccion_recolecta: e.target.value })}
                              placeholder="Dirección completa de recolecta"
                              rows={3}
                              className="resize-none"
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="fecha_recolecta">Fecha de Recolecta</Label>
                              <Input
                                id="fecha_recolecta"
                                type="date"
                                value={formData.fecha_recolecta}
                                onChange={(e) => setFormData({ ...formData, fecha_recolecta: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="hora_recolecta">Hora de Recolecta</Label>
                              <Input
                                id="hora_recolecta"
                                type="time"
                                value={formData.hora_recolecta}
                                onChange={(e) => setFormData({ ...formData, hora_recolecta: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-gray-900">Información de Entrega</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="direccion_entrega">Dirección de Entrega *</Label>
                            <Textarea
                              id="direccion_entrega"
                              value={formData.direccion_entrega}
                              onChange={(e) => setFormData({ ...formData, direccion_entrega: e.target.value })}
                              placeholder="Dirección completa de entrega"
                              rows={3}
                              className="resize-none"
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="fecha_entrega">Fecha de Entrega</Label>
                              <Input
                                id="fecha_entrega"
                                type="date"
                                value={formData.fecha_entrega}
                                onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="hora_entrega">Hora de Entrega</Label>
                              <Input
                                id="hora_entrega"
                                type="time"
                                value={formData.hora_entrega}
                                onChange={(e) => setFormData({ ...formData, hora_entrega: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="vehiculos" className="space-y-4 mt-6">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Remolque</h4>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="remolque_manual"
                              checked={formData.remolque_manual}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  remolque_manual: e.target.checked,
                                  remolque_id: e.target.checked ? "" : formData.remolque_id,
                                  remolque_numero_economico: e.target.checked ? formData.remolque_numero_economico : "",
                                  remolque_placa: e.target.checked ? formData.remolque_placa : "",
                                })
                              }}
                              className="rounded"
                            />
                            <Label htmlFor="remolque_manual" className="text-sm">
                              Capturar remolque manualmente
                            </Label>
                          </div>

                          {!formData.remolque_manual && (
                            <div className="space-y-2">
                              <Label htmlFor="remolque_id">Seleccionar Remolque del Inventario</Label>
                              <Select
                                value={formData.remolque_id || ""}
                                onValueChange={(value) => setFormData({ ...formData, remolque_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar remolque" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sin asignar</SelectItem>
                                  {remolques.map((remolque) => (
                                    <SelectItem key={remolque.id} value={remolque.id}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>
                                          {remolque.numero_economico} - {remolque.marca} {remolque.modelo}
                                        </span>
                                        {getVehicleStatusBadge(remolque.estado)}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {formData.remolque_manual && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="space-y-2">
                                <Label htmlFor="remolque_numero_economico">Número Económico *</Label>
                                <Input
                                  id="remolque_numero_economico"
                                  value={formData.remolque_numero_economico}
                                  onChange={(e) =>
                                    setFormData({ ...formData, remolque_numero_economico: e.target.value })
                                  }
                                  placeholder="Ej: R-001, EXT-123"
                                  required={formData.remolque_manual}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="remolque_placa">Placa del Remolque *</Label>
                                <Input
                                  id="remolque_placa"
                                  value={formData.remolque_placa}
                                  onChange={(e) => setFormData({ ...formData, remolque_placa: e.target.value })}
                                  placeholder="Ej: ABC-123, XYZ-789"
                                  required={formData.remolque_manual}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs text-blue-600">
                                  💡 Estos datos se guardarán únicamente para este embarque y no se agregarán al
                                  inventario de remolques.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">El tractocamión y operador se asignarán posteriormente</p>
                    </TabsContent>

                    <TabsContent value="detalles" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Información Aduanal (Opcional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="load_number">Load Number</Label>
                            <Input
                              id="load_number"
                              value={formData.load_number}
                              onChange={(e) => setFormData({ ...formData, load_number: e.target.value })}
                              placeholder="Número de load"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="patente_agente_aduanal">Patente Agente Aduanal</Label>
                            <Input
                              id="patente_agente_aduanal"
                              value={formData.patente_agente_aduanal}
                              onChange={(e) => setFormData({ ...formData, patente_agente_aduanal: e.target.value })}
                              placeholder="Patente del agente"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="aduana_cruce">Aduana de Cruce</Label>
                            <Input
                              id="aduana_cruce"
                              value={formData.aduana_cruce}
                              onChange={(e) => setFormData({ ...formData, aduana_cruce: e.target.value })}
                              placeholder="Aduana de cruce fronterizo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dueno_mercancia">Dueño de la Mercancía</Label>
                            <Input
                              id="dueno_mercancia"
                              value={formData.dueno_mercancia}
                              onChange={(e) => setFormData({ ...formData, dueno_mercancia: e.target.value })}
                              placeholder="Nombre del dueño"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-gray-900">Detalles del Embarque</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contenido">Contenido</Label>
                            <Input
                              id="contenido"
                              value={formData.contenido}
                              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                              placeholder="Descripción de la carga"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="peso">Peso (kg)</Label>
                            <Input
                              id="peso"
                              type="number"
                              step="0.01"
                              value={formData.peso}
                              onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                              placeholder="Peso en kilogramos"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="observaciones">Observaciones</Label>
                          <Textarea
                            id="observaciones"
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            placeholder="Observaciones adicionales"
                            rows={3}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={imprimirFormulario}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    setEmbarqueEditando(null)
                    resetForm()
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : embarqueEditando ? (
                    "Actualizar Embarque"
                  ) : (
                    "Guardar Embarque"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para cancelar embarque */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancelar Embarque</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas cancelar el embarque {cancelingEmbarque?.folio}?
                <br />
                <strong>Esta acción no se puede deshacer.</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Justificación de la cancelación *</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ingresa la razón por la cual se cancela este embarque..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelingEmbarque(null)
                  setCancelReason("")
                }}
                disabled={saving}
              >
                Cerrar
              </Button>
              <Button
                onClick={cancelarEmbarque}
                disabled={saving || !cancelReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cancelando...
                  </>
                ) : (
                  "Confirmar Cancelación"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de detalles */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Embarque {embarqueDetalle?.folio}</DialogTitle>
              <DialogDescription>Información completa del embarque</DialogDescription>
            </DialogHeader>

            {embarqueDetalle && (
              <div className="space-y-6">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="direcciones">Direcciones y Fechas</TabsTrigger>
                    <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
                    <TabsTrigger value="facturacion">Facturación</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Folio</Label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">{embarqueDetalle.folio}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Load Number</Label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                          {embarqueDetalle.load_number || "Sin asignar"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Estado</Label>
                        <div className="mt-1">{getEstadoBadge(embarqueDetalle.estado)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Cliente</Label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                          {embarqueDetalle.cliente?.nombre || "Sin asignar"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Carta Porte</Label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                          {embarqueDetalle.carta_porte || "Sin asignar"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tipo de Servicio</Label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                          {embarqueDetalle.tipo_servicio_id
                            ? getServiceDisplayName(embarqueDetalle.tipo_servicio_id)
                            : "Sin asignar"}
                        </p>
                      </div>
                    </div>

                    {embarqueDetalle.contenido && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contenido</Label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded mt-1">{embarqueDetalle.contenido}</p>
                      </div>
                    )}

                    {embarqueDetalle.observaciones && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Observaciones</Label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded mt-1">
                          {embarqueDetalle.observaciones}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="direcciones" className="space-y-4 mt-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Información de Recolecta</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Dirección de Recolecta</Label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded mt-1">
                              {embarqueDetalle.direccion_recolecta || "Sin especificar"}
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Fecha de Recolecta</Label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                {embarqueDetalle.fecha_recolecta
                                  ? new Date(embarqueDetalle.fecha_recolecta).toLocaleDateString("es-MX", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "Sin especificar"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Hora de Recolecta</Label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                {embarqueDetalle.hora_recolecta || "Sin especificar"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-gray-900">Información de Entrega</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Dirección de Entrega</Label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded mt-1">
                              {embarqueDetalle.direccion_entrega || "Sin especificar"}
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Fecha de Entrega</Label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                {embarqueDetalle.fecha_entrega
                                  ? new Date(embarqueDetalle.fecha_entrega).toLocaleDateString("es-MX", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "Sin especificar"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Hora de Entrega</Label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                {embarqueDetalle.hora_entrega || "Sin especificar"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="vehiculos" className="space-y-4 mt-6">
                    {embarqueDetalle.operador ||
                    embarqueDetalle.camion ||
                    embarqueDetalle.remolque ||
                    embarqueDetalle.remolque_numero_economico ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Asignación de Recursos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {embarqueDetalle.operador && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Operador</Label>
                              <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded mt-1">
                                {embarqueDetalle.operador.nombre} {embarqueDetalle.operador.apellidos}
                              </p>
                              {embarqueDetalle.operador.telefono && (
                                <p className="text-xs text-gray-500 mt-1">Tel: {embarqueDetalle.operador.telefono}</p>
                              )}
                            </div>
                          )}
                          {embarqueDetalle.camion && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Camión</Label>
                              <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded mt-1">
                                {embarqueDetalle.camion.marca} {embarqueDetalle.camion.modelo}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Económico: {embarqueDetalle.camion.numero_economico} | Placas:{" "}
                                {embarqueDetalle.camion.placas}
                              </p>
                            </div>
                          )}
                          {embarqueDetalle.remolque_numero_economico && !embarqueDetalle.remolque ? (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Remolque (Manual)</Label>
                              <p className="text-sm text-gray-900 bg-yellow-50 p-2 rounded mt-1 border border-yellow-200">
                                {embarqueDetalle.remolque_numero_economico}
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Placas: {embarqueDetalle.remolque_placa} | Captura temporal
                              </p>
                            </div>
                          ) : (
                            embarqueDetalle.remolque && (
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Remolque</Label>
                                <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded mt-1">
                                  {embarqueDetalle.remolque.marca} {embarqueDetalle.remolque.modelo}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Económico: {embarqueDetalle.remolque.numero_economico} | Placas:{" "}
                                  {embarqueDetalle.remolque.placas}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No hay vehículos asignados</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Los vehículos se asignarán en la fase de asignación
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="facturacion" className="space-y-4 mt-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Información de Facturación</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Empresa Facturadora</Label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                              {embarqueDetalle.cliente?.empresa_facturadora === "fernando_carbajo"
                                ? "Fernando Carbajo Transportes"
                                : embarqueDetalle.cliente?.empresa_facturadora === "monarca"
                                  ? "Transportes Monarca"
                                  : "Por definir"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Método de Pago</Label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                              {embarqueDetalle.cliente?.metodo_pago === "efectivo"
                                ? "Efectivo"
                                : embarqueDetalle.cliente?.metodo_pago === "transferencia"
                                  ? "Transferencia Bancaria"
                                  : embarqueDetalle.cliente?.metodo_pago === "cheque"
                                    ? "Cheque"
                                    : embarqueDetalle.cliente?.metodo_pago === "credito"
                                      ? "Crédito"
                                      : "No especificado"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Divisa Preferida</Label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                              {embarqueDetalle.cliente?.divisa_preferida === "USD"
                                ? "Dólares Americanos (USD)"
                                : embarqueDetalle.cliente?.divisa_preferida === "MXN"
                                  ? "Pesos Mexicanos (MXN)"
                                  : "No especificada"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Días de Crédito</Label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                              {embarqueDetalle.cliente?.dias_credito
                                ? `${embarqueDetalle.cliente.dias_credito} días`
                                : "No aplica"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {embarqueDetalle.cliente?.rfc && (
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="font-medium text-gray-900">Datos Fiscales</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">RFC</Label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1 font-mono">
                                {embarqueDetalle.cliente.rfc}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Razón Social</Label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                {embarqueDetalle.cliente.razon_social || embarqueDetalle.cliente.nombre}
                              </p>
                            </div>
                          </div>
                          {embarqueDetalle.cliente.direccion_fiscal && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Dirección Fiscal</Label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded mt-1">
                                {embarqueDetalle.cliente.direccion_fiscal}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {embarqueDetalle.info_representante && (
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="font-medium text-gray-900">Contacto del Cliente</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Nombre del Contacto</Label>
                              <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded mt-1">
                                {embarqueDetalle.info_representante.nombre}
                                {embarqueDetalle.info_representante.es_principal && (
                                  <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Principal</Badge>
                                )}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Puesto</Label>
                              <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded mt-1">
                                {embarqueDetalle.info_representante.puesto || "No especificado"}
                              </p>
                            </div>
                            {embarqueDetalle.info_representante.telefono && (
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Teléfono</Label>
                                <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded mt-1">
                                  {embarqueDetalle.info_representante.telefono}
                                </p>
                              </div>
                            )}
                            {embarqueDetalle.info_representante.email && (
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Email</Label>
                                <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded mt-1">
                                  {embarqueDetalle.info_representante.email}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setShowDetailModal(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
