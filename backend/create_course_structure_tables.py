import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Fix for psycopg2 - remove +asyncpg
if DATABASE_URL and "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# 1. MODULES table
cur.execute("""
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID REFERENCES trainings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# 2. LESSONS table
cur.execute("""
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# 3. CONTENT_ITEMS table
cur.execute("""
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_url TEXT,
    file_path TEXT,
    file_size INTEGER,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# 4. Add new fields to trainings table
cur.execute("""
ALTER TABLE trainings
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(255),
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS prerequisites TEXT,
ADD COLUMN IF NOT EXISTS learning_objectives TEXT,
ADD COLUMN IF NOT EXISTS agenda TEXT,
ADD COLUMN IF NOT EXISTS disclaimer TEXT,
ADD COLUMN IF NOT EXISTS accessibility_notes TEXT,
ADD COLUMN IF NOT EXISTS language_options VARCHAR(100),
ADD COLUMN IF NOT EXISTS ceu_alignment VARCHAR(255);
""")

# Create indexes for performance
cur.execute("CREATE INDEX IF NOT EXISTS idx_modules_training ON modules(training_id);")
cur.execute("CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);")
cur.execute("CREATE INDEX IF NOT EXISTS idx_content_lesson ON content_items(lesson_id);")

conn.commit()
cur.close()
conn.close()

print("✅ Course structure tables created successfully!")
