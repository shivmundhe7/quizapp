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
    
    // Prevent common devtools and save/print shortcuts
    document.addEventListener('keydown', (e) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (source), Ctrl+S (save), Ctrl+P (print), Ctrl+C, Ctrl+V, Ctrl+X
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) || 
            (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
            (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
            (e.ctrlKey && (e.key === 'p' || e.key === 'P')) ||
            (e.ctrlKey && (e.key === 'c' || e.key === 'C')) || 
            (e.ctrlKey && (e.key === 'v' || e.key === 'V')) ||
            (e.ctrlKey && (e.key === 'x' || e.key === 'X')) ||
            (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))
        ) {
            e.preventDefault();
        }
    });

    // Check test status changes via Firestore realtime sync
    db.collection("data").doc("config").onSnapshot((doc) => {
        if (doc.exists) {
            checkTestStatus();
            checkResultVisibility();
        }
    });

    initNavigation();
});

function initNavigation() {
    document.getElementById('btn-enter').addEventListener('click', async () => {
        const sId = document.getElementById('student-id').value.trim();
        const sPass = document.getElementById('student-pass').value.trim();
        const errorMsg = document.getElementById('login-error-msg');
        
        if (!sId || !sPass) {
            errorMsg.textContent = 'Please enter both ID and Password.';
            errorMsg.style.display = 'block';
            return;
        }

        let students = [];
        let attempts = [];
        try {
            students = await getStudents();
            attempts = await getAttempts();
        } catch (e) {
            console.error("Firebase error details:", e);
            errorMsg.textContent = 'Network or database error. Please check your connection and try again.';
            errorMsg.style.display = 'block';
            return;
        }

        const student = students.find(s => 
            String(s.id).trim().toUpperCase() === String(sId).trim().toUpperCase() && 
            String(s.password).trim() === String(sPass).trim()
        );
        if (!student) {
            errorMsg.textContent = 'Invalid Student ID or Password.';
            errorMsg.style.display = 'block';
            return;
        }

        const hasAttempted = attempts.some(a => a.studentId === student.id);
        if (hasAttempted) {
            errorMsg.textContent = 'You have already attempted this exam. You cannot take it again.';
            errorMsg.style.display = 'block';
            return;
        }

        if (student.isAbsent) {
            errorMsg.textContent = 'You have been marked absent. You cannot attempt this test.';
            errorMsg.style.display = 'block';
            return;
        }

        // Device Binding Logic
        let localDeviceId = localStorage.getItem('deviceId');
        if (!localDeviceId) {
            localDeviceId = 'DEV-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
            localStorage.setItem('deviceId', localDeviceId);
        }

        const otherBoundStudent = students.find(s => s.id !== student.id && s.boundDeviceId === localDeviceId);
        if (otherBoundStudent) {
            errorMsg.textContent = 'This device has already been registered to another student. You cannot use it.';
            errorMsg.style.display = 'block';
            return;
        }

        let dynamicIp = null;
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            dynamicIp = ipData.ip;
        } catch(e) { console.warn("Could not fetch IP", e); }

        if (student.boundDeviceId) {
            if (student.boundDeviceId !== localDeviceId) {
                errorMsg.textContent = 'Your account is already logged into another device. You must use that device.';
                errorMsg.style.display = 'block';
                return;
            } else {
                // Same device login, update IP quietly to keep it fresh
                if (dynamicIp && student.ipAddress !== dynamicIp) {
                    student.ipAddress = dynamicIp;
                    await saveStudents(students).catch(e => console.warn(e));
                }
            }
        } else {
            student.boundDeviceId = localDeviceId;
            if (dynamicIp) student.ipAddress = dynamicIp;
            
            try {
                await saveStudents(students);
            } catch (e) {
                console.error("Binding failed:", e);
                errorMsg.textContent = 'Failed to lock your device to your account. Please check your connection and try again.';
                errorMsg.style.display = 'block';
                return;
            }
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

async function checkTestStatus() {
    if (!currentStudentName || isExamActive) return; // Ignore if exam is running or name not entered

    const config = await getConfig();
    if (config.isTestRunning) {
        switchView('view-instructions');
    } else {
        switchView('view-waiting');
    }
}

async function checkResultVisibility() {
    if (document.getElementById('view-completed').style.display === 'block') {
        const config = await getConfig();
        const resultsView = document.getElementById('results-view');
        
        if (config.resultsVisible) {
            resultsView.style.display = 'block';
            await renderDetailedResults();
        } else {
            resultsView.style.display = 'none';
        }
    }
}

async function startExam() {
    // Request full screen
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => console.log('Fullscreen rejected.'));
    }
    
    // Enable security bounds
    isExamActive = true;
    window.addEventListener('blur', handleTabSwitch);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Setup state
    questions = await getQuestions();
    
    // Shuffle questions logic could be added here
    
    const config = await getConfig();
    
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

function handleFullscreenChange() {
    // If the browser exits fullscreen natively during an active exam
    if (isExamActive && !document.fullscreenElement) {
        terminateExam('Exited Fullscreen Mode explicitly');
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

async function submitExam(isAuto = false, terminatedReason = null) {
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

    await saveAttempt(attempt);

    switchView('view-completed');
    checkResultVisibility(); // Check if admin already allowed it
}

async function renderDetailedResults() {
    const attempts = await getAttempts();
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
