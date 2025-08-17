-- Verify and create status fields for operadores and camiones tables
DO $$ 
BEGIN
    -- Add estado column to operadores if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'operadores' AND column_name = 'estado'
    ) THEN
        ALTER TABLE operadores ADD COLUMN estado VARCHAR(20) DEFAULT 'activo';
        COMMENT ON COLUMN operadores.estado IS 'Estado del operador: activo, inactivo, suspendido, vacaciones, baja';
    END IF;

    -- Add estado column to camiones if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'camiones' AND column_name = 'estado'
    ) THEN
        ALTER TABLE camiones ADD COLUMN estado VARCHAR(20) DEFAULT 'activo';
        COMMENT ON COLUMN camiones.estado IS 'Estado del camión: activo, disponible, mantenimiento, fuera-de-servicio, vendido, siniestrado';
    END IF;
END $$;

-- Add constraints for valid status values
DO $$
BEGIN
    -- Add constraint for operadores estado if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'operadores' AND constraint_name = 'chk_operadores_estado'
    ) THEN
        ALTER TABLE operadores ADD CONSTRAINT chk_operadores_estado 
        CHECK (estado IN ('activo', 'inactivo', 'suspendido', 'vacaciones', 'baja'));
    END IF;

    -- Add constraint for camiones estado if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'camiones' AND constraint_name = 'chk_camiones_estado'
    ) THEN
        ALTER TABLE camiones ADD CONSTRAINT chk_camiones_estado 
        CHECK (estado IN ('activo', 'disponible', 'mantenimiento', 'fuera-de-servicio', 'vendido', 'siniestrado'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operadores_estado ON operadores(estado);
CREATE INDEX IF NOT EXISTS idx_camiones_estado ON camiones(estado);

-- Update existing records to have default status
UPDATE operadores SET estado = 'activo' WHERE estado IS NULL;
UPDATE camiones SET estado = 'activo' WHERE estado IS NULL;
