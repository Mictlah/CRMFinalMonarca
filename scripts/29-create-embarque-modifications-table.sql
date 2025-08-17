-- Crear tabla para registrar modificaciones de embarques
CREATE TABLE IF NOT EXISTS embarque_modificaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    embarque_id UUID NOT NULL REFERENCES embarques(id) ON DELETE CASCADE,
    fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    razon TEXT NOT NULL,
    
    -- Información del operador original
    operador_original_id UUID REFERENCES operadores(id),
    operador_original_nombre TEXT,
    sueldo_operador_original DECIMAL(10,2),
    moneda_sueldo_operador_original VARCHAR(3) DEFAULT 'MXN',
    
    -- Información del operador nuevo
    operador_nuevo_id UUID REFERENCES operadores(id),
    operador_nuevo_nombre TEXT,
    sueldo_operador_nuevo DECIMAL(10,2),
    moneda_sueldo_operador_nuevo VARCHAR(3) DEFAULT 'MXN',
    
    -- Información del camión original
    camion_original_id UUID REFERENCES camiones(id),
    camion_original_numero TEXT,
    
    -- Información del camión nuevo
    camion_nuevo_id UUID REFERENCES camiones(id),
    camion_nuevo_numero TEXT,
    
    -- Información del remolque original
    remolque_original_id UUID REFERENCES remolques(id),
    remolque_original_numero TEXT,
    
    -- Información del remolque nuevo
    remolque_nuevo_id UUID REFERENCES remolques(id),
    remolque_nuevo_numero TEXT,
    
    -- Información del flete
    precio_flete_original DECIMAL(10,2),
    precio_flete_nuevo DECIMAL(10,2),
    moneda_flete_original VARCHAR(3) DEFAULT 'MXN',
    moneda_flete_nueva VARCHAR(3) DEFAULT 'MXN',
    
    -- Marcadores especiales
    flete_en_falso BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    usuario_modificacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_embarque_id ON embarque_modificaciones(embarque_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_fecha ON embarque_modificaciones(fecha_modificacion);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_operador_original ON embarque_modificaciones(operador_original_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_operador_nuevo ON embarque_modificaciones(operador_nuevo_id);

-- Comentarios para documentación
COMMENT ON TABLE embarque_modificaciones IS 'Registro de todas las modificaciones realizadas a embarques para situaciones de emergencia/contingencia';
COMMENT ON COLUMN embarque_modificaciones.razon IS 'Justificación de por qué se realizó la modificación';
COMMENT ON COLUMN embarque_modificaciones.flete_en_falso IS 'Indica si el registro se marcó como flete en falso';
