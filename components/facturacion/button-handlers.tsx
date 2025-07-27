"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Users, Package, FileText, Edit } from "lucide-react"
import { useFacturacion } from "@/hooks/use-facturacion"

interface ButtonHandlersProps {
  filtros?: any
  embarqueSeleccionado?: any
  onOpenModal?: (modalType: string, data?: any) => void
}

export const ButtonHandlers = ({ filtros, embarqueSeleccionado, onOpenModal }: ButtonHandlersProps) => {
  const {
    generarReporteExcel,
    actualizarEstadoFacturacion,
    guardarDatosFacturacion,
    archivarEmbarque,
    generarAnalisisOperadores,
    exportarAnalisisExcel,
    imprimirReporteOperadores,
    cargarDatosCliente,
    exportarDatosCliente,
  } = useFacturacion()

  const [loading, setLoading] = useState(false)

  // Handler para generar reporte Excel
  const handleGenerarReporte = async () => {
    setLoading(true)
    try {
      const resultado = generarReporteExcel(filtros)
      if (resultado.success) {
        alert(resultado.mensaje)
      } else {
        alert(resultado.mensaje)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al generar el reporte")
    } finally {
      setLoading(false)
    }
  }

  // Handler para cambiar estado de facturación
  const handleCambiarEstado = async (embarqueId: string, nuevoEstado: string) => {
    if (nuevoEstado === "archivado") {
      onOpenModal?.("archivar", { embarqueId })
      return
    }

    setLoading(true)
    try {
      const resultado = await actualizarEstadoFacturacion(embarqueId, nuevoEstado)
      if (resultado.success) {
        console.log("Estado actualizado exitosamente")
      } else {
        alert("Error al actualizar el estado")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar el estado")
    } finally {
      setLoading(false)
    }
  }

  // Handler para abrir modal de facturación
  const handleAbrirFacturacion = (embarque: any) => {
    onOpenModal?.("facturacion", embarque)
  }

  // Handler para ver detalles
  const handleVerDetalles = (embarque: any) => {
    onOpenModal?.("detalles", embarque)
  }

  // Handler para editar embarque
  const handleEditarEmbarque = (embarque: any) => {
    onOpenModal?.("editar", embarque)
  }

  // Handler para análisis de operadores
  const handleAnalisisOperadores = () => {
    onOpenModal?.("analisis-operadores")
  }

  // Handler para consulta de clientes
  const handleConsultaClientes = () => {
    onOpenModal?.("consulta-clientes")
  }

  // Handler para gestión de crédito
  const handleGestionCredito = () => {
    onOpenModal?.("gestion-credito")
  }

  // Handler para tipos de servicio
  const handleTiposServicio = () => {
    onOpenModal?.("tipos-servicio")
  }

  // Handler para registros archivados
  const handleRegistrosArchivados = () => {
    onOpenModal?.("registros-archivados")
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Botón para generar reporte */}
      <Button onClick={handleGenerarReporte} variant="outline" disabled={loading}>
        <Download className="h-4 w-4 mr-2" />
        {loading ? "Generando..." : "Descargar Reportes"}
      </Button>

      {/* Botón para gestión de crédito */}
      <Button onClick={handleGestionCredito} variant="outline">
        <Users className="h-4 w-4 mr-2" />
        Crédito Cliente
      </Button>

      {/* Botón para consulta de clientes */}
      <Button onClick={handleConsultaClientes} variant="outline">
        <Users className="h-4 w-4 mr-2" />
        CLIENTE
      </Button>

      {/* Botón para análisis de operadores */}
      <Button onClick={handleAnalisisOperadores} variant="outline">
        <Users className="h-4 w-4 mr-2" />
        Operadores
      </Button>

      {/* Botón para tipos de servicio */}
      <Button onClick={handleTiposServicio} variant="outline">
        <Package className="h-4 w-4 mr-2" />
        Tipos de Servicio
      </Button>

      {/* Botón para registros archivados */}
      <Button onClick={handleRegistrosArchivados} variant="outline">
        <Package className="h-4 w-4 mr-2" />
        Ver Archivos
      </Button>

      {/* Botones específicos para embarques */}
      {embarqueSeleccionado && (
        <>
          <Button variant="outline" size="sm" onClick={() => handleAbrirFacturacion(embarqueSeleccionado)}>
            <FileText className="h-4 w-4 mr-1" />
            Facturación
          </Button>

          <Button variant="outline" size="sm" onClick={() => handleVerDetalles(embarqueSeleccionado)}>
            <FileText className="h-4 w-4 mr-1" />
            Ver Detalles
          </Button>

          <Button variant="outline" size="sm" onClick={() => handleEditarEmbarque(embarqueSeleccionado)}>
            <Edit className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}

// Componente para botones de estado de facturación
export const EstadoFacturacionSelect = ({
  embarque,
  onCambiarEstado,
}: {
  embarque: any
  onCambiarEstado: (embarqueId: string, nuevoEstado: string) => void
}) => {
  return (
    <select
      value={embarque.estado_facturacion || "pendiente_facturacion"}
      onChange={(e) => onCambiarEstado(embarque.id, e.target.value)}
      className="w-40 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="pendiente_facturacion">Pendiente Facturación</option>
      <option value="facturado">Facturado</option>
      <option value="pagado">Pagado</option>
      <option value="archivado">Archivar Registro</option>
    </select>
  )
}
