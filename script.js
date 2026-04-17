/* ===== MODE SYSTEM ===== */

function setMode(mode) {
    document.body.className = mode;
    localStorage.setItem("selectedMode", mode);
}

window.onload = function () {
    const savedMode = localStorage.getItem("selectedMode");
    if (savedMode) {
        document.body.className = savedMode;
    }
};


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

    function toggleSound() {
        soundEnabled = !soundEnabled;
    }

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

        const words = wordSets[getMode()][getDifficulty()];
        const wordText = words[Math.floor(Math.random() * words.length)];

        const word = document.createElement("div");
        word.classList.add("word");
        word.innerText = wordText;
        word.style.left = Math.random() * 80 + "%";
        word.style.top = "0px";

        word.hit = false; // ✅ IMPORTANT FIX

        gameArea.appendChild(word);

        let position = 0;

        function fall() {
            if (gameOver || word.hit) return;

            position += speed;
            word.style.top = position + "px";

            // ❗ MISSED WORD (ONLY ONCE)
            if (position > 380 && !word.hit) {

                word.hit = true;
                word.remove();

                lives--;
                if (lives < 0) lives = 0;

                livesDisplay.innerText = lives;

                // damage effect
                document.body.classList.add("damage");
                setTimeout(() => {
                    document.body.classList.remove("damage");
                }, 150);

                if (soundEnabled) {
                    missSound.currentTime = 0;
                    missSound.play();
                }

                if (lives === 0) {
                    endGame();
                    return;
                }

                return;
            }

            requestAnimationFrame(fall);
        }

        requestAnimationFrame(fall);
    }

    const wordInterval = setInterval(createWord, 2000);

    /* ===== INPUT ===== */
    input.addEventListener("change", () => {

        if (gameOver) return;

        if (soundEnabled) {
            typingSound.currentTime = 0;
            typingSound.play();
        }

        const typed = input.value.trim();
        const words = document.querySelectorAll(".word");

        let matched = false;

        words.forEach(word => {
            if (word.innerText === typed && !word.hit) {

                word.hit = true; // ✅ STOP FALL
                word.remove();

                score++;
                correctTyped++;
                scoreDisplay.innerText = score;

                matched = true;
            }
        });

        // ❗ WRONG INPUT → LOSE LIFE
        if (!matched && typed !== "") {
            lives--;
            if (lives < 0) lives = 0;

            livesDisplay.innerText = lives;

            document.body.classList.add("damage");
            setTimeout(() => {
                document.body.classList.remove("damage");
            }, 150);

            if (lives === 0) {
                endGame();
                return;
            }
        }

        totalTyped++;
        input.value = "";

        updateStats();
    });

    /* ===== STATS ===== */
    function updateStats() {
        const minutes = (60 - timeLeft) / 60;

        const wpm = minutes > 0 ? Math.round(correctTyped / minutes) : 0;
        const accuracy = totalTyped > 0
            ? Math.round((correctTyped / totalTyped) * 100)
            : 100;

        wpmDisplay.innerText = wpm;
        accuracyDisplay.innerText = accuracy;
    }

    /* ===== LEADERBOARD ===== */
    function saveScore() {
        const scores = JSON.parse(localStorage.getItem("leaderboard")) || [];

        scores.push({
            score: score,
            wpm: wpmDisplay.innerText,
            accuracy: accuracyDisplay.innerText
        });

        scores.sort((a, b) => b.score - a.score);
        scores.splice(5);

        localStorage.setItem("leaderboard", JSON.stringify(scores));
    }

    function showLeaderboard() {
        const scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
        const modal = document.getElementById("leaderboardModal");
        const list = document.getElementById("leaderboardList");

        list.innerHTML = "";

        if (scores.length === 0) {
            list.innerHTML = "<li>No scores yet</li>";
        } else {
            scores.forEach((s, i) => {
                const li = document.createElement("li");
                li.innerText = `#${i + 1} - ${s.score} pts | ${s.wpm} WPM | ${s.accuracy}%`;
                list.appendChild(li);
            });
        }

        modal.classList.add("show");
    }

    function closeLeaderboard() {
        document.getElementById("leaderboardModal").classList.remove("show");
        setTimeout(() => location.reload(), 300);
    }

    /* ===== END GAME ===== */
    function endGame() {
        if (gameOver) return;

        gameOver = true;

        clearInterval(timer);
        clearInterval(wordInterval);

        input.disabled = true;

        // ❗ REMOVE ALL WORDS (VERY IMPORTANT)
        document.querySelectorAll(".word").forEach(w => w.remove());

        saveScore();

        if (soundEnabled) {
            gameOverSound.currentTime = 0;
            gameOverSound.play();
        }

        showLeaderboard();
    }
}

/* ===== RESTART ===== */
function restartGame() {
    location.reload();
}
function openLeaderboard() {

    const modal = document.getElementById("leaderboardModal");
    const list = document.getElementById("leaderboardList");

    let data = JSON.parse(localStorage.getItem("lb")) || [];

    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = "<li>No scores yet</li>";
    } else {
        data.forEach((d, i) => {
            let li = document.createElement("li");
            li.innerText =
            `#${i+1} Score:${d.score} | Lives:${d.lives} | Time:${d.time} | WPM:${d.wpm} | Acc:${d.acc}%`;
            list.appendChild(li);
        });
    }

    modal.classList.add("show");
}

function closeLeaderboard() {
    document.getElementById("leaderboardModal").classList.remove("show");
}
function startGame() {
    window.location.href = "game.html";
}