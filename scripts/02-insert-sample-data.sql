-- Insertar 1 operador de ejemplo
INSERT INTO operadores (nombre, apellidos, telefono, email, licencia, fecha_vencimiento_licencia) VALUES
('José', 'Martínez García', '5551234567', 'jose.martinez@email.com', 'LIC001', '2025-06-15');

-- Insertar 1 cliente de ejemplo
INSERT INTO clientes (nombre, empresa, telefono, email, direccion, rfc) VALUES
('Distribuidora del Norte', 'Distribuidora del Norte SA', '5556789012', 'contacto@distnorte.com', 'Av. Industrial 123, Monterrey', 'DNO850101ABC');

-- Insertar 1 camión de ejemplo
INSERT INTO camiones (numero_economico, marca, modelo, año, placas, kilometraje) VALUES
('001', 'Kenworth', 'T680', 2020, 'ABC-123-A', 85000);

-- Insertar 1 remolque de ejemplo
INSERT INTO remolques (numero_economico, tipo, capacidad, placas, ubicacion) VALUES
('R001', 'Caja Seca', 28.5, 'REM-001-A', 'Patio Principal');

-- Insertar 1 embarque de ejemplo
INSERT INTO embarques (folio, cliente_id, operador_id, camion_id, remolque_id, origen, destino, lugar_recolecta, fecha_recolecta, hora_recolecta, contenido, peso, estado) VALUES
('TIM-2501-001', 
 (SELECT id FROM clientes WHERE nombre = 'Distribuidora del Norte' LIMIT 1),
 (SELECT id FROM operadores WHERE nombre = 'José' LIMIT 1),
 (SELECT id FROM camiones WHERE numero_economico = '001' LIMIT 1),
 (SELECT id FROM remolques WHERE numero_economico = 'R001' LIMIT 1),
 'CDMX', 'Monterrey', 'Bodega Central CDMX', '2025-01-20', '08:00', 'Productos electrónicos', 15.5, 'creado');

-- Insertar 1 recordatorio de ejemplo
INSERT INTO recordatorios (titulo, descripcion, fecha_vencimiento, tipo, prioridad, operador_id) VALUES
('Renovación de Licencia', 'Renovar licencia de conducir federal de José Martínez', '2025-02-25', 'documentacion', 'alta',
 (SELECT id FROM operadores WHERE nombre = 'José' LIMIT 1));
