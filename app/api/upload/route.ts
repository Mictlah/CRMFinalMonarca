import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename")

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 })
  }

  const file = request.body as ReadableStream<Uint8Array>

  try {
    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN, // Asegúrate de que esta variable de entorno esté configurada
    })

    return NextResponse.json(blob)
  } catch (error) {
    console.error("Error uploading file to Vercel Blob:", error)
    return NextResponse.json({ error: "Failed to upload file to storage." }, { status: 500 })
  }
}
