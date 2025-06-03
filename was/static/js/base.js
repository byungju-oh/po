// static/js/base.js - 공통 JavaScript 기능

'use strict';

// 전역 유틸리티 객체
window.Utils = {
    // 디바운스 함수
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // 쓰로틀 함수
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // 요소 페이드인 애니메이션
    fadeIn(element, duration = 600) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = `all ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 10);
    },

    // 요소 페이드아웃 애니메이션
    fadeOut(element, duration = 600) {
        element.style.transition = `all ${duration}ms ease`;
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    },

    // 부드러운 스크롤
    smoothScrollTo(target, duration = 1000) {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        const targetPosition = targetElement.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    },

    // 요소가 뷰포트에 있는지 확인
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // 로컬 스토리지 안전하게 사용
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('localStorage not available:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('localStorage not available:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('localStorage not available:', e);
                return false;
            }
        }
    },

    // 현재 날짜/시간 포맷팅
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        const formats = {
            'YYYY-MM-DD': `${year}-${month}-${day}`,
            'DD/MM/YYYY': `${day}/${month}/${year}`,
            'MM/DD/YYYY': `${month}/${day}/${year}`,
            'YYYY년 MM월 DD일': `${year}년 ${month}월 ${day}일`
        };
        
        return formats[format] || formats['YYYY-MM-DD'];
    },

    // URL 파라미터 가져오기
    getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    // 이메일 유효성 검사
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // 문자열 줄이기
    truncateText(text, length = 100, suffix = '...') {
        if (text.length <= length) return text;
        return text.substring(0, length) + suffix;
    }
};

// 전역 애니메이션 컨트롤러
window.Animations = {
    // 스크롤 애니메이션 관찰자
    observeElements(selector = '.fade-in', options = {}) {
        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            ...options
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // 순차적 애니메이션을 위한 지연
                    const delay = entry.target.dataset.delay || 0;
                    if (delay > 0) {
                        setTimeout(() => {
                            entry.target.classList.add('visible');
                        }, delay);
                    }
                }
            });
        }, defaultOptions);

        document.querySelectorAll(selector).forEach(el => {
            observer.observe(el);
        });

        return observer;
    },

    // 카운터 애니메이션
    animateCounters(selector = '.stat-number') {
        const counters = document.querySelectorAll(selector);
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target') || counter.textContent);
            const duration = parseInt(counter.getAttribute('data-duration')) || 2000;
            const step = target / (duration / 16); // 60fps 기준
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current);
            }, 16);
        });
    },

    // 프로그레스 바 애니메이션
    animateProgressBars(selector = '.progress') {
        const progressBars = document.querySelectorAll(selector);
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressBar = entry.target;
                    const width = progressBar.style.width || progressBar.getAttribute('data-width') || '0%';
                    const delay = parseInt(progressBar.getAttribute('data-delay')) || 300;
                    
                    progressBar.style.width = '0%';
                    
                    setTimeout(() => {
                        progressBar.style.width = width;
                    }, delay);
                    
                    observer.unobserve(progressBar);
                }
            });
        });
        
        progressBars.forEach(bar => observer.observe(bar));
    },

    // 타이핑 애니메이션
    typeText(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const timer = setInterval(() => {
            element.textContent += text.charAt(i);
            i++;
            if (i > text.length) {
                clearInterval(timer);
            }
        }, speed);
    },

    // 순차적 페이드인
    staggeredFadeIn(selector, delay = 100) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            setTimeout(() => {
                Utils.fadeIn(element);
            }, index * delay);
        });
    }
};

// 전역 UI 컨트롤러
window.UI = {
    // 카드 호버 효과 초기화
    initCardHoverEffects(selector = '.card-hover') {
        document.querySelectorAll(selector).forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    },

    // 부드러운 스크롤 초기화
    initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    Utils.smoothScrollTo(target);
                }
            });
        });
    },

    // 툴팁 초기화
    initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    },

    // 팝오버 초기화
    initPopovers() {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    },

    // 알림 토스트 표시
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.querySelector('.toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },

    // 토스트 컨테이너 생성
    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1050';
        document.body.appendChild(container);
        return container;
    },

    // 로딩 스피너 표시/숨김
    showLoader(target = 'body') {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        const loader = document.createElement('div');
        loader.className = 'loader-overlay';
        loader.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        
        loader.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255,255,255,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(loader);
        
        return loader;
    },

    hideLoader(target = 'body') {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        const loader = targetElement?.querySelector('.loader-overlay');
        if (loader) {
            loader.remove();
        }
    },

    // 확인 모달 표시
    confirmDialog(message, title = '확인', onConfirm = null) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                        <button type="button" class="btn btn-primary confirm-btn">확인</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            if (onConfirm) onConfirm();
            bsModal.hide();
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
        
        bsModal.show();
    }
};

// 전역 폼 컨트롤러
window.Forms = {
    // 폼 유효성 검사
    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        const errors = [];

        requiredFields.forEach(field => {
            const value = field.value.trim();
            const fieldName = field.getAttribute('name') || field.id;

            // 필수 필드 검사
            if (!value) {
                this.showFieldError(field, `${fieldName}은(는) 필수 항목입니다.`);
                isValid = false;
                errors.push(`${fieldName} is required`);
                return;
            }

            // 이메일 유효성 검사
            if (field.type === 'email' && !Utils.isValidEmail(value)) {
                this.showFieldError(field, '올바른 이메일 주소를 입력해주세요.');
                isValid = false;
                errors.push(`${fieldName} is invalid email`);
                return;
            }

            // 최소 길이 검사
            const minLength = field.getAttribute('minlength');
            if (minLength && value.length < parseInt(minLength)) {
                this.showFieldError(field, `최소 ${minLength}자 이상 입력해주세요.`);
                isValid = false;
                errors.push(`${fieldName} is too short`);
                return;
            }

            // 성공시 에러 메시지 제거
            this.clearFieldError(field);
        });

        return { isValid, errors };
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
    },

    // 필드 에러 제거
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    },

    // 폼 제출 처리
    handleSubmit(form, onSubmit) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const validation = this.validateForm(form);
            if (!validation.isValid) {
                return;
            }

            const submitBtn = form.querySelector('[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>처리 중...';
                
                if (onSubmit) {
                    await onSubmit(new FormData(form));
                }
            } catch (error) {
                console.error('Form submission error:', error);
                UI.showToast('처리 중 오류가 발생했습니다.', 'danger');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
};

// 페이지 로드시 공통 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Base JavaScript loaded');
    
    // 공통 기능 초기화
    initializeCommonFeatures();
    
    // 접근성 개선
    setupAccessibility();
    
    // 성능 모니터링
    setupPerformanceMonitoring();
});

// 공통 기능 초기화
function initializeCommonFeatures() {
    // UI 컴포넌트 초기화
    UI.initCardHoverEffects();
    UI.initSmoothScrolling();
    UI.initTooltips();
    UI.initPopovers();
    
    // 애니메이션 초기화
    Animations.observeElements();
    
    // 스크롤 이벤트 최적화
    setupOptimizedScrollEvents();
    
    // 리사이즈 이벤트 최적화
    setupOptimizedResizeEvents();
}

// 접근성 설정
function setupAccessibility() {
    // 키보드 네비게이션 감지
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('using-keyboard');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('using-keyboard');
    });

    // 스킵 링크 추가
    if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.className = 'skip-link sr-only';
        skipLink.textContent = '메인 콘텐츠로 건너뛰기';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
}

// 최적화된 스크롤 이벤트
function setupOptimizedScrollEvents() {
    let ticking = false;

    function updateScrollElements() {
        // 스크롤 진행률 업데이트
        updateScrollProgress();
        
        // 네비게이션 바 스타일 변경
        updateNavbarOnScroll();
        
        ticking = false;
    }

    window.addEventListener('scroll', Utils.throttle(() => {
        if (!ticking) {
            requestAnimationFrame(updateScrollElements);
            ticking = true;
        }
    }, 16));
}

// 스크롤 진행률 업데이트
function updateScrollProgress() {
    const scrollProgress = document.getElementById('scroll-progress');
    if (scrollProgress) {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = scrollPercent + '%';
    }
}

// 네비게이션 바 스크롤 효과
function updateNavbarOnScroll() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    }
}

// 최적화된 리사이즈 이벤트
function setupOptimizedResizeEvents() {
    window.addEventListener('resize', Utils.debounce(() => {
        // 모바일 뷰포트 높이 조정
        updateMobileViewportHeight();
        
        // 차트나 그래프 리사이즈 (있다면)
        window.dispatchEvent(new Event('optimizedResize'));
    }, 250));
}

// 모바일 뷰포트 높이 조정
function updateMobileViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// 성능 모니터링
function setupPerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }
}

// 다크모드 토글 (선택사항)
window.DarkMode = {
    toggle() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        Utils.storage.set('darkMode', isDark);
        
        // 다크모드 아이콘 업데이트
        this.updateIcon(isDark);
    },

    init() {
        const savedMode = Utils.storage.get('darkMode', false);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedMode || (!savedMode && prefersDark)) {
            document.body.classList.add('dark-mode');
            this.updateIcon(true);
        }
    },

    updateIcon(isDark) {
        const icon = document.querySelector('.dark-mode-toggle i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
};

// 전역 에러 핸들러
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    
    // 사용자에게 친화적인 에러 메시지 (선택사항)
    if (window.UI && typeof UI.showToast === 'function') {
        UI.showToast('예기치 않은 오류가 발생했습니다.', 'danger');
    }
});

// Promise rejection 핸들러
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

// 익스포트 (모듈 시스템 사용시)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, Animations, UI, Forms, DarkMode };
}