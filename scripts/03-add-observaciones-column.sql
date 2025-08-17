-- Agregar columna observaciones a la tabla camiones
-- Esta columna almacenará datos adicionales como JSON

DO $$ 
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'camiones' 
        AND column_name = 'observaciones'
    ) THEN
        -- Agregar la columna observaciones
        ALTER TABLE camiones ADD COLUMN observaciones TEXT;
        
        -- Agregar comentario a la columna
        COMMENT ON COLUMN camiones.observaciones IS 'Datos adicionales del camión almacenados como JSON (número de serie, fechas de verificación, póliza de seguro, comentarios)';
        
        RAISE NOTICE 'Columna observaciones agregada exitosamente a la tabla camiones';
    ELSE
        RAISE NOTICE 'La columna observaciones ya existe en la tabla camiones';
    END IF;
END $$;
