"use client"

import type React from "react"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  X,
  ImageIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import { supabase, type Operador } from "@/lib/supabase"
import { subirDocumentoOperador, eliminarDocumentoOperador } from "@/lib/blob"

interface DocumentoOperador {
  id: string
  operador_id: string
  tipo_documento: string
  numero_documento?: string
  nombre_archivo: string
  url_blob: string
  pathname: string
  tamano_bytes?: number
  tipo_mime?: string
  fecha_vencimiento?: string
  activo: boolean
  notas?: string
  fecha_subida: string
  subido_por?: string
}

export default function OperadoresPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [operadorDetalle, setOperadorDetalle] = useState<Operador | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [documentos, setDocumentos] = useState<DocumentoOperador[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)

  // Estados para los datos
  const [operadores, setOperadores] = useState<Operador[]>([])

  // Estados para el formulario
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
    telefono_emergencia: "",
    contactos_emergencia: "",
    observaciones: "",
    estado: "activo",
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Estados para subida de documentos
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tipoDocumento, setTipoDocumento] = useState("")
  const [numeroDocumento, setNumeroDocumento] = useState("")
  const [fechaVencimiento, setFechaVencimiento] = useState("")
  const [notasDocumento, setNotasDocumento] = useState("")

  const tiposDocumento = [
    "licencia",
    "apto_medico",
    "visa",
    "fast",
    "curp",
    "rfc",
    "nss",
    "ine",
    "pasaporte",
    "comprobante_domicilio",
    "contrato",
    "otro",
  ]

  // Cargar datos desde Supabase
  const cargarDatos = async () => {
    try {
      setLoading(true)

      const { data: operadoresData, error: operadoresError } = await supabase
        .from("operadores")
        .select("*")
        .order("nombre")

      if (operadoresError) {
        console.error("Error cargando operadores:", operadoresError)
        setOperadores([])
      } else {
        setOperadores(operadoresData || [])
      }
    } catch (error) {
      console.error("Error general:", error)
      setOperadores([])
    } finally {
      setLoading(false)
    }
  }

  const cargarDocumentosOperador = async (operadorId: string) => {
    try {
      setLoadingDocumentos(true)

      const { data, error } = await supabase
        .from("documentos_operadores")
        .select("*")
        .eq("operador_id", operadorId)
        .eq("activo", true)
        .order("fecha_subida", { ascending: false })

      if (error) {
        console.error("Error cargando documentos:", error)
        setDocumentos([])
      } else {
        setDocumentos(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      setDocumentos([])
    } finally {
      setLoadingDocumentos(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const resetForm = () => {
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
      telefono_emergencia: "",
      contactos_emergencia: "",
      observaciones: "",
      estado: "activo",
    })
    setEditingId(null)
    setError("")
    setSuccess("")
  }

  const resetDocumentForm = () => {
    setSelectedFile(null)
    setTipoDocumento("")
    setNumeroDocumento("")
    setFechaVencimiento("")
    setNotasDocumento("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim() || !formData.apellidos.trim()) {
      setError("Nombre y apellidos son obligatorios")
      return
    }

    try {
      setSaving(true)
      setError("")

      if (editingId) {
        const { error } = await supabase
          .from("operadores")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)

        if (error) {
          console.error("Error actualizando operador:", error)
          setError("Error al actualizar operador")
          return
        }

        setSuccess("Operador actualizado exitosamente")
      } else {
        const { error } = await supabase.from("operadores").insert({
          ...formData,
          fecha_registro: new Date().toISOString(),
        })

        if (error) {
          console.error("Error creando operador:", error)
          setError("Error al crear operador")
          return
        }

        setSuccess("Operador creado exitosamente")
      }

      setShowModal(false)
      resetForm()
      await cargarDatos()
    } catch (error) {
      console.error("Error:", error)
      setError("Error al guardar operador")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (operador: Operador) => {
    setFormData({
      nombre: operador.nombre || "",
      apellidos: operador.apellidos || "",
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
      telefono_emergencia: operador.telefono_emergencia || "",
      contactos_emergencia: operador.contactos_emergencia || "",
      observaciones: operador.observaciones || "",
      estado: operador.estado || "activo",
    })
    setEditingId(operador.id)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setSaving(true)

      const { error } = await supabase.from("operadores").delete().eq("id", id)

      if (error) {
        console.error("Error eliminando operador:", error)
        setError("Error al eliminar operador")
        return
      }

      setSuccess("Operador eliminado exitosamente")
      await cargarDatos()
    } catch (error) {
      console.error("Error:", error)
      setError("Error al eliminar operador")
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("El archivo es muy grande. Tamaño máximo: 10MB")
        return
      }

      // Validar tipo
      const tiposPermitidos = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/webp",
        "application/pdf",
      ]
      if (!tiposPermitidos.includes(file.type)) {
        setError("Tipo de archivo no permitido. Solo se permiten imágenes y PDFs")
        return
      }

      setSelectedFile(file)
      setError("")
    }
  }

  const subirDocumento = async () => {
    if (!operadorDetalle || !selectedFile || !tipoDocumento) {
      setError("Por favor completa todos los campos requeridos")
      return
    }

    try {
      setUploadingDoc(true)
      setError("")

      // Subir archivo a Blob
      const { url, pathname } = await subirDocumentoOperador(
        operadorDetalle.id,
        selectedFile,
        tipoDocumento,
        numeroDocumento,
      )

      // Guardar información en la base de datos
      const { error } = await supabase.from("documentos_operadores").insert({
        operador_id: operadorDetalle.id,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento || null,
        nombre_archivo: selectedFile.name,
        url_blob: url,
        pathname: pathname,
        tamano_bytes: selectedFile.size,
        tipo_mime: selectedFile.type,
        fecha_vencimiento: fechaVencimiento || null,
        notas: notasDocumento || null,
        subido_por: "Sistema",
        activo: true,
      })

      if (error) {
        console.error("Error guardando documento:", error)
        setError("Error al guardar la información del documento")
        return
      }

      setSuccess("Documento subido exitosamente")
      resetDocumentForm()
      await cargarDocumentosOperador(operadorDetalle.id)
    } catch (error) {
      console.error("Error subiendo documento:", error)
      setError(`Error al subir documento: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setUploadingDoc(false)
    }
  }

  const eliminarDocumento = async (documento: DocumentoOperador) => {
    try {
      // Eliminar de Blob storage
      await eliminarDocumentoOperador(documento.pathname)

      // Marcar como inactivo en la base de datos
      const { error } = await supabase
        .from("documentos_operadores")
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq("id", documento.id)

      if (error) {
        console.error("Error eliminando documento:", error)
        setError("Error al eliminar documento")
        return
      }

      setSuccess("Documento eliminado exitosamente")
      await cargarDocumentosOperador(documento.operador_id)
    } catch (error) {
      console.error("Error:", error)
      setError("Error al eliminar documento")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getEstadoBadge = (estado: string) => {
    return estado === "activo" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactivo</Badge>
    )
  }

  const operadoresFiltrados = operadores.filter(
    (operador) =>
      operador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operador.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (operador.telefono && operador.telefono.includes(searchTerm)) ||
      (operador.email && operador.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

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

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Géstion de Operadores</h1>
            <p className="text-gray-600 mt-2">Gestión de operadores y conductores</p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Operador
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Operadores</p>
                  <p className="text-2xl font-bold text-gray-900">{operadores.length}</p>
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
                  <p className="text-sm font-medium text-gray-600">Inactivos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {operadores.filter((op) => op.estado === "inactivo").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Con Documentos</p>
                  <p className="text-2xl font-bold text-blue-600">{operadores.filter((op) => op.documentos).length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de operadores */}
        {/* Lista de operadores en formato de tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operadoresFiltrados.map((operador) => (
            <Card key={operador.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {operador.nombre} {operador.apellidos}
                    </CardTitle>
                    <div className="flex items-center mb-2">{getEstadoBadge(operador.estado)}</div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOperadorDetalle(operador)
                        setActiveTab("general")
                        setShowDetailsModal(true)
                        cargarDocumentosOperador(operador.id)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(operador)}>
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
                          <AlertDialogTitle>¿Eliminar operador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el operador {operador.nombre}{" "}
                            {operador.apellidos}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(operador.id)}>Eliminar</AlertDialogAction>
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

                {/* Información de documentos principales */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {operador.licencia && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <FileText className="h-3 w-3 text-gray-400" />
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
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                        <span className="font-medium text-xs">Tipo Sangre</span>
                      </div>
                      <p className="text-xs text-gray-600">{operador.tipo_sangre}</p>
                    </div>
                  )}

                  {operador.numero_visa && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <FileText className="h-3 w-3 text-blue-400" />
                        <span className="font-medium text-xs">Visa</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{operador.numero_visa}</p>
                      {operador.fecha_vencimiento_visa && (
                        <p className="text-xs text-gray-500">
                          {new Date(operador.fecha_vencimiento_visa).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {operador.numero_fast && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="font-medium text-xs">FAST</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{operador.numero_fast}</p>
                      {operador.fecha_vencimiento_fast && (
                        <p className="text-xs text-gray-500">
                          {new Date(operador.fecha_vencimiento_fast).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                {operador.fecha_nacimiento && (
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="flex items-center space-x-1 mb-1">
                      <Users className="h-3 w-3 text-blue-400" />
                      <span className="font-medium text-xs">Fecha de Nacimiento</span>
                    </div>
                    <p className="text-xs text-gray-600">{new Date(operador.fecha_nacimiento).toLocaleDateString()}</p>
                  </div>
                )}

                {/* Observaciones si existen */}
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

                {/* Fecha de registro */}
                <div className="text-xs text-gray-400 pt-2 border-t">
                  Registrado: {new Date(operador.fecha_registro).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mensaje cuando no hay operadores */}
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

      {/* Modal de Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? "Editar Operador" : "Nuevo Operador"}</h2>
              <Button onClick={() => setShowModal(false)} variant="outline" size="sm">
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  <div className="space-y-2">
                    <Label htmlFor="tipo_sangre">Tipo de Sangre</Label>
                    <Select
                      value={formData.tipo_sangre}
                      onValueChange={(value) => setFormData({ ...formData, tipo_sangre: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
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
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Textarea
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Documentos Oficiales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Documentos Oficiales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="curp">CURP</Label>
                    <Input
                      id="curp"
                      value={formData.curp}
                      onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rfc">RFC</Label>
                    <Input
                      id="rfc"
                      value={formData.rfc}
                      onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nss">NSS</Label>
                    <Input
                      id="nss"
                      value={formData.nss}
                      onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Licencias y Permisos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Licencias y Permisos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licencia">Número de Licencia</Label>
                    <Input
                      id="licencia"
                      value={formData.licencia}
                      onChange={(e) => setFormData({ ...formData, licencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_vencimiento_licencia">Vencimiento Licencia</Label>
                    <Input
                      id="fecha_vencimiento_licencia"
                      type="date"
                      value={formData.fecha_vencimiento_licencia}
                      onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_apto_medico">Apto Médico</Label>
                    <Input
                      id="numero_apto_medico"
                      value={formData.numero_apto_medico}
                      onChange={(e) => setFormData({ ...formData, numero_apto_medico: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_vencimiento_apto_medico">Vencimiento Apto Médico</Label>
                    <Input
                      id="fecha_vencimiento_apto_medico"
                      type="date"
                      value={formData.fecha_vencimiento_apto_medico}
                      onChange={(e) => setFormData({ ...formData, fecha_vencimiento_apto_medico: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_visa">Número de Visa</Label>
                    <Input
                      id="numero_visa"
                      value={formData.numero_visa}
                      onChange={(e) => setFormData({ ...formData, numero_visa: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_vencimiento_visa">Vencimiento Visa</Label>
                    <Input
                      id="fecha_vencimiento_visa"
                      type="date"
                      value={formData.fecha_vencimiento_visa}
                      onChange={(e) => setFormData({ ...formData, fecha_vencimiento_visa: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_fast">Número FAST</Label>
                    <Input
                      id="numero_fast"
                      value={formData.numero_fast}
                      onChange={(e) => setFormData({ ...formData, numero_fast: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_vencimiento_fast">Vencimiento FAST</Label>
                    <Input
                      id="fecha_vencimiento_fast"
                      type="date"
                      value={formData.fecha_vencimiento_fast}
                      onChange={(e) => setFormData({ ...formData, fecha_vencimiento_fast: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Contactos de Emergencia */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contactos de Emergencia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono_emergencia">Teléfono de Emergencia</Label>
                    <Input
                      id="telefono_emergencia"
                      value={formData.telefono_emergencia}
                      onChange={(e) => setFormData({ ...formData, telefono_emergencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactos_emergencia">Contactos de Emergencia (JSON)</Label>
                  <Textarea
                    id="contactos_emergencia"
                    value={formData.contactos_emergencia}
                    onChange={(e) => setFormData({ ...formData, contactos_emergencia: e.target.value })}
                    placeholder='{"contacto1": {"nombre": "Juan Pérez", "telefono": "555-1234", "relacion": "Hermano"}}'
                    rows={3}
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : editingId ? (
                    "Actualizar"
                  ) : (
                    "Crear"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalles con Pestañas */}
      {showDetailsModal && operadorDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalles del Operador</h2>
                <p className="text-sm text-gray-600">
                  {operadorDetalle.nombre} {operadorDetalle.apellidos}
                </p>
              </div>
              <Button onClick={() => setShowDetailsModal(false)} variant="outline" size="sm">
                ✕
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === "general"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("general")}
                    >
                      Información General
                    </button>
                    <button
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === "documentos"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("documentos")}
                    >
                      Documentos ({documentos.length})
                    </button>
                    <button
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === "subir"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("subir")}
                    >
                      <Upload className="h-4 w-4 inline mr-1" />
                      Subir Documentos
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {/* Información General Tab */}
                  {activeTab === "general" && (
                    <div className="space-y-6">
                      {/* Información Personal */}
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Información Personal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</label>
                            <p className="text-sm font-medium text-gray-900">
                              {operadorDetalle.nombre} {operadorDetalle.apellidos}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Teléfono
                            </label>
                            <p className="text-sm text-gray-700">{operadorDetalle.telefono || "No especificado"}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                            <p className="text-sm text-gray-700">{operadorDetalle.email || "No especificado"}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</label>
                            <div className="flex items-center">{getEstadoBadge(operadorDetalle.estado)}</div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Fecha Nacimiento
                            </label>
                            <p className="text-sm text-gray-700">
                              {operadorDetalle.fecha_nacimiento
                                ? new Date(operadorDetalle.fecha_nacimiento).toLocaleDateString()
                                : "No especificada"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Tipo de Sangre
                            </label>
                            <p className="text-sm text-gray-700">{operadorDetalle.tipo_sangre || "No especificado"}</p>
                          </div>
                        </div>
                        {operadorDetalle.direccion && (
                          <div className="mt-4 space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Dirección
                            </label>
                            <p className="text-sm text-gray-700">{operadorDetalle.direccion}</p>
                          </div>
                        )}
                      </div>

                      {/* Documentos Oficiales */}
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Documentos Oficiales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">CURP</label>
                            <p className="text-sm font-mono text-gray-900">
                              {operadorDetalle.curp || "No especificado"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">RFC</label>
                            <p className="text-sm font-mono text-gray-900">
                              {operadorDetalle.rfc || "No especificado"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">NSS</label>
                            <p className="text-sm font-mono text-gray-900">
                              {operadorDetalle.nss || "No especificado"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Licencias y Permisos */}
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Licencias y Permisos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Licencia de Conducir</h4>
                              <p className="text-sm font-mono text-gray-900">
                                {operadorDetalle.licencia || "No especificada"}
                              </p>
                              {operadorDetalle.fecha_vencimiento_licencia && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Vence: {new Date(operadorDetalle.fecha_vencimiento_licencia).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Visa</h4>
                              <p className="text-sm font-mono text-gray-900">
                                {operadorDetalle.numero_visa || "No especificada"}
                              </p>
                              {operadorDetalle.fecha_vencimiento_visa && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Vence: {new Date(operadorDetalle.fecha_vencimiento_visa).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Apto Médico</h4>
                              <p className="text-sm font-mono text-gray-900">
                                {operadorDetalle.numero_apto_medico || "No especificado"}
                              </p>
                              {operadorDetalle.fecha_vencimiento_apto_medico && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Vence: {new Date(operadorDetalle.fecha_vencimiento_apto_medico).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">FAST</h4>
                              <p className="text-sm font-mono text-gray-900">
                                {operadorDetalle.numero_fast || "No especificado"}
                              </p>
                              {operadorDetalle.fecha_vencimiento_fast && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Vence: {new Date(operadorDetalle.fecha_vencimiento_fast).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Observaciones */}
                      {operadorDetalle.observaciones && (
                        <div className="bg-white border rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Observaciones</h3>
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <p className="text-sm text-gray-900 leading-relaxed">{operadorDetalle.observaciones}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Documentos Tab */}
                  {activeTab === "documentos" && (
                    <div className="space-y-6">
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Documentos Digitales ({documentos.length})
                        </h3>
                        {loadingDocumentos ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-600">Cargando documentos...</span>
                          </div>
                        ) : documentos.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No hay documentos subidos</p>
                            <p className="text-sm mt-1">Los documentos aparecerán aquí una vez que los subas</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documentos.map((documento) => (
                              <div
                                key={documento.id}
                                className="border rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow"
                              >
                                {/* Vista previa */}
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group">
                                  {documento.tipo_mime?.startsWith("image/") ? (
                                    <img
                                      src={documento.url_blob || "/placeholder.svg"}
                                      alt={documento.nombre_archivo}
                                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => window.open(documento.url_blob, "_blank")}
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          "/placeholder.svg?height=200&width=300&text=Error+cargando+imagen"
                                      }}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full bg-gray-50">
                                      <div className="text-center">
                                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                                        <span className="text-sm text-gray-500">
                                          {documento.tipo_mime?.includes("pdf") ? "PDF" : "Archivo"}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Overlay con información */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="text-white text-center">
                                      <Eye className="h-6 w-6 mx-auto mb-1" />
                                      <span className="text-xs">Click para ver</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Información del documento */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">
                                      {documento.tipo_documento.replace("_", " ").toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {documento.tamano_bytes && formatFileSize(documento.tamano_bytes)}
                                    </span>
                                  </div>

                                  <p className="text-sm font-medium truncate">{documento.nombre_archivo}</p>

                                  {documento.numero_documento && (
                                    <p className="text-xs text-gray-600">Número: {documento.numero_documento}</p>
                                  )}

                                  {documento.fecha_vencimiento && (
                                    <p className="text-xs text-gray-600">
                                      Vence: {new Date(documento.fecha_vencimiento).toLocaleDateString()}
                                    </p>
                                  )}

                                  <p className="text-xs text-gray-400">
                                    {new Date(documento.fecha_subida).toLocaleDateString()} a las{" "}
                                    {new Date(documento.fecha_subida).toLocaleTimeString()}
                                  </p>

                                  {documento.notas && (
                                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{documento.notas}</p>
                                  )}

                                  {/* Acciones */}
                                  <div className="flex space-x-2 pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 bg-transparent"
                                      onClick={() => window.open(documento.url_blob, "_blank")}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Ver
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 bg-transparent"
                                      onClick={() => {
                                        const link = document.createElement("a")
                                        link.href = documento.url_blob
                                        link.download = documento.nombre_archivo
                                        link.target = "_blank"
                                        document.body.appendChild(link)
                                        link.click()
                                        document.body.removeChild(link)
                                      }}
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Descargar
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta acción no se puede deshacer. El documento se eliminará permanentemente.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => eliminarDocumento(documento)}>
                                            Eliminar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subir Documentos Tab */}
                  {activeTab === "subir" && (
                    <div className="space-y-6">
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Subir Nuevo Documento
                        </h3>

                        <div className="space-y-4">
                          {/* Tipo de documento */}
                          <div className="space-y-2">
                            <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo de documento" />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposDocumento.map((tipo) => (
                                  <SelectItem key={tipo} value={tipo}>
                                    {tipo.replace("_", " ").toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Número de documento */}
                          <div className="space-y-2">
                            <Label htmlFor="numero_documento">Número de Documento</Label>
                            <Input
                              id="numero_documento"
                              value={numeroDocumento}
                              onChange={(e) => setNumeroDocumento(e.target.value)}
                              placeholder="Ej: 123456789"
                            />
                          </div>

                          {/* Fecha de vencimiento */}
                          <div className="space-y-2">
                            <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
                            <Input
                              id="fecha_vencimiento"
                              type="date"
                              value={fechaVencimiento}
                              onChange={(e) => setFechaVencimiento(e.target.value)}
                            />
                          </div>

                          {/* Vista previa del archivo seleccionado */}
                          {selectedFile && (
                            <div className="space-y-2">
                              <Label>Archivo Seleccionado</Label>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                <div className="flex items-center space-x-2">
                                  {selectedFile.type.startsWith("image/") ? (
                                    <ImageIcon className="h-5 w-5 text-blue-500" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-red-500" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedFile(null)}
                                  disabled={uploadingDoc}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Notas */}
                          <div className="space-y-2">
                            <Label htmlFor="notas_documento">Notas</Label>
                            <Textarea
                              id="notas_documento"
                              value={notasDocumento}
                              onChange={(e) => setNotasDocumento(e.target.value)}
                              placeholder="Notas adicionales sobre el documento..."
                              rows={3}
                            />
                          </div>

                          {/* Botón de subida */}
                          <Button
                            onClick={subirDocumento}
                            disabled={uploadingDoc || !selectedFile || !tipoDocumento}
                            className="w-full"
                          >
                            {uploadingDoc ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Subiendo documento...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Subir Documento
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
