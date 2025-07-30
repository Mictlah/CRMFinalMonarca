-- Asegurar que la tabla fotos_embarques existe con la estructura correcta
-- Script: 54-ensure-fotos-embarques-table.sql

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS fotos_embarques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    embarque_id UUID NOT NULL REFERENCES embarques(id) ON DELETE CASCADE,
    nombre_archivo TEXT NOT NULL,
    url_blob TEXT NOT NULL,
    pathname_blob TEXT NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    tipo_mime TEXT NOT NULL,
    subido_por TEXT NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_fotos_embarques_embarque_id ON fotos_embarques(embarque_id);
CREATE INDEX IF NOT EXISTS idx_fotos_embarques_fecha_subida ON fotos_embarques(fecha_subida);

-- Habilitar RLS
ALTER TABLE fotos_embarques ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY IF NOT EXISTS "Usuarios pueden ver fotos de embarques" ON fotos_embarques
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserción a usuarios autenticados
CREATE POLICY IF NOT EXISTS "Usuarios pueden subir fotos de embarques" ON fotos_embarques
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir eliminación a usuarios autenticados
CREATE POLICY IF NOT EXISTS "Usuarios pueden eliminar fotos de embarques" ON fotos_embarques
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comentarios para documentación
COMMENT ON TABLE fotos_embarques IS 'Almacena las fotos subidas para cada embarque';
COMMENT ON COLUMN fotos_embarques.embarque_id IS 'ID del embarque al que pertenece la foto';
COMMENT ON COLUMN fotos_embarques.nombre_archivo IS 'Nombre original del archivo';
COMMENT ON COLUMN fotos_embarques.url_blob IS 'URL pública del archivo en Vercel Blob';
COMMENT ON COLUMN fotos_embarques.pathname_blob IS 'Pathname del archivo en Vercel Blob para eliminación';
COMMENT ON COLUMN fotos_embarques.tamano_bytes IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN fotos_embarques.tipo_mime IS 'Tipo MIME del archivo';
COMMENT ON COLUMN fotos_embarques.subido_por IS 'Nombre del usuario que subió la foto';

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'fotos_embarques'
ORDER BY ordinal_position;
