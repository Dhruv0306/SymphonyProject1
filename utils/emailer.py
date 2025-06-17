"""
Email Notification Utility for Batch Processing

This module provides functionality to send email notifications when batch
processing jobs are completed.
"""

import os
import smtplib
from email.message import EmailMessage
import logging
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

def send_csv_notification(email_to: str, batch_id: str, csv_url: str, valid_count: int, invalid_count: int):
    """
    Send an email notification when a batch processing job is complete
    
    Args:
        email_to: The recipient's email address
        batch_id: The ID of the completed batch
        csv_url: The URL where the CSV results can be downloaded
        valid_count: Number of valid images in the batch
        invalid_count: Number of invalid images in the batch
    
    Returns:
        bool: True if the email was sent successfully, False otherwise
    """
    try:
        # Get email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        sender_email = os.getenv("SENDER_EMAIL")
        sender_name = os.getenv("SENDER_NAME", "Symphony Logo Detection")
        
        # Check if SMTP credentials are configured
        if not smtp_server or not smtp_username or not smtp_password or not sender_email:
            logger.error("SMTP credentials not configured in .env file. Email notification not sent.")
            return False
        
        # Create the email message
        msg = EmailMessage()
        msg["Subject"] = f"Batch {batch_id} Processing Complete"
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = email_to
        
        # Create the email content
        total_images = valid_count + invalid_count
        
        email_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #0066B3; margin-bottom: 20px;">Batch Processing Complete</h2>
                <p>Your batch processing job (ID: <strong>{batch_id}</strong>) has been completed.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Summary:</h3>
                    <ul>
                        <li>Total Images: <strong>{total_images}</strong></li>
                        <li>Valid Images: <strong style="color: green;">{valid_count}</strong></li>
                        <li>Invalid Images: <strong style="color: red;">{invalid_count}</strong></li>
                        <li>Success Rate: <strong>{(valid_count / total_images * 100) if total_images > 0 else 0:.1f}%</strong></li>
                    </ul>
                </div>
                
                <p>
                    <a href="{csv_url}" style="background-color: #0066B3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Download CSV Results
                    </a>
                </p>
                
                <p style="color: #666; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    This is an automated message from the Symphony Logo Detection System.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Set the HTML content
        msg.set_content("Your batch processing is complete. Please download the CSV results.")
        msg.add_alternative(email_content, subtype="html")
        
        # Send the email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            
        logger.info(f"Email notification sent to {email_to} for batch {batch_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}")
        return False