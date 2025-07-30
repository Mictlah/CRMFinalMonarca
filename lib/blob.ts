import { del, list } from "@vercel/blob"

// Re-añadidas para satisfacer importaciones externas que aún puedan existir.
// Estas funciones ya no son utilizadas por app/subir-fotos-embarque/[id]/page.tsx
// La lógica de subida principal ahora reside en app/api/upload/route.ts
export async function subirFotoEmbarque(
  file: File,
  folioEmbarque: string,
  operador: string,
): Promise<{ url: string; pathname: string }> {
  console.warn("subirFotoEmbarque en lib/blob.ts está deprecada. Usa el nuevo flujo de subida.")
  // Puedes añadir una implementación mínima o lanzar un error si no quieres que se use.
  // Por ahora, solo para satisfacer el tipo y evitar errores de compilación/despliegue.
  return { url: "", pathname: "" }
}

export async function uploadFile(fileName: string, file: File): Promise<{ url: string; pathname: string }> {
  console.warn("uploadFile en lib/blob.ts está deprecada. Usa el nuevo flujo de subida.")
  // Por ahora, solo para satisfacer el tipo y evitar errores de compilación/despliegue.
  return { url: "", pathname: "" }
}

export async function eliminarFotoEmbarque(pathname: string): Promise<void> {
  try {
    // Usar la variable de entorno disponible
    // NOTA: En un entorno de producción, BLOB_READ_WRITE_TOKEN debe estar configurado en Vercel.
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.warn("Token de Blob no disponible, saltando eliminación de archivo:", pathname)
      return // No lanzar error, solo advertir
    }

    await del(pathname, {
      token: token,
    })
  } catch (error) {
    console.error("Error al eliminar foto de Vercel Blob:", error)
    // No lanzar error para evitar que falle toda la eliminación
    console.warn("Continuando con la eliminación a pesar del error en blob storage")
  }
}

export async function listarFotosEmbarque(folioEmbarque: string) {
  try {
    // NOTA: En un entorno de producción, BLOB_READ_WRITE_TOKEN debe estar configurado en Vercel.
    const { blobs } = await list({
      prefix: `embarques/${folioEmbarque}/`,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return blobs
  } catch (error) {
    console.error("Error al listar fotos de Vercel Blob:", error)
    throw new Error("Error al obtener las fotos")
  }
}
