-- Agregar columnas faltantes a la tabla remolques
ALTER TABLE remolques 
ADD COLUMN IF NOT EXISTS marca VARCHAR(100),
ADD COLUMN IF NOT EXISTS modelo VARCHAR(100),
ADD COLUMN IF NOT EXISTS año INTEGER,
ADD COLUMN IF NOT EXISTS numero_serie VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_ultima_inspeccion DATE,
ADD COLUMN IF NOT EXISTS proxima_inspeccion DATE,
ADD COLUMN IF NOT EXISTS poliza_seguro VARCHAR(100),
ADD COLUMN IF NOT EXISTS vigencia_seguro DATE,
ADD COLUMN IF NOT EXISTS comentarios TEXT,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_remolques_activo ON remolques(activo);
CREATE INDEX IF NOT EXISTS idx_remolques_estado ON remolques(estado);
CREATE INDEX IF NOT EXISTS idx_remolques_marca ON remolques(marca);

-- Actualizar remolques existentes para que sean activos por defecto
UPDATE remolques SET activo = true WHERE activo IS NULL;
