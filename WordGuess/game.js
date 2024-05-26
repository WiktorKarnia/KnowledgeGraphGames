document.addEventListener("DOMContentLoaded", async () => {
    const masterWordElement = document.getElementById("master-word");
    const timeLeftElement = document.getElementById("time-left");
    const scoreElement = document.getElementById("score");
    const relatedWordInput = document.getElementById("related-word");
    const submitWordButton = document.getElementById("submit-word");

    let timeLeft = 60;
    let score = 0;
    let relatedWordsCount = 0;

    /*
    const timer = setInterval(() => {
        timeLeft--;
        timeLeftElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        }
    }, 1000)*/

    const randomNoun = await getRandomNoun();
    masterWordElement.textContent = randomNoun;
    const masterWord = pluralize.singular(randomNoun);

    console.log(masterWord);

    let relatedWords = await getRelatedWords(masterWord);

    console.log(relatedWords);

    submitWordButton.addEventListener("click", submitWord);

    relatedWordInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            submitWord();
        }
    });

    // Initialize the guessedWords array
    let guessedWords = [];
    let consecutiveCorrectGuesses = 0;

    function submitWord() {
        const relatedWord = relatedWordInput.value.trim().toLowerCase();
        console.log(relatedWord);

        // Check if the word has already been guessed
        if (guessedWords.includes(relatedWord)) {
            alert("You already submitted this word.");
            relatedWordInput.value = "";
            return; // Exit the function early if word is already guessed
        }

        // Add the word to the guessedWords array
        guessedWords.push(relatedWord);

        if (relatedWord && relatedWords.some(word => word.includes(relatedWord))) {
            console.log(relatedWord + ' is related!');
            
            incrementScore();

            // Remove only the related word that contains the master word
            const index = relatedWords.findIndex(word => word.includes(relatedWord));
            if (index !== -1) {
                removeWord(relatedWords[index]);
                relatedWords.splice(index, 1);
            }

            relatedWordInput.value = "";
        } else {
            console.log(relatedWord + " is not related!");

            consecutiveCorrectGuesses = 0;
            
            decrementScore();

            relatedWordInput.value = "";
        }
    }


    function removeWord(wordToRemove) {
        relatedWords = relatedWords.filter(word => word !== wordToRemove);
    }

    async function getRandomNoun() {
        return faker.commerce.product();
        //return faker.random.word();
    }


    function incrementScore() {
        relatedWordsCount++
        consecutiveCorrectGuesses++;

        //console.log(consecutiveCorrectGuesses);

        if (relatedWordsCount % 5 === 0) {
            score += 2; // Add 2 points for every multiple of 5
        }
        if (relatedWordsCount % 25 === 0) {
            score += 5; // Add 5 points if the user guesses a word 5 times without error
        }
        if (consecutiveCorrectGuesses === 5) {
            score += 5;
            consecutiveCorrectGuesses = 0;
        }

        score++
        scoreElement.textContent = score;
    }

    function decrementScore() {
        score--;
        scoreElement.textContent = score;
    }

    async function getRelatedWords(masterWord) {
        const apiUrl = "https://api.datamuse.com/words";
        const minRelatedNouns = 50;
        const maxRetries = 5;
        let attempts = 0;
    
        try {
            while (attempts < maxRetries) {
                // Constructing the full API URL with the query parameters
                const fullUrl = `${apiUrl}?ml=${encodeURIComponent(masterWord)}&max=100`;
                
                // Making the API request
                const response = await fetch(fullUrl);
                const data = await response.json();
    
                // Parsing the response
                const relatedWords = data.map(item => item.word.toLowerCase());
    
                // Check if the number of related words is sufficient
                if (relatedWords.length >= minRelatedNouns) {
                    return relatedWords;
                }
    
                attempts++;
            }
            
            // If after max retries, still not enough related words, return what we have
            return relatedWords;
    
        } catch (error) {
            console.error('Error fetching data:', error);
            window.location.reload();
        }
    }
    

    /*
    async function getRelatedWords(masterWord) {
        const apiUrl = "https://dbpedia.org/sparql";
        const minRelatedNouns = 50;
        const maxRetries = 5;
        let attempts = 0;
        
        const sparqlQuery = `
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dbo: <http://dbpedia.org/ontology/>
        SELECT DISTINCT ?relatedNounLabel ?description
        WHERE {
            ?subject rdfs:label "${masterWord}"@en .
            ?subject dbo:wikiPageWikiLink ?relatedNoun .
            ?relatedNoun rdfs:label ?relatedNounLabel .
            OPTIONAL { ?relatedNoun dbo:abstract ?description . }
            FILTER (lang(?relatedNounLabel) = 'en')
            FILTER (lang(?description) = 'en' || lang(?description) = '')
        }
        LIMIT 100
        `;

        /*
        const sparqlQuery = `
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX dbo: <http://dbpedia.org/ontology/>
            SELECT DISTINCT ?relatedNounLabel ?description
            WHERE {
                ?subject rdfs:label "${masterWord}"@en .
                ?subject dbo:wikiPageWikiLink ?intermediate .
                ?intermediate dbo:wikiPageWikiLink ?relatedNoun .
                ?relatedNoun rdfs:label ?relatedNounLabel .
                OPTIONAL { ?relatedNoun dbo:abstract ?description . }
                FILTER (lang(?relatedNounLabel) = 'en')
                FILTER (lang(?description) = 'en' || lang(?description) = '')
            }
            LIMIT 100
        `;

        try {
            // Encoding the SPARQL query for URL
            const encodedQuery = encodeURIComponent(sparqlQuery);
        
            // Constructing the full API URL with the encoded SPARQL query
            const fullUrl = `${apiUrl}?query=${encodedQuery}&format=json`;
            
            while (attempts < maxRetries) {
                // Making the API request
                const response = await fetch(fullUrl);
                const data = await response.json();
        
                // Parsing the response
                const results = data.results.bindings;
                const relatedNouns = results.map(result => result.relatedNounLabel.value.toLowerCase());
        
                // Check if the number of related nouns is sufficient
                if (relatedNouns.length >= minRelatedNouns) {
                    return relatedNouns;
                }
        
                attempts++;
            }
            
            // If after max retries, still not enough related nouns, return what we have
            return relatedNouns;
    
        } catch (error) {
            console.error('Error fetching data:', error);
            window.location.reload();
        }
    }*/
    
    function endGame() {
        const gameInLocalStorage = JSON.parse(localStorage.getItem("WordGuessGame"));
        const lastGame = gameInLocalStorage[gameInLocalStorage.length - 1];
        lastGame.score = score;
        localStorage.setItem("WordGuessGame", JSON.stringify(gameInLocalStorage));
        alert(`Game over! Your score is ${score}`);
        window.location.href = "index.html";
    }
});

