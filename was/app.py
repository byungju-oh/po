from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid
from PIL import Image

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'mysql+pymysql://root:1234@mysql-service.db.svc.cluster.local:3306/portfolio')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Portfolio model
class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    image_path = db.Column(db.String(500))
    category = db.Column(db.String(100))
    medium = db.Column(db.String(100))  # 오일파스텔, 유화, 콘테 등
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_featured = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)

# Experience model
class Experience(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))  # travel, art, music, etc
    date = db.Column(db.Date)
    image_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    featured_works = Portfolio.query.filter_by(is_featured=True).order_by(Portfolio.sort_order).limit(6).all()
    recent_works = Portfolio.query.order_by(Portfolio.created_at.desc()).limit(8).all()
    return render_template('index.html', featured_works=featured_works, recent_works=recent_works)

@app.route('/portfolio')
def portfolio():
    category = request.args.get('category', 'all')
    if category == 'all':
        works = Portfolio.query.order_by(Portfolio.sort_order, Portfolio.created_at.desc()).all()
    else:
        works = Portfolio.query.filter_by(category=category).order_by(Portfolio.sort_order, Portfolio.created_at.desc()).all()
    
    categories = db.session.query(Portfolio.category).distinct().all()
    categories = [cat[0] for cat in categories if cat[0]]
    
    return render_template('portfolio.html', works=works, categories=categories, current_category=category)

@app.route('/about')
def about():
    experiences = Experience.query.order_by(Experience.date.desc()).all()
    return render_template('about.html', experiences=experiences)

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('관리자 권한이 필요합니다.', 'error')
        return redirect(url_for('index'))
    
    works = Portfolio.query.order_by(Portfolio.created_at.desc()).all()
    experiences = Experience.query.order_by(Experience.created_at.desc()).all()
    return render_template('admin.html', works=works, experiences=experiences)

@app.route('/admin/add_work', methods=['GET', 'POST'])
@login_required
def add_work():
    if not current_user.is_admin:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        category = request.form['category']
        medium = request.form['medium']
        is_featured = 'is_featured' in request.form
        
        # Handle file upload
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename:
                filename = secure_filename(file.filename)
                # Add timestamp to avoid conflicts
                name, ext = os.path.splitext(filename)
                filename = f"{name}_{int(datetime.now().timestamp())}{ext}"
                
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                # Resize image if needed
                try:
                    with Image.open(file_path) as img:
                        if img.width > 1200:
                            ratio = 1200 / img.width
                            new_height = int(img.height * ratio)
                            img = img.resize((1200, new_height), Image.Resampling.LANCZOS)
                            img.save(file_path, optimize=True, quality=85)
                except Exception as e:
                    print(f"Image processing error: {e}")
                
                image_path = filename
        
        work = Portfolio(
            title=title,
            description=description,
            category=category,
            medium=medium,
            image_path=image_path,
            is_featured=is_featured
        )
        
        db.session.add(work)
        db.session.commit()
        
        flash('작품이 추가되었습니다.', 'success')
        return redirect(url_for('admin'))
    
    return render_template('add_work.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('admin'))
        else:
            flash('잘못된 사용자명 또는 비밀번호입니다.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# Initialize database
with app.app_context():
    db.create_all()
    
    # Create admin user if not exists
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)