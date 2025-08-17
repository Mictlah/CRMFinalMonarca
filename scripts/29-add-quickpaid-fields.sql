-- Agrega campos para QuickPaid a la tabla embarques
ALTER TABLE embarques
ADD COLUMN quickpaid_percent numeric(5,4),
ADD COLUMN quickpaid_descuento numeric(12,2),
ADD COLUMN precio_quickpaid numeric(12,2);

-- Opcional: comentarios para documentación
COMMENT ON COLUMN embarques.quickpaid_percent IS 'Porcentaje de descuento QuickPaid aplicado (ejemplo: 0.01 para 1%)';
COMMENT ON COLUMN embarques.quickpaid_descuento IS 'Monto descontado por QuickPaid';
COMMENT ON COLUMN embarques.precio_quickpaid IS 'Precio final del flete después de aplicar QuickPaid';
