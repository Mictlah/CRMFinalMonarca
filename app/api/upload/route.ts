import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const customFilename = formData.get("fileName") as string | null

  if (!file) {
    return NextResponse.json({ error: "No se proporcionó ningún archivo." }, { status: 400 })
  }

  // Usar el nombre de archivo personalizado si se proporciona, de lo contrario, el nombre original
  const filenameToUse = customFilename || file.name

  try {
    const blob = await put(filenameToUse, file, {
      access: "public",
    })

    // Devolver la respuesta completa del blob, que incluye la URL
    return NextResponse.json(blob)
  } catch (error: any) {
    console.error("Error al subir al blob:", error)
    return NextResponse.json({ error: `Error del servidor: ${error.message}` }, { status: 500 })
  }
}
