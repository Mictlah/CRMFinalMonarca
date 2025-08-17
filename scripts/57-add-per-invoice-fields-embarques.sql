-- 57-add-per-invoice-fields-embarques.sql
-- Adds per-invoice dates and references for up to 4 invoices in embarques

BEGIN;

-- Fecha envío por factura
ALTER TABLE embarques
  ADD COLUMN IF NOT EXISTS fecha_envio_cliente_1 DATE,
  ADD COLUMN IF NOT EXISTS fecha_envio_cliente_2 DATE,
  ADD COLUMN IF NOT EXISTS fecha_envio_cliente_3 DATE,
  ADD COLUMN IF NOT EXISTS fecha_envio_cliente_4 DATE;

-- Fecha pago por factura
ALTER TABLE embarques
  ADD COLUMN IF NOT EXISTS fecha_pago_1 DATE,
  ADD COLUMN IF NOT EXISTS fecha_pago_2 DATE,
  ADD COLUMN IF NOT EXISTS fecha_pago_3 DATE,
  ADD COLUMN IF NOT EXISTS fecha_pago_4 DATE;

-- Referencia por factura
ALTER TABLE embarques
  ADD COLUMN IF NOT EXISTS referencia_pago_1 TEXT,
  ADD COLUMN IF NOT EXISTS referencia_pago_2 TEXT,
  ADD COLUMN IF NOT EXISTS referencia_pago_3 TEXT,
  ADD COLUMN IF NOT EXISTS referencia_pago_4 TEXT;

COMMIT;
