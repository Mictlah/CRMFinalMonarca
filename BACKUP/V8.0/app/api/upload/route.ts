import { put, del } from "@vercel/blob"
import { NextResponse } from "next/server"

// Forzar runtime dinámico para asegurar lectura de variables de entorno en cada request
export const dynamic = "force-dynamic"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log("Iniciando carga de archivo...")

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const customFilename = formData.get("fileName") as string | null

    if (!file) {
      console.error("No se proporcionó archivo")
      return NextResponse.json({ error: "No se proporcionó ningún archivo." }, { status: 400 })
    }

    console.log("Archivo recibido:", {
      name: file.name,
      size: file.size,
      type: file.type,
      customFilename,
    })

    // Validar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error("Archivo muy grande:", file.size)
      return NextResponse.json({ error: "El archivo es muy grande. Tamaño máximo: 10MB" }, { status: 400 })
    }

    // Validar tipo de archivo
    const tiposPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "application/pdf",
    ]
    if (!tiposPermitidos.includes(file.type)) {
      console.error("Tipo de archivo no permitido:", file.type)
      return NextResponse.json(
        {
          error: "Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, BMP, WebP) y PDFs",
        },
        { status: 400 },
      )
    }

    // Verificar token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("Token de Blob no configurado. Defina BLOB_READ_WRITE_TOKEN en .env.local o en Variables de Entorno de Vercel (scope Server) con permisos read-write.")
      return NextResponse.json({
        error: "Configuración de almacenamiento no disponible",
        hint: "Falta BLOB_READ_WRITE_TOKEN. Genere uno con 'vercel blob token create' y reinicie el servidor.",
      }, { status: 500 })
    }

    // Usar el nombre de archivo personalizado si se proporciona, de lo contrario, el nombre original
    const filenameToUse = customFilename || file.name

    console.log("Subiendo archivo a Blob:", filenameToUse)

    const blob = await put(filenameToUse, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Archivo subido exitosamente:", blob)

    // Devolver la respuesta completa del blob, que incluye la URL
    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    })
  } catch (error: any) {
    console.error("Error al subir al blob:", error)
    return NextResponse.json(
      {
        error: `Error del servidor: ${error.message || "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    console.log("Iniciando eliminación de archivo...")

    const { pathname } = await request.json()

    if (!pathname) {
      console.error("No se proporcionó pathname")
      return NextResponse.json({ error: "No se proporcionó el pathname del archivo." }, { status: 400 })
    }

    // Verificar token de Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("Token de Blob no configurado para eliminación. Defina BLOB_READ_WRITE_TOKEN.")
      return NextResponse.json({ error: "Configuración de almacenamiento no disponible", hint: "Defina BLOB_READ_WRITE_TOKEN" }, { status: 500 })
    }

    console.log("Eliminando archivo de Blob:", pathname)

    await del(pathname, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Archivo eliminado exitosamente")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error al eliminar archivo del blob:", error)
    return NextResponse.json(
      {
        error: `Error del servidor: ${error.message || "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}
