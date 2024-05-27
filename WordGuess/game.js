document.addEventListener("DOMContentLoaded", async () => {
    const masterWordElement = document.getElementById("master-word");
    const timeLeftElement = document.getElementById("time-left");
    const scoreElement = document.getElementById("score");
    const relatedWordInput = document.getElementById("related-word");
    const submitWordButton = document.getElementById("submit-word");

    let timeLeft = 60;
    let score = 0;
    let correctGuesses = 0;
    let consecutiveCorrectGuesses = 0;
    let guessedWords = [];
    let masterWord = '';
    let relatedWords = [];

    
    const timer = setInterval(() => {
        timeLeft--;
        timeLeftElement.textContent = timeLeft;
        if (timeLeft <= 10) {
            timeLeftElement.style.color = "red"; // Change color to red if time left is 10 or less
        } else {
            timeLeftElement.style.color = "rgb(46, 188, 188)"; // Reset color if time left is more than 10
        }
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        }
    }, 1000);

    // Fetch initial master word and related words
    ({ masterWord, relatedWords } = await fetchNewMasterWord());

    submitWordButton.addEventListener("click", submitWord);
    relatedWordInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            submitWord();
        }
    });

    async function fetchNewMasterWord() {
        const randomNoun = await getRandomNoun();
        masterWordElement.textContent = randomNoun;
        const masterWord = pluralize.singular(randomNoun);
        const relatedWords = await getRelatedWords(masterWord);
        console.log(relatedWords);
        return { masterWord, relatedWords };
    }

    async function submitWord() {
        const relatedWord = relatedWordInput.value.trim().toLowerCase();
        console.log(relatedWord);

        if (guessedWords.includes(relatedWord)) {
            alert("You already submitted this word.");
            relatedWordInput.value = "";
            return;
        }

        guessedWords.push(relatedWord);

        if (relatedWord && relatedWords.includes(relatedWord)) {
            showMessage("Good guess! +2pt", "rgb(46, 188, 188)");
            console.log(`${relatedWord} is related!`);
            incrementScore();

            const index = relatedWords.indexOf(relatedWord);
            if (index !== -1) {
                relatedWords.splice(index, 1);
            }

            correctGuesses++;
            consecutiveCorrectGuesses++; // Increment consecutive correct guesses counter

            if (consecutiveCorrectGuesses === 6) {
                score += 6; // Add 6 extra points for 6 consecutive correct guesses
                showMessage("6 combo! +6 pts", "rgb(46, 188, 188)");
                consecutiveCorrectGuesses = 0; // Reset the consecutive correct guesses counter
                scoreElement.textContent = score;
            }

            if (correctGuesses % 4 === 0) {
                await changeMasterWord();
            }

            relatedWordInput.value = "";
        } else {
            showMessage("Wrong guess! -2pts", "rgb(58, 6, 6)");
            console.log(`${relatedWord} is not related!`);
            decrementScore();
            relatedWordInput.value = "";
            consecutiveCorrectGuesses = 0;
        }
    }

    function showMessage(message, color) {
        const messageBox = document.getElementById("message-box");
        messageBox.textContent = message;
        messageBox.style.color = color;
        messageBox.classList.add("show"); // Add 'show' class to display message box
        setTimeout(() => {
            messageBox.classList.remove("show"); // Remove 'show' class after some time
            setTimeout(() => {
                messageBox.textContent = ""; // Clear message after hiding
            }, 300); // Delay removing the content to allow the transition to finish
        }, 3000); // Change 3000 to adjust the display duration (in milliseconds)
    }

    async function changeMasterWord() {
        const newMaster = await fetchNewMasterWord();
        masterWord = newMaster.masterWord;
        relatedWords = newMaster.relatedWords;

        timeLeft += 10;
        //score += 4;
        showMessage("Next word! +10s", "rgb(46, 188, 188)");
        scoreElement.textContent = score;
    }

    async function getRandomNoun() {
        return faker.commerce.product();
    }

    function incrementScore() {
        score += 2;
        scoreElement.textContent = score;
    }

    function decrementScore() {
        score -= 2;
        scoreElement.textContent = score;
    }
    
// Constructing the SPARQL query
// const sparqlQuery = `
//   PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
//   PREFIX dbo: <http://dbpedia.org/ontology/>
//   SELECT ?relatedNoun ?description
//   WHERE {
//     ?subject rdfs:label "${nounn}"@en .
//     ?subject dbo:wikiPageWikiLink ?relatedNoun .
//     ?relatedNoun dbo:abstract ?description .
//     FILTER (lang(?description) = 'en')
//   }
// `;

    async function getRelatedWords(masterWord) {
        const apiUrl = "https://api.datamuse.com/words";
        const minRelatedNouns = 50;
        const maxRetries = 5;
        let attempts = 0;
        let relatedWords = [];

        while (attempts < maxRetries) {
            try {
                const fullUrl = `${apiUrl}?ml=${encodeURIComponent(masterWord)}&max=100`;
                const response = await fetch(fullUrl);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                relatedWords = data.map(item => item.word.toLowerCase());

                if (relatedWords.length >= minRelatedNouns) {
                    return relatedWords;
                }

                attempts++;
            } catch (error) {
                console.error('Error fetching data:', error);
                if (attempts >= maxRetries - 1) {
                    alert('Failed to fetch related words. Please try again later.');
                    window.location.reload();
                }
                attempts++;
            }
        }
        return relatedWords;
    }

    async function endGame() {
        const gameInLocalStorage = JSON.parse(localStorage.getItem("WordGuessGame"));
        const lastGame = gameInLocalStorage[gameInLocalStorage.length - 1];
        lastGame.score = score;
        localStorage.setItem("WordGuessGame", JSON.stringify(gameInLocalStorage));
        //alert(`Game over! Your score is ${score}`);
        showMessage(`Game over! Your score: ${score}`, "rgb(58, 6, 6)");
        await new Promise(resolve => setTimeout(resolve, 2000));
        window.location.href = "index.html";
    }
});
