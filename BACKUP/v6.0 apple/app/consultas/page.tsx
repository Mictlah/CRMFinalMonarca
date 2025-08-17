"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Users,
  Truck,
  Container,
  Package,
  TrendingUp,
  AlertTriangle,
  FileText,
  TrendingDown,
} from "lucide-react"
import { useState, useEffect } from "react"
// Corregir importación para usar la instancia supabase existente
import { supabase } from "@/lib/supabase"

export default function ConsultasPage() {
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [tipoConsulta, setTipoConsulta] = useState("todos")
  const [clienteSeleccionado, setClienteSeleccionado] = useState("todos")
  const [loading, setLoading] = useState(true)

  // Estados para las estadísticas
  const [topClientes, setTopClientes] = useState<any[]>([])
  const [camionesUsados, setCamionesUsados] = useState<any[]>([])
  const [operadoresStats, setOperadoresStats] = useState<any>({})
  const [tiposServicio, setTiposServicio] = useState<any[]>([])
  const [motivosContingencia, setMotivosContingencia] = useState<any[]>([])
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<any>({})
  const [embarquesPorEstado, setEmbarquesPorEstado] = useState<any[]>([])
  const [fletesExtremos, setFletesExtremos] = useState<{ altos: any[]; bajos: any[] }>({ altos: [], bajos: [] })

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setLoading(true)

      // Obtener datos de clientes con embarques
      const { data: clientesData } = await supabase
        .from("vista_embarques_completa")
        .select(`
          cliente_id,
          cliente_nombre,
          precio_flete,
          moneda_flete,
          estado
        `)
        .not("cliente_id", "is", null)

      const clientesMap = new Map()
      clientesData?.forEach((embarque) => {
        const clienteId = embarque.cliente_id
        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            id: clienteId,
            nombre: embarque.cliente_nombre,
            embarques: 0,
            ingresos: 0,
            embarquesEntregados: 0,
          })
        }
        const cliente = clientesMap.get(clienteId)
        cliente.embarques++
        if (embarque.estado === "entregado") {
          cliente.embarquesEntregados++
          cliente.ingresos += embarque.precio_flete || 0
        }
      })

      const topClientesArray = Array.from(clientesMap.values())
        .sort((a, b) => b.embarques - a.embarques)
        .slice(0, 5)
      setTopClientes(topClientesArray)

      // Obtener datos de camiones más usados
      const { data: camionesData } = await supabase
        .from("vista_embarques_completa")
        .select(`
          camion_id,
          camion_numero,
          estado
        `)
        .not("camion_id", "is", null)

      const camionesMap = new Map()
      camionesData?.forEach((embarque) => {
        const camionId = embarque.camion_id
        if (!camionesMap.has(camionId)) {
          camionesMap.set(camionId, {
            id: camionId,
            numero: embarque.camion_numero,
            embarques: 0,
            embarquesActivos: 0,
          })
        }
        const camion = camionesMap.get(camionId)
        camion.embarques++
        if (["asignado", "en-transito"].includes(embarque.estado)) {
          camion.embarquesActivos++
        }
      })

      const camionesArray = Array.from(camionesMap.values())
        .sort((a, b) => b.embarques - a.embarques)
        .slice(0, 5)
      setCamionesUsados(camionesArray)

      // Obtener estadísticas de operadores
      const { data: operadoresData } = await supabase
        .from("vista_embarques_completa")
        .select(`
          operador_id,
          operador_nombre,
          operador_apellidos,
          estado
        `)
        .not("operador_id", "is", null)

      const operadoresMap = new Map()
      operadoresData?.forEach((embarque) => {
        const operadorId = embarque.operador_id
        if (!operadoresMap.has(operadorId)) {
          operadoresMap.set(operadorId, {
            id: operadorId,
            nombre: `${embarque.operador_nombre} ${embarque.operador_apellidos || ""}`.trim(),
            embarques: 0,
            embarquesEntregados: 0,
          })
        }
        const operador = operadoresMap.get(operadorId)
        operador.embarques++
        if (embarque.estado === "entregado") {
          operador.embarquesEntregados++
        }
      })

      const operadoresArray = Array.from(operadoresMap.values()).sort((a, b) => b.embarques - a.embarques)

      setOperadoresStats({
        masEmbarques: operadoresArray.slice(0, 3),
        menosEmbarques: operadoresArray.slice(-3).reverse(),
      })

      // Obtener tipos de servicio más solicitados
      const { data: tiposServicioData } = await supabase
        .from("vista_embarques_completa")
        .select(`
          tipo_servicio_id
        `)
        .not("tipo_servicio_id", "is", null)

      const { data: tiposServicioInfo } = await supabase.from("tipos_servicio").select("id, nombre, categoria")

      const tiposMap = new Map()
      tiposServicioData?.forEach((embarque) => {
        const tipoId = embarque.tipo_servicio_id
        if (!tiposMap.has(tipoId)) {
          const tipoInfo = tiposServicioInfo?.find((t) => t.id === tipoId)
          tiposMap.set(tipoId, {
            id: tipoId,
            nombre: tipoInfo?.nombre || "Sin nombre",
            categoria: tipoInfo?.categoria || "Sin categoría",
            embarques: 0,
          })
        }
        tiposMap.get(tipoId).embarques++
      })

      const tiposArray = Array.from(tiposMap.values())
        .sort((a, b) => b.embarques - a.embarques)
        .slice(0, 5)
      setTiposServicio(tiposArray)

      // Obtener últimos motivos de contingencia
      const { data: motivosData } = await supabase
        .from("embarque_modificaciones")
        .select(`
          razon,
          fecha_modificacion,
          usuario_modificacion
        `)
        .not("razon", "is", null)
        .order("fecha_modificacion", { ascending: false })
        .limit(5)

      setMotivosContingencia(motivosData || [])

      // Obtener estadísticas generales
      const { data: embarquesCount } = await supabase.from("embarques").select("*", { count: "exact", head: true })
      const { data: operadoresCount } = await supabase.from("operadores").select("*", { count: "exact", head: true })
      const { data: camionesCount } = await supabase.from("camiones").select("*", { count: "exact", head: true })
      const { data: clientesCount } = await supabase.from("clientes").select("*", { count: "exact", head: true })

      // Obtener distribución de embarques por estado
      const { data: embarquesPorEstadoData } = await supabase.from("embarques").select("estado")

      const estadosMap = new Map()
      embarquesPorEstadoData?.forEach((embarque) => {
        const estado = embarque.estado || "sin-estado"
        estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1)
      })

      const estadosArray = Array.from(estadosMap.entries()).map(([estado, cantidad]) => ({
        estado,
        cantidad,
        porcentaje: ((cantidad / (embarquesPorEstadoData?.length || 1)) * 100).toFixed(1),
      }))
      setEmbarquesPorEstado(estadosArray)

      const { data: fletesData } = await supabase
        .from("vista_embarques_completa")
        .select(`
          id,
          numero_embarque,
          cliente_nombre,
          origen,
          destino,
          precio_flete,
          moneda_flete,
          fecha_creacion,
          operador_nombre
        `)
        .not("precio_flete", "is", null)
        .order("precio_flete", { ascending: false })

      // Obtener los 5 fletes más altos y más bajos
      const fletesAltos = fletesData?.slice(0, 5) || []
      const fletesBajos = fletesData?.slice(-5).reverse() || []

      setFletesExtremos({ altos: fletesAltos, bajos: fletesBajos })

      setEstadisticasGenerales({
        totalEmbarques: embarquesCount?.count || 0,
        totalOperadores: operadoresCount?.count || 0,
        totalCamiones: camionesCount?.count || 0,
        totalClientes: clientesCount?.count || 0,
      })
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const descargarReporteCompleto = () => {
    const reporteCompleto = {
      fecha_reporte: new Date().toISOString().split("T")[0],
      periodo: `${fechaInicio || "Inicio"} - ${fechaFin || "Actual"}`,
      estadisticas_generales: estadisticasGenerales,
      top_clientes: topClientes,
      camiones_mas_usados: camionesUsados,
      operadores_stats: operadoresStats,
      tipos_servicio_populares: tiposServicio,
      motivos_contingencia: motivosContingencia,
      embarques_por_estado: embarquesPorEstado,
      fletes_extremos: fletesExtremos,
    }

    const jsonContent = JSON.stringify(reporteCompleto, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_estadisticas_${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getEstadoBadge = (estado: string) => {
    const estadosConfig = {
      creado: { color: "bg-blue-100 text-blue-800", label: "Creado" },
      asignado: { color: "bg-yellow-100 text-yellow-800", label: "Asignado" },
      "listo-para-asignar": { color: "bg-orange-100 text-orange-800", label: "Listo" },
      "en-transito": { color: "bg-purple-100 text-purple-800", label: "En Tránsito" },
      entregado: { color: "bg-green-100 text-green-800", label: "Entregado" },
      cancelado: { color: "bg-red-100 text-red-800", label: "Cancelado" },
      archivado: { color: "bg-gray-100 text-gray-800", label: "Archivado" },
    }

    const config = estadosConfig[estado as keyof typeof estadosConfig] || {
      color: "bg-gray-100 text-gray-800",
      label: estado,
    }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estadísticas...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas y Reportes</h1>
            <p className="text-gray-600 mt-2">Análisis detallado del rendimiento operativo</p>
          </div>
          <Button onClick={descargarReporteCompleto}>
            <Download className="h-4 w-4 mr-2" />
            Descargar Reporte
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Embarques</p>
                  <p className="text-2xl font-bold">{estadisticasGenerales.totalEmbarques}</p>
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
                  <p className="text-2xl font-bold">{estadisticasGenerales.totalOperadores}</p>
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
                  <p className="text-2xl font-bold">{estadisticasGenerales.totalCamiones}</p>
                </div>
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes</p>
                  <p className="text-2xl font-bold">{estadisticasGenerales.totalClientes}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Top 5 Clientes
            </CardTitle>
            <CardDescription>Clientes con mayor actividad e ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClientes.map((cliente, index) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-transparent"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {cliente.embarques} embarques • {cliente.embarquesEntregados} entregados
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">${cliente.ingresos.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Ingresos totales</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Camiones Más Utilizados
              </CardTitle>
              <CardDescription>Unidades con mayor actividad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {camionesUsados.map((camion, index) => (
                  <div key={camion.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{camion.numero}</p>
                        <p className="text-sm text-gray-600">{camion.embarquesActivos} activos</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">{camion.embarques} embarques</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Rendimiento de Operadores
              </CardTitle>
              <CardDescription>Operadores con más y menos embarques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-green-600 mb-2">Más Embarques</p>
                  <div className="space-y-2">
                    {operadoresStats.masEmbarques?.map((operador, index) => (
                      <div key={operador.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">{operador.nombre}</span>
                        <Badge className="bg-green-100 text-green-800">{operador.embarques}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-red-600 mb-2">Menos Embarques</p>
                  <div className="space-y-2">
                    {operadoresStats.menosEmbarques?.map((operador, index) => (
                      <div key={operador.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                        <span className="text-sm font-medium">{operador.nombre}</span>
                        <Badge className="bg-red-100 text-red-800">{operador.embarques}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="h-5 w-5 text-purple-600" />
                Tipos de Servicio Más Solicitados
              </CardTitle>
              <CardDescription>Servicios con mayor demanda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tiposServicio.map((tipo, index) => (
                  <div key={tipo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{tipo.nombre}</p>
                        <p className="text-sm text-gray-600">{tipo.categoria}</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">{tipo.embarques} solicitudes</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Distribución por Estado
              </CardTitle>
              <CardDescription>Estados actuales de embarques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {embarquesPorEstado.map((item, index) => (
                  <div key={item.estado} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getEstadoBadge(item.estado)}
                      <span className="text-sm text-gray-600">{item.porcentaje}%</span>
                    </div>
                    <span className="font-bold">{item.cantidad}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Últimos Motivos de Contingencia
              </CardTitle>
              <CardDescription>Razones recientes de modificaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {motivosContingencia.map((motivo, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-red-50">
                    <p className="font-medium text-gray-900">{motivo.razon}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">Por: {motivo.usuario_modificacion}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(motivo.fecha_modificacion).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {motivosContingencia.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No hay motivos de contingencia recientes</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Fletes Extremos
              </CardTitle>
              <CardDescription>Embarques con precios más altos y más bajos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fletes Más Altos
                  </h4>
                  <div className="space-y-2">
                    {fletesExtremos.altos.map((embarque, index) => (
                      <div
                        key={embarque.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{embarque.numero_embarque}</p>
                            <p className="text-sm text-gray-600">{embarque.cliente_nombre}</p>
                            <p className="text-xs text-gray-500">
                              {embarque.origen} → {embarque.destino}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ${embarque.precio_flete?.toLocaleString()} {embarque.moneda_flete}
                          </p>
                          <p className="text-xs text-gray-500">{embarque.operador_nombre}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-red-600 mb-3 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Fletes Más Bajos
                  </h4>
                  <div className="space-y-2">
                    {fletesExtremos.bajos.map((embarque, index) => (
                      <div
                        key={embarque.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{embarque.numero_embarque}</p>
                            <p className="text-sm text-gray-600">{embarque.cliente_nombre}</p>
                            <p className="text-xs text-gray-500">
                              {embarque.origen} → {embarque.destino}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            ${embarque.precio_flete?.toLocaleString()} {embarque.moneda_flete}
                          </p>
                          <p className="text-xs text-gray-500">{embarque.operador_nombre}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {fletesExtremos.altos.length === 0 && fletesExtremos.bajos.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No hay datos de fletes disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de Consulta</CardTitle>
            <CardDescription>Personaliza el período de análisis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input id="fechaFin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoConsulta">Tipo de Consulta</Label>
                <Select value={tipoConsulta} onValueChange={setTipoConsulta}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los registros</SelectItem>
                    <SelectItem value="activos">Solo activos</SelectItem>
                    <SelectItem value="recientes">Últimos 30 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={cargarEstadisticas} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
