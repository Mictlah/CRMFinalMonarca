"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropZone } from "@/components/ui/dropzone"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Upload,
  ImageIcon,
  FileText,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Camera,
  X,
  MapPin,
} from "lucide-react"
import {
  supabase,
  type Embarque,
  type FotoEmbarque,
  buscarEmbarquePorFolio,
  obtenerFotosEmbarque,
  guardarFotoEmbarque,
  guardarConfirmacionOperador,
  obtenerConfirmacionOperador,
} from "@/lib/supabase"
import { subirFotoEmbarque } from "@/lib/blob"

export const obtenerUbicacionActual = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}

export default function SubirFotosEmbarquePage() {
  const params = useParams()
  const router = useRouter()
  const embarqueId = params.id as string

  const [embarque, setEmbarque] = useState<Embarque | null>(null)
  const [fotos, setFotos] = useState<FotoEmbarque[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [operadorNombre, setOperadorNombre] = useState("")
  const [confirmacionGuardada, setConfirmacionGuardada] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [openSuccessDialog, setOpenSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [successType, setSuccessType] = useState<"upload" | "delete">("upload")
  const [comentarios, setComentarios] = useState<string[]>([])

  useEffect(() => {
    const cargarFotos = async () => {
      if (!embarque?.id) return

      const fotosGuardadas = await obtenerFotosEmbarque(embarque.id)
      setFotos(fotosGuardadas)
    }

    cargarFotos()
  }, [embarque?.id])

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [embarqueId])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError("")

      let embarqueData: Embarque | null = null

      // Primero intentar buscar por ID (UUID format)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(embarqueId)

      if (isUUID) {
        const { data: embarquePorId, error: errorId } = await supabase
          .from("embarques")
          .select(`
            *,
            cliente:clientes(nombre),
            operador:operadores(nombre, apellidos),
            remolque:remolques(numero_economico, placas)
          `)
          .eq("id", embarqueId)
          .single()

        if (!errorId && embarquePorId) {
          embarqueData = embarquePorId
        }
      }

      // Si no se encuentra por ID o no es UUID, buscar por folio
      if (!embarqueData) {
        console.log("Buscando por folio:", embarqueId)
        embarqueData = await buscarEmbarquePorFolio(embarqueId)
      }

      if (!embarqueData) {
        setError(`No se encontró el embarque con identificador: ${embarqueId}`)
        return
      }

      console.log("Embarque encontrado:", embarqueData)
      setEmbarque(embarqueData)

      // Cargar fotos existentes
      const fotosData = await obtenerFotosEmbarque(embarqueData.id)
      setFotos(fotosData)

      // Verificar si ya hay confirmación del operador
      const confirmacion = await obtenerConfirmacionOperador(embarqueData.id)
      if (confirmacion) {
        setConfirmacionGuardada(true)
        setOperadorNombre(confirmacion.operador_nombre)
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
      setError("Error al cargar los datos del embarque")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "application/pdf"]

    const archivosValidos = files.filter((file) => {
      const esFormatoPermitido = formatosPermitidos.includes(file.type)
      const tamañoValido = file.size <= 10 * 1024 * 1024 // 10MB máximo

      if (!esFormatoPermitido) {
        setError(`${file.name}: Formato no permitido. Solo imágenes (JPG, PNG...) y PDF`)
        return false
      }

      if (!tamañoValido) {
        setError(`${file.name}: El archivo es muy grande (máximo 10MB)`)
        return false
      }

      return true
    })

    setSelectedFiles((prev) => [...prev, ...archivosValidos])
    setError("")
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const subirArchivos = async () => {
    if (!embarque || selectedFiles.length === 0) return

    if (!operadorNombre.trim()) {
      setError("Por favor ingresa el nombre del operador")
      return
    }

    try {
      setUploading(true)
      setError("")
      success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )

      let archivosSubidos = 0

      const ubicacion = await obtenerUbicacionActual()

      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index]
        try {
          // Crear nombre único que incluya el folio del embarque
          const timestamp = Date.now()
          const extension = file.name.split(".").pop()
          const nombreOperador = operadorNombre.replace(/\s+/g, "-")
          const nombreArchivo = `${embarque.folio}-${timestamp}-${nombreOperador}.${extension}`

          // Subir archivo a blob storage
          const { url } = await subirFotoEmbarque(file, embarque.folio, nombreOperador)

          const fotoGuardada = await guardarFotoEmbarque({
            embarque_id: embarque.id,
            nombre_archivo: nombreArchivo,
            url_blob: url,
            tipo_mime: file.type,
            subido_por: operadorNombre.trim(),
            tamano_bytes: file.size,
            latitud: ubicacion?.lat ?? null,
            longitud: ubicacion?.lng ?? null,
            comentario: comentarios[index] || null,
          })

          if (fotoGuardada) {
            setFotos((prev) => [...prev, fotoGuardada])
            archivosSubidos++
          } else {
            throw new Error(`No se pudo guardar la metadata de la foto`)
          }
          // // ✅ Agregar manualmente al estado `fotos`
          // setFotos((prev) => [
          //   ...prev,
          //   {
          //     id: crypto.randomUUID(), // ID temporal
          //     embarque_id: embarque.id,
          //     nombre_archivo: nombreArchivo,
          //     url_blob: url,
          //     tipo_mime: file.type,
          //     subido_por: operadorNombre.trim(),
          //     fecha_subida: new Date().toISOString(),
          //     tamano_bytes: file.size,
          //   },
          // ])

          // archivosSubidos++
        } catch (error) {
          console.error(`Error subiendo ${file.name}:`, error)
          setError(`Error subiendo ${file.name}: ${error instanceof Error ? error.message : "Error desconocido"}`)
        }
      }

      if (archivosSubidos > 0) {
        // Guardar confirmación del operador si no existe
        if (!confirmacionGuardada) {
          const confirmacionExitosa = await guardarConfirmacionOperador(embarque.id, operadorNombre.trim())
          if (confirmacionExitosa) {
            setConfirmacionGuardada(true)
          }
        }

        setSuccessType("upload")
        setSuccessMessage(`${archivosSubidos} archivo(s) subido(s) exitosamente.`)
        setOpenSuccessDialog(true)
        setSelectedFiles([])
        setComentarios([])
      }
    } catch (error) {
      console.error("Error en subida:", error)
      setError("Error al subir archivos")
    } finally {
      setUploading(false)
    }
  }

  const eliminarFoto = async (foto: FotoEmbarque) => {
    try {
      // 🧠 1. Obtener pathname real desde la URL del blob
      const pathname = new URL(foto.url_blob).pathname.replace(/^\/+/, "") // ejemplo: "embarques/TIM-2507-077/1753...Carlos.png"

      console.log("✅ Eliminando de Blob:", pathname)

      await fetch("/api/blob/eliminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname }),
      })

      // 🧠 2. Eliminar de la base de datos Supabase
      console.log("🗑️ Eliminando foto:", foto)

      const { data, error } = await supabase.from("fotos_embarques").delete().eq("id", foto.id)

      console.log("✅ Supabase delete response:", { data, error })

      if (error) {
        console.error("❌ Error eliminando foto de BD:", error)
        setError("Error al eliminar la foto de la base de datos")
        return
      }

      // ✅ 3. Eliminar del estado local
      setFotos((prev) => prev.filter((f) => f.id !== foto.id))
      setSuccessType("delete")
      const esPDF = foto.tipo_mime?.includes("pdf")
      setSuccessMessage(esPDF ? "Documento eliminado exitosamente." : "Foto eliminada exitosamente.")
      setOpenSuccessDialog(true)
    } catch (error) {
      console.error("❌ Error eliminando foto:", error)
      setError("Error al eliminar la foto")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando información del embarque...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!embarque) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Embarque no encontrado</h1>
          <p className="text-gray-600 mb-4">No se pudo encontrar el embarque especificado</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subir Fotos del Embarque</h1>
            <p className="text-gray-600 mt-1">
              Folio: <span className="font-semibold">{embarque.folio}</span>
            </p>
          </div>
        </div>

        {/* Información del embarque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Información del Embarque</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Cliente</Label>
                <p className="text-sm">{embarque.cliente?.nombre || "No especificado"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Operador</Label>
                <p className="text-sm">
                  {embarque.operador ? `${embarque.operador.nombre} ${embarque.operador.apellidos}` : "No asignado"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Origen → Destino</Label>
                <p className="text-sm">
                  {embarque.origen} → {embarque.destino}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Formulario de subida */}
        <Card>
          <CardHeader>
            <CardTitle>Subir Fotos</CardTitle>
            <CardDescription>Selecciona las fotos o documentos relacionados con este embarque</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Confirmación del operador */}
            <div className="space-y-2">
              <Label htmlFor="operador">Nombre del Operador *</Label>
              <Input
                id="operador"
                value={operadorNombre}
                onChange={(e) => setOperadorNombre(e.target.value)}
                placeholder="Ingresa tu nombre completo"
                disabled={confirmacionGuardada}
              />
              {confirmacionGuardada && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Operador confirmado</span>
                </div>
              )}
            </div>

            {/* Selector de archivos */}
            <DropZone
              uploading={uploading}
              onFilesSelected={(files) => handleFileSelect({ target: { files } } as any)}
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Archivos Seleccionados ({selectedFiles.length})</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium truncate max-w-48">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedFile(index)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <Input
                        placeholder="Comentario u observación (opcional)"
                        value={comentarios[index] || ""}
                        onChange={(e) => {
                          const nuevos = [...comentarios]
                          nuevos[index] = e.target.value
                          setComentarios(nuevos)
                        }}
                        disabled={uploading}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de subida */}
            <Button
              onClick={subirArchivos}
              disabled={uploading || selectedFiles.length === 0 || !operadorNombre.trim()}
              className="w-1/8 mx-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo archivos...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir {selectedFiles.length} archivo(s)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Galería de fotos existentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fotos del Embarque ({fotos.filter((f) => f.tipo_mime?.startsWith("image/")).length})</span>
              <Badge variant="outline">
                {fotos.reduce((total, foto) => total + (foto.tamano_bytes || 0), 0) > 0 &&
                  formatFileSize(fotos.reduce((total, foto) => total + (foto.tamano_bytes || 0), 0))}
              </Badge>
            </CardTitle>
            <CardDescription>Todas las fotos asociadas a este embarque</CardDescription>
          </CardHeader>
          <CardContent>
            {fotos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay fotos subidas</p>
                <p className="text-sm mt-1">Las fotos aparecerán aquí una vez que las subas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {fotos
                  .filter((foto) => foto.tipo_mime?.startsWith("image/"))
                  .map((foto) => (
                    <div
                      key={foto.id}
                      className="border rounded-lg p-3 space-y-3 bg-white hover:shadow-md transition-shadow"
                    >
                      {foto.tipo_mime?.startsWith("image/") ? (
                        <div
                          className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                          onClick={() => window.open(foto.url_blob, "_blank")}
                        >
                          <img
                            src={foto.url_blob || "/placeholder.svg"}
                            alt={foto.nombre_archivo}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=200&width=300&text=Error+cargando+imagen"
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300">
                            <div className="text-white text-center">
                              <Eye className="h-6 w-6 mx-auto mb-1" />
                              <span className="text-xs font-medium">Click para ver</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 aspect-video rounded-lg">
                          <div className="text-center">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">
                              {foto.tipo_mime?.includes("pdf") ? "PDF" : "Archivo"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Información del archivo */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{foto.nombre_archivo}</p>
                          <span className="text-xs text-gray-500">
                            {foto.tamano_bytes && formatFileSize(foto.tamano_bytes)}
                          </span>
                        </div>

                        {foto.subido_por && <p className="text-xs text-gray-600">Por: {foto.subido_por}</p>}

                        <p className="text-xs text-gray-400">
                          {new Date(foto.fecha_subida).toLocaleDateString()} a las{" "}
                          {new Date(foto.fecha_subida).toLocaleTimeString()}
                        </p>

                        {foto.latitud && foto.longitud && (
                          <a
                            href={`https://www.google.com/maps?q=${foto.latitud},${foto.longitud}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-xs text-blue-600 underline"
                          >
                            <MapPin className="h-3 w-3" />
                            <span>Ubicación</span>
                          </a>
                        )}

                        {foto.comentario && (
                          <>
                            <p className="text-sm text-gray-500">Comentario u Observación:</p>
                            <p className="text-xs text-gray-500 font-bold">“{foto.comentario}”</p>
                          </>
                        )}

                        {/* Acciones */}
                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => window.open(foto.url_blob, "_blank")}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={async () => {
                              try {
                                const response = await fetch(foto.url_blob)
                                const blob = await response.blob()
                                const blobUrl = URL.createObjectURL(blob)

                                const link = document.createElement("a")
                                link.href = blobUrl
                                link.download = foto.nombre_archivo
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)

                                // Liberar memoria
                                URL.revokeObjectURL(blobUrl)
                              } catch (error) {
                                console.error("Error descargando el archivo:", error)
                              }
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Descargar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La foto se eliminará permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => eliminarFoto(foto)}
                                  className="bg-red-500 hover:bg-red-600 text-white transition-all"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
          <CardHeader className="mt-10">
            <CardTitle className="flex items-center justify-between">
              <span>Documentos del Embarque ({fotos.filter((f) => f.tipo_mime?.includes("pdf")).length})</span>
            </CardTitle>
            <CardDescription>Archivos PDF relacionados con el embarque</CardDescription>
          </CardHeader>

          <CardContent>
            {fotos.filter((foto) => foto.tipo_mime?.includes("pdf")).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay documentos PDF</p>
                <p className="text-sm mt-1">Los documentos aparecerán aquí una vez que los subas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {fotos
                  .filter((foto) => foto.tipo_mime?.includes("pdf"))
                  .map((foto) => (
                    <div
                      key={foto.id}
                      className="border rounded-lg p-3 space-y-3 bg-white hover:shadow-md transition-shadow"
                    >
                      <div
                        className="p-6 flex flex-col items-center justify-center bg-gray-50 rounded-md cursor-pointer hover:shadow transition"
                        onClick={() => window.open(foto.url_blob, "_blank")}
                      >
                        <FileText className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">PDF</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{foto.nombre_archivo}</p>
                          <span className="text-xs text-gray-500">
                            {foto.tamano_bytes && formatFileSize(foto.tamano_bytes)}
                          </span>
                        </div>

                        {foto.subido_por && <p className="text-xs text-gray-600">Por: {foto.subido_por}</p>}

                        <p className="text-xs text-gray-400">
                          {new Date(foto.fecha_subida).toLocaleDateString()} a las{" "}
                          {new Date(foto.fecha_subida).toLocaleTimeString()}
                        </p>

                        {foto.comentario && (
                          <>
                            <p className="text-sm text-gray-500">Comentario u Observación:</p>
                            <p className="text-xs text-gray-500 font-bold">“{foto.comentario}”</p>
                          </>
                        )}

                        <div className="flex space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => window.open(foto.url_blob, "_blank")}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={async () => {
                              try {
                                const response = await fetch(foto.url_blob)
                                const blob = await response.blob()
                                const blobUrl = URL.createObjectURL(blob)

                                const link = document.createElement("a")
                                link.href = blobUrl
                                link.download = foto.nombre_archivo
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                URL.revokeObjectURL(blobUrl)
                              } catch (error) {
                                console.error("Error descargando el archivo:", error)
                              }
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Descargar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El documento se eliminará permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => eliminarFoto(foto)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        {fotos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{fotos.length}</p>
                  <p className="text-sm text-gray-600">Total de archivos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {fotos.filter((f) => f.tipo_mime?.startsWith("image/")).length}
                  </p>
                  <p className="text-sm text-gray-600">Imágenes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {fotos.filter((f) => f.tipo_mime?.includes("pdf")).length}
                  </p>
                  <p className="text-sm text-gray-600">Documentos PDF</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatFileSize(fotos.reduce((total, foto) => total + (foto.tamano_bytes || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600">Tamaño total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AlertDialog open={openSuccessDialog} onOpenChange={setOpenSuccessDialog}>
        <AlertDialogContent className="bg-white text-gray-900 rounded-2xl shadow-xl max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-center space-x-3">
              {successType === "upload" ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <Trash2 className="h-8 w-8 text-red-500" />
              )}
              <AlertDialogTitle className="text-xl font-semibold">
                {successType === "upload" ? "¡Carga exitosa!" : "¡Eliminación exitosa!"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-end pt-4">
            <AlertDialogAction
              className={`${
                successType === "upload" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
              } text-white px-4 py-2 rounded-md transition-all`}
              onClick={() => setOpenSuccessDialog(false)}
            >
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
