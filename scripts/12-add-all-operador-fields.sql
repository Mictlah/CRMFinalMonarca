-- Script actualizado para la tabla operadores con los campos necesarios
-- Incluye la columna observaciones que faltaba

-- Verificar que la tabla operadores existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operadores') THEN
        RAISE EXCEPTION 'La tabla operadores no existe. Ejecuta primero el script 01-create-tables.sql';
    END IF;
END $$;

-- Agregar campos básicos y personales necesarios
ALTER TABLE operadores 
ADD COLUMN IF NOT EXISTS fecha_vencimiento_apto_medico DATE,
ADD COLUMN IF NOT EXISTS tipo_sangre VARCHAR(5),
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS curp VARCHAR(18),
ADD COLUMN IF NOT EXISTS rfc VARCHAR(13),
ADD COLUMN IF NOT EXISTS nss VARCHAR(11),
ADD COLUMN IF NOT EXISTS telefono_emergencia VARCHAR(15),
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Campo específico para contactos de emergencia (JSON)
ALTER TABLE operadores 
ADD COLUMN IF NOT EXISTS contactos_emergencia TEXT;

-- Campo para documentos (JSON)
ALTER TABLE operadores 
ADD COLUMN IF NOT EXISTS documentos TEXT;

-- Eliminar campos laborales y familiares si existen (ya que no los necesitamos)
DO $$
BEGIN
    -- Eliminar campos laborales
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'experiencia_anos') THEN
        ALTER TABLE operadores DROP COLUMN experiencia_anos;
        RAISE NOTICE 'Campo experiencia_anos eliminado';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'fecha_ingreso') THEN
        ALTER TABLE operadores DROP COLUMN fecha_ingreso;
        RAISE NOTICE 'Campo fecha_ingreso eliminado';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'salario') THEN
        ALTER TABLE operadores DROP COLUMN salario;
        RAISE NOTICE 'Campo salario eliminado';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'tipo_contrato') THEN
        ALTER TABLE operadores DROP COLUMN tipo_contrato;
        RAISE NOTICE 'Campo tipo_contrato eliminado';
    END IF;
    
    -- Eliminar campo familiares
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operadores' AND column_name = 'familiares') THEN
        ALTER TABLE operadores DROP COLUMN familiares;
        RAISE NOTICE 'Campo familiares eliminado';
    END IF;
END $$;

-- Agregar restricciones de validación
ALTER TABLE operadores 
ADD CONSTRAINT IF NOT EXISTS chk_tipo_sangre 
CHECK (tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') OR tipo_sangre IS NULL);

ALTER TABLE operadores 
ADD CONSTRAINT IF NOT EXISTS chk_curp_length 
CHECK (LENGTH(curp) = 18 OR curp IS NULL);

ALTER TABLE operadores 
ADD CONSTRAINT IF NOT EXISTS chk_rfc_length 
CHECK (LENGTH(rfc) BETWEEN 10 AND 13 OR rfc IS NULL);

ALTER TABLE operadores 
ADD CONSTRAINT IF NOT EXISTS chk_nss_length 
CHECK (LENGTH(nss) = 11 OR nss IS NULL);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_operadores_curp ON operadores(curp);
CREATE INDEX IF NOT EXISTS idx_operadores_rfc ON operadores(rfc);
CREATE INDEX IF NOT EXISTS idx_operadores_nss ON operadores(nss);
CREATE INDEX IF NOT EXISTS idx_operadores_fecha_vencimiento_licencia ON operadores(fecha_vencimiento_licencia);
CREATE INDEX IF NOT EXISTS idx_operadores_fecha_vencimiento_apto_medico ON operadores(fecha_vencimiento_apto_medico);
CREATE INDEX IF NOT EXISTS idx_operadores_estado ON operadores(estado);

-- Agregar comentarios descriptivos
COMMENT ON COLUMN operadores.fecha_vencimiento_apto_medico IS 'Fecha de vencimiento del certificado médico';
COMMENT ON COLUMN operadores.tipo_sangre IS 'Tipo de sangre del operador (A+, A-, B+, B-, AB+, AB-, O+, O-)';
COMMENT ON COLUMN operadores.direccion IS 'Dirección completa del operador';
COMMENT ON COLUMN operadores.fecha_nacimiento IS 'Fecha de nacimiento del operador';
COMMENT ON COLUMN operadores.curp IS 'Clave Única de Registro de Población (18 caracteres)';
COMMENT ON COLUMN operadores.rfc IS 'Registro Federal de Contribuyentes';
COMMENT ON COLUMN operadores.nss IS 'Número de Seguridad Social (11 dígitos)';
COMMENT ON COLUMN operadores.telefono_emergencia IS 'Teléfono de contacto de emergencia principal';
COMMENT ON COLUMN operadores.contactos_emergencia IS 'JSON con hasta 5 contactos de emergencia (nombre, telefono, email, direccion)';
COMMENT ON COLUMN operadores.documentos IS 'JSON con información de documentos subidos';
COMMENT ON COLUMN operadores.observaciones IS 'Observaciones y notas adicionales sobre el operador';

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_operadores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_operadores_updated_at ON operadores;
CREATE TRIGGER trigger_update_operadores_updated_at
    BEFORE UPDATE ON operadores
    FOR EACH ROW
    EXECUTE FUNCTION update_operadores_updated_at();

-- Validación JSON para contactos de emergencia
CREATE OR REPLACE FUNCTION validate_contactos_emergencia_json()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar JSON de contactos_emergencia
    IF NEW.contactos_emergencia IS NOT NULL THEN
        BEGIN
            -- Verificar que es JSON válido
            PERFORM json_array_elements(NEW.contactos_emergencia::json);
            
            -- Verificar que no exceda 5 contactos
            IF json_array_length(NEW.contactos_emergencia::json) > 5 THEN
                RAISE EXCEPTION 'No se pueden tener más de 5 contactos de emergencia';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'El campo contactos_emergencia debe contener JSON válido con máximo 5 contactos';
        END;
    END IF;
    
    -- Validar JSON de documentos
    IF NEW.documentos IS NOT NULL THEN
        BEGIN
            PERFORM json_array_elements(NEW.documentos::json);
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'El campo documentos debe contener JSON válido';
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_contactos_emergencia_json ON operadores;
CREATE TRIGGER trigger_validate_contactos_emergencia_json
    BEFORE INSERT OR UPDATE ON operadores
    FOR EACH ROW
    EXECUTE FUNCTION validate_contactos_emergencia_json();

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=== SCRIPT EJECUTADO EXITOSAMENTE ===';
    RAISE NOTICE 'Tabla operadores actualizada con los campos necesarios:';
    RAISE NOTICE '- Campos básicos: nombre, apellidos, telefono, email, licencia, fechas de vencimiento';
    RAISE NOTICE '- Campos personales: direccion, fecha_nacimiento, curp, rfc, nss, telefono_emergencia';
    RAISE NOTICE '- Contactos de emergencia: JSON con hasta 5 contactos (nombre, telefono, email, direccion)';
    RAISE NOTICE '- Documentos: JSON para almacenar información de documentos';
    RAISE NOTICE '- Observaciones: Campo de texto para notas adicionales';
    RAISE NOTICE '- Campos laborales y familiares eliminados según requerimientos';
    RAISE NOTICE '- Validaciones, índices y triggers creados correctamente';
    RAISE NOTICE '=======================================';
END $$;
