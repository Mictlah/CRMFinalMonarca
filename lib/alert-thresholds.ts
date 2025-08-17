// lib/alert-thresholds.ts
import { supabase } from "./supabase";

export interface AlertThreshold {
  id: string;
  modulo: string;
  campo: string;
  dias_rojo: number;
  dias_amarillo: number;
  dias_verde?: number;
}

export async function getAlertThresholds(modulo: string, campo: string): Promise<AlertThreshold | null> {
  const { data, error } = await supabase
    .from("alert_thresholds")
    .select("*")
    .eq("modulo", modulo)
    .eq("campo", campo)
    .single();
  if (error) return null;
  return data as AlertThreshold;
}

export function calcularNivelAlerta(
  fechaVencimiento: string,
  thresholds: { dias_rojo: number; dias_amarillo: number; dias_verde?: number }
): "alta" | "media" | "baja" | "ninguna" {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diffDias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDias <= thresholds.dias_rojo) return "alta";
  if (diffDias <= thresholds.dias_amarillo) return "media";
  if (thresholds.dias_verde !== undefined && diffDias <= thresholds.dias_verde) return "baja";
  return "ninguna";
}
