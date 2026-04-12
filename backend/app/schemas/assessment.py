from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class QuestionOptionBase(BaseModel):
    option_text: str
    is_correct: bool = False
    order_index: int = 0

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOptionUpdate(BaseModel):
    option_text: Optional[str] = None
    is_correct: Optional[bool] = None
    order_index: Optional[int] = None

class QuestionOptionResponse(QuestionOptionBase):
    id: UUID
    question_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_text: str
    question_type: str  # multiple_choice, true_false, short_answer, essay, matching
    points: int = 1
    order_index: int = 0
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    is_required: bool = True

class QuestionCreate(QuestionBase):
    assessment_id: UUID
    options: Optional[List[QuestionOptionCreate]] = []

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    points: Optional[int] = None
    order_index: Optional[int] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    is_required: Optional[bool] = None

class QuestionResponse(QuestionBase):
    id: UUID
    assessment_id: UUID
    created_at: datetime
    updated_at: datetime
    options: List[QuestionOptionResponse] = []
    
    class Config:
        from_attributes = True

class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    assessment_type: str  # pre_test, post_test, quiz, knowledge_check, assignment
    time_limit_minutes: Optional[int] = None
    passing_score: int = 70
    max_attempts: int = 3
    randomize_questions: bool = False
    show_correct_answers: bool = True
    is_required: bool = False
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    order_index: int = 0

class AssessmentCreate(AssessmentBase):
    training_id: UUID

class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assessment_type: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    passing_score: Optional[int] = None
    max_attempts: Optional[int] = None
    randomize_questions: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    is_required: Optional[bool] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    order_index: Optional[int] = None

class AssessmentResponse(AssessmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    questions: List['QuestionResponse'] = []
    
    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

class ParticipantResponseBase(BaseModel):
    response_text: Optional[str] = None
    selected_option_id: Optional[UUID] = None

class ParticipantResponseCreate(ParticipantResponseBase):
    question_id: UUID
    assessment_id: UUID
    enrollment_id: Optional[UUID] = None
    attempt_number: int = 1

class ParticipantResponseUpdate(BaseModel):
    response_text: Optional[str] = None
    selected_option_id: Optional[UUID] = None
    is_correct: Optional[bool] = None
    points_earned: Optional[int] = None
    feedback: Optional[str] = None

class ParticipantResponseResponse(ParticipantResponseBase):
    id: UUID
    assessment_id: UUID
    question_id: UUID
    user_id: UUID
    enrollment_id: Optional[UUID] = None
    is_correct: Optional[bool] = None
    points_earned: int
    attempt_number: int
    submitted_at: datetime
    graded_at: Optional[datetime] = None
    graded_by: Optional[UUID] = None
    feedback: Optional[str] = None
    
    class Config:
        from_attributes = True

class AssessmentAttemptBase(BaseModel):
    attempt_number: int
    time_spent_seconds: Optional[int] = None

class AssessmentAttemptCreate(AssessmentAttemptBase):
    assessment_id: UUID
    enrollment_id: Optional[UUID] = None

class AssessmentAttemptSubmit(BaseModel):
    responses: List[ParticipantResponseCreate]
    time_spent_seconds: Optional[int] = None

class AssessmentAttemptResponse(AssessmentAttemptBase):
    id: UUID
    assessment_id: UUID
    user_id: UUID
    enrollment_id: Optional[UUID] = None
    started_at: datetime
    submitted_at: Optional[datetime] = None
    score: Optional[float] = None
    total_points: Optional[int] = None
    points_earned: Optional[int] = None
    passed: Optional[bool] = None
    
    class Config:
        from_attributes = True

class AssessmentWithAttempts(AssessmentResponse):
    """Assessment with user's attempt history"""
    user_attempts: List[AssessmentAttemptResponse] = []
    remaining_attempts: int = 0

class AssessmentResults(BaseModel):
    """Results view for instructors"""
    assessment: AssessmentResponse
    total_participants: int
    completed_count: int
    average_score: Optional[float] = None
    pass_rate: Optional[float] = None
    responses: List[ParticipantResponseResponse] = []
