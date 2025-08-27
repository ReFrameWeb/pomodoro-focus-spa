
// DOM Elements
const timeDisplay = document.getElementById('time-display');
const timerState = document.getElementById('timer-state');
const timerCircle = document.getElementById('timer-circle');
const sessionCounter = document.getElementById('session-counter');
const quoteContainer = document.getElementById('quote-container');
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');

// Timer mode buttons
const pomodoroBtn = document.getElementById('pomodoro-btn');
const shortBreakBtn = document.getElementById('short-break-btn');
const longBreakBtn = document.getElementById('long-break-btn');
const timerModeBtns = document.querySelectorAll('.timer-mode-btn');

// Control buttons
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

// Settings inputs
const pomodoroTimeInput = document.getElementById('pomodoro-time');
const shortBreakTimeInput = document.getElementById('short-break-time');
const longBreakTimeInput = document.getElementById('long-break-time');
const longBreakIntervalInput = document.getElementById('long-break-interval');

// Timer variables
let timer;
let remainingTime = 25 * 60; // Default pomodoro time in seconds
const circumference = 2 * Math.PI * 90; // For the circle animation
let isRunning = false;
let currentMode = 'pomodoro'; // 'pomodoro', 'shortBreak', 'longBreak'
let sessionsCompleted = 0;
let targetTime = 25 * 60;

// Initialize Chart
const sessionsChart = new Chart(
    document.getElementById('sessions-chart'),
    {
        type: 'doughnut',
        data: {
            labels: ['Completed'],
            datasets: [{
                data: [0, 5], // Start with 0 sessions (5 is the "remaining" space)
                backgroundColor: ['rgba(74, 222, 128, 0.8)', 'rgba(31, 41, 55, 0.3)'],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    }
);

// Motivational quotes
const quotes = [
    { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
    { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
    { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" }
];

// Initialize the timer display
function updateDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update circle animation
    const dashOffset = circumference * (remainingTime / targetTime);
    timerCircle.style.strokeDashoffset = dashOffset;
    timerCircle.style.strokeDasharray = `${circumference} ${circumference}`;

    // Update chart
    updateChart();
}

// Update sessions chart
function updateChart() {
    const totalSessions = parseInt(longBreakIntervalInput.value);
    const remainingSessions = totalSessions - (sessionsCompleted % totalSessions);

    sessionsChart.data.datasets[0].data = [
        sessionsCompleted % totalSessions, // Completed sessions since last long break
        remainingSessions                  // Sessions remaining until next long break
    ];
    sessionsChart.update();
}

// Start the timer
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        timerState.textContent = currentMode === 'pomodoro' ? 'FOCUS' : 'BREAK';
        timerState.className = currentMode === 'pomodoro' ? 'text-green-500 font-medium tracking-wider' : 'text-blue-400 font-medium tracking-wider';

        timer = setInterval(() => {
            remainingTime--;
            updateDisplay();

            if (remainingTime <= 0) {
                clearInterval(timer);
                timerComplete();
            }
        }, 1000);
    }
}

// Pause the timer
function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    timerState.textContent = 'PAUSED';
    timerState.className = 'text-yellow-500 font-medium tracking-wider';
}

// Reset the timer
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    remainingTime = targetTime;
    updateDisplay();
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    timerState.textContent = 'READY';
    timerState.className = 'text-green-500 font-medium tracking-wider';
}

// Handle timer completion
function timerComplete() {
    isRunning = false;
    remainingTime = 0;
    updateDisplay();
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');

    // Play sound (would require proper implementation for production)
    if (typeof Audio !== 'undefined') {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.play().catch(e => console.log("Audio play failed:", e));
    }

    // Vibrate if supported
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
            body: currentMode === 'pomodoro' ? 'Time for a break!' : 'Break is over, time to focus!',
            icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202929.png'
        });
    }

    // If pomodoro completed, increment counter and check for long break
    if (currentMode === 'pomodoro') {
        sessionsCompleted++;
        sessionCounter.textContent = sessionsCompleted;
        updateChart();
        localStorage.setItem('sessionsCompleted', sessionsCompleted);

        // Check if it's time for a long break
        const interval = parseInt(longBreakIntervalInput.value);
        if (sessionsCompleted % interval === 0) {
            showRandomQuote();
            setTimeout(() => switchMode('longBreak'), 1000);
        } else {
            showRandomQuote();
            setTimeout(() => switchMode('shortBreak'), 1000);
        }
    } else {
        // Break finished, back to pomodoro
        setTimeout(() => switchMode('pomodoro'), 1000);
    }
}

// Switch between timer modes
function switchMode(mode) {
    currentMode = mode;

    // Update active button
    timerModeBtns.forEach(btn => btn.classList.remove('bg-green-600', 'text-white'));
    timerModeBtns.forEach(btn => btn.classList.add('text-gray-300', 'hover:bg-gray-800'));

    switch (mode) {
        case 'pomodoro':
            targetTime = parseInt(pomodoroTimeInput.value) * 60;
            pomodoroBtn.classList.remove('text-gray-300', 'hover:bg-gray-800');
            pomodoroBtn.classList.add('bg-green-600', 'text-white');
            timerState.textContent = 'READY';
            timerState.className = 'text-green-500 font-medium tracking-wider';
            break;
        case 'shortBreak':
            targetTime = parseInt(shortBreakTimeInput.value) * 60;
            shortBreakBtn.classList.remove('text-gray-300', 'hover:bg-gray-800');
            shortBreakBtn.classList.add('bg-green-600', 'text-white');
            timerState.textContent = 'BREAK TIME';
            timerState.className = 'text-blue-400 font-medium tracking-wider';
            break;
        case 'longBreak':
            targetTime = parseInt(longBreakTimeInput.value) * 60;
            longBreakBtn.classList.remove('text-gray-300', 'hover:bg-gray-800');
            longBreakBtn.classList.add('bg-green-600', 'text-white');
            timerState.textContent = 'LONG BREAK';
            timerState.className = 'text-purple-400 font-medium tracking-wider';
            break;
    }

    // Reset timer with new target time
    remainingTime = targetTime;
    resetTimer();
}

// Show random motivational quote
function showRandomQuote() {
    const { text, author } = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = text;
    quoteAuthor.textContent = `— ${author}`;
    quoteContainer.classList.remove('hidden');

    // Hide quote after 10 seconds
    setTimeout(() => {
        quoteContainer.classList.add('hidden');
    }, 10000);
}

// Create background particles
function createParticles() {
    const container = document.getElementById('particles-container');
    const particleCount = window.innerWidth < 768 ? 15 : 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random size between 2-8px
        const size = Math.random() * 6 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = `-${size}px`;

        // Random animation duration
        const duration = Math.random() * 20 + 15;
        particle.style.animationDuration = `${duration}s`;

        // Random delay
        particle.style.animationDelay = `${Math.random() * 15}s`;

        container.appendChild(particle);
    }
}

// Load saved settings and sessions
function loadSettings() {
    if (localStorage.getItem('pomodoroTime')) {
        pomodoroTimeInput.value = localStorage.getItem('pomodoroTime');
        shortBreakTimeInput.value = localStorage.getItem('shortBreakTime');
        longBreakTimeInput.value = localStorage.getItem('longBreakTime');
        longBreakIntervalInput.value = localStorage.getItem('longBreakInterval');
        sessionsCompleted = parseInt(localStorage.getItem('sessionsCompleted')) || 0;
        sessionCounter.textContent = sessionsCompleted;
        updateChart();
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('pomodoroTime', pomodoroTimeInput.value);
    localStorage.setItem('shortBreakTime', shortBreakTimeInput.value);
    localStorage.setItem('longBreakTime', longBreakTimeInput.value);
    localStorage.setItem('longBreakInterval', longBreakIntervalInput.value);
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

pomodoroBtn.addEventListener('click', () => {
    if (!isRunning) switchMode('pomodoro');
});
shortBreakBtn.addEventListener('click', () => {
    if (!isRunning) switchMode('shortBreak');
});
longBreakBtn.addEventListener('click', () => {
    if (!isRunning) switchMode('longBreak');
});

// Settings change handlers
pomodoroTimeInput.addEventListener('change', () => {
    saveSettings();
    if (currentMode === 'pomodoro') {
        targetTime = parseInt(pomodoroTimeInput.value) * 60;
        remainingTime = targetTime;
        updateDisplay();
    }
});

shortBreakTimeInput.addEventListener('change', () => {
    saveSettings();
    if (currentMode === 'shortBreak') {
        targetTime = parseInt(shortBreakTimeInput.value) * 60;
        remainingTime = targetTime;
        updateDisplay();
    }
});

longBreakTimeInput.addEventListener('change', () => {
    saveSettings();
    if (currentMode === 'longBreak') {
        targetTime = parseInt(longBreakTimeInput.value) * 60;
        remainingTime = targetTime;
        updateDisplay();
    }
});

longBreakIntervalInput.addEventListener('change', () => {
    saveSettings();
    updateChart();
});

// Request notification permission
if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
    });
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    createParticles();
    loadSettings();
    updateDisplay();

    // Set initial mode
    switchMode('pomodoro');

    // Make sure circle is initialized properly
    timerCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    timerCircle.style.strokeDashoffset = circumference;
});