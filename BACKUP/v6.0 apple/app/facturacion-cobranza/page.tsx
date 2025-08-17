"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Users,
  Truck,
  Package,
  Download,
  FileText,
  Edit,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  Calendar,
  MapPin,
  Coins,
  Eye,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  supabase,
  obtenerEmbarquesModificadosIds,
  obtenerTiposServicio,
  TipoServicio,
} from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmbarqueAsignado {
  id: string;
  folio: string;
  clienteNombre: string;
  numeroLoad: string;
  direccionEnganche: string;
  fechaEnganche: string;
  horaEnganche: string;
  comentarios: string;
  operadorAsignado: {
    id: string;
    nombre: string;
  };
  camionAsignado: {
    id: string;
    marca: string;
    modelo: string;
    numeroEconomico: string;
  };
  // Remolque relacionado (si existe) o captura manual
  remolque?: {
    numero_economico?: string;
    placas?: string;
  };
  remolque_numero_economico?: string;
  remolque_placa?: string;
  fechaAsignacion: string;
  estado: string;
  montoFacturado?: number;
  fechaEntrega?: string;
  observacionesFacturacion?: string;
  pagado?: boolean;
  fechaPago?: string;
  moneda_flete?: "MXN" | "USD";
  modificadoPorEmergencia?: boolean;
  requiereAtencionEspecial?: boolean;
  alertaModificacion?: string;
  mensajeParaFacturacion?: string;
  fechaModificacionEmergencia?: string;
  usuarioModificacion?: string;
  motivoModificacion?: string;
  // Nuevos campos
  foliosFactura?: {
    folio1?: string;
    folio2?: string;
    folio3?: string;
    folio4?: string;
  };
  cantidadFinalFacturada?: number;
  tipoServicio?: string;
  estado_facturacion?:
    | "pendiente_facturacion"
    | "facturado"
    | "pagado"
    | "archivado";
  precioFlete?: number;
  tipo_servicio_id?: string;
  fechaArchivado?: string;
  usuarioArchivo?: string;
  motivoArchivo?: string;
  observacionesArchivo?: string;
  fechaEnvioCliente?: string;
  fechaPagoCliente?: string;
  referenciaPago?: string;
  // Aliases en snake_case presentes en consultas/uso
  precio_flete?: number;
  fecha_pago?: string;
  fecha_envio_cliente?: string;
  folio_factura_1?: string;
  folio_factura_2?: string;
  folio_factura_3?: string;
  direccionRecolecta?: string;
  // Campos de la base de datos que pueden venir directamente
  cliente_id?: string;
  load_number?: string;
  direccion_recolecta?: string;
  direccion_entrega?: string;
  carta_porte?: string;
  // Campos operativos adicionales
  patente_agente_aduanal?: string;
  aduana_cruce?: string;
  dueno_mercancia?: string;
  contenido?: string;
  peso?: number | string;
  numero_factura_1?: string;
  numero_factura_2?: string;
  numero_factura_3?: string;
  numero_factura_4?: string;
  cantidad_final_facturada?: number;
  referencia_pago?: string;
  // Nuevos campos por factura (1..4)
  fecha_envio_cliente_1?: string;
  fecha_envio_cliente_2?: string;
  fecha_envio_cliente_3?: string;
  fecha_envio_cliente_4?: string;
  fecha_pago_1?: string;
  fecha_pago_2?: string;
  fecha_pago_3?: string;
  fecha_pago_4?: string;
  referencia_pago_1?: string;
  referencia_pago_2?: string;
  referencia_pago_3?: string;
  referencia_pago_4?: string;
  updated_at?: string;
  fecha_creacion?: string; // Added for consistency with DB column
  // QuickPaid
  quickpaid_enabled?: boolean;
  quickpaid_percent?: number;
  quickpaid_descuento?: number;
  precio_quickpaid?: number;
  // Representante del cliente (cuando exista en el embarque)
  representante_cliente?: string;
  info_representante?: any;

  // Campos para contingencia
  operadorOriginalId?: string;
  operadorOriginalNombre?: string;
  operadorReemplazoId?: string;
  operadorReemplazoNombre?: string;
  montoOriginalContingencia?: number;
  montoReemplazoContingencia?: number;
  pagoOperador?: number; // Base payment for the service type
  tipoServicioNombre?: string; // Added for easier access in tables
}

const ModificacionesHistory = ({ embarqueId }: { embarqueId: string }) => {
  const [modificaciones, setModificaciones] = useState<any[]>([]);
  const [loadingMods, setLoadingMods] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const cargarModificaciones = async () => {
      try {
        const { data, error } = await supabase
          .from("embarque_modificaciones")
          .select("*")
          .eq("embarque_id", embarqueId)
          .order("fecha_modificacion", { ascending: false });

        if (error) {
          console.error("Error cargando modificaciones:", error);
          if (mounted.current) setModificaciones([]);
        } else {
          if (mounted.current) setModificaciones(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
        if (mounted.current) setModificaciones([]);
      } finally {
        if (mounted.current) setLoadingMods(false);
      }
    };

    cargarModificaciones();

    return () => {
      mounted.current = false;
    };
  }, [embarqueId]);

  if (loadingMods) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        <span className="ml-2 text-sm text-gray-600">
          Cargando historial de modificaciones...
        </span>
      </div>
    );
  }

  if (modificaciones.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">
              Sin modificaciones registradas
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Este embarque no ha sido modificado desde su asignación original.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-gray-800">
              Resumen de Modificaciones
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-700 border-gray-300"
            >
              {modificaciones.length} modificación
              {modificaciones.length > 1 ? "es" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Este embarque ha sido modificado por situaciones de emergencia o
            contingencia. A continuación se muestra el historial detallado de
            cada modificación realizada.
          </p>
        </CardContent>
      </Card>

      {modificaciones.map((mod, index) => (
        <Card key={mod.id || index} className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {modificaciones.length - index}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-base text-gray-800">
                    Modificación #{modificaciones.length - index}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(mod.fecha_modificacion).toLocaleDateString(
                      "es-MX",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-gray-50 text-gray-600 border-gray-300"
              >
                {mod.usuario_modificacion || "Sistema"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Justificación */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Justificación
              </h4>
              <p className="text-sm text-gray-700">
                {mod.razon || "Sin justificación registrada"}
              </p>
            </div>

            {/* Cambios realizados */}
            <div className="space-y-3">
              {/* Cambio de Operador */}
              {(mod.operador_original_nombre || mod.operador_nuevo_nombre) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-600" />
                    Cambio de Operador
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Operador Anterior
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border">
                        {mod.operador_original_nombre || "No especificado"}
                      </p>
                      {mod.sueldo_operador_original && (
                        <p className="text-xs text-gray-600 mt-1">
                          Sueldo: ${mod.sueldo_operador_original}{" "}
                          {mod.moneda_sueldo_operador_original || "MXN"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Operador Nuevo
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-medium">
                        {mod.operador_nuevo_nombre || "No especificado"}
                      </p>
                      {mod.sueldo_operador_nuevo && (
                        <p className="text-xs text-gray-600 mt-1">
                          Sueldo: ${mod.sueldo_operador_nuevo}{" "}
                          {mod.moneda_sueldo_operador_nuevo || "MXN"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cambio de Tractocamión */}
              {(mod.camion_original_numero || mod.camion_nuevo_numero) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-gray-600" />
                    Cambio de Tractocamión
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Tractocamión Anterior
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-mono">
                        {mod.camion_original_numero || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Tractocamión Nuevo
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-mono font-medium">
                        {mod.camion_nuevo_numero || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cambio de Remolque */}
              {(mod.remolque_original_numero || mod.remolque_nuevo_numero) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-600" />
                    Cambio de Remolque
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Remolque Anterior
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-mono">
                        {mod.remolque_original_numero || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Remolque Nuevo
                      </p>
                      <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border font-mono font-medium">
                        {mod.remolque_nuevo_numero || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cambio de Precio de Flete */}
              {(mod.precio_flete_original || mod.precio_flete_nuevo) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-600" />
                    Cambio de Precio de Flete
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Precio Anterior
                      </p>
                      <p className="text-lg font-bold text-gray-800 bg-gray-100 p-2 rounded border">
                        {mod.precio_flete_original
                          ? `$${mod.precio_flete_original.toLocaleString()} ${
                              mod.moneda_flete_original || "MXN"
                            }`
                          : "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                        Precio Nuevo
                      </p>
                      <p className="text-lg font-bold text-gray-800 bg-gray-100 p-2 rounded border-2 border-gray-400">
                        {mod.precio_flete_nuevo
                          ? `$${mod.precio_flete_nuevo.toLocaleString()} ${
                              mod.moneda_flete_nueva || "MXN"
                            }`
                          : "No especificado"}
                      </p>
                    </div>
                  </div>
                  {mod.flete_en_falso && (
                    <div className="mt-3 bg-gray-100 border border-gray-300 rounded p-2">
                      <p className="text-sm text-gray-800 font-medium flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-gray-600" />
                        Marcado como flete en falso
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Información de auditoría */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>ID de Registro: {mod.id?.slice(-8) || "N/A"}</span>
                <span>Modificación por emergencia/contingencia</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default function FacturacionCobranzaPage() {
  const mounted = useRef(true);

  const [contingencyPaymentsDb, setContingencyPaymentsDb] = useState<{
    [embarqueId: string]: {
      monto_original: number;
      monto_reemplazo: number;
      operador_original_id: string;
      operador_reemplazo_id: string;
    };
  }>({});
  const [embarquesModificadosIds, setEmbarquesModificadosIds] = useState<
    string[]
  >([]);
  // IDs de embarques archivados para ocultarlos en la lista principal
  const [archivadosIds, setArchivadosIds] = useState<string[]>([]);

  const [loadingEmbarques, setLoadingEmbarques] = useState(true);
  const [loadingTiposServicio, setLoadingTiposServicio] = useState(true);

  useEffect(() => {
    mounted.current = true;
    obtenerEmbarquesModificadosIds().then((ids) => {
      if (mounted.current) setEmbarquesModificadosIds(ids);
    });
    // Cargar IDs archivados para excluirlos
    (async () => {
      try {
        const { data, error } = await supabase
          .from("embarques")
          .select("id")
          .eq("estado_facturacion", "archivado");
        if (!error && mounted.current) {
          const ids = (data || []).map((r: any) => r.id);
          setArchivadosIds(Array.from(new Set(ids)));
        }
      } catch (e) {
        console.error("Error cargando IDs de archivados:", e);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  const [showAnalisisOperadoresModal, setShowAnalisisOperadoresModal] =
    useState(false);
  const [analisisData, setAnalisisData] = useState<any>({
    analisisPorOperador: [],
    embarquesFiltradosAnalisis: [],
    resumenGeneral: null,
  });
  const [filtroAnalisisOperador, setFiltroAnalisisOperador] = useState("todos");
  const [fechaInicioAnalisis, setFechaInicioAnalisis] = useState("");
  const [fechaFinAnalisis, setFechaFinAnalisis] = useState("");
  const [activeAnalisisTab, setActiveAnalisisTab] = useState("porOperador");
  // Paginación para la sección "Por Operador"
  const [itemsPerPageAnalisisOp, setItemsPerPageAnalisisOp] = useState(10);
  const [currentPageAnalisisOp, setCurrentPageAnalisisOp] = useState(1);
  // Paginación para la sección "Detalle"
  const [itemsPerPageAnalisisDetalle, setItemsPerPageAnalisisDetalle] =
    useState(10);
  const [currentPageAnalisisDetalle, setCurrentPageAnalisisDetalle] =
    useState(1);
  const [operadoresContingencia, setOperadoresContingencia] = useState<{
    [key: string]: { original: number; reemplazo: number };
  }>({});
  const [operadoresContingenciaData, setOperadoresContingenciaData] = useState<{
    [key: string]: { original: any; reemplazo: any };
  }>({});
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);

  const [showPagosOperadoresModal, setShowPagosOperadoresModal] =
    useState(false);
  const [filtroPagosOperadorId, setFiltroPagosOperadorId] = useState("todos");
  const [fechaInicioPagos, setFechaInicioPagos] = useState("");
  const [fechaFinPagos, setFechaFinPagos] = useState("");
  const [embarquesOperadorFiltrados, setEmbarquesOperadorFiltrados] = useState<
    EmbarqueAsignado[]
  >([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [activePagosTab, setActivePagosTab] = useState("detalle");
  const [filtroPeriodoPagos, setFiltroPeriodoPagos] = useState("custom");
  const [periodoAnalisis, setPeriodoAnalisis] = useState("mes");

  const setPeriodoActual = (tipo: string) => {
    const hoy = new Date();
    let inicio: Date;
    let fin: Date;

    switch (tipo) {
      case "mes":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case "mes_anterior":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case "dos_meses_atras":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
        fin = hoy;
        break;
      case "tres_meses_atras":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
        fin = hoy;
        break;
      case "seis_meses_atras":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
        fin = hoy;
        break;
      case "un_ano_atras":
        inicio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), 1);
        fin = hoy;
        break;
      case "año":
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear(), 11, 31);
        break;
      default:
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = hoy;
    }

    setFechaInicioAnalisis(inicio.toISOString().slice(0, 10));
    setFechaFinAnalisis(fin.toISOString().slice(0, 10));
  };

  const generarAnalisisOperadores = async () => {
    setLoadingAnalisis(true);
    try {
      const fechaInicio = fechaInicioAnalisis
        ? new Date(fechaInicioAnalisis)
        : new Date("2024-01-01");
      const fechaFin = fechaFinAnalisis
        ? new Date(fechaFinAnalisis)
        : new Date();
      fechaFin.setHours(23, 59, 59, 999);

      const embarquesFiltrados = embarquesAsignados.filter((embarque) => {
        const fechaEmbarque = new Date(embarque.fecha_creacion!);
        const coincideFecha =
          fechaEmbarque >= fechaInicio && fechaEmbarque <= fechaFin;
        const coincideOperador =
          filtroAnalisisOperador === "todos" ||
          embarque.operadorAsignado?.nombre === filtroAnalisisOperador;
        return (
          coincideFecha &&
          coincideOperador &&
          embarque.estado_facturacion !== "archivado"
        );
      });

      // Construir lista para análisis: duplicar en contingencia (original y reemplazo) y NO calcular pago automático en esos casos
      const embarquesParaAnalisis = embarquesFiltrados.flatMap((embarque) => {
        const tipoServicio = tiposServicio.find(
          (t) => t.id === embarque.tipo_servicio_id
        );
        const base: any = {
          ...embarque,
          tipoServicioNombre: tipoServicio?.nombre || "Sin especificar",
          // Usar la fecha de creación como fecha de referencia en el análisis
          fechaAsignacion: embarque.fecha_creacion,
        };
        const esContingencia =
          embarque.modificadoPorEmergencia ||
          embarquesModificadosIds.includes(embarque.id);

        if (esContingencia) {
          const duplicados: any[] = [];
          const nombreOriginal =
            embarque.operadorOriginalNombre ||
            embarque.operadorAsignado?.nombre;
          if (nombreOriginal) {
            duplicados.push({
              ...base,
              modificadoPorEmergencia: true,
              operadorAsignado: {
                ...embarque.operadorAsignado,
                nombre: nombreOriginal,
              },
              pagoOperador: 0,
              rolContingencia: "original",
            });
          }
          if (embarque.operadorReemplazoNombre) {
            duplicados.push({
              ...base,
              modificadoPorEmergencia: true,
              operadorAsignado: {
                ...embarque.operadorAsignado,
                nombre: embarque.operadorReemplazoNombre,
              },
              pagoOperador: 0,
              rolContingencia: "reemplazo",
            });
          }
          return duplicados.length
            ? duplicados
            : [{ ...base, pagoOperador: 0, modificadoPorEmergencia: true }];
        }

        // Caso normal: mantener cálculo automático según tipo de servicio
        return [
          {
            ...base,
            pagoOperador: tipoServicio?.precio_base || 0,
          },
        ];
      });

      const operadoresMap: Map<string, any[]> = new Map();
      for (const embarque of embarquesParaAnalisis as any[]) {
        const nombre = embarque.operadorAsignado?.nombre || "Sin asignar";
        if (!operadoresMap.has(nombre)) {
          operadoresMap.set(nombre, []);
        }
        operadoresMap.get(nombre)!.push(embarque);
      }
      const analisisPorOperador = Array.from(operadoresMap.entries()).map(
        ([nombre, embarques]: [string, any[]]) => {
          const totalPagos = embarques.reduce((sum: number, e: any) => {
            if (e.modificadoPorEmergencia) {
              const m = operadoresContingencia[e.id] || {};
              const monto =
                e.rolContingencia === "original"
                  ? m.original || 0
                  : m.reemplazo || 0;
              return sum + (monto || 0);
            }
            return sum + (e.pagoOperador || 0);
          }, 0);
          const embarquesContingencia = embarques.filter((e: any) =>
            embarquesModificadosIds.includes(e.id)
          ).length;
          return {
            nombre,
            totalPagos,
            cantidadEmbarques: embarques.length,
            embarques,
            embarquesContingencia,
            promedioPorEmbarque:
              embarques.length > 0 ? totalPagos / embarques.length : 0,
          };
        }
      );
      const resumenGeneral = {
        totalPagos: (embarquesParaAnalisis as any[]).reduce(
          (sum: number, e: any) => {
            if (e.modificadoPorEmergencia) {
              const m = operadoresContingencia[e.id] || {};
              const monto =
                e.rolContingencia === "original"
                  ? m.original || 0
                  : m.reemplazo || 0;
              return sum + (monto || 0);
            }
            return sum + (e.pagoOperador || 0);
          },
          0
        ),
        totalEmbarques: embarquesParaAnalisis.length,
        operadores: analisisPorOperador.length,
        // contar embarques únicos en contingencia
        casosContingencia: Array.from(
          new Set(
            embarquesFiltrados
              .filter((e) => embarquesModificadosIds.includes(e.id))
              .map((e) => e.id)
          )
        ).length,
      };
      if (mounted.current) {
        setAnalisisData({
          analisisPorOperador,
          embarquesFiltradosAnalisis: embarquesParaAnalisis,
          resumenGeneral,
        });
      }
    } catch (error) {
      console.error("Error al generar el análisis de operadores:", error);
      alert(
        "Error al generar el análisis de operadores. Por favor, intente de nuevo."
      );
    } finally {
      if (mounted.current) setLoadingAnalisis(false);
    }
  };

  const exportarAnalisisExcel = () => {
    let csv = "Operador,Folio,Cliente,Fecha,Tipo Servicio,Pago Operador\n";
    analisisData.embarquesFiltradosAnalisis.forEach((e: any) => {
      const pago = e.modificadoPorEmergencia
        ? e.rolContingencia === "original"
          ? operadoresContingencia[e.id]?.original || 0
          : operadoresContingencia[e.id]?.reemplazo || 0
        : e.pagoOperador || 0;
      csv += `${e.operadorAsignado?.nombre || ""},${e.folio},${
        e.clienteNombre
      },${e.fechaAsignacion},${e.tipoServicioNombre},${pago}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analisis_operadores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const [showArchivadosModal, setShowArchivadosModal] = useState(false);
  const [embarquesArchivados, setEmbarquesArchivados] = useState<
    EmbarqueAsignado[]
  >([]);
  const [loadingArchivados, setLoadingArchivados] = useState(false);

  useEffect(() => {
    if (!showArchivadosModal) return;
    setLoadingArchivados(true);
    const cargarArchivados = async () => {
      try {
        const { data, error } = await supabase
          .from("embarques")
          .select(
            `*,
       cliente:clientes(*),
       operador:operadores(*),
       camion:camiones(*)`
          )
          .eq("estado_facturacion", "archivado")
          .order("fecha_archivado", { ascending: false });

        if (error) {
          console.error("Error cargando embarques archivados:", error);
          if (mounted.current) setEmbarquesArchivados([]);
        } else {
          const embarquesFormateados = (data || []).map((embarque) => ({
            ...embarque,
            // Normalizamos monto flete a número cuando venga como string
            precioFlete:
              typeof (embarque as any).precio_flete === "string"
                ? Number((embarque as any).precio_flete)
                : typeof (embarque as any).precio_flete === "number"
                ? (embarque as any).precio_flete
                : undefined,
            clienteNombre:
              embarque.cliente?.nombre || "Cliente no especificado", // Corrected field name
            operadorAsignado: embarque.operador
              ? {
                  id: embarque.operador.id,
                  nombre: `${embarque.operador.nombre} ${
                    embarque.operador.apellidos || ""
                  }`.trim(),
                }
              : { id: "", nombre: "Sin asignar" },
            camionAsignado: embarque.camion
              ? {
                  id: embarque.camion.id,
                  marca: embarque.camion.marca,
                  modelo: embarque.camion.modelo,
                  numeroEconomico: embarque.camion.numero_economico,
                }
              : {
                  id: "",
                  marca: "Sin asignar",
                  modelo: "",
                  numeroEconomico: "",
                },
          }));
          if (mounted.current) setEmbarquesArchivados(embarquesFormateados);
        }
      } catch (error) {
        console.error("Error cargando embarques archivados:", error);
        if (mounted.current) setEmbarquesArchivados([]);
      } finally {
        if (mounted.current) setLoadingArchivados(false);
      }
    };
    cargarArchivados();
  }, [showArchivadosModal]);

  async function archivarEmbarque(embarque: EmbarqueAsignado) {

    const fechaArchivado = new Date().toISOString();
    // Obtener usuario actual
    let usuarioArchivo = "Usuario Actual";
    try {
      const { getCurrentUser } = await import("../../lib/auth");
      const user = getCurrentUser && getCurrentUser();
      if (user && user.nombre) usuarioArchivo = user.nombre;
    } catch {}
    const motivoArchivo = "Archivado manualmente desde facturación";
    const observacionesArchivo = "Registro archivado para consulta histórica";

    const { error } = await supabase
      .from("embarques")
      .update({
        estado_facturacion: "archivado",
        fecha_archivado: fechaArchivado,
        usuario_archivo: usuarioArchivo,
        motivo_archivo: motivoArchivo,
        observaciones_archivo: observacionesArchivo,
        updated_at: fechaArchivado,
      })
      .eq("id", embarque.id);

    if (error) {
      alert(
        "Error al archivar el embarque en Supabase: " + (error.message || "")
      );
      return;
    }

    const actualizados: EmbarqueAsignado[] = embarquesAsignados.map((e) =>
      e.id === embarque.id
        ? {
            ...e,
            estado_facturacion: "archivado",
            fechaArchivado,
            usuarioArchivo,
            motivoArchivo,
            observacionesArchivo,
            updated_at: fechaArchivado,
          }
        : e
    );
    if (mounted.current) {
      setEmbarquesAsignados(actualizados);
      localStorage.setItem("embarquesAsignados", JSON.stringify(actualizados));
      // Ocultar inmediatamente de la lista principal
      setArchivadosIds((prev) =>
        Array.from(new Set([...(prev || []), embarque.id]))
      );
      // Si el modal de archivados está abierto, agregar el registro de inmediato
      setEmbarquesArchivados((prev) => {
        if (!showArchivadosModal) return prev;
        const yaExiste = (prev || []).some((e) => e.id === embarque.id);
        if (yaExiste) return prev;
        const paraModal: EmbarqueAsignado = {
          ...embarque,
          estado_facturacion: "archivado",
          precioFlete: embarque.precioFlete || embarque.precio_flete,
          fecha_pago: embarque.fecha_pago,
          load_number: (embarque as any).load_number || embarque.numeroLoad,
        } as any;
        return [paraModal, ...(prev || [])];
      });
    }
    // Audit log: archivar embarque
    try {
      const { agregarAuditLog } = await import("../../lib/audit");
      agregarAuditLog(
        "ACTUALIZAR",
        "Facturación/Cobranza",
        `Archivo de embarque folio ${embarque.folio} por usuario ${usuarioArchivo}`
      );
    } catch {}
    alert("Embarque archivado exitosamente en Supabase.");
  }
  const [embarquesAsignados, setEmbarquesAsignados] = useState<
    EmbarqueAsignado[]
  >([]);
  const [filtroOperador, setFiltroOperador] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [embarqueEditando, setEmbarqueEditando] =
    useState<EmbarqueAsignado | null>(null);

  const [formData, setFormData] = useState({
    montoFacturado: 0,
    fechaEntrega: "",
    observacionesFacturacion: "",
    pagado: false,
    fechaPago: "",
    estado_facturacion: "pendiente_facturacion",
    numeroFactura1: "",
    numeroFactura2: "",
    numeroFactura3: "",
    fechaEnvioCliente: "",
    referenciaPago: "",
  });

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [creditLimits, setCreditLimits] = useState<{
    [key: string]: { usd: number; mxn: number };
  }>({});
  const [creditClientSearchTerm, setCreditClientSearchTerm] = useState("");
  const [currentPageCredit, setCurrentPageCredit] = useState(1);
  const [itemsPerPageCredit, setItemsPerPageCredit] = useState(10);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [embarqueDetalle, setEmbarqueDetalle] =
    useState<EmbarqueAsignado | null>(null);

  const [activeTab, setActiveTab] = useState("general");

  const [showFacturacionEditModal, setShowFacturacionEditModal] =
    useState(false);
  const [facturacionFormData, setFacturacionFormData] = useState({
    folio1: "",
    folio2: "",
    folio3: "",
    folio4: "",
    cantidadFinalFacturada: 0,
    observacionesFacturacion: "",
  });

  const [showTiposServicioModal, setShowTiposServicioModal] = useState(false);
  const [tiposServicio, setTiposServicio] = useState<TipoServicio[]>([]);
  // Modal para crear nuevo tipo de servicio
  const [showCrearTipoModal, setShowCrearTipoModal] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({
    nombre: "",
    descripcion: "",
    categoria: "",
    subcategoria: "",
    precio_base: 0,
  });
  const [guardandoNuevoTipo, setGuardandoNuevoTipo] = useState(false);

  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const [embarqueFacturacion, setEmbarqueFacturacion] =
    useState<EmbarqueAsignado | null>(null);
  const [facturacionData, setFacturacionData] = useState({
    numeroFactura1: "",
    numeroFactura2: "",
    numeroFactura3: "",
  numeroFactura4: "",
  fechaEnvioCliente1: "",
  fechaEnvioCliente2: "",
  fechaEnvioCliente3: "",
  fechaEnvioCliente4: "",
  fechaPagoCliente1: "",
  fechaPagoCliente2: "",
  fechaPagoCliente3: "",
  fechaPagoCliente4: "",
  referenciaPago1: "",
  referenciaPago2: "",
  referenciaPago3: "",
  referenciaPago4: "",
    observacionesFacturacion: "",
  });

  const [activeDetailTab, setActiveDetailTab] = useState("general");

  // Helper: obtener cliente por id para pestaña Datos del Cliente
  const getClienteById = useCallback(
    (clienteId?: string) => {
      if (!clienteId) return undefined;
      return clientes.find((c) => c.id === clienteId);
    },
    [clientes]
  );

  // Exportar detalle del embarque (todas las secciones) a CSV (compatible Excel)
  const exportarDetalleEmbarqueExcel = useCallback(() => {
    if (!embarqueDetalle) return;
    const c = getClienteById(embarqueDetalle.cliente_id);

    // Datos facturación 1..4
    const anyDet: any = embarqueDetalle;
    const facturas = [1, 2, 3, 4].map((i) => ({
      folio: anyDet[`folio_factura_${i}`] || anyDet[`numero_factura_${i}`] || "",
      envio: anyDet[`fecha_envio_cliente_${i}`] || (i === 1 ? anyDet["fecha_envio_cliente"] : ""),
      pago: anyDet[`fecha_pago_${i}`] || (i === 1 ? anyDet["fecha_pago"] : ""),
      ref: anyDet[`referencia_pago_${i}`] || (i === 1 ? anyDet["referencia_pago"] : ""),
    }));

    const rows: Record<string, string>[] = [];
    const push = (k: string, v: any) => rows.push({ Campo: k, Valor: v == null || v === "" ? "-" : String(v) });

    // General
    push("Folio", embarqueDetalle.folio);
    push("Cliente", embarqueDetalle.clienteNombre);
    push("Load", embarqueDetalle.load_number || "");
    push("Fecha Creación", embarqueDetalle.fecha_creacion ? new Date(embarqueDetalle.fecha_creacion).toLocaleDateString() : "");

    // Operativos/Facturación extra solicitados
    push("Patente Agente Aduanal", anyDet.patente_agente_aduanal || "");
    push("Aduana de cruce", anyDet.aduana_cruce || "");
    push("Dueño de mercancía", anyDet.dueno_mercancia || "");
    push("Contenido", anyDet.contenido || "");
    push("Peso (kg)", anyDet.peso || "");
    push("Carta Porte", anyDet.carta_porte || "");

    // Resumen facturación
    const monto = (anyDet.cantidad_final_facturada ?? anyDet.precio_flete ?? 0) as number;
    push("Valor Facturado", `${monto.toLocaleString()} ${anyDet.moneda_flete || "MXN"}`);
    push("Estado Facturación", anyDet.estado_facturacion || "pendiente_facturacion");
    push("Pagado", anyDet.pagado ? "Sí" : "No");
    push("Fecha Pago", anyDet.fecha_pago ? new Date(anyDet.fecha_pago).toLocaleDateString() : "");
    push("Observaciones", anyDet.observacionesFacturacion || anyDet.observaciones_facturacion || "");

    // QuickPaid
    if (anyDet.quickpaid_enabled) {
      push("QuickPaid %", anyDet.quickpaid_percent ?? "");
      push("Descuento QuickPaid", anyDet.quickpaid_descuento ?? "");
      push("Precio QuickPaid", anyDet.precio_quickpaid ?? "");
    }

    // Facturas
    facturas.forEach((f, idx) => {
      const n = idx + 1;
      push(`Factura ${n} - Folio`, f.folio);
      push(`Factura ${n} - Referencia`, f.ref);
      push(`Factura ${n} - Fecha envío`, f.envio ? new Date(f.envio).toLocaleDateString() : "");
      push(`Factura ${n} - Fecha pago`, f.pago ? new Date(f.pago).toLocaleDateString() : "");
    });

    // Cliente
    push("Cliente - RFC", c?.rfc || "");
    push("Cliente - Divisa de pago", c?.divisa_pago || c?.moneda_preferida || "");
    push("Cliente - Empresa facturadora", c?.empresa_facturadora || c?.razon_social || c?.nombre_comercial || "");
    const contactoNombre = anyDet.info_representante?.nombre || anyDet.representante_cliente || c?.contacto || "";
    const contactoTel = anyDet.info_representante?.telefono || c?.telefono || c?.telefono_contacto || "";
    const contactoEmail = anyDet.info_representante?.email || c?.correo || c?.correo_contacto || "";
    push("Cliente - Contacto", contactoNombre);
    push("Cliente - Teléfono", contactoTel);
    push("Cliente - Correo", contactoEmail);

    // Entrega
    push("Lugar de Recolecta", anyDet.direccion_recolecta || anyDet.direccionRecolecta || "");
    push("Lugar de Entrega", anyDet.direccion_entrega || anyDet.direccionEnganche || "");
    push("Fecha/Hora Recolecta", `${anyDet.fecha_recolecta || ""} ${anyDet.hora_recolecta || ""}`.trim());
    push("Fecha/Hora Entrega", `${anyDet.fecha_entrega || anyDet.fechaEntrega || ""} ${anyDet.hora_entrega || ""}`.trim());

    // CSV
    const header = ["Campo", "Valor"]; 
    const csv = [header.join(",")].concat(
      rows.map((r) => `"${(r.Campo || "").replace(/"/g, '"')}","${(r.Valor || "").replace(/"/g, '"')}"`)
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `detalle_embarque_${embarqueDetalle.folio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [embarqueDetalle, getClienteById]);

  // Totales anuales (incluyen archivados) para que no disminuyan al archivar
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [yearlyFleteMXN, setYearlyFleteMXN] = useState<number>(0);
  const [yearlyFleteUSD, setYearlyFleteUSD] = useState<number>(0);

  useEffect(() => {
    mounted.current = true;
    const cargarTotalesAnuales = async () => {
      try {
        const desde = `${currentYear}-01-01`;
        const hasta = `${currentYear}-12-31`;
        const { data, error } = await supabase
          .from("embarques")
          .select(
            `precio_flete, moneda_flete, fecha_creacion, cantidad_final_facturada, estado, estado_facturacion`
          )
          .eq("estado", "finalizado")
          .gte("fecha_creacion", desde)
          .lte("fecha_creacion", hasta);

        if (error) {
          console.error("Error cargando totales anuales:", error);
          return;
        }

        let sumMXN = 0;
        let sumUSD = 0;
        (data || []).forEach((e: any) => {
          const currency = e?.moneda_flete || "MXN";
          let monto = 0;
          if (typeof e?.precio_flete === "number") monto = e.precio_flete;
          else if (typeof e?.precio_flete === "string")
            monto = Number(e.precio_flete) || 0;
          else if (typeof e?.cantidad_final_facturada === "number")
            monto = e.cantidad_final_facturada || 0;

          if (currency === "USD") sumUSD += monto || 0;
          else sumMXN += monto || 0;
        });

        if (mounted.current) {
          setYearlyFleteMXN(sumMXN);
          setYearlyFleteUSD(sumUSD);
        }
      } catch (e) {
        console.error("Excepción al calcular totales anuales:", e);
      }
    };
    cargarTotalesAnuales();
    return () => {
      mounted.current = false;
    };
  }, [currentYear]);

  useEffect(() => {
    mounted.current = true;
    const cargarEmbarquesFacturados = async () => {
      setLoadingEmbarques(true);
      try {
        const { data, error } = await supabase
          .from("embarques")
          .select(
            `
      *,
      cliente:clientes(*),
      operador:operadores(*),
      camion:camiones(*),
      remolque:remolques(*)
    `
          )
          // Mostrar únicamente embarques finalizados (tolerante a mayúsculas/espacios) y que no estén archivados en facturación
          .ilike("estado", "finalizado%")
          // Incluir registros con estado_facturacion NULL o distinto de 'archivado'
          .or("estado_facturacion.is.null,estado_facturacion.neq.archivado")
          .order("fecha_creacion", { ascending: false });

        if (error) {
          console.error("Error cargando embarques facturados:", error);
          if (mounted.current) setEmbarquesAsignados([]);
        } else {
          const embarquesFormateados: EmbarqueAsignado[] = (data || []).map(
            (embarque) => ({
              ...embarque,
              // Normalizamos monto flete a número cuando venga como string
              precioFlete:
                typeof (embarque as any).precio_flete === "string"
                  ? Number((embarque as any).precio_flete)
                  : typeof (embarque as any).precio_flete === "number"
                  ? (embarque as any).precio_flete
                  : undefined,
              clienteNombre:
                embarque.cliente?.nombre || "Cliente no especificado", // Corrected field name
              // Normalizamos fechaAsignacion para usarla en filtros/orden
              fechaAsignacion: embarque.fecha_creacion,
              operadorAsignado: embarque.operador
                ? {
                    id: embarque.operador.id,
                    nombre: `${embarque.operador.nombre} ${
                      embarque.operador.apellidos || ""
                    }`.trim(),
                  }
                : { id: "", nombre: "Sin asignar" },
              camionAsignado: embarque.camion
                ? {
                    id: embarque.camion.id,
                    marca: embarque.camion.marca,
                    modelo: embarque.camion.modelo,
                    numeroEconomico: embarque.camion.numero_economico,
                  }
                : {
                    id: "",
                    marca: "Sin asignar",
                    modelo: "",
                    numeroEconomico: "",
                  },
              folio_factura_1: embarque.folio_factura_1,
              folio_factura_2: embarque.folio_factura_2,
              folio_factura_3: embarque.folio_factura_3,
              folio_factura_4: embarque.folio_factura_4,
              fecha_envio_cliente: embarque.fecha_envio_cliente,
              fecha_pago: embarque.fecha_pago,
              referencia_pago: embarque.referencia_pago,
              observacionesFacturacion: (embarque as any)
                .observaciones_facturacion,
              fecha_creacion: embarque.fecha_creacion,
              direccionRecolecta: embarque.direccion_recolecta || "",
              direccionEnganche: embarque.direccion_entrega || "",
              // Operativos extra
              patente_agente_aduanal: (embarque as any).patente_agente_aduanal || (embarque as any).patente || "",
              aduana_cruce: (embarque as any).aduana_cruce || (embarque as any).aduana || "",
              dueno_mercancia: (embarque as any).dueno_mercancia || (embarque as any).dueno || "",
              contenido: (embarque as any).contenido || "",
              peso: (embarque as any).peso ?? (embarque as any).peso_kg ?? "",
            })
          );
          if (mounted.current) setEmbarquesAsignados(embarquesFormateados);
        }
      } catch (error) {
        console.error("Error cargando embarques facturados:", error);
        if (mounted.current) setEmbarquesAsignados([]);
      } finally {
        if (mounted.current) setLoadingEmbarques(false);
      }
    };
    cargarEmbarquesFacturados();
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    mounted.current = true;
    const loadClientsFromDatabase = async () => {
      try {
        const { data: clientesData, error: clientesError } = await supabase
          .from("clientes")
          .select("*")
          .eq("estado", "activo")
          .order("nombre");

        if (clientesError) {
          console.error("Error loading clients:", clientesError);
          const clientesGuardados = JSON.parse(
            localStorage.getItem("clientes") || "[]"
          );
          if (mounted.current) setClientes(clientesGuardados);
        } else {
          if (mounted.current) setClientes(clientesData || []);
        }

        const { data: creditosData, error: creditosError } = await supabase
          .from("creditos_clientes")
          .select("cliente_id, limite_credito_usd, limite_credito_mxn")
          .eq("activo", true);

        if (creditosError && creditosError.code !== "PGRST116") {
          console.error("Error checking existing credit limit:", creditosError);
          return;
        }

        if (creditosError) {
          console.error("Error loading credit limits:", creditosError);
          const creditosGuardados = JSON.parse(
            localStorage.getItem("creditLimits") || "{}"
          );
          if (mounted.current) setCreditLimits(creditosGuardados);
        } else {
          const creditLimitsMap: {
            [key: string]: { usd: number; mxn: number };
          } = {};
          creditosData?.forEach((credito) => {
            creditLimitsMap[credito.cliente_id] = {
              usd: credito.limite_credito_usd || 0,
              mxn: credito.limite_credito_mxn || 0,
            };
          });
          if (mounted.current) setCreditLimits(creditLimitsMap);
        }
      } catch (error) {
        console.error("Error in loadClientsFromDatabase:", error);
        const clientesGuardados = JSON.parse(
          localStorage.getItem("clientes") || "[]"
        );
        const creditosGuardados = JSON.parse(
          localStorage.getItem("creditLimits") || "{}"
        );
        if (mounted.current) {
          setClientes(clientesGuardados);
          setCreditLimits(creditosGuardados);
        }
      }
    };

    loadClientsFromDatabase();
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    mounted.current = true;
    const loadTiposServicio = async () => {
      setLoadingTiposServicio(true);
      try {
        const tiposData = await obtenerTiposServicio();
        if (mounted.current) setTiposServicio(tiposData || []);
      } catch (error) {
        console.error("Error loading tipos de servicio:", error);
        const tiposDefault: TipoServicio[] = [
          {
            id: "exportacion-cargada-caja-seca-240",
            nombre: "EXPORTACIÓN CARGADA - CAJA SECA 240",
            precio_base: 1800,
            descripcion:
              "Servicio de exportación con contenedor de caja seca cargada - Zona 240",
            activo: true,
            fecha_creacion: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "importacion-cargada-caja-seca-240",
            nombre: "IMPORTACIÓN CARGADA - CAJA SECA 240",
            precio_base: 1700,
            descripcion:
              "Servicio de importación con contenedor de caja seca cargada - Zona 240",
            activo: true,
            fecha_creacion: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "otro",
            nombre: "OTRO",
            precio_base: 0,
            descripcion:
              "Servicio personalizado según necesidades específicas del cliente",
            activo: true,
            fecha_creacion: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        if (mounted.current) setTiposServicio(tiposDefault);
      } finally {
        if (mounted.current) setLoadingTiposServicio(false);
      }
    };

    loadTiposServicio();
    return () => {
      mounted.current = false;
    };
  }, []);

  const operadoresUnicos = Array.from(
    new Set(
      (embarquesAsignados || [])
        .map((embarque) => embarque?.operadorAsignado?.nombre)
        .filter(Boolean) as string[]
    )
  )
    .map((nombre) => {
      const operador = (embarquesAsignados || []).find(
        (e) => e?.operadorAsignado?.nombre === nombre
      )?.operadorAsignado;
      return operador;
    })
    .filter(
      (
        op
      ): op is {
        id: string;
        nombre: string;
      } => Boolean(op)
    );

  const embarquesFiltrados = (embarquesAsignados || []).filter((embarque) => {
    if (!embarque) return false;
    // Mostrar solo embarques finalizados; tolerante a mayúsculas/espacios. Sólo se ocultan si están archivados en facturación
    const estadoNorm = String(embarque.estado || "").trim().toLowerCase();
    if (estadoNorm !== "finalizado") return false;
    if (embarque.estado_facturacion === "archivado") return false;

    const currentSearchTerm = searchTerm || "";

    const coincideBusqueda =
      String(embarque.folio || "")
        .toLowerCase()
        .includes(currentSearchTerm.toLowerCase()) ||
      String(embarque.clienteNombre || "")
        .toLowerCase()
        .includes(currentSearchTerm.toLowerCase()) ||
      String(embarque.numeroLoad || "")
        .toLowerCase()
        .includes(currentSearchTerm.toLowerCase()) ||
      String(embarque.operadorAsignado?.nombre || "")
        .toLowerCase()
        .includes(currentSearchTerm.toLowerCase());

    const coincideOperador =
      filtroOperador === "todos" ||
      embarque.operadorAsignado?.nombre === filtroOperador;

    const coincideFecha =
      !filtroFecha ||
      new Date(embarque.fechaAsignacion || "") >= new Date(filtroFecha);

    const coincideFechaHasta =
      !filtroFechaHasta ||
      new Date(embarque.fechaAsignacion || "") <= new Date(filtroFechaHasta);

    return (
      coincideBusqueda &&
      coincideOperador &&
      coincideFecha &&
      coincideFechaHasta
    );
  });

  const saveCreditLimit = async (
    clienteId: string,
    currency: "usd" | "mxn",
    limit: number
  ) => {
    const currentLimits = creditLimits[clienteId] || { usd: 0, mxn: 0 };
    const newLimits = {
      ...creditLimits,
      [clienteId]: {
        ...currentLimits,
        [currency]: limit,
      },
    };
    if (mounted.current) setCreditLimits(newLimits);
    localStorage.setItem("creditLimits", JSON.stringify(newLimits));

    try {
      const { data: existingRecord, error: selectError } = await supabase
        .from("creditos_clientes")
        .select("id")
        .eq("cliente_id", clienteId)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Error checking existing credit limit:", selectError);
        return;
      }

      if (existingRecord) {
        const { error: updateError } = await supabase
          .from("creditos_clientes")
          .update({
            limite_credito_usd: newLimits[clienteId].usd,
            limite_credito_mxn: newLimits[clienteId].mxn,
            updated_at: new Date().toISOString(),
          })
          .eq("cliente_id", clienteId);

        if (updateError) {
          console.error("Error updating credit limits:", updateError);
        }
      } else {
        const { error: insertError } = await supabase
          .from("creditos_clientes")
          .insert({
            cliente_id: clienteId,
            limite_credito_usd: newLimits[clienteId].usd,
            limite_credito_mxn: newLimits[clienteId].mxn,
            activo: true,
          });

        if (insertError) {
          console.error("Error inserting credit limits:", insertError);
        }
      }
    } catch (error) {
      console.error("Error saving credit limits to database:", error);
    }
  };

  const checkCreditExceeded = (
    clienteNombre: string,
    montoFacturado: number,
    moneda_flete: "MXN" | "USD" = "MXN"
  ) => {
    if (!clienteNombre || !clientes || clientes.length === 0) {
      return { exceeded: false, message: "" };
    }

    const cliente = clientes.find((c) => c?.nombre === clienteNombre); // Corrected field name
    if (!cliente) return { exceeded: false, message: "" };

    const clienteLimits = creditLimits?.[cliente.id] || { usd: 0, mxn: 0 };

    const clienteEmbarquesUSD = (embarquesFiltrados || []).filter(
      (e) =>
        e?.clienteNombre === clienteNombre &&
        !e?.pagado &&
        e?.moneda_flete === "USD"
    );
    const clienteEmbarquesMXN = (embarquesFiltrados || []).filter(
      (e) =>
        e?.clienteNombre === clienteNombre &&
        !e?.pagado &&
        (e?.moneda_flete === "MXN" || !e?.moneda_flete)
    );

    const totalPendienteUSD = clienteEmbarquesUSD.reduce(
      (sum, e) => sum + (e?.montoFacturado ?? (e as any)?.precioFlete ?? 0),
      0
    );
    const totalPendienteMXN = clienteEmbarquesMXN.reduce(
      (sum, e) => sum + (e?.montoFacturado ?? (e as any)?.precioFlete ?? 0),
      0
    );

    const isExceededUSD =
      totalPendienteUSD > clienteLimits.usd && clienteLimits.usd > 0;
    const isExceededMXN =
      totalPendienteMXN > clienteLimits.mxn && clienteLimits.mxn > 0;

    if (isExceededUSD || isExceededMXN) {
      return { exceeded: true, message: "Crédito excedido" };
    }

    return { exceeded: false, message: "" };
  };

  const guardarTipoServicio = async (tipoId: string, nuevoMonto: number) => {
    try {
      const { error } = await supabase
        .from("tipos_servicio")
        .update({
          precio_base: nuevoMonto,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tipoId);

      if (error) {
        console.error("Error updating tipo servicio:", error);
        alert(`Error al actualizar el tipo de servicio: ${error.message}`);
        return;
      }

      if (mounted.current) {
        setTiposServicio((prev) =>
          prev.map((tipo) =>
            tipo.id === tipoId
              ? {
                  ...tipo,
                  precio_base: nuevoMonto,
                }
              : tipo
          )
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el tipo de servicio");
    }
  };

  const normalizarIdDesdeNombre = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 100);
  };

  const crearNuevoTipoServicio = async () => {
    if (!nuevoTipo.nombre.trim()) {
      alert("Ingresa un nombre para el tipo de servicio");
      return;
    }
    setGuardandoNuevoTipo(true);
    try {
      const id = normalizarIdDesdeNombre(nuevoTipo.nombre);
      // Evitar colisión simple en cliente
      const existe = tiposServicio.some((t) => t.id === id);
      const finalId = existe ? `${id}-${Date.now().toString().slice(-4)}` : id;

      const payload = {
        id: finalId,
        nombre: nuevoTipo.nombre.trim(),
        descripcion: nuevoTipo.descripcion.trim() || null,
        categoria: nuevoTipo.categoria.trim() || "General",
        subcategoria: nuevoTipo.subcategoria.trim() || null,
        precio_base: Number(nuevoTipo.precio_base) || 0,
        activo: true,
        orden_display: (tiposServicio?.length || 0) + 1,
        updated_at: new Date().toISOString(),
      } as any;

      const { error } = await supabase.from("tipos_servicio").insert(payload);
      if (error) {
        console.error("Error creando tipo de servicio:", error);
        alert("No se pudo crear el tipo de servicio: " + (error.message || ""));
        return;
      }

      // Actualizar lista local y cerrar modal
      const nuevo: TipoServicio = {
        id: payload.id,
        nombre: payload.nombre,
        descripcion: payload.descripcion || undefined,
        categoria: payload.categoria,
        subcategoria: payload.subcategoria || undefined,
        precio_base: payload.precio_base,
        activo: true,
        orden_visualizacion: payload.orden_display,
        fecha_creacion: new Date().toISOString(),
        updated_at: payload.updated_at,
      };
      if (mounted.current) {
        setTiposServicio((prev) => [...prev, nuevo]);
        setShowCrearTipoModal(false);
        setNuevoTipo({
          nombre: "",
          descripcion: "",
          categoria: "",
          subcategoria: "",
          precio_base: 0,
        });
      }
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error creando el tipo de servicio.");
    } finally {
      if (mounted.current) setGuardandoNuevoTipo(false);
    }
  };

  const editarEmbarque = (embarque: EmbarqueAsignado) => {
    setEmbarqueEditando(embarque);
    setFormData({
      montoFacturado: embarque.montoFacturado || embarque.precioFlete || 0,
      fechaEntrega: embarque.fechaEntrega || "",
      observacionesFacturacion: embarque.observacionesFacturacion || "",
      pagado: embarque.pagado || false,
      fechaPago: embarque.fechaPago || "",
      estado_facturacion:
        embarque.estado_facturacion || "pendiente_facturacion",
      numeroFactura1: embarque.numero_factura_1 || "",
      numeroFactura2: embarque.numero_factura_2 || "",
      numeroFactura3: embarque.numero_factura_3 || "",
      fechaEnvioCliente: embarque.fechaEnvioCliente || "",
      referenciaPago: embarque.referenciaPago || "",
    });
    setShowEditDialog(true);
  };

  const guardarCambios = async () => {
    if (!embarqueEditando) return;

    let usuarioActual = "Usuario Actual";
    try {
      const { getCurrentUser } = await import("../../lib/auth");
      const user = getCurrentUser && getCurrentUser();
      if (user && user.nombre) usuarioActual = user.nombre;
    } catch {}

    try {
      const { error } = await supabase
        .from("embarques")
        .update({
          precio_flete: formData.montoFacturado,
          fecha_entrega: formData.fechaEntrega || null,
          observaciones_facturacion: formData.observacionesFacturacion || null,
          pagado: formData.pagado,
          fecha_pago: formData.fechaPago || null,
          estado_facturacion: formData.estado_facturacion,
          numero_factura_1: formData.numeroFactura1 || null,
          numero_factura_2: formData.numeroFactura2 || null,
          numero_factura_3: formData.numeroFactura3 || null,
          fecha_envio_cliente: formData.fechaEnvioCliente || null,
          referencia_pago: formData.referenciaPago || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarqueEditando.id);

      if (error) {
        console.error("Error actualizando embarque:", error);
        alert("Error al guardar los cambios");
        return;
      }

      const embarquesActualizados = embarquesAsignados.map((embarque) =>
        embarque.id === embarqueEditando.id
          ? {
              ...embarque,
              montoFacturado: formData.montoFacturado,
              precioFlete: formData.montoFacturado,
              fechaEntrega: formData.fechaEntrega,
              observacionesFacturacion: formData.observacionesFacturacion,
              pagado: formData.pagado,
              fechaPago: formData.fechaPago,
              estado_facturacion:
                formData.estado_facturacion as EmbarqueAsignado["estado_facturacion"],
            }
          : embarque
      );

      if (mounted.current) {
        setEmbarquesAsignados(embarquesActualizados);
        localStorage.setItem(
          "embarquesAsignados",
          JSON.stringify(embarquesActualizados)
        );
        setShowEditDialog(false);
        setEmbarqueEditando(null);
      }
      // Audit log: modificación de embarque
      try {
        const { agregarAuditLog } = await import("../../lib/audit");
        agregarAuditLog(
          "ACTUALIZAR",
          "Facturación/Cobranza",
          `Modificación de embarque folio ${embarqueEditando.folio} por usuario ${usuarioActual}`
        );
      } catch {}
      alert("Cambios guardados exitosamente");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar los cambios");
    }
  };

  const abrirModalFacturacion = (embarque: EmbarqueAsignado) => {
    setEmbarqueFacturacion(embarque);
    setFacturacionData({
      numeroFactura1:
        embarque.foliosFactura?.folio1 ||
        (embarque as any).folio_factura_1 ||
        (embarque as any).numero_factura_1 ||
        "",
      numeroFactura2:
        embarque.foliosFactura?.folio2 ||
        (embarque as any).folio_factura_2 ||
        (embarque as any).numero_factura_2 ||
        "",
      numeroFactura3:
        embarque.foliosFactura?.folio3 ||
        (embarque as any).folio_factura_3 ||
        (embarque as any).numero_factura_3 ||
        "",
      numeroFactura4:
        embarque.foliosFactura?.folio4 ||
        (embarque as any).folio_factura_4 ||
        (embarque as any).numero_factura_4 ||
        "",
      fechaEnvioCliente1:
        (embarque as any).fecha_envio_cliente_1 ||
        (embarque as any).fecha_envio_cliente ||
        "",
      fechaEnvioCliente2: (embarque as any).fecha_envio_cliente_2 || "",
      fechaEnvioCliente3: (embarque as any).fecha_envio_cliente_3 || "",
      fechaEnvioCliente4: (embarque as any).fecha_envio_cliente_4 || "",
      fechaPagoCliente1:
        (embarque as any).fecha_pago_1 || (embarque as any).fecha_pago || "",
      fechaPagoCliente2: (embarque as any).fecha_pago_2 || "",
      fechaPagoCliente3: (embarque as any).fecha_pago_3 || "",
      fechaPagoCliente4: (embarque as any).fecha_pago_4 || "",
      referenciaPago1:
        (embarque as any).referencia_pago_1 ||
        (embarque as any).referencia_pago ||
        "",
      referenciaPago2: (embarque as any).referencia_pago_2 || "",
      referenciaPago3: (embarque as any).referencia_pago_3 || "",
      referenciaPago4: (embarque as any).referencia_pago_4 || "",
      observacionesFacturacion:
        (embarque as any).observaciones_facturacion ||
        embarque.observacionesFacturacion ||
        "",
    });
    setShowFacturacionModal(true);
  };

  const guardarDatosFacturacion = async () => {
    if (!embarqueFacturacion) return;

    try {
      // Tomar el primer valor no vacío para columnas legadas
      const firstEnvio =
        (facturacionData.fechaEnvioCliente1 ||
          facturacionData.fechaEnvioCliente2 ||
          facturacionData.fechaEnvioCliente3 ||
          facturacionData.fechaEnvioCliente4 ||
          "") || null;
      const firstPago =
        (facturacionData.fechaPagoCliente1 ||
          facturacionData.fechaPagoCliente2 ||
          facturacionData.fechaPagoCliente3 ||
          facturacionData.fechaPagoCliente4 ||
          "") || null;
      const firstRef =
        (facturacionData.referenciaPago1 ||
          facturacionData.referenciaPago2 ||
          facturacionData.referenciaPago3 ||
          facturacionData.referenciaPago4 ||
          "") || null;

      const { error } = await supabase
        .from("embarques")
        .update({
          folio_factura_1: facturacionData.numeroFactura1 || null,
          folio_factura_2: facturacionData.numeroFactura2 || null,
          folio_factura_3: facturacionData.numeroFactura3 || null,
          folio_factura_4: facturacionData.numeroFactura4 || null,
          // Nuevas columnas por factura
          fecha_envio_cliente_1: facturacionData.fechaEnvioCliente1 || null,
          fecha_envio_cliente_2: facturacionData.fechaEnvioCliente2 || null,
          fecha_envio_cliente_3: facturacionData.fechaEnvioCliente3 || null,
          fecha_envio_cliente_4: facturacionData.fechaEnvioCliente4 || null,
          fecha_pago_1: facturacionData.fechaPagoCliente1 || null,
          fecha_pago_2: facturacionData.fechaPagoCliente2 || null,
          fecha_pago_3: facturacionData.fechaPagoCliente3 || null,
          fecha_pago_4: facturacionData.fechaPagoCliente4 || null,
          referencia_pago_1: facturacionData.referenciaPago1 || null,
          referencia_pago_2: facturacionData.referenciaPago2 || null,
          referencia_pago_3: facturacionData.referenciaPago3 || null,
          referencia_pago_4: facturacionData.referenciaPago4 || null,
          // Mantener columnas legadas para compatibilidad
          fecha_envio_cliente: firstEnvio,
          fecha_pago: firstPago,
          referencia_pago: firstRef,
          observaciones_facturacion:
            facturacionData.observacionesFacturacion || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarqueFacturacion.id);

      if (error) {
        console.error("Error actualizando datos de facturación:", error);
        alert(
          "Error: los datos de facturación NO se guardaron en la base de datos.\n\n" +
            (error.message || error.details || "")
        );
        return;
      }

      const embarquesActualizados = embarquesAsignados.map((embarque) =>
        embarque.id === embarqueFacturacion.id
          ? {
              ...embarque,
              foliosFactura: {
                folio1: facturacionData.numeroFactura1,
                folio2: facturacionData.numeroFactura2,
                folio3: facturacionData.numeroFactura3,
                folio4: facturacionData.numeroFactura4,
              },
              fecha_envio_cliente_1: facturacionData.fechaEnvioCliente1,
              fecha_envio_cliente_2: facturacionData.fechaEnvioCliente2,
              fecha_envio_cliente_3: facturacionData.fechaEnvioCliente3,
              fecha_envio_cliente_4: facturacionData.fechaEnvioCliente4,
              fecha_pago_1: facturacionData.fechaPagoCliente1,
              fecha_pago_2: facturacionData.fechaPagoCliente2,
              fecha_pago_3: facturacionData.fechaPagoCliente3,
              fecha_pago_4: facturacionData.fechaPagoCliente4,
              referencia_pago_1: facturacionData.referenciaPago1,
              referencia_pago_2: facturacionData.referenciaPago2,
              referencia_pago_3: facturacionData.referenciaPago3,
              referencia_pago_4: facturacionData.referenciaPago4,
              // legados para pantallas que aún lean los antiguos
              fechaEnvioCliente: firstEnvio || undefined as any,
              fechaPago: firstPago || undefined as any,
              referenciaPago: firstRef || undefined as any,
              observacionesFacturacion:
                facturacionData.observacionesFacturacion,
            }
          : embarque
      );

      if (mounted.current) {
        setEmbarquesAsignados(embarquesActualizados);
        localStorage.setItem(
          "embarquesAsignados",
          JSON.stringify(embarquesActualizados)
        );

        alert("¡Registro de facturación guardado exitosamente en Supabase!");

        setShowFacturacionModal(false);
        setEmbarqueFacturacion(null);

        setFacturacionData({
          numeroFactura1: "",
          numeroFactura2: "",
          numeroFactura3: "",
          numeroFactura4: "",
          fechaEnvioCliente1: "",
          fechaEnvioCliente2: "",
          fechaEnvioCliente3: "",
          fechaEnvioCliente4: "",
          fechaPagoCliente1: "",
          fechaPagoCliente2: "",
          fechaPagoCliente3: "",
          fechaPagoCliente4: "",
          referenciaPago1: "",
          referenciaPago2: "",
          referenciaPago3: "",
          referenciaPago4: "",
          observacionesFacturacion: "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      let msg = "";
      if (typeof error === "object" && error && "message" in error) {
        msg = (error as any).message;
      }
      alert("Error al guardar los datos de facturación.\n\n" + msg);
    }
  };

  const exportCreditDataToExcel = () => {
    let csv =
      "Cliente,Límite USD,Adeudado USD,Límite MXN,Adeudado MXN,Estado Crédito\n";
    filteredClients.forEach((cliente) => {
      const clienteEmbarquesUSD = embarquesFiltrados.filter(
        (e) =>
          e.cliente_id === cliente.id && !e.pagado && e.moneda_flete === "USD"
      );
      const clienteEmbarquesMXN = embarquesFiltrados.filter(
        (e) =>
          e.cliente_id === cliente.id &&
          !e.pagado &&
          (e.moneda_flete === "MXN" || !e.moneda_flete)
      );

      const totalPendienteUSD = clienteEmbarquesUSD.reduce(
        (sum, e) => sum + (e.montoFacturado || 0),
        0
      );
      const totalPendienteMXN = clienteEmbarquesMXN.reduce(
        (sum, e) => sum + (e.montoFacturado || 0),
        0
      );

      const limiteUSD = creditLimits[cliente.id]?.usd || 0;
      const limiteMXN = creditLimits[cliente.id]?.mxn || 0;

      const excedeUSD = totalPendienteUSD > limiteUSD && limiteUSD > 0;
      const excedeMXN = totalPendienteMXN > limiteMXN && limiteMXN > 0;
      const estadoCredito = excedeUSD || excedeMXN ? "Excedido" : "Ok";

      csv += `${cliente.nombre},${limiteUSD},${totalPendienteUSD},${limiteMXN},${totalPendienteMXN},${estadoCredito}\n`; // Corrected field name
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "credito_clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const generarReporteExcel = () => {
    try {
      const datosReporte = {
        periodo: `${filtroFecha || "Inicio"} - ${filtroFechaHasta || "Fin"}`,
        operador:
          filtroOperador === "todos" ? "Todos los operadores" : filtroOperador,
        totalEmbarques: embarquesFiltrados.length,
        montoTotal: embarquesFiltrados.reduce(
          (sum, e) => sum + (e.montoFacturado || 0),
          0
        ),
        embarques: embarquesFiltrados.map((e) => ({
          folio: e.folio,
          cliente: e.clienteNombre,
          operador: e.operadorAsignado.nombre,
          camion: `${e.camionAsignado.marca} ${e.camionAsignado.modelo} (${e.camionAsignado.numeroEconomico})`,
          fechaAsignacion: e.fechaAsignacion,
          montoFacturado: e.montoFacturado || e.precioFlete || 0,
          moneda: e.moneda_flete || "MXN",
          pagado: e.pagado ? "Sí" : "No",
          estado: e.estado_facturacion || "pendiente_facturacion",
        })),
      };

      console.log("Generando reporte Excel:", datosReporte);

      alert("Reporte Excel generado exitosamente (simulado)");
    } catch (error) {
      console.error("Error al generar reporte Excel:", error);
      alert("Error al generar el reporte Excel");
    }
  };

  const verDetallesEmbarque = (embarque: EmbarqueAsignado) => {
    setEmbarqueDetalle(embarque);

    setFacturacionFormData({
      folio1: embarque.numero_factura_1 || "",
      folio2: embarque.numero_factura_2 || "",
      folio3: embarque.numero_factura_3 || "",
      folio4: embarque.numero_factura_4 || "",
      cantidadFinalFacturada:
        embarque.cantidad_final_facturada || embarque.precioFlete || 0,
      observacionesFacturacion: embarque.observacionesFacturacion || "",
    });

    setShowDetailModal(true);
  };

  const guardarInformacionFacturacion = async () => {
    if (!embarqueDetalle) return;

    try {
      const { error } = await supabase
        .from("embarques")
        .update({
          folio_factura_1: facturacionFormData.folio1 || null,
          folio_factura_2: facturacionFormData.folio2 || null,
          folio_factura_3: facturacionFormData.folio3 || null,
          folio_factura_4: facturacionFormData.folio4 || null,
          cantidad_final_facturada:
            facturacionFormData.cantidadFinalFacturada || null,
          observaciones_facturacion:
            facturacionFormData.observacionesFacturacion || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", embarqueDetalle.id);

      if (error) {
        console.error("Error actualizando información de facturación:", error);
        alert("Error al guardar la información de facturación");
        return;
      }

      const embarquesActualizados = embarquesAsignados.map((embarque) =>
        embarque.id === embarqueDetalle.id
          ? {
              ...embarque,
              foliosFactura: {
                folio1: facturacionFormData.folio1,
                folio2: facturacionFormData.folio2,
                folio3: facturacionFormData.folio3,
                folio4: facturacionFormData.folio4,
              },
              cantidadFinalFacturada:
                facturacionFormData.cantidadFinalFacturada,
              observacionesFacturacion:
                facturacionFormData.observacionesFacturacion,
            }
          : embarque
      );

      if (mounted.current) {
        setEmbarquesAsignados(embarquesActualizados);
        localStorage.setItem(
          "embarquesAsignados",
          JSON.stringify(embarquesActualizados)
        );

        setEmbarqueDetalle({
          ...embarqueDetalle,
          foliosFactura: {
            folio1: facturacionFormData.folio1,
            folio2: facturacionFormData.folio2,
            folio3: facturacionFormData.folio3,
            folio4: facturacionFormData.folio4,
          },
          cantidadFinalFacturada: facturacionFormData.cantidadFinalFacturada,
          observacionesFacturacion:
            facturacionFormData.observacionesFacturacion,
        });

        setShowFacturacionEditModal(false);
      }
      alert("Información de facturación actualizada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar la información de facturación");
    }
  };

  const [showClientesModal, setShowClientesModal] = useState(false);
  const [activeClientesTab, setActiveClientesTab] = useState("detalle");
  const [clientesPeriodo, setClientesPeriodo] = useState({
    desde: "",
    hasta: "",
  });
  const [clienteSeleccionado, setClienteSeleccionado] = useState("todos");
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");
  const [filtroStatusCliente, setFiltroStatusCliente] = useState("todos");
  const [filtroPeriodoClientes, setFiltroPeriodoClientes] = useState("custom");

  const [loadingClienteEmbarques, setLoadingClienteEmbarques] = useState(false);
  const [embarquesClienteFiltrados, setEmbarquesClienteFiltrados] = useState<
    EmbarqueAsignado[]
  >([]);

  const [currentPageClientes, setCurrentPageClientes] = useState(1);
  const [itemsPerPageClientes, setItemsPerPageClientes] = useState(10);

  // Control Clientes
  const [showControlClientesModal, setShowControlClientesModal] = useState(false);
  const [controlClienteSeleccionado, setControlClienteSeleccionado] = useState<string | null>(null);
  const [controlClientesTab, setControlClientesTab] = useState<"activos" | "archivados">("activos");
  const [controlClientesPeriodo, setControlClientesPeriodo] = useState<{ desde: string | null; hasta: string | null }>({
    desde: null,
    hasta: null,
  });
  const [controlClientesRango, setControlClientesRango] = useState<string>("mes_actual");

  const setRangoControlClientes = (value: string) => {
    setControlClientesRango(value);
    const today = new Date();
    const toISO = (d: Date) => d.toISOString().split("T")[0];
    const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
    if (value === "mes_actual") {
      setControlClientesPeriodo({ desde: toISO(startOfMonth(today)), hasta: toISO(today) });
    } else if (value === "mes_anterior") {
      const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      setControlClientesPeriodo({ desde: toISO(startOfMonth(prev)), hasta: toISO(endOfMonth(prev)) });
    } else if (value === "dos_meses_atras") {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      setControlClientesPeriodo({ desde: toISO(from), hasta: toISO(today) });
    } else if (value === "seis_meses_atras") {
      const from = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      setControlClientesPeriodo({ desde: toISO(from), hasta: toISO(today) });
    } else {
      // custom
      setControlClientesPeriodo((p) => ({ desde: p.desde, hasta: p.hasta }));
    }
  };

  // Al abrir el modal, aplicar el rango por defecto
  useEffect(() => {
    if (showControlClientesModal) {
      setRangoControlClientes(controlClientesRango || "mes_actual");
    }
  }, [showControlClientesModal]);

  // Ordenamiento en Control Clientes
  type ControlClientesSortColumn = "folio" | "load" | "tipo" | "fecha" | "monto" | "estado";
  const [controlClientesSortBy, setControlClientesSortBy] = useState<ControlClientesSortColumn>("fecha");
  const [controlClientesSortDir, setControlClientesSortDir] = useState<"asc" | "desc">("desc");

  const toggleControlClientesSort = (col: ControlClientesSortColumn) => {
    setControlClientesSortBy((prev) => {
      if (prev === col) {
        setControlClientesSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setControlClientesSortDir("asc");
      return col;
    });
  };

  const renderSortHeader = (label: string, col: ControlClientesSortColumn) => {
    const isActive = controlClientesSortBy === col;
    const indicator = isActive ? (controlClientesSortDir === "asc" ? "▲" : "▼") : "↕";
    return (
      <button
        type="button"
        className="flex items-center gap-1 select-none cursor-pointer"
        onClick={() => toggleControlClientesSort(col)}
      >
        <span>{label}</span>
        <span className="text-xs text-gray-500">{indicator}</span>
      </button>
    );
  };

  const getTipoNombreFor = (e: any) =>
    tiposServicio.find((t) => t.id === (e as any).tipo_servicio_id)?.nombre ||
    (e as any).tipoServicioNombre ||
    (e as any).tipoServicio ||
    "-";

  const compareControlClientes = (a: any, b: any) => {
    const dir = controlClientesSortDir === "asc" ? 1 : -1;
    const by = controlClientesSortBy;
    const safeStr = (v: any) => (v ?? "").toString().toLowerCase();
    const safeNum = (v: any) => (typeof v === "number" ? v : Number(v) || 0);
    const dateOf = (e: any) => new Date(e.fecha_creacion || e.updated_at || 0).getTime();
    const amountOf = (e: any) => {
      const mf = (e as any).montoFacturado;
      const pf = (e as any).precioFlete;
      const m = typeof mf === "number" ? mf : typeof mf === "string" ? Number(mf) : undefined;
      const p = typeof pf === "number" ? pf : typeof pf === "string" ? Number(pf) : 0;
      return typeof m === "number" ? m : p;
    };
    let va: any;
    let vb: any;
    switch (by) {
      case "folio":
        va = safeStr(a.folio);
        vb = safeStr(b.folio);
        break;
      case "load":
        va = safeStr(a.load_number);
        vb = safeStr(b.load_number);
        break;
      case "tipo":
        va = safeStr(getTipoNombreFor(a));
        vb = safeStr(getTipoNombreFor(b));
        break;
      case "fecha":
        va = dateOf(a);
        vb = dateOf(b);
        break;
      case "monto":
        va = safeNum(amountOf(a));
        vb = safeNum(amountOf(b));
        break;
      case "estado":
        va = safeStr(a.estado_facturacion || "");
        vb = safeStr(b.estado_facturacion || "");
        break;
      default:
        va = 0;
        vb = 0;
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  };

  const handlePeriodoClientesChange = (value: string) => {
    setFiltroPeriodoClientes(value);
    const hoy = new Date();
    let inicio = "";
    let fin = "";

    if (value === "current_month") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else if (value === "last_month") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
        .toISOString()
        .slice(0, 10);
    } else if (value === "last_2_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else if (value === "last_3_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else if (value === "last_6_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else {
      inicio = "";
      fin = "";
    }
    setClientesPeriodo({ desde: inicio, hasta: fin });
  };

  const consultarEmbarquesPorCliente = useCallback(async () => {
    setLoadingClienteEmbarques(true);
    if (mounted.current) setEmbarquesClienteFiltrados([]);
    try {
      let query = supabase
        .from("embarques")
        .select(
          `
        *,
        cliente:clientes(id, nombre),
        operador:operadores(id, nombre, apellidos)
      `
        )
  .eq("estado", "finalizado")
        .order("fecha_creacion", { ascending: false });

      if (clienteSeleccionado && clienteSeleccionado !== "todos") {
        query = query.eq("cliente_id", clienteSeleccionado);
      }

      if (filtroStatusCliente && filtroStatusCliente !== "todos") {
        query = query.eq("estado_facturacion", filtroStatusCliente);
      }

      if (clientesPeriodo.desde) {
        query = query.gte("fecha_creacion", clientesPeriodo.desde);
      }
      if (clientesPeriodo.hasta) {
        query = query.lte("fecha_creacion", clientesPeriodo.hasta);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error al consultar embarques por cliente:", error);
        alert("Error al consultar embarques por cliente: " + error.message);
        if (mounted.current) setEmbarquesClienteFiltrados([]);
        return;
      }

      const embarquesFormateados: EmbarqueAsignado[] = (data || []).map(
        (embarque: any) => ({
          ...embarque,
          clienteNombre: embarque.cliente?.nombre || "Cliente no especificado", // Corrected field name
          operadorAsignado: embarque.operador
            ? {
                id: embarque.operador.id,
                nombre: `${embarque.operador.nombre} ${
                  embarque.operador.apellidos || ""
                }`.trim(),
              }
            : { id: "", nombre: "Sin asignar" },
          modificadoPorEmergencia: embarquesModificadosIds.includes(
            embarque.id
          ),
          precioFlete: embarque.precio_flete,
          numeroLoad: embarque.load_number,
        })
      );

      const filteredBySearch = embarquesFormateados.filter((e) => {
        const searchLower = (clienteSearchTerm || "").toLowerCase();
        return (
          String(e.folio || "")
            .toLowerCase()
            .includes(searchLower) ||
          String(e.clienteNombre || "")
            .toLowerCase()
            .includes(searchLower) ||
          String(e.numeroLoad || "")
            .toLowerCase()
            .includes(searchLower) ||
          String(e.operadorAsignado?.nombre || "")
            .toLowerCase()
            .includes(searchLower)
        );
      });

      if (mounted.current) {
        setEmbarquesClienteFiltrados(filteredBySearch);
        setCurrentPageClientes(1);
      }
    } catch (error) {
      console.error("Excepción al consultar embarques por cliente:", error);
      alert("Error inesperado al consultar embarques por cliente.");
    } finally {
      if (mounted.current) setLoadingClienteEmbarques(false);
    }
  }, [
    clienteSeleccionado,
    clientesPeriodo.desde,
    clientesPeriodo.hasta,
    clienteSearchTerm,
    embarquesModificadosIds,
    filtroStatusCliente,
  ]);

  useEffect(() => {
    if (showClientesModal) {
      consultarEmbarquesPorCliente();
    }
  }, [showClientesModal, consultarEmbarquesPorCliente]);

  const exportarEmbarquesClienteExcel = () => {
    let csv =
      "Folio,Cliente,Load,Fecha,Monto Flete,Moneda,Estado,Contingencia\n";
    embarquesClienteFiltrados.forEach((e) => {
      csv += `${e.folio},${e.clienteNombre},${e.numeroLoad},${new Date(
        e.fechaAsignacion!
      ).toLocaleDateString()},${e.precioFlete},${e.moneda_flete || "MXN"},${
        e.estado_facturacion || "N/A"
      },${e.modificadoPorEmergencia ? "Sí" : "No"}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "embarques_por_cliente.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredClients = useMemo(() => {
    const searchLower = creditClientSearchTerm.toLowerCase();
    return clientes.filter((cliente) => {
      if (!cliente || !cliente.nombre) return false; // Corrected field name
      return cliente.nombre.toLowerCase().includes(searchLower); // Corrected field name
    });
  }, [clientes, creditClientSearchTerm]);

  const totalPagesCredit = Math.ceil(
    filteredClients.length / itemsPerPageCredit
  );

  const paginatedClientsCredit = useMemo(() => {
    const startIndex = (currentPageCredit - 1) * itemsPerPageCredit;
    const endIndex = startIndex + itemsPerPageCredit;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPageCredit, itemsPerPageCredit]);

  const handlePageChangeCredit = (page: number) => {
    if (page > 0 && page <= totalPagesCredit) {
      setCurrentPageCredit(page);
    }
  };

  const operacionesPorPeriodo = embarquesAsignados.filter((e) => {
    if (!clientesPeriodo.desde && !clientesPeriodo.hasta) return true;
    const fecha = new Date(e.fechaAsignacion);
    const desde = clientesPeriodo.desde
      ? new Date(clientesPeriodo.desde)
      : null;
    const hasta = clientesPeriodo.hasta
      ? new Date(clientesPeriodo.hasta)
      : null;
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;
    return true;
  });

  const operacionesPorCliente = clientes
    .map((cliente) => ({
      cliente,
      operaciones: operacionesPorPeriodo.filter(
        (e) => e.clienteNombre === cliente.nombre
      ), // Corrected field name
    }))
    .filter((c) => c.operaciones.length > 0);

  const operacionesPorTipoServicio = tiposServicio
    .map((tipo) => ({
      tipo,
      operaciones: operacionesPorPeriodo.filter(
        (e) => e.tipoServicio === tipo.nombre
      ),
    }))
    .filter((t) => t.operaciones.length > 0);

  const handlePeriodoPagosChange = (value: string) => {
    setFiltroPeriodoPagos(value);
    const hoy = new Date();
    let inicio = "";
    let fin = "";

    if (value === "current_month") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else if (value === "last_month") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
        .toISOString()
        .slice(0, 10);
    } else if (value === "last_2_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else if (value === "last_3_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else if (value === "last_6_months") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1)
        .toISOString()
        .slice(0, 10);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
    } else {
      inicio = "";
      fin = "";
    }
    setFechaInicioPagos(inicio);
    setFechaFinPagos(fin);
  };

  const operadorDesgloseData = useMemo(() => {
    const desgloseMap = new Map<
      string,
      {
        operador: { id: string; nombre: string };
        totalPagos: number;
        totalPagosMesActual: number;
        cantidadEmbarques: number;
        embarquesContingencia: number;
      }
    >();

    const hoy = new Date();
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMesActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    finMesActual.setHours(23, 59, 59, 999);

    embarquesOperadorFiltrados.forEach((embarque) => {
      const operadorId = embarque.operadorAsignado?.id || "unknown";
      const operadorNombre = embarque.operadorAsignado?.nombre || "Sin asignar";
      const pago = embarque.modificadoPorEmergencia
        ? (operadoresContingencia[embarque.id]?.original || 0) +
          (operadoresContingencia[embarque.id]?.reemplazo || 0)
        : embarque.pagoOperador || 0;

      if (!desgloseMap.has(operadorId)) {
        desgloseMap.set(operadorId, {
          operador: { id: operadorId, nombre: operadorNombre },
          totalPagos: 0,
          totalPagosMesActual: 0,
          cantidadEmbarques: 0,
          embarquesContingencia: 0,
        });
      }
      const data = desgloseMap.get(operadorId)!;
      data.totalPagos += pago;
      data.cantidadEmbarques++;
      if (embarque.modificadoPorEmergencia) {
        data.embarquesContingencia++;
      }

      const fechaEmbarque = new Date(embarque.fechaAsignacion!);
      if (fechaEmbarque >= inicioMesActual && fechaEmbarque <= finMesActual) {
        data.totalPagosMesActual += pago;
      }
    });
    return Array.from(desgloseMap.values());
  }, [embarquesOperadorFiltrados, operadoresContingencia]);

  const exportarDesgloseOperadoresExcel = () => {
    let csv =
      "Operador,Total Pagos,Total Pagos Mes Actual,Cantidad Embarques,Casos Contingencia\n";
    operadorDesgloseData.forEach((data) => {
      csv += `${data.operador.nombre},${data.totalPagos},${data.totalPagosMesActual},${data.cantidadEmbarques},${data.embarquesContingencia}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "desglose_operadores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPagosFiltrados = useMemo(() => {
    return embarquesOperadorFiltrados.reduce((sum, embarque) => {
      const pago = embarque.modificadoPorEmergencia
        ? (operadoresContingencia[embarque.id]?.original || 0) +
          (operadoresContingencia[embarque.id]?.reemplazo || 0)
        : embarque.pagoOperador || 0;
      return sum + pago;
    }, 0);
  }, [embarquesOperadorFiltrados, operadoresContingencia]);

  const desglosePorEmpresaData = useMemo(() => {
    const dataMap = new Map<
      string,
      {
        cliente: any;
        totalFacturadoMXN: number;
        totalFacturadoUSD: number;
        totalPagadoMXN: number;
        totalPagadoUSD: number;
        totalPendienteMXN: number;
        totalPendienteUSD: number;
        numFacturas: number;
        numFacturasPagadas: number;
        numFacturasPendientes: number;
      }
    >();

    embarquesClienteFiltrados.forEach((embarque) => {
      const clienteId = embarque.cliente_id || "unknown";
      const cliente = clientes.find((c) => c.id === clienteId) || {
        nombre: "Cliente Desconocido",
      }; // Corrected field name

      if (!dataMap.has(clienteId)) {
        dataMap.set(clienteId, {
          cliente,
          totalFacturadoMXN: 0,
          totalFacturadoUSD: 0,
          totalPagadoMXN: 0,
          totalPagadoUSD: 0,
          totalPendienteMXN: 0,
          totalPendienteUSD: 0,
          numFacturas: 0,
          numFacturasPagadas: 0,
          numFacturasPendientes: 0,
        });
      }

      const entry = dataMap.get(clienteId)!;
      const monto = embarque.precioFlete || embarque.montoFacturado || 0;

      entry.numFacturas++;

      if (embarque.moneda_flete === "USD") {
        entry.totalFacturadoUSD += monto;
        if (embarque.estado_facturacion === "pagado") {
          entry.totalPagadoUSD += monto;
          entry.numFacturasPagadas++;
        } else {
          entry.totalPendienteUSD += monto;
          entry.numFacturasPendientes++;
        }
      } else {
        entry.totalFacturadoMXN += monto;
        if (embarque.estado_facturacion === "pagado") {
          entry.totalPagadoMXN += monto;
          entry.numFacturasPagadas++;
        } else {
          entry.totalPendienteMXN += monto;
          entry.numFacturasPendientes++;
        }
      }
    });

    return Array.from(dataMap.values()).sort((a, b) =>
      a.cliente.nombre.localeCompare(b.cliente.nombre)
    ); // Corrected field name
  }, [embarquesClienteFiltrados, clientes]);

  const exportarDesgloseEmpresaExcel = () => {
    let csv =
      "Cliente,Total Facturado MXN,Total Pagado MXN,Total Pendiente MXN,Total Facturado USD,Total Pagado USD,Total Pendiente USD,Num Facturas,Num Facturas Pagadas,Num FacturasPendientes\n";
    desglosePorEmpresaData.forEach((data) => {
      csv += `${data.cliente.nombre},${data.totalFacturadoMXN},${data.totalPagadoMXN},${data.totalPendienteMXN},${data.totalFacturadoUSD},${data.totalPagadoUSD},${data.totalPendienteUSD},${data.numFacturas},${data.numFacturasPagadas},${data.numFacturasPendientes}\n`; // Corrected field name
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "desglose_por_empresa.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleContingencyPaymentChange = (
    embarqueId: string,
    field: "original" | "reemplazo",
    value: number
  ) => {
    if (mounted.current) {
      setOperadoresContingencia((prev) => {
        const current = prev[embarqueId] || { original: 0, reemplazo: 0 };

        return {
          ...prev,
          [embarqueId]: {
            ...current,
            [field]: value,
          },
        };
      });
    }
  };

  const saveContingencyPayment = async (embarque: EmbarqueAsignado) => {
    const currentDivision = operadoresContingencia[embarque.id];
    if (!currentDivision) {
      alert("No hay división de pago para guardar.");
      return;
    }

    if (currentDivision.original <= 0 && currentDivision.reemplazo <= 0) {
      alert(
        "Debe asignar un monto mayor a 0 para al menos uno de los operadores."
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("operador_pagos_contingencia")
        .upsert(
          {
            embarque_id: embarque.id,
            operador_original_id:
              embarque.operadorOriginalId || embarque.operadorAsignado?.id,
            operador_reemplazo_id: embarque.operadorReemplazoId,
            monto_original: currentDivision.original,
            monto_reemplazo: currentDivision.reemplazo,
            fecha_registro: new Date().toISOString(),
            registrado_por: "Usuario Actual",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "embarque_id", ignoreDuplicates: false }
        );

      if (error) {
        console.error(
          "Error guardando división de pago de contingencia:",
          error
        );
        alert("Error al guardar la división de pago: " + error.message);
      } else {
        alert("División de pago guardada exitosamente.");
        if (mounted.current) {
          setEmbarquesOperadorFiltrados((prev) =>
            prev.map((e) =>
              e.id === embarque.id
                ? {
                    ...e,
                    montoOriginalContingencia: currentDivision.original,
                    montoReemplazoContingencia: currentDivision.reemplazo,
                  }
                : e
            )
          );
        }
      }
    } catch (error) {
      console.error("Error en saveContingencyPayment:", error);
      alert("Error inesperado al guardar la división de pago.");
    }
  };

  useEffect(() => {
    if (!showAnalisisOperadoresModal || embarquesModificadosIds.length === 0) {
      return;
    }
    mounted.current = true;

    const loadContingencyPayments = async () => {
      try {
        const { data, error } = await supabase
          .from("operador_pagos_contingencia")
          .select("*")
          .in("embarque_id", embarquesModificadosIds);

        if (error) {
          console.error("Error cargando pagos de contingencia:", error);
          return;
        }

        const paymentsMap: typeof contingencyPaymentsDb = {};
        data.forEach((payment) => {
          paymentsMap[payment.embarque_id] = {
            monto_original: payment.monto_original,
            monto_reemplazo: payment.monto_reemplazo,
            operador_original_id: payment.operador_original_id,
            operador_reemplazo_id: payment.operador_reemplazo_id,
          };
        });
        if (mounted.current) setContingencyPaymentsDb(paymentsMap);

        const initialContingencyState: typeof operadoresContingencia = {};
        data.forEach((payment) => {
          initialContingencyState[payment.embarque_id] = {
            original: payment.monto_original,
            reemplazo: payment.monto_reemplazo,
          };
        });
        if (mounted.current) setOperadoresContingencia(initialContingencyState);
      } catch (error) {
        console.error("Error en loadContingencyPayments:", error);
      }
    };

    loadContingencyPayments();
    return () => {
      mounted.current = false;
    };
  }, [showAnalisisOperadoresModal, embarquesModificadosIds]);

  const consultarPagosOperador = useCallback(async () => {
    setLoadingPagos(true);
    if (mounted.current) setEmbarquesOperadorFiltrados([]);
    try {
      let query = supabase
        .from("embarques")
        .select(
          `
    *,
    cliente:clientes(nombre),
    operador:operadores(id, nombre, apellidos),
    tipo_servicio:tipos_servicio(nombre, precio_base)
  `
  )
  .neq("estado", "archivado")
  .neq("estado_facturacion", "archivado");

      if (filtroPagosOperadorId && filtroPagosOperadorId !== "todos") {
        query = query.eq("operador_id", filtroPagosOperadorId);
      }

      if (fechaInicioPagos) {
        query = query.gte("fecha_creacion", fechaInicioPagos);
      }
      if (fechaFinPagos) {
        query = query.lte("fecha_creacion", fechaFinPagos);
      }

      const { data, error } = await query.order("fecha_creacion", {
        ascending: false,
      });

      if (error) {
        console.error("Error al consultar pagos de operador:", error);
        alert("Error al consultar pagos de operador: " + error.message);
        if (mounted.current) setEmbarquesOperadorFiltrados([]);
        return;
      }

      const embarquesFormateados: EmbarqueAsignado[] = await Promise.all(
        (data || []).map(async (embarque: any) => {
          const formattedEmbarque: EmbarqueAsignado = {
            ...embarque,
            clienteNombre:
              embarque.cliente?.nombre || "Cliente no especificado", // Corrected field name
            operadorAsignado: embarque.operador
              ? {
                  id: embarque.operador.id,
                  nombre: `${embarque.operador.nombre} ${
                    embarque.operador.apellidos || ""
                  }`.trim(),
                }
              : { id: "", nombre: "Sin asignar" },
            tipoServicioNombre:
              embarque.tipo_servicio?.nombre || "Sin especificar",
            pagoOperador: embarque.tipo_servicio?.precio_base || 0,
            fechaAsignacion: embarque.fecha_creacion,
            modificadoPorEmergencia: embarquesModificadosIds.includes(
              embarque.id
            ),
          };

          if (formattedEmbarque.modificadoPorEmergencia) {
            const { data: modData, error: modError } = await supabase
              .from("embarque_modificaciones")
              .select(
                "operador_original_id, operador_original_nombre, operador_nuevo_id, operador_nuevo_nombre, razon"
              )
              .eq("embarque_id", embarque.id)
              .order("fecha_modificacion", { ascending: false })
              .limit(1)
              .single();

            if (modError && modError.code !== "PGRST116") {
              console.error("Error fetching modification details:", modError);
            } else if (modData) {
              formattedEmbarque.operadorOriginalId =
                modData.operador_original_id;
              formattedEmbarque.operadorOriginalNombre =
                modData.operador_original_nombre;
              formattedEmbarque.operadorReemplazoId = modData.operador_nuevo_id;
              formattedEmbarque.operadorReemplazoNombre =
                modData.operador_nuevo_nombre;
              formattedEmbarque.motivoModificacion = modData.razon;
            }

            const {
              data: contingencyPaymentData,
              error: contingencyPaymentError,
            } = await supabase
              .from("operador_pagos_contingencia")
              .select("monto_original, monto_reemplazo")
              .eq("embarque_id", embarque.id)
              .single();

            if (
              contingencyPaymentError &&
              contingencyPaymentError.code !== "PGRST116"
            ) {
              console.error(
                "Error fetching contingency payment:",
                contingencyPaymentError
              );
            } else if (contingencyPaymentData) {
              formattedEmbarque.montoOriginalContingencia =
                contingencyPaymentData.monto_original;
              formattedEmbarque.montoReemplazoContingencia =
                contingencyPaymentData.monto_reemplazo;
            } else {
              formattedEmbarque.pagoOperador = formattedEmbarque.pagoOperador;
              formattedEmbarque.montoOriginalContingencia =
                formattedEmbarque.pagoOperador;
              formattedEmbarque.montoReemplazoContingencia = 0;
            }
          }
          return formattedEmbarque;
        })
      );

      if (mounted.current) {
        setEmbarquesOperadorFiltrados(embarquesFormateados);

        const initialContingencyState: typeof operadoresContingencia = {};
        embarquesFormateados.forEach((e) => {
          if (e.modificadoPorEmergencia) {
            initialContingencyState[e.id] = {
              original: e.montoOriginalContingencia || 0,
              reemplazo: e.montoReemplazoContingencia || 0,
            };
          }
        });
        setOperadoresContingencia(initialContingencyState);
      }
    } catch (error) {
      console.error("Excepción al consultar pagos de operador:", error);
      alert("Error inesperado al consultar pagos de operador.");
    } finally {
      if (mounted.current) setLoadingPagos(false);
    }
  }, [
    filtroPagosOperadorId,
    fechaInicioPagos,
    fechaFinPagos,
    embarquesModificadosIds,
    tiposServicio,
  ]);

  useEffect(() => {
    if (showPagosOperadoresModal) {
      consultarPagosOperador();
    }
  }, [showPagosOperadoresModal, consultarPagosOperador]);

  const totalPagesClientes = Math.ceil(
    embarquesClienteFiltrados.length / itemsPerPageClientes
  );
  const paginatedEmbarquesClientes = useMemo(() => {
    const startIndex = (currentPageClientes - 1) * itemsPerPageClientes;
    const endIndex = startIndex + itemsPerPageClientes;
    return embarquesClienteFiltrados.slice(startIndex, endIndex);
  }, [embarquesClienteFiltrados, currentPageClientes, itemsPerPageClientes]);

  const handlePageChangeClientes = (page: number) => {
    if (page > 0 && page <= totalPagesClientes) {
      setCurrentPageClientes(page);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Facturación / Cobranza
            </h1>
            <p className="text-gray-600 mt-2">
              Consultar embarques finalizados desde Asignación de Embarques,
              generar reportes y gestionar facturación
            </p>
          </div>
          <div className="flex space-x-2">
            <Dialog
              open={showAnalisisOperadoresModal}
              onOpenChange={setShowAnalisisOperadoresModal}
            >
              <DialogContent className="max-w-6xl w-[96vw] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Análisis de Operadores - Pagos y Rendimiento
                  </DialogTitle>
                  <DialogDescription>
                    Consultar embarques asignados por operador, calcular pagos
                    por tipo de servicio y gestionar casos de contingencia
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap justify-between gap-3 mb-4 items-end">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col">
                      <Label className="text-xs text-gray-600 mb-1">
                        Desde
                      </Label>
                      <Input
                        type="date"
                        value={fechaInicioAnalisis}
                        onChange={(e) => setFechaInicioAnalisis(e.target.value)}
                        className="w-36"
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-xs text-gray-600 mb-1">
                        Hasta
                      </Label>
                      <Input
                        type="date"
                        value={fechaFinAnalisis}
                        onChange={(e) => setFechaFinAnalisis(e.target.value)}
                        className="w-36"
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-xs text-gray-600 mb-1">
                        Operador
                      </Label>
                      <select
                        value={filtroAnalisisOperador}
                        onChange={(e) =>
                          setFiltroAnalisisOperador(e.target.value)
                        }
                        className="border rounded px-2 py-1 w-56"
                        disabled={loadingEmbarques}
                      >
                        <option value="todos">Todos los operadores</option>
                        {operadoresUnicos.map((operador) => (
                          <option key={operador?.id} value={operador?.nombre}>
                            {operador?.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-xs text-gray-600 mb-1">
                        Periodo
                      </Label>
                      <div className="flex items-end gap-2">
                        <select
                          value={periodoAnalisis}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodoAnalisis(val);
                            setPeriodoActual(val);
                          }}
                          className="border rounded px-2 py-1 w-56"
                        >
                          <option value="mes">Mes actual</option>
                          <option value="mes_anterior">Mes anterior</option>
                          <option value="dos_meses_atras">
                            Dos meses atrás
                          </option>
                          <option value="tres_meses_atras">
                            Tres meses atrás
                          </option>
                          <option value="seis_meses_atras">
                            Seis meses atrás
                          </option>
                          <option value="un_ano_atras">Un año atrás</option>
                          <option value="año">Año actual</option>
                        </select>
                        <Button
                          onClick={generarAnalisisOperadores}
                          variant="default"
                          disabled={
                            loadingEmbarques ||
                            loadingTiposServicio ||
                            loadingAnalisis
                          }
                        >
                          {loadingAnalisis
                            ? "Generando..."
                            : "Generar Análisis"}
                        </Button>
                        <Button
                          onClick={exportarAnalisisExcel}
                          variant="outline"
                          disabled={
                            !analisisData.embarquesFiltradosAnalisis.length
                          }
                        >
                          Exportar Excel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {loadingAnalisis ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                    <span className="ml-2 text-sm text-gray-600">
                      Generando análisis...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-2 mb-4">
                      <Button
                        variant={
                          activeAnalisisTab === "porOperador"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setActiveAnalisisTab("porOperador")}
                      >
                        Por Operador
                      </Button>
                      <Button
                        variant={
                          activeAnalisisTab === "detalle"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setActiveAnalisisTab("detalle")}
                      >
                        Detalle
                      </Button>
                      <Button
                        variant={
                          activeAnalisisTab === "contingencia"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setActiveAnalisisTab("contingencia")}
                      >
                        Casos de Contingencia
                      </Button>
                    </div>
                    {analisisData.resumenGeneral === null && (
                      <div className="text-center py-8 text-gray-500">
                        Por favor, haz clic en "Generar Análisis" para ver los
                        datos.
                      </div>
                    )}
                    {activeAnalisisTab === "resumen" &&
                      analisisData.resumenGeneral && (
                        <div className="mb-6">
                          <h3 className="font-bold text-lg mb-2">
                            Resumen General
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-gray-700 font-medium">
                                Total Operadores
                              </p>
                              <p className="text-2xl font-bold text-blue-700">
                                {analisisData.resumenGeneral.operadores}
                              </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-gray-700 font-medium">
                                Total Embarques
                              </p>
                              <p className="text-2xl font-bold text-green-700">
                                {analisisData.resumenGeneral.totalEmbarques}
                              </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <p className="text-gray-700 font-medium">
                                Total a Pagar MXN
                              </p>
                              <p className="text-2xl font-bold text-purple-700">
                                ${"{"}
                                analisisData.resumenGeneral.totalPagos.toLocaleString()
                                {"}"}
                              </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-orange-800">
                                Casos Contingencia
                              </p>
                              <p className="text-2xl font-bold text-orange-900">
                                {analisisData.resumenGeneral
                                  .casosContingencia || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    {activeAnalisisTab === "porOperador" &&
                      analisisData.analisisPorOperador.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-bold text-lg mb-2">
                            Pagos y Embarques por Operador
                          </h3>
                          {/* Controles de paginación */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span>Renglones por página:</span>
                              <select
                                className="border rounded px-2 py-1"
                                value={itemsPerPageAnalisisOp}
                                onChange={(e) => {
                                  setItemsPerPageAnalisisOp(
                                    Number(e.target.value)
                                  );
                                  setCurrentPageAnalisisOp(1);
                                }}
                              >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                              </select>
                            </div>
                            <div className="text-sm text-gray-600">
                              {(() => {
                                const lista = analisisData.analisisPorOperador;
                                const total = lista.length;
                                const start =
                                  (currentPageAnalisisOp - 1) *
                                    itemsPerPageAnalisisOp +
                                  1;
                                const end = Math.min(
                                  currentPageAnalisisOp *
                                    itemsPerPageAnalisisOp,
                                  total
                                );
                                return `${start}-${end} de ${total}`;
                              })()}
                            </div>
                          </div>
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-2 py-1 text-left">
                                    Operador
                                  </th>
                                  <th className="px-2 py-1 text-center">
                                    Total Pagos
                                  </th>
                                  <th className="px-2 py-1 text-center">
                                    Cantidad Embarques
                                  </th>
                                  <th className="px-2 py-1 text-center">
                                    Contingencia
                                  </th>
                                  <th className="px-2 py-1 text-center">
                                    Promedio/Embarque
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const lista =
                                    analisisData.analisisPorOperador;
                                  const totalPages = Math.max(
                                    1,
                                    Math.ceil(
                                      lista.length / itemsPerPageAnalisisOp
                                    )
                                  );
                                  const startIndex =
                                    (currentPageAnalisisOp - 1) *
                                    itemsPerPageAnalisisOp;
                                  const endIndex =
                                    startIndex + itemsPerPageAnalisisOp;
                                  const pageItems = lista.slice(
                                    startIndex,
                                    endIndex
                                  );
                                  return pageItems.map((op: any) => (
                                    <tr key={op.nombre} className="border-b">
                                      <td className="px-2 py-1">{op.nombre}</td>
                                      <td className="px-2 py-1 text-center">{`$${op.totalPagos.toLocaleString()}`}</td>
                                      <td className="px-2 py-1 text-center">
                                        {op.cantidadEmbarques}
                                      </td>
                                      <td className="px-2 py-1 text-center">
                                        {op.embarquesContingencia > 0 ? (
                                          <Badge variant="destructive">
                                            {op.embarquesContingencia}
                                          </Badge>
                                        ) : (
                                          "0"
                                        )}
                                      </td>
                                      <td className="px-2 py-1 text-center">{`$${op.promedioPorEmbarque.toLocaleString()}`}</td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                          {/* Controles de paginación */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-sm text-gray-600">
                              Página {currentPageAnalisisOp} de{" "}
                              {Math.max(
                                1,
                                Math.ceil(
                                  analisisData.analisisPorOperador.length /
                                    itemsPerPageAnalisisOp
                                )
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPageAnalisisOp((p) =>
                                    Math.max(1, p - 1)
                                  )
                                }
                                disabled={currentPageAnalisisOp === 1}
                              >
                                Anterior
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPageAnalisisOp((p) =>
                                    Math.min(
                                      Math.max(
                                        1,
                                        Math.ceil(
                                          analisisData.analisisPorOperador
                                            .length / itemsPerPageAnalisisOp
                                        )
                                      ),
                                      p + 1
                                    )
                                  )
                                }
                                disabled={
                                  currentPageAnalisisOp >=
                                  Math.max(
                                    1,
                                    Math.ceil(
                                      analisisData.analisisPorOperador.length /
                                        itemsPerPageAnalisisOp
                                    )
                                  )
                                }
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                          {/* Resumen al final de Por Operador (cuando se selecciona un operador específico) */}
                          {filtroAnalisisOperador !== "todos" && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium">
                                  Embarques totales asignados
                                </p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {(() => {
                                    const selected =
                                      analisisData.analisisPorOperador.find(
                                        (x: any) =>
                                          x.nombre === filtroAnalisisOperador
                                      );
                                    return selected?.cantidadEmbarques || 0;
                                  })()}
                                </p>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-800 font-medium">
                                  Embarques con contingencia
                                </p>
                                <p className="text-2xl font-bold text-orange-900">
                                  {(() => {
                                    const selected =
                                      analisisData.analisisPorOperador.find(
                                        (x: any) =>
                                          x.nombre === filtroAnalisisOperador
                                      );
                                    return selected?.embarquesContingencia || 0;
                                  })()}
                                </p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-800 font-medium">
                                  Total a pagar al operador (MXN)
                                </p>
                                <p className="text-2xl font-bold text-green-900">
                                  {(() => {
                                    const selected =
                                      analisisData.analisisPorOperador.find(
                                        (x: any) =>
                                          x.nombre === filtroAnalisisOperador
                                      );
                                    const total = selected?.totalPagos || 0;
                                    return `$${Number(total).toLocaleString()}`;
                                  })()}
                                </p>
                              </div>
                            </div>
                          )}
                          {filtroAnalisisOperador === "todos" &&
                            analisisData.resumenGeneral && (
                              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <p className="text-sm text-blue-800 font-medium">
                                    Embarques del período
                                  </p>
                                  <p className="text-2xl font-bold text-blue-900">
                                    {analisisData.resumenGeneral.totalEmbarques}
                                  </p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg">
                                  <p className="text-sm text-orange-800 font-medium">
                                    Embarques con contingencia
                                  </p>
                                  <p className="text-2xl font-bold text-orange-900">
                                    {analisisData.resumenGeneral
                                      .casosContingencia || 0}
                                  </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <p className="text-sm text-green-800 font-medium">
                                    Total a pagar (MXN)
                                  </p>
                                  <p className="text-2xl font-bold text-green-900">
                                    {`$${Number(
                                      analisisData.resumenGeneral.totalPagos ||
                                        0
                                    ).toLocaleString()}`}
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    {activeAnalisisTab === "detalle" &&
                      analisisData.embarquesFiltradosAnalisis.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-bold text-lg mb-2">
                            Detalle de Embarques por Operador
                          </h3>
                          {/* Controles de paginación (Detalle) */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span>Renglones por página:</span>
                              <select
                                className="border rounded px-2 py-1"
                                value={itemsPerPageAnalisisDetalle}
                                onChange={(e) => {
                                  setItemsPerPageAnalisisDetalle(
                                    Number(e.target.value)
                                  );
                                  setCurrentPageAnalisisDetalle(1);
                                }}
                              >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                              </select>
                            </div>
                            <div className="text-sm text-gray-600">
                              {(() => {
                                const lista =
                                  analisisData.embarquesFiltradosAnalisis;
                                const total = lista.length;
                                const start =
                                  (currentPageAnalisisDetalle - 1) *
                                    itemsPerPageAnalisisDetalle +
                                  1;
                                const end = Math.min(
                                  currentPageAnalisisDetalle *
                                    itemsPerPageAnalisisDetalle,
                                  total
                                );
                                return `${start}-${end} de ${total}`;
                              })()}
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-2 py-1 text-left min-w-[120px]">
                                    Folio
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Operador
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Cliente
                                  </th>
                                  <th className="px-2 py-1 text-left">Fecha</th>
                                  <th className="px-2 py-1 text-left">
                                    Tipo Servicio
                                  </th>
                                  <th className="px-2 py-1 text-center">
                                    Pago Operador
                                  </th>
                                  <th className="px-2 py-1 text-center">
                                    Contingencia
                                  </th>
                                  <th className="px-2 py-1 text-center">
                                    Acciones
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const lista =
                                    analisisData.embarquesFiltradosAnalisis;
                                  const startIndex =
                                    (currentPageAnalisisDetalle - 1) *
                                    itemsPerPageAnalisisDetalle;
                                  const endIndex =
                                    startIndex + itemsPerPageAnalisisDetalle;
                                  const pageItems = lista.slice(
                                    startIndex,
                                    endIndex
                                  );
                                  return pageItems.map((e: any) => (
                                    <tr
                                      key={`${e.id}-${
                                        e.rolContingencia || "normal"
                                      }`}
                                      className="border-b"
                                    >
                                      <td className="px-2 py-1 min-w-[120px]">
                                        {e.folio}
                                      </td>
                                      <td className="px-2 py-1">
                                        {e.operadorAsignado?.nombre}
                                      </td>
                                      <td className="px-2 py-1">
                                        {e.clienteNombre}
                                      </td>
                                      <td className="px-2 py-1">
                                        {e.fechaAsignacion
                                          ? new Date(
                                              e.fechaAsignacion
                                            ).toLocaleDateString("es-MX")
                                          : ""}
                                      </td>
                                      <td className="px-2 py-1">
                                        {e.tipoServicioNombre}
                                      </td>
                                      <td className="px-2 py-1 text-center">
                                        {(() => {
                                          if (e.modificadoPorEmergencia) {
                                            const m =
                                              operadoresContingencia[e.id] ||
                                              {};
                                            const monto =
                                              e.rolContingencia === "original"
                                                ? m.original || 0
                                                : m.reemplazo || 0;
                                            return `$${Number(
                                              monto || 0
                                            ).toLocaleString()}`;
                                          }
                                          return `$${Number(
                                            e.pagoOperador || 0
                                          ).toLocaleString()}`;
                                        })()}
                                      </td>
                                      <td className="px-2 py-1 text-center">
                                        {e.modificadoPorEmergencia ? (
                                          <Badge variant="destructive">
                                            Sí
                                          </Badge>
                                        ) : (
                                          "No"
                                        )}
                                      </td>
                                      <td className="px-2 py-1 text-center">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => verDetallesEmbarque(e)}
                                          aria-label="Ver detalles"
                                        >
                                          <Eye className="h-4 w-4" aria-hidden="true" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                          {/* Controles de paginación (Detalle) */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-sm text-gray-600">
                              Página {currentPageAnalisisDetalle} de{" "}
                              {Math.max(
                                1,
                                Math.ceil(
                                  analisisData.embarquesFiltradosAnalisis
                                    .length / itemsPerPageAnalisisDetalle
                                )
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPageAnalisisDetalle((p) =>
                                    Math.max(1, p - 1)
                                  )
                                }
                                disabled={currentPageAnalisisDetalle === 1}
                              >
                                Anterior
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentPageAnalisisDetalle((p) =>
                                    Math.min(
                                      Math.max(
                                        1,
                                        Math.ceil(
                                          analisisData
                                            .embarquesFiltradosAnalisis.length /
                                            itemsPerPageAnalisisDetalle
                                        )
                                      ),
                                      p + 1
                                    )
                                  )
                                }
                                disabled={
                                  currentPageAnalisisDetalle >=
                                  Math.max(
                                    1,
                                    Math.ceil(
                                      analisisData.embarquesFiltradosAnalisis
                                        .length / itemsPerPageAnalisisDetalle
                                    )
                                  )
                                }
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                          {/* Resumen del desempeño del operador */}
                          {filtroAnalisisOperador !== "todos" && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium">
                                  Embarques totales asignados
                                </p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {
                                    analisisData.embarquesFiltradosAnalisis
                                      .length
                                  }
                                </p>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-800 font-medium">
                                  Embarques con contingencia
                                </p>
                                <p className="text-2xl font-bold text-orange-900">
                                  {
                                    analisisData.embarquesFiltradosAnalisis.filter(
                                      (e: any) => e.modificadoPorEmergencia
                                    ).length
                                  }
                                </p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-800 font-medium">
                                  Total a pagar al operador (MXN)
                                </p>
                                <p className="text-2xl font-bold text-green-900">
                                  {(() => {
                                    const total =
                                      analisisData.embarquesFiltradosAnalisis.reduce(
                                        (sum: number, e: any) => {
                                          if (e.modificadoPorEmergencia) {
                                            const m =
                                              operadoresContingencia[e.id] ||
                                              {};
                                            const monto =
                                              e.rolContingencia === "original"
                                                ? m.original || 0
                                                : m.reemplazo || 0;
                                            return sum + (monto || 0);
                                          }
                                          return sum + (e.pagoOperador || 0);
                                        },
                                        0
                                      );
                                    return `$${Number(total).toLocaleString()}`;
                                  })()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    {activeAnalisisTab === "contingencia" &&
                      analisisData.embarquesFiltradosAnalisis.filter((e: any) =>
                        embarquesModificadosIds.includes(e.id)
                      ).length > 0 && (
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Gestión de Casos de Contingencia
                          </h3>

                          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <h4 className="font-semibold text-orange-900 mb-2">
                              ¿Qué son los casos de contingencia?
                            </h4>
                            <p className="text-sm text-orange-800 mb-2">
                              Los casos de contingencia ocurren cuando un
                              embarque asignado originalmente a un operador debe
                              ser reasignado a otro operador por situaciones de
                              emergencia (enfermedad, accidente, etc.).
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              • <strong>Operador Original:</strong> Quien tenía
                              la asignación inicial del embarque
                              <br />• <strong>
                                Operador de Reemplazo:
                              </strong>{" "}
                              Quien finalmente realizó el embarque
                              <br />• <strong>División de Pago:</strong> Puedes
                              asignar manualmente cualquier monto a cada
                              operador según las circunstancias específicas del
                              caso
                              <br />• <strong>Flexibilidad Total:</strong> Los
                              montos no están limitados por el precio base del
                              servicio
                            </p>
                          </div>

                          {/* Casos de contingencia encontrados */}
                          {analisisData.embarquesFiltradosAnalisis && (
                            <div className="space-y-4">
                              {analisisData.embarquesFiltradosAnalisis
                                .filter((e: any) =>
                                  embarquesModificadosIds.includes(e.id)
                                )
                                // Mantener un solo card por embarque de contingencia
                                .filter(
                                  (e: any, idx: number, arr: any[]) =>
                                    idx ===
                                    arr.findIndex((x: any) => x.id === e.id)
                                )
                                .map((embarque: EmbarqueAsignado) => (
                                  <Card
                                    key={embarque.id}
                                    className="border-red-300 bg-red-50"
                                  >
                                    <CardHeader>
                                      <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg text-red-800 flex items-center">
                                          <AlertTriangle className="h-5 w-5 mr-2" />
                                          Caso de Contingencia -{" "}
                                          {embarque.folio}
                                        </CardTitle>
                                        <Badge variant="destructive">
                                          Requiere Atención
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Información del embarque */}
                                        <div>
                                          <h4 className="font-medium text-gray-700 mb-3">
                                            Información del Embarque
                                          </h4>
                                          <div className="space-y-2 text-sm">
                                            <p>
                                              <strong>Cliente:</strong>{" "}
                                              {embarque.clienteNombre}
                                            </p>
                                            <p>
                                              <strong>Fecha:</strong>{" "}
                                              {new Date(
                                                embarque.fechaAsignacion
                                              ).toLocaleDateString("es-MX")}
                                            </p>
                                            <p>
                                              <strong>Tipo de Servicio:</strong>{" "}
                                              {embarque.tipoServicioNombre ||
                                                "Sin especificar"}
                                            </p>
                                            <p>
                                              <strong>Pago Base:</strong> $
                                              {embarque.pagoOperador?.toLocaleString() ||
                                                0}
                                            </p>
                                            {embarque.motivoModificacion && (
                                              <p>
                                                <strong>Motivo:</strong>{" "}
                                                {embarque.motivoModificacion}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Modal: Captura de Facturación - movido a nivel superior para evitar conflictos */}
                                        {/* Gestión de operadores */}
                                        <div>
                                          <h4 className="font-medium text-gray-700 mb-3">
                                            Gestión de Operadores
                                          </h4>
                                          <div className="space-y-4">
                                            {/* Operador Original */}
                                            <div className="bg-white p-3 rounded border">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                  Operador Original:
                                                </span>
                                                <Badge variant="outline">
                                                  Original
                                                </Badge>
                                              </div>
                                              <p className="text-sm text-gray-600 mb-2">
                                                {embarque.operadorOriginalNombre ||
                                                  embarque.operadorAsignado
                                                    ?.nombre ||
                                                  "No especificado"}
                                              </p>
                                              <div className="flex items-center space-x-2">
                                                <Label
                                                  htmlFor={`pago-original-${embarque.id}`}
                                                  className="text-xs"
                                                >
                                                  Pago:
                                                </Label>
                                                <Input
                                                  type="number"
                                                  id={`pago-original-${embarque.id}`}
                                                  value={
                                                    operadoresContingencia[
                                                      embarque.id
                                                    ]?.original || 0
                                                  }
                                                  onChange={(e) => {
                                                    const valor = Number(
                                                      e.target.value
                                                    );
                                                    if (!isNaN(valor)) {
                                                      handleContingencyPaymentChange(
                                                        embarque.id,
                                                        "original",
                                                        valor
                                                      );
                                                    }
                                                  }}
                                                  className="w-24 text-right text-xs"
                                                />
                                              </div>
                                            </div>

                                            {/* Operador de Reemplazo */}
                                            <div className="bg-white p-3 rounded border">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                  Operador de Reemplazo:
                                                </span>
                                                <Badge variant="default">
                                                  Reemplazo
                                                </Badge>
                                              </div>
                                              <p className="text-sm text-gray-600 mb-2">
                                                {embarque.operadorReemplazoNombre ||
                                                  embarque.usuarioModificacion ||
                                                  "No especificado"}
                                              </p>
                                              <div className="flex items-center space-x-2">
                                                <Label
                                                  htmlFor={`pago-reemplazo-${embarque.id}`}
                                                  className="text-xs"
                                                >
                                                  Pago:
                                                </Label>
                                                <Input
                                                  type="number"
                                                  id={`pago-reemplazo-${embarque.id}`}
                                                  value={
                                                    operadoresContingencia[
                                                      embarque.id
                                                    ]?.reemplazo || 0
                                                  }
                                                  onChange={(e) => {
                                                    const valor = Number(
                                                      e.target.value
                                                    );
                                                    if (!isNaN(valor)) {
                                                      handleContingencyPaymentChange(
                                                        embarque.id,
                                                        "reemplazo",
                                                        valor
                                                      );
                                                    }
                                                  }}
                                                  className="w-24 text-right"
                                                />
                                              </div>
                                            </div>

                                            {/* Resumen de la división */}
                                            <div className="bg-gray-100 p-3 rounded border border-gray-200">
                                              <p className="text-sm font-medium text-gray-700">
                                                Total División: $
                                                {(
                                                  (operadoresContingencia[
                                                    embarque.id
                                                  ]?.original || 0) +
                                                  (operadoresContingencia[
                                                    embarque.id
                                                  ]?.reemplazo || 0)
                                                ).toLocaleString()}
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                Pago base del servicio: $
                                                {(
                                                  embarque.pagoOperador || 0
                                                ).toLocaleString()}{" "}
                                                (solo referencia)
                                              </p>
                                              <p className="text-xs text-blue-600 font-medium mt-1">
                                                En casos de contingencia, puedes
                                                asignar cualquier monto según
                                                las circunstancias.
                                              </p>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                              <Button
                                                size="sm"
                                                onClick={() =>
                                                  saveContingencyPayment(
                                                    embarque
                                                  )
                                                }
                                                disabled={
                                                  (operadoresContingencia[
                                                    embarque.id
                                                  ]?.original || 0) <= 0 &&
                                                  (operadoresContingencia[
                                                    embarque.id
                                                  ]?.reemplazo || 0) <= 0
                                                }
                                              >
                                                <Save className="h-4 w-4 mr-2" />
                                                Guardar División de Pago
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    {activeAnalisisTab === "contingencia" &&
                      analisisData.embarquesFiltradosAnalisis.filter((e: any) =>
                        embarquesModificadosIds.includes(e.id)
                      ).length === 0 &&
                      analisisData.resumenGeneral && (
                        <div className="text-center py-8 text-gray-500">
                          No se encontraron casos de contingencia para el
                          período y filtros seleccionados.
                        </div>
                      )}
                  </>
                )}
              </DialogContent>
            </Dialog>
            <Dialog
              open={showPagosOperadoresModal}
              onOpenChange={setShowPagosOperadoresModal}
            >
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Pagos a Operadores</DialogTitle>
                  <DialogDescription>
                    Consulta los embarques asignados a un operador en un rango
                    de fechas para gestionar sus pagos.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap gap-2 mb-4 items-end">
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="select-operador-pagos">Operador</Label>
                    <Select
                      value={filtroPagosOperadorId}
                      onValueChange={(value) => setFiltroPagosOperadorId(value)}
                      disabled={loadingEmbarques}
                    >
                      <SelectTrigger id="select-operador-pagos">
                        <SelectValue placeholder="Selecciona un operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">
                          Todos los operadores
                        </SelectItem>
                        {operadoresUnicos
                          .filter((operador) => operador?.id)
                          .map((operador) => (
                            <SelectItem key={operador.id} value={operador.id}>
                              {operador.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label htmlFor="filtro-periodo-pagos">Periodo</Label>
                    <Select
                      value={filtroPeriodoPagos}
                      onValueChange={handlePeriodoPagosChange}
                    >
                      <SelectTrigger id="filtro-periodo-pagos">
                        <SelectValue placeholder="Selecciona un periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Personalizado</SelectItem>
                        <SelectItem value="current_month">
                          Mes actual
                        </SelectItem>
                        <SelectItem value="last_month">Mes anterior</SelectItem>
                        <SelectItem value="last_2_months">
                          Últimos 2 meses
                        </SelectItem>
                        <SelectItem value="last_3_months">
                          Últimos 3 meses
                        </SelectItem>
                        <SelectItem value="last_6_months">
                          Últimos 6 meses
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label htmlFor="fecha-inicio-pagos">Desde</Label>
                    <Input
                      type="date"
                      id="fecha-inicio-pagos"
                      value={fechaInicioPagos}
                      onChange={(e) => {
                        setFechaInicioPagos(e.target.value);
                        setFiltroPeriodoPagos("custom");
                      }}
                      disabled={filtroPeriodoPagos !== "custom"}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label htmlFor="fecha-fin-pagos">Hasta</Label>
                    <Input
                      type="date"
                      id="fecha-fin-pagos"
                      value={fechaFinPagos}
                      onChange={(e) => {
                        setFechaFinPagos(e.target.value);
                        setFiltroPeriodoPagos("custom");
                      }}
                      disabled={filtroPeriodoPagos !== "custom"}
                    />
                  </div>
                  <Button
                    onClick={consultarPagosOperador}
                    disabled={loadingPagos}
                  >
                    {loadingPagos ? "Consultando..." : "Iniciar Consulta"}
                  </Button>
                </div>

                <Tabs
                  value={activePagosTab}
                  onValueChange={setActivePagosTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="detalle">
                      Detalle de Embarques
                    </TabsTrigger>
                    <TabsTrigger value="desglose">
                      Desglose Individual por Operador
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="detalle">
                    {loadingPagos ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                        <span className="ml-2 text-sm text-gray-600">
                          Cargando embarques...
                        </span>
                      </div>
                    ) : embarquesOperadorFiltrados.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No se encontraron embarques para los filtros
                        seleccionados.
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 text-right text-lg font-bold text-gray-800">
                          Total Pagos Filtrados: $
                          {totalPagosFiltrados.toLocaleString()}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">Folio</th>
                                <th className="px-2 py-1 text-left">Cliente</th>
                                <th className="px-2 py-1 text-left">
                                  Tipo de Servicio
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Fecha Asignación
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Pago Base
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Contingencia
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Operador Original
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Pago Original
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Operador Reemplazo
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Pago Reemplazo
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {embarquesOperadorFiltrados.map((embarque) => (
                                <tr key={embarque.id} className="border-b">
                                  <td className="px-2 py-1">
                                    {embarque.folio}
                                  </td>
                                  <td className="px-2 py-1">
                                    {embarque.clienteNombre}
                                  </td>
                                  <td className="px-2 py-1">
                                    {embarque.tipoServicioNombre}
                                  </td>
                                  <td className="px-2 py-1">
                                    {new Date(
                                      embarque.fechaAsignacion!
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-2 py-1">
                                    ${embarque.pagoOperador?.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-1">
                                    {embarque.modificadoPorEmergencia ? (
                                      <Badge variant="destructive">Sí</Badge>
                                    ) : (
                                      "No"
                                    )}
                                  </td>
                                  {embarque.modificadoPorEmergencia ? (
                                    <>
                                      <td className="px-2 py-1 text-xs">
                                        {embarque.operadorOriginalNombre ||
                                          embarque.operadorAsignado?.nombre}
                                      </td>
                                      <td className="px-2 py-1">
                                        <Input
                                          type="number"
                                          value={
                                            operadoresContingencia[embarque.id]
                                              ?.original || 0
                                          }
                                          onChange={(e) => {
                                            const val = Number(e.target.value);
                                            if (!isNaN(val))
                                              handleContingencyPaymentChange(
                                                embarque.id,
                                                "original",
                                                val
                                              );
                                          }}
                                          className="w-24 text-right text-xs"
                                        />
                                      </td>
                                      <td className="px-2 py-1 text-xs">
                                        {embarque.operadorReemplazoNombre ||
                                          "N/A"}
                                      </td>
                                      <td className="px-2 py-1">
                                        <Input
                                          type="number"
                                          value={
                                            operadoresContingencia[embarque.id]
                                              ?.reemplazo || 0
                                          }
                                          onChange={(e) => {
                                            const val = Number(e.target.value);
                                            if (!isNaN(val))
                                              handleContingencyPaymentChange(
                                                embarque.id,
                                                "reemplazo",
                                                val
                                              );
                                          }}
                                          className="w-24 text-right"
                                        />
                                      </td>
                                      <td className="px-2 py-1">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            saveContingencyPayment(embarque)
                                          }
                                          disabled={
                                            (operadoresContingencia[embarque.id]
                                              ?.original || 0) <= 0 &&
                                            (operadoresContingencia[embarque.id]
                                              ?.reemplazo || 0) <= 0
                                          }
                                        >
                                          <Save className="h-3 w-3" />
                                        </Button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-2 py-1" colSpan={5}>
                                        {embarque.operadorAsignado?.nombre}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="desglose">
                    {loadingPagos ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                        <span className="ml-2 text-sm text-gray-600">
                          Calculando desglose...
                        </span>
                      </div>
                    ) : operadorDesgloseData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No se encontraron datos de desglose para los filtros
                        seleccionados.
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-end mb-4">
                          <Button
                            onClick={exportarDesgloseOperadoresExcel}
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar Desglose Excel
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">
                                  Operador
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Total Pagos (Periodo Filtrado)
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Total Pagos (Mes Actual)
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Cantidad Embarques
                                </th>
                                <th className="px-2 py-1 text-left">
                                  Casos Contingencia
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {operadorDesgloseData.map((data) => (
                                <tr key={data.operador.id} className="border-b">
                                  <td className="px-2 py-1 font-medium">
                                    {data.operador.nombre}
                                  </td>
                                  <td className="px-2 py-1">
                                    ${data.totalPagos.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-1">
                                    ${data.totalPagosMesActual.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-1">
                                    {data.cantidadEmbarques}
                                  </td>
                                  <td className="px-2 py-1">
                                    {data.embarquesContingencia > 0 ? (
                                      <Badge variant="destructive">
                                        {data.embarquesContingencia}
                                      </Badge>
                                    ) : (
                                      "0"
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            {/* Buttons moved next to "Servicios" below */}
          </div>

          <Dialog
            open={showArchivadosModal}
            onOpenChange={setShowArchivadosModal}
          >
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Embarques Archivados</DialogTitle>
                <DialogDescription>
                  Consulta todos los embarques archivados para consulta
                  histórica y auditoría.
                </DialogDescription>
              </DialogHeader>
              {loadingArchivados ? (
                <div className="py-8 text-center text-gray-500">
                  Cargando embarques archivados...
                </div>
              ) : embarquesArchivados.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No hay embarques archivados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left">Folio</th>
                        <th className="px-2 py-1 text-left">Cliente</th>
                        <th className="px-2 py-1 text-left">Load</th>
                        <th className="px-2 py-1 text-left">Valor Facturado</th>
                        <th className="px-2 py-1 text-left">
                          Fecha Pago Factura
                        </th>
                        <th className="px-2 py-1 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {embarquesArchivados.map((embarque) => (
                        <tr key={embarque.id} className="border-b">
                          <td className="px-2 py-1">{embarque.folio}</td>
                          <td className="px-2 py-1">
                            {embarque.clienteNombre}
                          </td>
                          <td className="px-2 py-1">{embarque.load_number}</td>
                          <td className="px-2 py-1">
                            {(() => {
                              const currency = embarque.moneda_flete || "MXN";
                              const raw =
                                typeof (embarque as any).precioFlete ===
                                "number"
                                  ? (embarque as any).precioFlete
                                  : typeof (embarque as any).precio_flete ===
                                    "string"
                                  ? Number((embarque as any).precio_flete)
                                  : typeof (embarque as any).precio_flete ===
                                    "number"
                                  ? (embarque as any).precio_flete
                                  : undefined;
                              const amount =
                                typeof raw === "number" && !isNaN(raw)
                                  ? raw
                                  : 0;
                              return (
                                <>
                                  ${amount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} {currency}
                                </>
                              );
                            })()}
                          </td>
                          <td className="px-2 py-1">
                            {embarque.fecha_pago
                              ? new Date(
                                  embarque.fecha_pago
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-2 py-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEmbarqueDetalle(embarque);
                                setShowDetailModal(true);
                              }}
                            >
                              Ver Detalles
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
          </Dialog>
          {/* Botón Clientes: abre gestión de crédito de clientes */}
          <Dialog open={showClientesModal} onOpenChange={setShowClientesModal}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gestión de Crédito de Clientes</DialogTitle>
                <DialogDescription>
                  Configurar límites de crédito y monitorear el estado de pagos
                  por cliente
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="search-credit-client"
                      placeholder="Buscar empresa..."
                      value={creditClientSearchTerm}
                      onChange={(e) => setCreditClientSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="items-per-page-credit" className="text-sm">Registros por página:</Label>
                    <Select
                      value={String(itemsPerPageCredit)}
                      onValueChange={(value) => setItemsPerPageCredit(Number(value))}
                    >
                      <SelectTrigger id="items-per-page-credit" className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button onClick={exportCreditDataToExcel} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Crédito Excel
                    </Button>
                  </div>
                </div>

                {loadingEmbarques ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                    <span className="ml-2 text-sm text-gray-600">
                      Cargando clientes...
                    </span>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No se encontraron clientes</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Asegúrate de que los clientes estén registrados y activos.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="mb-4 text-sm text-gray-600">
                      Mostrando {paginatedClientsCredit.length} de {filteredClients.length} registros.
                    </div>
                    <table className="min-w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Cliente
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Límite USD
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Adeudado USD
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Límite MXN
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Adeudado MXN
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Estado Crédito
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedClientsCredit.map((cliente) => {
                          if (!cliente) return null;

                          const clienteEmbarquesUSD = embarquesFiltrados.filter(
                            (e) =>
                              e.cliente_id === cliente.id &&
                              !e.pagado &&
                              e.moneda_flete === "USD"
                          );
                          const clienteEmbarquesMXN = embarquesFiltrados.filter(
                            (e) =>
                              e.cliente_id === cliente.id &&
                              !e.pagado &&
                              (e.moneda_flete === "MXN" || !e.moneda_flete)
                          );

                          const totalPendienteUSD = clienteEmbarquesUSD.reduce(
                            (sum, e) => sum + (e.montoFacturado ?? e.precioFlete ?? 0),
                            0
                          );
                          const totalPendienteMXN = clienteEmbarquesMXN.reduce(
                            (sum, e) => sum + (e.montoFacturado ?? e.precioFlete ?? 0),
                            0
                          );

                          const limiteUSD = creditLimits[cliente.id]?.usd || 0;
                          const limiteMXN = creditLimits[cliente.id]?.mxn || 0;

                          const excedeUSD =
                            totalPendienteUSD > limiteUSD && limiteUSD > 0;
                          const excedeMXN =
                            totalPendienteMXN > limiteMXN && limiteMXN > 0;

                          return (
                            <tr
                              key={cliente.id}
                              className={`border-b border-gray-100 ${
                                excedeUSD || excedeMXN ? "bg-red-50" : ""
                              }`}
                            >
                              <td className="px-4 py-2 font-medium text-gray-800">
                                <div className="flex items-center gap-2">
                                  <span>{cliente.nombre}</span>
                                  {(excedeUSD || excedeMXN) && (
                                    <Badge variant="destructive" className="text-[10px] py-0 px-1">Excedido</Badge>
                                  )}
                                </div>
                              </td>
                              {/* Corrected field name */}
                              <td className="px-4 py-2">
                                <Input
                                  type="number"
                                  value={limiteUSD}
                                  onChange={(e) => {
                                    const limite = Number(e.target.value);
                                    if (!isNaN(limite)) {
                                      saveCreditLimit(
                                        cliente.id,
                                        "usd",
                                        limite
                                      );
                                    }
                                  }}
                                  className="w-24 text-right text-xs"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`font-bold ${
                                    excedeUSD ? "text-red-600" : "text-gray-600"
                                  }`}
                                >
                                  ${totalPendienteUSD.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  type="number"
                                  value={limiteMXN}
                                  onChange={(e) => {
                                    const limite = Number(e.target.value);
                                    if (!isNaN(limite)) {
                                      saveCreditLimit(
                                        cliente.id,
                                        "mxn",
                                        limite
                                      );
                                    }
                                  }}
                                  className="w-24 text-right text-xs"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`font-bold ${
                                    excedeMXN ? "text-red-600" : "text-gray-600"
                                  }`}
                                >
                                  ${totalPendienteMXN.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {excedeUSD || excedeMXN ? (
                                  <Badge
                                    variant="destructive"
                                    className="flex items-center justify-center"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />{" "}
                                    Excedido
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center justify-center"
                                  >
                                    Ok
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="flex justify-center items-center space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChangeCredit(currentPageCredit - 1)
                        }
                        disabled={currentPageCredit === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-sm text-gray-700">
                        Página {currentPageCredit} de {totalPagesCredit}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChangeCredit(currentPageCredit + 1)
                        }
                        disabled={currentPageCredit === totalPagesCredit}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Nota anual para KPIs */}
          <div className="md:col-span-6 -mb-2">
            <p className="text-xs text-gray-500">
              Indicadores del año {currentYear}. El Flete Año es acumulado anual e incluye archivados. Al cambiar el año, el contador se reinicia.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Embarques
                  </p>
                  <p className="text-2xl font-bold">
                    {embarquesFiltrados.length}
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
                  <p className="text-sm font-medium text-gray-600">
                    Flete Año MXN
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${yearlyFleteMXN.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Flete Año USD
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${yearlyFleteUSD.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      embarquesFiltrados.filter(
                        (e) => e.estado_facturacion === "pendiente_facturacion"
                      ).length
                    }
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Facturados</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      embarquesFiltrados.filter(
                        (e) => e.estado_facturacion === "facturado"
                      ).length
                    }
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagados</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {
                      embarquesFiltrados.filter(
                        (e) =>
                          e.estado_facturacion === "pagado" || (e as any).pagado
                      ).length
                    }
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por folio, cliente, load, operador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button onClick={generarReporteExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Reportes
            </Button>
            <Button
              onClick={() => setShowAnalisisOperadoresModal(true)}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2 text-green-700" />
              Operadores
            </Button>
            <Button
              onClick={() => setShowClientesModal(true)}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Crédito Clientes
            </Button>
            <Button
              onClick={() => setShowControlClientesModal(true)}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Control Clientes
            </Button>
            {/* <Button
              onClick={() => setShowPagosOperadoresModal(true)}
              variant="outline"
            >
              <DollarSign className="h-4 w-4 mr-2 text-blue-700" />
              Pagos Operadores
            </Button> */}
            <Button
              onClick={() => setShowArchivadosModal(true)}
              variant="outline"
            >
              <Package className="h-4 w-4 mr-2 text-purple-600" />
              Archivados
            </Button>
            <Button
              onClick={() => setShowTiposServicioModal(true)}
              variant="outline"
            >
              <Package className="h-4 w-4 mr-2" />
              Servicios
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Embarques Asignados</CardTitle>
            <CardDescription>
              Lista detallada de todos los embarques con asignación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEmbarques ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Cargando embarques...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {embarquesFiltrados
                  .sort((a, b) => {
                    // Ordenar estrictamente por fecha más reciente (desc)
                    const da = new Date(
                      (a.fechaAsignacion as any) ||
                        a.fecha_creacion ||
                        a.updated_at ||
                        0
                    ).getTime();
                    const db = new Date(
                      (b.fechaAsignacion as any) ||
                        b.fecha_creacion ||
                        b.updated_at ||
                        0
                    ).getTime();
                    return db - da;
                  })
                  .map((embarque) => (
                    <div
                      key={embarque.id}
                      className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                        embarquesModificadosIds.includes(embarque.id)
                          ? "border-red-500"
                          : ""
                      } ${
                        embarque.estado_facturacion === "facturado"
                          ? "bg-blue-50 border-blue-200"
                          : embarque.estado_facturacion === "pagado"
                          ? "bg-green-50 border-green-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Package className="h-8 w-8 text-blue-600" />
                          <div>
                            <div className="flex items-center">
                              <p className="font-bold text-lg text-blue-600">
                                {embarque.folio}
                              </p>
                              {embarquesModificadosIds.includes(
                                embarque.id
                              ) && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 bg-red-600 text-white animate-pulse"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  CONTINGENCIA
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Load: {embarque.load_number || "-"}
                            </p>
                          </div>
                          {(() => {
                            const creditCheck = checkCreditExceeded(
                              embarque.clienteNombre,
                              embarque.montoFacturado ?? (embarque as any)?.precioFlete ?? 0,
                              embarque.moneda_flete
                            );
                            return (
                              creditCheck.exceeded && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-white text-xs">
                                  {creditCheck.message}
                                </span>
                              )
                            );
                          })()}
                          {embarque.modificadoPorEmergencia && (
                            <Badge
                              variant="destructive"
                              className="ml-2 bg-red-600 text-white"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              MODIFICADO POR EMERGENCIA
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {embarque.quickpaid_enabled && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center px-2 py-1 mr-2">
                              <span className="mr-1">QuickPaid</span>
                              <Coins className="h-4 w-4 text-yellow-500" />
                            </Badge>
                          )}
                          <Select
                            value={
                              embarque.estado_facturacion ||
                              "pendiente_facturacion"
                            }
                            onValueChange={async (value) => {
                              try {
                                const v = (
                                  [
                                    "pendiente_facturacion",
                                    "facturado",
                                    "pagado",
                                  ] as const
                                ).includes(value as any)
                                  ? (value as
                                      | "pendiente_facturacion"
                                      | "facturado"
                                      | "pagado")
                                  : "pendiente_facturacion";
                                const embarquesActualizados =
                                  embarquesAsignados.map((e) =>
                                    e.id === embarque.id
                                      ? { ...e, estado_facturacion: v }
                                      : e
                                  );
                                if (mounted.current) {
                                  setEmbarquesAsignados(embarquesActualizados);
                                  localStorage.setItem(
                                    "embarquesAsignados",
                                    JSON.stringify(embarquesActualizados)
                                  );
                                }
                                await supabase
                                  .from("embarques")
                                  .update({
                                    estado_facturacion: v,
                                    updated_at: new Date().toISOString(),
                                  })
                                  .eq("id", embarque.id);
                              } catch (error) {
                                console.error(
                                  "Error actualizando estado de facturación:",
                                  error
                                );
                                alert(
                                  "Error al actualizar el estado de facturación."
                                );
                              }
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente_facturacion">
                                Pendiente Facturación
                              </SelectItem>
                              <SelectItem value="facturado">
                                Facturado
                              </SelectItem>
                              <SelectItem value="pagado">Pagado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirModalFacturacion(embarque)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Facturación
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verDetallesEmbarque(embarque)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </Button>
                          {/* Botón Modificar oculto según requerimiento */}
                          {(embarque.estado_facturacion === "pagado" ||
                            (embarque.pagado &&
                              (embarque as any).estado_facturacion == null)) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-purple-600 text-purple-700 hover:bg-purple-50 bg-transparent"
                              onClick={() => {
                                const ok = window.confirm(
                                  "¿Seguro que deseas archivar este embarque? Se moverá al historial de archivados."
                                );
                                if (!ok) return;
                                archivarEmbarque(embarque);
                              }}
                            >
                              <Package className="h-4 w-4 mr-1 text-purple-600" />
                              Archivar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Cliente:</p>
                          <p className="text-gray-600">
                            {clientes.find((c) => c.id === embarque.cliente_id)
                              ?.nombre ||
                              embarque.clienteNombre ||
                              embarque.cliente_id}
                            {(embarque?.info_representante?.nombre ||
                              embarque?.representante_cliente) && (
                              <span className="text-gray-500">
                                {" "}
                                — Rep.:{" "}
                                {embarque.info_representante?.nombre ||
                                  embarque.representante_cliente}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Operador:</p>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-600">
                              {embarque.operadorAsignado?.nombre ||
                                "Sin asignar"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Tipo de Servicio:
                          </p>
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-purple-600" />
                            <span className="text-gray-600 text-sm">
                              {(() => {
                                if (embarque.tipo_servicio_id) {
                                  const tipoServicio = tiposServicio.find(
                                    (t) => t.id === embarque.tipo_servicio_id
                                  );
                                  return tipoServicio
                                    ? tipoServicio.nombre
                                    : `ID: ${embarque.tipo_servicio_id}`;
                                }
                                return "No asignado";
                              })()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Camión:</p>
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">
                              <strong>Camión:</strong>{" "}
                              {embarque.camionAsignado?.marca || "Sin asignar"}{" "}
                              {embarque.camionAsignado?.modelo || ""} (
                              {embarque.camionAsignado?.numeroEconomico || ""}){" "}
                              • <strong>Remolque:</strong>{" "}
                              {embarque.remolque?.numero_economico ||
                                embarque.remolque_numero_economico ||
                                "-"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Carta Porte:
                          </p>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {embarque.carta_porte || "-"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Monto Flete:
                          </p>
                          <p className="text-gray-600 font-bold">
                            {(() => {
                              const currency = embarque.moneda_flete || "MXN";
                              const candidates: Array<number | undefined> = [
                                typeof embarque.cantidad_final_facturada ===
                                "number"
                                  ? embarque.cantidad_final_facturada
                                  : typeof (embarque as any)
                                      .cantidad_final_facturada === "string"
                                  ? Number(
                                      (embarque as any)
                                        .cantidad_final_facturada
                                    )
                                  : undefined,
                                typeof (embarque as any).precio_flete ===
                                "string"
                                  ? Number((embarque as any).precio_flete)
                                  : typeof (embarque as any).precio_flete ===
                                    "number"
                                  ? (embarque as any).precio_flete
                                  : undefined,
                                typeof (embarque as any).montoFacturado ===
                                "string"
                                  ? Number((embarque as any).montoFacturado)
                                  : typeof (embarque as any).montoFacturado ===
                                    "number"
                                  ? (embarque as any).montoFacturado
                                  : undefined,
                                typeof (embarque as any).precioFlete ===
                                "string"
                                  ? Number((embarque as any).precioFlete)
                                  : typeof (embarque as any).precioFlete ===
                                    "number"
                                  ? (embarque as any).precioFlete
                                  : undefined,
                              ];
                              const amountCandidate = candidates.find(
                                (v) => typeof v === "number" && !isNaN(v)
                              );
                              const amount =
                                typeof amountCandidate === "number"
                                  ? amountCandidate
                                  : 0;
                              return (
                                <>
                                  ${amount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} {currency}
                                </>
                              );
                            })()}
                          </p>
                          {embarque.quickpaid_enabled && (
                            <div className="mt-1 text-xs">
                              {typeof embarque.quickpaid_descuento ===
                                "number" &&
                                embarque.quickpaid_descuento > 0 && (
                                  <p className="text-yellow-700 font-semibold">
                                    Descuento: -$
                                    {embarque.quickpaid_descuento.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </p>
                                )}
                              {typeof embarque.precio_quickpaid === "number" &&
                                embarque.precio_quickpaid > 0 && (
                                  <p className="text-yellow-900 font-semibold">
                                    Precio QuickPaid: $
                                    {embarque.precio_quickpaid.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                        {embarque.fechaEntrega && (
                          <div>
                            <p className="font-medium text-gray-700">
                              Fecha Entrega:
                            </p>
                            <p className="text-gray-600">
                              {new Date(
                                embarque.fechaEntrega
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="font-medium text-gray-700 text-sm">
                            Dirección de Recolecta:
                          </p>
                          <div className="flex items-start space-x-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-gray-600 text-sm">
                              {embarque.direccionRecolecta}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 text-sm">
                            Dirección de Enganche:
                          </p>
                          <div className="flex items-start space-x-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-gray-600 text-sm">
                              {embarque.direccion_entrega}
                            </p>
                          </div>
                        </div>
                      </div>
                      {embarque.observacionesFacturacion && (
                        <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-700 text-sm mb-1">
                            Observaciones de Facturación:
                          </p>
                          <p className="text-gray-600 text-sm">
                            {embarque.observacionesFacturacion}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                {embarquesFiltrados.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      No se encontraron embarques asignados
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Los embarques asignados desde "Asignación de Embarques"
                      aparecerán aquí
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Control Clientes */}
        <Dialog open={showControlClientesModal} onOpenChange={setShowControlClientesModal}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Control de Clientes</DialogTitle>
              <DialogDescription>
                Consulta los embarques no archivados por cliente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <Label htmlFor="control-cliente">Cliente</Label>
                <Select
                  value={controlClienteSeleccionado || ""}
                  onValueChange={(value) => setControlClienteSeleccionado(value || null)}
                >
                  <SelectTrigger id="control-cliente" className="w-[320px]">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Rango rápido */}
                <div className="flex flex-col">
                  <Label className="text-xs text-gray-600 mb-1">Periodo</Label>
                  <Select value={controlClientesRango} onValueChange={(v) => setRangoControlClientes(v)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecciona un periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mes_actual">Mes actual</SelectItem>
                      <SelectItem value="mes_anterior">Mes anterior</SelectItem>
                      <SelectItem value="dos_meses_atras">Dos meses atrás</SelectItem>
                      <SelectItem value="seis_meses_atras">Seis meses atrás</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rango de fechas */}
                <div className="flex flex-col">
                  <Label htmlFor="control-desde" className="text-xs text-gray-600 mb-1">Desde</Label>
                  <Input
                    id="control-desde"
                    type="date"
                    className="w-[160px]"
                    value={controlClientesPeriodo.desde || ""}
                    onChange={(e) => {
                      setControlClientesPeriodo((p) => ({ ...p, desde: e.target.value || null }));
                      setControlClientesRango("custom");
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="control-hasta" className="text-xs text-gray-600 mb-1">Hasta</Label>
                  <Input
                    id="control-hasta"
                    type="date"
                    className="w-[160px]"
                    value={controlClientesPeriodo.hasta || ""}
                    onChange={(e) => {
                      setControlClientesPeriodo((p) => ({ ...p, hasta: e.target.value || null }));
                      setControlClientesRango("custom");
                    }}
                  />
                </div>
                <div className="ml-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const inRange = (e: any) => {
                        const fechaStr = e.fecha_creacion || e.updated_at;
                        if (!fechaStr) return true;
                        const d = new Date(fechaStr);
                        const desde = controlClientesPeriodo.desde
                          ? new Date(controlClientesPeriodo.desde)
                          : null;
                        const hasta = controlClientesPeriodo.hasta
                          ? new Date(controlClientesPeriodo.hasta + "T23:59:59")
                          : null;
                        if (desde && d < desde) return false;
                        if (hasta && d > hasta) return false;
                        return true;
                      };
                      const rows = (embarquesFiltrados || [])
                        .filter((e) =>
                          controlClienteSeleccionado
                            ? e.cliente_id === controlClienteSeleccionado
                            : true
                        )
                        .filter(inRange)
                        .filter((e) =>
                          controlClientesTab === "activos"
                            ? e.estado_facturacion !== "archivado"
                            : e.estado_facturacion === "archivado"
                        )
                        .sort(compareControlClientes)
                        .map((e) => ({
                          folio: e.folio,
                          cliente: e.clienteNombre,
                          load: e.load_number || "-",
                          tipo: (tiposServicio.find((t) => t.id === (e as any).tipo_servicio_id)?.nombre) ||
                            (e as any).tipoServicioNombre ||
                            (e as any).tipoServicio || "-",
                          fecha: new Date(e.fecha_creacion || e.updated_at || Date.now()).toLocaleDateString(),
                          monto: (e.montoFacturado ?? (e as any).precioFlete ?? 0),
                          moneda: e.moneda_flete || "MXN",
                          estado: e.estado_facturacion || "pendiente_facturacion",
                        }));
                      let csv = "Folio,Cliente,Load,Tipo Servicio,Fecha,Monto,Moneda,Estado\n";
                      rows.forEach((r) => {
                        csv += `${r.folio},${r.cliente},${r.load},${r.tipo},${r.fecha},${r.monto},${r.moneda},${r.estado}\n`;
                      });
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `control_clientes_${controlClientesTab}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" /> Exportar Excel
                  </Button>
                </div>
              </div>

              <Tabs value={controlClientesTab} onValueChange={(v) => setControlClientesTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="activos">No archivados</TabsTrigger>
                  <TabsTrigger value="archivados">Archivados</TabsTrigger>
                </TabsList>
                <TabsContent value="activos">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Folio", "folio")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Load", "load")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Tipo Servicio", "tipo")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Fecha", "fecha")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Monto", "monto")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Estado", "estado")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(embarquesFiltrados || [])
                          .filter((e) =>
                            controlClienteSeleccionado
                              ? e.cliente_id === controlClienteSeleccionado
                              : true
                          )
                          .filter((e) => {
                            const fechaStr = e.fecha_creacion || e.updated_at;
                            if (!fechaStr) return true;
                            const d = new Date(fechaStr);
                            const desde = controlClientesPeriodo.desde
                              ? new Date(controlClientesPeriodo.desde)
                              : null;
                            const hasta = controlClientesPeriodo.hasta
                              ? new Date(controlClientesPeriodo.hasta + "T23:59:59")
                              : null;
                            if (desde && d < desde) return false;
                            if (hasta && d > hasta) return false;
                            return true;
                          })
                          .filter((e) => e.estado_facturacion !== "archivado")
                          .sort(compareControlClientes)
                          .map((e) => {
                            const currency = e.moneda_flete || "MXN";
                            const amount =
                              (typeof (e as any).montoFacturado === "number"
                                ? (e as any).montoFacturado
                                : typeof (e as any).montoFacturado === "string"
                                ? Number((e as any).montoFacturado)
                                : undefined) ??
                              (typeof (e as any).precioFlete === "number"
                                ? (e as any).precioFlete
                                : typeof (e as any).precioFlete === "string"
                                ? Number((e as any).precioFlete)
                                : 0);
                            const tipoNombre = getTipoNombreFor(e as any);
                            return (
                              <tr key={e.id} className="border-b border-gray-100">
                                <td className="px-3 py-2 text-blue-700 font-medium">{e.folio}</td>
                                <td className="px-3 py-2 text-gray-700">{e.load_number || "-"}</td>
                                <td className="px-3 py-2 text-gray-700">{tipoNombre}</td>
                                <td className="px-3 py-2 text-gray-700">{new Date(e.fecha_creacion || e.updated_at || Date.now()).toLocaleDateString()}</td>
                                <td className="px-3 py-2 text-gray-800 font-semibold">
                                  ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                                </td>
                                <td className="px-3 py-2 text-gray-700">{e.estado_facturacion || "pendiente_facturacion"}</td>
                                <td className="px-3 py-2">
                                  <Button size="sm" variant="outline" onClick={() => verDetallesEmbarque(e as any)} aria-label="Ver detalles">
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                <TabsContent value="archivados">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Folio", "folio")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Load", "load")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Tipo Servicio", "tipo")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Fecha", "fecha")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Monto", "monto")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">{renderSortHeader("Estado", "estado")}</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(embarquesFiltrados || [])
                          .filter((e) =>
                            controlClienteSeleccionado
                              ? e.cliente_id === controlClienteSeleccionado
                              : true
                          )
                          .filter((e) => {
                            const fechaStr = e.fecha_creacion || e.updated_at;
                            if (!fechaStr) return true;
                            const d = new Date(fechaStr);
                            const desde = controlClientesPeriodo.desde
                              ? new Date(controlClientesPeriodo.desde)
                              : null;
                            const hasta = controlClientesPeriodo.hasta
                              ? new Date(controlClientesPeriodo.hasta + "T23:59:59")
                              : null;
                            if (desde && d < desde) return false;
                            if (hasta && d > hasta) return false;
                            return true;
                          })
                          .filter((e) => e.estado_facturacion === "archivado")
                          .sort(compareControlClientes)
                          .map((e) => {
                            const currency = e.moneda_flete || "MXN";
                            const amount =
                              (typeof (e as any).montoFacturado === "number"
                                ? (e as any).montoFacturado
                                : typeof (e as any).montoFacturado === "string"
                                ? Number((e as any).montoFacturado)
                                : undefined) ??
                              (typeof (e as any).precioFlete === "number"
                                ? (e as any).precioFlete
                                : typeof (e as any).precioFlete === "string"
                                ? Number((e as any).precioFlete)
                                : 0);
                            const tipoNombre = getTipoNombreFor(e as any);
                            return (
                              <tr key={e.id} className="border-b border-gray-100">
                                <td className="px-3 py-2 text-blue-700 font-medium">{e.folio}</td>
                                <td className="px-3 py-2 text-gray-700">{e.load_number || "-"}</td>
                                <td className="px-3 py-2 text-gray-700">{tipoNombre}</td>
                                <td className="px-3 py-2 text-gray-700">{new Date(e.fecha_creacion || e.updated_at || Date.now()).toLocaleDateString()}</td>
                                <td className="px-3 py-2 text-gray-800 font-semibold">
                                  ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                                </td>
                                <td className="px-3 py-2 text-gray-700">{e.estado_facturacion || "pendiente_facturacion"}</td>
                                <td className="px-3 py-2">
                                  <Button size="sm" variant="outline" onClick={() => verDetallesEmbarque(e as any)} aria-label="Ver detalles">
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>

            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showTiposServicioModal}
          onOpenChange={setShowTiposServicioModal}
        >
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestión de Tipos de Servicio</DialogTitle>
              <DialogDescription>
                Asignar precios a cada tipo de servicio para calcular
                automáticamente los pagos a operadores
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Puedes crear nuevos tipos de servicio y ajustar sus pagos.
                </div>
                <Button
                  onClick={() => setShowCrearTipoModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  + Agregar Tipo de Servicio
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Tabulador de Pagos a Operadores
                </h3>
                <p className="text-sm text-blue-800">
                  Define el monto que pagarás a tus operadores por cada tipo de
                  servicio. Cuando asignes un embarque con un tipo de servicio
                  específico, el sistema calculará automáticamente el pago
                  correspondiente al operador basándose en estos valores.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  • Los montos se establecen en pesos mexicanos (MXN) • Los
                  cambios se guardan automáticamente en la base de datos
                </p>
              </div>

              {loadingTiposServicio ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Cargando tipos de servicio...
                  </span>
                </div>
              ) : tiposServicio.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">
                    No se encontraron tipos de servicio
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Los tipos de servicio configurados aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Tipo
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Descripción
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Categoría
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Subcategoría
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">
                          Pago Operador (MXN)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiposServicio.map((tipo) => (
                        <tr key={tipo.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-800">
                            {tipo.nombre}
                          </td>
                          <td className="px-3 py-2 text-gray-600 max-w-[480px]">
                            {tipo.descripcion || "Sin descripción"}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {tipo.categoria || "General"}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {tipo.subcategoria || "-"}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end">
                              <Input
                                type="number"
                                defaultValue={tipo.precio_base || 0}
                                onChange={(e) => {
                                  const nuevoMonto = Number(e.target.value);
                                  if (!isNaN(nuevoMonto)) {
                                    guardarTipoServicio(tipo.id, nuevoMonto);
                                  }
                                }}
                                className="w-28 text-right"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Crear Tipo de Servicio */}
        <Dialog open={showCrearTipoModal} onOpenChange={setShowCrearTipoModal}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Nuevo Tipo de Servicio</DialogTitle>
              <DialogDescription>
                Completa los campos para agregar un nuevo tipo de servicio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={nuevoTipo.nombre}
                  onChange={(e) =>
                    setNuevoTipo((p) => ({ ...p, nombre: e.target.value }))
                  }
                  placeholder="Ej. EXPORTACIÓN CARGADA - CAJA SECA 240"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={nuevoTipo.descripcion}
                  onChange={(e) =>
                    setNuevoTipo((p) => ({ ...p, descripcion: e.target.value }))
                  }
                  placeholder="Describe el servicio"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={nuevoTipo.categoria}
                    onChange={(e) =>
                      setNuevoTipo((p) => ({ ...p, categoria: e.target.value }))
                    }
                    placeholder="Ej. Servicios de Aduana"
                  />
                </div>
                <div>
                  <Label>Subcategoría</Label>
                  <Input
                    value={nuevoTipo.subcategoria}
                    onChange={(e) =>
                      setNuevoTipo((p) => ({
                        ...p,
                        subcategoria: e.target.value,
                      }))
                    }
                    placeholder="Ej. Exportación 240"
                  />
                </div>
              </div>
              <div>
                <Label>Pago Operador (MXN)</Label>
                <Input
                  type="number"
                  value={String(nuevoTipo.precio_base)}
                  onChange={(e) =>
                    setNuevoTipo((p) => ({
                      ...p,
                      precio_base: Number(e.target.value || 0),
                    }))
                  }
                  min={0}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCrearTipoModal(false)}
                disabled={guardandoNuevoTipo}
              >
                Cancelar
              </Button>
              <Button
                onClick={crearNuevoTipoServicio}
                disabled={guardandoNuevoTipo}
              >
                {guardandoNuevoTipo ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalles del Embarque - {embarqueDetalle?.folio}
              </DialogTitle>
            </DialogHeader>

            {embarqueDetalle && (
              <div className="space-y-4">
                <div className="border-b flex items-center justify-between gap-2">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "general"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("general")}
                    >
                      Información General
                    </button>
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "facturacion"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("facturacion")}
                    >
                      Datos de Facturación
                    </button>
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "transportacion"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("transportacion")}
                    >
                      Transportación
                    </button>
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "cliente"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("cliente")}
                    >
                      Datos del Cliente
                    </button>
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "entrega"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("entrega")}
                    >
                      Entrega
                    </button>
                    <button
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "modificaciones"
                          ? "border-gray-900 text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => setActiveDetailTab("modificaciones")}
                    >
                      Historial de Cambios
                    </button>
                  </nav>
                  <div className="-mb-px">
                    <Button size="sm" variant="outline" onClick={exportarDetalleEmbarqueExcel}>
                      <Download className="h-4 w-4 mr-2" /> Exportar Excel
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  {activeDetailTab === "general" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900">
                            Información del Embarque
                          </h3>
                          <div className="space-y-1">
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Folio:</span>
                              <span>{embarqueDetalle.folio}</span>
                            </p>
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Cliente:</span>
                              <span>{embarqueDetalle.clienteNombre}</span>
                            </p>
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Load:</span>
                              <span>{embarqueDetalle.load_number}</span>
                            </p>
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">
                                Fecha Creacion:
                              </span>
                              <span>
                                {new Date(
                                  embarqueDetalle.updated_at!
                                ).toLocaleDateString()}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900">
                            Detalles de Operación
                          </h3>
                          <div className="space-y-1">
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Operador:</span>
                              <span>
                                {embarqueDetalle.operadorAsignado?.nombre ||
                                  "Sin asignar"}
                              </span>
                            </p>
                            <p className="grid grid-cols-2 text-sm">
                              <span className="text-gray-500">Unidad:</span>
                              <span>
                                {embarqueDetalle.camionAsignado
                                  ?.numeroEconomico || "N/A"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {embarqueDetalle.comentarios && (
                        <div className="border-t pt-4 mt-4">
                          <h3 className="font-medium text-gray-900 mb-2">
                            Comentarios
                          </h3>
                          <p className="text-sm text-gray-600">
                            {embarqueDetalle.comentarios}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "facturacion" && (
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => embarqueDetalle && abrirModalFacturacion(embarqueDetalle)}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Editar Facturación
                        </Button>
                      </div>

                      {/* Resumen compacto en una fila */}
                      <div className="flex flex-col md:flex-row md:items-center md:gap-6 text-sm">
                        <div className="flex-1 flex items-center justify-between md:justify-start md:gap-2 py-1">
                          <span className="text-gray-500">Valor Facturado</span>
                          <span className="font-semibold text-gray-900">
                            ${ (embarqueDetalle.cantidad_final_facturada ?? embarqueDetalle.precio_flete ?? 0).toLocaleString() } {embarqueDetalle.moneda_flete}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-between md:justify-start md:gap-2 py-1">
                          <span className="text-gray-500">Estado facturación</span>
                          <span className="font-semibold text-gray-900 capitalize">
                            {embarqueDetalle.estado_facturacion?.replaceAll("_"," ") || "pendiente facturación"}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-between md:justify-start md:gap-2 py-1">
                          <span className="text-gray-500">Pago</span>
                          <span className="flex items-center gap-2">
                            <Badge variant={embarqueDetalle.pagado ? "default" : "secondary"}>
                              {embarqueDetalle.pagado ? "Pagado" : "Pendiente"}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {embarqueDetalle.fecha_pago ? new Date(embarqueDetalle.fecha_pago).toLocaleDateString() : "Sin fecha"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {(embarqueDetalle as any).quickpaid_enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <p className="flex justify-between md:block"><span className="text-gray-500">QuickPaid %</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).quickpaid_percent ?? "-"}</span></p>
                          <p className="flex justify-between md:block"><span className="text-gray-500">Descuento</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).quickpaid_descuento ?? "-"}</span></p>
                          <p className="flex justify-between md:block"><span className="text-gray-500">Precio QuickPaid</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).precio_quickpaid ?? "-"}</span></p>
                          <div></div>
                        </div>
                      )}

                      {/* Facturas 1 a 4 en filas */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-900">Facturas (1 a 4)</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">Factura</th>
                                <th className="px-2 py-1 text-left">Folio</th>
                                <th className="px-2 py-1 text-left">Referencia</th>
                                <th className="px-2 py-1 text-left">Fecha envío</th>
                                <th className="px-2 py-1 text-left">Fecha pago</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const f = [1,2,3,4].map((i) => {
                                  const anyDet = embarqueDetalle as any;
                                  return {
                                    n: i,
                                    folio:
                                      anyDet[`folio_factura_${i}`] ||
                                      anyDet[`numero_factura_${i}`] ||
                                      (i === 1 ? anyDet["numero_factura_1"] : undefined),
                                    envio:
                                      anyDet[`fecha_envio_cliente_${i}`] ||
                                      (i === 1 ? anyDet["fecha_envio_cliente"] : undefined),
                                    pago:
                                      anyDet[`fecha_pago_${i}`] ||
                                      (i === 1 ? anyDet["fecha_pago"] : undefined),
                                    ref:
                                      anyDet[`referencia_pago_${i}`] ||
                                      (i === 1 ? anyDet["referencia_pago"] : undefined),
                                  };
                                });
                                return f.map((row) => (
                                  <tr key={row.n} className="border-b">
                                    <td className="px-2 py-1">Factura {row.n}</td>
                                    <td className="px-2 py-1">{row.folio || "-"}</td>
                                    <td className="px-2 py-1">{row.ref || "-"}</td>
                                    <td className="px-2 py-1">{row.envio ? new Date(row.envio).toLocaleDateString() : "-"}</td>
                                    <td className="px-2 py-1">{row.pago ? new Date(row.pago).toLocaleDateString() : "-"}</td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {(embarqueDetalle.observacionesFacturacion || (embarqueDetalle as any).observaciones_facturacion) && (
                        <div className="border-t pt-4 mt-2">
                          <h3 className="font-medium text-gray-900 mb-2">Observaciones</h3>
                          <p className="text-sm text-gray-600">
                            {embarqueDetalle.observacionesFacturacion || (embarqueDetalle as any).observaciones_facturacion}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "transportacion" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <p className="flex justify-between md:block"><span className="text-gray-500">Patente Agente Aduana</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).patente_agente_aduanal || "-"}</span></p>
                        <p className="flex justify-between md:block"><span className="text-gray-500">Aduana de Cruce</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).aduana_cruce || "-"}</span></p>
                        <p className="flex justify-between md:block"><span className="text-gray-500">Dueño de Mercancía</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).dueno_mercancia || "-"}</span></p>
                        <p className="flex justify-between md:block"><span className="text-gray-500">Contenido</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).contenido || "-"}</span></p>
                        <p className="flex justify-between md:block"><span className="text-gray-500">Peso (kg)</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).peso ?? (embarqueDetalle as any).peso_kg ?? "-"}</span></p>
                        <p className="flex justify-between md:block"><span className="text-gray-500">Carta Porte</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).carta_porte || "-"}</span></p>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "cliente" && (
                    <div className="space-y-4">
                      {(() => {
                        const c = getClienteById(embarqueDetalle.cliente_id);
                        const anyDet: any = embarqueDetalle;
                        const contactoNombre = anyDet.info_representante?.nombre || anyDet.representante_cliente || c?.contacto || c?.nombre_contacto || "";
                        const contactoTel = anyDet.info_representante?.telefono || c?.telefono || c?.telefono_contacto || "";
                        const contactoEmail = anyDet.info_representante?.email || c?.correo || c?.correo_contacto || "";
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <p className="flex justify-between md:block"><span className="text-gray-500">Cliente</span><span className="md:block md:mt-1 font-medium text-gray-900">{c?.nombre || embarqueDetalle.clienteNombre}</span></p>
                            <p className="flex justify-between md:block"><span className="text-gray-500">RFC</span><span className="md:block md:mt-1 font-medium text-gray-900">{c?.rfc || "-"}</span></p>
                            <p className="flex justify-between md:block"><span className="text-gray-500">Divisa de pago</span><span className="md:block md:mt-1 font-medium text-gray-900">{c?.divisa_pago || c?.moneda_preferida || "-"}</span></p>
                            <p className="flex justify-between md:block"><span className="text-gray-500">Empresa facturadora</span><span className="md:block md:mt-1 font-medium text-gray-900">{c?.empresa_facturadora || c?.razon_social || c?.nombre_comercial || "-"}</span></p>
                            <p className="flex justify-between md:block"><span className="text-gray-500">Contacto</span><span className="md:block md:mt-1 font-medium text-gray-900">{contactoNombre || "-"}</span></p>
                            <p className="flex justify-between md:block"><span className="text-gray-500">Teléfono</span><span className="md:block md:mt-1 font-medium text-gray-900">{contactoTel || "-"}</span></p>
                            <p className="flex justify-between md:block"><span className="text-gray-500">Correo</span><span className="md:block md:mt-1 font-medium text-gray-900">{contactoEmail || "-"}</span></p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {activeDetailTab === "entrega" && (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <p className="flex justify-between md:block"><span className="text-gray-500">Lugar de Recolecta</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).direccion_recolecta || (embarqueDetalle as any).direccionRecolecta || "-"}</span></p>
                        <p className="flex justify-between md:block"><span className="text-gray-500">Lugar de Entrega</span><span className="md:block md:mt-1 font-medium text-gray-900">{(embarqueDetalle as any).direccion_entrega || (embarqueDetalle as any).direccionEnganche || "-"}</span></p>
                        <p className="flex justify-between md:block"><span className="text-gray-500">Fecha/Hora Recolecta</span><span className="md:block md:mt-1 font-medium text-gray-900">{`${(embarqueDetalle as any).fecha_recolecta || ""} ${(embarqueDetalle as any).hora_recolecta || ""}`.trim() || "-"}</span></p>
                        <p className="flex justify-between md:block"><span className="text-gray-500">Fecha/Hora Entrega</span><span className="md:block md:mt-1 font-medium text-gray-900">{`${(embarqueDetalle as any).fecha_entrega || (embarqueDetalle as any).fechaEntrega || ""} ${(embarqueDetalle as any).hora_entrega || ""}`.trim() || "-"}</span></p>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "modificaciones" && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">
                        Historial de Modificaciones
                      </h3>
                      <ModificacionesHistory embarqueId={embarqueDetalle.id} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={showFacturacionEditModal}
          onOpenChange={setShowFacturacionEditModal}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Editar Información de Facturación</DialogTitle>
              <DialogDescription>
                Actualizar los folios de factura y montos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="folio1">Folio Factura 1:</Label>
                  <Input
                    id="folio1"
                    value={facturacionFormData.folio1}
                    onChange={(e) =>
                      setFacturacionFormData((prev) => ({
                        ...prev,
                        folio1: e.target.value,
                      }))
                    }
                    placeholder="Folio 1"
                  />
                </div>
                <div>
                  <Label htmlFor="folio2">Folio Factura 2:</Label>
                  <Input
                    id="folio2"
                    value={facturacionFormData.folio2}
                    onChange={(e) =>
                      setFacturacionFormData((prev) => ({
                        ...prev,
                        folio2: e.target.value,
                      }))
                    }
                    placeholder="Folio 2"
                  />
                </div>
                <div>
                  <Label htmlFor="folio3">Folio Factura 3:</Label>
                  <Input
                    id="folio3"
                    value={facturacionFormData.folio3}
                    onChange={(e) =>
                      setFacturacionFormData((prev) => ({
                        ...prev,
                        folio3: e.target.value,
                      }))
                    }
                    placeholder="Folio 3"
                  />
                </div>
                <div>
                  <Label htmlFor="folio4">Folio Factura 4:</Label>
                  <Input
                    id="folio4"
                    value={facturacionFormData.folio4}
                    onChange={(e) =>
                      setFacturacionFormData((prev) => ({
                        ...prev,
                        folio4: e.target.value,
                      }))
                    }
                    placeholder="Folio 4"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cantidad-final">
                  Cantidad Final Facturada:
                </Label>
                <Input
                  type="number"
                  id="cantidad-final"
                  value={facturacionFormData.cantidadFinalFacturada}
                  onChange={(e) =>
                    setFacturacionFormData((prev) => ({
                      ...prev,
                      cantidadFinalFacturada: Number(e.target.value),
                    }))
                  }
                  placeholder="Cantidad Final"
                />
              </div>
              <div>
                <Label htmlFor="observaciones">Observaciones:</Label>
                <Textarea
                  id="observaciones"
                  value={facturacionFormData.observacionesFacturacion}
                  onChange={(e) =>
                    setFacturacionFormData((prev) => ({
                      ...prev,
                      observacionesFacturacion: e.target.value,
                    }))
                  }
                  placeholder="Observaciones sobre la facturación"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFacturacionEditModal(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={guardarInformacionFacturacion}>
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Embarque</DialogTitle>
              <DialogDescription>
                Actualizar información del embarque
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="montoFacturado">Monto Facturado</Label>
                <Input
                  type="number"
                  id="montoFacturado"
                  value={formData.montoFacturado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      montoFacturado: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="fechaEntrega">Fecha Entrega</Label>
                <Input
                  type="date"
                  id="fechaEntrega"
                  value={formData.fechaEntrega}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaEntrega: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="observacionesFacturacion">
                  Observaciones Facturación
                </Label>
                <Textarea
                  id="observacionesFacturacion"
                  value={formData.observacionesFacturacion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      observacionesFacturacion: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="pagado">Pagado</Label>
                <Input
                  type="checkbox"
                  id="pagado"
                  checked={formData.pagado}
                  onChange={(e) =>
                    setFormData({ ...formData, pagado: e.target.checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="fechaPago">Fecha Pago</Label>
                <Input
                  type="date"
                  id="fechaPago"
                  value={formData.fechaPago}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaPago: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="estado_facturacion">Estado Facturación</Label>
                <Select
                  value={formData.estado_facturacion}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      estado_facturacion: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente_facturacion">
                      Pendiente Facturación
                    </SelectItem>
                    <SelectItem value="facturado">Facturado</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numeroFactura1">Número Factura 1</Label>
                <Input
                  type="text"
                  id="numeroFactura1"
                  value={formData.numeroFactura1}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroFactura1: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="numeroFactura2">Número Factura 2</Label>
                <Input
                  type="text"
                  id="numeroFactura2"
                  value={formData.numeroFactura2}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroFactura2: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="numeroFactura3">Número Factura 3</Label>
                <Input
                  type="text"
                  id="numeroFactura3"
                  value={formData.numeroFactura3}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroFactura3: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="fechaEnvioCliente">Fecha Envío Cliente</Label>
                <Input
                  type="date"
                  id="fechaEnvioCliente"
                  value={formData.fechaEnvioCliente}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fechaEnvioCliente: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="referenciaPago">Referencia Pago</Label>
                <Input
                  type="text"
                  id="referenciaPago"
                  value={formData.referenciaPago}
                  onChange={(e) =>
                    setFormData({ ...formData, referenciaPago: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={guardarCambios}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogo global: Captura de Facturación */}
        <Dialog open={showFacturacionModal} onOpenChange={setShowFacturacionModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Captura de Facturación</DialogTitle>
              <DialogDescription>
                Registra hasta 4 folios de factura, fechas y referencia de pago.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="hidden md:grid md:grid-cols-4 gap-2 text-xs text-gray-600">
                <div>Folio</div>
                <div>Fecha envío</div>
                <div>Fecha pago</div>
                <div>Referencia</div>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <div>
                  <Label className="md:hidden" htmlFor="numeroFactura1">Número Factura 1</Label>
                  <Input
                    id="numeroFactura1"
                    value={facturacionData.numeroFactura1}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        numeroFactura1: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="fechaEnvioCliente1">Fecha envío al cliente</Label>
                  <Input
                    type="date"
                    id="fechaEnvioCliente1"
                    value={facturacionData.fechaEnvioCliente1}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        fechaEnvioCliente1: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="fechaPagoCliente1">Fecha de pago</Label>
                  <Input
                    type="date"
                    id="fechaPagoCliente1"
                    value={facturacionData.fechaPagoCliente1}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        fechaPagoCliente1: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="referenciaPago1">Referencia de pago</Label>
                  <Input
                    id="referenciaPago1"
                    value={facturacionData.referenciaPago1}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        referenciaPago1: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <div>
                  <Label className="md:hidden" htmlFor="numeroFactura2">Número Factura 2</Label>
                  <Input
                    id="numeroFactura2"
                    value={facturacionData.numeroFactura2}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        numeroFactura2: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="fechaEnvioCliente2">Fecha envío al cliente</Label>
                  <Input
                    type="date"
                    id="fechaEnvioCliente2"
                    value={facturacionData.fechaEnvioCliente2}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        fechaEnvioCliente2: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="fechaPagoCliente2">Fecha de pago</Label>
                  <Input
                    type="date"
                    id="fechaPagoCliente2"
                    value={facturacionData.fechaPagoCliente2}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        fechaPagoCliente2: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="referenciaPago2">Referencia de pago</Label>
                  <Input
                    id="referenciaPago2"
                    value={facturacionData.referenciaPago2}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        referenciaPago2: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <div>
                  <Label className="md:hidden" htmlFor="numeroFactura3">Número Factura 3</Label>
                  <Input
                    id="numeroFactura3"
                    value={facturacionData.numeroFactura3}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        numeroFactura3: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="fechaEnvioCliente3">Fecha envío al cliente</Label>
                  <Input
                    type="date"
                    id="fechaEnvioCliente3"
                    value={facturacionData.fechaEnvioCliente3}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        fechaEnvioCliente3: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="fechaPagoCliente3">Fecha de pago</Label>
                  <Input
                    type="date"
                    id="fechaPagoCliente3"
                    value={facturacionData.fechaPagoCliente3}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        fechaPagoCliente3: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="referenciaPago3">Referencia de pago</Label>
                  <Input
                    id="referenciaPago3"
                    value={facturacionData.referenciaPago3}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        referenciaPago3: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                <div>
                  <Label className="md:hidden" htmlFor="numeroFactura4">Número Factura 4</Label>
                  <Input
                    id="numeroFactura4"
                    value={facturacionData.numeroFactura4}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        numeroFactura4: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="fechaEnvioCliente4">Fecha envío al cliente</Label>
                  <Input
                    type="date"
                    id="fechaEnvioCliente4"
                    value={facturacionData.fechaEnvioCliente4}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        fechaEnvioCliente4: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="fechaPagoCliente4">Fecha de pago</Label>
                  <Input
                    type="date"
                    id="fechaPagoCliente4"
                    value={facturacionData.fechaPagoCliente4}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        fechaPagoCliente4: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="md:hidden" htmlFor="referenciaPago4">Referencia de pago</Label>
                  <Input
                    id="referenciaPago4"
                    value={facturacionData.referenciaPago4}
                    onChange={(e) =>
                      setFacturacionData({
                        ...facturacionData,
                        referenciaPago4: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacionesFacturacion">Observaciones</Label>
                <Textarea
                  id="observacionesFacturacion"
                  value={facturacionData.observacionesFacturacion}
                  onChange={(e) =>
                    setFacturacionData({
                      ...facturacionData,
                      observacionesFacturacion: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowFacturacionModal(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={guardarDatosFacturacion}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
