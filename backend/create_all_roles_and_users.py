import asyncio
from app.db.session import get_db
from sqlalchemy import text
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup():
    async for session in get_db():
        try:
            # Create roles if they don't exist
            roles_to_create = ['Admin', 'Instructor', 'Participant']
            
            for role_name in roles_to_create:
                result = await session.execute(
                    text("SELECT id FROM roles WHERE name = :name"),
                    {"name": role_name}
                )
                if not result.first():
                    await session.execute(
                        text("INSERT INTO roles (name) VALUES (:name)"),
                        {"name": role_name}
                    )
                    print(f"✅ Created role: {role_name}")
            
            await session.commit()
            
            # Get role IDs
            result = await session.execute(text("SELECT id, name FROM roles"))
            roles = {row[1]: row[0] for row in result.fetchall()}
            
            # Create Instructor user
            result = await session.execute(
                text("SELECT id FROM users WHERE email = 'instructor@hope.local'")
            )
            if not result.first():
                instructor_id = str(uuid.uuid4())
                instructor_hash = pwd_context.hash("Instructor@123")
                
                await session.execute(
                    text("INSERT INTO users (id, email, full_name, password_hash, status, created_at, updated_at) VALUES (:id, :email, :full_name, :password_hash, 'active', NOW(), NOW())"),
                    {"id": instructor_id, "email": "instructor@hope.local", "full_name": "Test Instructor", "password_hash": instructor_hash}
                )
                
                await session.execute(
                    text("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (:user_id, :role_id, NOW())"),
                    {"user_id": instructor_id, "role_id": roles['Instructor']}
                )
                print("✅ Created instructor user")
            
            # Create Participant user
            result = await session.execute(
                text("SELECT id FROM users WHERE email = 'participant@hope.local'")
            )
            if not result.first():
                participant_id = str(uuid.uuid4())
                participant_hash = pwd_context.hash("Participant@123")
                
                await session.execute(
                    text("INSERT INTO users (id, email, full_name, password_hash, status, created_at, updated_at) VALUES (:id, :email, :full_name, :password_hash, 'active', NOW(), NOW())"),
                    {"id": participant_id, "email": "participant@hope.local", "full_name": "Test Participant", "password_hash": participant_hash}
                )
                
                await session.execute(
                    text("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (:user_id, :role_id, NOW())"),
                    {"user_id": participant_id, "role_id": roles['Participant']}
                )
                print("✅ Created participant user")
            
            await session.commit()
            
            print("\n✅ All set up!")
            print("\n📝 LOGIN CREDENTIALS:")
            print("\nADMIN:")
            print("   Email: admin@hope.local")
            print("   Password: Admin@Hope123")
            print("\nINSTRUCTOR:")
            print("   Email: instructor@hope.local")
            print("   Password: Instructor@123")
            print("\nPARTICIPANT:")
            print("   Email: participant@hope.local")
            print("   Password: Participant@123")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await session.close()

asyncio.run(setup())
