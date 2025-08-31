-- Create custom types (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_type') THEN
        CREATE TYPE lesson_type AS ENUM ('vocabulary', 'grammar', 'culture', 'conversation', 'quiz');
    END IF;
END $$;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    total_score INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB,
    difficulty_level difficulty_level DEFAULT 'beginner',
    lesson_type lesson_type DEFAULT 'vocabulary',
    estimated_duration INTEGER, -- in minutes
    points_reward INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    time_spent INTEGER, -- in seconds
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    points_earned INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create user_progress table for tracking lesson progress
CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    progress_percentage NUMERIC,
    points_earned INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can upsert their own progress" ON user_progress;

CREATE POLICY "Users can view their own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create leaderboard_view for compatibility with app code
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
    id,
    full_name,
    total_score AS total_points,
    lessons_completed,
    current_streak
FROM profiles
ORDER BY total_score DESC, lessons_completed DESC; 

GRANT SELECT ON leaderboard_view TO anon;
GRANT SELECT ON leaderboard_view TO authenticated;

-- Create leaderboard table (materialized view for performance)
DROP MATERIALIZED VIEW IF EXISTS leaderboard;
CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
    p.id,
    p.full_name,
    p.total_score,
    p.lessons_completed,
    p.current_streak,
    ROW_NUMBER() OVER (ORDER BY p.total_score DESC, p.lessons_completed DESC) as rank
FROM profiles p
WHERE p.total_score > 0
ORDER BY p.total_score DESC, p.lessons_completed DESC;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_email') THEN
        CREATE INDEX idx_profiles_email ON profiles(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_sessions_user_id') THEN
        CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_sessions_lesson_id') THEN
        CREATE INDEX idx_learning_sessions_lesson_id ON learning_sessions(lesson_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_sessions_completed_at') THEN
        CREATE INDEX idx_learning_sessions_completed_at ON learning_sessions(completed_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lessons_difficulty') THEN
        CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lessons_type') THEN
        CREATE INDEX idx_lessons_type ON lessons(lesson_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lessons_order') THEN
        CREATE INDEX idx_lessons_order ON lessons(order_index);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_achievements_user_id') THEN
        CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own learning sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Users can insert their own learning sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for learning_sessions
CREATE POLICY "Users can view their own learning sessions" ON learning_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning sessions" ON learning_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for lessons (public read access)
CREATE POLICY "Anyone can view lessons" ON lessons
    FOR SELECT USING (true);

-- Note: Materialized views don't support RLS policies
-- The leaderboard view will be refreshed manually or via triggers

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_leaderboard() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_progress(UUID) CASCADE;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats when learning session is completed
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's total score and lessons completed
    UPDATE profiles 
    SET 
        total_score = total_score + NEW.score,
        lessons_completed = lessons_completed + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Refresh the leaderboard
    PERFORM refresh_leaderboard();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh the leaderboard materialized view
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user progress
CREATE OR REPLACE FUNCTION public.get_user_progress(user_uuid UUID)
RETURNS TABLE (
    total_score INTEGER,
    lessons_completed INTEGER,
    current_streak INTEGER,
    longest_streak INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.total_score,
        p.lessons_completed,
        p.current_streak,
        p.longest_streak,
        l.rank
    FROM profiles p
    LEFT JOIN leaderboard l ON p.id = l.id
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_learning_session_completed ON learning_sessions;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_learning_session_completed
    AFTER INSERT ON learning_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

-- Insert sample lessons
INSERT INTO lessons (title, description, difficulty_level, lesson_type, estimated_duration, points_reward, order_index) VALUES
('Basic Greetings', 'Learn common Kikuyu greetings and introductions', 'beginner', 'vocabulary', 15, 10, 1),
('Numbers 1-10', 'Learn to count from one to ten in Kikuyu', 'beginner', 'vocabulary', 20, 15, 2),
('Family Members', 'Learn names for family members in Kikuyu', 'beginner', 'vocabulary', 25, 20, 3),
('Basic Grammar: Pronouns', 'Understanding personal pronouns in Kikuyu', 'intermediate', 'grammar', 30, 25, 4),
('Traditional Customs', 'Learn about important Kikuyu cultural practices', 'intermediate', 'culture', 35, 30, 5),
('Daily Conversations', 'Practice common daily conversations', 'intermediate', 'conversation', 40, 35, 6),
('Advanced Vocabulary', 'Expand your Kikuyu vocabulary with advanced words', 'advanced', 'vocabulary', 45, 40, 7),
('Complex Grammar Rules', 'Master complex grammatical structures', 'advanced', 'grammar', 50, 45, 8),
('Cultural History', 'Deep dive into Kikuyu history and traditions', 'advanced', 'culture', 55, 50, 9),
('Fluency Practice', 'Advanced conversation practice for fluency', 'advanced', 'conversation', 60, 55, 10)
ON CONFLICT DO NOTHING;
