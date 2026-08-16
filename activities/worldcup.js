/* 3차시 · 직업 월드컵 */
(function () {
  const JOB_DB = [
    { name: "AI 프로덕트 매니저", cat: "테크", emoji: "🤖", color: "#DBEAFE" },
    { name: "프론트엔드 개발자", cat: "테크", emoji: "💻", color: "#E0F2FE" },
    { name: "데이터 사이언티스트", cat: "테크", emoji: "📊", color: "#DBEAFE" },
    { name: "게임 기획자", cat: "콘텐츠", emoji: "🎮", color: "#EDE9FE" },
    { name: "숏폼 크리에이터", cat: "콘텐츠", emoji: "📱", color: "#FCE7F3" },
    { name: "웹툰 작가", cat: "콘텐츠", emoji: "🖌️", color: "#FFEDD5" },
    { name: "UX 디자이너", cat: "디자인", emoji: "✨", color: "#D1FAE5" },
    { name: "브랜드 디자이너", cat: "디자인", emoji: "🎨", color: "#FEF3C7" },
    { name: "콘텐츠 마케터", cat: "비즈니스", emoji: "📣", color: "#FCE7F3" },
    { name: "스타트업 창업가", cat: "비즈니스", emoji: "🚀", color: "#D1FAE5" },
    { name: "프로덕트 오너", cat: "비즈니스", emoji: "🧩", color: "#E0E7FF" },
    { name: "투자 애널리스트", cat: "비즈니스", emoji: "📈", color: "#DCFCE7" },
    { name: "의사", cat: "헬스케어", emoji: "🩺", color: "#E0F2FE" },
    { name: "임상심리사", cat: "헬스케어", emoji: "🧠", color: "#EDE9FE" },
    { name: "약사", cat: "헬스케어", emoji: "💊", color: "#D1FAE5" },
    { name: "수의사", cat: "헬스케어", emoji: "🐾", color: "#FEF3C7" },
    { name: "환경 엔지니어", cat: "사이언스", emoji: "🌱", color: "#DCFCE7" },
    { name: "우주항공 엔지니어", cat: "사이언스", emoji: "🛰️", color: "#DBEAFE" },
    { name: "생명공학 연구원", cat: "사이언스", emoji: "🧬", color: "#ECFCCB" },
    { name: "기후 데이터 분석가", cat: "사이언스", emoji: "🌍", color: "#CFFAFE" },
    { name: "교사", cat: "공공·교육", emoji: "📚", color: "#FEF3C7" },
    { name: "외교관", cat: "공공·교육", emoji: "🕊️", color: "#DBEAFE" },
    { name: "소방관", cat: "공공·교육", emoji: "🚒", color: "#FEE2E2" },
    { name: "변호사", cat: "공공·교육", emoji: "⚖️", color: "#E0E7FF" },
    { name: "패션 스타일리스트", cat: "라이프", emoji: "👗", color: "#FCE7F3" },
    { name: "호텔리어", cat: "라이프", emoji: "🏨", color: "#FFEDD5" },
    { name: "스포츠 마케터", cat: "라이프", emoji: "⚽", color: "#D1FAE5" },
    { name: "바리스타 창업가", cat: "라이프", emoji: "☕", color: "#FFEDD5" },
    { name: "영상 PD", cat: "콘텐츠", emoji: "🎬", color: "#EDE9FE" },
    { name: "로봇 공학자", cat: "테크", emoji: "🦾", color: "#E0E7FF" },
    { name: "사이버보안 전문가", cat: "테크", emoji: "🛡️", color: "#DBEAFE" },
    { name: "지속가능 컨설턴트", cat: "비즈니스", emoji: "♻️", color: "#D1FAE5" }
  ];

  const CATEGORIES = ["전체", "테크", "콘텐츠", "디자인", "비즈니스", "헬스케어", "사이언스", "공공·교육", "라이프"];
  const PICK_BG = [
    "linear-gradient(180deg,#EFF6FF,#FFFFFF)",
    "linear-gradient(180deg,#FFF7ED,#FFFFFF)",
    "linear-gradient(180deg,#ECFDF5,#FFFFFF)",
    "linear-gradient(180deg,#FDF2F8,#FFFFFF)"
  ];

  let currentJobs = [];
  let nextRoundJobs = [];
  let currentRound = 32;
  let currentMatch = 0;
  let selecting = false;
  let historyData = { r16: [], r8: [], r4: [], r2: [], winner: "", runnerUp: "", semi: [] };

  const root = document.getElementById("activity-root");
  const inputContainer = document.getElementById("wc-job-inputs");
  if (!root || !inputContainer) return;

  for (let i = 1; i <= 32; i++) {
    const meta = JOB_DB[i - 1];
    const cell = document.createElement("div");
    cell.className = "wc-job-cell";
    cell.dataset.cat = meta.cat;
    cell.innerHTML = `
      <div class="wc-job-top">
        <button type="button" class="wc-job-emoji" style="--icon-bg:${meta.color}" aria-label="${meta.name} 선택" title="눌러서 선택/해제">${meta.emoji}</button>
        <span class="wc-job-idx">${i}</span>
      </div>
      <div class="wc-job-name-row">
        <input type="text" id="job-${i}" name="job${i}" placeholder="${meta.name}" autocomplete="off" maxlength="40" />
        <span class="wc-job-cat">${meta.cat}</span>
      </div>
    `;
    inputContainer.appendChild(cell);
  }

  inputContainer.addEventListener("click", (e) => {
    const emojiBtn = e.target.closest(".wc-job-emoji");
    if (emojiBtn) {
      e.preventDefault();
      toggleJobCheck(emojiBtn.closest(".wc-job-cell"));
      return;
    }
    const nameRow = e.target.closest(".wc-job-name-row");
    if (nameRow && !e.target.matches("input")) {
      nameRow.querySelector("input")?.focus();
    }
  });

  inputContainer.addEventListener("input", () => updateFillMeter());
  updateFillMeter();

  const rail = document.getElementById("wc-category-rail");
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wc-cat" + (cat === "전체" ? " is-on" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      [...rail.children].forEach((b) => b.classList.toggle("is-on", b === btn));
      [...inputContainer.children].forEach((cell) => {
        cell.style.display = cat === "전체" || cell.dataset.cat === cat ? "" : "none";
      });
    });
    rail.appendChild(btn);
  });

  document.getElementById("wc-btn-samples")?.addEventListener("click", fillSamples);
  document.getElementById("wc-btn-shuffle")?.addEventListener("click", shuffleInputs);
  document.getElementById("wc-btn-start")?.addEventListener("click", startWorldCup);
  document.getElementById("wc-btn-reset")?.addEventListener("click", resetAll);
  document.getElementById("wc-option-a")?.addEventListener("click", () => selectOption(0));
  document.getElementById("wc-option-b")?.addEventListener("click", () => selectOption(1));

  document.addEventListener("keydown", (e) => {
    const play = document.getElementById("wc-play");
    if (!play || play.hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (
      t &&
      (t.closest?.("input, textarea, select, [contenteditable='true']") || t.isContentEditable)
    ) {
      return;
    }
    const key = String(e.key || "");
    if (key === "1" || key === "Numpad1") {
      e.preventDefault();
      selectOption(0);
      return;
    }
    if (key === "2" || key === "Numpad2") {
      e.preventDefault();
      selectOption(1);
    }
  });

  document.querySelectorAll(".wc-q textarea").forEach((el) => {
    el.addEventListener("input", () => autoGrow(el));
    autoGrow(el);
  });

  function setStep(n) {
    document.querySelectorAll(".wc-step").forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.toggle("is-active", s === n);
      el.classList.toggle("is-done", s < n);
    });
  }

  function showScreen(which) {
    const input = document.getElementById("wc-input");
    const play = document.getElementById("wc-play");
    const result = document.getElementById("wc-result");
    if (input) input.hidden = which !== "input";
    if (play) play.hidden = which !== "play";
    if (result) result.hidden = which !== "result";
    root.classList.toggle("is-wc-done", which === "result");
  }

  function toggleJobCheck(cell) {
    if (!cell) return;
    const input = cell.querySelector("input");
    if (!input) return;
    if (input.value.trim()) {
      input.value = "";
      cell.classList.remove("is-checked");
    } else {
      input.value = input.placeholder || "";
      cell.classList.add("is-checked");
    }
    updateFillMeter();
  }

  function updateFillMeter() {
    let checked = 0;
    for (let i = 1; i <= 32; i++) {
      const input = document.getElementById(`job-${i}`);
      if (!input) continue;
      const cell = input.closest(".wc-job-cell");
      const hasText = !!input.value.trim();
      cell?.classList.toggle("is-checked", hasText);
      if (hasText) checked++;
    }
    const num = document.getElementById("wc-fill-num");
    const bar = document.getElementById("wc-fill-bar");
    if (num) num.textContent = String(checked);
    if (bar) bar.style.width = `${(checked / 32) * 100}%`;
  }

  function fillSamples() {
    JOB_DB.forEach((job, idx) => {
      const input = document.getElementById(`job-${idx + 1}`);
      if (!input) return;
      const cell = input.closest(".wc-job-cell");
      input.value = job.name;
      const emoji = cell?.querySelector(".wc-job-emoji");
      if (emoji) emoji.textContent = job.emoji;
      cell?.classList.add("is-checked");
    });
    updateFillMeter();
    toast("관심 직업 예시 32개를 선택했어요");
  }

  function shuffleInputs() {
    const values = [];
    for (let i = 1; i <= 32; i++) {
      const input = document.getElementById(`job-${i}`);
      const cell = input?.closest(".wc-job-cell");
      if (!input || !cell) continue;
      values.push({
        value: input.value,
        emoji: cell.querySelector(".wc-job-emoji")?.textContent || "⭐",
        cat: cell.querySelector(".wc-job-cat")?.textContent || "",
        checked: cell.classList.contains("is-checked"),
        color: cell.querySelector(".wc-job-emoji")?.style.getPropertyValue("--icon-bg") || "#EFF6FF"
      });
    }
    shuffle(values);
    values.forEach((item, idx) => {
      const input = document.getElementById(`job-${idx + 1}`);
      const cell = input?.closest(".wc-job-cell");
      if (!input || !cell) return;
      input.value = item.value;
      const emoji = cell.querySelector(".wc-job-emoji");
      if (emoji) {
        emoji.textContent = item.emoji;
        emoji.style.setProperty("--icon-bg", item.color);
      }
      const cat = cell.querySelector(".wc-job-cat");
      if (cat) cat.textContent = item.cat;
      cell.classList.toggle("is-checked", item.checked);
    });
    updateFillMeter();
    toast("순서를 섞었어요");
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function jobMeta(name) {
    const found = JOB_DB.find((j) => j.name === name);
    if (found) return found;
    return { name, cat: "관심직업", emoji: guessEmoji(name), color: "#EFF6FF" };
  }

  function guessEmoji(name) {
    const map = [
      [/개발|코딩|소프트|엔지니어/, "💻"],
      [/AI|인공|머신/, "🤖"],
      [/디자인|UX|UI/, "✨"],
      [/의사|간호|의료/, "🩺"],
      [/교사|교육/, "📚"],
      [/법|변호/, "⚖️"],
      [/마케|광고|브랜/, "📣"],
      [/영상|PD|방송|크리에이터|유튜/, "🎬"],
      [/게임/, "🎮"],
      [/요리|바리|셰프/, "☕"],
      [/환경|기후/, "🌱"],
      [/우주|항공/, "🛰️"],
      [/보안/, "🛡️"],
      [/심리|상담/, "🧠"],
      [/패션|스타일/, "👗"],
      [/스포츠/, "⚽"],
      [/연구|과학|바이오/, "🧬"]
    ];
    for (const [re, emoji] of map) {
      if (re.test(name)) return emoji;
    }
    return "⭐";
  }

  function playerLabel() {
    const name =
      document.getElementById("sheetDisplayName")?.value.trim() ||
      document.getElementById("studentNameInput")?.value.trim() ||
      "나";
    return name;
  }

  function startWorldCup() {
    currentJobs = [];
    for (let i = 1; i <= 32; i++) {
      const input = document.getElementById(`job-${i}`);
      const val = input?.value.trim() || "";
      if (!val) {
        toast(`${i}번 직업을 입력하거나 아이콘으로 선택해 주세요`);
        input?.closest(".wc-job-cell")?.scrollIntoView({ behavior: "smooth", block: "center" });
        input?.focus();
        return;
      }
      currentJobs.push(val);
    }

    currentJobs = shuffle(currentJobs);
    nextRoundJobs = [];
    currentRound = 32;
    currentMatch = 0;
    selecting = false;
    historyData = { r16: [], r8: [], r4: [], r2: [], winner: "", runnerUp: "", semi: [] };

    const live = document.getElementById("wc-player-live");
    if (live) live.innerHTML = `<strong>${escapeHtml(playerLabel())}</strong>의 선택`;

    showScreen("play");
    setStep(2);
    renderBracketMini();
    updateMatchUI();
    toast("더 끌리는 직업을 눌러 주세요");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderBracketMini() {
    const steps = [
      { label: "32강", round: 32 },
      { label: "16강", round: 16 },
      { label: "8강", round: 8 },
      { label: "4강", round: 4 },
      { label: "결승", round: 2 }
    ];
    const host = document.getElementById("wc-bracket-mini");
    if (!host) return;
    host.innerHTML = steps
      .map((s) => {
        let cls = "wc-rf";
        if (currentRound === s.round) cls += " is-on";
        else if (currentRound < s.round) cls += " is-passed";
        return `<div class="${cls}">${s.label}</div>`;
      })
      .join("");
  }

  function updateMatchUI() {
    const totalMatches = currentRound / 2;
    const labels = { 32: "32강", 16: "16강", 8: "8강", 4: "4강", 2: "결승전" };
    const title = document.getElementById("wc-round-title");
    const progress = document.getElementById("wc-match-progress");
    const bar = document.getElementById("wc-match-bar");
    if (title) title.textContent = labels[currentRound] || `${currentRound}강`;
    if (progress) progress.textContent = `${currentMatch + 1} / ${totalMatches}`;
    const overallDone = 32 - currentRound + currentMatch;
    if (bar) bar.style.width = `${(overallDone / 31) * 100}%`;

    const a = currentJobs[currentMatch * 2];
    const b = currentJobs[currentMatch * 2 + 1];
    const ma = jobMeta(a);
    const mb = jobMeta(b);

    setText("wc-name-a", a);
    setText("wc-name-b", b);
    setText("wc-emoji-a", ma.emoji);
    setText("wc-emoji-b", mb.emoji);
    setText("wc-tag-a", ma.cat);
    setText("wc-tag-b", mb.cat);

    const cardA = document.getElementById("wc-option-a");
    const cardB = document.getElementById("wc-option-b");
    cardA?.classList.remove("is-win", "is-lose");
    cardB?.classList.remove("is-win", "is-lose");
    cardA?.style.setProperty("--pick-bg", PICK_BG[currentMatch % PICK_BG.length]);
    cardB?.style.setProperty("--pick-bg", PICK_BG[(currentMatch + 1) % PICK_BG.length]);
    renderBracketMini();
  }

  function selectOption(index) {
    if (selecting) return;
    selecting = true;

    const cardA = document.getElementById("wc-option-a");
    const cardB = document.getElementById("wc-option-b");
    (index === 0 ? cardA : cardB)?.classList.add("is-win");
    (index === 0 ? cardB : cardA)?.classList.add("is-lose");

    const selected = currentJobs[currentMatch * 2 + index];
    const loser = currentJobs[currentMatch * 2 + (1 - index)];
    nextRoundJobs.push(selected);

    setTimeout(() => {
      currentMatch++;

      if (currentMatch >= currentRound / 2) {
        if (currentRound === 32) historyData.r16 = [...nextRoundJobs];
        else if (currentRound === 16) historyData.r8 = [...nextRoundJobs];
        else if (currentRound === 8) historyData.r4 = [...nextRoundJobs];
        else if (currentRound === 4) {
          historyData.r2 = [...nextRoundJobs];
          historyData.semi = currentJobs.filter((j) => !nextRoundJobs.includes(j));
        }

        if (currentRound === 2) {
          historyData.winner = selected;
          historyData.runnerUp = loser;
          showResult();
          selecting = false;
          return;
        }

        currentJobs = [...nextRoundJobs];
        nextRoundJobs = [];
        currentRound /= 2;
        currentMatch = 0;
        toast(currentRound === 2 ? "결승입니다!" : `${currentRound}강 진출!`);
      }

      updateMatchUI();
      selecting = false;
    }, 350);
  }

  function showResult() {
    showScreen("result");
    setStep(3);

    const champ = historyData.winner;
    const meta = jobMeta(champ);
    setText("wc-winner-display", champ);
    setText("wc-winner-emoji", meta.emoji);
    setText("wc-podium-champ", champ);
    setText("wc-podium-second", historyData.runnerUp || "-");

    const semiOther = (historyData.r4 || []).find((j) => j !== champ && j !== historyData.runnerUp);
    setText("wc-podium-semi", semiOther || historyData.semi[0] || "-");

    const hint = document.getElementById("wc-competitor-hint");
    if (hint) {
      hint.textContent = historyData.runnerUp ? `(결승 상대: ${historyData.runnerUp})` : "";
    }

    const winnerInput = document.getElementById("wc-winner");
    const runnerInput = document.getElementById("wc-runner-up");
    if (winnerInput) winnerInput.value = champ || "";
    if (runnerInput) runnerInput.value = historyData.runnerUp || "";

    const blocks = [
      { title: "16강 진출", data: historyData.r16, open: false },
      { title: "8강 진출", data: historyData.r8, open: false },
      { title: "4강 진출", data: historyData.r4, open: true },
      { title: "결승 진출", data: historyData.r2, open: true },
      { title: "최종 1등", data: [historyData.winner], open: true, winner: true }
    ];

    const timeline = document.getElementById("wc-timeline");
    if (timeline) {
      timeline.innerHTML = blocks
        .map(
          (b) => `
      <details class="wc-round-panel" ${b.open ? "open" : ""}>
        <summary>
          <span>${b.title}</span>
          <span class="wc-cnt">${b.data.length}개</span>
        </summary>
        <div class="wc-chips">
          ${b.data
            .map((job) => {
              const m = jobMeta(job);
              return `<span class="wc-chip${b.winner ? " is-champ" : ""}">${m.emoji} ${escapeHtml(job)}</span>`;
            })
            .join("")}
        </div>
      </details>`
        )
        .join("");
    }

    burstConfetti();
    toast("최종 1등이 정해졌어요");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAll() {
    showScreen("input");
    ["wc-q1", "wc-q2", "wc-q3", "wc-q4"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = "";
      autoGrow(el);
    });
    const winnerInput = document.getElementById("wc-winner");
    const runnerInput = document.getElementById("wc-runner-up");
    if (winnerInput) winnerInput.value = "";
    if (runnerInput) runnerInput.value = "";
    setStep(1);
    toast("처음부터 다시 시작할 수 있어요");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function autoGrow(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(72, el.scrollHeight) + "px";
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg) {
    const el = document.getElementById("wc-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-show"), 2200);
  }

  function burstConfetti() {
    const canvas = document.getElementById("wc-confetti");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#2563EB", "#F59E0B", "#10B981", "#F43F5E", "#8B5CF6", "#FFFFFF"];
    const pieces = Array.from({ length: 110 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 200,
      r: 4 + Math.random() * 6,
      c: colors[Math.floor(Math.random() * colors.length)],
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4
    }));

    let frames = 0;
    (function frame() {
      frames++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      });
      if (frames < 150) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    })();
  }

  /** 임시저장 복원 후 체크 표시·최종 화면 동기화 */
  function applyDraftToWorldcupUi() {
    for (let i = 1; i <= 32; i++) {
      const input = document.getElementById(`job-${i}`);
      const cell = input?.closest(".wc-job-cell");
      if (!input || !cell) continue;
      const val = String(input.value || "").trim();
      if (!val) {
        cell.classList.remove("is-checked");
        continue;
      }
      const meta = jobMeta(val);
      const emoji = cell.querySelector(".wc-job-emoji");
      const cat = cell.querySelector(".wc-job-cat");
      if (emoji) {
        emoji.textContent = meta.emoji;
        emoji.style.setProperty("--icon-bg", meta.color || "#EFF6FF");
      }
      if (cat) cat.textContent = meta.cat;
      cell.dataset.cat = meta.cat;
      cell.classList.add("is-checked");
    }
    updateFillMeter();

    const winner = String(document.getElementById("wc-winner")?.value || "").trim();
    const runner = String(document.getElementById("wc-runner-up")?.value || "").trim();
    if (!winner) return;

    historyData.winner = winner;
    historyData.runnerUp = runner;
    showScreen("result");
    setStep(3);
    const meta = jobMeta(winner);
    setText("wc-winner-display", winner);
    setText("wc-winner-emoji", meta.emoji);
    setText("wc-podium-champ", winner);
    setText("wc-podium-second", runner || "-");
    setText("wc-podium-semi", "-");
    const hint = document.getElementById("wc-competitor-hint");
    if (hint) hint.textContent = runner ? `(결승 상대: ${runner})` : "";
    ["wc-q1", "wc-q2", "wc-q3", "wc-q4", "fReflect"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) autoGrow(el);
    });
  }

  window.__careerWorldcupAfterDraft = applyDraftToWorldcupUi;

  /** 체크·입력 없는 기본(직업 입력) 화면으로 맞춤 — 임시저장 복원 생략 시 */
  window.__careerWorldcupEnsurePristine = function () {
    for (let i = 1; i <= 32; i++) {
      const input = document.getElementById(`job-${i}`);
      const cell = input?.closest(".wc-job-cell");
      if (input) input.value = "";
      cell?.classList.remove("is-checked");
      const meta = JOB_DB[i - 1];
      if (meta && cell) {
        const emoji = cell.querySelector(".wc-job-emoji");
        const cat = cell.querySelector(".wc-job-cat");
        if (emoji) {
          emoji.textContent = meta.emoji;
          emoji.style.setProperty("--icon-bg", meta.color);
        }
        if (cat) cat.textContent = meta.cat;
        cell.dataset.cat = meta.cat;
      }
    }
    currentJobs = [];
    nextRoundJobs = [];
    currentRound = 32;
    currentMatch = 0;
    selecting = false;
    historyData = { r16: [], r8: [], r4: [], r2: [], winner: "", runnerUp: "", semi: [] };
    const winnerInput = document.getElementById("wc-winner");
    const runnerInput = document.getElementById("wc-runner-up");
    if (winnerInput) winnerInput.value = "";
    if (runnerInput) runnerInput.value = "";
    showScreen("input");
    setStep(1);
    updateFillMeter();
  };

  /** 교사 초기화: 직업 선택·토너먼트·결과까지 전부 처음으로 */
  window.__careerWorldcupHardReset = function () {
    window.__careerWorldcupEnsurePristine();
    ["wc-q1", "wc-q2", "wc-q3", "wc-q4", "fReflect"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = "";
      autoGrow(el);
    });
    const timeline = document.getElementById("wc-timeline");
    if (timeline) timeline.innerHTML = "";
  };
})();
