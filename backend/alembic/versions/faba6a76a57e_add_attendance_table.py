"""add_attendance_table

Revision ID: faba6a76a57e
Revises: ecd6f28d78bf
Create Date: 2026-04-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'faba6a76a57e'
down_revision = 'ecd6f28d78bf'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('attendance',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('enrollment_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('session_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('status', sa.Enum('present', 'absent', 'excused', name='attendancestatus'), nullable=False, server_default='absent'),
    sa.Column('marked_by', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('marked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('notes', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['enrollment_id'], ['enrollments.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['marked_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('attendance')
    op.execute('DROP TYPE attendancestatus')
