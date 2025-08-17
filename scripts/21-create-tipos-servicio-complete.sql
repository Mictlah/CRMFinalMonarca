-- Script completo para crear la tabla tipos_servicio y actualizar embarques
-- Ejecutar este script para configurar todos los tipos de servicio

-- 1. Crear la tabla tipos_servicio si no existe
CREATE TABLE IF NOT EXISTS tipos_servicio (
    id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
    precio_base DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    orden_visualizacion INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar todos los tipos de servicio
INSERT INTO tipos_servicio (id, nombre, descripcion, categoria, subcategoria, precio_base, orden_visualizacion) VALUES
-- Servicios de Aduana - Exportación 240
('exportacion-cargada-caja-seca-240', 'EXPORTACIÓN CARGADA - CAJA SECA 240', 'Servicio de exportación con contenedor de caja seca cargada - Zona 240', 'Servicios de Aduana', 'Exportación 240', 2500.00, 1),
('exportacion-cargada-larmex-240', 'EXPORTACIÓN CARGADA - CAJA SECA (LARMEX) 240', 'Servicio especializado LARMEX para exportación con caja seca - Zona 240', 'Servicios de Aduana', 'Exportación 240', 2800.00, 2),
('exportacion-cargada-thermo-agricultura-240', 'EXPORTACIÓN CARGADA - THERMO (AGRICULTURA) 240', 'Transporte refrigerado especializado para productos agrícolas - Zona 240', 'Servicios de Aduana', 'Exportación 240', 3200.00, 3),
('exportacion-cargada-plataforma-240', 'EXPORTACIÓN CARGADA - PLATAFORMA 240', 'Plataforma especializada para carga de exportación - Zona 240', 'Servicios de Aduana', 'Exportación 240', 2700.00, 4),

-- Servicios de Aduana - Importación 240
('importacion-cargada-caja-seca-240', 'IMPORTACIÓN CARGADA - CAJA SECA 240', 'Servicio de importación con contenedor de caja seca cargada - Zona 240', 'Servicios de Aduana', 'Importación 240', 2400.00, 5),
('importacion-cargada-plataforma-240', 'IMPORTACIÓN CARGADA - PLATAFORMA 240', 'Plataforma de importación con carga - Zona 240', 'Servicios de Aduana', 'Importación 240', 2600.00, 6),
('importacion-vacia-caja-seca-thermo-240', 'IMPORTACIÓN VACÍA - CAJA SECA/THERMO 240', 'Retorno de contenedores vacíos de caja seca o thermo - Zona 240', 'Servicios de Aduana', 'Importación 240', 1800.00, 7),
('importacion-cargada-plataforma-amarre-240', 'IMPORTACIÓN CARGADA - PLATAFORMA CON AMARRE 240', 'Plataforma especializada con sistema de amarre para importación - Zona 240', 'Servicios de Aduana', 'Importación 240', 2900.00, 8),
('importacion-en-tractor-240', 'IMPORTACIÓN - EN TRACTOR 240', 'Servicio de importación solo con tractocamión - Zona 240', 'Servicios de Aduana', 'Importación 240', 1500.00, 9),

-- Servicios de Aduana - Zona 800
('exportacion-cargada-caja-seca-800', 'EXPORTACIÓN CARGADA - CAJA SECA 800', 'Exportación con caja seca cargada - Zona 800', 'Servicios de Aduana', 'Zona 800', 3000.00, 10),
('exportacion-vacia-caja-seca-800', 'EXPORTACIÓN VACÍA - CAJA SECA 800', 'Retorno de contenedor vacío de caja seca - Zona 800', 'Servicios de Aduana', 'Zona 800', 2200.00, 11),
('exportacion-en-tractor-800', 'EXPORTACIÓN - EN TRACTOR 800', 'Servicio de exportación solo con tractocamión - Zona 800', 'Servicios de Aduana', 'Zona 800', 1800.00, 12),
('exportacion-cargada-plataforma-800', 'EXPORTACIÓN CARGADA - PLATAFORMA 800', 'Plataforma cargada para exportación - Zona 800', 'Servicios de Aduana', 'Zona 800', 3200.00, 13),
('importacion-cargada-caja-seca-800', 'IMPORTACIÓN CARGADA - CAJA SECA 800', 'Importación con caja seca cargada - Zona 800', 'Servicios de Aduana', 'Zona 800', 2800.00, 14),
('importacion-vacia-plataforma-800', 'IMPORTACIÓN VACÍA - PLATAFORMA 800', 'Plataforma vacía para importación - Zona 800', 'Servicios de Aduana', 'Zona 800', 2000.00, 15),

-- Servicios Adicionales
('pagos-extras', 'PAGOS EXTRAS', 'Servicios adicionales con costo extra según requerimientos especiales', 'Servicios Adicionales', 'Extras', 500.00, 16),
('horas-rojo-amarillo', 'HORAS ROJO/AMARILLO', 'Servicios prestados en horarios especiales (rojo/amarillo)', 'Servicios Adicionales', 'Horarios Especiales', 800.00, 17),
('cargas-descargas', 'CARGAS/DESCARGAS', 'Servicios de manipulación, carga y descarga de mercancías', 'Servicios Adicionales', 'Manipulación', 600.00, 18),
('movimientos-en-falso', 'MOVIMIENTOS EN FALSO', 'Movimientos iniciados pero no completados por causas ajenas', 'Servicios Adicionales', 'Especiales', 400.00, 19),
('movimientos-locales', 'MOVIMIENTOS LOCALES', 'Traslados y movimientos dentro de la ciudad o zona local', 'Servicios Adicionales', 'Locales', 300.00, 20),
('otro', 'OTRO', 'Servicio personalizado según necesidades específicas del cliente', 'Servicios Adicionales', 'Personalizado', 0.00, 21)

ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    categoria = EXCLUDED.categoria,
    subcategoria = EXCLUDED.subcategoria,
    precio_base = EXCLUDED.precio_base,
    orden_visualizacion = EXCLUDED.orden_visualizacion,
    updated_at = CURRENT_TIMESTAMP;

-- 3. Actualizar la tabla embarques para usar VARCHAR en lugar de UUID
-- Primero verificar si la columna existe y es de tipo UUID
DO $$
BEGIN
    -- Cambiar tipo_servicio_id a VARCHAR si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'tipo_servicio_id'
    ) THEN
        ALTER TABLE embarques ALTER COLUMN tipo_servicio_id TYPE VARCHAR(100);
    ELSE
        -- Si no existe, agregarla
        ALTER TABLE embarques ADD COLUMN tipo_servicio_id VARCHAR(100);
    END IF;
    
    -- Agregar otros campos que puedan faltar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'direccion_recolecta'
    ) THEN
        ALTER TABLE embarques ADD COLUMN direccion_recolecta TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'direccion_entrega'
    ) THEN
        ALTER TABLE embarques ADD COLUMN direccion_entrega TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'fecha_recolecta'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_recolecta DATE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'hora_recolecta'
    ) THEN
        ALTER TABLE embarques ADD COLUMN hora_recolecta TIME;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'fecha_entrega'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_entrega DATE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'hora_entrega'
    ) THEN
        ALTER TABLE embarques ADD COLUMN hora_entrega TIME;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'load_number'
    ) THEN
        ALTER TABLE embarques ADD COLUMN load_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'patente_agente_aduanal'
    ) THEN
        ALTER TABLE embarques ADD COLUMN patente_agente_aduanal VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'aduana_cruce'
    ) THEN
        ALTER TABLE embarques ADD COLUMN aduana_cruce VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'dueno_mercancia'
    ) THEN
        ALTER TABLE embarques ADD COLUMN dueno_mercancia VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'representante_cliente'
    ) THEN
        ALTER TABLE embarques ADD COLUMN representante_cliente UUID;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'info_representante'
    ) THEN
        ALTER TABLE embarques ADD COLUMN info_representante JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarques' AND column_name = 'carta_porte'
    ) THEN
        ALTER TABLE embarques ADD COLUMN carta_porte VARCHAR(100);
    END IF;
END $$;

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tipos_servicio_categoria ON tipos_servicio(categoria);
CREATE INDEX IF NOT EXISTS idx_tipos_servicio_activo ON tipos_servicio(activo);
CREATE INDEX IF NOT EXISTS idx_tipos_servicio_orden ON tipos_servicio(orden_visualizacion);
CREATE INDEX IF NOT EXISTS idx_embarques_tipo_servicio ON embarques(tipo_servicio_id);

-- 5. Crear foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_embarques_tipo_servicio'
    ) THEN
        ALTER TABLE embarques 
        ADD CONSTRAINT fk_embarques_tipo_servicio 
        FOREIGN KEY (tipo_servicio_id) REFERENCES tipos_servicio(id);
    END IF;
END $$;

-- 6. Funciones útiles para consultar servicios
CREATE OR REPLACE FUNCTION obtener_servicios_por_categoria(categoria_nombre VARCHAR)
RETURNS TABLE (
    id VARCHAR,
    nombre VARCHAR,
    descripcion TEXT,
    precio_base DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT ts.id, ts.nombre, ts.descripcion, ts.precio_base
    FROM tipos_servicio ts
    WHERE ts.categoria = categoria_nombre AND ts.activo = true
    ORDER BY ts.orden_visualizacion;
END;
$$ LANGUAGE plpgsql;

-- 7. Vista para estadísticas de servicios
CREATE OR REPLACE VIEW estadisticas_servicios AS
SELECT 
    ts.id,
    ts.nombre,
    ts.categoria,
    ts.precio_base,
    COUNT(e.id) as total_embarques,
    COUNT(CASE WHEN e.estado = 'entregado' THEN 1 END) as embarques_entregados,
    AVG(CASE WHEN e.peso IS NOT NULL THEN e.peso END) as peso_promedio
FROM tipos_servicio ts
LEFT JOIN embarques e ON ts.id = e.tipo_servicio_id
WHERE ts.activo = true
GROUP BY ts.id, ts.nombre, ts.categoria, ts.precio_base
ORDER BY total_embarques DESC;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script ejecutado exitosamente. Se crearon % tipos de servicio.', 
        (SELECT COUNT(*) FROM tipos_servicio WHERE activo = true);
END $$;
