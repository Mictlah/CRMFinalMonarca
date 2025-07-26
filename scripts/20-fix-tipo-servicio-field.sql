-- Corregir el campo tipo_servicio_id para que acepte strings en lugar de UUIDs
-- y agregar cualquier campo faltante

-- Primero, verificar si la columna existe y cambiar su tipo
DO $$ 
BEGIN
    -- Cambiar tipo_servicio_id de UUID a TEXT si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'tipo_servicio_id'
        AND table_schema = 'public'
    ) THEN
        -- Eliminar datos existentes que puedan causar conflicto
        UPDATE embarques SET tipo_servicio_id = NULL WHERE tipo_servicio_id IS NOT NULL;
        
        -- Cambiar el tipo de columna
        ALTER TABLE embarques ALTER COLUMN tipo_servicio_id TYPE TEXT;
        
        RAISE NOTICE 'Campo tipo_servicio_id cambiado a TEXT';
    ELSE
        -- Si no existe, crearla como TEXT
        ALTER TABLE embarques ADD COLUMN tipo_servicio_id TEXT;
        RAISE NOTICE 'Campo tipo_servicio_id creado como TEXT';
    END IF;

    -- Verificar y agregar otros campos que puedan faltar
    
    -- Campo carta_porte
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'carta_porte'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN carta_porte TEXT;
        RAISE NOTICE 'Campo carta_porte agregado';
    END IF;

    -- Campo direccion_recolecta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'direccion_recolecta'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN direccion_recolecta TEXT;
        RAISE NOTICE 'Campo direccion_recolecta agregado';
    END IF;

    -- Campo direccion_entrega
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'direccion_entrega'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN direccion_entrega TEXT;
        RAISE NOTICE 'Campo direccion_entrega agregado';
    END IF;

    -- Campo fecha_recolecta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'fecha_recolecta'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_recolecta DATE;
        RAISE NOTICE 'Campo fecha_recolecta agregado';
    END IF;

    -- Campo hora_recolecta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'hora_recolecta'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN hora_recolecta TIME;
        RAISE NOTICE 'Campo hora_recolecta agregado';
    END IF;

    -- Campo fecha_entrega
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'fecha_entrega'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_entrega DATE;
        RAISE NOTICE 'Campo fecha_entrega agregado';
    END IF;

    -- Campo hora_entrega
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'hora_entrega'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN hora_entrega TIME;
        RAISE NOTICE 'Campo hora_entrega agregado';
    END IF;

    -- Campo load_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'load_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN load_number TEXT;
        RAISE NOTICE 'Campo load_number agregado';
    END IF;

    -- Campo patente_agente_aduanal
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'patente_agente_aduanal'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN patente_agente_aduanal TEXT;
        RAISE NOTICE 'Campo patente_agente_aduanal agregado';
    END IF;

    -- Campo aduana_cruce
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'aduana_cruce'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN aduana_cruce TEXT;
        RAISE NOTICE 'Campo aduana_cruce agregado';
    END IF;

    -- Campo dueno_mercancia
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'dueno_mercancia'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN dueno_mercancia TEXT;
        RAISE NOTICE 'Campo dueno_mercancia agregado';
    END IF;

    -- Campo representante_cliente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'representante_cliente'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN representante_cliente TEXT;
        RAISE NOTICE 'Campo representante_cliente agregado';
    END IF;

    -- Campo info_representante (JSON)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'info_representante'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN info_representante JSONB;
        RAISE NOTICE 'Campo info_representante agregado';
    END IF;

    -- Verificar campos básicos que deberían existir
    
    -- Campo folio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'folio'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN folio TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Campo folio agregado';
    END IF;

    -- Campo cliente_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'cliente_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN cliente_id UUID REFERENCES clientes(id);
        RAISE NOTICE 'Campo cliente_id agregado';
    END IF;

    -- Campo operador_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'operador_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN operador_id UUID REFERENCES operadores(id);
        RAISE NOTICE 'Campo operador_id agregado';
    END IF;

    -- Campo camion_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'camion_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN camion_id UUID REFERENCES camiones(id);
        RAISE NOTICE 'Campo camion_id agregado';
    END IF;

    -- Campo remolque_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'remolque_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN remolque_id UUID REFERENCES remolques(id);
        RAISE NOTICE 'Campo remolque_id agregado';
    END IF;

    -- Campo contenido
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'contenido'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN contenido TEXT;
        RAISE NOTICE 'Campo contenido agregado';
    END IF;

    -- Campo peso
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'peso'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN peso DECIMAL(10,2);
        RAISE NOTICE 'Campo peso agregado';
    END IF;

    -- Campo estado
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'estado'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN estado TEXT DEFAULT 'creado';
        RAISE NOTICE 'Campo estado agregado';
    END IF;

    -- Campo observaciones
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'observaciones'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN observaciones TEXT;
        RAISE NOTICE 'Campo observaciones agregado';
    END IF;

    -- Campo fecha_creacion
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'fecha_creacion'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Campo fecha_creacion agregado';
    END IF;

    -- Campo updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE embarques ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Campo updated_at agregado';
    END IF;

END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_embarques_folio ON embarques(folio);
CREATE INDEX IF NOT EXISTS idx_embarques_cliente_id ON embarques(cliente_id);
CREATE INDEX IF NOT EXISTS idx_embarques_estado ON embarques(estado);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_creacion ON embarques(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_embarques_tipo_servicio ON embarques(tipo_servicio_id);

-- Mensaje final
DO $$ 
BEGIN
    RAISE NOTICE 'Script completado. Tabla embarques actualizada con todos los campos necesarios.';
END $$;
