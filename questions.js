// Shared initial data
const defaultQuestions = [
    {
        id: 1,
        question: "What does HTML stand for?",
        options: [
            "Hyper Text Markup Language",
            "Hyperlinks and Text Markup Language",
            "Home Tool Markup Language",
            "Hyper Tool Multi Language"
        ],
        correct: 0
    },
    {
        id: 2,
        question: "Which CSS property is used to change the background color?",
        options: [
            "color",
            "bgColor",
            "background-color",
            "background"
        ],
        correct: 2
    },
    {
        id: 3,
        question: "Inside which HTML element do we put the JavaScript?",
        options: [
            "<javascript>",
            "<js>",
            "<scripting>",
            "<script>"
        ],
        correct: 3
    },
    {
        id: 4,
        question: "How do you write 'Hello World' in an alert box?",
        options: [
            "msg('Hello World');",
            "alertBox('Hello World');",
            "alert('Hello World');",
            "msgBox('Hello World');"
        ],
        correct: 2
    },
    {
        id: 5,
        question: "Which of these is a JavaScript framework?",
        options: [
            "Django",
            "React",
            "Laravel",
            "Spring"
        ],
        correct: 1
    }
];

const rawStudentData = `1	25401	AADAGALE AKSHADA HARISH	Not marked	Present Absent Clear
2	25402	ADITYA GANJOO	Not marked	Present Absent Clear
3	25403	ADITYA SANJEEV MOHITE	Not marked	Present Absent Clear
4	25404	ADWAIT VISHWANATH YADAV	Not marked	Present Absent Clear
5	25405	ANDHARE VANDAN UDDHAV	Not marked	Present Absent Clear
6	25406	BELE VISHAL VIJAY	Not marked	Present Absent Clear
7	25407	BHAMARE KHUSHI NANDKISHOR	Not marked	Present Absent Clear
8	25408	DESHMUKH ASMITA AVINASH	Not marked	Present Absent Clear
9	25409	DEVRAI BHAGYASHREE SHARANAPPA	Not marked	Present Absent Clear
10	25410	DUTTE UDAY VIJAY	Not marked	Present Absent Clear
11	25411	GHOLAP PRACHI PRADIP	Not marked	Present Absent Clear
12	25412	GHOLAP PREM ASHOK	Not marked	Present Absent Clear
13	25413	HIPPARKAR DNYANESHWAR SANJAY	Not marked	Present Absent Clear
14	25414	JADHAV ABOLI SANJAY	Not marked	Present Absent Clear
15	25415	JADHAV OMKAR SAMBHAJI	Not marked	Present Absent Clear
16	25416	JAISWAL ADITYA LALIT	Not marked	Present Absent Clear
17	25417	KALE POONAM SITARAM	Not marked	Present Absent Clear
18	25418	KARTIK BALASAHEB MILIK	Not marked	Present Absent Clear
19	25419	KENDRE VASHISHTA ACHYUT	Not marked	Present Absent Clear
20	25420	KIKALE DHANESHWAR SHANKAR	Not marked	Present Absent Clear
21	25421	KHANDAGALE SNEHAL DIPAK	Not marked	Present Absent Clear
22	25422	KONHERE GOVIND SHIVRAJ	Not marked	Present Absent Clear
23	25423	KULKARNI PURVA SHRIPAD	Not marked	Present Absent Clear
24	25424	KUREKAR SUHANI ARVIND	Not marked	Present Absent Clear
25	25425	LOKHANDE VEDSHRI AJIT	Not marked	Present Absent Clear
26	25426	MAHESHWARI SOPAN SHINDE	Not marked	Present Absent Clear
27	25427	MOYKHEDE SWARALI KESHAV	Not marked	Present Absent Clear
28	25428	PESHWARI	Not marked	Present Absent Clear
29	25429	PAIGUDE NEEL KISAN	Not marked	Present Absent Clear
30	25430	PALKHEDE SAI VIJAY	Not marked	Present Absent Clear
31	25431	PATIL AMAR ARVIND	Not marked	Present Absent Clear
32	25432	PATIL AYUSH SANDOF	Not marked	Present Absent Clear
33	25433	PATIL SARTHAK RUTURAI	Not marked	Present Absent Clear
34	25434	PATINE SIDDHA VILIN	Not marked	Present Absent Clear
35	25435	PATRE OM SHANKAR	Not marked	Present Absent Clear
36	25436	PAIWAR SHRAVAN RAJESHAU	Not marked	Present Absent Clear
37	25437	PODHADIE GAYATRI GAJANAN	Not marked	Present Absent Clear
38	25438	PRASHANSA DEVENDRA MAKASARE	Not marked	Present Absent Clear
39	25439	ROHIT VITTHAL ATANURE	Not marked	Present Absent Clear
40	25440	SABLE PARTH CHANDU	Not marked	Present Absent Clear
41	25441	SANGRAM DABHADE	Not marked	Present Absent Clear
42	25442	SANKPAL AARY PRASHANT	Not marked	Present Absent Clear
43	25443	SADII NOOPUR MAHESH	Not marked	Present Absent Clear
44	25444	SHANTANU MADHAY PANCHAL	Not marked	Present Absent Clear
45	25445	SHINDE GAURI SANTOSH	Not marked	Present Absent Clear
46	25446	SHIVSHANKAR NAMDEV MUNDHE	Not marked	Present Absent Clear
47	25447	SHUBHAMRAI NAVNATH SARADE	Not marked	Present Absent Clear
48	25448	SONALKAR MITHILESH JYOTIRAO	Not marked	Present Absent Clear
49	25449	SONONE SARVADNYA DINESH	Not marked	Present Absent Clear
50	25450	SULAKE NAYAN VIJAY	Not marked	Present Absent Clear
51	25451	SURYAWANSHI SHUBHAM RAMESH	Not marked	Present Absent Clear
52	25452	TAKLE DNYANESHWARE RAMESHWAR	Not marked	Present Absent Clear
53	25453	VIVEK RAJESH GADADARE	Not marked	Present Absent Clear
54	25454	VRUSHABH VINAYAK KAMBLE	Not marked	Present Absent Clear
55	25455	WADGAONKAR YASH PRASHANT	Not marked	Present Absent Clear
56	25456	YADAV PRADNYAN CHANDRASHEKHAR	Not marked	Present Absent Clear
57	25457	ZANJE SHREYAS MALILI	Not marked	Present Absent Clear`;

// Initialize LocalStorage if empty
function initializeLocalData() {
    if (!localStorage.getItem("quizQuestions")) {
        localStorage.setItem("quizQuestions", JSON.stringify(defaultQuestions));
    }
    if (!localStorage.getItem("quizConfig")) {
        localStorage.setItem("quizConfig", JSON.stringify({
            timerEnabled: true,
            durationPerQuestion: 15, // seconds
            isTestRunning: false,
            resultsVisible: false
        }));
    }
    if (!localStorage.getItem("quizAttempts")) {
        localStorage.setItem("quizAttempts", JSON.stringify([]));
    }
    if (!localStorage.getItem("quizStudents")) {
        localStorage.setItem("quizStudents", JSON.stringify([]));
    }

    // Auto-import provided student list on first load
    if (!localStorage.getItem("quizStudentsSeededV1")) {
        let students = JSON.parse(localStorage.getItem("quizStudents")) || [];
        const lines = rawStudentData.trim().split('\n');

        lines.forEach(line => {
            if (!line.trim()) return;
            const match = line.match(/^\d+\s+(\d+)\s+(.*?)\s+Not marked/);
            if (match) {
                const sId = match[1];
                const sName = match[2].trim();
                const pwd = Math.random().toString(36).substr(2, 6).toUpperCase();

                // Only push if not already exists
                if (!students.find(s => s.id === sId)) {
                    students.push({
                        id: sId,
                        name: sName,
                        password: pwd,
                        boundDeviceId: null
                    });
                }
            }
        });
        localStorage.setItem("quizStudents", JSON.stringify(students));
        localStorage.setItem("quizStudentsSeededV1", "true");
    }
}

// Helpers
function getQuestions() {
    return JSON.parse(localStorage.getItem("quizQuestions")) || [];
}

function saveQuestions(questions) {
    localStorage.setItem("quizQuestions", JSON.stringify(questions));
}

function getConfig() {
    return JSON.parse(localStorage.getItem("quizConfig"));
}

function saveConfig(config) {
    localStorage.setItem("quizConfig", JSON.stringify(config));
}

function getAttempts() {
    return JSON.parse(localStorage.getItem("quizAttempts")) || [];
}

function saveAttempt(attempt) {
    const attempts = getAttempts();
    attempts.push(attempt);
    localStorage.setItem("quizAttempts", JSON.stringify(attempts));
}

function updateTestStatus(isRunning) {
    const config = getConfig();
    config.isTestRunning = isRunning;
    saveConfig(config);

    // Broadcast change to other tabs if necessary
    localStorage.setItem("testStatusTrigger", Date.now());
}

function toggleResultVisibility(isVisible) {
    const config = getConfig();
    config.resultsVisible = isVisible;
    saveConfig(config);
}

function getStudents() {
    return JSON.parse(localStorage.getItem("quizStudents")) || [];
}

function saveStudents(students) {
    localStorage.setItem("quizStudents", JSON.stringify(students));
    localStorage.setItem("testStatusTrigger", Date.now()); // Trigger updates implicitly
}

function getDeviceId() {
    let id = localStorage.getItem("quizDeviceId");
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem("quizDeviceId", id);
    }
    return id;
}

// Auto-init on script load
initializeLocalData();
