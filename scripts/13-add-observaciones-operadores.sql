-- Script para agregar la columna observaciones y corregir restricciones
-- Ejecutar este script para solucionar el error de NSS

-- 1. Agregar columna observaciones si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'operadores' 
        AND column_name = 'observaciones'
    ) THEN
        ALTER TABLE operadores ADD COLUMN observaciones TEXT;
        RAISE NOTICE 'Columna observaciones agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna observaciones ya existe';
    END IF;
END $$;

-- 2. Eliminar restricción problemática de NSS si existe
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_nss_length'
    ) THEN
        ALTER TABLE operadores DROP CONSTRAINT check_nss_length;
        RAISE NOTICE 'Restricción check_nss_length eliminada';
    ELSE
        RAISE NOTICE 'Restricción check_nss_length no existe';
    END IF;
END $$;

-- 3. Agregar nueva restricción flexible para NSS
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_nss_valid'
    ) THEN
        ALTER TABLE operadores ADD CONSTRAINT check_nss_valid 
        CHECK (nss IS NULL OR (nss ~ '^[0-9]{11}$'));
        RAISE NOTICE 'Nueva restricción check_nss_valid agregada';
    ELSE
        RAISE NOTICE 'Restricción check_nss_valid ya existe';
    END IF;
END $$;

-- 4. Verificar y corregir datos existentes de NSS
UPDATE operadores 
SET nss = NULL 
WHERE nss IS NOT NULL 
AND (LENGTH(nss) != 11 OR nss !~ '^[0-9]+$');

-- 5. Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_operadores_estado ON operadores(estado);
CREATE INDEX IF NOT EXISTS idx_operadores_fecha_vencimiento_licencia ON operadores(fecha_vencimiento_licencia);
CREATE INDEX IF NOT EXISTS idx_operadores_fecha_vencimiento_apto_medico ON operadores(fecha_vencimiento_apto_medico);

-- 6. Mostrar resumen de la tabla
DO $$ 
DECLARE 
    total_operadores INTEGER;
    operadores_activos INTEGER;
    operadores_con_observaciones INTEGER;
BEGIN 
    SELECT COUNT(*) INTO total_operadores FROM operadores;
    SELECT COUNT(*) INTO operadores_activos FROM operadores WHERE estado = 'activo';
    SELECT COUNT(*) INTO operadores_con_observaciones FROM operadores WHERE observaciones IS NOT NULL;
    
    RAISE NOTICE '=== RESUMEN DE OPERADORES ===';
    RAISE NOTICE 'Total de operadores: %', total_operadores;
    RAISE NOTICE 'Operadores activos: %', operadores_activos;
    RAISE NOTICE 'Operadores con observaciones: %', operadores_con_observaciones;
    RAISE NOTICE '============================';
END $$;
