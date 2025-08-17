import * as XLSX from "xlsx";
import { Operador } from "@/lib/supabase";

export function exportOperadoresToExcel(operadores: Operador[]) {
  const data = operadores.map((op) => ({
    ID: op.id,
    Nombre: op.nombre,
    Apellidos: op.apellidos,
    Teléfono: op.telefono,
    Email: op.email,
    Licencia: op.licencia,
    "Vencimiento Licencia": op.fecha_vencimiento_licencia,
    "Apto Médico": op.numero_apto_medico,
    "Vencimiento Apto Médico": op.fecha_vencimiento_apto_medico,
    Visa: op.numero_visa,
    "Vencimiento Visa": op.fecha_vencimiento_visa,
    FAST: op.numero_fast,
    "Vencimiento FAST": op.fecha_vencimiento_fast,
    "Tipo Sangre": op.tipo_sangre,
    Dirección: op.direccion,
    "Fecha Nacimiento": op.fecha_nacimiento,
    CURP: op.curp,
    RFC: op.rfc,
    NSS: op.nss,
    "Teléfono Emergencia": op.telefono_emergencia,
    "Contactos Emergencia": op.contactos_emergencia,
    Observaciones: op.observaciones,
    Estado: op.estado,
    "Fecha Registro": op.fecha_registro,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Operadores");
  XLSX.writeFile(wb, "operadores.xlsx");
}
