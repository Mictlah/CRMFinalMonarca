-- Add cancellation metadata to embarques table
DO $$
BEGIN
    -- Add fecha_cancelacion column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'fecha_cancelacion'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_cancelacion TIMESTAMPTZ;
        COMMENT ON COLUMN embarques.fecha_cancelacion IS 'Fecha y hora en que el embarque fue cancelado por un usuario';
    END IF;

    -- Add cancelado_por column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'cancelado_por'
    ) THEN
        ALTER TABLE embarques ADD COLUMN cancelado_por VARCHAR(255);
        COMMENT ON COLUMN embarques.cancelado_por IS 'Nombre del usuario que canceló el embarque';
    END IF;

    -- Add motivo_cancelacion column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'motivo_cancelacion'
    ) THEN
        ALTER TABLE embarques ADD COLUMN motivo_cancelacion TEXT;
        COMMENT ON COLUMN embarques.motivo_cancelacion IS 'Justificación proporcionada por el usuario al cancelar';
    END IF;
END $$;

-- Indexes to speed up queries by cancellation date and actor
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_cancelacion ON embarques(fecha_cancelacion DESC);
CREATE INDEX IF NOT EXISTS idx_embarques_cancelado_por ON embarques(cancelado_por);

-- Optional: materialized flag for quick filters (not required)
-- ALTER TABLE embarques ADD COLUMN cancelado_por_usuario BOOLEAN GENERATED ALWAYS AS (cancelado_por IS NOT NULL) STORED;
-- CREATE INDEX IF NOT EXISTS idx_embarques_cancelado_por_usuario ON embarques(cancelado_por_usuario);
