import { useState, useEffect } from "react"

export function useUbicacion(autoFetch = true) {
    const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [cargando, setCargando] = useState(false)

    const obtenerUbicacion = () => {
        if (!navigator.geolocation) {
            setError("Geolocalización no está disponible en este navegador.")
            return
        }

        setCargando(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUbicacion({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                })
                setError(null)
                setCargando(false)
            },
            (err) => {
                setError("No se pudo obtener la ubicación.")
                setUbicacion(null)
                setCargando(false)
                console.error(err)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    useEffect(() => {
        if (autoFetch) obtenerUbicacion()
    }, [autoFetch])

    return { ubicacion, obtenerUbicacion, error, cargando }
}
