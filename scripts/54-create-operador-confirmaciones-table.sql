-- Crear tabla para confirmaciones de operadores en embarques
CREATE TABLE IF NOT EXISTS operador_confirmaciones_embarque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    embarque_id UUID NOT NULL REFERENCES embarques(id) ON DELETE CASCADE,
    operador_nombre VARCHAR(255) NOT NULL,
    fecha_confirmacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_operador_confirmaciones_embarque_id ON operador_confirmaciones_embarque(embarque_id);
CREATE INDEX IF NOT EXISTS idx_operador_confirmaciones_fecha ON operador_confirmaciones_embarque(fecha_confirmacion);

-- Comentarios para documentar la tabla
COMMENT ON TABLE operador_confirmaciones_embarque IS 'Tabla para registrar las confirmaciones de operadores cuando acceden al formulario de fotos de embarque';
COMMENT ON COLUMN operador_confirmaciones_embarque.embarque_id IS 'ID del embarque al que pertenece la confirmación';
COMMENT ON COLUMN operador_confirmaciones_embarque.operador_nombre IS 'Nombre del operador que confirmó los datos';
COMMENT ON COLUMN operador_confirmaciones_embarque.fecha_confirmacion IS 'Fecha y hora cuando se realizó la confirmación';
