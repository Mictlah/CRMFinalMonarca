-- Script para actualizar la tabla de operadores con nuevos campos
-- Ejecutar este script para agregar los campos necesarios

-- Verificar si la tabla operadores existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'operadores') THEN
        RAISE EXCEPTION 'La tabla operadores no existe. Ejecuta primero el script de creación de tablas.';
    END IF;
END $$;

-- Agregar nuevas columnas si no existen
DO $$ 
BEGIN
    -- Agregar fecha_vencimiento_apto_medico
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'fecha_vencimiento_apto_medico') THEN
        ALTER TABLE operadores ADD COLUMN fecha_vencimiento_apto_medico DATE;
        RAISE NOTICE 'Columna fecha_vencimiento_apto_medico agregada';
    ELSE
        RAISE NOTICE 'Columna fecha_vencimiento_apto_medico ya existe';
    END IF;

    -- Agregar tipo_sangre
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'tipo_sangre') THEN
        ALTER TABLE operadores ADD COLUMN tipo_sangre VARCHAR(5);
        RAISE NOTICE 'Columna tipo_sangre agregada';
    ELSE
        RAISE NOTICE 'Columna tipo_sangre ya existe';
    END IF;

    -- Agregar familiares
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'familiares') THEN
        ALTER TABLE operadores ADD COLUMN familiares TEXT;
        RAISE NOTICE 'Columna familiares agregada';
    ELSE
        RAISE NOTICE 'Columna familiares ya existe';
    END IF;
END $$;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN operadores.fecha_vencimiento_apto_medico IS 'Fecha de vencimiento del certificado médico del operador';
COMMENT ON COLUMN operadores.tipo_sangre IS 'Tipo de sangre del operador (A+, A-, B+, B-, AB+, AB-, O+, O-)';
COMMENT ON COLUMN operadores.familiares IS 'Información de familiares en formato JSON (máximo 5)';

-- Crear índices para mejorar rendimiento en consultas de vencimientos
CREATE INDEX IF NOT EXISTS idx_operadores_vencimiento_licencia 
ON operadores(fecha_vencimiento_licencia) 
WHERE fecha_vencimiento_licencia IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_operadores_vencimiento_apto_medico 
ON operadores(fecha_vencimiento_apto_medico) 
WHERE fecha_vencimiento_apto_medico IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_operadores_tipo_sangre 
ON operadores(tipo_sangre) 
WHERE tipo_sangre IS NOT NULL;

-- Crear o actualizar la función de trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_operadores_updated_at ON operadores;
CREATE TRIGGER update_operadores_updated_at
    BEFORE UPDATE ON operadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Agregar constraints para validación
DO $$
BEGIN
    -- Constraint para tipos de sangre válidos
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'check_tipo_sangre') THEN
        ALTER TABLE operadores 
        ADD CONSTRAINT check_tipo_sangre 
        CHECK (tipo_sangre IS NULL OR tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
        RAISE NOTICE 'Constraint check_tipo_sangre agregado';
    ELSE
        RAISE NOTICE 'Constraint check_tipo_sangre ya existe';
    END IF;

    -- Constraint para validar JSON de familiares
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'check_familiares_json') THEN
        ALTER TABLE operadores 
        ADD CONSTRAINT check_familiares_json 
        CHECK (familiares IS NULL OR (familiares::json IS NOT NULL));
        RAISE NOTICE 'Constraint check_familiares_json agregado';
    ELSE
        RAISE NOTICE 'Constraint check_familiares_json ya existe';
    END IF;
END $$;

-- Mostrar el resultado
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'operadores' 
ORDER BY ordinal_position;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=== SCRIPT COMPLETADO EXITOSAMENTE ===';
    RAISE NOTICE 'La tabla operadores ha sido actualizada con los nuevos campos:';
    RAISE NOTICE '- fecha_vencimiento_apto_medico (DATE)';
    RAISE NOTICE '- tipo_sangre (VARCHAR(5))';
    RAISE NOTICE '- familiares (TEXT - JSON)';
    RAISE NOTICE 'Índices y constraints agregados correctamente.';
    RAISE NOTICE '========================================';
END $$;
