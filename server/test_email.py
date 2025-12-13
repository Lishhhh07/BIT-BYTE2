import smtplib
from email.mime.text import MIMEText

# --- CONFIGURATION ---
# Use Port 465 for SSL (More stable)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465 
SENDER_EMAIL = "lishikameghani@gmail.com"  # <--- PUT YOUR GMAIL HERE
APP_PASSWORD = "cxkr mcna gtfw uzhb"        # <--- PASTE 16-LETTER APP PASSWORD

def test_connection():
    print(f"🔵 Connecting securely to {SMTP_SERVER} on Port {SMTP_PORT}...")
    
    try:
        # 1. Connect using SSL immediately (Fixes "Connection Closed" errors)
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        
        # 2. Login
        print("🔑 Logging in...")
        server.login(SENDER_EMAIL, APP_PASSWORD)
        print("✅ Login SUCCESSFUL!")
        
        # 3. Send Email
        print("📧 Sending test email...")
        msg = MIMEText("This proves your Python email logic is working with SSL!")
        msg['Subject'] = "EcoWatch SSL Test"
        msg['From'] = SENDER_EMAIL
        msg['To'] = SENDER_EMAIL 
        
        server.sendmail(SENDER_EMAIL, SENDER_EMAIL, msg.as_string())
        server.quit()
        
        print("🎉 SUCCESS! Check your inbox.")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_connection()