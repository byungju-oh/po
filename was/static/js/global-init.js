// static/js/global-init.js - 전역 초기화 스크립트

'use strict';

// 전역 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded:', window.location.pathname);
    
    // 다크모드 초기화
    if (typeof DarkMode !== 'undefined') {
        DarkMode.init();
    }
    
    // 현재 페이지에 따른 네비게이션 활성화
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
    
    // 뒤로가기 버튼 이벤트 설정
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // 스크롤 진행률 바 업데이트
    window.addEventListener('scroll', Utils.throttle(updateScrollProgress, 16));
    
    // 다크모드 토글 이벤트
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            if (typeof DarkMode !== 'undefined') {
                DarkMode.toggle();
            }
        });
    }
    
    // 모바일 뷰포트 높이 설정
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setVH();
    window.addEventListener('resize', Utils.debounce(setVH, 250));
    
    // 서비스 워커 등록 (PWA 지원 - 선택사항)
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    }
});

// 스크롤 진행률 업데이트
function updateScrollProgress() {
    const scrollProgress = document.getElementById('scroll-progress');
    if (scrollProgress) {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = Math.max(0, Math.min(100, (scrollTop / docHeight) * 100));
        scrollProgress.style.width = scrollPercent + '%';
    }
}

// 성능 모니터링
window.addEventListener('load', function() {
    if ('performance' in window) {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('Performance:', {
                    'Page Load': Math.round(perfData.loadEventEnd - perfData.loadEventStart) + 'ms',
                    'DOM Content Loaded': Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart) + 'ms',
                    'First Paint': performance.getEntriesByType('paint')[0]?.startTime || 'N/A'
                });
            }
        }, 100);
    }
});

// Google Analytics (필요시 활성화)
if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href
    });
}