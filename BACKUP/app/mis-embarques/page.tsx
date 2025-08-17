"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Camera, CheckCircle } from "lucide-react"

export default function MisEmbarquesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Embarques</h1>
          <p className="text-gray-600 mt-2">Embarques asignados y estado actual</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            {
              id: "EMB-2024-001",
              client: "Empresa ABC S.A.",
              route: "México → Guadalajara",
              status: "En Tránsito",
              statusColor: "bg-blue-500",
            },
            {
              id: "EMB-2024-005",
              client: "Comercial XYZ",
              route: "Puebla → Veracruz",
              status: "Cargando",
              statusColor: "bg-yellow-500",
            },
          ].map((embarque, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{embarque.id}</CardTitle>
                    <CardDescription>{embarque.client}</CardDescription>
                  </div>
                  <Badge className={embarque.statusColor}>{embarque.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{embarque.route}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline">
                    <Camera className="h-4 w-4 mr-1" />
                    Subir Foto
                  </Button>
                  <Button size="sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Actualizar Estado
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Confirmar recogida de carga</p>
                  <p>• Subir fotos del proceso</p>
                  <p>• Actualizar ubicación</p>
                  <p>• Confirmar entrega</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
