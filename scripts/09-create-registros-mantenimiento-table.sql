-- Crear tabla de registros de mantenimiento
CREATE TABLE IF NOT EXISTS registros_mantenimiento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    camion_id UUID NOT NULL REFERENCES camiones(id) ON DELETE CASCADE,
    fecha_mantenimiento DATE NOT NULL,
    tipo_mantenimiento VARCHAR(50) DEFAULT 'general',
    detalles_mantenimiento TEXT NOT NULL,
    proximo_mantenimiento DATE,
    kilometraje_actual INTEGER DEFAULT 0,
    costo_mantenimiento DECIMAL(10,2),
    proveedor_servicio VARCHAR(255),
    numero_factura VARCHAR(100),
    observaciones TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_registros_mantenimiento_camion_id ON registros_mantenimiento(camion_id);
CREATE INDEX IF NOT EXISTS idx_registros_mantenimiento_fecha ON registros_mantenimiento(fecha_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_registros_mantenimiento_tipo ON registros_mantenimiento(tipo_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_registros_mantenimiento_proximo ON registros_mantenimiento(proximo_mantenimiento);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_registros_mantenimiento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_registros_mantenimiento_updated_at
    BEFORE UPDATE ON registros_mantenimiento
    FOR EACH ROW
    EXECUTE FUNCTION update_registros_mantenimiento_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE registros_mantenimiento IS 'Tabla para almacenar el historial de mantenimientos realizados a los camiones';
COMMENT ON COLUMN registros_mantenimiento.camion_id IS 'Referencia al camión al que se le realizó el mantenimiento';
COMMENT ON COLUMN registros_mantenimiento.fecha_mantenimiento IS 'Fecha en que se realizó el mantenimiento';
COMMENT ON COLUMN registros_mantenimiento.tipo_mantenimiento IS 'Tipo de mantenimiento: preventivo, correctivo, revision, etc.';
COMMENT ON COLUMN registros_mantenimiento.detalles_mantenimiento IS 'Descripción detallada del trabajo realizado';
COMMENT ON COLUMN registros_mantenimiento.proximo_mantenimiento IS 'Fecha programada para el próximo mantenimiento';
COMMENT ON COLUMN registros_mantenimiento.kilometraje_actual IS 'Kilometraje del camión al momento del mantenimiento';
COMMENT ON COLUMN registros_mantenimiento.costo_mantenimiento IS 'Costo total del mantenimiento realizado';
COMMENT ON COLUMN registros_mantenimiento.proveedor_servicio IS 'Nombre del proveedor o taller que realizó el servicio';
COMMENT ON COLUMN registros_mantenimiento.numero_factura IS 'Número de factura o comprobante del servicio';
COMMENT ON COLUMN registros_mantenimiento.observaciones IS 'Observaciones adicionales sobre el mantenimiento';
