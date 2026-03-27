import asyncio
from app.db.session import get_db
from sqlalchemy import text

async def update_templates():
    async for session in get_db():
        try:
            print("📋 Updating trainings with certificate templates...")
            
            # Sample mapping - you can adjust these
            # OOH template for categories: Orientation, Clinical Skills
            await session.execute(text("""
                UPDATE trainings 
                SET certificate_template = 'OOH',
                    duration_hours = 2,
                    is_published = true
                WHERE category IN ('Orientation', 'Clinical Skills')
            """))
            
            # PPW template for Compliance
            await session.execute(text("""
                UPDATE trainings 
                SET certificate_template = 'PPW',
                    duration_hours = 3,
                    is_published = true
                WHERE category = 'Compliance'
            """))
            
            # CORPORATE template for Professional Development
            await session.execute(text("""
                UPDATE trainings 
                SET certificate_template = 'CORPORATE',
                    duration_hours = 4,
                    is_published = true
                WHERE category = 'Professional Development'
            """))
            
            # None for General or others
            await session.execute(text("""
                UPDATE trainings 
                SET certificate_template = NULL,
                    duration_hours = 1,
                    is_published = true
                WHERE category NOT IN ('Orientation', 'Clinical Skills', 'Compliance', 'Professional Development')
            """))
            
            await session.commit()
            
            # Count by template
            result = await session.execute(text("""
                SELECT certificate_template, COUNT(*) 
                FROM trainings 
                GROUP BY certificate_template
            """))
            
            print("\n✅ Certificate templates assigned:")
            for row in result.fetchall():
                template = row[0] if row[0] else "None"
                count = row[1]
                print(f"   {template}: {count} trainings")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
        finally:
            await session.close()

asyncio.run(update_templates())
