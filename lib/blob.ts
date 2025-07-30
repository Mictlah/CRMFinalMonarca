import { del, list } from "@vercel/blob"

export async function subirFotoEmbarque(
  file: File,
  folioEmbarque: string,
  operador: string,
): Promise<{ url: string; pathname: string }> {
  try {
    // Crear nombre único para el archivo
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const nombreArchivo = `embarques/${folioEmbarque}/${timestamp}-${operador}.${extension}`

    // Usar la API route para subir el archivo
    const formData = new FormData()
    formData.append("file", file)
    formData.append("fileName", nombreArchivo)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al subir archivo")
    }

    const result = await response.json()
    return {
      url: result.url,
      pathname: result.pathname,
    }
  } catch (error) {
    console.error("Error al subir foto:", error)
    throw new Error("Error al subir la foto")
  }
}

export const eliminarFotoEmbarque = async (pathname: string): Promise<boolean> => {
  try {
    if (!pathname) {
      throw new Error("Pathname is required for deletion")
    }

    await del(pathname, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return true
  } catch (error) {
    console.error("Error eliminando archivo de Vercel Blob:", error)
    throw error
  }
}

export async function listarFotosEmbarque(folioEmbarque: string) {
  try {
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

export async function uploadFile(fileName: string, file: File): Promise<{ url: string; pathname: string }> {
  try {
    console.log("Subiendo archivo a través de API:", fileName)

    // Usar la API route para subir el archivo
    const formData = new FormData()
    formData.append("file", file)
    formData.append("fileName", fileName)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error al subir archivo")
    }

    const result = await response.json()
    console.log("Archivo subido exitosamente:", result.url)

    return {
      url: result.url,
      pathname: result.pathname,
    }
  } catch (error) {
    console.error("Error al subir archivo:", error)
    throw new Error(`Error al subir el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
  }
}
