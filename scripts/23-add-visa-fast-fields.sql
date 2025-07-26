-- Agregar campos de Visa y FAST a la tabla operadores
ALTER TABLE operadores 
ADD COLUMN numero_visa VARCHAR(50),
ADD COLUMN fecha_vencimiento_visa DATE,
ADD COLUMN numero_fast VARCHAR(50),
ADD COLUMN fecha_vencimiento_fast DATE;

-- Agregar comentarios para documentar los nuevos campos
COMMENT ON COLUMN operadores.numero_visa IS 'Número de visa del operador';
COMMENT ON COLUMN operadores.fecha_vencimiento_visa IS 'Fecha de vencimiento de la visa';
COMMENT ON COLUMN operadores.numero_fast IS 'Número de FAST (Free and Secure Trade) del operador';
COMMENT ON COLUMN operadores.fecha_vencimiento_fast IS 'Fecha de vencimiento del FAST';
