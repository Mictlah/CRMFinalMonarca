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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Gauge,
  Calendar,
  Shield,
  AlertTriangle,
  Eye,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, type Camion, type MarcaCamion } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

// Definir una interfaz para la estructura de los comentarios
interface Comentario {
  id: string;
  text: string;
  date: string;
}

// Definir interfaz para números adicionales
interface NumeroAdicional {
  nombre: string;
  numero: string;
  fecha_vencimiento: string;
}

// Definir la estructura inicial del formulario
const initialFormData = {
  numero_economico: "",
  marca: "",
  modelo: "",
  año: "",
  numero_serie: "",
  placas: "",
  kilometraje: "",
  estado: "disponible",
  ultima_verificacion: "",
  frecuencia_verificacion: "",
  poliza_seguro_mexicano: "",
  fecha_vencimiento_seguro_mexicano: "",
  poliza_seguro_americano: "",
  fecha_vencimiento_seguro_americano: "",
  comentarios: "",
  tag_americano: "",
  tag_mexicano: "",
  numero_base: "",
  numeros_adicionales: [] as NumeroAdicional[],
};

export default function CamionesPage() {
  // Main state variables
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCamion, setEditingCamion] = useState<Camion | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [tieneRegistrosKilometraje, setTieneRegistrosKilometraje] =
    useState(false);
  const [registrosKilometrajeTableExists, setRegistrosKilometrajeTableExists] =
    useState(true);
  const [
    registrosMantenimientoTableExists,
    setRegistrosMantenimientoTableExists,
  ] = useState(true);
  const [marcas, setMarcas] = useState<MarcaCamion[]>([]);
  const [marcasTableExists, setMarcasTableExists] = useState(true);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMarca, setEditingMarca] = useState(false);
  const [marcaFormData, setMarcaFormData] = useState({ nombre: "" });
  const marcasDefault = [
    "Kenworth",
    "Freightliner",
    "Volvo",
    "International",
    "Peterbilt",
  ];
  const [showMarcasForm, setShowMarcasForm] = useState(false);
  const [activeTab, setActiveTab] = useState("basica");
  const [loading, setLoading] = useState(false);
  const [selectedCamionKilometraje, setSelectedCamionKilometraje] =
    useState<Camion | null>(null);
  const [kilometrajeFormData, setKilometrajeFormData] = useState({
    kilometraje_actual: "",
    tramo_recorrido: "",
    fecha_viaje: "",
    comentarios_viaje: "",
  });
  const [historialKilometraje, setHistorialKilometraje] = useState<any[]>([]);
  // Paginación historial kilometraje
  const [currentPageKilometraje, setCurrentPageKilometraje] = useState<number>(1);
  // Paginación para historial de mantenimiento (nuevo diseño de tabla)
  const [currentPageMantenimiento, setCurrentPageMantenimiento] = useState<number>(1);
  const [pageSizeMantenimiento, setPageSizeMantenimiento] = useState<number>(5);
  // Paginación y orden para comentarios
  const [currentPageComentarios, setCurrentPageComentarios] = useState<number>(1);
  const [pageSizeComentarios, setPageSizeComentarios] = useState<number>(3);
  const [sortOrderComentarios, setSortOrderComentarios] = useState<'desc' | 'asc'>('desc');
  const [pageSizeKilometraje, setPageSizeKilometraje] = useState<number>(5);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialMantenimiento, setHistorialMantenimiento] = useState<any[]>(
    []
  );
  const [showKilometrajeForm, setShowKilometrajeForm] = useState(false);
  const [showMantenimientoForm, setShowMantenimientoForm] = useState(false);
  const [selectedCamionMantenimiento, setSelectedCamionMantenimiento] =
    useState<Camion | null>(null);
  const [mantenimientoFormData, setMantenimientoFormData] = useState({
    fecha_mantenimiento: "",
    detalles_mantenimiento: "",
    proximo_mantenimiento: "",
    tipo_mantenimiento: "",
  });
  const [camionDetalle, setCamionDetalle] = useState<Camion | null>(null);
  const [showDetallesCamion, setShowDetallesCamion] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<any>(null);
  const [editRegistroFormData, setEditRegistroFormData] = useState({
    kilometraje_agregado: "",
    tramo_recorrido: "",
    fecha_viaje: "",
    comentarios_viaje: "",
  });
  const [showEditRegistroForm, setShowEditRegistroForm] = useState(false);
  const [editingRegistroMantenimiento, setEditingRegistroMantenimiento] =
    useState<any>(null);
  const [editMantenimientoFormData, setEditMantenimientoFormData] = useState({
    fecha_mantenimiento: "",
    tipo_mantenimiento: "",
    detalles_mantenimiento: "",
    proximo_mantenimiento: "",
  });
  const [showEditMantenimientoForm, setShowEditMantenimientoForm] =
    useState(false);
  const [loadingHistorialMantenimiento, setLoadingHistorialMantenimiento] =
    useState(false);
  const [recordsPerPageKilometraje, setRecordsPerPageKilometraje] =
    useState(10);

  // Estados para la gestión de comentarios
  const [newCommentText, setNewCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    cargarCamiones();
    cargarMarcas();
    verificarTablaRegistrosKilometraje();
    verificarTablaRegistrosMantenimiento();
  }, []);

  // Función para cargar marcas desde la base de datos
  const cargarMarcas = async () => {
    try {
      setLoadingMarcas(true);
      const { data, error } = await supabase
        .from("marcas_camiones")
        .select("*")
        .eq("activa", true)
        .order("nombre");

      if (error) {
        if (
          error.message.includes("does not exist") ||
          error.code === "42P01"
        ) {
          console.log("Tabla marcas_camiones no existe");
          setMarcasTableExists(false);
        } else {
          console.error("Error cargando marcas:", error);
          setMarcasTableExists(false);
        }
        setMarcas([]);
      } else {
        setMarcasTableExists(true);
        setMarcas(data || []);
      }
    } catch (error) {
      console.error("Error en cargarMarcas:", error);
      setMarcasTableExists(false);
      setMarcas([]);
    } finally {
      setLoadingMarcas(false);
    }
  };

  // Consulta a Supabase para cargar camiones
  const cargarCamiones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("camiones")
        .select("*")
        .order("numero_economico");
      if (error) {
        console.error("Error cargando camiones:", error);
        setCamiones([]);
      } else {
        setCamiones(data || []);
      }
    } catch (error) {
      console.error("Error inesperado cargando camiones:", error);
      setCamiones([]);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar formulario de camión
  const limpiarFormulario = () => {
    setFormData({ ...initialFormData });
    setEditingCamion(null);
    setActiveTab("basica");
  };

  // Poblar formulario al editar un camión existente
  const poblarFormularioParaEdicion = (camion: Camion) => {
    let datosAdicionales: any = {};
    if (camion.observaciones) {
      try {
        datosAdicionales = JSON.parse(camion.observaciones);
      } catch (error) {
        console.error("Error parsing observaciones:", error);
      }
    }

    setFormData({
      numero_economico: camion.numero_economico || "",
      marca: camion.marca || "",
      modelo: camion.modelo || "",
      año: camion.año?.toString() || "",
      numero_serie: datosAdicionales.numero_serie || "",
      placas: camion.placas || "",
      kilometraje: camion.kilometraje?.toString() || "",
      estado: camion.estado || "disponible",
      ultima_verificacion: datosAdicionales.ultima_verificacion || "",
      frecuencia_verificacion: datosAdicionales.frecuencia_verificacion || "",
      poliza_seguro_mexicano: datosAdicionales.poliza_seguro_mexicano || "",
      fecha_vencimiento_seguro_mexicano:
        datosAdicionales.fecha_vencimiento_seguro_mexicano || "",
      poliza_seguro_americano: datosAdicionales.poliza_seguro_americano || "",
      fecha_vencimiento_seguro_americano:
        datosAdicionales.fecha_vencimiento_seguro_americano || "",
      comentarios: datosAdicionales.comentarios || "",
      tag_americano: datosAdicionales.tag_americano || "",
      tag_mexicano: datosAdicionales.tag_mexicano || "",
      numero_base: datosAdicionales.numero_base || "",
      numeros_adicionales: Array.isArray(datosAdicionales.numeros_adicionales)
        ? datosAdicionales.numeros_adicionales.map((item: any) => ({
            nombre: item.nombre || "",
            numero: item.numero || "",
            fecha_vencimiento: item.fecha_vencimiento || "",
          }))
        : [],
    });
    setEditingCamion(camion);
    setShowForm(true);
  };

  // Función para guardar camión
  const guardarCamion = async () => {
    setSaving(true);

    try {
      // Validaciones básicas
      if (!formData.numero_economico || !formData.marca || !formData.modelo) {
        alert(
          "Por favor completa los campos obligatorios: Número Económico, Marca y Modelo"
        );
        setSaving(false);
        return;
      }

      // Verificar duplicados de número económico
      const { data: existingCamion } = await supabase
        .from("camiones")
        .select("id")
        .eq("numero_economico", formData.numero_economico)
        .neq("id", editingCamion?.id || "");

      if (existingCamion && existingCamion.length > 0) {
        alert("Ya existe un camión con este número económico");
        setSaving(false);
        return;
      }

      // Preparar datos adicionales para JSON
      const datosAdicionales = {
        numero_serie: formData.numero_serie || null,
        poliza_seguro_mexicano: formData.poliza_seguro_mexicano || null,
        fecha_vencimiento_seguro_mexicano:
          formData.fecha_vencimiento_seguro_mexicano || null,
        poliza_seguro_americano: formData.poliza_seguro_americano || null,
        fecha_vencimiento_seguro_americano:
          formData.fecha_vencimiento_seguro_americano || null,
        ultima_verificacion: formData.ultima_verificacion || null,
        frecuencia_verificacion: formData.frecuencia_verificacion || null,
        tag_americano: formData.tag_americano || null,
        tag_mexicano: formData.tag_mexicano || null,
        numero_base: formData.numero_base || null,
        numeros_adicionales: formData.numeros_adicionales.filter(
          (item) => item.nombre && item.numero
        ),
        comentarios: formData.comentarios || null,
      };

      // Datos principales del camión - usar valores exactos que coincidan con la base de datos
      const kilometrajeValue = editingCamion
        ? editingCamion.kilometraje // No permitir modificar el kilometraje inicial al editar
        : Number.parseInt(formData.kilometraje) || 0;

      const camionData = {
        numero_economico: formData.numero_economico,
        marca: formData.marca,
        modelo: formData.modelo,
        año: formData.año ? Number.parseInt(formData.año) : null,
        placas: formData.placas || null,
        kilometraje: kilometrajeValue,
        estado: formData.estado, // Usar el valor exacto del formulario
        observaciones: JSON.stringify(datosAdicionales),
        updated_at: new Date().toISOString(),
      };

      if (editingCamion) {
        // Actualizar camión existente
        const { error } = await supabase
          .from("camiones")
          .update(camionData)
          .eq("id", editingCamion.id);

        if (error) {
          console.error("Error actualizando camión:", error);
          alert(`Error al actualizar el camión: ${error.message}`);
          setSaving(false);
          return;
        }

        alert("Camión actualizado exitosamente");

        // Actualizar estados locales inmediatamente para reflejar cambios en el modal abierto
        setCamiones(prev => prev.map(c => c.id === editingCamion.id ? { ...c, ...camionData } as any : c));
        setCamionDetalle(prev => {
          if (prev && prev.id === editingCamion.id) {
            return { ...prev, ...camionData } as any;
          }
          return prev;
        });
      } else {
        // Crear nuevo camión
        const newCamionData = {
          ...camionData,
          fecha_registro: new Date().toISOString(),
        };

        const { error } = await supabase.from("camiones").insert(newCamionData);

        if (error) {
          console.error("Error creando camión:", error, JSON.stringify(error, null, 2));
          alert(`Error al crear el camión: ${error.message || 'Error desconocido'}`);
          setSaving(false);
          return;
        }

        alert("Camión creado exitosamente");

  // Añadir a la lista local inmediatamente (la recarga posterior garantizará consistencia)
  setCamiones(prev => [...prev, { ...newCamionData } as any]);
      }

      await cargarCamiones();
  setShowForm(false);
  // Restaurar pestaña del modal de detalles si estaba abierto
  setActiveTab("informacion");
  limpiarFormulario();
    } catch (error) {
      console.error("Error guardando camión:", error);
      alert("Error inesperado al guardar el camión");
    } finally {
      setSaving(false);
    }
  };

  // Funciones para gestión de marcas
  const limpiarFormularioMarca = () => {
    setMarcaFormData({ nombre: "" });
    setEditingMarca(false);
  };

  const guardarMarca = async () => {
    if (!marcaFormData.nombre.trim()) {
      alert("Por favor ingresa el nombre de la marca");
      return;
    }

    try {
      if (editingMarca) {
        // Actualizar marca existente
        const marcaAEditar = marcas.find(
          (m) => m.nombre === marcaFormData.nombre
        );
        if (marcaAEditar) {
          const { error } = await supabase
            .from("marcas_camiones")
            .update({
              nombre: marcaFormData.nombre.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", marcaAEditar.id);

          if (error) {
            alert("Error al actualizar la marca");
            return;
          }
          alert("Marca actualizada exitosamente");
        }
      } else {
        // Crear nueva marca
        const { error } = await supabase.from("marcas_camiones").insert({
          nombre: marcaFormData.nombre.trim(),
          activa: true,
        });

        if (error) {
          if (error.code === "23505") {
            alert("Ya existe una marca con este nombre");
          } else {
            alert("Error al crear la marca");
          }
          return;
        }
        alert("Marca creada exitosamente");
      }

      await cargarMarcas();
      limpiarFormularioMarca();
    } catch (error) {
      console.error("Error guardando marca:", error);
      alert("Error inesperado al guardar la marca");
    }
  };

  const editarMarca = (marca: MarcaCamion) => {
    setEditingMarca(true);
    setMarcaFormData({ nombre: marca.nombre });
  };

  const eliminarMarca = async (id: string) => {
    try {
      const { error } = await supabase
        .from("marcas_camiones")
        .update({ activa: false })
        .eq("id", id);

      if (error) {
        alert("Error al eliminar la marca");
        return;
      }

      alert("Marca eliminada exitosamente");
      await cargarMarcas();
    } catch (error) {
      console.error("Error eliminando marca:", error);
      alert("Error inesperado al eliminar la marca");
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !camionDetalle) return;

    const newComment: Comentario = {
      id: uuidv4(),
      text: newCommentText.trim(),
      date: new Date().toISOString(),
    };

    let currentObservaciones: any = {};
    try {
      currentObservaciones = camionDetalle.observaciones
        ? JSON.parse(camionDetalle.observaciones)
        : {};
    } catch (e) {
      console.error("Error parsing observaciones:", e);
    }

    const updatedComments = [
      ...(currentObservaciones.historial_comentarios || []),
      newComment,
    ];
    const updatedObservaciones = {
      ...currentObservaciones,
      historial_comentarios: updatedComments,
    };

    try {
      const { error } = await supabase
        .from("camiones")
        .update({
          observaciones: JSON.stringify(updatedObservaciones),
          updated_at: new Date().toISOString(),
        })
        .eq("id", camionDetalle.id);

      if (error) {
        console.error("Error adding comment:", error);
        alert("Error al agregar comentario.");
      } else {
        setCamionDetalle((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            observaciones: JSON.stringify(updatedObservaciones),
          };
        });
        setNewCommentText("");
      }
    } catch (error) {
      console.error("Error saving comment:", error);
      alert("Error inesperado al guardar comentario.");
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editedCommentText.trim() || !camionDetalle) return;

    let currentObservaciones: any = {};
    try {
      currentObservaciones = camionDetalle.observaciones
        ? JSON.parse(camionDetalle.observaciones)
        : {};
    } catch (e) {
      console.error("Error parsing observaciones:", e);
    }

    const updatedComments = (
      currentObservaciones.historial_comentarios || []
    ).map((comment: Comentario) =>
      comment.id === commentId
        ? { ...comment, text: editedCommentText.trim() }
        : comment
    );

    const updatedObservaciones = {
      ...currentObservaciones,
      historial_comentarios: updatedComments,
    };

    try {
      const { error } = await supabase
        .from("camiones")
        .update({
          observaciones: JSON.stringify(updatedObservaciones),
          updated_at: new Date().toISOString(),
        })
        .eq("id", camionDetalle.id);

      if (error) {
        console.error("Error editing comment:", error);
        alert("Error al editar comentario.");
      } else {
        setCamionDetalle((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            observaciones: JSON.stringify(updatedObservaciones),
          };
        });
        setEditingCommentId(null);
        setEditedCommentText("");
        alert("Comentario editado exitosamente.");
      }
    } catch (error) {
      console.error("Error saving edited comment:", error);
      alert("Error inesperado al guardar comentario editado.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (
      !camionDetalle ||
      !confirm("¿Estás seguro de eliminar este comentario?")
    )
      return;

    let currentObservaciones: any = {};
    try {
      currentObservaciones = camionDetalle.observaciones
        ? JSON.parse(camionDetalle.observaciones)
        : {};
    } catch (e) {
      console.error("Error parsing observaciones:", e);
    }

    const updatedComments = (
      currentObservaciones.historial_comentarios || []
    ).filter((comment: Comentario) => comment.id !== commentId);

    const updatedObservaciones = {
      ...currentObservaciones,
      historial_comentarios: updatedComments,
    };

    try {
      const { error } = await supabase
        .from("camiones")
        .update({
          observaciones: JSON.stringify(updatedObservaciones),
          updated_at: new Date().toISOString(),
        })
        .eq("id", camionDetalle.id);

      if (error) {
        console.error("Error deleting comment:", error);
        alert("Error al eliminar comentario.");
      } else {
        setCamionDetalle((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            observaciones: JSON.stringify(updatedObservaciones),
          };
        });
        alert("Comentario eliminado exitosamente.");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Error inesperado al eliminar comentario.");
    }
  };

  const eliminarCamion = async (id: string) => {
    try {
      // Obtener información del camión
      const camion = camiones.find((c) => c.id === id);
      if (!camion) {
        alert("Camión no encontrado");
        return;
      }

      // 1. Verificar si el camión está asociado a cualquier embarque (cualquier estado)
      const { data: embarquesAsociados, error: errorEmbarques } = await supabase
        .from("embarques")
        .select("id, folio, estado")
        .eq("camion_id", id);

      if (errorEmbarques) {
        console.error("Error verificando embarques:", errorEmbarques);
        alert("Error al verificar si el camión está en uso");
        return;
      }

      if (embarquesAsociados && embarquesAsociados.length > 0) {
        const folios = embarquesAsociados
          .slice(0, 5)
          .map((e) => e.folio)
          .join(", ");
        alert(
          `❌ NO SE PUEDE ELIMINAR\n\nEl camión ${camion.numero_economico} tiene ${
            embarquesAsociados.length
          } embarque(s) asociado(s):\n${folios}${
            embarquesAsociados.length > 5 ? "..." : ""
          }\n\n🔄 ACCIÓN REQUERIDA:\nNo se puede eliminar una unidad que ha sido utilizada en embarques. Crea un nuevo camión y deja este como histórico.`
        );
        return;
      }

      // 2. Limpiar dependencias opcionales para evitar restricciones de FK
      try {
        if (registrosKilometrajeTableExists) {
          await supabase.from("registros_kilometraje").delete().eq("camion_id", id);
        }
      } catch (e) {
        console.warn("No se pudo limpiar registros_kilometraje (posible tabla inexistente)");
      }

      try {
        if (registrosMantenimientoTableExists) {
          await supabase
            .from("registros_mantenimiento")
            .delete()
            .eq("camion_id", id);
        }
      } catch (e) {
        console.warn(
          "No se pudo limpiar registros_mantenimiento (posible tabla inexistente)"
        );
      }

      try {
        // Eliminar recordatorios vinculados a este camión
        await supabase.from("recordatorios").delete().eq("camion_id", id);
      } catch (e) {
        console.warn("No se pudieron eliminar recordatorios asociados al camión");
      }

      // 3. Eliminar el camión
      const { error } = await supabase.from("camiones").delete().eq("id", id);

      if (error) {
        console.error("Error eliminando camión:", error?.message || error);
        alert("Error al eliminar el camión");
        return;
      }

      alert("Camión eliminado exitosamente");
      await cargarCamiones(); // Recargar la lista
    } catch (error) {
      console.error(
        "Error en eliminación:",
        error instanceof Error ? error.message : error
      );
      alert("Error inesperado al eliminar el camión");
    }
  };

  const cambiarEstadoFueraServicio = async (id: string) => {
    try {
      const camion = camiones.find((c) => c.id === id);
      if (!camion) return;

      const nuevoEstado =
        camion.estado === "fuera-de-servicio"
          ? "disponible"
          : "fuera-de-servicio";

      const { error } = await supabase
        .from("camiones")
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error cambiando estado:", error);
        alert("Error al cambiar estado del camión");
        return;
      }

      alert(
        `Camión ${camion.numero_economico} ${
          nuevoEstado === "fuera-de-servicio"
            ? "marcado como fuera de servicio"
            : "reactivado"
        }`
      );
      await cargarCamiones(); // Recargar la lista
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cambiar estado del camión");
    }
  };

  const camionesFiltrados = camiones.filter(
    (camion) =>
      camion.numero_economico
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (camion.marca &&
        camion.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (camion.modelo &&
        camion.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (camion.placas &&
        camion.placas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginación para la lista de camiones
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // 12 cards por página

  const totalItems = camionesFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const camionesPaginados = camionesFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    // Reiniciar a la primera página cuando cambie la búsqueda
    setPage(1);
  }, [searchTerm]);

  const getEstadoBadge = (estado: string) => {
    const estados = {
      disponible: { color: "bg-green-100 text-green-800", label: "Disponible" },
      "en-uso": { color: "bg-blue-100 text-blue-800", label: "En Uso" },
      mantenimiento: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Mantenimiento",
      },
      "fuera-de-servicio": {
        color: "bg-red-100 text-red-800",
        label: "Fuera de Servicio",
      },
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

  const verificarVencimientos = (camion: Camion) => {
    const alertas = [];

    if (camion.observaciones) {
      try {
        const datos = JSON.parse(camion.observaciones);

        // Verificar seguro mexicano
        if (datos.fecha_vencimiento_seguro_mexicano) {
          const fechaVencimiento = new Date(
            datos.fecha_vencimiento_seguro_mexicano
          );
          const hoy = new Date();
          const diasRestantes = Math.ceil(
            (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diasRestantes <= 30) {
            alertas.push({
              tipo: "seguro_mexicano",
              dias: Math.abs(diasRestantes),
              vencido: diasRestantes <= 0,
              fecha: fechaVencimiento.toLocaleDateString(),
              mensaje:
                diasRestantes <= 0
                  ? `Seguro Mexicano vencido hace ${Math.abs(
                      diasRestantes
                    )} días`
                  : `Seguro Mexicano vence en ${diasRestantes} días`,
            });
          }
        }

        // Verificar seguro americano
        if (datos.fecha_vencimiento_seguro_americano) {
          const fechaVencimiento = new Date(
            datos.fecha_vencimiento_seguro_americano
          );
          const hoy = new Date();
          const diasRestantes = Math.ceil(
            (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diasRestantes <= 30) {
            alertas.push({
              tipo: "seguro_americano",
              dias: Math.abs(diasRestantes),
              vencido: diasRestantes <= 0,
              fecha: fechaVencimiento.toLocaleDateString(),
              mensaje:
                diasRestantes <= 0
                  ? `Seguro Americano vencido hace ${Math.abs(
                      diasRestantes
                    )} días`
                  : `Seguro Americano vence en ${diasRestantes} días`,
            });
          }
        }

        // Verificar verificación
        if (datos.frecuencia_verificacion) {
          const proximaVerificacion = new Date(datos.frecuencia_verificacion);
          const hoy = new Date();
          const diasRestantes = Math.ceil(
            (proximaVerificacion.getTime() - hoy.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (diasRestantes <= 15) {
            alertas.push({
              tipo: "verificacion",
              dias: Math.abs(diasRestantes),
              vencido: diasRestantes <= 0,
              fecha: proximaVerificacion.toLocaleDateString(),
              mensaje:
                diasRestantes <= 0
                  ? `Verificación vencida hace ${Math.abs(diasRestantes)} días`
                  : `Verificación en ${Math.abs(diasRestantes)} días`,
            });
          }
        }
      } catch (error) {
        // Ignorar errores de parsing
      }
    }

    return alertas;
  };

  const descargarExcel = async () => {
    if (camiones.length === 0) {
      alert("No hay camiones para descargar");
      return;
    }

    const headers = [
      "Número Económico",
      "Marca",
      "Modelo",
      "Año",
      "Placas",
      "Kilometraje",
      "Estado",
      "Número de Serie",
      "TAG Mexicano",
      "TAG Americano",
      "Número Base",
      "Póliza Mexicana",
  "Póliza Americana",
  "Vencimiento Seguro Mexicano",
  "Vencimiento Seguro Americano",
  "Último Mantenimiento"
    ];

    // Helper para escapar y forzar texto (prefijo tab) evitando interpretación numérica en Excel
    const esc = (v: any) => `"\t${(v ?? "").toString().replace(/"/g, '""')}"`;

    // Consultar última fecha de mantenimiento real por camión
    const ultimaFechaMantenimientoPorCamion: Record<string, string> = {};
    try {
      if (registrosMantenimientoTableExists) {
        const camionIds = camiones.map(c => c.id);
        if (camionIds.length > 0) {
          const { data: registros, error } = await supabase
            .from('registros_mantenimiento')
            .select('camion_id, fecha_mantenimiento')
            .in('camion_id', camionIds)
            .order('fecha_mantenimiento', { ascending: false });
          if (!error && registros) {
            for (const reg of registros) {
              if (!ultimaFechaMantenimientoPorCamion[reg.camion_id]) {
                // Formatear fecha (YYYY-MM-DD o local)
                const f = reg.fecha_mantenimiento;
                ultimaFechaMantenimientoPorCamion[reg.camion_id] = f || '';
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error consultando últimas fechas mantenimiento:', e);
    }

    const csvContent = [
      headers.join(","),
      ...camiones.map((camion) => {
        let datos: any = {};
        if (camion.observaciones) {
          try {
            datos = JSON.parse(camion.observaciones);
          } catch {
            datos = {};
          }
        }
        const vencimientoMex = datos.fecha_vencimiento_seguro_mexicano || "";
        const vencimientoUs = datos.fecha_vencimiento_seguro_americano || "";
  const ultimaMantRaw = ultimaFechaMantenimientoPorCamion[camion.id] || "";
  const ultimaMant = ultimaMantRaw ? new Date(ultimaMantRaw).toISOString().split('T')[0] : "";
        return [
          esc(camion.numero_economico),
          esc(camion.marca || ""),
          esc(camion.modelo || ""),
          esc(camion.año || ""),
          esc(camion.placas || ""),
          esc(camion.kilometraje),
          esc(camion.estado),
          esc(datos.numero_serie || ""),
          esc(datos.tag_mexicano || ""),
          esc(datos.tag_americano || ""),
          esc(datos.numero_base || ""),
          esc(datos.poliza_seguro_mexicano || ""),
          esc(datos.poliza_seguro_americano || ""),
          esc(vencimientoMex),
          esc(vencimientoUs),
          esc(ultimaMant),
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `camiones_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtener marcas disponibles (de la BD o por defecto)
  const getMarcasDisponibles = () => {
    if (marcasTableExists && marcas.length > 0) {
      return marcas.map((marca) => marca.nombre);
    }
    return marcasDefault;
  };

  const limpiarFormularioKilometraje = () => {
    setKilometrajeFormData({
      kilometraje_actual: "",
      tramo_recorrido: "",
      fecha_viaje: "",
      comentarios_viaje: "",
    });
    setSelectedCamionKilometraje(null);
  };

  const verificarTablaRegistrosKilometraje = async () => {
    try {
      const { data, error } = await supabase
        .from("registros_kilometraje")
        .select("id")
        .limit(1);

      if (error) {
        if (
          error.message.includes("does not exist") ||
          error.code === "42P01"
        ) {
          console.log("Tabla registros_kilometraje no existe");
          setRegistrosKilometrajeTableExists(false);
        } else {
          console.error(
            "Error verificando tabla registros_kilometraje:",
            error
          );
          setRegistrosKilometrajeTableExists(false);
        }
      } else {
        setRegistrosKilometrajeTableExists(true);
      }
    } catch (error) {
      console.error("Error en verificarTablaRegistrosKilometraje:", error);
      setRegistrosKilometrajeTableExists(false);
    }
  };

  const verificarTablaRegistrosMantenimiento = async () => {
    try {
      const { data, error } = await supabase
        .from("registros_mantenimiento")
        .select("id")
        .limit(1);

      if (error) {
        if (
          error.message.includes("does not exist") ||
          error.code === "42P01"
        ) {
          console.log("Tabla registros_mantenimiento no existe");
          setRegistrosMantenimientoTableExists(false);
        } else {
          console.error(
            "Error verificando tabla registros_mantenimiento:",
            error
          );
          setRegistrosMantenimientoTableExists(false);
        }
      } else {
        setRegistrosMantenimientoTableExists(true);
      }
    } catch (error) {
      console.error("Error en verificarTablaRegistrosMantenimiento:", error);
      setRegistrosMantenimientoTableExists(false);
    }
  };

  const guardarKilometraje = async () => {
    if (!registrosKilometrajeTableExists) {
      alert(
        "La tabla de registros de kilometraje no existe. Por favor ejecuta el script de migración de base de datos."
      );
      return;
    }

    if (
      !selectedCamionKilometraje ||
      !kilometrajeFormData.kilometraje_actual ||
      !kilometrajeFormData.tramo_recorrido ||
      !kilometrajeFormData.fecha_viaje
    ) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      const kilometrajeActual = Number.parseInt(
        kilometrajeFormData.kilometraje_actual
      );
      const kilometrajeAgregado =
        kilometrajeActual - selectedCamionKilometraje.kilometraje;

      if (kilometrajeAgregado <= 0) {
        alert(
          "El kilometraje actual debe ser mayor al kilometraje anterior del camión"
        );
        return;
      }

      // Actualizar el kilometraje del camión
      const { error: errorCamion } = await supabase
        .from("camiones")
        .update({
          kilometraje: kilometrajeActual,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCamionKilometraje.id);

      if (errorCamion) {
        console.error("Error actualizando kilometraje:", errorCamion);
        alert("Error al actualizar kilometraje del camión");
        return;
      }

      // Crear registro de viaje
      const registroViaje = {
        camion_id: selectedCamionKilometraje.id,
        kilometraje_anterior: selectedCamionKilometraje.kilometraje,
        kilometraje_agregado: kilometrajeAgregado,
        kilometraje_nuevo: kilometrajeActual,
        tramo_recorrido: kilometrajeFormData.tramo_recorrido,
        fecha_viaje: kilometrajeFormData.fecha_viaje,
        comentarios: kilometrajeFormData.comentarios_viaje,
        fecha_registro: new Date().toISOString(),
      };

      // Intentar guardar en tabla de registros de viaje
      const { error: errorViaje } = await supabase
        .from("registros_kilometraje")
        .insert(registroViaje);

      if (errorViaje) {
        console.log(
          "Tabla de registros de kilometraje no existe, solo se actualizó el camión"
        );
      }

      // Actualizar el camión seleccionado con el nuevo kilometraje
      setSelectedCamionKilometraje({
        ...selectedCamionKilometraje,
        kilometraje: kilometrajeActual,
      });
  // Reflejar inmediatamente en el detalle abierto
  setCamionDetalle(prev => prev && prev.id === selectedCamionKilometraje.id ? { ...prev, kilometraje: kilometrajeActual } : prev);

      // Limpiar solo los campos del formulario, mantener el camión seleccionado
      setKilometrajeFormData({
        kilometraje_actual: "",
        tramo_recorrido: "",
        fecha_viaje: new Date().toISOString().split("T")[0],
        comentarios_viaje: "",
      });

      await cargarCamiones();

      // Recargar historial si estamos en la ventana de detalles
      if (camionDetalle && camionDetalle.id === selectedCamionKilometraje.id) {
        await cargarHistorialKilometraje(selectedCamionKilometraje.id);
      }

  // Mensaje de éxito silencioso (se eliminó alert visible)
    } catch (error) {
      console.error("Error guardando kilometraje:", error);
      alert("Error al guardar kilometraje");
    }
  };

  const cargarHistorialKilometraje = async (camionId: string) => {
    try {
      setLoadingHistorial(true);
      const { data, error } = await supabase
        .from("registros_kilometraje")
        .select("*")
        .eq("camion_id", camionId)
        .order("fecha_registro", { ascending: false });

      if (error) {
        console.log("Tabla de registros de kilometraje no existe");
        setHistorialKilometraje([]);
      } else {
        setHistorialKilometraje(data || []);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
      setHistorialKilometraje([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Ajustar página actual si el número de páginas cambia tras recarga
  useEffect(() => {
    const totalPages = Math.ceil(historialKilometraje.length / pageSizeKilometraje) || 1;
    if (currentPageKilometraje > totalPages) {
      setCurrentPageKilometraje(totalPages);
    }
  }, [historialKilometraje, currentPageKilometraje, pageSizeKilometraje]);

  // Ajustar página mantenimiento si cambia el total
  useEffect(() => {
    const totalPages = Math.ceil(historialMantenimiento.length / pageSizeMantenimiento) || 1;
    if (currentPageMantenimiento > totalPages) {
      setCurrentPageMantenimiento(totalPages);
    }
  }, [historialMantenimiento, currentPageMantenimiento, pageSizeMantenimiento]);

  const cargarHistorialMantenimiento = async (camionId: string) => {
    try {
      setLoadingHistorialMantenimiento(true);
      const { data, error } = await supabase
        .from("registros_mantenimiento")
        .select("*")
        .eq("camion_id", camionId)
        .order("fecha_mantenimiento", { ascending: false });

      if (error) {
        console.log("Tabla de registros de mantenimiento no existe");
        setHistorialMantenimiento([]);
      } else {
        setHistorialMantenimiento(data || []);
      }
    } catch (error) {
      console.error("Error cargando historial de mantenimiento:", error);
      setHistorialMantenimiento([]);
    } finally {
      setLoadingHistorialMantenimiento(false);
    }
  };

  const eliminarRegistroKilometraje = async (
    registroId: string,
    camionId: string,
    kilometrajeEliminado: number
  ) => {
    try {
      const { error } = await supabase
        .from("registros_kilometraje")
        .delete()
        .eq("id", registroId);

      if (error) {
        alert("Error al eliminar registro");
        return;
      }

      // Recalcular la cadena completa de kilometrajes para evitar discrepancias si se borra un registro intermedio
      const { data: registrosRestantes, error: errorRegistros } = await supabase
        .from("registros_kilometraje")
        .select("id, kilometraje_anterior, kilometraje_agregado, kilometraje_nuevo")
        .eq("camion_id", camionId)
        .order("fecha_viaje", { ascending: true });

      let nuevoKilometraje = 0;
      if (!errorRegistros && registrosRestantes && registrosRestantes.length > 0) {
        // Base inicial (kilometraje antes del primer registro)
        const baseInicial = registrosRestantes[0].kilometraje_anterior || 0;
        let acumulado = baseInicial;
        const updates: any[] = [];
        for (const reg of registrosRestantes) {
          const esperadoAnterior = acumulado;
          acumulado += reg.kilometraje_agregado;
          const esperadoNuevo = acumulado;
          if (
            reg.kilometraje_anterior !== esperadoAnterior ||
            reg.kilometraje_nuevo !== esperadoNuevo
          ) {
            updates.push({
              id: reg.id,
              kilometraje_anterior: esperadoAnterior,
              kilometraje_nuevo: esperadoNuevo,
              updated_at: new Date().toISOString(),
            });
          }
        }
        nuevoKilometraje = acumulado;
        // Aplicar ajustes si hay diferencias
        for (const up of updates) {
          await supabase
            .from("registros_kilometraje")
            .update({
              kilometraje_anterior: up.kilometraje_anterior,
              kilometraje_nuevo: up.kilometraje_nuevo,
              updated_at: up.updated_at,
            })
            .eq("id", up.id);
        }
      } else {
        // Si no quedan registros, restar el eliminado del total actual (fallback)
        const camionActual = camiones.find((c) => c.id === camionId);
        if (camionActual) {
          nuevoKilometraje = Math.max(0, camionActual.kilometraje - kilometrajeEliminado);
        }
      }

      const updateResp = await supabase
        .from("camiones")
        .update({
          kilometraje: nuevoKilometraje,
          updated_at: new Date().toISOString(),
        })
        .eq("id", camionId);

      if (!updateResp.error) {
        // Actualizar lista local inmediatamente
        setCamiones(prev => prev.map(c => c.id === camionId ? { ...c, kilometraje: nuevoKilometraje } : c));
        // Actualizar detalle y seleccionados de forma segura
        setCamionDetalle(prev => prev && prev.id === camionId ? { ...prev, kilometraje: nuevoKilometraje } : prev);
        setSelectedCamionKilometraje(prev => prev && prev.id === camionId ? { ...prev, kilometraje: nuevoKilometraje } : prev);
      }

      await cargarHistorialKilometraje(camionId);
      // Sincronización posterior (no bloqueante) para asegurar consistencia con servidor
      cargarCamiones();
    } catch (error) {
      console.error("Error eliminando registro:", error);
      alert("Error al eliminar registro");
    }
  };

  const editarRegistroKilometraje = (registro: any) => {
    setEditingRegistro(registro);
    setEditRegistroFormData({
      kilometraje_agregado: registro.kilometraje_agregado?.toString() || "",
      tramo_recorrido: registro.tramo_recorrido || "",
      fecha_viaje: registro.fecha_viaje || "",
      comentarios_viaje: registro.comentarios || "",
    });
    setShowEditRegistroForm(true);
  };

  const guardarEdicionRegistro = async () => {
    if (
      !editingRegistro ||
      !editRegistroFormData.kilometraje_agregado ||
      !editRegistroFormData.tramo_recorrido ||
      !editRegistroFormData.fecha_viaje
    ) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      const nuevoKilometrajeAgregado = Number.parseInt(
        editRegistroFormData.kilometraje_agregado
      );
      const diferencia =
        nuevoKilometrajeAgregado - editingRegistro.kilometraje_agregado;

      // Actualizar el registro
      const { error } = await supabase
        .from("registros_kilometraje")
        .update({
          kilometraje_agregado: nuevoKilometrajeAgregado,
          kilometraje_nuevo:
            editingRegistro.kilometraje_anterior + nuevoKilometrajeAgregado,
          tramo_recorrido: editRegistroFormData.tramo_recorrido,
          fecha_viaje: editRegistroFormData.fecha_viaje,
          comentarios: editRegistroFormData.comentarios_viaje,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRegistro.id);

      if (error) {
        alert("Error al actualizar registro");
        return;
      }

      // Actualizar el kilometraje del camión
      if (camionDetalle && diferencia !== 0) {
        const nuevoKilometrajeTotal = camionDetalle.kilometraje + diferencia;

        await supabase
          .from("camiones")
          .update({
            kilometraje: Math.max(0, nuevoKilometrajeTotal),
            updated_at: new Date().toISOString(),
          })
          .eq("id", camionDetalle.id);
      }

      alert("Registro actualizado exitosamente");
      setShowEditRegistroForm(false);
      setEditingRegistro(null);
      await cargarCamiones();
      if (camionDetalle) {
        await cargarHistorialKilometraje(camionDetalle.id);
      }
    } catch (error) {
      console.error("Error actualizando registro:", error);
      alert("Error al actualizar registro");
    }
  };

  const cancelarEdicionRegistro = () => {
    setShowEditRegistroForm(false);
    setEditingRegistro(null);
    setEditRegistroFormData({
      kilometraje_agregado: "",
      tramo_recorrido: "",
      fecha_viaje: "",
      comentarios_viaje: "",
    });
  };

  const editarRegistroMantenimiento = (registro: any) => {
    setEditingRegistroMantenimiento(registro);
    setEditMantenimientoFormData({
      fecha_mantenimiento: registro.fecha_mantenimiento || "",
      tipo_mantenimiento: registro.tipo_mantenimiento || "",
      detalles_mantenimiento: registro.detalles_mantenimiento || "",
      proximo_mantenimiento: registro.proximo_mantenimiento || "",
    });
    setShowEditMantenimientoForm(true);
  };

  const guardarEdicionMantenimiento = async () => {
    if (
      !editingRegistroMantenimiento ||
      !editMantenimientoFormData.fecha_mantenimiento ||
      !editMantenimientoFormData.detalles_mantenimiento
    ) {
      alert("Por favor completa los campos obligatorios: fecha y detalles");
      return;
    }

    try {
      const { error } = await supabase
        .from("registros_mantenimiento")
        .update({
          fecha_mantenimiento: editMantenimientoFormData.fecha_mantenimiento,
          tipo_mantenimiento: editMantenimientoFormData.tipo_mantenimiento,
          detalles_mantenimiento:
            editMantenimientoFormData.detalles_mantenimiento,
          proximo_mantenimiento:
            editMantenimientoFormData.proximo_mantenimiento,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRegistroMantenimiento.id);

      if (error) {
        alert("Error al actualizar registro de mantenimiento");
        return;
      }

      alert("Registro de mantenimiento actualizado exitosamente");
      setShowEditMantenimientoForm(false);
      setEditingRegistroMantenimiento(null);
      if (camionDetalle) {
        await cargarHistorialMantenimiento(camionDetalle.id);
      }
    } catch (error) {
      console.error("Error actualizando registro de mantenimiento:", error);
      alert("Error al actualizar registro de mantenimiento");
    }
  };

  const cancelarEdicionMantenimiento = () => {
    setShowEditMantenimientoForm(false);
    setEditingRegistroMantenimiento(null);
    setEditMantenimientoFormData({
      fecha_mantenimiento: "",
      tipo_mantenimiento: "",
      detalles_mantenimiento: "",
      proximo_mantenimiento: "",
    });
  };

  const eliminarRegistroMantenimiento = async (registroId: string) => {
    try {
      const { error } = await supabase
        .from("registros_mantenimiento")
        .delete()
        .eq("id", registroId);

      if (error) {
        alert("Error al eliminar registro de mantenimiento");
        return;
      }

      alert("Registro de mantenimiento eliminado exitosamente");
      if (camionDetalle) {
        await cargarHistorialMantenimiento(camionDetalle.id);
      }
    } catch (error) {
      console.error("Error eliminando registro de mantenimiento:", error);
      alert("Error al eliminar registro de mantenimiento");
    }
  };

  const seleccionarCamionKilometraje = (camion: Camion) => {
    setSelectedCamionKilometraje(camion);
    setKilometrajeFormData({
      kilometraje_actual: "",
      tramo_recorrido: "",
      fecha_viaje: new Date().toISOString().split("T")[0],
      comentarios_viaje: "",
    });
  };

  const verDetallesCamion = (camion: Camion) => {
    setCamionDetalle(camion);
    setActiveTab("informacion"); // Establecer pestaña inicial para detalles
    setShowDetallesCamion(true);
    cargarHistorialKilometraje(camion.id);
    cargarHistorialMantenimiento(camion.id);
  };

  const limpiarFormularioMantenimiento = () => {
    setMantenimientoFormData({
      fecha_mantenimiento: "",
      detalles_mantenimiento: "",
      proximo_mantenimiento: "",
      tipo_mantenimiento: "",
    });
    setSelectedCamionMantenimiento(null);
  };

  const guardarMantenimiento = async () => {
    if (
      !selectedCamionMantenimiento ||
      !mantenimientoFormData.fecha_mantenimiento ||
      !mantenimientoFormData.detalles_mantenimiento
    ) {
      alert(
        "Por favor completa los campos obligatorios: fecha de mantenimiento y detalles"
      );
      return;
    }

    try {
      // Guardar registro de mantenimiento en la tabla si existe
      if (registrosMantenimientoTableExists) {
        const registroMantenimiento = {
          camion_id: selectedCamionMantenimiento.id,
          fecha_mantenimiento: mantenimientoFormData.fecha_mantenimiento,
          tipo_mantenimiento:
            mantenimientoFormData.tipo_mantenimiento || "general",
          detalles_mantenimiento: mantenimientoFormData.detalles_mantenimiento,
          proximo_mantenimiento:
            mantenimientoFormData.proximo_mantenimiento || null,
          kilometraje_actual: selectedCamionMantenimiento.kilometraje,
          fecha_registro: new Date().toISOString(),
        };

        const { error: errorMantenimiento } = await supabase
          .from("registros_mantenimiento")
          .insert(registroMantenimiento);

        if (errorMantenimiento) {
          console.error(
            "Error guardando registro de mantenimiento:",
            errorMantenimiento
          );
          alert("Error al guardar el registro de mantenimiento");
          return;
        }
      }

      alert("Mantenimiento registrado exitosamente.");
      limpiarFormularioMantenimiento();
      setShowMantenimientoForm(false);

      // Recargar historial de mantenimiento si estamos en la ventana de detalles
      if (
        camionDetalle &&
        camionDetalle.id === selectedCamionMantenimiento.id
      ) {
        await cargarHistorialMantenimiento(selectedCamionMantenimiento.id);
      }
    } catch (error) {
      console.error("Error guardando mantenimiento:", error);
      alert("Error al guardar el mantenimiento");
    }
  };

  const descargarExcelCamion = (camion: Camion) => {
    if (!camion) {
      alert("No hay información del camión para descargar");
      return;
    }

    // Preparar datos básicos del camión
    let datosAdicionales: any = {};
    if (camion.observaciones) {
      try {
        datosAdicionales = JSON.parse(camion.observaciones);
      } catch (error) {
        console.log("No se pudieron parsear datos adicionales");
      }
    }

    // Crear contenido CSV
    const csvContent = [];

    // Información básica del camión
    csvContent.push("INFORMACIÓN BÁSICA DEL CAMIÓN");
    csvContent.push("Campo,Valor");
    csvContent.push(`"Número Económico","${camion.numero_economico}"`);
    csvContent.push(`"Marca","${camion.marca || "No especificado"}"`);
    csvContent.push(`"Modelo","${camion.modelo || "No especificado"}"`);
    csvContent.push(`"Año","${camion.año || "No especificado"}"`);
    csvContent.push(`"Placas","${camion.placas || "No especificado"}"`);
    csvContent.push(
      `"Kilometraje Actual","${camion.kilometraje.toLocaleString()} km"`
    );
    csvContent.push(`"Estado","${camion.estado}"`);
    csvContent.push(
      `"Fecha de Registro","${new Date(
        camion.fecha_registro
      ).toLocaleDateString()}"`
    );

    // Crear y descargar archivo
    const blob = new Blob(["\ufeff" + csvContent.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `camion_${camion.numero_economico}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Forzar recompilación: control de estado de carga
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando camiones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Tractocamiones
            </h1>
            <p className="text-gray-600 mt-2">Administrar flota de camiones</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={descargarExcel}
              disabled={camiones.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Reporte
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowMarcasForm(true)}
              disabled={!marcasTableExists}
              title={
                !marcasTableExists
                  ? "Ejecuta el script de migración para habilitar esta función"
                  : ""
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Gestionar Marcas
            </Button>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => limpiarFormulario()}
                  className="bg-[#16A34A] hover:bg-[#12813a] text-white font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Camión
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCamion ? "Editar Camión" : "Nuevo Camión"}
                  </DialogTitle>
                  <DialogDescription>
                    Completa la información del camión
                  </DialogDescription>
                </DialogHeader>

                <div className="w-full">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab("basica")}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "basica"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Información Básica
                      </button>
                      <button
                        onClick={() => setActiveTab("documentos")}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "documentos"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Documentos y Verificaciones
                      </button>
                      <button
                        onClick={() => setActiveTab("tags")}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "tags"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Tags y Números
                      </button>
                      <button
                        onClick={() => setActiveTab("comentarios")}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === "comentarios"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Comentarios
                      </button>
                    </nav>
                  </div>

                  <div className="mt-6">
                    {activeTab === "basica" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="numero_economico">
                              Número Económico *
                            </Label>
                            <Input
                              id="numero_economico"
                              value={formData.numero_economico}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  numero_economico: e.target.value,
                                })
                              }
                              placeholder="Ej: CAM001"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="marca">Marca *</Label>
                            <Select
                              value={formData.marca}
                              onValueChange={(value) =>
                                setFormData({ ...formData, marca: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar marca" />
                              </SelectTrigger>
                              <SelectContent>
                                {getMarcasDisponibles().map((marca) => (
                                  <SelectItem key={marca} value={marca}>
                                    {marca}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="modelo">Modelo *</Label>
                            <Input
                              id="modelo"
                              value={formData.modelo}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  modelo: e.target.value,
                                })
                              }
                              placeholder="Ej: T680"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="año">Año</Label>
                            <Input
                              id="año"
                              type="number"
                              min="1990"
                              max="2030"
                              value={formData.año}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  año: e.target.value,
                                })
                              }
                              placeholder="Ej: 2020"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="numero_serie">
                              Número de Serie
                            </Label>
                            <Input
                              id="numero_serie"
                              value={formData.numero_serie}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  numero_serie: e.target.value,
                                })
                              }
                              placeholder="Número de serie del vehículo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="placas">Placas</Label>
                            <Input
                              id="placas"
                              value={formData.placas}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  placas: e.target.value,
                                })
                              }
                              placeholder="Ej: ABC-123-D"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="kilometraje">
                              Kilometraje Inicial {!editingCamion && "*"}
                              {editingCamion && (
                                <span className="text-red-600 text-xs ml-2">
                                  (No editable al editar)
                                </span>
                              )}
                            </Label>
                            <Input
                              id="kilometraje"
                              type="number"
                              min="0"
                              value={formData.kilometraje}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  kilometraje: e.target.value,
                                })
                              }
                              placeholder={
                                editingCamion
                                  ? "Kilometraje actual del camión"
                                  : "Kilometraje inicial del camión (opcional)"
                              }
                              disabled={Boolean(editingCamion)}
                              className={editingCamion ? "bg-gray-100 cursor-not-allowed" : ""}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select
                              value={formData.estado}
                              onValueChange={(value) =>
                                setFormData({ ...formData, estado: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activo">Activo</SelectItem>
                                <SelectItem value="disponible">Disponible</SelectItem>
                                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                                <SelectItem value="fuera-de-servicio">Fuera de Servicio</SelectItem>
                                <SelectItem value="vendido">Vendido</SelectItem>
                                <SelectItem value="siniestrado">Siniestrado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "documentos" && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900">
                            Verificación y Mantenimiento
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ultima_verificacion">
                                Última Verificación
                              </Label>
                              <Input
                                id="ultima_verificacion"
                                type="date"
                                value={formData.ultima_verificacion}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ultima_verificacion: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="proxima_verificacion">
                                Próxima Verificación
                              </Label>
                              <Input
                                id="proxima_verificacion"
                                type="date"
                                value={formData.frecuencia_verificacion}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    frecuencia_verificacion: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900">
                            Información del Seguro Mexicano
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="poliza_seguro_mexicano">
                                Póliza de Seguro Mexicano
                              </Label>
                              <Input
                                id="poliza_seguro_mexicano"
                                value={formData.poliza_seguro_mexicano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    poliza_seguro_mexicano: e.target.value,
                                  })
                                }
                                placeholder="Número de póliza mexicana"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fecha_vencimiento_seguro_mexicano">
                                Fecha de Vencimiento del Seguro Mexicano
                              </Label>
                              <Input
                                id="fecha_vencimiento_seguro_mexicano"
                                type="date"
                                value={
                                  formData.fecha_vencimiento_seguro_mexicano
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fecha_vencimiento_seguro_mexicano:
                                      e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900">
                            Información del Seguro Americano
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="poliza_seguro_americano">
                                Póliza de Seguro Americano
                              </Label>
                              <Input
                                id="poliza_seguro_americano"
                                value={formData.poliza_seguro_americano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    poliza_seguro_americano: e.target.value,
                                  })
                                }
                                placeholder="Número de póliza americana"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fecha_vencimiento_seguro_americano">
                                Fecha de Vencimiento del Seguro Americano
                              </Label>
                              <Input
                                id="fecha_vencimiento_seguro_americano"
                                type="date"
                                value={
                                  formData.fecha_vencimiento_seguro_americano
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fecha_vencimiento_seguro_americano:
                                      e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "tags" && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-900">
                            Tags y Números de Identificación
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tag_americano">
                                Número de Tag Americano
                              </Label>
                              <Input
                                id="tag_americano"
                                value={formData.tag_americano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    tag_americano: e.target.value,
                                  })
                                }
                                placeholder="Ej: USA123456"
                                maxLength={20}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tag_mexicano">
                                Número de Tag Mexicano
                              </Label>
                              <Input
                                id="tag_mexicano"
                                value={formData.tag_mexicano}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    tag_mexicano: e.target.value,
                                  })
                                }
                                placeholder="Ej: MEX789012"
                                maxLength={20}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="numero_base">
                                Número de Base
                              </Label>
                              <Input
                                id="numero_base"
                                value={formData.numero_base}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    numero_base: e.target.value,
                                  })
                                }
                                placeholder="Ej: BASE001"
                                maxLength={20}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium text-gray-900">
                              Números Adicionales con Vencimiento
                            </h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (formData.numeros_adicionales.length < 5) {
                                  setFormData({
                                    ...formData,
                                    numeros_adicionales: [
                                      ...formData.numeros_adicionales,
                                      {
                                        nombre: "",
                                        numero: "",
                                        fecha_vencimiento: "",
                                      },
                                    ],
                                  });
                                }
                              }}
                              disabled={
                                formData.numeros_adicionales.length >= 5
                              }
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Número (
                              {formData.numeros_adicionales.length}/5)
                            </Button>
                          </div>

                          {formData.numeros_adicionales.length > 0 && (
                            <div className="space-y-3">
                              {formData.numeros_adicionales.map(
                                (item, index) => (
                                  <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50"
                                  >
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`nombre_adicional_${index}`}
                                      >
                                        Nombre del Documento *
                                      </Label>
                                      <Input
                                        id={`nombre_adicional_${index}`}
                                        value={item.nombre}
                                        onChange={(e) => {
                                          const nuevosNumeros = [
                                            ...formData.numeros_adicionales,
                                          ];
                                          nuevosNumeros[index].nombre =
                                            e.target.value;
                                          setFormData({
                                            ...formData,
                                            numeros_adicionales: nuevosNumeros,
                                          });
                                        }}
                                        placeholder="Ej: Permiso SCT, Licencia Federal"
                                        maxLength={50}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`numero_adicional_${index}`}
                                      >
                                        Número *
                                      </Label>
                                      <Input
                                        id={`numero_adicional_${index}`}
                                        value={item.numero}
                                        onChange={(e) => {
                                          const nuevosNumeros = [
                                            ...formData.numeros_adicionales,
                                          ];
                                          nuevosNumeros[index].numero =
                                            e.target.value;
                                          setFormData({
                                            ...formData,
                                            numeros_adicionales: nuevosNumeros,
                                          });
                                        }}
                                        placeholder="Ej: SCT123456"
                                        maxLength={30}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label
                                        htmlFor={`fecha_vencimiento_${index}`}
                                      >
                                        Fecha de Vencimiento
                                      </Label>
                                      <Input
                                        id={`fecha_vencimiento_${index}`}
                                        type="date"
                                        value={item.fecha_vencimiento}
                                        onChange={(e) => {
                                          const nuevosNumeros = [
                                            ...formData.numeros_adicionales,
                                          ];
                                          nuevosNumeros[
                                            index
                                          ].fecha_vencimiento = e.target.value;
                                          setFormData({
                                            ...formData,
                                            numeros_adicionales: nuevosNumeros,
                                          });
                                        }}
                                        min={
                                          new Date().toISOString().split("T")[0]
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Acciones</Label>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const nuevosNumeros =
                                            formData.numeros_adicionales.filter(
                                              (_, i) => i !== index
                                            );
                                          setFormData({
                                            ...formData,
                                            numeros_adicionales: nuevosNumeros,
                                          });
                                        }}
                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </Button>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {formData.numeros_adicionales.length === 0 && (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                              <p>No hay números adicionales registrados</p>
                              <p className="text-sm mt-1">
                                Haz clic en "Agregar Número" para añadir
                                documentos con fecha de vencimiento
                              </p>
                            </div>
                          )}

                          {formData.numeros_adicionales.length >= 5 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-sm text-yellow-800">
                                <strong>Límite alcanzado:</strong> Se pueden
                                registrar máximo 5 números adicionales.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "comentarios" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="comentarios">
                            Comentarios Adicionales
                          </Label>
                          <Textarea
                            id="comentarios"
                            value={formData.comentarios}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                comentarios: e.target.value,
                              })
                            }
                            placeholder="Comentarios adicionales sobre el camión..."
                            rows={6}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => { setShowForm(false); setActiveTab("informacion"); }}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={guardarCamion}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : editingCamion ? (
                        "Actualizar Camión"
                      ) : (
                        "Guardar Camión"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alerta si la tabla de marcas no existe */}
        {!marcasTableExists && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Tabla de marcas no encontrada</p>
                  <p className="text-sm">
                    Se están usando marcas por defecto. Ejecuta el script de
                    migración para habilitar la gestión de marcas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Tractocamiones
                  </p>
                  <p className="text-2xl font-bold">{camiones.length}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Fuera de Servicio
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {
                      camiones.filter((c) => c.estado === "fuera-de-servicio")
                        .length
                    }
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Seguros por Vencer
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(() => {
                      let segurosVenciendo = 0;
                      camiones.forEach((camion) => {
                        if (camion.observaciones) {
                          try {
                            const datos = JSON.parse(camion.observaciones);
                            const hoy = new Date();

                            // Verificar seguro mexicano
                            if (datos.fecha_vencimiento_seguro_mexicano) {
                              const fechaVencimiento = new Date(
                                datos.fecha_vencimiento_seguro_mexicano
                              );
                              const diasRestantes = Math.ceil(
                                (fechaVencimiento.getTime() - hoy.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );
                              if (diasRestantes <= 30) segurosVenciendo++;
                            }

                            // Verificar seguro americano
                            if (datos.fecha_vencimiento_seguro_americano) {
                              const fechaVencimiento = new Date(
                                datos.fecha_vencimiento_seguro_americano
                              );
                              const diasRestantes = Math.ceil(
                                (fechaVencimiento.getTime() - hoy.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );
                              if (diasRestantes <= 30) segurosVenciendo++;
                            }
                          } catch (error) {
                            // Ignorar errores de parsing
                          }
                        }
                      });
                      return segurosVenciendo;
                    })()}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    En Mantenimiento
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      camiones.filter((c) => c.estado === "mantenimiento")
                        .length
                    }
                  </p>
                </div>
                <Gauge className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Disponibles
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {camiones.filter((c) => c.estado === "disponible").length}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número económico, marca, modelo o placas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {totalItems > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-700">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente
                  </Button>
                  <div className="hidden sm:block h-5 w-px bg-gray-200 mx-1" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Por página:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) => {
                        const newSize = Number.parseInt(v, 10);
                        setPageSize(newSize);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Por página" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 por página</SelectItem>
                        <SelectItem value="12">12 por página</SelectItem>
                        <SelectItem value="18">18 por página</SelectItem>
                        <SelectItem value="24">24 por página</SelectItem>
                        <SelectItem value="48">48 por página</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de camiones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {camionesPaginados.map((camion) => {
            const alertas = verificarVencimientos(camion);
            let datosAdicionales = {
              poliza_seguro: "",
              fecha_vencimiento_seguro: "",
              comentarios: "",
            };

            if (camion.observaciones) {
              try {
                datosAdicionales = {
                  ...datosAdicionales,
                  ...JSON.parse(camion.observaciones),
                };
              } catch (error) {
                // Ignorar errores de parsing
              }
            }

            return (
              <Card key={camion.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {camion.numero_economico}
                      </CardTitle>
                      <CardDescription>
                        {camion.marca} {camion.modelo}{" "}
                        {camion.año && `(${camion.año})`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getEstadoBadge(camion.estado)}
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verDetallesCamion(camion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cambiarEstadoFueraServicio(camion.id)}
                          className={
                            camion.estado === "fuera-de-servicio"
                              ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                          }
                          title={
                            camion.estado === "fuera-de-servicio"
                              ? "Reactivar unidad"
                              : "Marcar como fuera de servicio"
                          }
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        {camion.estado === "fuera-de-servicio" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar camión?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará
                                  permanentemente el camión y todos sus
                                  recordatorios asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => eliminarCamion(camion.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              alert(
                                "Para eliminar esta unidad, primero márcala como Fuera de Servicio."
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alertas.length > 0 && (
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
                              className={`h-4 w-4 mt-0.5 ${
                                alerta.vencido
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {alerta.tipo === "seguro_mexicano"
                                  ? "🛡️ Seguro MX"
                                  : alerta.tipo === "seguro_americano"
                                  ? "🇺🇸 Seguro US"
                                  : alerta.tipo === "seguro"
                                  ? "🛡️ Seguro"
                                  : "🔍 Verificación"}
                              </p>
                              <p className="text-xs">
                                {alerta.vencido ? "Vencido el" : "Vence el"}:{" "}
                                {alerta.fecha}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                alerta.vencido
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {alerta.vencido
                                ? `${alerta.dias} días vencido`
                                : `${alerta.dias} días restantes`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    {camion.placas && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">Placas:</span>
                        <span>{camion.placas}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm">
                      <Gauge className="h-4 w-4 text-gray-400" />
                      <span>{camion.kilometraje.toLocaleString()} km</span>
                    </div>
                    {datosAdicionales.poliza_seguro && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span>Seguro: {datosAdicionales.poliza_seguro}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        Registrado:{" "}
                        {new Date(camion.fecha_registro).toLocaleDateString()}
                      </span>
                    </div>
                    {datosAdicionales.comentarios && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Comentarios:</span>
                        <p className="mt-1">{datosAdicionales.comentarios}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Controles de paginación */}
        {totalItems > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-700">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Por página:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    const newSize = Number.parseInt(v, 10);
                    setPageSize(newSize);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Por página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 por página</SelectItem>
                    <SelectItem value="12">12 por página</SelectItem>
                    <SelectItem value="18">18 por página</SelectItem>
                    <SelectItem value="24">24 por página</SelectItem>
                    <SelectItem value="48">48 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {camionesFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No se encontraron camiones</p>
              {searchTerm && (
                <p className="text-sm text-gray-400 mt-1">
                  Intenta con otros términos de búsqueda
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Diálogo de Gestión de Marcas */}
        {marcasTableExists && (
          <Dialog open={showMarcasForm} onOpenChange={setShowMarcasForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gestión de Marcas de Camiones</DialogTitle>
                <DialogDescription>
                  Administrar marcas disponibles para los camiones
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Formulario para nueva marca */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {editingMarca ? "Editar Marca" : "Nueva Marca"}
                  </h3>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Nombre de la marca"
                      value={marcaFormData.nombre}
                      onChange={(e) =>
                        setMarcaFormData({ nombre: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={guardarMarca}
                      className={
                        editingMarca
                          ? undefined
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }
                    >
                      {editingMarca ? "Actualizar" : "Agregar"}
                    </Button>
                    {editingMarca && (
                      <Button
                        variant="outline"
                        onClick={limpiarFormularioMarca}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Lista de marcas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Marcas Registradas</h3>
                  {loadingMarcas ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">
                        Cargando marcas...
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {marcas.map((marca) => (
                        <div
                          key={marca.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <span className="font-medium">{marca.nombre}</span>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editarMarca(marca)}
                            >
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
                                  <AlertDialogTitle>
                                    ¿Eliminar marca?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no afectará los camiones ya
                                    registrados. Si la marca está en uso, se
                                    marcará como inactiva.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => eliminarMarca(marca.id)}
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {marcas.length === 0 && !loadingMarcas && (
                    <p className="text-center text-gray-500 py-4">
                      No hay marcas registradas
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowMarcasForm(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Diálogo de Detalles del Camión */}
        <Dialog open={showDetallesCamion} onOpenChange={setShowDetallesCamion}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-2xl font-bold">
                <Truck className="h-6 w-6" />
                <span>
                  Detalles del Camión:{" "}
                  <span className="font-bold">
                    {camionDetalle?.numero_economico}
                  </span>
                </span>
              </DialogTitle>
              <DialogDescription>
                Información completa é historial del camión
              </DialogDescription>
            </DialogHeader>

            {camionDetalle && (
              <div className="w-full">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab("informacion")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "informacion"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Información General
                    </button>
                    <button
                      onClick={() => setActiveTab("datos-control")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "datos-control"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Datos Control
                    </button>
                    <button
                      onClick={() => setActiveTab("documentos-detalle")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "documentos-detalle"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Documentos y Seguros
                    </button>
                    <button
                      onClick={() => setActiveTab("kilometraje")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "kilometraje"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Kilometraje
                    </button>
                    <button
                      onClick={() => setActiveTab("mantenimiento")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "mantenimiento"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Mantenimiento
                    </button>
                    <button
                      onClick={() => setActiveTab("fechas-control")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "fechas-control"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Fechas Control
                    </button>
                    <button
                      onClick={() => setActiveTab("comentarios-detalle")}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "comentarios-detalle"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Comentarios
                    </button>
                  </nav>
                </div>

                <div className="mt-6">
                  {activeTab === "informacion" && (
                    <div className="space-y-8">
                      {/* Fila 1: Información básica + Kilometraje */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            <span>Información Básica</span>
                          </h3>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium text-gray-600">
                                  Número Económico:
                                </span>
            <p className="font-semibold">
                                  {camionDetalle.numero_economico}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Marca:</span>
                                <p>{camionDetalle.marca || "No especificado"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Modelo:</span>
                                <p>{camionDetalle.modelo || "No especificado"}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium text-gray-600">Año:</span>
                                <p>{camionDetalle.año || "No especificado"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Placas:</span>
                                <p>{camionDetalle.placas || "No especificado"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Estado:</span>
                                <div className="mt-1">{getEstadoBadge(camionDetalle.estado)}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="sr-only">
                            <Gauge className="h-5 w-5" />
                            <span>Kilometraje</span>
                          </h3>
                          <div className="mt-3 text-center">
                            <span className="font-medium text-gray-600 block mb-1">Kilometraje Actual:</span>
                            <p className="text-3xl font-bold text-blue-600">
                              {camionDetalle.kilometraje.toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              onClick={() => {
                                seleccionarCamionKilometraje(camionDetalle);
                                setShowKilometrajeForm(true);
                              }}
                              className="mt-3 bg-[#16A34A] hover:bg-[#12813a] text-white font-semibold mx-auto"
                              disabled={!registrosKilometrajeTableExists}
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Registrar Kilometraje
                            </Button>
                            <p className="text-sm text-gray-500 mt-2">kilómetros</p>
                          </div>
                        </div>
                      </section>

                      {/* Fila 2: Fechas importantes - ocultada, ahora en pestaña 'Fechas Control' */}

                      {/* Fila 3: Datos adicionales */}
                      {(() => {
                        let datosAdicionales: any = {};
                        if (camionDetalle.observaciones) {
                          try {
                            datosAdicionales = JSON.parse(camionDetalle.observaciones);
                          } catch (error) {
                            console.error("Error parsing observaciones:", error);
                          }
                        }

                        return (
                          <div className="space-y-6">
                            {/* Sección de números movida a pestaña Datos Control */}
                          </div>
                        );
                      })()}

                      {/* Fila 4: Acciones rápidas */}
                      <section>
                        <h3 className="text-sm font-semibold text-gray-900">Acciones Rápidas</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            onClick={() => poblarFormularioParaEdicion(camionDetalle)}
                            className="flex items-center space-x-2 bg-[#16A34A] hover:bg-[#12813a] text-white font-semibold"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar Información</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => descargarExcelCamion(camionDetalle)}
                            className="flex items-center space-x-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Descargar Reporte</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => cambiarEstadoFueraServicio(camionDetalle.id)}
                            className={`flex items-center space-x-2 ${
                              camionDetalle.estado === "fuera-de-servicio"
                                ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                : "text-red-600 hover:text-red-700 hover:bg-red-50"
                            }`}
                          >
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                              {camionDetalle.estado === "fuera-de-servicio"
                                ? "Reactivar Unidad"
                                : "Fuera de Servicio"}
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowDetallesCamion(false)}
                            className="flex items-center space-x-2 ml-auto"
                          >
                            <span>Cerrar</span>
                          </Button>
                        </div>
                      </section>
                    </div>
                  )}
                  {activeTab === "datos-control" && (
                    <div className="space-y-6">
                      {/* Encabezado y descripción de Datos de Control ocultados por solicitud */}
                      {/* Placeholder inicial: reutiliza datos parseados de observaciones si existen */}
                      {(() => {
                        let datos: any = {};
                        try { datos = camionDetalle.observaciones ? JSON.parse(camionDetalle.observaciones) : {}; } catch {}
                        // Última fecha mantenimiento (si existe en cache global)
                        let ultimaMantenimiento = '';
                        try {
                          const g: any = globalThis as any;
                          if (g.__ultimaFechaMantenimientoCamiones && g.__ultimaFechaMantenimientoCamiones[camionDetalle.id]) {
                            ultimaMantenimiento = g.__ultimaFechaMantenimientoCamiones[camionDetalle.id];
                          }
                        } catch {}
                        return (
                          <div className="space-y-8">
                            <section>
                              <h4 className="text-sm font-semibold text-gray-900">Números de Identificación</h4>
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {datos.numero_serie && (
                                  <div>
                                    <span className="font-medium text-gray-600">Número de Serie:</span>
                                    <p>{datos.numero_serie}</p>
                                  </div>
                                )}
                                {datos.tag_americano && (
                                  <div>
                                    <span className="font-medium text-gray-600">Tag Americano:</span>
                                    <p>{datos.tag_americano}</p>
                                  </div>
                                )}
                                {datos.tag_mexicano && (
                                  <div>
                                    <span className="font-medium text-gray-600">Tag Mexicano:</span>
                                    <p>{datos.tag_mexicano}</p>
                                  </div>
                                )}
                                {datos.numero_base && (
                                  <div>
                                    <span className="font-medium text-gray-600">Número de Base:</span>
                                    <p>{datos.numero_base}</p>
                                  </div>
                                )}
                              </div>
                            </section>
                            {datos.numeros_adicionales && Array.isArray(datos.numeros_adicionales) && datos.numeros_adicionales.length > 0 && (
                              <section>
                                <h4 className="text-sm font-semibold text-gray-900">Números Adicionales</h4>
                                <div className="mt-3 space-y-3">
                                  {datos.numeros_adicionales.map((numero: any, index: number) => (
                                    <div key={index} className="p-3 rounded-lg bg-gray-50">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                          <span className="font-medium text-gray-600">Documento:</span>
                                          <p>{numero.nombre}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Número:</span>
                                          <p>{numero.numero}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Vencimiento:</span>
                                          <p>{numero.fecha_vencimiento ? new Date(numero.fecha_vencimiento).toLocaleDateString() : 'No especificado'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}
                            <section>
                              {/* Sección 'Resumen Rápido' ocultada por solicitud */}
                            </section>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === "documentos-detalle" && (
                    <div className="space-y-6">
                      {(() => {
                        let datosAdicionales: any = {};
                        if (camionDetalle.observaciones) {
                          try {
                            datosAdicionales = JSON.parse(
                              camionDetalle.observaciones
                            );
                          } catch (error) {
                            console.error(
                              "Error parsing observaciones:",
                              error
                            );
                          }
                        }

                        const alertas = verificarVencimientos(camionDetalle);

                        return (
                          <>
                            {/* Alertas de Vencimiento */}
                            {alertas.length > 0 && (
                              <section>
                                <h3 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5" />
                                  <span>Alertas de Vencimiento</span>
                                </h3>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                  {alertas.map((alerta, index) => (
                                    <div
                                      key={index}
                                      className={`relative rounded-md border text-xs md:text-sm p-3 flex flex-col gap-2 shadow-sm ${
                                        alerta.vencido
                                          ? 'border-red-300 bg-red-50/70'
                                          : 'border-yellow-300 bg-yellow-50/70'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className={`mt-0.5 inline-block h-2 w-2 rounded-full ${alerta.vencido ? 'bg-red-600' : 'bg-yellow-500'}`}></span>
                                        <div className="space-y-0.5 leading-tight pr-10">
                                          <p className="font-medium">{alerta.mensaje}</p>
                                          <p className="opacity-80">Fecha: {alerta.fecha}</p>
                                        </div>
                                        <span className={`absolute top-2 right-2 rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                                          alerta.vencido ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'
                                        }`}>
                                          {alerta.vencido ? 'VENCIDO' : `${alerta.dias} días`}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}

                            {/* Seguros */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center space-x-2">
                                    <Shield className="h-5 w-5" />
                                    <span>Seguro Mexicano</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Póliza:
                                    </span>
                                    <p>
                                      {datosAdicionales.poliza_seguro_mexicano ||
                                        "No especificado"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Fecha de Vencimiento:
                                    </span>
                                    <p>
                                      {datosAdicionales.fecha_vencimiento_seguro_mexicano
                                        ? new Date(
                                            datosAdicionales.fecha_vencimiento_seguro_mexicano
                                          ).toLocaleDateString()
                                        : "No especificado"}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center space-x-2">
                                    <Shield className="h-5 w-5" />
                                    <span>Seguro Americano</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Póliza:
                                    </span>
                                    <p>
                                      {datosAdicionales.poliza_seguro_americano ||
                                        "No especificado"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Fecha de Vencimiento:
                                    </span>
                                    <p>
                                      {datosAdicionales.fecha_vencimiento_seguro_americano
                                        ? new Date(
                                            datosAdicionales.fecha_vencimiento_seguro_americano
                                          ).toLocaleDateString()
                                        : "No especificado"}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Verificaciones */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center space-x-2">
                                  <Calendar className="h-5 w-5" />
                                  <span>Verificaciones</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Última Verificación:
                                    </span>
                                    <p>
                                      {datosAdicionales.ultima_verificacion
                                        ? new Date(
                                            datosAdicionales.ultima_verificacion
                                          ).toLocaleDateString()
                                        : "No especificado"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">
                                      Próxima Verificación:
                                    </span>
                                    <p>
                                      {datosAdicionales.frecuencia_verificacion
                                        ? new Date(
                                            datosAdicionales.frecuencia_verificacion
                                          ).toLocaleDateString()
                                        : "No especificado"}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === "kilometraje" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <Gauge className="h-5 w-5" />
                          <span>Historial de Kilometraje</span>
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 hidden sm:inline">Mostrar:</span>
                            <Select
                              value={pageSizeKilometraje.toString()}
                              onValueChange={(val) => {
                                const n = parseInt(val, 10);
                                setPageSizeKilometraje(n);
                                setCurrentPageKilometraje(1);
                              }}
                            >
                              <SelectTrigger className="w-[110px] h-8 px-2 text-xs">
                                <SelectValue placeholder="Registros" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            className="bg-[#16A34A] hover:bg-[#12813a] text-white"
                            onClick={() => {
                              seleccionarCamionKilometraje(camionDetalle);
                              setShowKilometrajeForm(true);
                            }}
                            disabled={!registrosKilometrajeTableExists}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Registro
                          </Button>
                        </div>
                      </div>
                      {(() => {
                        const totalPages = Math.ceil(historialKilometraje.length / pageSizeKilometraje) || 1;
                        const start = (currentPageKilometraje - 1) * pageSizeKilometraje;
                        const paginated = historialKilometraje.slice(start, start + pageSizeKilometraje);
                        return (
                          <>
                      {loadingHistorial ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Cargando historial...</p>
                        </div>
                      ) : historialKilometraje.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-200 text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                              <tr className="divide-x divide-gray-200">
                                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                                <th className="px-3 py-2 text-left font-medium">Km +</th>
                                <th className="px-3 py-2 text-left font-medium">Tramo</th>
                                <th className="px-3 py-2 text-left font-medium">Comentarios</th>
                                <th className="px-3 py-2 text-left font-medium">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {paginated.map((registro) => (
                                <tr key={registro.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap">{new Date(registro.fecha_viaje).toLocaleDateString()}</td>
                                  <td className="px-3 py-2 font-semibold text-blue-600">+{registro.kilometraje_agregado.toLocaleString()} km</td>
                                  <td className="px-3 py-2">{registro.tramo_recorrido}</td>
                                  <td className="px-3 py-2 max-w-[240px] truncate" title={registro.comentarios || ''}>{registro.comentarios || '-'}</td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => editarRegistroKilometraje(registro)}
                                      >
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
                                            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Esta acción no se puede deshacer. Se eliminará el registro y se ajustará el kilometraje del camión.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                eliminarRegistroKilometraje(
                                                  registro.id,
                                                  camionDetalle.id,
                                                  registro.kilometraje_agregado
                                                )
                                              }
                                            >
                                              Eliminar
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex items-center justify-between mt-4 text-sm">
                            <span className="text-gray-600">
                              {historialKilometraje.length > 0 ? (
                                <>Página {currentPageKilometraje} de {totalPages} · {historialKilometraje.length} registros</>
                              ) : (
                                <>0 registros</>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPageKilometraje === 1 || historialKilometraje.length === 0}
                                onClick={() => setCurrentPageKilometraje((p: number) => Math.max(1, p - 1))}
                              >
                                Anterior
                              </Button>
                              <div className="flex items-center gap-1">
                                {historialKilometraje.length > 0 && Array.from({ length: totalPages }).map((_, i) => {
                                  const page = i + 1;
                                  const active = page === currentPageKilometraje;
                                  const show =
                                    totalPages <= 7 ||
                                    page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPageKilometraje) <= 1 ||
                                    page === 2 ||
                                    page === totalPages - 1;
                                  if (!show) {
                                    if (
                                      (page === 3 && currentPageKilometraje > 4) ||
                                      (page === totalPages - 2 && currentPageKilometraje < totalPages - 3)
                                    ) {
                                      return <span key={page} className="px-1 text-gray-400">...</span>;
                                    }
                                    return null;
                                  }
                                  return (
                                    <button
                                      key={page}
                                      onClick={() => setCurrentPageKilometraje(page)}
                                      className={`h-8 w-8 rounded-md border text-xs font-medium ${
                                        active
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-white text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  );
                                })}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPageKilometraje === totalPages || historialKilometraje.length === 0}
                                onClick={() => setCurrentPageKilometraje((p: number) => Math.min(totalPages, p + 1))}
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Gauge className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No hay registros de kilometraje</p>
                          <p className="text-sm mt-1">Los registros de viajes aparecerán aquí</p>
                        </div>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === "mantenimiento" && (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Gauge className="h-5 w-5" />
                          <span>Historial de Mantenimiento</span>
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Mostrar</span>
              <Select
                              value={String(pageSizeMantenimiento)}
                              onValueChange={(v) => {
                                setPageSizeMantenimiento(Number(v));
                                setCurrentPageMantenimiento(1);
                              }}
                              disabled={loadingHistorialMantenimiento || historialMantenimiento.length === 0}
                            >
                              <SelectTrigger className="h-8 w-[90px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                {[5,10,25,50].map(opt => (
                                  <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedCamionMantenimiento(camionDetalle);
                              setShowMantenimientoForm(true);
                            }}
                            disabled={!registrosMantenimientoTableExists}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Mantenimiento
                          </Button>
                        </div>
                      </div>

                      {loadingHistorialMantenimiento ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Cargando historial...</p>
                        </div>
                      ) : historialMantenimiento.length > 0 ? (
                        (() => {
                          const start = (currentPageMantenimiento - 1) * pageSizeMantenimiento;
                          const end = start + pageSizeMantenimiento;
                          const paginated = historialMantenimiento.slice(start, end);
                          const totalPages = Math.ceil(historialMantenimiento.length / pageSizeMantenimiento) || 1;
                          const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                          return (
                            <div className="space-y-4">
                              <div className="overflow-x-auto rounded-lg border">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">Fecha</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tipo</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">Detalles</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">Próximo</th>
                                      <th className="px-3 py-2 text-left font-medium text-gray-600">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 bg-white">
                                    {paginated.map(registro => {
                                      const detalles = registro.detalles_mantenimiento || '';
                                      const truncated = detalles.length > 70 ? detalles.slice(0,70) + '…' : detalles;
                                      return (
                                        <tr key={registro.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 whitespace-nowrap">{new Date(registro.fecha_mantenimiento).toLocaleDateString()}</td>
                                          <td className="px-3 py-2 capitalize">{registro.tipo_mantenimiento || 'General'}</td>
                                          <td className="px-3 py-2" title={detalles}>{truncated || <span className="text-gray-400 italic">Sin detalles</span>}</td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {registro.proximo_mantenimiento ? new Date(registro.proximo_mantenimiento).toLocaleDateString() : <span className="text-gray-400 italic">—</span>}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => editarRegistroMantenimiento(registro)}
                                              >
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
                                                    <AlertDialogTitle>¿Eliminar registro de mantenimiento?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Esta acción no se puede deshacer. Se eliminará permanentemente el registro de mantenimiento.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => eliminarRegistroMantenimiento(registro.id)}>Eliminar</AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="text-xs text-gray-500">
                                  Página {currentPageMantenimiento} de {totalPages} · {historialMantenimiento.length} registros
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPageMantenimiento === 1 || historialMantenimiento.length === 0}
                                    onClick={() => setCurrentPageMantenimiento(p => Math.max(1, p - 1))}
                                  >
                                    Anterior
                                  </Button>
                                  <div className="flex items-center gap-1">
                                    {pages.map(page => {
                                      const active = page === currentPageMantenimiento;
                                      const show =
                                        page === 1 ||
                                        page === totalPages ||
                                        Math.abs(page - currentPageMantenimiento) <= 1 ||
                                        (page === 3 && currentPageMantenimiento > 4) ||
                                        (page === totalPages - 2 && currentPageMantenimiento < totalPages - 3);
                                      if (!show) return null;
                                      if (
                                        (page === 3 && currentPageMantenimiento > 5) ||
                                        (page === totalPages - 2 && currentPageMantenimiento < totalPages - 4)
                                      ) {
                                        return <span key={page} className="px-1 text-gray-400">…</span>;
                                      }
                                      return (
                                        <button
                                          key={page}
                                          onClick={() => setCurrentPageMantenimiento(page)}
                                          className={`h-8 w-8 rounded-md border text-xs font-medium ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                          {page}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPageMantenimiento === totalPages || historialMantenimiento.length === 0}
                                    onClick={() => setCurrentPageMantenimiento(p => Math.min(totalPages, p + 1))}
                                  >
                                    Siguiente
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Gauge className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No hay registros de mantenimiento</p>
                          <p className="text-sm mt-1">Los registros de mantenimiento aparecerán aquí</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "fechas-control" && (
                    <div className="space-y-6">
                      <section>
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          <span>Fechas de Control</span>
                        </h3>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <span className="font-medium text-gray-600">Fecha de Registro:</span>
                            <p>{new Date(camionDetalle.fecha_registro).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Última Actualización:</span>
                            <p>
                              {camionDetalle.updated_at
                                ? new Date(camionDetalle.updated_at).toLocaleDateString()
                                : "No disponible"}
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "comentarios-detalle" && (
                    <div className="space-y-6">
                      <Card>
                        <CardContent>
                          {(() => {
                            let datosAdicionales: any = {};
                            if (camionDetalle.observaciones) {
                              try {
                                datosAdicionales = JSON.parse(camionDetalle.observaciones);
                              } catch (error) {
                                console.error('Error parsing observaciones:', error);
                              }
                            }
                            const comentarios = datosAdicionales.historial_comentarios || [];
                            return (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Textarea
                                    className="min-h-[90px] resize-y text-sm w-full"
                                    placeholder="Escribe tu comentario..."
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    rows={4}
                                  />
                                  <div className="flex justify-between items-center flex-wrap gap-2">
                                    <div className="flex items-center gap-2 text-[11px]">
                                      <span className="text-gray-500">Orden:</span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() => { setSortOrderComentarios(o => o === 'desc' ? 'asc' : 'desc'); setCurrentPageComentarios(1); }}
                                      >
                                        {sortOrderComentarios === 'desc' ? 'Más recientes' : 'Más antiguos'}
                                      </Button>
                                      <span className="text-gray-400">|</span>
                                      <span className="text-gray-500">Mostrar</span>
                                      <Select
                                        value={String(pageSizeComentarios)}
                                        onValueChange={(v) => { setPageSizeComentarios(Number(v)); setCurrentPageComentarios(1); }}
                                      >
                                        <SelectTrigger className="h-7 w-[70px] text-[11px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {[3,5,10,25,50].map(n => (
                                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      onClick={handleAddComment}
                                      disabled={!newCommentText.trim()}
                                      className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs"
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Agregar Comentario
                                    </Button>
                                  </div>
                                </div>
                                {comentarios.length > 0 ? (() => {
                                  const sorted = [...comentarios].sort((a: Comentario, b: Comentario) => {
                                    const da = new Date(a.date).getTime();
                                    const db = new Date(b.date).getTime();
                                    return sortOrderComentarios === 'desc' ? db - da : da - db;
                                  });
                                  const total = sorted.length;
                                  const totalPages = Math.ceil(total / pageSizeComentarios) || 1;
                                  const start = (currentPageComentarios - 1) * pageSizeComentarios;
                                  const pageItems = sorted.slice(start, start + pageSizeComentarios);
                                  if (currentPageComentarios > totalPages) setCurrentPageComentarios(totalPages);
                                  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                                  return (
                                    <div className="space-y-3">
                                      <div className="border rounded-md divide-y divide-gray-200 text-sm bg-white">
                                        {pageItems.map((comentario: Comentario) => (
                                          <div key={comentario.id} className="flex items-start gap-3 px-3 py-2">
                                        <div className="flex-1 min-w-0">
                                          {editingCommentId === comentario.id ? (
                                            <div className="space-y-2">
                                              <Textarea
                                                value={editedCommentText}
                                                onChange={(e) => setEditedCommentText(e.target.value)}
                                                rows={3}
                                                className="text-sm"
                                              />
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  onClick={() => handleEditComment(comentario.id)}
                                                  disabled={!editedCommentText.trim()}
                                                  className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                                                >
                                                  Guardar
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => { setEditingCommentId(null); setEditedCommentText(''); }}
                                                  className="h-7 px-3 text-xs"
                                                >
                                                  Cancelar
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="space-y-1">
                                              <p className="text-gray-800 break-words leading-snug">{comentario.text}</p>
                                              <p className="text-[10px] uppercase tracking-wide text-gray-500">{new Date(comentario.date).toLocaleString()}</p>
                                            </div>
                                          )}
                                        </div>
                                        {editingCommentId !== comentario.id && (
                                          <div className="flex gap-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => { setEditingCommentId(comentario.id); setEditedCommentText(comentario.text); }}
                                              className="h-7 w-7 p-0"
                                            >
                                              <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleDeleteComment(comentario.id)}
                                              className="h-7 w-7 p-0"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                        ))}
                                      </div>
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px] text-gray-600">
                                        <div> Página {currentPageComentarios} de {totalPages} · {total} comentarios</div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPageComentarios === 1}
                                            onClick={() => setCurrentPageComentarios(p => Math.max(1, p - 1))}
                                            className="h-7 px-2"
                                          >Anterior</Button>
                                          <div className="flex items-center gap-1">
                                            {pages.map(p => (
                                              <button
                                                key={p}
                                                onClick={() => setCurrentPageComentarios(p)}
                                                className={`h-7 w-7 rounded-md border text-[11px] font-medium ${p === currentPageComentarios ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                              >{p}</button>
                                            ))}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPageComentarios === totalPages}
                                            onClick={() => setCurrentPageComentarios(p => Math.min(totalPages, p + 1))}
                                            className="h-7 px-2"
                                          >Siguiente</Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })() : (
                                  <p className="text-xs text-gray-500 italic">No hay comentarios registrados.</p>
                                )}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Cerrar button moved to Acciones Rápidas */}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de Registro de Kilometraje */}
        <Dialog
          open={showKilometrajeForm}
          onOpenChange={setShowKilometrajeForm}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Kilometraje</DialogTitle>
              <DialogDescription>
                {selectedCamionKilometraje && (
                  <>
                    Camión: {selectedCamionKilometraje.numero_economico} -
                    Kilometraje actual:{" "}
                    {selectedCamionKilometraje.kilometraje.toLocaleString()} km
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kilometraje_actual">
                    Kilometraje Actual *
                  </Label>
                  <Input
                    id="kilometraje_actual"
                    type="number"
                    min={selectedCamionKilometraje?.kilometraje || 0}
                    value={kilometrajeFormData.kilometraje_actual}
                    onChange={(e) =>
                      setKilometrajeFormData({
                        ...kilometrajeFormData,
                        kilometraje_actual: e.target.value,
                      })
                    }
                    placeholder="Nuevo kilometraje"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_viaje">Fecha del Viaje *</Label>
                  <Input
                    id="fecha_viaje"
                    type="date"
                    value={kilometrajeFormData.fecha_viaje}
                    onChange={(e) =>
                      setKilometrajeFormData({
                        ...kilometrajeFormData,
                        fecha_viaje: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tramo_recorrido">Tramo Recorrido *</Label>
                <Input
                  id="tramo_recorrido"
                  value={kilometrajeFormData.tramo_recorrido}
                  onChange={(e) =>
                    setKilometrajeFormData({
                      ...kilometrajeFormData,
                      tramo_recorrido: e.target.value,
                    })
                  }
                  placeholder="Ej: Ciudad de México - Guadalajara"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentarios_viaje">Comentarios</Label>
                <Textarea
                  id="comentarios_viaje"
                  value={kilometrajeFormData.comentarios_viaje}
                  onChange={(e) =>
                    setKilometrajeFormData({
                      ...kilometrajeFormData,
                      comentarios_viaje: e.target.value,
                    })
                  }
                  placeholder="Comentarios adicionales del viaje..."
                  rows={3}
                />
              </div>

              {selectedCamionKilometraje &&
                kilometrajeFormData.kilometraje_actual && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Kilometraje a agregar:</strong>{" "}
                      {(
                        Number.parseInt(
                          kilometrajeFormData.kilometraje_actual
                        ) - selectedCamionKilometraje.kilometraje
                      ).toLocaleString()}{" "}
                      km
                    </p>
                  </div>
                )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowKilometrajeForm(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={guardarKilometraje}
                className="bg-[#16A34A] hover:bg-[#12813a] text-white font-semibold"
              >
                Guardar Kilometraje
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Registro de Mantenimiento */}
        <Dialog
          open={showMantenimientoForm}
          onOpenChange={setShowMantenimientoForm}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Mantenimiento</DialogTitle>
              <DialogDescription>
                {selectedCamionMantenimiento && (
                  <>Camión: {selectedCamionMantenimiento.numero_economico}</>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_mantenimiento">
                    Fecha de Mantenimiento *
                  </Label>
                  <Input
                    id="fecha_mantenimiento"
                    type="date"
                    value={mantenimientoFormData.fecha_mantenimiento}
                    onChange={(e) =>
                      setMantenimientoFormData({
                        ...mantenimientoFormData,
                        fecha_mantenimiento: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_mantenimiento">
                    Tipo de Mantenimiento
                  </Label>
                  <Select
                    value={mantenimientoFormData.tipo_mantenimiento}
                    onValueChange={(value) =>
                      setMantenimientoFormData({
                        ...mantenimientoFormData,
                        tipo_mantenimiento: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="frenos">Frenos</SelectItem>
                      <SelectItem value="transmision">Transmisión</SelectItem>
                      <SelectItem value="suspension">Suspensión</SelectItem>
                      <SelectItem value="electrico">Eléctrico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detalles_mantenimiento">
                  Detalles del Mantenimiento *
                </Label>
                <Textarea
                  id="detalles_mantenimiento"
                  value={mantenimientoFormData.detalles_mantenimiento}
                  onChange={(e) =>
                    setMantenimientoFormData({
                      ...mantenimientoFormData,
                      detalles_mantenimiento: e.target.value,
                    })
                  }
                  placeholder="Describe el mantenimiento realizado..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proximo_mantenimiento">
                  Próximo Mantenimiento
                </Label>
                <Input
                  id="proximo_mantenimiento"
                  type="date"
                  value={mantenimientoFormData.proximo_mantenimiento}
                  onChange={(e) =>
                    setMantenimientoFormData({
                      ...mantenimientoFormData,
                      proximo_mantenimiento: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowMantenimientoForm(false)}
              >
                Cancelar
              </Button>
              <Button onClick={guardarMantenimiento} className="bg-green-600 hover:bg-green-700 text-white">
                Guardar Mantenimiento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Edición de Registro de Kilometraje */}
        <Dialog
          open={showEditRegistroForm}
          onOpenChange={setShowEditRegistroForm}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Registro de Kilometraje</DialogTitle>
              <DialogDescription>
                Modificar información del registro de viaje
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_kilometraje_agregado">
                    Kilometraje Agregado *
                  </Label>
                  <Input
                    id="edit_kilometraje_agregado"
                    type="number"
                    min="1"
                    value={editRegistroFormData.kilometraje_agregado}
                    onChange={(e) =>
                      setEditRegistroFormData({
                        ...editRegistroFormData,
                        kilometraje_agregado: e.target.value,
                      })
                    }
                    placeholder="Kilometraje agregado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_fecha_viaje">Fecha del Viaje *</Label>
                  <Input
                    id="edit_fecha_viaje"
                    type="date"
                    value={editRegistroFormData.fecha_viaje}
                    onChange={(e) =>
                      setEditRegistroFormData({
                        ...editRegistroFormData,
                        fecha_viaje: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_tramo_recorrido">Tramo Recorrido *</Label>
                <Input
                  id="edit_tramo_recorrido"
                  value={editRegistroFormData.tramo_recorrido}
                  onChange={(e) =>
                    setEditRegistroFormData({
                      ...editRegistroFormData,
                      tramo_recorrido: e.target.value,
                    })
                  }
                  placeholder="Ej: Ciudad de México - Guadalajara"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_comentarios_viaje">Comentarios</Label>
                <Textarea
                  id="edit_comentarios_viaje"
                  value={editRegistroFormData.comentarios_viaje}
                  onChange={(e) =>
                    setEditRegistroFormData({
                      ...editRegistroFormData,
                      comentarios_viaje: e.target.value,
                    })
                  }
                  placeholder="Comentarios adicionales del viaje..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={cancelarEdicionRegistro}>
                Cancelar
              </Button>
              <Button
                onClick={guardarEdicionRegistro}
                className="bg-[#16A34A] hover:bg-[#12813a] text-white font-semibold"
              >
                Actualizar Registro
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Edición de Registro de Mantenimiento */}
        <Dialog
          open={showEditMantenimientoForm}
          onOpenChange={setShowEditMantenimientoForm}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Registro de Mantenimiento</DialogTitle>
              <DialogDescription>
                Modificar información del mantenimiento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_fecha_mantenimiento">
                    Fecha de Mantenimiento *
                  </Label>
                  <Input
                    id="edit_fecha_mantenimiento"
                    type="date"
                    value={editMantenimientoFormData.fecha_mantenimiento}
                    onChange={(e) =>
                      setEditMantenimientoFormData({
                        ...editMantenimientoFormData,
                        fecha_mantenimiento: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_tipo_mantenimiento">
                    Tipo de Mantenimiento
                  </Label>
                  <Select
                    value={editMantenimientoFormData.tipo_mantenimiento}
                    onValueChange={(value) =>
                      setEditMantenimientoFormData({
                        ...editMantenimientoFormData,
                        tipo_mantenimiento: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="frenos">Frenos</SelectItem>
                      <SelectItem value="transmision">Transmisión</SelectItem>
                      <SelectItem value="suspension">Suspensión</SelectItem>
                      <SelectItem value="electrico">Eléctrico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_detalles_mantenimiento">
                  Detalles del Mantenimiento *
                </Label>
                <Textarea
                  id="edit_detalles_mantenimiento"
                  value={editMantenimientoFormData.detalles_mantenimiento}
                  onChange={(e) =>
                    setEditMantenimientoFormData({
                      ...editMantenimientoFormData,
                      detalles_mantenimiento: e.target.value,
                    })
                  }
                  placeholder="Describe el mantenimiento realizado..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_proximo_mantenimiento">
                  Próximo Mantenimiento
                </Label>
                <Input
                  id="edit_proximo_mantenimiento"
                  type="date"
                  value={editMantenimientoFormData.proximo_mantenimiento}
                  onChange={(e) =>
                    setEditMantenimientoFormData({
                      ...editMantenimientoFormData,
                      proximo_mantenimiento: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={cancelarEdicionMantenimiento}>
                Cancelar
              </Button>
              <Button onClick={guardarEdicionMantenimiento}>
                Actualizar Mantenimiento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
