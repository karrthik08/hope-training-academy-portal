"""add_progress_tracking_tables

Revision ID: 9c8185e2d1f9
Revises: faba6a76a57e
Create Date: 2026-04-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9c8185e2d1f9'
down_revision = 'faba6a76a57e'
branch_labels = None
depends_on = None


def upgrade():
    # Create module_progress table
    op.create_table('module_progress',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('enrollment_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('module_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('status', sa.Enum('not_started', 'in_progress', 'completed', name='progressstatus'), nullable=False, server_default='not_started'),
    sa.Column('completion_percentage', sa.Integer(), server_default='0', nullable=True),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['enrollment_id'], ['enrollments.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create lesson_progress table
    op.create_table('lesson_progress',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('enrollment_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('lesson_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('status', sa.Enum('not_started', 'in_progress', 'completed', name='progressstatus'), nullable=False, server_default='not_started'),
    sa.Column('time_spent', sa.Integer(), server_default='0', nullable=True),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('last_accessed', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['enrollment_id'], ['enrollments.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('lesson_progress')
    op.drop_table('module_progress')
    op.execute('DROP TYPE progressstatus')
