// static/js/pages/admin.js - 관리자 페이지 전용 JavaScript

'use strict';

// 관리자 페이지 컨트롤러
window.AdminController = {
    // 초기화
    init() {
        this.initializeCharts();
        this.initializeEventListeners();
        this.initializeAnimations();
        this.startRealTimeUpdates();
    },

    // 차트 초기화
    initializeCharts() {
        this.createCategoryChart();
    },

    // 이벤트 리스너 초기화
    initializeEventListeners() {
        this.setupDeleteModal();
        this.setupQuickActions();
        this.setupCardAnimations();
    },

    // 애니메이션 초기화
    initializeAnimations() {
        this.animateStatCards();
        this.setupScrollAnimations();
    },

    // 카테고리 차트 생성
    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        // 서버에서 전달된 작품 데이터가 있는지 확인
        if (typeof works !== 'undefined' && works.length > 0) {
            // 카테고리별 데이터 준비
            const categoryData = {};
            works.forEach(work => {
                const category = work.category || '미분류';
                categoryData[category] = (categoryData[category] || 0) + 1;
            });
            
            const labels = Object.keys(categoryData);
            const data = Object.values(categoryData);
            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
            ];
            
            this.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 2,
                        borderColor: '#fff',
                        hoverBorderWidth: 3,
                        hoverBorderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value}개 (${percentage}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 2000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        } else {
            // 데이터가 없을 때
            ctx.parentElement.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-chart-pie fa-3x mb-3"></i>
                    <p>표시할 데이터가 없습니다</p>
                </div>
            `;
        }
    },

    // 삭제 모달 설정
    setupDeleteModal() {
        const confirmBtn = document.getElementById('confirmDelete');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (this.deleteWorkId) {
                    this.performDelete(this.deleteWorkId);
                }
            });
        }
    },

    // 빠른 작업 설정
    setupQuickActions() {
        // 데이터 백업 버튼
        const backupBtns = document.querySelectorAll('[onclick*="backupData"]');
        backupBtns.forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', this.backupData.bind(this));
        });

        // 캐시 지우기 버튼
        const cacheBtns = document.querySelectorAll('[onclick*="clearCache"]');
        cacheBtns.forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', this.clearCache.bind(this));
        });
    },

    // 카드 애니메이션 설정
    setupCardAnimations() {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    },

    // 통계 카드 애니메이션
    animateStatCards() {
        const statNumbers = document.querySelectorAll('.h5.mb-0.font-weight-bold');
        
        statNumbers.forEach(element => {
            const finalValue = parseInt(element.textContent) || 0;
            if (finalValue > 0) {
                this.animateCounter(element, 0, finalValue, 2000);
            }
        });
    },

    // 카운터 애니메이션
    animateCounter(element, start, end, duration) {
        const stepTime = Math.abs(Math.floor(duration / (end - start)));
        const timer = setInterval(() => {
            start += 1;
            element.textContent = start;
            if (start >= end) {
                clearInterval(timer);
            }
        }, stepTime);
    },

    // 스크롤 애니메이션 설정
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.timeline-item, .card').forEach(el => {
            observer.observe(el);
        });
    },

    // 실시간 업데이트 시작
    startRealTimeUpdates() {
        // 5분마다 통계 업데이트
        setInterval(() => {
            this.updateStatistics();
        }, 300000);

        // 현재 시간 업데이트
        this.updateCurrentTime();
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    },

    // 현재 시간 업데이트
    updateCurrentTime() {
        const timeElements = document.querySelectorAll('.current-time');
        const now = new Date();
        const timeString = now.toLocaleString('ko-KR');
        
        timeElements.forEach(element => {
            element.textContent = timeString;
        });
    },

    // 통계 업데이트
    async updateStatistics() {
        try {
            const response = await fetch('/api/admin/statistics');
            const data = await response.json();
            
            if (data.success) {
                this.updateStatCards(data.statistics);
            }
        } catch (error) {
            console.error('통계 업데이트 실패:', error);
        }
    },

    // 통계 카드 업데이트
    updateStatCards(stats) {
        const statElements = {
            'total_works': document.querySelector('.border-left-primary .h5'),
            'featured_works': document.querySelector('.border-left-success .h5'),
            'total_experiences': document.querySelector('.border-left-info .h5')
        };

        Object.keys(statElements).forEach(key => {
            const element = statElements[key];
            if (element && stats[key] !== undefined) {
                const currentValue = parseInt(element.textContent) || 0;
                const newValue = stats[key];
                
                if (currentValue !== newValue) {
                    this.animateCounter(element, currentValue, newValue, 1000);
                }
            }
        });
    }
};

// 전역 함수들 (템플릿에서 호출되는 함수들)
let deleteWorkId = null;

// 작품 삭제 함수
function deleteWork(workId, workTitle) {
    deleteWorkId = workId;
    AdminController.deleteWorkId = workId;
    
    const titleElement = document.getElementById('deleteWorkTitle');
    if (titleElement) {
        titleElement.textContent = workTitle;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// 삭제 실행
AdminController.performDelete = async function(workId) {
    try {
        const response = await fetch(`/admin/delete_work/${workId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            UI.showToast('작품이 성공적으로 삭제되었습니다.', 'success');
            
            // 페이지 새로고침 대신 해당 행만 제거
            const row = document.querySelector(`tr[data-work-id="${workId}"]`);
            if (row) {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    row.remove();
                    this.updateStatistics();
                }, 300);
            } else {
                // 행을 찾을 수 없으면 페이지 새로고침
                setTimeout(() => location.reload(), 1000);
            }
        } else {
            UI.showToast('삭제에 실패했습니다: ' + (data.message || '알 수 없는 오류'), 'danger');
        }
    } catch (error) {
        console.error('삭제 오류:', error);
        UI.showToast('삭제 중 오류가 발생했습니다.', 'danger');
    }
    
    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    if (modal) {
        modal.hide();
    }
};

// 작품 수정 함수
function editWork(workId) {
    window.location.href = `/admin/edit_work/${workId}`;
}

// 데이터 백업 함수
AdminController.backupData = function(event) {
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>백업 중...';
    btn.disabled = true;
    
    // 실제 백업 요청
    fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            UI.showToast('데이터 백업이 완료되었습니다.', 'success');
            
            // 백업 파일 다운로드
            if (data.download_url) {
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = `backup_${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
            UI.showToast('백업에 실패했습니다: ' + (data.message || '알 수 없는 오류'), 'danger');
        }
    })
    .catch(error => {
        console.error('백업 오류:', error);
        UI.showToast('백업 중 오류가 발생했습니다.', 'danger');
    })
    .finally(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
};

// 캐시 지우기 함수
AdminController.clearCache = function(event) {
    const btn = event.target.closest('button');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>처리 중...';
    btn.disabled = true;
    
    fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            UI.showToast('캐시가 성공적으로 지워졌습니다.', 'success');
        } else {
            UI.showToast('캐시 지우기에 실패했습니다: ' + (data.message || '알 수 없는 오류'), 'warning');
        }
    })
    .catch(error => {
        console.error('캐시 지우기 오류:', error);
        UI.showToast('캐시 지우기 중 오류가 발생했습니다.', 'danger');
    })
    .finally(() => {
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1000);
    });
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded');
    AdminController.init();
    
    // 키보드 단축키 설정
    document.addEventListener('keydown', function(e) {
        // Ctrl + N: 새 작품 추가
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            window.location.href = '/admin/add_work';
        }
        
        // Ctrl + B: 백업
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            const backupBtn = document.querySelector('button[onclick*="backupData"]');
            if (backupBtn) {
                backupBtn.click();
            }
        }
        
        // ESC: 모달 닫기
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            });
        }
    });
    
    // 전역 에러 핸들러
    window.addEventListener('error', function(e) {
        console.error('Admin page error:', e.error);
        UI.showToast('예기치 않은 오류가 발생했습니다.', 'danger');
    });
    
    // 페이지 가시성 변경 감지 (탭 전환 등)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // 페이지가 다시 보일 때 통계 업데이트
            AdminController.updateStatistics();
        }
    });
});

// 유틸리티 함수들
const AdminUtils = {
    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 날짜 포맷팅
    formatDate(date, format = 'YYYY-MM-DD HH:mm') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    },
    
    // 상대적 시간 표시
    timeAgo(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}일 전`;
        if (hours > 0) return `${hours}시간 전`;
        if (minutes > 0) return `${minutes}분 전`;
        return '방금 전';
    },
    
    // 데이터 내보내기
    exportData(data, filename, type = 'json') {
        let content, mimeType;
        
        switch (type) {
            case 'csv':
                content = this.convertToCSV(data);
                mimeType = 'text/csv';
                break;
            case 'json':
            default:
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                break;
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.${type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
    
    // CSV 변환
    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    JSON.stringify(row[header] || '')
                ).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }
};

// AdminUtils를 전역으로 노출
window.AdminUtils = AdminUtils;