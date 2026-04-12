import psycopg2
import os

DATABASE_URL = "postgresql://hope_database_6709_user:D3rS3wG5zGAm5SFLoZWkpA843UXAL576@dpg-d737tfndiees73b10img-a.oregon-postgres.render.com/hope_database_6709"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Make content_id nullable in content_progress so we can add content_item_id
cur.execute("""
ALTER TABLE content_progress 
ALTER COLUMN content_id DROP NOT NULL;
""")

# Add content_item_id column (references content_items table)
cur.execute("""
ALTER TABLE content_progress
ADD COLUMN IF NOT EXISTS content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE;
""")

# Add constraint: either content_id OR content_item_id must be set
cur.execute("""
ALTER TABLE content_progress
ADD CONSTRAINT check_content_reference 
CHECK (
  (content_id IS NOT NULL AND content_item_id IS NULL) OR 
  (content_id IS NULL AND content_item_id IS NOT NULL)
);
""")

conn.commit()
cur.close()
conn.close()

print("✅ content_progress table updated to support content_items!")
