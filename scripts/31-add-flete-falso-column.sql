-- Agregar campo flete_falso a la tabla embarques
-- Este campo indica si un embarque debe considerarse como "flete en falso"

DO $$ 
BEGIN
    -- Verificar si la columna flete_falso existe en embarques
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarques' 
                   AND column_name = 'flete_falso') THEN
        ALTER TABLE embarques ADD COLUMN flete_falso BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna flete_falso agregada a la tabla embarques';
    ELSE
        RAISE NOTICE 'Columna flete_falso ya existe en la tabla embarques';
    END IF;
END $$;

-- Agregar comentario para documentación
COMMENT ON COLUMN embarques.flete_falso IS 'Indica si el embarque debe considerarse como flete en falso para efectos contables';

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_embarques_flete_falso ON embarques(flete_falso) WHERE flete_falso = TRUE;

-- Mostrar información de la columna agregada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'embarques' AND column_name = 'flete_falso';
