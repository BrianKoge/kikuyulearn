// Lesson functionality for Kikuyulearn
console.log('Lesson.js loaded successfully!');

// Start lesson function
function startLesson(lessonId) {
    console.log('startLesson called with:', lessonId);
    showLessonModal(lessonId);
}

// Functions for Lessons page
function showCategoryLessons(category) {
    console.log('showCategoryLessons called with:', category);
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter lessons based on category
    const lessonCards = document.querySelectorAll('.lesson-card');
    lessonCards.forEach(card => {
        const cardCategory = card.dataset.category;
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update category title
    const categoryTitle = document.querySelector('.category-title');
    if (categoryTitle) {
        const categoryNames = {
            'all': 'All Lessons',
            'vocabulary': 'Vocabulary Lessons',
            'grammar': 'Grammar Lessons',
            'culture': 'Culture & Traditions',
            'conversation': 'Conversation Practice'
        };
        categoryTitle.textContent = categoryNames[category] || 'All Lessons';
    }
}

// Show lesson modal with content
function showLessonModal(lessonId) {
    // Get lesson data
    const lesson = getLessonData(lessonId);
    if (!lesson) {
        showErrorMessage('Lesson not found!');
        return;
    }
    
    // Create modal HTML
    const modalHTML = `
        <div id="lessonModal" class="modal" data-lesson-id="${lessonId}">
            <div class="modal-content lesson-modal" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <span class="close" onclick="closeModal('lessonModal')">&times;</span>
                
                <div class="lesson-header">
                    <div class="lesson-info">
                        <h2><i class="fas fa-graduation-cap"></i> ${lesson.title}</h2>
                        <p class="lesson-category">${lesson.category}</p>
                        <div class="lesson-meta">
                            <span><i class="fas fa-clock"></i> ${lesson.duration} min</span>
                            <span><i class="fas fa-star"></i> ${lesson.difficulty}</span>
                            <span><i class="fas fa-trophy"></i> ${lesson.points} points</span>
                        </div>
                    </div>
                    <div class="lesson-progress">
                        <div class="progress-circle">
                            <span class="progress-text">0%</span>
                        </div>
                        <p>Progress</p>
                    </div>
                </div>
                
                <div class="lesson-content">
                    <div class="lesson-section">
                        <h3><i class="fas fa-volume-up"></i> Pronunciation</h3>
                        <div class="pronunciation-card">
                            <div class="kikuyu-text">${lesson.kikuyu}</div>
                            <div class="english-text">${lesson.english}</div>
                            <button class="btn btn-primary" onclick="playAudio('${lesson.audio}')">
                                <i class="fas fa-play"></i> Listen
                            </button>
                        </div>
                    </div>
                    
                    <div class="lesson-section">
                        <h3><i class="fas fa-lightbulb"></i> Explanation</h3>
                        <p>${lesson.explanation}</p>
                    </div>
                    
                    <div class="lesson-section">
                        <h3><i class="fas fa-comments"></i> Practice</h3>
                        <div class="practice-exercises">
                            ${generatePracticeExercises(lesson)}
                        </div>
                    </div>
                    
                    <div class="lesson-section">
                        <h3><i class="fas fa-list"></i> Related Phrases</h3>
                        <div class="related-phrases">
                            ${generateRelatedPhrases(lesson)}
                        </div>
                    </div>
                </div>
                
                <div class="lesson-actions">
                    <button class="btn btn-outline" onclick="closeModal('lessonModal')">Close</button>
                    <button class="btn btn-primary" onclick="completeLesson('${lessonId}')">
                        <i class="fas fa-check"></i> Complete Lesson
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = document.getElementById('lessonModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Initialize lesson progress
    initializeLessonProgress(lessonId);
}

// Get lesson data
function getLessonData(lessonId) {
    const lessons = {
        'vocab-1': {
            id: 'vocab-1',
            title: 'Basic Greetings',
            category: 'vocabulary',
            difficulty: 'Beginner',
            duration: 5,
            points: 10,
            kikuyu: 'Wĩ mwega?',
            english: 'How are you?',
            audio: 'wĩ-mwega.mp3',
            explanation: 'This is the most common greeting in Kikuyu. "Wĩ" means "you are" and "mwega" means "good/well". It\'s used to ask someone how they are doing.',
            relatedPhrases: [
                { kikuyu: 'Nĩ mwega', english: 'I am fine' },
                { kikuyu: 'Ũrĩ mwega?', english: 'Are you well?' },
                { kikuyu: 'Ũkĩĩ?', english: 'How are you?' }
            ]
        },
        'vocab-2': {
            id: 'vocab-2',
            title: 'Family Members',
            category: 'vocabulary',
            difficulty: 'Beginner',
            duration: 8,
            points: 15,
            kikuyu: 'Mũtumia',
            english: 'Wife/Woman',
            audio: 'mutumia.mp3',
            explanation: 'In Kikuyu culture, family is very important. "Mũtumia" refers to a married woman or wife. The word is also used to refer to women in general.',
            relatedPhrases: [
                { kikuyu: 'Mũthuuri', english: 'Husband/Man' },
                { kikuyu: 'Mwana', english: 'Child' },
                { kikuyu: 'Mũtumia wa nyũmba', english: 'Housewife' }
            ]
        },
        'vocab-3': {
            id: 'vocab-3',
            title: 'Numbers & Counting',
            category: 'vocabulary',
            difficulty: 'Beginner',
            duration: 10,
            points: 12,
            kikuyu: 'Ĩmwe, Igĩrĩ, Ithatũ, Inya, Ithano',
            english: 'One, Two, Three, Four, Five',
            audio: 'numbers-1-5.mp3',
            explanation: 'Numbers in Kikuyu follow a specific pattern. Learning numbers is essential for daily communication, especially when shopping or discussing quantities.',
            relatedPhrases: [
                { kikuyu: 'Ithathatũ', english: 'Six' },
                { kikuyu: 'Mũgwanja', english: 'Seven' },
                { kikuyu: 'Inyanya', english: 'Eight' }
            ]
        },
        'vocab-4': {
            id: 'vocab-4',
            title: 'Colors & Descriptions',
            category: 'vocabulary',
            difficulty: 'Beginner',
            duration: 7,
            points: 15,
            kikuyu: 'Njerũ, Njiru, Njegũ',
            english: 'White, Black, Red',
            audio: 'colors.mp3',
            explanation: 'Colors in Kikuyu are used not just for describing objects, but also have cultural significance. Each color can represent different emotions or states.',
            relatedPhrases: [
                { kikuyu: 'Njũgũna', english: 'Green' },
                { kikuyu: 'Njũgũ', english: 'Blue' },
                { kikuyu: 'Njũgũnyũ', english: 'Yellow' }
            ]
        },
        'grammar-1': {
            id: 'grammar-1',
            title: 'Basic Sentence Structure',
            category: 'grammar',
            difficulty: 'Intermediate',
            duration: 12,
            points: 20,
            kikuyu: 'Nĩ mũndũ mũũru',
            english: 'I am a good person',
            audio: 'sentence-structure.mp3',
            explanation: 'Kikuyu sentence structure follows a Subject-Verb-Object pattern. "Nĩ" is a copula (linking verb) meaning "is/am/are".',
            relatedPhrases: [
                { kikuyu: 'Nĩ mũtumia', english: 'I am a woman' },
                { kikuyu: 'Nĩ mũthuuri', english: 'I am a man' },
                { kikuyu: 'Nĩ mwana', english: 'I am a child' }
            ]
        },
        'grammar-2': {
            id: 'grammar-2',
            title: 'Verb Conjugation',
            category: 'grammar',
            difficulty: 'Advanced',
            duration: 15,
            points: 25,
            kikuyu: 'Nĩkũrĩa ndũũ',
            english: 'I am eating food',
            audio: 'verb-conjugation.mp3',
            explanation: 'Kikuyu verbs change form based on tense, person, and number. The prefix "Nĩ-" indicates present tense for first person singular.',
            relatedPhrases: [
                { kikuyu: 'Ũrĩkũrĩa', english: 'You are eating' },
                { kikuyu: 'Arĩkũrĩa', english: 'He/She is eating' },
                { kikuyu: 'Tũrĩkũrĩa', english: 'We are eating' }
            ]
        },
        'culture-1': {
            id: 'culture-1',
            title: 'Traditional Ceremonies',
            category: 'culture',
            difficulty: 'Advanced',
            duration: 12,
            points: 25,
            kikuyu: 'Irua',
            english: 'Circumcision Ceremony',
            audio: 'irua.mp3',
            explanation: 'Irua is one of the most important traditional ceremonies in Kikuyu culture. It marks the transition from childhood to adulthood and is a rite of passage.',
            relatedPhrases: [
                { kikuyu: 'Kĩama', english: 'Council of elders' },
                { kikuyu: 'Mũgumo', english: 'Sacred fig tree' },
                { kikuyu: 'Gĩkũyũ', english: 'Kikuyu person' }
            ]
        },
        'culture-2': {
            id: 'culture-2',
            title: 'Elders & Respect',
            category: 'culture',
            difficulty: 'Intermediate',
            duration: 10,
            points: 18,
            kikuyu: 'Mũkũrũ',
            english: 'Elder/Respected person',
            audio: 'elders-respect.mp3',
            explanation: 'Respect for elders is fundamental in Kikuyu culture. Elders are seen as repositories of wisdom and tradition.',
            relatedPhrases: [
                { kikuyu: 'Mũkũrũ wa nyũmba', english: 'Family elder' },
                { kikuyu: 'Mũkũrũ wa kĩama', english: 'Council elder' },
                { kikuyu: 'Ũtũũro', english: 'Respect' }
            ]
        },
        'conv-1': {
            id: 'conv-1',
            title: 'Daily Conversations',
            category: 'conversation',
            difficulty: 'Intermediate',
            duration: 15,
            points: 22,
            kikuyu: 'Ũkũĩ? Nĩ mwega',
            english: 'How are you? I am fine',
            audio: 'daily-conversation.mp3',
            explanation: 'Daily conversations in Kikuyu often begin with greetings and inquiries about well-being. This shows care and respect for others.',
            relatedPhrases: [
                { kikuyu: 'Ũkaa?', english: 'Where are you going?' },
                { kikuyu: 'Nĩkaa kũrĩa', english: 'I am going to eat' },
                { kikuyu: 'Ũũka rĩngĩ', english: 'Come again' }
            ]
        },
        'conv-2': {
            id: 'conv-2',
            title: 'Market Conversations',
            category: 'conversation',
            difficulty: 'Advanced',
            duration: 18,
            points: 28,
            kikuyu: 'Nĩ kĩĩ gĩu?',
            english: 'How much is this?',
            audio: 'market-conversation.mp3',
            explanation: 'Market conversations involve negotiation and bargaining. Learning these phrases helps in daily commerce and trade.',
            relatedPhrases: [
                { kikuyu: 'Nĩ gĩa kũũ', english: 'It is expensive' },
                { kikuyu: 'Ũngĩheria', english: 'Can you reduce the price?' },
                { kikuyu: 'Nĩ mwega', english: 'It is good' }
            ]
        }
    };
    
    return lessons[lessonId];
}

// Generate practice exercises
function generatePracticeExercises(lesson) {
    return `
        <div class="exercise-card">
            <h4>Translate to Kikuyu</h4>
            <p>Translate: "${lesson.english}"</p>
            <input type="text" class="exercise-input" placeholder="Type your answer...">
            <button class="btn btn-primary" onclick="checkAnswer(this, '${lesson.kikuyu}')">
                Check Answer
            </button>
            <div class="feedback" style="display: none;"></div>
        </div>
        
        <div class="exercise-card">
            <h4>Listen and Repeat</h4>
            <p>Listen to the pronunciation and practice saying it aloud.</p>
            <button class="btn btn-outline" onclick="playAudio('${lesson.audio}')">
                <i class="fas fa-play"></i> Listen Again
            </button>
            <div class="recording-section">
                <button class="btn btn-primary" onclick="startRecording()">
                    <i class="fas fa-microphone"></i> Record
                </button>
                <button class="btn btn-outline" onclick="stopRecording()" style="display: none;">
                    <i class="fas fa-stop"></i> Stop
                </button>
            </div>
        </div>
    `;
}

// Generate related phrases
function generateRelatedPhrases(lesson) {
    return lesson.relatedPhrases.map(phrase => `
        <div class="phrase-card">
            <div class="phrase-kikuyu">${phrase.kikuyu}</div>
            <div class="phrase-english">${phrase.english}</div>
            <button class="btn btn-sm btn-outline" onclick="playAudio('${phrase.kikuyu.toLowerCase().replace(/\s+/g, '-')}.mp3')">
                <i class="fas fa-play"></i>
            </button>
        </div>
    `).join('');
}

// Check exercise answer
function checkAnswer(button, correctAnswer) {
    const input = button.previousElementSibling;
    const feedback = button.nextElementSibling;
    const userAnswer = input.value.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();
    
    if (userAnswer === correct) {
        feedback.innerHTML = '<i class="fas fa-check-circle"></i> Correct! Well done!';
        feedback.className = 'feedback correct';
        feedback.style.display = 'block';
        updateLessonProgress(10);
    } else {
        feedback.innerHTML = `<i class="fas fa-times-circle"></i> Try again. Hint: "${correctAnswer}"`;
        feedback.className = 'feedback incorrect';
        feedback.style.display = 'block';
    }
}

// Play audio (simulated)
function playAudio(audioFile) {
    console.log('Playing audio:', audioFile);
    // In a real app, this would play actual audio files
    showSuccessMessage('Audio playing... (simulated)');
}

// Start recording (simulated)
function startRecording() {
    console.log('Recording started');
    document.querySelector('.recording-section .btn-primary').style.display = 'none';
    document.querySelector('.recording-section .btn-outline').style.display = 'inline-flex';
    showSuccessMessage('Recording started... (simulated)');
}

// Stop recording (simulated)
function stopRecording() {
    console.log('Recording stopped');
    document.querySelector('.recording-section .btn-primary').style.display = 'inline-flex';
    document.querySelector('.recording-section .btn-outline').style.display = 'none';
    showSuccessMessage('Recording saved! (simulated)');
}

// Initialize lesson progress
function initializeLessonProgress(lessonId) {
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        // Get progress from localStorage or default to 0
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        progressText.textContent = `${progress}%`;
        
        // Update progress circle
        const progressCircle = document.querySelector('.progress-circle');
        if (progressCircle) {
            progressCircle.style.background = `conic-gradient(var(--primary-orange) ${progress * 3.6}deg, #e9ecef 0deg)`;
        }
    }
}

// Update lesson progress
async function updateLessonProgress(points) {
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        let currentProgress = parseInt(progressText.textContent) || 0;
        currentProgress = Math.min(100, currentProgress + points);
        progressText.textContent = `${currentProgress}%`;
        
        // Update progress circle
        const progressCircle = document.querySelector('.progress-circle');
        if (progressCircle) {
            progressCircle.style.background = `conic-gradient(var(--primary-orange) ${currentProgress * 3.6}deg, #e9ecef 0deg)`;
        }
        
        // Save to localStorage - get lesson ID from the modal
        const lessonModal = document.querySelector('#lessonModal');
        if (lessonModal) {
            const lessonId = lessonModal.dataset.lessonId;
            if (lessonId) {
                localStorage.setItem(`lesson-${lessonId}-progress`, currentProgress);
                
                // Auto-save to Supabase only for authenticated users with proper UUIDs
                if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_') && typeof UserProgressManager !== 'undefined') {
                    try {
                        const lesson = getLessonData(lessonId);
                        await UserProgressManager.saveUserProgress(
                            window.currentUser.id,
                            lessonId,
                            currentProgress,
                            lesson ? lesson.points : 0
                        );
                        console.log('Progress auto-saved to Supabase:', currentProgress);
                        
                        // Trigger immediate sync after progress update
                        setTimeout(async () => {
                            try {
                                await syncWithSupabase(false); // Don't show messages for auto-sync
                                console.log('Auto-sync after progress update completed');
                            } catch (error) {
                                console.error('Auto-sync after progress update failed:', error);
                            }
                        }, 2000); // Wait 2 seconds before syncing
                    } catch (error) {
                        console.error('Failed to auto-save progress to Supabase:', error);
                    }
                } else {
                    console.log('Skipping Supabase auto-save for demo user or unauthenticated user');
                }
            }
        }
    }
}

// Complete lesson
async function completeLesson(lessonId) {
    const submitButton = event.target;
    const originalText = showLoading(submitButton);
    
    try {
        // Update user progress
        const lesson = getLessonData(lessonId);
        if (lesson) {
            // Initialize currentUser if it doesn't exist (for demo purposes)
            if (!window.currentUser) {
                window.currentUser = {
                    id: 'demo_user_' + Date.now(),
                    email: 'demo@kikuyulearn.com',
                    full_name: 'Demo User',
                    points: 0,
                    completedLessons: []
                };
            }
            
            // Add points to user
            if (!window.currentUser.points) window.currentUser.points = 0;
            window.currentUser.points += lesson.points;
            
            // Mark lesson as completed
            if (!window.currentUser.completedLessons) window.currentUser.completedLessons = [];
            if (!window.currentUser.completedLessons.includes(lessonId)) {
                window.currentUser.completedLessons.push(lessonId);
            }
            
            // Save to localStorage immediately
            localStorage.setItem('userProgress', JSON.stringify({
                points: window.currentUser.points,
                completedLessons: window.currentUser.completedLessons
            }));
            
            // Mark lesson as 100% complete in localStorage
            localStorage.setItem(`lesson-${lessonId}-progress`, '100');
            
            // Save to Supabase only for authenticated users with proper UUIDs
            if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_') && typeof UserProgressManager !== 'undefined') {
                try {
                    // Save lesson progress to Supabase
                    await UserProgressManager.saveUserProgress(
                        window.currentUser.id, 
                        lessonId, 
                        100, // 100% complete
                        lesson.points
                    );

                    // Update user points in profiles table
                    await UserProgressManager.updateUserPoints(window.currentUser.id, window.currentUser.points);
                    
                    console.log('Progress saved to Supabase successfully');
                } catch (error) {
                    console.error('Failed to save to Supabase:', error);
                    // Continue with local storage as fallback
                }
            } else {
                console.log('Skipping Supabase save for demo user or unauthenticated user');
            }
        }
        
        showSuccessMessage(`Lesson completed! +${lesson.points} points earned!`);
        closeModal('lessonModal');
        
        // Update lesson cards to show completion status
        updateLessonCards();
        
        // Force update streak when lesson is completed
        updateStreakOnLessonCompletion();
        
        // Update user progress stats
        updateUserProgressStats();
        
        // Auto-sync immediately after lesson completion
        if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_')) {
            setTimeout(async () => {
                try {
                    console.log('Auto-syncing after lesson completion...');
                    await syncWithSupabase(false); // Don't show messages for auto-sync
                    console.log('Auto-sync after lesson completion completed');
                } catch (error) {
                    console.error('Auto-sync after lesson completion failed:', error);
                }
            }, 1000); // Wait 1 second before syncing
        }
        
    } catch (error) {
        showErrorMessage('Failed to complete lesson: ' + error.message);
    } finally {
        hideLoading(submitButton, originalText);
    }
}

// Update lesson cards to show completion status
function updateLessonCards() {
    const lessonCards = document.querySelectorAll('.lesson-card');
    lessonCards.forEach(card => {
        const lessonId = card.dataset.lessonId;
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        
        // Update status indicator
        const statusIndicator = card.querySelector('.lesson-status');
        if (statusIndicator) {
            if (progress >= 100) {
                statusIndicator.textContent = 'Completed';
                statusIndicator.className = 'lesson-status completed';
                const button = card.querySelector('button');
                if (button) {
                    button.className = 'btn btn-outline';
                    button.disabled = true;
                    button.textContent = 'Completed';
                }
            } else if (progress > 0) {
                statusIndicator.textContent = 'In Progress';
                statusIndicator.className = 'lesson-status available';
                const button = card.querySelector('button');
                if (button) {
                    button.className = 'btn btn-primary';
                    button.disabled = false;
                    button.textContent = 'Continue';
                }
            } else {
                // Check if lesson should be locked
                const shouldBeLocked = shouldLessonBeLocked(lessonId);
                if (shouldBeLocked) {
                    statusIndicator.textContent = 'Locked';
                    statusIndicator.className = 'lesson-status locked';
                    const button = card.querySelector('button');
                    if (button) {
                        button.className = 'btn btn-outline';
                        button.disabled = true;
                        button.textContent = 'Complete Previous';
                    }
                } else {
                    statusIndicator.textContent = 'Available';
                    statusIndicator.className = 'lesson-status available';
                    const button = card.querySelector('button');
                    if (button) {
                        button.className = 'btn btn-primary';
                        button.disabled = false;
                        button.textContent = 'Start Lesson';
                    }
                }
            }
        }
    });
}

// Check if a lesson should be locked based on prerequisites
function shouldLessonBeLocked(lessonId) {
    // Define category groups - first lesson in each category should be available
    const categoryGroups = {
        'vocabulary': ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4'],
        'grammar': ['grammar-1', 'grammar-2'],
        'culture': ['culture-1', 'culture-2'],
        'conversation': ['conv-1', 'conv-2']
    };
    
    // Find which category this lesson belongs to
    let lessonCategory = null;
    for (const [category, lessons] of Object.entries(categoryGroups)) {
        if (lessons.includes(lessonId)) {
            lessonCategory = category;
            break;
        }
    }
    
    if (!lessonCategory) return false;
    
    const categoryLessons = categoryGroups[lessonCategory];
    const currentIndex = categoryLessons.indexOf(lessonId);
    
    // First lesson in category is always available
    if (currentIndex === 0) return false;
    
    // Check if previous lesson in the same category is completed
    const previousLessonId = categoryLessons[currentIndex - 1];
    const previousProgress = localStorage.getItem(`lesson-${previousLessonId}-progress`) || 0;
    
    return previousProgress < 100;
}

// Initialize lessons page
async function initializeLessonsPage() {
    // Check if we're on the lessons page
    if (window.location.pathname.includes('Lessons.html')) {
        console.log('Initializing lessons page...');
        
        // Load user progress from Supabase/localStorage
        await loadUserProgress();
        
        // Force sync with Supabase to ensure we have the latest data
        await syncWithSupabase();
        
        // Update lesson cards with progress
        updateLessonCards();
        
        // Update user progress stats
        updateUserProgressStats();
        
        // Force multiple refreshes to ensure data is properly synced
        setTimeout(() => {
            updateUserProgressStats();
            updateLessonCards();
        }, 100);
        
        setTimeout(() => {
            updateUserProgressStats();
            updateLessonCards();
        }, 500);
        
        setTimeout(() => {
            updateUserProgressStats();
            updateLessonCards();
        }, 1000);
        
        // Set up automatic syncing every 30 seconds
        setupAutoSync();
        
        console.log('Lessons page initialized successfully');
    }
}

// Update user progress statistics
function updateUserProgressStats() {
    // Ensure we have the latest progress data from localStorage
    const savedProgress = localStorage.getItem('userProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        if (window.currentUser) {
            window.currentUser.points = progress.points || 0;
            window.currentUser.completedLessons = progress.completedLessons || [];
        }
    }
    
    // Count actual completed lessons from localStorage
    let completedLessons = 0;
    const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
    
    lessonIds.forEach(lessonId => {
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        if (parseInt(progress) >= 100) {
            completedLessons++;
        }
    });
    
    const totalLessons = lessonIds.length;
    const overallProgress = Math.round((completedLessons / totalLessons) * 100);
    
    // Get points from currentUser or localStorage - prioritize currentUser.points
    let userPoints = 0;
    if (window.currentUser && window.currentUser.points !== undefined && window.currentUser.points !== null) {
        userPoints = window.currentUser.points;
    } else if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        userPoints = progress.points || 0;
    }
    
    // If still 0, calculate points from completed lessons
    if (userPoints === 0) {
        const lessonData = {
            'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
            'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
            'conv-1': 22, 'conv-2': 28
        };
        
        lessonIds.forEach(lessonId => {
            const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
            if (parseInt(progress) >= 100) {
                userPoints += lessonData[lessonId] || 0;
            }
        });
        
        // Update currentUser points if it was 0
        if (window.currentUser && (!window.currentUser.points || window.currentUser.points === 0)) {
            window.currentUser.points = userPoints;
            // Save updated points to localStorage
            localStorage.setItem('userProgress', JSON.stringify({
                points: window.currentUser.points,
                completedLessons: window.currentUser.completedLessons || []
            }));
        }
    }
    
    console.log('Updating progress stats:', {
        completedLessons,
        overallProgress,
        userPoints,
        currentUser: window.currentUser,
        savedProgress: savedProgress ? JSON.parse(savedProgress) : null
    });
    
    // Update stats display
    const statsElements = document.querySelectorAll('.stat-number');
    if (statsElements.length >= 4) {
        statsElements[0].textContent = completedLessons; // Lessons Completed
        statsElements[1].textContent = `${overallProgress}%`; // Overall Progress
        statsElements[2].textContent = userPoints; // Points Earned
        statsElements[3].textContent = getCurrentStreak(); // Day Streak
    }
    
    // Update streak counter
    const streakNumber = document.querySelector('.streak-number');
    if (streakNumber) {
        streakNumber.textContent = getCurrentStreak();
    }
    
    // Update category progress displays
    updateCategoryProgress();
}

// Update category-specific progress
function updateCategoryProgress() {
    const categories = {
        'vocabulary': ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4'],
        'grammar': ['grammar-1', 'grammar-2'],
        'culture': ['culture-1', 'culture-2'],
        'conversation': ['conv-1', 'conv-2']
    };
    
    Object.keys(categories).forEach(category => {
        const lessonIds = categories[category];
        let completedInCategory = 0;
        
        lessonIds.forEach(lessonId => {
            const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
            if (parseInt(progress) >= 100) {
                completedInCategory++;
            }
        });
        
        // Calculate percentage for progress bar
        const percentage = Math.round((completedInCategory / lessonIds.length) * 100);
        
        // Update category progress display if it exists
        const categoryCards = document.querySelectorAll(`[data-category="${category}"]`);
        categoryCards.forEach(card => {
            const progressElement = card.querySelector('.category-progress');
            const progressFill = card.querySelector('.progress-fill');
            
            if (progressElement) {
                progressElement.textContent = `${completedInCategory}/${lessonIds.length} lessons completed`;
            }
            
            if (progressFill) {
                progressFill.style.width = `${percentage}%`;
            }
        });
    });
}

// Get current learning streak
function getCurrentStreak() {
    const lastLogin = localStorage.getItem('lastLoginDate');
    const today = new Date().toDateString();
    const currentStreak = parseInt(localStorage.getItem('currentStreak') || '0');
    
    if (!lastLogin) {
        // First time user - start with 1 streak if they have completed lessons
        const hasCompletedLessons = checkIfUserHasCompletedLessons();
        const initialStreak = hasCompletedLessons ? 1 : 0;
        localStorage.setItem('currentStreak', initialStreak.toString());
        localStorage.setItem('lastLoginDate', today);
        return initialStreak;
    }
    
    if (lastLogin === today) {
        // Same day - return current streak
        return currentStreak;
    } else if (lastLogin === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
        // Yesterday - increment streak if user has completed lessons
        const hasCompletedLessons = checkIfUserHasCompletedLessons();
        const newStreak = hasCompletedLessons ? currentStreak + 1 : currentStreak;
        localStorage.setItem('currentStreak', newStreak.toString());
        localStorage.setItem('lastLoginDate', today);
        return newStreak;
    } else {
        // More than 1 day ago - reset streak but check if user has completed lessons today
        const hasCompletedLessons = checkIfUserHasCompletedLessons();
        const newStreak = hasCompletedLessons ? 1 : 0;
        localStorage.setItem('currentStreak', newStreak.toString());
        localStorage.setItem('lastLoginDate', today);
        return newStreak;
    }
}

// Helper function to check if user has completed any lessons
function checkIfUserHasCompletedLessons() {
    const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
    
    for (const lessonId of lessonIds) {
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`) || 0;
        if (parseInt(progress) >= 100) {
            return true;
        }
    }
    return false;
}

// Update streak when lesson is completed
function updateStreakOnLessonCompletion() {
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('lastLoginDate');
    const currentStreak = parseInt(localStorage.getItem('currentStreak') || '0');
    
    if (!lastLogin || lastLogin !== today) {
        // First time today or new day - start/increment streak
        const newStreak = lastLogin === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString() ? currentStreak + 1 : 1;
        localStorage.setItem('currentStreak', newStreak.toString());
        localStorage.setItem('lastLoginDate', today);
        console.log('Streak updated to:', newStreak);
    } else {
        // Same day - keep current streak
        console.log('Streak maintained at:', currentStreak);
    }
}

// Load user progress from Supabase and localStorage
async function loadUserProgress() {
    try {
        // First, try to get authenticated user from Supabase if not already loaded
        if (!window.currentUser || window.currentUser.id.startsWith('demo_user_')) {
            try {
                if (typeof initializeSupabase === 'function') {
                    const supabaseClient = initializeSupabase();
                    if (supabaseClient) {
                        const { data: { user }, error } = await supabaseClient.auth.getUser();
                        if (user && !error) {
                            window.currentUser = {
                                id: user.id,
                                email: user.email,
                                full_name: user.user_metadata?.full_name || user.email,
                                points: 0,
                                completedLessons: []
                            };
                            console.log('Authenticated user loaded:', window.currentUser);
                        }
                    }
                }
            } catch (authError) {
                console.log('No authenticated user found, using demo mode');
            }
        }
        
        // Try to load from Supabase first (only for authenticated users with valid UUIDs)
        if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_') && typeof UserProgressManager !== 'undefined') {
            try {
                // Get user progress from Supabase
                const supabaseProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
                const userProfile = await UserProgressManager.getUserProfile(window.currentUser.id);
                
                if (supabaseProgress && userProfile) {
                    // Update currentUser with Supabase data
                    window.currentUser.points = userProfile.points || 0;
                    window.currentUser.completedLessons = supabaseProgress
                        .filter(p => p.progress_percentage >= 100)
                        .map(p => p.lesson_id);
                    
                    // Update localStorage with Supabase data
                    localStorage.setItem('userProgress', JSON.stringify({
                        points: window.currentUser.points,
                        completedLessons: window.currentUser.completedLessons
                    }));
                    
                    // Update individual lesson progress
                    supabaseProgress.forEach(progress => {
                        localStorage.setItem(`lesson-${progress.lesson_id}-progress`, progress.progress_percentage.toString());
                    });
                    
                    console.log('Loaded user progress from Supabase:', window.currentUser);
                    return;
                }
            } catch (error) {
                console.error('Failed to load from Supabase:', error);
            }
        }
        
        // Fallback to localStorage
        const savedProgress = localStorage.getItem('userProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            
            // Initialize currentUser if it doesn't exist (only for demo mode)
            if (!window.currentUser) {
                window.currentUser = {
                    id: 'demo_user_' + Date.now(),
                    email: 'demo@kikuyulearn.com',
                    full_name: 'Demo User',
                    points: 0,
                    completedLessons: []
                };
            }
            
            // Update user data with saved progress
            window.currentUser.points = progress.points || 0;
            window.currentUser.completedLessons = progress.completedLessons || [];
            
            console.log('Loaded user progress from localStorage:', window.currentUser);
        } else {
            // Initialize with default values if no progress exists (only for demo mode)
            if (!window.currentUser) {
                window.currentUser = {
                    id: 'demo_user_' + Date.now(),
                    email: 'demo@kikuyulearn.com',
                    full_name: 'Demo User',
                    points: 0,
                    completedLessons: []
                };
            }
            
            // Save default progress to localStorage
            localStorage.setItem('userProgress', JSON.stringify({
                points: window.currentUser.points,
                completedLessons: window.currentUser.completedLessons
            }));
            
            console.log('Initialized default user progress:', window.currentUser);
        }
    } catch (error) {
        console.error('Error loading user progress:', error);
    }
}

// Sync localStorage with Supabase data
async function syncWithSupabase(showMessages = true) {
    try {
        // Only sync with Supabase for authenticated users with valid UUIDs
        if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_') && typeof UserProgressManager !== 'undefined') {
            // Get latest data from Supabase
            const supabaseProgress = await UserProgressManager.getUserProgress(window.currentUser.id);
            const userProfile = await UserProgressManager.getUserProfile(window.currentUser.id);
            
            if (supabaseProgress && userProfile) {
                // Update localStorage with Supabase data
                window.currentUser.points = userProfile.points || 0;
                window.currentUser.completedLessons = supabaseProgress
                    .filter(p => p.progress_percentage >= 100)
                    .map(p => p.lesson_id);
                
                localStorage.setItem('userProgress', JSON.stringify({
                    points: window.currentUser.points,
                    completedLessons: window.currentUser.completedLessons
                }));
                
                // Update individual lesson progress
                supabaseProgress.forEach(progress => {
                    localStorage.setItem(`lesson-${progress.lesson_id}-progress`, progress.progress_percentage.toString());
                });
                
                console.log('Synced with Supabase successfully');
                
                // Update the display
                updateUserProgressStats();
                updateLessonCards();
                
                // Show success message only if requested
                if (showMessages && typeof showSuccessMessage === 'function') {
                    showSuccessMessage('Progress synced successfully!');
                }
                
                return true;
            } else {
                if (showMessages && typeof showErrorMessage === 'function') {
                    showErrorMessage('No data found to sync');
                }
                return false;
            }
        } else {
            // For demo users or unauthenticated users, just update the display from localStorage
            console.log('Skipping Supabase sync for demo/unauthenticated user');
            updateUserProgressStats();
            updateLessonCards();
            return true;
        }
    } catch (error) {
        console.error('Error syncing with Supabase:', error);
        if (showMessages && typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to sync progress: ' + error.message);
        }
        return false;
    }
}

// Debug function to check current progress
function debugProgress() {
    console.log('=== DEBUG PROGRESS ===');
    console.log('Current User:', window.currentUser);
    console.log('LocalStorage userProgress:', localStorage.getItem('userProgress'));
    console.log('Individual lesson progress:');
    const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
    lessonIds.forEach(lessonId => {
        const progress = localStorage.getItem(`lesson-${lessonId}-progress`);
        console.log(`${lessonId}: ${progress || 0}%`);
    });
    
    // Check Supabase data if available (only for authenticated users)
    if (typeof UserProgressManager !== 'undefined' && window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_')) {
        UserProgressManager.getUserProfile(window.currentUser.id).then(profile => {
            console.log('Supabase Profile:', profile);
        }).catch(err => {
            console.log('Supabase Profile Error:', err);
        });
        
        UserProgressManager.getUserProgress(window.currentUser.id).then(progress => {
            console.log('Supabase Progress:', progress);
        }).catch(err => {
            console.log('Supabase Progress Error:', err);
        });
    }
    console.log('=====================');
}

// Set up automatic syncing
function setupAutoSync() {
    // Clear any existing auto-sync intervals
    if (window.autoSyncInterval) {
        clearInterval(window.autoSyncInterval);
    }
    
    // Set up automatic syncing every 30 seconds
    window.autoSyncInterval = setInterval(async () => {
        if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_')) {
            try {
                console.log('Auto-syncing progress...');
                await syncWithSupabase(false); // Don't show messages for auto-sync
                console.log('Auto-sync completed successfully');
            } catch (error) {
                console.error('Auto-sync failed:', error);
            }
        }
    }, 30000); // 30 seconds
    
    console.log('Auto-sync set up every 30 seconds');
}

// Stop automatic syncing
function stopAutoSync() {
    if (window.autoSyncInterval) {
        clearInterval(window.autoSyncInterval);
        window.autoSyncInterval = null;
        console.log('Auto-sync stopped');
    }
}

// Make lesson functions globally accessible
window.showCategoryLessons = showCategoryLessons;
window.startLesson = startLesson;
window.checkAnswer = checkAnswer;
window.playAudio = playAudio;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.completeLesson = completeLesson;
window.initializeLessonsPage = initializeLessonsPage;
window.syncWithSupabase = syncWithSupabase;
window.debugProgress = debugProgress;

// Initialize lessons page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Lesson.js: DOM Content Loaded');
    initializeLessonsPage();
});

// Auto-sync when user leaves the page
window.addEventListener('beforeunload', async function() {
    if (window.currentUser && window.currentUser.id && !window.currentUser.id.startsWith('demo_user_')) {
        try {
            console.log('Auto-syncing before page unload...');
            await syncWithSupabase(false); // Don't show messages for auto-sync
            console.log('Auto-sync before page unload completed');
        } catch (error) {
            console.error('Auto-sync before page unload failed:', error);
        }
    }
    
    // Stop auto-sync interval
    stopAutoSync();
});
