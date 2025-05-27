from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid
import threading
import time
from PIL import Image
import logging

app = Flask(__name__)

# Logging 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# 데이터베이스 초기화 상태를 추적하는 전역 변수
_db_initialized = False
_db_lock = threading.Lock()

# User model
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

# Portfolio model
class Portfolio(db.Model):
    __tablename__ = 'portfolios'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text)
    image_path = db.Column(db.String(500))
    category = db.Column(db.String(100), index=True)
    medium = db.Column(db.String(100), index=True)  # 오일파스텔, 유화, 콘테 등
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_featured = db.Column(db.Boolean, default=False, index=True)
    sort_order = db.Column(db.Integer, default=0, index=True)

# Experience model
class Experience(db.Model):
    __tablename__ = 'experiences'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text)
    category = db.Column(db.String(100), index=True)  # travel, art, music, etc
    date = db.Column(db.Date, index=True)
    image_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

# 데이터베이스 초기화 락 테이블
class DatabaseLock(db.Model):
    __tablename__ = 'database_locks'
    
    id = db.Column(db.Integer, primary_key=True)
    lock_name = db.Column(db.String(100), unique=True, nullable=False)
    locked_by = db.Column(db.String(100), nullable=False)
    locked_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def get_instance_id():
    """현재 인스턴스의 고유 ID를 반환"""
    return f"{os.getpid()}_{int(time.time() * 1000)}"

def acquire_db_lock(lock_name, timeout=300):
    """데이터베이스 레벨에서 락을 획득"""
    instance_id = get_instance_id()
    expires_at = datetime.utcnow() + datetime.timedelta(seconds=timeout)
    
    try:
        # 기존 만료된 락 정리
        db.session.query(DatabaseLock).filter(
            DatabaseLock.expires_at < datetime.utcnow()
        ).delete()
        
        # 새로운 락 생성 시도
        lock = DatabaseLock(
            lock_name=lock_name,
            locked_by=instance_id,
            expires_at=expires_at
        )
        db.session.add(lock)
        db.session.commit()
        logger.info(f"Lock '{lock_name}' acquired by {instance_id}")
        return True
        
    except Exception as e:
        db.session.rollback()
        logger.info(f"Failed to acquire lock '{lock_name}': {e}")
        return False

def release_db_lock(lock_name):
    """데이터베이스 레벨에서 락을 해제"""
    instance_id = get_instance_id()
    try:
        db.session.query(DatabaseLock).filter(
            DatabaseLock.lock_name == lock_name,
            DatabaseLock.locked_by == instance_id
        ).delete()
        db.session.commit()
        logger.info(f"Lock '{lock_name}' released by {instance_id}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to release lock '{lock_name}': {e}")

def safe_init_db():
    """안전한 데이터베이스 초기화"""
    global _db_initialized
    
    if _db_initialized:
        return True
        
    with _db_lock:
        if _db_initialized:
            return True
            
        logger.info("Attempting to initialize database...")
        
        # 먼저 기본 연결 테스트
        max_retries = 10
        for attempt in range(max_retries):
            try:
                # 단순한 쿼리로 연결 테스트
                db.session.execute(db.text('SELECT 1'))
                db.session.commit()
                logger.info("Database connection successful")
                break
            except Exception as e:
                logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    logger.error("Failed to connect to database after all retries")
                    return False
                time.sleep(2)
        
        # 락 테이블 먼저 생성 (다른 테이블보다 우선)
        try:
            DatabaseLock.__table__.create(db.engine, checkfirst=True)
            logger.info("DatabaseLock table created/verified")
        except Exception as e:
            logger.error(f"Failed to create DatabaseLock table: {e}")
            return False
        
        # 초기화 락 획득 시도
        if not acquire_db_lock('db_init', timeout=180):
            logger.info("Another instance is initializing the database, waiting...")
            # 다른 인스턴스가 초기화 중이므로 대기
            for _ in range(60):  # 최대 60초 대기
                time.sleep(1)
                try:
                    # 테이블이 존재하는지 확인
                    db.session.execute(db.text("SELECT 1 FROM users LIMIT 1"))
                    logger.info("Database initialization completed by another instance")
                    _db_initialized = True
                    return True
                except:
                    continue
            
            logger.warning("Timeout waiting for database initialization")
            return False
        
        try:
            # 모든 테이블 생성
            db.create_all()
            logger.info("Database tables created")
            
            # 기본 관리자 계정 생성 (존재하지 않는 경우만)
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
                logger.info("Admin user created")
            else:
                logger.info("Admin user already exists")
            
            _db_initialized = True
            logger.info("Database initialization completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            db.session.rollback()
            return False
        finally:
            release_db_lock('db_init')

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
                
                # 업로드 폴더가 없으면 생성
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                
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
                    logger.error(f"Image processing error: {e}")
                
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
    
    # GET 요청시 최근 작품들을 가져와서 템플릿에 전달
    recent_works = Portfolio.query.order_by(Portfolio.created_at.desc()).limit(3).all()
    return render_template('add_work.html', recent_works=recent_works)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/health')
def health():
    """헬스체크 엔드포인트 - 데이터베이스 연결 상태도 확인"""
    try:
        # 데이터베이스 연결 테스트
        db.session.execute(db.text('SELECT 1'))
        db_status = 'healthy'
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = 'unhealthy'
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat(),
        'instance_id': get_instance_id()
    })

@app.route('/readiness')
def readiness():
    """레디니스 체크 - 서비스 준비 상태 확인"""
    if not _db_initialized:
        return jsonify({'status': 'not ready', 'reason': 'database not initialized'}), 503
    
    try:
        # 데이터베이스 기본 쿼리 테스트
        User.query.first()
        return jsonify({'status': 'ready', 'timestamp': datetime.utcnow().isoformat()})
    except Exception as e:
        return jsonify({'status': 'not ready', 'reason': str(e)}), 503

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

@app.route('/admin/delete_work/<int:work_id>', methods=['DELETE'])
@login_required
def delete_work(work_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '권한이 없습니다.'}), 403
    
    try:
        work = Portfolio.query.get_or_404(work_id)
        
        # 이미지 파일 삭제
        if work.image_path:
            try:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], work.image_path)
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                logger.error(f"Failed to delete image file: {e}")
        
        db.session.delete(work)
        db.session.commit()
        
        return jsonify({'success': True, 'message': '작품이 삭제되었습니다.'})
    except Exception as e:
        logger.error(f"Failed to delete work: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': '삭제 중 오류가 발생했습니다.'}), 500

# Application factory 패턴을 위한 초기화 함수
def create_app():
    """애플리케이션 팩토리 함수"""
    # 업로드 폴더 생성
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # 데이터베이스 안전 초기화
    with app.app_context():
        if not safe_init_db():
            logger.error("Failed to initialize database")
            raise RuntimeError("Database initialization failed")
    
    return app

# 애플리케이션 시작시 초기화
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=False)
else:
    # WSGI 서버에서 실행될 때
    with app.app_context():
        safe_init_db()