/* 3차시 · 직업 월드컵 */
(function () {
  const JOB_POOL = Array.isArray(window.YOUTH_JOB_POOL) ? window.YOUTH_JOB_POOL : [];
  const CATEGORIES = ["전체", "테크", "콘텐츠", "디자인", "비즈니스", "헬스케어", "사이언스", "공공·교육", "라이프"];
  const EMPTY_EMOJI = "✏️";
  const EMPTY_COLOR = "#F3F4F6";
  const EMPTY_CAT = "직접입력";
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
  let pickerTargetIdx = null;
  let pickerCat = "전체";
  let activeCat = "전체";
  let pickerItemsCache = [];
  let pickerShown = 0;
  let pickerSearchTimer = 0;
  const PICKER_PAGE = 72;
  const isCoarseUi = () =>
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 720;

  const root = document.getElementById("activity-root");
  const inputContainer = document.getElementById("wc-job-inputs");
  if (!root || !inputContainer) return;

  for (let i = 1; i <= 32; i++) {
    const cell = document.createElement("div");
    cell.className = "wc-job-cell";
    cell.dataset.cat = "";
    cell.dataset.idx = String(i);
    cell.innerHTML = `
      <div class="wc-job-top">
        <button type="button" class="wc-job-emoji" style="--icon-bg:${EMPTY_COLOR}" aria-label="${i}번 직업 목록에서 고르기" title="눌러서 목록에서 고르기 / 채운 칸은 비우기">${EMPTY_EMOJI}</button>
        <span class="wc-job-idx">${i}</span>
      </div>
      <div class="wc-job-name-row">
        <input type="text" id="job-${i}" name="job${i}" placeholder="관심 직업을 적어 보세요" autocomplete="off" maxlength="40" />
        <span class="wc-job-cat">${EMPTY_CAT}</span>
      </div>
    `;
    inputContainer.appendChild(cell);
  }

  ensurePickerDom();

  inputContainer.addEventListener("click", (e) => {
    const emojiBtn = e.target.closest(".wc-job-emoji");
    if (emojiBtn) {
      e.preventDefault();
      const cell = emojiBtn.closest(".wc-job-cell");
      const input = cell?.querySelector("input");
      if (!input) return;
      if (input.value.trim()) {
        clearCell(cell);
        updateFillMeter();
        toast("칸을 비웠어요 · 다시 직접 입력하거나 목록에서 고를 수 있어요");
      } else {
        openPicker(Number(cell.dataset.idx) || null);
      }
      return;
    }
    const nameRow = e.target.closest(".wc-job-name-row");
    if (nameRow && !e.target.matches("input")) {
      nameRow.querySelector("input")?.focus();
    }
  });

  inputContainer.addEventListener("input", (e) => {
    const input = e.target.closest?.("input");
    if (input) syncCellFromTyped(input);
    updateFillMeter();
  });
  updateFillMeter();

  const rail = document.getElementById("wc-category-rail");
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wc-cat" + (cat === "전체" ? " is-on" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      activeCat = cat;
      [...rail.children].forEach((b) => b.classList.toggle("is-on", b === btn));
      [...inputContainer.children].forEach((cell) => {
        const cellCat = cell.dataset.cat || "";
        if (cat === "전체") {
          cell.style.display = "";
          return;
        }
        // 빈 칸은 어떤 분야 필터에서도 보이게 (직접 채우기 유도)
        cell.style.display = !cellCat || cellCat === cat ? "" : "none";
      });
    });
    rail.appendChild(btn);
  });

  function getActiveCategory() {
    const on = rail?.querySelector(".wc-cat.is-on");
    const fromRail = String(on?.textContent || "").trim();
    if (fromRail && CATEGORIES.includes(fromRail)) return fromRail;
    return CATEGORIES.includes(activeCat) ? activeCat : "전체";
  }

  function poolForCategory(cat) {
    const scope = cat && cat !== "전체" ? cat : "전체";
    if (scope === "전체") return JOB_POOL.filter((j) => j && j.name);
    return JOB_POOL.filter((j) => j && j.name && j.cat === scope);
  }

  document.getElementById("wc-btn-fill-remain")?.addEventListener("click", fillRemainingRandom);
  document.getElementById("wc-btn-pick-list")?.addEventListener("click", () => openPicker(firstEmptyIdx()));
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

  function clearCell(cell) {
    if (!cell) return;
    const input = cell.querySelector("input");
    if (input) input.value = "";
    cell.classList.remove("is-checked");
    cell.dataset.cat = "";
    const emoji = cell.querySelector(".wc-job-emoji");
    const cat = cell.querySelector(".wc-job-cat");
    if (emoji) {
      emoji.textContent = EMPTY_EMOJI;
      emoji.style.setProperty("--icon-bg", EMPTY_COLOR);
    }
    if (cat) cat.textContent = EMPTY_CAT;
  }

  function applyJobToCell(cell, job) {
    if (!cell || !job) return;
    const input = cell.querySelector("input");
    if (!input) return;
    input.value = job.name;
    cell.classList.add("is-checked");
    cell.dataset.cat = job.cat || "";
    const emoji = cell.querySelector(".wc-job-emoji");
    const cat = cell.querySelector(".wc-job-cat");
    if (emoji) {
      emoji.textContent = job.emoji || guessEmoji(job.name);
      emoji.style.setProperty("--icon-bg", job.color || "#EFF6FF");
    }
    if (cat) cat.textContent = job.cat || EMPTY_CAT;
  }

  function syncCellFromTyped(input) {
    const cell = input.closest(".wc-job-cell");
    if (!cell) return;
    const val = input.value.trim();
    if (!val) {
      clearCell(cell);
      return;
    }
    const meta = jobMeta(val);
    cell.classList.add("is-checked");
    cell.dataset.cat = meta.cat === "관심직업" ? "" : meta.cat;
    const emoji = cell.querySelector(".wc-job-emoji");
    const cat = cell.querySelector(".wc-job-cat");
    if (emoji) {
      emoji.textContent = meta.emoji;
      emoji.style.setProperty("--icon-bg", meta.color || "#EFF6FF");
    }
    if (cat) cat.textContent = meta.cat === "관심직업" ? EMPTY_CAT : meta.cat;
  }

  function filledNamesSet() {
    const set = new Set();
    for (let i = 1; i <= 32; i++) {
      const v = document.getElementById(`job-${i}`)?.value.trim();
      if (v) set.add(v);
    }
    return set;
  }

  function emptyCells() {
    const list = [];
    for (let i = 1; i <= 32; i++) {
      const input = document.getElementById(`job-${i}`);
      if (input && !input.value.trim()) {
        list.push(input.closest(".wc-job-cell"));
      }
    }
    return list.filter(Boolean);
  }

  function firstEmptyIdx() {
    for (let i = 1; i <= 32; i++) {
      const input = document.getElementById(`job-${i}`);
      if (input && !input.value.trim()) return i;
    }
    return null;
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
    const hint = document.getElementById("wc-fill-hint");
    if (hint) {
      const remain = 32 - checked;
      hint.textContent =
        remain > 0
          ? `직접 입력 ${checked}개 · 남은 ${remain}칸은 목록에서 고르거나 랜덤으로 채울 수 있어요`
          : "32칸이 모두 채워졌어요 · 옆 짝궁과 월드컵을 시작해 보세요";
    }
  }

  function fillRemainingRandom() {
    const blanks = emptyCells();
    if (!blanks.length) {
      toast("이미 32칸이 모두 채워져 있어요");
      return;
    }
    if (!JOB_POOL.length) {
      toast("직업 목록을 불러오지 못했어요 · 페이지를 새로고침해 주세요");
      return;
    }
    const cat = getActiveCategory();
    const used = filledNamesSet();
    const scoped = poolForCategory(cat);
    const available = shuffle(scoped.filter((j) => !used.has(j.name)));
    if (!available.length) {
      toast(
        cat === "전체"
          ? "더 고를 직업이 없어요"
          : `「${cat}」분야에서 더 고를 직업이 없어요 · 상단에서 다른 분야를 골라 보세요`
      );
      return;
    }
    if (available.length < blanks.length) {
      toast(
        cat === "전체"
          ? "남은 칸보다 고를 직업이 부족해요 · 일부만 채울게요"
          : `「${cat}」분야 직업이 부족해요 · 가능한 칸만 채울게요`
      );
    }
    let filled = 0;
    blanks.forEach((cell, idx) => {
      const job = available[idx];
      if (!job) return;
      applyJobToCell(cell, job);
      filled += 1;
    });
    updateFillMeter();
    toast(
      cat === "전체"
        ? `남은 칸 ${filled}개를 랜덤 직업으로 채웠어요`
        : `「${cat}」분야에서 남은 칸 ${filled}개를 랜덤으로 채웠어요`
    );
  }

  function ensurePickerDom() {
    if (document.getElementById("wc-job-picker")) return;
    const wrap = document.createElement("div");
    wrap.id = "wc-job-picker";
    wrap.className = "wc-picker";
    wrap.hidden = true;
    wrap.innerHTML = `
      <div class="wc-picker-backdrop" data-wc-picker-close="1"></div>
      <div class="wc-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="wc-picker-title">
        <div class="wc-picker-head">
          <div>
            <strong id="wc-picker-title">청소년 관심 직업 목록</strong>
            <p id="wc-picker-sub">빈 칸에 넣을 직업을 고르세요 · ${JOB_POOL.length || "수백"}가지</p>
          </div>
          <button type="button" class="wc-picker-x" data-wc-picker-close="1" aria-label="닫기">×</button>
        </div>
        <input type="search" id="wc-picker-search" class="wc-picker-search" placeholder="직업 이름 검색" autocomplete="off" />
        <div class="wc-picker-cats" id="wc-picker-cats"></div>
        <div class="wc-picker-list" id="wc-picker-list"></div>
      </div>
    `;
    document.body.appendChild(wrap);

    const catsHost = wrap.querySelector("#wc-picker-cats");
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wc-picker-cat" + (cat === "전체" ? " is-on" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        pickerCat = cat;
        [...catsHost.children].forEach((b) => b.classList.toggle("is-on", b === btn));
        renderPickerList();
      });
      catsHost.appendChild(btn);
    });

    wrap.addEventListener("click", (e) => {
      if (e.target.closest?.("[data-wc-picker-close]")) closePicker();
    });
    const searchEl = wrap.querySelector("#wc-picker-search");
    searchEl?.addEventListener("input", () => {
      clearTimeout(pickerSearchTimer);
      pickerSearchTimer = setTimeout(() => renderPickerList(), isCoarseUi() ? 80 : 40);
    });
    const listEl = wrap.querySelector("#wc-picker-list");
    listEl?.addEventListener("click", (e) => {
      const btn = e.target.closest?.(".wc-picker-item");
      if (!btn || btn.disabled) return;
      pickJobFromList(btn.getAttribute("data-job") || "");
    });
    listEl?.addEventListener(
      "scroll",
      () => {
        if (pickerShown >= pickerItemsCache.length) return;
        const nearBottom = listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 120;
        if (nearBottom) appendPickerChunk();
      },
      { passive: true }
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !wrap.hidden) closePicker();
    });
  }

  function pickJobFromList(name) {
    const job = JOB_POOL.find((j) => j.name === name);
    if (!job) return;
    let idx = pickerTargetIdx;
    if (!idx || document.getElementById(`job-${idx}`)?.value.trim()) {
      idx = firstEmptyIdx();
    }
    if (!idx) {
      toast("빈 칸이 없어요 · 먼저 칸을 비우거나 직접 수정해 주세요");
      return;
    }
    const cell = document.getElementById(`job-${idx}`)?.closest(".wc-job-cell");
    applyJobToCell(cell, job);
    updateFillMeter();
    const next = firstEmptyIdx();
    if (next) {
      pickerTargetIdx = next;
      renderPickerList();
      toast(`${idx}번에 「${job.name}」을(를) 넣었어요`);
    } else {
      closePicker();
      toast("32칸이 모두 채워졌어요");
    }
  }

  function openPicker(targetIdx) {
    ensurePickerDom();
    const wrap = document.getElementById("wc-job-picker");
    if (!wrap) return;
    if (!JOB_POOL.length) {
      toast("직업 목록을 불러오지 못했어요 · 페이지를 새로고침해 주세요");
      return;
    }
    pickerTargetIdx = targetIdx || firstEmptyIdx();
    const railCat = getActiveCategory();
    pickerCat = CATEGORIES.includes(railCat) ? railCat : "전체";
    const scopedCount = poolForCategory(pickerCat).length;
    const sub = document.getElementById("wc-picker-sub");
    if (sub) {
      const scopeHint =
        pickerCat === "전체" ? `${JOB_POOL.length}가지` : `「${pickerCat}」 ${scopedCount}가지`;
      sub.textContent = pickerTargetIdx
        ? `${pickerTargetIdx}번 칸에 넣을 직업을 고르세요 · ${scopeHint}`
        : `이미 32칸이 찼어요 · 직업을 고르면 첫 칸부터 교체할 수 있어요`;
    }
    const search = document.getElementById("wc-picker-search");
    if (search) search.value = "";
    document.querySelectorAll(".wc-picker-cat").forEach((b) => {
      b.classList.toggle("is-on", String(b.textContent || "").trim() === pickerCat);
    });
    renderPickerList();
    wrap.hidden = false;
    document.body.classList.add("wc-picker-open");
    if (!isCoarseUi()) setTimeout(() => search?.focus(), 40);
  }

  function closePicker() {
    const wrap = document.getElementById("wc-job-picker");
    if (wrap) wrap.hidden = true;
    document.body.classList.remove("wc-picker-open");
    pickerTargetIdx = null;
  }

  function renderPickerList() {
    const host = document.getElementById("wc-picker-list");
    const search = document.getElementById("wc-picker-search");
    if (!host) return;
    const q = String(search?.value || "")
      .trim()
      .toLowerCase();
    const used = filledNamesSet();
    pickerItemsCache = poolForCategory(pickerCat).filter((j) => {
      if (q && !String(j.name).toLowerCase().includes(q)) return false;
      return true;
    });
    if (!pickerItemsCache.length) {
      pickerShown = 0;
      host.innerHTML = `<p class="wc-picker-empty">조건에 맞는 직업이 없어요</p>`;
      return;
    }
    const sub = document.getElementById("wc-picker-sub");
    if (sub && pickerTargetIdx) {
      const scopeHint =
        pickerCat === "전체"
          ? `전체 ${pickerItemsCache.length}가지`
          : `「${pickerCat}」 ${pickerItemsCache.length}가지`;
      sub.textContent = `${pickerTargetIdx}번 칸에 넣을 직업을 고르세요 · ${scopeHint}${
        q ? " (검색 결과)" : ""
      }`;
    }
    pickerShown = 0;
    host.innerHTML = "";
    appendPickerChunk(used);
  }

  function appendPickerChunk(usedSet) {
    const host = document.getElementById("wc-picker-list");
    if (!host || !pickerItemsCache.length) return;
    const used = usedSet || filledNamesSet();
    const next = Math.min(pickerShown + PICKER_PAGE, pickerItemsCache.length);
    const frag = document.createDocumentFragment();
    const tmp = document.createElement("div");
    tmp.innerHTML = pickerItemsCache
      .slice(pickerShown, next)
      .map((j) => {
        const taken = used.has(j.name);
        return `<button type="button" class="wc-picker-item${taken ? " is-taken" : ""}" data-job="${escapeHtml(j.name)}">
          <span class="wc-picker-emoji" style="background:${j.color || "#EFF6FF"}">${j.emoji || "⭐"}</span>
          <span class="wc-picker-name">${escapeHtml(j.name)}</span>
          <span class="wc-picker-tag">${escapeHtml(j.cat || "")}</span>
          ${taken ? '<span class="wc-picker-taken">이미 입력</span>' : ""}
        </button>`;
      })
      .join("");
    while (tmp.firstChild) frag.appendChild(tmp.firstChild);
    host.querySelector(".wc-picker-more")?.remove();
    host.appendChild(frag);
    pickerShown = next;
    if (pickerShown < pickerItemsCache.length) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "wc-picker-more";
      more.textContent = `더 보기 · ${pickerItemsCache.length - pickerShown}개 남음`;
      more.addEventListener("click", () => appendPickerChunk());
      host.appendChild(more);
    }
  }

  function shuffleInputs() {
    const values = [];
    for (let i = 1; i <= 32; i++) {
      const input = document.getElementById(`job-${i}`);
      const cell = input?.closest(".wc-job-cell");
      if (!input || !cell) continue;
      values.push({
        value: input.value,
        emoji: cell.querySelector(".wc-job-emoji")?.textContent || EMPTY_EMOJI,
        cat: cell.querySelector(".wc-job-cat")?.textContent || EMPTY_CAT,
        dataCat: cell.dataset.cat || "",
        checked: cell.classList.contains("is-checked"),
        color: cell.querySelector(".wc-job-emoji")?.style.getPropertyValue("--icon-bg") || EMPTY_COLOR
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
      cell.dataset.cat = item.dataCat;
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
    const found = JOB_POOL.find((j) => j.name === name);
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
        toast(`${i}번이 비어 있어요 · 직접 적거나 ‘남은 칸 랜덤 채우기’를 눌러 주세요`);
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
    toast("더 끌리는 직업을 눌러 주세요 · 옆 짝궁과 이야기하며 진행해 보세요");
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
    }, isCoarseUi() ? 140 : 280);
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
    toast("최종 1등이 정해졌어요 · 우승 직업을 중심으로 시야를 넓혀 보세요");
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
    const mobile = isCoarseUi();
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#2563EB", "#F59E0B", "#10B981", "#F43F5E", "#8B5CF6", "#FFFFFF"];
    const pieces = Array.from({ length: mobile ? 36 : 110 }, () => ({
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
    const maxFrames = mobile ? 70 : 150;
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
      if (frames < maxFrames) requestAnimationFrame(frame);
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
        clearCell(cell);
        continue;
      }
      const meta = jobMeta(val);
      applyJobToCell(cell, meta);
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
      const cell = document.getElementById(`job-${i}`)?.closest(".wc-job-cell");
      clearCell(cell);
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
