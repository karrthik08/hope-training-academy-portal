from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.api.v1.deps import require_roles, get_current_user
from app.models.assessment import Assessment
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.assessment_attempt import AssessmentAttempt
from app.models.participant_response import ParticipantResponse
from app.models.user import User
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentUpdate,
    AssessmentResponse,
    AssessmentWithAttempts,
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    AssessmentAttemptCreate,
    AssessmentAttemptSubmit,
    AssessmentAttemptResponse,
    ParticipantResponseCreate,
    ParticipantResponseResponse,
    AssessmentResults
)

router = APIRouter()

# ============ ASSESSMENT ENDPOINTS ============

@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    assessment: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Create a new assessment (Instructor/Admin only)"""
    db_assessment = Assessment(
        **assessment.model_dump(),
        created_by=current_user.id
    )
    db.add(db_assessment)
    await db.commit()
    
    # Reload with relationships to avoid greenlet error
    result = await db.execute(
        select(Assessment)
        .where(Assessment.id == db_assessment.id)
        .options(selectinload(Assessment.questions).selectinload(Question.options))
    )
    fresh_assessment = result.scalar_one()
    return fresh_assessment


@router.get("/training/{training_id}", response_model=List[AssessmentResponse])
async def get_assessments_by_training(
    training_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all assessments for a training"""
    result = await db.execute(
        select(Assessment)
        .where(Assessment.training_id == training_id)
        .options(
            selectinload(Assessment.questions).selectinload(Question.options)
        )
        .order_by(Assessment.order_index)
    )
    assessments = result.scalars().all()
    return assessments

@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single assessment by ID"""
    result = await db.execute(
        select(Assessment)
        .where(Assessment.id == assessment_id)
        .options(
            selectinload(Assessment.questions).selectinload(Question.options)
        )
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.get("/{assessment_id}/with-attempts", response_model=AssessmentWithAttempts)
async def get_assessment_with_attempts(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assessment with user's attempt history"""
    result = await db.execute(
        select(Assessment)
        .where(Assessment.id == assessment_id)
        .options(
            selectinload(Assessment.questions).selectinload(Question.options)
        )
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get user's attempts
    attempts_result = await db.execute(
        select(AssessmentAttempt)
        .where(
            AssessmentAttempt.assessment_id == assessment_id,
            AssessmentAttempt.user_id == current_user.id
        )
        .order_by(AssessmentAttempt.attempt_number)
    )
    user_attempts = attempts_result.scalars().all()
    
    # Calculate remaining attempts
    attempts_used = len(user_attempts)
    remaining_attempts = max(0, assessment.max_attempts - attempts_used) if assessment.max_attempts else 999
    
    # Return assessment with attempts info
    return {
        **{k: v for k, v in assessment.__dict__.items() if not k.startswith('_')},
        "user_attempts": user_attempts,
        "remaining_attempts": remaining_attempts
    }

@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: UUID,
    assessment_update: AssessmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Update an assessment (Instructor/Admin only)"""
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    db_assessment = result.scalar_one_or_none()
    
    if not db_assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    update_data = assessment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_assessment, field, value)
    
    await db.commit()
    await db.refresh(db_assessment)
    return db_assessment

@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Delete an assessment (Instructor/Admin only)"""
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    db_assessment = result.scalar_one_or_none()
    
    if not db_assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    await db.delete(db_assessment)
    await db.commit()
    return None

# ============ QUESTION ENDPOINTS ============

@router.post("/questions/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Create a new question (Instructor/Admin only)"""
    question_data = question.model_dump(exclude={'options'})
    db_question = Question(**question_data)
    db.add(db_question)
    await db.flush()
    
    if question.options:
        for option_data in question.options:
            db_option = QuestionOption(
                **option_data.model_dump(),
                question_id=db_question.id
            )
            db.add(db_option)
    
    await db.commit()
    await db.refresh(db_question, ['options'])
    return db_question

@router.get("/questions/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single question by ID"""
    result = await db.execute(
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.options))
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: UUID,
    question_update: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Update a question (Instructor/Admin only)"""
    result = await db.execute(
        select(Question).where(Question.id == question_id)
    )
    db_question = result.scalar_one_or_none()
    
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    update_data = question_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_question, field, value)
    
    await db.commit()
    await db.refresh(db_question)
    return db_question

@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Delete a question (Instructor/Admin only)"""
    result = await db.execute(
        select(Question).where(Question.id == question_id)
    )
    db_question = result.scalar_one_or_none()
    
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    await db.delete(db_question)
    await db.commit()
    return None

# ============ ATTEMPT & RESPONSE ENDPOINTS ============

@router.post("/attempts/start", response_model=AssessmentAttemptResponse)
async def start_assessment_attempt(
    attempt: AssessmentAttemptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new assessment attempt"""
    result = await db.execute(
        select(Assessment).where(Assessment.id == attempt.assessment_id)
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    attempts_result = await db.execute(
        select(AssessmentAttempt).where(
            AssessmentAttempt.assessment_id == attempt.assessment_id,
            AssessmentAttempt.user_id == current_user.id
        )
    )
    existing_attempts = attempts_result.scalars().all()
    
    if assessment.max_attempts and len(existing_attempts) >= assessment.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts exceeded")
    
    db_attempt = AssessmentAttempt(
        assessment_id=attempt.assessment_id,
        user_id=current_user.id,
        enrollment_id=attempt.enrollment_id,
        attempt_number=len(existing_attempts) + 1
    )
    db.add(db_attempt)
    await db.commit()
    await db.refresh(db_attempt)
    return db_attempt

@router.post("/attempts/{attempt_id}/submit", response_model=AssessmentAttemptResponse)
async def submit_assessment_attempt(
    attempt_id: UUID,
    submission: AssessmentAttemptSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an assessment attempt with responses"""
    result = await db.execute(
        select(AssessmentAttempt).where(
            AssessmentAttempt.id == attempt_id,
            AssessmentAttempt.user_id == current_user.id
        )
    )
    db_attempt = result.scalar_one_or_none()
    
    if not db_attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if db_attempt.submitted_at:
        raise HTTPException(status_code=400, detail="Attempt already submitted")
    
    assessment_result = await db.execute(
        select(Assessment)
        .where(Assessment.id == db_attempt.assessment_id)
        .options(
            selectinload(Assessment.questions).selectinload(Question.options)
        )
    )
    assessment = assessment_result.scalar_one()
    
    total_points = 0
    points_earned = 0
    
    for response_data in submission.responses:
        question_result = await db.execute(
            select(Question)
            .where(Question.id == response_data.question_id)
            .options(selectinload(Question.options))
        )
        question = question_result.scalar_one_or_none()
        
        if not question:
            continue
        
        total_points += question.points
        
        is_correct = None
        earned = 0
        
        if question.question_type == "multiple_choice":
            if response_data.selected_option_id:
                option_result = await db.execute(
                    select(QuestionOption).where(
                        QuestionOption.id == response_data.selected_option_id
                    )
                )
                option = option_result.scalar_one_or_none()
                is_correct = option.is_correct if option else False
                earned = question.points if is_correct else 0
        
        elif question.question_type == "true_false":
            if response_data.response_text and question.correct_answer:
                is_correct = response_data.response_text.lower() == question.correct_answer.lower()
                earned = question.points if is_correct else 0
        
        points_earned += earned
        
        db_response = ParticipantResponse(
            assessment_id=db_attempt.assessment_id,
            question_id=response_data.question_id,
            user_id=current_user.id,
            enrollment_id=response_data.enrollment_id,
            response_text=response_data.response_text,
            selected_option_id=response_data.selected_option_id,
            is_correct=is_correct,
            points_earned=earned,
            attempt_number=db_attempt.attempt_number
        )
        db.add(db_response)
    
    score = (points_earned / total_points * 100) if total_points > 0 else 0
    passed = score >= assessment.passing_score
    
    db_attempt.submitted_at = datetime.utcnow()
    db_attempt.score = score
    db_attempt.total_points = total_points
    db_attempt.points_earned = points_earned
    db_attempt.passed = passed
    db_attempt.time_spent_seconds = submission.time_spent_seconds
    
    await db.commit()
    await db.refresh(db_attempt)
    return db_attempt

@router.get("/attempts/{attempt_id}/responses", response_model=List[ParticipantResponseResponse])
async def get_attempt_responses(
    attempt_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all responses for an attempt"""
    attempt_result = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id)
    )
    attempt = attempt_result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.user_id != current_user.id and current_user.role not in ["Instructor", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    responses_result = await db.execute(
        select(ParticipantResponse).where(
            ParticipantResponse.assessment_id == attempt.assessment_id,
            ParticipantResponse.user_id == attempt.user_id,
            ParticipantResponse.attempt_number == attempt.attempt_number
        )
    )
    responses = responses_result.scalars().all()
    
    return responses

@router.get("/{assessment_id}/results")
async def get_assessment_results(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("Instructor", "Admin"))
):
    """Get assessment results for all participants (Instructor/Admin only)"""
    assessment_result = await db.execute(
        select(Assessment)
        .where(Assessment.id == assessment_id)
        .options(
            selectinload(Assessment.questions).selectinload(Question.options)
        )
    )
    assessment = assessment_result.scalar_one_or_none()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get attempts with user information
    from app.models.user import User
    attempts_result = await db.execute(
        select(AssessmentAttempt, User)
        .join(User, AssessmentAttempt.user_id == User.id)
        .where(
            AssessmentAttempt.assessment_id == assessment_id,
            AssessmentAttempt.submitted_at.isnot(None)
        )
        .order_by(AssessmentAttempt.submitted_at.desc())
    )
    attempts_with_users = attempts_result.all()
    
    attempts = [attempt for attempt, user in attempts_with_users]
    
    # Build response data with user names
    attempts_data = []
    for attempt, user in attempts_with_users:
        attempts_data.append({
            "user_id": str(attempt.user_id),
            "user_name": user.full_name or user.email,
            "attempt_number": attempt.attempt_number,
            "score": float(attempt.score) if attempt.score else None,
            "points_earned": attempt.points_earned,
            "total_points": attempt.total_points,
            "passed": attempt.passed,
            "time_spent_seconds": attempt.time_spent_seconds,
            "submitted_at": attempt.submitted_at,
            "started_at": attempt.started_at
        })
    
    total_participants = len(set(a.user_id for a in attempts))
    completed_count = len(attempts)
    
    scores = [a.score for a in attempts if a.score is not None]
    average_score = sum(scores) / len(scores) if scores else None
    
    passed_count = sum(1 for a in attempts if a.passed)
    pass_rate = (passed_count / len(attempts) * 100) if attempts else None
    
    # Manually serialize assessment
    assessment_dict = {
        "id": str(assessment.id),
        "training_id": str(assessment.training_id),
        "title": assessment.title,
        "description": assessment.description,
        "assessment_type": assessment.assessment_type,
        "passing_score": assessment.passing_score,
        "time_limit_minutes": assessment.time_limit_minutes,
        "max_attempts": assessment.max_attempts,
        "randomize_questions": assessment.randomize_questions,
        "show_correct_answers": assessment.show_correct_answers,
        "questions": [{"id": str(q.id), "question_text": q.question_text, "points": q.points} for q in assessment.questions] if assessment.questions else []
    }
    
    return {
        "assessment": assessment_dict,
        "total_participants": total_participants,
        "completed_count": completed_count,
        "average_score": float(average_score) if average_score else None,
        "pass_rate": float(pass_rate) if pass_rate else None,
        "attempts": attempts_data
    }
