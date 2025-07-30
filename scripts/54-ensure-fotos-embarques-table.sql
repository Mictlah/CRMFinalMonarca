-- Crear tabla fotos_embarques si no existe
CREATE TABLE IF NOT EXISTS fotos_embarques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    embarque_id UUID NOT NULL REFERENCES embarques(id) ON DELETE CASCADE,
    nombre_archivo TEXT NOT NULL,
    url_blob TEXT NOT NULL,
    pathname_blob TEXT, -- Para almacenar el pathname de Vercel Blob
    tamano_bytes BIGINT,
    tipo_mime TEXT,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subido_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_fotos_embarques_embarque_id ON fotos_embarques(embarque_id);
CREATE INDEX IF NOT EXISTS idx_fotos_embarques_fecha_subida ON fotos_embarques(fecha_subida DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_fotos_embarques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS fotos_embarques_updated_at ON fotos_embarques;
CREATE TRIGGER fotos_embarques_updated_at
    BEFORE UPDATE ON fotos_embarques
    FOR EACH ROW
    EXECUTE FUNCTION update_fotos_embarques_updated_at();
