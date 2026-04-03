"""add_workflow_fields_to_trainings

Revision ID: 15829d8c66b2
Revises: 43ad6768d55a
Create Date: 2026-03-31 19:36:36.227364

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '15829d8c66b2'
down_revision = '43ad6768d55a'
branch_labels = None
depends_on = None


def upgrade():
    # Add new workflow columns
    op.add_column('trainings', sa.Column('target_audience', sa.String(length=255), nullable=True))
    op.add_column('trainings', sa.Column('delivery_type', sa.String(length=50), server_default='self-paced', nullable=False))
    op.add_column('trainings', sa.Column('start_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('trainings', sa.Column('end_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('trainings', sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('trainings', sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('trainings', sa.Column('approved_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add foreign key for approved_by
    op.create_foreign_key(
        'fk_trainings_approved_by',
        'trainings', 'users',
        ['approved_by_id'], ['id']
    )


def downgrade():
    op.drop_constraint('fk_trainings_approved_by', 'trainings', type_='foreignkey')
    op.drop_column('trainings', 'approved_by_id')
    op.drop_column('trainings', 'approved_at')
    op.drop_column('trainings', 'submitted_at')
    op.drop_column('trainings', 'end_date')
    op.drop_column('trainings', 'start_date')
    op.drop_column('trainings', 'delivery_type')
    op.drop_column('trainings', 'target_audience')
