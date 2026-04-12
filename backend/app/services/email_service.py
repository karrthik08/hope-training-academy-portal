import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from datetime import datetime
from typing import Dict
import os

class EmailService:
    def __init__(self):
        # Email configuration - these should be set in environment variables
        self.smtp_server = "smtp.sendgrid.net"
        self.smtp_port = 587
        self.smtp_username = "apikey"
        self.smtp_password = os.getenv("SENDGRID_API_KEY", "")
        self.from_email = "karrthikburugupally@gmail.com"
        self.support_email = "oohtraining@organizationofhope.org"
    
    def send_support_request(self, form_data: Dict[str, str]) -> bool:
        """
        Send support request email to oohtraining@organizationofhope.org

        Args:
            form_data: Dictionary containing name, email, subject, message
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"HOPE Training Portal Support: {form_data['subject']}"
            msg['From'] = self.from_email
            msg['To'] = self.support_email
            msg['Reply-To'] = form_data['email']
            
            # Create HTML body
            html_body = f"""
            <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .header {{ background-color: #003087; color: white; padding: 20px; text-align: center; }}
                        .content {{ padding: 20px; background-color: #f9f9f9; }}
                        .info-box {{ background-color: white; border-left: 4px solid #CC0000; padding: 15px; margin: 10px 0; }}
                        .label {{ font-weight: bold; color: #003087; }}
                        .message-box {{ background-color: white; padding: 15px; margin: 15px 0; border: 1px solid #ddd; }}
                        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>HOPE Training Academy Portal - Support Request</h2>
                    </div>
                    <div class="content">
                        <div class="info-box">
                            <p><span class="label">From:</span> {form_data['name']}</p>
                            <p><span class="label">Email:</span> {form_data['email']}</p>
                            <p><span class="label">Subject:</span> {form_data['subject']}</p>
                            <p><span class="label">Date:</span> {datetime.now().strftime("%B %d, %Y at %I:%M %p EST")}</p>
                        </div>
                        
                        <div class="message-box">
                            <p class="label">Message:</p>
                            <p>{form_data['message'].replace(chr(10), '<br>')}</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This email was sent from the HOPE Training Academy Portal support system.</p>
                        <p>Bridging Hope, Inc. dba Organization of Hope</p>
                    </div>
                </body>
            </html>
            """
            
            # Create plain text version
            text_body = f"""
HOPE Training Academy Portal - Support Request

From: {form_data['name']}
Email: {form_data['email']}
Subject: {form_data['subject']}
Date: {datetime.now().strftime("%B %d, %Y at %I:%M %p EST")}

Message:
{form_data['message']}

---
This email was sent from the HOPE Training Academy Portal support system.
Bridging Hope, Inc. dba Organization of Hope
            """
            
            # Attach both HTML and plain text versions
            part1 = MIMEText(text_body, 'plain')
            part2 = MIMEText(html_body, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            print(f"📧 Attempting to send email to {self.support_email} via {self.smtp_server}")
            print(f"📧 Using FROM: {self.from_email}")
            print(f"📧 SMTP Username: {self.smtp_username}")
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.set_debuglevel(1)  # Enable debug output
                server.starttls()
                if self.smtp_username and self.smtp_password:
                    print(f"📧 Logging in with username: {self.smtp_username}")
                    server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            print(f"✅ Support email sent successfully to {self.support_email}")
            return True
            
        except Exception as e:
            print(f"❌ Error sending support email: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

# Create singleton instance
email_service = EmailService()