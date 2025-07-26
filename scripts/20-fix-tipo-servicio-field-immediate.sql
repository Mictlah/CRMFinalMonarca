-- Fix the tipo_servicio_id field to accept TEXT instead of UUID
-- and ensure all required fields exist in the embarques table

-- First, check if the column exists and alter it
DO $$ 
BEGIN
    -- Change tipo_servicio_id from UUID to TEXT if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'tipo_servicio_id'
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE embarques ALTER COLUMN tipo_servicio_id TYPE TEXT;
        RAISE NOTICE 'Changed tipo_servicio_id from UUID to TEXT';
    END IF;
    
    -- Add tipo_servicio_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'tipo_servicio_id'
    ) THEN
        ALTER TABLE embarques ADD COLUMN tipo_servicio_id TEXT;
        RAISE NOTICE 'Added tipo_servicio_id column as TEXT';
    END IF;

    -- Add operador_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'operador_id'
    ) THEN
        ALTER TABLE embarques ADD COLUMN operador_id UUID REFERENCES operadores(id);
        RAISE NOTICE 'Added operador_id column';
    END IF;

    -- Add fecha_creacion column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'fecha_creacion'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added fecha_creacion column';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE embarques ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;

    -- Ensure all other required columns exist
    -- direccion_recolecta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'direccion_recolecta'
    ) THEN
        ALTER TABLE embarques ADD COLUMN direccion_recolecta TEXT;
        RAISE NOTICE 'Added direccion_recolecta column';
    END IF;

    -- direccion_entrega
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'direccion_entrega'
    ) THEN
        ALTER TABLE embarques ADD COLUMN direccion_entrega TEXT;
        RAISE NOTICE 'Added direccion_entrega column';
    END IF;

    -- fecha_recolecta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'fecha_recolecta'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_recolecta DATE;
        RAISE NOTICE 'Added fecha_recolecta column';
    END IF;

    -- hora_recolecta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'hora_recolecta'
    ) THEN
        ALTER TABLE embarques ADD COLUMN hora_recolecta TIME;
        RAISE NOTICE 'Added hora_recolecta column';
    END IF;

    -- fecha_entrega
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'fecha_entrega'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_entrega DATE;
        RAISE NOTICE 'Added fecha_entrega column';
    END IF;

    -- hora_entrega
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'hora_entrega'
    ) THEN
        ALTER TABLE embarques ADD COLUMN hora_entrega TIME;
        RAISE NOTICE 'Added hora_entrega column';
    END IF;

    -- load_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'load_number'
    ) THEN
        ALTER TABLE embarques ADD COLUMN load_number TEXT;
        RAISE NOTICE 'Added load_number column';
    END IF;

    -- patente_agente_aduanal
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'patente_agente_aduanal'
    ) THEN
        ALTER TABLE embarques ADD COLUMN patente_agente_aduanal TEXT;
        RAISE NOTICE 'Added patente_agente_aduanal column';
    END IF;

    -- aduana_cruce
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'aduana_cruce'
    ) THEN
        ALTER TABLE embarques ADD COLUMN aduana_cruce TEXT;
        RAISE NOTICE 'Added aduana_cruce column';
    END IF;

    -- dueno_mercancia
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'dueno_mercancia'
    ) THEN
        ALTER TABLE embarques ADD COLUMN dueno_mercancia TEXT;
        RAISE NOTICE 'Added dueno_mercancia column';
    END IF;

    -- representante_cliente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'representante_cliente'
    ) THEN
        ALTER TABLE embarques ADD COLUMN representante_cliente UUID;
        RAISE NOTICE 'Added representante_cliente column';
    END IF;

    -- info_representante (JSONB for storing contact info)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'info_representante'
    ) THEN
        ALTER TABLE embarques ADD COLUMN info_representante JSONB;
        RAISE NOTICE 'Added info_representante column';
    END IF;

    -- carta_porte
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'carta_porte'
    ) THEN
        ALTER TABLE embarques ADD COLUMN carta_porte TEXT;
        RAISE NOTICE 'Added carta_porte column';
    END IF;

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_embarques_tipo_servicio ON embarques(tipo_servicio_id);
CREATE INDEX IF NOT EXISTS idx_embarques_cliente ON embarques(cliente_id);
CREATE INDEX IF NOT EXISTS idx_embarques_operador ON embarques(operador_id);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_creacion ON embarques(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_embarques_estado ON embarques(estado);
CREATE INDEX IF NOT EXISTS idx_embarques_folio ON embarques(folio);

-- Update existing records to set fecha_creacion if null
UPDATE embarques 
SET fecha_creacion = NOW() 
WHERE fecha_creacion IS NULL;

RAISE NOTICE 'Database schema updated successfully for embarques table';
