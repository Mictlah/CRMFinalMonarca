-- Agregar columna para límite de crédito en MXN a la tabla creditos_clientes
ALTER TABLE creditos_clientes 
ADD COLUMN IF NOT EXISTS limite_credito_mxn DECIMAL(12,2) DEFAULT 0.00;

-- Agregar comentario para clarificar la nueva columna
COMMENT ON COLUMN creditos_clientes.limite_credito_mxn IS 'Límite de crédito del cliente en pesos mexicanos (MXN)';

-- Actualizar el comentario de la columna USD para mayor claridad
COMMENT ON COLUMN creditos_clientes.limite_credito_usd IS 'Límite de crédito del cliente en dólares estadounidenses (USD)';

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_creditos_clientes_cliente_activo 
ON creditos_clientes(cliente_id, activo) 
WHERE activo = true;

-- Actualizar trigger de updated_at si existe
DROP TRIGGER IF EXISTS update_creditos_clientes_updated_at ON creditos_clientes;
CREATE TRIGGER update_creditos_clientes_updated_at
    BEFORE UPDATE ON creditos_clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar la estructura actualizada de la tabla
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'creditos_clientes' 
ORDER BY ordinal_position;
