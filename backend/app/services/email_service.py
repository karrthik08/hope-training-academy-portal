import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

async def send_notification_email(subject: str, body: str, to_email: str = None):
    """
    Send notification email to oohtraining@organizationofhope.org
    """
    try:
        recipient = to_email if to_email else settings.SUPPORT_EMAIL
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.FROM_EMAIL
        msg['To'] = recipient
        
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Email sent successfully to {recipient}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False


async def notify_new_registration(user_email: str, user_name: str, role: str):
    """Notify admin of new user registration"""
    subject = f"New User Registration - {role}"
    body = f"""
    <html>
        <body>
            <h2>New User Registered</h2>
            <p><strong>Name:</strong> {user_name}</p>
            <p><strong>Email:</strong> {user_email}</p>
            <p><strong>Role:</strong> {role}</p>
            <p><strong>Portal:</strong> <a href="https://hope-frontend-qm4p.onrender.com">HOPE Training Portal</a></p>
        </body>
    </html>
    """
    await send_notification_email(subject, body)


async def notify_training_enrollment(user_name: str, user_email: str, training_title: str, instructor_email: Optional[str] = None):
    """Notify instructor (or admin if no instructor) of training enrollment"""
    subject = f"New Training Enrollment - {training_title}"
    body = f"""
    <html>
        <body>
            <h2>New Training Enrollment</h2>
            <p><strong>User:</strong> {user_name} ({user_email})</p>
            <p><strong>Training:</strong> {training_title}</p>
        </body>
    </html>
    """
    await send_notification_email(subject, body, to_email=instructor_email)


async def notify_training_completion(user_name: str, user_email: str, training_title: str, certificate_id: str, instructor_email: Optional[str] = None):
    """Notify instructor (or admin if no instructor) of training completion"""
    subject = f"Training Completed - {training_title}"
    body = f"""
    <html>
        <body>
            <h2>Training Completed</h2>
            <p><strong>User:</strong> {user_name} ({user_email})</p>
            <p><strong>Training:</strong> {training_title}</p>
            <p><strong>Certificate ID:</strong> {certificate_id}</p>
        </body>
    </html>
    """
    await send_notification_email(subject, body, to_email=instructor_email)


async def notify_course_submitted_for_review(instructor_name: str, course_title: str, course_id: int):
    """Notify admin when instructor submits course for review"""
    subject = f"Course Submitted for Review - {course_title}"
    body = f"""
    <html>
        <body>
            <h2>Course Submitted for Review</h2>
            <p><strong>Instructor:</strong> {instructor_name}</p>
            <p><strong>Course:</strong> {course_title}</p>
            <p><strong>Action Required:</strong> Please review and approve/reject this course</p>
            <p><a href="https://hope-frontend-qm4p.onrender.com/admin">Review in Admin Dashboard</a></p>
        </body>
    </html>
    """
    await send_notification_email(subject, body)


async def notify_course_approved(course_title: str, instructor_email: str):
    """Notify instructor when their course is approved"""
    subject = f"Course Approved - {course_title}"
    body = f"""
    <html>
        <body>
            <h2>Your Course Has Been Approved</h2>
            <p><strong>Course:</strong> {course_title}</p>
            <p>Your course has been approved and is now published.</p>
        </body>
    </html>
    """
    await send_notification_email(subject, body, instructor_email)


async def notify_support_request(name: str, email: str, subject: str, message: str):
    """Forward support request to admin"""
    email_subject = f"Support Request - {subject}"
    body = f"""
    <html>
        <body>
            <h2>New Support Request</h2>
            <p><strong>From:</strong> {name} ({email})</p>
            <p><strong>Subject:</strong> {subject}</p>
            <p><strong>Message:</strong></p>
            <p>{message}</p>
        </body>
    </html>
    """
    await send_notification_email(email_subject, body)


async def notify_assignment_submission(user_name: str, user_email: str, training_title: str, assignment_title: str):
    """Notify admin of assignment submission"""
    subject = f"Assignment Submitted - {assignment_title}"
    body = f"""
    <html>
        <body>
            <h2>New Assignment Submission</h2>
            <p><strong>User:</strong> {user_name} ({user_email})</p>
            <p><strong>Training:</strong> {training_title}</p>
            <p><strong>Assignment:</strong> {assignment_title}</p>
        </body>
    </html>
    """
    await send_notification_email(subject, body)