"use server"

import { subirFotoEmbarqueServidor, eliminarFotoEmbarque } from "@/lib/blob"
import { guardarFotoEmbarque, eliminarFotoEmbarqueDB } from "@/lib/supabase"

export async function subirFotoAction(
  formData: FormData,
  embarqueId: string,
  folioEmbarque: string,
  operadorNombre: string,
) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("No se recibió archivo")
    }

    console.log(`=== SERVER ACTION: Subiendo ${file.name} ===`)

    // Paso 1: Subir a Vercel Blob (función de servidor)
    const { url, pathname } = await subirFotoEmbarqueServidor(file, folioEmbarque, operadorNombre)

    // Paso 2: Guardar registro en Supabase (función de servidor)
    const savedPhoto = await guardarFotoEmbarque({
      embarque_id: embarqueId,
      nombre_archivo: file.name,
      url_blob: url,
      tamano_bytes: file.size,
      tipo_mime: file.type,
      subido_por: operadorNombre,
      pathname_blob: pathname,
    })

    console.log(`=== SERVER ACTION: Completado para ${file.name} ===`)

    return {
      success: true,
      data: {
        id: savedPhoto.id,
        url,
        pathname,
        nombre_archivo: file.name,
      },
    }
  } catch (error: any) {
    console.error("Error en subirFotoAction:", error)
    return {
      success: false,
      error: error.message || "Error desconocido al subir foto",
    }
  }
}

export async function eliminarFotoAction(photoId: string, pathname: string) {
  try {
    console.log(`=== SERVER ACTION: Eliminando foto ${photoId} ===`)

    // Paso 1: Eliminar de Vercel Blob (función de servidor)
    await eliminarFotoEmbarque(pathname)

    // Paso 2: Eliminar registro de Supabase (función de servidor)
    await eliminarFotoEmbarqueDB(photoId)

    console.log(`=== SERVER ACTION: Foto eliminada exitosamente ===`)

    return {
      success: true,
      message: "Foto eliminada exitosamente",
    }
  } catch (error: any) {
    console.error("Error en eliminarFotoAction:", error)
    return {
      success: false,
      error: error.message || "Error desconocido al eliminar foto",
    }
  }
}
