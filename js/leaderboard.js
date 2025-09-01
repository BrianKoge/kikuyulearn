// Leaderboard functionality for Kikuyulearn
console.log('Leaderboard.js loaded successfully!');

// Global variables
let leaderboardData = [];
let userAchievements = [];
// Use the global currentUser from script-simple.js instead of declaring a new one

// Wait for Supabase client to be ready
async function waitForSupabase() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        if (typeof initializeSupabase === 'function') {
            const client = initializeSupabase();
            if (client && typeof client.from === 'function') {
                console.log('Supabase client ready after', attempts + 1, 'attempts');
                return client;
            }
        }
        
        if (window.supabase) {
            const SUPABASE_URL = 'https://cbrqjobtcofkkpiauibj.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicnFqb2J0Y29ma2twaWF1aWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODM4MzEsImV4cCI6MjA3MjE1OTgzMX0.E01-rb7_nX_fyWnDJJBF9BO3hNmQquE77eHTLrRlSQ8';
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            if (client && typeof client.from === 'function') {
                console.log('Supabase client ready after', attempts + 1, 'attempts');
                return client;
            }
        }
        
        attempts++;
        console.log('Waiting for Supabase client... attempt', attempts);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
    }
    
    console.log('Supabase client not ready after', maxAttempts, 'attempts');
    return null;
}

// Initialize leaderboard page
async function initializeLeaderboardPage() {
    if (window.location.pathname.includes('../Html/leaderboard.html')) {
        console.log('Initializing leaderboard page...');
        
        try {
            // Wait for Supabase client to be ready
            await waitForSupabase();
            
            // Load current user
            await loadCurrentUser();
            
            // Quick load current user data for immediate display
            await quickLoadCurrentUserData();
            
            // Load full leaderboard data from Supabase in background
            loadLeaderboardData().then(async () => {
                // Ensure current user's data is accurate after loading full data
                if (window.currentUser) {
                    await syncCurrentUserProgress();
                }
                
                // Hide loading indicator
                hideFullLeaderboardLoading();
                // Update display when full data is loaded
                await displayLeaderboard();
                updateStatsOverview();
            });
            
            // Load user achievements if user is authenticated
            await loadUserAchievements();
            
            // Display leaderboard
            await displayLeaderboard();
            
            // Display user achievements
            await displayUserAchievements();
            
            // Update stats overview
            updateStatsOverview();
            
            // Check and award achievements
            await checkAndAwardAchievements();
            
            // Final sync to ensure current user data is accurate
            if (window.currentUser) {
                await syncCurrentUserProgress();
                await displayLeaderboard();
                updateStatsOverview();
            }
            
        } catch (error) {
            console.error('Error initializing leaderboard page:', error);
            showErrorMessage('Failed to load leaderboard data');
        }
    }
}

// Load current user
async function loadCurrentUser() {
    try {
        // First try to get from global window.currentUser
        if (typeof window.currentUser !== 'undefined' && window.currentUser) {
            console.log('Current user loaded from global:', window.currentUser);
            return;
        }
        
        // If not available globally, try to load from localStorage
        const storedUser = localStorage.getItem('kikuyulearn_user');
        if (storedUser) {
            window.currentUser = JSON.parse(storedUser);
            console.log('Current user loaded from localStorage:', window.currentUser);
            return;
        }
        
        // If still not available, try to get from Supabase auth
        if (typeof initializeSupabase === 'function') {
            const supabaseClient = initializeSupabase();
            if (supabaseClient) {
                const { data: { user }, error } = await supabaseClient.auth.getUser();
                if (user && !error) {
                    window.currentUser = {
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || user.email
                    };
                    console.log('Current user loaded from Supabase auth:', window.currentUser);
                    return;
                }
            }
        }
        
        console.log('No authenticated user found');
        window.currentUser = null;
        
    } catch (error) {
        console.error('Error loading current user:', error);
        window.currentUser = null;
    }
}

// Load leaderboard data from Supabase
async function loadLeaderboardData() {
    try {
        console.log('=== LOADING LEADERBOARD FROM REAL LESSON DATA ===');
        console.log('Loading leaderboard data from Supabase with real lesson progress...');
        
        // Wait a bit for Supabase to be ready (reduced wait time)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (typeof LeaderboardManager !== 'undefined') {
            try {
                const data = await LeaderboardManager.getLeaderboard();
                console.log('Raw leaderboard data from Supabase:', data);
                
                if (data && Array.isArray(data) && data.length > 0) {
                    leaderboardData = data;
                    console.log('Leaderboard data loaded from Supabase:', leaderboardData);
                    return;
                }
            } catch (leaderboardError) {
                console.error('Error loading from LeaderboardManager:', leaderboardError);
            }
        }
        
        console.log('No leaderboard data from LeaderboardManager, creating from profiles and lessons...');
        // Create leaderboard data from profiles table and calculate actual progress
        try {
            let supabaseClient = null;
            if (typeof initializeSupabase === 'function') {
                supabaseClient = initializeSupabase();
            } else if (window.supabase) {
                const SUPABASE_URL = 'https://cbrqjobtcofkkpiauibj.supabase.co';
                const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicnFqb2J0Y29ma2twaWF1aWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODM4MzEsImV4cCI6MjA3MjE1OTgzMX0.E01-rb7_nX_fyWnDJJBF9BO3hNmQquE77eHTLrRlSQ8';
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            }
            
            if (supabaseClient && typeof supabaseClient.from === 'function') {
                // Get all profiles with a limit to improve performance
                const { data: profilesData, error } = await supabaseClient
                    .from('profiles')
                    .select('id, full_name, email, avatar_url')
                    .limit(20); // Reduced from 50 to 20 for faster loading
                
                if (profilesData && profilesData.length > 0) {
                    console.log('Found profiles:', profilesData.length);
                    
                    // Calculate actual progress for each user (parallel processing)
                    const userProgressPromises = profilesData.map(async (profile) => {
                        try {
                            if (typeof UserProgressManager !== 'undefined') {
                                console.log(`Getting progress for user: ${profile.id}`);
                                const userProgress = await UserProgressManager.getUserProgress(profile.id);
                                
                                if (userProgress && Array.isArray(userProgress)) {
                                    console.log(`User ${profile.id} progress:`, userProgress);
                                    
                                    // Count completed lessons (100% progress)
                                    const actualLessonsCompleted = userProgress.filter(p => p.progress_percentage >= 100).length;
                                    
                                    // Calculate total points from completed lessons
                                    const lessonData = {
                                        'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
                                        'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
                                        'conv-1': 22, 'conv-2': 28
                                    };
                                    
                                    let actualTotalPoints = 0;
                                    userProgress.forEach(progress => {
                                        if (progress.progress_percentage >= 100) {
                                            actualTotalPoints += lessonData[progress.lesson_id] || 0;
                                            console.log(`Lesson ${progress.lesson_id} completed: +${lessonData[progress.lesson_id]} points`);
                                        }
                                    });
                                    
                                    // Get streak - only calculate for current user, use default for others
                                    let actualStreak = 0;
                                    if (profile.id === window.currentUser?.id) {
                                        actualStreak = getCurrentStreak();
                                        console.log(`Current user streak: ${actualStreak}`);
                                    }
                                    
                                    const userData = {
                                        id: profile.id,
                                        full_name: profile.full_name || 'Unknown User',
                                        email: profile.email,
                                        total_points: actualTotalPoints || 0,
                                        lessons_completed: actualLessonsCompleted || 0,
                                        current_streak: actualStreak || 0,
                                        avatar_url: profile.avatar_url || null
                                    };
                                    
                                    console.log(`User ${profile.id} final data:`, userData);
                                    return userData;
                                } else {
                                    console.log(`No progress data for user ${profile.id}`);
                                }
                            } else {
                                console.log('UserProgressManager not available');
                            }
                        } catch (progressError) {
                            console.error('Error getting user progress for', profile.id, ':', progressError);
                        }
                        
                        // Return basic profile data if progress fetch fails
                        return {
                            id: profile.id,
                            full_name: profile.full_name || 'Unknown User',
                            email: profile.email,
                            total_points: 0,
                            lessons_completed: 0,
                            current_streak: 0,
                            avatar_url: profile.avatar_url || null
                        };
                    });
                    
                    // Wait for all progress calculations to complete
                    const newLeaderboardData = await Promise.all(userProgressPromises);
                    
                    // Sort by total points (highest first)
                    newLeaderboardData.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
                    
                    // Preserve current user's accurate data if it exists
                    if (window.currentUser) {
                        const currentUserIndex = newLeaderboardData.findIndex(user => user.id === window.currentUser.id);
                        if (currentUserIndex !== -1) {
                            console.log('Updating current user data with real lesson progress...');
                            
                            // Update with current user's actual progress
                            const currentUserProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
                            if (currentUserProgress && Array.isArray(currentUserProgress)) {
                                const actualLessonsCompleted = currentUserProgress.filter(p => p.progress_percentage >= 100).length;
                                
                                const lessonData = {
                                    'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
                                    'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
                                    'conv-1': 22, 'conv-2': 28
                                };
                                
                                let actualTotalPoints = 0;
                                currentUserProgress.forEach(progress => {
                                    if (progress.progress_percentage >= 100) {
                                        actualTotalPoints += lessonData[progress.lesson_id] || 0;
                                        console.log(`Current user lesson ${progress.lesson_id}: +${lessonData[progress.lesson_id]} points`);
                                    }
                                });
                                
                                const actualStreak = getCurrentStreak();
                                
                                // Update current user's data with accurate values
                                newLeaderboardData[currentUserIndex].lessons_completed = actualLessonsCompleted;
                                newLeaderboardData[currentUserIndex].total_points = actualTotalPoints;
                                newLeaderboardData[currentUserIndex].current_streak = actualStreak;
                                
                                // Re-sort after updating current user
                                newLeaderboardData.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
                                
                                console.log('Updated current user data in leaderboard:', {
                                    lessons_completed: actualLessonsCompleted,
                                    total_points: actualTotalPoints,
                                    current_streak: actualStreak
                                });
                            }
                        }
                    }
                    
                    // Update the global leaderboard data
                    leaderboardData = newLeaderboardData;
                    
                    console.log('Final leaderboard data with real lesson progress:', leaderboardData);
                    return;
                }
            }
        } catch (fallbackError) {
            console.error('Failed to load from profiles table:', fallbackError);
        }
        
        // If no data found, show empty state
        console.log('No leaderboard data found in database');
        leaderboardData = [];
        
    } catch (error) {
        console.error('Failed to load leaderboard from Supabase:', error);
        leaderboardData = [];
    }
}

// Load user achievements
async function loadUserAchievements() {
    try {
        if (window.currentUser) {
            // Try to get achievements from Supabase
            if (typeof LeaderboardManager !== 'undefined') {
                const achievements = await LeaderboardManager.getUserAchievements(window.currentUser.id);
                userAchievements = achievements || [];
                console.log('User achievements loaded from Supabase:', userAchievements);
            } else {
                // Fallback: try direct Supabase query
                try {
                    // Use the proper initializeSupabase function
                    let supabaseClient = null;
                    if (typeof initializeSupabase === 'function') {
                        supabaseClient = initializeSupabase();
                    } else if (window.supabase) {
                        // Fallback to direct client creation if initializeSupabase is not available
                        const SUPABASE_URL = 'https://cbrqjobtcofkkpiauibj.supabase.co';
                        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicnFqb2J0Y29ma2twaWF1aWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODM4MzEsImV4cCI6MjA3MjE1OTgzMX0.E01-rb7_nX_fyWnDJJBF9BO3hNmQquE77eHTLrRlSQ8';
                        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    }
                    
                    if (supabaseClient && typeof supabaseClient.from === 'function') {
                        const { data: achievements, error } = await supabaseClient
                            .from('user_achievements')
                            .select('*')
                            .eq('user_id', window.currentUser.id)
                            .order('earned_at', { ascending: false });
                        
                        if (achievements && achievements.length > 0) {
                            userAchievements = achievements;
                            console.log('User achievements loaded directly from Supabase:', userAchievements);
                        } else {
                            console.log('No achievements found in Supabase');
                            userAchievements = [];
                        }
                    } else {
                        console.log('Supabase client not available');
                        userAchievements = [];
                    }
                } catch (directError) {
                    console.error('Failed to load achievements directly:', directError);
                    userAchievements = [];
                }
            }
        } else {
            console.log('No authenticated user');
            userAchievements = [];
        }
        
    } catch (error) {
        console.error('Failed to load user achievements:', error);
        userAchievements = [];
    }
}

// Check and award achievements based on user progress
async function checkAndAwardAchievements() {
    if (!window.currentUser) return;
    
    try {
        console.log('Checking achievements for user:', window.currentUser.id);
        
        // Get user's current progress from Supabase first, then fallback to localStorage
        let userProfile = null;
        let userProgress = null;
        let completedLessons = 0;
        let totalPoints = 0;
        
        // Try to get data from Supabase
        if (typeof UserProgressManager !== 'undefined') {
            try {
                console.log('=== ACHIEVEMENT CHECK: Getting real lesson data ===');
                userProfile = await UserProgressManager.getUserProfile(window.currentUser.id);
                userProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
                
                if (userProfile) {
                    totalPoints = userProfile.points || 0;
                    console.log('User data from Supabase - Points:', totalPoints);
                }
                
                if (userProgress && Array.isArray(userProgress)) {
                    completedLessons = userProgress.filter(p => p.progress_percentage >= 100).length;
                    console.log('Completed lessons from real lesson data:', completedLessons);
                    console.log('Raw lesson progress data:', userProgress);
                    
                    // Log each completed lesson for verification
                    const completedLessonsList = userProgress.filter(p => p.progress_percentage >= 100);
                    console.log('Completed lessons list:', completedLessonsList.map(p => ({
                        lesson_id: p.lesson_id,
                        progress: p.progress_percentage,
                        completed_at: p.updated_at
                    })));
                } else {
                    console.log('No progress data from Supabase, using localStorage fallback');
                }
            } catch (supabaseError) {
                console.log('Failed to get data from Supabase, using localStorage:', supabaseError.message);
            }
        }
        
        // Fallback to localStorage if Supabase data not available or incomplete
        if (!userProfile || !userProgress || completedLessons === 0) {
            const savedProgress = localStorage.getItem('userProgress');
            const localProgress = savedProgress ? JSON.parse(savedProgress) : { points: 0, completedLessons: [] };
            
            // Count completed lessons from localStorage
            const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
            
            lessonIds.forEach(lessonId => {
                const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
                if (parseInt(progress) >= 100) {
                    completedLessons++;
                }
            });
            
            // Use localStorage points if Supabase points are 0 or missing
            if (!totalPoints || totalPoints === 0) {
                totalPoints = localProgress.points || 0;
            }
            
                    console.log('User data from localStorage fallback - Points:', totalPoints, 'Lessons:', completedLessons);
    }
    
    // Log real progress for debugging achievements
    console.log('Real progress for achievements:', {
        completedLessons,
        totalPoints,
        userProgress: userProgress ? userProgress.length : 0
    });
    
    const achievements = [];
        
        // Check lesson completion achievements
        if (completedLessons >= 1 && !hasAchievement('first_lesson')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'first_lesson',
                achievement_name: 'First Steps',
                description: 'Complete your first lesson',
                earned_at: new Date().toISOString()
            });
        }
        
        if (completedLessons >= 3 && !hasAchievement('lessons_3')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'lessons_3',
                achievement_name: 'Getting Started',
                description: 'Complete 3 lessons',
                earned_at: new Date().toISOString()
            });
        }
        
        if (completedLessons >= 5 && !hasAchievement('lessons_5')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'lessons_5',
                achievement_name: 'Steady Progress',
                description: 'Complete 5 lessons',
                earned_at: new Date().toISOString()
            });
        }
        
        if (completedLessons >= 8 && !hasAchievement('lessons_8')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'lessons_8',
                achievement_name: 'Dedicated Learner',
                description: 'Complete 8 lessons',
                earned_at: new Date().toISOString()
            });
        }
        
        if (completedLessons >= 10 && !hasAchievement('lessons_10')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'lessons_10',
                achievement_name: 'Master Learner',
                description: 'Complete all 10 lessons',
                earned_at: new Date().toISOString()
            });
        }
        
        // Check points achievements
        if (totalPoints >= 50 && !hasAchievement('points_50')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'points_50',
                achievement_name: 'Getting Points',
                description: 'Earn 50 points',
                earned_at: new Date().toISOString()
            });
        }
        
        if (totalPoints >= 100 && !hasAchievement('points_100')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'points_100',
                achievement_name: 'Century Club',
                description: 'Earn 100 points',
                earned_at: new Date().toISOString()
            });
        }
        
        if (totalPoints >= 200 && !hasAchievement('points_200')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'points_200',
                achievement_name: 'Double Century',
                description: 'Earn 200 points',
                earned_at: new Date().toISOString()
            });
        }
        
        if (totalPoints >= 500 && !hasAchievement('points_500')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'points_500',
                achievement_name: 'Halfway There',
                description: 'Earn 500 points',
                earned_at: new Date().toISOString()
            });
        }
        
        if (totalPoints >= 1000 && !hasAchievement('points_1000')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'points_1000',
                achievement_name: 'Point Master',
                description: 'Earn 1000 points',
                earned_at: new Date().toISOString()
            });
        }
        
        // Check category completion achievements
        const categoryProgress = await getCategoryProgress();
        
        if (categoryProgress.vocabulary >= 4 && !hasAchievement('vocab_master')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'vocab_master',
                achievement_name: 'Vocabulary Master',
                description: 'Complete all vocabulary lessons',
                earned_at: new Date().toISOString()
            });
            console.log('Vocabulary Master achievement unlocked!');
        }
        
        if (categoryProgress.grammar >= 2 && !hasAchievement('grammar_master')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'grammar_master',
                achievement_name: 'Grammar Master',
                description: 'Complete all grammar lessons',
                earned_at: new Date().toISOString()
            });
            console.log('Grammar Master achievement unlocked!');
        }
        
        if (categoryProgress.culture >= 2 && !hasAchievement('culture_master')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'culture_master',
                achievement_name: 'Culture Master',
                description: 'Complete all culture lessons',
                earned_at: new Date().toISOString()
            });
            console.log('Culture Master achievement unlocked!');
        }
        
        if (categoryProgress.conversation >= 2 && !hasAchievement('conversation_master')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'conversation_master',
                achievement_name: 'Conversation Master',
                description: 'Complete all conversation lessons',
                earned_at: new Date().toISOString()
            });
            console.log('Conversation Master achievement unlocked!');
        }
        
        // Check streak achievements
        const currentStreak = getCurrentStreak();
        
        if (currentStreak >= 3 && !hasAchievement('streak_3')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'streak_3',
                achievement_name: 'Getting Consistent',
                description: 'Maintain a 3-day learning streak',
                earned_at: new Date().toISOString()
            });
        }
        
        if (currentStreak >= 7 && !hasAchievement('streak_7')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'streak_7',
                achievement_name: 'Week Warrior',
                description: 'Maintain a 7-day learning streak',
                earned_at: new Date().toISOString()
            });
        }
        
        if (currentStreak >= 30 && !hasAchievement('streak_30')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'streak_30',
                achievement_name: 'Monthly Master',
                description: 'Maintain a 30-day learning streak',
                earned_at: new Date().toISOString()
            });
        }
        
        // Award new achievements
        if (achievements.length > 0) {
            console.log('Awarding', achievements.length, 'new achievements:', achievements.map(a => a.achievement_name));
            await awardAchievements(achievements);
            await loadUserAchievements(); // Reload achievements
            displayUserAchievements(); // Update display
        } else {
            console.log('No new achievements to award');
        }
        
    } catch (error) {
        console.error('Error checking achievements:', error);
    }
}

// Check if user already has an achievement
function hasAchievement(achievementType) {
    return userAchievements.some(achievement => achievement.achievement_type === achievementType);
}

// Award achievements to user
async function awardAchievements(achievements) {
    try {
        if (typeof LeaderboardManager !== 'undefined') {
            for (const achievement of achievements) {
                await LeaderboardManager.awardAchievement(achievement);
                console.log('Achievement awarded:', achievement.achievement_name);
            }
        }
    } catch (error) {
        console.error('Error awarding achievements:', error);
    }
}

// Get user progress from Supabase
async function getUserProgress() {
    try {
        if (typeof UserProgressManager !== 'undefined' && window.currentUser) {
            return await UserProgressManager.getUserProgress(window.currentUser.id);
        }
        return [];
    } catch (error) {
        console.error('Error getting user progress:', error);
        return [];
    }
}

// Get user profile from Supabase
async function getUserProfile() {
    try {
        if (typeof UserProgressManager !== 'undefined' && window.currentUser) {
            return await UserProgressManager.getUserProfile(window.currentUser.id);
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

// Get current streak from localStorage
function getCurrentStreak() {
    try {
        const streak = localStorage.getItem('currentStreak');
        return streak ? parseInt(streak) : 0;
    } catch (error) {
        console.error('Error getting current streak:', error);
        return 0;
    }
}

// Get category progress from real lesson data in database
async function getCategoryProgress() {
    if (!window.currentUser || typeof UserProgressManager === 'undefined') {
        // Fallback to localStorage if no user or UserProgressManager
        const categories = {
            'vocabulary': ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4'],
            'grammar': ['grammar-1', 'grammar-2'],
            'culture': ['culture-1', 'culture-2'],
            'conversation': ['conv-1', 'conv-2']
        };
        
        const progress = {};
        
        Object.keys(categories).forEach(category => {
            const lessonIds = categories[category];
            let completedInCategory = 0;
            
            lessonIds.forEach(lessonId => {
                const lessonProgress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
                if (parseInt(lessonProgress) >= 100) {
                    completedInCategory++;
                }
            });
            
            progress[category] = completedInCategory;
        });
        
        return progress;
    }
    
    try {
        console.log('Getting category progress from real lesson data...');
        
        // Get real lesson progress from database
        const userProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
        
        if (userProgress && Array.isArray(userProgress)) {
            const categories = {
                'vocabulary': ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4'],
                'grammar': ['grammar-1', 'grammar-2'],
                'culture': ['culture-1', 'culture-2'],
                'conversation': ['conv-1', 'conv-2']
            };
            
            const progress = {};
            
            Object.keys(categories).forEach(category => {
                const lessonIds = categories[category];
                let completedInCategory = 0;
                
                lessonIds.forEach(lessonId => {
                    const lessonProgress = userProgress.find(p => p.lesson_id === lessonId);
                    if (lessonProgress && lessonProgress.progress_percentage >= 100) {
                        completedInCategory++;
                        console.log(`Category ${category}: Lesson ${lessonId} completed`);
                    }
                });
                
                progress[category] = completedInCategory;
                console.log(`Category ${category}: ${completedInCategory}/${lessonIds.length} lessons completed`);
            });
            
            console.log('Real category progress:', progress);
            return progress;
        }
        
        console.log('No user progress data found, using localStorage fallback');
        
        // Fallback to localStorage if no database data
        const categories = {
            'vocabulary': ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4'],
            'grammar': ['grammar-1', 'grammar-2'],
            'culture': ['culture-1', 'culture-2'],
            'conversation': ['conv-1', 'conv-2']
        };
        
        const progress = {};
        
        Object.keys(categories).forEach(category => {
            const lessonIds = categories[category];
            let completedInCategory = 0;
            
            lessonIds.forEach(lessonId => {
                const lessonProgress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
                if (parseInt(lessonProgress) >= 100) {
                    completedInCategory++;
                }
            });
            
            progress[category] = completedInCategory;
        });
        
        return progress;
        
    } catch (error) {
        console.error('Error getting category progress from database:', error);
        
        // Fallback to localStorage on error
        const categories = {
            'vocabulary': ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4'],
            'grammar': ['grammar-1', 'grammar-2'],
            'culture': ['culture-1', 'culture-2'],
            'conversation': ['conv-1', 'conv-2']
        };
        
        const progress = {};
        
        Object.keys(categories).forEach(category => {
            const lessonIds = categories[category];
            let completedInCategory = 0;
            
            lessonIds.forEach(lessonId => {
                const lessonProgress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
                if (parseInt(lessonProgress) >= 100) {
                    completedInCategory++;
                }
            });
            
            progress[category] = completedInCategory;
        });
        
        return progress;
    }
}

// Display leaderboard
async function displayLeaderboard() {
    const leaderboardContainer = document.querySelector('.leaderboard-list');
    if (!leaderboardContainer) {
        console.error('Leaderboard container not found');
        return;
    }

    // Ensure current user's data is always accurate before displaying
    if (window.currentUser) {
        await syncCurrentUserProgress();
    }

    // Clear existing content
    leaderboardContainer.innerHTML = '';

    if (leaderboardData.length === 0) {
        leaderboardContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-trophy"></i>
                <p>No leaderboard data available yet.</p>
                <p>Complete some lessons to see your ranking!</p>
            </div>
        `;
        return;
    }

    // Create leaderboard items
    leaderboardData.forEach((user, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const isCurrentUser = window.currentUser && user.id === window.currentUser.id;
        const rowClass = isCurrentUser ? 'leaderboard-row current-user' : 'leaderboard-row';
        
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = rowClass;
        leaderboardItem.innerHTML = `
            <div class="rank ${rankClass}">
                ${rank <= 3 ? getMedalIcon(rank) : ''}
                <span class="rank-number">${rank}</span>
            </div>
            <div class="user-info">
                <div class="user-avatar">
                    ${user.avatar_url ? 
                        `<img src="${user.avatar_url}" alt="${user.full_name}" onerror="this.parentElement.innerHTML='${user.full_name.charAt(0).toUpperCase()}'">` :
                        `<span>${user.full_name.charAt(0).toUpperCase()}</span>`
                    }
                </div>
                <div class="user-details">
                    <h4>${user.full_name} ${isCurrentUser ? '<i class="fas fa-user-circle" style="color: var(--primary-orange);"></i>' : ''}</h4>
                    <p>${user.email}</p>
                </div>
            </div>
            <div class="score">${user.total_points || 0}</div>
            <div class="lessons-completed">${user.lessons_completed || 0}</div>
            <div class="streak">${user.current_streak || 0}</div>
        `;
        
        leaderboardContainer.appendChild(leaderboardItem);
    });
}

// Display user achievements
async function displayUserAchievements() {
    const achievementsContainer = document.querySelector('.user-achievements');
    if (!achievementsContainer) {
        console.log('Achievements container not found');
        return;
    }

    // Clear existing content
    achievementsContainer.innerHTML = '';

    // Get user's current progress from database
    const userProgress = await getUserCurrentProgress();
    
    // Define all possible achievements
    const allAchievements = [
        {
            type: 'first_lesson',
            name: 'First Steps',
            description: 'Complete your first lesson',
            icon: 'fa-star',
            requirement: 1,
            category: 'lessons'
        },
        {
            type: 'lessons_3',
            name: 'Getting Started',
            description: 'Complete 3 lessons',
            icon: 'fa-graduation-cap',
            requirement: 3,
            category: 'lessons'
        },
        {
            type: 'lessons_5',
            name: 'Steady Progress',
            description: 'Complete 5 lessons',
            icon: 'fa-graduation-cap',
            requirement: 5,
            category: 'lessons'
        },
        {
            type: 'lessons_8',
            name: 'Dedicated Learner',
            description: 'Complete 8 lessons',
            icon: 'fa-graduation-cap',
            requirement: 8,
            category: 'lessons'
        },
        {
            type: 'lessons_10',
            name: 'Master Learner',
            description: 'Complete all 10 lessons',
            icon: 'fa-crown',
            requirement: 10,
            category: 'lessons'
        },
        {
            type: 'points_50',
            name: 'Getting Points',
            description: 'Earn 50 points',
            icon: 'fa-coins',
            requirement: 50,
            category: 'points'
        },
        {
            type: 'points_100',
            name: 'Century Club',
            description: 'Earn 100 points',
            icon: 'fa-trophy',
            requirement: 100,
            category: 'points'
        },
        {
            type: 'points_200',
            name: 'Double Century',
            description: 'Earn 200 points',
            icon: 'fa-trophy',
            requirement: 200,
            category: 'points'
        },
        {
            type: 'vocab_master',
            name: 'Vocabulary Master',
            description: 'Complete all vocabulary lessons',
            icon: 'fa-book',
            requirement: 4,
            category: 'vocabulary'
        },
        {
            type: 'grammar_master',
            name: 'Grammar Master',
            description: 'Complete all grammar lessons',
            icon: 'fa-language',
            requirement: 2,
            category: 'grammar'
        },
        {
            type: 'culture_master',
            name: 'Culture Master',
            description: 'Complete all culture lessons',
            icon: 'fa-globe',
            requirement: 2,
            category: 'culture'
        },
        {
            type: 'conversation_master',
            name: 'Conversation Master',
            description: 'Complete all conversation lessons',
            icon: 'fa-comments',
            requirement: 2,
            category: 'conversation'
        },
        {
            type: 'streak_3',
            name: 'Getting Consistent',
            description: 'Maintain a 3-day learning streak',
            icon: 'fa-fire',
            requirement: 3,
            category: 'streak'
        },
        {
            type: 'streak_7',
            name: 'Week Warrior',
            description: 'Maintain a 7-day learning streak',
            icon: 'fa-fire',
            requirement: 7,
            category: 'streak'
        }
    ];

    // Check which achievements are earned
    const earnedAchievements = userAchievements.map(a => a.achievement_type);
    
    // Create achievement items for all achievements
    for (const achievement of allAchievements) {
        const isEarned = earnedAchievements.includes(achievement.type);
        const isUnlocked = await checkAchievementRequirement(achievement, userProgress);
        
        const achievementItem = document.createElement('div');
        achievementItem.className = `achievement-item ${isEarned ? 'earned' : isUnlocked ? 'unlocked' : 'locked'}`;
        
        const earnedAchievement = userAchievements.find(a => a.achievement_type === achievement.type);
        
        achievementItem.innerHTML = `
            <div class="achievement-icon ${isEarned ? 'earned' : isUnlocked ? 'unlocked' : 'locked'}">
                <i class="fas ${achievement.icon}"></i>
            </div>
            <div class="achievement-details">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                ${isEarned ? `<span class="earned-date">Earned: ${formatDate(earnedAchievement.earned_at)}</span>` : 
                  isUnlocked ? `<span class="unlock-status">Ready to unlock!</span>` : 
                  `<span class="requirement">Requires: ${getRequirementText(achievement)}</span>`}
            </div>
        `;
        
        achievementsContainer.appendChild(achievementItem);
    }
}

// Check if achievement requirement is met
async function checkAchievementRequirement(achievement, userProgress) {
    // Ensure we have the latest progress data
    if (!userProgress || Object.keys(userProgress).length === 0) {
        userProgress = await getUserCurrentProgress();
    }
    
    let requirementMet = false;
    
    switch (achievement.category) {
        case 'lessons':
            requirementMet = userProgress.completedLessons >= achievement.requirement;
            break;
        case 'points':
            requirementMet = userProgress.points >= achievement.requirement;
            break;
        case 'vocabulary':
            requirementMet = userProgress.vocabularyCompleted >= achievement.requirement;
            break;
        case 'grammar':
            requirementMet = userProgress.grammarCompleted >= achievement.requirement;
            break;
        case 'culture':
            requirementMet = userProgress.cultureCompleted >= achievement.requirement;
            break;
        case 'conversation':
            requirementMet = userProgress.conversationCompleted >= achievement.requirement;
            break;
        case 'streak':
            requirementMet = userProgress.currentStreak >= achievement.requirement;
            break;
        default:
            requirementMet = false;
    }
    
    // Log achievement check for debugging
    console.log(`Achievement ${achievement.type} (${achievement.name}):`, {
        category: achievement.category,
        requirement: achievement.requirement,
        current: userProgress[achievement.category === 'lessons' ? 'completedLessons' : 
                            achievement.category === 'points' ? 'points' :
                            achievement.category === 'vocabulary' ? 'vocabularyCompleted' :
                            achievement.category === 'grammar' ? 'grammarCompleted' :
                            achievement.category === 'culture' ? 'cultureCompleted' :
                            achievement.category === 'conversation' ? 'conversationCompleted' :
                            achievement.category === 'streak' ? 'currentStreak' : 'unknown'],
        requirementMet
    });
    
    return requirementMet;
}

// Get requirement text for locked achievements
function getRequirementText(achievement) {
    switch (achievement.category) {
        case 'lessons':
            return `${achievement.requirement} lesson${achievement.requirement > 1 ? 's' : ''} completed`;
        case 'points':
            return `${achievement.requirement} points earned`;
        case 'vocabulary':
            return `${achievement.requirement} vocabulary lesson${achievement.requirement > 1 ? 's' : ''} completed`;
        case 'grammar':
            return `${achievement.requirement} grammar lesson${achievement.requirement > 1 ? 's' : ''} completed`;
        case 'culture':
            return `${achievement.requirement} culture lesson${achievement.requirement > 1 ? 's' : ''} completed`;
        case 'conversation':
            return `${achievement.requirement} conversation lesson${achievement.requirement > 1 ? 's' : ''} completed`;
        case 'streak':
            return `${achievement.requirement}-day streak`;
        default:
            return 'Unknown requirement';
    }
}

// Get user's current progress for achievement checking
async function getUserCurrentProgress() {
    // If no current user, return default values
    if (!window.currentUser) {
        return {
            completedLessons: 0,
            points: 0,
            vocabularyCompleted: 0,
            grammarCompleted: 0,
            cultureCompleted: 0,
            conversationCompleted: 0,
            currentStreak: 0
        };
    }
    
    try {
        // Try to get real progress from database first
        if (typeof UserProgressManager !== 'undefined') {
            const userProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
            if (userProgress && Array.isArray(userProgress)) {
                const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
                let completedLessons = 0;
                let vocabularyCompleted = 0;
                let grammarCompleted = 0;
                let cultureCompleted = 0;
                let conversationCompleted = 0;
                
                // Calculate points from completed lessons
                const lessonData = {
                    'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
                    'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
                    'conv-1': 22, 'conv-2': 28
                };
                
                let calculatedPoints = 0;
                
                // Count completed lessons by category from database
                userProgress.forEach(progress => {
                    if (progress.progress_percentage >= 100) {
                        completedLessons++;
                        calculatedPoints += lessonData[progress.lesson_id] || 0;
                        
                        if (progress.lesson_id.startsWith('vocab-')) vocabularyCompleted++;
                        else if (progress.lesson_id.startsWith('grammar-')) grammarCompleted++;
                        else if (progress.lesson_id.startsWith('culture-')) cultureCompleted++;
                        else if (progress.lesson_id.startsWith('conv-')) conversationCompleted++;
                    }
                });
                
                // Get current streak
                const currentStreak = getCurrentStreak();
                
                console.log('Real progress from database for achievements:', {
                    completedLessons,
                    points: calculatedPoints,
                    vocabularyCompleted,
                    grammarCompleted,
                    cultureCompleted,
                    conversationCompleted,
                    currentStreak
                });
                
                return {
                    completedLessons,
                    points: calculatedPoints,
                    vocabularyCompleted,
                    grammarCompleted,
                    cultureCompleted,
                    conversationCompleted,
                    currentStreak
                };
            }
        }
        
        // Fallback to localStorage if database is not available
        console.log('Falling back to localStorage for achievement progress...');
        const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
        let completedLessons = 0;
        let vocabularyCompleted = 0;
        let grammarCompleted = 0;
        let cultureCompleted = 0;
        let conversationCompleted = 0;
        
        // Count completed lessons by category from localStorage
        lessonIds.forEach(lessonId => {
            const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
            if (parseInt(progress) >= 100) {
                completedLessons++;
                
                if (lessonId.startsWith('vocab-')) vocabularyCompleted++;
                else if (lessonId.startsWith('grammar-')) grammarCompleted++;
                else if (lessonId.startsWith('culture-')) cultureCompleted++;
                else if (lessonId.startsWith('conv-')) conversationCompleted++;
            }
        });
        
        // Calculate points from localStorage
        const lessonData = {
            'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
            'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
            'conv-1': 22, 'conv-2': 28
        };
        
        let calculatedPoints = 0;
        lessonIds.forEach(lessonId => {
            const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
            if (parseInt(progress) >= 100) {
                calculatedPoints += lessonData[lessonId] || 0;
            }
        });
        
        // Get points from localStorage or use calculated
        const savedProgress = localStorage.getItem('userProgress');
        const userProgress = savedProgress ? JSON.parse(savedProgress) : { points: 0 };
        const finalPoints = userProgress.points > 0 ? userProgress.points : calculatedPoints;
        
        return {
            completedLessons,
            points: finalPoints,
            vocabularyCompleted,
            grammarCompleted,
            cultureCompleted,
            conversationCompleted,
            currentStreak: getCurrentStreak()
        };
        
    } catch (error) {
        console.error('Error getting user progress for achievements:', error);
        
        // Return default values on error
        return {
            completedLessons: 0,
            points: 0,
            vocabularyCompleted: 0,
            grammarCompleted: 0,
            cultureCompleted: 0,
            conversationCompleted: 0,
            currentStreak: 0
        };
    }
}

// Get medal icon for top 3 ranks
function getMedalIcon(rank) {
    const medals = {
        1: '<i class="fas fa-medal" style="color: #FFD700;"></i>',
        2: '<i class="fas fa-medal" style="color: #C0C0C0;"></i>',
        3: '<i class="fas fa-medal" style="color: #CD7F32;"></i>'
    };
    return medals[rank] || '';
}

// Get achievement icon based on type
function getAchievementIcon(type) {
    const icons = {
        // Lesson completion achievements
        'first_lesson': 'fa-star',
        'lessons_3': 'fa-graduation-cap',
        'lessons_5': 'fa-graduation-cap',
        'lessons_8': 'fa-graduation-cap',
        'lessons_10': 'fa-crown',
        
        // Points achievements
        'points_50': 'fa-coins',
        'points_100': 'fa-trophy',
        'points_200': 'fa-trophy',
        'points_500': 'fa-trophy',
        'points_1000': 'fa-crown',
        
        // Category mastery achievements
        'vocab_master': 'fa-book',
        'grammar_master': 'fa-language',
        'culture_master': 'fa-globe',
        'conversation_master': 'fa-comments',
        
        // Streak achievements
        'streak_3': 'fa-fire',
        'streak_7': 'fa-fire',
        'streak_30': 'fa-fire',
        
        // Legacy achievements
        'perfect_score': 'fa-perfect',
        'speed_learner': 'fa-bolt'
    };
    return icons[type] || 'fa-star';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Demo leaderboard data for fallback
function getDemoLeaderboardData() {
    // Get current user's progress from localStorage
    const savedProgress = localStorage.getItem('userProgress');
    const userProgress = savedProgress ? JSON.parse(savedProgress) : { points: 0, completedLessons: [] };
    
    // Count actual completed lessons from localStorage
    const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
    let completedLessons = 0;
    let calculatedPoints = 0;
    
    // Calculate points from completed lessons
    const lessonData = {
        'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
        'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
        'conv-1': 22, 'conv-2': 28
    };
    
    lessonIds.forEach(lessonId => {
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        if (parseInt(progress) >= 100) {
            completedLessons++;
            calculatedPoints += lessonData[lessonId] || 0;
        }
    });
    
    // Use calculated points if userProgress.points is 0 or if we have completed lessons but 0 points
    const finalPoints = (userProgress.points > 0 && completedLessons === 0) ? userProgress.points : calculatedPoints;
    
    console.log('=== LEADERBOARD DEBUG ===');
    console.log('User Progress from localStorage:', userProgress);
    console.log('Individual lesson progress:');
    lessonIds.forEach(lessonId => {
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        console.log(`${lessonId}: ${progress}%`);
    });
    console.log('Calculated - Completed lessons:', completedLessons, 'Points:', finalPoints);
    console.log('Current User:', window.currentUser);
    console.log('========================');
    
    return [
        {
            id: window.currentUser ? window.currentUser.id : 'demo_user',
            full_name: window.currentUser ? window.currentUser.full_name : 'Demo User',
            email: window.currentUser ? window.currentUser.email : 'demo@example.com',
            total_points: finalPoints,
            lessons_completed: completedLessons,
            current_streak: getCurrentStreak(),
            avatar_url: null
        },
        {
            id: '2',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
            total_points: 980,
            lessons_completed: 12,
            current_streak: 5,
            avatar_url: null
        },
        {
            id: '3',
            full_name: 'Mike Johnson',
            email: 'mike@example.com',
            total_points: 850,
            lessons_completed: 10,
            current_streak: 3,
            avatar_url: null
        },
        {
            id: '4',
            full_name: 'Sarah Wilson',
            email: 'sarah@example.com',
            total_points: 720,
            lessons_completed: 8,
            current_streak: 2,
            avatar_url: null
        },
        {
            id: '5',
            full_name: 'David Brown',
            email: 'david@example.com',
            total_points: 650,
            lessons_completed: 7,
            current_streak: 1,
            avatar_url: null
        }
    ];
}

// Refresh leaderboard data
async function refreshLeaderboard() {
    console.log('Refreshing leaderboard...');
    
    try {
        // Show loading state
        const refreshButton = document.querySelector('button[onclick="refreshLeaderboard()"]');
        const originalText = refreshButton.innerHTML;
        refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshButton.disabled = true;
        
        // Clear existing data and show loading
        leaderboardData = [];
        displayLeaderboard(); // This will show loading state
        
        // Reload data from database
        await loadLeaderboardData();
        
        // Reload user achievements
        await loadUserAchievements();
        
        // Ensure current user's data is accurate
        if (window.currentUser) {
            await syncCurrentUserProgress();
        }
        
        // Update displays
        await displayLeaderboard();
        await displayUserAchievements();
        updateStatsOverview();
        
        showSuccessMessage('Leaderboard refreshed with latest database data!');
        
    } catch (error) {
        console.error('Error refreshing leaderboard:', error);
        showErrorMessage('Failed to refresh leaderboard. Please try again.');
    } finally {
        // Restore button state
        const refreshButton = document.querySelector('button[onclick="refreshLeaderboard()"]');
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshButton.disabled = false;
    }
}

// Update stats overview
function updateStatsOverview() {
    // Calculate totals from leaderboard data
    const totalUsers = leaderboardData.length;
    const totalLessons = leaderboardData.reduce((sum, user) => sum + (user.lessons_completed || 0), 0);
    const totalPoints = leaderboardData.reduce((sum, user) => sum + (user.total_points || 0), 0);
    
    // Find user's rank
    let userRank = '-';
    if (window.currentUser) {
        const userIndex = leaderboardData.findIndex(user => user.id === window.currentUser.id);
        if (userIndex !== -1) {
            userRank = userIndex + 1;
        }
    }
    
    // Update DOM elements
    const totalUsersElement = document.getElementById('total-users');
    const totalLessonsElement = document.getElementById('total-lessons');
    const totalPointsElement = document.getElementById('total-points');
    const userRankElement = document.getElementById('user-rank');
    
    if (totalUsersElement) totalUsersElement.textContent = totalUsers;
    if (totalLessonsElement) totalLessonsElement.textContent = totalLessons;
    if (totalPointsElement) totalPointsElement.textContent = totalPoints;
    if (userRankElement) userRankElement.textContent = userRank;
}

// Switch between leaderboard tabs
function switchLeaderboardTab(tab) {
    console.log('Switching to tab:', tab);
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    const activeTab = document.querySelector(`[data-tab="${tab}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Show/hide content based on tab
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    const activeContent = document.querySelector(`.${tab}-content`);
    if (activeContent) {
        activeContent.style.display = 'block';
    }
}

// Make functions globally accessible
window.initializeLeaderboardPage = initializeLeaderboardPage;
window.refreshLeaderboard = refreshLeaderboard;
window.switchLeaderboardTab = switchLeaderboardTab;
window.quickLoadCurrentUserData = quickLoadCurrentUserData;
window.syncCurrentUserProgress = syncCurrentUserProgress;

// Force refresh from real lesson data (for debugging)
window.forceRefreshFromLessons = async function() {
    console.log('Force refreshing leaderboard from real lesson data...');
    try {
        // Clear existing data
        leaderboardData = [];
        
        // Force reload from database with real lesson progress
        await loadLeaderboardData();
        
        // Ensure current user data is accurate
        if (window.currentUser) {
            await syncCurrentUserProgress();
        }
        
        // Update display
        await displayLeaderboard();
        updateStatsOverview();
        
        console.log('Force refresh completed with real lesson data');
        showSuccessMessage('Leaderboard refreshed with real lesson data!');
        
    } catch (error) {
        console.error('Error in force refresh:', error);
        showErrorMessage('Failed to refresh from lesson data');
    }
};

// Test achievement unlocking with real lesson data
window.testAchievementUnlock = async function() {
    console.log('=== TESTING ACHIEVEMENT UNLOCK WITH REAL LESSON DATA ===');
    
    if (!window.currentUser) {
        console.log('No authenticated user found');
        return;
    }
    
    try {
        // Get real lesson progress
        if (typeof UserProgressManager !== 'undefined') {
            const userProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
            console.log('Current lesson progress:', userProgress);
            
            if (userProgress && Array.isArray(userProgress)) {
                // Count completed lessons
                const completedLessons = userProgress.filter(p => p.progress_percentage >= 100).length;
                console.log('Completed lessons:', completedLessons);
                
                // Calculate total points
                const lessonData = {
                    'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
                    'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
                    'conv-1': 22, 'conv-2': 28
                };
                
                let totalPoints = 0;
                userProgress.forEach(progress => {
                    if (progress.progress_percentage >= 100) {
                        totalPoints += lessonData[progress.lesson_id] || 0;
                        console.log(`Lesson ${progress.lesson_id} completed: +${lessonData[progress.lesson_id]} points`);
                    }
                });
                
                console.log('Total points from completed lessons:', totalPoints);
                
                // Get category progress
                const categoryProgress = await getCategoryProgress();
                console.log('Category progress:', categoryProgress);
                
                // Check what achievements should unlock
                console.log('=== ACHIEVEMENT ANALYSIS ===');
                console.log(`Lessons completed: ${completedLessons}/10`);
                console.log(`Total points: ${totalPoints}`);
                console.log(`Vocabulary: ${categoryProgress.vocabulary}/4`);
                console.log(`Grammar: ${categoryProgress.grammar}/2`);
                console.log(`Culture: ${categoryProgress.culture}/2`);
                console.log(`Conversation: ${categoryProgress.conversation}/2`);
                
                // Show what should unlock
                if (completedLessons >= 1) console.log('✅ First Steps achievement should unlock');
                if (completedLessons >= 3) console.log('✅ Getting Started achievement should unlock');
                if (completedLessons >= 5) console.log('✅ Steady Progress achievement should unlock');
                if (completedLessons >= 8) console.log('✅ Dedicated Learner achievement should unlock');
                if (completedLessons >= 10) console.log('✅ Master Learner achievement should unlock');
                
                if (totalPoints >= 50) console.log('✅ Getting Points achievement should unlock');
                if (totalPoints >= 100) console.log('✅ Century Club achievement should unlock');
                if (totalPoints >= 200) console.log('✅ Double Century achievement should unlock');
                
                if (categoryProgress.vocabulary >= 4) console.log('✅ Vocabulary Master achievement should unlock');
                if (categoryProgress.grammar >= 2) console.log('✅ Grammar Master achievement should unlock');
                if (categoryProgress.culture >= 2) console.log('✅ Culture Master achievement should unlock');
                if (categoryProgress.conversation >= 2) console.log('✅ Conversation Master achievement should unlock');
                
            } else {
                console.log('No lesson progress data found');
            }
        } else {
            console.log('UserProgressManager not available');
        }
        
        // Now check and award achievements
        console.log('=== CHECKING AND AWARDING ACHIEVEMENTS ===');
        await checkAndAwardAchievements();
        
    } catch (error) {
        console.error('Error testing achievement unlock:', error);
    }
};

// Show current achievement status and progress
window.showAchievementStatus = async function() {
    console.log('=== CURRENT ACHIEVEMENT STATUS ===');
    
    if (!window.currentUser) {
        console.log('No authenticated user found');
        return;
    }
    
    try {
        // Get current achievements
        console.log('Current achievements:', userAchievements);
        
        // Get real lesson progress
        if (typeof UserProgressManager !== 'undefined') {
            const userProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
            
            if (userProgress && Array.isArray(userProgress)) {
                const completedLessons = userProgress.filter(p => p.progress_percentage >= 100).length;
                const categoryProgress = await getCategoryProgress();
                
                console.log('=== PROGRESS TOWARDS ACHIEVEMENTS ===');
                console.log(`Lessons: ${completedLessons}/10 (${Math.round(completedLessons/10*100)}%)`);
                console.log(`Vocabulary: ${categoryProgress.vocabulary}/4 (${Math.round(categoryProgress.vocabulary/4*100)}%)`);
                console.log(`Grammar: ${categoryProgress.grammar}/2 (${Math.round(categoryProgress.grammar/2*100)}%)`);
                console.log(`Culture: ${categoryProgress.culture}/2 (${Math.round(categoryProgress.culture/2*100)}%)`);
                console.log(`Conversation: ${categoryProgress.conversation}/2 (${Math.round(categoryProgress.conversation/2*100)}%)`);
                
                // Show what's needed for next achievements
                console.log('=== NEXT ACHIEVEMENTS TO UNLOCK ===');
                if (completedLessons < 3) console.log(`📚 Need ${3 - completedLessons} more lesson(s) for "Getting Started"`);
                if (completedLessons < 5) console.log(`📚 Need ${5 - completedLessons} more lesson(s) for "Steady Progress"`);
                if (completedLessons < 8) console.log(`📚 Need ${8 - completedLessons} more lesson(s) for "Dedicated Learner"`);
                if (completedLessons < 10) console.log(`📚 Need ${10 - completedLessons} more lesson(s) for "Master Learner"`);
                
                if (categoryProgress.vocabulary < 4) console.log(`📖 Need ${4 - categoryProgress.vocabulary} more vocab lesson(s) for "Vocabulary Master"`);
                if (categoryProgress.grammar < 2) console.log(`📖 Need ${2 - categoryProgress.grammar} more grammar lesson(s) for "Grammar Master"`);
                if (categoryProgress.culture < 2) console.log(`📖 Need ${2 - categoryProgress.culture} more culture lesson(s) for "Culture Master"`);
                if (categoryProgress.conversation < 2) console.log(`📖 Need ${2 - categoryProgress.conversation} more conversation lesson(s) for "Conversation Master"`);
            }
        }
        
    } catch (error) {
        console.error('Error showing achievement status:', error);
    }
};

// Debug function to check current progress
window.debugLeaderboard = function() {
    console.log('=== LEADERBOARD DEBUG ===');
    console.log('Current User:', window.currentUser);
    console.log('Leaderboard Data:', leaderboardData);
    
    // Check localStorage
    const savedProgress = localStorage.getItem('userProgress');
    console.log('UserProgress from localStorage:', savedProgress ? JSON.parse(savedProgress) : null);
    
    // Check individual lesson progress
    const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
    console.log('Individual lesson progress:');
    lessonIds.forEach(lessonId => {
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        console.log(`${lessonId}: ${progress}%`);
    });
    
    // Calculate completed lessons
    let completedLessons = 0;
    lessonIds.forEach(lessonId => {
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        if (parseInt(progress) >= 100) {
            completedLessons++;
        }
    });
    console.log('Total completed lessons:', completedLessons);
    console.log('========================');
};

// Function to sync current user's progress with lessons page data
async function syncCurrentUserProgress() {
    if (!window.currentUser) return;
    
    try {
        console.log('Syncing current user progress with lessons data...');
        
        // Get current user's actual progress from user_progress table
        if (typeof UserProgressManager !== 'undefined') {
            const userProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
            if (userProgress && Array.isArray(userProgress)) {
                // Count completed lessons (100% progress)
                const actualLessonsCompleted = userProgress.filter(p => p.progress_percentage >= 100).length;
                
                // Calculate total points from completed lessons
                const lessonData = {
                    'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
                    'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
                    'conv-1': 22, 'conv-2': 28
                };
                
                let actualTotalPoints = 0;
                userProgress.forEach(progress => {
                    if (progress.progress_percentage >= 100) {
                        actualTotalPoints += lessonData[progress.lesson_id] || 0;
                    }
                });
                
                // Get actual streak
                const actualStreak = getCurrentStreak();
                
                console.log('Current user actual progress:', {
                    lessons_completed: actualLessonsCompleted,
                    total_points: actualTotalPoints,
                    current_streak: actualStreak
                });
                
                // Update current user's data in leaderboard if it exists
                const currentUserIndex = leaderboardData.findIndex(user => user.id === window.currentUser.id);
                if (currentUserIndex !== -1) {
                    // Update the data
                    leaderboardData[currentUserIndex].lessons_completed = actualLessonsCompleted;
                    leaderboardData[currentUserIndex].total_points = actualTotalPoints;
                    leaderboardData[currentUserIndex].current_streak = actualStreak;
                    
                    // Re-sort leaderboard after updating current user
                    leaderboardData.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
                    
                    console.log('Updated current user data in leaderboard');
                }
            }
        }
    } catch (error) {
        console.error('Error syncing current user progress:', error);
    }
}

// Function to manually sync lesson progress to Supabase
window.syncLessonProgressToSupabase = async function() {
    if (!window.currentUser || window.currentUser.id.startsWith('demo_user_')) {
        console.log('Cannot sync: No authenticated user');
        return;
    }
    
    try {
        console.log('Manually syncing lesson progress to Supabase...');
        
        const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
        const lessonData = {
            'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
            'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
            'conv-1': 22, 'conv-2': 28
        };
        
        let totalPoints = 0;
        
        for (const lessonId of lessonIds) {
            const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
            const progressValue = parseInt(progress);
            
            if (progressValue > 0) {
                console.log(`Syncing ${lessonId}: ${progressValue}%`);
                
                // Save lesson progress to Supabase
                await UserProgressManager.saveUserProgress(
                    window.currentUser.id,
                    lessonId,
                    progressValue,
                    lessonData[lessonId] || 0
                );
                
                if (progressValue >= 100) {
                    totalPoints += lessonData[lessonId] || 0;
                }
            }
        }
        
        // Update total points in profiles table
        if (totalPoints > 0) {
            await UserProgressManager.updateUserPoints(window.currentUser.id, totalPoints);
            console.log('Updated total points:', totalPoints);
        }
        
        console.log('Lesson progress synced to Supabase successfully!');
        showSuccessMessage('Progress synced to Supabase!');
        
        // Refresh leaderboard
        await refreshLeaderboard();
        
    } catch (error) {
        console.error('Failed to sync lesson progress:', error);
        showErrorMessage('Failed to sync progress: ' + error.message);
    }
};

// Show loading indicator for full leaderboard
function showFullLeaderboardLoading() {
    const leaderboardContainer = document.querySelector('.leaderboard-list');
    if (leaderboardContainer) {
        // Add loading indicator below current user data
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--medium-gray);">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading full leaderboard...</p>
            </div>
        `;
        leaderboardContainer.appendChild(loadingIndicator);
    }
}

// Hide loading indicator
function hideFullLeaderboardLoading() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Quick load current user data for immediate display
async function quickLoadCurrentUserData() {
    if (!window.currentUser || typeof UserProgressManager === 'undefined') return;
    
    try {
        console.log('Quick loading current user data from real lesson progress...');
        const userProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
        
        if (userProgress && Array.isArray(userProgress)) {
            console.log('Raw lesson progress data:', userProgress);
            
            // Calculate current user's progress from real lesson data
            const actualLessonsCompleted = userProgress.filter(p => p.progress_percentage >= 100).length;
            
            const lessonData = {
                'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
                'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
                'conv-1': 22, 'conv-2': 28
            };
            
            let actualTotalPoints = 0;
            userProgress.forEach(progress => {
                if (progress.progress_percentage >= 100) {
                    actualTotalPoints += lessonData[progress.lesson_id] || 0;
                    console.log(`Lesson ${progress.lesson_id} completed: +${lessonData[progress.lesson_id]} points`);
                }
            });
            
            const actualStreak = getCurrentStreak();
            
            console.log('Calculated from real lesson data:', {
                lessons_completed: actualLessonsCompleted,
                total_points: actualTotalPoints,
                current_streak: actualStreak
            });
            
            // Create initial leaderboard with current user's real data
            leaderboardData = [{
                id: window.currentUser.id,
                full_name: window.currentUser.full_name || 'Current User',
                email: window.currentUser.email,
                total_points: actualTotalPoints || 0,
                lessons_completed: actualLessonsCompleted || 0,
                current_streak: actualStreak || 0,
                avatar_url: null
            }];
            
            console.log('Current user real data loaded quickly:', leaderboardData[0]);
            
            // Display immediately with current user data
            await displayLeaderboard();
            updateStatsOverview();
            
            // Show loading indicator for full leaderboard
            showFullLeaderboardLoading();
            
            return true;
        } else {
            console.log('No lesson progress data found for current user');
        }
    } catch (error) {
        console.error('Error quick loading current user data:', error);
    }
    return false;
}

// Stop auto-sync when user leaves the page
window.addEventListener('beforeunload', function() {
    stopLeaderboardAutoSync();
});

// Initialize leaderboard page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Leaderboard.js: DOM Content Loaded');
    initializeLeaderboardPage();
    
    // Set up automatic syncing for leaderboard data
    setupLeaderboardAutoSync();
});

// Set up automatic syncing for leaderboard
function setupLeaderboardAutoSync() {
    // Clear any existing auto-sync intervals
    if (window.leaderboardAutoSyncInterval) {
        clearInterval(window.leaderboardAutoSyncInterval);
    }
    
    // Set up automatic syncing every 60 seconds for leaderboard
    window.leaderboardAutoSyncInterval = setInterval(async () => {
        if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_')) {
            try {
                console.log('Auto-syncing leaderboard data...');
                await loadLeaderboardData();
                await loadUserAchievements();
                await displayLeaderboard();
                await displayUserAchievements();
                updateStatsOverview();
                console.log('Leaderboard auto-sync completed successfully');
            } catch (error) {
                console.error('Leaderboard auto-sync failed:', error);
            }
        }
    }, 60000); // 60 seconds
    
    // Set up visibility change listener to refresh data when page becomes visible
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && window.currentUser) {
            console.log('Page became visible, refreshing with real lesson data...');
            try {
                // Force refresh from real lesson progress
                await loadLeaderboardData();
                await syncCurrentUserProgress();
                await displayLeaderboard();
                updateStatsOverview();
                
                // Check for new achievements when page becomes visible
                await checkAndAwardAchievements();
            } catch (error) {
                console.error('Error refreshing on visibility change:', error);
            }
        }
    });
    
    // Set up focus listener to refresh data when window gains focus
    window.addEventListener('focus', async () => {
        if (window.currentUser) {
            console.log('Window gained focus, refreshing with real lesson data...');
            try {
                // Force refresh from real lesson progress
                await loadLeaderboardData();
                await syncCurrentUserProgress();
                await displayLeaderboard();
                updateStatsOverview();
                
                // Check for new achievements when window gains focus
                await checkAndAwardAchievements();
            } catch (error) {
                console.error('Error refreshing on focus:', error);
            }
        }
    });
    
    console.log('Leaderboard auto-sync set up every 60 seconds with visibility/focus listeners');
}

// Stop leaderboard automatic syncing
function stopLeaderboardAutoSync() {
    if (window.leaderboardAutoSyncInterval) {
        clearInterval(window.leaderboardAutoSyncInterval);
        window.leaderboardAutoSyncInterval = null;
        console.log('Leaderboard auto-sync stopped');
    }
}

// Show achievement notification
function showAchievementNotification(achievement) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notification-content">
            <i class="fas ${achievement.icon || 'fa-star'}" style="color: #FFD700;"></i>
            <div class="achievement-notification-text">
                <h4>Achievement Unlocked!</h4>
                <p>${achievement.name}</p>
                <small>${achievement.description}</small>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}
