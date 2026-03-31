"""merge_heads

Revision ID: 43ad6768d55a
Revises: 1266562e3ffe, 532e37b2b98d
Create Date: 2026-03-31 19:29:39.890920

"""
from alembic import op
import sqlalchemy as sa


revision = '43ad6768d55a'
down_revision = ('1266562e3ffe', '532e37b2b98d')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
