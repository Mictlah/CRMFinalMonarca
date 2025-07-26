-- Agregar columna observaciones a la tabla remolques
ALTER TABLE remolques ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Agregar comentario a la columna
COMMENT ON COLUMN remolques.observaciones IS 'Información adicional del remolque en formato JSON';

-- Crear índice para búsquedas en el campo observaciones (opcional)
CREATE INDEX IF NOT EXISTS idx_remolques_observaciones ON remolques USING gin ((observaciones::jsonb));
