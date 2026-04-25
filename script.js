
let state = 'idle';
const sfxStart = new Audio('go.mp3');
const sfxError = new Audio('error.mp3');
const sfxSuccess = new Audio('success.mp3');
let startTime = 0;
let timeoutId = null;
let fakeTimeoutId = null;

let username = '';
let reactionTimes = [];
let streak = 0;
let fastest = Infinity;

const elStartScreen = document.getElementById('start-screen');
const elGameScreen = document.getElementById('game-screen');
const elReactionBox = document.getElementById('reaction-box');
const elBoxText = document.getElementById('box-text');
const btnStart = document.getElementById('btn-start');
const btnFinish = document.getElementById('btn-finish');
const inputUser = document.getElementById('username');

const elDisplayUser = document.getElementById('display-user');
const elAvg = document.getElementById('stat-avg');
const elFastest = document.getElementById('stat-fastest');
const elStreak = document.getElementById('stat-streak');
const elAttempts = document.getElementById('stat-attempts');
const elLeaderboardList = document.getElementById('leaderboard-list');

updateLeaderboardUI();


btnStart.addEventListener('click', () => {
    sfxStart.currentTime = 0;
    sfxStart.play();

    username = inputUser.value.trim() || 'ANONYMOUS';
    elDisplayUser.textContent = username;
    
    elStartScreen.classList.add('hidden');
    elGameScreen.classList.remove('hidden');
    btnFinish.classList.remove('hidden');
    
    resetStats();
    state = 'idle';
    elReactionBox.className = 'box-idle';
    elBoxText.textContent = 'PENCET UNTUK MEMULAI';
});

btnFinish.addEventListener('click', () => {
    saveToLeaderboard();
    elStartScreen.classList.remove('hidden');
    elGameScreen.classList.add('hidden');
    
    state = 'idle';
    clearTimeout(timeoutId);
    clearTimeout(fakeTimeoutId);
    updateLeaderboardUI();
});


function startRound() {
    state = 'waiting';
    elReactionBox.className = 'box-red';
    elBoxText.textContent = 'TUNGGU...';
    
   
    const delay = Math.floor(Math.random() * 3000) + 2000;
    

    if (streak >= 3 && Math.random() < 0.3) {
        const fakeDelay = delay * 0.4;
        fakeTimeoutId = setTimeout(() => {
            if(state === 'waiting') {
                elReactionBox.className = 'box-orange';
                elBoxText.textContent = 'WARNING';
                
                setTimeout(() => {
                    if(state === 'waiting') {
                        elReactionBox.className = 'box-red';
                        elBoxText.textContent = 'TUNGGU...';
                    }
                }, 150);
            }
        }, fakeDelay);
    }

    timeoutId = setTimeout(() => {
        state = 'ready';
        elReactionBox.className = 'box-green';
        elBoxText.textContent = 'SEKARANG!';
        
        startTime = performance.now();
    }, delay);
}

function handleInteraction(e) {
    e.preventDefault(); 

    if (state === 'idle') {
        startRound();
    } 
    else if (state === 'waiting') {

        clearTimeout(timeoutId);
        clearTimeout(fakeTimeoutId);
        state = 'result';
        streak = 0; 
        
        sfxError.currentTime = 0; 
        sfxError.play();

        elReactionBox.className = 'box-idle shake';
        elBoxText.innerHTML = `TERLALU CEPAT!<br><span style="font-size:1rem; font-weight:normal; color:#666;">Pencet untuk memulai ulang</span>`;
        
        setTimeout(() => elReactionBox.classList.remove('shake'), 300);
        updateStatsUI();
    } 
    else if (state === 'ready') {
        const endTime = performance.now();
        const reactionTime = endTime - startTime;
        
        state = 'result';
        reactionTimes.push(reactionTime);

        sfxSuccess.currentTime = 0;
        sfxSuccess.play();
        
        let feedback = '';
        if (reactionTime < 200) {
            feedback = 'SANGAT CEPAT';
            streak++;
        } else if (reactionTime <= 300) {
            feedback = 'CEPAT';
            streak++;
        } else if (reactionTime <= 600) {
            feedback = 'LAMBAT';
            streak++;
        } else {
            feedback = 'SANGAT LAMBAT';
            streak = 0;
        }

        if (reactionTime < fastest) fastest = reactionTime;

        elReactionBox.className = 'box-idle';
        elBoxText.innerHTML = `${reactionTime.toFixed(2)}ms<br><span style="font-size:1.5rem; color:#00ffff">${feedback}</span><br><span style="font-size:1rem; font-weight:normal; margin-top:10px; display:block; color:#666;">Pencet untuk melanjutkan</span>`;
        
        updateStatsUI();
    } 
    else if (state === 'result') {
        startRound();
    }
}

elReactionBox.addEventListener('mousedown', handleInteraction);
elReactionBox.addEventListener('touchstart', handleInteraction, { passive: false });

function updateStatsUI() {
    elStreak.textContent = streak;
    elAttempts.textContent = reactionTimes.length;
    
    if (fastest !== Infinity) {
        elFastest.textContent = fastest.toFixed(2);
    }
    
    if (reactionTimes.length > 0) {
        const sum = reactionTimes.reduce((a, b) => a + b, 0);
        const avg = sum / reactionTimes.length;
        elAvg.textContent = avg.toFixed(2);
    }
}

function resetStats() {
    reactionTimes = [];
    streak = 0;
    fastest = Infinity;
    elAvg.textContent = '0';
    elFastest.textContent = '-';
    updateStatsUI();
}

function saveToLeaderboard() {
    if (reactionTimes.length < 5) {
        alert('SYSTEM ERROR: Selesaikan minimal 5 percobaan agar rata-rata valid disave!');
        return;
    }
    
    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    const avg = sum / reactionTimes.length;
    
    let lb = JSON.parse(localStorage.getItem('reactionLeaderboard')) || [];
    lb.push({ name: username, avg: avg, attempts: reactionTimes.length });
    
    lb.sort((a, b) => a.avg - b.avg);
    lb = lb.slice(0, 5); // Ambil Top 5
    localStorage.setItem('reactionLeaderboard', JSON.stringify(lb));
}

function updateLeaderboardUI() {
    let lb = JSON.parse(localStorage.getItem('reactionLeaderboard')) || [];
    elLeaderboardList.innerHTML = '';
    
    if(lb.length === 0) {
        elLeaderboardList.innerHTML = '<li>BELUM ADA DATA</li>';
        return;
    }
    
    lb.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>[0${index + 1}] ${entry.name}</span> <span style="color:#0f0">${entry.avg.toFixed(2)}ms</span>`;
        elLeaderboardList.appendChild(li);
    });
}