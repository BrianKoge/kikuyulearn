// Lesson functionality for Kikuyulearn
console.log('Lesson.js loaded successfully!');

// Audio file mapping for lessons - base paths
const audioFileBasePaths = {
    // Basic greetings and common phrases
    'wĩ-mwega': 'wi_mwega.mp3',
    'ũrĩ-mwega': 'uri_mwega.mp3',
    'nĩ-mwega': 'ni_mwega.mp3',
    'ũkĩĩ': 'ukii.mp3',
    
    // Family members
    'mũtumia': 'mutumia.mp3',
    'mũthuuri': 'muthuuri.mp3',
    'mwana': 'mwana.mp3',
    'mũtumia-wa-nyũmba': 'mutumia_wa_nyumba.mp3',
    'mũthuuri-wa-nyũmba': 'muthuuri_wa_nyumba.mp3',
    
    // Numbers and counting
    'ĩmwe-igĩrĩ-ĩthatũ-inya-ĩthano': 'imwe__igiri__ithatu__inya_ithano.mp3',
    'ĩthathatũ': 'ithathatu.mp3',
    'mũgwanja': 'mugwanja.mp3',
    'inyanya': 'inyanya.mp3',
    
    // Colors
    'njerũ-njiru-njegũ': 'njeru,_njiru,_njegu.mp3',
    'njũgũna': 'njuguna.mp3',
    'njũgũ': 'njugu.mp3',
    'njũgũnyũ': 'njugunyu.mp3',
    
    // Grammar and sentence structure
    'nĩ-mũndũ-mũũru': 'ni_mundu_muuru.mp3',
    'nĩ-mũtumia': 'ni_mutumia.mp3',
    'nĩ-mũthuuri': 'ni_muthuuri.mp3',
    'nĩ-mwana': 'ni_mwana.mp3',
    
    // Verbs and actions
    'nĩkũrĩa': 'arikuria.mp3',
    'ũrĩkũrĩa': 'urikuria.mp3',
    'arĩkũrĩa': 'arikuria.mp3',
    'tũrĩkũrĩa': 'turikuria.mp3',
    
    // Culture and traditions
    'irua': 'irua.mp3',
    'kĩama': 'kiama.mp3',
    'mũgumo': 'mugumo.mp3',
    'gĩkũyũ': 'gikuyu.mp3',
    
    // Respect and elders
    'mũkũrũ': 'mukuru.mp3',
    'mũkũrũ-wa-nyũmba': 'mukuru_wa_nyumba.mp3',
    'mũkũrũ-wa-kĩama': 'mukuru_wa_kiama.mp3',
    'ũtũũro': 'utuuro.mp3',
    
    // Daily conversations
    'ũkaa': 'ukaa.mp3',
    'nĩkaa-kũrĩa': 'nikaa_kuria.mp3',
    'ũũka-rĩngĩ': 'uuka_ringi.mp3',
    
    // Market and commerce
    'nĩ-kĩĩ-gĩu': 'ni_kii_giu.mp3',
    'nĩ-gĩa-kũũ': 'ni_gia_kuu.mp3',
    'ũngĩheria': 'ungiheria.mp3'
};

// Function to get the correct audio path based on current page location
function getAudioPath(audioKey) {
    if (!audioFileBasePaths[audioKey]) {
        console.error('Audio key not found:', audioKey);
        return null;
    }
    
    const basePath = audioFileBasePaths[audioKey];
    const currentPath = window.location.pathname;
    
    console.log('=== PATH DEBUG ===');
    console.log('Current pathname:', currentPath);
    console.log('Base path:', basePath);
    
    // Check for various path patterns that indicate we're in a subdirectory
    if (currentPath.includes('/html/') || 
        currentPath.includes('/Html/') || 
        currentPath.includes('/lessons') ||
        currentPath.includes('/lesson')) {
        console.log('Detected subdirectory, using ../assets/');
        return `../assets/${basePath}`;
    }
    // If we're at the root level, use assets directly
    else {
        console.log('Detected root level, using assets/');
        return `assets/${basePath}`;
    }
}

// Audio files object that dynamically resolves paths
const audioFiles = new Proxy({}, {
    get: function(target, prop) {
        if (prop in audioFileBasePaths) {
            return getAudioPath(prop);
        }
        return undefined;
    }
});

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
                        <div class="audio-main-controls">
                            <button class="btn btn-primary audio-btn" id="main-audio-btn" onclick="playLessonAudio('${lesson.audioKey}')">
                                <i class="fas fa-play"></i> Listen
                            </button>
                            <button class="btn btn-outline stop-audio-btn" id="stop-audio-btn" onclick="stopCurrentAudio()" style="display: none;">
                                <i class="fas fa-stop"></i> Stop
                            </button>
                        </div>
                        <div class="audio-controls">
                            <button class="btn btn-sm btn-outline" onclick="playAudioSlow('${lesson.audioKey}')">
                                <i class="fas fa-slow-motion"></i> Slow
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="repeatAudio('${lesson.audioKey}')">
                                <i class="fas fa-redo"></i> Repeat
                            </button>
                        </div>
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

// Get lesson data with updated audio keys
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
            audioKey: 'wĩ-mwega',
            explanation: 'This is the most common greeting in Kikuyu. "Wĩ" means "you are" and "mwega" means "good/well". It\'s used to ask someone how they are doing.',
            relatedPhrases: [
                { kikuyu: 'Nĩ mwega', english: 'I am fine', audioKey: 'nĩ-mwega' },
                { kikuyu: 'Ũrĩ mwega?', english: 'Are you well?', audioKey: 'ũrĩ-mwega' },
                { kikuyu: 'Ũkĩĩ?', english: 'How are you?', audioKey: 'ũkĩĩ' }
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
            audioKey: 'mũtumia',
            explanation: 'In Kikuyu culture, family is very important. "Mũtumia" refers to a married woman or wife. The word is also used to refer to women in general.',
            relatedPhrases: [
                { kikuyu: 'Mũthuuri', english: 'Husband/Man', audioKey: 'mũthuuri' },
                { kikuyu: 'Mwana', english: 'Child', audioKey: 'mwana' },
                { kikuyu: 'Mũtumia wa nyũmba', english: 'Housewife', audioKey: 'mũtumia-wa-nyũmba' }
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
            audioKey: 'ĩmwe-igĩrĩ-ĩthatũ-inya-ĩthano',
            explanation: 'Numbers in Kikuyu follow a specific pattern. Learning numbers is essential for daily communication, especially when shopping or discussing quantities.',
            relatedPhrases: [
                { kikuyu: 'Ithathatũ', english: 'Six', audioKey: 'ĩthathatũ' },
                { kikuyu: 'Mũgwanja', english: 'Seven', audioKey: 'mũgwanja' },
                { kikuyu: 'Inyanya', english: 'Eight', audioKey: 'inyanya' }
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
            audioKey: 'njerũ-njiru-njegũ',
            explanation: 'Colors in Kikuyu are used not just for describing objects, but also have cultural significance. Each color can represent different emotions or states.',
            relatedPhrases: [
                { kikuyu: 'Njũgũna', english: 'Green', audioKey: 'njũgũna' },
                { kikuyu: 'Njũgũ', english: 'Blue', audioKey: 'njũgũ' },
                { kikuyu: 'Njũgũnyũ', english: 'Yellow', audioKey: 'njũgũnyũ' }
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
            english: 'I am a bad person',
            audioKey: 'nĩ-mũndũ-mũũru',
            explanation: 'Kikuyu sentence structure follows a Subject-Verb-Object pattern. "Nĩ" is a copula (linking verb) meaning "is/am/are".',
            relatedPhrases: [
                { kikuyu: 'Nĩ mũtumia', english: 'I am a woman', audioKey: 'nĩ-mũtumia' },
                { kikuyu: 'Nĩ mũthuuri', english: 'I am a man', audioKey: 'nĩ-mũthuuri' },
                { kikuyu: 'Nĩ mwana', english: 'I am a child', audioKey: 'nĩ-mwana' }
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
            audioKey: 'nĩkũrĩa',
            explanation: 'Kikuyu verbs change form based on tense, person, and number. The prefix "Nĩ-" indicates present tense for first person singular.',
            relatedPhrases: [
                { kikuyu: 'Ũrĩkũrĩa', english: 'You are eating', audioKey: 'ũrĩkũrĩa' },
                { kikuyu: 'Arĩkũrĩa', english: 'He/She is eating', audioKey: 'arĩkũrĩa' },
                { kikuyu: 'Tũrĩkũrĩa', english: 'We are eating', audioKey: 'tũrĩkũrĩa' }
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
            audioKey: 'irua',
            explanation: 'Irua is one of the most important traditional ceremonies in Kikuyu culture. It marks the transition from childhood to adulthood and is a rite of passage.',
            relatedPhrases: [
                { kikuyu: 'Kĩama', english: 'Council of elders', audioKey: 'kĩama' },
                { kikuyu: 'Mũgumo', english: 'Sacred fig tree', audioKey: 'mũgumo' },
                { kikuyu: 'Gĩkũyũ', english: 'Kikuyu person', audioKey: 'gĩkũyũ' }
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
            audioKey: 'mũkũrũ',
            explanation: 'Respect for elders is fundamental in Kikuyu culture. Elders are seen as repositories of wisdom and tradition.',
            relatedPhrases: [
                { kikuyu: 'Mũkũrũ wa nyũmba', english: 'Family elder', audioKey: 'mũkũrũ-wa-nyũmba' },
                { kikuyu: 'Mũkũrũ wa kĩama', english: 'Council elder', audioKey: 'mũkũrũ-wa-kĩama' },
                { kikuyu: 'Ũtũũro', english: 'Respect', audioKey: 'ũtũũro' }
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
            audioKey: 'ũkĩĩ',
            explanation: 'Daily conversations in Kikuyu often begin with greetings and inquiries about well-being. This shows care and respect for others.',
            relatedPhrases: [
                { kikuyu: 'Ũkaa?', english: 'Where are you going?', audioKey: 'ũkaa' },
                { kikuyu: 'Nĩkaa kũrĩa', english: 'I am going to eat', audioKey: 'nĩkaa-kũrĩa' },
                { kikuyu: 'Ũũka rĩngĩ', english: 'Come again', audioKey: 'ũũka-rĩngĩ' }
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
            audioKey: 'nĩ-kĩĩ-gĩu',
            explanation: 'Market conversations involve negotiation and bargaining. Learning these phrases helps in daily commerce and trade.',
            relatedPhrases: [
                { kikuyu: 'Nĩ gĩa kũũ', english: 'It is expensive', audioKey: 'nĩ-gĩa-kũũ' },
                { kikuyu: 'Ũngĩheria', english: 'Can you reduce the price?', audioKey: 'ũngĩheria' },
                { kikuyu: 'Nĩ mwega', english: 'It is good', audioKey: 'nĩ-mwega' }
            ]
        }
    };
    
    return lessons[lessonId];
}

// Generate practice exercises with audio
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
            <div class="audio-practice-controls">
                <button class="btn btn-primary" onclick="playLessonAudio('${lesson.audioKey}')">
                    <i class="fas fa-play"></i> Listen
                </button>
                <button class="btn btn-outline" onclick="playAudioSlow('${lesson.audioKey}')">
                    <i class="fas fa-slow-motion"></i> Slow
                </button>
                <button class="btn btn-outline" onclick="repeatAudio('${lesson.audioKey}')">
                    <i class="fas fa-redo"></i> Repeat
                </button>
            </div>
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

// Generate related phrases with audio buttons
function generateRelatedPhrases(lesson) {
    return lesson.relatedPhrases.map(phrase => `
        <div class="phrase-card">
            <div class="phrase-kikuyu">${phrase.kikuyu}</div>
            <div class="phrase-english">${phrase.english}</div>
            <button class="btn btn-sm btn-outline" onclick="playLessonAudio('${phrase.audioKey}')">
                <i class="fas fa-play"></i> Listen
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

// Audio playback functionality
let currentAudio = null;
let audioContext = null;

// Play lesson audio
function playLessonAudio(audioKey) {
    if (!audioKey || !audioFiles[audioKey]) {
        console.error('Audio not found for key:', audioKey);
        showErrorMessage('Audio file not found');
        return;
    }
    
    const audioPath = audioFiles[audioKey];
    console.log('=== AUDIO DEBUG INFO ===');
    console.log('Audio key:', audioKey);
    console.log('Resolved path:', audioPath);
    console.log('Current page location:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.log('Base path from mapping:', audioFileBasePaths[audioKey]);
    console.log('========================');
    
    // Stop any currently playing audio
    stopCurrentAudio();
    
    try {
        // Create new audio element
        currentAudio = new Audio(audioPath);
        
        // Update UI to show audio is playing
        updateAudioButtonState(true);
        
        // Add event listeners
        currentAudio.addEventListener('loadeddata', () => {
            console.log('✅ Audio loaded successfully:', audioPath);
            showSuccessMessage('Playing audio...');
        });
        
        currentAudio.addEventListener('error', (e) => {
            console.error('❌ Audio error:', e);
            console.error('Audio error details:', {
                error: e,
                audioPath: audioPath,
                audioKey: audioKey,
                currentLocation: window.location.href,
                resolvedPath: audioPath,
                basePath: audioFileBasePaths[audioKey]
            });
            
            // Try alternative path if the first one fails
            const alternativePath = tryAlternativeAudioPath(audioKey);
            if (alternativePath && alternativePath !== audioPath) {
                console.log('🔄 Trying alternative path:', alternativePath);
                retryAudioWithPath(alternativePath, audioKey);
            } else {
                showErrorMessage('Failed to load audio file');
                updateAudioButtonState(false);
            }
        });
        
        currentAudio.addEventListener('ended', () => {
            console.log('Audio finished playing');
            currentAudio = null;
            updateAudioButtonState(false);
        });
        
        // Play the audio
        currentAudio.play().catch(error => {
            console.error('Error playing audio:', error);
            showErrorMessage('Failed to play audio');
            updateAudioButtonState(false);
        });
        
    } catch (error) {
        console.error('Error creating audio element:', error);
        showErrorMessage('Failed to create audio element');
        updateAudioButtonState(false);
    }
}

// Function to try alternative audio paths
function tryAlternativeAudioPath(audioKey) {
    const basePath = audioFileBasePaths[audioKey];
    const currentPath = window.location.pathname;
    
    // Try different path combinations
    const alternativePaths = [
        `../assets/${basePath}`,
        `assets/${basePath}`,
        `./assets/${basePath}`,
        `/assets/${basePath}`,
        `../../assets/${basePath}`
    ];
    
    // Return the first path that's different from the current one
    for (const path of alternativePaths) {
        if (path !== audioFiles[audioKey]) {
            return path;
        }
    }
    
    return null;
}

// Function to retry audio with a different path
function retryAudioWithPath(audioPath, audioKey) {
    try {
        // Stop current audio if any
        stopCurrentAudio();
        
        // Create new audio element with alternative path
        currentAudio = new Audio(audioPath);
        
        // Update UI to show audio is playing
        updateAudioButtonState(true);
        
        // Add event listeners
        currentAudio.addEventListener('loadeddata', () => {
            console.log('✅ Audio loaded successfully with alternative path:', audioPath);
            showSuccessMessage('Playing audio...');
        });
        
        currentAudio.addEventListener('error', (e) => {
            console.error('❌ Alternative path also failed:', audioPath);
            showErrorMessage('Failed to load audio file');
            updateAudioButtonState(false);
        });
        
        currentAudio.addEventListener('ended', () => {
            console.log('Audio finished playing');
            currentAudio = null;
            updateAudioButtonState(false);
        });
        
        // Play the audio
        currentAudio.play().catch(error => {
            console.error('Error playing audio with alternative path:', error);
            showErrorMessage('Failed to play audio');
            updateAudioButtonState(false);
        });
        
    } catch (error) {
        console.error('Error creating audio element with alternative path:', error);
        showErrorMessage('Failed to create audio element');
        updateAudioButtonState(false);
    }
}

// Play audio at slower speed
function playAudioSlow(audioKey) {
    if (!audioKey || !audioFiles[audioKey]) {
        showErrorMessage('Audio file not found');
        return;
    }
    
    const audioPath = audioFiles[audioKey];
    console.log('Playing audio slowly:', audioPath);
    
    // Stop any currently playing audio
    stopCurrentAudio();
    
    try {
        currentAudio = new Audio(audioPath);
        currentAudio.playbackRate = 0.7; // 70% speed
        
        currentAudio.addEventListener('loadeddata', () => {
            showSuccessMessage('Playing audio slowly...');
        });
        
        currentAudio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            
            // Try alternative path if the first one fails
            const alternativePath = tryAlternativeAudioPath(audioKey);
            if (alternativePath && alternativePath !== audioPath) {
                console.log('🔄 Trying alternative path for slow audio:', alternativePath);
                retrySlowAudioWithPath(alternativePath, audioKey);
            } else {
                showErrorMessage('Failed to load audio file');
            }
        });
        
        currentAudio.addEventListener('ended', () => {
            currentAudio = null;
        });
        
        currentAudio.play().catch(error => {
            console.error('Error playing audio:', error);
            showErrorMessage('Failed to play audio');
        });
        
    } catch (error) {
        console.error('Error creating audio element:', error);
        showErrorMessage('Failed to create audio element');
    }
}

// Function to retry slow audio with a different path
function retrySlowAudioWithPath(audioPath, audioKey) {
    try {
        // Stop current audio if any
        stopCurrentAudio();
        
        // Create new audio element with alternative path
        currentAudio = new Audio(audioPath);
        currentAudio.playbackRate = 0.7; // 70% speed
        
        currentAudio.addEventListener('loadeddata', () => {
            console.log('✅ Slow audio loaded successfully with alternative path:', audioPath);
            showSuccessMessage('Playing audio slowly...');
        });
        
        currentAudio.addEventListener('error', (e) => {
            console.error('❌ Alternative path also failed for slow audio:', audioPath);
            showErrorMessage('Failed to load audio file');
        });
        
        currentAudio.addEventListener('ended', () => {
            currentAudio = null;
        });
        
        // Play the audio
        currentAudio.play().catch(error => {
            console.error('Error playing slow audio with alternative path:', error);
            showErrorMessage('Failed to play audio');
        });
        
    } catch (error) {
        console.error('Error creating slow audio element with alternative path:', error);
        showErrorMessage('Failed to create audio element');
    }
}

// Repeat audio multiple times
function repeatAudio(audioKey) {
    if (!audioKey || !audioFiles[audioKey]) {
        showErrorMessage('Audio file not found');
        return;
    }
    
    const audioPath = audioFiles[audioKey];
    console.log('Repeating audio:', audioPath);
    
    // Stop any currently playing audio
    stopCurrentAudio();
    
    try {
        currentAudio = new Audio(audioPath);
        currentAudio.loop = true; // Loop the audio
        
        currentAudio.addEventListener('loadeddata', () => {
            showSuccessMessage('Repeating audio... Click stop to end');
        });
        
        currentAudio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            
            // Try alternative path if the first one fails
            const alternativePath = tryAlternativeAudioPath(audioKey);
            if (alternativePath && alternativePath !== audioPath) {
                console.log('🔄 Trying alternative path for repeat audio:', alternativePath);
                retryRepeatAudioWithPath(alternativePath, audioKey);
            } else {
                showErrorMessage('Failed to load audio file');
            }
        });
        
        // Play the audio
        currentAudio.play().catch(error => {
            console.error('Error playing audio:', error);
            showErrorMessage('Failed to play audio');
        });
        
    } catch (error) {
        console.error('Error creating audio element:', error);
        showErrorMessage('Failed to create audio element');
    }
}

// Function to retry repeat audio with a different path
function retryRepeatAudioWithPath(audioPath, audioKey) {
    try {
        // Stop current audio if any
        stopCurrentAudio();
        
        // Create new audio element with alternative path
        currentAudio = new Audio(audioPath);
        currentAudio.loop = true; // Loop the audio
        
        currentAudio.addEventListener('loadeddata', () => {
            console.log('✅ Repeat audio loaded successfully with alternative path:', audioPath);
            showSuccessMessage('Repeating audio... Click stop to end');
        });
        
        currentAudio.addEventListener('error', (e) => {
            console.error('❌ Alternative path also failed for repeat audio:', audioPath);
            showErrorMessage('Failed to load audio file');
        });
        
        // Play the audio
        currentAudio.play().catch(error => {
            console.error('Error playing repeat audio with alternative path:', error);
            showErrorMessage('Failed to play audio');
        });
        
    } catch (error) {
        console.error('Error creating repeat audio element with alternative path:', error);
        showErrorMessage('Failed to create audio element');
    }
}

// Update audio button state
function updateAudioButtonState(isPlaying) {
    const mainAudioBtn = document.getElementById('main-audio-btn');
    const stopAudioBtn = document.getElementById('stop-audio-btn');
    
    if (mainAudioBtn && stopAudioBtn) {
        if (isPlaying) {
            mainAudioBtn.style.display = 'none';
            stopAudioBtn.style.display = 'inline-flex';
            mainAudioBtn.classList.add('playing');
        } else {
            mainAudioBtn.style.display = 'inline-flex';
            stopAudioBtn.style.display = 'none';
            mainAudioBtn.classList.remove('playing');
        }
    }
}

// Stop current audio
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        console.log('Audio stopped');
    }
    
    // Update UI to show audio is stopped
    updateAudioButtonState(false);
}

// Legacy function for backward compatibility
function playAudio(audioFile) {
    console.log('Legacy playAudio called with:', audioFile);
    // Try to find the audio key from the filename
    const audioKey = Object.keys(audioFiles).find(key => 
        audioFiles[key].includes(audioFile) || audioFile.includes(key)
    );
    
    if (audioKey) {
        playLessonAudio(audioKey);
    } else {
        showErrorMessage('Audio file not found');
    }
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
        
        // Recalculate points to ensure accuracy after lesson completion
        recalculateUserPoints();
        
        // Auto-refresh progress immediately after lesson completion
        setTimeout(() => {
            autoRefreshProgress();
        }, 1000); // Wait 1 second after lesson completion
        
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
    if (window.location.pathname.includes('../Html/Lessons.html')) {
        console.log('Initializing lessons page...');
        
        // Wait for currentUser to be loaded (max 3 seconds)
        let attempts = 0;
        while (!window.currentUser && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.log('Current user after waiting:', window.currentUser);
        
        // Load user progress from Supabase/localStorage
        await loadUserProgress();
        
        // Force sync with Supabase to ensure we have the latest data
        await syncWithSupabase();
        
        // Update lesson cards with progress
        updateLessonCards();
        
        // Update user progress stats
        updateUserProgressStats();
        
        // Recalculate points to ensure accuracy
        recalculateUserPoints();
        
        // Force multiple refreshes to ensure data is properly synced
        setTimeout(() => {
            updateUserProgressStats();
            updateLessonCards();
            recalculateUserPoints();
        }, 100);
        
        setTimeout(() => {
            updateUserProgressStats();
            updateLessonCards();
            recalculateUserPoints();
        }, 500);
        
        setTimeout(() => {
            updateUserProgressStats();
            updateLessonCards();
            recalculateUserPoints();
        }, 1000);
        
        // Set up automatic syncing every 30 seconds
        setupAutoSync();
        
        // Set up page visibility listener for auto-refresh
        setupPageVisibilityListener();
        
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
        console.log('Calculating points from completed lessons...');
        userPoints = recalculateUserPoints();
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
        if (!window.currentUser || (window.currentUser && window.currentUser.id && window.currentUser.id.startsWith('demo_user_'))) {
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

// Handle page visibility changes to auto-refresh when user returns
function setupPageVisibilityListener() {
    let hidden = false;
    let visibilityChange = false;
    
    if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }
    
    if (typeof document.addEventListener !== "undefined" && typeof hidden !== false) {
        document.addEventListener(visibilityChange, function() {
            if (!document[hidden]) {
                // Page became visible - user returned to the page
                console.log('Page became visible - auto-refreshing progress...');
                setTimeout(() => {
                    autoRefreshProgress();
                }, 1000); // Wait 1 second after page becomes visible
            }
        }, false);
    }
    
    // Also listen for window focus events (when user returns to browser tab)
    window.addEventListener('focus', function() {
        console.log('Window focused - auto-refreshing progress...');
        setTimeout(() => {
            autoRefreshProgress();
        }, 500); // Wait 0.5 seconds after window focus
    });
    
    // Listen for navigation events (when user navigates back to lessons page)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // Page was loaded from back-forward cache
            console.log('Page shown from cache - auto-refreshing progress...');
            setTimeout(() => {
                autoRefreshProgress();
            }, 1000);
        }
    });
}

// Automatic progress refresh function
async function autoRefreshProgress() {
    console.log('Auto-refreshing progress...');
    try {
        // Reload user progress from Supabase
        await loadUserProgress();
        
        // Force sync with Supabase
        await syncWithSupabase();
        
        // Recalculate points to ensure accuracy
        recalculateUserPoints();
        
        // Update displays
        updateLessonCards();
        updateUserProgressStats();
        
        console.log('Auto-refresh completed successfully');
    } catch (error) {
        console.error('Auto-refresh failed:', error);
    }
}

// Recalculate points from completed lessons to ensure accuracy
function recalculateUserPoints() {
    const lessonData = {
        'vocab-1': 10, 'vocab-2': 15, 'vocab-3': 12, 'vocab-4': 15,
        'grammar-1': 20, 'grammar-2': 25, 'culture-1': 25, 'culture-2': 18,
        'conv-1': 22, 'conv-2': 28
    };
    
    let calculatedPoints = 0;
    const lessonIds = ['vocab-1', 'vocab-2', 'vocab-3', 'vocab-4', 'grammar-1', 'grammar-2', 'culture-1', 'culture-2', 'conv-1', 'conv-2'];
    
    lessonIds.forEach(lessonId => {
        const progress = parseInt(localStorage.getItem(`lesson-${lessonId}-progress`) || '0');
        if (progress >= 100) {
            calculatedPoints += lessonData[lessonId] || 0;
            console.log(`Lesson ${lessonId} completed: +${lessonData[lessonId]} points`);
        }
    });
    
    console.log(`Total calculated points: ${calculatedPoints}`);
    
    // Update currentUser points if they don't match
    if (window.currentUser && window.currentUser.points !== calculatedPoints) {
        console.log(`Updating points from ${window.currentUser.points} to ${calculatedPoints}`);
        window.currentUser.points = calculatedPoints;
        
        // Update localStorage
        localStorage.setItem('userProgress', JSON.stringify({
            points: window.currentUser.points,
            completedLessons: window.currentUser.completedLessons || []
        }));
        
        // Update Supabase if authenticated
        if (window.currentUser.id && !window.currentUser.id.startsWith('demo_user_') && typeof UserProgressManager !== 'undefined') {
            UserProgressManager.updateUserPoints(window.currentUser.id, calculatedPoints).then(() => {
                console.log('Points updated in Supabase');
            }).catch(error => {
                console.error('Failed to update points in Supabase:', error);
            });
        }
        
        // Update the display immediately
        updateUserProgressStats();
    }
    
    return calculatedPoints;
}

// Manually refresh progress from Supabase
async function refreshProgressFromSupabase() {
    console.log('Manually refreshing progress from Supabase...');
    try {
        // Reload user progress
        await loadUserProgress();
        
        // Force sync with Supabase
        await syncWithSupabase();
        
        // Recalculate points to ensure accuracy
        recalculateUserPoints();
        
        // Update displays
        updateLessonCards();
        updateUserProgressStats();
        
        console.log('Progress refresh completed successfully');
        showSuccessMessage('Progress refreshed successfully!');
    } catch (error) {
        console.error('Error refreshing progress:', error);
        showErrorMessage('Failed to refresh progress. Please try again.');
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
window.refreshProgressFromSupabase = refreshProgressFromSupabase;
window.recalculateUserPoints = recalculateUserPoints;
window.autoRefreshProgress = autoRefreshProgress;

// Initialize lessons page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Lesson.js: DOM Content Loaded');
    initializeLessonsPage();
    
    // Debug audio paths on page load
    debugAudioPaths();
    
    // Also listen for page load events (when page is refreshed)
    window.addEventListener('load', function() {
        console.log('Page loaded - auto-refreshing progress...');
        setTimeout(() => {
            autoRefreshProgress();
        }, 2000); // Wait 2 seconds after page load
    });
});

// Function to debug audio paths on page load
function debugAudioPaths() {
    console.log('=== AUDIO PATH DEBUG ON PAGE LOAD ===');
    console.log('Current location:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.log('Current hostname:', window.location.hostname);
    
    // Test a few audio paths
    const testKeys = ['wĩ-mwega', 'mũtumia', 'ĩmwe-igĩrĩ-ĩthatũ-inya-ĩthano'];
    testKeys.forEach(key => {
        const path = audioFiles[key];
        console.log(`Audio key "${key}" resolves to: ${path}`);
    });
    
    // Test alternative paths for one audio file
    if (testKeys.length > 0) {
        const testKey = testKeys[0];
        const basePath = audioFileBasePaths[testKey];
        console.log('Testing alternative paths for:', testKey);
        console.log('Base path:', basePath);
        console.log('Possible paths:', [
            `../assets/${basePath}`,
            `assets/${basePath}`,
            `./assets/${basePath}`,
            `/assets/${basePath}`,
            `../../assets/${basePath}`
        ]);
    }
    console.log('=====================================');
}

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
