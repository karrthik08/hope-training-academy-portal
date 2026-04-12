import psycopg2

DATABASE_URL = "postgresql://hope_database_6709_user:D3rS3wG5zGAm5SFLoZWkpA843UXAL576@dpg-d737tfndiees73b10img-a.oregon-postgres.render.com/hope_database_6709"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Check columns in content_progress
cur.execute("""
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'content_progress'
ORDER BY ordinal_position;
""")

print("✅ content_progress table columns:")
for row in cur.fetchall():
    print(f"  - {row[0]} ({row[1]}) - Nullable: {row[2]}")

cur.close()
conn.close()
