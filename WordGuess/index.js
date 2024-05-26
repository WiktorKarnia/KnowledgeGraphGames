document.addEventListener("DOMContentLoaded", () => {
    const startGameButton = document.getElementById("start-game");
    const nicknameInput = document.getElementById("nickname");
    //const scoresList = document.getElementById("scores");
    const scoresTableBody = document.querySelector("#scores tbody");

    // Load scores from local storage
    const gameScores = JSON.parse(localStorage.getItem("WordGuessGame")) || [];
    gameScores.sort((a, b) => b.score - a.score);
    gameScores.splice(5);
    /*
    gameScores.forEach(score => {
        const li = document.createElement("li");
        li.textContent = `${score.user}: ${score.score}`;
        scoresList.appendChild(li);
    });*/
    gameScores.forEach(score => {
        const tr = document.createElement("tr");
        const tdNickname = document.createElement("td");
        const tdScore = document.createElement("td");

        tdNickname.textContent = score.user;
        tdScore.textContent = score.score;

        tr.appendChild(tdNickname);
        tr.appendChild(tdScore);
        scoresTableBody.appendChild(tr);
    });


    startGameButton.addEventListener("click", () => {
        const nickname = nicknameInput.value.trim();
        let gameScore = [];
    
        // Fetch existing game scores from localStorage
        const gameInLocalStorage = localStorage.getItem("WordGuessGame");
        if (gameInLocalStorage) {
            gameScore = JSON.parse(gameInLocalStorage);
        }
    
        if (nickname) {
            const uuid = generateUID();
            gameScore.push({ uuid: uuid, user: nickname, score: "" });
    
            // Update localStorage with the updated game scores array
            localStorage.setItem("WordGuessGame", JSON.stringify(gameScore));
    
            window.location.href = "game.html";
        } else {
            alert("Please enter a nickname");
        }
    });

    function generateUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0,
              v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
});
