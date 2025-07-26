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
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, Building, Download, X, Settings, User } from "lucide-react"
import { useState, useEffect } from "react"
import {
  supabase,
  type Cliente,
  obtenerContactosCliente,
  guardarContactosCliente,
  type ContactoCliente,
} from "@/lib/supabase"

interface FormaFacturacion {
  id: string
  nombre: string
  descripcion: string
}

export default function ClientesPage() {
  const [showForm, setShowForm] = useState(false)
  const [showFacturacionConfig, setShowFacturacionConfig] = useState(false)
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [activeTab, setActiveTab] = useState("general")

  // Estado del formulario principal
  const [formData, setFormData] = useState({
    nombre_comercial: "",
    rfc: "",
    direccion: "",
    correo_contacto: "",
    telefono: "",
    forma_facturacion: "",
    divisa_pago: "",
    empresa_facturadora: "",
  })

  // Estado para contactos múltiples (usando la nueva tabla)
  const [contactos, setContactos] = useState<ContactoCliente[]>([
    {
      id: "temp-1",
      cliente_id: "",
      nombre: "",
      telefono: "",
      email: "",
      puesto: "",
      es_principal: true,
      activo: true,
      fecha_creacion: "",
      updated_at: "",
    },
  ])

  // Estado para formas de facturación
  const [formasFacturacion, setFormasFacturacion] = useState<FormaFacturacion[]>([
    { id: "1", nombre: "Tradicional", descripcion: "Factura física" },
    { id: "2", nombre: "Electrónica", descripcion: "CFDI 4.0" },
    { id: "3", nombre: "Complemento", descripcion: "Complemento de pago" },
  ])

  const [nuevaFormaFacturacion, setNuevaFormaFacturacion] = useState({
    nombre: "",
    descripcion: "",
  })

  const [clientes, setClientes] = useState<Cliente[]>([])

  // Función para truncar texto
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + "..."
  }

  // Cargar clientes desde Supabase
  const cargarClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .in("estado", ["activo", "inactivo"])
        .order("fecha_registro", { ascending: false })

      if (error) {
        console.error("Error cargando clientes:", error)
        alert("Error al cargar clientes")
        return
      }

      setClientes(data || [])
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const limpiarFormulario = () => {
    setFormData({
      nombre_comercial: "",
      rfc: "",
      direccion: "",
      correo_contacto: "",
      telefono: "",
      forma_facturacion: "",
      divisa_pago: "",
      empresa_facturadora: "",
    })
    setContactos([
      {
        id: "temp-1",
        cliente_id: "",
        nombre: "",
        telefono: "",
        email: "",
        puesto: "",
        es_principal: true,
        activo: true,
        fecha_creacion: "",
        updated_at: "",
      },
    ])
    setEditingClient(null)
    setActiveTab("general")
  }

  // Funciones para manejar contactos
  const agregarContacto = () => {
    const nuevoContacto: ContactoCliente = {
      id: `temp-${Date.now()}`,
      cliente_id: "",
      nombre: "",
      telefono: "",
      email: "",
      puesto: "",
      es_principal: false,
      activo: true,
      fecha_creacion: "",
      updated_at: "",
    }
    setContactos([...contactos, nuevoContacto])
  }

  const eliminarContacto = (id: string) => {
    if (contactos.length > 1) {
      setContactos(contactos.filter((contacto) => contacto.id !== id))
    }
  }

  const actualizarContacto = (id: string, campo: keyof ContactoCliente, valor: string) => {
    setContactos(contactos.map((contacto) => (contacto.id === id ? { ...contacto, [campo]: valor } : contacto)))
  }

  // Funciones para manejar formas de facturación
  const agregarFormaFacturacion = () => {
    if (nuevaFormaFacturacion.nombre.trim()) {
      const nuevaForma: FormaFacturacion = {
        id: Date.now().toString(),
        nombre: nuevaFormaFacturacion.nombre,
        descripcion: nuevaFormaFacturacion.descripcion,
      }
      setFormasFacturacion([...formasFacturacion, nuevaForma])
      setNuevaFormaFacturacion({ nombre: "", descripcion: "" })
    }
  }

  const eliminarFormaFacturacion = (id: string) => {
    setFormasFacturacion(formasFacturacion.filter((forma) => forma.id !== id))
  }

  const guardarCliente = async () => {
    // Validar campos obligatorios
    if (!formData.nombre_comercial.trim() || !formData.rfc.trim()) {
      alert("Por favor completa los campos obligatorios: Nombre Comercial y RFC")
      return
    }

    // Validar longitud de campos con mensajes más específicos
    if (formData.nombre_comercial.length > 100) {
      alert(
        `El nombre comercial es demasiado largo (${formData.nombre_comercial.length} caracteres). Máximo permitido: 100 caracteres`,
      )
      return
    }

    if (formData.rfc.length > 13) {
      alert(`El RFC es demasiado largo (${formData.rfc.length} caracteres). Máximo permitido: 13 caracteres`)
      return
    }

    if (formData.direccion && formData.direccion.length > 200) {
      alert(
        `La dirección es demasiado larga (${formData.direccion.length} caracteres). Máximo permitido: 200 caracteres`,
      )
      return
    }

    if (formData.correo_contacto && formData.correo_contacto.length > 100) {
      alert(
        `El correo es demasiado largo (${formData.correo_contacto.length} caracteres). Máximo permitido: 100 caracteres`,
      )
      return
    }

    if (formData.telefono && formData.telefono.length > 15) {
      alert(`El teléfono es demasiado largo (${formData.telefono.length} caracteres). Máximo permitido: 15 caracteres`)
      return
    }

    // Validar que al menos un contacto tenga información
    const contactosValidos = contactos.filter((c) => c.nombre.trim() || c.telefono.trim() || c.email.trim())
    if (contactosValidos.length === 0) {
      alert("Por favor agrega al menos un contacto con información")
      return
    }

    try {
      setSaving(true)

      const clienteData = {
        nombre: formData.nombre_comercial.substring(0, 100), // Asegurar máximo 100 caracteres
        rfc: formData.rfc.toUpperCase().substring(0, 13),
        direccion: formData.direccion ? formData.direccion.substring(0, 200) : null,
        email: formData.correo_contacto ? formData.correo_contacto.substring(0, 100) : null,
        telefono: formData.telefono ? formData.telefono.substring(0, 15) : null,
        estado: "activo",
        divisa_pago: formData.divisa_pago || null,
        empresa_facturadora: formData.empresa_facturadora || null,
      }

      // Después de guardar el cliente exitosamente, guardar los contactos
      if (editingClient) {
        // Actualizar cliente existente
        const { error } = await supabase
          .from("clientes")
          .update({
            ...clienteData,
            forma_facturacion: formData.forma_facturacion || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingClient.id)

        if (error) {
          console.error("Error actualizando cliente:", error)
          alert("Error al actualizar cliente")
          return
        }

        // Guardar contactos en la nueva tabla
        const contactosGuardados = await guardarContactosCliente(editingClient.id, contactos)
        if (!contactosGuardados) {
          alert("Cliente actualizado, pero hubo un error guardando los contactos")
        }
      } else {
        // Crear nuevo cliente
        const { data: nuevoCliente, error } = await supabase
          .from("clientes")
          .insert({
            ...clienteData,
            forma_facturacion: formData.forma_facturacion || null,
          })
          .select()
          .single()

        if (error) {
          console.error("Error creando cliente:", error)
          alert("Error al crear cliente")
          return
        }

        // Guardar contactos en la nueva tabla
        const contactosGuardados = await guardarContactosCliente(nuevoCliente.id, contactos)
        if (!contactosGuardados) {
          alert("Cliente creado, pero hubo un error guardando los contactos")
        }
      }

      alert(editingClient ? "Cliente actualizado exitosamente" : "Cliente creado exitosamente")
      limpiarFormulario()
      setShowForm(false)
      await cargarClientes()
    } catch (error) {
      console.error("Error guardando cliente:", error)
      alert("Error al guardar cliente")
    } finally {
      setSaving(false)
    }
  }

  // Función para debug - puedes llamarla desde la consola del navegador
  const debugCliente = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId)
    if (cliente) {
      console.log("Información del cliente:", cliente)
      console.log("Campo empresa:", cliente.empresa)
    }
  }

  // Hacer la función disponible globalmente para debug
  if (typeof window !== "undefined") {
    ;(window as any).debugCliente = debugCliente
  }

  const editarCliente = async (cliente: Cliente) => {
    setFormData({
      nombre_comercial: cliente.nombre,
      rfc: cliente.rfc || "",
      direccion: cliente.direccion || "",
      correo_contacto: cliente.email || "",
      telefono: cliente.telefono || "",
      forma_facturacion: cliente.forma_facturacion || "",
      divisa_pago: cliente.divisa_pago || "",
      empresa_facturadora: cliente.empresa_facturadora || "",
    })

    // Cargar contactos desde la nueva tabla
    try {
      const contactosCliente = await obtenerContactosCliente(cliente.id)
      if (contactosCliente.length > 0) {
        setContactos(contactosCliente)
      } else {
        // Si no hay contactos, mantener uno vacío
        setContactos([
          {
            id: "temp-1",
            cliente_id: cliente.id,
            nombre: "",
            telefono: "",
            email: "",
            puesto: "",
            es_principal: true,
            activo: true,
            fecha_creacion: "",
            updated_at: "",
          },
        ])
      }
    } catch (error) {
      console.error("Error cargando contactos:", error)
      setContactos([
        {
          id: "temp-1",
          cliente_id: cliente.id,
          nombre: "",
          telefono: "",
          email: "",
          puesto: "",
          es_principal: true,
          activo: true,
          fecha_creacion: "",
          updated_at: "",
        },
      ])
    }

    setEditingClient(cliente)
    setShowForm(true)
  }

  const eliminarCliente = async (id: string) => {
    try {
      setDeleteLoading(true)

      const { data: embarquesAsociados, error: errorConsulta } = await supabase
        .from("embarques")
        .select("id")
        .eq("cliente_id", id)
        .limit(1)

      if (errorConsulta) {
        console.error("Error verificando embarques asociados:", errorConsulta)
        alert("Error al verificar embarques asociados")
        return
      }

      if (embarquesAsociados && embarquesAsociados.length > 0) {
        const { error: errorUpdate } = await supabase
          .from("clientes")
          .update({
            estado: "eliminado",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (errorUpdate) {
          console.error("Error marcando cliente como eliminado:", errorUpdate)
          alert("Error al eliminar cliente")
          return
        }

        alert("Cliente marcado como eliminado. No se puede eliminar completamente porque tiene embarques asociados.")
      } else {
        const { error: errorDelete } = await supabase.from("clientes").delete().eq("id", id)

        if (errorDelete) {
          console.error("Error eliminando cliente:", errorDelete)
          alert("Error al eliminar cliente")
          return
        }

        alert("Cliente eliminado exitosamente")
      }

      await cargarClientes()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar la eliminación del cliente")
    } finally {
      setDeleteLoading(false)
    }
  }

  const cambiarEstadoCliente = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Error cambiando estado del cliente:", error)
        alert("Error al cambiar estado del cliente")
        return
      }

      await cargarClientes()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cambiar estado del cliente")
    }
  }

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.rfc && cliente.rfc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const descargarClientesExcel = () => {
    if (clientes.length === 0) {
      alert("No hay clientes para descargar")
      return
    }

    const headers = ["Nombre Comercial", "RFC", "Teléfono", "Email", "Dirección", "Estado", "Fecha Registro"]

    const csvContent = [
      headers.join(","),
      ...clientes.map((cliente) =>
        [
          `"${cliente.nombre}"`,
          `"${cliente.rfc || ""}"`,
          `"${cliente.telefono || ""}"`,
          `"${cliente.email || ""}"`,
          `"${cliente.direccion || ""}"`,
          `"${cliente.estado}"`,
          `"${cliente.fecha_registro}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `clientes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const verDetallesCliente = (cliente: Cliente) => {
    setSelectedClient(cliente)
    setShowDetailModal(true)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando clientes...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-600 mt-2">Administrar información de clientes</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={descargarClientesExcel} disabled={clientes.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => limpiarFormulario()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
                  <DialogDescription>Completa la información del cliente</DialogDescription>
                </DialogHeader>

                <div className="w-full">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab("general")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "general"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Información General
                      </button>
                      <button
                        onClick={() => setActiveTab("contactos")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "contactos"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Contactos
                      </button>
                      <button
                        onClick={() => setActiveTab("facturacion")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "facturacion"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Facturación y Pagos
                      </button>
                    </nav>
                  </div>

                  <div className="mt-6">
                    {/* Pestaña Información General */}
                    {activeTab === "general" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Información General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nombre_comercial">Nombre Comercial *</Label>
                            <Input
                              id="nombre_comercial"
                              value={formData.nombre_comercial}
                              onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                              placeholder="Nombre comercial del cliente"
                              maxLength={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rfc">RFC *</Label>
                            <Input
                              id="rfc"
                              value={formData.rfc}
                              onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                              placeholder="RFC del cliente"
                              maxLength={13}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="direccion">Dirección</Label>
                          <Textarea
                            id="direccion"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            placeholder="Dirección completa"
                            rows={2}
                            maxLength={200}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="correo_contacto">Correo de Contacto</Label>
                            <Input
                              id="correo_contacto"
                              type="email"
                              value={formData.correo_contacto}
                              onChange={(e) => setFormData({ ...formData, correo_contacto: e.target.value })}
                              placeholder="correo@empresa.com"
                              maxLength={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                              id="telefono"
                              value={formData.telefono}
                              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                              placeholder="55-1234-5678"
                              maxLength={20}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pestaña Contactos */}
                    {activeTab === "contactos" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Contactos (máximo 5)</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={agregarContacto}
                            disabled={contactos.length >= 5}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Contacto
                          </Button>
                        </div>

                        {contactos.map((contacto, index) => (
                          <Card key={contacto.id} className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Contacto {index + 1}
                              </h4>
                              {contactos.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarContacto(contacto.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label>Nombre del Contacto</Label>
                                <Input
                                  value={contacto.nombre}
                                  onChange={(e) => actualizarContacto(contacto.id, "nombre", e.target.value)}
                                  placeholder="Nombre completo"
                                  maxLength={100}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Puesto/Cargo</Label>
                                <Input
                                  value={contacto.puesto || ""}
                                  onChange={(e) => actualizarContacto(contacto.id, "puesto", e.target.value)}
                                  placeholder="Gerente, Coordinador, etc."
                                  maxLength={50}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Teléfono del Contacto</Label>
                                <Input
                                  value={contacto.telefono || ""}
                                  onChange={(e) => actualizarContacto(contacto.id, "telefono", e.target.value)}
                                  placeholder="55-1234-5678"
                                  maxLength={15}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Correo del Contacto</Label>
                                <Input
                                  type="email"
                                  value={contacto.email || ""}
                                  onChange={(e) => actualizarContacto(contacto.id, "email", e.target.value)}
                                  placeholder="contacto@empresa.com"
                                  maxLength={100}
                                />
                              </div>
                            </div>

                            {/* Indicador de contacto principal */}
                            {contacto.es_principal && (
                              <div className="flex items-center mt-2">
                                <Badge variant="default" className="text-xs">
                                  Contacto Principal
                                </Badge>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Pestaña Facturación y Pagos */}
                    {activeTab === "facturacion" && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Configuración de Facturación y Pagos</h3>

                        {/* Divisa de Pago */}
                        <Card className="p-4">
                          <h4 className="font-medium mb-3 flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Divisa de Pago Preferida
                          </h4>
                          <div className="space-y-2">
                            <Label htmlFor="divisa_pago">Seleccionar Divisa</Label>
                            <Select
                              value={formData.divisa_pago}
                              onValueChange={(value) => setFormData({ ...formData, divisa_pago: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar divisa de pago" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MXN">🇲🇽 Pesos Mexicanos (MXN)</SelectItem>
                                <SelectItem value="USD">🇺🇸 Dólares Americanos (USD)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </Card>

                        {/* Empresa Facturadora */}
                        <Card className="p-4">
                          <h4 className="font-medium mb-3 flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Empresa Facturadora
                          </h4>
                          <div className="space-y-2">
                            <Label htmlFor="empresa_facturadora">Seleccionar Empresa que Factura</Label>
                            <Select
                              value={formData.empresa_facturadora}
                              onValueChange={(value) => setFormData({ ...formData, empresa_facturadora: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar empresa facturadora" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="JOSE_FERNANDO_CABARJO">🇲🇽 José Fernando Cabarjo</SelectItem>
                                <SelectItem value="MONARCH_INTERNATIONAL">
                                  🇺🇸 Monarch International Transport Inc
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Esta configuración determina qué empresa aparecerá como emisor en las facturas del cliente.
                          </p>
                        </Card>

                        {/* Forma de Facturación */}
                        <Card className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              Forma de Facturación
                            </h4>
                            <Dialog open={showFacturacionConfig} onOpenChange={setShowFacturacionConfig}>
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline" size="sm">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Configurar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Configurar Formas de Facturación</DialogTitle>
                                  <DialogDescription>
                                    Agrega, modifica o elimina las formas de facturación disponibles
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                  {/* Agregar nueva forma */}
                                  <Card className="p-4">
                                    <h4 className="font-medium mb-3">Agregar Nueva Forma</h4>
                                    <div className="space-y-3">
                                      <div className="space-y-2">
                                        <Label>Nombre</Label>
                                        <Input
                                          value={nuevaFormaFacturacion.nombre}
                                          onChange={(e) =>
                                            setNuevaFormaFacturacion({
                                              ...nuevaFormaFacturacion,
                                              nombre: e.target.value,
                                            })
                                          }
                                          placeholder="Ej: Global"
                                          maxLength={20}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Descripción</Label>
                                        <Input
                                          value={nuevaFormaFacturacion.descripcion}
                                          onChange={(e) =>
                                            setNuevaFormaFacturacion({
                                              ...nuevaFormaFacturacion,
                                              descripcion: e.target.value,
                                            })
                                          }
                                          placeholder="Descripción breve"
                                          maxLength={30}
                                        />
                                      </div>
                                      <Button type="button" onClick={agregarFormaFacturacion}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar
                                      </Button>
                                    </div>
                                  </Card>

                                  {/* Lista de formas existentes */}
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Formas Existentes</h4>
                                    {formasFacturacion.map((forma) => (
                                      <div
                                        key={forma.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div>
                                          <p className="font-medium">{forma.nombre}</p>
                                          <p className="text-sm text-gray-600">{forma.descripcion}</p>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => eliminarFormaFacturacion(forma.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="forma_facturacion">Seleccionar Forma de Facturación</Label>
                            <Select
                              value={formData.forma_facturacion}
                              onValueChange={(value) => setFormData({ ...formData, forma_facturacion: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar forma de facturación" />
                              </SelectTrigger>
                              <SelectContent>
                                {formasFacturacion.map((forma) => (
                                  <SelectItem key={forma.id} value={forma.nombre}>
                                    {forma.nombre} - {forma.descripcion}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
                    <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button onClick={guardarCliente} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : editingClient ? (
                        "Actualizar Cliente"
                      ) : (
                        "Guardar Cliente"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre comercial, RFC o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{cliente.nombre}</CardTitle>
                    <CardDescription>{cliente.rfc && `RFC: ${cliente.rfc}`}</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => verDetallesCliente(cliente)}>
                      Ver Detalles
                    </Button>
                    <Button
                      variant={cliente.estado === "activo" ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        cambiarEstadoCliente(cliente.id, cliente.estado === "activo" ? "inactivo" : "activo")
                      }
                      className={cliente.estado === "inactivo" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                    >
                      {cliente.estado === "activo" ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => eliminarCliente(cliente.id)}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm text-gray-700">RFC:</span>
                      <span className="text-sm">{cliente.rfc || "No especificado"}</span>
                    </div>

                    {cliente.telefono && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm text-gray-700">Teléfono:</span>
                        <span className="text-sm">{cliente.telefono}</span>
                      </div>
                    )}

                    {cliente.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-sm text-gray-700">Email:</span>
                        <span className="text-sm break-all">{cliente.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {cliente.direccion && (
                      <div className="flex items-start space-x-2">
                        <Building className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div>
                          <span className="font-medium text-sm text-gray-700 block">Dirección:</span>
                          <span className="text-sm text-gray-600">{cliente.direccion}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium text-sm text-gray-700">Estado:</span>
                      <Badge
                        variant={
                          cliente.estado === "activo"
                            ? "default"
                            : cliente.estado === "inactivo"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {cliente.estado}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                {cliente.empresa && (
                  <div className="border-t pt-3">
                    <div className="flex items-start space-x-2">
                      <Users className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-medium text-sm text-gray-700 block">Información adicional:</span>
                        <div className="mt-2 space-y-2">
                          {(() => {
                            try {
                              // Extraer información de facturación
                              const factMatch = cliente.empresa.match(/FACT:([^|]+)/)
                              const facturacion = factMatch ? factMatch[1].trim() : null

                              // Extraer contactos
                              const contactosMatch = cliente.empresa.match(/C\d+:[^;]+(;C\d+:[^;]+)*/g)
                              const contactos = contactosMatch
                                ? contactosMatch[0]
                                    .split(";")
                                    .map((contactoStr, index) => {
                                      const match = contactoStr.match(/C\d+:([^|]*)\|([^|]*)\|(.*)/)
                                      if (match) {
                                        return {
                                          nombre: match[1] || "",
                                          telefono: match[2] || "",
                                          email: match[3] || "",
                                        }
                                      }
                                      return null
                                    })
                                    .filter(Boolean)
                                : []

                              return (
                                <div className="space-y-2">
                                  {facturacion && (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span className="text-xs text-gray-600">
                                        <span className="font-medium">Facturación:</span> {facturacion}
                                      </span>
                                    </div>
                                  )}

                                  {contactos.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs font-medium text-gray-700">Contactos:</span>
                                      </div>
                                      <div className="ml-4 space-y-1">
                                        {contactos.map((contacto, index) => (
                                          <div key={index} className="text-xs text-gray-600">
                                            {contacto.nombre && (
                                              <div className="flex items-center space-x-1">
                                                <span className="font-medium">{contacto.nombre}</span>
                                                {contacto.telefono && (
                                                  <span className="text-gray-500">• {contacto.telefono}</span>
                                                )}
                                                {contacto.email && (
                                                  <span className="text-gray-500">• {contacto.email}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            } catch (error) {
                              // Si hay error parseando, mostrar el texto original
                              return <span className="text-xs text-gray-600 break-words">{cliente.empresa}</span>
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer con fecha */}
                <div className="border-t pt-3 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Registrado:</span>{" "}
                    {new Date(cliente.fecha_registro).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {cliente.updated_at && (
                    <div className="text-xs text-gray-400">
                      <span className="font-medium">Actualizado:</span>{" "}
                      {new Date(cliente.updated_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clientesFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No se encontraron clientes</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>}
            </CardContent>
          </Card>
        )}
        {/* Modal de Detalles del Cliente */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles Completos del Cliente</DialogTitle>
              <DialogDescription>Información completa y comentarios del cliente seleccionado</DialogDescription>
            </DialogHeader>

            {selectedClient && (
              <div className="space-y-4">
                {/* Pestañas de navegación */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab("general")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "general"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Información General
                    </button>
                    <button
                      onClick={() => setActiveTab("contactos")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "contactos"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Contactos
                    </button>
                    <button
                      onClick={() => setActiveTab("facturacion")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "facturacion"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Facturación y Pagos
                    </button>
                    <button
                      onClick={() => setActiveTab("sistema")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "sistema"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Sistema
                    </button>
                  </nav>
                </div>

                {/* Contenido de las pestañas */}
                <div className="mt-6">
                  {/* Pestaña Información General */}
                  {activeTab === "general" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Building className="h-5 w-5 mr-2 text-blue-600" />
                          Información General
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Nombre Comercial</Label>
                            <p className="text-sm bg-gray-50 p-3 rounded border">{selectedClient.nombre}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">RFC</Label>
                            <p className="text-sm bg-gray-50 p-3 rounded border">
                              {selectedClient.rfc || "No especificado"}
                            </p>
                          </div>
                        </div>

                        {selectedClient.direccion && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Dirección</Label>
                            <p className="text-sm bg-gray-50 p-3 rounded border">{selectedClient.direccion}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedClient.telefono && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Teléfono Principal</Label>
                              <p className="text-sm bg-gray-50 p-3 rounded border">{selectedClient.telefono}</p>
                            </div>
                          )}
                          {selectedClient.email && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Email Principal</Label>
                              <p className="text-sm bg-gray-50 p-3 rounded border break-all">{selectedClient.email}</p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Estado</Label>
                            <div className="mt-1">
                              <Badge
                                variant={
                                  selectedClient.estado === "activo"
                                    ? "default"
                                    : selectedClient.estado === "inactivo"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {selectedClient.estado}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Fecha de Registro</Label>
                            <p className="text-sm bg-gray-50 p-3 rounded border">
                              {new Date(selectedClient.fecha_registro).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pestaña Contactos */}
                  {activeTab === "contactos" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="h-5 w-5 mr-2 text-green-600" />
                          Contactos Registrados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          try {
                            // Extraer contactos del campo empresa
                            const contactosMatch = selectedClient.empresa?.match(/C\d+:[^;]+(;C\d+:[^;]+)*/g)
                            const contactos = contactosMatch
                              ? contactosMatch[0]
                                  .split(";")
                                  .map((contactoStr, index) => {
                                    const match = contactoStr.match(/C\d+:([^|]*)\|([^|]*)\|(.*)/)
                                    if (match) {
                                      return {
                                        nombre: match[1] || "",
                                        telefono: match[2] || "",
                                        email: match[3] || "",
                                      }
                                    }
                                    return null
                                  })
                                  .filter(Boolean)
                              : []

                            if (contactos.length > 0) {
                              return (
                                <div className="space-y-4">
                                  {contactos.map((contacto, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded border">
                                      <div className="flex items-center mb-3">
                                        <User className="h-4 w-4 mr-2 text-gray-600" />
                                        <span className="font-medium text-sm">Contacto {index + 1}</span>
                                        {index === 0 && (
                                          <Badge variant="default" className="ml-2 text-xs">
                                            Principal
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {contacto.nombre && (
                                          <div>
                                            <Label className="text-xs font-medium text-gray-600">Nombre</Label>
                                            <p className="text-sm bg-white p-2 rounded border">{contacto.nombre}</p>
                                          </div>
                                        )}
                                        {contacto.telefono && (
                                          <div>
                                            <Label className="text-xs font-medium text-gray-600">Teléfono</Label>
                                            <p className="text-sm bg-white p-2 rounded border">{contacto.telefono}</p>
                                          </div>
                                        )}
                                        {contacto.email && (
                                          <div>
                                            <Label className="text-xs font-medium text-gray-600">Email</Label>
                                            <p className="text-sm bg-white p-2 rounded border break-all">
                                              {contacto.email}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            } else {
                              return (
                                <div className="text-center py-8">
                                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                  <p className="text-gray-500">No hay contactos registrados</p>
                                  <p className="text-sm text-gray-400 mt-1">
                                    Los contactos se pueden agregar al editar el cliente
                                  </p>
                                </div>
                              )
                            }
                          } catch (error) {
                            return (
                              <div className="text-center py-8">
                                <p className="text-gray-500">Error al cargar contactos</p>
                              </div>
                            )
                          }
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {/* Pestaña Facturación y Pagos */}
                  {activeTab === "facturacion" && (
                    <div className="space-y-6">
                      {/* Divisa de Pago */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Building className="h-5 w-5 mr-2 text-purple-600" />
                            Configuración de Pagos
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Divisa de Pago Preferida</Label>
                              <p className="text-sm bg-gray-50 p-3 rounded border">
                                {selectedClient.divisa_pago === "USD"
                                  ? "🇺🇸 Dólares Americanos (USD)"
                                  : selectedClient.divisa_pago === "MXN"
                                    ? "🇲🇽 Pesos Mexicanos (MXN)"
                                    : "No especificado"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Empresa Facturadora</Label>
                              <p className="text-sm bg-gray-50 p-3 rounded border">
                                {selectedClient.empresa_facturadora === "JOSE_FERNANDO_CABARJO"
                                  ? "🇲🇽 José Fernando Cabarjo"
                                  : selectedClient.empresa_facturadora === "MONARCH_INTERNATIONAL"
                                    ? "🇺🇸 Monarch International Transport Inc"
                                    : "No especificado"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Forma de Facturación */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Settings className="h-5 w-5 mr-2 text-orange-600" />
                            Configuración de Facturación
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Forma de Facturación</Label>
                            <p className="text-sm bg-gray-50 p-3 rounded border">
                              {selectedClient.forma_facturacion || "No especificado"}
                            </p>
                          </div>

                          {/* Información adicional de facturación del campo empresa */}
                          {(() => {
                            try {
                              const factMatch = selectedClient.empresa?.match(/FACT:([^|]+)/)
                              const facturacion = factMatch ? factMatch[1].trim() : null

                              if (facturacion && facturacion !== selectedClient.forma_facturacion) {
                                return (
                                  <div className="mt-4">
                                    <Label className="text-sm font-medium text-gray-700">
                                      Información Adicional de Facturación
                                    </Label>
                                    <p className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                                      {facturacion}
                                    </p>
                                  </div>
                                )
                              }
                            } catch (error) {
                              return null
                            }
                            return null
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Pestaña Sistema */}
                  {activeTab === "sistema" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Settings className="h-5 w-5 mr-2 text-gray-600" />
                          Información del Sistema
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">ID del Cliente</Label>
                            <p className="text-sm font-mono bg-gray-100 p-3 rounded border">{selectedClient.id}</p>
                          </div>
                          {selectedClient.updated_at && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Última Actualización</Label>
                              <p className="text-sm bg-gray-50 p-3 rounded border">
                                {new Date(selectedClient.updated_at).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Información completa del campo empresa para debug */}
                        {selectedClient.empresa && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Datos Completos (Campo Empresa)</Label>
                            <div className="text-xs bg-gray-100 p-3 rounded border font-mono break-all max-h-32 overflow-y-auto">
                              {selectedClient.empresa}
                            </div>
                          </div>
                        )}

                        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                          <h4 className="text-sm font-medium text-yellow-800 mb-2">Información para Desarrolladores</h4>
                          <p className="text-xs text-yellow-700">
                            Para debug en consola del navegador, ejecuta:{" "}
                            <code>debugCliente('{selectedClient.id}')</code>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Cerrar
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailModal(false)
                        editarCliente(selectedClient)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modificar Información
                    </Button>
                    <Button
                      variant={selectedClient.estado === "activo" ? "outline" : "default"}
                      onClick={() => {
                        cambiarEstadoCliente(
                          selectedClient.id,
                          selectedClient.estado === "activo" ? "inactivo" : "activo",
                        )
                        setShowDetailModal(false)
                      }}
                      className={
                        selectedClient.estado === "inactivo" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""
                      }
                    >
                      {selectedClient.estado === "activo" ? "Desactivar Cliente" : "Activar Cliente"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
