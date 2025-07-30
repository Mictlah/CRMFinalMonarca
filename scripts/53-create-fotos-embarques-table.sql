-- Crear tabla para almacenar metadatos de fotos de embarques
CREATE TABLE IF NOT EXISTS fotos_embarques ( -- CAMBIO: de fotos_embarque a fotos_embarques
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    embarque_id UUID NOT NULL REFERENCES embarques(id) ON DELETE CASCADE,
    nombre_archivo TEXT NOT NULL,
    url_blob TEXT NOT NULL,
    tamano_bytes BIGINT,
    tipo_mime TEXT,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subido_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_fotos_embarques_embarque_id ON fotos_embarques(embarque_id); -- CAMBIO: de fotos_embarque a fotos_embarques
CREATE INDEX IF NOT EXISTS idx_fotos_embarques_fecha_subida ON fotos_embarques(fecha_subida); -- CAMBIO: de fotos_embarque a fotos_embarques

-- Habilitar RLS (Row Level Security)
ALTER TABLE fotos_embarques ENABLE ROW LEVEL SECURITY; -- CAMBIO: de fotos_embarque a fotos_embarques

-- Crear política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Permitir todas las operaciones en fotos_embarques" ON fotos_embarques -- CAMBIO: de fotos_embarque a fotos_embarques
    FOR ALL USING (true);

-- Comentarios para documentación
COMMENT ON TABLE fotos_embarques IS 'Tabla para almacenar metadatos de fotos subidas por operadores para cada embarque'; -- CAMBIO: de fotos_embarque a fotos_embarques
COMMENT ON COLUMN fotos_embarques.embarque_id IS 'ID del embarque al que pertenecen las fotos'; -- CAMBIO: de fotos_embarque a fotos_embarques
COMMENT ON COLUMN fotos_embarques.nombre_archivo IS 'Nombre original del archivo de imagen'; -- CAMBIO: de fotos_embarque a fotos_embarques
COMMENT ON COLUMN fotos_embarques.url_blob IS 'URL del blob donde se almacena la imagen'; -- CAMBIO: de fotos_embarque a fotos_embarques
COMMENT ON COLUMN fotos_embarques.tamano_bytes IS 'Tamaño del archivo en bytes'; -- CAMBIO: de fotos_embarque a fotos_embarques
COMMENT ON COLUMN fotos_embarques.tipo_mime IS 'Tipo MIME del archivo (image/jpeg, image/png, etc.)'; -- CAMBIO: de fotos_embarque a fotos_embarques
COMMENT ON COLUMN fotos_embarques.subido_por IS 'Nombre del operador que subió la foto'; -- CAMBIO: de fotos_embarque a fotos_embarques
