-- Run this in your backend terminal to create onboarding tables
-- cd ~/Desktop/hope-training-academy-portal/backend
-- source /Users/karrthikburugupally/Desktop/hope-portal/backend/.venv/bin/activate
-- python3 create_onboarding_tables.py

import asyncio, sys, os
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('.env')
from app.db.session import get_db
from sqlalchemy import text

async def run():
    async for db in get_db():
        # Create onboarding_progress table
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS onboarding_progress (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                training_id INTEGER NOT NULL,
                dropbox_link TEXT,
                initials VARCHAR(20),
                notes TEXT,
                is_completed BOOLEAN DEFAULT FALSE,
                date_completed TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, training_id)
            )
        """))

        # Create onboarding_submissions table
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS onboarding_submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                signature VARCHAR(200),
                status VARCHAR(50) DEFAULT 'pending',
                submitted_at TIMESTAMPTZ,
                reviewed_at TIMESTAMPTZ,
                reviewer_id UUID REFERENCES users(id),
                reviewer_notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))

        await db.commit()
        print("✅ Tables created: onboarding_progress, onboarding_submissions")
        break

asyncio.run(run())