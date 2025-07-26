-- Script para agregar campos de divisa de pago y empresa facturadora a la tabla clientes
-- Fecha: 2025-01-21
-- Descripción: Agrega campos para divisa de pago preferida y empresa facturadora

BEGIN;

-- Agregar columna divisa_pago
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'divisa_pago'
    ) THEN
        ALTER TABLE clientes ADD COLUMN divisa_pago VARCHAR(3) CHECK (divisa_pago IN ('MXN', 'USD'));
        RAISE NOTICE 'Columna divisa_pago agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna divisa_pago ya existe';
    END IF;
END $$;

-- Agregar columna empresa_facturadora
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'empresa_facturadora'
    ) THEN
        ALTER TABLE clientes ADD COLUMN empresa_facturadora VARCHAR(50) CHECK (empresa_facturadora IN ('JOSE_FERNANDO_CABARJO', 'MONARCH_INTERNATIONAL'));
        RAISE NOTICE 'Columna empresa_facturadora agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna empresa_facturadora ya existe';
    END IF;
END $$;

-- Agregar comentarios a las columnas
COMMENT ON COLUMN clientes.divisa_pago IS 'Divisa de pago preferida del cliente: MXN (Pesos Mexicanos) o USD (Dólares Americanos)';
COMMENT ON COLUMN clientes.empresa_facturadora IS 'Empresa que factura al cliente: JOSE_FERNANDO_CABARJO o MONARCH_INTERNATIONAL';

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_clientes_divisa_pago ON clientes(divisa_pago) WHERE divisa_pago IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_facturadora ON clientes(empresa_facturadora) WHERE empresa_facturadora IS NOT NULL;

-- Actualizar algunos clientes existentes con valores por defecto (opcional)
-- Esto es solo para tener datos de ejemplo, puedes comentar estas líneas si no las necesitas
UPDATE clientes 
SET divisa_pago = 'MXN', 
    empresa_facturadora = 'JOSE_FERNANDO_CABARJO'
WHERE divisa_pago IS NULL 
  AND empresa_facturadora IS NULL 
  AND estado = 'activo'
  AND id IN (
    SELECT id FROM clientes 
    WHERE estado = 'activo' 
    LIMIT 3
  );

-- Verificar que las columnas se agregaron correctamente
DO $$
DECLARE
    divisa_exists BOOLEAN;
    empresa_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'divisa_pago'
    ) INTO divisa_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'empresa_facturadora'
    ) INTO empresa_exists;
    
    IF divisa_exists AND empresa_exists THEN
        RAISE NOTICE '✅ Todas las columnas se agregaron correctamente';
        RAISE NOTICE '📊 Columnas disponibles: divisa_pago, empresa_facturadora';
    ELSE
        RAISE EXCEPTION '❌ Error: No se pudieron agregar todas las columnas';
    END IF;
END $$;

-- Mostrar estadísticas de la tabla actualizada
SELECT 
    COUNT(*) as total_clientes,
    COUNT(divisa_pago) as clientes_con_divisa,
    COUNT(empresa_facturadora) as clientes_con_empresa_facturadora,
    COUNT(CASE WHEN divisa_pago = 'MXN' THEN 1 END) as clientes_pesos,
    COUNT(CASE WHEN divisa_pago = 'USD' THEN 1 END) as clientes_dolares,
    COUNT(CASE WHEN empresa_facturadora = 'JOSE_FERNANDO_CABARJO' THEN 1 END) as factura_jose_fernando,
    COUNT(CASE WHEN empresa_facturadora = 'MONARCH_INTERNATIONAL' THEN 1 END) as factura_monarch
FROM clientes 
WHERE estado IN ('activo', 'inactivo');

COMMIT;

-- Mensaje final
SELECT '🎉 Script ejecutado exitosamente. Los nuevos campos están disponibles para usar en el formulario de clientes.' as mensaje;
