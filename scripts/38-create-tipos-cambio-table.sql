-- Crear tabla para manejar tipos de cambio
CREATE TABLE IF NOT EXISTS tipos_cambio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL,
    usd_to_mxn DECIMAL(10,4) NOT NULL,
    mxn_to_usd DECIMAL(10,6) GENERATED ALWAYS AS (1.0 / usd_to_mxn) STORED,
    activo BOOLEAN DEFAULT true,
    creado_por VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_tipos_cambio_fecha ON tipos_cambio(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_tipos_cambio_activo ON tipos_cambio(activo);

-- Insertar tipo de cambio inicial
INSERT INTO tipos_cambio (fecha, usd_to_mxn, activo, creado_por) 
VALUES (CURRENT_DATE, 17.5000, true, 'Sistema')
ON CONFLICT DO NOTHING;

-- Comentarios
COMMENT ON TABLE tipos_cambio IS 'Tabla para almacenar tipos de cambio USD/MXN';
COMMENT ON COLUMN tipos_cambio.usd_to_mxn IS 'Tipo de cambio de USD a MXN (cuántos pesos por dólar)';
COMMENT ON COLUMN tipos_cambio.mxn_to_usd IS 'Tipo de cambio de MXN a USD (calculado automáticamente)';
COMMENT ON COLUMN tipos_cambio.activo IS 'Indica si este tipo de cambio está activo (solo uno puede estar activo)';
