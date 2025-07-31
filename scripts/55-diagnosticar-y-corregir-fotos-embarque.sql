-- Script para diagnosticar y corregir problemas de vinculación entre fotos y embarques
-- Especialmente útil para el caso TIM-2507-074

-- 1. Diagnosticar el problema actual
SELECT 
    'DIAGNÓSTICO INICIAL' as seccion,
    '' as detalle,
    '' as valor;

-- Buscar el embarque TIM-2507-074
SELECT 
    'Embarque TIM-2507-074' as seccion,
    'ID del embarque' as detalle,
    id as valor
FROM embarques 
WHERE folio = 'TIM-2507-074';

-- Buscar fotos que podrían pertenecer a este embarque
SELECT 
    'Fotos relacionadas con TIM-2507-074' as seccion,
    'Fotos encontradas por nombre' as detalle,
    COUNT(*) as valor
FROM fotos_embarques 
WHERE nombre_archivo ILIKE '%TIM-2507-074%' 
   OR url_blob ILIKE '%TIM-2507-074%';

-- Mostrar detalles de las fotos encontradas
SELECT 
    'Detalles de fotos TIM-2507-074' as seccion,
    nombre_archivo as detalle,
    embarque_id as valor
FROM fotos_embarques 
WHERE nombre_archivo ILIKE '%TIM-2507-074%' 
   OR url_blob ILIKE '%TIM-2507-074%';

-- 2. Corregir la vinculación
-- Actualizar fotos huérfanas para que apunten al embarque correcto
UPDATE fotos_embarques 
SET embarque_id = (
    SELECT id 
    FROM embarques 
    WHERE folio = 'TIM-2507-074' 
    LIMIT 1
)
WHERE (nombre_archivo ILIKE '%TIM-2507-074%' OR url_blob ILIKE '%TIM-2507-074%')
  AND embarque_id != (
    SELECT id 
    FROM embarques 
    WHERE folio = 'TIM-2507-074' 
    LIMIT 1
  );

-- 3. Verificar la corrección
SELECT 
    'VERIFICACIÓN POST-CORRECCIÓN' as seccion,
    '' as detalle,
    '' as valor;

-- Contar fotos correctamente vinculadas
SELECT 
    'Fotos vinculadas correctamente' as seccion,
    'Total fotos para TIM-2507-074' as detalle,
    COUNT(*) as valor
FROM fotos_embarques fe
JOIN embarques e ON fe.embarque_id = e.id
WHERE e.folio = 'TIM-2507-074';

-- 4. Limpieza general de fotos huérfanas
-- Buscar fotos que no tienen embarque válido
SELECT 
    'Fotos huérfanas en el sistema' as seccion,
    'Fotos sin embarque válido' as detalle,
    COUNT(*) as valor
FROM fotos_embarques fe
LEFT JOIN embarques e ON fe.embarque_id = e.id
WHERE e.id IS NULL;

-- 5. Estadísticas finales
SELECT 
    'ESTADÍSTICAS FINALES' as seccion,
    '' as detalle,
    '' as valor;

SELECT 
    'Total embarques' as seccion,
    'Embarques en sistema' as detalle,
    COUNT(*) as valor
FROM embarques;

SELECT 
    'Total fotos' as seccion,
    'Fotos en sistema' as detalle,
    COUNT(*) as valor
FROM fotos_embarques;

SELECT 
    'Embarques con fotos' as seccion,
    'Embarques que tienen fotos' as detalle,
    COUNT(DISTINCT fe.embarque_id) as valor
FROM fotos_embarques fe
JOIN embarques e ON fe.embarque_id = e.id;

-- 6. Crear función para corregir automáticamente fotos huérfanas por folio
CREATE OR REPLACE FUNCTION corregir_fotos_por_folio(folio_embarque TEXT)
RETURNS INTEGER AS $$
DECLARE
    embarque_id_encontrado UUID;
    fotos_corregidas INTEGER := 0;
BEGIN
    -- Buscar el ID del embarque por folio
    SELECT id INTO embarque_id_encontrado
    FROM embarques 
    WHERE folio = folio_embarque 
    LIMIT 1;
    
    -- Si no se encuentra el embarque, retornar 0
    IF embarque_id_encontrado IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Actualizar fotos que contengan el folio en el nombre o URL
    UPDATE fotos_embarques 
    SET embarque_id = embarque_id_encontrado
    WHERE (nombre_archivo ILIKE '%' || folio_embarque || '%' 
           OR url_blob ILIKE '%' || folio_embarque || '%')
      AND embarque_id != embarque_id_encontrado;
    
    GET DIAGNOSTICS fotos_corregidas = ROW_COUNT;
    
    RETURN fotos_corregidas;
END;
$$ LANGUAGE plpgsql;

-- Usar la función para corregir TIM-2507-074
SELECT corregir_fotos_por_folio('TIM-2507-074') as fotos_corregidas_tim_2507_074;
