import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { confirm } = body || {}
    if (!confirm) {
      return NextResponse.json({ error: "Missing confirmation" }, { status: 400 })
    }

    // Delete order: child tables first to avoid FK issues
    const deletes = [
      // Fotos y confirmaciones relacionadas a embarques
      supabaseAdmin.from("fotos_embarques").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("operador_confirmaciones_embarque").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("embarque_modificaciones").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("historial_estados_facturacion").delete().neq("id", -1),
      supabaseAdmin.from("operador_pagos_contingencia").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("documentos_operadores").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("registros_mantenimiento_remolques").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("registros_mantenimiento").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("registros_kilometraje").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("recordatorios").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("audit_logs").delete().neq("id", -1),
      // Embarques
      supabaseAdmin.from("embarques").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      // Catálogos referenciados por entidades a borrar
      supabaseAdmin.from("contactos_clientes").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("representantes_clientes").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      // Entidades principales
      supabaseAdmin.from("clientes").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("remolques").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("camiones").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabaseAdmin.from("operadores").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    ]

    const results = await Promise.allSettled(deletes)
    const errors = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.status === "rejected" || (r as any).value?.error)
      .map(({ r, i }) => ({ step: i, error: (r as any).reason || (r as any).value.error }))

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Cleanup failed" }, { status: 500 })
  }
}
