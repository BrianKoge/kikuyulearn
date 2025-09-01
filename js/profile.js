// Profile functionality for Kikuyulearn
console.log('Profile.js loaded successfully!');

// Global variables
let currentUserProfile = null;

// Initialize profile page
async function initializeProfilePage() {
    if (window.location.pathname.includes('../Html/Profile.html')) {
        console.log('Initializing profile page...');
        
        try {
            // Load user profile data
            await loadUserProfile();
            
            // Update profile display
            updateProfileDisplay();
            
            // Load user statistics
            await loadUserStatistics();
            

            

            
        } catch (error) {
            console.error('Error initializing profile page:', error);
            showErrorMessage('Failed to load profile data');
        }
    }
}

// Load user profile from Supabase
async function loadUserProfile() {
    try {
        // Try to get authenticated user from localStorage or global variable first
        let supabaseUser = null;
        
        // Try to get from global currentUser first
        if (typeof currentUser !== 'undefined' && currentUser) {
            supabaseUser = currentUser;
        } else {
            // Try to get from localStorage
            const storedUser = localStorage.getItem('kikuyulearn_user');
            if (storedUser) {
                supabaseUser = JSON.parse(storedUser);
            }
        }
        
        if (supabaseUser) {
            // User is authenticated, get profile from Supabase
            try {
                const userProfile = await UserProgressManager.getUserProfile(supabaseUser.id);
                
                if (userProfile) {
                    currentUserProfile = {
                        id: supabaseUser.id,
                        email: supabaseUser.email,
                        full_name: userProfile.full_name || supabaseUser.user_metadata?.full_name || 'User',
                        points: userProfile.points || 0,
                        avatar_url: userProfile.avatar_url,
                        created_at: userProfile.created_at,
                        updated_at: userProfile.updated_at
                    };
                } else {
                    // Create profile if it doesn't exist
                    currentUserProfile = {
                        id: supabaseUser.id,
                        email: supabaseUser.email,
                        full_name: supabaseUser.user_metadata?.full_name || 'User',
                        points: 0,
                        avatar_url: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    // Save profile to Supabase
                    await createUserProfile(currentUserProfile);
                }
                
                console.log('User profile loaded from Supabase:', currentUserProfile);
                
            } catch (error) {
                console.error('Failed to load profile from Supabase:', error);
                loadFromLocalStorage();
            }
        } else {
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

// Load user profile from localStorage only
function loadFromLocalStorage() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        currentUserProfile = JSON.parse(savedProfile);
    } else {
        // Create demo profile
        currentUserProfile = {
            id: 'demo_user_' + Date.now(),
            email: 'demo@kikuyulearn.com',
            full_name: 'Demo User',
            points: 0,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
}

// Update profile display
function updateProfileDisplay() {
    if (!currentUserProfile) return;
    
    // Update navigation welcome message
    const userWelcome = document.querySelector('.user-welcome');
    if (userWelcome) {
        userWelcome.textContent = `Welcome, ${currentUserProfile.full_name}!`;
    }
    
    // Update profile header
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileAvatar) {
        profileAvatar.textContent = currentUserProfile.full_name.charAt(0).toUpperCase();
    }
    
    if (profileName) {
        profileName.textContent = currentUserProfile.full_name;
    }
    
    if (profileEmail) {
        profileEmail.textContent = currentUserProfile.email;
    }
    
    // Update form fields
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    
    if (displayNameInput) {
        displayNameInput.value = currentUserProfile.full_name;
    }
    
    if (emailInput) {
        emailInput.value = currentUserProfile.email;
    }
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
            showErrorMessage('No user profile found');
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

// Make functions globally accessible
window.initializeProfilePage = initializeProfilePage;
window.editProfile = editProfile;
window.saveProfileChanges = saveProfileChanges;

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile.js: DOM Content Loaded');
    initializeProfilePage();
});
