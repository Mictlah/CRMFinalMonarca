-- Script para crear la tabla de registros de kilometraje
-- Versión: 1.0
-- Fecha: 2024

-- Crear tabla para registros de kilometraje de camiones
CREATE TABLE IF NOT EXISTS registros_kilometraje (
    -- Identificador único del registro
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referencia al camión (con eliminación en cascada)
    camion_id UUID NOT NULL REFERENCES camiones(id) ON DELETE CASCADE,
    
    -- Kilometraje antes del viaje
    kilometraje_anterior INTEGER NOT NULL DEFAULT 0,
    
    -- Kilómetros agregados en este viaje
    kilometraje_agregado INTEGER NOT NULL,
    
    -- Kilometraje total después del viaje
    kilometraje_nuevo INTEGER NOT NULL,
    
    -- Descripción del tramo recorrido
    tramo_recorrido TEXT NOT NULL,
    
    -- Fecha del viaje
    fecha_viaje DATE NOT NULL,
    
    -- Comentarios adicionales sobre el viaje
    comentarios TEXT,
    
    -- Timestamps automáticos
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_registros_kilometraje_camion_id ON registros_kilometraje(camion_id);
CREATE INDEX IF NOT EXISTS idx_registros_kilometraje_fecha_viaje ON registros_kilometraje(fecha_viaje);
CREATE INDEX IF NOT EXISTS idx_registros_kilometraje_fecha_registro ON registros_kilometraje(fecha_registro);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_registros_kilometraje_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_registros_kilometraje_updated_at
    BEFORE UPDATE ON registros_kilometraje
    FOR EACH ROW
    EXECUTE FUNCTION update_registros_kilometraje_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE registros_kilometraje IS 'Tabla para almacenar el historial de kilometraje de los camiones';
COMMENT ON COLUMN registros_kilometraje.id IS 'Identificador único del registro de kilometraje';
COMMENT ON COLUMN registros_kilometraje.camion_id IS 'Referencia al camión al que pertenece este registro';
COMMENT ON COLUMN registros_kilometraje.kilometraje_anterior IS 'Kilometraje del camión antes de este viaje';
COMMENT ON COLUMN registros_kilometraje.kilometraje_agregado IS 'Kilómetros recorridos en este viaje específico';
COMMENT ON COLUMN registros_kilometraje.kilometraje_nuevo IS 'Kilometraje total del camión después de este viaje';
COMMENT ON COLUMN registros_kilometraje.tramo_recorrido IS 'Descripción de la ruta o tramo recorrido';
COMMENT ON COLUMN registros_kilometraje.fecha_viaje IS 'Fecha en que se realizó el viaje';
COMMENT ON COLUMN registros_kilometraje.comentarios IS 'Comentarios adicionales sobre el viaje o condiciones especiales';
COMMENT ON COLUMN registros_kilometraje.fecha_registro IS 'Fecha y hora en que se registró este record en el sistema';
COMMENT ON COLUMN registros_kilometraje.updated_at IS 'Fecha y hora de la última actualización del registro';
