-- Tabla para almacenar los metadatos de las fotos de los embarques
CREATE TABLE IF NOT EXISTS fotos_embarque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embarque_id UUID NOT NULL REFERENCES embarques(id) ON DELETE CASCADE,
    nombre_archivo TEXT NOT NULL,
    url_blob TEXT NOT NULL,
    tamano_bytes BIGINT,
    tipo_mime TEXT,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subido_por TEXT, -- Nombre del operador o ID si se integra con autenticación de operador
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_fotos_embarque_embarque_id ON fotos_embarque(embarque_id);
CREATE INDEX IF NOT EXISTS idx_fotos_embarque_fecha_subida ON fotos_embarque(fecha_subida DESC);

-- Habilitar RLS para la tabla fotos_embarque
ALTER TABLE fotos_embarque ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios autenticados puedan ver sus propias fotos
DROP POLICY IF EXISTS "Enable read access for authenticated users to photos" ON fotos_embarque;
CREATE POLICY "Enable read access for authenticated users to photos"
ON fotos_embarque FOR SELECT
TO authenticated
USING (TRUE); -- Permitir lectura a todos los usuarios autenticados, ajustar si es necesario

-- Política para que los usuarios autenticados puedan insertar fotos
DROP POLICY IF EXISTS "Enable insert access for authenticated users to photos" ON fotos_embarque;
CREATE POLICY "Enable insert access for authenticated users to photos"
ON fotos_embarque FOR INSERT
TO authenticated
WITH CHECK (TRUE); -- Permitir inserción a todos los usuarios autenticados, ajustar si es necesario
