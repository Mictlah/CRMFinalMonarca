"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  DialogFooter,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
  CreditCard,
  Heart,
  StampIcon as Passport,
  Zap,
} from "lucide-react"
import { supabase, type Operador } from "@/lib/supabase"

export default function OperadoresPage() {
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOperador, setSelectedOperador] = useState<Operador | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    cargarOperadores()
  }, [])

  const cargarOperadores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("operadores").select("*").order("nombre", { ascending: true })

      if (error) {
        console.error("Error cargando operadores:", error)
        setError("Error al cargar los operadores")
        return
      }

      setOperadores(data || [])
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar los operadores")
    } finally {
      setLoading(false)
    }
  }

  const eliminarOperador = async (id: string) => {
    try {
      const { error } = await supabase.from("operadores").delete().eq("id", id)

      if (error) {
        console.error("Error eliminando operador:", error)
        setError("Error al eliminar el operador")
        return
      }

      // Recargar la lista
      cargarOperadores()
    } catch (error) {
      console.error("Error:", error)
      setError("Error al eliminar el operador")
    }
  }

  const operadoresFiltrados = operadores.filter(
    (operador) =>
      operador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operador.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operador.telefono?.includes(searchTerm) ||
      operador.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return "No especificada"
    return new Date(fecha).toLocaleDateString("es-MX")
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "activo":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactivo":
        return "bg-red-100 text-red-800 border-red-200"
      case "suspendido":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const isDocumentExpired = (fecha: string | undefined) => {
    if (!fecha) return false
    const fechaVencimiento = new Date(fecha)
    const hoy = new Date()
    return fechaVencimiento < hoy
  }

  const isDocumentExpiringSoon = (fecha: string | undefined) => {
    if (!fecha) return false
    const fechaVencimiento = new Date(fecha)
    const hoy = new Date()
    const treintaDias = new Date()
    treintaDias.setDate(hoy.getDate() + 30)
    return fechaVencimiento >= hoy && fechaVencimiento <= treintaDias
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operadores</h1>
            <p className="text-gray-600 mt-1">Gestiona la información de los operadores</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Operador
          </Button>
        </div>

        {/* Barra de búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Grid de tarjetas de operadores */}
        {operadoresFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No se encontraron operadores" : "No hay operadores registrados"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza agregando tu primer operador"}
              </p>
              {!searchTerm && (
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Operador
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operadoresFiltrados.map((operador) => (
              <Card key={operador.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {operador.nombre} {operador.apellidos}
                      </CardTitle>
                      <Badge className={`text-xs ${getEstadoBadgeColor(operador.estado)}`}>{operador.estado}</Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOperador(operador)
                          setShowViewDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar operador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente la información del
                              operador.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => eliminarOperador(operador.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Información de contacto */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Contacto</h4>
                    <div className="space-y-1">
                      {operador.telefono && (
                        <div className="flex items-center text-sm text-blue-700">
                          <Phone className="h-3 w-3 mr-2" />
                          <span>{operador.telefono}</span>
                        </div>
                      )}
                      {operador.email && (
                        <div className="flex items-center text-sm text-blue-700">
                          <Mail className="h-3 w-3 mr-2" />
                          <span className="truncate">{operador.email}</span>
                        </div>
                      )}
                      {operador.direccion && (
                        <div className="flex items-center text-sm text-blue-700">
                          <MapPin className="h-3 w-3 mr-2" />
                          <span className="truncate">{operador.direccion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documentos importantes */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Documentos</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Licencia */}
                      <div className="flex items-center text-xs">
                        <CreditCard className="h-3 w-3 mr-1" />
                        <span className="truncate">
                          {operador.licencia ? (
                            <span
                              className={
                                isDocumentExpired(operador.fecha_vencimiento_licencia)
                                  ? "text-red-600 font-medium"
                                  : isDocumentExpiringSoon(operador.fecha_vencimiento_licencia)
                                    ? "text-yellow-600 font-medium"
                                    : "text-green-600"
                              }
                            >
                              Licencia
                            </span>
                          ) : (
                            <span className="text-gray-400">Sin licencia</span>
                          )}
                        </span>
                      </div>

                      {/* Visa */}
                      <div className="flex items-center text-xs">
                        <Passport className="h-3 w-3 mr-1" />
                        <span className="truncate">
                          {operador.numero_visa ? (
                            <span
                              className={
                                isDocumentExpired(operador.fecha_vencimiento_visa)
                                  ? "text-red-600 font-medium"
                                  : isDocumentExpiringSoon(operador.fecha_vencimiento_visa)
                                    ? "text-yellow-600 font-medium"
                                    : "text-green-600"
                              }
                            >
                              Visa
                            </span>
                          ) : (
                            <span className="text-gray-400">Sin visa</span>
                          )}
                        </span>
                      </div>

                      {/* FAST */}
                      <div className="flex items-center text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        <span className="truncate">
                          {operador.numero_fast ? (
                            <span
                              className={
                                isDocumentExpired(operador.fecha_vencimiento_fast)
                                  ? "text-red-600 font-medium"
                                  : isDocumentExpiringSoon(operador.fecha_vencimiento_fast)
                                    ? "text-yellow-600 font-medium"
                                    : "text-green-600"
                              }
                            >
                              FAST
                            </span>
                          ) : (
                            <span className="text-gray-400">Sin FAST</span>
                          )}
                        </span>
                      </div>

                      {/* Tipo de sangre */}
                      <div className="flex items-center text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        <span className="truncate">
                          {operador.tipo_sangre ? (
                            <span className="text-red-600 font-medium">{operador.tipo_sangre}</span>
                          ) : (
                            <span className="text-gray-400">Sin tipo</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  {operador.observaciones && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-900 mb-1">Observaciones</h4>
                      <p className="text-xs text-yellow-700 line-clamp-2">{operador.observaciones}</p>
                    </div>
                  )}

                  {/* Fecha de registro */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Registrado: {formatearFecha(operador.fecha_registro)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog para ver detalles del operador */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>
                  {selectedOperador?.nombre} {selectedOperador?.apellidos}
                </span>
                <Badge className={`ml-2 ${getEstadoBadgeColor(selectedOperador?.estado || "")}`}>
                  {selectedOperador?.estado}
                </Badge>
              </DialogTitle>
              <DialogDescription>Información completa del operador</DialogDescription>
            </DialogHeader>

            {selectedOperador && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información personal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nombre completo</label>
                      <p className="text-sm">
                        {selectedOperador.nombre} {selectedOperador.apellidos}
                      </p>
                    </div>
                    {selectedOperador.fecha_nacimiento && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Fecha de nacimiento</label>
                        <p className="text-sm">{formatearFecha(selectedOperador.fecha_nacimiento)}</p>
                      </div>
                    )}
                    {selectedOperador.tipo_sangre && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tipo de sangre</label>
                        <p className="text-sm font-medium text-red-600">{selectedOperador.tipo_sangre}</p>
                      </div>
                    )}
                    {selectedOperador.curp && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">CURP</label>
                        <p className="text-sm font-mono">{selectedOperador.curp}</p>
                      </div>
                    )}
                    {selectedOperador.rfc && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">RFC</label>
                        <p className="text-sm font-mono">{selectedOperador.rfc}</p>
                      </div>
                    )}
                    {selectedOperador.nss && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">NSS</label>
                        <p className="text-sm font-mono">{selectedOperador.nss}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Información de contacto */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOperador.telefono && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Teléfono</label>
                        <p className="text-sm">{selectedOperador.telefono}</p>
                      </div>
                    )}
                    {selectedOperador.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm">{selectedOperador.email}</p>
                      </div>
                    )}
                    {selectedOperador.direccion && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Dirección</label>
                        <p className="text-sm">{selectedOperador.direccion}</p>
                      </div>
                    )}
                    {selectedOperador.telefono_emergencia && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Teléfono de emergencia</label>
                        <p className="text-sm">{selectedOperador.telefono_emergencia}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Documentos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOperador.licencia && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Licencia</label>
                        <p className="text-sm">{selectedOperador.licencia}</p>
                        {selectedOperador.fecha_vencimiento_licencia && (
                          <p
                            className={`text-xs ${
                              isDocumentExpired(selectedOperador.fecha_vencimiento_licencia)
                                ? "text-red-600"
                                : isDocumentExpiringSoon(selectedOperador.fecha_vencimiento_licencia)
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            Vence: {formatearFecha(selectedOperador.fecha_vencimiento_licencia)}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedOperador.numero_visa && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Visa</label>
                        <p className="text-sm">{selectedOperador.numero_visa}</p>
                        {selectedOperador.fecha_vencimiento_visa && (
                          <p
                            className={`text-xs ${
                              isDocumentExpired(selectedOperador.fecha_vencimiento_visa)
                                ? "text-red-600"
                                : isDocumentExpiringSoon(selectedOperador.fecha_vencimiento_visa)
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            Vence: {formatearFecha(selectedOperador.fecha_vencimiento_visa)}
                          </p>
                        )}
                      </div>
                    )}
                    {selectedOperador.numero_fast && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">FAST</label>
                        <p className="text-sm">{selectedOperador.numero_fast}</p>
                        {selectedOperador.fecha_vencimiento_fast && (
                          <p
                            className={`text-xs ${
                              isDocumentExpired(selectedOperador.fecha_vencimiento_fast)
                                ? "text-red-600"
                                : isDocumentExpiringSoon(selectedOperador.fecha_vencimiento_fast)
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            Vence: {formatearFecha(selectedOperador.fecha_vencimiento_fast)}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Observaciones */}
                {selectedOperador.observaciones && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Observaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{selectedOperador.observaciones}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Cerrar
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
