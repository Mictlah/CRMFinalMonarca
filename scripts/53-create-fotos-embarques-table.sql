-- Crear tabla para almacenar metadatos de fotos de embarques
CREATE TABLE IF NOT EXISTS fotos_embarque (
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
CREATE INDEX IF NOT EXISTS idx_fotos_embarque_embarque_id ON fotos_embarque(embarque_id);
CREATE INDEX IF NOT EXISTS idx_fotos_embarque_fecha_subida ON fotos_embarque(fecha_subida);

-- Habilitar RLS (Row Level Security)
ALTER TABLE fotos_embarque ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Permitir todas las operaciones en fotos_embarque" ON fotos_embarque
    FOR ALL USING (true);

-- Comentarios para documentación
COMMENT ON TABLE fotos_embarque IS 'Tabla para almacenar metadatos de fotos subidas por operadores para cada embarque';
COMMENT ON COLUMN fotos_embarque.embarque_id IS 'ID del embarque al que pertenecen las fotos';
COMMENT ON COLUMN fotos_embarque.nombre_archivo IS 'Nombre original del archivo de imagen';
COMMENT ON COLUMN fotos_embarque.url_blob IS 'URL del blob donde se almacena la imagen';
COMMENT ON COLUMN fotos_embarque.tamano_bytes IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN fotos_embarque.tipo_mime IS 'Tipo MIME del archivo (image/jpeg, image/png, etc.)';
COMMENT ON COLUMN fotos_embarque.subido_por IS 'Nombre del operador que subió la foto';
