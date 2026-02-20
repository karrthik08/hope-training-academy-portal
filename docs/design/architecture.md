# System Architecture

## Overview
This project is a simple corporate training portal where participants can browse trainings, enroll, attend, complete, and download completion certificates. Instructors create and manage trainings and record attendance/completion. Admins manage users/roles, approve trainings, and generate reports with audit logging.

## Actors and Roles
- **Participant (Learner):** browse trainings, enroll/cancel, view completion status, download certificate
- **Instructor:** create/update trainings, publish/unpublish, view roster, mark attendance and completion
- **Admin:** manage users and roles, approve trainings, generate roster/completion reports, view audit logs

## Tech Stack
- **Frontend:** React (Web UI)
- **Backend:** FastAPI (REST API)
- **Database:** PostgreSQL
- **File Storage:** S3 / Cloudinary / Local (for certificate files if needed)
- **Authentication & Authorization:** JWT + Role-Based Access Control (RBAC)

## High-Level Component Flow
Users access the React frontend via a browser. The frontend calls the FastAPI backend using HTTPS REST endpoints. The backend validates JWT tokens and enforces RBAC for all protected actions. The backend persists data to PostgreSQL and writes audit logs for important actions.

## Core Workflows
### 1) Authentication
- User logs in
- Backend returns JWT access token
- Frontend stores token and sends it in `Authorization: Bearer <token>` on future requests

### 2) Training Lifecycle
- Instructor creates training (status: draft)
- Admin approves training (status: approved)
- Instructor publishes training (status: published)
- Participants browse and enroll

### 3) Attendance and Completion
- Instructor views roster for a training
- Instructor marks attendance for enrolled participants
- Instructor marks completion for a participant
- Completion record is created and certificate URL is stored (if generated)

### 4) Reporting and Auditing
- Admin generates roster and completion reports based on enrollments/completions
- System writes audit log events for user/role/training approvals and updates

## Security Notes (RBAC Summary)
- **Participant:** browse trainings, enroll/cancel, view own status/certificate
- **Instructor:** manage trainings they created, view roster, mark attendance/completion
- **Admin:** manage users/roles, approve trainings, view audit logs and run reports

## Non-Functional Requirements (Basic)
- Secure authentication (JWT)
- Role-based access control on all protected endpoints
- Data integrity via foreign keys and unique constraints
- Audit logs for accountability