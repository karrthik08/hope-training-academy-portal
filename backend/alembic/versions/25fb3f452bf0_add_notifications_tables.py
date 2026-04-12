"""add_notifications_tables

Revision ID: 25fb3f452bf0
Revises: c430ace341f2
Create Date: 2026-04-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '25fb3f452bf0'
down_revision = 'c430ace341f2'
branch_labels = None
depends_on = None


def upgrade():
    # Create notifications table
    op.create_table('notifications',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('notification_type', sa.String(length=50), nullable=False),
    sa.Column('is_read', sa.Boolean(), server_default='false', nullable=True),
    sa.Column('is_sent_email', sa.Boolean(), server_default='false', nullable=True),
    sa.Column('related_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Create notification_preferences table
    op.create_table('notification_preferences',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('email_on_enrollment', sa.Boolean(), server_default='true', nullable=True),
    sa.Column('email_on_completion', sa.Boolean(), server_default='true', nullable=True),
    sa.Column('email_on_reminder', sa.Boolean(), server_default='true', nullable=True),
    sa.Column('inapp_on_enrollment', sa.Boolean(), server_default='true', nullable=True),
    sa.Column('inapp_on_completion', sa.Boolean(), server_default='true', nullable=True),
    sa.Column('inapp_on_reminder', sa.Boolean(), server_default='true', nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )


def downgrade():
    op.drop_table('notification_preferences')
    op.drop_table('notifications')
