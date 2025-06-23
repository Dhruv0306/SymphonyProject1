"""
Email Notification Utility for Batch Processing

This module provides functionality to send email notifications with CSV attachments
when batch processing jobs are completed. It handles email configuration, content 
creation, and secure SMTP communication.

The module requires the following environment variables to be set:
    - SMTP_SERVER: SMTP server hostname
    - SMTP_PORT: SMTP server port (defaults to 587)
    - SMTP_USERNAME: SMTP authentication username 
    - SMTP_PASSWORD: SMTP authentication password
    - SENDER_EMAIL: Email address to send from
    - SENDER_NAME: Display name for sender (defaults to "Symphony Logo Detection")
"""

import os
import smtplib
import logging
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure module logger
logger = logging.getLogger(__name__)


def send_batch_summary_email(
    email_to: str, batch_id: str, csv_path: str, valid_count: int, invalid_count: int
) -> bool:
    """
    Send an email with batch processing summary and CSV attachment.

    Creates and sends an HTML email containing a summary of batch processing results,
    including statistics on valid/invalid images and a CSV attachment with detailed results.

    Args:
        email_to (str): The recipient's email address
        batch_id (str): The ID of the completed batch job
        csv_path (str): File system path to the CSV results file
        valid_count (int): Number of successfully processed images
        invalid_count (int): Number of images that failed processing

    Returns:
        bool: True if email sent successfully, False if any errors occurred

    Raises:
        No exceptions are raised - errors are caught and logged
    """
    try:
        # Retrieve email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))  # Default to standard TLS port
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        sender_email = os.getenv("SENDER_EMAIL")
        sender_name = os.getenv("SENDER_NAME", "Symphony Logo Detection")

        # Validate required SMTP credentials are configured
        if (
            not smtp_server
            or not smtp_username
            or not smtp_password
            or not sender_email
        ):
            logger.error(
                "SMTP credentials not configured in .env file. Email notification not sent."
            )
            return False

        # Initialize multipart MIME email message
        msg = MIMEMultipart()
        msg["Subject"] = f"Batch {batch_id} Processing Summary"
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = email_to

        # Calculate batch processing statistics
        total_images = valid_count + invalid_count
        valid_percentage = (valid_count / total_images * 100) if total_images > 0 else 0

        # Generate HTML email content with styling
        email_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #0066B3; margin-bottom: 20px;">Batch Processing Summary</h2>
                <p>Your batch processing job (ID: <strong>{batch_id}</strong>) has been completed.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Summary:</h3>
                    <ul>
                        <li>Total Images: <strong>{total_images}</strong></li>
                        <li>Valid Images: <strong style="color: green;">{valid_count}</strong></li>
                        <li>Invalid Images: <strong style="color: red;">{invalid_count}</strong></li>
                        <li>Success Rate: <strong>{valid_percentage:.1f}%</strong></li>
                    </ul>
                </div>
                
                <p>The complete results are attached as a CSV file.</p>
                
                <p style="color: #666; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    This is an automated message from the Symphony Logo Detection System.
                </p>
            </div>
        </body>
        </html>
        """

        # Add HTML content to email message
        msg.attach(MIMEText(email_content, "html"))

        # Attach CSV results file if it exists
        if os.path.exists(csv_path):
            with open(csv_path, "rb") as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())

            # Base64 encode attachment and set filename
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename=batch_{batch_id}_results.csv",
            )
            msg.attach(part)
        else:
            logger.warning(f"CSV file not found at {csv_path}")

        # Establish secure SMTP connection and send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Enable TLS encryption
            logger.info(
                "Connecting to SMTP server... : %s : %s", smtp_server, smtp_port
            )
            server.login(smtp_username, smtp_password)
            server.send_message(msg)

        logger.info(f"Email notification sent to {email_to} for batch {batch_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}")
        return False
