import asyncio
from app.db.session import get_db
from sqlalchemy import text
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_user():
    async for session in get_db():
        try:
            # Check if user exists
            result = await session.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": "admin@hope.local"}
            )
            if result.first():
                print("✅ Admin user already exists!")
                print("   Email: admin@hope.local")
                print("   Password: Admin@Hope123")
                await session.close()
                return
            
            # Create admin user
            admin_id = str(uuid.uuid4())
            password_hash = pwd_context.hash("Admin@Hope123")
            
            await session.execute(
                text("""
                    INSERT INTO users (id, email, full_name, password_hash, status, created_at, updated_at)
                    VALUES (:id, :email, :full_name, :password_hash, :status, NOW(), NOW())
                """),
                {
                    "id": admin_id,
                    "email": "admin@hope.local",
                    "full_name": "System Administrator",
                    "password_hash": password_hash,
                    "status": "active"
                }
            )
            
            # Create role if not exists
            result = await session.execute(
                text("SELECT id FROM roles WHERE name = 'admin'")
            )
            role = result.first()
            
            if not role:
                await session.execute(
                    text("INSERT INTO roles (name) VALUES ('admin')")
                )
                result = await session.execute(
                    text("SELECT id FROM roles WHERE name = 'admin'")
                )
                role = result.first()
            
            # Assign admin role
            await session.execute(
                text("""
                    INSERT INTO user_roles (user_id, role_id, assigned_at)
                    VALUES (:user_id, :role_id, NOW())
                """),
                {"user_id": admin_id, "role_id": role[0]}
            )
            
            await session.commit()
            
            print("✅ Admin user created successfully!")
            print("   Email: admin@hope.local")
            print("   Password: Admin@Hope123")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await session.close()

asyncio.run(create_user())
