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
  ArrowLeft,
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
import { subirFotoEmbarque, eliminarFotoEmbarque } from "@/lib/blob"

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

      // Buscar embarque por ID o folio
      let embarqueData: Embarque | null = null

      // Primero intentar buscar por ID
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
      } else {
        // Si no se encuentra por ID, intentar por folio
        embarqueData = await buscarEmbarquePorFolio(embarqueId)
      }

      if (!embarqueData) {
        setError("No se encontró el embarque especificado")
        return
      }

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

    // Validar archivos
    const archivosValidos = files.filter((file) => {
      const esImagen = file.type.startsWith("image/")
      const esPDF = file.type === "application/pdf"
      const tamañoValido = file.size <= 10 * 1024 * 1024 // 10MB máximo

      if (!esImagen && !esPDF) {
        setError(`${file.name}: Solo se permiten imágenes y archivos PDF`)
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
      setSuccess("")

      let archivosSubidos = 0

      for (const file of selectedFiles) {
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

        setSuccess(`${archivosSubidos} archivo(s) subido(s) exitosamente`)
        setSelectedFiles([])
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
      // Eliminar de blob storage
      const pathname = foto.url_blob.split("/").pop() || ""
      await eliminarFotoEmbarque(`embarques/${embarque?.folio}/${pathname}`)

      // Eliminar de base de datos
      const { error } = await supabase.from("fotos_embarques").delete().eq("id", foto.id)

      if (error) {
        console.error("Error eliminando foto de BD:", error)
        setError("Error al eliminar la foto")
        return
      }

      // Actualizar lista local
      setFotos((prev) => prev.filter((f) => f.id !== foto.id))
      setSuccess("Foto eliminada exitosamente")
    } catch (error) {
      console.error("Error eliminando foto:", error)
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
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Regresar
          </Button>
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
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Regresar
          </Button>
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

            {/* Vista previa de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Archivos Seleccionados ({selectedFiles.length})</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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
                      <Button variant="ghost" size="sm" onClick={() => removeSelectedFile(index)} disabled={uploading}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de subida */}
            <Button
              onClick={subirArchivos}
              disabled={uploading || selectedFiles.length === 0 || !operadorNombre.trim()}
              className="w-full"
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
              <span>Fotos del Embarque ({fotos.length})</span>
              <Badge variant="outline">
                {fotos.reduce((total, foto) => total + (foto.tamano_bytes || 0), 0) > 0 &&
                  formatFileSize(fotos.reduce((total, foto) => total + (foto.tamano_bytes || 0), 0))}
              </Badge>
            </CardTitle>
            <CardDescription>Todas las fotos y documentos asociados a este embarque</CardDescription>
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
                {fotos.map((foto) => (
                  <div
                    key={foto.id}
                    className="border rounded-lg p-3 space-y-3 bg-white hover:shadow-md transition-shadow"
                  >
                    {/* Vista previa */}
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group">
                      {foto.tipo_mime?.startsWith("image/") ? (
                        <img
                          src={foto.url_blob || "/placeholder.svg"}
                          alt={foto.nombre_archivo}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(foto.url_blob, "_blank")}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=300&text=Error+cargando+imagen"
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">
                              {foto.tipo_mime?.includes("pdf") ? "PDF" : "Archivo"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Overlay con información */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="text-white text-center">
                          <Eye className="h-6 w-6 mx-auto mb-1" />
                          <span className="text-xs">Click para ver</span>
                        </div>
                      </div>
                    </div>

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
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = foto.url_blob
                            link.download = foto.nombre_archivo
                            link.target = "_blank"
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
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
    </MainLayout>
  )
}
