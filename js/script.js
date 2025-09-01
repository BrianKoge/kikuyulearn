// Import Supabase functions
import { auth, profiles, lessons, learningSessions, achievements, leaderboard, userProgress } from './supabase-config.js'

// Global variables
let currentUser = null

// Make functions globally accessible for onclick handlers
window.showLoginModal = showLoginModal;
window.showSignupModal = showSignupModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.scrollToFeatures = scrollToFeatures;
window.signOut = signOut;

// Modal functionality
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

function switchModal(fromModal, toModal) {
    closeModal(fromModal);
    document.getElementById(toModal).style.display = 'block';
}

// Smooth scrolling
function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (event.target === loginModal) {
        closeModal('loginModal');
    }
    if (event.target === signupModal) {
        closeModal('signupModal');
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        
        if (loginModal && loginModal.style.display === 'block') {
            closeModal('loginModal');
        }
        if (signupModal && signupModal.style.display === 'block') {
            closeModal('signupModal');
        }
    }
});

// Show loading state
function showLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    button.disabled = true;
    return originalText;
}

// Hide loading state
function hideLoading(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 300);
    }, 3000);
}

// Update UI based on auth state
function updateUIForAuthState(user) {
    const navButtons = document.querySelector('.nav-buttons');
    const heroButtons = document.querySelector('.hero-buttons');
    
    if (user) {
        // User is logged in
        if (navButtons) {
            navButtons.innerHTML = `
                <span class="user-welcome">Welcome, ${user.user_metadata?.full_name || user.email}</span>
                <button class="btn btn-outline" onclick="signOut()">Sign Out</button>
            `;
        }
        
        if (heroButtons) {
            heroButtons.innerHTML = `
                <button class="btn btn-primary btn-large" onclick="window.location.href='Html/Lessons.html'">
                    <i class="fas fa-play"></i>
                    Continue Learning
                </button>
                <button class="btn btn-outline btn-large" onclick="window.location.href='Html/Profile.html'">
                    <i class="fas fa-user"></i>
                    My Profile
                </button>
            `;
        }
    } else {
        // User is not logged in
        if (navButtons) {
            navButtons.innerHTML = `
                <button class="btn btn-outline" onclick="showLoginModal()">Login</button>
                <button class="btn btn-primary" onclick="showSignupModal()">Sign Up</button>
            `;
        }
        
        if (heroButtons) {
            heroButtons.innerHTML = `
                <button class="btn btn-primary btn-large" onclick="showSignupModal()">
                    <i class="fas fa-play"></i>
                    Start Learning
                </button>
                <button class="btn btn-outline btn-large" onclick="scrollToFeatures()">
                    <i class="fas fa-info-circle"></i>
                    Learn More
                </button>
            `;
        }
    }
}

// Sign out function
async function signOut() {
    try {
        await auth.signOut();
        showSuccessMessage('Signed out successfully!');
        currentUser = null;
        updateUIForAuthState(null);
    } catch (error) {
        showErrorMessage('Error signing out: ' + error.message);
    }
}

// Form handling
document.addEventListener('DOMContentLoaded', function() {
    // Check auth state on page load
    checkAuthState();
    
    // Login form
    const loginForm = document.querySelector('#loginModal .auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = showLoading(submitButton);
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const { user, session } = await auth.signIn(email, password);
                showSuccessMessage('Welcome back to Kikuyulearn!');
                closeModal('loginModal');
                this.reset();
                currentUser = user;
                updateUIForAuthState(user);
            } catch (error) {
                showErrorMessage('Login failed: ' + error.message);
            } finally {
                hideLoading(submitButton, originalText);
            }
        });
    }
    
    // Signup form
    const signupForm = document.querySelector('#signupModal .auth-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = showLoading(submitButton);
            
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            // Basic validation
            if (password !== confirmPassword) {
                showErrorMessage('Passwords do not match!');
                hideLoading(submitButton, originalText);
                return;
            }
            
            if (password.length < 6) {
                showErrorMessage('Password must be at least 6 characters long!');
                hideLoading(submitButton, originalText);
                return;
            }
            
            try {
                const { user, session } = await auth.signUp(email, password, name);
                showSuccessMessage('Account created successfully! Welcome to Kikuyulearn!');
                closeModal('signupModal');
                this.reset();
                currentUser = user;
                updateUIForAuthState(user);
            } catch (error) {
                showErrorMessage('Signup failed: ' + error.message);
            } finally {
                hideLoading(submitButton, originalText);
            }
        });
    }
});

// Check authentication state
async function checkAuthState() {
    try {
        const user = await auth.getCurrentUser();
        if (user) {
            currentUser = user;
            updateUIForAuthState(user);
        } else {
            updateUIForAuthState(null);
        }
    } catch (error) {
        console.error('Error checking auth state:', error);
        updateUIForAuthState(null);
    }
}

// Listen to auth state changes
auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        updateUIForAuthState(session.user);
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateUIForAuthState(null);
    }
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    }
});

// Smooth scrolling for navigation links
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

// Add loading animation to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function() {
        if (this.classList.contains('btn-primary') && !this.classList.contains('btn-full')) {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        }
    });
});

// Feature cards hover effect enhancement
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Form validation enhancement
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.value && !validateEmail(this.value)) {
            this.style.borderColor = '#e74c3c';
            this.setCustomValidity('Please enter a valid email address');
        } else {
            this.style.borderColor = '#FF6B35';
            this.setCustomValidity('');
        }
    });
});

// Password strength indicator
document.querySelectorAll('input[type="password"]').forEach(input => {
    input.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;
        
        if (password.length >= 6) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        
        const colors = ['#e74c3c', '#f39c12', '#FF6B35', '#20B2AA', '#2ecc71'];
        this.style.borderColor = colors[strength - 1] || '#e9ecef';
    });
});

// Add CSS animations for success messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
