// script.js - Student Exam Logic

let currentStudentId = '';
let currentStudentName = '';
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionId: selectedIndex }
let timerInterval = null;
let timeRemaining = 0;
let isExamActive = false;

// Security variables
let warningCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Security Hook: Prevent Copy/Paste/Right-Click
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
    document.addEventListener('paste', e => e.preventDefault());
    
    // Prevent common devtools shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v')) {
            e.preventDefault();
        }
    });

    // Check test status changes (sync between tabs/windows)
    window.addEventListener('storage', (e) => {
        if (e.key === 'testStatusTrigger' || e.key === 'quizConfig') {
            checkTestStatus();
            checkResultVisibility();
        }
    });

    initNavigation();
});

function initNavigation() {
    document.getElementById('btn-enter').addEventListener('click', () => {
        const sId = document.getElementById('student-id').value.trim();
        const sPass = document.getElementById('student-pass').value.trim();
        const errorMsg = document.getElementById('login-error-msg');
        
        if (!sId || !sPass) {
            errorMsg.textContent = 'Please enter both ID and Password.';
            errorMsg.style.display = 'block';
            return;
        }

        const students = getStudents();
        const student = students.find(s => s.id === sId && s.password === sPass);

        if (!student) {
            errorMsg.textContent = 'Invalid Student ID or Password.';
            errorMsg.style.display = 'block';
            return;
        }

        // Handle Device Binding Rule
        const deviceId = getDeviceId();
        
        if (student.boundDeviceId) {
            // Already bound, verify it is THIS device
            if (student.boundDeviceId !== deviceId) {
                errorMsg.textContent = 'Account locked! This account is registered to another device.';
                errorMsg.style.display = 'block';
                return;
            }
        } else {
            // Not bound. First, check if THIS device is already bound to someone else
            const isDeviceUsed = students.some(s => s.boundDeviceId === deviceId);
            if (isDeviceUsed) {
                errorMsg.textContent = 'Device locked! This device is already used by another student.';
                errorMsg.style.display = 'block';
                return;
            }

            // Bind it
            student.boundDeviceId = deviceId;
            saveStudents(students);
        }

        // Login Success
        currentStudentId = student.id;
        currentStudentName = student.name;
        errorMsg.style.display = 'none';
        
        checkTestStatus(); // proceed to waiting or instructions
    });

    document.getElementById('btn-start').addEventListener('click', startExam);

    document.getElementById('btn-next').addEventListener('click', () => {
        saveCurrentAnswer();
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
        saveCurrentAnswer();
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    });

    document.getElementById('btn-submit').addEventListener('click', () => {
        if(confirm('Are you sure you want to submit your exam?')) {
            submitExam(false);
        }
    });
}

function switchView(viewId) {
    ['view-entry', 'view-waiting', 'view-instructions', 'view-quiz', 'view-completed'].forEach(id => {
        document.getElementById(id).style.display = id === viewId ? 'block' : 'none';
    });
}

function checkTestStatus() {
    if (!currentStudentName || isExamActive) return; // Ignore if exam is running or name not entered

    const config = getConfig();
    if (config.isTestRunning) {
        switchView('view-instructions');
    } else {
        switchView('view-waiting');
    }
}

function checkResultVisibility() {
    if (document.getElementById('view-completed').style.display === 'block') {
        const config = getConfig();
        const resultsView = document.getElementById('results-view');
        
        if (config.resultsVisible) {
            resultsView.style.display = 'block';
            renderDetailedResults();
        } else {
            resultsView.style.display = 'none';
        }
    }
}

function startExam() {
    // Request full screen
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => console.log('Fullscreen rejected.'));
    }
    
    // Enable security bounds
    isExamActive = true;
    window.addEventListener('blur', handleTabSwitch);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Setup state
    questions = getQuestions();
    
    // Shuffle questions logic could be added here
    
    const config = getConfig();
    
    if (config.timerEnabled) {
        timeRemaining = questions.length * config.durationPerQuestion;
        document.getElementById('timer-container').style.display = 'block';
        startTimer();
    } else {
        document.getElementById('timer-container').style.display = 'none';
    }
    
    document.getElementById('student-name-display').textContent = `${currentStudentName} (${currentStudentId})`;

    switchView('view-quiz');
    renderQuestion();
}

function renderQuestion() {
    if (questions.length === 0) return;

    const q = questions[currentQuestionIndex];
    document.getElementById('question-counter').textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    document.getElementById('question-text').textContent = q.question;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    const selectedOpt = userAnswers[q.id];

    q.options.forEach((optText, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (selectedOpt === index) btn.classList.add('selected');
        
        btn.innerHTML = `<span style="display:inline-block; width:24px; height:24px; border-radius:50%; border:1px solid var(--border); text-align:center; line-height:22px; margin-right:10px;">${String.fromCharCode(65 + index)}</span> ${optText}`;
        
        btn.addEventListener('click', () => {
            // Remove selection from others
            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            userAnswers[q.id] = index;
        });
        
        optionsContainer.appendChild(btn);
    });

    // Update Next/Prev/Submit buttons
    document.getElementById('btn-prev').disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === questions.length - 1) {
        document.getElementById('btn-next').style.display = 'none';
        document.getElementById('btn-submit').style.display = 'block';
    } else {
        document.getElementById('btn-next').style.display = 'block';
        document.getElementById('btn-submit').style.display = 'none';
    }
}

function saveCurrentAnswer() {
    // Already saved implicitly in click handler, but keeping function for architecture
}

function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Your exam will be automatically submitted.");
            submitExam(true);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(timeRemaining / 60);
    const sec = timeRemaining % 60;
    const txt = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    
    const display = document.getElementById('timer-text');
    display.textContent = txt;
    
    if (timeRemaining <= 30) {
        display.style.color = 'var(--danger)';
        display.style.animation = 'fadeIn 1s infinite alternate';
    }
}

// Security Handlers
function handleVisibilityChange() {
    if (document.visibilityState === 'hidden' && isExamActive) {
        terminateExam('Switched tabs or minimized browser');
    }
}

function handleTabSwitch() {
    // Fired when window loses focus
    if (isExamActive) {
        terminateExam('Lost window focus (clicked outside or switched apps)');
    }
}

function terminateExam(reason) {
    if (!isExamActive) return;
    
    // Show Warning Overlay Briefly
    const overlay = document.getElementById('warning-overlay');
    overlay.style.display = 'flex';
    
    setTimeout(() => {
        overlay.style.display = 'none';
        submitExam(true, reason);
    }, 3000);
}

function submitExam(isAuto = false, terminatedReason = null) {
    isExamActive = false;
    clearInterval(timerInterval);
    
    // Remove security listeners
    window.removeEventListener('blur', handleTabSwitch);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    document.getElementById('timer-container').style.display = 'none';
    
    let score = 0;
    questions.forEach(q => {
        if (userAnswers[q.id] === q.correct) {
            score++;
        }
    });

    const attempt = {
        studentId: currentStudentId,
        studentName: currentStudentName,
        score: score,
        totalQuestions: questions.length,
        answers: userAnswers,
        terminatedReason: terminatedReason,
        date: new Date().toISOString()
    };

    saveAttempt(attempt);

    switchView('view-completed');
    checkResultVisibility(); // Check if admin already allowed it
}

function renderDetailedResults() {
    const attempts = getAttempts();
    const myLastAttempt = attempts.filter(a => a.studentId === currentStudentId).pop();
    
    if (!myLastAttempt) return;


    const detailContainer = document.getElementById('detailed-results');
    detailContainer.innerHTML = '';

    questions.forEach((q, qIndex) => {
        const studAnsIdx = myLastAttempt.answers[q.id];
        const isCorrect = studAnsIdx === q.correct;
        
        let html = `
            <div class="card" style="margin-bottom: 1rem; border-color: ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
                <p><strong>Q${qIndex + 1}: ${q.question}</strong></p>
                <div style="margin-top:0.5rem;">
        `;
        
        q.options.forEach((opt, oIndex) => {
            let color = 'var(--text-muted)';
            let icon = '';
            
            if (oIndex === q.correct) {
                color = 'var(--success)';
                icon = '✓';
            } else if (oIndex === studAnsIdx && !isCorrect) {
                color = 'var(--danger)';
                icon = '✗';
            }

            html += `<div style="color: ${color}; margin-bottom: 0.25rem;">${icon} ${opt}</div>`;
        });

        html += `</div></div>`;
        detailContainer.innerHTML += html;
    });
}
