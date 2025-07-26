-- Script para crear/actualizar la tabla de modificaciones de embarques
-- Este script asegura que todos los campos necesarios estén presentes

-- Primero, intentamos crear la tabla si no existe
CREATE TABLE IF NOT EXISTS embarque_modificaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    embarque_id UUID NOT NULL REFERENCES embarques(id) ON DELETE CASCADE,
    razon TEXT NOT NULL,
    usuario_modificacion VARCHAR(255) NOT NULL DEFAULT 'Sistema',
    fecha_modificacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Información del operador original
    operador_original_id UUID REFERENCES operadores(id),
    operador_original_nombre VARCHAR(255),
    sueldo_operador_original DECIMAL(10,2),
    moneda_sueldo_operador_original VARCHAR(3) DEFAULT 'MXN',
    
    -- Información del operador nuevo
    operador_nuevo_id UUID REFERENCES operadores(id),
    operador_nuevo_nombre VARCHAR(255),
    sueldo_operador_nuevo DECIMAL(10,2),
    moneda_sueldo_operador_nuevo VARCHAR(3) DEFAULT 'MXN',
    
    -- Información del camión original
    camion_original_id UUID REFERENCES camiones(id),
    camion_original_numero VARCHAR(50),
    
    -- Información del camión nuevo
    camion_nuevo_id UUID REFERENCES camiones(id),
    camion_nuevo_numero VARCHAR(50),
    
    -- Información del remolque original
    remolque_original_id UUID REFERENCES remolques(id),
    remolque_original_numero VARCHAR(50),
    
    -- Información del remolque nuevo
    remolque_nuevo_id UUID REFERENCES remolques(id),
    remolque_nuevo_numero VARCHAR(50),
    
    -- Información del flete original
    precio_flete_original DECIMAL(10,2),
    moneda_flete_original VARCHAR(3) DEFAULT 'MXN',
    
    -- Información del flete nuevo
    precio_flete_nuevo DECIMAL(10,2),
    moneda_flete_nueva VARCHAR(3) DEFAULT 'MXN',
    flete_en_falso BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas que puedan faltar (si la tabla ya existía)
DO $$ 
BEGIN
    -- Verificar y agregar columnas del operador original
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'operador_original_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN operador_original_id UUID REFERENCES operadores(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'operador_original_nombre') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN operador_original_nombre VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'sueldo_operador_original') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN sueldo_operador_original DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'moneda_sueldo_operador_original') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN moneda_sueldo_operador_original VARCHAR(3) DEFAULT 'MXN';
    END IF;
    
    -- Verificar y agregar columnas del operador nuevo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'operador_nuevo_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN operador_nuevo_id UUID REFERENCES operadores(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'operador_nuevo_nombre') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN operador_nuevo_nombre VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'sueldo_operador_nuevo') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN sueldo_operador_nuevo DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'moneda_sueldo_operador_nuevo') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN moneda_sueldo_operador_nuevo VARCHAR(3) DEFAULT 'MXN';
    END IF;
    
    -- Verificar y agregar columnas del camión original
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'camion_original_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN camion_original_id UUID REFERENCES camiones(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'camion_original_numero') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN camion_original_numero VARCHAR(50);
    END IF;
    
    -- Verificar y agregar columnas del camión nuevo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'camion_nuevo_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN camion_nuevo_id UUID REFERENCES camiones(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'camion_nuevo_numero') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN camion_nuevo_numero VARCHAR(50);
    END IF;
    
    -- Verificar y agregar columnas del remolque original
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'remolque_original_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN remolque_original_id UUID REFERENCES remolques(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'remolque_original_numero') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN remolque_original_numero VARCHAR(50);
    END IF;
    
    -- Verificar y agregar columnas del remolque nuevo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'remolque_nuevo_id') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN remolque_nuevo_id UUID REFERENCES remolques(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'remolque_nuevo_numero') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN remolque_nuevo_numero VARCHAR(50);
    END IF;
    
    -- Verificar y agregar columnas del flete original
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'precio_flete_original') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN precio_flete_original DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'moneda_flete_original') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN moneda_flete_original VARCHAR(3) DEFAULT 'MXN';
    END IF;
    
    -- Verificar y agregar columnas del flete nuevo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'precio_flete_nuevo') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN precio_flete_nuevo DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'moneda_flete_nueva') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN moneda_flete_nueva VARCHAR(3) DEFAULT 'MXN';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'flete_en_falso') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN flete_en_falso BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Verificar y agregar columnas de metadatos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'usuario_modificacion') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN usuario_modificacion VARCHAR(255) NOT NULL DEFAULT 'Sistema';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'fecha_modificacion') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN fecha_modificacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'created_at') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'embarque_modificaciones' AND column_name = 'updated_at') THEN
        ALTER TABLE embarque_modificaciones ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_embarque_id ON embarque_modificaciones(embarque_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_fecha ON embarque_modificaciones(fecha_modificacion);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_usuario ON embarque_modificaciones(usuario_modificacion);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_embarque_modificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_embarque_modificaciones_updated_at ON embarque_modificaciones;
CREATE TRIGGER trigger_update_embarque_modificaciones_updated_at
    BEFORE UPDATE ON embarque_modificaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_embarque_modificaciones_updated_at();

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'embarque_modificaciones' 
ORDER BY ordinal_position;
