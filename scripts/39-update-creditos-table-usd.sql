-- Actualizar tabla de créditos para que sea clara que está en USD
ALTER TABLE creditos_clientes 
RENAME COLUMN limite_credito TO limite_credito_usd;

-- Agregar comentario para clarificar
COMMENT ON COLUMN creditos_clientes.limite_credito_usd IS 'Límite de crédito del cliente en dólares estadounidenses (USD)';

-- Agregar columna para notas sobre el tipo de cambio usado
ALTER TABLE creditos_clientes 
ADD COLUMN IF NOT EXISTS notas_tipo_cambio TEXT;

COMMENT ON COLUMN creditos_clientes.notas_tipo_cambio IS 'Notas sobre el tipo de cambio o consideraciones especiales';

-- Actualizar trigger de updated_at si existe
DROP TRIGGER IF EXISTS update_creditos_clientes_updated_at ON creditos_clientes;
CREATE TRIGGER update_creditos_clientes_updated_at
    BEFORE UPDATE ON creditos_clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
