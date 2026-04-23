import os
import random
import string
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, send_file, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_apscheduler import APScheduler
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configurations
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-secret-key-for-dev')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///file_share.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024 # 10 MB limit
UPLOAD_FOLDER = os.path.join(app.root_path, 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Extension filtering (basic security)
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'rar', 'mp3', 'mp4', 'csv', 'docx', 'xlsx', 'py', 'js', 'html', 'json'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize Extensions
db = SQLAlchemy(app)
scheduler = APScheduler()

# Initialize Scheduler
app.config['SCHEDULER_API_ENABLED'] = False
scheduler.init_app(app)
scheduler.start()

# --- Database Models ---
class ShareItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(8), unique=True, nullable=False, index=True)
    item_type = db.Column(db.String(10), nullable=False) # 'text' or 'file'
    text_content = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(255), nullable=True) # Relative to uploads
    file_name = db.Column(db.String(255), nullable=True) # Original name
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

# --- Utility Functions ---
def generate_unique_code(length=6):
    characters = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choice(characters) for _ in range(length))
        if not ShareItem.query.filter_by(code=code).first():
            return code

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload/text', methods=['POST'])
def upload_text():
    data = request.json
    content = data.get('text', '').strip()
    
    if not content:
        return jsonify({'error': 'Text content cannot be empty'}), 400
        
    code = generate_unique_code()
    item = ShareItem(code=code, item_type='text', text_content=content)
    db.session.add(item)
    db.session.commit()
    
    return jsonify({'code': code, 'message': 'Text uploaded successfully'})

@app.route('/upload/file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No valid file selected'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        code = generate_unique_code()
        
        # Save file with unique subfolder or prefix to avoid collisions
        unique_filename = f"{code}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        item = ShareItem(code=code, item_type='file', file_path=unique_filename, file_name=filename)
        db.session.add(item)
        db.session.commit()
        
        return jsonify({'code': code, 'message': 'File uploaded successfully'})
    else:
        return jsonify({'error': 'File type not allowed or no file selected'}), 400

@app.route('/get/<code>', methods=['GET'])
def get_item(code):
    item = ShareItem.query.filter_by(code=code.upper()).first()
    
    if not item:
        return jsonify({'error': 'Invalid code or item has expired.'}), 404
        
    if item.item_type == 'text':
        return jsonify({
            'type': 'text',
            'content': item.text_content,
            'created_at': item.created_at.isoformat()
        })
    elif item.item_type == 'file':
        return jsonify({
            'type': 'file',
            'filename': item.file_name,
            'download_url': url_for('download_file', code=item.code)
        })
    
    return jsonify({'error': 'Unknown format'}), 500

@app.route('/download/<code>', methods=['GET'])
def download_file(code):
    item = ShareItem.query.filter_by(code=code.upper(), item_type='file').first()
    
    if not item:
        return jsonify({'error': 'Invalid code or file not found.'}), 404
        
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], item.file_path)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True, download_name=item.file_name)
    else:
        return jsonify({'error': 'File is missing on server.'}), 404

# --- Background Task to Cleanup ---
@scheduler.task('interval', id='cleanup_job', hours=1, misfire_grace_time=900)
def cleanup_expired_items():
    with app.app_context():
        expiration_time = datetime.utcnow() - timedelta(hours=24)
        expired_items = ShareItem.query.filter(ShareItem.created_at < expiration_time).all()
        
        count = 0
        for item in expired_items:
            # Delete physically if file
            if item.item_type == 'file' and item.file_path:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], item.file_path)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception as e:
                        print(f"Error removing file {file_path}: {e}")
            db.session.delete(item)
            count += 1
            
        if count > 0:
            db.session.commit()
            print(f"Cleaned up {count} expired items at {datetime.utcnow()}")

# Global Error Handlers for larger files
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File size exceeds the 10MB maximum limit.'}), 413

if __name__ == '__main__':
    # Running locally
    app.run(debug=True, port=5000)
