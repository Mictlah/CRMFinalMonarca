"use client";

import type React from "react";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  X,
  ImageIcon,
  FileSpreadsheet,
  User,
  BadgeIcon as IdCard,
  Shield,
  Contact,
  MessageSquare,
} from "lucide-react";
import { exportOperadoresToExcel } from "./excel-export";
import { useState, useEffect } from "react";
import { supabase, type Operador } from "@/lib/supabase";
import { subirDocumentoOperador, eliminarDocumentoOperador } from "@/lib/blob";

interface DocumentoOperador {
  id: string;
  operador_id: string;
  tipo_documento: string;
  numero_documento?: string;
  nombre_archivo: string;
  url_blob: string;
  pathname: string;
  tamano_bytes?: number;
  tipo_mime?: string;
  fecha_vencimiento?: string;
  activo: boolean;
  notas?: string;
  fecha_subida: string;
  subido_por?: string;
}

export default function OperadoresPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [operadorDetalle, setOperadorDetalle] = useState<Operador | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [documentos, setDocumentos] = useState<DocumentoOperador[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);

  // Estados para fotografía y documentos básicos
  const [fotoOperador, setFotoOperador] = useState<File | null>(null);
  const [fotoOperadorUrl, setFotoOperadorUrl] = useState<string>("");
  const [documentosBasicos, setDocumentosBasicos] = useState<File[]>([]);
  const [documentosBasicosUrls, setDocumentosBasicosUrls] = useState<string[]>(
    []
  );
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingDocumentos, setUploadingDocumentos] = useState(false);

  // Estados para los datos
  const [operadores, setOperadores] = useState<Operador[]>([]);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    alias: "",
    telefono: "",
    email: "",
    licencia: "",
    numero_apto_medico: "",
    fecha_vencimiento_licencia: "",
    fecha_vencimiento_apto_medico: "",
    numero_visa: "",
    fecha_vencimiento_visa: "",
    numero_fast: "",
    fecha_vencimiento_fast: "",
    tipo_sangre: "",
    direccion: "",
    fecha_nacimiento: "",
    curp: "",
    rfc: "",
    nss: "",
    telefono_emergencia: "",
    contactos_emergencia: "",
    observaciones: "",
    estado: "activo",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estados para subida de documentos
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [notasDocumento, setNotasDocumento] = useState("");

  const [contactosEmergencia, setContactosEmergencia] = useState([
    { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
    { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
    { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
    { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
    { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
  ]);

  const tiposDocumento = [
    "licencia",
    "apto_medico",
    "visa",
    "fast",
    "curp",
    "rfc",
    "nss",
    "ine",
    "pasaporte",
    "comprobante_domicilio",
    "contrato",
    "otro",
  ];

  // Función para validar RFC
  const validarRFC = (rfc: string): boolean => {
    if (!rfc) return true; // Permitir vacío
    const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    return (
      rfcRegex.test(rfc.toUpperCase()) &&
      (rfc.length === 12 || rfc.length === 13)
    );
  };

  // Función para validar CURP
  const validarCURP = (curp: string): boolean => {
    if (!curp) return true; // Permitir vacío
    const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
    return curpRegex.test(curp.toUpperCase()) && curp.length === 18;
  };

  // Función para validar NSS
  const validarNSS = (nss: string): boolean => {
    if (!nss) return true; // Permitir vacío
    const nssRegex = /^[0-9]{11}$/;
    return nssRegex.test(nss);
  };

  // Función para validar email
  const validarEmail = (email: string): boolean => {
    if (!email) return true; // Permitir vacío
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para validar teléfono
  const validarTelefono = (telefono: string): boolean => {
    if (!telefono) return true; // Permitir vacío
    const telefonoRegex = /^[\d\s\-+()]{10,15}$/;
    return telefonoRegex.test(telefono);
  };

  const actualizarContactoEmergencia = (
    index: number,
    campo: string,
    valor: string
  ) => {
    const nuevosContactos = [...contactosEmergencia];
    nuevosContactos[index] = { ...nuevosContactos[index], [campo]: valor };
    setContactosEmergencia(nuevosContactos);
  };

  // Función para limpiar y validar datos antes del envío
  const limpiarDatosFormulario = (data: typeof formData) => {
    const dataLimpia: any = { ...data };

    // Campos de texto que deben convertirse a null si están vacíos
    const camposTexto = [
      "alias",
      "telefono",
      "email",
      "licencia",
      "numero_apto_medico",
      "numero_visa",
      "numero_fast",
      "tipo_sangre",
      "direccion",
      "curp",
      "rfc",
      "nss",
      "telefono_emergencia",
      "observaciones",
    ];

    // Campos de fecha que deben convertirse a null si están vacíos
    const camposFecha = [
      "fecha_vencimiento_licencia",
      "fecha_vencimiento_apto_medico",
      "fecha_vencimiento_visa",
      "fecha_vencimiento_fast",
      "fecha_nacimiento",
    ];

    // Limpiar campos de texto
    camposTexto.forEach((campo) => {
      if (dataLimpia[campo] === "" || dataLimpia[campo]?.trim() === "") {
        dataLimpia[campo] = null;
      } else if (dataLimpia[campo]) {
        // Limpiar espacios extra y convertir a mayúsculas campos específicos
        if (campo === "rfc" || campo === "curp") {
          dataLimpia[campo] = dataLimpia[campo].trim().toUpperCase();
        } else if (campo === "nss") {
          dataLimpia[campo] = dataLimpia[campo].trim().replace(/\D/g, ""); // Solo números
        } else if (campo === "email") {
          dataLimpia[campo] = dataLimpia[campo].trim().toLowerCase();
        } else {
          dataLimpia[campo] = dataLimpia[campo].trim();
        }
      }
    });

    // Limpiar campos de fecha
    camposFecha.forEach((campo) => {
      if (dataLimpia[campo] === "" || !dataLimpia[campo]) {
        dataLimpia[campo] = null;
      }
    });

    // Manejar contactos_emergencia (convertir array a JSON)
    const contactosValidos = contactosEmergencia.filter(
      (contacto) =>
        contacto.nombre.trim() ||
        contacto.telefono.trim() ||
        contacto.correo.trim()
    );
    if (contactosValidos.length > 0) {
      dataLimpia.contactos_emergencia = JSON.stringify(contactosValidos);
    } else {
      dataLimpia.contactos_emergencia = null;
    }

    return dataLimpia;
  };

  // Función para validar todos los campos
  const validarFormulario = (data: typeof formData): string | null => {
    // Validar campos obligatorios
    if (!data.nombre.trim()) {
      return "El nombre es obligatorio";
    }
    if (!data.apellidos.trim()) {
      return "Los apellidos son obligatorios";
    }

    // Validar RFC si se proporciona
    if (data.rfc && !validarRFC(data.rfc)) {
      return "El RFC no tiene un formato válido. Debe tener 12 o 13 caracteres y seguir el formato mexicano.";
    }

    // Validar CURP si se proporciona
    if (data.curp && !validarCURP(data.curp)) {
      return "La CURP no tiene un formato válido. Debe tener 18 caracteres y seguir el formato mexicano.";
    }

    // Validar NSS si se proporciona
    if (data.nss && !validarNSS(data.nss)) {
      return "El NSS no tiene un formato válido. Debe tener 11 dígitos.";
    }

    // Validar email si se proporciona
    if (data.email && !validarEmail(data.email)) {
      return "El email no tiene un formato válido.";
    }

    // Validar teléfonos si se proporcionan
    if (data.telefono && !validarTelefono(data.telefono)) {
      return "El teléfono no tiene un formato válido.";
    }
    if (
      data.telefono_emergencia &&
      !validarTelefono(data.telefono_emergencia)
    ) {
      return "El teléfono de emergencia no tiene un formato válido.";
    }

    // Validar fechas
    const fechasValidar = [
      { campo: "fecha_nacimiento", nombre: "Fecha de nacimiento" },
      {
        campo: "fecha_vencimiento_licencia",
        nombre: "Fecha de vencimiento de licencia",
      },
      {
        campo: "fecha_vencimiento_apto_medico",
        nombre: "Fecha de vencimiento de apto médico",
      },
      {
        campo: "fecha_vencimiento_visa",
        nombre: "Fecha de vencimiento de visa",
      },
      {
        campo: "fecha_vencimiento_fast",
        nombre: "Fecha de vencimiento de FAST",
      },
    ];

    for (const { campo, nombre } of fechasValidar) {
      if ((data as any)[campo] && (data as any)[campo] !== "") {
        const fecha = new Date((data as any)[campo]);
        if (isNaN(fecha.getTime())) {
          return `${nombre} no es una fecha válida.`;
        }
      }
    }

    return null;
  };

  // Función para manejar la selección de foto del operador
  const handleFotoOperadorSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea imagen
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten archivos de imagen para la fotografía");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La fotografía es muy grande. Tamaño máximo: 5MB");
        return;
      }

      setFotoOperador(file);
      // Crear URL temporal para vista previa
      const tempUrl = URL.createObjectURL(file);
      setFotoOperadorUrl(tempUrl);
      setError("");
    }
  };

  // Función para manejar la selección de documentos básicos
  const handleDocumentosBasicosSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (documentosBasicos.length + files.length > 9) {
      setError("Máximo 9 documentos básicos permitidos");
      return;
    }

    // Validar cada archivo
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`El archivo ${file.name} es muy grande. Tamaño máximo: 10MB`);
        return;
      }

      const tiposPermitidos = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/webp",
        "application/pdf",
      ];
      if (!tiposPermitidos.includes(file.type)) {
        setError(`El archivo ${file.name} no es un tipo permitido`);
        return;
      }
    }

    setDocumentosBasicos((prev) => [...prev, ...files]);

    // Crear URLs temporales para vista previa
    const tempUrls = files.map((file) => URL.createObjectURL(file));
    setDocumentosBasicosUrls((prev) => [...prev, ...tempUrls]);
    setError("");
  };

  // Función para eliminar documento básico
  const eliminarDocumentoBasico = (index: number) => {
    setDocumentosBasicos((prev) => prev.filter((_, i) => i !== index));
    setDocumentosBasicosUrls((prev) => {
      // Liberar URL temporal
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Función para subir fotografía y documentos
  const subirFotografiaYDocumentos = async (operadorId: string) => {
    try {
      const resultados = [];

      // Subir fotografía del operador si existe
      if (fotoOperador) {
        setUploadingFoto(true);
        const { url: fotoUrl, pathname: fotoPathname } =
          await subirDocumentoOperador(
            operadorId,
            fotoOperador,
            "fotografia_operador"
          );

        // Guardar en base de datos
        await supabase.from("documentos_operadores").insert({
          operador_id: operadorId,
          tipo_documento: "fotografia_operador",
          nombre_archivo: fotoOperador.name,
          url_blob: fotoUrl,
          pathname: fotoPathname,
          tamano_bytes: fotoOperador.size,
          tipo_mime: fotoOperador.type,
          notas: "Fotografía del operador",
          subido_por: "Sistema",
          activo: true,
        });

        resultados.push("Fotografía subida");
      }

      // Subir documentos básicos
      if (documentosBasicos.length > 0) {
        setUploadingDocumentos(true);

        for (let i = 0; i < documentosBasicos.length; i++) {
          const documento = documentosBasicos[i];
          const { url: docUrl, pathname: docPathname } =
            await subirDocumentoOperador(
              operadorId,
              documento,
              `documento_basico_${i + 1}`
            );

          // Guardar en base de datos
          await supabase.from("documentos_operadores").insert({
            operador_id: operadorId,
            tipo_documento: `documento_basico_${i + 1}`,
            nombre_archivo: documento.name,
            url_blob: docUrl,
            pathname: docPathname,
            tamano_bytes: documento.size,
            tipo_mime: documento.type,
            notas: `Documento básico ${i + 1}`,
            subido_por: "Sistema",
            activo: true,
          });
        }

        resultados.push(
          `${documentosBasicos.length} documentos básicos subidos`
        );
      }

      return resultados;
    } catch (error) {
      console.error("Error subiendo archivos:", error);
      throw error;
    } finally {
      setUploadingFoto(false);
      setUploadingDocumentos(false);
    }
  };

  // Cargar datos desde Supabase
  const cargarDatos = async () => {
    try {
      setLoading(true);

      const { data: operadoresData, error: operadoresError } = await supabase
        .from("operadores")
        .select("*")
        .order("nombre");

      if (operadoresError) {
        console.error("Error cargando operadores:", operadoresError);
        setOperadores([]);
      } else {
        setOperadores(operadoresData || []);
      }
    } catch (error) {
      console.error("Error general:", error);
      setOperadores([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarDocumentosOperador = async (operadorId: string) => {
    try {
      setLoadingDocumentos(true);

      const { data, error } = await supabase
        .from("documentos_operadores")
        .select("*")
        .eq("operador_id", operadorId)
        .eq("activo", true)
        .order("fecha_subida", { ascending: false });

      if (error) {
        console.error("Error cargando documentos:", error);
        setDocumentos([]);
      } else {
        // Ordenar documentos: fotografía primero, luego documentos básicos, luego otros
        const documentosOrdenados = (data || []).sort((a, b) => {
          // Fotografía del operador va primero
          if (a.tipo_documento === "fotografia_operador") return -1;
          if (b.tipo_documento === "fotografia_operador") return 1;

          // Documentos básicos van después
          if (
            a.tipo_documento.startsWith("documento_basico_") &&
            !b.tipo_documento.startsWith("documento_basico_")
          )
            return -1;
          if (
            b.tipo_documento.startsWith("documento_basico_") &&
            !a.tipo_documento.startsWith("documento_basico_")
          )
            return 1;

          // Si ambos son documentos básicos, ordenar por número
          if (
            a.tipo_documento.startsWith("documento_basico_") &&
            b.tipo_documento.startsWith("documento_basico_")
          ) {
            const numA = Number.parseInt(a.tipo_documento.split("_")[2]) || 0;
            const numB = Number.parseInt(b.tipo_documento.split("_")[2]) || 0;
            return numA - numB;
          }

          // Para otros documentos, ordenar por fecha de subida (más reciente primero)
          return (
            new Date(b.fecha_subida).getTime() -
            new Date(a.fecha_subida).getTime()
          );
        });

        setDocumentos(documentosOrdenados);
      }
    } catch (error) {
      console.error("Error:", error);
      setDocumentos([]);
    } finally {
      setLoadingDocumentos(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellidos: "",
      alias: "",
      telefono: "",
      email: "",
      licencia: "",
      numero_apto_medico: "",
      fecha_vencimiento_licencia: "",
      fecha_vencimiento_apto_medico: "",
      numero_visa: "",
  fecha_vencimiento_visa: "",
      numero_fast: "",
      fecha_vencimiento_fast: "",
      tipo_sangre: "",
      direccion: "",
      fecha_nacimiento: "",
      curp: "",
      rfc: "",
      nss: "",
      telefono_emergencia: "",
      contactos_emergencia: "",
      observaciones: "",
      estado: "activo",
    });
    setEditingId(null);
    setError("");
    setSuccess("");
    setContactosEmergencia([
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
    ]);

    // Limpiar fotografía y documentos
    setFotoOperador(null);
    setFotoOperadorUrl("");
    setDocumentosBasicos([]);
    // Liberar URLs temporales
    documentosBasicosUrls.forEach((url) => URL.revokeObjectURL(url));
    setDocumentosBasicosUrls([]);
    setUploadingFoto(false);
    setUploadingDocumentos(false);
  };

  const resetDocumentForm = () => {
    setSelectedFile(null);
    setTipoDocumento("");
    setNumeroDocumento("");
    setFechaVencimiento("");
    setNotasDocumento("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      // Validar formulario
      const errorValidacion = validarFormulario(formData);
      if (errorValidacion) {
        setError(errorValidacion);
        setSaving(false);
        return;
      }

      // Limpiar y preparar datos
      const dataToSave = limpiarDatosFormulario(formData);

      if (editingId) {
        const { error } = await supabase
          .from("operadores")
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) {
          console.error("Error actualizando operador:", error);
          setError(`Error al actualizar operador: ${error.message}`);
          return;
        }

        // Subir archivos si hay nuevos
        if (fotoOperador || documentosBasicos.length > 0) {
          try {
            const resultados = await subirFotografiaYDocumentos(editingId);
            setSuccess(
              `Operador actualizado exitosamente. ${resultados.join(", ")}`
            );
          } catch (error) {
            setSuccess(
              "Operador actualizado exitosamente, pero hubo errores subiendo algunos archivos"
            );
          }
        } else {
          setSuccess("Operador actualizado exitosamente");
        }
      } else {
        // For new operator creation, we need to get the created operator ID
        const { data: newOperador, error } = await supabase
          .from("operadores")
          .insert({
            ...dataToSave,
            fecha_registro: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error("Error creando operador:", error);
          setError(`Error al crear operador: ${error.message}`);
          return;
        }

        // Subir archivos para el nuevo operador
        if (fotoOperador || documentosBasicos.length > 0) {
          try {
            const resultados = await subirFotografiaYDocumentos(newOperador.id);
            setSuccess(
              `Operador creado exitosamente. ${resultados.join(", ")}`
            );
          } catch (error) {
            setSuccess(
              "Operador creado exitosamente, pero hubo errores subiendo algunos archivos"
            );
          }
        } else {
          setSuccess("Operador creado exitosamente");
        }
      }

      setShowModal(false);
      resetForm();
      await cargarDatos();
    } catch (error) {
      console.error("Error:", error);
      setError(
        `Error al guardar operador: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (operador: Operador) => {
    setFormData({
      nombre: operador.nombre || "",
      apellidos: operador.apellidos || "",
      alias: operador.alias || "",
      telefono: operador.telefono || "",
      email: operador.email || "",
      licencia: operador.licencia || "",
      numero_apto_medico: operador.numero_apto_medico || "",
      fecha_vencimiento_licencia: operador.fecha_vencimiento_licencia || "",
      fecha_vencimiento_apto_medico:
        operador.fecha_vencimiento_apto_medico || "",
      numero_visa: operador.numero_visa || "",
      fecha_vencimiento_visa: operador.fecha_vencimiento_visa || "",
      numero_fast: operador.numero_fast || "",
      fecha_vencimiento_fast: operador.fecha_vencimiento_fast || "",
      tipo_sangre: operador.tipo_sangre || "",
      direccion: operador.direccion || "",
      fecha_nacimiento: operador.fecha_nacimiento || "",
      curp: operador.curp || "",
      rfc: operador.rfc || "",
      nss: operador.nss || "",
      telefono_emergencia: operador.telefono_emergencia || "",
      contactos_emergencia:
        typeof operador.contactos_emergencia === "object" &&
        operador.contactos_emergencia !== null
          ? JSON.stringify(operador.contactos_emergencia)
          : operador.contactos_emergencia || "",
      observaciones: operador.observaciones || "",
      estado: operador.estado || "activo",
    });

    // Manejar contactos de emergencia
    const contactosCargados = [
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
      { nombre: "", relacion: "", direccion: "", telefono: "", correo: "" },
    ];

    if (operador.contactos_emergencia) {
      try {
        const contactosExistentes =
          typeof operador.contactos_emergencia === "string"
            ? JSON.parse(operador.contactos_emergencia)
            : operador.contactos_emergencia;

        if (Array.isArray(contactosExistentes)) {
          contactosExistentes.forEach((contacto, index) => {
            if (index < 5) {
              contactosCargados[index] = {
                nombre: contacto.nombre || "",
                relacion: contacto.relacion || "",
                direccion: contacto.direccion || "",
                telefono: contacto.telefono || "",
                correo: contacto.correo || contacto.email || "",
              };
            }
          });
        }
      } catch (error) {
        console.error("Error parsing contactos_emergencia:", error);
      }
    }

    setContactosEmergencia(contactosCargados);

    setEditingId(operador.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setSaving(true);

      // 1) Verificar que el operador esté INACTIVO
      const { data: operador, error: opError } = await supabase
        .from("operadores")
        .select("id, nombre, apellidos, estado")
        .eq("id", id)
        .single();

      if (opError) {
        console.error("Error verificando operador:", opError);
        setError("Error al verificar estado del operador");
        return;
      }

      if (!operador || operador.estado !== "inactivo") {
        window.alert(
          "No se puede eliminar. El operador debe estar en estado INACTIVO."
        );
        return;
      }

      // 2) Verificar que NO tenga ningún embarque asociado (cualquier estado)
      const { data: embarques, error: embError } = await supabase
        .from("embarques")
        .select("id, folio")
        .eq("operador_id", id);

      if (embError) {
        console.error("Error verificando embarques asociados:", embError);
        setError("Error al verificar embarques asociados");
        return;
      }

      if (embarques && embarques.length > 0) {
        const listado = embarques
          .slice(0, 5)
          .map((e) => e.folio || e.id)
          .join(", ");
        window.alert(
          `No se puede eliminar: el operador tiene embarques asociados (${embarques.length}). Folios: ${listado}${
            embarques.length > 5 ? "..." : ""
          }`
        );
        return;
      }

      // 3) Eliminar definitivamente
      const { error } = await supabase.from("operadores").delete().eq("id", id);

      if (error) {
        console.error("Error eliminando operador:", error);
        setError("Error al eliminar operador");
        return;
      }

      setSuccess("Operador eliminado exitosamente");
      await cargarDatos();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al eliminar operador");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("El archivo es muy grande. Tamaño máximo: 10MB");
        return;
      }

      // Validar tipo
      const tiposPermitidos = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/webp",
        "application/pdf",
      ];
      if (!tiposPermitidos.includes(file.type)) {
        setError(
          "Tipo de archivo no permitido. Solo se permiten imágenes y PDFs"
        );
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const subirDocumento = async () => {
    if (!operadorDetalle || !selectedFile || !tipoDocumento) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setUploadingDoc(true);
      setError("");

      // Subir archivo a Blob
      const { url, pathname } = await subirDocumentoOperador(
        operadorDetalle.id,
        selectedFile,
        tipoDocumento,
        numeroDocumento
      );

      // Guardar información en la base de datos
      const { error } = await supabase.from("documentos_operadores").insert({
        operador_id: operadorDetalle.id,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento || null,
        nombre_archivo: selectedFile.name,
        url_blob: url,
        pathname: pathname,
        tamano_bytes: selectedFile.size,
        tipo_mime: selectedFile.type,
        fecha_vencimiento: fechaVencimiento || null,
        notas: notasDocumento || null,
        subido_por: "Sistema",
        activo: true,
      });

      if (error) {
        console.error("Error guardando documento:", error);
        setError("Error al guardar la información del documento");
        return;
      }

      setSuccess("Documento subido exitosamente");
      resetDocumentForm();
      await cargarDocumentosOperador(operadorDetalle.id);
    } catch (error) {
      console.error("Error subiendo documento:", error);
      setError(
        `Error al subir documento: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const eliminarDocumento = async (documento: DocumentoOperador) => {
    try {
      // Eliminar de Blob storage
      await eliminarDocumentoOperador(documento.pathname);

      // Marcar como inactivo en la base de datos
      const { error } = await supabase
        .from("documentos_operadores")
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq("id", documento.id);

      if (error) {
        console.error("Error eliminando documento:", error);
        setError("Error al eliminar documento");
        return;
      }

      setSuccess("Documento eliminado exitosamente");
      await cargarDocumentosOperador(documento.operador_id);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al eliminar documento");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getEstadoBadge = (estado: string) => {
    return estado === "activo" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Activo
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        Inactivo
      </Badge>
    );
  };

  const operadoresFiltrados = operadores.filter(
    (operador) =>
      operador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operador.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (operador.alias &&
        operador.alias.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (operador.telefono && operador.telefono.includes(searchTerm))
  );

  // Derivados de paginación
  const totalPages = Math.max(
    1,
    Math.ceil(operadoresFiltrados.length / Math.max(1, pageSize))
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const operadoresPaginados = operadoresFiltrados.slice(start, end);

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
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Operadores
            </h1>
            <p className="text-gray-600 mt-2">
              Gestión de operadores y conductores
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => exportOperadoresToExcel(operadores)}
              className="flex items-center"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Descargar Reporte
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Operador
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Operadores */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Operadores
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {operadores.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          {/* Operadores Activos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Operadores Activos
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {operadores.filter((op) => op.estado === "activo").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          {/* Operadores Inactivos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Operadores Inactivos
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {operadores.filter((op) => op.estado === "inactivo").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          {/* Licencias por Vencer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Licencias por Vencer
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      operadores.filter((op) => {
                        if (!op.fecha_vencimiento_licencia) return false;
                        const dias =
                          (new Date(op.fecha_vencimiento_licencia).getTime() -
                            new Date().getTime()) /
                          (1000 * 60 * 60 * 24);
                        return dias >= 0 && dias <= 30;
                      }).length
                    }
                  </p>
                </div>
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          {/* Aptos Médicos por Vencer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Aptos Médicos por Vencer
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {
                      operadores.filter((op) => {
                        if (!op.fecha_vencimiento_apto_medico) return false;
                        const dias =
                          (new Date(
                            op.fecha_vencimiento_apto_medico
                          ).getTime() -
                            new Date().getTime()) /
                          (1000 * 60 * 60 * 24);
                        return dias >= 0 && dias <= 30;
                      }).length
                    }
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          {/* Cumpleaños Próximo */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Cumpleaños Próximo
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {
                      operadores.filter((op) => {
                        if (!op.fecha_nacimiento) return false;
                        const hoy = new Date();
                        const cumple = new Date(op.fecha_nacimiento);
                        cumple.setFullYear(hoy.getFullYear());
                        const diff =
                          (cumple.getTime() - hoy.getTime()) /
                          (1000 * 60 * 60 * 24);
                        return diff >= 0 && diff <= 30;
                      }).length
                    }
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filtros + paginación superior */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, alias, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-700">
                  Página {page} de {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Lista de operadores en formato de tarjetas (paginada) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operadoresPaginados.map((operador) => (
            <Card
              key={operador.id}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-4">
                  {/* Foto del operador */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                      <img
                        src="/placeholder-user.jpg"
                        alt={`${operador.nombre} ${operador.apellidos}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/placeholder.svg?height=64&width=64&text=Sin+Foto";
                        }}
                      />
                    </div>
                  </div>

                  {/* Información y botones */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {operador.nombre} {operador.apellidos}
                          {operador.alias && (
                            <span className="text-sm font-normal text-blue-600 ml-2">
                              "{operador.alias}"
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex items-center mb-2">
                          {getEstadoBadge(operador.estado)}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOperadorDetalle(operador);
                            setActiveTab("general");
                            setShowDetailsModal(true);
                            cargarDocumentosOperador(operador.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title={
                            operador.estado === "activo"
                              ? "Desactivar operador"
                              : "Activar operador"
                          }
                          onClick={async () => {
                            // Cambiar estado (permitido siempre, sin importar embarques asociados)
                            const nuevoEstado =
                              operador.estado === "activo"
                                ? "inactivo"
                                : "activo";
                            const { error: updateError } = await supabase
                              .from("operadores")
                              .update({
                                estado: nuevoEstado,
                                updated_at: new Date().toISOString(),
                              })
                              .eq("id", operador.id);
                            if (updateError) {
                              window.alert(
                                "Error al actualizar estado del operador"
                              );
                              return;
                            }
                            setSuccess(
                              nuevoEstado === "activo"
                                ? "Operador activado correctamente"
                                : "Operador desactivado correctamente"
                            );
                            await cargarDatos();
                          }}
                        >
                          {operador.estado === "activo" ? (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(operador)}
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
                                ¿Eliminar operador?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará
                                permanentemente el operador {operador.nombre}{" "}
                                {operador.apellidos}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(operador.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información de contacto */}
                <div className="space-y-2">
                  {operador.telefono && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{operador.telefono}</span>
                    </div>
                  )}
                  {operador.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{operador.email}</span>
                    </div>
                  )}
                </div>

                {/* Información de documentos principales */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {operador.licencia && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <FileText className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-xs">Licencia</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {operador.licencia}
                      </p>
                      {operador.fecha_vencimiento_licencia && (
                        <p className="text-xs text-gray-500">
                          {new Date(
                            operador.fecha_vencimiento_licencia
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {operador.tipo_sangre && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                        <span className="font-medium text-xs">Tipo Sangre</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {operador.tipo_sangre}
                      </p>
                    </div>
                  )}

                  {operador.numero_visa && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <FileText className="h-3 w-3 text-blue-400" />
                        <span className="font-medium text-xs">Visa</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {operador.numero_visa}
                      </p>
                      {operador.fecha_vencimiento_visa && (
                        <p className="text-xs text-gray-500">
                          {new Date(
                            operador.fecha_vencimiento_visa
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {operador.numero_fast && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-1 mb-1">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="font-medium text-xs">FAST</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {operador.numero_fast}
                      </p>
                      {operador.fecha_vencimiento_fast && (
                        <p className="text-xs text-gray-500">
                          {new Date(
                            operador.fecha_vencimiento_fast
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                {operador.fecha_nacimiento && (
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="flex items-center space-x-1 mb-1">
                      <Users className="h-3 w-3 text-blue-400" />
                      <span className="font-medium text-xs">
                        Fecha de Nacimiento
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(operador.fecha_nacimiento).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Observaciones si existen */}
                {operador.observaciones && (
                  <div className="bg-yellow-50 p-2 rounded">
                    <p className="text-xs">
                      <strong>Obs:</strong>{" "}
                      {operador.observaciones.length > 50
                        ? `${operador.observaciones.substring(0, 50)}...`
                        : operador.observaciones}
                    </p>
                  </div>
                )}

                {/* Fecha de registro */}
                <div className="text-xs text-gray-400 pt-2 border-t">
                  Registrado:{" "}
                  {new Date(operador.fecha_registro).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controles de paginación inferior */}
        {operadoresFiltrados.length > 0 && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min(operadoresFiltrados.length, end) - start} de {operadoresFiltrados.length}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-700">
                Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
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
          </div>
        )}

        {/* Mensaje cuando no hay operadores */}
        {operadoresFiltrados.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No se encontraron operadores</p>
              {searchTerm && (
                <p className="text-sm text-gray-400 mt-1">
                  Intenta con otros términos de búsqueda
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Formulario con Pestañas */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Editar Operador" : "Nuevo Operador"}
              </h2>
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="p-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger
                      value="personal"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Personal
                    </TabsTrigger>
                    <TabsTrigger
                      value="fotografia"
                      className="flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Fotografía
                    </TabsTrigger>
                    <TabsTrigger
                      value="documentos"
                      className="flex items-center gap-2"
                    >
                      <IdCard className="h-4 w-4" />
                      Documentos
                    </TabsTrigger>
                    <TabsTrigger
                      value="licencias"
                      className="flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Licencias
                    </TabsTrigger>
                    <TabsTrigger
                      value="emergencia"
                      className="flex items-center gap-2"
                    >
                      <Contact className="h-4 w-4" />
                      Emergencia
                    </TabsTrigger>
                    <TabsTrigger
                      value="observaciones"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Observaciones
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) =>
                            setFormData({ ...formData, nombre: e.target.value })
                          }
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellidos">Apellidos *</Label>
                        <Input
                          id="apellidos"
                          value={formData.apellidos}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              apellidos: e.target.value,
                            })
                          }
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alias">Alias</Label>
                        <Input
                          id="alias"
                          value={formData.alias}
                          onChange={(e) =>
                            setFormData({ ...formData, alias: e.target.value })
                          }
                          placeholder="Ej: El Rápido, La Máquina..."
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              telefono: e.target.value,
                            })
                          }
                          placeholder="Ej: +52 123 456 7890"
                          maxLength={20}
                        />
                        {formData.telefono &&
                          !validarTelefono(formData.telefono) && (
                            <p className="text-xs text-red-500">
                              Formato de teléfono inválido
                            </p>
                          )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="ejemplo@correo.com"
                          maxLength={100}
                        />
                        {formData.email && !validarEmail(formData.email) && (
                          <p className="text-xs text-red-500">
                            Formato de email inválido
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fecha_nacimiento">
                          Fecha de Nacimiento
                        </Label>
                        <Input
                          id="fecha_nacimiento"
                          type="date"
                          value={formData.fecha_nacimiento}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fecha_nacimiento: e.target.value,
                            })
                          }
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tipo_sangre">Tipo de Sangre</Label>
                        <Select
                          value={formData.tipo_sangre}
                          onValueChange={(value) =>
                            setFormData({ ...formData, tipo_sangre: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Textarea
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            direccion: e.target.value,
                          })
                        }
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="fotografia" className="space-y-6 mt-6">
                    {/* Fotografía del Operador */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Fotografía del Operador
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="foto-operador"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            {fotoOperadorUrl ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={fotoOperadorUrl || "/placeholder.svg"}
                                  alt="Fotografía del operador"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setFotoOperador(null);
                                    URL.revokeObjectURL(fotoOperadorUrl);
                                    setFotoOperadorUrl("");
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImageIcon className="w-8 h-8 mb-4 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">
                                    Click para subir
                                  </span>{" "}
                                  la fotografía del operador
                                </p>
                                <p className="text-xs text-gray-500">
                                  PNG, JPG, GIF hasta 5MB
                                </p>
                              </div>
                            )}
                            <input
                              id="foto-operador"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFotoOperadorSelect}
                              disabled={uploadingFoto}
                            />
                          </label>
                        </div>

                        {uploadingFoto && (
                          <div className="flex items-center justify-center py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-sm text-gray-600">
                              Subiendo fotografía...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documentos Básicos */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Documentos Básicos (Máximo 9)
                      </h3>

                      <div className="space-y-4">
                        {/* Selector de archivos */}
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="documentos-basicos"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FileText className="w-8 h-8 mb-4 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">
                                  Click para subir
                                </span>{" "}
                                documentos básicos
                              </p>
                              <p className="text-xs text-gray-500">
                                Imágenes y PDFs hasta 10MB cada uno (
                                {documentosBasicos.length}/9)
                              </p>
                            </div>
                            <input
                              id="documentos-basicos"
                              type="file"
                              className="hidden"
                              accept="image/*,.pdf"
                              multiple
                              onChange={handleDocumentosBasicosSelect}
                              disabled={
                                uploadingDocumentos ||
                                documentosBasicos.length >= 9
                              }
                            />
                          </label>
                        </div>

                        {/* Vista previa de documentos */}
                        {documentosBasicos.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {documentosBasicos.map((documento, index) => (
                              <div
                                key={index}
                                className="relative border rounded-lg p-2 bg-white"
                              >
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                                  {documento.type.startsWith("image/") ? (
                                    <img
                                      src={
                                        documentosBasicosUrls[index] ||
                                        "/placeholder.svg"
                                      }
                                      alt={documento.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full">
                                      <FileText className="h-12 w-12 text-gray-400" />
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs font-medium truncate mb-1">
                                  {documento.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(documento.size)}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => eliminarDocumentoBasico(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  disabled={uploadingDocumentos}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {uploadingDocumentos && (
                          <div className="flex items-center justify-center py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-sm text-gray-600">
                              Subiendo documentos...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documentos" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="curp">CURP</Label>
                        <Input
                          id="curp"
                          value={formData.curp}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              curp: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="18 Caracteres"
                          maxLength={18}
                        />
                        {formData.curp && !validarCURP(formData.curp) && (
                          <p className="text-xs text-red-500">
                            CURP inválida. Debe tener 18 caracteres y formato
                            mexicano.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rfc">RFC</Label>
                        <Input
                          id="rfc"
                          value={formData.rfc}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              rfc: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="13 Caracteres"
                          maxLength={13}
                        />
                        {formData.rfc && !validarRFC(formData.rfc) && (
                          <p className="text-xs text-red-500">
                            RFC inválido. Debe tener 12 o 13 caracteres y
                            formato mexicano.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nss">NSS</Label>
                        <Input
                          id="nss"
                          value={formData.nss}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nss: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          placeholder="11 Caracteres"
                          maxLength={11}
                        />
                        {formData.nss && !validarNSS(formData.nss) && (
                          <p className="text-xs text-red-500">
                            NSS inválido. Debe tener 11 dígitos.
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="licencias" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="licencia">Número de Licencia</Label>
                        <Input
                          id="licencia"
                          value={formData.licencia}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              licencia: e.target.value,
                            })
                          }
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fecha_vencimiento_licencia">
                          Vencimiento Licencia
                        </Label>
                        <Input
                          id="fecha_vencimiento_licencia"
                          type="date"
                          value={formData.fecha_vencimiento_licencia}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fecha_vencimiento_licencia: e.target.value,
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero_apto_medico">Apto Médico</Label>
                        <Input
                          id="numero_apto_medico"
                          value={formData.numero_apto_medico}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              numero_apto_medico: e.target.value,
                            })
                          }
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fecha_vencimiento_apto_medico">
                          Vencimiento Apto Médico
                        </Label>
                        <Input
                          id="fecha_vencimiento_apto_medico"
                          type="date"
                          value={formData.fecha_vencimiento_apto_medico}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fecha_vencimiento_apto_medico: e.target.value,
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero_visa">Número de Visa</Label>
                        <Input
                          id="numero_visa"
                          value={formData.numero_visa}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              numero_visa: e.target.value,
                            })
                          }
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fecha_vencimiento_visa">
                          Vencimiento Visa
                        </Label>
                        <Input
                          id="fecha_vencimiento_visa"
                          type="date"
                          value={formData.fecha_vencimiento_visa}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fecha_vencimiento_visa: e.target.value,
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero_fast">Número FAST</Label>
                        <Input
                          id="numero_fast"
                          value={formData.numero_fast}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              numero_fast: e.target.value,
                            })
                          }
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fecha_vencimiento_fast">
                          Vencimiento FAST
                        </Label>
                        <Input
                          id="fecha_vencimiento_fast"
                          type="date"
                          value={formData.fecha_vencimiento_fast}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fecha_vencimiento_fast: e.target.value,
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="emergencia" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="telefono_emergencia">
                        Teléfono de Emergencia Principal
                      </Label>
                      <Input
                        id="telefono_emergencia"
                        value={formData.telefono_emergencia}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            telefono_emergencia: e.target.value,
                          })
                        }
                        placeholder="Ej: +52 123 456 7890"
                        maxLength={20}
                      />
                      {formData.telefono_emergencia &&
                        !validarTelefono(formData.telefono_emergencia) && (
                          <p className="text-xs text-red-500">
                            Formato de teléfono inválido
                          </p>
                        )}
                    </div>

                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                          Contactos de Emergencia (Máximo 5)
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Capture la información de las personas a contactar en
                          caso de emergencia
                        </p>

                        {contactosEmergencia.map((contacto, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 space-y-4 bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-700">
                                Contacto {index + 1}
                              </h5>
                              {(contacto.nombre ||
                                contacto.telefono ||
                                contacto.correo) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const nuevosContactos = [
                                      ...contactosEmergencia,
                                    ];
                                    nuevosContactos[index] = {
                                      nombre: "",
                                      relacion: "",
                                      direccion: "",
                                      telefono: "",
                                      correo: "",
                                    };
                                    setContactosEmergencia(nuevosContactos);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`contacto_nombre_${index}`}>
                                  Nombre Completo
                                </Label>
                                <Input
                                  id={`contacto_nombre_${index}`}
                                  value={contacto.nombre}
                                  onChange={(e) =>
                                    actualizarContactoEmergencia(
                                      index,
                                      "nombre",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ej: Juan Pérez García"
                                  maxLength={100}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`contacto_relacion_${index}`}>
                                  Relación
                                </Label>
                                <Select
                                  value={contacto.relacion}
                                  onValueChange={(value) =>
                                    actualizarContactoEmergencia(
                                      index,
                                      "relacion",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar relación" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="padre">Padre</SelectItem>
                                    <SelectItem value="madre">Madre</SelectItem>
                                    <SelectItem value="esposo">
                                      Esposo
                                    </SelectItem>
                                    <SelectItem value="esposa">
                                      Esposa
                                    </SelectItem>
                                    <SelectItem value="hijo">Hijo</SelectItem>
                                    <SelectItem value="hija">Hija</SelectItem>
                                    <SelectItem value="hermano">
                                      Hermano
                                    </SelectItem>
                                    <SelectItem value="hermana">
                                      Hermana
                                    </SelectItem>
                                    <SelectItem value="abuelo">
                                      Abuelo
                                    </SelectItem>
                                    <SelectItem value="abuela">
                                      Abuela
                                    </SelectItem>
                                    <SelectItem value="tio">Tío</SelectItem>
                                    <SelectItem value="tia">Tía</SelectItem>
                                    <SelectItem value="primo">Primo</SelectItem>
                                    <SelectItem value="prima">Prima</SelectItem>
                                    <SelectItem value="amigo">Amigo</SelectItem>
                                    <SelectItem value="vecino">
                                      Vecino
                                    </SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`contacto_telefono_${index}`}>
                                  Teléfono
                                </Label>
                                <Input
                                  id={`contacto_telefono_${index}`}
                                  value={contacto.telefono}
                                  onChange={(e) =>
                                    actualizarContactoEmergencia(
                                      index,
                                      "telefono",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ej: +52 123 456 7890"
                                  maxLength={20}
                                />
                                {contacto.telefono &&
                                  !validarTelefono(contacto.telefono) && (
                                    <p className="text-xs text-red-500">
                                      Formato de teléfono inválido
                                    </p>
                                  )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`contacto_correo_${index}`}>
                                  Correo Electrónico
                                </Label>
                                <Input
                                  id={`contacto_correo_${index}`}
                                  type="email"
                                  value={contacto.correo}
                                  onChange={(e) =>
                                    actualizarContactoEmergencia(
                                      index,
                                      "correo",
                                      e.target.value
                                    )
                                  }
                                  placeholder="ejemplo@correo.com"
                                  maxLength={100}
                                />
                                {contacto.correo &&
                                  !validarEmail(contacto.correo) && (
                                    <p className="text-xs text-red-500">
                                      Formato de email inválido
                                    </p>
                                  )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`contacto_direccion_${index}`}>
                                Dirección
                              </Label>
                              <Textarea
                                id={`contacto_direccion_${index}`}
                                value={contacto.direccion}
                                onChange={(e) =>
                                  actualizarContactoEmergencia(
                                    index,
                                    "direccion",
                                    e.target.value
                                  )
                                }
                                placeholder="Dirección completa del contacto"
                                rows={2}
                                maxLength={300}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="observaciones" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        value={formData.observaciones}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            observaciones: e.target.value,
                          })
                        }
                        rows={4}
                        placeholder="Notas adicionales sobre el operador..."
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500">
                        {formData.observaciones.length}/1000 caracteres
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : editingId ? (
                      "Actualizar"
                    ) : (
                      "Crear"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles con Pestañas */}
      {showDetailsModal && operadorDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Detalles del Operador
                </h2>
                <p className="text-sm text-gray-600">
                  {operadorDetalle.nombre} {operadorDetalle.apellidos}
                  {operadorDetalle.alias && (
                    <span className="text-blue-600 ml-2">
                      "{operadorDetalle.alias}"
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={() => setShowDetailsModal(false)}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                {/* Tab Navigation */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="general"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Información General
                    </TabsTrigger>
                    <TabsTrigger
                      value="documentos"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Documentos ({documentos.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="subir"
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Subir Documentos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-6 mt-6">
                    {/* Información Personal */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Información Personal
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Nombre
                          </label>
                          <p className="text-sm font-medium text-gray-900">
                            {operadorDetalle.nombre} {operadorDetalle.apellidos}
                          </p>
                        </div>
                        {operadorDetalle.alias && (
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Alias
                            </label>
                            <p className="text-sm font-medium text-blue-600">
                              "{operadorDetalle.alias}"
                            </p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Teléfono
                          </label>
                          <p className="text-sm text-gray-700">
                            {operadorDetalle.telefono || "No especificado"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Email
                          </label>
                          <p className="text-sm text-gray-700">
                            {operadorDetalle.email || "No especificado"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Estado
                          </label>
                          <div className="flex items-center">
                            {getEstadoBadge(operadorDetalle.estado)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Fecha Nacimiento
                          </label>
                          <p className="text-sm text-gray-700">
                            {operadorDetalle.fecha_nacimiento
                              ? new Date(
                                  operadorDetalle.fecha_nacimiento
                                ).toLocaleDateString()
                              : "No especificada"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Tipo de Sangre
                          </label>
                          <p className="text-sm text-gray-700">
                            {operadorDetalle.tipo_sangre || "No especificado"}
                          </p>
                        </div>
                      </div>
                      {operadorDetalle.direccion && (
                        <div className="mt-4 space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Dirección
                          </label>
                          <p className="text-sm text-gray-700">
                            {operadorDetalle.direccion}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Documentos Oficiales */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Documentos Oficiales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            CURP
                          </label>
                          <p className="text-sm font-mono text-gray-900">
                            {operadorDetalle.curp || "No especificado"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            RFC
                          </label>
                          <p className="text-sm font-mono text-gray-900">
                            {operadorDetalle.rfc || "No especificado"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            NSS
                          </label>
                          <p className="text-sm font-mono text-gray-900">
                            {operadorDetalle.nss || "No especificado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Licencias y Permisos */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Licencias y Permisos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Licencia de Conducir
                            </h4>
                            <p className="text-sm font-mono text-gray-900">
                              {operadorDetalle.licencia || "No especificada"}
                            </p>
                            {operadorDetalle.fecha_vencimiento_licencia && (
                              <p className="text-xs text-gray-500 mt-1">
                                Vence:{" "}
                                {new Date(
                                  operadorDetalle.fecha_vencimiento_licencia
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Visa
                            </h4>
                            <p className="text-sm font-mono text-gray-900">
                              {operadorDetalle.numero_visa || "No especificada"}
                            </p>
                            {operadorDetalle.fecha_vencimiento_visa && (
                              <p className="text-xs text-gray-500 mt-1">
                                Vence:{" "}
                                {new Date(
                                  operadorDetalle.fecha_vencimiento_visa
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Apto Médico
                            </h4>
                            <p className="text-sm font-mono text-gray-900">
                              {operadorDetalle.numero_apto_medico ||
                                "No especificado"}
                            </p>
                            {operadorDetalle.fecha_vencimiento_apto_medico && (
                              <p className="text-xs text-gray-500 mt-1">
                                Vence:{" "}
                                {new Date(
                                  operadorDetalle.fecha_vencimiento_apto_medico
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              FAST
                            </h4>
                            <p className="text-sm font-mono text-gray-900">
                              {operadorDetalle.numero_fast || "No especificado"}
                            </p>
                            {operadorDetalle.fecha_vencimiento_fast && (
                              <p className="text-xs text-gray-500 mt-1">
                                Vence:{" "}
                                {new Date(
                                  operadorDetalle.fecha_vencimiento_fast
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Observaciones */}
                    {operadorDetalle.observaciones && (
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                          Observaciones
                        </h3>
                        <div className="bg-gray-50 border rounded-lg p-4">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {operadorDetalle.observaciones}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="documentos" className="space-y-6 mt-6">
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Documentos Digitales ({documentos.length})
                      </h3>
                      {loadingDocumentos ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-gray-600">
                            Cargando documentos...
                          </span>
                        </div>
                      ) : documentos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">
                            No hay documentos subidos
                          </p>
                          <p className="text-sm mt-1">
                            Los documentos aparecerán aquí una vez que los subas
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Fotografía del operador */}
                          {documentos.filter(
                            (doc) =>
                              doc.tipo_documento === "fotografia_operador"
                          ).length > 0 && (
                            <div>
                              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                <ImageIcon className="h-4 w-4 mr-2 text-blue-600" />
                                Fotografía del Operador
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documentos
                                  .filter(
                                    (doc) =>
                                      doc.tipo_documento ===
                                      "fotografia_operador"
                                  )
                                  .map((documento) => (
                                    <div
                                      key={documento.id}
                                      className="border rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow"
                                    >
                                      {/* Vista previa */}
                                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                                        <img
                                          src={
                                            documento.url_blob ||
                                            "/placeholder.svg"
                                          }
                                          alt={documento.nombre_archivo}
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() =>
                                            window.open(
                                              documento.url_blob,
                                              "_blank"
                                            )
                                          }
                                          onError={(e) => {
                                            e.currentTarget.src =
                                              "/placeholder.svg?height=200&width=300&text=Error+cargando+imagen";
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <div className="text-white text-center">
                                            <Eye className="h-6 w-6 mx-auto mb-1" />
                                            <span className="text-xs">
                                              Click para ver
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Información del documento */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                                            FOTOGRAFÍA
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            {documento.tamano_bytes &&
                                              formatFileSize(
                                                documento.tamano_bytes
                                              )}
                                          </span>
                                        </div>

                                        <p className="text-sm font-medium truncate">
                                          {documento.nombre_archivo}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                          {new Date(
                                            documento.fecha_subida
                                          ).toLocaleDateString()}{" "}
                                          a las{" "}
                                          {new Date(
                                            documento.fecha_subida
                                          ).toLocaleTimeString()}
                                        </p>

                                        {documento.notas && (
                                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            {documento.notas}
                                          </p>
                                        )}

                                        {/* Acciones */}
                                        <div className="flex space-x-2 pt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() =>
                                              window.open(
                                                documento.url_blob,
                                                "_blank"
                                              )
                                            }
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ver
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() => {
                                              const link =
                                                document.createElement("a");
                                              link.href = documento.url_blob;
                                              link.download =
                                                documento.nombre_archivo;
                                              link.target = "_blank";
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Descargar
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  ¿Eliminar documento?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Esta acción no se puede
                                                  deshacer. El documento se
                                                  eliminará permanentemente.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancelar
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    eliminarDocumento(documento)
                                                  }
                                                >
                                                  Eliminar
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Documentos básicos */}
                          {documentos.filter((doc) =>
                            doc.tipo_documento.startsWith("documento_basico_")
                          ).length > 0 && (
                            <div>
                              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-green-600" />
                                Documentos Básicos
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documentos
                                  .filter((doc) =>
                                    doc.tipo_documento.startsWith(
                                      "documento_basico_"
                                    )
                                  )
                                  .map((documento) => (
                                    <div
                                      key={documento.id}
                                      className="border rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow"
                                    >
                                      {/* Vista previa */}
                                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group">
                                        {documento.tipo_mime?.startsWith(
                                          "image/"
                                        ) ? (
                                          <img
                                            src={
                                              documento.url_blob ||
                                              "/placeholder.svg"
                                            }
                                            alt={documento.nombre_archivo}
                                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() =>
                                              window.open(
                                                documento.url_blob,
                                                "_blank"
                                              )
                                            }
                                            onError={(e) => {
                                              e.currentTarget.src =
                                                "/placeholder.svg?height=200&width=300&text=Error+cargando+imagen";
                                            }}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center h-full bg-gray-50">
                                            <div className="text-center">
                                              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                                              <span className="text-sm text-gray-500">
                                                {documento.tipo_mime?.includes(
                                                  "pdf"
                                                )
                                                  ? "PDF"
                                                  : "Archivo"}
                                              </span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Overlay con información */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <div className="text-white text-center">
                                            <Eye className="h-6 w-6 mx-auto mb-1" />
                                            <span className="text-xs">
                                              Click para ver
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Información del documento */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Badge className="bg-green-100 text-green-800 text-xs">
                                            DOCUMENTO BÁSICO
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            {documento.tamano_bytes &&
                                              formatFileSize(
                                                documento.tamano_bytes
                                              )}
                                          </span>
                                        </div>

                                        <p className="text-sm font-medium truncate">
                                          {documento.nombre_archivo}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                          {new Date(
                                            documento.fecha_subida
                                          ).toLocaleDateString()}{" "}
                                          a las{" "}
                                          {new Date(
                                            documento.fecha_subida
                                          ).toLocaleTimeString()}
                                        </p>

                                        {documento.notas && (
                                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            {documento.notas}
                                          </p>
                                        )}

                                        {/* Acciones */}
                                        <div className="flex space-x-2 pt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() =>
                                              window.open(
                                                documento.url_blob,
                                                "_blank"
                                              )
                                            }
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ver
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() => {
                                              const link =
                                                document.createElement("a");
                                              link.href = documento.url_blob;
                                              link.download =
                                                documento.nombre_archivo;
                                              link.target = "_blank";
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Descargar
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  ¿Eliminar documento?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Esta acción no se puede
                                                  deshacer. El documento se
                                                  eliminará permanentemente.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancelar
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    eliminarDocumento(documento)
                                                  }
                                                >
                                                  Eliminar
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Otros documentos */}
                          {documentos.filter(
                            (doc) =>
                              !doc.tipo_documento.startsWith(
                                "documento_basico_"
                              ) && doc.tipo_documento !== "fotografia_operador"
                          ).length > 0 && (
                            <div>
                              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-purple-600" />
                                Otros Documentos
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documentos
                                  .filter(
                                    (doc) =>
                                      !doc.tipo_documento.startsWith(
                                        "documento_basico_"
                                      ) &&
                                      doc.tipo_documento !==
                                        "fotografia_operador"
                                  )
                                  .map((documento) => (
                                    <div
                                      key={documento.id}
                                      className="border rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow"
                                    >
                                      {/* Vista previa */}
                                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group">
                                        {documento.tipo_mime?.startsWith(
                                          "image/"
                                        ) ? (
                                          <img
                                            src={
                                              documento.url_blob ||
                                              "/placeholder.svg"
                                            }
                                            alt={documento.nombre_archivo}
                                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() =>
                                              window.open(
                                                documento.url_blob,
                                                "_blank"
                                              )
                                            }
                                            onError={(e) => {
                                              e.currentTarget.src =
                                                "/placeholder.svg?height=200&width=300&text=Error+cargando+imagen";
                                            }}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center h-full bg-gray-50">
                                            <div className="text-center">
                                              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                                              <span className="text-sm text-gray-500">
                                                {documento.tipo_mime?.includes(
                                                  "pdf"
                                                )
                                                  ? "PDF"
                                                  : "Archivo"}
                                              </span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Overlay con información */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <div className="text-white text-center">
                                            <Eye className="h-6 w-6 mx-auto mb-1" />
                                            <span className="text-xs">
                                              Click para ver
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Información del documento */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {documento.tipo_documento
                                              .replace("_", " ")
                                              .toUpperCase()}
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            {documento.tamano_bytes &&
                                              formatFileSize(
                                                documento.tamano_bytes
                                              )}
                                          </span>
                                        </div>

                                        <p className="text-sm font-medium truncate">
                                          {documento.nombre_archivo}
                                        </p>

                                        {documento.numero_documento && (
                                          <p className="text-xs text-gray-600">
                                            Número: {documento.numero_documento}
                                          </p>
                                        )}

                                        {documento.fecha_vencimiento && (
                                          <p className="text-xs text-gray-600">
                                            Vence:{" "}
                                            {new Date(
                                              documento.fecha_vencimiento
                                            ).toLocaleDateString()}
                                          </p>
                                        )}

                                        <p className="text-xs text-gray-400">
                                          {new Date(
                                            documento.fecha_subida
                                          ).toLocaleDateString()}{" "}
                                          a las{" "}
                                          {new Date(
                                            documento.fecha_subida
                                          ).toLocaleTimeString()}
                                        </p>

                                        {documento.notas && (
                                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            {documento.notas}
                                          </p>
                                        )}

                                        {/* Acciones */}
                                        <div className="flex space-x-2 pt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() =>
                                              window.open(
                                                documento.url_blob,
                                                "_blank"
                                              )
                                            }
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ver
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-transparent"
                                            onClick={() => {
                                              const link =
                                                document.createElement("a");
                                              link.href = documento.url_blob;
                                              link.download =
                                                documento.nombre_archivo;
                                              link.target = "_blank";
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Descargar
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  ¿Eliminar documento?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Esta acción no se puede
                                                  deshacer. El documento se
                                                  eliminará permanentemente.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancelar
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    eliminarDocumento(documento)
                                                  }
                                                >
                                                  Eliminar
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="subir" className="space-y-6 mt-6">
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                        Subir Nuevo Documento
                      </h3>

                      <div className="space-y-4">
                        {/* Tipo de documento */}
                        <div className="space-y-2">
                          <Label htmlFor="tipo_documento">
                            Tipo de Documento *
                          </Label>
                          <Select
                            value={tipoDocumento}
                            onValueChange={setTipoDocumento}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo de documento" />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposDocumento.map((tipo) => (
                                <SelectItem key={tipo} value={tipo}>
                                  {tipo.replace("_", " ").toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Selector de archivo */}
                        <div className="space-y-2">
                          <Label htmlFor="archivo">Archivo *</Label>
                          <Input
                            id="archivo"
                            type="file"
                            onChange={handleFileSelect}
                            accept="image/*,.pdf"
                            disabled={uploadingDoc}
                          />
                        </div>

                        {/* Número de documento */}
                        <div className="space-y-2">
                          <Label htmlFor="numero_documento">
                            Número de Documento
                          </Label>
                          <Input
                            id="numero_documento"
                            value={numeroDocumento}
                            onChange={(e) => setNumeroDocumento(e.target.value)}
                            placeholder="Ej: 123456789"
                          />
                        </div>

                        {/* Fecha de vencimiento */}
                        <div className="space-y-2">
                          <Label htmlFor="fecha_vencimiento">
                            Fecha de Vencimiento
                          </Label>
                          <Input
                            id="fecha_vencimiento"
                            type="date"
                            value={fechaVencimiento}
                            onChange={(e) =>
                              setFechaVencimiento(e.target.value)
                            }
                          />
                        </div>

                        {/* Vista previa del archivo seleccionado */}
                        {selectedFile && (
                          <div className="space-y-2">
                            <Label>Archivo Seleccionado</Label>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                              <div className="flex items-center space-x-2">
                                {selectedFile.type.startsWith("image/") ? (
                                  <ImageIcon className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <FileText className="h-5 w-5 text-red-500" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">
                                    {selectedFile.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(selectedFile.size)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedFile(null)}
                                disabled={uploadingDoc}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Notas */}
                        <div className="space-y-2">
                          <Label htmlFor="notas_documento">Notas</Label>
                          <Textarea
                            id="notas_documento"
                            value={notasDocumento}
                            onChange={(e) => setNotasDocumento(e.target.value)}
                            rows={3}
                            placeholder="Información adicional sobre el documento..."
                          />
                        </div>

                        {/* Botón de subida */}
                        <Button
                          onClick={subirDocumento}
                          disabled={uploadingDoc}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {uploadingDoc ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Subir Documento
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
