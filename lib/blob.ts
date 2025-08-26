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
      // Detect server-provided quota/full signal
      let errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        if (errorData?.code === "BLOB_QUOTA_EXCEEDED" || response.status === 507) {
          throw new Error(
            errorData?.error ||
              "El almacenamiento de imágenes está lleno. Avise al administrador para liberar espacio o ampliar el plan."
          )
        }
        throw new Error(errorData?.error || "Error al subir archivo")
      } catch {
        // Fallback if response isn't JSON
        throw new Error(errorText || "Error al subir archivo")
      }
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

export async function eliminarFotoEmbarque(pathname: string): Promise<void> {
  try {
    // Usar la variable de entorno disponible
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.warn("Token de Blob no disponible, saltando eliminación de archivo:", pathname)
      return // No lanzar error, solo advertir
    }

    await del(pathname, {
      token: token,
    })
  } catch (error) {
    console.error("Error al eliminar foto:", error)
    // No lanzar error para evitar que falle toda la eliminación
    console.warn("Continuando con la eliminación a pesar del error en blob storage")
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
      let errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        if (errorData?.code === "BLOB_QUOTA_EXCEEDED" || response.status === 507) {
          throw new Error(
            errorData?.error ||
              "El almacenamiento de imágenes está lleno. Avise al administrador para liberar espacio o ampliar el plan."
          )
        }
        throw new Error(errorData?.error || "Error al subir archivo")
      } catch {
        throw new Error(errorText || "Error al subir archivo")
      }
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

// Nueva función específica para documentos de operadores
export async function subirDocumentoOperador(
  operadorId: string,
  file: File,
  tipoDocumento: string,
  numeroDocumento?: string,
): Promise<{ url: string; pathname: string }> {
  try {
    console.log("Subiendo documento de operador:", { operadorId, tipoDocumento, fileName: file.name })

    // Validar archivo
    if (!file) {
      throw new Error("No se proporcionó archivo")
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("El archivo es muy grande. Tamaño máximo: 10MB")
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
      throw new Error("Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, BMP, WebP) y PDFs")
    }

    // Crear nombre único para el archivo y organizar en subcarpetas por tipo
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()

    // Clasificación de subcarpeta según tipoDocumento
    let subfolder = "otros"
    if (tipoDocumento === "fotografia_operador") subfolder = "fotografia"
    else if (tipoDocumento.startsWith("documento_basico_")) subfolder = "basicos"
    else if (
      [
        "licencia",
        "apto_medico",
        "visa",
        "fast",
        "curp",
        "rfc",
        "nss",
        "ine",
        "pasaporte",
        "comprobante_domicilio",
        "contrato",
        "otro",
      ].includes(tipoDocumento)
    ) {
      subfolder = "oficiales"
    }

    const nombreBase = `${tipoDocumento}_${timestamp}.${extension}`
    const nombreArchivo = `operadores/${operadorId}/${subfolder}/${nombreBase}`

  console.log("Nombre de archivo generado:", nombreArchivo)

    // Usar la API route para subir el archivo
    const formData = new FormData()
    formData.append("file", file)
    formData.append("fileName", nombreArchivo)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      let errorText = await response.text()
      console.error("Error en respuesta del servidor:", errorText)
      try {
        const parsed = JSON.parse(errorText)
        if (parsed?.code === "BLOB_QUOTA_EXCEEDED" || response.status === 507) {
          throw new Error(
            parsed?.error ||
              "El almacenamiento de imágenes está lleno. Contacta al administrador para liberar espacio o ampliar el plan."
          )
        }
        throw new Error(parsed?.error || `Error del servidor: ${response.status}`)
      } catch {
        // Si no es JSON, usar el texto plano
        if (response.status === 507 || /quota|storage|insufficient/i.test(errorText)) {
          throw new Error("El almacenamiento de imágenes está lleno. Contacta al administrador para liberar espacio o ampliar el plan.")
        }
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`)
      }
    }

    const result = await response.json()
    console.log("Documento subido exitosamente:", result)

    return {
      url: result.url,
      pathname: result.pathname,
    }
  } catch (error) {
    console.error("Error al subir documento de operador:", error)
    throw new Error(`Error al subir el documento: ${error instanceof Error ? error.message : "Error desconocido"}`)
  }
}

// Función para eliminar documento de operador
export async function eliminarDocumentoOperador(target: string): Promise<void> {
  try {
    console.log("Eliminando documento de operador:", target)

    const response = await fetch("/api/upload", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        /^https?:\/\//i.test(target)
          ? { url: target }
          : { pathname: target }
      ),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error eliminando archivo:", errorText)
      if (response.status === 507) {
        throw new Error("El almacenamiento está lleno y no se pudo completar la operación.")
      }
      throw new Error(`Error al eliminar archivo: ${response.status}`)
    }

  console.log("Documento eliminado exitosamente")
  } catch (error) {
    console.error("Error al eliminar documento:", error)
    throw error
  }
}
