"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Users, Truck, Container, Package } from "lucide-react"
import { useState, useMemo } from "react"
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

// Datos simulados para las consultas
const clientesData = [
  { id: "1", nombre: "Empresa ABC S.A. de C.V.", rfc: "ABC123456789", embarques: 15, fechaRegistro: "2024-01-15" },
  { id: "2", nombre: "Comercial XYZ", rfc: "XYZ987654321", embarques: 8, fechaRegistro: "2024-01-10" },
  { id: "3", nombre: "Distribuidora 123", rfc: "DIS123456789", embarques: 12, fechaRegistro: "2024-02-01" },
  { id: "4", nombre: "Transportes del Norte", rfc: "TDN456789123", embarques: 6, fechaRegistro: "2024-02-15" },
  { id: "5", nombre: "Logística Integral", rfc: "LOG789123456", embarques: 20, fechaRegistro: "2024-01-20" },
]

const camionesData = [
  {
    id: "1",
    marca: "Freightliner",
    modelo: "Cascadia",
    año: "2022",
    placas: "ABC-123-A",
    estado: "optima",
    kilometraje: 125000,
  },
  {
    id: "2",
    marca: "Kenworth",
    modelo: "T680",
    año: "2021",
    placas: "DEF-456-B",
    estado: "no-optima",
    kilometraje: 180500,
  },
  {
    id: "3",
    marca: "Volvo",
    modelo: "VNL 760",
    año: "2020",
    placas: "GHI-789-C",
    estado: "fuera-servicio",
    kilometraje: 250000,
  },
  {
    id: "4",
    marca: "Peterbilt",
    modelo: "579",
    año: "2023",
    placas: "JKL-012-D",
    estado: "optima",
    kilometraje: 85000,
  },
  { id: "5", marca: "Mack", modelo: "Anthem", año: "2022", placas: "MNO-345-E", estado: "optima", kilometraje: 95000 },
]

const remolquesData = [
  {
    id: "1",
    numeroCaja: "REM-001",
    tipo: "Caja Seca",
    marca: "Great Dane",
    estado: "optimo",
    ubicacion: "Patio Principal",
  },
  { id: "2", numeroCaja: "REM-002", tipo: "Plataforma", marca: "Fontaine", estado: "regular", ubicacion: "En ruta" },
  {
    id: "3",
    numeroCaja: "REM-003",
    tipo: "Refrigerada",
    marca: "Utility",
    estado: "mantenimiento",
    ubicacion: "Taller",
  },
  {
    id: "4",
    numeroCaja: "REM-004",
    tipo: "Caja Seca",
    marca: "Great Dane",
    estado: "optimo",
    ubicacion: "Patio Principal",
  },
  { id: "5", numeroCaja: "REM-005", tipo: "Tolva", marca: "Fontaine", estado: "optimo", ubicacion: "Cliente ABC" },
]

const embarquesData = [
  {
    id: "1",
    folio: "TIM-2501-001",
    cliente: "Empresa ABC S.A. de C.V.",
    estado: "creado",
    fechaCreacion: "2024-01-18",
    fechaEnganche: "2024-01-20",
  },
  {
    id: "2",
    folio: "TIM-2501-002",
    cliente: "Comercial XYZ",
    estado: "asignado",
    fechaCreacion: "2024-01-19",
    fechaEnganche: "2024-01-22",
  },
  {
    id: "3",
    folio: "TIM-2501-003",
    cliente: "Distribuidora 123",
    estado: "en-transito",
    fechaCreacion: "2024-01-20",
    fechaEnganche: "2024-01-23",
  },
  {
    id: "4",
    folio: "TIM-2501-004",
    cliente: "Transportes del Norte",
    estado: "entregado",
    fechaCreacion: "2024-01-15",
    fechaEnganche: "2024-01-18",
  },
  {
    id: "5",
    folio: "TIM-2501-005",
    cliente: "Logística Integral",
    estado: "en-transito",
    fechaCreacion: "2024-01-21",
    fechaEnganche: "2024-01-24",
  },
]

const operadoresData = [
  { id: "1", nombre: "Juan Pérez García", licencia: "A12345678", embarquesAsignados: 8, estado: "activo" },
  { id: "2", nombre: "María López Rodríguez", licencia: "B87654321", embarquesAsignados: 6, estado: "activo" },
  { id: "3", nombre: "Carlos Hernández", licencia: "C11223344", embarquesAsignados: 10, estado: "activo" },
  { id: "4", nombre: "Ana Martínez", licencia: "D55667788", embarquesAsignados: 4, estado: "inactivo" },
  { id: "5", nombre: "Roberto Silva", licencia: "E99887766", embarquesAsignados: 12, estado: "activo" },
]

// Datos para gráficas
const embarquesPorMes = [
  { mes: "Ene", embarques: 45, entregados: 42 },
  { mes: "Feb", embarques: 52, entregados: 48 },
  { mes: "Mar", embarques: 38, entregados: 35 },
  { mes: "Abr", embarques: 61, entregados: 58 },
  { mes: "May", embarques: 55, entregados: 52 },
  { mes: "Jun", embarques: 67, entregados: 63 },
]

const estadoEmbarques = [
  { name: "Creados", value: 25, color: "#3B82F6" },
  { name: "Asignados", value: 35, color: "#F59E0B" },
  { name: "En Tránsito", value: 28, color: "#EF4444" },
  { name: "Entregados", value: 120, color: "#10B981" },
]

const clientesTop = [
  { cliente: "Logística Integral", embarques: 20, ingresos: 450000 },
  { cliente: "Empresa ABC S.A. de C.V.", embarques: 15, ingresos: 380000 },
  { cliente: "Distribuidora 123", embarques: 12, ingresos: 290000 },
  { cliente: "Comercial XYZ", embarques: 8, ingresos: 195000 },
  { cliente: "Transportes del Norte", embarques: 6, ingresos: 145000 },
]

const COLORS = ["#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"]

export default function ConsultasPage() {
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [tipoConsulta, setTipoConsulta] = useState("todos")
  const [clienteSeleccionado, setClienteSeleccionado] = useState("todos")

  // Métricas calculadas
  const metricas = useMemo(() => {
    return {
      totalClientes: clientesData.length,
      totalCamiones: camionesData.length,
      totalRemolques: remolquesData.length,
      totalEmbarques: embarquesData.length,
      totalOperadores: operadoresData.length,
      camionesOptimos: camionesData.filter((c) => c.estado === "optima").length,
      remolquesOptimos: remolquesData.filter((r) => r.estado === "optimo").length,
      embarquesEntregados: embarquesData.filter((e) => e.estado === "entregado").length,
      operadoresActivos: operadoresData.filter((o) => o.estado === "activo").length,
    }
  }, [])

  const descargarExcel = (tipo: string) => {
    let datos: any[] = []
    let headers: string[] = []
    let filename = ""

    switch (tipo) {
      case "clientes":
        datos = clientesData
        headers = ["ID", "Nombre", "RFC", "Embarques", "Fecha Registro"]
        filename = "clientes"
        break
      case "camiones":
        datos = camionesData
        headers = ["ID", "Marca", "Modelo", "Año", "Placas", "Estado", "Kilometraje"]
        filename = "camiones"
        break
      case "remolques":
        datos = remolquesData
        headers = ["ID", "Número Caja", "Tipo", "Marca", "Estado", "Ubicación"]
        filename = "remolques"
        break
      case "embarques":
        datos = embarquesData
        headers = ["ID", "Folio", "Cliente", "Estado", "Fecha Creación", "Fecha Enganche"]
        filename = "embarques"
        break
      case "operadores":
        datos = operadoresData
        headers = ["ID", "Nombre", "Licencia", "Embarques Asignados", "Estado"]
        filename = "operadores"
        break
      default:
        return
    }

    // Crear contenido CSV
    const csvContent = [
      headers.join(","),
      ...datos.map((item) =>
        Object.values(item)
          .map((value) => {
            const stringValue = String(value || "")
            return stringValue.includes(",") || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue
          })
          .join(","),
      ),
    ].join("\n")

    // Crear y descargar archivo
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const descargarReporteCompleto = () => {
    const reporteCompleto = {
      fecha_reporte: new Date().toISOString().split("T")[0],
      periodo: `${fechaInicio || "Inicio"} - ${fechaFin || "Actual"}`,
      metricas: metricas,
      clientes: clientesData,
      camiones: camionesData,
      remolques: remolquesData,
      embarques: embarquesData,
      operadores: operadoresData,
    }

    const jsonContent = JSON.stringify(reporteCompleto, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_completo_${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consultas y Reportes</h1>
            <p className="text-gray-600 mt-2">Consulta, analiza y descarga información del sistema</p>
          </div>
          <Button onClick={descargarReporteCompleto}>
            <Download className="h-4 w-4 mr-2" />
            Reporte Completo
          </Button>
        </div>

        {/* Filtros de período */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Consulta</CardTitle>
            <CardDescription>Define el período y tipo de información a consultar</CardDescription>
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
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente Específico</Label>
                <Select value={clienteSeleccionado} onValueChange={setClienteSeleccionado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los clientes</SelectItem>
                    {clientesData.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes</p>
                  <p className="text-2xl font-bold">{metricas.totalClientes}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Camiones</p>
                  <p className="text-2xl font-bold">{metricas.totalCamiones}</p>
                  <p className="text-xs text-green-600">{metricas.camionesOptimos} óptimos</p>
                </div>
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remolques</p>
                  <p className="text-2xl font-bold">{metricas.totalRemolques}</p>
                  <p className="text-xs text-green-600">{metricas.remolquesOptimos} óptimos</p>
                </div>
                <Container className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Embarques</p>
                  <p className="text-2xl font-bold">{metricas.totalEmbarques}</p>
                  <p className="text-xs text-green-600">{metricas.embarquesEntregados} entregados</p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Operadores</p>
                  <p className="text-2xl font-bold">{metricas.totalOperadores}</p>
                  <p className="text-xs text-green-600">{metricas.operadoresActivos} activos</p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas y estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Embarques por Mes</CardTitle>
              <CardDescription>Comparativo de embarques creados vs entregados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={embarquesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="embarques" fill="#3B82F6" name="Creados" />
                  <Bar dataKey="entregados" fill="#10B981" name="Entregados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Embarques</CardTitle>
              <CardDescription>Distribución actual de estados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadoEmbarques}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadoEmbarques.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
            <CardDescription>Clientes con mayor actividad y ingresos estimados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientesTop.map((cliente, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{cliente.cliente}</p>
                      <p className="text-sm text-gray-500">{cliente.embarques} embarques</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${cliente.ingresos.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Ingresos estimados</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs para consultas detalladas */}
        <Tabs defaultValue="clientes" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="camiones">Camiones</TabsTrigger>
            <TabsTrigger value="remolques">Remolques</TabsTrigger>
            <TabsTrigger value="embarques">Embarques</TabsTrigger>
            <TabsTrigger value="operadores">Operadores</TabsTrigger>
          </TabsList>

          <TabsContent value="clientes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Consulta de Clientes</CardTitle>
                    <CardDescription>Lista completa de clientes registrados</CardDescription>
                  </div>
                  <Button onClick={() => descargarExcel("clientes")}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientesData.map((cliente) => (
                    <div key={cliente.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cliente.nombre}</p>
                        <p className="text-sm text-gray-500">RFC: {cliente.rfc}</p>
                        <p className="text-xs text-gray-400">Registrado: {cliente.fechaRegistro}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{cliente.embarques} embarques</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camiones">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Consulta de Camiones</CardTitle>
                    <CardDescription>Flota de tractocamiones registrados</CardDescription>
                  </div>
                  <Button onClick={() => descargarExcel("camiones")}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {camionesData.map((camion) => (
                    <div key={camion.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {camion.marca} {camion.modelo} {camion.año}
                        </p>
                        <p className="text-sm text-gray-500">Placas: {camion.placas}</p>
                        <p className="text-xs text-gray-400">Kilometraje: {camion.kilometraje.toLocaleString()} km</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            camion.estado === "optima"
                              ? "bg-green-100 text-green-800"
                              : camion.estado === "no-optima"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {camion.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="remolques">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Consulta de Remolques</CardTitle>
                    <CardDescription>Inventario de remolques y cajas</CardDescription>
                  </div>
                  <Button onClick={() => descargarExcel("remolques")}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {remolquesData.map((remolque) => (
                    <div key={remolque.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {remolque.numeroCaja} - {remolque.tipo}
                        </p>
                        <p className="text-sm text-gray-500">Marca: {remolque.marca}</p>
                        <p className="text-xs text-gray-400">Ubicación: {remolque.ubicacion}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            remolque.estado === "optimo"
                              ? "bg-green-100 text-green-800"
                              : remolque.estado === "regular"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }
                        >
                          {remolque.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embarques">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Consulta de Embarques</CardTitle>
                    <CardDescription>Historial de embarques del sistema</CardDescription>
                  </div>
                  <Button onClick={() => descargarExcel("embarques")}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {embarquesData.map((embarque) => (
                    <div key={embarque.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{embarque.folio}</p>
                        <p className="text-sm text-gray-500">Cliente: {embarque.cliente}</p>
                        <p className="text-xs text-gray-400">
                          Creado: {embarque.fechaCreacion} | Enganche: {embarque.fechaEnganche}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            embarque.estado === "creado"
                              ? "bg-blue-100 text-blue-800"
                              : embarque.estado === "asignado"
                                ? "bg-yellow-100 text-yellow-800"
                                : embarque.estado === "en-transito"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                          }
                        >
                          {embarque.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operadores">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Consulta de Operadores</CardTitle>
                    <CardDescription>Personal operativo registrado</CardDescription>
                  </div>
                  <Button onClick={() => descargarExcel("operadores")}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {operadoresData.map((operador) => (
                    <div key={operador.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{operador.nombre}</p>
                        <p className="text-sm text-gray-500">Licencia: {operador.licencia}</p>
                        <p className="text-xs text-gray-400">{operador.embarquesAsignados} embarques asignados</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            operador.estado === "activo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {operador.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
