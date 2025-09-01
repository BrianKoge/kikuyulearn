// Kikuyulearn - Main JavaScript File
console.log('Script loaded successfully!');

// Global variables
let currentUser = null;
let lastSignupAttempt = 0; // Track last signup attempt time
let lastLoginAttempt = 0; // Track last login attempt time

// Load user from localStorage on script load
async function loadStoredUser() {
    try {
        const storedUser = localStorage.getItem('kikuyulearn_user');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            console.log('Loaded stored user:', currentUser);
            updateUIForAuthState(currentUser);
            
            // Load user progress from Supabase if authenticated with proper UUID
            if (currentUser && currentUser.id && !currentUser.id.startsWith('demo_user_') && typeof UserProgressManager !== 'undefined') {
                try {
                    const userProfile = await UserProgressManager.getUserProfile(currentUser.id);
                    
                    if (userProfile) {
                        // Update currentUser with latest Supabase data
                        currentUser.points = userProfile.points || 0;
                        currentUser.full_name = userProfile.full_name || currentUser.full_name;
                        
                        // Try to get progress data
                        try {
                            const supabaseProgress = await UserProgressManager.getUserProgress(currentUser.id);
                            if (supabaseProgress) {
                                currentUser.completedLessons = supabaseProgress
                                    .filter(p => p.progress_percentage >= 100)
                                    .map(p => p.lesson_id);
                                
                                // Update individual lesson progress
                                supabaseProgress.forEach(progress => {
                                    localStorage.setItem(`lesson-${progress.lesson_id}-progress`, progress.progress_percentage.toString());
                                });
                            }
                        } catch (progressError) {
                            console.log('No progress data available yet:', progressError.message);
                            currentUser.completedLessons = [];
                        }
                        
                        // Update localStorage with Supabase data
                        localStorage.setItem('userProgress', JSON.stringify({
                            points: currentUser.points,
                            completedLessons: currentUser.completedLessons || []
                        }));
                        
                        console.log('User profile synced from Supabase:', currentUser);
                    } else {
                        // If profile creation failed, use stored user data
                        console.log('Using stored user data as fallback');
                        currentUser.points = currentUser.points || 0;
                        currentUser.completedLessons = currentUser.completedLessons || [];
                    }
                } catch (error) {
                    console.error('Failed to sync profile from Supabase:', error);
                    // Use stored user data as fallback
                    console.log('Using stored user data as fallback due to error');
                    currentUser.points = currentUser.points || 0;
                    currentUser.completedLessons = currentUser.completedLessons || [];
                }
            } else {
                console.log('Skipping Supabase sync for demo user or unauthenticated user');
            }
        }
    } catch (error) {
        console.error('Error loading stored user:', error);
        localStorage.removeItem('kikuyulearn_user');
    }
}

// Save user to localStorage
function saveUserToStorage(user) {
    try {
        if (user) {
            localStorage.setItem('kikuyulearn_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('kikuyulearn_user');
        }
    } catch (error) {
        console.error('Error saving user to storage:', error);
    }
}

// Make functions globally accessible for onclick handlers
window.showLoginModal = showLoginModal;
window.showSignupModal = showSignupModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.scrollToFeatures = scrollToFeatures;
window.signOut = signOut;
window.switchTab = switchTab;
window.editProfile = editProfile;

// Modal functionality
function showLoginModal() {
    console.log('showLoginModal called');
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Login modal not found');
    }
}

function showSignupModal() {
    console.log('showSignupModal called');
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Signup modal not found');
    }
}

function closeModal(modalId) {
    console.log('closeModal called with:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Remove dynamically created modals
        if (modalId === 'editProfileModal' || modalId === 'lessonModal') {
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    } else {
        console.error('Modal not found:', modalId);
    }
}

function switchModal(fromModal, toModal) {
    console.log('switchModal called:', fromModal, 'to', toModal);
    closeModal(fromModal);
    const modal = document.getElementById(toModal);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Smooth scrolling
function scrollToFeatures() {
    console.log('scrollToFeatures called');
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({
            behavior: 'smooth'
        });
    } else {
        console.log('Features section not found, scrolling to top');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Sign out function
async function signOut() {
    console.log('signOut called');
    try {
        // Sign out from Supabase
        if (typeof AuthManager !== 'undefined') {
            await AuthManager.signOut();
        }
    } catch (error) {
        console.error('Error signing out:', error);
    }
    
    currentUser = null;
    saveUserToStorage(null);
    updateUIForAuthState(null);
    // Redirect to home page
                window.location.href = '../index.html';
}

// Create user profile in Supabase
async function createUserProfile(profile) {
    try {
        const supabaseClient = initializeSupabase();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                points: profile.points,
                avatar_url: profile.avatar_url,
                created_at: profile.created_at,
                updated_at: profile.updated_at
            });

        if (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }

        console.log('User profile created successfully:', data);
        return data;
    } catch (error) {
        console.error('Failed to create user profile:', error);
        throw error;
    }
}

// Functions for Leaderboard page
function switchTab(tab) {
    console.log('switchTab called with:', tab);
    // Remove active class from all tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // For now, just show an alert. In a real app, this would filter the leaderboard
    alert(`Switched to ${tab} leaderboard! This would filter the rankings.`);
}

// Functions for Profile page
function editProfile() {
    console.log('editProfile called');
    showEditProfileModal();
}

// Show edit profile modal
function showEditProfileModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="editProfileModal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close" onclick="closeModal('editProfileModal')">&times;</span>
                <h2><i class="fas fa-edit"></i> Edit Profile</h2>
                
                <form id="editProfileForm" class="auth-form">
                    <div class="form-group">
                        <label for="editFullName">Full Name</label>
                        <input type="text" id="editFullName" value="${currentUser?.full_name || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" value="${currentUser?.email || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editBio">Bio</label>
                        <textarea id="editBio" rows="3" placeholder="Tell us about yourself...">${currentUser?.bio || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="editLanguage">Preferred Language</label>
                        <select id="editLanguage">
                            <option value="en" ${currentUser?.preferred_language === 'en' ? 'selected' : ''}>English</option>
                            <option value="sw" ${currentUser?.preferred_language === 'sw' ? 'selected' : ''}>Swahili</option>
                            <option value="ki" ${currentUser?.preferred_language === 'ki' ? 'selected' : ''}>Kikuyu</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editNotifications">Email Notifications</label>
                        <select id="editNotifications">
                            <option value="daily" ${currentUser?.notifications === 'daily' ? 'selected' : ''}>Daily</option>
                            <option value="weekly" ${currentUser?.notifications === 'weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="none" ${currentUser?.notifications === 'none' ? 'selected' : ''}>None</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editAvatar">Profile Picture</label>
                        <input type="file" id="editAvatar" accept="image/*">
                        <small>Upload a new profile picture (optional)</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="closeModal('editProfileModal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Set up form handler
    const form = document.getElementById('editProfileForm');
    form.addEventListener('submit', handleProfileUpdate);
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = showLoading(submitButton);
    
    try {
        // Get form data
        const formData = {
            full_name: document.getElementById('editFullName').value,
            email: document.getElementById('editEmail').value,
            bio: document.getElementById('editBio').value,
            preferred_language: document.getElementById('editLanguage').value,
            notifications: document.getElementById('editNotifications').value
        };
        
        // Validate required fields
        if (!formData.full_name || !formData.email) {
            throw new Error('Name and email are required');
        }
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update current user
        currentUser = { ...currentUser, ...formData };
        
        // Update profile display
        updateProfileDisplay(formData);
        
        showSuccessMessage('Profile updated successfully!');
        closeModal('editProfileModal');
        
    } catch (error) {
        showErrorMessage('Failed to update profile: ' + error.message);
    } finally {
        hideLoading(submitButton, originalText);
    }

}

// Update profile display on the page
function updateProfileDisplay(profileData) {
    // Update profile email
    const profileEmail = document.querySelector('.profile-email');
    if (profileEmail) {
        profileEmail.textContent = profileData.email;
    }
    
    // Update display name in settings form
    const displayNameInput = document.getElementById('displayName');
    if (displayNameInput) {
        displayNameInput.value = profileData.full_name;
    }
    
    // Update email in settings form
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.value = profileData.email;
    }
    
    // Update language preference
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.value = profileData.preferred_language;
    }
    
    // Update notifications preference
    const notificationsSelect = document.getElementById('notifications');
    if (notificationsSelect) {
        notificationsSelect.value = profileData.notifications;
    }
    
    // Update navigation welcome message
    updateUIForAuthState(currentUser);
}

// Initialize profile page with user data
function initializeProfilePage() {
    // Check if we're on the profile page
    if (window.location.pathname.includes('../Html/Profile.html')) {
        // For demo purposes, create a sample user if none exists
        if (!currentUser) {
            currentUser = {
                id: 'demo_user',
                email: 'demo@kikuyulearn.com',
                full_name: 'Demo User',
                bio: 'Passionate about learning Kikuyu culture and language.',
                preferred_language: 'en',
                notifications: 'weekly'
            };
        }
        
        // Update profile display
        updateProfileDisplay(currentUser);
        
        // Update profile avatar with first letter of name
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && currentUser.full_name) {
            profileAvatar.textContent = currentUser.full_name.charAt(0).toUpperCase();
        }
        
        // Update settings form with current values
        const displayNameInput = document.getElementById('displayName');
        if (displayNameInput) {
            displayNameInput.value = currentUser.full_name || '';
        }
        
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = currentUser.email || '';
        }
        
        const languageSelect = document.getElementById('language');
        if (languageSelect) {
            languageSelect.value = currentUser.preferred_language || 'en';
        }
        
        const notificationsSelect = document.getElementById('notifications');
        if (notificationsSelect) {
            notificationsSelect.value = currentUser.notifications || 'weekly';
        }
    }
}

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
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(successDiv);
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 300);
    }, 3000);
}

// Update UI based on authentication state
function updateUIForAuthState(user) {
    const navButtons = document.querySelector('.nav-buttons');
    const navMenu = document.querySelector('.nav-menu');
    
    if (user) {
        // User is logged in
        const displayName = user.full_name || user.user_metadata?.full_name || user.email || 'User';
        
        // Update navigation buttons
        if (navButtons) {
            navButtons.innerHTML = `
                <button class="btn btn-outline" onclick="signOut()">Sign Out</button>
            `;
        }
        
        // Update navigation menu for authenticated users
        if (navMenu) {
            navMenu.innerHTML = `
                <a href="../Html/Lessons.html" class="nav-link">Lessons</a>
                <a href="../Html/leaderboard.html" class="nav-link">Leaderboard</a>
                <a href="../Html/Profile.html" class="nav-link">Profile</a>
                <a href="#" class="nav-link sign-out-btn" onclick="signOut(); closeMenu();">Sign Out</a>
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
        
        // Update navigation menu for non-authenticated users
        if (navMenu) {
            navMenu.innerHTML = `
                <a href="#home" class="nav-link">Home</a>
                <a href="#features" class="nav-link">Features</a>
                <a href="#about" class="nav-link">About</a>
                <a href="#contact" class="nav-link">Contact</a>
            `;
        }
    }
}

// Simulated authentication functions
const auth = {
    async signIn(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        // Simulate successful login
        const user = {
            id: 'user_' + Date.now(),
            email: email,
            full_name: email.split('@')[0],
            bio: '',
            preferred_language: 'en',
            notifications: 'weekly'
        };
        
        return { user, session: { user } };
    },
    
    async signUp(email, password, fullName) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation
        if (!email || !password || !fullName) {
            throw new Error('All fields are required');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        // Simulate successful signup
        const user = {
            id: 'user_' + Date.now(),
            email: email,
            full_name: fullName,
            bio: '',
            preferred_language: 'en',
            notifications: 'weekly'
        };
        
        return { user, session: { user } };
    }
};

// Close modal when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const editProfileModal = document.getElementById('editProfileModal');
    const lessonModal = document.getElementById('lessonModal');
    
    if (event.target === loginModal) {
        closeModal('loginModal');
    }
    if (event.target === signupModal) {
        closeModal('signupModal');
    }
    if (event.target === editProfileModal) {
        closeModal('editProfileModal');
    }
    if (event.target === lessonModal) {
        closeModal('lessonModal');
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        const editProfileModal = document.getElementById('editProfileModal');
        const lessonModal = document.getElementById('lessonModal');
        
        if (loginModal && loginModal.style.display === 'block') {
            closeModal('loginModal');
        }
        if (signupModal && signupModal.style.display === 'block') {
            closeModal('signupModal');
        }
        if (editProfileModal && editProfileModal.style.display === 'block') {
            closeModal('editProfileModal');
        }
        if (lessonModal && lessonModal.style.display === 'block') {
            closeModal('lessonModal');
        }
    }
});

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded');
    
    // Load stored user first
    await loadStoredUser();
    
    // Initialize profile page if we're on it
    initializeProfilePage();
    
    // Auto-save progress when user leaves the page
    window.addEventListener('beforeunload', async function() {
        if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_') && typeof UserProgressManager !== 'undefined') {
            try {
                // Get current progress from localStorage
                const savedProgress = localStorage.getItem('userProgress');
                if (savedProgress) {
                    const progress = JSON.parse(savedProgress);
                    
                    // Update user points in Supabase
                    await UserProgressManager.updateUserPoints(window.currentUser.id, progress.points || 0);
                    console.log('Progress auto-saved before page unload');
                }
            } catch (error) {
                console.error('Failed to auto-save progress:', error);
            }
        } else {
            console.log('Skipping auto-save for demo user or unauthenticated user');
        }
    });
    
    // Set up form submission handlers if they exist
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Settings saved successfully!');
        });
    }
    
    // Login form handler
    const loginForm = document.querySelector('#loginModal .auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Check for rate limiting (prevent login attempts within 2 seconds)
            const now = Date.now();
            if (now - lastLoginAttempt < 2000) {
                showErrorMessage('Please wait a few seconds before trying again.');
                return;
            }
            lastLoginAttempt = now;
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = showLoading(submitButton);
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                 // Use Supabase authentication
                 const response = await AuthManager.signIn(email, password);
                 console.log('Auth response:', response);
                 console.log('Response type:', typeof response);
                 console.log('Response keys:', Object.keys(response));
                 
                 if (response.error) {
                     throw response.error;
                 }
                 
                 showSuccessMessage('Welcome back to Kikuyulearn!');
                 closeModal('loginModal');
                 this.reset();
                 
                 // Handle AuthManager response structure: { data, error }
                 const { data } = response;
                 console.log('Extracted data:', data);
                 console.log('Data type:', typeof data);
                 console.log('Data keys:', data ? Object.keys(data) : 'null');
                 
                                   // The user object is directly in data.user (not data.session.user)
                  if (data && data.user) {
                      console.log('Found user in data.user:', data.user);
                      currentUser = data.user;
                      saveUserToStorage(data.user);
                      updateUIForAuthState(data.user);
                  } else {
                      console.error('Auth response data:', data);
                      console.error('No user found in response');
                      throw new Error('Invalid authentication response');
                  }
                
                // Redirect to lessons page after successful login
                setTimeout(() => {
                    window.location.href = '../Html/Lessons.html';
                }, 1500);
                
            } catch (error) {
                // Handle specific Supabase rate limiting error
                if (error.message && error.message.includes('2 seconds')) {
                    showErrorMessage('Please wait a few seconds before trying to log in again.');
                } else {
                    showErrorMessage('Login failed: ' + error.message);
                }
            } finally {
                hideLoading(submitButton, originalText);
            }
        });
    }
    
    // Signup form handler
    const signupForm = document.querySelector('#signupModal .auth-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Check for rate limiting (prevent signup attempts within 3 seconds)
            const now = Date.now();
            if (now - lastSignupAttempt < 3000) {
                showErrorMessage('Please wait a few seconds before trying again.');
                return;
            }
            lastSignupAttempt = now;
            
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
                 // Use Supabase authentication
                 const response = await AuthManager.signUp(email, password, name);
                 console.log('Signup response:', response);
                 console.log('Signup response type:', typeof response);
                 console.log('Signup response keys:', Object.keys(response));
                 
                 if (response.error) {
                     throw response.error;
                 }
                 
                 showSuccessMessage('Account created successfully! Welcome to Kikuyulearn!');
                 closeModal('signupModal');
                 this.reset();
                 
                 // Handle AuthManager response structure: { data, error }
                 const { data } = response;
                 console.log('Signup extracted data:', data);
                 console.log('Signup data type:', typeof data);
                 console.log('Signup data keys:', data ? Object.keys(data) : 'null');
                 
                 let user = null;
                                   // The user object is directly in data.user (not data.session.user)
                  if (data && data.user) {
                      console.log('Found user in signup data.user:', data.user);
                      user = data.user;
                      currentUser = data.user;
                      saveUserToStorage(data.user);
                      updateUIForAuthState(data.user);
                  } else {
                      console.error('Signup response data:', data);
                      console.error('No user found in signup response');
                      throw new Error('Invalid authentication response');
                  }
                 
                 // Create user profile in Supabase
                 if (user) {
                    try {
                                                 const profile = {
                             id: user.id,
                             email: user.email,
                             full_name: name,
                             points: 0,
                             avatar_url: null,
                             created_at: new Date().toISOString(),
                             updated_at: new Date().toISOString()
                         };
                        
                        await createUserProfile(profile);
                        console.log('User profile created in Supabase');
                    } catch (profileError) {
                        console.error('Failed to create user profile:', profileError);
                        // Continue anyway, profile can be created later
                    }
                }
                
                // Redirect to lessons page after successful signup
                setTimeout(() => {
                    window.location.href = '../Html/Lessons.html';
                }, 1500);
                
            } catch (error) {
                // Handle specific Supabase rate limiting error
                if (error.message && error.message.includes('2 seconds')) {
                    showErrorMessage('Please wait a few seconds before trying to sign up again.');
                } else {
                    showErrorMessage('Signup failed: ' + error.message);
                }
            } finally {
                hideLoading(submitButton, originalText);
            }
        });
    }
});

// Window load event
window.addEventListener('load', function() {
    console.log('Window loaded');
    console.log('All functions should be available now');
});
