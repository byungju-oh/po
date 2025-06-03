// static/js/pages/login.js - 로그인 페이지 전용 JavaScript

'use strict';

// 로그인 페이지 컨트롤러
window.LoginController = {
    // 설정
    config: {
        maxAttempts: 5,
        lockoutDuration: 300000, // 5분
        passwordMinLength: 6
    },

    // 상태
    state: {
        loginAttempts: 0,
        isLocked: false,
        capsLockOn: false
    },

    // 초기화
    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupPasswordToggle();
        this.setupAccessibility();
        this.setupSecurityFeatures();
        this.checkPreviousAttempts();
    },

    // 이벤트 리스너 설정
    setupEventListeners() {
        const form = document.getElementById('loginForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if (usernameInput) {
            usernameInput.addEventListener('input', () => this.clearFieldError(usernameInput));
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordInput?.focus();
                }
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.clearFieldError(passwordInput));
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    form?.dispatchEvent(new Event('submit'));
                }
            });
        }

        // 자동 포커스
        if (usernameInput && !usernameInput.value) {
            usernameInput.focus();
        }
    },

    // 폼 유효성 검사 설정
    setupFormValidation() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (usernameInput) {
            usernameInput.addEventListener('blur', () => this.validateUsername(usernameInput));
        }

        if (passwordInput) {
            passwordInput.addEventListener('blur', () => this.validatePassword(passwordInput));
        }
    },

    // 사용자명 유효성 검사
    validateUsername(input) {
        const value = input.value.trim();
        
        if (!value) {
            this.showFieldError(input, '사용자명을 입력해주세요.');
            return false;
        }

        if (value.length < 3) {
            this.showFieldError(input, '사용자명은 3자 이상이어야 합니다.');
            return false;
        }

        // 특수문자 검사 (영문, 숫자, 언더스코어만 허용)
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            this.showFieldError(input, '사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다.');
            return false;
        }

        this.clearFieldError(input);
        return true;
    },

    // 비밀번호 유효성 검사
    validatePassword(input) {
        const value = input.value;
        
        if (!value) {
            this.showFieldError(input, '비밀번호를 입력해주세요.');
            return false;
        }

        if (value.length < this.config.passwordMinLength) {
            this.showFieldError(input, `비밀번호는 ${this.config.passwordMinLength}자 이상이어야 합니다.`);
            return false;
        }

        this.clearFieldError(input);
        return true;
    },

    // 필드 에러 표시
    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        let feedback = field.parentNode.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            field.parentNode.appendChild(feedback);
        }
        feedback.textContent = message;

        // 접근성
        feedback.id = `${field.id}-error`;
        field.setAttribute('aria-describedby', feedback.id);
        field.setAttribute('aria-invalid', 'true');

        // 흔들기 애니메이션
        this.shakeField(field);
    },

    // 필드 에러 제거
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }

        field.removeAttribute('aria-describedby');
        field.removeAttribute('aria-invalid');
    },

    // 필드 흔들기 애니메이션
    shakeField(field) {
        field.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            field.style.animation = '';
        }, 500);
    },

    // 비밀번호 보기/숨기기 토글 설정
    setupPasswordToggle() {
        const toggleBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                const icon = toggleBtn.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
                
                // 접근성
                toggleBtn.setAttribute('aria-label', 
                    type === 'password' ? '비밀번호 보기' : '비밀번호 숨기기'
                );
                
                // 버튼 애니메이션
                toggleBtn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    toggleBtn.style.transform = 'scale(1)';
                }, 150);

                // 포커스 유지
                passwordInput.focus();
            });
        }
    },

    // 접근성 설정
    setupAccessibility() {
        // 키보드 네비게이션 감지
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('using-keyboard');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('using-keyboard');
        });

        // 폼 필드 라벨 연결 확인
        const formFields = document.querySelectorAll('#loginForm input');
        formFields.forEach(field => {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label && !field.getAttribute('aria-labelledby')) {
                field.setAttribute('aria-labelledby', field.id + '-label');
                label.id = field.id + '-label';
            }
        });
    },

    // 보안 기능 설정
    setupSecurityFeatures() {
        // Caps Lock 감지
        document.addEventListener('keydown', (e) => {
            this.detectCapsLock(e);
        });

        // 개발자 도구 감지 (간단한 방법)
        this.detectDevTools();

        // 브루트 포스 공격 방지
        this.loadAttemptHistory();
    },

    // Caps Lock 감지
    detectCapsLock(event) {
        const capsLockOn = event.getModifierState && event.getModifierState('CapsLock');
        
        if (capsLockOn !== this.state.capsLockOn) {
            this.state.capsLockOn = capsLockOn;
            
            if (capsLockOn) {
                this.showCapsLockWarning();
            } else {
                this.hideCapsLockWarning();
            }
        }
    },

    // Caps Lock 경고 표시
    showCapsLockWarning() {
        let warning = document.querySelector('.caps-lock-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'alert alert-warning caps-lock-warning mt-2';
            warning.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Caps Lock이 켜져 있습니다.';
            
            const passwordGroup = document.getElementById('password').parentNode;
            passwordGroup.appendChild(warning);

            setTimeout(() => {
                if (warning.parentNode) {
                    warning.remove();
                }
            }, 5000);
        }
    },

    // Caps Lock 경고 숨기기
    hideCapsLockWarning() {
        const warning = document.querySelector('.caps-lock-warning');
        if (warning) {
            warning.remove();
        }
    },

    // 개발자 도구 감지 (기본적인 방법)
    detectDevTools() {
        let devtools = {
            open: false,
            orientation: null
        };

        const threshold = 160;

        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.log('Developer tools detected');
                    // 필요시 경고 메시지 표시
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    },

    // 로그인 시도 이력 로드
    loadAttemptHistory() {
        const attempts = Utils.storage.get('login_attempts', []);
        const now = Date.now();
        
        // 24시간 이내의 시도만 유지
        const recentAttempts = attempts.filter(attempt => 
            now - attempt.timestamp < 24 * 60 * 60 * 1000
        );
        
        this.state.loginAttempts = recentAttempts.length;
        Utils.storage.set('login_attempts', recentAttempts);

        // 잠금 상태 확인
        this.checkLockout();
    },

    // 이전 시도 확인
    checkPreviousAttempts() {
        const lastLockout = Utils.storage.get('last_lockout', 0);
        const now = Date.now();
        
        if (now - lastLockout < this.config.lockoutDuration) {
            this.setLockout(this.config.lockoutDuration - (now - lastLockout));
        }
    },

    // 잠금 상태 확인
    checkLockout() {
        if (this.state.loginAttempts >= this.config.maxAttempts) {
            this.setLockout(this.config.lockoutDuration);
        }
    },

    // 계정 잠금 설정
    setLockout(duration) {
        this.state.isLocked = true;
        const form = document.getElementById('loginForm');
        const inputs = form.querySelectorAll('input, button');
        
        inputs.forEach(input => input.disabled = true);
        
        Utils.storage.set('last_lockout', Date.now());
        
        this.showLockoutMessage(duration);
        
        setTimeout(() => {
            this.releaseLockout();
        }, duration);
    },

    // 잠금 해제
    releaseLockout() {
        this.state.isLocked = false;
        this.state.loginAttempts = 0;
        
        const form = document.getElementById('loginForm');
        const inputs = form.querySelectorAll('input, button');
        
        inputs.forEach(input => input.disabled = false);
        
        Utils.storage.remove('last_lockout');
        Utils.storage.remove('login_attempts');
        
        UI.showToast('다시 로그인을 시도할 수 있습니다.', 'info');
    },

    // 잠금 메시지 표시
    showLockoutMessage(duration) {
        const minutes = Math.ceil(duration / 60000);
        const message = `보안을 위해 ${minutes}분간 로그인이 제한됩니다.`;
        
        UI.showToast(message, 'warning', duration);
        
        // 폼 위에 카운트다운 표시
        this.showCountdown(duration);
    },

    // 카운트다운 표시
    showCountdown(duration) {
        const form = document.getElementById('loginForm');
        let countdown = document.querySelector('.lockout-countdown');
        
        if (!countdown) {
            countdown = document.createElement('div');
            countdown.className = 'alert alert-danger lockout-countdown';
            form.insertBefore(countdown, form.firstChild);
        }

        const endTime = Date.now() + duration;
        
        const updateCountdown = () => {
            const remaining = endTime - Date.now();
            
            if (remaining <= 0) {
                countdown.remove();
                return;
            }
            
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            countdown.innerHTML = `
                <i class="fas fa-lock me-2"></i>
                <strong>계정 일시 잠금</strong><br>
                ${minutes}분 ${seconds}초 후 다시 시도할 수 있습니다.
            `;
            
            setTimeout(updateCountdown, 1000);
        };
        
        updateCountdown();
    },

    // 폼 제출 처리
    async handleSubmit(event) {
        event.preventDefault();

        if (this.state.isLocked) {
            UI.showToast('계정이 일시적으로 잠겨있습니다.', 'warning');
            return;
        }

        const form = event.target;
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        // 유효성 검사
        const isUsernameValid = this.validateUsername(usernameInput);
        const isPasswordValid = this.validatePassword(passwordInput);

        if (!isUsernameValid || !isPasswordValid) {
            return;
        }

        // 제출 버튼 상태 변경
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setFormLoading(true, submitBtn);
            
            // 로그인 요청
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(new FormData(form))
            });

            if (response.ok) {
                if (response.redirected) {
                    // 성공 시 리다이렉트
                    this.handleLoginSuccess();
                    setTimeout(() => {
                        window.location.href = response.url;
                    }, 1000);
                } else {
                    const data = await response.text();
                    this.handleLoginFailure('로그인에 실패했습니다.');
                }
            } else {
                this.handleLoginFailure('서버 오류가 발생했습니다.');
            }

        } catch (error) {
            console.error('로그인 오류:', error);
            this.handleLoginFailure('네트워크 오류가 발생했습니다.');
        } finally {
            this.setFormLoading(false, submitBtn, originalText);
        }
    },

    // 로그인 성공 처리
    handleLoginSuccess() {
        // 시도 이력 초기화
        Utils.storage.remove('login_attempts');
        Utils.storage.remove('last_lockout');
        
        UI.showToast('로그인 성공! 대시보드로 이동합니다.', 'success');
        
        // 분석 이벤트
        if (typeof gtag !== 'undefined') {
            gtag('event', 'login', {
                'event_category': 'Authentication',
                'event_label': 'Success'
            });
        }
    },

    // 로그인 실패 처리
    handleLoginFailure(message) {
        this.state.loginAttempts++;
        
        // 시도 이력 저장
        const attempts = Utils.storage.get('login_attempts', []);
        attempts.push({
            timestamp: Date.now(),
            ip: this.getUserIP()
        });
        Utils.storage.set('login_attempts', attempts);

        // 에러 메시지 표시
        this.showError(message);
        
        // 필드 흔들기
        this.shakeField(document.getElementById('username'));
        this.shakeField(document.getElementById('password'));
        
        // 비밀번호 필드 초기화
        document.getElementById('password').value = '';
        document.getElementById('password').focus();

        // 잠금 확인
        this.checkLockout();

        // 분석 이벤트
        if (typeof gtag !== 'undefined') {
            gtag('event', 'login_failed', {
                'event_category': 'Authentication',
                'event_label': 'Failed',
                'value': this.state.loginAttempts
            });
        }
    },

    // 사용자 IP 가져오기 (간단한 방법)
    getUserIP() {
        return 'unknown'; // 실제로는 서버에서 제공하거나 외부 API 사용
    },

    // 에러 메시지 표시
    showError(message) {
        // 기존 에러 메시지 제거
        const existingError = document.querySelector('.login-error');
        if (existingError) {
            existingError.remove();
        }

        // 새 에러 메시지 생성
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show login-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // 폼 상단에 삽입
        const form = document.getElementById('loginForm');
        form.insertBefore(errorDiv, form.firstChild);

        // 자동 제거 (5초 후)
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    },

    // 로딩 상태 설정
    setFormLoading(isLoading, submitBtn, originalText = '') {
        const form = document.getElementById('loginForm');
        
        if (isLoading) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>로그인 중...';
            submitBtn.disabled = true;
            form.classList.add('form-loading');
        } else {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            form.classList.remove('form-loading');
        }
    }
};

// 도움말 모달 컨트롤러
const HelpModalController = {
    init() {
        this.setupModal();
        this.setupKeyboardShortcuts();
    },

    setupModal() {
        const modal = document.getElementById('helpModal');
        if (!modal) return;

        modal.addEventListener('shown.bs.modal', () => {
            const firstButton = modal.querySelector('button');
            if (firstButton) {
                firstButton.focus();
            }
        });
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F1: 도움말 모달 열기
            if (e.key === 'F1') {
                e.preventDefault();
                const helpBtn = document.querySelector('[data-bs-target="#helpModal"]');
                if (helpBtn) {
                    helpBtn.click();
                }
            }
        });
    }
};

// 보안 모니터링
const SecurityController = {
    init() {
        this.monitorSuspiciousActivity();
        this.setupCSRFProtection();
    },

    monitorSuspiciousActivity() {
        // 빠른 연속 클릭 감지
        let clickCount = 0;
        let clickTimer = null;

        document.addEventListener('click', () => {
            clickCount++;
            
            if (!clickTimer) {
                clickTimer = setTimeout(() => {
                    if (clickCount > 10) {
                        console.warn('Suspicious clicking activity detected');
                        // 필요시 보안 조치
                    }
                    clickCount = 0;
                    clickTimer = null;
                }, 1000);
            }
        });

        // 복사/붙여넣기 모니터링
        document.addEventListener('paste', (e) => {
            const target = e.target;
            if (target.type === 'password') {
                // 비밀번호 필드에 붙여넣기 시 경고
                setTimeout(() => {
                    UI.showToast('보안을 위해 비밀번호를 직접 입력하는 것을 권장합니다.', 'warning', 3000);
                }, 100);
            }
        });
    },

    setupCSRFProtection() {
        // CSRF 토큰이 있는 경우 자동으로 폼에 추가
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            const form = document.getElementById('loginForm');
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'csrf_token';
            input.value = csrfToken.getAttribute('content');
            form.appendChild(input);
        }
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    // 모든 컨트롤러 초기화
    LoginController.init();
    HelpModalController.init();
    SecurityController.init();
    
    // 브라우저 자동완성 처리
    setTimeout(() => {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput && usernameInput.value) {
            LoginController.validateUsername(usernameInput);
        }
        
        if (passwordInput && passwordInput.value) {
            LoginController.validatePassword(passwordInput);
        }
    }, 1000);
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 페이지가 숨겨질 때 보안 강화
            console.log('Page hidden - enhanced security mode');
        }
    });
});

// 전역 에러 핸들러
window.addEventListener('error', function(e) {
    console.error('Login page error:', e.error);
    
    // 사용자 친화적 에러 메시지
    if (e.error.message.includes('network') || e.error.message.includes('fetch')) {
        UI.showToast('네트워크 연결을 확인해주세요.', 'warning');
    }
});

// 유틸리티 함수들
window.LoginUtils = {
    // 패스워드 강도 검사
    checkPasswordStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        strength = Object.values(checks).filter(Boolean).length;
        
        return {
            score: strength,
            checks: checks,
            level: strength < 2 ? 'weak' : strength < 4 ? 'medium' : 'strong'
        };
    },

    // 사용자명 유효성 검사
    validateUsername(username) {
        const errors = [];
        
        if (username.length < 3) {
            errors.push('사용자명은 3자 이상이어야 합니다.');
        }
        
        if (username.length > 20) {
            errors.push('사용자명은 20자 이하여야 합니다.');
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다.');
        }
        
        if (/^[0-9]+$/.test(username)) {
            errors.push('사용자명은 숫자로만 구성될 수 없습니다.');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // 브라우저 지원 여부 확인
    checkBrowserSupport() {
        const features = {
            localStorage: typeof Storage !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            promise: typeof Promise !== 'undefined',
            eventListener: typeof addEventListener !== 'undefined'
        };
        
        const unsupported = Object.keys(features).filter(key => !features[key]);
        
        if (unsupported.length > 0) {
            console.warn('Unsupported browser features:', unsupported);
            UI.showToast('브라우저가 최신 버전이 아닙니다. 업데이트를 권장합니다.', 'warning');
        }
        
        return unsupported.length === 0;
    },

    // 디바이스 정보 수집
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenWidth: screen.width,
            screenHeight: screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
};