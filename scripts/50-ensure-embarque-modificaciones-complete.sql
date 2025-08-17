-- Script para agregar columnas de facturación a la tabla embarques
-- Estas columnas son necesarias para el módulo de facturación y cobranza

-- Agregar columnas de facturación si no existen
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

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_embarques_estado_facturacion ON embarques(estado_facturacion);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_envio_cliente ON embarques(fecha_envio_cliente);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_pago_cliente ON embarques(fecha_pago_cliente);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_archivado ON embarques(fecha_archivado);

-- Agregar comentarios para documentación
COMMENT ON COLUMN embarques.folio_factura_1 IS 'Número de factura principal';
COMMENT ON COLUMN embarques.folio_factura_2 IS 'Número de factura adicional 1';
COMMENT ON COLUMN embarques.folio_factura_3 IS 'Número de factura adicional 2';
COMMENT ON COLUMN embarques.folio_factura_4 IS 'Número de factura adicional 3';
COMMENT ON COLUMN embarques.fecha_envio_cliente IS 'Fecha en que se envió la factura al cliente';
COMMENT ON COLUMN embarques.fecha_pago_cliente IS 'Fecha en que el cliente realizó el pago';
COMMENT ON COLUMN embarques.referencia_pago IS 'Referencia bancaria o número de transferencia del pago';
COMMENT ON COLUMN embarques.cantidad_final_facturada IS 'Monto final facturado (puede diferir del precio_flete)';
COMMENT ON COLUMN embarques.estado_facturacion IS 'Estado del proceso de facturación: pendiente_facturacion, facturado, pagado, archivado';
COMMENT ON COLUMN embarques.fecha_archivado IS 'Fecha en que se archivó el registro';
COMMENT ON COLUMN embarques.usuario_archivo IS 'Usuario que archivó el registro';
COMMENT ON COLUMN embarques.motivo_archivo IS 'Motivo por el cual se archivó el registro';
COMMENT ON COLUMN embarques.observaciones_archivo IS 'Observaciones adicionales del archivo';

-- Actualizar registros existentes con estado por defecto
UPDATE embarques 
SET estado_facturacion = 'pendiente_facturacion' 
WHERE estado_facturacion IS NULL;

-- Crear constraint para validar estados de facturación
ALTER TABLE embarques 
ADD CONSTRAINT chk_estado_facturacion 
CHECK (estado_facturacion IN ('pendiente_facturacion', 'facturado', 'pagado', 'archivado'));

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Columnas de facturación agregadas exitosamente a la tabla embarques';
    RAISE NOTICE 'Estados válidos: pendiente_facturacion, facturado, pagado, archivado';
    RAISE NOTICE 'Índices creados para mejorar el rendimiento de consultas';
END $$;
