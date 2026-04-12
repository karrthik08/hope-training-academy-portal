"""Add dropbox_url to trainings

Revision ID: bb66b66ff93c
Revises: 25fb3f452bf0
Create Date: 2026-04-08 19:53:23.295108

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'bb66b66ff93c'
down_revision = '25fb3f452bf0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add dropbox_url column to trainings table
    op.add_column('trainings', sa.Column('dropbox_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    # Remove dropbox_url column from trainings table
    op.drop_column('trainings', 'dropbox_url')