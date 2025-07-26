"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  CreditCard,
  Heart,
  Eye,
  Download,
  HelpCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { supabase, type Operador } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { uploadFile, eliminarFotoEmbarque } from "@/lib/blob"

export default function OperadoresPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingOperador, setEditingOperador] = useState<Operador | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [documentosOperador, setDocumentosOperador] = useState<any[]>([])
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false)
  const [subiendoDocumento, setSubiendoDocumento] = useState(false)
  const [documentosPorOperadorMap, setDocumentosPorOperadorMap] = useState<Record<string, string[]>>({})

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    telefono: "",
    email: "",
    licencia: "",
    numero_apto_medico: "",
    fecha_vencimiento_licencia: "",
    fecha_vencimiento_apto_medico: "",
    numero_visa: "",
    fecha_vencimiento_visa: "",
    numero_fast: "",
    fecha_vencimiento_fast: "",
    tipo_sangre: "",
    direccion: "",
    fecha_nacimiento: "",
    curp: "",
    rfc: "",
    nss: "",
    contactos_emergencia: [
      { nombre: "", telefono: "", email: "" },
      { nombre: "", telefono: "", email: "" },
      { nombre: "", telefono: "", email: "" },
      { nombre: "", telefono: "", email: "" },
    ],
    documentos: [
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
      { tipo: "", numero: "", archivo: null },
    ],
    observaciones: "",
    estado: "activo",
  })

  const [operadores, setOperadores] = useState<Operador[]>([])

  // Cargar operadores desde Supabase
  const obtenerOperadores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("operadores").select("*").order("nombre", { ascending: true })

      if (error) {
        console.error("Error obteniendo operadores:", error)
        alert("Error al cargar operadores")
        return
      }

      if (data && data.length > 0) {
        const operadorIds = data.map((op) => op.id)
        const { data: documentosData, error: documentosError } = await supabase
          .from("documentos_operadores")
          .select("operador_id, tipo_documento")
          .in("operador_id", operadorIds)

        if (documentosError) {
          console.warn("No se pudieron cargar los estados de los documentos:", documentosError.message)
        } else {
          const docMap = documentosData.reduce(
            (acc, doc) => {
              if (!acc[doc.operador_id]) {
                acc[doc.operador_id] = []
              }
              acc[doc.operador_id].push(doc.tipo_documento)
              return acc
            },
            {} as Record<string, string[]>,
          )
          setDocumentosPorOperadorMap(docMap)
        }
      }

      setOperadores(data || [])
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar operadores")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    obtenerOperadores()
  }, [])

  const limpiarFormulario = () => {
    setFormData({
      nombre: "",
      apellidos: "",
      telefono: "",
      email: "",
      licencia: "",
      numero_apto_medico: "",
      fecha_vencimiento_licencia: "",
      fecha_vencimiento_apto_medico: "",
      numero_visa: "",
      fecha_vencimiento_visa: "",
      numero_fast: "",
      fecha_vencimiento_fast: "",
      tipo_sangre: "",
      direccion: "",
      fecha_nacimiento: "",
      curp: "",
      rfc: "",
      nss: "",
      contactos_emergencia: [
        { nombre: "", telefono: "", email: "" },
        { nombre: "", telefono: "", email: "" },
      ],
      documentos: [
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
      ],
      observaciones: "",
      estado: "activo",
    })
    setEditingOperador(null)
  }

  const guardarOperador = async () => {
    if (!formData.nombre || !formData.apellidos) {
      alert("Por favor completa los campos obligatorios (nombre y apellidos)")
      return
    }

    // Validaciones de longitud de campos
    if (formData.curp && formData.curp.length !== 18) {
      alert("El CURP debe tener exactamente 18 caracteres")
      return
    }

    if (formData.rfc && (formData.rfc.length < 10 || formData.rfc.length > 13)) {
      alert("El RFC debe tener entre 10 y 13 caracteres")
      return
    }

    if (formData.nss && formData.nss.length !== 11) {
      alert("El NSS debe tener exactamente 11 dígitos")
      return
    }

    // Validar que NSS solo contenga números
    if (formData.nss && !/^\d{11}$/.test(formData.nss)) {
      alert("El NSS debe contener solo números (11 dígitos)")
      return
    }

    try {
      setSaving(true)

      const operadorData = {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        telefono: formData.telefono?.trim() || null,
        email: formData.email?.trim() || null,
        licencia: formData.licencia?.trim() || null,
        fecha_vencimiento_licencia: formData.fecha_vencimiento_licencia || null,
        fecha_vencimiento_apto_medico: formData.fecha_vencimiento_apto_medico || null,
        numero_visa: formData.numero_visa?.trim() || null,
        fecha_vencimiento_visa: formData.fecha_vencimiento_visa || null,
        numero_fast: formData.numero_fast?.trim() || null,
        fecha_vencimiento_fast: formData.fecha_vencimiento_fast || null,
        tipo_sangre: formData.tipo_sangre || null,
        direccion: formData.direccion?.trim() || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        curp: formData.curp?.trim().toUpperCase() || null,
        rfc: formData.rfc?.trim().toUpperCase() || null,
        nss: formData.nss?.trim() || null,
        telefono_emergencia: formData.telefono_emergencia?.trim() || null,
        contactos_emergencia:
          JSON.stringify(formData.contactos_emergencia.filter((c) => c.nombre.trim() !== "")) || null,
        observaciones: formData.observaciones?.trim() || null,
        estado: formData.estado || "activo", // Siempre activo por defecto
        updated_at: new Date().toISOString(),
      }

      let operadorCreado
      if (editingOperador) {
        // Actualizar operador existente
        const { error } = await supabase
          .from("operadores")
          .update(operadorData)
          .eq("id", editingOperador.id)
          .select()
          .single()

        if (error) {
          console.error("Error actualizando operador:", error)
          if (error.message.includes("value too long")) {
            alert("Uno de los campos excede la longitud máxima permitida. Verifica CURP (18), RFC (10-13), NSS (11)")
          } else {
            alert(`Error al actualizar operador: ${error.message}`)
          }
          return
        }
        operadorCreado = { ...operadorData, id: editingOperador.id }
      } else {
        // Crear nuevo operador
        const { data, error } = await supabase.from("operadores").insert(operadorData).select().single()

        if (error) {
          console.error("Error creando operador:", error)
          if (error.message.includes("value too long")) {
            alert("Uno de los campos excede la longitud máxima permitida. Verifica CURP (18), RFC (10-13), NSS (11)")
          } else {
            alert(`Error al crear operador: ${error.message}`)
          }
          return
        }
        operadorCreado = data
      }

      // Subir documentos si hay archivos seleccionados
      if (!editingOperador) {
        // Solo para nuevos operadores
        for (let i = 0; i < formData.documentos.length; i++) {
          const doc = formData.documentos[i]
          if (doc.archivo && doc.tipo) {
            try {
              await subirDocumento(operadorCreado.id || "temp", doc.archivo, doc.tipo, doc.numero)
            } catch (error) {
              console.error(`Error subiendo documento ${i + 1}:`, error)
            }
          }
        }
      }

      alert(editingOperador ? "Operador actualizado exitosamente" : "Operador creado exitosamente")
      limpiarFormulario()
      setShowForm(false)
      await obtenerOperadores() // Recargar la lista
    } catch (error) {
      console.error("Error guardando operador:", error)
      alert("Error inesperado al guardar operador")
    } finally {
      setSaving(false)
    }
  }

  const editarOperador = (operador: Operador) => {
    const contactosEmergencia = [
      { nombre: "", telefono: "", email: "" },
      { nombre: "", telefono: "", email: "" },
      { nombre: "", telefono: "", email: "" },
      { nombre: "", telefono: "", email: "" },
    ]

    // Parsear contactos de emergencia si existen
    if (operador.contactos_emergencia) {
      try {
        const contactosParsed = JSON.parse(operador.contactos_emergencia)
        if (Array.isArray(contactosParsed)) {
          contactosParsed.forEach((contacto, index) => {
            if (index < 4) {
              contactosEmergencia[index] = {
                nombre: contacto.nombre || "",
                telefono: contacto.telefono || "",
                email: contacto.email || "",
              }
            }
          })
        }
      } catch (e) {
        console.log("Error parsing contactos_emergencia:", e)
      }
    }

    setFormData({
      nombre: operador.nombre,
      apellidos: operador.apellidos,
      telefono: operador.telefono || "",
      email: operador.email || "",
      licencia: operador.licencia || "",
      numero_apto_medico: operador.numero_apto_medico || "",
      fecha_vencimiento_licencia: operador.fecha_vencimiento_licencia || "",
      fecha_vencimiento_apto_medico: operador.fecha_vencimiento_apto_medico || "",
      numero_visa: operador.numero_visa || "",
      fecha_vencimiento_visa: operador.fecha_vencimiento_visa || "",
      numero_fast: operador.numero_fast || "",
      fecha_vencimiento_fast: operador.fecha_vencimiento_fast || "",
      tipo_sangre: operador.tipo_sangre || "",
      direccion: operador.direccion || "",
      fecha_nacimiento: operador.fecha_nacimiento || "",
      curp: operador.curp || "",
      rfc: operador.rfc || "",
      nss: operador.nss || "",
      contactos_emergencia: contactosEmergencia,
      documentos: [
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
        { tipo: "", numero: "", archivo: null },
      ],
      observaciones: operador.observaciones || "",
      estado: operador.estado,
    })
    setEditingOperador(operador)
    setShowForm(true)
  }

  const eliminarOperador = async (id: string) => {
    try {
      // Primero verificar si el operador tiene embarques asociados
      const { data: embarques, error: errorEmbarques } = await supabase
        .from("embarques")
        .select("id")
        .eq("operador_id", id)
        .limit(1)

      if (errorEmbarques) {
        console.error("Error verificando embarques:", errorEmbarques)
        alert("Error al verificar embarques asociados")
        return
      }

      // Si tiene embarques asociados, no permitir eliminación
      if (embarques && embarques.length > 0) {
        alert(
          "No se puede eliminar este operador porque tiene embarques asociados. " +
            "Si deseas desactivarlo, usa el botón 'Desactivar' en los detalles del operador.",
        )
        return
      }

      // Verificar si tiene recordatorios asociados
      const { data: recordatorios, error: errorRecordatorios } = await supabase
        .from("recordatorios")
        .select("id")
        .eq("operador_id", id)
        .limit(1)

      if (errorRecordatorios) {
        console.error("Error verificando recordatorios:", errorRecordatorios)
        alert("Error al verificar recordatorios asociados")
        return
      }

      // Si tiene recordatorios, eliminarlos primero
      if (recordatorios && recordatorios.length > 0) {
        const { error: errorEliminarRecordatorios } = await supabase
          .from("recordatorios")
          .delete()
          .eq("operador_id", id)

        if (errorEliminarRecordatorios) {
          console.error("Error eliminando recordatorios:", errorEliminarRecordatorios)
          alert("Error al eliminar recordatorios asociados")
          return
        }
      }

      // Eliminar documentos asociados del operador
      const { data: documentos, error: errorDocumentos } = await supabase
        .from("documentos_operadores")
        .select("id, pathname_archivo")
        .eq("operador_id", id)

      if (errorDocumentos) {
        console.error("Error obteniendo documentos:", errorDocumentos)
        // Continuar con la eliminación aunque falle obtener documentos
      }

      // Eliminar archivos de blob storage y registros de documentos
      if (documentos && documentos.length > 0) {
        for (const doc of documentos) {
          try {
            // Eliminar archivo del blob storage
            if (doc.pathname_archivo) {
              await eliminarFotoEmbarque(doc.pathname_archivo)
            }
          } catch (error) {
            console.error("Error eliminando archivo del blob storage:", error)
            // Continuar aunque falle eliminar el archivo del blob storage
            // El registro en la BD se eliminará de todas formas
          }
        }

        // Eliminar registros de documentos
        const { error: errorEliminarDocs } = await supabase.from("documentos_operadores").delete().eq("operador_id", id)

        if (errorEliminarDocs) {
          console.error("Error eliminando documentos:", errorEliminarDocs)
          alert("Error al eliminar documentos asociados")
          return
        }
      }

      // Finalmente eliminar el operador
      const { error } = await supabase.from("operadores").delete().eq("id", id)

      if (error) {
        console.error("Error eliminando operador:", error)
        alert("Error al eliminar operador: " + error.message)
        return
      }

      alert("Operador eliminado exitosamente")
      await obtenerOperadores() // Recargar la lista
    } catch (error) {
      console.error("Error:", error)
      alert("Error inesperado al eliminar operador")
    }
  }

  const operadoresFiltrados = operadores.filter(
    (operador) =>
      operador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operador.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (operador.telefono && operador.telefono.includes(searchTerm)) ||
      (operador.email && operador.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getEstadoBadge = (estado: string, operadorId: string) => {
    return estado === "activo" ? (
      <Badge
        className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-colors"
        onClick={() => cambiarEstadoOperador(operadorId, "inactivo")}
      >
        Activo
      </Badge>
    ) : (
      <Badge
        className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer transition-colors"
        onClick={() => cambiarEstadoOperador(operadorId, "activo")}
      >
        Inactivo
      </Badge>
    )
  }

  const calcularDiasVencimiento = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null

    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diferencia = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24))

    return diferencia
  }

  const getAlertaVencimiento = (dias: number | null, tipo: string) => {
    if (dias === null) return null

    if (dias < 0) {
      return (
        <div className="flex items-center space-x-1 text-red-600 text-xs">
          <XCircle className="h-3 w-3" />
          <span>
            {tipo} vencido hace {Math.abs(dias)} días
          </span>
        </div>
      )
    } else if (dias <= 30) {
      return (
        <div className="flex items-center space-x-1 text-orange-600 text-xs">
          <AlertTriangle className="h-3 w-3" />
          <span>
            {tipo} vence en {dias} días
          </span>
        </div>
      )
    }

    return null
  }

  const tieneDocumentoSubido = (operadorId: string, tipoDocumento: string) => {
    return documentosPorOperadorMap[operadorId]?.includes(tipoDocumento) ?? false
  }

  const descargarExcel = () => {
    // Create CSV content
    const headers = [
      "Nombre",
      "Apellidos",
      "Teléfono",
      "Email",
      "Licencia",
      "Vencimiento Licencia",
      "Vencimiento Apto Médico",
      "Tipo Sangre",
      "Dirección",
      "Fecha Nacimiento",
      "CURP",
      "RFC",
      "NSS",
      "Teléfono Emergencia",
      "Contactos Emergencia",
      "Estado",
      "Observaciones",
      "Fecha Registro",
    ]

    const csvContent = [
      headers.join(","),
      ...operadores.map((op) =>
        [
          `"${op.nombre}"`,
          `"${op.apellidos}"`,
          `"${op.telefono || ""}"`,
          `"${op.email || ""}"`,
          `"${op.licencia || ""}"`,
          `"${op.fecha_vencimiento_licencia || ""}"`,
          `"${op.fecha_vencimiento_apto_medico || ""}"`,
          `"${op.tipo_sangre || ""}"`,
          `"${op.direccion || ""}"`,
          `"${op.fecha_nacimiento || ""}"`,
          `"${op.curp || ""}"`,
          `"${op.rfc || ""}"`,
          `"${op.nss || ""}"`,
          `"${op.telefono_emergencia || ""}"`,
          `"${op.contactos_emergencia || ""}"`,
          `"${op.estado}"`,
          `"${op.observaciones || ""}"`,
          `"${new Date(op.fecha_registro).toLocaleDateString()}"`,
        ].join(","),
      ),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `operadores_${new Date().toISOString().split("T")[0]}.csv`)
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
            <p className="mt-2 text-gray-600">Cargando operadores...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const cambiarEstadoOperador = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from("operadores")
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Error cambiando estado:", error)
        alert("Error al cambiar estado del operador")
        return
      }

      alert(`Operador ${nuevoEstado === "activo" ? "activado" : "desactivado"} exitosamente`)
      await obtenerOperadores()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cambiar estado del operador")
    }
  }

  // Función para obtener documentos del operador desde la base de datos
  const obtenerDocumentosOperador = async (operadorId: string) => {
    try {
      const { data, error } = await supabase
        .from("documentos_operadores")
        .select("*")
        .eq("operador_id", operadorId)
        .order("fecha_subida", { ascending: false })

      if (error) {
        console.error("Error obteniendo documentos:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error:", error)
      return []
    }
  }

  // Función para subir documento
  const subirDocumento = async (operadorId: string, archivo: File, tipo: string, numero: string) => {
    try {
      // Crear nombre único para el archivo
      const timestamp = Date.now()
      const extension = archivo.name.split(".").pop()
      const nombreArchivo = `operadores/${operadorId}/${tipo}_${timestamp}.${extension}`

      // Subir archivo usando la función existente
      const { url, pathname } = await uploadFile(nombreArchivo, archivo)

      // Guardar información en la base de datos
      const { data, error } = await supabase
        .from("documentos_operadores")
        .insert({
          operador_id: operadorId,
          tipo_documento: tipo,
          numero_documento: numero,
          nombre_archivo: archivo.name,
          url_archivo: url,
          pathname_archivo: pathname,
          tamaño_bytes: archivo.size,
          tipo_mime: archivo.type,
          fecha_subida: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error guardando documento:", error)
        throw new Error("Error al guardar documento en la base de datos")
      }

      return data
    } catch (error) {
      console.error("Error subiendo documento:", error)
      throw error
    }
  }

  // Función para eliminar documento
  const eliminarDocumento = async (documentoId: string, pathname: string) => {
    try {
      // Eliminar archivo del blob storage
      await eliminarFotoEmbarque(pathname)

      // Eliminar registro de la base de datos
      const { error } = await supabase.from("documentos_operadores").delete().eq("id", documentoId)

      if (error) {
        console.error("Error eliminando documento:", error)
        throw new Error("Error al eliminar documento")
      }

      return true
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Operadores</h1>
            <p className="text-gray-600 mt-2">Administrar información de conductores y personal operativo</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={descargarExcel}>
              <FileText className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => limpiarFormulario()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Operador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingOperador ? "Editar Operador" : "Nuevo Operador"}</DialogTitle>
                  <DialogDescription>Completa la información del operador</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="personal">Personal</TabsTrigger>
                      <TabsTrigger value="documentos">Documentos</TabsTrigger>
                      <TabsTrigger value="licencia">Licencia</TabsTrigger>
                      <TabsTrigger value="contactos">Contactos</TabsTrigger>
                      <TabsTrigger value="archivos">Archivos</TabsTrigger>
                      <TabsTrigger value="observaciones">Observaciones</TabsTrigger>
                    </TabsList>
                    <TabsContent value="personal" className="space-y-4">
                      {/* Información personal */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Información Personal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="nombre">Nombre *</Label>
                              <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Nombre del operador"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="apellidos">Apellidos *</Label>
                              <Input
                                id="apellidos"
                                value={formData.apellidos}
                                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                placeholder="Apellidos del operador"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="telefono">Teléfono</Label>
                              <Input
                                id="telefono"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                placeholder="Número de teléfono"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Correo electrónico"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                              <Input
                                id="fecha_nacimiento"
                                type="date"
                                value={formData.fecha_nacimiento}
                                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="direccion">Dirección</Label>
                              <Input
                                id="direccion"
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                placeholder="Dirección completa"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tipo_sangre">Tipo de Sangre</Label>
                              <Select
                                value={formData.tipo_sangre}
                                onValueChange={(value) => setFormData({ ...formData, tipo_sangre: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo de sangre" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A+">A+</SelectItem>
                                  <SelectItem value="A-">A-</SelectItem>
                                  <SelectItem value="B+">B+</SelectItem>
                                  <SelectItem value="B-">B-</SelectItem>
                                  <SelectItem value="AB+">AB+</SelectItem>
                                  <SelectItem value="AB-">AB-</SelectItem>
                                  <SelectItem value="O+">O+</SelectItem>
                                  <SelectItem value="O-">O-</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="documentos" className="space-y-4">
                      {/* Documentos e identificaciones */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Documentos e Identificaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="curp">CURP (18 caracteres)</Label>
                              <Input
                                id="curp"
                                value={formData.curp}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase()
                                  if (value.length <= 18) {
                                    setFormData({ ...formData, curp: value })
                                  }
                                }}
                                placeholder="CURP del operador"
                                maxLength={18}
                              />
                              <p className="text-xs text-gray-500">{formData.curp.length}/18 caracteres</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="rfc">RFC (10-13 caracteres)</Label>
                              <Input
                                id="rfc"
                                value={formData.rfc}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase()
                                  if (value.length <= 13) {
                                    setFormData({ ...formData, rfc: value })
                                  }
                                }}
                                placeholder="RFC del operador"
                                maxLength={13}
                              />
                              <p className="text-xs text-gray-500">{formData.rfc.length}/13 caracteres</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="nss">NSS (11 dígitos)</Label>
                              <Input
                                id="nss"
                                value={formData.nss}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "") // Solo números
                                  if (value.length <= 11) {
                                    setFormData({ ...formData, nss: value })
                                  }
                                }}
                                placeholder="Número de Seguro Social"
                                maxLength={11}
                              />
                              <p className="text-xs text-gray-500">{formData.nss.length}/11 dígitos</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="licencia" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Licencia y Certificaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h3 className="font-medium text-base border-b pb-2">Licencia de Conducir</h3>
                              <div className="space-y-2">
                                <Label htmlFor="licencia">Número de Licencia</Label>
                                <Input
                                  id="licencia"
                                  value={formData.licencia}
                                  onChange={(e) => setFormData({ ...formData, licencia: e.target.value })}
                                  placeholder="Número de licencia de conducir"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="fecha_vencimiento_licencia">Fecha de Vencimiento Licencia</Label>
                                <Input
                                  id="fecha_vencimiento_licencia"
                                  type="date"
                                  value={formData.fecha_vencimiento_licencia}
                                  onChange={(e) =>
                                    setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h3 className="font-medium text-base border-b pb-2">Certificado Médico</h3>
                              <div className="space-y-2">
                                <Label htmlFor="numero_apto_medico">Número de Apto Médico</Label>
                                <Input
                                  id="numero_apto_medico"
                                  value={formData.numero_apto_medico}
                                  onChange={(e) => setFormData({ ...formData, numero_apto_medico: e.target.value })}
                                  placeholder="Número de certificado médico"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="fecha_vencimiento_apto_medico">Fecha de Vencimiento Apto Médico</Label>
                                <Input
                                  id="fecha_vencimiento_apto_medico"
                                  type="date"
                                  value={formData.fecha_vencimiento_apto_medico}
                                  onChange={(e) =>
                                    setFormData({ ...formData, fecha_vencimiento_apto_medico: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {/* Nueva sección para Visa y FAST */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-4">
                              <h3 className="font-medium text-base border-b pb-2">Documentos de Visa</h3>
                              <div className="space-y-2">
                                <Label htmlFor="numero_visa">Número de Visa</Label>
                                <Input
                                  id="numero_visa"
                                  value={formData.numero_visa}
                                  onChange={(e) => setFormData({ ...formData, numero_visa: e.target.value })}
                                  placeholder="Número de visa"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="fecha_vencimiento_visa">Fecha de Vencimiento Visa</Label>
                                <Input
                                  id="fecha_vencimiento_visa"
                                  type="date"
                                  value={formData.fecha_vencimiento_visa}
                                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento_visa: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h3 className="font-medium text-base border-b pb-2">Documentos FAST</h3>
                              <div className="space-y-2">
                                <Label htmlFor="numero_fast">Número de FAST</Label>
                                <Input
                                  id="numero_fast"
                                  value={formData.numero_fast}
                                  onChange={(e) => setFormData({ ...formData, numero_fast: e.target.value })}
                                  placeholder="Número de FAST"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="fecha_vencimiento_fast">Fecha de Vencimiento FAST</Label>
                                <Input
                                  id="fecha_vencimiento_fast"
                                  type="date"
                                  value={formData.fecha_vencimiento_fast}
                                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento_fast: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="contactos" className="space-y-4">
                      {/* Mover aquí el contenido de "Contactos de Emergencia" */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Contactos de Emergencia</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {formData.contactos_emergencia.map((contacto, index) => (
                            <div key={index} className="border p-4 rounded-lg space-y-4">
                              <h4 className="font-medium text-sm">Contacto {index + 1}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`contacto_nombre_${index}`}>Nombre Completo</Label>
                                  <Input
                                    id={`contacto_nombre_${index}`}
                                    value={contacto.nombre}
                                    onChange={(e) => {
                                      const nuevosContactos = [...formData.contactos_emergencia]
                                      nuevosContactos[index].nombre = e.target.value
                                      setFormData({ ...formData, contactos_emergencia: nuevosContactos })
                                    }}
                                    placeholder="Nombre completo del contacto"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`contacto_telefono_${index}`}>Teléfono</Label>
                                  <Input
                                    id={`contacto_telefono_${index}`}
                                    value={contacto.telefono}
                                    onChange={(e) => {
                                      const nuevosContactos = [...formData.contactos_emergencia]
                                      nuevosContactos[index].telefono = e.target.value
                                      setFormData({ ...formData, contactos_emergencia: nuevosContactos })
                                    }}
                                    placeholder="Número de teléfono"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`contacto_email_${index}`}>Correo Electrónico</Label>
                                  <Input
                                    id={`contacto_email_${index}`}
                                    type="email"
                                    value={contacto.email}
                                    onChange={(e) => {
                                      const nuevosContactos = [...formData.contactos_emergencia]
                                      nuevosContactos[index].email = e.target.value
                                      setFormData({ ...formData, contactos_emergencia: nuevosContactos })
                                    }}
                                    placeholder="correo@ejemplo.com"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="archivos" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Carga de Documentos (Hasta 10)</CardTitle>
                          <CardDescription>Sube los documentos e identificaciones del operador</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {formData.documentos.map((documento, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded space-y-3">
                                <h4 className="font-medium text-xs">Doc {index + 1}</h4>
                                <div className="space-y-2">
                                  <Select
                                    value={documento.tipo}
                                    onValueChange={(value) => {
                                      const nuevosDocumentos = [...formData.documentos]
                                      nuevosDocumentos[index].tipo = value
                                      setFormData({ ...formData, documentos: nuevosDocumentos })
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="licencia">Licencia</SelectItem>
                                      <SelectItem value="curp">CURP</SelectItem>
                                      <SelectItem value="rfc">RFC</SelectItem>
                                      <SelectItem value="nss">NSS</SelectItem>
                                      <SelectItem value="ine">INE</SelectItem>
                                      <SelectItem value="apto_medico">Apto Médico</SelectItem>
                                      <SelectItem value="visa">Visa</SelectItem>
                                      <SelectItem value="fast">FAST</SelectItem>
                                      <SelectItem value="comprobante_domicilio">Comp. Domicilio</SelectItem>
                                      <SelectItem value="otro">Otro</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Input
                                    value={documento.numero}
                                    onChange={(e) => {
                                      const nuevosDocumentos = [...formData.documentos]
                                      nuevosDocumentos[index].numero = e.target.value
                                      setFormData({ ...formData, documentos: nuevosDocumentos })
                                    }}
                                    placeholder="Número/Folio"
                                    className="h-8 text-xs"
                                  />

                                  <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        if (file.size > 5 * 1024 * 1024) {
                                          alert("Archivo muy grande. Máx 5MB.")
                                          e.target.value = ""
                                          return
                                        }

                                        const nuevosDocumentos = [...formData.documentos]
                                        nuevosDocumentos[index].archivo = file
                                        setFormData({ ...formData, documentos: nuevosDocumentos })

                                        if (editingOperador && documento.tipo) {
                                          try {
                                            setSubiendoDocumento(true)
                                            await subirDocumento(
                                              editingOperador.id,
                                              file,
                                              documento.tipo,
                                              documento.numero,
                                            )
                                            alert("Documento subido")
                                            nuevosDocumentos[index] = { tipo: "", numero: "", archivo: null }
                                            setFormData({ ...formData, documentos: nuevosDocumentos })
                                            e.target.value = ""
                                          } catch (error) {
                                            alert("Error al subir")
                                          } finally {
                                            setSubiendoDocumento(false)
                                          }
                                        }
                                      }
                                    }}
                                    disabled={subiendoDocumento}
                                    className="h-8 text-xs"
                                  />

                                  {documento.archivo && (
                                    <div className="p-2 bg-white rounded text-xs">
                                      <div className="flex items-center justify-between">
                                        <span className="truncate">{documento.archivo.name}</span>
                                        <span className="text-gray-500">
                                          {(documento.archivo.size / 1024).toFixed(1)}KB
                                        </span>
                                      </div>
                                      {editingOperador && documento.tipo && (
                                        <Button
                                          size="sm"
                                          className="mt-1 w-full h-6 text-xs"
                                          onClick={async () => {
                                            if (!documento.archivo) return
                                            try {
                                              setSubiendoDocumento(true)
                                              await subirDocumento(
                                                editingOperador.id,
                                                documento.archivo,
                                                documento.tipo,
                                                documento.numero,
                                              )
                                              alert("Subido")
                                              const nuevosDocumentos = [...formData.documentos]
                                              nuevosDocumentos[index] = { tipo: "", numero: "", archivo: null }
                                              setFormData({ ...formData, documentos: nuevosDocumentos })
                                            } catch (error) {
                                              alert("Error")
                                            } finally {
                                              setSubiendoDocumento(false)
                                            }
                                          }}
                                          disabled={subiendoDocumento}
                                        >
                                          {subiendoDocumento ? "Subiendo..." : "Subir"}
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Documentos existentes */}
                          {editingOperador && (
                            <div className="mt-4">
                              <h4 className="font-medium text-sm mb-2">Documentos Existentes</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  setCargandoDocumentos(true)
                                  try {
                                    const docs = await obtenerDocumentosOperador(editingOperador.id)
                                    setDocumentosOperador(docs)
                                  } catch (error) {
                                    setDocumentosOperador([])
                                  } finally {
                                    setCargandoDocumentos(false)
                                  }
                                }}
                                disabled={cargandoDocumentos}
                                className="h-8 text-xs"
                              >
                                {cargandoDocumentos ? "Cargando..." : "Cargar Existentes"}
                              </Button>

                              {documentosOperador.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                                  {documentosOperador.map((doc) => (
                                    <div key={doc.id} className="p-2 bg-white rounded text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className="text-xs px-1 py-0">
                                          {doc.tipo_documento.replace("_", " ")}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-4 w-4 p-0"
                                          onClick={async () => {
                                            if (confirm("¿Eliminar?")) {
                                              try {
                                                await eliminarDocumento(doc.id, doc.pathname_archivo)
                                                const docs = await obtenerDocumentosOperador(editingOperador.id)
                                                setDocumentosOperador(docs)
                                                alert("Eliminado")
                                              } catch (error) {
                                                alert("Error")
                                              }
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                      </div>

                                      <div className="aspect-video bg-gray-100 rounded mb-1">
                                        {doc.tipo_mime?.startsWith("image/") ? (
                                          <img
                                            src={doc.url_archivo || "/placeholder.svg"}
                                            alt={doc.tipo_documento}
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() => window.open(doc.url_archivo, "_blank")}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center h-full">
                                            <FileText className="h-6 w-6 text-gray-400" />
                                          </div>
                                        )}
                                      </div>

                                      <p className="truncate font-medium">{doc.nombre_archivo}</p>
                                      <p className="text-gray-500">{(doc.tamaño_bytes / 1024).toFixed(1)} KB</p>

                                      <div className="flex gap-1 mt-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex-1 h-6 text-xs bg-transparent"
                                          onClick={() => window.open(doc.url_archivo, "_blank")}
                                        >
                                          Ver
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex-1 h-6 text-xs bg-transparent"
                                          onClick={() => {
                                            const link = document.createElement("a")
                                            link.href = doc.url_archivo
                                            link.download = doc.nombre_archivo
                                            link.click()
                                          }}
                                        >
                                          Descargar
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="observaciones" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Observaciones</CardTitle>
                          <CardDescription>Notas y comentarios adicionales sobre el operador</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="observaciones">Observaciones</Label>
                            <Textarea
                              id="observaciones"
                              value={formData.observaciones}
                              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                              placeholder="Observaciones adicionales sobre el operador, notas importantes, comentarios especiales, etc."
                              rows={6}
                              className="min-h-[150px]"
                            />
                            <p className="text-xs text-gray-500">
                              Utiliza este espacio para agregar cualquier información relevante sobre el operador que no
                              esté cubierta en las otras secciones.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button onClick={guardarOperador} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : editingOperador ? (
                        "Actualizar Operador"
                      ) : (
                        "Guardar Operador"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Operadores</p>
                  <p className="text-2xl font-bold">{operadores.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {operadores.filter((op) => op.estado === "activo").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Licencias por Vencer</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {
                      operadores.filter((op) => {
                        const dias = calcularDiasVencimiento(op.fecha_vencimiento_licencia)
                        return dias !== null && dias <= 30 && dias >= 0
                      }).length
                    }
                  </p>
                  <p className="text-xs text-gray-500">Próximos 30 días</p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aptos Médicos por Vencer</p>
                  <p className="text-2xl font-bold text-red-600">
                    {
                      operadores.filter((op) => {
                        const dias = calcularDiasVencimiento(op.fecha_vencimiento_apto_medico)
                        return dias !== null && dias <= 30 && dias >= 0
                      }).length
                    }
                  </p>
                  <p className="text-xs text-gray-500">Próximos 30 días</p>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
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
                placeholder="Buscar por nombre, apellidos, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de operadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operadoresFiltrados.map((operador) => (
            <Card key={operador.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {operador.nombre} {operador.apellidos}
                    </CardTitle>
                    <div className="flex items-center mt-1">{getEstadoBadge(operador.estado, operador.id)}</div>
                  </div>
                  <div className="flex space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setCargandoDocumentos(true)
                            try {
                              const docs = await obtenerDocumentosOperador(operador.id)
                              setDocumentosOperador(docs)
                            } catch (error) {
                              console.error("Error cargando documentos:", error)
                              setDocumentosOperador([])
                            } finally {
                              setCargandoDocumentos(false)
                            }
                          }}
                        >
                          Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <div className="flex justify-between items-center">
                            <div>
                              <DialogTitle>Detalles del Operador</DialogTitle>
                              <DialogDescription>
                                Información completa de {operador.nombre} {operador.apellidos}
                              </DialogDescription>
                            </div>
                            <Button
                              className="mr-4"
                              onClick={() => {
                                // Función para descargar información completa del operador
                                const descargarOperadorCompleto = (operador: Operador) => {
                                  const headers = ["Campo", "Valor"]

                                  const data = [
                                    ["Nombre Completo", `${operador.nombre} ${operador.apellidos}`],
                                    ["Estado", operador.estado],
                                    ["Teléfono", operador.telefono || ""],
                                    ["Email", operador.email || ""],
                                    [
                                      "Fecha de Nacimiento",
                                      operador.fecha_nacimiento
                                        ? new Date(operador.fecha_nacimiento).toLocaleDateString()
                                        : "",
                                    ],
                                    ["Dirección", operador.direccion || ""],
                                    ["Tipo de Sangre", operador.tipo_sangre || ""],
                                    ["CURP", operador.curp || ""],
                                    ["RFC", operador.rfc || ""],
                                    ["NSS", operador.nss || ""],
                                    [
                                      "Fecha Vencimiento Licencia",
                                      operador.fecha_vencimiento_licencia
                                        ? new Date(operador.fecha_vencimiento_licencia).toLocaleDateString()
                                        : "",
                                    ],
                                    ["Número de Licencia", operador.licencia || ""],
                                    [
                                      "Fecha Vencimiento Apto Médico",
                                      operador.fecha_vencimiento_apto_medico
                                        ? new Date(operador.fecha_vencimiento_apto_medico).toLocaleDateString()
                                        : "",
                                    ],
                                    ["Número Apto Médico", operador.numero_apto_medico || ""],
                                    ["Teléfono Emergencia", operador.telefono_emergencia || ""],
                                    ["Observaciones", operador.observaciones || ""],
                                    [
                                      "Fecha Registro",
                                      new Date(operador.fecha_registro).toLocaleDateString() +
                                        " " +
                                        new Date(operador.fecha_registro).toLocaleTimeString(),
                                    ],
                                    [
                                      "Última Actualización",
                                      operador.updated_at
                                        ? new Date(operador.updated_at).toLocaleDateString() +
                                          " " +
                                          new Date(operador.updated_at).toLocaleTimeString()
                                        : "No actualizado",
                                    ],
                                  ]

                                  // Agregar contactos de emergencia si existen
                                  if (operador.contactos_emergencia) {
                                    try {
                                      const contactos = JSON.parse(operador.contactos_emergencia)
                                      contactos.forEach((contacto: any, index: number) => {
                                        if (contacto.nombre) {
                                          data.push([`Contacto ${index + 1} - Nombre`, contacto.nombre])
                                          data.push([`Contacto ${index + 1} - Teléfono`, contacto.telefono || ""])
                                          data.push([`Contacto ${index + 1} - Email`, contacto.email || ""])
                                        }
                                      })
                                    } catch (e) {
                                      console.log("Error parsing contactos")
                                    }
                                  }

                                  // Agregar información de documentos cargados
                                  if (documentosOperador.length > 0) {
                                    data.push(["", ""])
                                    data.push(["=== DOCUMENTOS CARGADOS ===", ""])
                                    documentosOperador.forEach((doc, index) => {
                                      data.push([`Documento ${index + 1} - Tipo`, doc.tipo_documento.replace("_", " ")])
                                      data.push([`Documento ${index + 1} - Número`, doc.numero_documento || ""])
                                      data.push([`Documento ${index + 1} - Archivo`, doc.nombre_archivo])
                                      data.push([
                                        `Documento ${index + 1} - Tamaño`,
                                        `${(doc.tamaño_bytes / 1024).toFixed(1)} KB`,
                                      ])
                                      data.push([
                                        `Documento ${index + 1} - Fecha Subida`,
                                        new Date(doc.fecha_subida).toLocaleDateString(),
                                      ])
                                    })
                                  }

                                  const csvContent = [
                                    headers.join(","),
                                    ...data.map((row) => `"${row[0]}","${row[1]}"`),
                                  ].join("\n")

                                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
                                  const link = document.createElement("a")
                                  const url = URL.createObjectURL(blob)
                                  link.setAttribute("href", url)
                                  link.setAttribute(
                                    "download",
                                    `operador_completo_${operador.nombre}_${operador.apellidos}_${new Date().toISOString().split("T")[0]}.csv`,
                                  )
                                  link.style.visibility = "hidden"
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }

                                descargarOperadorCompleto(operador)
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Descargar Información
                            </Button>
                          </div>
                        </DialogHeader>

                        <div className="space-y-6">
                          <Tabs defaultValue="personal" className="w-full">
                            <TabsList className="grid w-full grid-cols-5">
                              <TabsTrigger value="personal">Personal</TabsTrigger>
                              <TabsTrigger value="documentos">Documentos</TabsTrigger>
                              <TabsTrigger value="licencia">Licencia</TabsTrigger>
                              <TabsTrigger value="contactos">Contactos</TabsTrigger>
                              <TabsTrigger value="archivos">Archivos</TabsTrigger>
                            </TabsList>

                            <TabsContent value="personal" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Información Personal</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Nombre Completo</Label>
                                      <div className="p-2 bg-gray-50 rounded border">
                                        {operador.nombre} {operador.apellidos}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Estado</Label>
                                      <div className="p-2 bg-gray-50 rounded border">
                                        {getEstadoBadge(operador.estado, operador.id)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label>Teléfono</Label>
                                      <div className="p-2 bg-gray-50 rounded border">
                                        {operador.telefono || "No especificado"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Email</Label>
                                      <div className="p-2 bg-gray-50 rounded border">
                                        {operador.email || "No especificado"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Fecha de Nacimiento</Label>
                                      <div className="p-2 bg-gray-50 rounded border">
                                        {operador.fecha_nacimiento
                                          ? new Date(operador.fecha_nacimiento).toLocaleDateString()
                                          : "No especificada"}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Dirección</Label>
                                      <div className="p-2 bg-gray-50 rounded border">
                                        {operador.direccion || "No especificada"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Tipo de Sangre</Label>
                                      <div className="p-2 bg-gray-50 rounded border">
                                        {operador.tipo_sangre || "No especificado"}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="documentos" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Documentos e Identificaciones</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label>CURP</Label>
                                      <div className="p-2 bg-gray-50 rounded border font-mono text-sm">
                                        {operador.curp || "No especificado"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>RFC</Label>
                                      <div className="p-2 bg-gray-50 rounded border font-mono text-sm">
                                        {operador.rfc || "No especificado"}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>NSS</Label>
                                      <div className="p-2 bg-gray-50 rounded border font-mono text-sm">
                                        {operador.nss || "No especificado"}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="licencia" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Licencia y Certificaciones</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <h3 className="font-medium text-base border-b pb-2">Licencia de Conducir</h3>
                                      <div className="space-y-2">
                                        <Label>Número de Licencia</Label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                          {operador.licencia || "No especificada"}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Fecha de Vencimiento Licencia</Label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                          {operador.fecha_vencimiento_licencia
                                            ? new Date(operador.fecha_vencimiento_licencia).toLocaleDateString()
                                            : "No especificada"}
                                        </div>
                                        {getAlertaVencimiento(
                                          calcularDiasVencimiento(operador.fecha_vencimiento_licencia),
                                          "Licencia",
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <h3 className="font-medium text-base border-b pb-2">Certificado Médico</h3>
                                      <div className="space-y-2">
                                        <Label>Número de Apto Médico</Label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                          {operador.numero_apto_medico || "No especificado"}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Fecha de Vencimiento Apto Médico</Label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                          {operador.fecha_vencimiento_apto_medico
                                            ? new Date(operador.fecha_vencimiento_apto_medico).toLocaleDateString()
                                            : "No especificada"}
                                        </div>
                                        {getAlertaVencimiento(
                                          calcularDiasVencimiento(operador.fecha_vencimiento_apto_medico),
                                          "Apto médico",
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {/* New Visa and FAST Section */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <h3 className="font-medium text-base border-b pb-2">Visa Information</h3>
                                      <div className="space-y-2">
                                        <Label>Visa Number</Label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                          {operador.numero_visa || "Not specified"}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Visa Expiration Date</Label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                          {operador.fecha_vencimiento_visa
                                            ? new Date(operador.fecha_vencimiento_visa).toLocaleDateString()
                                            : "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <h3 className="font-medium text-base border-b pb-2">FAST Information</h3>
                                      <div className="space-y-2">
                                        <Label>FAST Number</Label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                          {operador.numero_fast || "Not specified"}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>FAST Expiration Date</Label>
                                        <div className="p-2 bg-gray-50 rounded border">
                                          {operador.fecha_vencimiento_fast
                                            ? new Date(operador.fecha_vencimiento_fast).toLocaleDateString()
                                            : "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="contactos" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Contactos de Emergencia</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Teléfono de Emergencia Principal</Label>
                                    <div className="p-2 bg-gray-50 rounded border">
                                      {operador.telefono_emergencia || "No especificado"}
                                    </div>
                                  </div>

                                  {operador.contactos_emergencia &&
                                    (() => {
                                      try {
                                        const contactos = JSON.parse(operador.contactos_emergencia)
                                        return contactos
                                          .filter((c: any) => c.nombre)
                                          .map((contacto: any, index: number) => (
                                            <div key={index} className="border p-4 rounded-lg space-y-4">
                                              <h4 className="font-medium text-sm">Contacto {index + 1}</h4>
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                  <Label>Nombre Completo</Label>
                                                  <div className="p-2 bg-gray-50 rounded border">{contacto.nombre}</div>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label>Teléfono</Label>
                                                  <div className="p-2 bg-gray-50 rounded border">
                                                    {contacto.telefono || "No especificado"}
                                                  </div>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label>Email</Label>
                                                  <div className="p-2 bg-gray-50 rounded border">
                                                    {contacto.email || "No especificado"}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                      } catch (e) {
                                        return (
                                          <p className="text-gray-500">No hay contactos de emergencia registrados</p>
                                        )
                                      }
                                    })()}
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="archivos" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Documentos Cargados</CardTitle>
                                  <CardDescription>Archivos e imágenes de documentos del operador</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {cargandoDocumentos ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                      <span className="ml-2">Cargando documentos...</span>
                                    </div>
                                  ) : documentosOperador.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {documentosOperador.map((doc, index) => (
                                        <div
                                          key={doc.id}
                                          className="border rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow"
                                        >
                                          <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="capitalize">
                                              {doc.tipo_documento.replace("_", " ")}
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={async () => {
                                                if (confirm("¿Estás seguro de que quieres eliminar este documento?")) {
                                                  try {
                                                    await eliminarDocumento(doc.id, doc.pathname_archivo)
                                                    // Recargar documentos
                                                    const docs = await obtenerDocumentosOperador(operador.id)
                                                    setDocumentosOperador(docs)
                                                    alert("Documento eliminado exitosamente")
                                                  } catch (error) {
                                                    alert("Error al eliminar documento")
                                                  }
                                                }
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </div>

                                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group">
                                            {doc.tipo_mime?.startsWith("image/") ? (
                                              <img
                                                src={doc.url_archivo || "/placeholder.svg"}
                                                alt={doc.tipo_documento}
                                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                  // Abrir modal para ver imagen completa
                                                  window.open(doc.url_archivo, "_blank")
                                                }}
                                                onError={(e) => {
                                                  // Si la imagen no carga, mostrar placeholder
                                                  e.currentTarget.src =
                                                    "/placeholder.svg?height=200&width=300&text=Error+cargando+imagen"
                                                }}
                                              />
                                            ) : (
                                              <div className="flex items-center justify-center h-full bg-gray-50">
                                                <div className="text-center">
                                                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                                                  <span className="text-sm text-gray-500">
                                                    {doc.tipo_mime?.includes("pdf") ? "PDF" : "Archivo"}
                                                  </span>
                                                </div>
                                              </div>
                                            )}

                                            {/* Overlay con información del archivo */}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                              <div className="text-white text-center">
                                                <Eye className="h-6 w-6 mx-auto mb-1" />
                                                <span className="text-xs">Click para ver</span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-medium truncate">
                                                {doc.tipo_documento.replace("_", " ")}
                                              </p>
                                              <span className="text-xs text-gray-500">
                                                {(doc.tamaño_bytes / 1024).toFixed(1)} KB
                                              </span>
                                            </div>

                                            {doc.numero_documento && (
                                              <p className="text-xs text-gray-600">Núm: {doc.numero_documento}</p>
                                            )}

                                            <p className="text-xs text-gray-500 truncate">{doc.nombre_archivo}</p>

                                            <p className="text-xs text-gray-400">
                                              Subido: {new Date(doc.fecha_subida).toLocaleDateString()}
                                            </p>

                                            <div className="flex space-x-2 pt-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-transparent"
                                                onClick={() => {
                                                  window.open(doc.url_archivo, "_blank")
                                                }}
                                              >
                                                <Eye className="h-3 w-3 mr-1" />
                                                Ver
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-transparent"
                                                onClick={() => {
                                                  // Crear enlace temporal para descarga
                                                  const link = document.createElement("a")
                                                  link.href = doc.url_archivo
                                                  link.download = doc.nombre_archivo
                                                  link.target = "_blank"
                                                  document.body.appendChild(link)
                                                  link.click()
                                                  document.body.removeChild(link)
                                                }}
                                              >
                                                <Download className="h-3 w-3 mr-1" />
                                                Descargar
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-12 text-gray-500">
                                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                      <p className="text-lg font-medium">No hay documentos cargados</p>
                                      <p className="text-sm mt-1">
                                        Los documentos aparecerán aquí una vez que sean subidos durante el registro
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>

                          {/* Observaciones */}
                          {operador.observaciones && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Observaciones</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="p-3 bg-yellow-50 rounded border">
                                  <p className="text-sm">{operador.observaciones}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Información del sistema - Botón de consulta */}
                          <div className="flex justify-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <HelpCircle className="h-4 w-4 mr-2" />
                                  Información del Sistema
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Información del Sistema</DialogTitle>
                                  <DialogDescription>Detalles técnicos del registro del operador</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Fecha de Registro</Label>
                                    <div className="p-2 bg-gray-50 rounded border text-sm">
                                      {new Date(operador.fecha_registro).toLocaleDateString()} a las{" "}
                                      {new Date(operador.fecha_registro).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Última Actualización</Label>
                                    <div className="p-2 bg-gray-50 rounded border text-sm">
                                      {operador.updated_at
                                        ? `${new Date(operador.updated_at).toLocaleDateString()} a las ${new Date(operador.updated_at).toLocaleTimeString()}`
                                        : "No actualizado"}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex space-x-2">
                            <Button
                              variant={operador.estado === "activo" ? "destructive" : "default"}
                              size="sm"
                              onClick={() =>
                                cambiarEstadoOperador(operador.id, operador.estado === "activo" ? "inactivo" : "activo")
                              }
                            >
                              {operador.estado === "activo" ? "Desactivar" : "Activar"}
                            </Button>
                          </div>
                          <Button variant="outline" onClick={() => editarOperador(operador)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modificar Registro
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar operador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el operador y todos sus
                            documentos asociados.
                            <br />
                            <br />
                            <strong>Nota:</strong> No se puede eliminar si el operador tiene embarques registrados. En
                            ese caso, considera desactivarlo en su lugar.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => eliminarOperador(operador.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información de contacto */}
                <div className="space-y-2">
                  {operador.telefono && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{operador.telefono}</span>
                    </div>
                  )}
                  {operador.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{operador.email}</span>
                    </div>
                  )}
                </div>

                {/* Alertas de vencimiento */}
                <div className="space-y-1">
                  {getAlertaVencimiento(calcularDiasVencimiento(operador.fecha_vencimiento_licencia), "Licencia")}
                  {getAlertaVencimiento(calcularDiasVencimiento(operador.fecha_vencimiento_apto_medico), "Apto médico")}
                </div>

                {/* Información de licencia y certificaciones */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {operador.licencia && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <CreditCard className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-xs">Licencia</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{operador.licencia}</p>
                      {operador.fecha_vencimiento_licencia && (
                        <p className="text-xs text-gray-500">
                          {new Date(operador.fecha_vencimiento_licencia).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  {operador.tipo_sangre && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <Heart className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-xs">Tipo Sangre</span>
                      </div>
                      <p className="text-xs text-gray-600">{operador.tipo_sangre}</p>
                    </div>
                  )}
                  {operador.fecha_vencimiento_apto_medico && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-xs">Apto Médico</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(operador.fecha_vencimiento_apto_medico).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {operador.telefono_emergencia && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-xs">Emergencia</span>
                      </div>
                      <p className="text-xs text-gray-600">{operador.telefono_emergencia}</p>
                    </div>
                  )}
                </div>

                {/* Documentos e Identificaciones */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-xs mb-2 flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>Documentos Cargados</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1">
                      {tieneDocumentoSubido(operador.id, "curp") ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs">CURP</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {tieneDocumentoSubido(operador.id, "rfc") ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs">RFC</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {tieneDocumentoSubido(operador.id, "nss") ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs">NSS</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {tieneDocumentoSubido(operador.id, "licencia") ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs">Licencia</span>
                    </div>
                  </div>
                </div>

                {operador.observaciones && (
                  <div className="bg-yellow-50 p-2 rounded">
                    <p className="text-xs">
                      <strong>Obs:</strong>{" "}
                      {operador.observaciones.length > 50
                        ? `${operador.observaciones.substring(0, 50)}...`
                        : operador.observaciones}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-400 pt-2 border-t">
                  Registrado: {new Date(operador.fecha_registro).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {operadoresFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No se encontraron operadores</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
