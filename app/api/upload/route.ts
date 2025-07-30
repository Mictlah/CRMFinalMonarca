import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    // Verificar que el token esté disponible
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Token de Vercel Blob no configurado" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string

    if (!file || !fileName) {
      return NextResponse.json({ error: "Archivo o nombre de archivo faltante" }, { status: 400 })
    }

    console.log("Subiendo archivo:", fileName)

    // Subir archivo a Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Archivo subido exitosamente:", blob.url)

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    })
  } catch (error) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json(
      { error: `Error al subir archivo: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
