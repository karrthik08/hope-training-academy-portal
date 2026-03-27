import asyncio
from app.db.session import get_db
from sqlalchemy import text

async def update_templates():
    async for session in get_db():
        try:
            print("📋 Updating trainings with certificate templates...")
            
            # CORPORATE template for Peer Recovery (198 trainings)
            await session.execute(text("""
                UPDATE trainings 
                SET certificate_template = 'CORPORATE',
                    duration_hours = 3,
                    is_published = true
                WHERE category = 'Peer Recovery & Coaching'
            """))
            
            # OOH template for Prevention & Youth (19), Family (5), Mental Health (4)
            await session.execute(text("""
                UPDATE trainings 
                SET certificate_template = 'OOH',
                    duration_hours = 2,
                    is_published = true
                WHERE category IN (
                    'Prevention & Youth Education',
                    'Family & Community Support',
                    'Mental Health & Wellness'
                )
            """))
            
            # PPW template for Harm Reduction (16), Train-the-Trainer (8)
            await session.execute(text("""
                UPDATE trainings 
                SET certificate_template = 'PPW',
                    duration_hours = 4,
                    is_published = true
                WHERE category IN (
                    'Harm Reduction & Public Health Safety',
                    'Train-the-Trainer'
                )
            """))
            
            # CORPORATE for remaining categories
            await session.execute(text("""
                UPDATE trainings 
                SET certificate_template = 'CORPORATE',
                    duration_hours = 2,
                    is_published = true
                WHERE category IN (
                    'Workforce Development',
                    'Safety & Compliance',
                    'Ethics & Professional Practice'
                )
            """))
            
            await session.commit()
            
            # Count by template
            result = await session.execute(text("""
                SELECT certificate_template, COUNT(*) 
                FROM trainings 
                GROUP BY certificate_template
                ORDER BY COUNT(*) DESC
            """))
            
            print("\n✅ Certificate templates assigned:")
            total = 0
            for row in result.fetchall():
                template = row[0] if row[0] else "None"
                count = row[1]
                total += count
                print(f"   {template}: {count} trainings")
            print(f"\n   TOTAL: {total} trainings")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
        finally:
            await session.close()

asyncio.run(update_templates())
