-- Agrega columna alias a la tabla operadores si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'operadores' AND column_name = 'alias'
    ) THEN
        ALTER TABLE operadores ADD COLUMN alias VARCHAR(100);
        COMMENT ON COLUMN operadores.alias IS 'Alias / apodo del operador';
        RAISE NOTICE 'Columna alias agregada a operadores.';
    ELSE
        RAISE NOTICE 'Columna alias ya existe en operadores.';
    END IF;
END $$;
