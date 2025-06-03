// static/js/pages/add_work.js - 프로젝트 추가 페이지 전용 JavaScript

'use strict';

// 프로젝트 추가 페이지 컨트롤러
window.AddWorkController = {
    // 상태 관리
    state: {
        selectedTechs: [],
        isFormChanged: false,
        isSubmitting: false,
        autoSaveInterval: null
    },

    // 초기화
    init() {
        this.setupFormElements();
        this.setupTechTags();
        this.setupFileUpload();
        this.setupFormValidation();
        this.setupFormChangeTracking();
        this.setupTemplates();
        this.setupAutoSave();
        this.loadDraftData();
    },

    // 폼 요소 설정
    setupFormElements() {
        // 프로젝트 타입 변경 시 카테고리 업데이트
        const projectTypeSelect = document.getElementById('project_type');
        if (projectTypeSelect) {
            projectTypeSelect.addEventListener('change', () => {
                this.updateCategories();
            });
        }

        // 진행중 프로젝트 체크박스
        const isOngoingCheck = document.getElementById('is_ongoing');
        const endDateInput = document.getElementById('end_date');
        
        if (isOngoingCheck && endDateInput) {
            isOngoingCheck.addEventListener('change', (e) => {
                if (e.target.checked) {
                    endDateInput.disabled = true;
                    endDateInput.value = '';
                } else {
                    endDateInput.disabled = false;
                }
            });
        }

        // 키보드 네비게이션
        this.setupKeyboardNavigation();
    },

    // 카테고리 업데이트
    updateCategories() {
        const projectType = document.getElementById('project_type').value;
        const categorySelect = document.getElementById('category');
        
        if (!categorySelect) return;
        
        categorySelect.innerHTML = '<option value="">카테고리 선택</option>';
        
        const categories = {
            'tech': [
                'Frontend Development',
                'Backend Development', 
                'Full-Stack Application',
                'Mobile App',
                'API Development',
                'Web Service'
            ],
            'infra': [
                'Cloud Migration',
                'Container Orchestration',
                'CI/CD Pipeline',
                'Infrastructure as Code',
                'Monitoring & Logging',
                'Security Implementation'
            ],
            'data': [
                'Data Pipeline',
                'Business Intelligence',
                'Data Visualization',
                'ETL Process',
                'Data Mining',
                'Real-time Analytics'
            ],
            'ai': [
                'Machine Learning Model',
                'Deep Learning',
                'Natural Language Processing',
                'Computer Vision',
                'Recommendation System',
                'Predictive Analytics'
            ],
            'art': [
                '풍경화',
                '인물화',
                '정물화',
                '추상화',
                '일러스트',
                '디지털아트'
            ]
        };
        
        if (categories[projectType]) {
            categories[projectType].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
        
        this.state.isFormChanged = true;
    },

    // 기술 태그 설정
    setupTechTags() {
        const techTags = document.querySelectorAll('.tech-tag');
        const techStackInput = document.getElementById('tech_stack');
        
        if (!techStackInput) return;
        
        techTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const tech = tag.getAttribute('data-tech');
                this.toggleTechTag(tech, tag, techStackInput);
            });
        });

        // 기술 스택 입력 필드 직접 입력 감지
        techStackInput.addEventListener('input', () => {
            this.syncTechTagsFromInput(techStackInput);
        });
    },

    // 기술 태그 토글
    toggleTechTag(tech, tagElement, inputElement) {
        const index = this.state.selectedTechs.indexOf(tech);
        
        if (index > -1) {
            this.state.selectedTechs.splice(index, 1);
            tagElement.classList.remove('selected');
        } else {
            this.state.selectedTechs.push(tech);
            tagElement.classList.add('selected');
        }
        
        inputElement.value = this.state.selectedTechs.join(', ');
        this.state.isFormChanged = true;
    },

    // 입력 필드에서 기술 태그 동기화
    syncTechTagsFromInput(inputElement) {
        const inputTechs = inputElement.value.split(',').map(tech => tech.trim()).filter(tech => tech);
        this.state.selectedTechs = inputTechs;
        
        // 태그 선택 상태 업데이트
        document.querySelectorAll('.tech-tag').forEach(tag => {
            const tech = tag.getAttribute('data-tech');
            if (inputTechs.includes(tech)) {
                tag.classList.add('selected');
            } else {
                tag.classList.remove('selected');
            }
        });
        
        this.state.isFormChanged = true;
    },

    // 파일 업로드 설정
    setupFileUpload() {
        const imageInput = document.getElementById('image');
        const form = document.getElementById('addProjectForm');
        
        if (!imageInput || !form) return;

        // 드래그 앤 드롭 설정
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            form.addEventListener(eventName, this.preventDefaults, false);
        });
        
        form.addEventListener('drop', (e) => this.handleDrop(e, imageInput), false);

        // 파일 선택 시 미리보기
        imageInput.addEventListener('change', (e) => this.previewImage(e.target));
    },

    // 기본 이벤트 방지
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    // 드롭 처리
    handleDrop(e, imageInput) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            imageInput.files = files;
            this.previewImage(imageInput);
        }
    },

    // 이미지 미리보기
    previewImage(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // 파일 크기 검사
            if (file.size > 10 * 1024 * 1024) {
                alert('파일 크기가 10MB를 초과합니다.');
                input.value = '';
                this.removeImage();
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                const container = document.getElementById('imagePreviewContainer');
                
                if (preview && container) {
                    preview.src = e.target.result;
                    container.style.display = 'block';
                }
            };
            
            reader.readAsDataURL(file);
            this.state.isFormChanged = true;
        }
    },

    // 이미지 제거
    removeImage() {
        const imageInput = document.getElementById('image');
        const preview = document.getElementById('imagePreview');
        const container = document.getElementById('imagePreviewContainer');
        
        if (imageInput) imageInput.value = '';
        if (preview) preview.src = '';
        if (container) container.style.display = 'none';
        
        this.state.isFormChanged = true;
    },

    // 폼 유효성 검사 설정
    setupFormValidation() {
        const form = document.getElementById('addProjectForm');
        if (!form) return;

        // 실시간 유효성 검사
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // 폼 제출 처리
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    // 필드 유효성 검사
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('name') || field.id;
        let isValid = true;
        let errorMessage = '';

        // 필수 필드 검사
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(fieldName)}은(는) 필수 항목입니다.`;
        }
        // 제목 길이 검사
        else if (fieldName === 'title' && value && value.length < 5) {
            isValid = false;
            errorMessage = '프로젝트명은 최소 5자 이상이어야 합니다.';
        }
        // 설명 길이 검사
        else if (fieldName === 'description' && value && value.length < 20) {
            isValid = false;
            errorMessage = '설명은 최소 20자 이상이어야 합니다.';
        }
        // URL 유효성 검사
        else if ((fieldName.includes('url') || field.type === 'url') && value && !this.isValidUrl(value)) {
            isValid = false;
            errorMessage = '올바른 URL 형식을 입력해주세요.';
        }

        if (isValid) {
            this.showFieldSuccess(field);
        } else {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    },

    // 필드 라벨 가져오기
    getFieldLabel(fieldName) {
        const labelMap = {
            'title': '프로젝트명',
            'project_type': '프로젝트 유형',
            'description': '설명',
            'tech_stack': '기술 스택',
            'github_url': 'GitHub URL',
            'demo_url': '데모 URL',
            'video_url': '동영상 URL'
        };
        return labelMap[fieldName] || fieldName;
    },

    // URL 유효성 검사
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // 필드 에러 표시
    showFieldError(field, message) {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        
        this.clearFieldFeedback(field);
        
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = message;
        field.parentNode.appendChild(feedback);

        // 접근성
        feedback.id = `${field.id}-error`;
        field.setAttribute('aria-describedby', feedback.id);
        field.setAttribute('aria-invalid', 'true');
    },

    // 필드 성공 표시
    showFieldSuccess(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        
        this.clearFieldFeedback(field);
        
        const feedback = document.createElement('div');
        feedback.className = 'valid-feedback';
        feedback.textContent = '올바르게 입력되었습니다.';
        field.parentNode.appendChild(feedback);

        field.removeAttribute('aria-describedby');
        field.setAttribute('aria-invalid', 'false');
    },

    // 필드 에러 제거
    clearFieldError(field) {
        field.classList.remove('is-invalid', 'is-valid');
        this.clearFieldFeedback(field);
        field.removeAttribute('aria-describedby');
        field.removeAttribute('aria-invalid');
    },

    // 피드백 요소 제거
    clearFieldFeedback(field) {
        const existingFeedback = field.parentNode.querySelectorAll('.invalid-feedback, .valid-feedback');
        existingFeedback.forEach(feedback => feedback.remove());
    },

    // 폼 변경 추적 설정
    setupFormChangeTracking() {
        const form = document.getElementById('addProjectForm');
        if (!form) return;
        
        form.addEventListener('input', () => { this.state.isFormChanged = true; });
        form.addEventListener('change', () => { this.state.isFormChanged = true; });
        
        // 페이지 이탈 경고
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isFormChanged && !this.state.isSubmitting) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    },

    // 템플릿 설정
    setupTemplates() {
        const templateButtons = document.querySelectorAll('[onclick*="loadTemplate"]');
        templateButtons.forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', (e) => {
                const type = e.target.closest('button').textContent.trim();
                this.loadTemplate(this.getTemplateType(type));
            });
        });
    },

    // 템플릿 타입 결정
    getTemplateType(buttonText) {
        if (buttonText.includes('웹')) return 'web';
        if (buttonText.includes('데이터')) return 'data';
        if (buttonText.includes('AI')) return 'ai';
        if (buttonText.includes('인프라')) return 'infra';
        return 'web';
    },

    // 템플릿 로드
    loadTemplate(type) {
        if (this.state.isFormChanged && !confirm('현재 입력한 내용이 삭제됩니다. 계속하시겠습니까?')) {
            return;
        }
        
        const templates = {
            'web': {
                project_type: 'tech',
                category: 'Full-Stack Application',
                tech_stack: 'Python, Django, React, PostgreSQL, Docker, AWS',
                description: '사용자 친화적인 웹 애플리케이션을 개발하여 비즈니스 요구사항을 해결했습니다.',
                detailed_description: '프로젝트 배경:\n- 기존 시스템의 한계점 분석\n- 사용자 요구사항 수집 및 분석\n\n기술적 구현:\n- RESTful API 설계 및 개발\n- 반응형 웹 인터페이스 구현\n- 데이터베이스 최적화',
                my_role: 'Full-Stack Developer',
                team_size: '4',
                achievements: '• 기존 대비 응답속도 40% 향상\n• 사용자 만족도 4.7/5.0 달성\n• 월간 활성 사용자 300% 증가',
                metrics: '응답시간: 2.3초 → 1.4초, 서버 비용: 30% 절감, 코드 커버리지: 85%'
            },
            'data': {
                project_type: 'data',
                category: 'Business Intelligence',
                tech_stack: 'Python, Pandas, NumPy, Matplotlib, Jupyter, SQL, Tableau',
                description: '데이터 분석을 통해 비즈니스 인사이트를 도출하고 의사결정을 지원했습니다.',
                detailed_description: '데이터 수집:\n- 다양한 소스에서 데이터 수집 및 통합\n- 데이터 품질 검증 및 전처리\n\n분석 과정:\n- 탐색적 데이터 분석(EDA)\n- 통계적 분석 및 가설 검증\n- 대시보드 구축',
                my_role: 'Data Analyst',
                team_size: '3',
                achievements: '• 매출 예측 정확도 92% 달성\n• 고객 이탈률 25% 감소\n• 마케팅 ROI 40% 향상',
                metrics: '데이터 처리량: 1TB/일, 대시보드 조회수: 500회/일, 의사결정 시간: 50% 단축'
            },
            'ai': {
                project_type: 'ai',
                category: 'Machine Learning Model',
                tech_stack: 'Python, TensorFlow, Scikit-learn, Pandas, Docker, MLflow, AWS SageMaker',
                description: '머신러닝 모델을 개발하여 비즈니스 문제를 자동화하고 예측 정확도를 향상시켰습니다.',
                detailed_description: '문제 정의:\n- 비즈니스 문제를 ML 문제로 변환\n- 성공 지표 및 평가 방법 정의\n\n모델 개발:\n- 특성 엔지니어링 및 데이터 전처리\n- 다양한 알고리즘 실험\n- 하이퍼파라미터 최적화',
                my_role: 'ML Engineer',
                team_size: '2',
                achievements: '• 예측 정확도 94% 달성\n• 수동 작업 80% 자동화\n• 처리 시간 90% 단축',
                metrics: 'F1-Score: 0.94, 추론 속도: 100ms, 모델 크기: 50MB'
            },
            'infra': {
                project_type: 'infra',
                category: 'Container Orchestration',
                tech_stack: 'Kubernetes, Docker, Terraform, Jenkins, Prometheus, Grafana, AWS',
                description: '컨테이너 오케스트레이션을 통해 확장 가능하고 안정적인 인프라를 구축했습니다.',
                detailed_description: '현재 상황:\n- 기존 인프라의 확장성 및 관리 이슈\n- 배포 프로세스의 복잡성\n\n솔루션 구현:\n- Kubernetes 클러스터 설계\n- CI/CD 파이프라인 자동화\n- 모니터링 시스템 구축',
                my_role: 'DevOps Engineer',
                team_size: '3',
                achievements: '• 배포 시간 90% 단축\n• 시스템 가용성 99.9% 달성\n• 인프라 비용 30% 절감',
                metrics: '배포 시간: 2시간 → 12분, 장애 복구 시간: 15분 → 2분, 서버 수: 20대 → 5대'
            }
        };
        
        const template = templates[type];
        if (template) {
            this.applyTemplate(template, type);
        }
    },

    // 템플릿 적용
    applyTemplate(template, type) {
        Object.keys(template).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = template[key];
                
                if (key === 'project_type') {
                    element.dispatchEvent(new Event('change'));
                }
            }
        });
        
        // 기술 스택 태그 업데이트
        this.syncTechTagsFromInput(document.getElementById('tech_stack'));
        
        UI.showToast(`${type.toUpperCase()} 프로젝트 템플릿이 적용되었습니다.`, 'success');
        this.state.isFormChanged = true;
    },

    // 자동 저장 설정
    setupAutoSave() {
        this.state.autoSaveInterval = setInterval(() => {
            if (this.state.isFormChanged) {
                this.saveAsDraft();
            }
        }, 300000); // 5분마다
    },

    // 임시 저장
    saveAsDraft() {
        const form = document.getElementById('addProjectForm');
        if (!form) return;

        const formData = new FormData(form);
        const draftData = {};
        
        for (let [key, value] of formData.entries()) {
            if (key !== 'image' && key !== 'document') {
                draftData[key] = value;
            }
        }
        
        draftData.timestamp = Date.now();
        draftData.selectedTechs = this.state.selectedTechs;
        
        Utils.storage.set('projectDraft', draftData);
        console.log('프로젝트 임시저장 완료');
    },

    // 임시 저장 데이터 로드
    loadDraftData() {
        const draftData = Utils.storage.get('projectDraft');
        
        if (draftData && Date.now() - draftData.timestamp < 24 * 60 * 60 * 1000) { // 24시간 이내
            if (confirm('이전에 작성하던 내용이 있습니다. 복원하시겠습니까?')) {
                this.restoreDraftData(draftData);
            }
        }
    },

    // 임시 저장 데이터 복원
    restoreDraftData(data) {
        Object.keys(data).forEach(key => {
            if (key !== 'timestamp' && key !== 'selectedTechs') {
                const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = data[key] === 'on';
                    } else {
                        field.value = data[key];
                    }
                }
            }
        });
        
        // 기술 스택 복원
        if (data.selectedTechs) {
            this.state.selectedTechs = data.selectedTechs;
            const techStackInput = document.getElementById('tech_stack');
            if (techStackInput) {
                techStackInput.value = data.selectedTechs.join(', ');
                this.syncTechTagsFromInput(techStackInput);
            }
        }
        
        // 프로젝트 타입에 따른 카테고리 업데이트
        this.updateCategories();
        
        UI.showToast('임시저장된 데이터를 복원했습니다.', 'info');
        Utils.storage.remove('projectDraft');
    },

    // 키보드 네비게이션 설정
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S: 임시저장
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveAsDraft();
                UI.showToast('임시저장되었습니다.', 'info');
            }
            
            // Enter로 다음 필드로 이동 (textarea 제외)
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
                this.focusNextField(e.target);
            }
        });
    },

    // 다음 필드로 포커스 이동
    focusNextField(currentField) {
        const formFields = Array.from(document.querySelectorAll('#addProjectForm input, #addProjectForm textarea, #addProjectForm select, #addProjectForm button'));
        const currentIndex = formFields.indexOf(currentField);
        
        if (currentIndex >= 0 && currentIndex < formFields.length - 1) {
            formFields[currentIndex + 1].focus();
        }
    },

    // 폼 제출 처리
    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.state.isSubmitting) return;
        
        const form = event.target;
        
        // 전체 폼 유효성 검사
        if (!this.validateForm(form)) {
            this.scrollToFirstError();
            return;
        }

        this.state.isSubmitting = true;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            this.setFormLoading(true, submitBtn);
            
            // 폼 데이터 준비
            const formData = new FormData(form);
            
            // 서버로 전송
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    this.handleSubmissionSuccess();
                } else {
                    this.handleSubmissionError(result.message || '프로젝트 추가에 실패했습니다.');
                }
            } else {
                this.handleSubmissionError('서버 오류가 발생했습니다.');
            }

        } catch (error) {
            console.error('폼 제출 오류:', error);
            this.handleSubmissionError('네트워크 오류가 발생했습니다.');
        } finally {
            this.setFormLoading(false, submitBtn, originalText);
            this.state.isSubmitting = false;
        }
    },

    // 폼 전체 유효성 검사
    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    },

    // 첫 번째 오류로 스크롤
    scrollToFirstError() {
        const firstError = document.querySelector('.is-invalid');
        if (firstError) {
            firstError.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            firstError.focus();
        }
    },

    // 로딩 상태 설정
    setFormLoading(isLoading, submitBtn, originalText = '') {
        if (isLoading) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>프로젝트 추가 중...';
            submitBtn.disabled = true;
            document.getElementById('addProjectForm').classList.add('form-loading');
        } else {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            document.getElementById('addProjectForm').classList.remove('form-loading');
        }
    },

    // 제출 성공 처리
    handleSubmissionSuccess() {
        this.state.isFormChanged = false;
        Utils.storage.remove('projectDraft');
        
        UI.showToast('프로젝트가 성공적으로 추가되었습니다!', 'success');
        
        setTimeout(() => {
            window.location.href = '/admin';
        }, 1500);
    },

    // 제출 오류 처리
    handleSubmissionError(message) {
        UI.showToast(`오류가 발생했습니다: ${message}`, 'danger');
    },

    // 정리
    cleanup() {
        if (this.state.autoSaveInterval) {
            clearInterval(this.state.autoSaveInterval);
        }
    }
};

// 전역 함수들 (HTML에서 호출)
function previewImage(input) {
    AddWorkController.previewImage(input);
}

function removeImage() {
    AddWorkController.removeImage();
}

function saveAsDraft() {
    AddWorkController.saveAsDraft();
    UI.showToast('임시저장되었습니다.', 'info');
}

function loadTemplate(type) {
    AddWorkController.loadTemplate(type);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Add work page loaded');
    AddWorkController.init();
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
    AddWorkController.cleanup();
});

// 전역 에러 핸들러
window.addEventListener('error', function(e) {
    console.error('Add work page error:', e.error);
    UI.showToast('예기치 않은 오류가 발생했습니다.', 'danger');
});