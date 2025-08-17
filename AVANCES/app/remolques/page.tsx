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
import { Truck, Plus, Search, Edit, Trash2, AlertTriangle, Package } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase, type Remolque, type MarcaRemolque } from "@/lib/supabase"

export default function RemolquesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingRemolque, setEditingRemolque] = useState<Remolque | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estados para los datos
  const [remolques, setRemolques] = useState<Remolque[]>([])
  const [marcas, setMarcas] = useState<MarcaRemolque[]>([])

  // Estado del formulario
  const [formData, setFormData] = useState({
    numeroEconomico: "",
    tipo: "",
    marca: "",
    modelo: "",
    año: "",
    numeroSerie: "",
    capacidad: "",
    placas: "",
    fechaUltimaInspeccion: "",
    proximaInspeccion: "",
    polizaSeguro: "",
    vigenciaSeguro: "",
    estado: "disponible",
    comentarios: "",
  })

  // Cargar datos desde Supabase
  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Cargar remolques
      const { data: remolquesData, error: remolquesError } = await supabase
        .from("remolques")
        .select("*")
        .order("numero_economico")

      if (remolquesError) {
        console.error("Error cargando remolques:", remolquesError)
      } else {
        setRemolques(remolquesData || [])
      }

      // Cargar marcas
      const { data: marcasData, error: marcasError } = await supabase
        .from("marcas_remolques")
        .select("*")
        .eq("activa", true)
        .order("nombre")

      if (marcasError) {
        console.error("Error cargando marcas:", marcasError)
      } else {
        setMarcas(marcasData || [])
      }
    } catch (error) {
      console.error("Error general:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const limpiarFormulario = () => {
    setFormData({
      numeroEconomico: "",
      tipo: "",
      marca: "",
      modelo: "",
      año: "",
      numeroSerie: "",
      capacidad: "",
      placas: "",
      fechaUltimaInspeccion: "",
      proximaInspeccion: "",
      polizaSeguro: "",
      vigenciaSeguro: "",
      estado: "disponible",
      comentarios: "",
    })
    setEditingRemolque(null)
  }

  const crearRecordatoriosVencimientos = async (
    remolqueId: string,
    numeroEconomico: string,
    proximaInspeccion?: string,
    vigenciaSeguro?: string,
  ) => {
    try {
      const recordatorios = []

      // Recordatorio para inspección (15 días antes)
      if (proximaInspeccion) {
        const fechaInspeccion = new Date(proximaInspeccion)
        const fechaRecordatorio = new Date(fechaInspeccion)
        fechaRecordatorio.setDate(fechaRecordatorio.getDate() - 15) // 15 días antes

        recordatorios.push({
          titulo: `Inspección de Remolque ${numeroEconomico}`,
          descripcion: `La inspección del remolque ${numeroEconomico} vence el ${fechaInspeccion.toLocaleDateString()}. Programa la inspección con anticipación.`,
          fecha_vencimiento: fechaRecordatorio.toISOString().split("T")[0],
          tipo: "inspeccion_remolque",
          prioridad: "alta",
          estado: "pendiente",
        })
      }

      // Recordatorio para seguro (15 días antes)
      if (vigenciaSeguro) {
        const fechaSeguro = new Date(vigenciaSeguro)
        const fechaRecordatorio = new Date(fechaSeguro)
        fechaRecordatorio.setDate(fechaRecordatorio.getDate() - 15) // 15 días antes

        recordatorios.push({
          titulo: `Seguro de Remolque ${numeroEconomico}`,
          descripcion: `El seguro del remolque ${numeroEconomico} vence el ${fechaSeguro.toLocaleDateString()}. Renueva la póliza de seguro antes del vencimiento.`,
          fecha_vencimiento: fechaRecordatorio.toISOString().split("T")[0],
          tipo: "seguro_remolque",
          prioridad: "alta",
          estado: "pendiente",
        })
      }

      // Insertar recordatorios si hay alguno
      if (recordatorios.length > 0) {
        const { error } = await supabase.from("recordatorios").insert(recordatorios)

        if (error) {
          console.error("Error creando recordatorios:", error)
          // Mostrar mensaje informativo al usuario en lugar de error
          alert(
            `Remolque guardado exitosamente. Nota: Los recordatorios automáticos se configurarán manualmente desde la sección de recordatorios.`,
          )
        } else {
          console.log(`Creados ${recordatorios.length} recordatorios para remolque ${numeroEconomico}`)
        }
      }
    } catch (error) {
      console.error("Error en crearRecordatoriosVencimientos:", error)
      // No mostrar error al usuario, solo log interno
    }
  }

  const guardarRemolque = async () => {
    if (!formData.numeroEconomico) {
      alert("El número económico es obligatorio")
      return
    }

    try {
      setSaving(true)

      // Verificar que el número económico no esté duplicado
      const { data: existingRemolque, error: checkError } = await supabase
        .from("remolques")
        .select("id")
        .eq("numero_economico", formData.numeroEconomico)

      if (checkError) {
        console.error("Error verificando número económico:", checkError)
        alert("Error al verificar número económico")
        return
      }

      // Si estamos editando, excluir el remolque actual de la verificación
      const duplicateExists = editingRemolque
        ? existingRemolque?.some((r) => r.id !== editingRemolque.id)
        : existingRemolque && existingRemolque.length > 0

      if (duplicateExists) {
        alert("Ya existe un remolque con ese número económico")
        return
      }

      // Verificar que el número de serie no esté duplicado (solo si se proporciona)
      if (formData.numeroSerie) {
        const { data: existingSerial, error: serialError } = await supabase
          .from("remolques")
          .select("id")
          .eq("numero_serie", formData.numeroSerie)

        if (serialError) {
          console.error("Error verificando número de serie:", serialError)
          alert("Error al verificar número de serie")
          return
        }

        // Si estamos editando, excluir el remolque actual de la verificación
        const serialDuplicateExists = editingRemolque
          ? existingSerial?.some((r) => r.id !== editingRemolque.id)
          : existingSerial && existingSerial.length > 0

        if (serialDuplicateExists) {
          alert("Ya existe un remolque con ese número de serie")
          return
        }
      }

      const remolqueData = {
        numero_economico: formData.numeroEconomico,
        tipo: formData.tipo || null,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
        año: formData.año ? Number.parseInt(formData.año) : null,
        numero_serie: formData.numeroSerie || null,
        capacidad: formData.capacidad ? Number.parseFloat(formData.capacidad) : null,
        placas: formData.placas || null,
        fecha_ultima_inspeccion: formData.fechaUltimaInspeccion || null,
        proxima_inspeccion: formData.proximaInspeccion || null,
        poliza_seguro: formData.polizaSeguro || null,
        vigencia_seguro: formData.vigenciaSeguro || null,
        estado: formData.estado,
        comentarios: formData.comentarios || null,
        updated_at: new Date().toISOString(),
      }

      let remolqueId: string

      if (editingRemolque) {
        // Actualizar remolque existente
        const { error } = await supabase.from("remolques").update(remolqueData).eq("id", editingRemolque.id)

        if (error) {
          console.error("Error actualizando remolque:", error)
          alert("Error al actualizar remolque")
          return
        }
        remolqueId = editingRemolque.id
      } else {
        // Crear nuevo remolque
        remolqueData.fecha_registro = new Date().toISOString()

        const { data, error } = await supabase.from("remolques").insert(remolqueData).select().single()

        if (error) {
          console.error("Error creando remolque:", error)
          alert("Error al crear remolque")
          return
        }
        remolqueId = data.id
      }

      // Crear recordatorios para vencimientos
      await crearRecordatoriosVencimientos(
        remolqueId,
        formData.numeroEconomico,
        formData.proximaInspeccion,
        formData.vigenciaSeguro,
      )

      alert(editingRemolque ? "Remolque actualizado exitosamente" : "Remolque creado exitosamente")
      limpiarFormulario()
      setShowForm(false)
      await cargarDatos()
    } catch (error) {
      console.error("Error guardando remolque:", error)
      alert("Error al guardar remolque")
    } finally {
      setSaving(false)
    }
  }

  const editarRemolque = (remolque: Remolque) => {
    setFormData({
      numeroEconomico: remolque.numero_economico,
      tipo: remolque.tipo || "",
      marca: remolque.marca || "",
      modelo: remolque.modelo || "",
      año: remolque.año?.toString() || "",
      numeroSerie: remolque.numero_serie || "",
      capacidad: remolque.capacidad?.toString() || "",
      placas: remolque.placas || "",
      fechaUltimaInspeccion: remolque.fecha_ultima_inspeccion || "",
      proximaInspeccion: remolque.proxima_inspeccion || "",
      polizaSeguro: remolque.poliza_seguro || "",
      vigenciaSeguro: remolque.vigencia_seguro || "",
      estado: remolque.estado,
      comentarios: remolque.comentarios || "",
    })
    setEditingRemolque(remolque)
    setShowForm(true)
  }

  const eliminarRemolque = async (id: string) => {
    try {
      // Verificar que el remolque esté marcado como "fuera-de-servicio"
      const remolque = remolques.find((r) => r.id === id)
      if (!remolque) {
        alert("Remolque no encontrado")
        return
      }

      if (remolque.estado !== "fuera-de-servicio") {
        alert(
          "Solo se pueden eliminar remolques que estén marcados como 'Fuera de Servicio'. Cambia el estado primero.",
        )
        return
      }

      // Verificar que no tenga embarques activos
      const { data: embarquesActivos, error: embarquesError } = await supabase
        .from("embarques")
        .select("id")
        .eq("remolque_id", id)
        .in("estado", ["creado", "listo-para-asignar", "asignado", "en-transito"])

      if (embarquesError) {
        console.error("Error verificando embarques:", embarquesError)
        alert("Error al verificar embarques activos")
        return
      }

      if (embarquesActivos && embarquesActivos.length > 0) {
        alert(
          `No se puede eliminar el remolque porque tiene ${embarquesActivos.length} embarque(s) activo(s). Completa o cancela los embarques primero.`,
        )
        return
      }

      // Confirmar eliminación
      const confirmacion = confirm(
        `¿Estás seguro de que deseas eliminar permanentemente el remolque ${remolque.numero_economico}?\n\n` +
          "ADVERTENCIA: Esta acción no se puede deshacer.\n\n" +
          "El remolque será eliminado completamente del sistema junto con:\n" +
          "- Su historial de mantenimiento\n" +
          "- Sus registros de inspección\n" +
          "- Todos sus datos asociados\n\n" +
          "Solo procede si estás completamente seguro.",
      )

      if (!confirmacion) {
        return
      }

      // Segunda confirmación
      const segundaConfirmacion = confirm(
        `CONFIRMACIÓN FINAL:\n\n` +
          `¿Realmente deseas eliminar el remolque ${remolque.numero_economico}?\n\n` +
          "Escribe 'ELIMINAR' en el siguiente cuadro para confirmar.",
      )

      if (!segundaConfirmacion) {
        return
      }

      const textoConfirmacion = prompt(
        `Para confirmar la eliminación del remolque ${remolque.numero_economico}, escribe exactamente: ELIMINAR`,
      )

      if (textoConfirmacion !== "ELIMINAR") {
        alert("Eliminación cancelada. El texto de confirmación no coincide.")
        return
      }

      // Proceder con la eliminación
      const { error } = await supabase.from("remolques").delete().eq("id", id)

      if (error) {
        console.error("Error eliminando remolque:", error)
        alert("Error al eliminar remolque")
        return
      }

      alert("Remolque eliminado exitosamente")
      await cargarDatos()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar remolque")
    }
  }

  const toggleActivarRemolque = async (id: string, estadoActual: boolean) => {
    try {
      const nuevoEstado = !estadoActual
      const accion = nuevoEstado ? "activar" : "desactivar"

      const confirmacion = confirm(
        `¿Estás seguro de que deseas ${accion} este remolque?\n\n` +
          `El remolque será ${nuevoEstado ? "activado y estará disponible" : "desactivado y no estará disponible"} para asignaciones.`,
      )

      if (!confirmacion) {
        return
      }

      const { error } = await supabase
        .from("remolques")
        .update({
          activo: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Error actualizando estado del remolque:", error)
        alert("Error al actualizar el estado del remolque")
        return
      }

      alert(`Remolque ${nuevoEstado ? "activado" : "desactivado"} exitosamente`)
      await cargarDatos()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cambiar el estado del remolque")
    }
  }

  // Función para verificar si una fecha está próxima a vencer
  const estaProximoAVencer = (fecha: string, diasAnticipacion = 30) => {
    if (!fecha) return false
    const fechaVencimiento = new Date(fecha)
    const hoy = new Date()
    const diferenciaDias = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diferenciaDias <= diasAnticipacion && diferenciaDias >= 0
  }

  // Función para verificar si una fecha ya venció
  const yaVencio = (fecha: string) => {
    if (!fecha) return false
    const fechaVencimiento = new Date(fecha)
    const hoy = new Date()
    return fechaVencimiento < hoy
  }

  const remolquesFiltrados = remolques.filter(
    (remolque) =>
      remolque.numero_economico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (remolque.marca && remolque.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (remolque.modelo && remolque.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (remolque.placas && remolque.placas.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando remolques...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Remolques</h1>
            <p className="text-gray-600 mt-2">Administrar la flota de remolques</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => limpiarFormulario()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Remolque
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRemolque ? "Modificar Remolque" : "Nuevo Remolque"}</DialogTitle>
                <DialogDescription>Completa la información del remolque</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Básica</h3>
                  <div className="space-y-2">
                    <Label htmlFor="numeroEconomico">Número Económico *</Label>
                    <Input
                      id="numeroEconomico"
                      value={formData.numeroEconomico}
                      onChange={(e) => setFormData({ ...formData, numeroEconomico: e.target.value })}
                      placeholder="Ej: R001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Remolque</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caja-seca">Caja Seca</SelectItem>
                        <SelectItem value="plataforma">Plataforma</SelectItem>
                        <SelectItem value="refrigerado">Refrigerado</SelectItem>
                        <SelectItem value="tanque">Tanque</SelectItem>
                        <SelectItem value="tolva">Tolva</SelectItem>
                        <SelectItem value="lowboy">Lowboy</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <Select
                      value={formData.marca}
                      onValueChange={(value) => setFormData({ ...formData, marca: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {marcas.map((marca) => (
                          <SelectItem key={marca.id} value={marca.nombre}>
                            {marca.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      placeholder="Modelo del remolque"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="año">Año</Label>
                    <Input
                      id="año"
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={formData.año}
                      onChange={(e) => setFormData({ ...formData, año: e.target.value })}
                      placeholder="Año del remolque"
                    />
                  </div>
                </div>

                {/* Información técnica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Técnica</h3>
                  <div className="space-y-2">
                    <Label htmlFor="numeroSerie">Número de Serie</Label>
                    <Input
                      id="numeroSerie"
                      value={formData.numeroSerie}
                      onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                      placeholder="Número de serie del remolque"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacidad">Capacidad (toneladas)</Label>
                    <Input
                      id="capacidad"
                      type="number"
                      step="0.1"
                      value={formData.capacidad}
                      onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                      placeholder="Capacidad de carga"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placas">Placas</Label>
                    <Input
                      id="placas"
                      value={formData.placas}
                      onChange={(e) => setFormData({ ...formData, placas: e.target.value })}
                      placeholder="Número de placas"
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
                        <SelectItem value="disponible">Disponible</SelectItem>
                        <SelectItem value="en-uso">En Uso</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="fuera-de-servicio">Fuera de Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Inspecciones y seguro */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-medium">Inspecciones y Seguro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fechaUltimaInspeccion">Fecha Última Inspección</Label>
                      <Input
                        id="fechaUltimaInspeccion"
                        type="date"
                        value={formData.fechaUltimaInspeccion}
                        onChange={(e) => setFormData({ ...formData, fechaUltimaInspeccion: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proximaInspeccion">Próxima Inspección</Label>
                      <Input
                        id="proximaInspeccion"
                        type="date"
                        value={formData.proximaInspeccion}
                        onChange={(e) => setFormData({ ...formData, proximaInspeccion: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="polizaSeguro">Número de Póliza de Seguro</Label>
                      <Input
                        id="polizaSeguro"
                        value={formData.polizaSeguro}
                        onChange={(e) => setFormData({ ...formData, polizaSeguro: e.target.value })}
                        placeholder="Número de póliza"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vigenciaSeguro">Vigencia del Seguro</Label>
                      <Input
                        id="vigenciaSeguro"
                        type="date"
                        value={formData.vigenciaSeguro}
                        onChange={(e) => setFormData({ ...formData, vigenciaSeguro: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Comentarios y observaciones */}
                <div className="space-y-4 md:col-span-2">
                  <div className="space-y-2">
                    <Label htmlFor="comentarios">Comentarios</Label>
                    <Textarea
                      id="comentarios"
                      value={formData.comentarios}
                      onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                      placeholder="Comentarios adicionales"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={guardarRemolque} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : editingRemolque ? (
                    "Actualizar Remolque"
                  ) : (
                    "Guardar Remolque"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Remolques</p>
                  <p className="text-2xl font-bold">{remolques.length}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {remolques.filter((r) => r.activo !== false).length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">
                    {remolques.filter((r) => r.estado === "disponible" && r.activo !== false).length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Uso</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {remolques.filter((r) => r.estado === "en-uso" && r.activo !== false).length}
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
                    {remolques.filter((r) => r.estado === "mantenimiento" && r.activo !== false).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
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

        {/* Lista de remolques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {remolquesFiltrados.map((remolque) => (
            <Card key={remolque.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {remolque.numero_economico}
                      {remolque.marca && remolque.modelo && ` - ${remolque.marca} ${remolque.modelo}`}
                    </CardTitle>
                    <CardDescription>
                      {remolque.tipo && `Tipo: ${remolque.tipo}`}
                      {remolque.año && ` • Año: ${remolque.año}`}
                      {remolque.capacidad && ` • Capacidad: ${remolque.capacidad} ton`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Badge de estado activo/inactivo */}
                    <Badge
                      variant={remolque.activo !== false ? "default" : "secondary"}
                      className={
                        remolque.activo !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }
                    >
                      {remolque.activo !== false ? "Activo" : "Inactivo"}
                    </Badge>

                    <Button variant="outline" size="sm" onClick={() => editarRemolque(remolque)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActivarRemolque(remolque.id, remolque.activo !== false)}
                      className={
                        remolque.activo !== false
                          ? "text-red-600 hover:text-red-700"
                          : "text-green-600 hover:text-green-700"
                      }
                    >
                      {remolque.activo !== false ? (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar remolque?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el remolque y todos sus datos
                            asociados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => eliminarRemolque(remolque.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {remolque.placas && (
                    <div>
                      <p className="font-medium">Placas</p>
                      <p className="text-gray-600">{remolque.placas}</p>
                    </div>
                  )}
                  {remolque.numero_serie && (
                    <div>
                      <p className="font-medium">Número de Serie</p>
                      <p className="text-gray-600">{remolque.numero_serie}</p>
                    </div>
                  )}
                  {remolque.fecha_ultima_inspeccion && (
                    <div>
                      <p className="font-medium">Última Inspección</p>
                      <p className="text-gray-600">{new Date(remolque.fecha_ultima_inspeccion).toLocaleDateString()}</p>
                    </div>
                  )}
                  {remolque.proxima_inspeccion && (
                    <div>
                      <p className="font-medium">Próxima Inspección</p>
                      <p className="text-gray-600">{new Date(remolque.proxima_inspeccion).toLocaleDateString()}</p>
                    </div>
                  )}
                  {remolque.poliza_seguro && (
                    <div>
                      <p className="font-medium">Póliza de Seguro</p>
                      <p className="text-gray-600">{remolque.poliza_seguro}</p>
                    </div>
                  )}
                  {remolque.vigencia_seguro && (
                    <div>
                      <p className="font-medium">Vigencia Seguro</p>
                      <p className="text-gray-600">{new Date(remolque.vigencia_seguro).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Alertas de fechas próximas - usando el mismo estilo que tractocamiones */}
                {(() => {
                  const alertas = []
                  const hoy = new Date()

                  // Verificar inspección próxima (7 días)
                  if (remolque.proxima_inspeccion) {
                    const fechaInspeccion = new Date(remolque.proxima_inspeccion)
                    const diasRestantes = Math.ceil((fechaInspeccion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

                    if (diasRestantes <= 7 && diasRestantes >= 0) {
                      alertas.push({
                        tipo: "inspeccion",
                        dias: diasRestantes,
                        vencido: false,
                        fecha: fechaInspeccion.toLocaleDateString(),
                        mensaje: `Inspección vence en ${diasRestantes} días`,
                      })
                    } else if (diasRestantes < 0) {
                      alertas.push({
                        tipo: "inspeccion",
                        dias: Math.abs(diasRestantes),
                        vencido: true,
                        fecha: fechaInspeccion.toLocaleDateString(),
                        mensaje: `Inspección vencida hace ${Math.abs(diasRestantes)} días`,
                      })
                    }
                  }

                  // Verificar seguro próximo a vencer (15 días)
                  if (remolque.vigencia_seguro) {
                    const fechaVencimiento = new Date(remolque.vigencia_seguro)
                    const diasRestantes = Math.ceil(
                      (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
                    )

                    if (diasRestantes <= 15 && diasRestantes >= 0) {
                      alertas.push({
                        tipo: "seguro",
                        dias: diasRestantes,
                        vencido: false,
                        fecha: fechaVencimiento.toLocaleDateString(),
                        mensaje: `Seguro vence en ${diasRestantes} días`,
                      })
                    } else if (diasRestantes < 0) {
                      alertas.push({
                        tipo: "seguro",
                        dias: Math.abs(diasRestantes),
                        vencido: true,
                        fecha: fechaVencimiento.toLocaleDateString(),
                        mensaje: `Seguro vencido hace ${Math.abs(diasRestantes)} días`,
                      })
                    }
                  }

                  return alertas.length > 0 ? (
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
                                {alerta.tipo === "seguro" ? "🛡️ Seguro" : "🔍 Inspección"}
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
                  ) : null
                })()}

                {remolque.comentarios && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Comentarios:</strong> {remolque.comentarios}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Registrado: {new Date(remolque.fecha_registro).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {remolquesFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No se encontraron remolques</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
