-- Crear tabla para gestionar límites de crédito por cliente
CREATE TABLE IF NOT EXISTS creditos_clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    limite_credito DECIMAL(12,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para mejorar rendimiento
    UNIQUE(cliente_id)
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_creditos_clientes_cliente_id ON creditos_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_creditos_clientes_activo ON creditos_clientes(activo);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_creditos_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_creditos_clientes_updated_at
    BEFORE UPDATE ON creditos_clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_creditos_clientes_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE creditos_clientes IS 'Tabla para gestionar límites de crédito asignados a cada cliente';
COMMENT ON COLUMN creditos_clientes.cliente_id IS 'Referencia al cliente en la tabla clientes';
COMMENT ON COLUMN creditos_clientes.limite_credito IS 'Límite de crédito asignado al cliente en pesos';
COMMENT ON COLUMN creditos_clientes.activo IS 'Indica si el límite de crédito está activo';
