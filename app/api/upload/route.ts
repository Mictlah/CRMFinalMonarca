import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log("=== INICIO UPLOAD API ===")

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    console.log("Filename recibido:", filename)

    if (!filename) {
      console.error("Error: Filename no proporcionado")
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    // Verificar token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("Error: BLOB_READ_WRITE_TOKEN no configurado")
      return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    console.log("Archivo recibido:", file ? `${file.name} (${file.size} bytes)` : "null")

    if (!file) {
      console.error("Error: Archivo no encontrado en FormData")
      return NextResponse.json({ error: "File not found in form data" }, { status: 400 })
    }

    // Verificar que es un archivo de imagen
    if (!file.type.startsWith("image/")) {
      console.error("Error: Archivo no es una imagen:", file.type)
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    console.log("Intentando subir a Vercel Blob...")

    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Blob subido exitosamente:", blob)
    console.log("=== FIN UPLOAD API ===")

    return NextResponse.json(blob)
  } catch (error: any) {
    console.error("=== ERROR EN UPLOAD API ===")
    console.error("Error uploading file to Vercel Blob:", error)
    console.error("Error stack:", error.stack)
    console.error("=== FIN ERROR ===")

    return NextResponse.json(
      {
        error: "Failed to upload file to storage",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return new Response("Esta ruta ha sido eliminada. Ahora usamos subida directa.", { status: 404 })
}
