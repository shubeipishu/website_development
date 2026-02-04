/**
 * 视觉增强效果模块
 * - 图论风格粒子背景
 * - 打字机效果
 * - 卡片3D悬浮
 * - 滚动渐入动画
 * - 按钮涟漪效果
 */

// ============================================================
// 图论风格粒子背景
// ============================================================
class ParticleNetwork {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.particleCount = 60;
        this.maxDistance = 120;
        this.animationId = null;

        this.init();
        this.animate();
        this.bindEvents();
    }

    init() {
        this.resize();
        this.createParticles();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    drawParticle(p) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);

        if (isDark) {
            gradient.addColorStop(0, `rgba(139, 92, 246, ${p.opacity})`);
            gradient.addColorStop(1, `rgba(6, 182, 212, ${p.opacity * 0.5})`);
        } else {
            gradient.addColorStop(0, `rgba(99, 102, 241, ${p.opacity})`);
            gradient.addColorStop(1, `rgba(14, 165, 233, ${p.opacity * 0.5})`);
        }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    drawConnections() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.maxDistance) {
                    const opacity = (1 - distance / this.maxDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);

                    if (isDark) {
                        this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
                    } else {
                        this.ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
                    }
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
    }

    drawMouseConnections() {
        if (this.mouse.x === null || this.mouse.y === null) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        for (const p of this.particles) {
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.mouse.radius) {
                const opacity = (1 - distance / this.mouse.radius) * 0.6;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(this.mouse.x, this.mouse.y);

                if (isDark) {
                    this.ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`;
                } else {
                    this.ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
                }
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }

    update() {
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            // 边界反弹
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // 鼠标互动 - 轻微排斥
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {
                    const force = (this.mouse.radius - distance) / this.mouse.radius * 0.02;
                    p.x += dx * force;
                    p.y += dy * force;
                }
            }
        }
    }

    animate() {
        // 绘制背景色
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawConnections();
        this.drawMouseConnections();

        for (const p of this.particles) {
            this.drawParticle(p);
        }

        this.update();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// ============================================================
// 打字机效果
// ============================================================
class Typewriter {
    constructor(element, texts, options = {}) {
        this.element = element;
        this.texts = texts;
        this.speed = options.speed || 100;
        this.deleteSpeed = options.deleteSpeed || 50;
        this.pauseTime = options.pauseTime || 2000;
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;

        this.type();
    }

    type() {
        const currentText = this.texts[this.currentTextIndex];

        if (this.isDeleting) {
            this.currentCharIndex--;
            this.element.textContent = currentText.substring(0, this.currentCharIndex);
        } else {
            this.currentCharIndex++;
            this.element.textContent = currentText.substring(0, this.currentCharIndex);
        }

        let timeout = this.isDeleting ? this.deleteSpeed : this.speed;

        if (!this.isDeleting && this.currentCharIndex === currentText.length) {
            timeout = this.pauseTime;
            this.isDeleting = true;
        } else if (this.isDeleting && this.currentCharIndex === 0) {
            this.isDeleting = false;
            this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
            timeout = 500;
        }

        setTimeout(() => this.type(), timeout);
    }
}

// ============================================================
// 卡片悬浮效果（简化版 - 光晕 + 微升）
// ============================================================
function initCardHover() {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-6px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// ============================================================
// 滚动渐入动画
// ============================================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 添加动画类到目标元素
    document.querySelectorAll('.section-title, .project-card, .faq-item, .changelog-item, .feedback-form').forEach(el => {
        el.classList.add('scroll-animate');
        observer.observe(el);
    });
}

// ============================================================
// 按钮涟漪效果
// ============================================================
function initRippleEffect() {
    document.querySelectorAll('.btn, .form-submit, .nav-link').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
            ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ============================================================
// 初始化所有效果
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 粒子背景
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        new ParticleNetwork(canvas);
    }

    // 2. 打字机效果
    const typewriterEl = document.getElementById('typewriter-text');
    if (typewriterEl) {
        new Typewriter(typewriterEl, [
            '树皮斑马',
            'Bark Zebra',
            '图论爱好者',
            'Web 开发者'
        ], {
            speed: 120,
            deleteSpeed: 60,
            pauseTime: 2500
        });
    }

    // 3. 卡片悬浮效果
    initCardHover();

    // 4. 滚动动画
    initScrollAnimations();

    // 5. 涟漪效果
    initRippleEffect();
});
