"use server"

export async function checkBlobConfiguration(): Promise<boolean> {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function getBlobToken(): Promise<string | undefined> {
  return process.env.BLOB_READ_WRITE_TOKEN
}

export async function testBlobConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        success: false,
        message: "Token de Vercel Blob no configurado",
      }
    }

    // Intentar hacer una llamada simple para verificar que el token funciona
    const { list } = await import("@vercel/blob")
    await list({
      limit: 1,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return {
      success: true,
      message: "Vercel Blob configurado correctamente",
    }
  } catch (error) {
    return {
      success: false,
      message: `Error de configuración: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}
