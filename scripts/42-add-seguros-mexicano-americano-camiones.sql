-- Script para agregar campos de seguros mexicano y americano a la tabla camiones
-- Fecha: 2024-01-21
-- Descripción: Separar la información de seguros en mexicano y americano

-- Verificar si la tabla camiones existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'camiones') THEN
        RAISE EXCEPTION 'La tabla camiones no existe. Ejecuta primero los scripts de creación de tablas.';
    END IF;
END $$;

-- Agregar columnas para seguro mexicano (si no existen)
DO $$
BEGIN
    -- Verificar y agregar poliza_seguro_mexicano
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'camiones' AND column_name = 'poliza_seguro_mexicano'
    ) THEN
        ALTER TABLE camiones ADD COLUMN poliza_seguro_mexicano VARCHAR(100);
        RAISE NOTICE 'Columna poliza_seguro_mexicano agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna poliza_seguro_mexicano ya existe';
    END IF;

    -- Verificar y agregar fecha_vencimiento_seguro_mexicano
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'camiones' AND column_name = 'fecha_vencimiento_seguro_mexicano'
    ) THEN
        ALTER TABLE camiones ADD COLUMN fecha_vencimiento_seguro_mexicano DATE;
        RAISE NOTICE 'Columna fecha_vencimiento_seguro_mexicano agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna fecha_vencimiento_seguro_mexicano ya existe';
    END IF;

    -- Verificar y agregar poliza_seguro_americano
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'camiones' AND column_name = 'poliza_seguro_americano'
    ) THEN
        ALTER TABLE camiones ADD COLUMN poliza_seguro_americano VARCHAR(100);
        RAISE NOTICE 'Columna poliza_seguro_americano agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna poliza_seguro_americano ya existe';
    END IF;

    -- Verificar y agregar fecha_vencimiento_seguro_americano
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'camiones' AND column_name = 'fecha_vencimiento_seguro_americano'
    ) THEN
        ALTER TABLE camiones ADD COLUMN fecha_vencimiento_seguro_americano DATE;
        RAISE NOTICE 'Columna fecha_vencimiento_seguro_americano agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna fecha_vencimiento_seguro_americano ya existe';
    END IF;
END $$;

-- Migrar datos existentes del campo poliza_seguro al nuevo campo poliza_seguro_mexicano
-- Solo si existe el campo poliza_seguro y hay datos
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'camiones' AND column_name = 'poliza_seguro'
    ) THEN
        -- Migrar datos de poliza_seguro a poliza_seguro_mexicano donde no sea nulo
        UPDATE camiones 
        SET poliza_seguro_mexicano = poliza_seguro 
        WHERE poliza_seguro IS NOT NULL 
        AND poliza_seguro != '' 
        AND poliza_seguro_mexicano IS NULL;
        
        RAISE NOTICE 'Datos migrados de poliza_seguro a poliza_seguro_mexicano';
    END IF;
END $$;

-- Migrar datos existentes del campo fecha_vencimiento_seguro al nuevo campo fecha_vencimiento_seguro_mexicano
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'camiones' AND column_name = 'fecha_vencimiento_seguro'
    ) THEN
        -- Migrar datos de fecha_vencimiento_seguro a fecha_vencimiento_seguro_mexicano donde no sea nulo
        UPDATE camiones 
        SET fecha_vencimiento_seguro_mexicano = fecha_vencimiento_seguro 
        WHERE fecha_vencimiento_seguro IS NOT NULL 
        AND fecha_vencimiento_seguro_mexicano IS NULL;
        
        RAISE NOTICE 'Datos migrados de fecha_vencimiento_seguro a fecha_vencimiento_seguro_mexicano';
    END IF;
END $$;

-- Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN camiones.poliza_seguro_mexicano IS 'Número de póliza del seguro mexicano del camión';
COMMENT ON COLUMN camiones.fecha_vencimiento_seguro_mexicano IS 'Fecha de vencimiento del seguro mexicano';
COMMENT ON COLUMN camiones.poliza_seguro_americano IS 'Número de póliza del seguro americano del camión';
COMMENT ON COLUMN camiones.fecha_vencimiento_seguro_americano IS 'Fecha de vencimiento del seguro americano';

-- Crear índices para mejorar el rendimiento en consultas de vencimientos
CREATE INDEX IF NOT EXISTS idx_camiones_vencimiento_seguro_mexicano 
ON camiones(fecha_vencimiento_seguro_mexicano) 
WHERE fecha_vencimiento_seguro_mexicano IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_camiones_vencimiento_seguro_americano 
ON camiones(fecha_vencimiento_seguro_americano) 
WHERE fecha_vencimiento_seguro_americano IS NOT NULL;

-- Mostrar resumen de la migración
DO $$
DECLARE
    total_camiones INTEGER;
    con_seguro_mexicano INTEGER;
    con_seguro_americano INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_camiones FROM camiones;
    
    SELECT COUNT(*) INTO con_seguro_mexicano 
    FROM camiones 
    WHERE poliza_seguro_mexicano IS NOT NULL AND poliza_seguro_mexicano != '';
    
    SELECT COUNT(*) INTO con_seguro_americano 
    FROM camiones 
    WHERE poliza_seguro_americano IS NOT NULL AND poliza_seguro_americano != '';
    
    RAISE NOTICE '=== RESUMEN DE MIGRACIÓN ===';
    RAISE NOTICE 'Total de camiones: %', total_camiones;
    RAISE NOTICE 'Camiones con seguro mexicano: %', con_seguro_mexicano;
    RAISE NOTICE 'Camiones con seguro americano: %', con_seguro_americano;
    RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
END $$;
