from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class SupportRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

@router.post("/submit")
async def submit_support_request(request: SupportRequest):
    """
    Submit a support request via email to oohtraining@organizationofhope.org
    """
    try:
        # Import here to avoid circular imports
        from app.services.email_service import email_service
        
        # Prepare form data
        form_data = {
            "name": request.name,
            "email": request.email,
            "subject": request.subject,
            "message": request.message
        }
        
        logger.info(f"📧 Processing support request from {request.email} - Subject: {request.subject}")
        
        # Send email
        success = email_service.send_support_request(form_data)
        
        if not success:
            logger.error(f"❌ Failed to send support email for {request.email}")
            raise HTTPException(
                status_code=500,
                detail="Failed to send support request. Please try again or contact us directly at oohtraining@organizationofhope.org"
            )
        
        logger.info(f"✅ Support request sent successfully from {request.email}")
        
        return {
            "success": True,
            "message": "Your support request has been sent successfully. Our team will contact you shortly at the email you provided."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing support request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request. Please contact us directly at oohtraining@organizationofhope.org"
        )