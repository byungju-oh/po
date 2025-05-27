from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, date
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

# 기술 프로젝트 모델 (기존 Portfolio 확장)
class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text)
    detailed_description = db.Column(db.Text)  # 상세 설명
    
    # 프로젝트 타입 (IT 중심)
    project_type = db.Column(db.String(50), index=True)  # 'tech', 'art', 'data', 'infra', 'ai'
    category = db.Column(db.String(100), index=True)  # 세부 카테고리
    
    # 기술 관련 필드
    tech_stack = db.Column(db.Text)  # JSON 형태로 저장 ["Python", "Django", "PostgreSQL"]
    github_url = db.Column(db.String(500))
    demo_url = db.Column(db.String(500))
    
    # 프로젝트 정보
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    team_size = db.Column(db.Integer)  # 팀 규모
    my_role = db.Column(db.String(200))  # 내 역할
    
    # 성과/결과
    achievements = db.Column(db.Text)  # 주요 성과
    metrics = db.Column(db.Text)  # 정량적 지표 (JSON)
    
    # 미디어
    image_path = db.Column(db.String(500))
    video_url = db.Column(db.String(500))  # YouTube, Vimeo 등
    document_path = db.Column(db.String(500))  # PDF 문서 등
    
    # 메타 정보
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_featured = db.Column(db.Boolean, default=False, index=True)
    is_public = db.Column(db.Boolean, default=True, index=True)
    sort_order = db.Column(db.Integer, default=0, index=True)
    
    # 조회수/좋아요 (선택사항)
    view_count = db.Column(db.Integer, default=0)
    like_count = db.Column(db.Integer, default=0)

# 기술 스택 모델
class TechStack(db.Model):
    __tablename__ = 'tech_stacks'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    category = db.Column(db.String(50), index=True)  # language, framework, database, cloud, tool
    icon_class = db.Column(db.String(100))  # Font Awesome 클래스
    color = db.Column(db.String(7))  # HEX 컬러
    proficiency = db.Column(db.Integer, default=0)  # 0-100 숙련도
    years_experience = db.Column(db.Float, default=0)  # 사용 경력 (년)
    is_primary = db.Column(db.Boolean, default=False)  # 주력 기술 여부
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 경력/경험 모델 (확장)
class Experience(db.Model):
    __tablename__ = 'experiences'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    company = db.Column(db.String(200))  # 회사명
    location = db.Column(db.String(200))  # 위치
    description = db.Column(db.Text)
    
    # 경험 타입
    experience_type = db.Column(db.String(50), index=True)  # work, education, certification, project, travel
    
    # 기간
    start_date = db.Column(db.Date, index=True)
    end_date = db.Column(db.Date)  # NULL이면 현재 진행중
    is_current = db.Column(db.Boolean, default=False)
    
    # 추가 정보
    skills_used = db.Column(db.Text)  # 사용한 기술들
    achievements = db.Column(db.Text)  # 주요 성과
    image_path = db.Column(db.String(500))
    link_url = db.Column(db.String(500))  # 관련 링크
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

# 자격증 모델
class Certification(db.Model):
    __tablename__ = 'certifications'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    issuer = db.Column(db.String(200), nullable=False)  # 발급기관
    issue_date = db.Column(db.Date, nullable=False)
    expire_date = db.Column(db.Date)  # 만료일 (선택사항)
    credential_id = db.Column(db.String(200))  # 자격증 ID
    credential_url = db.Column(db.String(500))  # 검증 URL
    
    # 카테고리
    category = db.Column(db.String(100), index=True)  # cloud, data, ai, security, etc
    
    # 이미지/문서
    image_path = db.Column(db.String(500))
    document_path = db.Column(db.String(500))
    
    # 메타 정보
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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

# [이전의 락 관련 함수들은 동일하게 유지]
def get_instance_id():
    """현재 인스턴스의 고유 ID를 반환"""
    return f"{os.getpid()}_{int(time.time() * 1000)}"

def acquire_db_lock(lock_name, timeout=300):
    """데이터베이스 레벨에서 락을 획득"""
    instance_id = get_instance_id()
    expires_at = datetime.utcnow() + datetime.timedelta(seconds=timeout)
    
    try:
        db.session.query(DatabaseLock).filter(
            DatabaseLock.expires_at < datetime.utcnow()
        ).delete()
        
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
        
        # 데이터베이스 연결 테스트
        max_retries = 10
        for attempt in range(max_retries):
            try:
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
        
        # 락 테이블 먼저 생성
        try:
            DatabaseLock.__table__.create(db.engine, checkfirst=True)
            logger.info("DatabaseLock table created/verified")
        except Exception as e:
            logger.error(f"Failed to create DatabaseLock table: {e}")
            return False
        
        # 초기화 락 획득
        if not acquire_db_lock('db_init', timeout=180):
            logger.info("Another instance is initializing the database, waiting...")
            for _ in range(60):
                time.sleep(1)
                try:
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
            
            # 기본 데이터 삽입
            init_default_data()
            
            _db_initialized = True
            logger.info("Database initialization completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            db.session.rollback()
            return False
        finally:
            release_db_lock('db_init')

def init_default_data():
    """기본 데이터 초기화"""
    # 기본 관리자 계정
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),
            is_admin=True
        )
        db.session.add(admin)
        logger.info("Admin user created")
    
    # 기본 기술 스택 데이터
    default_tech_stacks = [
        # Programming Languages
        {'name': 'Python', 'category': 'language', 'icon_class': 'fab fa-python', 'color': '#3776ab', 'proficiency': 90},
        {'name': 'JavaScript', 'category': 'language', 'icon_class': 'fab fa-js-square', 'color': '#f7df1e', 'proficiency': 85},
        {'name': 'Java', 'category': 'language', 'icon_class': 'fab fa-java', 'color': '#ed8b00', 'proficiency': 80},
        {'name': 'Go', 'category': 'language', 'icon_class': 'fas fa-code', 'color': '#00add8', 'proficiency': 75},
        
        # Frameworks
        {'name': 'Django', 'category': 'framework', 'icon_class': 'fas fa-server', 'color': '#092e20', 'proficiency': 85},
        {'name': 'Flask', 'category': 'framework', 'icon_class': 'fas fa-flask', 'color': '#000000', 'proficiency': 90},
        {'name': 'React', 'category': 'framework', 'icon_class': 'fab fa-react', 'color': '#61dafb', 'proficiency': 80},
        {'name': 'Vue.js', 'category': 'framework', 'icon_class': 'fab fa-vuejs', 'color': '#4fc08d', 'proficiency': 75},
        
        # Databases
        {'name': 'PostgreSQL', 'category': 'database', 'icon_class': 'fas fa-database', 'color': '#336791', 'proficiency': 85},
        {'name': 'MySQL', 'category': 'database', 'icon_class': 'fas fa-database', 'color': '#4479a1', 'proficiency': 90},
        {'name': 'MongoDB', 'category': 'database', 'icon_class': 'fas fa-leaf', 'color': '#47a248', 'proficiency': 80},
        {'name': 'Redis', 'category': 'database', 'icon_class': 'fas fa-memory', 'color': '#dc382d', 'proficiency': 85},
        
        # Cloud Platforms
        {'name': 'AWS', 'category': 'cloud', 'icon_class': 'fab fa-aws', 'color': '#ff9900', 'proficiency': 85},
        {'name': 'Google Cloud', 'category': 'cloud', 'icon_class': 'fab fa-google', 'color': '#4285f4', 'proficiency': 80},
        {'name': 'Azure', 'category': 'cloud', 'icon_class': 'fab fa-microsoft', 'color': '#0078d4', 'proficiency': 75},
        
        # DevOps Tools
        {'name': 'Docker', 'category': 'devops', 'icon_class': 'fab fa-docker', 'color': '#2496ed', 'proficiency': 90},
        {'name': 'Kubernetes', 'category': 'devops', 'icon_class': 'fas fa-dharmachakra', 'color': '#326ce5', 'proficiency': 85},
        {'name': 'Jenkins', 'category': 'devops', 'icon_class': 'fas fa-tools', 'color': '#d33833', 'proficiency': 80},
        {'name': 'Terraform', 'category': 'devops', 'icon_class': 'fas fa-layer-group', 'color': '#623ce4', 'proficiency': 85},
        
        # Data & AI
        {'name': 'Pandas', 'category': 'data', 'icon_class': 'fas fa-chart-bar', 'color': '#150458', 'proficiency': 90},
        {'name': 'NumPy', 'category': 'data', 'icon_class': 'fas fa-calculator', 'color': '#013243', 'proficiency': 85},
        {'name': 'TensorFlow', 'category': 'ai', 'icon_class': 'fas fa-brain', 'color': '#ff6f00', 'proficiency': 80},
        {'name': 'PyTorch', 'category': 'ai', 'icon_class': 'fas fa-fire', 'color': '#ee4c2c', 'proficiency': 75},
    ]
    
    for tech_data in default_tech_stacks:
        existing = TechStack.query.filter_by(name=tech_data['name']).first()
        if not existing:
            tech = TechStack(**tech_data)
            db.session.add(tech)
    
    # 기본 자격증 데이터
    default_certifications = [
        {
            'name': 'AWS Certified Solutions Architect',
            'issuer': 'Amazon Web Services',
            'issue_date': date(2023, 6, 15),
            'category': 'cloud',
            'is_featured': True
        },
        {
            'name': 'Certified Kubernetes Administrator (CKA)',
            'issuer': 'Cloud Native Computing Foundation',
            'issue_date': date(2023, 8, 20),
            'category': 'devops',
            'is_featured': True
        },
        {
            'name': '정보처리기사',
            'issuer': '한국산업인력공단',
            'issue_date': date(2022, 11, 25),
            'category': 'general',
            'is_featured': True
        }
    ]
    
    for cert_data in default_certifications:
        existing = Certification.query.filter_by(name=cert_data['name']).first()
        if not existing:
            cert = Certification(**cert_data)
            db.session.add(cert)
    
    try:
        db.session.commit()
        logger.info("Default data initialized")
    except Exception as e:
        logger.error(f"Failed to initialize default data: {e}")
        db.session.rollback()

# Routes
@app.route('/')
def index():
    # 주요 프로젝트 (기술 프로젝트 우선)
    featured_projects = Project.query.filter_by(is_featured=True, is_public=True)\
                                   .order_by(Project.sort_order, Project.created_at.desc())\
                                   .limit(6).all()
    
    # 최근 프로젝트
    recent_projects = Project.query.filter_by(is_public=True)\
                                 .order_by(Project.created_at.desc())\
                                 .limit(8).all()
    
    # 주요 기술 스택
    primary_techs = TechStack.query.filter_by(is_primary=True)\
                                 .order_by(TechStack.proficiency.desc())\
                                 .limit(8).all()
    
    # 최근 경력
    recent_experiences = Experience.query.filter(Experience.experience_type.in_(['work', 'education']))\
                                       .order_by(Experience.start_date.desc())\
                                       .limit(3).all()
    
    return render_template('index.html', 
                         featured_projects=featured_projects,
                         recent_projects=recent_projects,
                         primary_techs=primary_techs,
                         recent_experiences=recent_experiences)

@app.route('/portfolio')
def portfolio():
    project_type = request.args.get('type', 'all')
    category = request.args.get('category', 'all')
    
    query = Project.query.filter_by(is_public=True)
    
    if project_type != 'all':
        query = query.filter_by(project_type=project_type)
    
    if category != 'all':
        query = query.filter_by(category=category)
    
    projects = query.order_by(Project.sort_order, Project.created_at.desc()).all()
    
    # 프로젝트 타입별 카운트
    project_types = db.session.query(Project.project_type, db.func.count(Project.id))\
                             .filter_by(is_public=True)\
                             .group_by(Project.project_type)\
                             .all()
    
    # 카테고리별 카운트
    categories = db.session.query(Project.category, db.func.count(Project.id))\
                          .filter_by(is_public=True)\
                          .group_by(Project.category)\
                          .all()
    
    return render_template('portfolio.html', 
                         projects=projects,
                         project_types=dict(project_types),
                         categories=dict(categories),
                         current_type=project_type,
                         current_category=category)

@app.route('/project/<int:project_id>')
def project_detail(project_id):
    project = Project.query.get_or_404(project_id)
    
    if not project.is_public and (not current_user.is_authenticated or not current_user.is_admin):
        flash('접근 권한이 없습니다.', 'error')
        return redirect(url_for('portfolio'))
    
    # 조회수 증가
    project.view_count += 1
    db.session.commit()
    
    # 관련 프로젝트 (같은 카테고리)
    related_projects = Project.query.filter(
        Project.id != project_id,
        Project.category == project.category,
        Project.is_public == True
    ).order_by(Project.created_at.desc()).limit(3).all()
    
    return render_template('project_detail.html', 
                         project=project,
                         related_projects=related_projects)

@app.route('/about')
def about():
    # 경력 정보
    work_experiences = Experience.query.filter_by(experience_type='work')\
                                     .order_by(Experience.start_date.desc()).all()
    
    # 학력 정보
    education_experiences = Experience.query.filter_by(experience_type='education')\
                                          .order_by(Experience.start_date.desc()).all()
    
    # 자격증
    certifications = Certification.query.order_by(Certification.issue_date.desc()).all()
    
    # 기술 스택 (카테고리별)
    tech_categories = ['language', 'framework', 'database', 'cloud', 'devops', 'data', 'ai', 'tool']
    tech_stacks = {}
    for category in tech_categories:
        tech_stacks[category] = TechStack.query.filter_by(category=category)\
                                             .order_by(TechStack.proficiency.desc()).all()
    
    return render_template('about.html',
                         work_experiences=work_experiences,
                         education_experiences=education_experiences,
                         certifications=certifications,
                         tech_stacks=tech_stacks)

@app.route('/contact')
def contact():
    return render_template('contact.html')

# [관리자 관련 라우트들은 기존과 유사하지만 프로젝트 중심으로 수정]
@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('관리자 권한이 필요합니다.', 'error')
        return redirect(url_for('index'))
    
    projects = Project.query.order_by(Project.created_at.desc()).all()
    tech_stacks = TechStack.query.order_by(TechStack.proficiency.desc()).all()
    certifications = Certification.query.order_by(Certification.issue_date.desc()).all()
    experiences = Experience.query.order_by(Experience.created_at.desc()).all()
    
    return render_template('admin.html', 
                         projects=projects,
                         tech_stacks=tech_stacks,
                         certifications=certifications,
                         experiences=experiences)

# [기존의 다른 라우트들과 헬스체크 등은 동일하게 유지]
@app.route('/health')
def health():
    try:
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
    if not _db_initialized:
        return jsonify({'status': 'not ready', 'reason': 'database not initialized'}), 503
    
    try:
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

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 애플리케이션 시작시 초기화
if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    with app.app_context():
        if not safe_init_db():
            logger.error("Failed to initialize database")
            raise RuntimeError("Database initialization failed")
    app.run(host='0.0.0.0', port=5000, debug=False)
else:
    with app.app_context():
        safe_init_db()