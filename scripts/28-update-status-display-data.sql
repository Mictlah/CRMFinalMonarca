-- Update some records with different statuses for better visualization
DO $$
DECLARE
    operador_count INTEGER;
    camion_count INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO operador_count FROM operadores;
    SELECT COUNT(*) INTO camion_count FROM camiones;

    -- Update operadores with varied statuses (only if we have records)
    IF operador_count > 0 THEN
        -- Set some operators to different statuses
        UPDATE operadores SET estado = 'inactivo' 
        WHERE id IN (
            SELECT id FROM operadores 
            ORDER BY RANDOM() 
            LIMIT GREATEST(1, operador_count / 5)
        );

        UPDATE operadores SET estado = 'suspendido' 
        WHERE id IN (
            SELECT id FROM operadores 
            WHERE estado = 'activo'
            ORDER BY RANDOM() 
            LIMIT GREATEST(1, operador_count / 8)
        );

        UPDATE operadores SET estado = 'vacaciones' 
        WHERE id IN (
            SELECT id FROM operadores 
            WHERE estado = 'activo'
            ORDER BY RANDOM() 
            LIMIT GREATEST(1, operador_count / 10)
        );
    END IF;

    -- Update camiones with varied statuses (only if we have records)
    IF camion_count > 0 THEN
        -- Set some trucks to different statuses
        UPDATE camiones SET estado = 'mantenimiento' 
        WHERE id IN (
            SELECT id FROM camiones 
            ORDER BY RANDOM() 
            LIMIT GREATEST(1, camion_count / 4)
        );

        UPDATE camiones SET estado = 'disponible' 
        WHERE id IN (
            SELECT id FROM camiones 
            WHERE estado = 'activo'
            ORDER BY RANDOM() 
            LIMIT GREATEST(1, camion_count / 3)
        );

        UPDATE camiones SET estado = 'fuera-de-servicio' 
        WHERE id IN (
            SELECT id FROM camiones 
            WHERE estado = 'activo'
            ORDER BY RANDOM() 
            LIMIT GREATEST(1, camion_count / 8)
        );
    END IF;
END $$;
