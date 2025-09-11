/**
 * Enhanced UI Interactions and Animations
 * Kikuyulearn - Modern UI Enhancements
 */

// Enhanced scroll effects and animations
class EnhancedUI {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollEffects();
        this.setupNavbarScroll();
        this.setupSmoothScrolling();
        this.setupFormEnhancements();
        this.setupLoadingStates();
        this.setupMicroInteractions();
    }

    // Navbar scroll effects
    setupNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Hide/show navbar on scroll
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
        });
    }

    // Scroll-triggered animations
    setupScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll('.feature-card, .lesson-card, .category-card');
        animateElements.forEach(el => {
            observer.observe(el);
        });
    }

    // Enhanced smooth scrolling
    setupSmoothScrolling() {
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

    // Form enhancements
    setupFormEnhancements() {
        // Enhanced form inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Add floating label effect
            if (input.type !== 'submit' && input.type !== 'button') {
                input.addEventListener('focus', () => {
                    input.parentElement.classList.add('focused');
                });

                input.addEventListener('blur', () => {
                    if (!input.value) {
                        input.parentElement.classList.remove('focused');
                    }
                });

                // Check if input has value on load
                if (input.value) {
                    input.parentElement.classList.add('focused');
                }
            }

            // Add input validation feedback
            input.addEventListener('input', () => {
                this.validateInput(input);
            });
        });
    }

    // Input validation with visual feedback
    validateInput(input) {
        const isValid = input.checkValidity();
        const parent = input.parentElement;
        
        parent.classList.remove('valid', 'invalid');
        
        if (input.value) {
            parent.classList.add(isValid ? 'valid' : 'invalid');
        }
    }

    // Loading states for buttons
    setupLoadingStates() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                if (this.type === 'submit' || this.classList.contains('loading-trigger')) {
                    this.classList.add('loading');
                    this.disabled = true;
                    
                    // Add loading spinner
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                    
                    // Simulate loading (remove in production)
                    setTimeout(() => {
                        this.classList.remove('loading');
                        this.disabled = false;
                        this.innerHTML = originalText;
                    }, 2000);
                }
            });
        });
    }

    // Micro-interactions
    setupMicroInteractions() {
        // Card hover effects
        const cards = document.querySelectorAll('.feature-card, .lesson-card, .category-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Button ripple effect
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');

                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    // Show success/error messages with enhanced styling
    showMessage(message, type = 'success') {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
            font-weight: 500;
        `;

        document.body.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 5000);
    }

    // Enhanced modal functionality
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Add entrance animation
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }
}

// Enhanced CSS for animations and effects
const enhancedStyles = `
    /* Animation classes */
    .animate-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }

    /* Loading button styles */
    .btn.loading {
        pointer-events: none;
        opacity: 0.7;
    }

    .btn.loading i {
        animation: spin 1s linear infinite;
    }

    /* Form validation styles */
    .form-group.valid input,
    .form-group.valid textarea,
    .form-group.valid select {
        border-color: var(--success);
        box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
    }

    .form-group.invalid input,
    .form-group.invalid textarea,
    .form-group.invalid select {
        border-color: var(--error);
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }

    /* Ripple effect */
    .btn {
        position: relative;
        overflow: hidden;
    }

    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }

    /* Enhanced modal styles */
    .modal.show .modal-content {
        animation: modalSlideIn 0.3s ease-out;
    }

    /* Message animations */
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Enhanced focus states */
    .btn:focus,
    .nav-link:focus,
    input:focus,
    textarea:focus,
    select:focus {
        outline: 2px solid var(--primary-orange);
        outline-offset: 2px;
    }

    /* Improved accessibility */
    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;

// Inject enhanced styles
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancedStyles;
document.head.appendChild(styleSheet);

// Initialize enhanced UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedUI = new EnhancedUI();
});

// Export for use in other scripts
window.EnhancedUI = EnhancedUI;
