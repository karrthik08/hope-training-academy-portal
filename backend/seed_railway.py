"""
Seed Railway Database with Training Data
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import get_db
from sqlalchemy import text
import uuid
from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc)

# Sample training data matching your actual schema
SAMPLE_TRAININGS = [
    {
        "title": "Introduction to Hope Services",
        "description": "Learn about the core services offered by Organization of Hope",
        "category": "Orientation",
        "status": "published"
    },
    {
        "title": "Client Communication Best Practices",
        "description": "Effective communication strategies for working with clients",
        "category": "Professional Development",
        "status": "published"
    },
    {
        "title": "Crisis Intervention Basics",
        "description": "Essential skills for handling crisis situations",
        "category": "Clinical Skills",
        "status": "published"
    },
    {
        "title": "Documentation and Recordkeeping",
        "description": "Proper documentation practices and legal requirements",
        "category": "Compliance",
        "status": "published"
    },
    {
        "title": "Trauma-Informed Care",
        "description": "Understanding and implementing trauma-informed approaches",
        "category": "Clinical Skills",
        "status": "published"
    },
    {
        "title": "Cultural Competency in Service Delivery",
        "description": "Providing culturally sensitive and appropriate services",
        "category": "Professional Development",
        "status": "published"
    },
    {
        "title": "Boundaries and Ethics",
        "description": "Maintaining professional boundaries and ethical standards",
        "category": "Compliance",
        "status": "published"
    },
    {
        "title": "Case Management Fundamentals",
        "description": "Core principles of effective case management",
        "category": "Professional Development",
        "status": "published"
    },
    {
        "title": "Self-Care for Service Providers",
        "description": "Preventing burnout and maintaining wellness",
        "category": "Professional Development",
        "status": "published"
    },
    {
        "title": "Safety and Risk Assessment",
        "description": "Identifying and managing safety risks",
        "category": "Clinical Skills",
        "status": "published"
    }
]

async def get_admin_user_id(session):
    """Get an existing user ID to use as created_by"""
    result = await session.execute(
        text("SELECT id FROM users LIMIT 1")
    )
    user = result.first()
    if user:
        return str(user[0])
    else:
        print("\n⚠️  No users found in database!")
        print("Creating a system user for trainings...")
        
        # Create a system user with password hash
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        system_id = str(uuid.uuid4())
        password_hash = pwd_context.hash("System@123")
        
        await session.execute(
            text("""
                INSERT INTO users (id, email, full_name, password_hash, status, created_at, updated_at)
                VALUES (:id, :email, :full_name, :password_hash, :status, :created_at, :updated_at)
            """),
            {
                "id": system_id,
                "email": "system@hope.local",
                "full_name": "System",
                "password_hash": password_hash,
                "status": "active",
                "created_at": utcnow(),
                "updated_at": utcnow()
            }
        )
        await session.commit()
        return system_id

async def seed_trainings():
    print("=" * 60)
    print("SEEDING RAILWAY DATABASE WITH TRAININGS")
    print("=" * 60)
    
    async for session in get_db():
        try:
            result = await session.execute(text("SELECT COUNT(*) FROM trainings"))
            count = result.scalar()
            
            if count > 0:
                print(f"\n⚠️  Database already has {count} trainings")
                response = input("Add more anyway? (yes/no): ")
                if response.lower() not in ['yes', 'y']:
                    print("Aborting")
                    await session.close()
                    return
            
            # Get user ID for created_by
            admin_id = await get_admin_user_id(session)
            print(f"\n📝 Using creator ID: {admin_id}")
            
            print(f"\n📚 Adding {len(SAMPLE_TRAININGS)} trainings...")
            
            inserted = 0
            for training in SAMPLE_TRAININGS:
                training_id = str(uuid.uuid4())
                
                await session.execute(
                    text("""
                        INSERT INTO trainings 
                        (id, title, description, category, status, created_by, created_at, updated_at)
                        VALUES 
                        (:id, :title, :description, :category, :status, :created_by, :created_at, :updated_at)
                    """),
                    {
                        "id": training_id,
                        "title": training["title"],
                        "description": training["description"],
                        "category": training["category"],
                        "status": training["status"],
                        "created_by": admin_id,
                        "created_at": utcnow(),
                        "updated_at": utcnow()
                    }
                )
                inserted += 1
                print(f"  ✓ {training['title']}")
            
            await session.commit()
            
            result = await session.execute(
                text("SELECT COUNT(*) FROM trainings WHERE status = 'published'")
            )
            published_count = result.scalar()
            
            print(f"\n✅ Successfully inserted {inserted} trainings")
            print(f"📊 Total published trainings: {published_count}")
            print("\n🎉 Your trainings are now in Railway database!")
            print("   Restart your frontend to see them appear!")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await session.close()

if __name__ == "__main__":
    print("\n🌱 Starting database seed...")
    asyncio.run(seed_trainings())
    print("\n✅ Seed complete!\n")
