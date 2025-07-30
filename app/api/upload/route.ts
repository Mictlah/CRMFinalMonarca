import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializa el cliente de Supabase para operaciones del lado del servidor
// Es CRUCIAL usar SUPABASE_SERVICE_ROLE_KEY para operaciones seguras que modifican la DB
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Aquí puedes añadir lógica de autenticación/autorización si es necesario.
        // El clientPayload puede contener datos adicionales enviados desde el cliente.
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          tokenPayload: JSON.parse(clientPayload || "{}"), // Parsear el clientPayload
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Blob upload completed:", blob)
        // blob contiene: { url, pathname, size, contentType, uploadedAt, ... }
        // tokenPayload contiene los datos que pasamos desde el cliente (embarqueId, operatorName)

        const { embarqueId, operatorName } = tokenPayload as { embarqueId: string; operatorName: string }

        try {
          // Insertar el registro en Supabase después de que el archivo se subió exitosamente a Blob
          const { error } = await supabaseAdmin.from("fotos_embarques").insert({
            embarque_id: embarqueId,
            nombre_archivo: blob.pathname.split("/").pop(), // Extraer el nombre del archivo del pathname
            url_blob: blob.url,
            tamano_bytes: blob.size,
            tipo_mime: blob.contentType,
            fecha_subida: blob.uploadedAt,
            subido_por: operatorName,
            pathname_blob: blob.pathname, // Guardar el pathname para futuras eliminaciones
          })

          if (error) {
            console.error("Error inserting photo record into Supabase:", error)
            throw new Error(`Failed to save photo record to database: ${error.message}`)
          }
          console.log("Photo record saved to Supabase successfully.")
        } catch (dbError) {
          console.error("Database operation failed:", dbError)
          // Relanzar el error para que handleUpload lo capture y devuelva un 400
          throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`)
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }, // El webhook reintentará 5 veces esperando un 200
    )
  }
}
