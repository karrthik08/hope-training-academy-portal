# Database Schema

## Purpose
The database supports a corporate training portal with role-based access control. It stores users and roles, trainings created by instructors, enrollments by participants, attendance/completion records, and audit logs for admin/security reporting.

## Entity Summary
- **USER:** system accounts (participants/instructors/admins)
- **ROLE / USER_ROLE:** RBAC role assignment
- **TRAINING:** training programs created by instructors (draft/approved/published)
- **ENROLLMENT:** participant enrollment in a training
- **ATTENDANCE:** attendance records for enrolled participants
- **COMPLETION:** completion + certificate info for an enrollment
- **AUDIT_LOG:** security/activity logs for accountability
