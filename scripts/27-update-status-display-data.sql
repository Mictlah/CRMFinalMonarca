-- Script para actualizar y diversificar los estados de operadores y camiones para mejor visualización

-- Actualizar estados de operadores con variedad
UPDATE operadores 
SET estado = CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY fecha_registro) % 4 = 1 THEN 'activo'
    WHEN ROW_NUMBER() OVER (ORDER BY fecha_registro) % 4 = 2 THEN 'inactivo'
    WHEN ROW_NUMBER() OVER (ORDER BY fecha_registro) % 4 = 3 THEN 'vacaciones'
    ELSE 'suspendido'
END;

-- Actualizar estados de camiones con variedad
UPDATE camiones 
SET estado = CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY fecha_registro) % 5 = 1 THEN 'activo'
    WHEN ROW_NUMBER() OVER (ORDER BY fecha_registro) % 5 = 2 THEN 'disponible'
    WHEN ROW_NUMBER() OVER (ORDER BY fecha_registro) % 5 = 3 THEN 'mantenimiento'
    WHEN ROW_NUMBER() OVER (ORDER BY fecha_registro) % 5 = 4 THEN 'fuera-de-servicio'
    ELSE 'activo'
END;

-- Asegurar que al menos algunos registros estén activos/disponibles para las asignaciones
UPDATE operadores 
SET estado = 'activo' 
WHERE id IN (
    SELECT id FROM operadores 
    ORDER BY fecha_registro 
    LIMIT 3
);

UPDATE camiones 
SET estado = 'disponible' 
WHERE id IN (
    SELECT id FROM camiones 
    ORDER BY fecha_registro 
    LIMIT 3
);

COMMIT;
