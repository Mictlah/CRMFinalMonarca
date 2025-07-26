-- Script para habilitar el campo familiares después de la actualización
-- Ejecutar DESPUÉS del script 10-update-operadores-table-complete.sql

-- Verificar que el campo familiares existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'familiares') THEN
        RAISE EXCEPTION 'El campo familiares no existe. Ejecuta primero el script 10-update-operadores-table-complete.sql';
    ELSE
        RAISE NOTICE 'Campo familiares confirmado. Ahora puedes descomentar las líneas en el código de operadores.';
        RAISE NOTICE 'Busca las líneas comentadas con "// Temporalmente comentado" y descoméntalas.';
    END IF;
END $$;

-- Insertar algunos datos de prueba para verificar que todo funciona
INSERT INTO operadores (
    nombre, 
    apellidos, 
    telefono, 
    email, 
    tipo_sangre,
    fecha_vencimiento_apto_medico,
    familiares,
    estado
) VALUES (
    'Juan Carlos',
    'Pérez García',
    '55-1234-5678',
    'juan.perez@transportesmonarca.com',
    'O+',
    '2024-12-31',
    '[{"id":"1","nombre":"María Pérez","parentesco":"Esposa","direccion":"Calle Principal 123","telefono":"55-8765-4321"}]',
    'activo'
) ON CONFLICT DO NOTHING;

RAISE NOTICE 'Datos de prueba insertados (si no existían).';
