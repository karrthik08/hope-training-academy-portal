"""merge_heads

Revision ID: ecd6f28d78bf
Revises: 15829d8c66b2, c23e2f06bf9b
Create Date: 2026-04-07 19:27:03.511524

"""
from alembic import op
import sqlalchemy as sa


revision = 'ecd6f28d78bf'
down_revision = ('15829d8c66b2', 'c23e2f06bf9b')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
