-- Verificar y actualizar campos de estado en operadores y camiones

-- 1. Verificar si la columna 'estado' existe en operadores
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'operadores' AND column_name = 'estado'
    ) THEN
        ALTER TABLE operadores ADD COLUMN estado VARCHAR(50) DEFAULT 'activo';
        
        -- Actualizar registros existentes
        UPDATE operadores SET estado = 'activo' WHERE estado IS NULL;
        
        RAISE NOTICE 'Columna estado agregada a tabla operadores';
    ELSE
        RAISE NOTICE 'Columna estado ya existe en tabla operadores';
    END IF;
END $$;

-- 2. Verificar si la columna 'estado' existe en camiones
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'camiones' AND column_name = 'estado'
    ) THEN
        ALTER TABLE camiones ADD COLUMN estado VARCHAR(50) DEFAULT 'activo';
        
        -- Actualizar registros existentes
        UPDATE camiones SET estado = 'activo' WHERE estado IS NULL;
        
        RAISE NOTICE 'Columna estado agregada a tabla camiones';
    ELSE
        RAISE NOTICE 'Columna estado ya existe en tabla camiones';
    END IF;
END $$;

-- 3. Crear índices para mejorar el rendimiento de las consultas por estado
CREATE INDEX IF NOT EXISTS idx_operadores_estado ON operadores(estado);
CREATE INDEX IF NOT EXISTS idx_camiones_estado ON camiones(estado);

-- 4. Insertar algunos estados de ejemplo si no existen datos
INSERT INTO operadores (nombre, apellidos, estado, fecha_registro) 
SELECT 'Juan', 'Pérez', 'activo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM operadores LIMIT 1);

INSERT INTO operadores (nombre, apellidos, estado, fecha_registro) 
SELECT 'María', 'González', 'inactivo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM operadores WHERE estado = 'inactivo' LIMIT 1);

INSERT INTO camiones (numero_economico, marca, modelo, estado, kilometraje, fecha_registro) 
SELECT 'CAM001', 'Freightliner', 'Cascadia', 'activo', 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM camiones LIMIT 1);

INSERT INTO camiones (numero_economico, marca, modelo, estado, kilometraje, fecha_registro) 
SELECT 'CAM002', 'Kenworth', 'T680', 'mantenimiento', 50000, NOW()
WHERE NOT EXISTS (SELECT 1 FROM camiones WHERE estado = 'mantenimiento' LIMIT 1);

-- 5. Actualizar algunos registros existentes con diferentes estados para pruebas
UPDATE operadores 
SET estado = CASE 
    WHEN id = (SELECT id FROM operadores ORDER BY fecha_registro LIMIT 1 OFFSET 1) THEN 'inactivo'
    WHEN id = (SELECT id FROM operadores ORDER BY fecha_registro LIMIT 1 OFFSET 2) THEN 'suspendido'
    ELSE 'activo'
END;

UPDATE camiones 
SET estado = CASE 
    WHEN id = (SELECT id FROM camiones ORDER BY fecha_registro LIMIT 1 OFFSET 1) THEN 'mantenimiento'
    WHEN id = (SELECT id FROM camiones ORDER BY fecha_registro LIMIT 1 OFFSET 2) THEN 'fuera-de-servicio'
    ELSE 'activo'
END;

-- 6. Crear constraint para validar estados válidos
DO $$
BEGIN
    -- Para operadores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'operadores_estado_check'
    ) THEN
        ALTER TABLE operadores 
        ADD CONSTRAINT operadores_estado_check 
        CHECK (estado IN ('activo', 'inactivo', 'suspendido', 'vacaciones', 'baja'));
        
        RAISE NOTICE 'Constraint de estado agregado a operadores';
    END IF;
    
    -- Para camiones
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'camiones_estado_check'
    ) THEN
        ALTER TABLE camiones 
        ADD CONSTRAINT camiones_estado_check 
        CHECK (estado IN ('activo', 'disponible', 'mantenimiento', 'fuera-de-servicio', 'vendido', 'siniestrado'));
        
        RAISE NOTICE 'Constraint de estado agregado a camiones';
    END IF;
END $$;

COMMIT;
