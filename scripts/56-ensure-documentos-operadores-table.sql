-- Verificar y crear la tabla documentos_operadores si no existe
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documentos_operadores') THEN
        -- Crear la tabla si no existe
        CREATE TABLE documentos_operadores (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            operador_id UUID NOT NULL REFERENCES operadores(id) ON DELETE CASCADE,
            tipo_documento VARCHAR(100) NOT NULL,
            numero_documento VARCHAR(100),
            nombre_archivo VARCHAR(255) NOT NULL,
            url_blob TEXT NOT NULL,
            pathname TEXT NOT NULL,
            tamano_bytes INTEGER,
            tipo_mime VARCHAR(100),
            fecha_vencimiento DATE,
            activo BOOLEAN DEFAULT true,
            notas TEXT,
            fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            subido_por VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear índices
        CREATE INDEX idx_documentos_operadores_operador_id ON documentos_operadores(operador_id);
        CREATE INDEX idx_documentos_operadores_tipo ON documentos_operadores(tipo_documento);
        CREATE INDEX idx_documentos_operadores_activo ON documentos_operadores(activo);
        CREATE INDEX idx_documentos_operadores_fecha_vencimiento ON documentos_operadores(fecha_vencimiento);

        RAISE NOTICE 'Tabla documentos_operadores creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla documentos_operadores ya existe';
    END IF;

    -- Verificar y agregar columnas faltantes si es necesario
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'documentos_operadores' AND column_name = 'pathname') THEN
        ALTER TABLE documentos_operadores ADD COLUMN pathname TEXT;
        RAISE NOTICE 'Columna pathname agregada a documentos_operadores';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'documentos_operadores' AND column_name = 'tamano_bytes') THEN
        ALTER TABLE documentos_operadores ADD COLUMN tamano_bytes INTEGER;
        RAISE NOTICE 'Columna tamano_bytes agregada a documentos_operadores';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'documentos_operadores' AND column_name = 'tipo_mime') THEN
        ALTER TABLE documentos_operadores ADD COLUMN tipo_mime VARCHAR(100);
        RAISE NOTICE 'Columna tipo_mime agregada a documentos_operadores';
    END IF;

END $$;
