-- Agregar columna observaciones a la tabla embarques si no existe
DO $$ 
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'observaciones'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna observaciones
        ALTER TABLE embarques ADD COLUMN observaciones TEXT;
        
        -- Agregar comentario a la columna
        COMMENT ON COLUMN embarques.observaciones IS 'Observaciones y comentarios adicionales del embarque';
        
        RAISE NOTICE 'Columna observaciones agregada exitosamente a la tabla embarques';
    ELSE
        RAISE NOTICE 'La columna observaciones ya existe en la tabla embarques';
    END IF;
END $$;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'embarques' 
AND column_name = 'observaciones'
AND table_schema = 'public';
