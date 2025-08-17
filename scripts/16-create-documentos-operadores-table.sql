-- Crear tabla para documentos de operadores
CREATE TABLE IF NOT EXISTS documentos_operadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operador_id UUID NOT NULL REFERENCES operadores(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(100),
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo TEXT NOT NULL,
    pathname_archivo TEXT NOT NULL,
    tamaño_bytes INTEGER,
    tipo_mime VARCHAR(100),
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_documentos_operadores_operador_id ON documentos_operadores(operador_id);
CREATE INDEX IF NOT EXISTS idx_documentos_operadores_tipo ON documentos_operadores(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_operadores_fecha ON documentos_operadores(fecha_subida);

-- Agregar comentarios para documentación
COMMENT ON TABLE documentos_operadores IS 'Tabla para almacenar documentos e imágenes de operadores';
COMMENT ON COLUMN documentos_operadores.operador_id IS 'ID del operador al que pertenece el documento';
COMMENT ON COLUMN documentos_operadores.tipo_documento IS 'Tipo de documento (licencia, curp, rfc, ine, etc.)';
COMMENT ON COLUMN documentos_operadores.numero_documento IS 'Número o folio del documento';
COMMENT ON COLUMN documentos_operadores.nombre_archivo IS 'Nombre original del archivo';
COMMENT ON COLUMN documentos_operadores.url_archivo IS 'URL pública del archivo en Vercel Blob';
COMMENT ON COLUMN documentos_operadores.pathname_archivo IS 'Ruta del archivo para eliminación';
COMMENT ON COLUMN documentos_operadores.tamaño_bytes IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN documentos_operadores.tipo_mime IS 'Tipo MIME del archivo';
