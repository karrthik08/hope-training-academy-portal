from fastapi import APIRouter
from app.api.v1.endpoints import auth, trainings, enrollments, instructor, admin, certificates, onboarding, course_content, content_progress, course_completion, modules, lessons, content_items, assessments, attendance, progress, completion, notifications, reports, support
from app.api.v1.endpoints import comments

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(comments.router)
api_router.include_router(trainings.router)
api_router.include_router(enrollments.router)
api_router.include_router(instructor.router)
api_router.include_router(admin.router)
api_router.include_router(certificates.router)
api_router.include_router(onboarding.router)
api_router.include_router(course_content.router)
api_router.include_router(content_progress.router)
api_router.include_router(course_completion.router)
api_router.include_router(modules.router, prefix="/modules", tags=["Modules"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["Lessons"])
api_router.include_router(content_items.router, prefix="/content-items", tags=["Content Items"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(attendance.router)
api_router.include_router(progress.router)
api_router.include_router(completion.router)
api_router.include_router(notifications.router)
api_router.include_router(reports.router)
api_router.include_router(support.router, prefix="/support", tags=["support"])
