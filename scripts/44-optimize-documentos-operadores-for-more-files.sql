-- Script para optimizar la tabla documentos_operadores para manejar más archivos por operador
-- Fecha: 2024

BEGIN;

-- Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documentos_operadores') THEN
        RAISE EXCEPTION 'La tabla documentos_operadores no existe. Ejecuta primero el script 16-create-documentos-operadores-table.sql';
    END IF;
END $$;

-- Agregar índice compuesto para mejorar rendimiento con más documentos
CREATE INDEX IF NOT EXISTS idx_documentos_operadores_operador_tipo_fecha 
ON documentos_operadores(operador_id, tipo_documento, fecha_subida DESC);

-- Agregar índice para búsquedas por nombre de archivo
CREATE INDEX IF NOT EXISTS idx_documentos_operadores_nombre_archivo 
ON documentos_operadores(nombre_archivo);

-- Optimizar la tabla para mejor rendimiento
VACUUM ANALYZE documentos_operadores;

-- Agregar constraint para limitar número de documentos por operador (opcional)
-- Esto es para evitar que se suban demasiados documentos por error
DO $$
BEGIN
    -- Verificar si ya existe el constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_max_documentos_por_operador'
    ) THEN
        -- Agregar función para verificar límite de documentos
        CREATE OR REPLACE FUNCTION check_max_documentos_operador()
        RETURNS TRIGGER AS $func$
        BEGIN
            IF (SELECT COUNT(*) FROM documentos_operadores WHERE operador_id = NEW.operador_id) >= 15 THEN
                RAISE EXCEPTION 'Un operador no puede tener más de 15 documentos';
            END IF;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Crear trigger para verificar límite
        CREATE TRIGGER trg_check_max_documentos
            BEFORE INSERT ON documentos_operadores
            FOR EACH ROW
            EXECUTE FUNCTION check_max_documentos_operador();
    END IF;
END $$;

-- Agregar comentarios actualizados
COMMENT ON TABLE documentos_operadores IS 'Tabla optimizada para almacenar hasta 15 documentos por operador';
COMMENT ON INDEX idx_documentos_operadores_operador_tipo_fecha IS 'Índice compuesto para mejorar consultas de documentos por operador';

-- Estadísticas finales
DO $$
DECLARE
    total_documentos INTEGER;
    operadores_con_docs INTEGER;
    promedio_docs_por_operador NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_documentos FROM documentos_operadores;
    
    SELECT COUNT(DISTINCT operador_id) INTO operadores_con_docs 
    FROM documentos_operadores;
    
    IF operadores_con_docs > 0 THEN
        promedio_docs_por_operador := total_documentos::NUMERIC / operadores_con_docs;
    ELSE
        promedio_docs_por_operador := 0;
    END IF;
    
    RAISE NOTICE '=== OPTIMIZACIÓN COMPLETADA ===';
    RAISE NOTICE 'Total de documentos: %', total_documentos;
    RAISE NOTICE 'Operadores con documentos: %', operadores_con_docs;
    RAISE NOTICE 'Promedio de documentos por operador: %', ROUND(promedio_docs_por_operador, 2);
    RAISE NOTICE 'Límite máximo por operador: 15 documentos';
    RAISE NOTICE 'Límite en interfaz: 10 documentos simultáneos';
END $$;

COMMIT;
