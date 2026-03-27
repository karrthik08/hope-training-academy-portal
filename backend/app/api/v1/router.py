from fastapi import APIRouter
from app.api.v1.endpoints import auth, trainings, enrollments, instructor, admin, certificates, onboarding

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(trainings.router)
api_router.include_router(enrollments.router)
api_router.include_router(instructor.router)
api_router.include_router(admin.router)
api_router.include_router(certificates.router)
api_router.include_router(onboarding.router)
