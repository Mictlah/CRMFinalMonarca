-- Verificar y corregir la estructura de la tabla embarque_modificaciones
-- Agregar columnas faltantes si no existen

-- Verificar si las columnas existen y agregarlas si es necesario
DO $$ 
BEGIN
    -- Verificar y agregar columna camion_nuevo_numero si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'camion_nuevo_numero') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN camion_nuevo_numero TEXT;
        RAISE NOTICE 'Columna camion_nuevo_numero agregada';
    END IF;

    -- Verificar y agregar columna remolque_nuevo_numero si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'remolque_nuevo_numero') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN remolque_nuevo_numero TEXT;
        RAISE NOTICE 'Columna remolque_nuevo_numero agregada';
    END IF;

    -- Verificar y agregar otras columnas que puedan faltar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'operador_nuevo_nombre') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN operador_nuevo_nombre TEXT;
        RAISE NOTICE 'Columna operador_nuevo_nombre agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'operador_original_nombre') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN operador_original_nombre TEXT;
        RAISE NOTICE 'Columna operador_original_nombre agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'camion_original_numero') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN camion_original_numero TEXT;
        RAISE NOTICE 'Columna camion_original_numero agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'remolque_original_numero') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN remolque_original_numero TEXT;
        RAISE NOTICE 'Columna remolque_original_numero agregada';
    END IF;

    -- Verificar campos de sueldo de operadores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'sueldo_operador_original') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN sueldo_operador_original DECIMAL(10,2);
        RAISE NOTICE 'Columna sueldo_operador_original agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'moneda_sueldo_operador_original') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN moneda_sueldo_operador_original VARCHAR(3) DEFAULT 'MXN';
        RAISE NOTICE 'Columna moneda_sueldo_operador_original agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'sueldo_operador_nuevo') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN sueldo_operador_nuevo DECIMAL(10,2);
        RAISE NOTICE 'Columna sueldo_operador_nuevo agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'moneda_sueldo_operador_nuevo') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN moneda_sueldo_operador_nuevo VARCHAR(3) DEFAULT 'MXN';
        RAISE NOTICE 'Columna moneda_sueldo_operador_nuevo agregada';
    END IF;

    -- Verificar campos de flete
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'precio_flete_original') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN precio_flete_original DECIMAL(10,2);
        RAISE NOTICE 'Columna precio_flete_original agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'precio_flete_nuevo') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN precio_flete_nuevo DECIMAL(10,2);
        RAISE NOTICE 'Columna precio_flete_nuevo agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'moneda_flete_original') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN moneda_flete_original VARCHAR(3) DEFAULT 'MXN';
        RAISE NOTICE 'Columna moneda_flete_original agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'moneda_flete_nueva') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN moneda_flete_nueva VARCHAR(3) DEFAULT 'MXN';
        RAISE NOTICE 'Columna moneda_flete_nueva agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'flete_en_falso') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN flete_en_falso BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna flete_en_falso agregada';
    END IF;

    -- Verificar campos de IDs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'operador_original_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN operador_original_id UUID;
        RAISE NOTICE 'Columna operador_original_id agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'operador_nuevo_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN operador_nuevo_id UUID;
        RAISE NOTICE 'Columna operador_nuevo_id agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'camion_original_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN camion_original_id UUID;
        RAISE NOTICE 'Columna camion_original_id agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'camion_nuevo_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN camion_nuevo_id UUID;
        RAISE NOTICE 'Columna camion_nuevo_id agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'remolque_original_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN remolque_original_id UUID;
        RAISE NOTICE 'Columna remolque_original_id agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'remolque_nuevo_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN remolque_nuevo_id UUID;
        RAISE NOTICE 'Columna remolque_nuevo_id agregada';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarque_modificaciones' 
                   AND column_name = 'usuario_modificacion') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN usuario_modificacion TEXT DEFAULT 'Sistema';
        RAISE NOTICE 'Columna usuario_modificacion agregada';
    END IF;

END $$;

-- Crear índices adicionales si no existen
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_embarque_id ON embarque_modificaciones(embarque_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_operador_original ON embarque_modificaciones(operador_original_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_operador_nuevo ON embarque_modificaciones(operador_nuevo_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_camion_original ON embarque_modificaciones(camion_original_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_camion_nuevo ON embarque_modificaciones(camion_nuevo_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_remolque_original ON embarque_modificaciones(remolque_original_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_remolque_nuevo ON embarque_modificaciones(remolque_nuevo_id);

-- Comentarios para documentación
COMMENT ON COLUMN embarque_modificaciones.camion_nuevo_numero IS 'Número económico del nuevo camión asignado';
COMMENT ON COLUMN embarque_modificaciones.remolque_nuevo_numero IS 'Número económico del nuevo remolque asignado';
COMMENT ON COLUMN embarque_modificaciones.camion_original_numero IS 'Número económico del camión original';
COMMENT ON COLUMN embarque_modificaciones.remolque_original_numero IS 'Número económico del remolque original';
COMMENT ON COLUMN embarque_modificaciones.operador_original_nombre IS 'Nombre completo del operador original';
COMMENT ON COLUMN embarque_modificaciones.operador_nuevo_nombre IS 'Nombre completo del nuevo operador';
COMMENT ON COLUMN embarque_modificaciones.sueldo_operador_original IS 'Sueldo del operador original';
COMMENT ON COLUMN embarque_modificaciones.sueldo_operador_nuevo IS 'Sueldo del nuevo operador';
COMMENT ON COLUMN embarque_modificaciones.flete_en_falso IS 'Indica si el flete fue marcado como falso';

-- Mostrar estructura final de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'embarque_modificaciones' 
ORDER BY ordinal_position;
