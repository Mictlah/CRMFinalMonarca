-- Crear tabla para marcas de remolques
CREATE TABLE IF NOT EXISTS public.marcas_remolques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_marcas_remolques_nombre ON public.marcas_remolques(nombre);
CREATE INDEX IF NOT EXISTS idx_marcas_remolques_activa ON public.marcas_remolques(activa);

-- Insertar marcas de remolques predefinidas
INSERT INTO public.marcas_remolques (nombre) VALUES
    ('Utility'),
    ('Wabash'),
    ('Great Dane'),
    ('Hyundai Translead'),
    ('Vanguard'),
    ('Fruehauf'),
    ('Schmitz Cargobull'),
    ('Krone'),
    ('Kögel'),
    ('Randon'),
    ('Lecitrailer'),
    ('Cargotrail'),
    ('ATRO')
ON CONFLICT (nombre) DO NOTHING;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_marcas_remolques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_marcas_remolques_updated_at
    BEFORE UPDATE ON public.marcas_remolques
    FOR EACH ROW
    EXECUTE FUNCTION update_marcas_remolques_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.marcas_remolques IS 'Catálogo de marcas de remolques disponibles';
COMMENT ON COLUMN public.marcas_remolques.nombre IS 'Nombre de la marca de remolque';
COMMENT ON COLUMN public.marcas_remolques.activa IS 'Indica si la marca está activa para su uso';
