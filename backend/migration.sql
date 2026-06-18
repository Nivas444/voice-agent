-- Migration to add required columns to the appointments table for AI Receptionist production features

-- 1. Add status column if not already present
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'confirmed';

-- 2. Add calendar_event_id column if not already present
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);

-- 3. Add cancelled_at timestamp column if not already present
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
