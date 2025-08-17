-- 24a-insert-alert-thresholds-examples.sql
-- Ejemplos de configuración de umbrales para fechas de vencimiento

INSERT INTO alert_thresholds (modulo, campo, dias_rojo, dias_amarillo, dias_verde)
VALUES
  ('operadores', 'visa_vencimiento', 30, 60, 90),
  ('operadores', 'licencia_vencimiento', 15, 30, 60),
  ('camiones', 'poliza_vencimiento', 10, 20, 40),
  ('recordatorios', 'fecha_vencimiento', 3, 7, 14);
