import * as XLSX from "xlsx";
import { Operador } from "@/lib/supabase";

export function exportOperadoresToExcel(operadores: Operador[]) {
  // Definir cabeceras en el orden solicitado
  const headers = [
    "id",
    "nombre",
    "apellidos",
    "fecha de nacimiento",
    "direccion",
    "telefono",
    "email",
    "curp",
    "rfc",
    "nss",
    "licencia de conducir",
    "vencimiento de lic. de conducir",
    "apto medico",
    "vencimiento apto medico",
    "visa",
    "vencimiento visa",
    "fast",
    "vencimiento fast",
    "contacto de emergencia",
    "telefonos de emergencia",
    "observaciones",
    "estado",
    "fecha de registro",
  ];

  // Construir filas en el mismo orden
  const rows = operadores.map((op) => {
    // Normalizar contactos de emergencia a una cadena legible (nombres)
    let contactos = "";
    try {
      if (op.contactos_emergencia) {
        const parsed = typeof op.contactos_emergencia === "string" ? JSON.parse(op.contactos_emergencia) : op.contactos_emergencia;
        if (Array.isArray(parsed)) {
          contactos = parsed.map((c: any) => c.nombre || "").filter(Boolean).join(", ");
        } else if (typeof parsed === "string") {
          contactos = parsed;
        }
      }
    } catch (e) {
      contactos = String(op.contactos_emergencia || "");
    }

    const telefonosEmergencia = op.telefono_emergencia || "";

    return [
      op.id,
      op.nombre || "",
      op.apellidos || "",
      op.fecha_nacimiento || "",
      op.direccion || "",
      op.telefono || "",
      op.email || "",
      op.curp || "",
      op.rfc || "",
      op.nss || "",
      op.licencia || "",
      op.fecha_vencimiento_licencia || "",
      op.numero_apto_medico || "",
      op.fecha_vencimiento_apto_medico || "",
      op.numero_visa || "",
      op.fecha_vencimiento_visa || "",
      op.numero_fast || "",
      op.fecha_vencimiento_fast || "",
      contactos,
      telefonosEmergencia,
      op.observaciones || "",
      op.estado || "",
      op.fecha_registro || "",
    ];
  });

  // Crear hoja con encabezado y filas
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Operadores");
  XLSX.writeFile(wb, "operadores.xlsx");
}

// Exportar un solo operador con el mismo orden de columnas que el reporte general
export function exportOperadorDetalleToExcel(op: Operador) {
  const headers = [
    "id",
    "nombre",
    "apellidos",
    "fecha de nacimiento",
    "direccion",
    "telefono",
    "email",
    "curp",
    "rfc",
    "nss",
    "licencia de conducir",
    "vencimiento de lic. de conducir",
    "apto medico",
    "vencimiento apto medico",
    "visa",
    "vencimiento visa",
    "fast",
    "vencimiento fast",
    "contacto de emergencia",
    "telefonos de emergencia",
    "observaciones",
    "estado",
    "fecha de registro",
  ];

  // Normalizar contactos de emergencia a una cadena legible (nombres)
  let contactos = "";
  try {
    if (op.contactos_emergencia) {
      const parsed = typeof op.contactos_emergencia === "string" ? JSON.parse(op.contactos_emergencia) : op.contactos_emergencia;
      if (Array.isArray(parsed)) {
        contactos = parsed.map((c: any) => c?.nombre || "").filter(Boolean).join(", ");
      } else if (typeof parsed === "string") {
        contactos = parsed;
      }
    }
  } catch (e) {
    contactos = String(op.contactos_emergencia || "");
  }

  const telefonosEmergencia = (op as any).telefono_emergencia || "";

  const row = [
    op.id,
    op.nombre || "",
    op.apellidos || "",
    op.fecha_nacimiento || "",
    op.direccion || "",
    op.telefono || "",
    op.email || "",
    op.curp || "",
    op.rfc || "",
    op.nss || "",
    op.licencia || "",
    op.fecha_vencimiento_licencia || "",
    op.numero_apto_medico || "",
    op.fecha_vencimiento_apto_medico || "",
    op.numero_visa || "",
    op.fecha_vencimiento_visa || "",
    op.numero_fast || "",
    op.fecha_vencimiento_fast || "",
    contactos,
    telefonosEmergencia,
    (op.observaciones as any) || "",
    op.estado || "",
    (op as any).fecha_registro || "",
  ];

  const aoa = [headers, row];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Operador");
  XLSX.writeFile(wb, `operador_${op.id}.xlsx`);
}
