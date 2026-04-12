"""
Database migration for Assessment System
Creates tables: assessments, questions, question_options, participant_responses
"""

import psycopg2
from psycopg2 import sql

# Database connection string
DATABASE_URL = "postgresql://hope_database_6709_user:D3rS3wG5zGAm5SFLoZWkpA843UXAL576@dpg-d737tfndiees73b10img-a.oregon-postgres.render.com/hope_database_6709"

def create_assessment_tables():
    """Create all assessment-related tables"""
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # 1. ASSESSMENTS TABLE
        print("Creating assessments table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('pre_test', 'post_test', 'quiz', 'knowledge_check', 'assignment')),
                time_limit_minutes INTEGER,
                passing_score INTEGER DEFAULT 70,
                max_attempts INTEGER DEFAULT 3,
                randomize_questions BOOLEAN DEFAULT FALSE,
                show_correct_answers BOOLEAN DEFAULT TRUE,
                is_required BOOLEAN DEFAULT FALSE,
                available_from TIMESTAMP,
                available_until TIMESTAMP,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by UUID REFERENCES users(id)
            );
        """)
        print("✅ Assessments table created")
        
        # 2. QUESTIONS TABLE
        print("Creating questions table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
                question_text TEXT NOT NULL,
                question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching')),
                points INTEGER DEFAULT 1,
                order_index INTEGER DEFAULT 0,
                correct_answer TEXT,
                explanation TEXT,
                is_required BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✅ Questions table created")
        
        # 3. QUESTION OPTIONS TABLE (for multiple choice)
        print("Creating question_options table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS question_options (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
                option_text TEXT NOT NULL,
                is_correct BOOLEAN DEFAULT FALSE,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✅ Question options table created")
        
        # 4. PARTICIPANT RESPONSES TABLE
        print("Creating participant_responses table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS participant_responses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
                question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
                response_text TEXT,
                selected_option_id UUID REFERENCES question_options(id),
                is_correct BOOLEAN,
                points_earned INTEGER DEFAULT 0,
                attempt_number INTEGER DEFAULT 1,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                graded_at TIMESTAMP,
                graded_by UUID REFERENCES users(id),
                feedback TEXT,
                UNIQUE(question_id, user_id, attempt_number)
            );
        """)
        print("✅ Participant responses table created")
        
        # 5. ASSESSMENT ATTEMPTS TABLE (tracks overall attempts)
        print("Creating assessment_attempts table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS assessment_attempts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
                attempt_number INTEGER NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP,
                score DECIMAL(5,2),
                total_points INTEGER,
                points_earned INTEGER,
                passed BOOLEAN,
                time_spent_seconds INTEGER,
                UNIQUE(assessment_id, user_id, attempt_number)
            );
        """)
        print("✅ Assessment attempts table created")
        
        # Create indexes for better query performance
        print("Creating indexes...")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_assessments_training ON assessments(training_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_questions_assessment ON questions(assessment_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_responses_assessment ON participant_responses(assessment_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_responses_user ON participant_responses(user_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON assessment_attempts(assessment_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_attempts_user ON assessment_attempts(user_id);")
        print("✅ Indexes created")
        
        conn.commit()
        print("\n🎉 All assessment tables created successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error creating tables: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print("Starting assessment tables creation...")
    print("=" * 60)
    create_assessment_tables()
    print("=" * 60)
    print("✅ Migration complete!")
