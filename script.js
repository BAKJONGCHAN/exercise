const canvas = document.getElementById("track");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.getElementById("score"),
  correctCount: document.getElementById("correct-count"),
  lives: document.getElementById("lives"),
  speed: document.getElementById("speed"),
  quizModal: document.getElementById("quiz-modal"),
  quizQuestion: document.getElementById("quiz-question"),
  quizOptions: document.getElementById("quiz-options"),
  quizFeedback: document.getElementById("quiz-feedback"),
  nextQuiz: document.getElementById("next-quiz"),
  resultBoard: document.getElementById("result-board"),
  resultSummary: document.getElementById("result-summary"),
  resultTitle: document.getElementById("result-title"),
  resultQuestion: document.getElementById("result-question"),
  resultAnswer: document.getElementById("result-answer"),
  resultExplanation: document.getElementById("result-explanation"),
  resultPage: document.getElementById("result-page"),
  prevResult: document.getElementById("prev-result"),
  nextResult: document.getElementById("next-result"),
  restart: document.getElementById("restart"),
};

const questions = [
  {
    q: "f(x)=x²-4x+3의 꼭짓점 좌표는?",
    options: ["(2, -1)", "(-2, 1)", "(4, 3)", "(1, -2)"],
    answer: 0,
    explanation: "x=-b/2a=4/2=2, f(2)=4-8+3=-1 이므로 꼭짓점은 (2,-1).",
  },
  {
    q: "y=-2(x-1)²+8의 최댓값은?",
    options: ["8", "-8", "1", "2"],
    answer: 0,
    explanation: "꼭짓점형이며 a<0 이므로 아래로 열린다. 꼭짓점 y값 8이 최댓값.",
  },
  {
    q: "x²-5x+6=0의 두 근의 합은?",
    options: ["6", "5", "-5", "-6"],
    answer: 1,
    explanation: "근의 합은 -b/a = -(-5)/1=5.",
  },
  {
    q: "f(x)=2x²+4x+1의 축의 방정식은?",
    options: ["x=-1", "x=1", "x=-2", "x=2"],
    answer: 0,
    explanation: "축은 x=-b/2a=-4/4=-1.",
  },
  {
    q: "x²+2x-3=0의 해는?",
    options: ["x=1,-3", "x=3,-1", "x=-1,3", "x=-3,-1"],
    answer: 0,
    explanation: "(x+3)(x-1)=0 이므로 해는 1, -3.",
  },
  {
    q: "f(x)=-(x+2)²+5일 때 f(-2)는?",
    options: ["5", "-5", "0", "2"],
    answer: 0,
    explanation: "x=-2를 대입하면 -(0)^2+5=5.",
  },
];

const state = {
  player: { x: canvas.width / 2 - 16, y: canvas.height - 70, w: 32, h: 56, speed: 6 },
  keys: { left: false, right: false },
  obstacles: [],
  gems: [],
  score: 0,
  speed: 1,
  lives: 3,
  correct: 0,
  running: true,
  inQuiz: false,
  asked: new Set(),
  results: [],
  currentQuestion: null,
  page: 0,
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnObstacle() {
  if (Math.random() < 0.03 + state.speed * 0.003) {
    state.obstacles.push({ x: rand(10, canvas.width - 42), y: -30, w: 30, h: 40, vy: 3 + state.speed });
  }
}

function spawnGem() {
  if (Math.random() < 0.008 && !state.inQuiz) {
    state.gems.push({ x: rand(18, canvas.width - 28), y: -20, size: 16, vy: 2.6 + state.speed * 0.8 });
  }
}

function collides(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawTrack() {
  ctx.fillStyle = "#343954";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.setLineDash([20, 18]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlayer() {
  const p = state.player;
  ctx.fillStyle = "#77d4ff";
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = "#1b1f35";
  ctx.fillRect(p.x + 4, p.y + 6, p.w - 8, 16);
}

function drawObstacle(o) {
  ctx.fillStyle = "#ff6f88";
  ctx.fillRect(o.x, o.y, o.w, o.h);
}

function drawGem(g) {
  ctx.fillStyle = "#9af77a";
  ctx.beginPath();
  ctx.moveTo(g.x + g.size / 2, g.y);
  ctx.lineTo(g.x + g.size, g.y + g.size / 2);
  ctx.lineTo(g.x + g.size / 2, g.y + g.size);
  ctx.lineTo(g.x, g.y + g.size / 2);
  ctx.closePath();
  ctx.fill();
}

function pickQuestion() {
  if (state.asked.size === questions.length) state.asked.clear();
  let idx;
  do idx = Math.floor(Math.random() * questions.length);
  while (state.asked.has(idx));
  state.asked.add(idx);
  return { ...questions[idx], idx };
}

function openQuiz() {
  state.inQuiz = true;
  state.running = false;
  state.currentQuestion = pickQuestion();

  const q = state.currentQuestion;
  ui.quizQuestion.textContent = q.q;
  ui.quizFeedback.textContent = "";
  ui.quizFeedback.className = "feedback";
  ui.nextQuiz.classList.add("hidden");
  ui.quizOptions.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${i + 1}. ${opt}`;
    btn.onclick = () => answerQuiz(i);
    ui.quizOptions.appendChild(btn);
  });

  ui.quizModal.classList.remove("hidden");
}

function answerQuiz(choice) {
  const q = state.currentQuestion;
  const correct = choice === q.answer;

  [...ui.quizOptions.children].forEach((btn) => (btn.disabled = true));

  if (correct) {
    state.correct += 1;
    state.score += 120;
    ui.quizFeedback.textContent = "정답! 멋져요 🚗💨";
    ui.quizFeedback.className = "feedback good";
  } else {
    state.lives -= 1;
    ui.quizFeedback.textContent = `오답! 정답은 ${q.options[q.answer]} 입니다.`;
    ui.quizFeedback.className = "feedback bad";
  }

  state.results.push({
    question: q.q,
    chosen: q.options[choice],
    correctAnswer: q.options[q.answer],
    ok: correct,
    explanation: q.explanation,
  });

  updateHud();
  ui.nextQuiz.classList.remove("hidden");
}

function closeQuizAndContinue() {
  ui.quizModal.classList.add("hidden");
  state.inQuiz = false;

  if (state.correct >= 4 || state.lives <= 0) {
    finishRace();
    return;
  }

  state.running = true;
}

function finishRace() {
  state.running = false;
  ui.quizModal.classList.add("hidden");
  ui.resultBoard.classList.remove("hidden");

  const clear = state.correct >= 4;
  ui.resultSummary.textContent = clear
    ? `축하합니다! 4문제를 맞춰 완주했습니다. (점수 ${state.score})`
    : `아쉽지만 생명이 모두 소진되었습니다. (정답 ${state.correct}개, 점수 ${state.score})`;

  state.page = 0;
  renderResultPage();
}

function renderResultPage() {
  if (state.results.length === 0) {
    ui.resultTitle.textContent = "풀이 기록 없음";
    ui.resultQuestion.textContent = "아직 퀴즈 기록이 없습니다.";
    ui.resultAnswer.textContent = "";
    ui.resultExplanation.textContent = "";
    ui.resultPage.textContent = "0 / 0";
    return;
  }

  const item = state.results[state.page];
  ui.resultTitle.textContent = item.ok ? "✅ 정답한 문제" : "❌ 틀린 문제";
  ui.resultQuestion.textContent = `문제: ${item.question}`;
  ui.resultAnswer.textContent = `내 답: ${item.chosen} | 정답: ${item.correctAnswer}`;
  ui.resultExplanation.textContent = `풀이: ${item.explanation}`;
  ui.resultPage.textContent = `${state.page + 1} / ${state.results.length}`;

  ui.prevResult.disabled = state.page === 0;
  ui.nextResult.disabled = state.page === state.results.length - 1;
}

function updateHud() {
  ui.score.textContent = state.score;
  ui.correctCount.textContent = state.correct;
  ui.lives.textContent = state.lives;
  ui.speed.textContent = state.speed.toFixed(1);
}

function updateGame() {
  if (!state.running) return;

  const p = state.player;
  if (state.keys.left) p.x -= p.speed;
  if (state.keys.right) p.x += p.speed;
  p.x = Math.max(8, Math.min(canvas.width - p.w - 8, p.x));

  spawnObstacle();
  spawnGem();

  state.obstacles.forEach((o) => (o.y += o.vy));
  state.gems.forEach((g) => (g.y += g.vy));

  state.obstacles = state.obstacles.filter((o) => o.y < canvas.height + 50);
  state.gems = state.gems.filter((g) => g.y < canvas.height + 30);

  for (const o of state.obstacles) {
    if (collides(p, o)) {
      state.lives -= 1;
      o.y = canvas.height + 100;
      if (state.lives <= 0) {
        finishRace();
        return;
      }
    }
  }

  for (const g of state.gems) {
    const gemRect = { x: g.x, y: g.y, w: g.size, h: g.size };
    if (collides(p, gemRect)) {
      g.y = canvas.height + 50;
      state.score += 40;
      openQuiz();
      return;
    }
  }

  state.score += 1;
  state.speed = Math.min(6, 1 + state.score / 800);
  updateHud();
}

function renderGame() {
  drawTrack();
  drawPlayer();
  state.obstacles.forEach(drawObstacle);
  state.gems.forEach(drawGem);
}

function loop() {
  updateGame();
  renderGame();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") state.keys.left = true;
  if (e.key === "ArrowRight") state.keys.right = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") state.keys.left = false;
  if (e.key === "ArrowRight") state.keys.right = false;
});

ui.nextQuiz.addEventListener("click", closeQuizAndContinue);
ui.prevResult.addEventListener("click", () => {
  if (state.page > 0) {
    state.page -= 1;
    renderResultPage();
  }
});
ui.nextResult.addEventListener("click", () => {
  if (state.page < state.results.length - 1) {
    state.page += 1;
    renderResultPage();
  }
});
ui.restart.addEventListener("click", () => window.location.reload());

updateHud();
loop();
