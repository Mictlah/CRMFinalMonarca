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
import { Bell, Plus, Search, Edit, Trash2, AlertTriangle, CheckCircle, Clock, Download } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase, type Recordatorio, type Operador, type Camion } from "@/lib/supabase"

export default function RecordatoriosPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingRecordatorio, setEditingRecordatorio] = useState<Recordatorio | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estados para los datos relacionados
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_vencimiento: "",
    tipo: "",
    prioridad: "media",
    estado: "pendiente",
    operador_id: "",
    camion_id: "",
  })

  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])

  // Cargar datos desde Supabase
  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Cargar recordatorios con relaciones
      const { data: recordatoriosData, error: recordatoriosError } = await supabase
        .from("recordatorios")
        .select(`
          *,
          operador:operadores(*),
          camion:camiones(*)
        `)
        .order("fecha_vencimiento", { ascending: true })

      if (recordatoriosError) {
        console.error("Error cargando recordatorios:", recordatoriosError)
      } else {
        setRecordatorios(recordatoriosData || [])
      }

      // Cargar operadores
      const { data: operadoresData, error: operadoresError } = await supabase
        .from("operadores")
        .select("*")
        .eq("estado", "activo")
        .order("nombre")

      if (operadoresError) {
        console.error("Error cargando operadores:", operadoresError)
      } else {
        setOperadores(operadoresData || [])
      }

      // Cargar camiones
      const { data: camionesData, error: camionesError } = await supabase
        .from("camiones")
        .select("*")
        .order("numero_economico")

      if (camionesError) {
        console.error("Error cargando camiones:", camionesError)
      } else {
        setCamiones(camionesData || [])
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const limpiarFormulario = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      fecha_vencimiento: "",
      tipo: "",
      prioridad: "media",
      estado: "pendiente",
      operador_id: "",
      camion_id: "",
    })
    setEditingRecordatorio(null)
  }

  const guardarRecordatorio = async () => {
    if (!formData.titulo || !formData.fecha_vencimiento) {
      alert("Por favor completa los campos obligatorios (título y fecha de vencimiento)")
      return
    }

    try {
      setSaving(true)

      const recordatorioData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        fecha_vencimiento: formData.fecha_vencimiento,
        tipo: formData.tipo || null,
        prioridad: formData.prioridad,
        estado: formData.estado,
        operador_id: formData.operador_id || null,
        camion_id: formData.camion_id || null,
        updated_at: new Date().toISOString(),
      }

      if (editingRecordatorio) {
        // Actualizar recordatorio existente
        const { error } = await supabase.from("recordatorios").update(recordatorioData).eq("id", editingRecordatorio.id)

        if (error) {
          console.error("Error actualizando recordatorio:", error)
          alert("Error al actualizar recordatorio")
          return
        }
      } else {
        // Crear nuevo recordatorio
        const { error } = await supabase.from("recordatorios").insert(recordatorioData)

        if (error) {
          console.error("Error creando recordatorio:", error)
          alert("Error al crear recordatorio")
          return
        }
      }

      alert(editingRecordatorio ? "Recordatorio actualizado exitosamente" : "Recordatorio creado exitosamente")
      limpiarFormulario()
      setShowForm(false)
      await cargarDatos() // Recargar la lista
    } catch (error) {
      console.error("Error guardando recordatorio:", error)
      alert("Error al guardar recordatorio")
    } finally {
      setSaving(false)
    }
  }

  const editarRecordatorio = (recordatorio: Recordatorio) => {
    setFormData({
      titulo: recordatorio.titulo,
      descripcion: recordatorio.descripcion || "",
      fecha_vencimiento: recordatorio.fecha_vencimiento,
      tipo: recordatorio.tipo || "",
      prioridad: recordatorio.prioridad,
      estado: recordatorio.estado,
      operador_id: recordatorio.operador_id || "",
      camion_id: recordatorio.camion_id || "",
    })
    setEditingRecordatorio(recordatorio)
    setShowForm(true)
  }

  const eliminarRecordatorio = async (id: string) => {
    try {
      const { error } = await supabase.from("recordatorios").delete().eq("id", id)

      if (error) {
        console.error("Error eliminando recordatorio:", error)
        alert("Error al eliminar recordatorio")
        return
      }

      alert("Recordatorio eliminado exitosamente")
      await cargarDatos() // Recargar la lista
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar recordatorio")
    }
  }

  const marcarComoCompletado = async (id: string) => {
    try {
      const { error } = await supabase
        .from("recordatorios")
        .update({
          estado: "completado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Error actualizando recordatorio:", error)
        alert("Error al marcar como completado")
        return
      }

      await cargarDatos() // Recargar la lista
    } catch (error) {
      console.error("Error:", error)
      alert("Error al marcar como completado")
    }
  }

  const recordatoriosFiltrados = recordatorios.filter(
    (recordatorio) =>
      recordatorio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recordatorio.descripcion && recordatorio.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (recordatorio.tipo && recordatorio.tipo.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getPrioridadBadge = (prioridad: string) => {
    const prioridades = {
      alta: { color: "bg-red-100 text-red-800", label: "Alta" },
      media: { color: "bg-yellow-100 text-yellow-800", label: "Media" },
      baja: { color: "bg-green-100 text-green-800", label: "Baja" },
    }

    const prioridadInfo = prioridades[prioridad as keyof typeof prioridades] || {
      color: "bg-gray-100 text-gray-800",
      label: prioridad,
    }

    return <Badge className={`${prioridadInfo.color} hover:${prioridadInfo.color}`}>{prioridadInfo.label}</Badge>
  }

  const getEstadoBadge = (estado: string) => {
    const estados = {
      pendiente: { color: "bg-yellow-100 text-yellow-800", label: "Pendiente", icon: Clock },
      completado: { color: "bg-green-100 text-green-800", label: "Completado", icon: CheckCircle },
      vencido: { color: "bg-red-100 text-red-800", label: "Vencido", icon: AlertTriangle },
    }

    const estadoInfo = estados[estado as keyof typeof estados] || {
      color: "bg-gray-100 text-gray-800",
      label: estado,
      icon: Clock,
    }
    const IconComponent = estadoInfo.icon

    return (
      <Badge className={`${estadoInfo.color} hover:${estadoInfo.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {estadoInfo.label}
      </Badge>
    )
  }

  const esVencido = (fechaVencimiento: string) => {
    return new Date(fechaVencimiento) < new Date() && formData.estado !== "completado"
  }

  const descargarExcel = () => {
    if (recordatorios.length === 0) {
      alert("No hay recordatorios para descargar")
      return
    }

    const headers = [
      "Título",
      "Descripción",
      "Fecha Vencimiento",
      "Tipo",
      "Prioridad",
      "Estado",
      "Operador",
      "Camión",
      "Fecha Creación",
    ]

    const csvContent = [
      headers.join(","),
      ...recordatorios.map((recordatorio) =>
        [
          `"${recordatorio.titulo}"`,
          `"${recordatorio.descripcion || ""}"`,
          `"${recordatorio.fecha_vencimiento}"`,
          `"${recordatorio.tipo || ""}"`,
          `"${recordatorio.prioridad}"`,
          `"${recordatorio.estado}"`,
          `"${recordatorio.operador ? `${recordatorio.operador.nombre} ${recordatorio.operador.apellidos}` : ""}"`,
          `"${recordatorio.camion?.numero_economico || ""}"`,
          `"${recordatorio.fecha_creacion}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `recordatorios_${new Date().toISOString().split("T")[0]}.csv`)
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
            <p className="mt-2 text-gray-600">Cargando recordatorios...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Recordatorios</h1>
            <p className="text-gray-600 mt-2">Gestionar recordatorios y tareas pendientes</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={descargarExcel} disabled={recordatorios.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => limpiarFormulario()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Recordatorio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingRecordatorio ? "Editar Recordatorio" : "Nuevo Recordatorio"}</DialogTitle>
                  <DialogDescription>Completa la información del recordatorio</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Título del recordatorio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción detallada del recordatorio"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento *</Label>
                      <Input
                        id="fecha_vencimiento"
                        type="date"
                        value={formData.fecha_vencimiento}
                        onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Input
                        id="tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        placeholder="Ej: Mantenimiento, Documentos, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prioridad">Prioridad</Label>
                      <Select
                        value={formData.prioridad}
                        onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operador_id">Operador (Opcional)</Label>
                      <Select
                        value={formData.operador_id}
                        onValueChange={(value) => setFormData({ ...formData, operador_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar operador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {operadores.map((operador) => (
                            <SelectItem key={operador.id} value={operador.id}>
                              {operador.nombre} {operador.apellidos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="camion_id">Camión (Opcional)</Label>
                      <Select
                        value={formData.camion_id}
                        onValueChange={(value) => setFormData({ ...formData, camion_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar camión" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {camiones.map((camion) => (
                            <SelectItem key={camion.id} value={camion.id}>
                              {camion.numero_economico} - {camion.marca} {camion.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button onClick={guardarRecordatorio} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : editingRecordatorio ? (
                        "Actualizar Recordatorio"
                      ) : (
                        "Guardar Recordatorio"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{recordatorios.length}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {recordatorios.filter((r) => r.estado === "pendiente").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {recordatorios.filter((r) => r.estado === "completado").length}
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
                  <p className="text-sm font-medium text-gray-600">Vencidos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {recordatorios.filter((r) => r.estado === "vencido" || esVencido(r.fecha_vencimiento)).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
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
                placeholder="Buscar por título, descripción o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de recordatorios */}
        <div className="grid grid-cols-1 gap-4">
          {recordatoriosFiltrados.map((recordatorio) => (
            <Card
              key={recordatorio.id}
              className={esVencido(recordatorio.fecha_vencimiento) ? "border-red-200 bg-red-50" : ""}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{recordatorio.titulo}</CardTitle>
                    <CardDescription>
                      {recordatorio.tipo && `${recordatorio.tipo} • `}
                      Vence: {new Date(recordatorio.fecha_vencimiento).toLocaleDateString()}
                      {recordatorio.operador &&
                        ` • Operador: ${recordatorio.operador.nombre} ${recordatorio.operador.apellidos}`}
                      {recordatorio.camion && ` • Camión: ${recordatorio.camion.numero_economico}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPrioridadBadge(recordatorio.prioridad)}
                    {getEstadoBadge(recordatorio.estado)}
                    <div className="flex space-x-1">
                      {recordatorio.estado === "pendiente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => marcarComoCompletado(recordatorio.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => editarRecordatorio(recordatorio)}>
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
                            <AlertDialogTitle>¿Eliminar recordatorio?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el recordatorio.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => eliminarRecordatorio(recordatorio.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {recordatorio.descripcion && (
                <CardContent>
                  <p className="text-gray-600">{recordatorio.descripcion}</p>
                  <div className="mt-2 text-xs text-gray-400">
                    Creado: {new Date(recordatorio.fecha_creacion).toLocaleDateString()}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {recordatoriosFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No se encontraron recordatorios</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
