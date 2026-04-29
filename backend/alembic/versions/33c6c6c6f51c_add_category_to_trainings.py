"""add_category_to_trainings

Revision ID: 33c6c6c6f51c
Revises: 2555b2dfaf28
Create Date: 2026-04-28

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '33c6c6c6f51c'
down_revision = '2555b2dfaf28'
branch_labels = None
depends_on = None

def upgrade():
    # Add category column to trainings table
    op.add_column('trainings', sa.Column('category', sa.String(length=100), nullable=True))

def downgrade():
    # Remove category column
    op.drop_column('trainings', 'category')