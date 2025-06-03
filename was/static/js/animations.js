// static/js/animations.js - 전용 애니메이션 라이브러리

'use strict';

// 확장된 애니메이션 컨트롤러
window.AnimationController = {
    // 현재 실행중인 애니메이션들을 추적
    activeAnimations: new Map(),
    
    // 기본 이징 함수들
    easings: {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInBounce: t => 1 - this.easings.easeOutBounce(1 - t),
        easeOutBounce: t => {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
                return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            } else if (t < 2.5 / 2.75) {
                return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            } else {
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        }
    },

    // 커스텀 애니메이션 실행
    animate({
        target,
        properties,
        duration = 1000,
        easing = 'easeOutQuad',
        delay = 0,
        onUpdate = null,
        onComplete = null
    }) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const animationId = Date.now() + Math.random();
        
        setTimeout(() => {
            const startTime = performance.now();
            const startValues = {};
            const endValues = {};
            
            // 시작값과 종료값 계산
            for (const [prop, value] of Object.entries(properties)) {
                if (prop === 'opacity') {
                    startValues[prop] = parseFloat(getComputedStyle(element).opacity) || 0;
                } else if (prop.includes('translate')) {
                    startValues[prop] = 0; // 기본값
                } else {
                    startValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
                }
                endValues[prop] = parseFloat(value);
            }
            
            const tick = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = this.easings[easing](progress);
                
                // 속성 업데이트
                for (const [prop, endValue] of Object.entries(endValues)) {
                    const startValue = startValues[prop];
                    const currentValue = startValue + (endValue - startValue) * easedProgress;
                    
                    if (prop === 'opacity') {
                        element.style.opacity = currentValue;
                    } else if (prop === 'translateX' || prop === 'translateY') {
                        const unit = typeof properties[prop] === 'string' && properties[prop].includes('%') ? '%' : 'px';
                        const transform = element.style.transform || '';
                        const regex = new RegExp(`${prop}\\([^)]*\\)`, 'g');
                        const newTransform = transform.replace(regex, '') + ` ${prop}(${currentValue}${unit})`;
                        element.style.transform = newTransform.trim();
                    } else if (prop === 'scale') {
                        const transform = element.style.transform || '';
                        const regex = /scale\([^)]*\)/g;
                        const newTransform = transform.replace(regex, '') + ` scale(${currentValue})`;
                        element.style.transform = newTransform.trim();
                    } else {
                        element.style[prop] = currentValue + 'px';
                    }
                }
                
                if (onUpdate) onUpdate(easedProgress, element);
                
                if (progress < 1) {
                    this.activeAnimations.set(animationId, requestAnimationFrame(tick));
                } else {
                    this.activeAnimations.delete(animationId);
                    if (onComplete) onComplete(element);
                }
            };
            
            this.activeAnimations.set(animationId, requestAnimationFrame(tick));
        }, delay);
        
        return animationId;
    },

    // 애니메이션 중지
    stop(animationId) {
        if (this.activeAnimations.has(animationId)) {
            cancelAnimationFrame(this.activeAnimations.get(animationId));
            this.activeAnimations.delete(animationId);
        }
    },

    // 모든 애니메이션 중지
    stopAll() {
        this.activeAnimations.forEach(id => cancelAnimationFrame(id));
        this.activeAnimations.clear();
    },

    // 페이드인 애니메이션
    fadeIn(element, duration = 600, delay = 0) {
        return this.animate({
            target: element,
            properties: { opacity: 1 },
            duration,
            delay,
            easing: 'easeOutQuad'
        });
    },

    // 페이드아웃 애니메이션
    fadeOut(element, duration = 600, delay = 0) {
        return this.animate({
            target: element,
            properties: { opacity: 0 },
            duration,
            delay,
            easing: 'easeOutQuad'
        });
    },

    // 슬라이드인 애니메이션
    slideIn(element, direction = 'left', duration = 600, delay = 0) {
        const transforms = {
            left: { translateX: 0 },
            right: { translateX: 0 },
            up: { translateY: 0 },
            down: { translateY: 0 }
        };

        // 시작 위치 설정
        const startTransforms = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            up: 'translateY(-100%)',
            down: 'translateY(100%)'
        };

        element.style.transform = startTransforms[direction];
        element.style.opacity = '1';

        return this.animate({
            target: element,
            properties: transforms[direction],
            duration,
            delay,
            easing: 'easeOutCubic'
        });
    },

    // 바운스 애니메이션
    bounce(element, intensity = 20, duration = 600) {
        return this.animate({
            target: element,
            properties: { translateY: -intensity },
            duration: duration / 4,
            easing: 'easeOutQuad',
            onComplete: () => {
                this.animate({
                    target: element,
                    properties: { translateY: 0 },
                    duration: duration * 3 / 4,
                    easing: 'easeOutBounce'
                });
            }
        });
    },

    // 펄스 애니메이션
    pulse(element, scale = 1.1, duration = 1000, repeat = 1) {
        let count = 0;
        
        const doPulse = () => {
            this.animate({
                target: element,
                properties: { scale },
                duration: duration / 2,
                easing: 'easeInOutQuad',
                onComplete: () => {
                    this.animate({
                        target: element,
                        properties: { scale: 1 },
                        duration: duration / 2,
                        easing: 'easeInOutQuad',
                        onComplete: () => {
                            count++;
                            if (repeat === -1 || count < repeat) {
                                doPulse();
                            }
                        }
                    });
                }
            });
        };
        
        doPulse();
    },

    // 흔들기 애니메이션
    shake(element, intensity = 10, duration = 600) {
        const keyframes = [0, -intensity, intensity, -intensity, intensity, 0];
        let currentFrame = 0;
        const frameDelay = duration / keyframes.length;
        
        const doFrame = () => {
            if (currentFrame < keyframes.length) {
                this.animate({
                    target: element,
                    properties: { translateX: keyframes[currentFrame] },
                    duration: frameDelay,
                    easing: 'linear',
                    onComplete: () => {
                        currentFrame++;
                        if (currentFrame < keyframes.length) {
                            doFrame();
                        }
                    }
                });
            }
        };
        
        doFrame();
    },

    // 회전 애니메이션
    rotate(element, degrees = 360, duration = 1000) {
        let currentRotation = 0;
        
        return this.animate({
            target: element,
            properties: { rotate: degrees },
            duration,
            easing: 'linear',
            onUpdate: (progress) => {
                currentRotation = degrees * progress;
                element.style.transform = `rotate(${currentRotation}deg)`;
            }
        });
    },

    // 순차적 애니메이션
    staggered(elements, animationFunc, delay = 100) {
        const elementList = Array.isArray(elements) ? elements : Array.from(elements);
        
        elementList.forEach((element, index) => {
            setTimeout(() => {
                animationFunc(element, index);
            }, index * delay);
        });
    },

    // 무한 애니메이션
    infinite(element, keyframes, duration = 2000) {
        let currentFrame = 0;
        const frameCount = keyframes.length;
        const frameDuration = duration / frameCount;
        
        const nextFrame = () => {
            const frame = keyframes[currentFrame % frameCount];
            
            this.animate({
                target: element,
                properties: frame.properties,
                duration: frameDuration,
                easing: frame.easing || 'linear',
                onComplete: () => {
                    currentFrame++;
                    nextFrame();
                }
            });
        };
        
        nextFrame();
    }
};

// 스크롤 기반 애니메이션
window.ScrollAnimations = {
    observers: new Map(),
    
    // 스크롤시 나타나는 애니메이션
    onReveal(elements, options = {}) {
        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            animationType: 'fadeIn',
            duration: 600,
            delay: 0,
            stagger: 0,
            ...options
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animationDelay = defaultOptions.delay + (index * defaultOptions.stagger);
                    
                    setTimeout(() => {
                        this.playRevealAnimation(element, defaultOptions.animationType, defaultOptions.duration);
                    }, animationDelay);
                    
                    observer.unobserve(element);
                }
            });
        }, defaultOptions);

        const elementList = typeof elements === 'string' ? 
            document.querySelectorAll(elements) : 
            (elements.length ? elements : [elements]);

        elementList.forEach(el => {
            // 초기 상태 설정
            this.setInitialState(el, defaultOptions.animationType);
            observer.observe(el);
        });

        const observerId = Date.now() + Math.random();
        this.observers.set(observerId, observer);
        return observerId;
    },

    // 초기 상태 설정
    setInitialState(element, animationType) {
        switch (animationType) {
            case 'fadeIn':
                element.style.opacity = '0';
                break;
            case 'slideUp':
                element.style.opacity = '0';
                element.style.transform = 'translateY(50px)';
                break;
            case 'slideDown':
                element.style.opacity = '0';
                element.style.transform = 'translateY(-50px)';
                break;
            case 'slideLeft':
                element.style.opacity = '0';
                element.style.transform = 'translateX(50px)';
                break;
            case 'slideRight':
                element.style.opacity = '0';
                element.style.transform = 'translateX(-50px)';
                break;
            case 'scale':
                element.style.opacity = '0';
                element.style.transform = 'scale(0.8)';
                break;
        }
        element.style.transition = 'none';
    },

    // 나타나는 애니메이션 실행
    playRevealAnimation(element, animationType, duration) {
        element.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        
        switch (animationType) {
            case 'fadeIn':
                element.style.opacity = '1';
                break;
            case 'slideUp':
            case 'slideDown':
            case 'slideLeft':
            case 'slideRight':
                element.style.opacity = '1';
                element.style.transform = 'translate(0, 0)';
                break;
            case 'scale':
                element.style.opacity = '1';
                element.style.transform = 'scale(1)';
                break;
        }

        element.classList.add('animated', 'visible');
    },

    // 스크롤 진행률 기반 애니메이션
    onProgress(element, options = {}) {
        const defaultOptions = {
            start: 0, // 스크롤 시작 지점 (0-1)
            end: 1,   // 스크롤 종료 지점 (0-1)
            property: 'opacity',
            from: 0,
            to: 1,
            ...options
        };

        const updateElement = () => {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top;
            const elementHeight = rect.height;
            const windowHeight = window.innerHeight;
            
            // 요소가 뷰포트에 들어온 정도 계산 (0-1)
            const scrollProgress = Math.max(0, Math.min(1, 
                (windowHeight - elementTop) / (windowHeight + elementHeight)
            ));
            
            // 지정된 구간에서의 진행률 계산
            const rangeProgress = Math.max(0, Math.min(1,
                (scrollProgress - defaultOptions.start) / (defaultOptions.end - defaultOptions.start)
            ));
            
            // 값 보간
            const currentValue = defaultOptions.from + 
                (defaultOptions.to - defaultOptions.from) * rangeProgress;
            
            // 속성 적용
            if (defaultOptions.property === 'opacity') {
                element.style.opacity = currentValue;
            } else if (defaultOptions.property === 'translateY') {
                element.style.transform = `translateY(${currentValue}px)`;
            } else if (defaultOptions.property === 'scale') {
                element.style.transform = `scale(${currentValue})`;
            } else if (defaultOptions.property === 'rotate') {
                element.style.transform = `rotate(${currentValue}deg)`;
            }
        };

        // 쓰로틀된 스크롤 리스너 추가
        const throttledUpdate = Utils.throttle(updateElement, 16);
        window.addEventListener('scroll', throttledUpdate);
        
        // 초기 실행
        updateElement();
        
        return () => window.removeEventListener('scroll', throttledUpdate);
    },

    // 패럴랙스 효과
    parallax(element, speed = 0.5) {
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -speed;
            element.style.transform = `translateY(${rate}px)`;
        };

        const throttledUpdate = Utils.throttle(updateParallax, 16);
        window.addEventListener('scroll', throttledUpdate);
        
        return () => window.removeEventListener('scroll', throttledUpdate);
    },

    // 관찰자 정리
    cleanup(observerId) {
        if (this.observers.has(observerId)) {
            this.observers.get(observerId).disconnect();
            this.observers.delete(observerId);
        }
    },

    // 모든 관찰자 정리
    cleanupAll() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
};

// 텍스트 애니메이션
window.TextAnimations = {
    // 타이핑 효과
    typewriter(element, text, options = {}) {
        const defaultOptions = {
            speed: 50,
            cursor: true,
            loop: false,
            delay: 0,
            ...options
        };

        return new Promise((resolve) => {
            setTimeout(() => {
                let i = 0;
                element.textContent = '';
                
                if (defaultOptions.cursor) {
                    element.style.borderRight = '2px solid';
                    element.style.animation = 'blink 1s infinite';
                }
                
                const timer = setInterval(() => {
                    element.textContent += text.charAt(i);
                    i++;
                    
                    if (i > text.length) {
                        clearInterval(timer);
                        
                        if (!defaultOptions.loop && defaultOptions.cursor) {
                            setTimeout(() => {
                                element.style.borderRight = 'none';
                                element.style.animation = 'none';
                            }, 1000);
                        }
                        
                        if (defaultOptions.loop) {
                            setTimeout(() => {
                                this.typewriter(element, text, defaultOptions);
                            }, 2000);
                        }
                        
                        resolve();
                    }
                }, defaultOptions.speed);
            }, defaultOptions.delay);
        });
    },

    // 글자별 나타나기
    revealWords(element, options = {}) {
        const defaultOptions = {
            delay: 100,
            duration: 600,
            animationType: 'fadeIn',
            ...options
        };

        const text = element.textContent;
        const words = text.split(' ');
        element.innerHTML = '';

        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            span.style.opacity = '0';
            span.style.display = 'inline-block';
            element.appendChild(span);

            setTimeout(() => {
                AnimationController.fadeIn(span, defaultOptions.duration);
            }, index * defaultOptions.delay);
        });
    },

    // 카운트업 애니메이션
    countUp(element, target, options = {}) {
        const defaultOptions = {
            duration: 2000,
            startValue: 0,
            decimals: 0,
            prefix: '',
            suffix: '',
            separator: ',',
            ...options
        };

        const startValue = defaultOptions.startValue;
        const endValue = target;
        const duration = defaultOptions.duration;
        const startTime = performance.now();

        const updateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = startValue + (endValue - startValue) * 
                AnimationController.easings.easeOutQuad(progress);
            
            const displayValue = defaultOptions.decimals > 0 ? 
                currentValue.toFixed(defaultOptions.decimals) : 
                Math.floor(currentValue);
            
            const formattedValue = defaultOptions.separator ? 
                displayValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, defaultOptions.separator) : 
                displayValue;
            
            element.textContent = defaultOptions.prefix + formattedValue + defaultOptions.suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        };

        requestAnimationFrame(updateCount);
    }
};

// CSS 애니메이션 유틸리티
window.CSSAnimations = {
    // CSS 애니메이션 클래스 추가/제거
    addClass(element, className, duration = null) {
        element.classList.add(className);
        
        if (duration) {
            setTimeout(() => {
                element.classList.remove(className);
            }, duration);
        }
    },

    // 애니메이션 완료 대기
    onAnimationEnd(element, callback) {
        const handleAnimationEnd = (e) => {
            if (e.target === element) {
                callback(e);
                element.removeEventListener('animationend', handleAnimationEnd);
            }
        };
        
        element.addEventListener('animationend', handleAnimationEnd);
    },

    // 트랜지션 완료 대기
    onTransitionEnd(element, callback) {
        const handleTransitionEnd = (e) => {
            if (e.target === element) {
                callback(e);
                element.removeEventListener('transitionend', handleTransitionEnd);
            }
        };
        
        element.addEventListener('transitionend', handleTransitionEnd);
    }
};

// 미리 정의된 애니메이션 세트
window.PresetAnimations = {
    // 로딩 애니메이션
    loading: {
        spinner(element) {
            AnimationController.infinite(element, [
                { properties: { rotate: 360 }, easing: 'linear' }
            ], 1000);
        },
        
        pulse(element) {
            AnimationController.infinite(element, [
                { properties: { scale: 1 }, easing: 'easeInOutQuad' },
                { properties: { scale: 1.1 }, easing: 'easeInOutQuad' },
                { properties: { scale: 1 }, easing: 'easeInOutQuad' }
            ], 1500);
        }
    },

    // 호버 효과
    hover: {
        lift(element) {
            element.addEventListener('mouseenter', () => {
                AnimationController.animate({
                    target: element,
                    properties: { translateY: -10 },
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            });

            element.addEventListener('mouseleave', () => {
                AnimationController.animate({
                    target: element,
                    properties: { translateY: 0 },
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            });
        },

        scale(element, scaleFactor = 1.05) {
            element.addEventListener('mouseenter', () => {
                AnimationController.animate({
                    target: element,
                    properties: { scale: scaleFactor },
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            });

            element.addEventListener('mouseleave', () => {
                AnimationController.animate({
                    target: element,
                    properties: { scale: 1 },
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            });
        }
    },

    // 알림 애니메이션
    notification: {
        slideIn(element, direction = 'right') {
            const directions = {
                right: { translateX: '100%' },
                left: { translateX: '-100%' },
                top: { translateY: '-100%' },
                bottom: { translateY: '100%' }
            };

            element.style.transform = Object.values(directions[direction])[0];
            
            AnimationController.animate({
                target: element,
                properties: { translateX: 0, translateY: 0 },
                duration: 500,
                easing: 'easeOutCubic'
            });
        },

        attention(element) {
            AnimationController.shake(element, 15, 500);
        }
    }
};

// 성능 모니터링
window.AnimationPerformance = {
    frameCount: 0,
    lastTime: performance.now(),
    
    startMonitoring() {
        const monitor = () => {
            this.frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - this.lastTime >= 1000) {
                const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
                console.log(`Animation FPS: ${fps}`);
                
                this.frameCount = 0;
                this.lastTime = currentTime;
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('Animation system loaded');
    
    // 기본 스크롤 애니메이션 설정
    ScrollAnimations.onReveal('.fade-in', {
        animationType: 'fadeIn',
        duration: 600,
        stagger: 100
    });
    
    ScrollAnimations.onReveal('.slide-up', {
        animationType: 'slideUp',
        duration: 800,
        stagger: 150
    });
    
    // 성능 모니터링 (개발 모드에서만)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        AnimationPerformance.startMonitoring();
    }
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', function() {
    AnimationController.stopAll();
    ScrollAnimations.cleanupAll();
});

// CSS 키프레임 애니메이션 동적 생성
const style = document.createElement('style');
style.textContent = `
    @keyframes blink {
        0%, 50% { border-color: transparent; }
        51%, 100% { border-color: currentColor; }
    }
    
    .animated {
        animation-fill-mode: both;
    }
    
    .infinite {
        animation-iteration-count: infinite;
    }
`;
document.head.appendChild(style);