from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.training import Training
from app.core.config import settings
import stripe
from pydantic import BaseModel

router = APIRouter()

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutRequest(BaseModel):
    training_id: str

class CheckoutResponse(BaseModel):
    checkout_url: str

@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe checkout session for a training enrollment"""
    
    # Get the training
    from sqlalchemy import select
    result = await db.execute(select(Training).where(Training.id == request.training_id))
    training = result.scalar_one_or_none()
    
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    if training.status != "published":
        raise HTTPException(status_code=400, detail="Training is not published")
    
    # Get price
    price = float(training.price or 0)
    
    if price <= 0:
        raise HTTPException(status_code=400, detail="This training is free - no payment required")
    
    # Create Stripe checkout session
    try:
        # Convert price to cents (Stripe uses smallest currency unit)
        amount_cents = int(price * 100)
        
        frontend_url = "https://hope-frontend-qm4p.onrender.com"
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': amount_cents,
                    'product_data': {
                        'name': training.title,
                        'description': training.description or 'HOPE Training Academy Course',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&training_id={training.id}",
            cancel_url=f"{frontend_url}/dashboard",
            client_reference_id=f"{current_user.id}|{training.id}",
            customer_email=current_user.email,
        )
        
        return CheckoutResponse(checkout_url=checkout_session.url)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@router.get("/verify-payment/{session_id}")
async def verify_payment(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """Verify a Stripe payment session"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        return {
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "customer_email": session.customer_email,
            "client_reference_id": session.client_reference_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")

@router.post("/enroll-after-payment")
async def enroll_after_payment(
    request: CreateCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Enroll user after successful payment (bypasses self-enrollment check)"""
    from sqlalchemy import select
    from app.models.training import Training, Enrollment, EnrollmentStatus
    from app.services.email_service import notify_training_enrollment
    
    # Get the training
    result = await db.execute(select(Training).where(Training.id == request.training_id))
    training = result.scalar_one_or_none()
    
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    # Check if already enrolled
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.training_id == training.id
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Already enrolled"}
    
    # Create enrollment
    new_enrollment = Enrollment(
        user_id=current_user.id,
        training_id=training.id,
        enrollment_status=EnrollmentStatus.enrolled
    )
    db.add(new_enrollment)
    await db.commit()
    await db.refresh(new_enrollment)
    
    # Send notification email
    try:
        await notify_training_enrollment(
            user_email=current_user.email,
            user_name=current_user.full_name,
            training_title=training.title,
            instructor_email=training.instructor_email
        )
    except Exception as e:
        print(f"Failed to send enrollment email: {e}")
    
    return {"message": "Enrolled successfully", "enrollment_id": str(new_enrollment.id)}