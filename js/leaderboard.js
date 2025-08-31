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
    if (window.location.pathname.includes('leaderboard.html')) {
        console.log('Initializing leaderboard page...');
        
        try {
            // Wait for Supabase client to be ready
            await waitForSupabase();
            
            // Load current user
            await loadCurrentUser();
            
            // Load leaderboard data from Supabase
            await loadLeaderboardData();
            
            // Load user achievements if user is authenticated
            await loadUserAchievements();
            
            // Display leaderboard
            displayLeaderboard();
            
            // Display user achievements
            displayUserAchievements();
            
            // Update stats overview
            updateStatsOverview();
            
            // Check and award achievements
            await checkAndAwardAchievements();
            
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
        console.log('Loading leaderboard data from Supabase...');
        
        // Wait a bit for Supabase to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
        
        console.log('No leaderboard data from Supabase, creating from profiles table...');
        // Try to get data from profiles table as fallback
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
                const { data: profilesData, error } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .order('points', { ascending: false })
                    .limit(50);
                
                if (profilesData && profilesData.length > 0) {
                    leaderboardData = profilesData.map(profile => ({
                        id: profile.id,
                        full_name: profile.full_name || 'Unknown User',
                        email: profile.email,
                        total_points: profile.points || 0,
                        lessons_completed: profile.lessons_completed || 0,
                        current_streak: profile.current_streak || 0,
                        avatar_url: null
                    }));
                    console.log('Leaderboard data created from profiles:', leaderboardData);
                    return;
                }
            }
        } catch (fallbackError) {
            console.error('Failed to load from profiles table:', fallbackError);
        }
        
        // Final fallback to demo data
        console.log('Using demo data as final fallback');
        leaderboardData = getDemoLeaderboardData();
        
    } catch (error) {
        console.error('Failed to load leaderboard from Supabase:', error);
        // Fallback to demo data
        leaderboardData = getDemoLeaderboardData();
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
                userProfile = await UserProgressManager.getUserProfile(window.currentUser.id);
                userProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
                
                if (userProfile) {
                    totalPoints = userProfile.points || 0;
                    console.log('User data from Supabase - Points:', totalPoints);
                }
                
                if (userProgress && Array.isArray(userProgress)) {
                    completedLessons = userProgress.filter(p => p.progress_percentage >= 100).length;
                    console.log('Completed lessons from progress data:', completedLessons);
                    console.log('Raw progress data:', userProgress);
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
        const categoryProgress = getCategoryProgress();
        
        if (categoryProgress.vocabulary >= 4 && !hasAchievement('vocab_master')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'vocab_master',
                achievement_name: 'Vocabulary Master',
                description: 'Complete all vocabulary lessons',
                earned_at: new Date().toISOString()
            });
        }
        
        if (categoryProgress.grammar >= 2 && !hasAchievement('grammar_master')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'grammar_master',
                achievement_name: 'Grammar Master',
                description: 'Complete all grammar lessons',
                earned_at: new Date().toISOString()
            });
        }
        
        if (categoryProgress.culture >= 2 && !hasAchievement('culture_master')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'culture_master',
                achievement_name: 'Culture Master',
                description: 'Complete all culture lessons',
                earned_at: new Date().toISOString()
            });
        }
        
        if (categoryProgress.conversation >= 2 && !hasAchievement('conversation_master')) {
            achievements.push({
                user_id: window.currentUser.id,
                achievement_type: 'conversation_master',
                achievement_name: 'Conversation Master',
                description: 'Complete all conversation lessons',
                earned_at: new Date().toISOString()
            });
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

// Get category progress from localStorage or Supabase
function getCategoryProgress() {
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

// Display leaderboard
function displayLeaderboard() {
    const leaderboardContainer = document.querySelector('.leaderboard-list');
    if (!leaderboardContainer) {
        console.error('Leaderboard container not found');
        return;
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
function displayUserAchievements() {
    const achievementsContainer = document.querySelector('.user-achievements');
    if (!achievementsContainer) {
        console.log('Achievements container not found');
        return;
    }

    // Clear existing content
    achievementsContainer.innerHTML = '';

    // Get user's current progress
    const userProgress = getUserCurrentProgress();
    
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
    allAchievements.forEach(achievement => {
        const isEarned = earnedAchievements.includes(achievement.type);
        const isUnlocked = checkAchievementRequirement(achievement, userProgress);
        
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
    });
}

// Check if achievement requirement is met
function checkAchievementRequirement(achievement, userProgress) {
    switch (achievement.category) {
        case 'lessons':
            return userProgress.completedLessons >= achievement.requirement;
        case 'points':
            return userProgress.points >= achievement.requirement;
        case 'vocabulary':
            return userProgress.vocabularyCompleted >= achievement.requirement;
        case 'grammar':
            return userProgress.grammarCompleted >= achievement.requirement;
        case 'culture':
            return userProgress.cultureCompleted >= achievement.requirement;
        case 'conversation':
            return userProgress.conversationCompleted >= achievement.requirement;
        case 'streak':
            return userProgress.currentStreak >= achievement.requirement;
        default:
            return false;
    }
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
function getUserCurrentProgress() {
    const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
    let completedLessons = 0;
    let vocabularyCompleted = 0;
    let grammarCompleted = 0;
    let cultureCompleted = 0;
    let conversationCompleted = 0;
    
    // Count completed lessons by category
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
    
    // Calculate points
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
    
    // Force refresh with latest localStorage data
    leaderboardData = getDemoLeaderboardData();
    
    await loadUserAchievements();
    displayLeaderboard();
    displayUserAchievements();
    updateStatsOverview();
    showSuccessMessage('Leaderboard refreshed!');
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
                displayLeaderboard();
                displayUserAchievements();
                updateStatsOverview();
                console.log('Leaderboard auto-sync completed successfully');
            } catch (error) {
                console.error('Leaderboard auto-sync failed:', error);
            }
        }
    }, 60000); // 60 seconds
    
    console.log('Leaderboard auto-sync set up every 60 seconds');
}

// Stop leaderboard automatic syncing
function stopLeaderboardAutoSync() {
    if (window.leaderboardAutoSyncInterval) {
        clearInterval(window.leaderboardAutoSyncInterval);
        window.leaderboardAutoSyncInterval = null;
        console.log('Leaderboard auto-sync stopped');
    }
}
