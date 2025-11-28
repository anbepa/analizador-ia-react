-- Script de migración para agregar soporte a Historias de Usuario (HU)
-- Ejecuta este script en tu cliente SQL de Supabase o PostgreSQL

-- 1. Crear tabla de Historias de Usuario
CREATE TABLE IF NOT EXISTS user_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- Ej: HU-001, US-105
    title TEXT, -- Título descriptivo de la HU
    description TEXT, -- Descripción detallada (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agregar columna user_story_id a la tabla reports
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS user_story_id UUID REFERENCES user_stories(id) ON DELETE SET NULL;

-- 3. Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_user_stories_code ON user_stories(code);
CREATE INDEX IF NOT EXISTS idx_reports_user_story_id ON reports(user_story_id);

-- 4. Comentarios
COMMENT ON TABLE user_stories IS 'Tabla maestra de Historias de Usuario';
COMMENT ON COLUMN user_stories.code IS 'Código único de la HU (ej: HU-123)';
COMMENT ON COLUMN reports.user_story_id IS 'Referencia a la Historia de Usuario asociada';
