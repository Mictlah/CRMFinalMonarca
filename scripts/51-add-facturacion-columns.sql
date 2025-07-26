-- Script para agregar columnas de facturación a la tabla embarques
-- Ejecutar este script para habilitar la funcionalidad completa de facturación

-- Verificar si la tabla embarques existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'embarques') THEN
        RAISE EXCEPTION 'La tabla embarques no existe. Ejecuta primero los scripts de creación de tablas.';
    END IF;
END $$;

-- Agregar columnas de facturación
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS folio_factura_1 VARCHAR(100),
ADD COLUMN IF NOT EXISTS folio_factura_2 VARCHAR(100), 
ADD COLUMN IF NOT EXISTS folio_factura_3 VARCHAR(100),
ADD COLUMN IF NOT EXISTS folio_factura_4 VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_envio_cliente DATE,
ADD COLUMN IF NOT EXISTS fecha_pago_cliente DATE,
ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(200),
ADD COLUMN IF NOT EXISTS cantidad_final_facturada DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS estado_facturacion VARCHAR(50) DEFAULT 'pendiente_facturacion',
ADD COLUMN IF NOT EXISTS fecha_archivado TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS usuario_archivo VARCHAR(100),
ADD COLUMN IF NOT EXISTS motivo_archivo TEXT,
ADD COLUMN IF NOT EXISTS observaciones_archivo TEXT;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_embarques_estado_facturacion ON embarques(estado_facturacion);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_envio_cliente ON embarques(fecha_envio_cliente);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_pago_cliente ON embarques(fecha_pago_cliente);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_archivado ON embarques(fecha_archivado);
CREATE INDEX IF NOT EXISTS idx_embarques_folio_factura_1 ON embarques(folio_factura_1);

-- Agregar comentarios descriptivos
COMMENT ON COLUMN embarques.folio_factura_1 IS 'Número de factura principal emitida para este embarque';
COMMENT ON COLUMN embarques.folio_factura_2 IS 'Número de factura adicional 1 (si aplica)';
COMMENT ON COLUMN embarques.folio_factura_3 IS 'Número de factura adicional 2 (si aplica)';
COMMENT ON COLUMN embarques.folio_factura_4 IS 'Número de factura adicional 3 (si aplica)';
COMMENT ON COLUMN embarques.fecha_envio_cliente IS 'Fecha en que se envió la factura al cliente';
COMMENT ON COLUMN embarques.fecha_pago_cliente IS 'Fecha en que el cliente realizó el pago';
COMMENT ON COLUMN embarques.referencia_pago IS 'Referencia bancaria, SPEI, o número de transferencia del pago';
COMMENT ON COLUMN embarques.cantidad_final_facturada IS 'Monto final facturado (puede diferir del precio_flete original)';
COMMENT ON COLUMN embarques.estado_facturacion IS 'Estado del proceso de facturación y cobranza';
COMMENT ON COLUMN embarques.fecha_archivado IS 'Fecha en que se archivó el registro para consulta histórica';
COMMENT ON COLUMN embarques.usuario_archivo IS 'Usuario que realizó el archivado del registro';
COMMENT ON COLUMN embarques.motivo_archivo IS 'Motivo o razón por la cual se archivó el registro';
COMMENT ON COLUMN embarques.observaciones_archivo IS 'Observaciones adicionales sobre el archivado';

-- Actualizar registros existentes
UPDATE embarques 
SET estado_facturacion = 'pendiente_facturacion' 
WHERE estado_facturacion IS NULL;

-- Crear constraint para validar estados
ALTER TABLE embarques 
DROP CONSTRAINT IF EXISTS chk_estado_facturacion;

ALTER TABLE embarques 
ADD CONSTRAINT chk_estado_facturacion 
CHECK (estado_facturacion IN ('pendiente_facturacion', 'facturado', 'pagado', 'archivado'));

-- Crear función helper para verificar columnas (si no existe)
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND column_name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- Verificar que todas las columnas se crearon correctamente
DO $$
DECLARE
    columnas_faltantes text[] := ARRAY[]::text[];
    columna text;
BEGIN
    -- Lista de columnas que deben existir
    FOR columna IN 
        SELECT unnest(ARRAY[
            'folio_factura_1', 'folio_factura_2', 'folio_factura_3', 'folio_factura_4',
            'fecha_envio_cliente', 'fecha_pago_cliente', 'referencia_pago',
            'cantidad_final_facturada', 'estado_facturacion', 'fecha_archivado',
            'usuario_archivo', 'motivo_archivo', 'observaciones_archivo'
        ])
    LOOP
        IF NOT check_column_exists('embarques', columna) THEN
            columnas_faltantes := array_append(columnas_faltantes, columna);
        END IF;
    END LOOP;
    
    IF array_length(columnas_faltantes, 1) > 0 THEN
        RAISE WARNING 'Las siguientes columnas no se pudieron crear: %', array_to_string(columnas_faltantes, ', ');
    ELSE
        RAISE NOTICE '✅ Todas las columnas de facturación se crearon exitosamente';
        RAISE NOTICE '📋 Estados válidos: pendiente_facturacion, facturado, pagado, archivado';
        RAISE NOTICE '🔍 Índices creados para optimizar consultas de facturación';
        RAISE NOTICE '💾 Registros existentes actualizados con estado por defecto';
    END IF;
END $$;

-- Mostrar estructura actualizada de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    COALESCE(col_description(pgc.oid, pa.attnum), 'Sin descripción') as descripcion
FROM information_schema.columns isc
JOIN pg_class pgc ON pgc.relname = isc.table_name
JOIN pg_attribute pa ON pa.attrelid = pgc.oid AND pa.attname = isc.column_name
WHERE isc.table_name = 'embarques' 
AND isc.column_name IN (
    'folio_factura_1', 'folio_factura_2', 'folio_factura_3', 'folio_factura_4',
    'fecha_envio_cliente', 'fecha_pago_cliente', 'referencia_pago',
    'cantidad_final_facturada', 'estado_facturacion', 'fecha_archivado',
    'usuario_archivo', 'motivo_archivo', 'observaciones_archivo'
)
ORDER BY isc.ordinal_position;
