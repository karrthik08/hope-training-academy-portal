# This is the fixed create_assessment function
# Copy this and replace lines 36-48 in assessments.py

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
