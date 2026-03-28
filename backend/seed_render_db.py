import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from passlib.context import CryptContext
import os
from dotenv import load_load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def create_tables():
    """Create all tables"""
    async with engine.begin() as conn:
        # Drop and recreate all tables
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        
    # Import models to create tables
    from app.models.user import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Tables created!")

async def seed_data():
    """Seed roles, users, and trainings"""
    async with async_session() as session:
        # Create roles
        await session.execute(text("""
            INSERT INTO roles (name, description) VALUES 
            ('Admin', 'Administrator role'),
            ('Instructor', 'Instructor role'),
            ('Participant', 'Participant role')
            ON CONFLICT DO NOTHING
        """))
        
        # Get role IDs
        admin_role = await session.execute(text("SELECT id FROM roles WHERE name = 'Admin'"))
        instructor_role = await session.execute(text("SELECT id FROM roles WHERE name = 'Instructor'"))
        participant_role = await session.execute(text("SELECT id FROM roles WHERE name = 'Participant'"))
        
        admin_id = admin_role.scalar()
        instructor_id = instructor_role.scalar()
        participant_id = participant_role.scalar()
        
        # Create users
        admin_hash = pwd_context.hash("Admin@Hope123")
        instructor_hash = pwd_context.hash("Instructor@123")
        participant_hash = pwd_context.hash("Participant@123")
        
        await session.execute(text("""
            INSERT INTO users (email, hashed_password, full_name, is_active) VALUES
            ('admin@hope.local', :admin_pass, 'Admin User', true),
            ('instructor@hope.local', :instructor_pass, 'Instructor User', true),
            ('participant@hope.local', :participant_pass, 'Participant User', true)
            ON CONFLICT DO NOTHING
        """), {"admin_pass": admin_hash, "instructor_pass": instructor_hash, "participant_pass": participant_hash})
        
        # Get user IDs and assign roles
        admin_user = await session.execute(text("SELECT id FROM users WHERE email = 'admin@hope.local'"))
        instructor_user = await session.execute(text("SELECT id FROM users WHERE email = 'instructor@hope.local'"))
        participant_user = await session.execute(text("SELECT id FROM users WHERE email = 'participant@hope.local'"))
        
        await session.execute(text("""
            INSERT INTO user_roles (user_id, role_id) VALUES
            (:admin_user_id, :admin_role_id),
            (:instructor_user_id, :instructor_role_id),
            (:participant_user_id, :participant_role_id)
            ON CONFLICT DO NOTHING
        """), {
            "admin_user_id": admin_user.scalar(),
            "admin_role_id": admin_id,
            "instructor_user_id": instructor_user.scalar(),
            "instructor_role_id": instructor_id,
            "participant_user_id": participant_user.scalar(),
            "participant_role_id": participant_id
        })
        
        await session.commit()
        print("✅ Users and roles created!")

async def main():
    await create_tables()
    await seed_data()
    print("🎉 Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(main())
