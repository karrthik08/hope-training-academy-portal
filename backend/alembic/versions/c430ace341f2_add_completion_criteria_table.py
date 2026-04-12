"""add_completion_criteria_table

Revision ID: c430ace341f2
Revises: 9c8185e2d1f9
Create Date: 2026-04-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c430ace341f2'
down_revision = '9c8185e2d1f9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('completion_criteria',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('training_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('require_all_modules', sa.Boolean(), server_default='true', nullable=True),
    sa.Column('require_assessment_pass', sa.Boolean(), server_default='false', nullable=True),
    sa.Column('required_assessment_score', sa.String(length=10), server_default='80', nullable=True),
    sa.Column('require_attendance', sa.Boolean(), server_default='false', nullable=True),
    sa.Column('required_attendance_percentage', sa.String(length=10), server_default='80', nullable=True),
    sa.Column('auto_complete_enabled', sa.Boolean(), server_default='true', nullable=True),
    sa.Column('additional_criteria', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['training_id'], ['trainings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('training_id')
    )


def downgrade():
    op.drop_table('completion_criteria')
