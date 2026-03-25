import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.user import User, Role, UserRole
from app.models.training import Training, TrainingStatus
from app.core.security import hash_password

async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        roles_data = ["Admin", "Instructor", "Participant"]
        roles = {}
        for i, name in enumerate(roles_data, start=1):
            role = Role(id=i, name=name)
            db.add(role)
            roles[name] = role
        await db.flush()

        users_data = [
            ("Admin User", "admin@hope.local", "Admin1234!", "Admin"),
            ("Instructor", "instructor@hope.local", "Instructor1!", "Instructor"),
            ("Participant", "participant@hope.local", "Participant1!", "Participant"),
        ]
        created_users = {}
        for full_name, email, pw, role_name in users_data:
            user = User(full_name=full_name, email=email, password_hash=hash_password(pw))
            db.add(user)
            await db.flush()
            db.add(UserRole(user_id=user.id, role_id=roles[role_name].id))
            created_users[role_name] = user

        await db.flush()
        instructor = created_users["Instructor"]
        trainings = [
            Training(title="Introduction to Safety Protocols", description="Covers essential workplace safety practices.", status=TrainingStatus.published, created_by=instructor.id),
            Training(title="Leadership & Communication Skills", description="Develop leadership and communication strategies.", status=TrainingStatus.approved, created_by=instructor.id),
        ]
        for t in trainings:
            db.add(t)

        await db.commit()
        print(" Seed complete!")
        print("  admin@hope.local       / Admin1234!")
        print("  instructor@hope.local  / Instructor1!")
        print("  participant@hope.local / Participant1!")

asyncio.run(seed())