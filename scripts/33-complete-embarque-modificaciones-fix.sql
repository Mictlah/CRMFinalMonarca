-- Script completo para corregir la tabla embarque_modificaciones
-- Eliminar y recrear la tabla con todas las columnas necesarias

-- Primero, hacer backup de datos existentes si los hay
CREATE TABLE IF NOT EXISTS embarque_modificaciones_backup AS 
SELECT * FROM embarque_modificaciones WHERE 1=0;

-- Insertar datos existentes en backup
INSERT INTO embarque_modificaciones_backup 
SELECT * FROM embarque_modificaciones;

-- Eliminar la tabla actual
DROP TABLE IF EXISTS embarque_modificaciones;

-- Recrear la tabla con todas las columnas necesarias
CREATE TABLE embarque_modificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embarque_id UUID NOT NULL,
    razon TEXT NOT NULL,
    usuario_modificacion TEXT DEFAULT 'Sistema',
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Información del operador original
    operador_original_id UUID,
    operador_original_nombre TEXT,
    sueldo_operador_original DECIMAL(10,2),
    moneda_sueldo_operador_original VARCHAR(3) DEFAULT 'MXN',
    
    -- Información del operador nuevo
    operador_nuevo_id UUID,
    operador_nuevo_nombre TEXT,
    sueldo_operador_nuevo DECIMAL(10,2),
    moneda_sueldo_operador_nuevo VARCHAR(3) DEFAULT 'MXN',
    
    -- Información del camión original
    camion_original_id UUID,
    camion_original_numero TEXT,
    
    -- Información del camión nuevo
    camion_nuevo_id UUID,
    camion_nuevo_numero TEXT,
    
    -- Información del remolque original
    remolque_original_id UUID,
    remolque_original_numero TEXT,
    
    -- Información del remolque nuevo
    remolque_nuevo_id UUID,
    remolque_nuevo_numero TEXT,
    
    -- Información del flete original
    precio_flete_original DECIMAL(10,2),
    moneda_flete_original VARCHAR(3) DEFAULT 'MXN',
    
    -- Información del flete nuevo
    precio_flete_nuevo DECIMAL(10,2),
    moneda_flete_nueva VARCHAR(3) DEFAULT 'MXN',
    
    -- Indicador de flete en falso
    flete_en_falso BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_embarque_modificaciones_embarque_id ON embarque_modificaciones(embarque_id);
CREATE INDEX idx_embarque_modificaciones_fecha ON embarque_modificaciones(fecha_modificacion);
CREATE INDEX idx_embarque_modificaciones_operador_original ON embarque_modificaciones(operador_original_id);
CREATE INDEX idx_embarque_modificaciones_operador_nuevo ON embarque_modificaciones(operador_nuevo_id);
CREATE INDEX idx_embarque_modificaciones_camion_original ON embarque_modificaciones(camion_original_id);
CREATE INDEX idx_embarque_modificaciones_camion_nuevo ON embarque_modificaciones(camion_nuevo_id);
CREATE INDEX idx_embarque_modificaciones_remolque_original ON embarque_modificaciones(remolque_original_id);
CREATE INDEX idx_embarque_modificaciones_remolque_nuevo ON embarque_modificaciones(remolque_nuevo_id);

-- Agregar foreign keys si las tablas existen
ALTER TABLE embarque_modificaciones 
ADD CONSTRAINT fk_embarque_modificaciones_embarque 
FOREIGN KEY (embarque_id) REFERENCES embarques(id) ON DELETE CASCADE;

-- Comentarios para documentación
COMMENT ON TABLE embarque_modificaciones IS 'Registro de auditoría para modificaciones de embarques';
COMMENT ON COLUMN embarque_modificaciones.embarque_id IS 'ID del embarque modificado';
COMMENT ON COLUMN embarque_modificaciones.razon IS 'Justificación de la modificación';
COMMENT ON COLUMN embarque_modificaciones.usuario_modificacion IS 'Usuario que realizó la modificación';
COMMENT ON COLUMN embarque_modificaciones.operador_original_nombre IS 'Nombre completo del operador original';
COMMENT ON COLUMN embarque_modificaciones.operador_nuevo_nombre IS 'Nombre completo del nuevo operador';
COMMENT ON COLUMN embarque_modificaciones.camion_original_numero IS 'Número económico del camión original';
COMMENT ON COLUMN embarque_modificaciones.camion_nuevo_numero IS 'Número económico del nuevo camión';
COMMENT ON COLUMN embarque_modificaciones.remolque_original_numero IS 'Número económico del remolque original';
COMMENT ON COLUMN embarque_modificaciones.remolque_nuevo_numero IS 'Número económico del nuevo remolque';
COMMENT ON COLUMN embarque_modificaciones.flete_en_falso IS 'Indica si el flete fue marcado como falso';

-- Restaurar datos del backup si existen
-- (Este paso se puede omitir si no hay datos importantes que preservar)

-- Mostrar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'embarque_modificaciones' 
ORDER BY ordinal_position;

-- Confirmar que la tabla fue creada correctamente
SELECT COUNT(*) as total_columns 
FROM information_schema.columns 
WHERE table_name = 'embarque_modificaciones';
