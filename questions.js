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

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAMT-dY6H88yoDCutfoxCBSq-RvgoZKeN8",
    authDomain: "presenty-app.firebaseapp.com",
    projectId: "presenty-app",
    storageBucket: "presenty-app.firebasestorage.app",
    messagingSenderId: "781939436929",
    appId: "1:781939436929:web:bb9b1fe0f42aab3eef8c80",
    measurementId: "G-D4C233F25E"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Initialize Database if empty
async function initializeDatabase() {
    try {
        const initRef = db.collection("system").doc("initialization");
        const doc = await initRef.get();
        if (!doc.exists) {
            console.log("Database initialized for the first time...");
            await db.collection("data").doc("questions").set({ value: defaultQuestions });
            await db.collection("data").doc("config").set({
                value: {
                    timerEnabled: true,
                    durationPerQuestion: 15,
                    isTestRunning: false,
                    resultsVisible: false
                }
            });
            await db.collection("data").doc("attempts").set({ value: [] });

            let students = [];
            const lines = rawStudentData.trim().split('\n');
            lines.forEach(line => {
                if (!line.trim()) return;
                const match = line.match(/^\d+\s+(\d+)\s+(.*?)\s+Not marked/);
                if (match) {
                    students.push({
                        id: match[1],
                        name: match[2].trim(),
                        password: Math.floor(100000 + Math.random() * 900000).toString(),
                        boundDeviceId: null
                    });
                }
            });
            await db.collection("data").doc("students").set({ value: students });
            
            await initRef.set({ initialized: true });
            console.log("Database initialized successfully.");
        }
    } catch (e) {
        console.error("Error initializing database: ", e);
    }
}

// Helpers
async function getQuestions() {
    const doc = await db.collection("data").doc("questions").get();
    return doc.exists ? doc.data().value : [];
}

async function saveQuestions(questions) {
    await db.collection("data").doc("questions").set({ value: questions });
}

async function getConfig() {
    const doc = await db.collection("data").doc("config").get();
    return doc.exists ? doc.data().value : {
        timerEnabled: true,
        durationPerQuestion: 15,
        isTestRunning: false,
        resultsVisible: false
    };
}

async function saveConfig(config) {
    await db.collection("data").doc("config").set({ value: config });
}

async function getAttempts() {
    const doc = await db.collection("data").doc("attempts").get();
    return doc.exists ? doc.data().value : [];
}

async function saveAttempt(attempt) {
    const attempts = await getAttempts();
    attempts.push(attempt);
    await db.collection("data").doc("attempts").set({ value: attempts });
}

async function updateTestStatus(isRunning) {
    const config = await getConfig();
    config.isTestRunning = isRunning;
    await saveConfig(config);
}

async function toggleResultVisibility(isVisible) {
    const config = await getConfig();
    config.resultsVisible = isVisible;
    await saveConfig(config);
}

async function getStudents() {
    const doc = await db.collection("data").doc("students").get();
    return doc.exists ? doc.data().value : [];
}

async function saveStudents(students) {
    await db.collection("data").doc("students").set({ value: students });
}


// Auto-init on script load
initializeDatabase();
