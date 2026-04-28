"""add_instructor_name_and_email_to_trainings

Revision ID: 2555b2dfaf28
Revises: 
Create Date: 2026-04-27

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2555b2dfaf28'
down_revision = 'bb66b66ff93c'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('trainings', sa.Column('instructor_name', sa.String(), nullable=True))
    op.add_column('trainings', sa.Column('instructor_email', sa.String(), nullable=True))

def downgrade():
    op.drop_column('trainings', 'instructor_email')
    op.drop_column('trainings', 'instructor_name')
