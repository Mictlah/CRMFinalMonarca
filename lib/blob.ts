import { put, del, list } from "@vercel/blob"

// Función para subir fotos desde el servidor (Server Action)
export async function subirFotoEmbarqueServidor(
  file: File,
  folioEmbarque: string,
  operadorNombre: string,
): Promise<{ url: string; pathname: string }> {
  try {
    console.log("=== INICIANDO SUBIDA EN SERVIDOR ===")
    console.log("Archivo:", file.name, "Tamaño:", file.size, "Tipo:", file.type)

    // Verificar que tenemos el token (solo disponible en servidor)
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Token de Vercel Blob no configurado en servidor")
    }

    // Crear nombre único para el archivo
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "jpg"
    const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const pathname = `embarques/${folioEmbarque}/${timestamp}-${nombreLimpio}`

    console.log("Pathname generado:", pathname)

    // Subir a Vercel Blob usando el token del servidor
    const blob = await put(pathname, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Blob subido exitosamente:", blob.url)
    console.log("=== FIN SUBIDA EN SERVIDOR ===")

    return {
      url: blob.url,
      pathname: blob.pathname,
    }
  } catch (error) {
    console.error("Error en subida en servidor:", error)
    throw new Error(`Error al subir archivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
  }
}

// Función legacy para compatibilidad (redirige a la función del servidor)
export async function subirFotoEmbarque(
  file: File,
  folioEmbarque: string,
  operador: string,
): Promise<{ url: string; pathname: string }> {
  return subirFotoEmbarqueServidor(file, folioEmbarque, operador)
}

export async function eliminarFotoEmbarque(pathname: string): Promise<void> {
  try {
    console.log("Eliminando archivo de blob:", pathname)

    if (!pathname) {
      throw new Error("Pathname requerido para eliminación")
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Token de Vercel Blob no configurado en servidor")
    }

    await del(pathname, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Archivo eliminado exitosamente")
  } catch (error) {
    console.error("Error eliminando archivo de Vercel Blob:", error)
    throw error
  }
}

export async function listarFotosEmbarque(folioEmbarque: string) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Token de Vercel Blob no configurado en servidor")
    }

    const { blobs } = await list({
      prefix: `embarques/${folioEmbarque}/`,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return blobs
  } catch (error) {
    console.error("Error al listar fotos:", error)
    throw new Error("Error al obtener las fotos")
  }
}

// Función genérica para subir archivos (para compatibilidad)
export async function uploadFile(fileName: string, file: File): Promise<{ url: string; pathname: string }> {
  try {
    console.log("Subiendo archivo genérico:", fileName)

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Token de Vercel Blob no configurado en servidor")
    }

    // Subir a Vercel Blob usando el token del servidor
    const blob = await put(fileName, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Archivo genérico subido exitosamente:", blob.url)

    return {
      url: blob.url,
      pathname: blob.pathname,
    }
  } catch (error) {
    console.error("Error al subir archivo genérico:", error)
    throw new Error(`Error al subir el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
  }
}
