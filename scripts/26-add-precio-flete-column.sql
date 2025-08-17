-- Add precio_flete column to embarques table
DO $$ 
BEGIN
    -- Add precio_flete column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'precio_flete'
    ) THEN
        ALTER TABLE embarques ADD COLUMN precio_flete DECIMAL(10,2);
        COMMENT ON COLUMN embarques.precio_flete IS 'Precio del flete asignado al embarque';
    END IF;

    -- Add moneda_flete column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'moneda_flete'
    ) THEN
        ALTER TABLE embarques ADD COLUMN moneda_flete VARCHAR(3) DEFAULT 'MXN';
        COMMENT ON COLUMN embarques.moneda_flete IS 'Moneda del flete (MXN, USD)';
    END IF;

    -- Add flete_falso column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'flete_falso'
    ) THEN
        ALTER TABLE embarques ADD COLUMN flete_falso BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN embarques.flete_falso IS 'Marca si el flete es falso (para casos de emergencia)';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_embarques_precio_flete ON embarques(precio_flete);
CREATE INDEX IF NOT EXISTS idx_embarques_moneda_flete ON embarques(moneda_flete);
CREATE INDEX IF NOT EXISTS idx_embarques_flete_falso ON embarques(flete_falso);
