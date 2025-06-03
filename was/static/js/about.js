// static/js/pages/about.js - 소개 페이지 전용 JavaScript

'use strict';

// 소개 페이지 컨트롤러
window.AboutController = {
    // 초기화
    init() {
        this.setupScrollAnimations();
        this.animateProgressBars();
        this.initializeCardEffects();
        this.setupInteractiveElements();
    },

    // 스크롤 애니메이션 관찰자
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
        document.querySelectorAll('.tech-category-card, .cert-card, .education-card, .timeline-item, .country-item').forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    },

    // 프로그레스 바 애니메이션
    animateProgressBars() {
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

    // 카드 호버 효과
    initializeCardEffects() {
        // 기술 카드 호버 효과
        document.querySelectorAll('.tech-category-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
        
        // 자격증 카드 호버 효과
        document.querySelectorAll('.cert-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // 교육 카드 호버 효과
        document.querySelectorAll('.education-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });

        // 국가 아이템 호버 효과
        document.querySelectorAll('.country-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    },

    // 대화형 요소 설정
    setupInteractiveElements() {
        // 기술 스킬 항목 클릭 시 상세 정보 표시
        document.querySelectorAll('.tech-skill-item').forEach(item => {
            item.addEventListener('click', () => {
                const techName = item.querySelector('.tech-name').textContent;
                this.showSkillDetails(techName);
            });
        });

        // 자격증 검증 링크 처리
        document.querySelectorAll('.cert-verify a').forEach(link => {
            link.addEventListener('click', (e) => {
                // 외부 링크 클릭 시 분석 이벤트 전송
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'cert_verify_click', {
                        'event_category': 'Certification',
                        'event_label': link.href
                    });
                }
            });
        });

        // 소셜 링크 분석
        document.querySelectorAll('.social-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (typeof gtag !== 'undefined') {
                    const platform = this.getSocialPlatform(link.href);
                    gtag('event', 'social_link_click', {
                        'event_category': 'Social',
                        'event_label': platform
                    });
                }
            });
        });

        // 연락처 버튼 클릭 추적
        document.querySelectorAll('.cta-buttons a').forEach(link => {
            link.addEventListener('click', () => {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'cta_click', {
                        'event_category': 'CTA',
                        'event_label': link.textContent.trim()
                    });
                }
            });
        });
    },

    // 기술 상세 정보 표시
    showSkillDetails(skillName) {
        const skillDetails = {
            'Python': {
                experience: '5년',
                level: 'Expert',
                description: '웹 개발, 데이터 분석, 머신러닝 등 다양한 분야에서 활용',
                projects: ['데이터 파이프라인 구축', 'Django 웹 애플리케이션', 'ML 모델 개발']
            },
            'JavaScript': {
                experience: '4년',
                level: 'Advanced',
                description: '프론트엔드 및 Node.js 백엔드 개발',
                projects: ['React SPA', 'Vue.js 대시보드', 'Node.js API 서버']
            },
            'AWS': {
                experience: '4년',
                level: 'Advanced',
                description: '클라우드 인프라 설계 및 운영',
                projects: ['EC2/ECS 배포', 'Lambda 서버리스', 'S3/CloudFront CDN']
            },
            'Docker': {
                experience: '4년',
                level: 'Expert',
                description: '컨테이너화 및 오케스트레이션',
                projects: ['마이크로서비스 아키텍처', 'CI/CD 파이프라인', 'Kubernetes 배포']
            }
        };

        const skill = skillDetails[skillName];
        if (skill) {
            this.showSkillModal(skillName, skill);
        }
    },

    // 기술 상세 모달 표시
    showSkillModal(skillName, skillData) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-code me-2"></i>${skillName}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-6">
                                <strong>경험:</strong> ${skillData.experience}
                            </div>
                            <div class="col-6">
                                <strong>수준:</strong> 
                                <span class="badge bg-primary">${skillData.level}</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <strong>설명:</strong>
                            <p class="mt-2">${skillData.description}</p>
                        </div>
                        <div>
                            <strong>주요 프로젝트:</strong>
                            <ul class="mt-2">
                                ${skillData.projects.map(project => `<li>${project}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
        
        bsModal.show();
    },

    // 소셜 플랫폼 식별
    getSocialPlatform(url) {
        if (url.includes('github')) return 'GitHub';
        if (url.includes('linkedin')) return 'LinkedIn';
        if (url.includes('twitter')) return 'Twitter';
        if (url.includes('instagram')) return 'Instagram';
        if (url.includes('facebook')) return 'Facebook';
        return 'Unknown';
    }
};

// 이력서 다운로드 함수
function downloadResume() {
    // 실제 구현에서는 서버에서 PDF 파일을 제공
    UI.showToast('이력서 다운로드 기능이 곧 제공될 예정입니다.', 'info');
    
    // 예시: 실제 구현
    // const link = document.createElement('a');
    // link.href = '/static/resume.pdf';
    // link.download = 'IT_Engineer_Resume.pdf';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    
    // 분석 이벤트 전송
    if (typeof gtag !== 'undefined') {
        gtag('event', 'resume_download', {
            'event_category': 'Download',
            'event_label': 'Resume PDF'
        });
    }
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
    AboutController.showSkillDetails(skillName);
}

// 프린트용 스타일 적용 (선택사항)
function printFriendlyView() {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
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
    console.log('About page loaded');
    
    // 메인 컨트롤러 초기화
    AboutController.init();
    
    // 기타 기능들 초기화
    setupSmoothScrolling();
    setupKeyboardNavigation();
    loadDarkModePreference();
    checkReducedMotion();
    
    // 스크롤 진행률 업데이트
    window.addEventListener('scroll', Utils.throttle(updateScrollProgress, 16));
    
    // 페이지 가시성 변경 감지 (탭 전환 등)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // 페이지가 다시 보일 때 애니메이션 재시작 (필요시)
            console.log('Page visible again');
        }
    });
});

// 전역 에러 핸들러
window.addEventListener('error', function(e) {
    console.error('About page error:', e.error);
    
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

// 유틸리티 함수들
window.AboutUtils = {
    // 경력 연수 계산
    calculateYearsOfExperience(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
        return diffYears;
    },

    // 기술 숙련도 색상 반환
    getProficiencyColor(percentage) {
        if (percentage >= 90) return '#28a745'; // 녹색
        if (percentage >= 75) return '#007bff'; // 파란색
        if (percentage >= 60) return '#ffc107'; // 노란색
        return '#dc3545'; // 빨간색
    },

    // 자격증 만료일 체크
    checkCertificationExpiry(expiryDate) {
        if (!expiryDate) return 'never';
        
        const expiry = new Date(expiryDate);
        const now = new Date();
        const diffTime = expiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'expired';
        if (diffDays < 30) return 'expiring-soon';
        return 'valid';
    },

    // 국가 방문 통계 계산
    calculateTravelStats(countries) {
        const continents = {
            'Asia': ['일본', '싱가포르', '태국', '베트남'],
            'Europe': ['독일', '프랑스', '영국', '네덜란드'],
            'North America': ['미국', '캐나다'],
            'Oceania': ['호주', '뉴질랜드']
        };
        
        const stats = {};
        Object.keys(continents).forEach(continent => {
            stats[continent] = countries.filter(country => 
                continents[continent].includes(country)
            ).length;
        });
        
        return stats;
    },

    // 경험 타임라인 정렬
    sortExperiencesByDate(experiences) {
        return experiences.sort((a, b) => {
            const dateA = new Date(a.start_date || a.date);
            const dateB = new Date(b.start_date || b.date);
            return dateB - dateA; // 최신순
        });
    },

    // 기술 스택 그룹화
    groupTechnologiesByCategory(technologies) {
        const categories = {
            'Languages': ['Python', 'JavaScript', 'Java', 'Go', 'TypeScript'],
            'Frontend': ['React', 'Vue.js', 'Angular', 'HTML', 'CSS'],
            'Backend': ['Django', 'Flask', 'Node.js', 'Express', 'Spring'],
            'Database': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
            'Cloud': ['AWS', 'Google Cloud', 'Azure', 'Heroku'],
            'DevOps': ['Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
            'Data & AI': ['Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn']
        };
        
        const grouped = {};
        Object.keys(categories).forEach(category => {
            grouped[category] = technologies.filter(tech => 
                categories[category].includes(tech.name)
            );
        });
        
        return grouped;
    }
};

// 고급 인터랙션 기능
window.AboutInteractions = {
    // 기술 스택 비교 도구
    setupTechComparison() {
        const techItems = document.querySelectorAll('.tech-skill-item');
        let selectedTechs = [];
        
        techItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) { // Ctrl+클릭으로 다중 선택
                    this.toggleTechSelection(item, selectedTechs);
                }
            });
        });
    },

    // 기술 선택 토글
    toggleTechSelection(item, selectedTechs) {
        const techName = item.querySelector('.tech-name').textContent;
        const index = selectedTechs.indexOf(techName);
        
        if (index > -1) {
            selectedTechs.splice(index, 1);
            item.classList.remove('selected');
        } else {
            selectedTechs.push(techName);
            item.classList.add('selected');
        }
        
        if (selectedTechs.length > 1) {
            this.showTechComparison(selectedTechs);
        }
    },

    // 기술 비교 표시
    showTechComparison(techs) {
        console.log('Comparing technologies:', techs);
        // 실제 구현에서는 비교 차트나 상세 정보를 표시
    },

    // 경력 타임라인 필터링
    setupTimelineFiltering() {
        const filterButtons = document.querySelectorAll('.timeline-filter');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filterType = e.target.dataset.filter;
                this.filterTimeline(filterType);
            });
        });
    },

    // 타임라인 필터 적용
    filterTimeline(filterType) {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        timelineItems.forEach(item => {
            const itemType = item.dataset.type;
            
            if (filterType === 'all' || itemType === filterType) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                }, 100);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    },

    // 자격증 유효성 상태 표시
    updateCertificationStatus() {
        const certCards = document.querySelectorAll('.cert-card');
        
        certCards.forEach(card => {
            const expiryDate = card.dataset.expiry;
            if (expiryDate) {
                const status = AboutUtils.checkCertificationExpiry(expiryDate);
                this.addCertificationStatusBadge(card, status);
            }
        });
    },

    // 자격증 상태 배지 추가
    addCertificationStatusBadge(card, status) {
        const statusBadges = {
            'valid': '<span class="badge bg-success">유효</span>',
            'expiring-soon': '<span class="badge bg-warning">만료 임박</span>',
            'expired': '<span class="badge bg-danger">만료됨</span>'
        };
        
        const badge = statusBadges[status];
        if (badge) {
            const header = card.querySelector('.cert-header');
            header.insertAdjacentHTML('beforeend', badge);
        }
    }
};

// 접근성 향상 기능
window.AboutAccessibility = {
    // 키보드 네비게이션 향상
    enhanceKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'h':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.showKeyboardShortcuts();
                    }
                    break;
                case 'j':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.navigateToNextSection();
                    }
                    break;
                case 'k':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.navigateToPrevSection();
                    }
                    break;
            }
        });
    },

    // 키보드 단축키 도움말 표시
    showKeyboardShortcuts() {
        const shortcuts = [
            'Ctrl + H: 이 도움말 표시',
            'Ctrl + J: 다음 섹션으로 이동',
            'Ctrl + K: 이전 섹션으로 이동',
            'Tab: 다음 요소로 포커스 이동',
            'Shift + Tab: 이전 요소로 포커스 이동'
        ];
        
        UI.showToast(shortcuts.join('\n'), 'info', 10000);
    },

    // 섹션 간 네비게이션
    navigateToNextSection() {
        const sections = document.querySelectorAll('section');
        const currentSection = this.getCurrentSection(sections);
        const nextIndex = (currentSection + 1) % sections.length;
        
        sections[nextIndex].scrollIntoView({ behavior: 'smooth' });
        sections[nextIndex].focus();
    },

    navigateToPrevSection() {
        const sections = document.querySelectorAll('section');
        const currentSection = this.getCurrentSection(sections);
        const prevIndex = currentSection === 0 ? sections.length - 1 : currentSection - 1;
        
        sections[prevIndex].scrollIntoView({ behavior: 'smooth' });
        sections[prevIndex].focus();
    },

    // 현재 섹션 인덱스 찾기
    getCurrentSection(sections) {
        const scrollPosition = window.pageYOffset + window.innerHeight / 2;
        
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                return i;
            }
        }
        
        return 0;
    },

    // 화면 읽기 프로그램 지원
    enhanceScreenReaderSupport() {
        // 프로그레스 바에 aria-label 추가
        document.querySelectorAll('.progress').forEach(progress => {
            const percentage = progress.style.width;
            const techName = progress.closest('.tech-skill-item')?.querySelector('.tech-name')?.textContent;
            
            if (techName && percentage) {
                progress.setAttribute('aria-label', `${techName} 숙련도 ${percentage}`);
                progress.setAttribute('role', 'progressbar');
                progress.setAttribute('aria-valuenow', percentage.replace('%', ''));
                progress.setAttribute('aria-valuemin', '0');
                progress.setAttribute('aria-valuemax', '100');
            }
        });

        // 타임라인 아이템에 설명 추가
        document.querySelectorAll('.timeline-item').forEach(item => {
            const title = item.querySelector('h5')?.textContent;
            const date = item.querySelector('.timeline-date')?.textContent;
            
            if (title && date) {
                item.setAttribute('aria-label', `${title}, ${date}`);
            }
        });
    }
};

// 익스포트 (모듈 시스템 사용시)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AboutController, 
        AboutUtils, 
        AboutInteractions, 
        AboutAccessibility,
        downloadResume 
    };
}