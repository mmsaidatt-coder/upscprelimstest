-- ============================================================
-- PYQ Database Enrichment Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS sub_topic TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS question_type TEXT,
  ADD COLUMN IF NOT EXISTS concepts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty_rationale TEXT,
  ADD COLUMN IF NOT EXISTS importance TEXT,
  ADD COLUMN IF NOT EXISTS ncert_class TEXT,
  ADD COLUMN IF NOT EXISTS mnemonic_hint TEXT;

-- GIN indexes for fast keyword/concept searches
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions (topic) WHERE topic IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_importance ON questions (importance) WHERE importance IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions (question_type) WHERE question_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_keywords ON questions USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_questions_concepts ON questions USING GIN (concepts);
