"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  Users,
  Truck,
  Container,
  Bell,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { obtenerEmbarques, obtenerRecordatorios } from "@/lib/supabase"

export function Dashboard() {
  const [embarquesRecientes, setEmbarquesRecientes] = useState([])
  const [recordatoriosUrgentes, setRecordatoriosUrgentes] = useState([])
  const [stats, setStats] = useState({
    embarques: { total: 0, creados: 0, asignados: 0, enTransito: 0, entregados: 0 },
    operadores: { total: 0, activos: 0, inactivos: 0, suspendidos: 0 },
    camiones: { total: 0, optima: 0, noOptima: 0, fueraServicio: 0 },
    remolques: { total: 0, disponibles: 0, enUso: 0, mantenimiento: 0 },
    recordatorios: { total: 0, pendientes: 0, vencidos: 0, completados: 0 },
  })

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar últimos 5 embarques creados
        const { data: embarques } = await obtenerEmbarques()
        const embarquesOrdenados =
          embarques
            ?.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
            ?.slice(0, 5) || []
        setEmbarquesRecientes(embarquesOrdenados)

        // Cargar recordatorios urgentes (vencidos o próximos a vencer)
        const { data: recordatorios } = await obtenerRecordatorios()
        const hoy = new Date()
        const en7Dias = new Date()
        en7Dias.setDate(hoy.getDate() + 7)

        const recordatoriosUrgentes =
          recordatorios
            ?.filter((r) => {
              const fechaVencimiento = new Date(r.fecha_vencimiento)
              return fechaVencimiento <= en7Dias && r.estado !== "completado"
            })
            ?.sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())
            ?.slice(0, 5) || []
        setRecordatoriosUrgentes(recordatoriosUrgentes)

        // Calcular estadísticas
        const statsEmbarques = {
          total: embarques?.length || 0,
          creados: embarques?.filter((e) => e.estado === "creado")?.length || 0,
          asignados: embarques?.filter((e) => e.estado === "listo-para-asignar")?.length || 0,
          enTransito: embarques?.filter((e) => e.estado === "en-transito")?.length || 0,
          entregados: embarques?.filter((e) => e.estado === "entregado")?.length || 0,
        }

        const statsRecordatorios = {
          total: recordatorios?.length || 0,
          pendientes: recordatorios?.filter((r) => r.estado === "pendiente")?.length || 0,
          vencidos:
            recordatorios?.filter((r) => {
              const fechaVencimiento = new Date(r.fecha_vencimiento)
              return fechaVencimiento < hoy && r.estado !== "completado"
            })?.length || 0,
          completados: recordatorios?.filter((r) => r.estado === "completado")?.length || 0,
        }

        setStats((prevStats) => ({
          ...prevStats,
          embarques: statsEmbarques,
          recordatorios: statsRecordatorios,
        }))
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error)
      }
    }

    cargarDatos()
  }, [])

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "creado":
        return <Badge className="bg-blue-100 text-blue-800">Creado</Badge>
      case "asignado":
        return <Badge className="bg-yellow-100 text-yellow-800">Asignado</Badge>
      case "en-transito":
        return <Badge className="bg-orange-100 text-orange-800">En Tránsito</Badge>
      case "entregado":
        return <Badge className="bg-green-100 text-green-800">Entregado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>
      case "media":
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>
      case "baja":
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>
      default:
        return <Badge variant="outline">{prioridad}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Embarques</p>
                <p className="text-2xl font-bold">{stats.embarques.total}</p>
                <p className="text-xs text-gray-500">
                  {stats.embarques.creados} creados • {stats.embarques.asignados} asignados
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
                <p className="text-sm font-medium text-gray-600">Operadores</p>
                <p className="text-2xl font-bold">{stats.operadores.total}</p>
                <p className="text-xs text-gray-500">
                  {stats.operadores.activos} activos • {stats.operadores.inactivos} inactivos
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Camiones</p>
                <p className="text-2xl font-bold">{stats.camiones.total}</p>
                <p className="text-xs text-gray-500">
                  {stats.camiones.optima} óptimos • {stats.camiones.noOptima} no óptimos
                </p>
              </div>
              <Truck className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remolques</p>
                <p className="text-2xl font-bold">{stats.remolques.total}</p>
                <p className="text-xs text-gray-500">
                  {stats.remolques.disponibles} disponibles • {stats.remolques.enUso} en uso
                </p>
              </div>
              <Container className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recordatorios</p>
                <p className="text-2xl font-bold">{stats.recordatorios.total}</p>
                <p className="text-xs text-gray-500">
                  {stats.recordatorios.pendientes} pendientes • {stats.recordatorios.vencidos} vencidos
                </p>
              </div>
              <Bell className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de embarques y recordatorios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embarques recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Embarques Recientes</CardTitle>
            <Link href="/embarques">
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {embarquesRecientes.map((embarque) => (
                <div key={embarque.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{embarque.folio}</p>
                      <p className="text-sm text-gray-600">{embarque.cliente?.nombre || "Sin cliente"}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{embarque.destino}</span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>{new Date(embarque.fecha_creacion).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">{getEstadoBadge(embarque.estado)}</div>
                </div>
              ))}
              {embarquesRecientes.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay embarques recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recordatorios urgentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Recordatorios Urgentes</CardTitle>
            <Link href="/recordatorios">
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recordatoriosUrgentes.map((recordatorio) => {
                const fechaVencimiento = new Date(recordatorio.fecha_vencimiento)
                const hoy = new Date()
                const esVencido = fechaVencimiento < hoy

                return (
                  <div
                    key={recordatorio.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      esVencido ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-8 w-8 ${esVencido ? "text-red-600" : "text-yellow-600"}`} />
                      <div>
                        <p className="font-medium">{recordatorio.titulo}</p>
                        <p className="text-sm text-gray-600">
                          {recordatorio.operador
                            ? `${recordatorio.operador.nombre} ${recordatorio.operador.apellidos}`
                            : "Sin operador"}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span className={esVencido ? "text-red-600 font-medium" : ""}>
                            {esVencido ? "Vencido: " : "Vence: "}
                            {fechaVencimiento.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={esVencido ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                        {esVencido ? "Vencido" : "Urgente"}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {recordatoriosUrgentes.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay recordatorios urgentes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
