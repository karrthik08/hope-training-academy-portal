"""add_course_content_table

Revision ID: c23e2f06bf9b
Revises: 
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c23e2f06bf9b'
down_revision = "43ad6768d55a"  # We'll fix this
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('course_content',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('training_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=50), nullable=False),
        sa.Column('content_value', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['training_id'], ['trainings.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_course_content_training_id'), 'course_content', ['training_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_course_content_training_id'), table_name='course_content')
    op.drop_table('course_content')
