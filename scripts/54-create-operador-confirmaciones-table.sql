CREATE TABLE IF NOT EXISTS operador_confirmaciones_embarque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embarque_id UUID REFERENCES embarques(id) ON DELETE CASCADE,
    operador_nombre TEXT NOT NULL,
    fecha_confirmacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para actualizar 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_operador_confirmaciones_embarque_updated_at
BEFORE UPDATE ON operador_confirmaciones_embarque
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
