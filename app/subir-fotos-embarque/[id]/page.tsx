"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  ArrowLeft,
  Camera,
  X,
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
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [confirmandoOperador, setConfirmandoOperador] = useState(false)
  const [operadorConfirmado, setOperadorConfirmado] = useState<any>(null)

  // Estados del formulario
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([])
  const [nombreOperador, setNombreOperador] = useState("")
  const [observaciones, setObservaciones] = useState("")

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [embarqueId])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      console.log("Cargando datos para embarque:", embarqueId)

      // Primero intentar buscar por ID directo
      let { data: embarqueData, error: embarqueError } = await supabase
        .from("embarques")
        .select(`
          *,
          cliente:clientes(nombre),
          operador:operadores(nombre, apellidos),
          remolque:remolques(numero_economico, placas)
        `)
        .eq("id", embarqueId)
        .single()

      // Si no se encuentra por ID, intentar buscar por folio
      if (embarqueError || !embarqueData) {
        console.log("No encontrado por ID, buscando por folio:", embarqueId)
        embarqueData = await buscarEmbarquePorFolio(embarqueId)
      }

      if (!embarqueData) {
        console.error("Embarque no encontrado:", embarqueId)
        alert("Embarque no encontrado")
        router.push("/embarques")
        return
      }

      console.log("Embarque encontrado:", embarqueData)
      setEmbarque(embarqueData)

      // Cargar fotos del embarque
      const fotosData = await obtenerFotosEmbarque(embarqueData.id)
      console.log("Fotos cargadas:", fotosData.length)
      setFotos(fotosData)

      // Cargar confirmación del operador si existe
      const confirmacion = await obtenerConfirmacionOperador(embarqueData.id)
      if (confirmacion) {
        setOperadorConfirmado(confirmacion)
        setNombreOperador(confirmacion.operador_nombre)
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
      alert("Error al cargar los datos del embarque")
    } finally {
      setLoading(false)
    }
  }

  const manejarSeleccionArchivos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files || [])

    // Validar archivos
    const archivosValidos = archivos.filter((archivo) => {
      // Validar tamaño (máximo 10MB)
      if (archivo.size > 10 * 1024 * 1024) {
        alert(`El archivo ${archivo.name} es muy grande. Máximo 10MB.`)
        return false
      }

      // Validar tipo
      const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/gif", "application/pdf"]
      if (!tiposPermitidos.includes(archivo.type)) {
        alert(`El archivo ${archivo.name} no es un tipo válido. Solo se permiten imágenes y PDFs.`)
        return false
      }

      return true
    })

    setArchivosSeleccionados((prev) => [...prev, ...archivosValidos])
  }

  const eliminarArchivoSeleccionado = (index: number) => {
    setArchivosSeleccionados((prev) => prev.filter((_, i) => i !== index))
  }

  const subirArchivos = async () => {
    if (!embarque || archivosSeleccionados.length === 0) {
      alert("Selecciona al menos un archivo para subir")
      return
    }

    if (!nombreOperador.trim()) {
      alert("Ingresa el nombre del operador")
      return
    }

    try {
      setSubiendo(true)
      console.log("Iniciando subida de", archivosSeleccionados.length, "archivos")

      let archivosSubidos = 0
      let errores = 0

      for (const archivo of archivosSeleccionados) {
        try {
          console.log("Subiendo archivo:", archivo.name)

          // Crear nombre único que incluya el folio del embarque
          const timestamp = Date.now()
          const extension = archivo.name.split(".").pop()
          const nombreUnico = `${embarque.folio}-${timestamp}-${archivo.name}`

          // Subir archivo a blob storage
          const { url, pathname } = await subirFotoEmbarque(archivo, embarque.folio, nombreOperador.trim())
          console.log("Archivo subido a blob:", url)

          // Guardar información en la base de datos
          const fotoData = {
            embarque_id: embarque.id,
            nombre_archivo: nombreUnico,
            url_blob: url,
            tamano_bytes: archivo.size,
            tipo_mime: archivo.type,
            subido_por: nombreOperador.trim(),
          }

          const guardado = await guardarFotoEmbarque(fotoData)
          if (guardado) {
            archivosSubidos++
            console.log("Foto guardada en BD:", nombreUnico)
          } else {
            errores++
            console.error("Error guardando foto en BD:", nombreUnico)
          }
        } catch (error) {
          console.error("Error subiendo archivo:", archivo.name, error)
          errores++
        }
      }

      // Guardar confirmación del operador si no existe
      if (!operadorConfirmado) {
        const confirmacionGuardada = await guardarConfirmacionOperador(embarque.id, nombreOperador.trim())
        if (confirmacionGuardada) {
          setOperadorConfirmado({
            embarque_id: embarque.id,
            operador_nombre: nombreOperador.trim(),
            fecha_confirmacion: new Date().toISOString(),
          })
        }
      }

      // Mostrar resultado
      if (archivosSubidos > 0) {
        alert(
          `${archivosSubidos} archivo(s) subido(s) exitosamente${errores > 0 ? `. ${errores} archivo(s) fallaron.` : "."}`,
        )

        // Limpiar formulario
        setArchivosSeleccionados([])
        setObservaciones("")

        // Recargar fotos
        await cargarDatos()
      } else {
        alert("No se pudo subir ningún archivo. Revisa la consola para más detalles.")
      }
    } catch (error) {
      console.error("Error en proceso de subida:", error)
      alert("Error durante la subida de archivos")
    } finally {
      setSubiendo(false)
    }
  }

  const confirmarOperador = async () => {
    if (!embarque || !nombreOperador.trim()) {
      alert("Ingresa el nombre del operador")
      return
    }

    try {
      setConfirmandoOperador(true)

      const confirmacionGuardada = await guardarConfirmacionOperador(embarque.id, nombreOperador.trim())

      if (confirmacionGuardada) {
        setOperadorConfirmado({
          embarque_id: embarque.id,
          operador_nombre: nombreOperador.trim(),
          fecha_confirmacion: new Date().toISOString(),
        })
        alert("Operador confirmado exitosamente")
      } else {
        alert("Error al confirmar operador")
      }
    } catch (error) {
      console.error("Error confirmando operador:", error)
      alert("Error al confirmar operador")
    } finally {
      setConfirmandoOperador(false)
    }
  }

  const eliminarFoto = async (foto: FotoEmbarque) => {
    if (!confirm(`¿Estás seguro de eliminar la foto ${foto.nombre_archivo}?`)) {
      return
    }

    try {
      setEliminando(foto.id)
      console.log("Eliminando foto:", foto.nombre_archivo)

      // Eliminar de blob storage
      if (foto.url_blob) {
        // Extraer pathname de la URL
        const url = new URL(foto.url_blob)
        const pathname = url.pathname.substring(1) // Remover el primer "/"
        await eliminarFotoEmbarque(pathname)
        console.log("Foto eliminada de blob storage")
      }

      // Eliminar de la base de datos
      const { error } = await supabase.from("fotos_embarques").delete().eq("id", foto.id)

      if (error) {
        console.error("Error eliminando foto de BD:", error)
        alert("Error al eliminar la foto de la base de datos")
        return
      }

      console.log("Foto eliminada de BD")
      alert("Foto eliminada exitosamente")

      // Recargar fotos
      await cargarDatos()
    } catch (error) {
      console.error("Error eliminando foto:", error)
      alert("Error al eliminar la foto")
    } finally {
      setEliminando(null)
    }
  }

  const descargarFoto = (foto: FotoEmbarque) => {
    const link = document.createElement("a")
    link.href = foto.url_blob
    link.download = foto.nombre_archivo
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatearTamano = (bytes: number) => {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Embarque no encontrado</h2>
          <p className="text-gray-600 mb-4">No se pudo encontrar el embarque solicitado</p>
          <Button onClick={() => router.push("/embarques")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Embarques
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
            <Button variant="outline" onClick={() => router.push("/embarques")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Embarques
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Subir Fotos del Embarque</h1>
            <p className="text-gray-600 mt-2">
              Folio: <span className="font-semibold">{embarque.folio}</span>
            </p>
          </div>
          <div className="text-right">
            <Badge variant={operadorConfirmado ? "default" : "secondary"} className="mb-2">
              {operadorConfirmado ? "Operador Confirmado" : "Pendiente Confirmación"}
            </Badge>
            {operadorConfirmado && (
              <p className="text-sm text-gray-600">
                Por: {operadorConfirmado.operador_nombre}
                <br />
                {new Date(operadorConfirmado.fecha_confirmacion).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Información del embarque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Información del Embarque</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label className="text-sm font-medium text-gray-600">Origen - Destino</Label>
                <p className="text-sm">
                  {embarque.origen} → {embarque.destino}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Estado</Label>
                <Badge variant="outline">{embarque.estado}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Fotos</p>
                  <p className="text-2xl font-bold">{fotos.length}</p>
                </div>
                <ImageIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tamaño Total</p>
                  <p className="text-2xl font-bold">
                    {formatearTamano(fotos.reduce((total, foto) => total + (foto.tamano_bytes || 0), 0))}
                  </p>
                </div>
                <Upload className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="text-lg font-bold text-green-600">{operadorConfirmado ? "Confirmado" : "Pendiente"}</p>
                </div>
                {operadorConfirmado ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de subida */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Subir Nuevas Fotos</span>
            </CardTitle>
            <CardDescription>
              Selecciona las fotos o documentos del embarque. Formatos permitidos: JPG, PNG, GIF, PDF (máx. 10MB cada
              uno)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Confirmación del operador */}
            {!operadorConfirmado && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Primero confirma tu identidad como operador antes de subir fotos.</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreOperador">Nombre del Operador *</Label>
                <Input
                  id="nombreOperador"
                  value={nombreOperador}
                  onChange={(e) => setNombreOperador(e.target.value)}
                  placeholder="Ingresa tu nombre completo"
                  disabled={operadorConfirmado}
                />
                {!operadorConfirmado && (
                  <Button
                    onClick={confirmarOperador}
                    disabled={confirmandoOperador || !nombreOperador.trim()}
                    size="sm"
                  >
                    {confirmandoOperador ? "Confirmando..." : "Confirmar Operador"}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Comentarios adicionales sobre las fotos..."
                  rows={3}
                />
              </div>
            </div>

            {/* Selector de archivos */}
            <div className="space-y-2">
              <Label htmlFor="archivos">Seleccionar Archivos</Label>
              <Input
                id="archivos"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={manejarSeleccionArchivos}
                disabled={subiendo || !operadorConfirmado}
              />
            </div>

            {/* Vista previa de archivos seleccionados */}
            {archivosSeleccionados.length > 0 && (
              <div className="space-y-2">
                <Label>Archivos Seleccionados ({archivosSeleccionados.length})</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {archivosSeleccionados.map((archivo, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{archivo.name}</p>
                        <p className="text-xs text-gray-500">{formatearTamano(archivo.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarArchivoSeleccionado(index)}
                        disabled={subiendo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de subida */}
            <div className="flex justify-end">
              <Button
                onClick={subirArchivos}
                disabled={subiendo || archivosSeleccionados.length === 0 || !operadorConfirmado}
                className="min-w-[120px]"
              >
                {subiendo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Fotos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Galería de fotos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>Fotos del Embarque ({fotos.length})</span>
            </CardTitle>
            <CardDescription>Todas las fotos y documentos subidos para este embarque</CardDescription>
          </CardHeader>
          <CardContent>
            {fotos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
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

                      {/* Overlay con acciones */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="secondary" onClick={() => window.open(foto.url_blob, "_blank")}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => descargarFoto(foto)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Información del archivo */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate flex-1">{foto.nombre_archivo}</p>
                        <span className="text-xs text-gray-500 ml-2">
                          {foto.tamano_bytes ? formatearTamano(foto.tamano_bytes) : "N/A"}
                        </span>
                      </div>

                      {foto.subido_por && <p className="text-xs text-gray-600">Por: {foto.subido_por}</p>}

                      <p className="text-xs text-gray-400">{new Date(foto.fecha_subida).toLocaleString()}</p>

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
                          onClick={() => descargarFoto(foto)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Descargar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={eliminando === foto.id}>
                              {eliminando === foto.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600" />
                              ) : (
                                <Trash2 className="h-3 w-3 text-red-600" />
                              )}
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
      </div>
    </MainLayout>
  )
}
