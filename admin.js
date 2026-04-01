// admin.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Admin Login Logic
    const btnLogin = document.getElementById('btn-login') ;
    const viewLogin = document.getElementById('view-login');
    const adminApp = document.getElementById('admin-app');
    const errorMsg = document.getElementById('login-error');

    // Check if implicitly logged in via session (optional but handy)
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        viewLogin.style.display = 'none';
        adminApp.style.display = 'flex';
        initializeApp();
    }

    btnLogin.addEventListener('click', () => {
        const user = document.getElementById('admin-user').value.trim();
        const pass = document.getElementById('admin-pass').value.trim();

        if (user === 'admin' && pass === 'admin123') {
            sessionStorage.setItem('adminLoggedIn', 'true');
            viewLogin.style.display = 'none';
            adminApp.style.display = 'flex';
            initializeApp();
        } else {
            errorMsg.style.display = 'block';
        }
    });

    // Subsystem initialization wrapped for login flow
    function initializeApp() {
        refreshDashboard();
        renderQuestionsCard();
        renderStudentsCard();
        loadSettings();

        // Start/Stop Test Logic
        const config = getConfig();
        updateUIWithTestStatus(config.isTestRunning);

        // Toggle Results Visibility setup
        const btnResults = document.getElementById('btn-toggle-results');
        btnResults.textContent = config.resultsVisible ? 'Disable Results for Students' : 'Enable Results for Students';
        btnResults.className = config.resultsVisible ? 'btn-danger' : 'btn-outline';
    }

    // Auto-refresh when student completes
    window.addEventListener('storage', (e) => {
        if (e.key === 'quizAttempts') {
            if (sessionStorage.getItem('adminLoggedIn') === 'true') {
                refreshDashboard();
            }
        }
    });

    // Download CSV
    document.getElementById('btn-download-csv').addEventListener('click', downloadCSV);

    // Clear Logs
    document.getElementById('btn-clear-attempts').addEventListener('click', () => {
        if(confirm("Are you sure you want to delete ALL student attempts? This cannot be undone.")) {
            localStorage.setItem("quizAttempts", JSON.stringify([]));
            refreshDashboard();
        }
    });

    // Nav logic
    const navItems = document.querySelectorAll('.admin-nav-item');
    const sections = document.querySelectorAll('main > section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = `view-${item.dataset.target}`;
            sections.forEach(sec => {
                sec.style.display = sec.id === targetId ? 'block' : 'none';
            });
        });
    });

    document.getElementById('btn-start-test').addEventListener('click', () => {
        updateTestStatus(true);
        updateUIWithTestStatus(true);
        alert('Test Started! Students can now submit their exams.');
    });

    document.getElementById('btn-stop-test').addEventListener('click', () => {
        updateTestStatus(false);
        updateUIWithTestStatus(false);
        alert('Test Stopped! Students can no longer start the exam.');
    });

    // Settings
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const val = parseInt(document.getElementById('setting-timer-duration').value);
        if(val >= 5) {
            const conf = getConfig();
            conf.durationPerQuestion = val;
            conf.timerEnabled = document.getElementById('setting-timer-enabled').checked;
            saveConfig(conf);
            alert('Settings saved successfully!');
        } else {
            alert('Timer must be at least 5 seconds.');
        }
    });

    // Toggle Results Visibility
    const btnResults = document.getElementById('btn-toggle-results');
    btnResults.addEventListener('click', () => {
        const currentConf = getConfig();
        const newState = !currentConf.resultsVisible;
        toggleResultVisibility(newState);
        
        btnResults.textContent = newState ? 'Disable Results for Students' : 'Enable Results for Students';
        btnResults.className = newState ? 'btn-danger' : 'btn-outline';
        alert(`Results are now ${newState ? 'VISIBLE' : 'HIDDEN'} to students.`);
    });
});

function downloadCSV() {
    const attempts = getAttempts();
    if(attempts.length === 0) {
        alert("No results to download.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // CSV Headers
    csvContent += "Student ID,Student Name,Score,Total Questions,Date,Status,Flag Reason\n";

    attempts.forEach(a => {
        const date = new Date(a.date).toLocaleString().replace(/,/g, '');
        const status = a.terminatedReason ? "Terminated" : "Completed";
        const reason = a.terminatedReason ? a.terminatedReason : "None";
        const sId = a.studentId || 'N/A';
        const row = `${sId},${a.studentName},${a.score},${a.totalQuestions},${date},${status},"${reason}"`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_exam_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updateUIWithTestStatus(isRunning) {
    const btnStart = document.getElementById('btn-start-test');
    const btnStop = document.getElementById('btn-stop-test');
    const badge = document.getElementById('test-status-badge');

    if (isRunning) {
        btnStart.style.display = 'none';
        btnStop.style.display = 'block';
        badge.textContent = 'Status: Running';
        badge.className = 'badge badge-active';
    } else {
        btnStart.style.display = 'block';
        btnStop.style.display = 'none';
        badge.textContent = 'Status: Stopped';
        badge.className = 'badge badge-stopped';
    }
}

function refreshDashboard() {
    const attempts = getAttempts();
    const tbody = document.getElementById('attempts-tbody');
    tbody.innerHTML = '';

    if (attempts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">No attempts yet.</td></tr>';
        return;
    }

    // Sort by most recent
    attempts.sort((a,b) => new Date(b.date) - new Date(a.date));

    attempts.forEach(attempt => {
        const row = document.createElement('tr');
        
        // Formulate date
        const d = new Date(attempt.date);
        const dateStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;

        // Cheating status formatting
        let statusHtml = '<span class="badge badge-active">Completed</span>';
        if (attempt.terminatedReason) {
            statusHtml = `<span class="badge badge-stopped" title="${attempt.terminatedReason}">Terminated</span>`;
        }

        row.innerHTML = `
            <td><strong>${attempt.studentName}</strong></td>
            <td>${attempt.score} / ${attempt.totalQuestions}</td>
            <td>${statusHtml}</td>
            <td style="color:var(--text-muted); font-size: 0.9em; display:flex; justify-content:space-between; align-items:center; border-bottom:none;">
                <span>${dateStr}</span>
                <button class="btn-del-attempt" data-date="${attempt.date}" style="background:transparent; border:none; font-size:1.2rem; margin-left:10px; cursor:pointer;" title="Delete this log">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.btn-del-attempt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find closet button in case they clicked inner text
            const targetBtn = e.target.closest('button');
            if(confirm('Delete this specific attempt log permanently?')) {
                const targetDate = targetBtn.dataset.date;
                let atts = getAttempts().filter(a => a.date !== targetDate);
                localStorage.setItem("quizAttempts", JSON.stringify(atts));
                refreshDashboard();
            }
        });
    });
}

// Question Management logic
function renderQuestionsCard() {
    const questions = getQuestions();
    const list = document.getElementById('questions-list');
    list.innerHTML = '';

    questions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="flex-between">
                <div>
                    <span style="color:var(--accent); font-weight:bold; margin-right:10px;">Q${index + 1}.</span>
                    <strong>${q.question}</strong>
                </div>
                <div>
                    <button class="btn-outline btn-edit-q" data-id="${q.id}" style="padding: 0.4rem 0.8rem; font-size:0.9rem;">Edit</button>
                    <button class="btn-danger btn-del-q" data-id="${q.id}" style="padding: 0.4rem 0.8rem; font-size:0.9rem;">Delete</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });

    // Bind Edit/Delete
    document.querySelectorAll('.btn-del-q').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            if(confirm('Are you sure you want to delete this question?')) {
                const qs = getQuestions().filter(q => q.id !== id);
                saveQuestions(qs);
                renderQuestionsCard();
            }
        });
    });

    document.querySelectorAll('.btn-edit-q').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            openQuestionModal(id);
        });
    });
}

// Student Management logic
function renderStudentsCard() {
    const students = getStudents();
    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No students registered.</td></tr>';
        return;
    }

    students.forEach((s) => {
        const row = document.createElement('tr');
        
        const boundStatus = s.boundDeviceId ? 
            '<span class="badge badge-active">Yes (Locked)</span>' : 
            '<span class="badge badge-stopped">No</span>';

        row.innerHTML = `
            <td><strong>${s.name}</strong></td>
            <td><code style="background:var(--bg-color); padding:4px 8px; border-radius:4px;">${s.id}</code></td>
            <td><code style="background:var(--bg-color); padding:4px 8px; border-radius:4px;">${s.password}</code></td>
            <td>${boundStatus}</td>
            <td>
                <button class="btn-outline btn-clear-device" data-id="${s.id}" style="padding: 0.4rem 0.8rem; font-size:0.8rem;" ${!s.boundDeviceId ? 'disabled' : ''}>Clear Device</button>
                <button class="btn-danger btn-del-student" data-id="${s.id}" style="padding: 0.4rem 0.8rem; font-size:0.8rem; margin-left:5px;">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.btn-clear-device').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(confirm('Clear device binding? The student will be able to log in from a new device. Previous device will be blocked.')) {
                const sId = e.target.dataset.id;
                const studList = getStudents();
                const student = studList.find(st => st.id === sId);
                if(student) {
                    student.boundDeviceId = null;
                    saveStudents(studList);
                    renderStudentsCard();
                }
            }
        });
    });

    document.querySelectorAll('.btn-del-student').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(confirm('Delete student account permanently?')) {
                const sId = e.target.dataset.id;
                const studList = getStudents().filter(st => st.id !== sId);
                saveStudents(studList);
                renderStudentsCard();
            }
        });
    });
}

document.getElementById('btn-add-student').addEventListener('click', () => {
    const nameInput = document.getElementById('new-student-name');
    const name = nameInput.value.trim();
    if(!name) {
        alert("Enter a student name.");
        return;
    }

    const students = getStudents();
    
    // Generate an ID like STD-1001
    const nextNum = 1001 + students.length;
    let sId = 'STD-' + nextNum;
    
    // Generate a random 6 char alphanumeric password
    const pwd = Math.random().toString(36).substr(2, 6).toUpperCase();

    students.push({
        id: sId,
        name: name,
        password: pwd,
        boundDeviceId: null
    });

    saveStudents(students);
    nameInput.value = '';
    renderStudentsCard();
});

function loadSettings() {
    const config = getConfig();
    document.getElementById('setting-timer-duration').value = config.durationPerQuestion;
    document.getElementById('setting-timer-enabled').checked = config.timerEnabled;
}

// Modal Logic
const modal = document.getElementById('modal-question');
document.getElementById('btn-add-question').addEventListener('click', () => {
    openQuestionModal(null); // null means new question
});

document.getElementById('btn-modal-cancel').addEventListener('click', () => {
    modal.style.display = 'none';
});

document.getElementById('btn-modal-save').addEventListener('click', () => {
    const qs = getQuestions();
    const idField = document.getElementById('modal-q-id').value;
    const isNew = idField === '';
    
    // Validate inputs
    const text = document.getElementById('modal-q-text').value.trim();
    const opts = [
        document.getElementById('modal-opt-0').value.trim(),
        document.getElementById('modal-opt-1').value.trim(),
        document.getElementById('modal-opt-2').value.trim(),
        document.getElementById('modal-opt-3').value.trim()
    ];
    
    let correctIdx = -1;
    document.querySelectorAll('input[name="correct-opt"]').forEach((rb, idx) => {
        if(rb.checked) correctIdx = idx;
    });

    if(!text || opts.includes('') || correctIdx === -1) {
        alert('Please fill all fields and select a correct option.');
        return;
    }

    const newQ = {
        id: isNew ? Date.now() : parseInt(idField),
        question: text,
        options: opts,
        correct: correctIdx
    };

    if(isNew) {
        qs.push(newQ);
    } else {
        const idx = qs.findIndex(q => q.id === newQ.id);
        if(idx >= 0) qs[idx] = newQ;
    }

    saveQuestions(qs);
    renderQuestionsCard();
    modal.style.display = 'none';
});

function openQuestionModal(id) {
    modal.style.display = 'flex';
    
    if (id) {
        const q = getQuestions().find(q => q.id === id);
        document.getElementById('modal-q-id').value = q.id;
        document.getElementById('modal-q-text').value = q.question;
        q.options.forEach((opt, idx) => {
            document.getElementById(`modal-opt-${idx}`).value = opt;
        });
        document.querySelectorAll('input[name="correct-opt"]')[q.correct].checked = true;
    } else {
        document.getElementById('modal-q-id').value = '';
        document.getElementById('modal-q-text').value = '';
        [0,1,2,3].forEach(idx => {
            document.getElementById(`modal-opt-${idx}`).value = '';
        });
        document.querySelector('input[name="correct-opt"]').checked = false; // uncheck all roughly
    }
}
