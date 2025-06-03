// static/js/pages/portfolio.js - 포트폴리오 페이지 전용 JavaScript

'use strict';

// 포트폴리오 페이지 컨트롤러
window.PortfolioController = {
    // 상태 관리
    state: {
        currentFilter: 'all',
        selectedTechs: [],
        isLoading: false,
        projects: [],
        filteredProjects: [],
        sortBy: 'date',
        sortOrder: 'desc',
        viewMode: 'grid', // grid, list, compact
        searchQuery: ''
    },

    // 초기화
    init() {
        this.loadProjects();
        this.setupFilterButtons();
        this.setupTechFilters();
        this.setupSearchFilter();
        this.setupViewToggle();
        this.setupSortOptions();
        this.setupScrollAnimations();
        this.setupProjectCards();
        this.setupQuickView();
        this.setupInfiniteScroll();
    },

    // 프로젝트 데이터 로드
    loadProjects() {
        // 현재 페이지의 프로젝트 데이터 수집
        const projectItems = document.querySelectorAll('.portfolio-item');
        this.state.projects = Array.from(projectItems).map(item => ({
            element: item,
            type: item.dataset.type || 'other',
            tech: (item.dataset.tech || '').toLowerCase(),
            title: item.querySelector('.card-title')?.textContent.toLowerCase() || '',
            description: item.querySelector('.description')?.textContent.toLowerCase() || ''
        }));
        
        this.state.filteredProjects = [...this.state.projects];
        this.updateResultsCount();
    },

    // 필터 버튼 설정
    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-button, .btn-filter');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 활성 버튼 변경
                filterButtons.forEach(btn => btn.classList.remove('active', 'btn-primary'));
                filterButtons.forEach(btn => btn.classList.add('btn-outline-primary'));
                
                button.classList.remove('btn-outline-primary');
                button.classList.add('active', 'btn-primary');
                
                // 필터 적용
                const filterType = this.getFilterTypeFromButton(button);
                this.applyFilter(filterType);
            });
        });
    },

    // 버튼에서 필터 타입 추출
    getFilterTypeFromButton(button) {
        const href = button.getAttribute('href');
        if (href) {
            const url = new URL(href, window.location.origin);
            return url.searchParams.get('type') || 'all';
        }
        return button.dataset.filter || 'all';
    },

    // 기술 스택 필터 설정
    setupTechFilters() {
        const techTags = document.querySelectorAll('.tech-tag');
        
        techTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const tech = tag.dataset.tech;
                this.toggleTechFilter(tech, tag);
            });
        });
    },

    // 기술 필터 토글
    toggleTechFilter(tech, tagElement) {
        const index = this.state.selectedTechs.indexOf(tech);
        
        if (index > -1) {
            this.state.selectedTechs.splice(index, 1);
            tagElement.classList.remove('selected');
        } else {
            this.state.selectedTechs.push(tech);
            tagElement.classList.add('selected');
        }
        
        this.applyFilters();
    },

    // 검색 필터 설정
    setupSearchFilter() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.state.searchQuery = e.target.value.toLowerCase();
            this.applyFilters();
        }, 300));
    },

    // 뷰 토글 설정
    setupViewToggle() {
        const viewButtons = document.querySelectorAll('.view-toggle-btn');
        const portfolioGrid = document.getElementById('portfolio-grid');
        
        if (!portfolioGrid) return;
        
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewMode = button.dataset.view;
                this.setViewMode(viewMode, button, viewButtons, portfolioGrid);
            });
        });
    },

    // 뷰 모드 설정
    setViewMode(viewMode, activeButton, allButtons, portfolioGrid) {
        this.state.viewMode = viewMode;
        
        // 버튼 상태 업데이트
        allButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
        
        // 그리드 클래스 업데이트
        portfolioGrid.className = portfolioGrid.className.replace(/\b\w+-view\b/g, '');
        portfolioGrid.classList.add(`${viewMode}-view`);
        
        // 로컬 스토리지에 저장
        Utils.storage.set('portfolioViewMode', viewMode);
    },

    // 정렬 옵션 설정
    setupSortOptions() {
        const sortSelect = document.querySelector('.sort-select');
        if (!sortSelect) return;
        
        sortSelect.addEventListener('change', (e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            this.state.sortBy = sortBy;
            this.state.sortOrder = sortOrder;
            this.sortAndDisplayProjects();
        });
    },

    // 스크롤 애니메이션 설정
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.portfolio-item').forEach(item => {
            item.classList.add('fade-in');
            observer.observe(item);
        });
    },

    // 프로젝트 카드 효과 설정
    setupProjectCards() {
        document.querySelectorAll('.project-card, .project-card-enhanced').forEach(card => {
            // 호버 효과
            card.addEventListener('mouseenter', () => {
                this.animateCardHover(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateCardHover(card, false);
            });
            
            // 클릭 효과
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
                    const detailLink = card.querySelector('a[href*="project_detail"]');
                    if (detailLink) {
                        this.animateCardClick(card);
                        setTimeout(() => {
                            detailLink.click();
                        }, 200);
                    }
                }
            });
        });
    },

    // 카드 호버 애니메이션
    animateCardHover(card, isHovering) {
        if (isHovering) {
            card.style.transform = 'translateY(-10px) scale(1.02)';
            card.style.boxShadow = '0 25px 50px rgba(0,0,0,0.2)';
        } else {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '';
        }
    },

    // 카드 클릭 애니메이션
    animateCardClick(card) {
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 100);
    },

    // 빠른 보기 설정
    setupQuickView() {
        const quickViewButtons = document.querySelectorAll('[data-bs-toggle="modal"][data-bs-target="#quickViewModal"]');
        
        quickViewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const projectId = button.dataset.projectId;
                this.loadQuickView(projectId);
            });
        });
    },

    // 빠른 보기 로드
    async loadQuickView(projectId) {
        const modal = document.getElementById('quickViewModal');
        const content = document.getElementById('quickViewContent');
        const title = document.getElementById('quickViewTitle');
        const detailBtn = document.getElementById('quickViewDetailBtn');
        
        if (!modal || !content) return;
        
        try {
            content.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
            
            const response = await fetch(`/api/project/${projectId}/quick-view`);
            const data = await response.json();
            
            if (data.success) {
                title.textContent = data.project.title;
                content.innerHTML = this.generateQuickViewContent(data.project);
                detailBtn.href = `/project/${projectId}`;
            } else {
                content.innerHTML = '<div class="alert alert-danger">프로젝트 정보를 불러올 수 없습니다.</div>';
            }
        } catch (error) {
            console.error('Quick view error:', error);
            content.innerHTML = '<div class="alert alert-danger">오류가 발생했습니다.</div>';
        }
    },

    // 빠른 보기 콘텐츠 생성
    generateQuickViewContent(project) {
        return `
            <div class="row">
                <div class="col-md-6">
                    ${project.image_path ? 
                        `<img src="/uploads/${project.image_path}" class="img-fluid rounded mb-3" alt="${project.title}">` :
                        '<div class="bg-light rounded p-4 text-center mb-3"><i class="fas fa-image fa-3x text-muted"></i></div>'
                    }
                </div>
                <div class="col-md-6">
                    <h5 class="text-primary">${project.title}</h5>
                    <p class="text-muted mb-2">
                        <i class="fas fa-tag me-1"></i>${project.project_type || '기타'}
                    </p>
                    <p>${project.description}</p>
                    
                    ${project.tech_stack ? 
                        `<div class="mb-3">
                            <h6>기술 스택</h6>
                            ${project.tech_stack.split(',').map(tech => 
                                `<span class="badge bg-secondary me-1">${tech.trim()}</span>`
                            ).join('')}
                        </div>` : ''
                    }
                    
                    ${project.achievements ? 
                        `<div class="mb-3">
                            <h6>주요 성과</h6>
                            <p class="small">${project.achievements.substring(0, 200)}...</p>
                        </div>` : ''
                    }
                    
                    <div class="d-flex gap-2">
                        ${project.github_url ? 
                            `<a href="${project.github_url}" target="_blank" class="btn btn-outline-dark btn-sm">
                                <i class="fab fa-github me-1"></i>GitHub
                            </a>` : ''
                        }
                        ${project.demo_url ? 
                            `<a href="${project.demo_url}" target="_blank" class="btn btn-outline-success btn-sm">
                                <i class="fas fa-external-link-alt me-1"></i>Demo
                            </a>` : ''
                        }
                    </div>
                </div>
            </div>
        `;
    },

    // 무한 스크롤 설정
    setupInfiniteScroll() {
        const loadMoreBtn = document.getElementById('loadMore');
        if (!loadMoreBtn) return;
        
        loadMoreBtn.addEventListener('click', () => {
            this.loadMoreProjects();
        });
        
        // 자동 로드 옵션 (선택사항)
        this.setupAutoInfiniteScroll();
    },

    // 자동 무한 스크롤
    setupAutoInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.state.isLoading) {
                    this.loadMoreProjects();
                }
            });
        });
        
        const sentinel = document.querySelector('.load-more-container');
        if (sentinel) {
            observer.observe(sentinel);
        }
    },

    // 더 많은 프로젝트 로드
    async loadMoreProjects() {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        const loadMoreBtn = document.getElementById('loadMore');
        
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>로딩 중...';
            loadMoreBtn.disabled = true;
        }
        
        try {
            // API 호출로 더 많은 프로젝트 가져오기
            const response = await fetch('/api/projects/load-more', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offset: this.state.projects.length,
                    filter: this.state.currentFilter,
                    search: this.state.searchQuery
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.projects.length > 0) {
                this.appendNewProjects(data.projects);
            } else {
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Load more error:', error);
            UI.showToast('프로젝트를 불러오는 중 오류가 발생했습니다.', 'danger');
        } finally {
            this.state.isLoading = false;
            if (loadMoreBtn) {
                loadMoreBtn.innerHTML = '<i class="fas fa-plus me-2"></i>더 많은 프로젝트 보기';
                loadMoreBtn.disabled = false;
            }
        }
    },

    // 새 프로젝트 추가
    appendNewProjects(projects) {
        const portfolioGrid = document.getElementById('portfolio-grid');
        if (!portfolioGrid) return;
        
        projects.forEach((project, index) => {
            const projectElement = this.createProjectElement(project);
            portfolioGrid.appendChild(projectElement);
            
            // 애니메이션 지연
            setTimeout(() => {
                projectElement.classList.add('visible');
            }, index * 100);
        });
    },

    // 프로젝트 요소 생성
    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'col-lg-4 col-md-6 mb-4 portfolio-item fade-in';
        div.dataset.type = project.project_type || 'other';
        div.dataset.tech = project.tech_stack || '';
        
        div.innerHTML = `
            <div class="project-card h-100">
                <div class="project-image">
                    ${project.image_path ? 
                        `<img src="/uploads/${project.image_path}" class="card-img-top" alt="${project.title}" loading="lazy">` :
                        `<div class="project-placeholder">
                            <i class="fas fa-code fa-4x"></i>
                        </div>`
                    }
                    <div class="project-type-badge">
                        <span class="badge bg-primary">${this.getProjectTypeLabel(project.project_type)}</span>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${project.title}</h5>
                    <p class="card-text description">${project.description.substring(0, 100)}...</p>
                    <div class="project-actions">
                        <a href="/project/${project.id}" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye me-1"></i>자세히 보기
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    },

    // 프로젝트 타입 라벨 반환
    getProjectTypeLabel(type) {
        const labels = {
            'tech': '웹/앱 개발',
            'infra': '인프라',
            'data': '데이터 분석',
            'ai': 'AI/ML',
            'art': '아트워크'
        };
        return labels[type] || '기타';
    },

    // 필터 적용
    applyFilter(filterType) {
        this.state.currentFilter = filterType;
        this.applyFilters();
        
        // URL 업데이트 (뒤로 가기 지원)
        const url = new URL(window.location);
        if (filterType === 'all') {
            url.searchParams.delete('type');
        } else {
            url.searchParams.set('type', filterType);
        }
        history.replaceState({}, '', url);
    },

    // 모든 필터 적용
    applyFilters() {
        this.state.filteredProjects = this.state.projects.filter(project => {
            // 타입 필터
            if (this.state.currentFilter !== 'all' && project.type !== this.state.currentFilter) {
                return false;
            }
            
            // 기술 스택 필터
            if (this.state.selectedTechs.length > 0) {
                const hasMatchingTech = this.state.selectedTechs.some(tech => 
                    project.tech.includes(tech.toLowerCase())
                );
                if (!hasMatchingTech) return false;
            }
            
            // 검색 필터
            if (this.state.searchQuery) {
                const searchTerm = this.state.searchQuery;
                if (!project.title.includes(searchTerm) && 
                    !project.description.includes(searchTerm) &&
                    !project.tech.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.sortAndDisplayProjects();
        this.updateResultsCount();
    },

    // 정렬 및 표시
    sortAndDisplayProjects() {
        // 정렬 로직 (구현 필요시)
        // this.state.filteredProjects.sort(...);
        
        // 프로젝트 표시/숨김 처리
        this.state.projects.forEach(project => {
            const isVisible = this.state.filteredProjects.includes(project);
            
            if (isVisible) {
                project.element.style.display = '';
                project.element.classList.remove('filtered-out');
                setTimeout(() => {
                    project.element.classList.add('visible');
                }, 50);
            } else {
                project.element.classList.remove('visible');
                project.element.classList.add('filtering');
                setTimeout(() => {
                    project.element.style.display = 'none';
                    project.element.classList.remove('filtering');
                    project.element.classList.add('filtered-out');
                }, 300);
            }
        });
    },

    // 결과 수 업데이트
    updateResultsCount() {
        const countElement = document.querySelector('.results-count');
        if (countElement) {
            const count = this.state.filteredProjects.length;
            countElement.textContent = `${count}개의 프로젝트`;
        }
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio page loaded');
    PortfolioController.init();
    
    // URL 파라미터에서 초기 필터 설정
    const urlParams = new URLSearchParams(window.location.search);
    const typeFilter = urlParams.get('type');
    if (typeFilter) {
        PortfolioController.applyFilter(typeFilter);
    }
    
    // 저장된 뷰 모드 복원
    const savedViewMode = Utils.storage.get('portfolioViewMode', 'grid');
    const viewButton = document.querySelector(`[data-view="${savedViewMode}"]`);
    const portfolioGrid = document.getElementById('portfolio-grid');
    
    if (viewButton && portfolioGrid) {
        const allViewButtons = document.querySelectorAll('.view-toggle-btn');
        PortfolioController.setViewMode(savedViewMode, viewButton, allViewButtons, portfolioGrid);
    }
});

// 전역 에러 핸들러
window.addEventListener('error', function(e) {
    console.error('Portfolio page error:', e.error);
    UI.showToast('예기치 않은 오류가 발생했습니다.', 'danger');
});

// 유틸리티 함수들
window.PortfolioUtils = {
    // 프로젝트 데이터 내보내기
    exportProjects(format = 'json') {
        const projects = PortfolioController.state.filteredProjects.map(p => ({
            title: p.title,
            type: p.type,
            tech: p.tech
        }));
        
        if (format === 'csv') {
            return this.convertToCSV(projects);
        }
        
        return JSON.stringify(projects, null, 2);
    },
    
    // CSV 변환
    convertToCSV(data) {
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        return csvContent;
    },
    
    // 프로젝트 통계
    getProjectStats() {
        const projects = PortfolioController.state.projects;
        const stats = {
            total: projects.length,
            byType: {},
            byTech: {}
        };
        
        projects.forEach(project => {
            // 타입별 통계
            stats.byType[project.type] = (stats.byType[project.type] || 0) + 1;
            
            // 기술별 통계
            if (project.tech) {
                const techs = project.tech.split(',');
                techs.forEach(tech => {
                    const cleanTech = tech.trim();
                    if (cleanTech) {
                        stats.byTech[cleanTech] = (stats.byTech[cleanTech] || 0) + 1;
                    }
                });
            }
        });
        
        return stats;
    },
    
    // 검색 하이라이트
    highlightSearchTerm(text, term) {
        if (!term) return text;
        
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
};

// 익스포트 (모듈 시스템 사용시)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PortfolioController, PortfolioUtils };
}