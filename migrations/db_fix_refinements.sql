-- Script para asegurar que la tabla refinements tenga la estructura correcta
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS refinements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES test_scenarios(id),
  refined_report_id UUID REFERENCES test_scenarios(id),
  refinement_type TEXT,
  changes_summary TEXT,
  user_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que las columnas existan (idempotente)
DO $$
BEGIN
    -- report_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refinements' AND column_name = 'report_id') THEN
        ALTER TABLE refinements ADD COLUMN report_id UUID REFERENCES test_scenarios(id);
    END IF;

    -- refined_report_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refinements' AND column_name = 'refined_report_id') THEN
        ALTER TABLE refinements ADD COLUMN refined_report_id UUID REFERENCES test_scenarios(id);
    END IF;

    -- refinement_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refinements' AND column_name = 'refinement_type') THEN
        ALTER TABLE refinements ADD COLUMN refinement_type TEXT;
    END IF;

    -- changes_summary
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refinements' AND column_name = 'changes_summary') THEN
        ALTER TABLE refinements ADD COLUMN changes_summary TEXT;
    END IF;

    -- user_context
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refinements' AND column_name = 'user_context') THEN
        ALTER TABLE refinements ADD COLUMN user_context TEXT;
    END IF;
END $$;
