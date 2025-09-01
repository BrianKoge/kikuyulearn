// Profile functionality for Kikuyulearn
console.log('Profile.js loaded successfully!');

// Global variables
let currentUserProfile = null;
let initializationComplete = false;

// Try to load profile from localStorage immediately
(function() {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
        try {
            const parsedProfile = JSON.parse(storedProfile);
            if (parsedProfile && parsedProfile.id) {
                currentUserProfile = parsedProfile;
                console.log('Immediately loaded profile from localStorage:', currentUserProfile);
            }
        } catch (e) {
            console.error('Error parsing stored profile on load:', e);
        }
    }
})();

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
            
            // First, try to load profile from localStorage if available
            const storedProfile = localStorage.getItem('userProfile');
            if (storedProfile) {
                try {
                    const parsedProfile = JSON.parse(storedProfile);
                    if (parsedProfile && parsedProfile.id) {
                        currentUserProfile = parsedProfile;
                        console.log('Loaded existing profile from localStorage:', currentUserProfile);
                        // Update display immediately
                        await updateProfileDisplay();
                        // Mark initialization as complete
                        initializationComplete = true;
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing stored profile:', e);
                }
            }
            
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
                            
                            // Create profile immediately when user is loaded
                            if (!currentUserProfile) {
                                console.log('Creating profile immediately from localStorage user data...');
                                const userData = parsedUser;
                                
                                // Extract full_name from multiple possible locations
                                let displayName = '';
                                if (userData.full_name) {
                                    displayName = userData.full_name;
                                } else if (userData.user_metadata && userData.user_metadata.full_name) {
                                    displayName = userData.user_metadata.full_name;
                                } else if (userData.email) {
                                    displayName = userData.email.split('@')[0];
                                } else {
                                    displayName = 'User';
                                }
                                
                                // Trim whitespace
                                displayName = displayName.trim();
                                
                                currentUserProfile = {
                                    id: userData.id,
                                    email: userData.email,
                                    full_name: displayName,
                                    points: userData.points || 0,
                                    avatar_url: null,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                };
                                console.log('Created profile immediately from localStorage user data:', currentUserProfile);
                                // Save to localStorage
                                localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
                            }
                            
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
                    // Check if Supabase is available
                    if (typeof initializeSupabase === 'function') {
                        const supabaseClient = initializeSupabase();
                        if (supabaseClient) {
                            const { data: { user }, error } = await supabaseClient.auth.getUser();
                            if (user && !error) {
                                window.currentUser = user;
                                console.log('Loaded user from Supabase auth session:', user);
                                
                                // Create profile immediately when user is loaded from Supabase
                                if (!currentUserProfile) {
                                    console.log('Creating profile immediately from Supabase auth user data...');
                                    const userData = user;
                                    
                                    // Extract full_name from multiple possible locations
                                    let displayName = '';
                                    if (userData.full_name) {
                                        displayName = userData.full_name;
                                    } else if (userData.user_metadata && userData.user_metadata.full_name) {
                                        displayName = userData.user_metadata.full_name;
                                    } else if (userData.email) {
                                        displayName = userData.email.split('@')[0];
                                    } else {
                                        displayName = 'User';
                                    }
                                    
                                    // Trim whitespace
                                    displayName = displayName.trim();
                                    
                                    currentUserProfile = {
                                        id: userData.id,
                                        email: userData.email,
                                        full_name: displayName,
                                        points: userData.points || 0,
                                        avatar_url: null,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString()
                                    };
                                    console.log('Created profile immediately from Supabase auth user data:', currentUserProfile);
                                    // Save to localStorage
                                    localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
                                }
                            }
                        }
                    } else {
                        console.log('Supabase not available yet');
                    }
                } catch (authError) {
                    console.error('Error getting user from Supabase auth:', authError);
                }
            }
            
            // Load user profile data
            await loadUserProfile();
            
            console.log('After loadUserProfile - currentUserProfile:', currentUserProfile);
            
            // If profile loading failed, try to create a profile from the current user data
            if (!currentUserProfile && window.currentUser) {
                console.log('Profile loading failed, creating profile from current user data...');
                const userData = window.currentUser;
                
                // Extract full_name from multiple possible locations
                let displayName = '';
                if (userData.full_name) {
                    displayName = userData.full_name;
                } else if (userData.user_metadata && userData.user_metadata.full_name) {
                    displayName = userData.user_metadata.full_name;
                } else if (userData.email) {
                    displayName = userData.email.split('@')[0];
                } else {
                    displayName = 'User';
                }
                
                // Trim whitespace
                displayName = displayName.trim();
                
                currentUserProfile = {
                    id: userData.id,
                    email: userData.email,
                    full_name: displayName,
                    points: userData.points || 0,
                    avatar_url: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                console.log('Created profile from current user data:', currentUserProfile);
                // Save to localStorage
                localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
            }
            
            // Update profile display
            await updateProfileDisplay();
            
            // Ensure profile is saved to localStorage
            if (currentUserProfile) {
                localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
                console.log('Profile saved to localStorage after initialization');
            }
            
            // Load user statistics
            await loadUserStatistics();
            
            // Hide loading state and show profile
            hideLoadingState();
            
            // Force multiple updates to ensure data is displayed
            setTimeout(async () => {
                await updateProfileDisplay();
            }, 100);
            
            setTimeout(async () => {
                await updateProfileDisplay();
            }, 500);
            
            setTimeout(async () => {
                await updateProfileDisplay();
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
        // Check if UserProgressManager is available
        if (typeof UserProgressManager === 'undefined') {
            console.log('UserProgressManager not available yet, waiting...');
            // Wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 500));
            if (typeof UserProgressManager === 'undefined') {
                console.log('UserProgressManager still not available, using fallback profile creation');
                // Create profile from current user data without Supabase
                if (window.currentUser) {
                    const userData = window.currentUser;
                    const displayName = userData.full_name || userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'User';
                    
                    currentUserProfile = {
                        id: userData.id,
                        email: userData.email,
                        full_name: displayName.trim(),
                        points: userData.points || 0,
                        avatar_url: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    console.log('Created fallback profile from current user data:', currentUserProfile);
                    // Save to localStorage
                    localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
                    return;
                }
            }
        }

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
                        full_name: userProfile.full_name || supabaseUser.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
                        points: userProfile.total_score || supabaseUser.points || 0,
                        avatar_url: userProfile.avatar_url,
                        created_at: userProfile.created_at,
                        updated_at: userProfile.updated_at
                    };
                    console.log('Profile loaded from Supabase:', currentUserProfile);
                    // Save to localStorage
                    localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
                } else {
                    console.log('No profile found in Supabase, creating new profile...');
                    // Create profile if it doesn't exist
                    const displayName = supabaseUser.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User';
                    
                    currentUserProfile = {
                        id: supabaseUser.id,
                        email: supabaseUser.email,
                        full_name: displayName,
                        points: supabaseUser.points || 0,
                        avatar_url: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    // Save profile to Supabase
                    if (typeof createUserProfile === 'function') {
                        await createUserProfile(currentUserProfile);
                    } else {
                        console.log('createUserProfile function not available, skipping Supabase save');
                    }
                    
                    // Save to localStorage
                    localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
                }
                
                console.log('User profile loaded successfully:', currentUserProfile);
                
            } catch (error) {
                console.error('Failed to load profile from Supabase:', error);
                // Use the authenticated user data as fallback
                const displayName = supabaseUser.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User';
                
                currentUserProfile = {
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    full_name: displayName,
                    points: supabaseUser.points || 0,
                    avatar_url: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                console.log('Using fallback profile data:', currentUserProfile);
                // Save to localStorage
                localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
            }
        } else {
            console.log('No authenticated user found, loading from localStorage...');
            // No authenticated user, load from localStorage
            loadFromLocalStorage();
        }
        
        // Also try to load from localStorage if we have a profile stored there
        if (!currentUserProfile) {
            const storedProfile = localStorage.getItem('userProfile');
            if (storedProfile) {
                try {
                    const parsedProfile = JSON.parse(storedProfile);
                    if (parsedProfile && parsedProfile.id) {
                        currentUserProfile = parsedProfile;
                        console.log('Loaded profile from localStorage:', currentUserProfile);
                    }
                } catch (e) {
                    console.error('Error parsing stored profile:', e);
                }
            }
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

// Update profile display with database data
async function updateProfileDisplay() {
    try {
        console.log('=== UPDATING PROFILE DISPLAY WITH DATABASE DATA ===');
        
        // Use currentUserProfile if available, otherwise fall back to window.currentUser
        const userData = currentUserProfile || window.currentUser;
        if (!userData) {
            console.log('No user data available for profile display');
            return;
        }
        
        console.log('Updating profile display with user data:', userData);
        
        // Extract user information from database first, then fallback to other sources
        let displayName = '';
        let userEmail = '';
        
        // Priority 1: Try to get data from Supabase database
        if (typeof UserProgressManager !== 'undefined' && userData.id) {
            try {
                console.log('Fetching profile data from Supabase database...');
                const profileData = await UserProgressManager.getUserProfile(userData.id);
                console.log('Profile data from Supabase:', profileData);
                
                if (profileData) {
                    // Use database data first
                    displayName = profileData.full_name || profileData.display_name || '';
                    userEmail = profileData.email || '';
                    console.log('Database data - Name:', displayName, 'Email:', userEmail);
                }
            } catch (error) {
                console.log('Failed to fetch from database, using fallback:', error.message);
            }
        }
        
        // Priority 2: Use user metadata if database data is incomplete
        if (!displayName && userData.user_metadata && userData.user_metadata.full_name) {
            displayName = userData.user_metadata.full_name;
            console.log('Using user_metadata.full_name:', displayName);
        }
        
        // Priority 3: Use direct properties
        if (!displayName && userData.full_name) {
            displayName = userData.full_name;
            console.log('Using userData.full_name:', displayName);
        }
        
        // Priority 4: Fallback to email username
        if (!displayName && userData.email) {
            displayName = userData.email.split('@')[0];
            console.log('Using email username as display name:', displayName);
        }
        
        // Priority 5: Final fallback
        if (!displayName) {
            displayName = 'User';
            console.log('Using final fallback display name:', displayName);
        }
        
        // Get email from database or user data
        if (!userEmail && userData.email) {
            userEmail = userData.email;
            console.log('Using userData.email:', userEmail);
        }
        
        // Final fallback for email
        if (!userEmail) {
            userEmail = 'user@example.com';
            console.log('Using fallback email:', userEmail);
        }
        
        // Trim any whitespace from display name
        displayName = displayName.trim();
        
        console.log('Final extracted data - Name:', displayName, 'Email:', userEmail);
        
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
        
        console.log('Profile display updated with database data:', { displayName, userEmail });
        
    } catch (error) {
        console.error('Error updating profile display:', error);
        // Fallback to basic display update
        updateProfileDisplayFallback();
    }
}

// Fallback profile display update
function updateProfileDisplayFallback() {
    console.log('Using fallback profile display update...');
    const userData = currentUserProfile || window.currentUser;
    if (!userData) return;
    
    let displayName = userData.full_name || userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'User';
    let userEmail = userData.email || 'user@example.com';
    
    displayName = displayName.trim();
    
    // Update profile header
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileAvatar) profileAvatar.textContent = displayName.charAt(0).toUpperCase();
    if (profileName) profileName.textContent = displayName;
    if (profileEmail) profileEmail.textContent = userEmail;
    
    // Update form fields
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    
    if (displayNameInput) displayNameInput.value = displayName;
    if (emailInput) emailInput.value = userEmail;
}

// Load user statistics from real lesson data in database
async function loadUserStatistics() {
    try {
        console.log('=== LOADING USER STATISTICS FROM REAL LESSON DATA ===');
        
        if (!currentUserProfile && !window.currentUser) {
            console.log('No user data available for statistics');
            return;
        }
        
        const userId = currentUserProfile?.id || window.currentUser?.id;
        console.log('Loading statistics for user ID:', userId);
        
        let completedLessons = 0;
        let totalPoints = 0;
        let currentStreak = 0;
        
        // Priority 1: Get real data from Supabase database
        if (typeof UserProgressManager !== 'undefined' && userId) {
            try {
                console.log('Fetching real lesson progress from Supabase...');
                
                // Get user profile data for total points
                const profileData = await UserProgressManager.getUserProfile(userId);
                console.log('Profile data from Supabase:', profileData);
                
                // Get real lesson progress data
                const userProgress = await UserProgressManager.getUserProgress(userId);
                console.log('Real lesson progress data from Supabase:', userProgress);
                
                if (userProgress && Array.isArray(userProgress)) {
                    // Count completed lessons (progress >= 100%)
                    completedLessons = userProgress.filter(p => p.progress_percentage >= 100).length;
                    console.log('Completed lessons from real data:', completedLessons);
                    
                    // Calculate total points from completed lessons
                    const lessonData = {
                        'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
                        'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
                        'conv-1': 22, 'conv-2': 28
                    };
                    
                    let calculatedPoints = 0;
                    userProgress.forEach(progress => {
                        if (progress.progress_percentage >= 100) {
                            const lessonPoints = lessonData[progress.lesson_id] || 0;
                            calculatedPoints += lessonPoints;
                            console.log(`Lesson ${progress.lesson_id} completed: +${lessonPoints} points`);
                        }
                    });
                    
                    // Use calculated points from lessons, fallback to profile total_score
                    totalPoints = calculatedPoints > 0 ? calculatedPoints : (profileData?.total_score || 0);
                    console.log('Total points calculated from lessons:', totalPoints);
                    
                    // Get current streak from database or calculate from login data
                    currentStreak = await getCurrentStreakFromDatabase(userId) || getCurrentStreak();
                    console.log('Current streak:', currentStreak);
                    
                    console.log('=== REAL STATISTICS FROM DATABASE ===');
                    console.log('Completed Lessons:', completedLessons);
                    console.log('Total Points:', totalPoints);
                    console.log('Current Streak:', currentStreak);
                    
                    // Update statistics display with real data
                    updateStatisticsDisplay(completedLessons, totalPoints, currentStreak);
                    return;
                }
                
            } catch (error) {
                console.error('Failed to load statistics from Supabase:', error);
                console.log('Falling back to localStorage data...');
            }
        }
        
        // Priority 2: Use localStorage data as fallback
        console.log('Using localStorage data as fallback for statistics');
        loadStatisticsFromLocalStorage();
        
    } catch (error) {
        console.error('Error loading user statistics:', error);
        // Use localStorage data as final fallback
        loadStatisticsFromLocalStorage();
    }
}

// Get current streak from database
async function getCurrentStreakFromDatabase(userId) {
    try {
        if (typeof UserProgressManager !== 'undefined' && userId) {
            // Try to get streak from user profile
            const profileData = await UserProgressManager.getUserProfile(userId);
            if (profileData && profileData.current_streak !== undefined) {
                console.log('Streak from database profile:', profileData.current_streak);
                return profileData.current_streak;
            }
        }
    } catch (error) {
        console.log('Failed to get streak from database:', error.message);
    }
    
    // Fallback to localStorage streak calculation
    return getCurrentStreak();
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
    // Update using specific IDs for better reliability
    const lessonsCompletedElement = document.getElementById('lessonsCompleted');
    const totalPointsElement = document.getElementById('totalPoints');
    const dayStreakElement = document.getElementById('dayStreak');
    
    if (lessonsCompletedElement) {
        lessonsCompletedElement.textContent = completedLessons;
        console.log('Updated lessons completed:', completedLessons);
    }
    
    if (totalPointsElement) {
        totalPointsElement.textContent = totalPoints.toLocaleString();
        console.log('Updated total points:', totalPoints);
    }
    
    if (dayStreakElement) {
        dayStreakElement.textContent = currentStreak;
        console.log('Updated day streak:', currentStreak);
    }
    
    console.log('Statistics display updated:', { completedLessons, totalPoints, currentStreak });
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

// Manually refresh statistics from Supabase
async function refreshStatistics() {
    console.log('Manually refreshing statistics...');
    try {
        await loadUserStatistics();
        console.log('Statistics refreshed successfully');
    } catch (error) {
        console.error('Error refreshing statistics:', error);
    }
}

// Refresh all profile data from database
async function refreshProfileData() {
    console.log('=== REFRESHING ALL PROFILE DATA FROM DATABASE ===');
    try {
        // Refresh profile display with latest database data
        await updateProfileDisplay();
        
        // Refresh statistics with latest lesson data
        await loadUserStatistics();
        
        console.log('Profile data refreshed successfully from database');
        showSuccessMessage('Profile data refreshed from database!');
        
    } catch (error) {
        console.error('Error refreshing profile data:', error);
        showErrorMessage('Failed to refresh profile data');
    }
}

// Force create profile from current user data (for debugging)
async function forceCreateProfile() {
    console.log('Force creating profile...');
    console.log('Current state:', { currentUserProfile, windowCurrentUser: window.currentUser });
    
    if (window.currentUser && window.currentUser.id) {
        const userData = window.currentUser;
        console.log('User data available:', userData);
        
        // Extract full_name from multiple possible locations
        let displayName = '';
        if (userData.full_name) {
            displayName = userData.full_name;
        } else if (userData.user_metadata && userData.user_metadata.full_name) {
            displayName = userData.user_metadata.full_name;
        } else if (userData.email) {
            displayName = userData.email.split('@')[0];
        } else {
            displayName = 'User';
        }
        
        // Trim whitespace
        displayName = displayName.trim();
        
        currentUserProfile = {
            id: userData.id,
            email: userData.email,
            full_name: displayName,
            points: userData.points || 0,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
        console.log('Profile created and saved:', currentUserProfile);
        
        // Update display
        await updateProfileDisplay();
        
        // Load statistics after profile creation
        await loadUserStatistics();
        
        return currentUserProfile;
    } else {
        console.log('No user data available for profile creation');
        return null;
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
window.forceCreateProfile = forceCreateProfile;
window.refreshStatistics = refreshStatistics;
window.refreshProfileData = refreshProfileData;

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile.js: DOM Content Loaded');
    // Add a small delay to ensure all scripts are loaded
    setTimeout(() => {
        initializeProfilePage();
    }, 100);
});

// Also try to initialize when window loads (for cases where DOMContentLoaded fires too early)
window.addEventListener('load', function() {
    console.log('Profile.js: Window loaded');
    if (!initializationComplete) {
        console.log('Re-initializing profile page from window load event');
        // Add a small delay to ensure all scripts are loaded
        setTimeout(() => {
            initializeProfilePage();
        }, 100);
    }
});
