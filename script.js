/* ===== MODE SYSTEM ===== */
function setMode(mode) {
    document.body.className = mode;
    localStorage.setItem("selectedMode", mode);
}

// Ensure mode persists across pages immediately
(function () {
    const savedMode = localStorage.getItem("selectedMode");
    if (savedMode) {
        document.body.className = savedMode;
    }
})();

/* ===== GAME LOGIC ===== */
if (document.getElementById("game-area")) {
    const gameArea = document.getElementById("game-area");
    const input = document.getElementById("input");
    const scoreDisplay = document.getElementById("score");
    const livesDisplay = document.getElementById("lives");
    const timeDisplay = document.getElementById("time");
    const wpmDisplay = document.getElementById("wpm");
    const accuracyDisplay = document.getElementById("accuracy");

    let score = 0;
    let lives = 3;
    let timeLeft = 60;
    let speed = 1.5;
    let totalTyped = 0;
    let correctTyped = 0;
    let gameOver = false;

    /* ===== SOUND ===== */
    const typingSound = new Audio("typing.mp3");
    const gameOverSound = new Audio("gameover.mp3");
    const missSound = new Audio("miss.mp3");

    typingSound.volume = 0.3;
    gameOverSound.volume = 0.5;
    missSound.volume = 0.4;
    let soundEnabled = true;

    /* ===== WORD DATA ===== */
    const wordSets = {
        kid: {
            easy: ["cat", "dog", "sun", "ball", "tree"],
            medium: ["apple", "table", "chair", "water"],
            hard: ["banana", "teacher", "picture", "playing"]
        },
        adult: {
            easy: ["code", "data", "web", "task"],
            medium: ["system", "network", "server", "design"],
            hard: ["database", "security", "algorithm", "application"]
        },
        gamer: {
            easy: ["aim", "win", "kill", "loot"],
            medium: ["battle", "reload", "sniper", "mission"],
            hard: ["multiplayer", "strategy", "checkpoint", "bossfight"]
        }
    };

    function getMode() {
        // Fallback to 'kid' if no class is set
        return document.body.className || "kid";
    }

    function getDifficulty() {
        if (timeLeft > 40) return "easy";
        if (timeLeft > 20) return "medium";
        return "hard";
    }

    /* ===== TIMER ===== */
    const timer = setInterval(() => {
        if (gameOver) return;
        timeLeft--;
        timeDisplay.innerText = timeLeft;
        if (timeLeft % 10 === 0) speed += 0.3;
        if (timeLeft <= 0) endGame();
    }, 1000);

    /* ===== CREATE WORD ===== */
    function createWord() {
        if (gameOver) return;

        const currentMode = getMode();
        const difficulty = getDifficulty();
        const words = wordSets[currentMode][difficulty];
        const wordText = words[Math.floor(Math.random() * words.length)];

        const word = document.createElement("div");
        word.classList.add("word");
        word.innerText = wordText;
        word.style.left = Math.random() * 80 + "%";
        word.style.top = "0px";
        word.hit = false; 

        gameArea.appendChild(word);

        let position = 0;
        function fall() {
            if (gameOver || word.hit) return;

            position += speed;
            word.style.top = position + "px";

            if (position > 380 && !word.hit) {
                word.hit = true;
                word.remove();
                handleMiss();
            } else {
                requestAnimationFrame(fall);
            }
        }
        requestAnimationFrame(fall);
    }

    function handleMiss() {
        lives--;
        livesDisplay.innerText = Math.max(lives, 0);
        triggerDamageEffect();
        if (soundEnabled) { missSound.currentTime = 0; missSound.play(); }
        if (lives <= 0) endGame();
    }

    function triggerDamageEffect() {
        document.body.classList.add("damage");
        setTimeout(() => document.body.classList.remove("damage"), 150);
    }

    const wordInterval = setInterval(createWord, 2000);

    /* ===== INPUT (Optimized for real-time) ===== */
    input.addEventListener("input", () => {
        if (gameOver) return;

        const typed = input.value.trim().toLowerCase();
        const words = document.querySelectorAll(".word");
        let matched = false;

        words.forEach(word => {
            if (word.innerText.toLowerCase() === typed && !word.hit) {
                word.hit = true;
                word.remove();
                score++;
                correctTyped++;
                scoreDisplay.innerText = score;
                matched = true;
                input.value = ""; // Clear input only on match
                if (soundEnabled) { typingSound.currentTime = 0; typingSound.play(); }
            }
        });

        if (matched) {
            totalTyped++;
            updateStats();
        }
    });

    function updateStats() {
        const minutes = (60 - timeLeft) / 60;
        const wpm = minutes > 0 ? Math.round(correctTyped / minutes) : 0;
        const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 100;
        wpmDisplay.innerText = wpm;
        accuracyDisplay.innerText = accuracy;
    }

    /* ===== LEADERBOARD LOGIC ===== */
    function saveScore() {
        const scores = JSON.parse(localStorage.getItem("wordFallLeaderboard")) || [];
        scores.push({
            score: score,
            wpm: wpmDisplay.innerText,
            accuracy: accuracyDisplay.innerText,
            date: new Date().toLocaleDateString()
        });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem("wordFallLeaderboard", JSON.stringify(scores.slice(0, 5)));
    }

    function showLeaderboard() {
        const scores = JSON.parse(localStorage.getItem("wordFallLeaderboard")) || [];
        const modal = document.getElementById("leaderboardModal");
        const list = document.getElementById("leaderboardList");
        list.innerHTML = "";

        if (scores.length === 0) {
            list.innerHTML = "<li>No scores yet!</li>";
        } else {
            scores.forEach((s, i) => {
                const li = document.createElement("li");
                li.innerText = `#${i + 1} - ${s.score} pts | ${s.wpm} WPM | ${s.accuracy}%`;
                list.appendChild(li);
            });
        }
        modal.classList.add("show");
    }

    function endGame() {
        if (gameOver) return;
        gameOver = true;
        clearInterval(timer);
        clearInterval(wordInterval);
        input.disabled = true;
        document.querySelectorAll(".word").forEach(w => w.remove());
        saveScore();
        if (soundEnabled) { gameOverSound.play(); }
        showLeaderboard();
    }
}

/* ===== GLOBAL FUNCTIONS ===== */
function closeLeaderboard() {
    document.getElementById("leaderboardModal").classList.remove("show");
    // Option to reload or go home
    location.reload(); 
}

function startGame() {
    window.location.href = "game.html";
}

function restartGame() {
    location.reload();
}