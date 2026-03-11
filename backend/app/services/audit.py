import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.training import AuditLog

async def log_action(db: AsyncSession, actor_id: uuid.UUID, action: str, entity_type: str, entity_id: str):
    entry = AuditLog(
        actor_user_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
    )
    db.add(entry)
    await db.flush()