-- Agregar columna numero_serie a la tabla camiones
ALTER TABLE camiones 
ADD COLUMN IF NOT EXISTS numero_serie VARCHAR(100);

-- Crear índice para mejorar rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_camiones_numero_serie ON camiones(numero_serie);

-- Comentario sobre la columna
COMMENT ON COLUMN camiones.numero_serie IS 'Número de serie del vehículo';
