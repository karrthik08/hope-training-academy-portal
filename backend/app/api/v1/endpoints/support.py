from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.email_service import notify_support_request
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class SupportRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

@router.post("/submit")
async def submit_support_request(request: SupportRequest):
    try:
        # Send email notification
        await notify_support_request(
            name=request.name,
            email=request.email,
            subject=request.subject,
            message=request.message
        )
        
        return {"message": "Support request submitted successfully"}
    except Exception as e:
        logger.error(f"Failed to submit support request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send support request")