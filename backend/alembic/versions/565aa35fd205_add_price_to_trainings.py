"""add_price_to_trainings

Revision ID: 565aa35fd205
Revises: 33c6c6c6f51c
Create Date: 2026-04-28

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '565aa35fd205'
down_revision = '33c6c6c6f51c'
branch_labels = None
depends_on = None

def upgrade():
    # Add price column (decimal with 2 decimal places, default 0.00 for free)
    op.add_column('trainings', sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0.00'))

def downgrade():
    # Remove price column
    op.drop_column('trainings', 'price')