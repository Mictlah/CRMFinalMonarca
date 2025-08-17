-- Crear tabla para audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    accion VARCHAR(50) NOT NULL CHECK (accion IN ('CREAR', 'ACTUALIZAR', 'ELIMINAR', 'EXPORTAR', 'LOGIN', 'LOGOUT', 'CONSULTAR')),
    modulo VARCHAR(100) NOT NULL,
    detalles TEXT NOT NULL,
    ip VARCHAR(45), -- Soporta IPv4 e IPv6
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_audit_logs_fecha_creacion ON audit_logs(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON audit_logs(usuario);
CREATE INDEX IF NOT EXISTS idx_audit_logs_accion ON audit_logs(accion);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo ON audit_logs(modulo);

-- Crear índice compuesto para consultas comunes
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_fecha ON audit_logs(usuario, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo_fecha ON audit_logs(modulo, fecha_creacion DESC);

-- Función para limpiar logs antiguos automáticamente (opcional)
CREATE OR REPLACE FUNCTION limpiar_audit_logs_antiguos()
RETURNS void AS $$
BEGIN
    -- Mantener solo los últimos 10,000 registros
    DELETE FROM audit_logs 
    WHERE id NOT IN (
        SELECT id FROM audit_logs 
        ORDER BY fecha_creacion DESC 
        LIMIT 10000
    );
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE audit_logs IS 'Tabla para registrar todas las acciones de auditoría del sistema';
COMMENT ON COLUMN audit_logs.usuario IS 'Nombre del usuario que realizó la acción';
COMMENT ON COLUMN audit_logs.accion IS 'Tipo de acción realizada (CREAR, ACTUALIZAR, ELIMINAR, etc.)';
COMMENT ON COLUMN audit_logs.modulo IS 'Módulo o sección del sistema donde se realizó la acción';
COMMENT ON COLUMN audit_logs.detalles IS 'Descripción detallada de la acción realizada';
COMMENT ON COLUMN audit_logs.ip IS 'Dirección IP desde donde se realizó la acción';
COMMENT ON COLUMN audit_logs.fecha_creacion IS 'Fecha y hora cuando se realizó la acción';

-- Insertar algunos registros de ejemplo para pruebas
INSERT INTO audit_logs (usuario, accion, modulo, detalles, ip) VALUES
('Juan Pérez', 'CREAR', 'Embarques', 'Nuevo embarque creado: TIM-2507-001 para cliente ACME Corp', '192.168.1.100'),
('María González', 'ACTUALIZAR', 'Operadores', 'Información del operador Carlos Ruiz actualizada', '192.168.1.101'),
('Admin Sistema', 'ELIMINAR', 'Camiones', 'Camión con placas ABC-123 eliminado del sistema', '192.168.1.1'),
('Ana López', 'EXPORTAR', 'Clientes', 'Lista de clientes exportada a Excel', '192.168.1.102'),
('Carlos Mendoza', 'LOGIN', 'Sistema', 'Inicio de sesión exitoso', '192.168.1.103'),
('Juan Pérez', 'ACTUALIZAR', 'Embarques', 'Estado del embarque TIM-2507-001 cambiado a En Tránsito', '192.168.1.100'),
('María González', 'CREAR', 'Clientes', 'Nuevo cliente registrado: Transportes del Norte S.A.', '192.168.1.101');
