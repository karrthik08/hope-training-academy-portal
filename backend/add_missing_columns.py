import asyncio
from app.db.session import get_db
from sqlalchemy import text

async def add_columns():
    async for session in get_db():
        try:
            print("📋 Adding missing columns to trainings table...")
            
            # Add certificate_template column
            await session.execute(text("""
                ALTER TABLE trainings 
                ADD COLUMN IF NOT EXISTS certificate_template VARCHAR(50)
            """))
            
            # Add duration_hours column
            await session.execute(text("""
                ALTER TABLE trainings 
                ADD COLUMN IF NOT EXISTS duration_hours INTEGER
            """))
            
            # Add is_published column (for backwards compatibility)
            await session.execute(text("""
                ALTER TABLE trainings 
                ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true
            """))
            
            await session.commit()
            print("✅ Columns added successfully!")
            
            # Create onboarding tables
            print("\n📋 Creating onboarding tables...")
            
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS onboarding_progress (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL REFERENCES users(id),
                    training_id UUID NOT NULL REFERENCES trainings(id),
                    proof_link VARCHAR(500),
                    initials VARCHAR(10),
                    submitted_at TIMESTAMP WITH TIME ZONE,
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user_id, training_id)
                )
            """))
            
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS onboarding_submissions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL REFERENCES users(id),
                    submitted_at TIMESTAMP WITH TIME ZONE,
                    reviewed_at TIMESTAMP WITH TIME ZONE,
                    reviewed_by UUID REFERENCES users(id),
                    status VARCHAR(50) DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
            await session.commit()
            print("✅ Onboarding tables created successfully!")
            
            print("\n🎉 All database updates complete!")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await session.close()

asyncio.run(add_columns())
