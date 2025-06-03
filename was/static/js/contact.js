// static/js/pages/contact.js - 연락처 페이지 전용 JavaScript

'use strict';

// 연락처 페이지 컨트롤러
window.ContactController = {
    // 초기화
    init() {
        this.setupFormValidation();
        this.setupCharacterCounter();
        this.setupAnimations();
        this.setupFormSubmission();
        this.setupAccessibility();
    },

    // 폼 유효성 검사 설정
    setupFormValidation() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        // 실시간 유효성 검사
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // 이메일 특별 검사
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', Utils.debounce(() => {
                this.validateEmail(emailInput);
            }, 500));
        }

        // 전화번호 포맷팅
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
        }
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
        // 이메일 검사
        else if (field.type === 'email' && value && !Utils.isValidEmail(value)) {
            isValid = false;
            errorMessage = '올바른 이메일 주소를 입력해주세요.';
        }
        // 메시지 길이 검사
        else if (fieldName === 'message' && value && value.length < 10) {
            isValid = false;
            errorMessage = '메시지는 최소 10자 이상 입력해주세요.';
        }
        // 이름 길이 검사
        else if (fieldName === 'name' && value && value.length < 2) {
            isValid = false;
            errorMessage = '이름은 최소 2자 이상 입력해주세요.';
        }

        if (isValid) {
            this.showFieldSuccess(field);
        } else {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    },

    // 이메일 유효성 검사
    validateEmail(emailInput) {
        const email = emailInput.value.trim();
        if (!email) return;

        if (Utils.isValidEmail(email)) {
            this.showFieldSuccess(emailInput);
        } else {
            this.showFieldError(emailInput, '올바른 이메일 형식이 아닙니다.');
        }
    },

    // 전화번호 포맷팅
    formatPhoneNumber(event) {
        let value = event.target.value.replace(/\D/g, '');
        
        if (value.length >= 11) {
            value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (value.length >= 7) {
            value = value.replace(/(\d{3})(\d{4})/, '$1-$2');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})/, '$1-');
        }
        
        event.target.value = value;
    },

    // 필드 라벨 가져오기
    getFieldLabel(fieldName) {
        const labelMap = {
            'name': '이름',
            'email': '이메일',
            'phone': '연락처',
            'subject': '문의 유형',
            'message': '메시지'
        };
        return labelMap[fieldName] || fieldName;
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

        // 접근성: 스크린 리더를 위한 aria-describedby 설정
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

    // 글자 수 카운터 설정
    setupCharacterCounter() {
        const messageTextarea = document.getElementById('message');
        if (!messageTextarea) return;

        const maxLength = 1000;
        const minLength = 10;

        messageTextarea.addEventListener('input', () => {
            const currentLength = messageTextarea.value.length;
            const remaining = maxLength - currentLength;
            
            // 카운터 요소 찾기 또는 생성
            let counter = messageTextarea.parentNode.querySelector('.char-counter');
            if (!counter) {
                counter = document.createElement('small');
                counter.className = 'char-counter text-muted float-end';
                
                const formText = messageTextarea.parentNode.querySelector('.form-text');
                if (formText) {
                    formText.appendChild(counter);
                } else {
                    messageTextarea.parentNode.appendChild(counter);
                }
            }
            
            // 카운터 텍스트 업데이트
            counter.textContent = `${currentLength}/${maxLength}`;
            
            // 상태에 따른 스타일 변경
            counter.className = 'char-counter float-end';
            if (currentLength < minLength) {
                counter.classList.add('text-warning');
                counter.textContent += ` (최소 ${minLength - currentLength}자 더 필요)`;
            } else if (remaining < 50) {
                counter.classList.add('text-warning');
            } else {
                counter.classList.add('text-muted');
            }
        });

        // 초기 실행
        messageTextarea.dispatchEvent(new Event('input'));
    },

    // 애니메이션 설정
    setupAnimations() {
        // 카드 순차적 나타나기
        const cards = document.querySelectorAll('.card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });

        // 연락처 아이템 호버 효과
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const icon = item.querySelector('.contact-icon');
                if (icon) {
                    icon.style.transform = 'scale(1.1) rotate(5deg)';
                }
            });

            item.addEventListener('mouseleave', () => {
                const icon = item.querySelector('.contact-icon');
                if (icon) {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                }
            });
        });
    },

    // 폼 제출 설정
    setupFormSubmission() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitForm(form);
        });
    },

    // 폼 제출 처리
    async submitForm(form) {
        // 전체 폼 유효성 검사
        const isValid = this.validateForm(form);
        if (!isValid) {
            this.scrollToFirstError();
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // 로딩 상태 설정
            this.setFormLoading(true, submitBtn);
            
            // 폼 데이터 준비
            const formData = new FormData(form);
            const jsonData = Object.fromEntries(formData.entries());
            
            // 서버로 전송
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData)
            });

            const result = await response.json();

            if (result.success) {
                this.handleSubmissionSuccess(form);
            } else {
                this.handleSubmissionError(result.message || '전송에 실패했습니다.');
            }

        } catch (error) {
            console.error('폼 제출 오류:', error);
            this.handleSubmissionError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            this.setFormLoading(false, submitBtn, originalText);
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

        // 개인정보 동의 체크
        const privacyCheck = form.querySelector('#privacy');
        if (privacyCheck && !privacyCheck.checked) {
            this.showFieldError(privacyCheck, '개인정보 수집 및 이용에 동의해주세요.');
            isValid = false;
        }

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
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>전송 중...';
            submitBtn.disabled = true;
            document.getElementById('contactForm').classList.add('form-loading');
        } else {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            document.getElementById('contactForm').classList.remove('form-loading');
        }
    },

    // 제출 성공 처리
    handleSubmissionSuccess(form) {
        // 성공 메시지 표시
        UI.showToast('메시지가 성공적으로 전송되었습니다! 24-48시간 내에 답변드리겠습니다.', 'success', 5000);
        
        // 폼 리셋
        form.reset();
        
        // 유효성 검사 클래스 제거
        const validatedFields = form.querySelectorAll('.is-valid, .is-invalid');
        validatedFields.forEach(field => {
            this.clearFieldError(field);
        });

        // 글자 수 카운터 리셋
        const messageTextarea = document.getElementById('message');
        if (messageTextarea) {
            messageTextarea.dispatchEvent(new Event('input'));
        }

        // 감사 메시지 모달 표시 (선택사항)
        this.showThankYouModal();

        // 분석 이벤트 전송 (Google Analytics 등)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_submit', {
                'event_category': 'Contact',
                'event_label': 'Success'
            });
        }
    },

    // 제출 오류 처리
    handleSubmissionError(message) {
        UI.showToast(`오류가 발생했습니다: ${message}`, 'danger', 5000);
        
        // 분석 이벤트 전송
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_error', {
                'event_category': 'Contact',
                'event_label': 'Error',
                'value': message
            });
        }
    },

    // 감사 메시지 모달 표시
    showThankYouModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-4">
                        <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                        <h4 class="mb-3">메시지 전송 완료!</h4>
                        <p class="mb-4">소중한 연락 감사합니다.<br>빠른 시일 내에 답변드리겠습니다.</p>
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">확인</button>
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

    // 접근성 설정
    setupAccessibility() {
        // 폼 필드에 aria-label 추가
        const formFields = document.querySelectorAll('#contactForm input, #contactForm textarea, #contactForm select');
        formFields.forEach(field => {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label && !field.getAttribute('aria-label')) {
                field.setAttribute('aria-label', label.textContent.trim());
            }
        });

        // 필수 필드 표시 개선
        const requiredFields = document.querySelectorAll('#contactForm [required]');
        requiredFields.forEach(field => {
            field.setAttribute('aria-required', 'true');
            
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label && !label.querySelector('.sr-only')) {
                const srText = document.createElement('span');
                srText.className = 'sr-only';
                srText.textContent = ' (필수)';
                label.appendChild(srText);
            }
        });

        // 키보드 네비게이션 개선
        document.addEventListener('keydown', (e) => {
            // Enter로 폼 제출 방지 (textarea 제외)
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
                this.focusNextField(e.target);
            }
        });
    },

    // 다음 필드로 포커스 이동
    focusNextField(currentField) {
        const formFields = Array.from(document.querySelectorAll('#contactForm input, #contactForm textarea, #contactForm select, #contactForm button'));
        const currentIndex = formFields.indexOf(currentField);
        
        if (currentIndex >= 0 && currentIndex < formFields.length - 1) {
            formFields[currentIndex + 1].focus();
        }
    }
};

// FAQ 아코디언 이벤트 핸들러
const FAQController = {
    init() {
        this.setupAccordion();
        this.setupKeyboardNavigation();
    },

    setupAccordion() {
        const accordionButtons = document.querySelectorAll('.accordion-button');
        
        accordionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 부드러운 스크롤 효과
                setTimeout(() => {
                    if (!button.classList.contains('collapsed')) {
                        button.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest' 
                        });
                    }
                }, 300);
            });
        });
    },

    setupKeyboardNavigation() {
        const accordionButtons = document.querySelectorAll('.accordion-button');
        
        accordionButtons.forEach((button, index) => {
            button.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextIndex = (index + 1) % accordionButtons.length;
                        accordionButtons[nextIndex].focus();
                        break;
                        
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevIndex = index === 0 ? accordionButtons.length - 1 : index - 1;
                        accordionButtons[prevIndex].focus();
                        break;
                        
                    case 'Home':
                        e.preventDefault();
                        accordionButtons[0].focus();
                        break;
                        
                    case 'End':
                        e.preventDefault();
                        accordionButtons[accordionButtons.length - 1].focus();
                        break;
                }
            });
        });
    }
};

// 연락처 정보 애니메이션
const ContactInfoController = {
    init() {
        this.setupHoverEffects();
        this.setupClickToCopy();
        this.setupSocialLinks();
    },

    setupHoverEffects() {
        const contactItems = document.querySelectorAll('.contact-item');
        
        contactItems.forEach(item => {
            const icon = item.querySelector('.contact-icon');
            const link = item.querySelector('a');
            
            if (icon && link) {
                item.addEventListener('mouseenter', () => {
                    icon.style.transform = 'scale(1.1)';
                    link.style.color = 'var(--accent-color)';
                });

                item.addEventListener('mouseleave', () => {
                    icon.style.transform = 'scale(1)';
                    link.style.color = '';
                });
            }
        });
    },

    setupClickToCopy() {
        const copyableItems = document.querySelectorAll('.contact-item a[href^="mailto:"], .contact-item a[href^="tel:"]');
        
        copyableItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) { // Ctrl+Click 또는 Cmd+Click
                    e.preventDefault();
                    
                    const text = item.textContent.trim();
                    navigator.clipboard.writeText(text).then(() => {
                        UI.showToast(`${text}가 클립보드에 복사되었습니다.`, 'info', 3000);
                    }).catch(() => {
                        // 클립보드 API 실패시 fallback
                        this.fallbackCopyToClipboard(text);
                    });
                }
            });
            
            // 툴팁 추가
            item.setAttribute('title', 'Ctrl+클릭으로 복사할 수 있습니다');
        });
    },

    // 클립보드 복사 fallback
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            UI.showToast(`${text}가 클립보드에 복사되었습니다.`, 'info', 3000);
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
        }
        
        document.body.removeChild(textArea);
    },

    setupSocialLinks() {
        const socialLinks = document.querySelectorAll('a[href*="instagram"], a[href*="facebook"], a[href*="twitter"]');
        
        socialLinks.forEach(link => {
            link.addEventListener('click', () => {
                // 분석 이벤트 전송
                if (typeof gtag !== 'undefined') {
                    const platform = this.getSocialPlatform(link.href);
                    gtag('event', 'social_link_click', {
                        'event_category': 'Social',
                        'event_label': platform
                    });
                }
            });
        });
    },

    getSocialPlatform(url) {
        if (url.includes('instagram')) return 'Instagram';
        if (url.includes('facebook')) return 'Facebook';
        if (url.includes('twitter')) return 'Twitter';
        return 'Unknown';
    }
};

// 서비스 목록 애니메이션
const ServicesController = {
    init() {
        this.setupListAnimations();
        this.setupServiceDetails();
    },

    setupListAnimations() {
        const serviceItems = document.querySelectorAll('.services-list li');
        
        serviceItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100);
        });
    },

    setupServiceDetails() {
        const serviceItems = document.querySelectorAll('.services-list li');
        
        const serviceDetails = {
            '커스텀 작품 의뢰': '개인 맞춤형 아트워크 제작 서비스입니다.',
            '개인/그룹 미술 레슨': '1:1 또는 소그룹 미술 교육을 제공합니다.',
            '전시 기획 및 협업': '전시회 기획부터 작품 선정까지 전문적으로 지원합니다.',
            '작품 컨설팅': '작품 선택과 배치에 대한 전문적인 조언을 제공합니다.',
            '워크숍 진행': '다양한 주제의 미술 워크숍을 개최합니다.'
        };
        
        serviceItems.forEach(item => {
            const serviceName = item.textContent.trim();
            const detail = serviceDetails[serviceName];
            
            if (detail) {
                item.setAttribute('title', detail);
                item.style.cursor = 'help';
            }
        });
    }
};

// 폼 자동저장 기능
const AutoSaveController = {
    init() {
        this.setupAutoSave();
        this.loadSavedData();
    },

    setupAutoSave() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('input', Utils.debounce(() => {
                this.saveFormData();
            }, 1000));
        });
    },

    saveFormData() {
        const form = document.getElementById('contactForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 개인정보는 저장하지 않음
        delete data.email;
        delete data.phone;
        
        Utils.storage.set('contact_form_draft', {
            ...data,
            timestamp: Date.now()
        });
    },

    loadSavedData() {
        const savedData = Utils.storage.get('contact_form_draft');
        
        if (savedData && Date.now() - savedData.timestamp < 24 * 60 * 60 * 1000) { // 24시간 이내
            const shouldRestore = confirm('이전에 작성하던 내용이 있습니다. 복원하시겠습니까?');
            
            if (shouldRestore) {
                Object.keys(savedData).forEach(key => {
                    if (key !== 'timestamp') {
                        const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                        if (field) {
                            field.value = savedData[key];
                        }
                    }
                });
                
                UI.showToast('이전 작성 내용을 복원했습니다.', 'info', 3000);
            }
        }
    },

    clearSavedData() {
        Utils.storage.remove('contact_form_draft');
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Contact page loaded');
    
    // 모든 컨트롤러 초기화
    ContactController.init();
    FAQController.init();
    ContactInfoController.init();
    ServicesController.init();
    AutoSaveController.init();
    
    // 폼 제출 성공 시 자동저장 데이터 삭제
    document.getElementById('contactForm')?.addEventListener('submit', () => {
        setTimeout(() => {
            AutoSaveController.clearSavedData();
        }, 2000);
    });
    
    // 페이지 이탈 시 확인 (작성 중인 내용이 있을 때)
    window.addEventListener('beforeunload', (e) => {
        const form = document.getElementById('contactForm');
        const hasContent = Array.from(form.querySelectorAll('input, textarea')).some(input => 
            input.value.trim().length > 0
        );
        
        if (hasContent) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
    
    // 접근성: 폼 라벨 클릭 시 해당 필드로 포커스
    document.querySelectorAll('label[for]').forEach(label => {
        label.addEventListener('click', () => {
            const targetId = label.getAttribute('for');
            const targetField = document.getElementById(targetId);
            if (targetField) {
                targetField.focus();
            }
        });
    });
});

// 에러 핸들링
window.addEventListener('error', function(e) {
    console.error('Contact page error:', e.error);
    
    // 사용자에게 친화적인 에러 메시지
    if (e.error.message.includes('network') || e.error.message.includes('fetch')) {
        UI.showToast('네트워크 연결을 확인해주세요.', 'warning');
    }
});

// 유틸리티 함수들을 전역으로 노출
window.ContactUtils = {
    // 폼 데이터를 JSON으로 변환
    formToJSON(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    },
    
    // 이메일 도메인 추천
    suggestEmailDomain(email) {
        const commonDomains = ['gmail.com', 'naver.com', 'hanmail.net', 'daum.net', 'hotmail.com'];
        const parts = email.split('@');
        
        if (parts.length === 2) {
            const domain = parts[1];
            const suggestions = commonDomains.filter(d => 
                d.includes(domain) || domain.includes(d.substring(0, 3))
            );
            return suggestions;
        }
        
        return [];
    },
    
    // 폼 필드 값 검증
    validateFormData(data) {
        const errors = [];
        
        if (!data.name || data.name.length < 2) {
            errors.push('이름은 2자 이상이어야 합니다.');
        }
        
        if (!data.email || !Utils.isValidEmail(data.email)) {
            errors.push('올바른 이메일 주소를 입력해주세요.');
        }
        
        if (!data.message || data.message.length < 10) {
            errors.push('메시지는 10자 이상이어야 합니다.');
        }
        
        return errors;
    }
};