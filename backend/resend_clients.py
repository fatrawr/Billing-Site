import os
import resend

resend.api_key = os.environ.get("RESEND_API_KEY")

# Resend allows sending from this address without a verified domain -
# switch to your own verified domain's address once you have one.
RESET_EMAIL_FROM = os.environ.get("RESET_EMAIL_FROM", "onboarding@resend.dev")


def send_reset_code_email(to_email, name, code):
    if not resend.api_key:
        raise RuntimeError("RESEND_API_KEY environment variable is not set")

    resend.Emails.send({
        "from": f"The Co-operative Engineers Town Society <{RESET_EMAIL_FROM}>",
        "to": [to_email],
        "subject": "Your password reset code",
        "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto;">
              <h2 style="color:#1b2a4a;">Password Reset Code</h2>
              <p>Hi {name},</p>
              <p>Use the code below to reset your password. It expires in 10 minutes.</p>
              <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1b2a4a;
                          text-align:center; padding: 16px; background:#f4f1ea; border-radius: 8px;">
                {code}
              </div>
              <p style="color:#707b95; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        """,
    })