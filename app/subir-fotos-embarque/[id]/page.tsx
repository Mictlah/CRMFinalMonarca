"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, CheckCircle, XCircle, Loader2, MapPin, Truck, User, Package } from "lucide-react" // Added icons
import { supabase, type Embarque, guardarFotoEmbarque } from "@/lib/supabase"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)
  const [maxFilesReached, setMaxFilesReached] = useState(false)
  const [confirmationStep, setConfirmationStep] = useState(0) // 0: initial, 1: first confirmed, 2: second confirmed (ready for upload)

  useEffect(() => {
    async function loadEmbarque() {
      if (!embarqueId) return

      const { data, error } = await supabase
        .from("embarques")
        .select(
          `
          *,
          cliente:clientes(nombre),
          operador:operadores(nombre, apellidos),
          remolque:remolques(numero_economico, placas)
        `,
        )
        .eq("id", embarqueId)
        .single()

      if (error) {
        console.error("Error cargando embarque:", error)
        setGlobalError(
          "No se pudo cargar la información del embarque. Asegúrate de que la URL sea correcta o que el embarque exista.",
        )
        return
      }

      if (!data.operador_id || !data.operador) {
        setGlobalError("Este embarque no tiene un operador asignado. Por favor, contacta a administración.")
        return
      }

      setEmbarque(data)
    }
    loadEmbarque()
  }, [embarqueId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as FilePreview[]
    const currentFilesCount = files.length
    const newFilesCount = selectedFiles.length

    if (currentFilesCount + newFilesCount > 10) {
      alert("Solo puedes subir un máximo de 10 imágenes por embarque.")
      setMaxFilesReached(true)
      return
    } else {
      setMaxFilesReached(false)
    }

    const newFilePreviews = selectedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        status: "pending",
      }),
    )
    setFiles((prevFiles) => [...prevFiles, ...newFilePreviews])
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = prevFiles.filter((_, i) => i !== index)
      if (newFiles.length < 10) {
        setMaxFilesReached(false)
      }
      return newFiles
    })
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

    const uploadPromises = files.map(async (file, index) => {
      // Skip already uploaded files
      if (file.status === "uploaded") return

      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileName", `${embarque.folio}-${Date.now()}-${file.name}`)

      try {
        setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f)))

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al subir la imagen.")
        }

        const { url } = await response.json()

        // Guardar la URL en Supabase
        const saved = await guardarFotoEmbarque({
          embarque_id: embarqueId,
          nombre_archivo: file.name,
          url_blob: url,
          tamano_bytes: file.size,
          tipo_mime: file.type,
          subido_por: operatorFullName, // Use the assigned operator's full name
        })

        if (!saved) {
          throw new Error("Error al guardar el registro de la imagen en la base de datos.")
        }

        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: "uploaded", message: "Subida exitosa" } : f)),
        )
      } catch (error: any) {
        console.error("Error en la subida/guardado:", error)
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "failed", message: error.message || "Fallo la subida" } : f,
          ),
        )
        setGlobalError(`Algunas imágenes no se pudieron subir: ${error.message}`)
      }
    })

    await Promise.all(uploadPromises)

    const allUploaded = files.every((f) => f.status === "uploaded")
    if (allUploaded) {
      setGlobalSuccess("Todas las imágenes se subieron y registraron exitosamente.")
      setFiles([]) // Clear files after successful upload
    } else {
      setGlobalError("Algunas imágenes no se pudieron subir. Revisa los detalles de cada archivo.")
    }
    setIsSubmitting(false)
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

          {/* Detalles del Embarque (siempre visibles) */}
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

          {/* Pasos de Confirmación */}
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

          {/* Formulario de Subida de Imágenes (solo visible después de la segunda confirmación) */}
          {confirmationStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="images">Subir Imágenes (Máx. 10)</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting || maxFilesReached}
                  className="file:text-blue-600 file:border-blue-600 file:hover:bg-blue-50 cursor-pointer"
                />
                {maxFilesReached && <p className="text-sm text-red-600">Has alcanzado el límite de 10 imágenes.</p>}
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
                      <img
                        src={file.preview || "/placeholder.svg"}
                        alt={`Preview ${file.name}`}
                        className="w-24 h-24 object-cover rounded-md mb-2"
                        onLoad={() => URL.revokeObjectURL(file.preview)}
                      />
                      <p className="text-xs truncate w-full px-1">{file.name}</p>
                      <div className="absolute top-1 right-1">
                        {file.status === "uploaded" && <CheckCircle className="h-4 w-4 text-green-500" />}
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
                        {(file.status === "pending" || file.status === "uploading") && (
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
                disabled={isSubmitting || files.length === 0 || files.some((f) => f.status === "uploading")}
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
