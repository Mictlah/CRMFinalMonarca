-- Crear tabla de registros de mantenimiento para remolques
CREATE TABLE IF NOT EXISTS registros_mantenimiento_remolques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remolque_id UUID NOT NULL REFERENCES remolques(id) ON DELETE CASCADE,
    fecha_mantenimiento DATE NOT NULL,
    tipo_mantenimiento VARCHAR(50) DEFAULT 'general',
    detalles_mantenimiento TEXT NOT NULL,
    proximo_mantenimiento DATE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_registros_mant_remolques_remolque_id ON registros_mantenimiento_remolques(remolque_id);
CREATE INDEX IF NOT EXISTS idx_registros_mant_remolques_fecha ON registros_mantenimiento_remolques(fecha_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_registros_mant_remolques_tipo ON registros_mantenimiento_remolques(tipo_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_registros_mant_remolques_proximo ON registros_mantenimiento_remolques(proximo_mantenimiento);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_registros_mant_remolques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_registros_mant_remolques_updated_at
    BEFORE UPDATE ON registros_mantenimiento_remolques
    FOR EACH ROW
    EXECUTE FUNCTION update_registros_mant_remolques_updated_at();

-- Comentarios
COMMENT ON TABLE registros_mantenimiento_remolques IS 'Historial de mantenimientos realizados a los remolques';
COMMENT ON COLUMN registros_mantenimiento_remolques.remolque_id IS 'Referencia al remolque';
COMMENT ON COLUMN registros_mantenimiento_remolques.fecha_mantenimiento IS 'Fecha del mantenimiento';
COMMENT ON COLUMN registros_mantenimiento_remolques.tipo_mantenimiento IS 'Tipo: preventivo, correctivo, etc.';
COMMENT ON COLUMN registros_mantenimiento_remolques.detalles_mantenimiento IS 'Descripción del trabajo';
COMMENT ON COLUMN registros_mantenimiento_remolques.proximo_mantenimiento IS 'Fecha estimada del próximo';
-- Se omiten campos financieros / proveedor por requerimiento actual
