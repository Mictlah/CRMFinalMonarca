"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react"
import {
  supabase,
  type Embarque,
  guardarFotoEmbarque,
  guardarConfirmacionOperador,
  obtenerConfirmacionOperador,
  type OperadorConfirmacionEmbarque,
} from "@/lib/supabase"

interface FilePreview extends File {
  preview: string
  status: "pending" | "uploading" | "uploaded" | "failed"
  message?: string
}

export default function SubirFotosEmbarquePage({ params }: { params: { id: string } }) {
  const { id: embarqueId } = params

  const [embarque, setEmbarque] = useState<Embarque | null>(null)
  const [operatorName, setOperatorName] = useState("")
  const [files, setFiles] = useState<FilePreview[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)
  const [maxFilesReached, setMaxFilesReached] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmacion, setConfirmacion] = useState<OperadorConfirmacionEmbarque | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!embarqueId) {
        setGlobalError("ID de embarque no válido en la URL.")
        return
      }

      console.log("Cargando embarque con ID:", embarqueId)

      try {
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
          setGlobalError(`No se pudo cargar la información del embarque. Error: ${error.message}`)
          return
        }

        if (!data) {
          setGlobalError("No se encontró el embarque especificado.")
          return
        }

        console.log("Embarque cargado:", data)
        setEmbarque(data)

        // Verificar si ya existe una confirmación
        const existingConfirmation = await obtenerConfirmacionOperador(embarqueId)
        if (existingConfirmation) {
          console.log("Confirmación existente encontrada:", existingConfirmation)
          setConfirmacion(existingConfirmation)
          setIsConfirmed(true)
          setOperatorName(existingConfirmation.operador_nombre)
        }
      } catch (error) {
        console.error("Error general:", error)
        setGlobalError("Error inesperado al cargar los datos.")
      }
    }
    loadData()
  }, [embarqueId])

  const handleConfirmation = async () => {
    if (!operatorName.trim()) {
      setGlobalError("Por favor, ingresa tu nombre para confirmar.")
      return
    }

    if (!embarqueId) {
      setGlobalError("ID de embarque no válido.")
      return
    }

    setIsConfirming(true)
    setGlobalError(null)

    console.log("Guardando confirmación para embarque:", embarqueId, "operador:", operatorName.trim())

    const success = await guardarConfirmacionOperador(embarqueId, operatorName.trim())

    if (success) {
      setIsConfirmed(true)
      setGlobalSuccess("¡Datos confirmados exitosamente! Ahora puedes subir las fotos.")
      setTimeout(() => setGlobalSuccess(null), 5000)
    } else {
      setGlobalError("Hubo un error al guardar la confirmación. Por favor, intenta de nuevo.")
    }
    setIsConfirming(false)
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    setGlobalSuccess(null)

    if (!isConfirmed) {
      setGlobalError("Debes confirmar los datos del embarque antes de subir fotos.")
      return
    }

    if (!embarqueId) {
      setGlobalError("ID de embarque no válido.")
      return
    }

    if (!embarque) {
      setGlobalError("Información del embarque no disponible.")
      return
    }

    const filesToUpload = files.filter((f) => f.status === "pending")
    if (filesToUpload.length === 0) {
      setGlobalError("No hay nuevas imágenes para subir.")
      return
    }

    setIsSubmitting(true)

    console.log("Iniciando subida de", filesToUpload.length, "archivos para embarque:", embarqueId)

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const originalIndex = files.findIndex((f) => f === file)

      setFiles((prev) => prev.map((f, idx) => (idx === originalIndex ? { ...f, status: "uploading" } : f)))

      try {
        // Crear nombre de archivo único con folio del embarque
        const timestamp = Date.now()
        const fileExtension = file.name.split(".").pop() || "jpg"
        const customFileName = `${embarque.folio}-${timestamp}-${file.name}`

        console.log("Subiendo archivo:", customFileName)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("fileName", customFileName)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error desconocido del servidor.")
        }

        const { url } = await response.json()
        console.log("Archivo subido exitosamente:", url)

        // Guardar en la base de datos con el ID correcto del embarque
        const fotoData = {
          embarque_id: embarqueId, // Asegurar que se use el ID correcto
          nombre_archivo: file.name,
          url_blob: url,
          tamano_bytes: file.size,
          tipo_mime: file.type,
          subido_por: operatorName.trim(),
        }

        console.log("Guardando foto en BD:", fotoData)

        const saved = await guardarFotoEmbarque(fotoData)

        if (!saved) {
          throw new Error("Error al guardar en la base de datos.")
        }

        console.log("Foto guardada exitosamente en BD")

        setFiles((prev) =>
          prev.map((f, idx) => (idx === originalIndex ? { ...f, status: "uploaded", message: "Subida exitosa" } : f)),
        )
      } catch (error: any) {
        console.error("Error en la subida/guardado:", error)
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === originalIndex ? { ...f, status: "failed", message: error.message || "Fallo la subida" } : f,
          ),
        )
      }
    }

    setIsSubmitting(false)

    const finalFiles = [...files]
    const failedCount = finalFiles.filter((f) => f.status === "failed").length
    const successCount = finalFiles.filter((f) => f.status === "uploaded").length

    if (failedCount > 0) {
      setGlobalError(`No se pudieron subir ${failedCount} imágenes. Por favor, intenta subirlas de nuevo.`)
    }
    if (successCount > 0 && failedCount === 0) {
      setGlobalSuccess("¡Todas las imágenes nuevas se subieron y registraron exitosamente!")
    }
  }

  if (!embarque && !globalError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Cargando embarque...</h2>
        <p className="text-sm text-gray-500 mt-2">ID: {embarqueId}</p>
      </div>
    )
  }

  if (globalError && !embarque) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Alert variant="destructive" className="max-w-lg">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">ID del embarque: {embarqueId}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <img
            src="/images/logo-monarca-transparent.png"
            alt="Logo Transportes Monarca"
            className="h-20 mx-auto mb-4"
          />
          <CardTitle className="text-2xl font-bold">Evidencia de Embarque</CardTitle>
          <CardDescription>Confirma los detalles y sube las fotos del embarque.</CardDescription>
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
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Éxito</AlertTitle>
              <AlertDescription className="text-green-700">{globalSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <h3 className="font-semibold text-lg">Detalles del Viaje</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Folio</Label>
                <p className="font-mono font-medium">{embarque?.folio}</p>
              </div>
              <div>
                <Label>Cliente</Label>
                <p>{embarque?.cliente?.nombre || "N/A"}</p>
              </div>
              <div>
                <Label>Operador Asignado</Label>
                <p>{embarque?.operador ? `${embarque.operador.nombre} ${embarque.operador.apellidos}` : "N/A"}</p>
              </div>
              <div>
                <Label>Remolque</Label>
                <p>{embarque?.remolque?.numero_economico || embarque?.remolque_numero_economico || "N/A"}</p>
              </div>
              <div className="md:col-span-2">
                <Label>Lugar de Recolecta</Label>
                <p>{embarque?.direccion_recolecta || "N/A"}</p>
              </div>
              <div className="md:col-span-2">
                <Label>Lugar de Entrega</Label>
                <p>{embarque?.direccion_entrega || "N/A"}</p>
              </div>
            </div>
          </div>

          {!isConfirmed ? (
            <div className="space-y-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-lg text-blue-800">Paso 1: Confirmación de Datos</h3>
              <div className="space-y-2">
                <Label htmlFor="operator-name">Ingresa tu nombre para confirmar *</Label>
                <Input
                  id="operator-name"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Ingresa tu nombre completo"
                  required
                />
              </div>
              <Button onClick={handleConfirmation} disabled={isConfirming || !operatorName.trim()} className="w-full">
                {isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Confirmar Datos del Viaje
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 border-2 border-green-300 rounded-lg bg-green-50">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-6 w-6" />
                <h3 className="font-semibold text-lg">Datos Confirmados por: {confirmacion?.operador_nombre}</h3>
              </div>
              <p className="text-sm text-green-700">
                Fecha de confirmación: {new Date(confirmacion!.fecha_confirmacion).toLocaleString()}
              </p>
            </div>
          )}

          {isConfirmed && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="images">Paso 2: Subir Fotos (Máx. 10)</Label>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
                        <div className="absolute inset-0 bg-red-100 border-2 border-red-300 flex flex-col items-center justify-center rounded-lg z-10 p-1 text-center">
                          <XCircle className="h-5 w-5 text-red-500 mb-1" />
                          <p className="text-xs text-red-700 font-semibold">Error</p>
                          <p className="text-[10px] text-red-600 leading-tight">{file.message}</p>
                        </div>
                      )}
                      <img
                        src={file.preview || "/placeholder.svg"}
                        alt={`Preview ${file.name}`}
                        className="w-24 h-24 object-cover rounded-md mb-2"
                        onLoad={() => URL.revokeObjectURL(file.preview)}
                      />
                      <p className="text-xs truncate w-full px-1">{file.name}</p>
                      <div className="absolute top-1 right-1 flex flex-col space-y-1">
                        {file.status === "uploaded" && (
                          <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full p-0.5" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full bg-white bg-opacity-80 opacity-0 group-hover:opacity-100"
                          title="Eliminar imagen"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting || files.filter((f) => f.status === "pending").length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Subiendo fotos...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Subir Fotos Pendientes
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
