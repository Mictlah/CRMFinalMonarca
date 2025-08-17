"use client"

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Shield, Bell, FileText, User, Trash2, Download, Filter, AlertTriangle, Edit2, Save } from "lucide-react";
import { getCurrentUser, verifyAuditPassword } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface AlertThreshold {
  id: string;
  modulo: string;
  campo: string;
  dias_rojo: number;
  dias_amarillo: number;
  dias_verde?: number;
}


interface AuditLogEntry {
  id: string;
  timestamp: string;
  usuario: string;
  accion: string;
  modulo: string;
  detalles: string;
  ip?: string;
}

interface ConfiguracionGeneral {
  nombreEmpresa: string;
  notificacionesEmail: boolean;
  notificacionesPush: boolean;
  backupAutomatico: boolean;
  retencionDatos: number;
  formatoFecha: string;
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filtroModulo, setFiltroModulo] = useState("todos");
  const [filtroAccion, setFiltroAccion] = useState("todas");
  const [configuracion, setConfiguracion] = useState<ConfiguracionGeneral>({
    nombreEmpresa: "",
    notificacionesEmail: false,
    notificacionesPush: false,
    backupAutomatico: false,
    retencionDatos: 0,
    formatoFecha: "",
  });
  const currentUser = getCurrentUser();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  // Alert thresholds state
  const [alertThresholds, setAlertThresholds] = useState<AlertThreshold[]>([]);
  const [loadingThresholds, setLoadingThresholds] = useState(false);
  const [editIdx, setEditIdx] = useState<number|null>(null);
  const [editValues, setEditValues] = useState<Partial<AlertThreshold>>({});

  // Cargar umbrales de alerta desde Supabase
  const cargarAlertThresholds = async () => {
    setLoadingThresholds(true);
    const { data, error } = await supabase.from('alert_thresholds').select('*').order('modulo').order('campo');
    if (!error && data) setAlertThresholds(data);
    setLoadingThresholds(false);
  };

  useEffect(() => {
    cargarAlertThresholds();
  }, []);

  // Guardar cambios de umbral editado
  const guardarEditThreshold = async (idx: number) => {
    const t = alertThresholds[idx];
    const update = {
      dias_rojo: Number(editValues.dias_rojo),
      dias_amarillo: Number(editValues.dias_amarillo),
      dias_verde: editValues.dias_verde !== undefined && String(editValues.dias_verde) !== '' ? Number(editValues.dias_verde) : undefined
    };
    const { error } = await supabase.from('alert_thresholds').update(update).eq('id', t.id);
    if (!error) {
      const nuevos = [...alertThresholds];
      nuevos[idx] = { ...t, ...update };
      setAlertThresholds(nuevos);
      setEditIdx(null);
      setEditValues({});
    } else {
      alert('Error al guardar: ' + error.message);
    }
  };

  // Función para agregar entrada al audit log
  const agregarAuditLog = async (accion: string, modulo: string, detalles: string) => {
    try {
      const nuevaEntrada = {
        usuario: currentUser?.nombre || "Usuario Desconocido",
        accion,
        modulo,
        detalles,
        ip: "192.168.1.1", // En producción obtener IP real
        fecha_creacion: new Date().toISOString(),
      }

      // Intentar guardar en Supabase
      const { error } = await supabase.from("audit_logs").insert(nuevaEntrada)

      if (error) {
        console.warn("No se pudo guardar en Supabase, usando localStorage:", error.message)
        // Fallback a localStorage si falla Supabase
        const logsExistentes = JSON.parse(localStorage.getItem("auditLogs") || "[]")
        const nuevaEntradaLocal = {
          id: Date.now().toString(),
          timestamp: nuevaEntrada.fecha_creacion,
          usuario: nuevaEntrada.usuario,
          accion: nuevaEntrada.accion,
          modulo: nuevaEntrada.modulo,
          detalles: nuevaEntrada.detalles,
          ip: nuevaEntrada.ip,
        }
        const logsActualizados = [nuevaEntradaLocal, ...logsExistentes].slice(0, 1000)
        setAuditLogs(logsActualizados)
        localStorage.setItem("auditLogs", JSON.stringify(logsActualizados))
      } else {
        // Recargar logs desde Supabase
        await cargarAuditLogs()
      }
    } catch (error) {
      console.warn("Error general en audit log:", error)
      // Fallback completo a localStorage
      const logsExistentes = JSON.parse(localStorage.getItem("auditLogs") || "[]")
      const nuevaEntradaLocal = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        usuario: currentUser?.nombre || "Usuario Desconocido",
        accion,
        modulo,
        detalles,
        ip: "192.168.1.1",
      }
      const logsActualizados = [nuevaEntradaLocal, ...logsExistentes].slice(0, 1000)
      setAuditLogs(logsActualizados)
      localStorage.setItem("auditLogs", JSON.stringify(logsActualizados))
    }
  }

  // Función para cargar audit logs desde Supabase
  const cargarAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("fecha_creacion", { ascending: false })
        .limit(1000)

      if (error) {
        console.warn("Tabla audit_logs no existe aún, usando datos de ejemplo:", error.message)
        // Usar datos de ejemplo hasta que se cree la tabla
        const sampleLogs = [
          {
            id: "1",
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            usuario: "Juan Pérez",
            accion: "CREAR",
            modulo: "Embarques",
            detalles: "Nuevo embarque creado: TIM-2507-001 para cliente ACME Corp",
            ip: "192.168.1.100",
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            usuario: "María González",
            accion: "ACTUALIZAR",
            modulo: "Operadores",
            detalles: "Información del operador Carlos Ruiz actualizada",
            ip: "192.168.1.101",
          },
          {
            id: "3",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            usuario: "Admin Sistema",
            accion: "ELIMINAR",
            modulo: "Camiones",
            detalles: "Camión con placas ABC-123 eliminado del sistema",
            ip: "192.168.1.1",
          },
          {
            id: "4",
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            usuario: "Ana López",
            accion: "EXPORTAR",
            modulo: "Clientes",
            detalles: "Lista de clientes exportada a Excel",
            ip: "192.168.1.102",
          },
          {
            id: "5",
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            usuario: "Carlos Mendoza",
            accion: "LOGIN",
            modulo: "Sistema",
            detalles: "Inicio de sesión exitoso",
            ip: "192.168.1.103",
          },
          {
            id: "6",
            timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            usuario: "Juan Pérez",
            accion: "ACTUALIZAR",
            modulo: "Embarques",
            detalles: "Estado del embarque TIM-2507-001 cambiado a 'En Tránsito'",
            ip: "192.168.1.100",
          },
          {
            id: "7",
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            usuario: "María González",
            accion: "CREAR",
            modulo: "Clientes",
            detalles: "Nuevo cliente registrado: Transportes del Norte S.A.",
            ip: "192.168.1.101",
          },
        ]
        setAuditLogs(sampleLogs)
        return
      }

      if (data && data.length > 0) {
        // Convertir formato de Supabase al formato esperado
        const logsFormateados = data.map((log) => ({
          id: log.id.toString(),
          timestamp: log.fecha_creacion,
          usuario: log.usuario,
          accion: log.accion,
          modulo: log.modulo,
          detalles: log.detalles,
          ip: log.ip,
        }))
        setAuditLogs(logsFormateados)
      } else {
        // Si no hay datos, mostrar logs de ejemplo
        setAuditLogs([])
      }
    } catch (error) {
      console.warn("Error conectando con la base de datos, usando modo offline:", error)
      // Cargar desde localStorage como fallback
      const logsLocalStorage = localStorage.getItem("auditLogs")
      if (logsLocalStorage) {
        setAuditLogs(JSON.parse(logsLocalStorage))
      } else {
        setAuditLogs([])
      }
    }
  }

  useEffect(() => {
    cargarAuditLogs()
  }, [])



  const exportarAuditLogs = () => {
    const csv = [
      "Fecha,Usuario,Acción,Módulo,Detalles,IP",
      ...auditLogs.map(
        (log) =>
          `${new Date(log.timestamp).toLocaleString()},${log.usuario},${log.accion},${log.modulo},"${log.detalles}",${log.ip || "N/A"}`,
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    agregarAuditLog("EXPORTAR", "Audit Log", "Logs de auditoría exportados a CSV")
  }

  const guardarConfiguracion = () => {
    // Lógica para guardar la configuración
    localStorage.setItem("configuracion", JSON.stringify(configuracion))
    agregarAuditLog("ACTUALIZAR", "Configuración", "Configuración guardada")
  }

  const logsFiltrados = auditLogs.filter((log) => {
    const moduloMatch = filtroModulo === "todos" || log.modulo.toLowerCase().includes(filtroModulo.toLowerCase())
    const accionMatch = filtroAccion === "todas" || log.accion === filtroAccion
    return moduloMatch && accionMatch
  })

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case "CREAR":
        return "bg-green-100 text-green-800"
      case "ACTUALIZAR":
        return "bg-blue-100 text-blue-800"
      case "ELIMINAR":
        return "bg-red-100 text-red-800"
      case "EXPORTAR":
        return "bg-purple-100 text-purple-800"
      case "LOGIN":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-2">Administrar configuraciones del sistema y auditoría</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
            <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
            <TabsTrigger value="alertas">Alertas de Vencimiento</TabsTrigger>
            <TabsTrigger value="auditlog">Audit Log</TabsTrigger>
          </TabsList>
        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span>Configuración de Alertas de Vencimiento</span>
              </CardTitle>
              <CardDescription>
                Define con cuánta anticipación se mostrarán las alertas roja, amarilla y verde para cada campo de vencimiento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingThresholds ? (
                <div className="text-center text-gray-500 py-8">Cargando umbrales...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 border">Módulo</th>
                        <th className="px-2 py-1 border">Campo</th>
                        <th className="px-2 py-1 border text-red-700 text-center">Días Alerta Alta</th>
                        <th className="px-2 py-1 border text-yellow-700 text-center">Días Alerta Media</th>
                        <th className="px-2 py-1 border text-green-700 text-center">Días Alerta Baja</th>
                        <th className="px-2 py-1 border">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertThresholds.map((t, idx) => (
                        <tr key={t.id} className="border-b">
                          <td className="px-2 py-1 border">{t.modulo}</td>
                          <td className="px-2 py-1 border">{t.campo.replace(/_/g, ' ')}</td>
                          {editIdx === idx ? (
                            <>
                              <td className="px-2 py-1 border"><Input type="number" value={editValues.dias_rojo ?? t.dias_rojo} min={0} onChange={e => setEditValues(v => ({...v, dias_rojo: Number(e.target.value)}))} className="w-20" /></td>
                              <td className="px-2 py-1 border"><Input type="number" value={editValues.dias_amarillo ?? t.dias_amarillo} min={0} onChange={e => setEditValues(v => ({...v, dias_amarillo: Number(e.target.value)}))} className="w-20" /></td>
                              <td className="px-2 py-1 border"><Input type="number" value={editValues.dias_verde ?? t.dias_verde ?? ''} min={0} onChange={e => setEditValues(v => ({...v, dias_verde: e.target.value === '' ? undefined : Number(e.target.value)}))} className="w-20" /></td>
                              <td className="px-2 py-1 border flex gap-2">
                                <Button
                                  size="icon"
                                  className="mr-1 bg-green-600 hover:bg-green-700 text-white border-green-700"
                                  onClick={() => guardarEditThreshold(idx)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  className="px-6 bg-red-600 hover:bg-red-700 text-white border-red-700"
                                  onClick={() => {setEditIdx(null);setEditValues({})}}
                                >
                                  Cancelar
                                </Button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-2 py-1 border text-center">{t.dias_rojo}</td>
                              <td className="px-2 py-1 border text-center">{t.dias_amarillo}</td>
                              <td className="px-2 py-1 border text-center">{t.dias_verde ?? '-'}</td>
                              <td className="px-2 py-1 border">
                                <Button size="icon" variant="outline" onClick={() => {setEditIdx(idx);setEditValues({ dias_rojo: t.dias_rojo, dias_amarillo: t.dias_amarillo, dias_verde: t.dias_verde })}}><Edit2 className="h-4 w-4" /></Button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {alertThresholds.length === 0 && <div className="text-center text-gray-500 py-8">No hay umbrales configurados.</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configuración General</span>
                </CardTitle>
                <CardDescription>Configuraciones básicas del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configuración general del sistema</p>
                  <p className="text-sm">Próximamente disponible</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguridad" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Configuración de Seguridad</span>
                </CardTitle>
                <CardDescription>Configuraciones de seguridad y acceso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configuraciones de seguridad</p>
                  <p className="text-sm">Próximamente disponible</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificaciones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Configuración de Notificaciones</span>
                </CardTitle>
                <CardDescription>Gestionar notificaciones del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notificacionesEmail"
                    checked={configuracion.notificacionesEmail}
                    onCheckedChange={(checked) => setConfiguracion({ ...configuracion, notificacionesEmail: checked })}
                  />
                  <Label htmlFor="notificacionesEmail">Notificaciones por Email</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notificacionesPush"
                    checked={configuracion.notificacionesPush}
                    onCheckedChange={(checked) => setConfiguracion({ ...configuracion, notificacionesPush: checked })}
                  />
                  <Label htmlFor="notificacionesPush">Notificaciones Push</Label>
                </div>

                <Button onClick={guardarConfiguracion} className="w-full">
                  Guardar Configuración
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auditlog" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Audit Log</span>
                </CardTitle>
                <CardDescription>
                  Registro de actividades del sistema - Mostrando {logsFiltrados.length} de {auditLogs.length} entradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Controles de filtro */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <Select value={filtroModulo} onValueChange={setFiltroModulo}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filtrar módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los módulos</SelectItem>
                        <SelectItem value="embarques">Embarques</SelectItem>
                        <SelectItem value="clientes">Clientes</SelectItem>
                        <SelectItem value="operadores">Operadores</SelectItem>
                        <SelectItem value="camiones">Camiones</SelectItem>
                        <SelectItem value="configuracion">Configuración</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar acción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las acciones</SelectItem>
                      <SelectItem value="CREAR">Crear</SelectItem>
                      <SelectItem value="ACTUALIZAR">Actualizar</SelectItem>
                      <SelectItem value="ELIMINAR">Eliminar</SelectItem>
                      <SelectItem value="EXPORTAR">Exportar</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex space-x-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={exportarAuditLogs}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>

                {/* Lista de logs */}
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {logsFiltrados.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay registros de auditoría</p>
                        <p className="text-sm">Las actividades aparecerán aquí</p>
                      </div>
                    ) : (
                      logsFiltrados.map((log) => (
                        <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge className={getAccionColor(log.accion)}>{log.accion}</Badge>
                                <span className="text-sm font-medium">{log.modulo}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">{log.detalles}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{log.usuario}</span>
                                </span>
                                {log.ip && <span>IP: {log.ip}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
// ...el resto del componente y el return JSX...
}
