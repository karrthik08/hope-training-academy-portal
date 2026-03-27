import asyncio
import openpyxl
from app.db.session import get_db
from sqlalchemy import text
import uuid
from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc)

async def import_trainings():
    print("=" * 60)
    print("IMPORTING 246 TRAININGS FROM EXCEL")
    print("=" * 60)
    
    # Load Excel file
    wb = openpyxl.load_workbook('/Users/karrthikburugupally/Desktop/OOH_Available_Training_Enhanced.xlsx')
    sheet = wb.active
    
    async for session in get_db():
        try:
            # Get admin user for created_by
            result = await session.execute(text("SELECT id FROM users WHERE email = 'admin@hope.local'"))
            admin_user = result.first()
            if not admin_user:
                print("❌ Admin user not found!")
                return
            
            admin_id = str(admin_user[0])
            
            # Clear existing trainings
            response = input("\n⚠️  Delete existing trainings and import fresh? (yes/no): ")
            if response.lower() in ['yes', 'y']:
                await session.execute(text("DELETE FROM trainings"))
                await session.commit()
                print("✅ Existing trainings cleared")
            
            print(f"\n📚 Importing trainings...")
            
            inserted = 0
            skipped = 0
            
            for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                # Skip empty rows
                if not row[1]:  # Training Name
                    continue
                
                training_name = str(row[1]).strip() if row[1] else ""
                category = str(row[9]).strip() if row[9] else "General"
                description = str(row[7]).strip() if row[7] else ""
                
                # Skip if no training name
                if not training_name:
                    skipped += 1
                    continue
                
                training_id = str(uuid.uuid4())
                
                try:
                    await session.execute(
                        text("""
                            INSERT INTO trainings 
                            (id, title, description, category, status, created_by, created_at, updated_at)
                            VALUES 
                            (:id, :title, :description, :category, :status, :created_by, :created_at, :updated_at)
                        """),
                        {
                            "id": training_id,
                            "title": training_name[:255],  # Limit to 255 chars
                            "description": description,
                            "category": category[:100] if category else "General",
                            "status": "published",
                            "created_by": admin_id,
                            "created_at": utcnow(),
                            "updated_at": utcnow()
                        }
                    )
                    inserted += 1
                    if inserted % 50 == 0:
                        print(f"  ✓ Imported {inserted} trainings...")
                except Exception as e:
                    print(f"  ⚠️  Row {row_num} failed: {e}")
                    skipped += 1
            
            await session.commit()
            
            # Verify
            result = await session.execute(
                text("SELECT COUNT(*) FROM trainings WHERE status = 'published'")
            )
            total = result.scalar()
            
            print(f"\n✅ Import complete!")
            print(f"   Inserted: {inserted}")
            print(f"   Skipped: {skipped}")
            print(f"   Total published trainings: {total}")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await session.close()

if __name__ == "__main__":
    asyncio.run(import_trainings())
