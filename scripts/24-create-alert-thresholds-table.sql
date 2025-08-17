-- 24-create-alert-thresholds-table.sql
-- Crea la tabla de configuración de umbrales de alerta para vencimientos

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo text NOT NULL, -- Ej: 'operadores', 'camiones', 'recordatorios'
  campo text NOT NULL,  -- Ej: 'visa_vencimiento', 'poliza_vencimiento'
  dias_rojo integer NOT NULL,     -- Días antes para alerta alta (roja)
  dias_amarillo integer NOT NULL, -- Días antes para alerta media (amarilla)
  dias_verde integer,             -- Opcional: días antes para alerta baja (verde)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
