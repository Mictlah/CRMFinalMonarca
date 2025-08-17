"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Users,
  Search,
  Eye,
  UserCheck,
  AlertTriangle,
  Settings,
  Link,
  Check,
  Camera,
  Coins,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  supabase,
  type Embarque,
  type Operador,
  type Camion,
  type Remolque,
  type FotosEmbarque,
  type ContactoCliente,
} from "@/lib/supabase";

export default function AsignarOperadoresPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [embarqueDetalle, setEmbarqueDetalle] = useState<Embarque | null>(null);
  const [embarqueAModificar, setEmbarqueAModificar] = useState<Embarque | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("general");

  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [embarquesFinalizados, setEmbarquesFinalizados] = useState<Embarque[]>(
    []
  );
  const [loadingCompleted, setLoadingCompleted] = useState(false);

  // Estados para los datos
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [remolques, setRemolques] = useState<Remolque[]>([]);
  const [contactosClientes, setContactosClientes] = useState<ContactoCliente[]>(
    []
  );

  // Estados para asignación y quickpaid
  const [asignaciones, setAsignaciones] = useState<{
    [key: string]: {
      operador_id: string;
      camion_id: string;
      precio_flete: string;
      moneda_flete: string;
      quickpaid?: string; // porcentaje seleccionado como string
      quickpaidEnabled?: boolean; // si el checkbox está activo
    };
  }>({});

  // Estados para modificación
  const [modificacionData, setModificacionData] = useState({
    razon: "",
    cambiar_operador: false,
    cambiar_camion: false,
    cambiar_remolque: false,
    cambiar_flete: false,
    nuevo_operador_id: "no-change",
    sueldo_operador_original: "",
    moneda_sueldo_operador_original: "MXN",
    sueldo_operador_nuevo: "",
    moneda_sueldo_operador_nuevo: "MXN",
    nuevo_camion_id: "no-change",
    nuevo_remolque_id: "no-change",
    remolque_numero_economico: "", // Corrected from remolque_manual_numero
    remolque_placa: "", // Corrected from remolque_manual_placas
    nuevo_precio_flete: "",
    nueva_moneda_flete: "MXN",
    flete_en_falso: false,
  });

  const [activeModifyTab, setActiveModifyTab] = useState("justificacion");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [fotosEmbarque, setFotosEmbarque] = useState<FotosEmbarque[]>([]);
  const [loadingFotos, setLoadingFotos] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Cargar datos desde Supabase
  const cargarDatos = async () => {
    try {
      setLoading(true);

      const { data: embarquesData, error: embarquesError } = await supabase
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
        .in("estado", ["listo-para-asignar", "asignado", "en-transito"])
        .order("fecha_creacion", { ascending: false });

      if (embarquesError) {
        console.error("Error cargando embarques:", embarquesError);
        setEmbarques([]);
      } else {
        const embarquesConModificaciones = await Promise.all(
          (embarquesData || []).map(async (embarque) => {
            const modificado = await verificarModificacion(embarque.id);
            return { ...embarque, modificado };
          })
        );
        setEmbarques(embarquesConModificaciones);
      }

      const { data: operadoresData, error: operadoresError } = await supabase
        .from("operadores")
        .select("*")
        .eq("estado", "activo")
        .order("nombre");

      if (operadoresError) {
        console.error("Error cargando operadores:", operadoresError);
        setOperadores([]);
      } else {
        setOperadores(operadoresData || []);
      }

      const { data: camionesData, error: camionesError } = await supabase
        .from("camiones")
        .select("*")
        .neq("estado", "fuera-de-servicio")
        .order("numero_economico");

      if (camionesError) {
        console.error("Error cargando camiones:", camionesError);
        setCamiones([]);
      } else {
        setCamiones(camionesData || []);
      }

      const { data: remolquesData, error: remolquesError } = await supabase
        .from("remolques")
        .select("*")
        .order("numero_economico");

      if (remolquesError) {
        console.error("Error cargando remolques:", remolquesError);
        setRemolques([]);
      } else {
        setRemolques(remolquesData || []);
      }

      const { data: contactosData, error: contactosError } = await supabase
        .from("contactos_clientes")
        .select("*")
        .order("nombre");

      if (contactosError) {
        console.error("Error cargando contactos:", contactosError);
        setContactosClientes([]);
      } else {
        setContactosClientes(contactosData || []);
      }
    } catch (error) {
      console.error("Error general:", error);
      setEmbarques([]);
      setOperadores([]);
      setCamiones([]);
      setRemolques([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarEmbarquesFinalizados = async () => {
    try {
      setLoadingCompleted(true);

      let { data: embarquesData, error: embarquesError } = await supabase
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
        .eq("estado", "finalizado")
        .order("updated_at", { ascending: false });

      if (
        embarquesError &&
        embarquesError.message.includes("fecha_finalizacion")
      ) {
        console.warn(
          "fecha_finalizacion column not found, using updated_at for ordering"
        );

        const { data: fallbackData, error: fallbackError } = await supabase
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
          .eq("estado", "finalizado")
          .order("updated_at", { ascending: false });

        if (fallbackError) {
          console.error(
            "Error cargando embarques finalizados (fallback):",
            fallbackError
          );
          setEmbarquesFinalizados([]);
          return;
        }

        embarquesData = fallbackData;
      } else if (embarquesError) {
        console.error("Error cargando embarques finalizados:", embarquesError);
        setEmbarquesFinalizados([]);
        return;
      }

      setEmbarquesFinalizados(embarquesData || []);
    } catch (error) {
      console.error("Error general:", error);
      setEmbarquesFinalizados([]);
    } finally {
      setLoadingCompleted(false);
    }
  };

  const handleCopyLink = (embarqueId: string) => {
    const link = `${window.location.origin}/subir-fotos-embarque/${embarqueId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(embarqueId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const cargarFotosEmbarque = async (embarqueId: string) => {
    if (!embarqueId) return;
    setLoadingFotos(true);
    try {
      const { data, error } = await supabase
        .from("fotos_embarques")
        .select("*")
        .eq("embarque_id", embarqueId)
        .order("fecha_subida", { ascending: false });

      if (error) {
        console.error("Error cargando fotos:", error);
        setFotosEmbarque([]);
      } else {
        setFotosEmbarque(data || []);
      }
    } catch (error) {
      console.error("Error general cargando fotos:", error);
      setFotosEmbarque([]);
    } finally {
      setLoadingFotos(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const asignarRecursos = async (embarqueId: string) => {
    const asignacion = asignaciones[embarqueId];
    if (!asignacion || !asignacion.operador_id || !asignacion.camion_id) {
      alert("Por favor selecciona operador y camión");
      return;
    }

    try {
      setSaving(true);

      // QuickPaid logic
      let quickpaid_percent: number | null = null;
      let quickpaid_descuento: number | null = null;
      let precio_quickpaid: number | null = null;
      if (
        asignacion.quickpaidEnabled &&
        asignacion.quickpaid &&
        asignacion.precio_flete
      ) {
        quickpaid_percent = parseFloat(asignacion.quickpaid);
        const precioFlete = parseFloat(asignacion.precio_flete);
        quickpaid_descuento = precioFlete * quickpaid_percent;
        precio_quickpaid = precioFlete - quickpaid_descuento;
      }

      const { error } = await supabase
        .from("embarques")
        .update({
          operador_id: asignacion.operador_id,
          camion_id: asignacion.camion_id,
          precio_flete: asignacion.precio_flete
            ? Number.parseFloat(asignacion.precio_flete)
            : null,
          moneda_flete:
            asignacion.moneda_flete ||
            embarques.find((e) => e.id === embarqueId)?.moneda_flete ||
            "MXN",
          estado: "asignado",
          updated_at: new Date().toISOString(),
          quickpaid_enabled: asignacion.quickpaidEnabled || false, // Corrected column name
          quickpaid_percent: quickpaid_percent,
          quickpaid_descuento: quickpaid_descuento,
          precio_quickpaid: precio_quickpaid,
        })
        .eq("id", embarqueId);

      if (error) {
        console.error("Error asignando recursos:", error);
        alert("Error al asignar recursos");
        return;
      }

      alert("Recursos asignados exitosamente");
      await cargarDatos();

      setAsignaciones((prev) => {
        const newAsignaciones = { ...prev };
        delete newAsignaciones[embarqueId];
        return newAsignaciones;
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error al asignar recursos");
    } finally {
      setSaving(false);
    }
  };

  const guardarModificacion = async () => {
    if (!embarqueAModificar || !modificacionData.razon.trim()) {
      alert("Por favor ingresa una justificación para la modificación");
      return;
    }

    if (
      !modificacionData.cambiar_operador &&
      !modificacionData.cambiar_camion &&
      !modificacionData.cambiar_remolque &&
      !modificacionData.cambiar_flete
    ) {
      alert("Por favor selecciona al menos un elemento a modificar");
      return;
    }

    try {
      setSaving(true);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (
        modificacionData.cambiar_operador &&
        modificacionData.nuevo_operador_id &&
        modificacionData.nuevo_operador_id !== "no-change"
      ) {
        updateData.operador_id = modificacionData.nuevo_operador_id;
      }

      if (
        modificacionData.cambiar_camion &&
        modificacionData.nuevo_camion_id &&
        modificacionData.nuevo_camion_id !== "no-change"
      ) {
        updateData.camion_id = modificacionData.nuevo_camion_id;
      }

      if (modificacionData.cambiar_remolque) {
        if (modificacionData.nuevo_remolque_id === "sin-remolque") {
          updateData.remolque_id = null;
          updateData.remolque_placa = null; // Corrected column name
          updateData.remolque_numero_economico = null; // Corrected column name
        } else if (modificacionData.nuevo_remolque_id === "manual") {
          updateData.remolque_id = null; // Set remolque_id to null for manual entry
          updateData.remolque_placa = modificacionData.remolque_placa || null; // Corrected column name
          updateData.remolque_numero_economico =
            modificacionData.remolque_numero_economico || null; // Corrected column name
        } else if (modificacionData.nuevo_remolque_id !== "no-change") {
          updateData.remolque_id = modificacionData.nuevo_remolque_id; // This is a UUID
          updateData.remolque_placa = null; // Clear manual fields if linking to an existing remolque
          updateData.remolque_numero_economico = null; // Clear manual fields if linking to an existing remolque
        }
      }

      if (modificacionData.cambiar_flete) {
        if (modificacionData.nuevo_precio_flete) {
          updateData.precio_flete = Number.parseFloat(
            modificacionData.nuevo_precio_flete
          );
          updateData.moneda_flete = modificacionData.nueva_moneda_flete;
        }
        updateData.flete_falso = modificacionData.flete_en_falso;
      }

      const { error: updateError } = await supabase
        .from("embarques")
        .update(updateData)
        .eq("id", embarqueAModificar.id);

      if (updateError) {
        console.error("Error actualizando embarque:", updateError);
        alert("Error al actualizar embarque: " + updateError.message);
        return;
      }

      const operadorOriginal = operadores.find(
        (op) => op.id === embarqueAModificar.operador_id
      );
      const operadorNuevo = operadores.find(
        (op) => op.id === modificacionData.nuevo_operador_id
      );
      const camionOriginal = camiones.find(
        (cam) => cam.id === embarqueAModificar.camion_id
      );
      const camionNuevo = camiones.find(
        (cam) => cam.id === modificacionData.nuevo_camion_id
      );
      const remolqueOriginal = remolques.find(
        (rem) => rem.id === embarqueAModificar.remolque_id
      );
      const remolqueNuevo = remolques.find(
        (rem) => rem.id === modificacionData.nuevo_remolque_id
      );

      const auditData: any = {
        embarque_id: embarqueAModificar.id,
        razon: modificacionData.razon,
        usuario_modificacion: "Sistema",
        fecha_modificacion: new Date().toISOString(),
      };

      if (embarqueAModificar.operador_id) {
        auditData.operador_original_id = embarqueAModificar.operador_id;
      }
      if (operadorOriginal) {
        auditData.operador_original_nombre = `${operadorOriginal.nombre} ${operadorOriginal.apellidos}`;
      }
      if (
        modificacionData.sueldo_operador_original &&
        !isNaN(Number.parseFloat(modificacionData.sueldo_operador_original))
      ) {
        auditData.sueldo_operador_original = Number.parseFloat(
          modificacionData.sueldo_operador_original
        );
        auditData.moneda_sueldo_operador_original =
          modificacionData.moneda_sueldo_operador_original;
      }

      if (
        modificacionData.cambiar_operador &&
        modificacionData.nuevo_operador_id !== "no-change"
      ) {
        auditData.operador_nuevo_id = modificacionData.nuevo_operador_id;
        if (operadorNuevo) {
          auditData.operador_nuevo_nombre = `${operadorNuevo.nombre} ${operadorNuevo.apellidos}`;
        }
        if (
          modificacionData.sueldo_operador_nuevo &&
          !isNaN(Number.parseFloat(modificacionData.sueldo_operador_nuevo))
        ) {
          auditData.sueldo_operador_nuevo = Number.parseFloat(
            modificacionData.sueldo_operador_nuevo
          );
          auditData.moneda_sueldo_operador_nuevo =
            modificacionData.moneda_sueldo_operador_nuevo;
        }
      }

      if (embarqueAModificar.camion_id) {
        auditData.camion_original_id = embarqueAModificar.camion_id;
        if (camionOriginal) {
          auditData.camion_original_numero = camionOriginal.numero_economico;
        }
      }

      if (
        modificacionData.cambiar_camion &&
        modificacionData.nuevo_camion_id !== "no-change"
      ) {
        auditData.camion_nuevo_id = modificacionData.nuevo_camion_id;
        if (camionNuevo) {
          auditData.camion_nuevo_numero = camionNuevo.numero_economico;
        }
      }

      // Original Remolque info for audit
      let originalRemolqueDisplay = "Sin asignar";
      if (embarqueAModificar.remolque_id && remolqueOriginal) {
        originalRemolqueDisplay = `${remolqueOriginal.numero_economico} (${
          remolqueOriginal.tipo_remolque || "N/A"
        })`;
      } else if (embarqueAModificar.remolque_placa) {
        // Corrected column name
        originalRemolqueDisplay = `Manual: ${
          embarqueAModificar.remolque_placa
        } (${embarqueAModificar.remolque_numero_economico || "N/A"})`; // Corrected column names
      }
      auditData.remolque_original_numero = originalRemolqueDisplay;

      // New Remolque info for audit
      if (modificacionData.cambiar_remolque) {
        let newRemolqueDisplay = "Sin asignar";
        if (modificacionData.nuevo_remolque_id === "sin-remolque") {
          newRemolqueDisplay = "Sin remolque";
        } else if (modificacionData.nuevo_remolque_id === "manual") {
          newRemolqueDisplay = `Manual: ${modificacionData.remolque_placa} (${
            modificacionData.remolque_numero_economico || "N/A"
          })`; // Corrected column names
        } else if (
          modificacionData.nuevo_remolque_id !== "no-change" &&
          remolqueNuevo
        ) {
          newRemolqueDisplay = `${remolqueNuevo.numero_economico} (${
            remolqueNuevo.tipo_remolque || "N/A"
          })`;
        }
        auditData.remolque_nuevo_numero = newRemolqueDisplay;
      }

      if (embarqueAModificar.precio_flete) {
        auditData.precio_flete_original = embarqueAModificar.precio_flete;
        auditData.moneda_flete_original = embarqueAModificar.moneda_flete;
      }

      if (
        modificacionData.cambiar_flete &&
        modificacionData.nuevo_precio_flete &&
        !isNaN(Number.parseFloat(modificacionData.nuevo_precio_flete))
      ) {
        auditData.precio_flete_nuevo = Number.parseFloat(
          modificacionData.nuevo_precio_flete
        );
        auditData.moneda_flete_nueva = modificacionData.nueva_moneda_flete;
      }

      if (modificacionData.flete_en_falso) {
        auditData.flete_en_falso = modificacionData.flete_en_falso;
      }

      try {
        const { error: logError } = await supabase
          .from("embarque_modificaciones")
          .insert(auditData);

        if (logError) {
          console.error("Error registrando modificación:", logError);
          if (
            logError.message.includes("Could not find") &&
            logError.message.includes("column")
          ) {
            alert(`Modificación guardada exitosamente, pero hay un problema con la tabla de auditoría. 
                   Por favor ejecuta el script SQL 33 para corregir la estructura de la base de datos.
                   Error técnico: ${logError.message}`);
          } else {
            alert(
              "Modificación guardada, pero hubo un problema registrando la auditoría: " +
                logError.message
            );
          }
        } else {
          alert(
            "Modificación guardada exitosamente con registro de auditoría completo"
          );
        }
      } catch (auditError) {
        console.error("Error en auditoría:", auditError);
        alert(
          "Modificación guardada exitosamente, pero no se pudo registrar en auditoría. Contacta al administrador."
        );
      }

      setShowModifyModal(false);
      setEmbarqueAModificar(null);
      resetModificacionData();
      await cargarDatos();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar modificación");
    } finally {
      setSaving(false);
    }
  };

  const finalizarEmbarque = async (embarqueId: string) => {
    const embarque = embarques.find((e) => e.id === embarqueId);
    if (!embarque) return;

    const confirmacion = confirm(
      `¿Estás seguro de que deseas finalizar el embarque ${embarque.folio}?\n\n` +
        `Este embarque pasará al área de Facturación y Cobranza y se marcará como completado.`
    );

    if (!confirmacion) return;

    try {
      setSaving(true);

      const updateData: any = {
        estado: "finalizado",
        updated_at: new Date().toISOString(),
      };

      const { data: updateResult, error } = await supabase
        .from("embarques")
        .update({
          ...updateData,
          fecha_finalizacion: new Date().toISOString(),
        })
        .eq("id", embarqueId);

      if (error && error.message.includes("fecha_finalizacion")) {
        console.warn(
          "fecha_finalizacion column not found, updating without it..."
        );

        const { data: retryData, error: retryError } = await supabase
          .from("embarques")
          .update(updateData)
          .eq("id", embarqueId);

        if (retryError) {
          console.error("Error finalizando embarque (retry):", retryError);
          alert("Error al finalizar embarque: " + retryError.message);
          return;
        }
      } else if (error) {
        console.error("Error finalizando embarque:", error);
        alert("Error al finalizar embarque: " + error.message);
        return;
      }

      const embarqueCompletado = {
        id: embarque.id,
        folio: embarque.folio,
        clienteNombre: embarque.cliente?.nombre || "Cliente no especificado",
        numeroLoad: embarque.load_number || "N/A",
        direccionEnganche: embarque.direccion_recolecta || "No especificada",
        fechaEnganche:
          embarque.fecha_recolecta || new Date().toISOString().split("T")[0],
        horaEnganche: embarque.hora_recolecta || "00:00",
        comentarios: embarque.observaciones || "",
        operadorAsignado: {
          id: embarque.operador_id || "",
          nombre: embarque.operador
            ? `${embarque.operador.nombre} ${embarque.operador.apellidos}`
            : "Operador no especificado",
        },
        camionAsignado: {
          id: embarque.camion_id || "",
          marca: embarque.camion?.marca || "Marca",
          modelo: embarque.camion?.modelo || "Modelo",
          numeroEconomico: embarque.camion?.numero_economico || "000",
        },
        fechaAsignacion: new Date().toISOString().split("T")[0],
        fechaCompletado: new Date().toISOString().split("T")[0],
        fecha_finalizacion: new Date().toISOString(),
        estado: "completado",
        montoFacturado: embarque.precio_flete || 0,
        precioFlete: embarque.precio_flete || 0,
        precio_flete: embarque.precio_flete || 0,
        moneda_flete: embarque.moneda_flete || "MXN",
        fechaEntrega: "",
        observacionesFacturacion: "",
        observacionesFinalizacion: `Embarque finalizado el ${new Date().toLocaleDateString()}`,
        pagado: false,
        fechaPago: "",
        modificado: embarque.modificado || false,
        alertaModificacion: embarque.modificado
          ? "⚠️ EMBARQUE MODIFICADO POR SITUACIÓN DE EMERGENCIA/CONTINGENCIA"
          : null,
        requiereAtencionEspecial: embarque.modificado || false,
        colorAlerta: embarque.modificado ? "red" : null,
        mensajeParaFacturacion: embarque.modificado
          ? "ATENCIÓN: Este embarque fue modificado por situaciones de emergencia/contingencia. Verificar procedimientos especiales de pago y documentación antes de procesar."
          : null,
      };

      const embarquesCompletados = JSON.parse(
        localStorage.getItem("embarquesCompletados") || "[]"
      );
      const embarquesCompletadosActualizados = [
        ...embarquesCompletados.filter((e: any) => e.id !== embarque.id),
        embarqueCompletado,
      ];
      localStorage.setItem(
        "embarquesCompletados",
        JSON.stringify(embarquesCompletadosActualizados)
      );

      const embarquesAsignados = JSON.parse(
        localStorage.getItem("embarquesAsignados") || "[]"
      );
      const embarquesAsignadosActualizados = [
        ...embarquesAsignados.filter((e: any) => e.id !== embarque.id),
        { ...embarqueCompletado, estado: "finalizado" },
      ];
      localStorage.setItem(
        "embarquesAsignados",
        JSON.stringify(embarquesAsignadosActualizados)
      );

      alert(
        `Embarque ${embarque.folio} finalizado exitosamente.\nAhora está disponible en el área de Facturación y Cobranza.`
      );
      await cargarDatos();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al finalizar embarque");
    } finally {
      setSaving(false);
    }
  };

  const resetModificacionData = () => {
    setModificacionData({
      razon: "",
      cambiar_operador: false,
      cambiar_camion: false,
      cambiar_remolque: false,
      cambiar_flete: false,
      nuevo_operador_id: "no-change",
      sueldo_operador_original: "",
      moneda_sueldo_operador_original: "MXN",
      sueldo_operador_nuevo: "",
      moneda_sueldo_operador_nuevo: "MXN",
      nuevo_camion_id: "no-change",
      nuevo_remolque_id: "no-change",
      remolque_numero_economico: "",
      remolque_placa: "",
      nuevo_precio_flete: "",
      nueva_moneda_flete: "MXN",
      flete_en_falso: false,
    });
    setActiveModifyTab("justificacion");
  };

  const verificarModificacion = async (embarqueId: string) => {
    try {
      const { data, error } = await supabase
        .from("embarque_modificaciones")
        .select("id")
        .eq("embarque_id", embarqueId)
        .limit(1);

      if (error) {
        console.error("Error verificando modificaciones:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Error:", error);
      return false;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      "listo-para-asignar": {
        color: "bg-blue-100 text-blue-800",
        label: "Listo para Asignar",
      },
      asignado: { color: "bg-yellow-100 text-yellow-800", label: "Asignado" },
      "en-transito": {
        color: "bg-orange-100 text-orange-800",
        label: "En Tránsito",
      },
      entregado: { color: "bg-green-100 text-green-800", label: "Entregado" },
      finalizado: { color: "bg-green-100 text-green-800", label: "Finalizado" },
    };

    const estadoInfo = estados[estado as keyof typeof estados] || {
      color: "bg-gray-100 text-gray-800",
      label: estado,
    };
    return (
      <Badge className={`${estadoInfo.color} hover:${estadoInfo.color}`}>
        {estadoInfo.label}
      </Badge>
    );
  };

  const getVehicleStatusBadge = (estado: string) => {
    return estado === "disponible" || estado === "activo" ? (
      <Badge className="bg-green-100 text-green-800 text-xs ml-2">
        Disponible
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 text-xs ml-2">
        No Disponible
      </Badge>
    );
  };

  const embarquesFiltrados = embarques.filter((embarque) => {
    const matchesSearch =
      embarque.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (embarque.cliente?.nombre && // Changed here
        embarque.cliente.nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (embarque.direccion_recolecta &&
        embarque.direccion_recolecta
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (embarque.direccion_entrega &&
        embarque.direccion_entrega
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filtroEstado === "todos"
        ? embarque.estado !== "finalizado"
        : filtroEstado === "finalizados"
        ? embarque.estado === "finalizado"
        : embarque.estado === filtroEstado;

    return matchesSearch && matchesFilter;
  });

  const imprimirDetalles = () => {
    if (!embarqueDetalle) return;

    const contactoCliente = contactosClientes.find(
      (c) => c.cliente_id === embarqueDetalle.cliente?.id
    );
    const contactoNombre = contactoCliente
      ? `${contactoCliente.nombre} ${contactoCliente.apellidos || ""}`
      : "No especificado";

    const printContent = `
<html>
  <head>
    <title>Detalles del Embarque - ${embarqueDetalle.folio}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
      .section { margin-bottom: 25px; }
      .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
      .field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
      .field { margin-bottom: 10px; }
      .field-label { font-weight: bold; font-size: 12px; color: #666; text-transform: uppercase; }
      .field-value { font-size: 14px; color: #333; margin-top: 2px; padding: 5px; border-bottom: 1px solid #ddd; }
      .full-width { grid-column: 1 / -1; }
      .address-field { background-color: #f9f9f9; padding: 10px; border-left: 3px solid #007bff; }
      @media print { body { margin: 0; } }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>TRANSPORTES MONARCA</h1>
      <h2>DETALLES COMPLETOS DEL EMBARQUE</h2>
      <p><strong>Folio:</strong> ${embarqueDetalle.folio}</p>
      <p><strong>Estado:</strong> ${embarqueDetalle.estado}</p>
      <p><strong>Fecha de Impresión:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="section">
      <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
      <div class="field-group">
        <div class="field">
          <div class="field-label">Cliente</div>
          <div class="field-value">${
            embarqueDetalle.cliente?.nombre || "Sin asignar" // Changed here
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Contacto del Cliente</div>
          <div class="field-value">${contactoNombre}</div>
        </div>
        <div class="field">
          <div class="field-label">Teléfono</div>
          <div class="field-value">${
            embarqueDetalle.cliente?.telefono || "No especificado"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value">${
            embarqueDetalle.cliente?.email || "No especificado"
          }</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">INFORMACIÓN DEL EMBARQUE</div>
      <div class="field-group">
        <div class="field">
          <div class="field-label">Carta Porte</div>
          <div class="field-value">${
            embarqueDetalle.carta_porte || "Sin asignar"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Fecha de Creación</div>
          <div class="field-value">${new Date(
            embarqueDetalle.fecha_creacion
          ).toLocaleDateString()}</div>
        </div>
        <div class="field">
          <div class="field-label">Contenido</div>
          <div class="field-value">${
            embarqueDetalle.contenido || "No especificado"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Peso</div>
          <div class="field-value">${
            embarqueDetalle.peso || "No especificado"
          }</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">UBICACIONES Y FECHAS</div>
      <div class="field full-width">
        <div class="field-label">Dirección de Recolecta</div>
        <div class="field-value address-field">${
          embarqueDetalle.direccion_recolecta ||
          embarqueDetalle.origen ||
          "No especificada"
        }</div>
      </div>
      <div class="field-group">
        <div class="field">
          <div class="field-label">Fecha de Recolecta</div>
          <div class="field-value">${
            embarqueDetalle.fecha_recolecta
              ? new Date(embarqueDetalle.fecha_recolecta).toLocaleDateString()
              : "No especificada"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Hora de Recolecta</div>
          <div class="field-value">${
            embarqueDetalle.hora_recolecta || "No especificada"
          }</div>
        </div>
      </div>
      <div class="field full-width">
        <div class="field-label">Dirección de Entrega</div>
        <div class="field-value address-field">${
          embarqueDetalle.direccion_entrega ||
          embarqueDetalle.destino ||
          "No especificada"
        }</div>
      </div>
      <div class="field-group">
        <div class="field">
          <div class="field-label">Fecha de Entrega</div>
          <div class="field-value">${
            embarqueDetalle.fecha_entrega
              ? new Date(embarqueDetalle.fecha_entrega).toLocaleDateString()
              : "No especificada"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Hora de Entrega</div>
          <div class="field-value">${
            embarqueDetalle.hora_entrega || "No especificada"
          }</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">RECURSOS ASIGNADOS</div>
      <div class="field-group">
        <div class="field">
          <div class="field-label">Operador</div>
          <div class="field-value">${
            embarqueDetalle.operador
              ? `${embarqueDetalle.operador.nombre} ${embarqueDetalle.operador.apellidos}`
              : "Sin asignar"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Teléfono Operador</div>
          <div class="field-value">${
            embarqueDetalle.operador?.telefono || "No especificado"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Tractocamión</div>
          <div class="field-value">${
            embarqueDetalle.camion?.numero_economico || "Sin asignar"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Marca Tractocamión</div>
          <div class="field-value">${
            embarqueDetalle.camion?.marca || "No especificada"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Remolque</div>
          <div class="field-value">${
            embarqueDetalle.remolque?.numero_economico ||
            embarqueDetalle.remolque_numero_economico ||
            "Sin asignar"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Placa Remolque</div>
          <div class="field-value">${
            embarqueDetalle.remolque?.placas ||
            embarqueDetalle.remolque_placa ||
            "No especificado"
          }</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">INFORMACIÓN FINANCIERA</div>
      <div class="field-group">
        <div class="field">
          <div class="field-label">Precio Flete</div>
          <div class="field-value">${
            embarqueDetalle.precio_flete
              ? `$${embarqueDetalle.precio_flete}`
              : "Sin definir"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Moneda</div>
          <div class="field-value">${
            embarqueDetalle.moneda_flete || "MXN"
          }</div>
        </div>
        <div class="field">
          <div class="field-label">Flete en Falso</div>
          <div class="field-value">${
            embarqueDetalle.flete_falso ? "Sí" : "No"
          }</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">OBSERVACIONES</div>
      <div class="field full-width">
        <div class="field-value" style="min-height: 60px; background-color: #f9f9f9; padding: 10px;">${
          embarqueDetalle.observaciones || "Sin observaciones"
        }</div>
      </div>
    </div>
  </body>
</html>
`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const descargarExcel = () => {
    if (!embarqueDetalle) return;

    const headers = [
      "Folio",
      "Estado",
      "Cliente",
      "Representante",
      "Teléfono Cliente",
      "Email Cliente",
      "Fecha Creación",
      "Carta Porte",
      "Contenido",
      "Peso",
      "Dirección Recolecta",
      "Fecha Recolecta",
      "Hora Recolecta",
      "Dirección Entrega",
      "Fecha Entrega",
      "Hora Entrega",
      "Operador",
      "Teléfono Operador",
      "Tractocamión",
      "Marca Tractocamión",
      "Remolque (Número Económico)",
      "Remolque (Placa)",
      "Precio Flete",
      "Moneda",
      "Flete en Falso",
      "Observaciones",
    ];

    const data = [
      embarqueDetalle.folio,
      embarqueDetalle.estado,
      embarqueDetalle.cliente?.nombre || "", // Changed here
      embarqueDetalle.cliente?.contacto_principal || "",
      embarqueDetalle.cliente?.telefono || "",
      embarqueDetalle.cliente?.email || "",
      new Date(embarqueDetalle.fecha_creacion).toLocaleDateString(),
      embarqueDetalle.carta_porte || "",
      embarqueDetalle.contenido || "",
      embarqueDetalle.peso || "",
      embarqueDetalle.direccion_recolecta || embarqueDetalle.origen || "",
      embarqueDetalle.fecha_recolecta
        ? new Date(embarqueDetalle.fecha_recolecta).toLocaleDateString()
        : "",
      embarqueDetalle.hora_recolecta || "",
      embarqueDetalle.direccion_entrega || embarqueDetalle.destino || "",
      embarqueDetalle.fecha_entrega
        ? new Date(embarqueDetalle.fecha_entrega).toLocaleDateString()
        : "",
      embarqueDetalle.hora_entrega || "",
      embarqueDetalle.operador
        ? `${embarqueDetalle.operador.nombre} ${embarqueDetalle.operador.apellidos}`
        : "",
      embarqueDetalle.operador?.telefono || "",
      embarqueDetalle.camion?.numero_economico || "",
      embarqueDetalle.camion?.marca || "",
      embarqueDetalle.remolque?.numero_economico ||
        embarqueDetalle.remolque_numero_economico ||
        "",
      embarqueDetalle.remolque?.placas || embarqueDetalle.remolque_placa || "",
      embarqueDetalle.precio_flete || "",
      embarqueDetalle.moneda_flete || "",
      embarqueDetalle.flete_falso ? "Sí" : "No",
      embarqueDetalle.observaciones || "",
    ];

    const csvContent = [
      headers.join(","),
      data.map((field) => `"${field}"`).join(","),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `embarque_completo_${embarqueDetalle.folio}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarRegistrosCompletos = () => {
    const headers = [
      "Folio",
      "Cliente",
      "Operador",
      "Tractocamión",
      "Remolque (Número Económico)",
      "Remolque (Placa)",
      "Origen",
      "Destino",
      "Fecha Creación",
      "Fecha Finalización",
      "Precio Flete",
      "Moneda",
      "Estado",
      "Observaciones",
    ];

    const data = embarquesFinalizados.map((embarque) => [
      embarque.folio,
      embarque.cliente?.nombre || "", // Changed here
      embarque.operador
        ? `${embarque.operador.nombre} ${embarque.operador.apellidos}`
        : "",
      embarque.camion?.numero_economico || "",
      embarque.remolque?.numero_economico ||
        embarque.remolque_numero_economico ||
        "",
      embarque.remolque?.placas || embarque.remolque_placa || "",
      embarque.direccion_recolecta || embarque.origen || "",
      embarque.direccion_entrega || embarque.destino || "",
      new Date(embarque.fecha_creacion).toLocaleDateString(),
      embarque.fecha_finalizacion
        ? new Date(embarque.fecha_finalizacion).toLocaleDateString()
        : "",
      embarque.precio_flete || "",
      embarque.moneda_flete || "",
      embarque.estado,
      embarque.observaciones || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `registros_completados_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ModificacionesHistory = ({ embarqueId }: { embarqueId: string }) => {
    const [modificaciones, setModificaciones] = useState<any[]>([]);
    const [loadingMods, setLoadingMods] = useState(true);

    useEffect(() => {
      const cargarModificaciones = async () => {
        try {
          const { data, error } = await supabase
            .from("embarque_modificaciones")
            .select("*")
            .eq("embarque_id", embarqueId)
            .order("fecha_modificacion", { ascending: false });

          if (error) {
            console.error("Error cargando modificaciones:", error);
            setModificaciones([]);
          } else {
            setModificaciones(data || []);
          }
        } catch (error) {
          console.error("Error:", error);
          setModificaciones([]);
        } finally {
          setLoadingMods(false);
        }
      };

      cargarModificaciones();
    }, [embarqueId]);

    if (loadingMods) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
          <span className="ml-2 text-sm text-gray-600">
            Cargando modificaciones...
          </span>
        </div>
      );
    }

    if (modificaciones.length === 0) {
      return (
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">
            No se encontraron registros de modificaciones en la base de datos.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {modificaciones.map((mod, index) => (
          <div
            key={mod.id || index}
            className="bg-white border border-red-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-800">
                  Modificación #{modificaciones.length - index}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(mod.fecha_modificacion).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Justificación
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {mod.razon || "Sin justificación registrada"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(mod.operador_original_nombre ||
                  mod.operador_nuevo_nombre) && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                      Cambio de Operador
                    </label>
                    <div className="mt-2 space-y-1">
                      {mod.operador_original_nombre && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Anterior:</span>{" "}
                          {mod.operador_original_nombre}
                        </p>
                      )}
                      {mod.operador_nuevo_nombre && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Nuevo:</span>{" "}
                          {mod.operador_nuevo_nombre}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(mod.camion_original_numero || mod.camion_nuevo_numero) && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Cambio de Tractocamión
                    </label>
                    <div className="mt-2 space-y-1">
                      {mod.camion_original_numero && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Anterior:</span>{" "}
                          {mod.camion_original_numero}
                        </p>
                      )}
                      {mod.camion_nuevo_numero && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Nuevo:</span>{" "}
                          {mod.camion_nuevo_numero}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(mod.remolque_original_numero ||
                  mod.remolque_nuevo_numero) && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <label className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                      Cambio de Remolque
                    </label>
                    <div className="mt-2 space-y-1">
                      {mod.remolque_original_numero && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Anterior:</span>{" "}
                          {mod.remolque_original_numero}
                        </p>
                      )}
                      {mod.remolque_nuevo_numero && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Nuevo:</span>{" "}
                          {mod.remolque_nuevo_numero}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(mod.precio_flete_original || mod.precio_flete_nuevo) && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-3">
                    <label className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                      Cambio de Flete
                    </label>
                    <div className="mt-2 space-y-1">
                      {mod.precio_flete_original && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Anterior:</span> $
                          {mod.precio_flete_original}{" "}
                          {mod.moneda_flete_original || "MXN"}
                        </p>
                      )}
                      {mod.precio_flete_nuevo && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Nuevo:</span> $
                          {mod.precio_flete_nuevo}{" "}
                          {mod.moneda_flete_nueva || "MXN"}
                        </p>
                      )}
                      {mod.flete_en_falso && (
                        <p className="text-sm text-red-600">
                          <span className="font-medium">
                            ⚠️ Marcado como flete en falso
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t">
                Usuario: {mod.usuario_modificacion || "Sistema"}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando embarques...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Asignar Operadores
            </h1>
            <p className="text-gray-600 mt-2">
              Asignar recursos a embarques listos
            </p>
          </div>
          <Button
            onClick={() => {
              setShowCompletedModal(true);
              cargarEmbarquesFinalizados();
            }}
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Registros Completados
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Embarques Pendientes por Asignar
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {
                      embarques.filter((e) => e.estado === "listo-para-asignar")
                        .length
                    }
                  </p>
                </div>
                <svg
                  className="h-8 w-8 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Operadores Disponibles
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {operadores.filter((op) => op.estado === "activo").length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Embarques con Contingencia</p>
                  <p className="text-2xl font-bold text-red-600">
                    {embarques.filter((e:any) => {
                      const txt = (e.observaciones || "").toLowerCase();
                      return e.estado === "contingencia" || e.modificado === true || txt.includes("contingencia") || txt.includes("emergencia");
                    }).length}
                  </p>
                </div>
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tractocamiones Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">
                    {camiones.filter((c) => c.estado === "activo").length}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Embarques por Finalizar</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {embarques.filter((e:any) => ["asignado","en-transito"].includes(e.estado)).length}
                  </p>
                </div>
                <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por folio, cliente o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="listo-para-asignar">
                    Listo para Asignar
                  </SelectItem>
                  <SelectItem value="asignado">Asignado</SelectItem>
                  <SelectItem value="en-transito">En Tránsito</SelectItem>
                  <SelectItem value="finalizados">
                    Embarques Finalizados
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de embarques */}
        <div className="grid grid-cols-1 gap-4">
          {embarquesFiltrados.map((embarque) => (
            <Card key={embarque.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Folio: {embarque.folio}
                      {(embarque.estado === "asignado" ||
                        embarque.estado === "en-transito") &&
                        embarque.quickpaid_enabled && (
                          <span className="ml-2 align-middle inline-flex items-center">
                            <span
                              className="px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-semibold align-middle"
                              title="Este embarque fue asignado con QuickPaid"
                            >
                              QuickPaid
                            </span>
                            {/* Icono Coins de lucide-react */}
                            <Coins className="h-4 w-4 text-yellow-700 ml-1" />
                          </span>
                        )}
                      {asignaciones[embarque.id]?.quickpaidEnabled && (
                        <span
                          title="QuickPaid aplicado"
                          className="ml-2 align-middle inline-block"
                        >
                          <span className="text-yellow-500 text-xl">🎈</span>
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {embarque.cliente?.nombre && // Changed here
                        `Cliente: ${embarque.cliente.nombre}`}
                      {embarque.operador &&
                        ` • Operador: ${embarque.operador.nombre} ${embarque.operador.apellidos}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getEstadoBadge(embarque.estado)}
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmbarqueDetalle(embarque);
                          setShowDetailsModal(true);
                          cargarFotosEmbarque(embarque.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                      {(embarque.estado === "asignado" ||
                        embarque.modificado) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/subir-fotos-embarque/${embarque.id}`,
                              "_blank"
                            )
                          }
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Fotos
                        </Button>
                      )}
                      {embarque.estado === "asignado" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEmbarqueAModificar(embarque);
                            setModificacionData({
                              razon: "", // Always clear reason for new modification
                              cambiar_operador: false,
                              cambiar_camion: false,
                              cambiar_remolque: false,
                              cambiar_flete: false,
                              nuevo_operador_id:
                                embarque.operador_id || "no-change",
                              sueldo_operador_original: "",
                              moneda_sueldo_operador_original: "MXN",
                              sueldo_operador_nuevo: "",
                              moneda_sueldo_operador_nuevo: "MXN",
                              nuevo_camion_id:
                                embarque.camion_id || "no-change",
                              nuevo_remolque_id: embarque.remolque_id
                                ? embarque.remolque_id
                                : embarque.remolque_placa // Corrected column name
                                ? "manual"
                                : "no-change", // Determine initial selection
                              remolque_numero_economico:
                                embarque.remolque_numero_economico || "", // Corrected column name
                              remolque_placa: embarque.remolque_placa || "", // Corrected column name
                              nuevo_precio_flete:
                                embarque.precio_flete?.toString() || "",
                              nueva_moneda_flete:
                                embarque.moneda_flete || "MXN",
                              flete_en_falso: embarque.flete_falso || false,
                            });
                            setActiveModifyTab("justificacion"); // Reset to first tab
                            setShowModifyModal(true);
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Modificar
                        </Button>
                      )}
                      {(embarque.estado === "asignado" ||
                        embarque.estado === "en-transito") && (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => finalizarEmbarque(embarque.id)}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Finalizando...
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-4 w-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Finalizar Embarque
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Indicador de modificación si aplica */}
                {embarque.modificado && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-red-800 font-medium">
                          ⚠️ EMBARQUE MODIFICADO
                        </p>
                        <p className="text-red-600 text-sm">
                          Este embarque ha sido modificado por situaciones de
                          emergencia/contingencia
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Layout principal del embarque */}
                <div
                  className={`rounded-lg border-2 ${
                    embarque.modificado
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="p-4 space-y-4">
                    {/* Información General */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="space-y-1 ml-6">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Cliente
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {embarque.cliente?.nombre || "Sin asignar"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Contacto del Cliente
                        </label>
                        <p className="text-sm text-gray-700">
                          {(() => {
                            const contacto = contactosClientes.find(
                              (c) => c.cliente_id === embarque.cliente?.id
                            );
                            return contacto
                              ? `${contacto.nombre} ${contacto.apellidos || ""}`
                              : "No especificado";
                          })()}
                        </p>
                        {(() => {
                          const contacto = contactosClientes.find(
                            (c) => c.cliente_id === embarque.cliente?.id
                          );
                          return contacto?.puesto ? (
                            <p className="text-xs text-gray-500">
                              {contacto.puesto}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Tipo de Servicio
                        </label>
                        <p className="text-sm text-gray-700">
                          {embarque.tipo_servicio_id
                            ? embarque.tipo_servicio_id ===
                              "exportacion-cargada-caja-seca-240"
                              ? "EXPORTACIÓN CARGADA - CAJA SECA 240"
                              : embarque.tipo_servicio_id ===
                                "exportacion-cargada-larmex-240"
                              ? "EXPORTACIÓN CARGADA - CAJA SECA (LARMEX) 240"
                              : embarque.tipo_servicio_id ===
                                "exportacion-cargada-thermo-agricultura-240"
                              ? "EXPORTACIÓN CARGADA - THERMO (AGRICULTURA) 240"
                              : embarque.tipo_servicio_id ===
                                "exportacion-cargada-plataforma-240"
                              ? "EXPORTACIÓN CARGADA - PLATAFORMA 240"
                              : embarque.tipo_servicio_id ===
                                "importacion-cargada-caja-seca-240"
                              ? "IMPORTACIÓN CARGADA - CAJA SECA 240"
                              : embarque.tipo_servicio_id ===
                                "importacion-cargada-plataforma-240"
                              ? "IMPORTACIÓN CARGADA - PLATAFORMA 240"
                              : embarque.tipo_servicio_id ===
                                "importacion-vacia-caja-seca-thermo-240"
                              ? "IMPORTACIÓN VACÍA - CAJA SECA/THERMO 240"
                              : embarque.tipo_servicio_id ===
                                "importacion-cargada-plataforma-amarre-240"
                              ? "IMPORTACIÓN CARGADA - PLATAFORMA CON AMARRE 240"
                              : embarque.tipo_servicio_id ===
                                "importacion-en-tractor-240"
                              ? "IMPORTACIÓN - EN TRACTOR 240"
                              : embarque.tipo_servicio_id ===
                                "exportacion-cargada-caja-seca-800"
                              ? "EXPORTACIÓN CARGADA - CAJA SECA 800"
                              : embarque.tipo_servicio_id ===
                                "exportacion-vacia-caja-seca-800"
                              ? "EXPORTACIÓN VACÍA - CAJA SECA 800"
                              : embarque.tipo_servicio_id ===
                                "exportacion-en-tractor-800"
                              ? "EXPORTACIÓN - EN TRACTOR 800"
                              : embarque.tipo_servicio_id ===
                                "exportacion-cargada-plataforma-800"
                              ? "EXPORTACIÓN CARGADA - PLATAFORMA 800"
                              : embarque.tipo_servicio_id ===
                                "importacion-cargada-caja-seca-800"
                              ? "IMPORTACIÓN CARGADA - CAJA SECA 800"
                              : embarque.tipo_servicio_id ===
                                "importacion-vacia-plataforma-800"
                              ? "IMPORTACIÓN VACÍA - PLATAFORMA 800"
                              : embarque.tipo_servicio_id === "pagos-extras"
                              ? "PAGOS EXTRAS"
                              : embarque.tipo_servicio_id ===
                                "horas-rojo-amarillo"
                              ? "HORAS ROJO/AMARILLO"
                              : embarque.tipo_servicio_id === "cargas-descargas"
                              ? "CARGAS/DESCARGAS"
                              : embarque.tipo_servicio_id ===
                                "movimientos-en-falso"
                              ? "MOVIMIENTOS EN FALSO"
                              : embarque.tipo_servicio_id ===
                                "movimientos-locales"
                              ? "MOVIMIENTOS LOCALES"
                              : embarque.tipo_servicio_id === "otro"
                              ? "OTRO"
                              : embarque.tipo_servicio_id
                            : "No especificado"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Carta Porte
                        </label>
                        <p className="text-sm text-gray-700">
                          {embarque.carta_porte || "Sin asignar"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Precio Flete
                        </label>
                        <p className="text-sm font-semibold text-green-600">
                          {embarque.precio_flete
                            ? `$${embarque.precio_flete.toLocaleString()} ${
                                embarque.moneda_flete || "MXN"
                              }`
                            : "Sin definir"}
                        </p>
                        {embarque.precio_flete && embarque.moneda_flete && (
                          <p className="text-xs text-gray-500">
                            {embarque.moneda_flete === "USD"
                              ? "Dólares Americanos"
                              : "Pesos Mexicanos"}
                          </p>
                        )}
                        {/* Mostrar descuento y precio quickpaid si existen */}
                        {embarque.quickpaid_descuento > 0 && (
                          <p className="text-xs text-yellow-700 font-semibold">
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
                        {embarque.precio_quickpaid > 0 && (
                          <p className="text-xs text-yellow-900 font-semibold">
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
                    </div>

                    {/* Direcciones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Dirección de Recolecta
                        </label>
                        <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded border">
                          {embarque.direccion_recolecta ||
                            embarque.origen ||
                            "No especificada"}
                        </p>
                        <div className="text-xs text-gray-500">
                          Fecha:{" "}
                          {embarque.fecha_recolecta
                            ? new Date(
                                embarque.fecha_recolecta
                              ).toLocaleDateString()
                            : "No especificada"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Dirección de Entrega
                        </label>
                        <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded border">
                          {embarque.direccion_entrega ||
                            embarque.destino ||
                            "No especificada"}
                        </p>
                        <div className="text-xs text-gray-500">
                          Fecha:{" "}
                          {embarque.fecha_entrega
                            ? new Date(
                                embarque.fecha_entrega
                              ).toLocaleDateString()
                            : "No especificada"}
                        </div>
                      </div>
                    </div>

                    {/* Recursos Asignados */}
                    {(embarque.estado === "asignado" ||
                      embarque.estado === "en-transito") && (
                      <div className="border-t pt-4">
                        <div className="flex items-center mb-3">
                          <UserCheck className="h-4 w-4 text-gray-600 mr-2" />
                          <h4 className="text-sm font-semibold text-gray-800">
                            Recursos Asignados
                          </h4>
                          {embarque.modificado && (
                            <Badge className="ml-3 bg-red-100 text-red-800 text-xs">
                              MODIFICADO
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row md:space-x-8 space-y-2 md:space-y-0 ml-8">
                          {/* Operador */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Operador
                            </label>
                            <p className="text-sm font-medium text-gray-900">
                              {embarque.operador
                                ? `${embarque.operador.nombre} ${embarque.operador.apellidos}`
                                : "Sin asignar"}
                            </p>
                          </div>
                          {/* Tractocamión */}
                          <div className="space-y-1 ml-20">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Tractocamión
                            </label>
                            <p className="text-sm text-gray-700">
                              {embarque.camion?.numero_economico ||
                                "Sin asignar"}
                            </p>
                            {embarque.camion?.marca && (
                              <p className="text-xs text-gray-600">
                                {embarque.camion.marca}
                              </p>
                            )}
                          </div>
                          {/* Remolque */}
                          <div className="space-y-1 ml-12">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Remolque
                            </label>
                            <p className="text-sm text-gray-700">
                              {embarque.remolque?.numero_economico ||
                                embarque.remolque_placa ||
                                "Sin asignar"}
                              {embarque.remolque_placa &&
                                !embarque.remolque && (
                                  <span className="text-xs text-blue-600 block">
                                    (Manual)
                                  </span>
                                )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Formulario de Asignación */}
                    {embarque.estado === "listo-para-asignar" && (
                      <div className="border-t pt-4">
                        <div className="flex items-center mb-3">
                          <Settings className="h-4 w-4 text-blue-600 mr-2" />
                          <h4 className="text-sm font-semibold text-blue-800">
                            Asignar Recursos
                          </h4>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <div className="grid grid-cols-2 gap-4">
                            {/* Fila 1: Operador | Precio Flete */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Operador *
                              </Label>
                              <Select
                                value={
                                  asignaciones[embarque.id]?.operador_id || ""
                                }
                                onValueChange={(value) =>
                                  setAsignaciones((prev) => ({
                                    ...prev,
                                    [embarque.id]: {
                                      ...prev[embarque.id],
                                      operador_id: value,
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Seleccionar operador" />
                                </SelectTrigger>
                                <SelectContent>
                                  {operadores.map((operador) => (
                                    <SelectItem
                                      key={operador.id}
                                      value={operador.id}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>
                                          {operador.nombre} {operador.apellidos}
                                        </span>
                                        {getVehicleStatusBadge(operador.estado)}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Precio Flete *
                              </Label>
                              <div className="flex space-x-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="bg-white flex-1"
                                  required
                                  value={
                                    asignaciones[embarque.id]?.precio_flete ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setAsignaciones((prev) => ({
                                      ...prev,
                                      [embarque.id]: {
                                        ...prev[embarque.id],
                                        precio_flete: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <Select
                                  value={
                                    asignaciones[embarque.id]?.moneda_flete ||
                                    embarque.moneda_flete ||
                                    "MXN"
                                  }
                                  onValueChange={(value) =>
                                    setAsignaciones((prev) => ({
                                      ...prev,
                                      [embarque.id]: {
                                        ...prev[embarque.id],
                                        moneda_flete: value,
                                      },
                                    }))
                                  }
                                  required
                                >
                                  <SelectTrigger className="w-20 bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MXN">MXN</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {/* Fila 2: Tractocamión | QuickPaid */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Tractocamión *
                              </Label>
                              <Select
                                value={
                                  asignaciones[embarque.id]?.camion_id || ""
                                }
                                onValueChange={(value) =>
                                  setAsignaciones((prev) => ({
                                    ...prev,
                                    [embarque.id]: {
                                      ...prev[embarque.id],
                                      camion_id: value,
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Seleccionar camión" />
                                </SelectTrigger>
                                <SelectContent>
                                  {camiones.length === 0 ? (
                                    <SelectItem value="no-camiones" disabled>
                                      No hay tractocamiones disponibles
                                    </SelectItem>
                                  ) : (
                                    camiones.map((camion) => (
                                      <SelectItem
                                        key={camion.id}
                                        value={camion.id}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span>
                                            {camion.numero_economico} -{" "}
                                            {camion.marca || "Sin marca"}
                                          </span>
                                          <div className="ml-2">
                                            {camion.estado === "disponible" ||
                                            camion.estado === "activo" ? (
                                              <div
                                                className="w-2 h-2 bg-green-500 rounded-full"
                                                title="Disponible"
                                              ></div>
                                            ) : (
                                              <div
                                                className="w-2 h-2 bg-red-500 rounded-full"
                                                title="No Disponible"
                                              ></div>
                                            )}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            {/* QuickPaid section inline with Tractocamión */}
                            <div className="flex items-end gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`quickpaid-enabled-${embarque.id}`}
                                  className="w-7 h-7"
                                  checked={
                                    !!asignaciones[embarque.id]
                                      ?.quickpaidEnabled
                                  }
                                  onChange={(e) => {
                                    setAsignaciones((prev) => ({
                                      ...prev,
                                      [embarque.id]: {
                                        ...prev[embarque.id],
                                        quickpaidEnabled: e.target.checked,
                                        ...(e.target.checked
                                          ? {}
                                          : { quickpaid: "" }),
                                      },
                                    }));
                                  }}
                                />
                                <Label
                                  htmlFor={`quickpaid-enabled-${embarque.id}`}
                                  className="text-sm font-medium text-gray-700 select-none cursor-pointer"
                                >
                                  Aplicar QuickPaid
                                </Label>
                                <Select
                                  value={
                                    asignaciones[embarque.id]?.quickpaid || ""
                                  }
                                  onValueChange={(value) =>
                                    setAsignaciones((prev) => ({
                                      ...prev,
                                      [embarque.id]: {
                                        ...prev[embarque.id],
                                        quickpaid: value,
                                      },
                                    }))
                                  }
                                  disabled={
                                    !asignaciones[embarque.id]?.quickpaidEnabled
                                  }
                                >
                                  <SelectTrigger className="bg-white min-w-[120px]">
                                    <SelectValue placeholder="% descuento" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0.005">0.5%</SelectItem>
                                    <SelectItem value="0.01">1%</SelectItem>
                                    <SelectItem value="0.015">1.5%</SelectItem>
                                    <SelectItem value="0.02">2%</SelectItem>
                                    <SelectItem value="0.025">2.5%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* Mostrar cálculo de descuento y precio con descuento */}
                              {(() => {
                                const precioFlete = parseFloat(
                                  asignaciones[embarque.id]?.precio_flete || "0"
                                );
                                const quickpaidEnabled =
                                  !!asignaciones[embarque.id]?.quickpaidEnabled;
                                const quickpaid = quickpaidEnabled
                                  ? parseFloat(
                                      asignaciones[embarque.id]?.quickpaid ||
                                        "0"
                                    )
                                  : 0;
                                const descuento = precioFlete * quickpaid;
                                const precioConDescuento =
                                  precioFlete - descuento;
                                if (
                                  !precioFlete ||
                                  !quickpaidEnabled ||
                                  !quickpaid
                                )
                                  return null;
                                return (
                                  <div className="col-span-2 mt-2 bg-blue-50 rounded p-2 text-sm">
                                    <div className="flex flex-wrap gap-4">
                                      <span>
                                        <b>Precio Flete:</b> $
                                        {precioFlete.toFixed(2)}
                                      </span>
                                      <span>
                                        <b>Descuento QuickPaid:</b> -$
                                        {descuento.toFixed(2)}
                                      </span>
                                      <span>
                                        <b>Precio con Descuento:</b> $
                                        {precioConDescuento.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          {/* Botón Asignar SIEMPRE visible */}
                          <div className="col-span-2 flex items-center mt-4">
                            <Button
                              onClick={() => {
                                const asignacion = asignaciones[embarque.id];
                                if (
                                  !asignacion ||
                                  !asignacion.operador_id ||
                                  !asignacion.camion_id
                                ) {
                                  alert(
                                    "Por favor selecciona operador y camión"
                                  );
                                  return;
                                }

                                if (
                                  !asignacion.precio_flete ||
                                  asignacion.precio_flete.trim() === ""
                                ) {
                                  alert(
                                    "Por favor ingresa el precio del flete"
                                  );
                                  return;
                                }

                                if (!asignacion.moneda_flete) {
                                  alert(
                                    "Por favor selecciona la moneda del flete"
                                  );
                                  return;
                                }

                                const operadorSeleccionado = operadores.find(
                                  (op) => op.id === asignacion.operador_id
                                );
                                const camionSeleccionado = camiones.find(
                                  (cam) => cam.id === asignacion.camion_id
                                );

                                const confirmacion = confirm(
                                  `¿Estás seguro de que deseas asignar los siguientes recursos al embarque ${embarque.folio}?\n\n` +
                                    `Operador: ${
                                      operadorSeleccionado
                                        ? `${operadorSeleccionado.nombre} ${operadorSeleccionado.apellidos}`
                                        : "No seleccionado"
                                    }\n` +
                                    `Tractocamión: ${
                                      camionSeleccionado
                                        ? `${camionSeleccionado.numero_economico} - ${camionSeleccionado.marca}`
                                        : "No seleccionado"
                                    }\n` +
                                    `Precio Flete: $${asignacion.precio_flete} ${asignacion.moneda_flete}\n\n` +
                                    `Esta acción cambiará el estado del embarque a "Asignado".`
                                );

                                if (confirmacion) {
                                  asignarRecursos(embarque.id);
                                }
                              }}
                              disabled={
                                saving ||
                                !asignaciones[embarque.id]?.operador_id ||
                                !asignaciones[embarque.id]?.camion_id ||
                                !asignaciones[embarque.id]?.precio_flete ||
                                !asignaciones[embarque.id]?.moneda_flete
                              }
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                              {saving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Asignando...
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Asignar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de Detalles con Pestañas */}
      {showDetailsModal && embarqueDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Detalles del Embarque
                </h2>
                <p className="text-sm text-gray-600">
                  Folio: {embarqueDetalle.folio}
                </p>
              </div>
              <Button
                onClick={() => setShowDetailsModal(false)}
                variant="outline"
                size="sm"
              >
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
                        activeTab === "ubicaciones"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("ubicaciones")}
                    >
                      Ubicaciones
                    </button>
                    <button
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === "recursos"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("recursos")}
                    >
                      Recursos
                    </button>
                    <button
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === "financiero"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("financiero")}
                    >
                      Financiero
                    </button>
                    <button
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === "contacto-cliente"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("contacto-cliente")}
                    >
                      Contacto del Cliente
                    </button>
                    {embarqueDetalle?.modificado && (
                      <button
                        className={`border-b-2 py-2 px-1 text-sm font-medium ${
                          activeTab === "modificaciones"
                            ? "border-red-500 text-red-600"
                            : "border-transparent text-red-500 hover:text-red-700"
                        }`}
                        onClick={() => setActiveTab("modificaciones")}
                      >
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Modificaciones
                      </button>
                    )}
                    <button
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === "fotos"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("fotos")}
                    >
                      Fotos de Evidencia ({fotosEmbarque.length})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {/* Información General Tab */}
                  {activeTab === "general" && (
                    <div className="space-y-6">
                      {/* Cliente Section */}
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Información del Cliente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Cliente
                            </label>
                            <p className="text-sm font-medium text-gray-900">
                              {embarqueDetalle.cliente?.nombre || // Changed here
                                "Sin asignar"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Teléfono
                            </label>
                            <p className="text-sm text-gray-700">
                              {embarqueDetalle.cliente?.telefono ||
                                "No especificado"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Email
                            </label>
                            <p className="text-sm text-gray-700">
                              {embarqueDetalle.cliente?.email ||
                                "No especificado"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Divisa de Pago
                            </label>
                            <p className="text-sm text-gray-700">
                              {embarqueDetalle.cliente?.divisa_pago === "MXN"
                                ? "Pesos Mexicanos (MXN)"
                                : embarqueDetalle.cliente?.divisa_pago === "USD"
                                ? "Dólares Americanos (USD)"
                                : "No especificado"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Forma de Facturación
                            </label>
                            <p className="text-sm text-gray-700">
                              {embarqueDetalle.cliente?.forma_facturacion ===
                              "pue"
                                ? "Pago en una sola exhibición (PUE)"
                                : embarqueDetalle.cliente?.forma_facturacion ===
                                  "ppd"
                                ? "Pago en parcialidades o diferido (PPD)"
                                : "No especificado"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Embarque Section */}
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Información del Embarque
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Estado
                            </label>
                            <div className="flex items-center">
                              {getEstadoBadge(embarqueDetalle.estado)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Carta Porte
                            </label>
                            <p className="text-sm font-mono font-medium text-gray-900">
                              {embarqueDetalle.carta_porte || "Sin asignar"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Fecha Creación
                            </label>
                            <p className="text-sm text-gray-700">
                              {new Date(
                                embarqueDetalle.fecha_creacion
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Folio
                            </label>
                            <p className="text-sm font-mono font-medium text-gray-900">
                              {embarqueDetalle.folio}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Contenido
                            </label>
                            <p className="text-sm text-gray-700">
                              {embarqueDetalle.contenido || "No especificado"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Peso
                            </label>
                            <p className="text-sm text-gray-700">
                              {embarqueDetalle.peso || "No especificado"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ubicaciones Tab */}
                  {activeTab === "ubicaciones" && (
                    <div className="space-y-6">
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Direcciones de Recolecta y Entrega
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                              Dirección de Recolecta
                            </label>
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <p className="text-sm text-gray-900 leading-relaxed">
                                {embarqueDetalle.direccion_recolecta ||
                                  embarqueDetalle.origen ||
                                  "No especificada"}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Fecha
                                </label>
                                <p className="text-sm text-gray-700">
                                  {embarqueDetalle.fecha_recolecta
                                    ? new Date(
                                        embarqueDetalle.fecha_recolecta
                                      ).toLocaleDateString()
                                    : "Sin fecha"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Hora
                                </label>
                                <p className="text-sm text-gray-700">
                                  {embarqueDetalle.hora_recolecta || "Sin hora"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                              Dirección de Entrega
                            </label>
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <p className="text-sm text-gray-900 leading-relaxed">
                                {embarqueDetalle.direccion_entrega ||
                                  embarqueDetalle.destino ||
                                  "No especificada"}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Fecha
                                </label>
                                <p className="text-sm text-gray-700">
                                  {embarqueDetalle.fecha_entrega
                                    ? new Date(
                                        embarqueDetalle.fecha_entrega
                                      ).toLocaleDateString()
                                    : "Sin fecha"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Hora
                                </label>
                                <p className="text-sm text-gray-700">
                                  {embarqueDetalle.hora_entrega || "Sin hora"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recursos Tab */}
                  {activeTab === "recursos" && (
                    <div className="space-y-6">
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Recursos Asignados
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Detalles del Operador
                            </h4>
                            <div className="space-y-2">
                              <p className="text-base font-semibold text-gray-900">
                                {embarqueDetalle.operador
                                  ? `${embarqueDetalle.operador.nombre} ${embarqueDetalle.operador.apellidos}`
                                  : "Sin asignar"}
                              </p>
                              {embarqueDetalle.operador?.telefono && (
                                <p className="text-sm text-gray-600">
                                  Teléfono: {embarqueDetalle.operador.telefono}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Detalles del Tractocamión
                            </h4>
                            <div className="space-y-2">
                              <p className="text-base font-mono font-semibold text-gray-900">
                                {embarqueDetalle.camion?.numero_economico ||
                                  "Sin asignar"}
                              </p>
                              {embarqueDetalle.camion?.marca && (
                                <p className="text-sm text-gray-600">
                                  Marca: {embarqueDetalle.camion.marca}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Detalles del Remolque
                            </h4>
                            <div className="space-y-2">
                              <p className="text-base font-mono font-semibold text-gray-900">
                                {embarqueDetalle.remolque?.numero_economico ||
                                  embarqueDetalle.remolque_numero_economico || // Corrected column name
                                  "Sin asignar"}
                              </p>
                              {embarqueDetalle.remolque?.placas && (
                                <p className="text-sm text-gray-600">
                                  Placas: {embarqueDetalle.remolque.placas}
                                </p>
                              )}
                              {embarqueDetalle.remolque_placa &&
                                !embarqueDetalle.remolque && ( // Corrected column name
                                  <p className="text-sm text-gray-600">
                                    Placas (Manual):{" "}
                                    {embarqueDetalle.remolque_placa}{" "}
                                    {/* Corrected column name */}
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financiero Tab */}
                  {activeTab === "financiero" && (
                    <div className="space-y-6">
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Información Financiera
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Precio del Flete
                            </label>
                            <p className="text-2xl font-bold text-gray-900">
                              {embarqueDetalle.precio_flete
                                ? `$${embarqueDetalle.precio_flete} ${
                                    embarqueDetalle.moneda_flete || "MXN"
                                  }`
                                : "Sin definir"}
                            </p>
                          </div>
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Flete en Falso
                            </label>
                            <p className="text-base font-medium text-gray-900">
                              {embarqueDetalle.flete_falso ? "Sí" : "No"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Observaciones
                        </h3>
                        <div className="bg-gray-50 border rounded-lg p-4 min-h-[120px]">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {embarqueDetalle.observaciones ||
                              "Sin observaciones registradas"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contacto del Cliente Tab */}
                  {activeTab === "contacto-cliente" && (
                    <div className="space-y-6">
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Contacto Principal del Cliente
                        </h3>
                        {(() => {
                          const contacto = contactosClientes.find(
                            (c) =>
                              c.cliente_id === embarqueDetalle.cliente?.id &&
                              c.es_principal
                          );
                          if (!contacto) {
                            return (
                              <p className="text-gray-500">
                                No se ha especificado un contacto principal para
                                este cliente.
                              </p>
                            );
                          }
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Nombre
                                </label>
                                <p className="text-sm font-medium text-gray-900">
                                  {contacto.nombre} {contacto.apellidos || ""}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Puesto
                                </label>
                                <p className="text-sm text-gray-700">
                                  {contacto.puesto || "No especificado"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Teléfono
                                </label>
                                <p className="text-sm text-gray-700">
                                  {contacto.telefono || "No especificado"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Email
                                </label>
                                <p className="text-sm text-gray-700">
                                  {contacto.email || "No especificado"}
                                </p>
                              </div>
                              <div className="space-y-1 col-span-full">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Notas
                                </label>
                                <p className="text-sm text-gray-700">
                                  {contacto.notas || "Sin notas"}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Modificaciones Tab */}
                  {activeTab === "modificaciones" &&
                    embarqueDetalle?.modificado && (
                      <div className="space-y-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                          <div className="flex items-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                            <h3 className="text-lg font-semibold text-red-800">
                              Historial de Modificaciones
                            </h3>
                          </div>

                          <ModificacionesHistory
                            embarqueId={embarqueDetalle.id}
                          />
                        </div>
                      </div>
                    )}

                  {activeTab === "fotos" && (
                    <div className="space-y-6">
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Fotos de Evidencia del Embarque
                        </h3>
                        {loadingFotos ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-600">
                              Cargando fotos...
                            </span>
                          </div>
                        ) : fotosEmbarque.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {fotosEmbarque.map((foto) => (
                              <div
                                key={foto.id}
                                className="group relative block cursor-pointer"
                                onClick={() => setSelectedImage(foto.url)}
                              >
                                <img
                                  src={foto.url || "/placeholder.svg"}
                                  alt={foto.nombre_archivo}
                                  className="w-full h-40 object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-center justify-center">
                                  <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                                  <p className="text-xs text-white font-semibold truncate">
                                    {foto.nombre_archivo}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">
                              No hay fotos de evidencia para este embarque.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-start space-x-4">
                    <Button
                      onClick={descargarExcel}
                      variant="outline"
                      size="sm"
                      className="text-gray-700 border-gray-300 hover:bg-gray-50 bg-white"
                    >
                      📊 Descargar Excel
                    </Button>
                    <Button
                      onClick={imprimirDetalles}
                      variant="outline"
                      size="sm"
                      className="text-gray-700 border-gray-300 hover:bg-gray-50 bg-white"
                    >
                      🖨️ Imprimir Detalles
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Modificación */}
      {showModifyModal && embarqueAModificar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-red-50">
              <div>
                <h2 className="text-xl font-bold text-red-800">
                  Modificar Embarque
                </h2>
                <p className="text-sm text-red-600">
                  Folio: {embarqueAModificar.folio} - Solo para situaciones de
                  emergencia
                </p>
              </div>
              <Button
                onClick={() => setShowModifyModal(false)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 px-6 pt-6">
                <nav className="flex space-x-8" aria-label="Tabs">
                  <button
                    className={`border-b-2 py-2 px-1 text-sm font-medium ${
                      activeModifyTab === "justificacion"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveModifyTab("justificacion")}
                  >
                    Justificación
                  </button>
                  <button
                    className={`border-b-2 py-2 px-1 text-sm font-medium ${
                      activeModifyTab === "operador"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveModifyTab("operador")}
                  >
                    Operador
                  </button>
                  <button
                    className={`border-b-2 py-2 px-1 text-sm font-medium ${
                      activeModifyTab === "vehiculos"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveModifyTab("vehiculos")}
                  >
                    Vehículos
                  </button>
                  <button
                    className={`border-b-2 py-2 px-1 text-sm font-medium ${
                      activeModifyTab === "flete"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveModifyTab("flete")}
                  >
                    Flete
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Justificación Tab */}
                {activeModifyTab === "justificacion" && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <Label className="text-lg font-semibold mb-4 block text-red-800">
                        Justificación de la Modificación *
                      </Label>
                      <textarea
                        className="w-full p-4 border border-yellow-300 rounded-md text-sm min-h-[120px]"
                        placeholder="Explica detalladamente la razón de esta modificación (emergencia, contingencia, cambio de cliente, etc.)"
                        value={modificacionData.razon}
                        onChange={(e) =>
                          setModificacionData((prev) => ({
                            ...prev,
                            razon: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Esta justificación será registrada en el historial de
                        auditoría del embarque.
                      </p>
                    </div>
                  </div>
                )}

                {/* Operador Tab */}
                {activeModifyTab === "operador" && (
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <input
                          type="checkbox"
                          id="cambiar_operador"
                          checked={modificacionData.cambiar_operador}
                          onChange={(e) =>
                            setModificacionData((prev) => ({
                              ...prev,
                              cambiar_operador: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 text-red-600"
                        />
                        <Label
                          htmlFor="cambiar_operador"
                          className="text-lg font-semibold text-gray-800"
                        >
                          Cambiar Operador
                        </Label>
                      </div>

                      {modificacionData.cambiar_operador && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Operador Actual
                              </h4>
                              <div className="space-y-2">
                                <p className="text-base font-medium text-gray-900">
                                  {embarqueAModificar.operador
                                    ? `${embarqueAModificar.operador.nombre} ${embarqueAModificar.operador.apellidos}`
                                    : "Sin asignar"}
                                </p>
                                {embarqueAModificar.operador?.telefono && (
                                  <p className="text-sm text-gray-600">
                                    Tel: {embarqueAModificar.operador.telefono}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Nuevo Operador
                              </Label>
                              <Select
                                value={modificacionData.nuevo_operador_id}
                                onValueChange={(value) =>
                                  setModificacionData((prev) => ({
                                    ...prev,
                                    nuevo_operador_id: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Seleccionar nuevo operador" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no-change">
                                    No cambiar
                                  </SelectItem>
                                  {operadores.map((operador) => (
                                    <SelectItem
                                      key={operador.id}
                                      value={operador.id}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {operador.nombre} {operador.apellidos}
                                        </span>
                                        {operador.telefono && (
                                          <span className="text-xs text-gray-500">
                                            {operador.telefono}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vehículos Tab */}
                {activeModifyTab === "vehiculos" && (
                  <div className="space-y-6">
                    {/* Tractocamión */}
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <input
                          type="checkbox"
                          id="cambiar_camion"
                          checked={modificacionData.cambiar_camion}
                          onChange={(e) =>
                            setModificacionData((prev) => ({
                              ...prev,
                              cambiar_camion: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 text-red-600"
                        />
                        <Label
                          htmlFor="cambiar_camion"
                          className="text-lg font-semibold text-gray-800"
                        >
                          Cambiar Tractocamión
                        </Label>
                      </div>

                      {modificacionData.cambiar_camion && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Tractocamión Actual
                            </h4>
                            <div className="space-y-2">
                              <p className="text-base font-mono font-medium text-gray-900">
                                {embarqueAModificar.camion?.numero_economico ||
                                  "Sin asignar"}
                              </p>
                              {embarqueAModificar.camion?.marca && (
                                <p className="text-sm text-gray-600">
                                  {embarqueAModificar.camion.marca}{" "}
                                  {embarqueAModificar.camion.modelo}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Nuevo Tractocamión
                            </Label>
                            <Select
                              value={modificacionData.nuevo_camion_id}
                              onValueChange={(value) =>
                                setModificacionData((prev) => ({
                                  ...prev,
                                  nuevo_camion_id: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar nuevo camión" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-change">
                                  No cambiar
                                </SelectItem>
                                {camiones.map((camion) => (
                                  <SelectItem key={camion.id} value={camion.id}>
                                    <div className="flex flex-col">
                                      <span className="font-mono font-medium">
                                        {camion.numero_economico}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {camion.marca} {camion.modelo}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remolque */}
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <input
                          type="checkbox"
                          id="cambiar_remolque"
                          checked={modificacionData.cambiar_remolque}
                          onChange={(e) =>
                            setModificacionData((prev) => ({
                              ...prev,
                              cambiar_remolque: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 text-red-600"
                        />
                        <Label
                          htmlFor="cambiar_remolque"
                          className="text-lg font-semibold text-gray-800"
                        >
                          Cambiar Remolque
                        </Label>
                      </div>

                      {modificacionData.cambiar_remolque && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Remolque Actual
                            </h4>
                            <div className="space-y-2">
                              <p className="text-base font-mono font-medium text-gray-900">
                                {embarqueAModificar.remolque
                                  ?.numero_economico ||
                                  embarqueAModificar.remolque_numero_economico || // Corrected column name
                                  "Sin asignar"}
                              </p>
                              {embarqueAModificar.remolque?.placas && (
                                <p className="text-sm text-gray-600">
                                  Placas: {embarqueAModificar.remolque.placas}
                                </p>
                              )}
                              {embarqueAModificar.remolque_placa &&
                                !embarqueAModificar.remolque && ( // Corrected column name
                                  <p className="text-sm text-gray-600">
                                    Placas (Manual):{" "}
                                    {embarqueAModificar.remolque_placa}{" "}
                                    {/* Corrected column name */}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Nuevo Remolque
                            </Label>
                            <Select
                              value={modificacionData.nuevo_remolque_id}
                              onValueChange={(value) =>
                                setModificacionData((prev) => ({
                                  ...prev,
                                  nuevo_remolque_id: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Seleccionar nuevo remolque" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-change">
                                  No cambiar
                                </SelectItem>
                                <SelectItem value="sin-remolque">
                                  Sin remolque
                                </SelectItem>
                                <SelectItem value="manual">
                                  Capturar remolque manualmente
                                </SelectItem>
                                {remolques.map((remolque) => (
                                  <SelectItem
                                    key={remolque.id}
                                    value={remolque.id}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-mono font-medium">
                                        {remolque.numero_economico}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {remolque.tipo_remolque}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Si el usuario selecciona 'manual', mostrar inputs para capturar remolque */}
                          {modificacionData.nuevo_remolque_id === "manual" && (
                            <div className="col-span-2 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Número Económico (Manual)
                              </Label>
                              <Input
                                type="text"
                                placeholder="Ej: Caja Seca, Plataforma"
                                className="mb-2"
                                value={
                                  modificacionData.remolque_numero_economico ||
                                  "" // Corrected column name
                                }
                                onChange={(e) =>
                                  setModificacionData((prev) => ({
                                    ...prev,
                                    remolque_numero_economico: e.target.value, // Corrected column name
                                  }))
                                }
                              />
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Placas del Remolque (Manual)
                              </Label>
                              <Input
                                type="text"
                                placeholder="Ej: ABC123A"
                                value={
                                  modificacionData.remolque_placa || "" // Corrected column name
                                }
                                onChange={(e) =>
                                  setModificacionData((prev) => ({
                                    ...prev,
                                    remolque_placa: e.target.value, // Corrected column name
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Flete Tab */}
                {activeModifyTab === "flete" && (
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <input
                          type="checkbox"
                          id="cambiar_flete"
                          checked={modificacionData.cambiar_flete}
                          onChange={(e) =>
                            setModificacionData((prev) => ({
                              ...prev,
                              cambiar_flete: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 text-red-600"
                        />
                        <Label
                          htmlFor="cambiar_flete"
                          className="text-lg font-semibold text-gray-800"
                        >
                          Cambiar Información de Flete
                        </Label>
                      </div>

                      {modificacionData.cambiar_flete && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Precio Flete Actual
                              </h4>
                              <p className="text-xl font-bold text-gray-900">
                                {embarqueAModificar.precio_flete
                                  ? `$${embarqueAModificar.precio_flete} ${
                                      embarqueAModificar.moneda_flete || "MXN"
                                    }`
                                  : "Sin definir"}
                              </p>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Nuevo Precio Flete
                              </Label>
                              <div className="flex space-x-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="flex-1 h-12 text-lg"
                                  value={modificacionData.nuevo_precio_flete}
                                  onChange={(e) =>
                                    setModificacionData((prev) => ({
                                      ...prev,
                                      nuevo_precio_flete: e.target.value,
                                    }))
                                  }
                                />
                                <Select
                                  value={modificacionData.nueva_moneda_flete}
                                  onValueChange={(value) =>
                                    setModificacionData((prev) => ({
                                      ...prev,
                                      nueva_moneda_flete: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-24 h-12">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MXN">MXN</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="flete_en_falso"
                                checked={modificacionData.flete_en_falso}
                                onChange={(e) =>
                                  setModificacionData((prev) => ({
                                    ...prev,
                                    flete_en_falso: e.target.checked,
                                  }))
                                }
                                className="w-5 h-5 text-red-600"
                              />
                              <div>
                                <Label
                                  htmlFor="flete_en_falso"
                                  className="text-sm font-semibold text-red-800"
                                >
                                  Marcar como Flete en Falso
                                </Label>
                                <p className="text-xs text-red-600 mt-1">
                                  Esta opción indica que el flete no se realizó
                                  o fue cancelado
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t p-6 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowModifyModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={guardarModificacion}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    "Guardar Modificación"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registros Completados */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Registros Completados
                </h2>
                <p className="text-sm text-gray-600">
                  Embarques finalizados y archivados (
                  {embarquesFinalizados.length} registros)
                </p>
              </div>
              <Button
                onClick={() => setShowCompletedModal(false)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex items-center space-x-2 flex-1">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar en registros completados..." />
                  </div>
                  <Button
                    onClick={descargarRegistrosCompletos}
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    📊 Descargar Excel
                  </Button>
                </div>

                {loadingCompleted ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">
                      Cargando registros...
                    </span>
                  </div>
                ) : embarquesFinalizados.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No hay registros completados disponibles
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Folio
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Operador
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Tractocamión
                          </th>
                          <th className="px-3 py-2 whitespace-nowrap text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Remolque
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Origen
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Destino
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Fecha Finalización
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Precio Flete
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[120px]">
                            Tipo de Servicio
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Restaurar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {embarquesFinalizados.map((embarque) => (
                          <tr key={embarque.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {embarque.folio}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              {embarque.cliente?.nombre || "Sin cliente"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              {embarque.operador
                                ? `${embarque.operador.nombre} ${embarque.operador.apellidos}`
                                : "Sin operador"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              {embarque.camion?.numero_economico ||
                                "Sin camión"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              {embarque.remolque?.numero_economico ||
                                embarque.remolque_numero_economico ||
                                "Sin remolque"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              {embarque.direccion_recolecta ||
                                embarque.origen ||
                                "N/A"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              {embarque.direccion_entrega ||
                                embarque.destino ||
                                "N/A"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              {embarque.fecha_finalizacion
                                ? new Date(
                                    embarque.fecha_finalizacion
                                  ).toLocaleDateString()
                                : new Date(
                                    embarque.updated_at
                                  ).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-green-600">
                              {embarque.precio_flete
                                ? `$${embarque.precio_flete.toLocaleString()} ${
                                    embarque.moneda_flete || "MXN"
                                  }`
                                : "Sin definir"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 w-[120px] overflow-hidden text-ellipsis">
                              {embarque.tipo_servicio_id
                                ? embarque.tipo_servicio_id ===
                                  "exportacion-cargada-caja-seca-240"
                                  ? "EXP. CARGADA - CAJA SECA 240"
                                  : embarque.tipo_servicio_id ===
                                    "exportacion-cargada-larmex-240"
                                  ? "EXP. CARGADA - CAJA SECA (LARMEX) 240"
                                  : embarque.tipo_servicio_id ===
                                    "exportacion-cargada-thermo-agricultura-240"
                                  ? "EXP. CARGADA - THERMO (AGRICULTURA) 240"
                                  : embarque.tipo_servicio_id ===
                                    "exportacion-cargada-plataforma-240"
                                  ? "EXP. CARGADA - PLATAFORMA 240"
                                  : embarque.tipo_servicio_id ===
                                    "importacion-cargada-caja-seca-240"
                                  ? "IMP. CARGADA - CAJA SECA 240"
                                  : embarque.tipo_servicio_id ===
                                    "importacion-cargada-plataforma-240"
                                  ? "IMP. CARGADA - PLATAFORMA 240"
                                  : embarque.tipo_servicio_id ===
                                    "importacion-vacia-caja-seca-thermo-240"
                                  ? "IMP. VACÍA - CAJA SECA/THERMO 240"
                                  : embarque.tipo_servicio_id ===
                                    "importacion-cargada-plataforma-amarre-240"
                                  ? "IMP. CARGADA - PLATAFORMA CON AMARRE 240"
                                  : embarque.tipo_servicio_id ===
                                    "importacion-en-tractor-240"
                                  ? "IMP. - EN TRACTOR 240"
                                  : embarque.tipo_servicio_id ===
                                    "exportacion-cargada-caja-seca-800"
                                  ? "EXP. CARGADA - CAJA SECA 800"
                                  : embarque.tipo_servicio_id ===
                                    "exportacion-vacia-caja-seca-800"
                                  ? "EXP. VACÍA - CAJA SECA 800"
                                  : embarque.tipo_servicio_id ===
                                    "exportacion-en-tractor-800"
                                  ? "EXP. - EN TRACTOR 800"
                                  : embarque.tipo_servicio_id ===
                                    "exportacion-cargada-plataforma-800"
                                  ? "EXP. CARGADA - PLATAFORMA 800"
                                  : embarque.tipo_servicio_id ===
                                    "importacion-cargada-caja-seca-800"
                                  ? "IMP. CARGADA - CAJA SECA 800"
                                  : embarque.tipo_servicio_id ===
                                    "importacion-vacia-plataforma-800"
                                  ? "IMP. VACÍA - PLATAFORMA 800"
                                  : embarque.tipo_servicio_id === "pagos-extras"
                                  ? "PAGOS EXTRAS"
                                  : embarque.tipo_servicio_id ===
                                    "horas-rojo-amarillo"
                                  ? "HORAS ROJO/AMARILLO"
                                  : embarque.tipo_servicio_id ===
                                    "cargas-descargas"
                                  ? "CARGAS/DESCARGAS"
                                  : embarque.tipo_servicio_id ===
                                    "movimientos-en-falso"
                                  ? "MOVIMIENTOS EN FALSO"
                                  : embarque.tipo_servicio_id ===
                                    "movimientos-locales"
                                  ? "MOVIMIENTOS LOCALES"
                                  : embarque.tipo_servicio_id === "otro"
                                  ? "OTRO"
                                  : embarque.tipo_servicio_id
                                : "No especificado"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEmbarqueDetalle(embarque);
                                  setShowDetailsModal(true);
                                  cargarFotosEmbarque(embarque.id);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalles
                              </Button>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                onClick={async () => {
                                  const confirmacion = confirm(
                                    `¿Estás seguro de que deseas restaurar el embarque ${embarque.folio} a la pantalla de asignación?`
                                  );
                                  if (confirmacion) {
                                    setSaving(true);
                                    try {
                                      const { error } = await supabase
                                        .from("embarques")
                                        .update({
                                          estado: "listo-para-asignar",
                                          updated_at: new Date().toISOString(),
                                          fecha_finalizacion: null, // Clear finalization date
                                        })
                                        .eq("id", embarque.id);

                                      if (error) {
                                        console.error(
                                          "Error restaurando embarque:",
                                          error
                                        );
                                        alert(
                                          "Error al restaurar embarque: " +
                                            error.message
                                        );
                                      } else {
                                        alert(
                                          `Embarque ${embarque.folio} restaurado exitosamente.`
                                        );
                                        await cargarEmbarquesFinalizados(); // Recargar la lista de finalizados
                                        await cargarDatos(); // Recargar la lista principal
                                      }
                                    } catch (err) {
                                      console.error(
                                        "Error general al restaurar:",
                                        err
                                      );
                                      alert(
                                        "Error general al restaurar embarque."
                                      );
                                    } finally {
                                      setSaving(false);
                                    }
                                  }
                                }}
                                disabled={saving}
                              >
                                {saving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-1"></div>
                                    Restaurando...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 12v-1m0 0l2.163 2.163a.75.75 0 001.06-.003L9.5 11.5m-4.5 0l2.163-2.163a.75.75 0 011.06.003L12 12.5m-4.5 0l2.163 2.163a.75.75 0 001.06-.003L15 15.5m-4.5 0l2.163-2.163a.75.75 0 001.06-.003L18 18.5m-4.5 0l2.163-2.163a.75.75 0 001.06-.003L21 21.5"
                                      />
                                    </svg>
                                    Restaurar
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor de Imagen a pantalla completa */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Vista ampliada"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <Button
              onClick={() => setSelectedImage(null)}
              variant="secondary"
              size="icon"
              className="absolute -top-5 -right-5 rounded-full h-10 w-10 z-10 shadow-lg"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
