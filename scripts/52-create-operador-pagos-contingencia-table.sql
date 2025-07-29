CREATE TABLE IF NOT EXISTS public.operador_pagos_contingencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    embarque_id UUID REFERENCES public.embarques(id) ON DELETE CASCADE,
    operador_original_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,
    operador_reemplazo_id UUID REFERENCES public.public.operadores(id) ON DELETE SET NULL,
    monto_original NUMERIC(10, 2) NOT NULL,
    monto_reemplazo NUMERIC(10, 2) NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registrado_por TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_operador_pagos_contingencia_embarque_id ON public.operador_pagos_contingencia(embarque_id);
CREATE INDEX IF NOT EXISTS idx_operador_pagos_contingencia_operador_original_id ON public.operador_pagos_contingencia(operador_original_id);
CREATE INDEX IF NOT EXISTS idx_operador_pagos_contingencia_operador_reemplazo_id ON public.operador_pagos_contingencia(operador_reemplazo_id);

-- Trigger para actualizar `updated_at` automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.operador_pagos_contingencia;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.operador_pagos_contingencia
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
