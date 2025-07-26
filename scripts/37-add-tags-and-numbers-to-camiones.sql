-- Script para agregar campos de tags y números adicionales a la tabla camiones
-- Fecha: 2024-01-20
-- Descripción: Agrega campos para tag americano, tag mexicano, número de base y números adicionales

-- Verificar si la tabla camiones existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'camiones') THEN
        RAISE EXCEPTION 'La tabla camiones no existe. Ejecuta primero los scripts de creación de tablas.';
    END IF;
END $$;

-- Agregar columnas para tags y números si no existen
DO $$
BEGIN
    -- Tag Americano
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'camiones' AND column_name = 'tag_americano') THEN
        ALTER TABLE camiones ADD COLUMN tag_americano VARCHAR(50);
        RAISE NOTICE 'Columna tag_americano agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna tag_americano ya existe';
    END IF;

    -- Tag Mexicano
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'camiones' AND column_name = 'tag_mexicano') THEN
        ALTER TABLE camiones ADD COLUMN tag_mexicano VARCHAR(50);
        RAISE NOTICE 'Columna tag_mexicano agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna tag_mexicano ya existe';
    END IF;

    -- Número de Base
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'camiones' AND column_name = 'numero_base') THEN
        ALTER TABLE camiones ADD COLUMN numero_base VARCHAR(50);
        RAISE NOTICE 'Columna numero_base agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna numero_base ya existe';
    END IF;

    -- Números adicionales (JSON para almacenar array de objetos con nombre y número)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'camiones' AND column_name = 'numeros_adicionales') THEN
        ALTER TABLE camiones ADD COLUMN numeros_adicionales JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna numeros_adicionales agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna numeros_adicionales ya existe';
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento de búsquedas
DO $$
BEGIN
    -- Índice para tag americano
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_camiones_tag_americano') THEN
        CREATE INDEX idx_camiones_tag_americano ON camiones(tag_americano) WHERE tag_americano IS NOT NULL;
        RAISE NOTICE 'Índice idx_camiones_tag_americano creado exitosamente';
    END IF;

    -- Índice para tag mexicano
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_camiones_tag_mexicano') THEN
        CREATE INDEX idx_camiones_tag_mexicano ON camiones(tag_mexicano) WHERE tag_mexicano IS NOT NULL;
        RAISE NOTICE 'Índice idx_camiones_tag_mexicano creado exitosamente';
    END IF;

    -- Índice para número de base
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_camiones_numero_base') THEN
        CREATE INDEX idx_camiones_numero_base ON camiones(numero_base) WHERE numero_base IS NOT NULL;
        RAISE NOTICE 'Índice idx_camiones_numero_base creado exitosamente';
    END IF;

    -- Índice GIN para números adicionales (para búsquedas en JSON)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_camiones_numeros_adicionales') THEN
        CREATE INDEX idx_camiones_numeros_adicionales ON camiones USING GIN(numeros_adicionales);
        RAISE NOTICE 'Índice idx_camiones_numeros_adicionales creado exitosamente';
    END IF;
END $$;

-- Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN camiones.tag_americano IS 'Número de tag para tránsito en Estados Unidos';
COMMENT ON COLUMN camiones.tag_mexicano IS 'Número de tag para tránsito en México';
COMMENT ON COLUMN camiones.numero_base IS 'Número de base o identificador interno';
COMMENT ON COLUMN camiones.numeros_adicionales IS 'Array JSON con números adicionales personalizables [{"nombre": "Permiso SCT", "numero": "SCT123456"}]';

-- Verificar que las columnas se crearon correctamente
DO $$
DECLARE
    columnas_agregadas INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO columnas_agregadas
    FROM information_schema.columns 
    WHERE table_name = 'camiones' 
    AND column_name IN ('tag_americano', 'tag_mexicano', 'numero_base', 'numeros_adicionales');
    
    IF columnas_agregadas = 4 THEN
        RAISE NOTICE '✅ MIGRACIÓN COMPLETADA: Todas las columnas de tags y números fueron agregadas exitosamente';
        RAISE NOTICE 'Columnas agregadas: tag_americano, tag_mexicano, numero_base, numeros_adicionales';
        RAISE NOTICE 'Índices creados para optimizar búsquedas';
    ELSE
        RAISE WARNING '⚠️ MIGRACIÓN INCOMPLETA: Solo se agregaron % de 4 columnas esperadas', columnas_agregadas;
    END IF;
END $$;

-- Mostrar estructura actualizada de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'camiones' 
AND column_name IN ('tag_americano', 'tag_mexicano', 'numero_base', 'numeros_adicionales')
ORDER BY ordinal_position;
