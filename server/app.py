from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
import random
import smtplib
from email.mime.text import MIMEText
from bridge import analyze_location
from datetime import timedelta
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))
from reportGenerator import generate_report

app = Flask(__name__)
CORS(app)

# --- 1. CONFIGURATION ---
# Replace these with your details if you want to TRY emailing
MAIL_USERNAME = "lishikameghani@gmail.com"
MAIL_PASSWORD = "cxkr mcna gtfw uzhb" 

app.config["JWT_SECRET_KEY"] = "super-secret-hackathon-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# MOCK DATABASE (Saves users in RAM so you don't need MongoDB)
users_db = {} 

IMAGE_FOLDER = os.path.join(os.getcwd(), 'ai_engine', 'data', 'inference')
os.makedirs(IMAGE_FOLDER, exist_ok=True)

# Output folder for serving masks
OUTPUT_FOLDER = os.path.join(os.getcwd(), 'ai_engine', 'output')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# --- 2. THE EMAIL BYPASS FUNCTION ---
def send_otp_smart(to_email, otp):
    print(f"\n🔵 ATTEMPTING TO EMAIL: {to_email}")
    try:
        # Try to send real email
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=5)
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        msg = MIMEText(f"Your Code: {otp}")
        msg['Subject'] = "EcoWatch Login"
        msg['From'] = MAIL_USERNAME
        msg['To'] = to_email
        server.sendmail(MAIL_USERNAME, to_email, msg.as_string())
        server.quit()
        print(f"✅ EMAIL SENT to {to_email}")
        return True
    except Exception as e:
        # IF BLOCKED, PRINT TO CONSOLE INSTEAD
        print(f"❌ Network Blocked Email: {e}")
        print("------------------------------------------------")
        print(f"👉👉 YOUR LOGIN CODE IS:  {otp}  👈👈")
        print("------------------------------------------------")
        return False

# --- 3. AUTH ROUTES ---

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name', 'EcoWarrior')

    if email in users_db and "otp" not in users_db[email]:
        return jsonify({"error": "User already exists"}), 400

    # Generate Code
    otp_code = str(random.randint(100000, 999999))

    # Save User
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users_db[email] = {
        "password": hashed_password,
        "name": name,
        "otp": otp_code,
        "verified": False
    }

    # Send Code (Or Print it)
    send_otp_smart(email, otp_code)
    
    return jsonify({"message": "OTP sent"}), 201

@app.route('/api/auth/verify', methods=['POST'])
def verify():
    data = request.json
    email = data.get('email')
    user_otp = data.get('otp')
    
    user = users_db.get(email)
    if not user: return jsonify({"error": "User not found"}), 404
        
    # Check Code
    if str(user.get("otp")) == str(user_otp):
        user["verified"] = True
        del user["otp"]
        
        access_token = create_access_token(identity=email)
        return jsonify({
            "token": access_token, 
            "user": {"email": email, "name": user['name']}
        }), 200
    
    return jsonify({"error": "Invalid OTP Code"}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = users_db.get(email)

    if user and bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(identity=email)
        return jsonify({
            "token": access_token, 
            "user": {"email": email, "name": user['name']}
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_email = get_jwt_identity()
    user = users_db.get(current_email)
    if user: return jsonify({"email": current_email, "name": user['name']}), 200
    return jsonify({"error": "User not found"}), 404

# --- 4. AI ROUTES ---
@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)

# Serve output folder for masks
@app.route('/analysis-output/<path:filename>')
def serve_analysis_output(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        result = analyze_location(float(data['lat']), float(data['lng']))
        # Add lat/lng to result for report generation
        result['lat'] = data['lat']
        result['lng'] = data['lng']
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/report', methods=['POST'])
def generate_legal_report():
    try:
        data = request.json
        
        # Generate unique report filename
        import time
        report_filename = f"ecowatch_report_{data.get('lat', '0')}_{data.get('lng', '0')}_{int(time.time())}.pdf"
        report_path = os.path.join(OUTPUT_FOLDER, report_filename)
        
        # Generate the report
        generate_report(data, report_path)
        
        # Return the PDF file
        return send_file(
            report_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=report_filename
        )
    except Exception as e:
        print(f"❌ Report generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Server running on Port 5000 (Developer Mode)")
    app.run(host='0.0.0.0', port=5000, debug=True)