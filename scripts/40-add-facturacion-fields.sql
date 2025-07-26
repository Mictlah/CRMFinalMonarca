-- Script para agregar campos de información de facturación a la tabla embarques
-- Fecha: 2024-01-20
-- Descripción: Agregar campos para folios de factura y cantidad final facturada

-- Agregar columnas para folios de factura (hasta 4)
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS folio_factura_1 VARCHAR(100),
ADD COLUMN IF NOT EXISTS folio_factura_2 VARCHAR(100),
ADD COLUMN IF NOT EXISTS folio_factura_3 VARCHAR(100),
ADD COLUMN IF NOT EXISTS folio_factura_4 VARCHAR(100);

-- Agregar columna para cantidad final facturada
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS cantidad_final_facturada DECIMAL(12,2);

-- Renombrar la columna observaciones existente para ser más específica
ALTER TABLE embarques 
RENAME COLUMN observaciones TO observaciones_facturacion;

-- Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN embarques.folio_factura_1 IS 'Primer folio de factura asociado al embarque';
COMMENT ON COLUMN embarques.folio_factura_2 IS 'Segundo folio de factura asociado al embarque';
COMMENT ON COLUMN embarques.folio_factura_3 IS 'Tercer folio de factura asociado al embarque';
COMMENT ON COLUMN embarques.folio_factura_4 IS 'Cuarto folio de factura asociado al embarque';
COMMENT ON COLUMN embarques.cantidad_final_facturada IS 'Cantidad final facturada para el embarque';
COMMENT ON COLUMN embarques.observaciones_facturacion IS 'Observaciones específicas de facturación';

-- Crear índices para mejorar las consultas por folios de factura
CREATE INDEX IF NOT EXISTS idx_embarques_folio_factura_1 ON embarques(folio_factura_1);
CREATE INDEX IF NOT EXISTS idx_embarques_folio_factura_2 ON embarques(folio_factura_2);
CREATE INDEX IF NOT EXISTS idx_embarques_folio_factura_3 ON embarques(folio_factura_3);
CREATE INDEX IF NOT EXISTS idx_embarques_folio_factura_4 ON embarques(folio_factura_4);

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'embarques' 
AND column_name IN (
    'folio_factura_1', 
    'folio_factura_2', 
    'folio_factura_3', 
    'folio_factura_4', 
    'cantidad_final_facturada',
    'observaciones_facturacion'
)
ORDER BY column_name;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script 40: Campos de facturación agregados exitosamente a la tabla embarques';
    RAISE NOTICE 'Se agregaron 4 campos para folios de factura y 1 campo para cantidad final facturada';
    RAISE NOTICE 'Se renombró la columna observaciones a observaciones_facturacion';
END $$;
