// Profile functionality for Kikuyulearn
console.log('Profile.js loaded successfully!');

// Global variables
let currentUserProfile = null;
let initializationComplete = false;

// Check if user is authenticated
function isUserAuthenticated() {
    // Check multiple sources for user authentication
    if (window.currentUser && window.currentUser.id) {
        return true;
    }
    
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) {
        return true;
    }
    
    const storedUser = localStorage.getItem('kikuyulearn_user');
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            return parsedUser && parsedUser.id;
        } catch (e) {
            console.error('Error parsing stored user:', e);
        }
    }
    
    return false;
}

// Initialize profile page
async function initializeProfilePage() {
    if (window.location.pathname.includes('Profile.html')) {
        console.log('Initializing profile page...');
        
        try {
            // Check if user is authenticated
            if (!isUserAuthenticated()) {
                console.log('User not authenticated, redirecting to login...');
                showErrorMessage('Please log in to view your profile');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
                return;
            }
            
            // Show loading state
            showLoadingState();
            
            // Wait for currentUser to be loaded with longer timeout for online deployments
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds for online deployments
            
            while (!window.currentUser && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
                
                // Also check if user data is available in localStorage
                const storedUser = localStorage.getItem('kikuyulearn_user');
                if (storedUser && !window.currentUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        if (parsedUser && parsedUser.id) {
                            window.currentUser = parsedUser;
                            console.log('Loaded user from localStorage:', parsedUser);
                            break;
                        }
                    } catch (e) {
                        console.error('Error parsing stored user:', e);
                    }
                }
            }
            
            console.log('Current user after waiting:', window.currentUser);
            console.log('Attempts made:', attempts);
            
            // If still no user, try to get from Supabase auth session
            if (!window.currentUser) {
                console.log('No user found in window.currentUser, trying Supabase auth session...');
                try {
                    const supabaseClient = initializeSupabase();
                    if (supabaseClient) {
                        const { data: { user }, error } = await supabaseClient.auth.getUser();
                        if (user && !error) {
                            window.currentUser = user;
                            console.log('Loaded user from Supabase auth session:', user);
                        }
                    }
                } catch (authError) {
                    console.error('Error getting user from Supabase auth:', authError);
                }
            }
            
            // Load user profile data
            await loadUserProfile();
            
            console.log('After loadUserProfile - currentUserProfile:', currentUserProfile);
            
            // Update profile display
            updateProfileDisplay();
            
            // Load user statistics
            await loadUserStatistics();
            
            // Hide loading state and show profile
            hideLoadingState();
            
            // Force multiple updates to ensure data is displayed
            setTimeout(() => {
                updateProfileDisplay();
            }, 100);
            
            setTimeout(() => {
                updateProfileDisplay();
            }, 500);
            
            setTimeout(() => {
                updateProfileDisplay();
            }, 1000);
            
            initializationComplete = true;
            
        } catch (error) {
            console.error('Error initializing profile page:', error);
            hideLoadingState();
            showErrorMessage('Failed to load profile data. Retrying...');
            
            // Retry after 2 seconds
            setTimeout(() => {
                if (!initializationComplete) {
                    console.log('Retrying profile initialization...');
                    initializeProfilePage();
                }
            }, 2000);
        }
    }
}

// Show loading state
function showLoadingState() {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    const loadingIndicator = document.getElementById('profileLoadingIndicator');
    
    if (profileName) profileName.textContent = 'Loading...';
    if (profileEmail) profileEmail.textContent = 'Loading...';
    if (displayNameInput) displayNameInput.value = 'Loading...';
    if (emailInput) emailInput.value = 'Loading...';
    
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
}

// Hide loading state
function hideLoadingState() {
    const loadingIndicator = document.getElementById('profileLoadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
}

// Load user profile from Supabase
async function loadUserProfile() {
    try {
        // Try to get authenticated user from multiple sources
        let supabaseUser = null;
        
        // Priority 1: Global currentUser
        if (window.currentUser && window.currentUser.id) {
            supabaseUser = window.currentUser;
            console.log('Using window.currentUser:', supabaseUser);
        }
        // Priority 2: Local currentUser variable
        else if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) {
            supabaseUser = currentUser;
            console.log('Using local currentUser:', supabaseUser);
        }
        // Priority 3: localStorage
        else {
            const storedUser = localStorage.getItem('kikuyulearn_user');
            if (storedUser) {
                try {
                    supabaseUser = JSON.parse(storedUser);
                    console.log('Using stored user from localStorage:', supabaseUser);
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                }
            }
        }
        
        if (supabaseUser && supabaseUser.id) {
            // User is authenticated, get profile from Supabase
            try {
                console.log('Attempting to load profile from Supabase for user:', supabaseUser.id);
                const userProfile = await UserProgressManager.getUserProfile(supabaseUser.id);
                
                if (userProfile) {
                    currentUserProfile = {
                        id: supabaseUser.id,
                        email: userProfile.email || supabaseUser.email,
                        full_name: userProfile.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
                        points: userProfile.total_score || 0,
                        avatar_url: userProfile.avatar_url,
                        created_at: userProfile.created_at,
                        updated_at: userProfile.updated_at
                    };
                    console.log('Profile loaded from Supabase:', currentUserProfile);
                } else {
                    console.log('No profile found in Supabase, creating new profile...');
                    // Create profile if it doesn't exist
                    const displayName = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User';
                    
                    currentUserProfile = {
                        id: supabaseUser.id,
                        email: supabaseUser.email,
                        full_name: displayName,
                        points: 0,
                        avatar_url: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    // Save profile to Supabase
                    await createUserProfile(currentUserProfile);
                }
                
                console.log('User profile loaded successfully:', currentUserProfile);
                
            } catch (error) {
                console.error('Failed to load profile from Supabase:', error);
                // Use the authenticated user data as fallback
                const displayName = supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User';
                
                currentUserProfile = {
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    full_name: displayName,
                    points: 0,
                    avatar_url: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                console.log('Using fallback profile data:', currentUserProfile);
            }
        } else {
            console.log('No authenticated user found, loading from localStorage...');
            // No authenticated user, load from localStorage
            loadFromLocalStorage();
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        loadFromLocalStorage();
    }
}

// Create user profile in Supabase
async function createUserProfile(profile) {
    try {
        const supabaseClient = initializeSupabase();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        console.log('Creating user profile in Supabase:', profile);
        
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                total_score: profile.points,
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

// Load user profile from localStorage only
function loadFromLocalStorage() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        try {
            currentUserProfile = JSON.parse(savedProfile);
            console.log('Profile loaded from localStorage:', currentUserProfile);
        } catch (e) {
            console.error('Error parsing stored profile:', e);
            createDemoProfile();
        }
    } else {
        createDemoProfile();
    }
}

// Create demo profile
function createDemoProfile() {
    currentUserProfile = {
        id: 'demo_user_' + Date.now(),
        email: 'demo@kikuyulearn.com',
        full_name: 'Demo User',
        points: 0,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    console.log('Created demo profile:', currentUserProfile);
}

// Update profile display
function updateProfileDisplay() {
    // Use currentUserProfile if available, otherwise fall back to window.currentUser
    const userData = currentUserProfile || window.currentUser;
    if (!userData) {
        console.log('No user data available for profile display');
        return;
    }
    
    console.log('Updating profile display with user data:', userData);
    
    // Extract user information from different possible structures
    let displayName = '';
    let userEmail = '';
    
    if (userData.full_name) {
        displayName = userData.full_name;
    } else if (userData.user_metadata && userData.user_metadata.full_name) {
        displayName = userData.user_metadata.full_name;
    } else if (userData.email) {
        displayName = userData.email.split('@')[0];
    } else {
        displayName = 'User';
    }
    
    if (userData.email) {
        userEmail = userData.email;
    } else {
        userEmail = 'user@example.com';
    }
    
    console.log('Extracted display name:', displayName, 'and email:', userEmail);
    
    // Update profile header
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    console.log('DOM elements found:', { profileAvatar, profileName, profileEmail });
    
    if (profileAvatar) {
        profileAvatar.textContent = displayName.charAt(0).toUpperCase();
        console.log('Updated profileAvatar with:', displayName.charAt(0).toUpperCase());
    }
    
    if (profileName) {
        profileName.textContent = displayName;
        console.log('Updated profileName with:', displayName);
    }
    
    if (profileEmail) {
        profileEmail.textContent = userEmail;
        console.log('Updated profileEmail with:', userEmail);
    }
    
    // Update form fields
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    
    console.log('Form elements found:', { displayNameInput, emailInput });
    
    if (displayNameInput) {
        displayNameInput.value = displayName;
        console.log('Updated displayNameInput with:', displayName);
    }
    
    if (emailInput) {
        emailInput.value = userEmail;
        console.log('Updated emailInput with:', userEmail);
    }
    
    console.log('Profile display updated with:', { displayName, userEmail });
}

// Load user statistics
async function loadUserStatistics() {
    try {
        let completedLessons = 0;
        let totalPoints = 0;
        let currentStreak = 0;
        
        if (currentUserProfile && !currentUserProfile.id.startsWith('demo_user_')) {
            // Get real data from Supabase
            try {
                const progressData = await UserProgressManager.getUserProgress(currentUserProfile.id);
                completedLessons = progressData.filter(p => p.progress_percentage >= 100).length;
                totalPoints = currentUserProfile.points || 0;
                currentStreak = getCurrentStreak();
            } catch (error) {
                console.error('Failed to load statistics from Supabase:', error);
                // Use localStorage data
                loadStatisticsFromLocalStorage();
            }
        } else {
            // Use localStorage data
            loadStatisticsFromLocalStorage();
        }
        
        // Update statistics display
        updateStatisticsDisplay(completedLessons, totalPoints, currentStreak);
        
    } catch (error) {
        console.error('Error loading user statistics:', error);
        loadStatisticsFromLocalStorage();
    }
}

// Load statistics from localStorage
function loadStatisticsFromLocalStorage() {
    const savedProgress = localStorage.getItem('userProgress');
    const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
    
    let completedLessons = 0;
    lessonIds.forEach(lessonId => {
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        if (parseInt(progress) >= 100) {
            completedLessons++;
        }
    });
    
    const progress = savedProgress ? JSON.parse(savedProgress) : { points: 0 };
    const totalPoints = progress.points || 0;
    const currentStreak = getCurrentStreak();
    
    updateStatisticsDisplay(completedLessons, totalPoints, currentStreak);
}

// Update statistics display
function updateStatisticsDisplay(completedLessons, totalPoints, currentStreak) {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 3) {
        statNumbers[0].textContent = completedLessons;
        statNumbers[1].textContent = totalPoints.toLocaleString();
        statNumbers[2].textContent = currentStreak;
    }
}

// Get current learning streak
function getCurrentStreak() {
    const lastLogin = localStorage.getItem('lastLoginDate');
    const today = new Date().toDateString();
    
    if (!lastLogin) {
        localStorage.setItem('currentStreak', '0');
        localStorage.setItem('lastLoginDate', today);
        return 0;
    }
    
    if (lastLogin === today) {
        return parseInt(localStorage.getItem('currentStreak') || '0');
    } else if (lastLogin === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
        const currentStreak = parseInt(localStorage.getItem('currentStreak') || '0') + 1;
        localStorage.setItem('currentStreak', currentStreak.toString());
        localStorage.setItem('lastLoginDate', today);
        return currentStreak;
    } else {
        localStorage.setItem('currentStreak', '1');
        localStorage.setItem('lastLoginDate', today);
        return 1;
    }
}

// Edit profile function
function editProfile() {
    console.log('editProfile function called');
    
    if (!currentUserProfile) {
        console.error('No currentUserProfile found');
        showErrorMessage('No user profile found. Please refresh the page and try again.');
        return;
    }
    
    // Enable form inputs
    const inputs = document.querySelectorAll('.settings-form input, .settings-form select');
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    // Show save button and hide edit button
    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) {
        saveBtn.style.display = 'inline-block';
        saveBtn.disabled = false;
    }
    
    showSuccessMessage('Profile editing enabled. Make your changes and click "Save Changes".');
}

// Save profile changes
async function saveProfileChanges() {
    console.log('saveProfileChanges function called');
    
    try {
        const displayName = document.getElementById('displayName').value;
        const email = document.getElementById('email').value;
        
        console.log('Form values:', { displayName, email });
        
        if (!currentUserProfile) {
            console.error('No currentUserProfile found');
            showErrorMessage('No user profile found. Please refresh the page and try again.');
            return;
        }
        
        console.log('Current user profile:', currentUserProfile);
        
        // Update local profile
        currentUserProfile.full_name = displayName;
        currentUserProfile.email = email;
        currentUserProfile.updated_at = new Date().toISOString();
        
        console.log('Updated profile:', currentUserProfile);
        
        // Save to Supabase if authenticated
        if (!currentUserProfile.id.startsWith('demo_user_')) {
            console.log('Saving to Supabase for authenticated user');
            try {
                const supabaseClient = initializeSupabase();
                if (!supabaseClient) {
                    throw new Error('Supabase client not initialized');
                }
                
                const { data, error } = await supabaseClient
                    .from('profiles')
                    .update({
                        full_name: displayName,
                        email: email,
                        updated_at: currentUserProfile.updated_at
                    })
                    .eq('id', currentUserProfile.id);
                
                if (error) {
                    console.error('Error updating profile:', error);
                    throw error;
                }
                
                console.log('Profile updated in Supabase:', data);
            } catch (error) {
                console.error('Failed to update profile in Supabase:', error);
                // Continue with localStorage as fallback
            }
        } else {
            console.log('Using localStorage for demo user');
        }
        
        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
        console.log('Profile saved to localStorage');
        
        // Update display
        updateProfileDisplay();
        
        // Disable form inputs and reset button states
        const inputs = document.querySelectorAll('.settings-form input, .settings-form select');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        const editBtn = document.getElementById('editProfileBtn');
        const saveBtn = document.getElementById('saveProfileBtn');
        
        if (editBtn) editBtn.style.display = 'inline-block';
        if (saveBtn) {
            saveBtn.style.display = 'none';
            saveBtn.disabled = true;
        }
        
        showSuccessMessage('Profile updated successfully!');
        
    } catch (error) {
        console.error('Error saving profile changes:', error);
        showErrorMessage('Failed to save profile changes');
    }
}

// Force refresh user data from Supabase
async function forceRefreshUserData() {
    console.log('Force refreshing user data...');
    try {
        // Clear current profile
        currentUserProfile = null;
        initializationComplete = false;
        
        // Re-initialize
        await initializeProfilePage();
    } catch (error) {
        console.error('Error force refreshing user data:', error);
        showErrorMessage('Failed to refresh user data');
    }
}

// Debug function to show current user data
function debugUserData() {
    console.log('=== DEBUG USER DATA ===');
    console.log('window.currentUser:', window.currentUser);
    console.log('currentUserProfile:', currentUserProfile);
    console.log('localStorage kikuyulearn_user:', localStorage.getItem('kikuyulearn_user'));
    console.log('localStorage userProfile:', localStorage.getItem('userProfile'));
    
    // Show debug info on page
    const debugInfo = `
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; font-family: monospace; font-size: 12px;">
            <h4>Debug Information:</h4>
            <p><strong>window.currentUser:</strong> ${JSON.stringify(window.currentUser, null, 2)}</p>
            <p><strong>currentUserProfile:</strong> ${JSON.stringify(currentUserProfile, null, 2)}</p>
            <p><strong>localStorage user:</strong> ${localStorage.getItem('kikuyulearn_user')}</p>
        </div>
    `;
    
    // Insert debug info after the profile header
    const profileHeader = document.querySelector('.profile-header');
    if (profileHeader) {
        const existingDebug = document.querySelector('.debug-info');
        if (existingDebug) {
            existingDebug.remove();
        }
        
        const debugDiv = document.createElement('div');
        debugDiv.className = 'debug-info';
        debugDiv.innerHTML = debugInfo;
        profileHeader.appendChild(debugDiv);
    }
}

// Make functions globally accessible
window.initializeProfilePage = initializeProfilePage;
window.editProfile = editProfile;
window.saveProfileChanges = saveProfileChanges;
window.forceRefreshUserData = forceRefreshUserData;
window.debugUserData = debugUserData;

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile.js: DOM Content Loaded');
    initializeProfilePage();
});

// Also try to initialize when window loads (for cases where DOMContentLoaded fires too early)
window.addEventListener('load', function() {
    console.log('Profile.js: Window loaded');
    if (!initializationComplete) {
        console.log('Re-initializing profile page from window load event');
        initializeProfilePage();
    }
});
