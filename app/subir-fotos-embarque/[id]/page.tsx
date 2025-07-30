"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, CheckCircle, XCircle, Loader2, MapPin, Truck, User, Package, Trash2 } from "lucide-react"
import {
  supabase,
  type Embarque,
  guardarFotoEmbarque,
  obtenerFotosEmbarque,
  eliminarFotoEmbarqueDB,
} from "@/lib/supabase"
import { eliminarFotoEmbarque } from "@/lib/blob"

interface FilePreview extends File {
  preview: string
  status: "pending" | "uploading" | "uploaded" | "failed"
  message?: string
}

export default function SubirFotosEmbarquePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { id: embarqueId } = params

  const [embarque, setEmbarque] = useState<Embarque | null>(null)
  const [files, setFiles] = useState<FilePreview[]>([])
  const [existingPhotos, setExistingPhotos] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)
  const [maxFilesReached, setMaxFilesReached] = useState(false)
  const [confirmationStep, setConfirmationStep] = useState(0)

  const MAX_FILES = 10

  const loadEmbarqueAndPhotos = useCallback(async () => {
    console.log("=== CARGANDO EMBARQUE Y FOTOS ===")
    console.log("Embarque ID:", embarqueId)

    setGlobalError(null)
    if (!embarqueId) return

    const { data: embarqueData, error: embarqueError } = await supabase
      .from("embarques")
      .select(
        `
          *,
          cliente:clientes(nombre),
          operador:operadores(nombre, apellidos, telefono),
          remolque:remolques(numero_economico, placas)
        `,
      )
      .eq("id", embarqueId)
      .single()

    if (embarqueError) {
      console.error("Error cargando embarque:", embarqueError)
      setGlobalError(
        "No se pudo cargar la información del embarque. Asegúrate de que la URL sea correcta o que el embarque exista.",
      )
      setEmbarque(null)
      return
    }

    console.log("Embarque cargado:", embarqueData)

    if (!embarqueData.operador_id || !embarqueData.operador) {
      setGlobalError("Este embarque no tiene un operador asignado. Por favor, contacta a administración.")
      setEmbarque(null)
      return
    }

    setEmbarque(embarqueData)

    const existingPhotosData = await obtenerFotosEmbarque(embarqueId)
    setExistingPhotos(existingPhotosData)
    setMaxFilesReached(existingPhotosData.length >= MAX_FILES)

    console.log("=== FIN CARGA EMBARQUE Y FOTOS ===")
  }, [embarqueId])

  useEffect(() => {
    loadEmbarqueAndPhotos()
  }, [loadEmbarqueAndPhotos])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as FilePreview[]
    const currentTotalFiles = files.length + existingPhotos.length
    const filesToAddCount = Math.min(selectedFiles.length, MAX_FILES - currentTotalFiles)

    if (filesToAddCount <= 0) {
      setGlobalError(`Ya has alcanzado el límite de ${MAX_FILES} imágenes.`)
      setMaxFilesReached(true)
      e.target.value = ""
      return
    }

    const newFilePreviews = selectedFiles.slice(0, filesToAddCount).map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        status: "pending",
      }),
    )
    setFiles((prevFiles) => [...prevFiles, ...newFilePreviews])
    setMaxFilesReached(currentTotalFiles + filesToAddCount >= MAX_FILES)
    setGlobalError(null)
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = prevFiles.filter((_, i) => i !== index)
      setMaxFilesReached(newFiles.length + existingPhotos.length < MAX_FILES ? false : true)
      return newFiles
    })
  }

  const handleDeleteExistingPhoto = async (photoId: string, pathname: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
      return
    }
    setGlobalError(null)
    setGlobalSuccess(null)
    try {
      await eliminarFotoEmbarque(pathname)
      await eliminarFotoEmbarqueDB(photoId)

      setGlobalSuccess("Imagen eliminada exitosamente.")
      await loadEmbarqueAndPhotos()
    } catch (error: any) {
      console.error("Error al eliminar la imagen:", error)
      setGlobalError(`Error al eliminar la imagen: ${error.message || "Error desconocido"}`)
    }
  }

  const handleFirstConfirmation = () => {
    setGlobalError(null)
    setGlobalSuccess(null)
    if (!embarque || !embarque.operador) {
      setGlobalError("No se pudo verificar la información del embarque o del operador.")
      return
    }
    setConfirmationStep(1)
  }

  const handleSecondConfirmation = () => {
    setGlobalError(null)
    setGlobalSuccess(null)
    setConfirmationStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== INICIANDO SUBIDA DE FOTOS ===")

    setGlobalError(null)
    setGlobalSuccess(null)

    if (confirmationStep !== 2) {
      setGlobalError("Por favor, completa los pasos de confirmación antes de subir las imágenes.")
      return
    }

    if (!embarque || !embarque.operador) {
      setGlobalError("No se ha cargado la información del embarque o del operador.")
      return
    }

    if (files.length === 0) {
      setGlobalError("Por favor, selecciona al menos una imagen para subir.")
      return
    }

    setIsSubmitting(true)

    const operatorFullName = `${embarque.operador.nombre} ${embarque.operador.apellidos}`
    let successCount = 0
    let failCount = 0

    console.log(`Iniciando subida de ${files.length} archivos`)

    const updateFileStatus = (index: number, status: FilePreview["status"], message?: string) => {
      setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status, message } : f)))
    }

    const uploadPromises = files.map(async (file, index) => {
      if (file.status === "uploaded") return // Skip already uploaded files

      try {
        console.log(`--- Procesando archivo ${index + 1}: ${file.name} ---`)

        updateFileStatus(index, "uploading", "Subiendo...")

        const formData = new FormData()
        formData.append("file", file)

        const filename = `embarques/${embarque.folio}/${Date.now()}-${file.name}`
        console.log("Filename generado:", filename)

        const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
          method: "POST",
          body: formData,
        })

        console.log("Respuesta de upload API:", response.status, response.statusText)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Error HTTP ${response.status}`)
        }

        const { url, pathname } = await response.json()
        console.log("Blob subido exitosamente:", { url, pathname })

        // Guardar la URL en Supabase
        console.log("Guardando en Supabase...")
        const savedPhoto = await guardarFotoEmbarque({
          embarque_id: embarqueId,
          nombre_archivo: file.name,
          url_blob: url,
          tamano_bytes: file.size,
          tipo_mime: file.type,
          subido_por: operatorFullName,
          pathname_blob: pathname,
        })

        if (!savedPhoto) {
          throw new Error("No se recibió confirmación de guardado en base de datos")
        }

        console.log("Archivo procesado exitosamente:", file.name)
        updateFileStatus(index, "uploaded", "¡Subida exitosa!")
        successCount++
      } catch (error: any) {
        console.error(`Error procesando archivo ${file.name}:`, error)
        updateFileStatus(index, "failed", error.message || "Error desconocido")
        failCount++
      }
    })

    await Promise.all(uploadPromises)

    console.log(`=== RESUMEN: ${successCount} éxitos, ${failCount} fallos ===`)

    if (failCount === 0) {
      setGlobalSuccess(`¡Todas las ${successCount} imágenes se subieron y registraron exitosamente!`)
      setFiles([])
      await loadEmbarqueAndPhotos()
    } else if (successCount > 0) {
      setGlobalSuccess(`${successCount} imágenes se subieron correctamente.`)
      setGlobalError(`${failCount} imágenes fallaron. Revisa los detalles de cada archivo.`)
    } else {
      setGlobalError("No se pudo subir ninguna imagen. Revisa tu conexión e inténtalo de nuevo.")
    }

    setIsSubmitting(false)
    console.log("=== FIN SUBIDA DE FOTOS ===")
  }

  if (!embarque) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Cargando embarque...</h2>
        {globalError && (
          <Alert variant="destructive" className="mt-4 max-w-lg">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <img
            src="/images/logo-monarca-transparent.png"
            alt="Logo Transportes Monarca"
            className="h-20 mx-auto mb-4"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=80&width=200&text=Transportes+Monarca"
            }}
          />
          <CardTitle className="text-2xl font-bold">Subir Fotos de Embarque</CardTitle>
          <CardDescription>Confirma los detalles del embarque y sube las fotos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {globalError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          )}
          {globalSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{globalSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Información del Embarque</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="folio">Número de Embarque</Label>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <Input id="folio" value={embarque.folio} readOnly disabled className="bg-white font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <Input
                    id="cliente"
                    value={embarque.cliente?.nombre || "N/A"}
                    readOnly
                    disabled
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remolque">Remolque Asignado</Label>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <Input
                    id="remolque"
                    value={embarque.remolque?.numero_economico || embarque.remolque_numero_economico || "N/A"}
                    readOnly
                    disabled
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="operador-asignado">Operador Asignado</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <Input
                    id="operador-asignado"
                    value={`${embarque.operador?.nombre || ""} ${embarque.operador?.apellidos || ""}`}
                    readOnly
                    disabled
                    className="bg-white font-medium"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion-recolecta">Lugar de Recolecta</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Input
                  id="direccion-recolecta"
                  value={embarque.direccion_recolecta || "N/A"}
                  readOnly
                  disabled
                  className="bg-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion-entrega">Lugar de Entrega</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Input
                  id="direccion-entrega"
                  value={embarque.direccion_entrega || "N/A"}
                  readOnly
                  disabled
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {confirmationStep === 0 && (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Confirmación de Datos</AlertTitle>
                <AlertDescription>
                  Por favor, verifica que los datos del embarque mostrados arriba y tu nombre como operador asignado son
                  correctos.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleFirstConfirmation}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Confirmar Datos y Continuar
              </Button>
            </div>
          )}

          {confirmationStep === 1 && (
            <div className="space-y-4">
              <Alert variant="warning">
                <AlertTitle>Segunda Confirmación</AlertTitle>
                <AlertDescription>
                  Estás a punto de proceder con la subida de imágenes para este embarque. Asegúrate de que tienes las
                  fotos listas y que los datos mostrados son correctos.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleSecondConfirmation}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Confirmar y Habilitar Subida de Fotos
              </Button>
            </div>
          )}

          {existingPhotos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Fotos Existentes ({existingPhotos.length}/{MAX_FILES})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {existingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative border rounded-lg p-2 flex flex-col items-center justify-center text-center group"
                  >
                    <img
                      src={photo.url_blob || "/placeholder.svg"}
                      alt={`Foto ${photo.nombre_archivo}`}
                      className="w-24 h-24 object-cover rounded-md mb-2"
                    />
                    <p className="text-xs truncate w-full px-1">{photo.nombre_archivo}</p>
                    <div className="absolute top-1 right-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingPhoto(photo.id, photo.pathname_blob)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full bg-white bg-opacity-80 opacity-0 group-hover:opacity-100"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {confirmationStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="images">
                  Subir Nuevas Imágenes (Máx. {MAX_FILES - existingPhotos.length} disponibles)
                </Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting || maxFilesReached}
                  className="file:text-blue-600 file:border-blue-600 file:hover:bg-blue-50 cursor-pointer"
                />
                {maxFilesReached && (
                  <p className="text-sm text-red-600">Has alcanzado el límite de {MAX_FILES} imágenes.</p>
                )}
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="relative border rounded-lg p-2 flex flex-col items-center justify-center text-center group"
                    >
                      {file.status === "uploading" && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                      )}
                      {file.status === "failed" && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                          <XCircle className="h-6 w-6 text-white" />
                        </div>
                      )}
                      {file.status === "uploaded" && (
                        <div className="absolute inset-0 bg-green-500 bg-opacity-25 flex items-center justify-center rounded-lg z-10">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                      <img
                        src={file.preview || "/placeholder.svg"}
                        alt={`Preview ${file.name}`}
                        className="w-24 h-24 object-cover rounded-md mb-2"
                        onLoad={() => URL.revokeObjectURL(file.preview)}
                      />
                      <p className="text-xs truncate w-full px-1">{file.name}</p>
                      {file.message && (
                        <p
                          className={`text-xs ${file.status === "failed" ? "text-red-600" : file.status === "uploaded" ? "text-green-600" : "text-gray-600"}`}
                        >
                          {file.message}
                        </p>
                      )}
                      <div className="absolute top-1 right-1">
                        {file.status === "failed" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full bg-white bg-opacity-80"
                            title="Eliminar imagen fallida"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {file.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full bg-white bg-opacity-80 opacity-0 group-hover:opacity-100"
                            title="Eliminar imagen"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting || files.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Subiendo fotos...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Confirmar y Subir Fotos
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
