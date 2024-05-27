let startWord = '';
let finishWord = '';
let currentWord = '';
let score = 0;
let path = [];
let startTime;
let liveTimerInterval;
const endpoint = 'https://api.datamuse.com/words?ml=';

//------------------------ START PAGE ------------------------

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('manual-input').addEventListener('change', toggleInputFields);
  displayScoreboard();
});

function toggleInputFields() {
  const inputFields = document.getElementById('input-fields');
  if (document.getElementById('manual-input').checked) {
    inputFields.classList.remove('hidden');
  } else {
    inputFields.classList.add('hidden');
  }
}

function prepareGame() {
  document.getElementById("prepare-btn").classList.add('hidden');
  document.getElementById("manual-input-label").classList.remove('hidden');
  document.getElementById("nickname-div").classList.remove('hidden');
  document.getElementById("start-btn").classList.remove('hidden');
}

//------------------------ SCOREBOARD ------------------------

function saveScore(elapsedMilliseconds) {
  const nickname = document.getElementById('nickname').value || 'Anonymous';
  const newScore = {
    nickname,
    time: elapsedMilliseconds,
    startWord,
    finishWord,
    path: path.join(' -> ')
  };

  const scores = JSON.parse(localStorage.getItem('scores')) || [];
  scores.push(newScore);
  localStorage.setItem('scores', JSON.stringify(scores));
}

function clearScoreboard() {
if (confirm("Are you sure you want to clear your scores?")) {
  localStorage.removeItem('scores');
  displayScoreboard();
} else {
  console.log("Canceled");
}
}

function displayScoreboard() {
  const scoreboardBody = document.getElementById('scoreboard-body');
  const scores = JSON.parse(localStorage.getItem('scores')) || [];

  scoreboardBody.innerHTML = '';

  const newestScores = scores.slice(-5).reverse();

  for (let i = 0; i < 5; i++) {
    const score = newestScores[i] || {};
    let formattedTime = '';
    let pathText = '';

    if (score.startWord && score.finishWord) {
      pathText = `${score.startWord} <span class="arrow"> ➔ </span> ${score.finishWord}`;
    }

    if (score.time !== undefined && score.time !== 0) {
      formattedTime = formatTime(score.time);
    }

    scoreboardBody.innerHTML += `
      <tr>
        <td>${score.nickname || ''}</td>
        <td>${formattedTime || ''}</td>
        <td><p class="score-path" data-score="${i}">${pathText}</p></td>
      </tr>
    `;
  }


  const scorePaths = document.querySelectorAll('.score-path');
  scorePaths.forEach(scorePath => {
    scorePath.addEventListener('click', () => {
      const scoreIndex = scorePath.getAttribute('data-score');
      customAlert.alert(newestScores[scoreIndex]);
    });
  });
}

function toggleScoreboard() {
  const scoreboard = document.getElementById('scoreboard');
  const isHidden = scoreboard.classList.toggle('hidden');
  if (!isHidden) {
    displayScoreboard();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  displayScoreboard();
});

//------------------------ PLAY ------------------------

async function startGame() {
  document.getElementById('message').innerText = '';

  if (!targetWordsValid()) {
    return;
  }

  const targetsValid = await checkTargets(startWord, finishWord);
  if (!targetsValid) return;

  currentWord = startWord;
  path = [startWord];

  document.getElementById('start-word').innerText = startWord;
  document.getElementById('finish-word').innerText = finishWord;
  document.getElementById('current-word').innerText = currentWord;
  updatePathDisplay();

  showElements();
  hideElements();

  const startRelatedWords = await fetchRelatedWords(startWord);
  displayWords(startRelatedWords);
  startTimer(); 
  startLiveTimer();
}

//------------------------ PREPARE GAME ------------------------

async function checkTargets(targetStartWord, targetFinishWord) {
  const startRelatedWords = await fetchRelatedWords(targetStartWord);
  const finishRelatedWords = await fetchRelatedWords(targetFinishWord);

  if (document.getElementById('manual-input').checked) {
    if (startRelatedWords.length === 0 || finishRelatedWords.length === 0) {
      document.getElementById('message').innerText = 'A connection cannot be made, please change the words';
      document.getElementById('related-words').innerHTML = '';
      document.getElementById('start-value').value = '';
      document.getElementById('finish-value').value = '';
      return false;
    }
  } else {
    if (startRelatedWords.length === 0 || finishRelatedWords.length === 0) {
      startWord = faker.commerce.product();
      finishWord = faker.commerce.product();
      return false;
    }
  }

  return true;
}

function targetWordsValid() {
  if (document.getElementById('manual-input').checked) {
    startWord = document.getElementById('start-value').value;
    finishWord = document.getElementById('finish-value').value;
  } else {
    startWord = faker.commerce.product();
    finishWord = faker.commerce.product();
  }

  if (!startWord || !finishWord) {
    document.getElementById('message').innerText = 'Please enter a start and finish word.';
    document.getElementById('related-words').innerHTML = '';
    return false;
  }

  if (startWord === finishWord) {
    if (document.getElementById('manual-input').checked) {
      document.getElementById('message').innerText = 'Please make sure start word and finish word are different.';
      document.getElementById('related-words').innerHTML = '';
      return false;
    } else {
      finishWord = faker.commerce.product();
      targetWordsValid();
    }
  }
  return true;
}

//------------------------ RELATED WORDS ------------------------

async function fetchRelatedWords(word) {
  const response = await fetch(`${endpoint}${word}`);
  const data = await response.json();
  return data.map(item => item.word);
}

function displayWords(words) {
  console.log(words);
  const limit = 30;
  const relatedWordsDiv = document.getElementById('related-words');
  relatedWordsDiv.innerHTML = '';

  for (let i = 0; i < Math.min(words.length, limit); i++) {
    const wordElement = document.createElement('div');
    wordElement.classList.add('word');
    wordElement.innerText = words[i];
    wordElement.onclick = () => handleWordClick(words[i]);
    relatedWordsDiv.appendChild(wordElement);
  }
}

function handleWordClick(word) {
  score += 1;
  finishWord = finishWord.toLowerCase();
  console.log(`Clicked word: ${word}, Finish word: ${finishWord}`);
  if (word.toLowerCase() === finishWord) {
    document.getElementById('message').innerText = 'Congratulations! You reached the finish word.';
    document.getElementById('related-words').innerHTML = '';
    document.getElementById('word-current').classList.add('hidden');
    path.push(word);
    const elapsedMilliseconds = stopTimer();
    saveScore(elapsedMilliseconds); 
  } else {
    currentWord = word;
    path.push(word);
    updateRelatedWords();
  }
  document.getElementById('points').innerText = score;
  updatePathDisplay();
}

async function updateRelatedWords() {
  const relatedWords = await fetchRelatedWords(currentWord);
  displayWords(relatedWords);
  document.getElementById('current-word').innerText = currentWord;
}

//------------------------ PATH ------------------------

function updatePathDisplay() {
  const pathElement = document.getElementById('path');
  pathElement.innerHTML = `Path: ${path.map(word => `<span>${word}</span>`).join('<span class="arrow"> ➔ </span>')}`;
}
//------------------------ HINT ------------------------

async function showHint(word) {
  await fetchWordDescription(word);
  fetchHintWords(word)
}

async function fetchWordDescription(word) {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
  );
  const data = await response.json();
  if (
    data &&
    data.length > 0 &&
    data[0].meanings &&
    data[0].meanings[0].definitions &&
    data[0].meanings[0].definitions[0].definition
  ) {
    const description = data[0].meanings[0].definitions[0].definition;
    document.getElementById("hint").innerText = `Description: ${description}`;
    return true;
  } else {
    document.getElementById("hint").innerText = "Description not available.";
    return false;
  }
}

async function fetchHintWords(word) {
  let words = await fetchRelatedWords(word);
  words = words.slice(0, 10);
  const hintElement = document.getElementById("hint");
  const wordsHTML = words.map(word => `<span>${word}</span>`).join(", ");
  hintElement.innerHTML += `<br><br>Related words: ${wordsHTML}.`;
}

//------------------------ RESET ------------------------

function resetGame() {
  score = 0;
  const elementsToClear = [
    { id: "start-word", property: "innerText", value: '' },
    { id: "finish-word", property: "innerText", value: '' },
    { id: "current-word", property: "innerText", value: '' },
    { id: "manual-input", property: "checked", value: false },
    { id: "start-value", property: "value", value: '' },
    { id: "finish-value", property: "value", value: '' },
    { id: "related-words", property: "innerHTML", value: '' },
    { id: "path", property: "innerText", value: '' },
    { id: "message", property: "innerText", value: '' },
    { id: "points", property: "innerText", value: 0 },
    { id: "hint", property: "innerText", value: '' },
    { id: "nickname", property: "value", value: '' },
  ];

  const elementsToHide = [
    'word-start', 'word-finish', 'input-fields', 
    'reset-btn', 'path', 'word-current', 
    'path-length', 'hint', 'timer', 'blob', 'hint-btn'
  ];

  elementsToClear.forEach(item => {
    document.getElementById(item.id)[item.property] = item.value;
  });
  elementsToHide.forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });

  document.getElementById("prepare-btn").classList.remove('hidden');
  document.getElementById("scoreboard").classList.remove('hidden');
  displayScoreboard();
}

//------------------------ MISCELLANEOUS ------------------------

function showElements() {
  const elements = document.querySelectorAll('.hidden');
  elements.forEach(element => element.classList.remove('hidden'));
}

function hideElements() {
  const elementsToHide = [
    'manual-input-label', 'input-fields', 
    'start-btn', 'scoreboard', 'nickname-div', 'prepare-btn'
  ];

  elementsToHide.forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
}

//------------------------ TIMERS ------------------------

function startTimer() {
  console.log("Starting timer");
  startTime = new Date(); 
}

function stopTimer() {
  console.log("Stopping timer");
  clearInterval(liveTimerInterval);
  const finishTime = new Date(); 
  const elapsedTime = finishTime - startTime;
  document.getElementById('blob').classList.add('hidden');
  return elapsedTime;
}

function formatTime(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millisecondsPart = milliseconds % 1000;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${millisecondsPart.toString().padStart(2, '0')}`;
}

//------------------------ LIVETIMER ------------------------

function startLiveTimer() {
  console.log("Starting live timer");
  updateLiveTimer();
  liveTimerInterval = setInterval(updateLiveTimer, 1);
}

function updateLiveTimer() {
  const currentTime = new Date();
  const elapsedTime = Math.floor((currentTime - startTime));
  const formattedTime = formatTime(elapsedTime);
  document.getElementById('timer-display').innerText = formattedTime;
}

//------------------------ ALERT ------------------------

function CustomAlert(){
  let dialogoverlay = document.getElementById('dialogoverlay');
  let dialogbox = document.getElementById('dialogbox');

  if (!dialogoverlay || !dialogbox) {
    document.body.innerHTML += '<div id="dialogoverlay"></div><div id="dialogbox" class="slit-in-vertical"><div><div id="dialogboxhead"></div><div id="dialogboxbody"></div><div id="dialogboxfoot"></div></div></div>';
    dialogoverlay = document.getElementById('dialogoverlay');
    dialogbox = document.getElementById('dialogbox');
  }

  this.alert = function(score){
    let words = score.path.split(' -> ');
    let formattedPath = words.map((word, index) => {
      if (index === 0 || index === words.length - 1) {
        return `<span class="path-word bold">${word}</span>`;
      }
      return `<span class="path-word">${word}</span>`;
    }).join('<span class="arrow"> ➔ </span>');

    let title = score.nickname;
    let time = formatTime(score.time);

    let winH = window.innerHeight;
    dialogoverlay.style.height = winH + "px";

    dialogbox.style.top = "100px";

    dialogoverlay.style.display = "block";
    dialogbox.style.display = "block";

    document.getElementById('dialogboxhead').style.display = 'block';

    if (typeof title === 'undefined') {
      document.getElementById('dialogboxhead').style.display = 'none';
    } else {
      document.getElementById('dialogboxhead').innerHTML = '<i class="fa fa-exclamation-circle" aria-hidden="true"></i> ' + title + ' in: ' + time;
    }
    document.getElementById('dialogboxbody').innerHTML = `<div class="path-container">${formattedPath}</div>`;
    document.getElementById('dialogboxfoot').innerHTML = '<button class="pure-material-button-contained active" onclick="customAlert.ok()">OK</button>';

    // Focus on the dialog box
    dialogbox.focus();
    dialogbox.setAttribute("tabindex", "-1"); // Ensure it can be focused
  }

  this.ok = function(){
    dialogbox.style.display = "none";
    dialogoverlay.style.display = "none";
  }
}

let customAlert = new CustomAlert();
