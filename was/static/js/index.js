// static/js/pages/index.js - 메인 페이지 전용 JavaScript

'use strict';

// 메인 페이지 컨트롤러
window.IndexController = {
    // 초기화
    init() {
        this.animateCounters();
        this.setupScrollAnimations();
        this.setupProgressBars();
        this.setupCardHoverEffects();
        this.setupPerformanceOptimization();
    },

    // 통계 카운터 애니메이션
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target')) || parseInt(counter.textContent);
            const duration = 2000; // 2초
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

    // 스크롤 애니메이션 설정
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // 애니메이션할 요소들 관찰
        document.querySelectorAll('.project-card, .tech-category-card, .timeline-item, .stat-card').forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    },

    // 프로그레스 바 애니메이션
    setupProgressBars() {
        const progressBars = document.querySelectorAll('.progress');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressBar = entry.target;
                    const width = progressBar.style.width;
                    progressBar.style.width = '0%';
                    
                    setTimeout(() => {
                        progressBar.style.width = width;
                    }, 300);
                    
                    observer.unobserve(progressBar);
                }
            });
        });
        
        progressBars.forEach(bar => observer.observe(bar));
    },

    // 카드 호버 효과 설정
    setupCardHoverEffects() {
        // 프로젝트 카드 호버 효과
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // 기술 카드 호버 효과
        document.querySelectorAll('.tech-category-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    },

    // 성능 최적화 설정
    setupPerformanceOptimization() {
        // 스크롤 이벤트 쓰로틀링
        let ticking = false;

        function updateScrollElements() {
            // 스크롤 기반 애니메이션 로직
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateScrollElements);
                ticking = true;
            }
        });
    }
};

// 이력서 다운로드 함수
function downloadResume() {
    // 실제 구현에서는 서버에서 PDF 파일을 제공
    alert('이력서 다운로드 기능이 곧 제공될 예정입니다.');
    
    // 예시: 실제 구현
    // const link = document.createElement('a');
    // link.href = '/static/resume.pdf';
    // link.download = 'IT_Engineer_Resume.pdf';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
}

// 부드러운 스크롤 설정
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 스킬 항목 클릭 시 상세 정보 표시 (선택사항)
function showSkillDetails(skillName) {
    // 모달이나 툴팁으로 기술 상세 정보 표시
    console.log('Showing details for:', skillName);
}

// 프린트용 스타일 적용 (선택사항)
function printFriendlyView() {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
}

// 성능 최적화: 이미지 지연 로딩
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// 키보드 네비게이션 지원
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('using-keyboard');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('using-keyboard');
    });
}

// 스크롤 진행률 표시 (선택사항)
function updateScrollProgress() {
    const scrollProgress = document.getElementById('scroll-progress');
    if (scrollProgress) {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = scrollPercent + '%';
    }
}

// 다크 모드 토글 (선택사항)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// 로컬 스토리지에서 다크 모드 설정 불러오기
function loadDarkModePreference() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
}

// 애니메이션 비활성화 옵션 (접근성)
function checkReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Index page loaded');
    
    // 메인 컨트롤러 초기화
    IndexController.init();
    
    // 기타 기능들 초기화
    setupSmoothScrolling();
    setupKeyboardNavigation();
    lazyLoadImages();
    loadDarkModePreference();
    checkReducedMotion();
    
    // 스크롤 진행률 업데이트
    window.addEventListener('scroll', Utils.throttle(updateScrollProgress, 16));
    
    // 리사이즈 이벤트 처리
    window.addEventListener('resize', Utils.debounce(() => {
        // 모바일 뷰포트 높이 조정
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }, 250));
});

// 전역 에러 핸들러
window.addEventListener('error', function(e) {
    console.error('Index page error:', e.error);
    
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
    module.exports = { IndexController, downloadResume };
}