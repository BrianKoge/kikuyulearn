// Supabase Configuration for Kikuyulearn
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://cbrqjobtcofkkpiauibj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicnFqb2J0Y29ma2twaWF1aWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODM4MzEsImV4cCI6MjA3MjE1OTgzMX0.E01-rb7_nX_fyWnDJJBF9BO3hNmQquE77eHTLrRlSQ8';

// Initialize Supabase client (singleton pattern)
let supabase = null;

// Function to initialize Supabase client (singleton)
function initializeSupabase() {
    if (!supabase && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
    }
    return supabase;
}

// Try to initialize immediately if Supabase is already loaded
if (window.supabase) {
    initializeSupabase();
} else {
    // Wait for Supabase to load
    window.addEventListener('load', function() {
        if (window.supabase) {
            initializeSupabase();
        }
    });
}

// User Progress Management
class UserProgressManager {
    // Save user progress to Supabase
    static async saveUserProgress(userId, lessonId, progress, points) {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    lesson_id: lessonId,
                    progress_percentage: progress,
                    points_earned: points,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,lesson_id'
                });

            if (error) {
                console.error('Error saving user progress:', error);
                throw error;
            }

            console.log('User progress saved successfully:', data);
            return data;
        } catch (error) {
            console.error('Failed to save user progress:', error);
            throw error;
        }
    }

    // Get user progress from Supabase
    static async getUserProgress(userId) {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient
                .from('user_progress')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching user progress:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch user progress:', error);
            return [];
        }
    }

    // Update user points in profiles table
    static async updateUserPoints(userId, points) {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient
                .from('profiles')
                .update({
                    points: points,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                console.error('Error updating user points:', error);
                throw error;
            }

            console.log('User points updated successfully:', data);
            return data;
        } catch (error) {
            console.error('Failed to update user points:', error);
            throw error;
        }
    }

    // Get user profile with points
    static async getUserProfile(userId) {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // If profile doesn't exist (PGRST116), create a default profile
                if (error.code === 'PGRST116') {
                    console.log('User profile not found, creating default profile for:', userId);
                    
                    // Try to get user info from auth.users table
                    let userEmail = null;
                    let userName = null;
                    
                    try {
                        const { data: authData, error: authError } = await supabaseClient.auth.getUser();
                        
                        if (!authError && authData.user) {
                            userEmail = authData.user.email;
                            userName = authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User';
                        }
                    } catch (authError) {
                        console.log('Auth session missing, using fallback user info');
                        // If auth session is missing, we'll use fallback values
                    }
                    
                    // If we couldn't get auth user info, use fallback values
                    if (!userEmail) {
                        userEmail = 'user@example.com'; // Fallback email
                        userName = 'User'; // Fallback name
                        console.log('Using fallback user info for profile creation');
                    }
                    
                    // Create default profile with minimal required fields
                    const defaultProfile = {
                        id: userId,
                        email: userEmail,
                        full_name: userName
                        // Note: points, lessons_completed, current_streak will use DEFAULT values
                        // avatar_url, created_at, updated_at will use DEFAULT values
                    };
                    
                    const { data: newProfile, error: createError } = await supabaseClient
                        .from('profiles')
                        .insert(defaultProfile)
                        .select()
                        .single();
                    
                    if (createError) {
                        console.error('Error creating default profile:', createError);
                        return null;
                    }
                    
                    console.log('Default profile created successfully:', newProfile);
                    return newProfile;
                }
                
                console.error('Error fetching user profile:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            return null;
        }
    }
}

// Leaderboard Management
class LeaderboardManager {
    // Get leaderboard data from materialized view
    static async getLeaderboard() {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient
                .from('leaderboard_view')
                .select('*')
                .order('total_points', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching leaderboard:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return [];
        }
    }

    // Get user achievements
    static async getUserAchievements(userId) {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient
                .from('user_achievements')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching user achievements:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Failed to fetch user achievements:', error);
            return [];
        }
    }

    // Award achievement to user
    static async awardAchievement(achievement) {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient
                .from('user_achievements')
                .insert(achievement)
                .select()
                .single();

            if (error) {
                console.error('Error awarding achievement:', error);
                throw error;
            }

            console.log('Achievement awarded successfully:', data);
            return data;
        } catch (error) {
            console.error('Failed to award achievement:', error);
            throw error;
        }
    }
}

// Authentication Management
class AuthManager {
    // Sign up user
    static async signUp(email, password, fullName) {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (error) {
                console.error('Error signing up:', error);
                throw error;
            }

            // Create user profile in profiles table if signup successful
            if (data.user) {
                try {
                    const { error: profileError } = await supabaseClient
                        .from('profiles')
                        .insert({
                            id: data.user.id,
                            email: email,
                            full_name: fullName,
                            points: 0,
                            lessons_completed: 0,
                            current_streak: 0
                        });

                    if (profileError) {
                        console.error('Error creating user profile:', profileError);
                    } else {
                        console.log('User profile created successfully');
                    }
                } catch (profileError) {
                    console.error('Failed to create user profile:', profileError);
                }
            }

            // Return the actual Supabase response structure
            return { data, error: null };
        } catch (error) {
            console.error('Failed to sign up:', error);
            throw error;
        }
    }

    // Sign in user
    static async signIn(email, password) {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('Error signing in:', error);
                throw error;
            }

            // Return the actual Supabase response structure
            return { data, error: null };
        } catch (error) {
            console.error('Failed to sign in:', error);
            throw error;
        }
    }

    // Sign out user
    static async signOut() {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
                throw error;
            }
        } catch (error) {
            console.error('Failed to sign out:', error);
            throw error;
        }
    }

    // Get current user
    static async getCurrentUser() {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error) {
                console.error('Error getting current user:', error);
                return null;
            }
            return user;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    }
}

// Export for use in other files
window.UserProgressManager = UserProgressManager;
window.LeaderboardManager = LeaderboardManager;
window.AuthManager = AuthManager;
window.initializeSupabase = initializeSupabase;
