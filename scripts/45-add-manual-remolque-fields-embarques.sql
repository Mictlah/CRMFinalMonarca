-- Script para agregar campos de remolque manual a la tabla embarques
-- Fecha: 2025-01-21
-- Descripción: Permite capturar datos de remolques externos temporalmente

BEGIN;

-- Agregar campos para remolque manual
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS remolque_numero_economico VARCHAR(50),
ADD COLUMN IF NOT EXISTS remolque_placa VARCHAR(20);

-- Crear índices para mejorar rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_embarques_remolque_numero_economico 
ON embarques(remolque_numero_economico) 
WHERE remolque_numero_economico IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_embarques_remolque_placa 
ON embarques(remolque_placa) 
WHERE remolque_placa IS NOT NULL;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN embarques.remolque_numero_economico IS 'Número económico de remolque capturado manualmente (para remolques externos o temporales)';
COMMENT ON COLUMN embarques.remolque_placa IS 'Placa de remolque capturado manualmente (para remolques externos o temporales)';

-- Crear función para validar que no se usen ambos tipos de remolque
CREATE OR REPLACE FUNCTION validate_remolque_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que no se use remolque_id y campos manuales al mismo tiempo
    IF NEW.remolque_id IS NOT NULL AND (NEW.remolque_numero_economico IS NOT NULL OR NEW.remolque_placa IS NOT NULL) THEN
        RAISE EXCEPTION 'No se puede usar remolque del inventario y remolque manual al mismo tiempo';
    END IF;
    
    -- Si se usa remolque manual, ambos campos son requeridos
    IF (NEW.remolque_numero_economico IS NOT NULL OR NEW.remolque_placa IS NOT NULL) THEN
        IF NEW.remolque_numero_economico IS NULL OR NEW.remolque_placa IS NULL THEN
            RAISE EXCEPTION 'Para remolque manual, tanto número económico como placa son requeridos';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validación
DROP TRIGGER IF EXISTS trigger_validate_remolque_data ON embarques;
CREATE TRIGGER trigger_validate_remolque_data
    BEFORE INSERT OR UPDATE ON embarques
    FOR EACH ROW
    EXECUTE FUNCTION validate_remolque_data();

-- Actualizar la vista de embarques si existe
DROP VIEW IF EXISTS vista_embarques_completa;
CREATE VIEW vista_embarques_completa AS
SELECT 
    e.*,
    c.nombre as cliente_nombre,
    o.nombre as operador_nombre,
    o.apellidos as operador_apellidos,
    cam.numero_economico as camion_numero,
    r.numero_economico as remolque_inventario_numero,
    COALESCE(r.numero_economico, e.remolque_numero_economico) as remolque_numero_final,
    COALESCE(r.placas, e.remolque_placa) as remolque_placa_final,
    CASE 
        WHEN e.remolque_id IS NOT NULL THEN 'inventario'
        WHEN e.remolque_numero_economico IS NOT NULL THEN 'manual'
        ELSE 'sin_asignar'
    END as tipo_remolque
FROM embarques e
LEFT JOIN clientes c ON e.cliente_id = c.id
LEFT JOIN operadores o ON e.operador_id = o.id
LEFT JOIN camiones cam ON e.camion_id = cam.id
LEFT JOIN remolques r ON e.remolque_id = r.id;

COMMIT;

-- Verificar que los cambios se aplicaron correctamente
DO $$
BEGIN
    -- Verificar que las columnas existen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'remolque_numero_economico'
    ) THEN
        RAISE EXCEPTION 'Error: La columna remolque_numero_economico no se creó correctamente';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' 
        AND column_name = 'remolque_placa'
    ) THEN
        RAISE EXCEPTION 'Error: La columna remolque_placa no se creó correctamente';
    END IF;
    
    RAISE NOTICE 'Script ejecutado exitosamente. Campos de remolque manual agregados a la tabla embarques.';
END $$;
