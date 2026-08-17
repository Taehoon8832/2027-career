(() => {
  const CONFIG = {
    SUPABASE_URL: "https://wdpohasgttifsxjqblhf.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_JDkkbUVPruBg33cvLEh11A_ipF3VPCv"
  };

  const sessionNo = Number(window.ACTIVITY_SESSION || 0);
  if (!sessionNo || sessionNo < 1 || sessionNo > 30) {
    console.error("ACTIVITY_SESSION 이 올바르지 않습니다.");
    return;
  }

  /** 활동지 인쇄 기본 형식 (브라우저가 자동 지정 불가 → 대화상자에서 선택) */
  const ACTIVITY_PRINT_DEFAULTS = {
    color: "컬러",
    duplex: "양면",
    pagesPerSheet: 2,
    label() {
      return `${this.color} · ${this.duplex} · 시트당 페이지 수 ${this.pagesPerSheet}개`;
    },
    /** 인쇄 직전 안내 (시트당 페이지 수는 OS/브라우저 대화상자에서만 변경 가능) */
    guide() {
      return `인쇄 기본: ${this.label()} — 「설정 더보기」에서 시트당 페이지 수를 ${this.pagesPerSheet}로 바꿔 주세요`;
    }
  };

  const sb =
    window.supabase &&
    window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

  function prefillCodeFromUrl() {
    try {
      const code = new URLSearchParams(location.search).get("code");
      if (code) {
        const input = document.getElementById("submitCodeInput");
        if (input) input.value = String(code).trim().toUpperCase();
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * 학생이 스캔할 활동지 주소.
   * about:blank / blob 에서는 QR을 만들지 않음.
   * 경로를 다시 조립하면 file:// · 한글 폴더명에서 ERR_FILE_NOT_FOUND 가 난다.
   */
  function activityPageUrl() {
    try {
      const u = new URL(location.href);
      if (u.protocol === "blob:" || u.protocol === "about:" || u.href === "about:blank") {
        return "";
      }
      u.hash = "";
      // 캐시용 파라미터는 QR에서 제거
      u.searchParams.delete("_");
      u.searchParams.delete("v");
      const code = (u.searchParams.get("code") || "").trim().toUpperCase();
      if (code) u.searchParams.set("code", code);
      return u.href;
    } catch {
      const raw = String(location.href || "").split("#")[0];
      if (!raw || raw.startsWith("about:") || raw.startsWith("blob:")) return "";
      return raw;
    }
  }

  function loadQrLib() {
    if (typeof window.QRCode === "function") {
      return Promise.resolve(window.QRCode);
    }
    return new Promise((resolve) => {
      const existing = document.querySelector("script[data-qrcode-lib]");
      if (existing) {
        existing.addEventListener("load", () =>
          resolve(typeof window.QRCode === "function" ? window.QRCode : null)
        );
        existing.addEventListener("error", () => resolve(null));
        setTimeout(() => resolve(typeof window.QRCode === "function" ? window.QRCode : null), 800);
        return;
      }
      const s = document.createElement("script");
      s.src = "../vendor/qrcode.min.js";
      s.async = true;
      s.dataset.qrcodeLib = "1";
      s.onload = () => resolve(typeof window.QRCode === "function" ? window.QRCode : null);
      s.onerror = () => {
        // CDN 백업
        const s2 = document.createElement("script");
        s2.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
        s2.onload = () => resolve(typeof window.QRCode === "function" ? window.QRCode : null);
        s2.onerror = () => resolve(null);
        document.head.appendChild(s2);
      };
      document.head.appendChild(s);
    });
  }

  /** 스트로크 없이 fill만 — 카메라 스캔용 선명 QR */
  function paintScannableQr(el, text, displaySize) {
    if (!el || !text || typeof window.QRCode !== "function") return false;
    const url = String(text).trim();
    if (!url) return false;

    const boxPx = Math.max(100, Number(displaySize) || 108);
    const pad = 7;
    const quiet = 2;
    const avail = Math.max(86, boxPx - pad * 2);

    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:fixed;left:-9999px;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none";
    document.body.appendChild(host);

    try {
      const qr = new window.QRCode(host, {
        text: url,
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.L
      });
      const code = qr._oQRCode;
      if (!code || typeof code.getModuleCount !== "function") throw new Error("no modules");
      const n = code.getModuleCount();
      const modulePx = Math.max(3, Math.floor(avail / (n + quiet * 2)));
      const canvasSize = modulePx * (n + quiet * 2);
      const canvas = document.createElement("canvas");
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      canvas.setAttribute("aria-label", "활동지 QR");
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = "#000000";
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (code.isDark(r, c)) {
            ctx.fillRect((c + quiet) * modulePx, (r + quiet) * modulePx, modulePx, modulePx);
          }
        }
      }
      if (el.tagName === "A") {
        el.href = url;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }
      el.innerHTML = "";
      el.title = "QR 스캔 시 이 활동지로 이동합니다";
      el.setAttribute("aria-label", "활동지 QR — 스캔하면 활동지 열림");
      el.dataset.qrUrl = url;
      el.dataset.painted = "1";
      canvas.className = "qr-img";
      canvas.style.cssText =
        "display:block;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges";
      el.appendChild(canvas);
      try {
        qr.clear();
      } catch {
        /* ignore */
      }
      return true;
    } catch (e) {
      console.warn("paintScannableQr failed", e);
      return false;
    } finally {
      host.remove();
    }
  }

  function paintQrInto(el, text, size) {
    if (!el || !text) return;
    const displayPx = Math.max(100, Number(size) || 108);
    const url = String(text).trim();
    if (!url || url.startsWith("about:") || url.startsWith("blob:")) return;
    if (el.tagName === "A") {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    }
    el.title = "QR 스캔 시 이 활동지로 이동합니다";
    el.setAttribute("aria-label", "활동지 QR — 스캔하면 활동지 열림");
    el.dataset.qrUrl = url;

    if (paintScannableQr(el, url, displayPx)) {
      if (el.tagName === "A") el.href = url;
      return;
    }

    loadQrLib().then(() => {
      if (!paintScannableQr(el, url, displayPx)) {
        el.textContent = "QR";
      } else if (el.tagName === "A") {
        el.href = url;
      }
    });
  }

  function isQrLightboxOpen() {
    return !!document.getElementById("qrLightbox")?.classList.contains("is-open");
  }

  function closeQrLightbox() {
    const box = document.getElementById("qrLightbox");
    if (!box) return;
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.classList.remove("qr-lightbox-open");
  }

  function openQrLightbox() {
    const url =
      document.getElementById("activityPageQr")?.dataset?.qrUrl || activityPageUrl();
    if (!url) return;

    let box = document.getElementById("qrLightbox");
    if (!box) {
      box = document.createElement("div");
      box.id = "qrLightbox";
      box.className = "qr-lightbox";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.setAttribute("aria-label", "확대된 활동지 QR");
      box.innerHTML = `
        <button type="button" class="qr-lightbox-panel" aria-label="QR 닫기">
          <div class="qr-lightbox-code" id="qrLightboxCode"></div>
          <span class="qr-lightbox-hint">다시 누르면 닫힙니다</span>
        </button>`;
      document.body.appendChild(box);
      box.addEventListener("click", (e) => {
        if (e.target === box || e.target.closest(".qr-lightbox-panel")) {
          e.preventDefault();
          closeQrLightbox();
        }
      });
    }

    const host = document.getElementById("qrLightboxCode");
    if (host) {
      host.innerHTML = "";
      const size = Math.min(360, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.62));
      paintQrInto(host, url, size);
    }

    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.classList.add("qr-lightbox-open");
  }

  function toggleQrLightbox(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isQrLightboxOpen()) closeQrLightbox();
    else openQrLightbox();
  }

  function bindQrLightboxControls(wrap, el) {
    if (!wrap || wrap.dataset.qrLightboxBound === "1") return;
    wrap.dataset.qrLightboxBound = "1";

    let cap = wrap.querySelector(".hero-qr-cap");
    if (cap && cap.tagName !== "BUTTON") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hero-qr-cap";
      btn.textContent = "크게 보기";
      btn.setAttribute("aria-label", "QR 코드 크게 보기");
      cap.replaceWith(btn);
      cap = btn;
    } else if (cap) {
      cap.textContent = "크게 보기";
      cap.setAttribute("aria-label", "QR 코드 크게 보기");
    }

    // QR 클릭은 크게 보기(스캔 데이터는 활동지 URL 유지)
    el?.addEventListener("click", toggleQrLightbox);
    cap?.addEventListener("click", toggleQrLightbox);

    if (!document.documentElement.dataset.qrLightboxEsc) {
      document.documentElement.dataset.qrLightboxEsc = "1";
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isQrLightboxOpen()) closeQrLightbox();
      });
    }
  }

  function formatCodeWithWineDigits(code) {
    const raw = String(code || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    if (!raw || raw === "—") return raw || "—";
    return raw.replace(/[0-9]/g, (d) => `<span class="code-digit">${d}</span>`);
  }

  function ensureHeroCode(hero) {
    if (!hero) return;
    let side = hero.querySelector(".hero-side");
    let wrap = hero.querySelector(".hero-qr-wrap");
    if (!side) {
      side = document.createElement("div");
      side.className = "hero-side";
      if (wrap) {
        wrap.replaceWith(side);
        side.appendChild(wrap);
      } else {
        hero.appendChild(side);
      }
    } else if (wrap && wrap.parentElement !== side) {
      side.appendChild(wrap);
    }

    let codeEl = side.querySelector(".hero-code") || document.getElementById("heroCodeNo");
    if (!codeEl) {
      codeEl = document.createElement("div");
      codeEl.className = "hero-code";
      codeEl.id = "heroCodeNo";
      side.insertBefore(codeEl, side.firstChild);
    }
    codeEl.innerHTML =
      `<span class="hero-code-text">(코드번호: <strong class="hero-code-value" id="heroCodeValue">—</strong>)</span>`;

    let code = "";
    try {
      code = (new URLSearchParams(location.search).get("code") || "").trim().toUpperCase();
    } catch {
      code = "";
    }
    if (!code) {
      const input = document.getElementById("submitCodeInput");
      code = (input?.value || "").trim().toUpperCase();
    }
    const valueEl = codeEl.querySelector(".hero-code-value") || document.getElementById("heroCodeValue");
    if (valueEl) valueEl.innerHTML = formatCodeWithWineDigits(code || "—");
    codeEl.hidden = false;
    codeEl.setAttribute("aria-label", code ? `코드번호 ${code}` : "코드번호 없음");

    if (document.documentElement.dataset.heroCodeBound !== "1") {
      document.documentElement.dataset.heroCodeBound = "1";
      document.addEventListener("input", (e) => {
        if (e.target?.id === "submitCodeInput") ensureHeroCode(document.querySelector(".hero-card"));
      });
      document.addEventListener("change", (e) => {
        if (e.target?.id === "submitCodeInput") ensureHeroCode(document.querySelector(".hero-card"));
      });
    }
  }

  function ensureHeroQr() {
    const hero = document.querySelector(".hero-card");
    if (!hero) return;

    if (!hero.querySelector(".hero-copy")) {
      const copy = document.createElement("div");
      copy.className = "hero-copy";
      while (hero.firstChild) copy.appendChild(hero.firstChild);
      hero.appendChild(copy);
    }

    let wrap = hero.querySelector(".hero-qr-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "hero-qr-wrap";
      wrap.innerHTML =
        `<a class="hero-qr" id="activityPageQr" href="#" rel="noopener noreferrer" aria-label="활동지 QR — 눌러서 크게 보기"></a>` +
        `<button type="button" class="hero-qr-cap">눌러서 열기</button>`;
      hero.appendChild(wrap);
    }

    ensureHeroCode(hero);
    wrap = hero.querySelector(".hero-qr-wrap");

    let el = document.getElementById("activityPageQr") || wrap?.querySelector(".hero-qr");
    if (!el) return;

    const url = activityPageUrl();
    if (!url) {
      if (el) {
        el.removeAttribute("href");
        el.title = "웹 주소(https)로 연 활동지에서만 QR을 사용할 수 있습니다";
        el.textContent = "QR";
      }
      return;
    }

    if (el.tagName !== "A") {
      const a = document.createElement("a");
      a.id = el.id || "activityPageQr";
      a.className = el.className || "hero-qr";
      a.setAttribute("aria-label", "활동지 QR — 스캔하면 활동지 열림");
      el.replaceWith(a);
      el = a;
    }

    el.href = url;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    bindQrLightboxControls(wrap, el);

    if (el.dataset.painted === "1" && el.dataset.qrUrl === url && el.querySelector("canvas")) {
      return;
    }

    const size = window.matchMedia("(max-width: 720px)").matches
      ? 128
      : window.matchMedia("(max-width: 1024px)").matches
        ? 112
        : 104;
    paintQrInto(el, url, size);
  }

  function stripSheetIdentityFields() {
    document
      .querySelectorAll(
        [
          ".control-panel",
          ".control-bar",
          ".action-bar",
          ".btn-pdf",
          ".profile-info",
          ".na-manual-info",
          ".na-info-box",
          ".na-manual .student-info",
          "#studentId",
          "#studentName"
        ].join(", ")
      )
      .forEach((el) => el.remove());
  }

  function readSheetIdentity() {
    return {
      studentNo: (document.getElementById("sheetHakbun")?.value || "").trim(),
      studentName: (document.getElementById("sheetDisplayName")?.value || "").trim()
    };
  }

  function sanitizeFilePart(s, fallback) {
    const t = String(s || "")
      .replace(/[\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, "")
      .trim();
    return t || fallback || "미입력";
  }

  function captureQrDataUrl() {
    const canvas = document.querySelector("#activityPageQr canvas");
    if (canvas && canvas.toDataURL) {
      try {
        return canvas.toDataURL("image/png");
      } catch {
        /* ignore */
      }
    }
    return "";
  }

  function lessonTitleText() {
    return (
      document.querySelector(".hero-card h1")?.textContent?.trim() ||
      `${sessionNo}차시 활동지`
    );
  }

  function syncPrintLessonTitle() {
    const el = document.querySelector("#sheetIdentity .print-lesson-title");
    if (el) el.textContent = lessonTitleText();
  }

  function ensureSheetIdentity() {
    const root = document.getElementById("activity-root");
    if (!root) return;
    if (document.getElementById("sheetIdentity")) {
      syncPrintLessonTitle();
      return;
    }

    let titleEl = root.querySelector(":scope > h2");
    if (titleEl) titleEl.remove();
    else {
      titleEl = document.createElement("h2");
      titleEl.textContent = "학생 활동지";
    }

    const bar = document.createElement("div");
    bar.className = "activity-sheet-bar";
    bar.id = "sheetIdentity";

    const left = document.createElement("div");
    left.className = "activity-sheet-bar-left";

    const lesson = document.createElement("p");
    lesson.className = "print-lesson-title";
    lesson.setAttribute("aria-hidden", "true");
    lesson.textContent = lessonTitleText();
    left.appendChild(lesson);
    bar.appendChild(left);

    const titleWrap = document.createElement("div");
    titleWrap.className = "activity-sheet-bar-title";
    titleWrap.appendChild(titleEl);
    bar.appendChild(titleWrap);

    const idWrap = document.createElement("div");
    idWrap.className = "sheet-identity";
    idWrap.innerHTML = `
      <label for="sheetHakbun"><span>학번</span>
        <input id="sheetHakbun" name="sheetHakbun" type="text" inputmode="numeric" autocomplete="off" placeholder="10101" maxlength="8" />
      </label>
      <label for="sheetDisplayName"><span>이름</span>
        <input id="sheetDisplayName" name="sheetDisplayName" type="text" autocomplete="name" placeholder="홍길동" maxlength="20" />
      </label>`;
    bar.appendChild(idWrap);
    root.insertBefore(bar, root.firstChild);
  }

  function getDepartmentFromUrl() {
    try {
      return (new URLSearchParams(location.search).get("dept") || "").trim();
    } catch {
      return "";
    }
  }

  function paintSheetDepartment(name) {
    const dept = String(name || "").trim();
    let el = document.getElementById("sheetDept");
    const row = document.getElementById("sheetDeptRow");
    if (!dept) {
      if (el) {
        el.hidden = true;
        el.textContent = "";
      }
      if (row) row.hidden = true;
      return;
    }
    if (!el) {
      el = document.createElement("span");
      el.id = "sheetDept";
      el.className = "sheet-dept";
      el.setAttribute("aria-label", "학과");
    }
    // 상단 바 왼쪽(학생 활동지 제목 왼쪽)
    ensureSheetIdentity();
    const bar = document.getElementById("sheetIdentity");
    if (row) row.remove();
    if (bar) {
      let left = bar.querySelector(".activity-sheet-bar-left");
      if (!left) {
        left = document.createElement("div");
        left.className = "activity-sheet-bar-left";
        const lesson = bar.querySelector(".print-lesson-title");
        bar.insertBefore(left, bar.firstChild);
        if (lesson) left.appendChild(lesson);
      }
      if (el.parentElement !== left) {
        left.insertBefore(el, left.firstChild);
      } else if (left.firstChild !== el) {
        left.insertBefore(el, left.firstChild);
      }
    } else {
      const root = document.getElementById("activity-root");
      if (!root) return;
      const wrap = document.createElement("div");
      wrap.className = "sheet-dept-row";
      wrap.id = "sheetDeptRow";
      wrap.appendChild(el);
      root.insertBefore(wrap, root.firstChild);
    }
    el.textContent = dept;
    el.hidden = false;
    el.title = `학과: ${dept}`;
  }

  async function resolveSheetDepartment() {
    const fromUrl = getDepartmentFromUrl();
    if (fromUrl) paintSheetDepartment(fromUrl);
    const code = getSubmitCodeFromPage();
    if (!sb || !code) return;
    try {
      const { data, error } = await sb.rpc("get_lesson_class_meta", {
        p_submit_code: code,
        p_session_no: sessionNo
      });
      if (error) return;
      const row = Array.isArray(data) ? data[0] : data;
      const fromDb = String(row?.department_name || "").trim();
      if (fromDb) paintSheetDepartment(fromDb);
    } catch (e) {
      console.warn(e);
    }
  }

  const ZOOM_STEPS = [0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6];
  const ZOOM_STORAGE_KEY = "activity-page-zoom";
  let pageZoom = 1;

  function nearestZoomStep(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1;
    let best = ZOOM_STEPS[0];
    let bestDist = Math.abs(n - best);
    for (let i = 1; i < ZOOM_STEPS.length; i++) {
      const d = Math.abs(n - ZOOM_STEPS[i]);
      if (d < bestDist) {
        best = ZOOM_STEPS[i];
        bestDist = d;
      }
    }
    return best;
  }

  function readStoredZoom() {
    try {
      const raw = sessionStorage.getItem(ZOOM_STORAGE_KEY);
      if (raw == null || raw === "") return 1;
      return nearestZoomStep(raw);
    } catch {
      return 1;
    }
  }

  function persistZoom(level) {
    try {
      sessionStorage.setItem(ZOOM_STORAGE_KEY, String(level));
    } catch {
      /* ignore */
    }
  }

  function supportsCssZoom() {
    try {
      return typeof CSS !== "undefined" && CSS.supports && CSS.supports("zoom", "1");
    } catch {
      return false;
    }
  }

  function applyPageZoom(level) {
    let nextLevel = nearestZoomStep(level);
    // 폰·좁은 화면에서 과도한 확대는 가로 스크롤을 유발하므로 제한
    try {
      if (window.matchMedia("(max-width: 720px)").matches) {
        nextLevel = Math.min(1.1, Math.max(0.9, nextLevel));
        nextLevel = nearestZoomStep(nextLevel);
      }
    } catch {
      /* ignore */
    }
    pageZoom = nextLevel;
    const shell = document.querySelector(".shell");
    document.documentElement.style.setProperty("--page-zoom", String(pageZoom));
    document.documentElement.dataset.pageZoom = String(pageZoom);

    if (shell) {
      if (supportsCssZoom()) {
        shell.style.zoom = String(pageZoom);
        shell.style.transform = "";
        shell.style.transformOrigin = "";
        shell.style.width = "";
        shell.style.maxWidth = "";
        shell.style.marginLeft = "";
        shell.style.marginRight = "";
      } else {
        shell.style.zoom = "";
        shell.style.transform = pageZoom === 1 ? "" : `scale(${pageZoom})`;
        shell.style.transformOrigin = "top center";
        if (pageZoom === 1) {
          shell.style.width = "";
          shell.style.maxWidth = "";
          shell.style.marginLeft = "";
          shell.style.marginRight = "";
        } else {
          shell.style.width = `${100 / pageZoom}%`;
          shell.style.maxWidth = `calc(820px / ${pageZoom})`;
          shell.style.marginLeft = "auto";
          shell.style.marginRight = "auto";
        }
      }
    }

    persistZoom(pageZoom);
    syncZoomControls();
    if (typeof syncTimeWatchHeroPad === "function") {
      requestAnimationFrame(syncTimeWatchHeroPad);
    }
  }

  function syncZoomControls() {
    const label = document.getElementById("zoomLevelLabel");
    const btnOut = document.getElementById("btnZoomOut");
    const btnIn = document.getElementById("btnZoomIn");
    const idx = ZOOM_STEPS.indexOf(pageZoom);
    if (label) {
      label.textContent = `${Math.round(pageZoom * 100)}%`;
      label.title = "탭하면 100%로 되돌리기";
      label.setAttribute("aria-label", `현재 확대 ${Math.round(pageZoom * 100)}퍼센트. 누르면 원래 크기로`);
    }
    if (btnOut) {
      btnOut.disabled = idx <= 0;
      btnOut.setAttribute("aria-disabled", btnOut.disabled ? "true" : "false");
    }
    if (btnIn) {
      btnIn.disabled = idx < 0 || idx >= ZOOM_STEPS.length - 1;
      btnIn.setAttribute("aria-disabled", btnIn.disabled ? "true" : "false");
    }
  }

  function stepZoom(delta) {
    const idx = Math.max(0, ZOOM_STEPS.indexOf(pageZoom));
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, idx + delta))];
    applyPageZoom(next);
  }

  function insertInActions(actionsHost, el, beforeIds) {
    for (const id of beforeIds) {
      const ref = document.getElementById(id);
      if (ref && ref.parentNode === actionsHost) {
        actionsHost.insertBefore(el, ref);
        return;
      }
    }
    actionsHost.appendChild(el);
  }

  function ensureZoomControls(actionsHost) {
    if (document.getElementById("zoomControls")) {
      applyPageZoom(pageZoom !== 1 ? pageZoom : readStoredZoom());
      return;
    }

    const zoom = document.createElement("div");
    zoom.className = "zoom-controls";
    zoom.id = "zoomControls";
    zoom.setAttribute("role", "group");
    zoom.setAttribute("aria-label", "화면 확대 축소");
    zoom.innerHTML = `
      <button type="button" class="zoom-btn" id="btnZoomOut" aria-label="화면 축소" title="축소">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5"/>
          <path d="M16 16l5 5"/>
          <path d="M7.5 10.5h6"/>
        </svg>
      </button>
      <button type="button" class="zoom-level" id="zoomLevelLabel" title="탭하면 100%로 되돌리기">100%</button>
      <button type="button" class="zoom-btn" id="btnZoomIn" aria-label="화면 확대" title="확대">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5"/>
          <path d="M16 16l5 5"/>
          <path d="M7.5 10.5h6"/>
          <path d="M10.5 7.5v6"/>
        </svg>
      </button>`;

    insertInActions(actionsHost, zoom, ["btnSubmitActivity"]);
    document.getElementById("btnZoomOut")?.addEventListener("click", () => stepZoom(-1));
    document.getElementById("btnZoomIn")?.addEventListener("click", () => stepZoom(1));
    document.getElementById("zoomLevelLabel")?.addEventListener("click", () => applyPageZoom(1));
    applyPageZoom(readStoredZoom());

    if (!window.__careerZoomViewportBound) {
      window.__careerZoomViewportBound = true;
      let zoomResizeTimer = 0;
      window.addEventListener(
        "resize",
        () => {
          clearTimeout(zoomResizeTimer);
          zoomResizeTimer = setTimeout(() => applyPageZoom(pageZoom), 120);
        },
        { passive: true }
      );
      window.addEventListener(
        "orientationchange",
        () => setTimeout(() => applyPageZoom(pageZoom), 180),
        { passive: true }
      );
    }
  }

  function snapshotFilledRoot() {
    const root = document.getElementById("activity-root");
    if (!root) return null;

    // cloneNode는 사용자가 입력한 live value를 복사하지 않음 → 원본에서 읽어 주입
    const live = [...root.querySelectorAll("input, textarea, select")];
    const clone = root.cloneNode(true);
    const cloned = [...clone.querySelectorAll("input, textarea, select")];
    live.forEach((src, idx) => {
      const el = cloned[idx];
      if (!el) return;
      if (el.tagName === "TEXTAREA") {
        el.textContent = src.value;
        el.value = src.value;
      } else if (el.tagName === "SELECT") {
        el.value = src.value;
        [...el.options].forEach((opt) => {
          if (opt.value === src.value) opt.setAttribute("selected", "selected");
          else opt.removeAttribute("selected");
        });
      } else if (el.type === "checkbox" || el.type === "radio") {
        if (src.checked) el.setAttribute("checked", "checked");
        else el.removeAttribute("checked");
        el.checked = !!src.checked;
      } else {
        el.setAttribute("value", src.value);
        el.value = src.value;
      }
    });
    cloned.forEach((el) => {
      el.setAttribute("readonly", "readonly");
      if (el.tagName === "SELECT") el.setAttribute("disabled", "disabled");
    });
    return preparePrintClone(clone);
  }

  /** 인쇄 iframe용: UI 전용 요소 제거 · details 펼침 · 월드컵 결과만 남김 */
  function preparePrintClone(clone) {
    if (!clone) return clone;

    clone.querySelectorAll(".no-print").forEach((el) => el.remove());

    // 공란 입력칸: 예시문 제거 + 하늘색 그라데이션 제외 표시
    clone.querySelectorAll("input, textarea").forEach((el) => {
      if (el.type === "checkbox" || el.type === "radio") return;
      const empty =
        el.tagName === "TEXTAREA"
          ? !String(el.value || el.textContent || "").trim()
          : !String(el.value || el.getAttribute("value") || "").trim();
      el.removeAttribute("placeholder");
      el.classList.toggle("is-blank", empty);
      if (empty) el.setAttribute("data-blank", "1");
      else el.removeAttribute("data-blank");
    });

    // 1차시: HTML 소스·버튼·대기실 제거, 캐릭터 카드만 남김
    if (clone.querySelector("#part2-html, #part1-manual, .na-manual")) {
      clone
        .querySelectorAll(
          ".html-forge, .html-forge-copy, .html-forge-badge, .inf-kakao-btn, .inf-bubble, .inf-card-glow, .inf-stats-hint, .inf-empty-cta"
        )
        .forEach((el) => el.remove());

      const stage = clone.querySelector("#infStage");
      const card = clone.querySelector("#infCard");
      const empty = clone.querySelector("#infStageEmpty");
      const faceHtml = String(clone.querySelector("#infFaceWrap")?.innerHTML || "").trim();
      const hasLiveCard =
        !!faceHtml ||
        stage?.classList.contains("is-live") ||
        (card && !card.hasAttribute("hidden"));

      if (hasLiveCard && card) {
        stage?.classList.add("is-live");
        empty?.remove();
        card.hidden = false;
        card.removeAttribute("hidden");
        card.style.display = "grid";
        // 능력치 막대: 애니메이션 전 width:0 방지
        clone.querySelectorAll(".inf-stat-fill").forEach((bar) => {
          const w = bar.getAttribute("data-w") || "0";
          bar.style.width = `${w}%`;
        });
      } else {
        empty?.remove();
        card?.remove();
        const part2 = clone.querySelector("#part2-html");
        if (part2 && !part2.querySelector(".inf-card")) part2.remove();
      }
    }

    clone.querySelectorAll("details").forEach((d) => {
      if (d.classList.contains("html-forge") || d.classList.contains("html-forge--fold")) {
        d.remove();
        return;
      }
      d.setAttribute("open", "");
      d.open = true;
    });
    clone.querySelectorAll(".wc-help").forEach((el) => {
      const t = String(el.textContent || "");
      if (/펼쳐|눌러/.test(t)) el.remove();
    });

    if (clone.classList.contains("activity-card--worldcup")) {
      const winnerVal = String(clone.querySelector("#wc-winner")?.value || "").trim();
      const winnerText = String(clone.querySelector("#wc-winner-display")?.textContent || "").trim();
      const resultEl = clone.querySelector("#wc-result");
      const resultVisible =
        clone.classList.contains("is-wc-done") ||
        (resultEl && !resultEl.hasAttribute("hidden")) ||
        !!winnerVal ||
        (winnerText && winnerText !== "-");

      if (resultVisible) {
        clone.querySelector("#wc-input")?.remove();
        clone.querySelector("#wc-play")?.remove();
        clone.querySelector("#wc-steps")?.remove();
        if (resultEl) {
          resultEl.hidden = false;
          resultEl.removeAttribute("hidden");
          resultEl.style.display = "block";
        }
      }
    }

    return clone;
  }

  function activityMeta() {
    return {
      title: document.querySelector(".hero-card h1")?.textContent?.trim() || `${sessionNo}차시`,
      theme: document.querySelector(".hero-card .theme")?.textContent?.trim() || "",
      summary: document.querySelector(".hero-card p")?.textContent?.trim() || "",
      topTitle: document.querySelector(".top-meta strong")?.textContent?.trim() || ""
    };
  }

  const EXPORT_FALLBACK_CSS = `
*{box-sizing:border-box}body{margin:0;padding:16px;font-family:Pretendard,"Noto Sans KR",sans-serif;color:#1f1e1d;background:#fff}
.shell{width:min(980px,100%);margin:0 auto}
.hero-card,.activity-card{border:2px solid #111;border-radius:14px;background:#fff;padding:14px 16px;margin-bottom:12px}
.hero-card h1{margin:0;font:700 22px/1.3 "Noto Serif KR",serif}
.hero-card .theme{display:inline-block;margin-bottom:6px;padding:3px 8px;border-radius:999px;background:#fbefe7;color:#8c4022;font:600 11px/1.3 sans-serif}
.hero-card p{margin:6px 0 0;color:#807d75;font:400 13px/1.5 serif}
.activity-card h2{margin:0 0 12px;font:600 16px/1.3 "Noto Serif KR",serif}
.field{display:grid;gap:6px;margin-bottom:10px}
.field label{font:600 12px/1.3 sans-serif}
.field input,.field textarea,.field select,.q-item input,.na-card textarea,.bingo-cell textarea{width:100%;border:1px solid #e5e0d5;border-radius:10px;background:#faf9f5;padding:8px 10px;font:500 13px/1.45 sans-serif}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.questions-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.q-item{border:1.5px solid #c7d2fe;border-radius:10px;padding:7px 8px;background:#fafafe}
.q-title{display:block;font:700 11px/1.3 sans-serif;color:#3730a3;margin-bottom:4px}
.na-manual-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.na-card{border:1.5px solid #94a3b8;border-radius:12px;padding:10px}
.na-card-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;font:700 13px/1.3 sans-serif}
.bingo-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.bingo-cell{border:1.5px solid #93c5fd;border-radius:10px;padding:8px;min-height:100px}
.bingo-cell .cell-title{display:block;font:700 11px/1.3 sans-serif;color:#1d4ed8;margin:2px 0 6px}
@media (max-width:900px){.questions-grid,.bingo-board,.na-manual-grid,.grid-2{grid-template-columns:1fr 1fr}}
@media print{
  @page{size:A4;margin:8mm}
  body{padding:0}
  .questions-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important}
  .bingo-board{grid-template-columns:repeat(5,minmax(0,1fr))!important}
  .na-manual-grid{grid-template-columns:1fr 1fr!important}
  .q-item,.na-card,.bingo-cell,.field{break-inside:avoid}
  input::placeholder,textarea::placeholder{color:transparent!important;opacity:0!important}
}
`.trim();

  async function loadActivityCssText() {
    try {
      const link = document.querySelector('link[href*="activity.css"]');
      if (!link) return EXPORT_FALLBACK_CSS;
      const res = await fetch(link.href, { cache: "force-cache" });
      if (!res.ok) return EXPORT_FALLBACK_CSS;
      return (await res.text()) + "\n" + EXPORT_FALLBACK_CSS;
    } catch {
      return EXPORT_FALLBACK_CSS;
    }
  }

  function buildExportDocument(filledRoot, cssText) {
    const meta = activityMeta();
    const title = meta.title || `${sessionNo}차시 활동지`;
    const id = readSheetIdentity();
    const qr = captureQrDataUrl();
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap" />
<style>
${cssText}
body{padding:16px!important;background:#fff!important}
.topbar,.topbar-actions,.time-watch,.overlay,.submit-fab,.zoom-controls,.sheet-tools,.hero-qr-cap{display:none!important}
.shell{width:min(980px,100%)!important;margin:0 auto!important;zoom:1!important;transform:none!important}
.hero-card{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important}
.hero-qr-wrap{display:flex!important}
.sheet-identity input{border:1px solid #ccc}
</style>
</head>
<body>
  <div class="shell">
    <section class="hero-card">
      <div class="hero-copy">
        ${meta.theme ? `<div class="theme">${escapeHtml(meta.theme)}</div>` : ""}
        <h1>${escapeHtml(title)}</h1>
        ${meta.summary ? `<p>${escapeHtml(meta.summary)}</p>` : ""}
        ${(id.studentNo || id.studentName) ? `<p>${escapeHtml([id.studentNo, id.studentName].filter(Boolean).join(" · "))}</p>` : ""}
      </div>
      ${qr ? `<div class="hero-qr-wrap"><div class="hero-qr"><img src="${qr}" alt="활동지 QR" style="width:100%;height:100%;display:block" /></div></div>` : ""}
    </section>
    <section class="activity-card" id="activity-root">
      ${filledRoot.innerHTML}
    </section>
  </div>
</body>
</html>`;
  }

  async function saveActivityHtml() {
    if (!guardWorldCupPrintSave()) return;
    const filled = snapshotFilledRoot();
    if (!filled) return;
    const cssText = await loadActivityCssText();
    const html = buildExportDocument(filled, cssText);
    const id = readSheetIdentity();
    const fname = `${sessionNo}차시-${sanitizeFilePart(id.studentNo, "학번미입력")}-${sanitizeFilePart(id.studentName, "이름미입력")}.html`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function buildPrintDocument(filledRoot, activityCssText = "") {
    const meta = activityMeta();
    const title = meta.title || `${sessionNo}차시 활동지`;
    const bar = filledRoot.querySelector(".activity-sheet-bar");
    if (bar) {
      let lesson = bar.querySelector(".print-lesson-title");
      if (!lesson) {
        lesson = document.createElement("p");
        lesson.className = "print-lesson-title";
        bar.insertBefore(lesson, bar.firstChild);
      }
      lesson.textContent = title;
    }
    const linkedCss = activityCssText
      ? `\n/* —— activity.css (인쇄용) —— */\n${activityCssText}\n`
      : "";
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 5mm 6mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #1f1e1d;
    font-family: Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
  /* 기본 인쇄: 컬러 · 양면 · 시트당 페이지 수 2개 (프린터 설정에서 선택) */
  .print-sheet { margin: 0; padding: 0; width: 100%; }
  .activity-card { width: 100%; }
  .activity-sheet-bar {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    column-gap: 10px;
    min-height: 34px;
    margin: 0 0 8px;
    padding: 2px 0 6px;
    border-bottom: 1.5px solid #d6d3d1;
  }
  .activity-sheet-bar-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    justify-self: start;
  }
  .print-lesson-title {
    display: block;
    justify-self: start;
    align-self: center;
    z-index: 1;
    width: auto;
    max-width: 100%;
    margin: 0;
    padding: 0;
    font: 700 10.5px/1.25 "Noto Serif KR", Pretendard, serif;
    letter-spacing: -0.02em;
    white-space: nowrap;
    word-break: keep-all;
    overflow: hidden;
    text-overflow: ellipsis;
    writing-mode: horizontal-tb;
  }
  .activity-sheet-bar-title {
    position: static;
    left: auto;
    top: auto;
    transform: none;
    grid-column: 2;
    justify-self: center;
    align-self: center;
    z-index: 1;
    margin: 0;
    text-align: center;
    white-space: nowrap;
    pointer-events: none;
  }
  .activity-sheet-bar h2 {
    margin: 0;
    font: 700 calc(15px + 3pt)/1.25 Pretendard, sans-serif;
    text-align: center;
  }
  .sheet-identity {
    grid-column: 3;
    justify-self: end;
    align-self: center;
    z-index: 1;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
    padding-top: 0;
  }
  @media print {
    .activity-sheet-bar-title {
      position: static !important;
      left: auto !important;
      top: auto !important;
      transform: none !important;
      grid-column: 2 !important;
      justify-self: center !important;
    }
    .activity-sheet-bar h2 {
      font-size: calc(15px + 3pt);
    }
    .print-lesson-title {
      white-space: nowrap !important;
      word-break: keep-all !important;
      max-width: 100% !important;
      width: auto !important;
      writing-mode: horizontal-tb !important;
    }
    .sheet-identity {
      padding-top: 0;
    }
  }
  .sheet-identity label {
    display: grid;
    gap: 2px;
    font: 700 10px/1.2 Pretendard, sans-serif;
    color: #57534e;
  }
  .sheet-identity input {
    width: 88px;
    height: 24px;
    border: 0;
    border-bottom: 1px solid #a8a29e;
    background: transparent;
    font: 600 11px/1 Pretendard, sans-serif;
  }
  .q100-head { margin: 0 0 6px; }
  .q100-head strong {
    display: block;
    font: 700 13px/1.25 Pretendard, sans-serif;
    color: #312e81;
  }
  .q100-head span {
    display: block;
    margin-top: 1px;
    font: 500 10px/1.35 Pretendard, sans-serif;
    color: #64748b;
  }
  .questions-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 3px;
  }
  .q-item {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #c7d2fe;
    border-radius: 6px;
    padding: 4px 5px;
    background: #fafafe;
  }
  .q-item.is-starred {
    border-color: #f59e0b;
    background: #fffbeb;
    box-shadow: inset 2px 0 0 #d97706;
  }
  .q-star-btn { display: none !important; }
  .q-item .q-title {
    display: block;
    margin: 0 0 2px;
    font: 700 9px/1.25 Pretendard, sans-serif;
    color: #3730a3;
  }
  .q-item.is-starred .q-title { color: #92400e; }
  .q-item input {
    width: 100%;
    height: 18px;
    border: 0;
    border-bottom: 1px dashed #cbd5e1;
    border-radius: 0;
    background: transparent;
    padding: 0 2px;
    font: 500 10px/1.2 Pretendard, sans-serif;
    color: #1f1e1d;
  }
  .na-manual-head, .bingo-head {
    margin: 0 0 6px;
  }
  .na-manual-head strong, .bingo-head strong {
    display: block;
    font: 700 13px/1.25 Pretendard, sans-serif;
    color: #1e293b;
  }
  .na-manual-head span, .bingo-head span {
    display: block;
    margin-top: 1px;
    font: 500 10px/1.35 Pretendard, sans-serif;
    color: #64748b;
  }
  .na-manual-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px;
  }
  .na-card {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #94a3b8;
    border-radius: 6px;
    padding: 4px 5px;
    background: #fff;
  }
  .na-card-head {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
    font: 700 9.5px/1.25 Pretendard, sans-serif;
  }
  .na-card-icon { font-size: 10px; width: 16px; height: 16px; }
  .na-card textarea {
    width: 100%;
    min-height: 28px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 3px 4px;
    font: 500 9px/1.35 Pretendard, sans-serif;
    resize: none;
    background: #f8fafc;
  }
  .bingo-guide {
    margin: 0 0 6px;
    font: 500 10px/1.4 Pretendard, sans-serif;
    color: #475569;
  }
  .bingo-guide ol { margin: 4px 0 0; padding-left: 16px; }
  .bingo-board {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 3px;
  }
  .bingo-cell {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #93c5fd;
    border-radius: 6px;
    padding: 4px;
    min-height: 58px;
  }
  .bingo-cell .cell-number {
    font: 700 8px/1 Pretendard, sans-serif;
    color: #64748b;
  }
  .bingo-cell .cell-title {
    display: block;
    margin: 2px 0 3px;
    font: 700 8.5px/1.25 Pretendard, sans-serif;
    color: #1d4ed8;
  }
  .bingo-cell textarea {
    width: 100%;
    min-height: 28px;
    border: 0;
    border-bottom: 1px dashed #cbd5e1;
    background: transparent;
    padding: 0;
    font: 500 9px/1.3 Pretendard, sans-serif;
    resize: none;
  }
  .bingo-reflection { margin-top: 8px; }
  .bingo-reflection label {
    display: block;
    margin-bottom: 3px;
    font: 700 11px/1.3 Pretendard, sans-serif;
  }
  .bingo-reflection textarea {
    width: 100%;
    min-height: 48px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px;
    font: 500 10px/1.4 Pretendard, sans-serif;
  }
  .field { margin: 0 0 6px; }
  .field label {
    display: block;
    margin-bottom: 2px;
    font: 700 10px/1.3 Pretendard, sans-serif;
  }
  .field input, .field textarea, .field select {
    width: 100%;
    border: 1px solid #e5e0d5;
    border-radius: 6px;
    padding: 5px 7px;
    font: 500 10px/1.4 Pretendard, sans-serif;
    background: #fff;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0); border: 0;
  }
  .sheet-dept {
    display: inline-flex; max-width: 200px; margin-left: auto;
    padding: 3px 9px; border: 1.5px solid #c5a57a; border-radius: 999px;
    background: linear-gradient(180deg, #fffaf3 0%, #f3e6d4 100%);
    color: #6b4a2a; font: 700 11px/1.2 Pretendard, sans-serif;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sheet-dept-row {
    display: flex; justify-content: flex-end; align-items: center;
    margin: 0 0 8px;
  }
  .sheet-dept[hidden], .sheet-dept-row[hidden] { display: none !important; }

  /* —— 4차시 SWOT 인쇄 —— */
  .activity-card--swot { padding: 4px !important; border: 0 !important; box-shadow: none !important; }
  .swot-report {
    --swot-ink: #111827;
    --swot-soft: #374151;
    --swot-teal: #0d7377;
    --swot-amber: #c2410c;
    display: flex; flex-direction: column; gap: 7px; color: #1f2937;
  }
  .swot-hero {
    text-align: center; border-bottom: 2px solid var(--swot-ink);
    padding: 8px 0 6px; position: relative;
  }
  .swot-hero::before {
    content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3px;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(90deg, var(--swot-teal) 0 60%, var(--swot-amber) 60% 100%);
  }
  .swot-hero h2 {
    margin: 0; font: 700 14px/1.25 Pretendard, sans-serif;
    letter-spacing: -0.02em; color: var(--swot-ink);
  }
  .swot-hero-sub {
    margin: 3px 0 0; font: 500 9px/1.35 Pretendard, sans-serif;
    color: var(--swot-soft); word-break: keep-all;
  }
  /* 큰 섹션 통째로 다음 장으로 밀지 않음 → 하단 공백 방지 */
  .swot-block {
    display: flex; flex-direction: column; gap: 5px;
    break-inside: auto; page-break-inside: auto;
  }
  .swot-head {
    display: flex; align-items: center; gap: 6px;
    break-after: avoid; page-break-after: avoid;
  }
  .swot-num { font: 800 12px/1.2 Pretendard, sans-serif; color: var(--swot-amber); }
  .swot-head h3 { margin: 0; font: 700 11.5px/1.25 Pretendard, sans-serif; color: var(--swot-ink); }
  .swot-panel {
    border: 1.5px solid var(--swot-ink); border-radius: 7px; overflow: visible; background: #fff;
    break-inside: auto; page-break-inside: auto;
  }
  .swot-row2 { display: grid; grid-template-columns: 1fr 1fr !important; }
  .swot-cell { padding: 5px 7px; border-right: 1px solid #d1d5db; min-width: 0; }
  .swot-cell:last-child { border-right: none; }
  .swot-cell--full { border-right: none; border-top: 1px solid #d1d5db; }
  .swot-lbl {
    display: block; margin: 0 0 2px; font: 700 9px/1.25 Pretendard, sans-serif; color: var(--swot-ink);
  }
  .swot-cell input, .swot-cell textarea, .swot-step input, .swot-card textarea, .swot-plan textarea {
    width: 100%; border: none; outline: none; background: transparent; resize: none;
    font: 500 9.5px/1.35 Pretendard, sans-serif; color: var(--swot-ink); padding: 0; margin: 0;
  }
  .swot-cell textarea { min-height: 28px; height: auto; }
  .swot-salary {
    display: grid; grid-template-columns: auto 1fr !important; gap: 6px; align-items: center;
    padding: 5px 7px; border-top: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db;
    background: linear-gradient(90deg, #ecfeff, #fff7ed);
  }
  .swot-salary-title { font: 700 9px/1.25 Pretendard, sans-serif; color: var(--swot-ink); white-space: nowrap; }
  .swot-track { display: grid; grid-template-columns: 1fr 1fr 1fr !important; gap: 5px; position: relative; }
  .swot-track::before {
    content: ""; position: absolute; left: 10%; right: 10%; top: 5px; height: 2px;
    background: linear-gradient(90deg, var(--swot-teal), var(--swot-amber)); z-index: 0;
  }
  .swot-step { position: relative; z-index: 1; text-align: center; }
  .swot-dot {
    width: 8px; height: 8px; border-radius: 50%; background: var(--swot-teal);
    border: 1.5px solid #fff; margin: 0 auto 2px; box-shadow: 0 0 0 1.5px var(--swot-teal);
  }
  .swot-step:nth-child(2) .swot-dot { background: #ea580c; box-shadow: 0 0 0 1.5px #ea580c; }
  .swot-step:nth-child(3) .swot-dot { background: var(--swot-amber); box-shadow: 0 0 0 1.5px var(--swot-amber); }
  .swot-when { font: 600 8.5px/1.2 Pretendard, sans-serif; color: var(--swot-soft); margin-bottom: 2px; }
  .swot-step input {
    text-align: center; background: #fff !important; border: 1px solid #9ca3af !important;
    border-radius: 4px; padding: 2px !important; min-height: 20px; font-size: 9px !important;
  }
  .swot-grid {
    display: grid; grid-template-columns: 1fr 1fr !important; gap: 5px;
    break-inside: auto; page-break-inside: auto;
  }
  .swot-card {
    border-radius: 6px; padding: 5px 7px; border: 1.5px solid transparent;
    display: flex; flex-direction: column; gap: 3px; min-width: 0;
    break-inside: avoid; page-break-inside: avoid;
  }
  .swot-card.is-s { background: #ecfeff; border-color: #67e8f9; }
  .swot-card.is-w { background: #fef2f2; border-color: #fca5a5; }
  .swot-card.is-o { background: #f0fdf4; border-color: #86efac; }
  .swot-card.is-t { background: #fff7ed; border-color: #fdba74; }
  .swot-card-top { display: flex; align-items: flex-start; gap: 5px; }
  .swot-badge {
    width: 18px; height: 18px; border-radius: 4px; display: grid; place-items: center;
    font: 800 10px/1 Pretendard, sans-serif; color: #fff; flex-shrink: 0;
  }
  .swot-card.is-s .swot-badge { background: var(--swot-teal); }
  .swot-card.is-w .swot-badge { background: #dc2626; }
  .swot-card.is-o .swot-badge { background: #16a34a; }
  .swot-card.is-t .swot-badge { background: #ea580c; }
  .swot-tt { font: 700 9.5px/1.25 Pretendard, sans-serif; color: var(--swot-ink); }
  .swot-ss { margin-top: 1px; font: 500 8px/1.3 Pretendard, sans-serif; color: var(--swot-soft); word-break: keep-all; }
  .swot-card textarea {
    min-height: 36px; height: auto; background: #fff !important; border: 1px solid #d1d5db !important;
    border-radius: 4px; padding: 4px 5px !important; font-size: 9px !important;
  }
  .swot-plans { display: flex; flex-direction: column; gap: 4px; break-inside: auto; page-break-inside: auto; }
  .swot-plan {
    display: grid; grid-template-columns: minmax(100px, 140px) 1fr !important; gap: 5px;
    align-items: stretch; border: 1.5px solid #d1d5db; border-radius: 5px; background: #fff;
    padding: 4px 6px; min-width: 0;
    break-inside: avoid; page-break-inside: avoid;
  }
  .swot-pl {
    display: flex; align-items: flex-start; gap: 4px;
    font: 700 8.5px/1.3 Pretendard, sans-serif; color: var(--swot-ink);
  }
  .swot-sn {
    font: 800 8px/1 Pretendard, sans-serif; color: #fff; background: var(--swot-teal);
    width: 14px; height: 14px; border-radius: 3px; display: grid; place-items: center; flex-shrink: 0;
  }
  .swot-plan textarea { min-height: 28px; height: auto; padding: 0 !important; font-size: 9px !important; }
  .swot-footer {
    margin: 2px 0 0; padding-top: 4px; border-top: 1.5px solid var(--swot-ink);
    text-align: center; font: 500 8.5px/1.3 Pretendard, sans-serif; color: var(--swot-soft);
  }
  .activity-card--swot .reflect-field { margin-top: 2px; break-inside: avoid; }
  .activity-card--swot .reflect-field textarea { min-height: 28px; height: auto; }
  .swot-card, .swot-salary, .swot-badge, .swot-sn, .swot-hero::before, .sheet-dept {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* —— 공통: 화면 전용 UI —— */
  .no-print { display: none !important; }

  /* —— 3차시 직업 월드컵 인쇄 —— */
  .activity-card--worldcup {
    padding: 4px !important; border: 0 !important; box-shadow: none !important;
  }
  .wc-steps, .wc-howto, .wc-cats, .wc-progress, .wc-btn, .wc-btn-row,
  .wc-confetti, .wc-toast, #wc-play { display: none !important; }
  .activity-card--worldcup.is-wc-done #wc-input { display: none !important; }
  .wc-head { margin: 0 0 8px; padding: 0 0 6px; border-bottom: 1px solid #e5e7eb; }
  .wc-head strong {
    display: block; font: 700 13px/1.25 Pretendard, sans-serif; color: #1e293b;
  }
  .wc-head > span {
    display: block; margin-top: 2px; font: 500 10px/1.35 Pretendard, sans-serif; color: #64748b;
  }
  .activity-card--worldcup.is-wc-done #wc-result,
  #wc-result:not([hidden]) { display: block !important; }
  .wc-champ {
    text-align: center; padding: 10px 10px 8px; margin: 0 0 8px;
    border-radius: 12px; color: #fff;
    background: linear-gradient(160deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%);
  }
  .wc-champ-label {
    display: inline-flex; margin-bottom: 6px; padding: 3px 8px; border-radius: 999px;
    background: rgba(255,255,255,0.16); font: 700 9px/1.2 Pretendard, sans-serif;
  }
  .wc-champ-emoji {
    width: 40px; height: 40px; margin: 0 auto 6px; border-radius: 12px;
    display: grid; place-items: center; font-size: 22px;
    background: rgba(255,255,255,0.16); border: 1.5px solid rgba(255,255,255,0.25);
  }
  .wc-champ-name {
    margin: 0; font: 800 22px/1.2 Pretendard, sans-serif; letter-spacing: -0.03em; color: #fff;
  }
  .wc-champ-sub {
    margin: 3px 0 0; opacity: 0.92; font: 500 10px/1.35 Pretendard, sans-serif;
  }
  .wc-rank-row {
    display: grid; grid-template-columns: 1fr 1.15fr 1fr; gap: 5px; margin-top: 8px;
  }
  .wc-rank-box {
    border-radius: 8px; padding: 5px 4px; background: rgba(255,255,255,0.14);
    text-align: center;
  }
  .wc-rank-box.is-top { background: rgba(255,255,255,0.26); }
  .wc-rank-r { font: 700 8px/1.2 Pretendard, sans-serif; opacity: 0.85; }
  .wc-rank-n { margin-top: 2px; font: 700 10px/1.25 Pretendard, sans-serif; word-break: keep-all; }
  .wc-panel { margin: 0 0 8px; }
  .wc-panel-title {
    display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
    margin: 0 0 5px;
  }
  .wc-panel-title h3 {
    margin: 0; font: 700 12px/1.3 Pretendard, sans-serif; color: #111827;
    display: flex; align-items: center; gap: 5px;
  }
  .wc-badge {
    display: inline-grid; place-items: center; min-width: 16px; height: 16px; padding: 0 4px;
    border-radius: 5px; background: #2563eb; color: #fff; font: 800 9px/1 Pretendard, sans-serif;
  }
  .wc-help { display: none !important; }
  .wc-board { display: flex; flex-direction: column; gap: 4px; }
  .wc-round-panel {
    border: 1px solid #e5e7eb; border-radius: 8px; padding: 5px 7px; background: #fff;
    break-inside: avoid; page-break-inside: avoid;
  }
  .wc-round-panel summary {
    list-style: none; display: flex; align-items: center; gap: 6px;
    font: 700 10.5px/1.3 Pretendard, sans-serif; color: #1f2937; cursor: default;
  }
  .wc-round-panel summary::-webkit-details-marker,
  .wc-round-panel summary::marker { display: none; content: ""; }
  .wc-cnt {
    margin-left: auto; font: 700 9px/1 Pretendard, sans-serif; color: #64748b;
    background: #f1f5f9; border-radius: 999px; padding: 2px 6px;
  }
  .wc-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
  .wc-chip {
    display: inline-flex; align-items: center; gap: 3px; padding: 3px 7px;
    border: 1px solid #e5e7eb; border-radius: 999px; background: #f8fafc;
    font: 600 9.5px/1.25 Pretendard, sans-serif; color: #1f2937;
  }
  .wc-chip.is-champ { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
  .wc-q-list { display: flex; flex-direction: column; gap: 5px; }
  .wc-q {
    border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 8px; background: #fff;
    break-inside: avoid; page-break-inside: avoid;
  }
  .wc-qlabel {
    display: inline-flex; margin-bottom: 2px; font: 800 9px/1.2 Pretendard, sans-serif; color: #2563eb;
  }
  .wc-q label {
    display: block; margin-bottom: 4px; font: 700 10.5px/1.35 Pretendard, sans-serif;
    color: #111827; word-break: keep-all;
  }
  .wc-q textarea, .activity-card .wc-q textarea {
    width: 100%; min-height: 36px; height: auto; border: 1px solid #e5e7eb; border-radius: 6px;
    padding: 5px 7px; font: 500 10px/1.4 Pretendard, sans-serif; background: #f9fafb;
    resize: none; color: #111827;
  }
  .wc-hint { color: #ea580c; font-weight: 700; font-size: 9.5px; }
  .activity-card--worldcup .reflect-field { margin-top: 6px; break-inside: avoid; }
  .activity-card--worldcup .reflect-field textarea { min-height: 40px; height: auto; }
  .wc-champ, .wc-badge, .wc-chip.is-champ, .sheet-dept {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
${linkedCss}
  /* —— 1차시 캐릭터 카드 인쇄 보정 (activity.css 덮어씀) —— */
  .topbar, .hero-card, .hero-qr-wrap, .sheet-tools, .zoom-controls,
  .submit-fab, .draft-fab, .reset-fab, .time-watch, .overlay { display: none !important; }
  .html-forge, .html-forge--fold, .html-forge-copy, .html-forge-badge,
  .inf-kakao-btn, .inf-bubble, .inf-card-glow, .inf-stage-empty, .inf-stats-hint,
  .inf-stage::before, .inf-face-stage::after { display: none !important; }
  .lesson-part--stage, .lesson-part--html {
    margin-top: 10px !important; padding-top: 6px !important;
    border-top: 1.5px solid #e7e5e4; break-inside: auto; page-break-inside: auto;
  }
  .lesson-part-head {
    display: flex !important; align-items: center !important; gap: 8px !important;
    margin: 0 0 6px !important; padding: 0 !important;
  }
  .lesson-part-head strong {
    font: 700 12.5px/1.25 Pretendard, sans-serif !important; color: #1f1e1d !important;
  }
  .lesson-part-tools { display: none !important; }
  .inf-stage {
    margin: 0 !important; padding: 0 !important; min-height: 0 !important;
    height: auto !important; background: #fff !important; border: 1.5px solid #e7e5e4 !important;
    border-radius: 12px !important; overflow: hidden !important; box-shadow: none !important;
  }
  .inf-card,
  .inf-stage.is-live .inf-card[hidden],
  #infCard {
    display: grid !important;
    grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1.15fr) !important;
    gap: 0 !important;
    min-height: 0 !important;
    height: auto !important;
    max-height: none !important;
  }
  .inf-portrait {
    padding: 10px 8px !important; gap: 6px !important; height: auto !important;
    justify-content: flex-start !important; border-right: 1px solid #e7e5e4 !important;
    background: linear-gradient(180deg, #fffaf5 0%, #fff 100%) !important;
  }
  .inf-face-stage {
    width: 120px !important; margin: 0 auto !important;
  }
  .inf-face-wrap {
    width: 120px !important; height: 120px !important;
    transform: none !important; filter: none !important; animation: none !important;
  }
  .inf-face-wrap .inf-photo,
  .inf-face-wrap .inf-photo-frame,
  .inf-face-wrap .inf-photo-frame > svg {
    width: 100% !important; height: 100% !important;
  }
  .inf-face-wrap .inf-photo-ring,
  .inf-face-wrap .inf-photo-spark,
  .inf-face-wrap .inf-photo-shade { display: none !important; }
  .inf-name {
    margin: 4px 0 0 !important; font: 800 14px/1.2 Pretendard, sans-serif !important;
    display: flex !important; flex-direction: column !important; align-items: center !important; gap: 4px !important;
  }
  .inf-class-badge {
    display: inline-flex !important; align-items: center !important; gap: 4px !important;
    padding: 3px 8px !important; border-radius: 999px !important;
    background: #ffe4e6 !important; color: #9f1239 !important;
    font: 700 10px/1.2 Pretendard, sans-serif !important;
  }
  .inf-class-badge svg { width: 11px; height: 11px; }
  .inf-class[hidden] { display: none !important; }
  .inf-tags {
    display: flex !important; flex-wrap: wrap !important; justify-content: center !important;
    gap: 3px !important; margin-top: 2px !important;
  }
  .inf-tag {
    display: inline-flex !important; padding: 2px 6px !important; border-radius: 999px !important;
    background: #f5f5f4 !important; border: 1px solid #e7e5e4 !important;
    font: 600 9px/1.2 Pretendard, sans-serif !important; color: #44403c !important;
  }
  .inf-stats {
    padding: 8px !important; gap: 4px !important; height: auto !important;
    background: #fafaf9 !important; justify-content: flex-start !important;
  }
  .inf-stats-grid {
    display: grid !important; grid-template-columns: 1fr !important; gap: 4px !important;
    grid-auto-rows: auto !important;
  }
  .inf-stat {
    display: grid !important; grid-template-columns: 28px minmax(0, 1fr) 36px !important;
    gap: 6px !important; padding: 5px 6px !important; min-height: 0 !important;
    border-radius: 8px !important; border: 1px solid #e7e5e4 !important;
    background: #fff !important; box-shadow: none !important; transform: none !important;
  }
  .inf-stat-ico {
    width: 26px !important; height: 26px !important; border-radius: 7px !important;
    font-size: 8px !important; box-shadow: none !important;
  }
  .inf-stat-top b { font-size: 10px !important; }
  .inf-stat-top span { font-size: 8px !important; color: #78716c !important; }
  .inf-stat-track {
    height: 6px !important; border-radius: 999px !important; background: #f5f5f4 !important; overflow: hidden !important;
  }
  .inf-stat-fill { display: block !important; height: 100% !important; border-radius: 999px !important; }
  .inf-stat-val { font: 800 11px/1 Pretendard, sans-serif !important; }
  .inf-stat-grade {
    display: inline-grid !important; place-items: center !important;
    min-width: 16px !important; height: 16px !important; border-radius: 4px !important;
    font: 800 9px/1 Pretendard, sans-serif !important; color: #fff !important;
  }
  .inf-stat-ico.is-atk, .inf-stat-fill.is-atk { background: linear-gradient(90deg, #fb7185, #e11d48) !important; }
  .inf-stat-ico.is-def, .inf-stat-fill.is-def { background: linear-gradient(90deg, #5eead4, #0d7377) !important; }
  .inf-stat-ico.is-men, .inf-stat-fill.is-men { background: linear-gradient(90deg, #93c5fd, #1d4ed8) !important; }
  .inf-stat-ico.is-cha, .inf-stat-fill.is-cha { background: linear-gradient(90deg, #fdba74, #ea580c) !important; }
  .inf-stat-ico.is-syn, .inf-stat-fill.is-syn { background: linear-gradient(90deg, #fcd34d, #b45309) !important; }
  .inf-stat-ico.is-buz, .inf-stat-fill.is-buz { background: linear-gradient(90deg, #f9a8d4, #db2777) !important; }
  .inf-stat, .inf-stat-ico, .inf-stat-fill, .inf-stat-grade, .inf-tag, .inf-class-badge, .inf-portrait, .sheet-dept {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .na-manual { margin: 0 0 4px !important; }
  .na-manual-head { margin: 0 0 4px !important; padding: 0 0 4px !important; }
  .na-manual-head strong { font-size: 12px !important; padding-left: 0 !important; }
  .na-manual-head span { font-size: 9px !important; }
  .na-manual-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 3px !important;
  }
  .na-card {
    break-inside: avoid;
    page-break-inside: avoid;
    padding: 4px 5px !important;
    border: 1px solid #94a3b8 !important;
    border-radius: 6px !important;
    background: #fff !important;
    box-shadow: none !important;
  }
  .na-card-head { gap: 4px !important; margin-bottom: 2px !important; }
  .na-card-icon { width: 16px !important; height: 16px !important; font-size: 10px !important; border-radius: 4px !important; }
  .na-card-head label { font-size: 9.5px !important; }
  .na-card textarea,
  .activity-card .na-card textarea {
    min-height: 28px !important;
    height: auto !important;
    padding: 3px 4px !important;
    font: 500 9px/1.35 Pretendard, sans-serif !important;
    background: #f8fafc !important;
    box-shadow: inset 0 0 0 1px #e2e8f0 !important;
    border-radius: 4px !important;
  }
  .na-card textarea.is-blank,
  .activity-card .na-card textarea.is-blank,
  textarea.is-blank,
  input.is-blank {
    background: #fff !important;
    box-shadow: inset 0 0 0 1px #e5e7eb !important;
  }
  input::placeholder,
  textarea::placeholder {
    color: transparent !important;
    opacity: 0 !important;
  }
  .lesson-part + .reflect-field, .na-manual + .reflect-field {
    margin-top: 6px !important; padding-top: 4px !important;
  }
  .reflect-field textarea { min-height: 28px !important; height: auto !important; font-size: 9px !important; }
  .html-forge, .html-forge--fold, .html-forge-code, #htmlCodeOut { display: none !important; }
</style>
</head>
<body>
  <div class="print-sheet">
    ${filledRoot.outerHTML}
  </div>
</body>
</html>`;
  }

  function isWorldCupActivity() {
    return !!document.querySelector(".activity-card--worldcup, #wc-result, #wc-job-inputs");
  }

  /** 3차시 월드컵: 결과 정리(최종) 화면인지 */
  function isWorldCupFinalPage() {
    if (!isWorldCupActivity()) return true;
    const root = document.getElementById("activity-root");
    const result = document.getElementById("wc-result");
    if (root?.classList.contains("is-wc-done")) return true;
    if (result && !result.hidden && !result.hasAttribute("hidden")) return true;
    return false;
  }

  /** 월드컵 미완료 시 인쇄·다운로드 차단 */
  function guardWorldCupPrintSave() {
    if (!isWorldCupActivity() || isWorldCupFinalPage()) return true;
    showDraftToast("최종 페이지에서 인쇄, 다운로드가 가능합니다.", 2800);
    return false;
  }

  async function printActivitySheet() {
    if (!guardWorldCupPrintSave()) return;
    syncPrintLessonTitle();
    const filled = snapshotFilledRoot();
    if (!filled) return;
    let cssText = "";
    try {
      cssText = await loadActivityCssText();
    } catch {
      cssText = "";
    }
    const html = buildPrintDocument(filled, cssText);

    showDraftToast(ACTIVITY_PRINT_DEFAULTS.guide(), 4800);

    const prev = document.getElementById("activityPrintFrame");
    if (prev) prev.remove();

    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
    const iframe = document.createElement("iframe");
    iframe.id = "activityPrintFrame";
    iframe.setAttribute("aria-hidden", "true");
    // iOS/Android: 완전 0크기 iframe은 인쇄가 실패하는 경우가 있어 최소 크기 유지
    iframe.style.cssText = mobile
      ? "position:fixed;left:0;top:0;width:1px;height:1px;border:0;opacity:0.01;pointer-events:none;z-index:-1"
      : "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    let printed = false;
    const runPrint = () => {
      if (printed) return;
      printed = true;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn("print failed", err);
        // 폴백: 현재 페이지 인쇄(히어로는 CSS로 숨김)
        window.print();
      } finally {
        setTimeout(() => iframe.remove(), mobile ? 2800 : 1200);
      }
    };

    // 안내 토스트를 잠깐 보여 준 뒤 인쇄 대화상자 오픈
    const startDelay = mobile ? 480 : 280;
    if (iframe.contentDocument?.readyState === "complete") {
      setTimeout(runPrint, startDelay);
    } else {
      iframe.onload = () => setTimeout(runPrint, startDelay);
      setTimeout(runPrint, mobile ? 700 : 400);
    }
  }

  function ensureSheetTools(actionsHost) {
    if (!document.getElementById("sheetTools")) {
      const tools = document.createElement("div");
      tools.className = "sheet-tools";
      tools.id = "sheetTools";
      tools.setAttribute("role", "group");
      tools.setAttribute("aria-label", "출력 및 저장");
      tools.innerHTML = `
      <button type="button" class="tool-btn tool-btn-live" id="btnLiveReport" aria-label="실시간 보고서 종합" title="실시간 · 교사만 열 수 있습니다" disabled>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
        </svg>
        <span class="live-label">실시간</span>
      </button>
      <button type="button" class="tool-btn" id="btnPrintSheet" aria-label="출력하기 · 기본 컬러 양면 시트당 페이지 수 2개" title="출력하기 (기본: 컬러 · 양면 · 시트당 페이지 수 2 — 인쇄창에서 선택)">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 8V4h10v4"/>
          <path d="M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <path d="M7 14h10v6H7z"/>
        </svg>
      </button>
      <button type="button" class="tool-btn" id="btnSaveSheet" aria-label="저장하기" title="저장하기 (HTML)">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v10"/>
          <path d="M8 10l4 4 4-4"/>
          <path d="M5 18h14"/>
        </svg>
      </button>`;

      insertInActions(actionsHost, tools, ["zoomControls", "btnSubmitActivity"]);
      document.getElementById("btnPrintSheet")?.addEventListener("click", printActivitySheet);
      document.getElementById("btnSaveSheet")?.addEventListener("click", () => {
        saveActivityHtml().catch((err) => console.error(err));
      });
    }
    ensureLiveReportDeck();
  }

  function ensureLiveReportDeck() {
    if (window.__careerLiveReportDeckReady) {
      syncTeacherSheetTools();
      return;
    }
    window.__careerLiveReportDeckReady = true;

    const authSb = createAuthClient();
    let channel = null;
    let boundCode = "";
    let localState = {
      open: false,
      title: "",
      sub: "",
      cards: [],
      focusId: "",
      fields: [],
      who: null
    };
    const contentById = new Map();
    let liveArenaRollFocus = -999;
    let liveArenaRollToken = 0;
    let liveArenaFolded = false;

    function applyLiveArenaFoldUi(folded) {
      liveArenaFolded = !!folded;
      const host = document.getElementById("liveDeckArena");
      const btn = document.getElementById("btnLiveArenaFold");
      if (host) host.classList.toggle("is-folded", liveArenaFolded);
      if (btn) {
        btn.setAttribute("aria-expanded", liveArenaFolded ? "false" : "true");
        btn.title = liveArenaFolded ? "랭킹 펼치기" : "랭킹 접기";
        btn.setAttribute("aria-label", liveArenaFolded ? "랭킹 펼치기" : "랭킹 접기");
      }
    }

    function lessonTitleText() {
      const h1 = document.querySelector(".hero-card h1")?.textContent?.trim();
      const strong = document.querySelector(".top-meta strong")?.textContent?.trim();
      return h1 || (strong ? `${sessionNo}차시 · ${strong}` : `${sessionNo}차시 활동`);
    }

    function liveHtmlPlain(raw) {
      return String(raw || "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    }

    function extractLiveFieldMap(html) {
      const map = {};
      const re =
        /<(?:input|textarea|select)\b([^>]*?(?:id|name)=["'](f\d+|q\d+|fReflect|bReflect|wcQ\d+|wcWinner|wcRunnerUp)["'][^>]*)>(?:([\s\S]*?)<\/(?:textarea|select)>)?/gi;
      let m;
      while ((m = re.exec(String(html || "")))) {
        const attrs = m[1] || "";
        const key = m[2];
        const inner = m[3];
        let v = "";
        if (inner != null) {
          const selected = /<option[^>]*\bselected\b[^>]*>([\s\S]*?)<\/option>/i.exec(inner);
          if (selected) v = selected[1];
          else if (/<option/i.test(inner) === false) v = inner;
          else {
            const first = /value=["']([^"']*)["']/i.exec(inner);
            // prefer selected value attr
            const selVal = /<option[^>]*\bselected\b[^>]*value=["']([^"']*)["']/i.exec(inner);
            v = selVal ? selVal[1] : "";
          }
        } else {
          v =
            (/value=["']([^"']*)["']/i.exec(attrs) || /value=([^\s>]+)/i.exec(attrs) || [])[1] ||
            "";
        }
        map[key] = liveHtmlPlain(v);
      }
      return map;
    }

    function extractLiveQuestionLabels(html) {
      const labels = {};
      const re = /<label[^>]*\bfor=["']((?:q|f)\d+)["'][^>]*>([\s\S]*?)<\/label>/gi;
      let m;
      while ((m = re.exec(String(html || "")))) {
        const key = m[1];
        let lab = liveHtmlPlain(m[2]).replace(/\s+/g, " ").trim();
        lab = lab.replace(/^\d+\s*[.)]\s*/, "").trim();
        if (lab) labels[key] = lab;
      }
      return labels;
    }

    function extractLiveLabeledAnswers(html) {
      const s = String(html || "");
      const out = [];
      const re =
        /<label[^>]*>([\s\S]*?)<\/label>[\s\S]{0,400}?(?:<textarea[^>]*>([\s\S]*?)<\/textarea>|<input[^>]*value="([^"]*)"[^>]*>|<input[^>]*value='([^']*)'[^>]*>)/gi;
      let m;
      while ((m = re.exec(s)) && out.length < 120) {
        let label = liveHtmlPlain(m[1]).replace(/\s+/g, " ").trim();
        if (!label) continue;
        if (/^(학번|이름)\b/.test(label)) continue;
        if (/차시\s*활동|학생\s*활동지|코드번호|눌러서|제출|임시|초기화|동기화/.test(label)) continue;
        label = label.replace(/^\d+\s*[.)]\s*/, "").trim();
        const value = liveHtmlPlain(m[2] || m[3] || m[4] || "").trim();
        if (!value) continue;
        out.push({ label: label.slice(0, 80), value: value.slice(0, 1200) });
      }
      return out;
    }

    function isLiveChromeNoise(text) {
      const t = String(text || "").replace(/\s+/g, " ").trim();
      if (!t) return true;
      if (t.length < 2) return true;
      return /^(학번|이름|\*|학생\s*활동지|\d+차시\s*활동|코드번호|눌러서\s*열기|미용과|진로\s*탐색)/.test(t);
    }

    function buildLiveFields(content) {
      const map = extractLiveFieldMap(content);
      const labels = extractLiveQuestionLabels(content);
      const fields = [];
      const push = (label, value, opts = {}) => {
        const v = String(value || "").trim();
        if (!v || isLiveChromeNoise(v)) return;
        const lab = String(label || "").trim() || "응답";
        if (isLiveChromeNoise(lab) && lab === "작성 내용") return;
        fields.push({
          label: lab.slice(0, 80),
          value: v.slice(0, 1200),
          num: opts.num || "",
          accent: !!opts.accent,
          wide: opts.wide === true || (opts.wide !== false && v.length > 48)
        });
      };

      if (sessionNo === 1) {
        const order = [
          ["f1", "기본 스펙 & 키워드"],
          ["f2", "주요 기능 (장점 & 능력)"],
          ["f3", "전원 충전법 (좋아하는 것)"],
          ["f4", "주의 사항 (경고)"],
          ["f5", "알림 설정 (듣고 싶은 말)"],
          ["f6", "연결 & 호환성"],
          ["f7", "숨겨진 이스터에그"],
          ["f8", "기본 탑재 가치관"],
          ["f9", "네트워크 확장 (관심 진로)"],
          ["f10", "모듈 조합 (모둠 역할)"],
          ["f11", "백신 프로그램 (스트레스)"],
          ["f12", "최근 데이터 저장 (관심사)"],
          ["f13", "오작동 해결법"],
          ["f14", "미래 버전 업데이트 계획"]
        ];
        for (const [id, lab] of order) push(lab, map[id]);
      } else if (sessionNo === 2) {
        const keys = Object.keys(map)
          .filter((k) => /^q\d+$/i.test(k))
          .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
        for (const k of keys) {
          const n = Number(k.slice(1)) || "";
          push(labels[k] || `${n}번 문항`, map[k], { num: String(n) });
        }
      } else if (sessionNo === 3) {
        push("직업", map.wcWinner, { accent: true, wide: false });
        push("차순위", map.wcRunnerUp, { accent: true, wide: false });
        push("1등으로 고른 가장 큰 이유", map.wcQ1, { wide: true });
        push("마지막까지 고민한 직업과의 차이", map.wcQ2, { wide: true });
        push("필요한 핵심 능력 3가지", map.wcQ3, { wide: true });
        push("앞으로 90일 안 실천 계획", map.wcQ4, { wide: true });
      } else if (sessionNo === 4) {
        const looksDump = (t) =>
          /관련\s*학과/.test(t) && /필요\s*자격/.test(t) && /직업\s*전망|예상\s*연봉/.test(t);
        const clip = (t, n) => {
          const s = String(t || "").replace(/\s+/g, " ").trim();
          if (!s) return "";
          return s.length > n ? `${s.slice(0, n).trim()}…` : s;
        };
        const clean = (v, n = 48) => {
          const t = String(v || "").trim();
          if (!t || isLiveChromeNoise(t) || looksDump(t)) return "";
          return clip(t, n);
        };
        const job = clean(map.f1, 36);
        const major = clean(map.f2, 36);
        if (job) push("희망 직업", job, { accent: true, wide: false });
        if (major) push("관련 학과", major, { accent: true, wide: false });
        const bits = [];
        if (job && major) {
          bits.push(`희망 직업은 「${job}」이며, 관련 학과·전공으로는 「${major}」를 살펴보았습니다.`);
        } else if (job) {
          bits.push(`희망 직업은 「${job}」로 정하고 직업 정보를 정리했습니다.`);
        } else if (major) {
          bits.push(`관심 학과·전공으로 「${major}」를 중심으로 진로를 탐색했습니다.`);
        } else {
          bits.push("희망 직업 SWOT 분석 활동에서 직업 정보와 자기 요인을 정리했습니다.");
        }
        const prep = clean(map.f3, 40);
        if (prep) bits.push(`필요 자격과 준비 사항으로는 ${prep}을(를) 파악했습니다.`);
        const payBits = [];
        const pay0 = clean(map.f4, 24);
        const pay5 = clean(map.f5, 24);
        const pay10 = clean(map.f6, 24);
        if (pay0) payBits.push(`초봉 ${pay0}`);
        if (pay5) payBits.push(`5년차 ${pay5}`);
        if (pay10) payBits.push(`10년차 이상 ${pay10}`);
        if (payBits.length) bits.push(`연차별 예상 연봉은 ${payBits.join(", ")} 정도로 조사했습니다.`);
        const retire = clean(map.f7, 24);
        if (retire) bits.push(`예상 퇴직 시점은 ${retire}으로 보았습니다.`);
        const outlook = clean(map.f8, 40);
        if (outlook) bits.push(`향후 10년 직업 전망은 ${outlook}이라고 정리했습니다.`);
        const duties = clean(map.f9, 42);
        if (duties) bits.push(`주요 업무·특징으로는 ${duties}을(를) 적었습니다.`);
        const s = clean(map.f10, 40);
        const w = clean(map.f11, 36);
        const o = clean(map.f12, 36);
        const t = clean(map.f13, 36);
        const swot = [];
        if (s) swot.push(`강점(S)은 ${s}`);
        if (w) swot.push(`약점(W)은 ${w}`);
        if (o) swot.push(`기회(O)는 ${o}`);
        if (t) swot.push(`위협(T)은 ${t}`);
        if (swot.length) bits.push(`SWOT 분석에서 ${swot.join(", ")}이라고 진단했습니다.`);
        const plans = [];
        const useS = clean(map.f14, 36);
        const fixW = clean(map.f15, 36);
        const planShort = clean(map.f16, 36);
        const planLong = clean(map.f17, 36);
        if (useS) plans.push(`강점 활용으로 ${useS}`);
        if (fixW) plans.push(`약점 보완으로 ${fixW}`);
        if (planShort) plans.push(`단기 계획으로 ${planShort}`);
        if (planLong) plans.push(`중장기 계획으로 ${planLong}`);
        if (plans.length) bits.push(`실행 전략으로는 ${plans.join(", ")}을(를) 세웠습니다.`);
        const helpers = clean(map.f18, 36);
        if (helpers) bits.push(`필요 역량과 조력자로는 ${helpers}을(를) 떠올렸습니다.`);
        const reflect = clean(map.f19, 44) || clean(map.fReflect, 44);
        if (reflect) bits.push(`성찰에서는 ${reflect}이라고 정리했습니다.`);
        const narrative =
          bits.length <= 1 && !job && !major
            ? "작성된 SWOT 내용이 아직 충분하지 않아 종합 문장을 만들기 어렵습니다."
            : bits.join(" ").replace(/\s+/g, " ").trim();
        push("SWOT 종합", narrative, { wide: true });
      } else {
        const keys = Object.keys(map)
          .filter((k) => /^(?:f|q)\d+$/i.test(k))
          .sort((a, b) => {
            const pa = a[0].toLowerCase() === "q" ? 1 : 0;
            const pb = b[0].toLowerCase() === "q" ? 1 : 0;
            if (pa !== pb) return pa - pb;
            return Number(a.slice(1)) - Number(b.slice(1));
          });
        for (const k of keys) {
          const n = k.replace(/\D/g, "");
          push(labels[k] || k.toUpperCase(), map[k], { num: n });
        }
      }

      if (map.fReflect || map.bReflect) {
        push("느낀점 (세특 참조)", map.fReflect || map.bReflect, { wide: true });
      }

      if (!fields.length) {
        const labeled = extractLiveLabeledAnswers(content);
        for (const a of labeled) push(a.label, a.value);
      }
      return fields;
    }

    function sectionLabelForLive() {
      if (sessionNo === 1) return "「나」 사용 설명서";
      if (sessionNo === 3) return "직업 월드컵 작성 내용";
      if (sessionNo === 4) return "SWOT 작성 내용";
      return "학생 작성 내용";
    }

    function uniquifyLiveSvgRefIds(rootEl, prefix) {
      if (!rootEl) return;
      const p = String(prefix || "x") + Math.random().toString(36).slice(2, 8);
      const idMap = new Map();
      rootEl.querySelectorAll("[id]").forEach((el) => {
        const oldId = el.getAttribute("id");
        if (!oldId) return;
        const next = `${p}-${oldId}`.replace(/[^a-zA-Z0-9_\-:]/g, "_");
        idMap.set(oldId, next);
        el.setAttribute("id", next);
      });
      if (!idMap.size) return;
      const rewrite = (val) => {
        let s = String(val || "");
        for (const [oldId, next] of idMap) {
          s = s
            .split(`url(#${oldId})`)
            .join(`url(#${next})`)
            .split(`url('#${oldId}')`)
            .join(`url('#${next}')`)
            .split(`url("#${oldId}")`)
            .join(`url("#${next}")`);
        }
        return s;
      };
      rootEl.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          if (!attr || !attr.value) return;
          if (!/url\(#/.test(attr.value) && attr.name !== "href" && attr.name !== "xlink:href") return;
          const next = rewrite(attr.value);
          if (next !== attr.value) el.setAttribute(attr.name, next);
        });
      });
    }

    function uniquifyLiveFaceHtml(faceHtml) {
      const raw = String(faceHtml || "").trim();
      if (!raw) return "";
      try {
        const doc = new DOMParser().parseFromString(`<div id="faceRoot">${raw}</div>`, "text/html");
        const root = doc.querySelector("#faceRoot");
        if (!root?.firstElementChild) return raw;
        uniquifyLiveSvgRefIds(root, "lx");
        return root.innerHTML;
      } catch {
        return raw;
      }
    }

    function extractLiveSession1Char(html) {
      const raw = String(html || "");
      if (!raw || !/infFaceWrap|inf-face-wrap|inf-photo/i.test(raw)) return null;
      try {
        const doc = new DOMParser().parseFromString(raw, "text/html");
        const faceWrap =
          doc.querySelector("#infFaceWrap") || doc.querySelector(".inf-face-wrap");
        const photo =
          faceWrap?.querySelector(".inf-photo") || doc.querySelector(".inf-photo");
        if (!photo) return null;
        const hasSvg = !!photo.querySelector("svg");
        const hasImg = !!photo.querySelector("img[src]");
        if (!hasSvg && !hasImg && !String(photo.innerHTML || "").trim()) return null;
        const clone = photo.cloneNode(true);
        clone
          .querySelectorAll(
            "script, .inf-photo-spark, .inf-photo-ring, .inf-photo-shade, .inf-photo-lv, .inf-photo-arc, .inf-photo-power"
          )
          .forEach((el) => el.remove());
        uniquifyLiveSvgRefIds(clone, "lf");
        const name =
          (doc.querySelector(".inf-name-text")?.textContent || "").trim() ||
          (doc.querySelector("#infName")?.textContent || "").trim() ||
          (doc.querySelector("#sheetDisplayName")?.getAttribute("value") || "").trim() ||
          (doc.querySelector("#sheetDisplayName")?.textContent || "").trim();
        let mbti = (doc.querySelector(".inf-photo-mbti")?.textContent || "")
          .replace(/^MBTI\s*/i, "")
          .trim();
        if (!mbti) mbti = (doc.querySelector(".inf-mbti-bit")?.textContent || "").trim();
        let arch = "";
        const badge = doc.querySelector(".inf-class-badge b");
        if (badge) {
          const b = badge.cloneNode(true);
          b.querySelectorAll(".inf-mbti-sep, .inf-mbti-bit").forEach((el) => el.remove());
          arch = (b.textContent || "")
            .replace(/,?\s*MBTI는\s*/gi, "")
            .replace(/^★\s*/, "")
            .replace(/,\s*$/, "")
            .trim();
        }
        if (!arch) {
          const classLine = (doc.querySelector("#infClass")?.textContent || "").trim();
          if (classLine && !/분석 중|아키타입/.test(classLine)) {
            arch = classLine.replace(/^★\s*/, "").trim();
          }
        }
        if (!name && !mbti && !hasSvg && !hasImg) return null;
        return {
          faceHtml: clone.outerHTML,
          name: name || "이름 미정",
          mbti,
          arch
        };
      } catch {
        return null;
      }
    }

    function assessLiveCompleteness(content) {
      const html = String(content || "");
      const exportAttr = /data-complete=["']([01])["']/i.exec(html);
      const filledAttr = /data-filled=["'](\d+)["']/i.exec(html);
      const fieldsAttr = /data-fields=["'](\d+)["']/i.exec(html);
      const filled = Number(filledAttr?.[1]) || 0;
      const fieldCount = Number(fieldsAttr?.[1]) || 0;
      const pct = fieldCount > 0 ? Math.max(0, Math.min(100, Math.round((filled / fieldCount) * 100))) : exportAttr?.[1] === "0" ? 0 : 100;
      if (exportAttr) {
        if (exportAttr[1] === "0") {
          return { incomplete: true, pct, label: `(${pct}% 작성됨)` };
        }
        return { incomplete: false, pct: 100, label: "" };
      }
      if (sessionNo === 3) {
        const map = extractLiveFieldMap(html);
        if (String(map.wcWinner || "").trim() || /is-wc-done/i.test(html)) {
          return { incomplete: false, pct: 100, label: "" };
        }
      }
      return { incomplete: false, pct: 100, label: "" };
    }

    function formatLiveTime(iso) {
      try {
        return new Date(iso).toLocaleString("ko-KR", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch {
        return "";
      }
    }

    function buildLiveReaderHtml(who, fields) {
      const list = Array.isArray(fields) ? fields : [];
      const displayName = who?.name || "이름 없음";
      const no = who?.no || "—";
      const art = who?.faceHtml
        ? `<div class="deck-reader-art" aria-hidden="true">${uniquifyLiveFaceHtml(who.faceHtml)}</div>`
        : `<div class="deck-reader-art is-fallback" aria-hidden="true">${escapeHtml(
            String(displayName).slice(0, 1) || "?"
          )}</div>`;
      const tags = [];
      if (who?.incompleteLabel) {
        tags.push(`<span class="deck-reader-tag is-warn">${escapeHtml(who.incompleteLabel)}</span>`);
      }
      if (who?.mbti) {
        tags.push(`<span class="deck-reader-tag is-blue">MBTI ${escapeHtml(who.mbti)}</span>`);
      }
      if (who?.arch) {
        tags.push(`<span class="deck-reader-tag">★ ${escapeHtml(who.arch)}</span>`);
      }
      tags.push(`<span class="deck-reader-tag">${escapeHtml(String(sessionNo))}차시</span>`);
      if (who?.createdAt) {
        const t = formatLiveTime(who.createdAt);
        if (t) tags.push(`<span class="deck-reader-tag">${escapeHtml(t)}</span>`);
      }
      const withWide = list.map((f) => ({
        ...f,
        wide: !!(f.wide || (f.value || "").length > 48)
      }));
      const useFlow = withWide.length > 0 && withWide.every((f) => f.wide);
      const fieldHtml = withWide.length
        ? `<div class="${useFlow ? "deck-reader-flow" : "deck-reader-grid"}">${withWide
            .map(
              (f) => `<article class="deck-reader-field${f.accent ? " is-accent" : ""}${f.wide ? " is-wide" : ""}">
              <p class="deck-reader-field-k">${escapeHtml(f.label)}</p>
              <p class="deck-reader-field-v">${escapeHtml(f.value)}</p>
            </article>`
            )
            .join("")}</div>`
        : `<p class="deck-reader-empty">정리할 입력 내용이 아직 없습니다.</p>`;

      return `<div class="deck-reader-sheet">
        <div class="deck-reader-top">
          ${art}
          <div class="deck-reader-who">
            <div class="deck-reader-no">${escapeHtml(no)}</div>
            <div class="deck-reader-name">${escapeHtml(displayName)}</div>
            <div class="deck-reader-tags">${tags.join("")}</div>
          </div>
        </div>
        <section class="deck-reader-section">
          <p class="deck-reader-label">${escapeHtml(sectionLabelForLive())}</p>
          ${fieldHtml}
        </section>
      </div>`;
    }

    function buildLiveCardHtml(card, dealIdx, focusId, isTeacher) {
      const empty = !!card.empty;
      const active = !empty && card.id && card.id === focusId;
      const s3 = sessionNo === 3;
      const s4 = sessionNo === 4;
      const name = card.name || "이름 없음";
      const art = card.faceHtml
        ? `<div class="deck-card-art" aria-hidden="true">${uniquifyLiveFaceHtml(card.faceHtml)}</div>`
        : `<div class="deck-card-art is-fallback" aria-hidden="true">${escapeHtml(
            String(name).slice(0, 1) || "?"
          )}</div>`;
      const badge =
        !empty && card.incompleteLabel
          ? `<span class="deck-card-badge">${escapeHtml(card.incompleteLabel)}</span>`
          : "";
      let mid = "";
      if (s3 || s4) {
        const winner = String(card.winner || "").trim();
        const runner = String(card.runner || "").trim();
        const lab1 = s4 ? "희망직업" : "직업";
        const lab2 = s4 ? "학과" : "차순위";
        mid = `<div class="deck-card-jobs"${empty ? ' aria-hidden="true"' : ""}>
          <div class="deck-card-job${winner || empty ? (winner ? "" : " is-empty") : " is-empty"}"><span>${lab1}</span><b>${escapeHtml(
            empty ? "—" : winner || "미입력"
          )}</b></div>
          <div class="deck-card-job is-runner${runner || empty ? (runner ? "" : " is-empty") : " is-empty"}"><span>${lab2}</span><b>${escapeHtml(
            empty ? "—" : runner || "미입력"
          )}</b></div>
        </div>`;
      } else {
        const metaLine = empty
          ? "미제출"
          : card.mbti
            ? `MBTI ${card.mbti}`
            : card.meta || "제출됨";
        const archLine = !empty && card.arch ? `★ ${card.arch}` : "";
        mid = `<div class="deck-card-meta">${escapeHtml(metaLine)}</div>
          <div class="deck-card-arch">${escapeHtml(archLine)}</div>`;
      }
      const attrs = empty
        ? `disabled data-empty="1"`
        : `data-sub-id="${escapeHtml(card.id || "")}"`;
      return `<button type="button" class="deck-card${empty ? " is-empty" : ""}${active ? " is-active" : ""}${
        s3 ? " is-s3" : s4 ? " is-s4" : ""
      }" ${attrs} style="--deal:${dealIdx}" ${isTeacher && !empty ? "" : 'tabindex="-1"'} title="${
        empty ? "미제출" : "펼쳐서 내용 보기"
      }">
        <div class="deck-card-rank"><span class="deck-card-no">${escapeHtml(card.no || "—")}</span>${badge}</div>
        ${art}
        <div class="deck-card-name">${escapeHtml(name)}</div>
        ${mid}
        <div class="deck-card-hint">${empty ? "아직 카드가 뒤집히지 않았어요" : "탭! 펼쳐 보기"}</div>
      </button>`;
    }

    function ensureDom() {
      if (!document.getElementById("liveDeckNotoSans")) {
        const link = document.createElement("link");
        link.id = "liveDeckNotoSans";
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Sans+KR:wght@500;600;700&family=Noto+Sans+KR:wght@400;600;700;800&family=Noto+Serif+KR:wght@600;700;800&display=swap";
        document.head.appendChild(link);
      }
      if (!document.getElementById("liveReportDeckCss")) {
        const css = document.createElement("link");
        css.id = "liveReportDeckCss";
        css.rel = "stylesheet";
        css.href = "./live-report-deck.css?v=2132";
        document.head.appendChild(css);
      }
      let root = document.getElementById("liveReportDeck");
      if (root) {
        root.classList.add("report-deck");
        root.classList.remove("live-deck");
        if (
          !root.querySelector(".report-deck-panel") ||
          !root.querySelector("#btnLiveDeckPrint") ||
          !root.querySelector("#liveDeckArena") ||
          !root.querySelector("#liveDeckArenaNow") ||
          !root.querySelector("#btnLiveArenaFold")
        ) {
          root.remove();
          root = null;
        } else {
          return root;
        }
      }
      if (!root) {
        root = document.createElement("div");
        root.id = "liveReportDeck";
        root.className = "report-deck";
        root.setAttribute("aria-hidden", "true");
        root.innerHTML = `
        <div class="report-deck-panel" role="dialog" aria-modal="true" aria-labelledby="liveDeckTitle">
          <div class="report-deck-head">
            <div style="min-width:0;flex:1">
              <h3 id="liveDeckTitle"><span class="deck-title-brand">&lt;보고서 종합&gt;</span> <span class="deck-title-lesson">카드덱</span></h3>
              <p class="sub" id="liveDeckSub" hidden></p>
            </div>
            <div class="report-deck-actions">
              <button type="button" class="deck-icon-btn" id="btnLiveDeckPrint" title="현재 화면 인쇄">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V4h10v4"/><rect x="5" y="12" width="14" height="8" rx="1.5"/><path d="M5 14H3.5A1.5 1.5 0 0 1 2 12.5v-3A1.5 1.5 0 0 1 3.5 8h17A1.5 1.5 0 0 1 22 9.5v3a1.5 1.5 0 0 1-1.5 1.5H19"/><path d="M8 16h8"/></svg>
                <span>인쇄</span>
              </button>
              <button type="button" class="deck-icon-btn" id="btnLiveDeckSave" title="현재 화면 저장">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"/><path d="M8 10l4 4 4-4"/><path d="M5 18h14"/></svg>
                <span>저장</span>
              </button>
              <button type="button" class="deck-icon-btn is-emphasis" id="btnLiveDeckBack" hidden title="카드덱으로 돌아가기">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4.5" y="7.5" width="11" height="13" rx="1.6" transform="rotate(-12 10 14)"/>
                  <rect x="7.5" y="5.5" width="11" height="13" rx="1.6"/>
                </svg>
                <span>카드덱</span>
              </button>
              <button type="button" class="deck-icon-btn" id="btnLiveDeckClose" title="닫기">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                <span>닫기</span>
              </button>
            </div>
          </div>
          <div class="report-deck-arena" id="liveDeckArena" hidden>
            <div class="deck-arena-foldbar">
              <span class="deck-arena-foldbar-label">직업 월드컵 랭킹</span>
              <button type="button" class="deck-arena-fold-btn" id="btnLiveArenaFold" aria-expanded="true" title="랭킹 접기" aria-label="랭킹 접기">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>
              </button>
            </div>
            <div class="deck-arena-fold-body" id="liveDeckArenaFoldBody">
              <div class="deck-arena-fold-inner">
                <div class="deck-arena-now" id="liveDeckArenaNow" aria-label="현재 학급"></div>
                <div class="deck-arena-board" id="liveDeckArenaBoard" hidden></div>
              </div>
            </div>
          </div>
          <div class="report-deck-body">
            <div class="report-deck-reader" id="liveDeckReader" aria-live="polite"></div>
            <div class="report-deck-table" id="liveDeckTable"></div>
          </div>
        </div>`;
        document.body.appendChild(root);
      }
      return root;
    }

    function paintChrome() {
      const root = ensureDom();
      const isTeacher = isActivityTeacherUi();
      root.classList.toggle("is-viewer", !isTeacher);
      const printBtn = document.getElementById("btnLiveDeckPrint");
      const saveBtn = document.getElementById("btnLiveDeckSave");
      const close = document.getElementById("btnLiveDeckClose");
      const back = document.getElementById("btnLiveDeckBack");
      if (printBtn) printBtn.hidden = !isTeacher;
      if (saveBtn) saveBtn.hidden = !isTeacher;
      if (close) close.hidden = false;
      if (back) back.hidden = !isTeacher || !root.classList.contains("is-spread");
      const liveBtn = document.getElementById("btnLiveReport");
      if (liveBtn) liveBtn.classList.toggle("is-on", !!localState.open);
    }

    function sortLiveArenaStudents(list) {
      return (list || [])
        .slice()
        .sort((a, b) => {
          const na = Number(String(a.no || "").replace(/\D/g, "")) || 0;
          const nb = Number(String(b.no || "").replace(/\D/g, "")) || 0;
          if (na !== nb) return na - nb;
          return String(a.no || "").localeCompare(String(b.no || ""), "ko", { numeric: true });
        });
    }

    let liveArenaJobLookup = new Map();

    function openLiveArenaWho(board, jobName, scopeKey = "") {
      if (!board || !jobName) return;
      let who = board.querySelector(".deck-arena-who");
      if (!who) {
        who = document.createElement("div");
        who.className = "deck-arena-who";
        board.appendChild(who);
      }
      const hit =
        liveArenaJobLookup.get(`${scopeKey}::${jobName}`) ||
        liveArenaJobLookup.get(`::${jobName}`) ||
        null;
      const students = sortLiveArenaStudents(hit?.students || []);
      const emoji = hit?.emoji || "🏆";
      const scopeLabel = hit?.scopeLabel ? ` · ${hit.scopeLabel}` : "";
      who.hidden = false;
      who.innerHTML = `
        <div class="deck-arena-who-head">
          <div>
            <strong>${escapeHtml(emoji)} ${escapeHtml(jobName)}</strong>
            <span>${students.length}명${escapeHtml(scopeLabel)} · 학번 순</span>
          </div>
          <button type="button" class="deck-arena-who-x" data-arena-who-close="1" aria-label="닫기">닫기</button>
        </div>
        ${
          students.length
            ? `<ol class="deck-arena-who-list">${students
                .map(
                  (st, idx) =>
                    `<li><span class="deck-arena-who-idx">${idx + 1}</span><span class="deck-arena-who-no">${escapeHtml(st.no || "—")}</span><span class="deck-arena-who-name">${escapeHtml(st.name || "이름 없음")}</span></li>`
                )
                .join("")}</ol>`
            : `<p class="deck-arena-who-empty">이 직업을 우승으로 고른 학생이 아직 없어요.</p>`
        }`;
      who.scrollIntoView({ behavior: "smooth", block: "nearest" });
      who.querySelector("[data-arena-who-close]")?.addEventListener("click", () => {
        who.hidden = true;
        who.innerHTML = "";
      });
    }

    function bindLiveArenaJobClicks(board, ranks, cols) {
      if (!board) return;
      liveArenaJobLookup = new Map();
      const register = (list, scopeKey, scopeLabel) => {
        for (const r of list || []) {
          if (!r?.name) continue;
          const key = `${scopeKey}::${r.name}`;
          liveArenaJobLookup.set(key, {
            job: r.name,
            emoji: r.emoji || "🏆",
            students: r.students || [],
            scopeLabel
          });
          if (!scopeKey) liveArenaJobLookup.set(`::${r.name}`, liveArenaJobLookup.get(key));
        }
      };
      register(ranks, "", "우리 반");
      for (const col of cols || []) register(col.ranks, col.key || col.title, col.title);
      board.querySelectorAll("[data-arena-job]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const job = btn.getAttribute("data-arena-job") || "";
          const scope =
            btn.getAttribute("data-arena-scope") ||
            btn.closest?.("[data-arena-scope]")?.getAttribute("data-arena-scope") ||
            "";
          openLiveArenaWho(board, job, scope);
        });
      });
    }

    function paintLiveArena(arena, sn) {
      const host = document.getElementById("liveDeckArena");
      const nowEl = document.getElementById("liveDeckArenaNow");
      const board = document.getElementById("liveDeckArenaBoard");
      if (!host || !nowEl) return;
      if (!arena && !Number(sn)) {
        host.hidden = true;
        if (board) {
          board.hidden = true;
          board.innerHTML = "";
        }
        return;
      }
      const g = Number(arena?.grade) || 1;
      const c = Number(arena?.classNo) || 1;
      const dept = String(arena?.dept || "").trim();
      const nowLabel =
        String(arena?.nowLabel || "").trim() ||
        (dept ? `${g}학년 ${c}반 · ${dept}` : `${g}학년 ${c}반`);
      nowEl.innerHTML = `<span class="deck-arena-now-kicker">현재 탐구 학급</span><span class="deck-arena-now-title"><em>${escapeHtml(nowLabel)}</em></span>`;
      host.hidden = false;
      const foldbar = host.querySelector(".deck-arena-foldbar");
      if (foldbar) foldbar.hidden = Number(sn) !== 3;
      if (Number(sn) !== 3) applyLiveArenaFoldUi(false);
      else if (typeof arena?.folded === "boolean") applyLiveArenaFoldUi(arena.folded);
      if (!board) return;
      if (Number(sn) !== 3) {
        board.hidden = true;
        board.innerHTML = "";
        return;
      }
      board.hidden = false;
      const mode = arena?.mode || "ours";
      let cols = null;
      if (mode !== "ours") {
        if (arena?.compare?.units) {
          const built = buildLiveCompareHtml(mode, arena.compare.units, arena);
          board.innerHTML = built.html;
          cols = built.cols;
          bindLiveArenaJobClicks(board, null, cols);
        } else {
          board.innerHTML = `<div class="deck-arena-board-head"><strong>비교</strong><span class="deck-arena-live">LIVE</span></div><p class="deck-arena-empty">비교 데이터를 불러오는 중…</p>`;
        }
      } else {
        const phase = arena?.phase || "idle";
        const stats = arena?.stats || { played: 0, ranks: [] };
        if (phase === "revealed") {
          liveArenaRollFocus = -999;
          board.classList.remove("is-counting", "is-rolling");
          board.classList.add("is-champ");
          board.innerHTML = buildLiveWorldcupArenaHtml(stats);
          bindLiveArenaJobClicks(board, stats.ranks || [], null);
          requestAnimationFrame(() => {
            board.querySelectorAll("[data-arena-row]").forEach((el) => {
              el.classList.add("is-ready", "is-shown");
            });
            board.querySelectorAll("[data-count-to]").forEach((el) => {
              el.textContent = `${el.getAttribute("data-count-to") || 0}%`;
              el.classList.add("is-done");
            });
            board.querySelectorAll(".deck-arena-meter > i").forEach((el) => {
              const row = el.closest("[data-arena-row]");
              const pct = row?.style.getPropertyValue("--pct") || "0%";
              el.style.width = pct;
            });
          });
          setTimeout(() => board.classList.remove("is-champ"), 1600);
        } else if (phase === "rolling") {
          const live = arena?.live;
          board.classList.remove("is-counting");
          board.classList.add("is-rolling");
          if (!board.querySelector("[data-arena-list]") || liveArenaRollFocus === -999) {
            board.innerHTML = buildLiveRaceShellHtml(stats);
            liveArenaRollFocus = -1;
          }
          const tick = Number(live?.tick) || 0;
          if (live && tick !== liveArenaRollFocus) {
            liveArenaRollFocus = tick;
            paintLiveRaceBoard(board, live);
          }
        } else if (phase === "countdown") {
          liveArenaRollFocus = -999;
          board.classList.add("is-counting");
          board.classList.remove("is-rolling");
          board.innerHTML = buildLiveCountdownHtml(Number(arena?.countdown) || 3);
        } else {
          liveArenaRollFocus = -999;
          board.classList.remove("is-counting", "is-rolling", "is-champ");
          board.innerHTML = buildLiveStartHtml(stats);
        }
      }
      if (mode !== "ours") {
        requestAnimationFrame(() => {
          board.querySelectorAll("[data-arena-row], [data-arena-col]").forEach((el) => {
            el.classList.add("is-ready");
          });
          board.querySelectorAll("[data-count-to]").forEach((el) => {
            el.textContent = `${el.getAttribute("data-count-to") || 0}%`;
          });
        });
      }
    }

    function buildLiveRaceShellHtml(stats) {
      const played = Number(stats?.played) || 0;
      return `
        <div class="deck-arena-board-head">
          <strong>직업 월드컵 랭킹 · 우리 반</strong>
          <span class="deck-arena-live is-tally">TALLY</span>
          <span data-arena-sub>0 / ${played}게임 집계 중</span>
        </div>
        <div class="deck-arena-ticker" data-arena-ticker>
          <em>LIVE COUNT</em>
          <strong>직업이 등장하면 초마다 집계됩니다</strong>
        </div>
        <div class="deck-arena-stage"><div class="deck-arena-podium" data-arena-podium></div></div>
        <div class="deck-arena-list" data-arena-list></div>
        <div class="deck-arena-who" hidden></div>`;
    }

    function renderLivePodiumHtml(top3) {
      return [0, 1, 2]
        .map((i) => {
          const r = top3[i];
          const crown = i === 0 ? `<div class="deck-arena-pod-crown" aria-hidden="true">👑</div>` : "";
          if (!r) {
            return `<div class="deck-arena-pod is-${i + 1} is-empty" style="--pod-i:${i}">${crown}
              <div class="deck-arena-pod-rank">${i + 1}위</div>
              <div class="deck-arena-pod-emoji">·</div>
              <div class="deck-arena-pod-name">집계 중</div>
            </div>`;
          }
          const n = (r.students || []).length || r.wins || 0;
          return `<div class="deck-arena-pod is-${i + 1}" style="--pod-i:${i}">
            ${crown}
            <div class="deck-arena-pod-rank">${i + 1}위</div>
            <div class="deck-arena-pod-emoji">${escapeHtml(r.emoji || "🏆")}</div>
            <button type="button" class="deck-arena-pod-name is-job" data-arena-job="${escapeHtml(r.name)}">${escapeHtml(r.name)}</button>
            <div class="deck-arena-pod-pct is-done">${Number(r.pct) || 0}%</div>
            <div class="deck-arena-pod-hint">우승 ${r.wins} · 명단 ${n}</div>
          </div>`;
        })
        .join("");
    }

    function renderLiveRowHtml(r, i, totalPlayed, flashJob) {
      const pct = Math.max(0, Math.min(100, Number(r.pct) || 0));
      const n = (r.students || []).length || r.wins || 0;
      const flash = flashJob && flashJob === r.name ? " is-hit is-live" : "";
      return `<div class="deck-arena-row${i < 3 ? " is-top" : ""}${flash}" style="--i:${i};--pct:${pct}%" data-arena-row="1" data-job="${escapeHtml(r.name)}">
        <div class="deck-arena-rank">${i + 1}</div>
        <button type="button" class="deck-arena-job is-job" data-arena-job="${escapeHtml(r.name)}">
          <em>${escapeHtml(r.emoji || "🏆")}</em><b>${escapeHtml(r.name)}</b>
        </button>
        <div class="deck-arena-meter" aria-hidden="true"><i style="width:${pct}%"></i></div>
        <div class="deck-arena-pct is-done">${pct}%</div>
        <div class="deck-arena-meta">우승 <b class="deck-arena-win-n">${r.wins}</b>회 / 집계 ${totalPlayed} · <span class="deck-arena-meta-link">명단 ${n}명 ▸</span></div>
      </div>`;
    }

    function paintLiveRaceBoard(board, live) {
      if (!board || !live) return;
      const list = board.querySelector("[data-arena-list]");
      const podium = board.querySelector("[data-arena-podium]");
      const ticker = board.querySelector("[data-arena-ticker]");
      const sub = board.querySelector("[data-arena-sub]");
      const ranks = Array.isArray(live.ranks) ? live.ranks : [];
      const tallyPlayed = Number(live.tallyPlayed) || 0;
      const flashJob = live.lastJob || "";
      const prevRects = new Map();
      if (list) {
        list.querySelectorAll("[data-job]").forEach((el) => {
          prevRects.set(el.getAttribute("data-job"), el.getBoundingClientRect());
        });
      }
      if (sub) sub.textContent = `${tallyPlayed} / ${Number(live.finalPlayed) || tallyPlayed}게임 집계 중`;
      if (ticker) {
        if (live.done) {
          ticker.classList.add("is-done");
          ticker.innerHTML = ranks[0]
            ? `<em>COMPLETE</em> <strong>${escapeHtml(ranks[0].name)}</strong> 최종 1위`
            : `<em>COMPLETE</em>`;
        } else if (live.intro && flashJob) {
          ticker.classList.remove("is-done");
          ticker.innerHTML = `<em>등장</em> <strong>${escapeHtml(flashJob)}</strong> 대기열 합류`;
        } else if (flashJob) {
          ticker.classList.remove("is-done");
          ticker.innerHTML = `<em>${live.tick || 0}초</em> <strong>+1 ${escapeHtml(flashJob)}</strong> · 순위 재정렬`;
        }
      }
      if (podium) podium.innerHTML = renderLivePodiumHtml(ranks.slice(0, 3));
      if (list) {
        list.innerHTML = ranks.map((r, i) => renderLiveRowHtml(r, i, tallyPlayed, flashJob)).join("");
        list.querySelectorAll("[data-job]").forEach((el) => {
          const key = el.getAttribute("data-job");
          const first = prevRects.get(key);
          if (!first) {
            el.classList.add("is-enter");
            return;
          }
          const last = el.getBoundingClientRect();
          const dy = first.top - last.top;
          if (Math.abs(dy) < 2) return;
          el.style.transition = "none";
          el.style.transform = `translateY(${dy}px)`;
          requestAnimationFrame(() => {
            el.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
            el.style.transform = "";
            el.classList.add("is-swap");
          });
        });
      }
      bindLiveArenaJobClicks(board, ranks, null);
    }

    function buildLiveStartHtml(stats) {
      const played = Number(stats?.played) || 0;
      const jobs = Array.isArray(stats?.ranks) ? stats.ranks.length : 0;
      return `
        <div class="deck-arena-board-head">
          <strong>직업 월드컵 랭킹 · 우리 반</strong>
          <span class="deck-arena-live">READY</span>
          <span>집계 대기</span>
        </div>
        <div class="deck-arena-start">
          <div class="deck-arena-start-inner">
            <div class="deck-arena-start-kicker">World Cup Ranking</div>
            <div class="deck-arena-start-title">우승 직업 집계</div>
            <p class="deck-arena-start-sub">
              <strong>${played}</strong>게임 완료
              ${jobs ? ` · 후보 직업 <strong>${jobs}</strong>종` : ""}
            </p>
            <button type="button" class="deck-arena-start-btn" disabled>START</button>
            <p class="deck-arena-start-hint">교사가 START를 누르면 카운트다운이 시작됩니다</p>
          </div>
        </div>`;
    }

    function buildLiveCountdownHtml(n) {
      const isGo = Number(n) === 0;
      return `
        <div class="deck-arena-board-head">
          <strong>직업 월드컵 랭킹 · 우리 반</strong>
          <span class="deck-arena-live">LIVE</span>
          <span>집계 시작</span>
        </div>
        <div class="deck-arena-count">
          <div>
            <div class="deck-arena-count-num${isGo ? " is-go" : ""}">${isGo ? "GO!" : String(n)}</div>
            <div class="deck-arena-count-cap">${isGo ? "ranking reveal" : "get ready"}</div>
          </div>
        </div>`;
    }

    function buildLiveWorldcupArenaHtml(stats) {
      const played = Number(stats?.played) || 0;
      const ranks = Array.isArray(stats?.ranks) ? stats.ranks : [];
      if (!played || !ranks.length) {
        return `
          <div class="deck-arena-board-head">
            <strong>직업 월드컵 랭킹 · 우리 반</strong>
            <span class="deck-arena-live">LIVE</span>
          </div>
          <p class="deck-arena-empty">아직 우승 직업이 없어요. 월드컵을 마치면 랭킹이 올라갑니다.</p>`;
      }
      const top = ranks.slice(0, 3);
      const podium = `<div class="deck-arena-stage"><div class="deck-arena-podium">${renderLivePodiumHtml(top)}</div></div>`;
      const rows = ranks
        .slice(0, 16)
        .map((r, i) => renderLiveRowHtml(r, i, played, ""))
        .join("");
      return `
        <div class="deck-arena-board-head">
          <strong>직업 월드컵 랭킹 · 우리 반</strong>
          <span class="deck-arena-live">LIVE</span>
          <span>${played}게임 · 직업명 클릭 → 학생</span>
        </div>
        ${podium}
        <div class="deck-arena-list">${rows}</div>
        <div class="deck-arena-who" hidden></div>`;
    }

    function buildLiveCompareHtml(mode, units, arena) {
      const label =
        mode === "grade" ? "학년별 우승 비교" : mode === "dept" ? "학과별 우승 비교" : "반별 우승 비교";
      const nowLabel = String(arena?.nowLabel || "");
      let cols = [];

      const mergeRanks = (group) => {
        const counts = new Map();
        const people = new Map();
        let played = 0;
        for (const u of group) {
          for (const r of u.ranks || []) {
            counts.set(r.name, (counts.get(r.name) || 0) + (Number(r.wins) || 0));
            played += Number(r.wins) || 0;
            if (!people.has(r.name)) people.set(r.name, []);
            const bag = people.get(r.name);
            for (const st of r.students || []) {
              const key = `${st.no}|${st.name}`;
              if (bag.some((x) => `${x.no}|${x.name}` === key)) continue;
              bag.push({ no: st.no, name: st.name });
            }
          }
        }
        const ranks = [...counts.entries()]
          .map(([name, wins]) => ({
            name,
            wins,
            pct: played ? Math.round((wins / played) * 1000) / 10 : 0,
            emoji: "🏆",
            students: sortLiveArenaStudents(people.get(name) || [])
          }))
          .sort((a, b) => b.wins - a.wins);
        return { played, ranks };
      };

      if (mode === "grade") {
        cols = [1, 2, 3]
          .map((g) => {
            const group = (units || []).filter((u) => Number(u.grade) === g);
            if (!group.length) return null;
            const merged = mergeRanks(group);
            return {
              key: `g${g}`,
              title: `${g}학년`,
              sub: `${group.length}개 학급 · ${merged.played}게임`,
              current: group.some((u) => u.label === nowLabel),
              ranks: merged.ranks
            };
          })
          .filter(Boolean);
      } else if (mode === "dept") {
        const map = new Map();
        for (const u of units || []) {
          const key = String(u.dept || "").trim() || "(학과 미설정)";
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(u);
        }
        cols = [...map.entries()].map(([title, group]) => {
          const merged = mergeRanks(group);
          return {
            key: `d:${title}`,
            title,
            sub: `${group.length}개 학급 · ${merged.played}게임`,
            current: group.some((u) => u.label === nowLabel),
            ranks: merged.ranks
          };
        });
      } else {
        cols = (units || []).map((u) => ({
          key: u.classId || u.label,
          title: u.label,
          sub: `${u.played || 0}게임`,
          current: u.label === nowLabel,
          ranks: u.ranks || []
        }));
      }
      if (!cols.length) {
        return {
          html: `<div class="deck-arena-board-head"><strong>${escapeHtml(label)}</strong><span class="deck-arena-live">LIVE</span></div><p class="deck-arena-empty">비교 데이터가 없어요.</p>`,
          cols: []
        };
      }
      const body = cols
        .map((col, i) => {
          const top = (col.ranks || []).slice(0, 3);
          const bars = top.length
            ? top
                .map((r) => {
                  const pct = Math.max(0, Math.min(100, Number(r.pct) || 0));
                  const n = (r.students || []).length || r.wins || 0;
                  return `<button type="button" class="deck-arena-col-champ is-job" data-arena-job="${escapeHtml(r.name)}" data-arena-scope="${escapeHtml(col.key || col.title)}" title="이 직업을 고른 학생 보기">
                      <span>${escapeHtml(r.emoji || "🏆")} ${escapeHtml(r.name)}</span><b>${pct}%</b>
                    </button>
                    <div class="deck-arena-col-bar" style="--pct:${pct}%"><i></i></div>
                    <div class="deck-arena-col-hint">명단 ${n}명 ▸</div>`;
                })
                .join("")
            : `<p class="deck-arena-col-empty">우승 기록 없음</p>`;
          return `<div class="deck-arena-col${col.current ? " is-current" : ""}" style="--i:${i}" data-arena-col="1" data-arena-scope="${escapeHtml(col.key || col.title)}">
            <div class="deck-arena-col-h">${escapeHtml(col.title)}<small>${escapeHtml(col.sub || "")}</small></div>
            ${bars}
          </div>`;
        })
        .join("");
      return {
        html: `
        <div class="deck-arena-board-head">
          <strong>${escapeHtml(label)}</strong>
          <span class="deck-arena-live">LIVE</span>
          <span>직업명 클릭 → 학생</span>
        </div>
        <div class="deck-arena-compare">${body}</div>
        <div class="deck-arena-who" hidden></div>`,
        cols
      };
    }

    function paintFromState(state, opts = {}) {
      localState = {
        open: !!state.open,
        title: state.title || "",
        sub: state.sub || "",
        cards: Array.isArray(state.cards) ? state.cards : [],
        focusId: state.focusId || "",
        fields: Array.isArray(state.fields) ? state.fields : [],
        who: state.who || null,
        arena: state.arena || null,
        sessionNo: Number(state.sessionNo) || sessionNo
      };
      const root = ensureDom();
      const titleEl = document.getElementById("liveDeckTitle");
      const subEl = document.getElementById("liveDeckSub");
      const table = document.getElementById("liveDeckTable");
      const reader = document.getElementById("liveDeckReader");
      document.body.classList.toggle("live-deck-open", !!localState.open);
      if (titleEl) {
        titleEl.innerHTML = localState.title
          ? localState.title
          : `<span class="deck-title-brand">&lt;보고서 종합&gt;</span> <span class="deck-title-lesson">카드덱</span>`;
      }
      if (subEl) {
        subEl.textContent = localState.sub || "";
        subEl.hidden = !localState.sub;
      }

      if (!localState.open) {
        root.classList.remove("is-open", "is-spread", "is-snap");
        root.setAttribute("aria-hidden", "true");
        if (table) table.innerHTML = "";
        if (reader) reader.innerHTML = "";
        paintLiveArena(null, 0);
        paintChrome();
        return;
      }

      root.classList.add("is-open");
      if (!opts.loading) root.classList.add("is-snap");
      root.setAttribute("aria-hidden", "false");
      const focusId = localState.focusId;
      const isSpread = !!focusId;
      root.classList.toggle("is-spread", isSpread);
      paintLiveArena(localState.arena, localState.sessionNo);

      if (table) {
        if (!localState.cards.length) {
          table.innerHTML = `<p class="report-deck-empty">${opts.loading ? "카드를 섞는 중…" : "표시할 학생이 없습니다."}</p>`;
        } else {
          const isTeacher = isActivityTeacherUi();
          table.innerHTML = localState.cards
            .map((c, i) => buildLiveCardHtml(c, i, focusId, isTeacher))
            .join("");
        }
      }

      if (reader) {
        if (isSpread && localState.who) {
          reader.innerHTML = buildLiveReaderHtml(localState.who, localState.fields);
        } else {
          reader.innerHTML = "";
        }
      }
      paintChrome();
    }

    function snapshotPayload() {
      return {
        open: localState.open,
        title: localState.title,
        sub: localState.sub,
        cards: localState.cards,
        focusId: localState.focusId,
        fields: localState.fields,
        who: localState.who,
        arena: localState.arena,
        sessionNo: localState.sessionNo || sessionNo
      };
    }

    function cardMetaPreview(content) {
      if (sessionNo === 3) {
        const map = extractLiveFieldMap(content);
        const winner = String(map.wcWinner || "").trim();
        const runner = String(map.wcRunnerUp || "").trim();
        if (winner || runner) {
          const parts = [];
          if (winner) parts.push(`직업 ${winner}`);
          if (runner) parts.push(`차순위 ${runner}`);
          return parts.join(" · ").slice(0, 60);
        }
      }
      if (sessionNo === 4) {
        const map = extractLiveFieldMap(content);
        const looksDump = (t) =>
          /관련\s*학과/.test(t) && /필요\s*자격/.test(t) && /직업\s*전망|예상\s*연봉/.test(t);
        const job = String(map.f1 || "").trim();
        const major = String(map.f2 || "").trim();
        const parts = [];
        if (job && !looksDump(job)) parts.push(`희망직업 ${job}`);
        if (major && !looksDump(major)) parts.push(`학과 ${major}`);
        if (parts.length) return parts.join(" · ").slice(0, 60);
      }
      const fields = buildLiveFields(content);
      if (!fields.length) return "제출됨";
      const first = fields[0];
      const snippet = String(first.value || "")
        .replace(/\s+/g, " ")
        .slice(0, 42);
      return snippet ? `${first.label}: ${snippet}`.slice(0, 72) : "제출됨";
    }

    async function broadcastLive(event, payload) {
      if (!channel || !isActivityTeacherUi()) return;
      try {
        await channel.send({
          type: "broadcast",
          event,
          payload: payload || snapshotPayload()
        });
      } catch (e) {
        console.warn(e);
      }
    }

    async function bindLiveChannel(code) {
      if (!sb || !code) return;
      if (channel && boundCode === code) return;
      try {
        if (channel) {
          await sb.removeChannel(channel);
          channel = null;
        }
        boundCode = code;
        channel = sb.channel(`lesson-live-deck:${code}:${sessionNo}`, {
          config: { broadcast: { self: false } }
        });
        channel.on("broadcast", { event: "state" }, ({ payload }) => {
          if (isActivityTeacherUi()) return;
          if (!payload || Number(payload.sessionNo) !== sessionNo) return;
          // 교사 <보고서 종합> 열림 → 학생 활동지에서 강제 동기화
          ensureDom();
          const root = document.getElementById("liveReportDeck");
          if (payload.open) root?.classList.add("is-snap");
          paintFromState(payload);
          if (payload.open) {
            requestAnimationFrame(() => {
              // 첫 페인트 후 snap 유지(즉시 표시). 닫힐 때 제거.
            });
          }
        });
        channel.on("broadcast", { event: "close" }, () => {
          if (isActivityTeacherUi()) return;
          const root = document.getElementById("liveReportDeck");
          root?.classList.remove("is-snap");
          paintFromState({ open: false, cards: [] });
        });
        channel.on("broadcast", { event: "request-sync" }, () => {
          if (!isActivityTeacherUi() || !localState.open) return;
          void broadcastLive("state");
        });
        await channel.subscribe((status) => {
          if (status === "SUBSCRIBED" && !isActivityTeacherUi()) {
            channel
              .send({ type: "broadcast", event: "request-sync", payload: { sessionNo } })
              .catch(() => {});
          }
        });
      } catch (e) {
        console.warn(e);
      }
    }

    async function loadTeacherDeckData() {
      const code = getSubmitCodeFromPage();
      if (!code) throw new Error("제출 코드가 없습니다. URL의 code를 확인해 주세요.");
      if (!authSb) throw new Error("로그인 세션을 확인할 수 없습니다.");
      const { data: sessionData } = await authSb.auth.getSession();
      if (!sessionData?.session) throw new Error("교사 로그인이 필요합니다.");

      const { data: lessonRows, error: lessonErr } = await authSb.rpc("get_lesson_by_submit_code", {
        p_submit_code: code,
        p_session_no: sessionNo
      });
      if (lessonErr) throw lessonErr;
      const lesson = Array.isArray(lessonRows) ? lessonRows[0] : lessonRows;
      if (!lesson?.id) throw new Error("이 제출 코드에 해당하는 차시를 찾지 못했습니다.");

      const [{ data: students, error: stErr }, { data: subs, error: subErr }] = await Promise.all([
        authSb
          .from("students")
          .select("id, student_no, student_name, sort_order")
          .eq("class_id", lesson.class_id)
          .order("sort_order", { ascending: true }),
        authSb
          .from("submissions")
          .select("id, student_no, student_name, content, created_at")
          .eq("lesson_id", lesson.id)
          .order("created_at", { ascending: false })
      ]);
      if (stErr) throw stErr;
      if (subErr) throw subErr;

      contentById.clear();
      const latestByNo = new Map();
      for (const row of subs || []) {
        const key = String(row.student_no || "").trim();
        if (!key || latestByNo.has(key)) continue;
        latestByNo.set(key, row);
        contentById.set(row.id, row.content || "");
      }

      // 1차시 캐릭터(얼굴·MBTI·아키타입) — 보고서 종합과 동일
      const charByNo = new Map();
      const fillCharsFromRows = (rows) => {
        for (const row of rows || []) {
          const key = String(row.student_no || "").trim();
          if (!key || charByNo.has(key)) continue;
          const char = extractLiveSession1Char(row.content || "");
          if (char?.faceHtml) charByNo.set(key, char);
        }
      };
      if (sessionNo === 1) {
        fillCharsFromRows(subs);
      } else {
        try {
          const { data: lesson1Rows } = await authSb.rpc("get_lesson_by_submit_code", {
            p_submit_code: code,
            p_session_no: 1
          });
          const lesson1 = Array.isArray(lesson1Rows) ? lesson1Rows[0] : lesson1Rows;
          if (lesson1?.id) {
            const { data: s1subs } = await authSb
              .from("submissions")
              .select("student_no, content, created_at")
              .eq("lesson_id", lesson1.id)
              .order("created_at", { ascending: false });
            fillCharsFromRows(s1subs);
          }
        } catch (e) {
          console.warn(e);
        }
      }

      const roster = (students || []).slice();
      const known = new Set(roster.map((s) => String(s.student_no || "").trim()));
      for (const [key, row] of latestByNo) {
        if (known.has(key)) continue;
        roster.push({
          id: `orphan-${key}`,
          student_no: key,
          student_name: row.student_name || "명단 외",
          sort_order: 9000
        });
        known.add(key);
      }
      roster.sort((a, b) => {
        const na = Number(String(a.student_no || "").replace(/\D/g, "")) || 0;
        const nb = Number(String(b.student_no || "").replace(/\D/g, "")) || 0;
        if (na !== nb) return na - nb;
        return String(a.student_no || "").localeCompare(String(b.student_no || ""), "ko", {
          numeric: true
        });
      });

      const cards = roster.map((st) => {
        const no = String(st.student_no || "").trim();
        const latest = latestByNo.get(no) || null;
        const char = charByNo.get(no) || null;
        const rosterName = String(st.student_name || "").trim() || "이름 없음";
        if (!latest) {
          return {
            id: "",
            no,
            name:
              (char?.name && char.name !== "이름 미정" ? char.name : "") || rosterName,
            meta: "미제출",
            empty: true,
            winner: "",
            runner: "",
            faceHtml: char?.faceHtml || "",
            mbti: char?.mbti || "",
            arch: char?.arch || "",
            incompleteLabel: "",
            createdAt: ""
          };
        }
        const previewFields =
          sessionNo === 3 || sessionNo === 4
            ? extractLiveFieldMap(latest.content || "")
            : null;
        const looksDump = (t) =>
          /관련\s*학과/.test(t) && /필요\s*자격/.test(t) && /직업\s*전망|예상\s*연봉/.test(t);
        let winner = "";
        let runner = "";
        if (sessionNo === 3 && previewFields) {
          winner = String(previewFields.wcWinner || "").trim();
          runner = String(previewFields.wcRunnerUp || "").trim();
        } else if (sessionNo === 4 && previewFields) {
          const job = String(previewFields.f1 || "").trim();
          const major = String(previewFields.f2 || "").trim();
          winner = job && !looksDump(job) ? job : "";
          runner = major && !looksDump(major) ? major : "";
        }
        const incomplete = assessLiveCompleteness(latest.content || "");
        const displayName =
          (char?.name && char.name !== "이름 미정" ? char.name : "") ||
          String(latest.student_name || "").trim() ||
          rosterName;
        return {
          id: latest.id,
          no,
          name: displayName,
          meta: char?.mbti ? `MBTI ${char.mbti}` : "제출됨",
          empty: false,
          winner,
          runner,
          faceHtml: char?.faceHtml || "",
          mbti: char?.mbti || "",
          arch: char?.arch || "",
          incompleteLabel: incomplete.incomplete ? incomplete.label : "",
          createdAt: latest.created_at || ""
        };
      });

      return {
        open: true,
        title: `<span class="deck-title-brand">&lt;보고서 종합&gt;</span> <span class="deck-title-lesson">✅ ${escapeHtml(
          lessonTitleText()
        )}</span>`,
        sub: "",
        cards,
        focusId: "",
        fields: [],
        who: null,
        sessionNo
      };
    }

    async function openAsViewer() {
      const code = getSubmitCodeFromPage();
      if (!code) {
        showDraftToast("제출 코드가 없습니다.", 2400);
        return;
      }
      await bindLiveChannel(code);
      paintFromState(
        {
          open: true,
          title: `<span class="deck-title-brand">&lt;보고서 종합&gt;</span> <span class="deck-title-lesson">${escapeHtml(
            lessonTitleText()
          )}</span>`,
          sub: "선생님 화면과 동기화 대기 중…",
          cards: []
        },
        { loading: true }
      );
      try {
        await channel?.send({
          type: "broadcast",
          event: "request-sync",
          payload: { sessionNo }
        });
      } catch (e) {
        console.warn(e);
      }
    }

    async function openAsTeacher() {
      if (!isActivityTeacherUi()) return;
      const code = getSubmitCodeFromPage();
      await bindLiveChannel(code);
      paintFromState({ open: true, title: "", sub: "불러오는 중…", cards: [] }, { loading: true });
      try {
        const next = await loadTeacherDeckData();
        paintFromState(next);
        await broadcastLive("state", snapshotPayload());
      } catch (err) {
        console.warn(err);
        paintFromState({ open: false, cards: [] });
        showDraftToast(err?.message || "보고서 종합을 열 수 없습니다.", 3200);
      }
    }

    async function refreshAsTeacher() {
      if (!isActivityTeacherUi() || !localState.open) return;
      const keepFocus = localState.focusId;
      try {
        const next = await loadTeacherDeckData();
        if (keepFocus && contentById.has(keepFocus)) {
          const card = next.cards.find((c) => c.id === keepFocus);
          next.focusId = keepFocus;
          const content = contentById.get(keepFocus) || "";
          const char = extractLiveSession1Char(content);
          next.who = card
            ? {
                no: card.no,
                name: card.name,
                faceHtml: char?.faceHtml || card.faceHtml || "",
                mbti: char?.mbti || card.mbti || "",
                arch: char?.arch || card.arch || "",
                incompleteLabel: card.incompleteLabel || "",
                createdAt: card.createdAt || ""
              }
            : localState.who;
          next.fields = buildLiveFields(content);
        }
        paintFromState(next);
        await broadcastLive("state", snapshotPayload());
        showDraftToast("제출을 새로고침했습니다.", 1600);
      } catch (err) {
        showDraftToast(err?.message || "새로고침 실패", 2800);
      }
    }

    function focusCard(subId) {
      if (!isActivityTeacherUi() || !subId) return;
      const card = localState.cards.find((c) => c.id === subId);
      if (!card || card.empty) return;
      const content = contentById.get(subId) || "";
      const fields = buildLiveFields(content);
      const char = extractLiveSession1Char(content);
      paintFromState({
        ...localState,
        focusId: subId,
        fields,
        who: {
          no: card.no,
          name: card.name,
          faceHtml: char?.faceHtml || card.faceHtml || "",
          mbti: char?.mbti || card.mbti || "",
          arch: char?.arch || card.arch || "",
          incompleteLabel: card.incompleteLabel || "",
          createdAt: card.createdAt || ""
        }
      });
      void broadcastLive("state", snapshotPayload());
    }

    function backToDeck() {
      if (!isActivityTeacherUi()) return;
      paintFromState({ ...localState, focusId: "", fields: [], who: null });
      void broadcastLive("state", snapshotPayload());
    }

    function exportLiveDeckHtml() {
      const panel = document.querySelector("#liveReportDeck .report-deck-panel");
      if (!panel) return "";
      const clone = panel.cloneNode(true);
      clone.querySelectorAll(".report-deck-actions").forEach((el) => el.remove());
      return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><title>보고서 종합</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&family=Noto+Serif+KR:wght@600;700;800&display=swap"/>
<style>
body{margin:0;background:#14532d;font-family:"Noto Sans KR",sans-serif}
.report-deck-panel{max-width:1100px;margin:16px auto;border-radius:20px;overflow:hidden;border:2px solid rgba(253,230,138,.45);background:linear-gradient(180deg,rgba(20,83,45,.35),rgba(6,40,28,.55))}
</style>
<link rel="stylesheet" href="${location.origin}${location.pathname.replace(/[^/]+$/, "")}live-report-deck.css"/>
</head><body><div class="report-deck is-open is-spread">${clone.outerHTML}</div></body></html>`;
    }

    function printLiveDeck() {
      if (!isActivityTeacherUi() || !localState.open) return;
      const html = exportLiveDeckHtml();
      if (!html) return;
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0";
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument;
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn(e);
        }
        setTimeout(() => iframe.remove(), 1200);
      }, 300);
    }

    function saveLiveDeck() {
      if (!isActivityTeacherUi() || !localState.open) return;
      const html = exportLiveDeckHtml();
      if (!html) return;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `보고서종합-${sessionNo}차시.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      showDraftToast("보고서를 저장했습니다.", 1600);
    }

    function closeDeckLocal() {
      paintFromState({ open: false, cards: [] });
    }

    function closeDeck() {
      if (!isActivityTeacherUi()) {
        closeDeckLocal();
        return;
      }
      paintFromState({ open: false, cards: [] });
      void broadcastLive("close", { sessionNo });
    }

    const root = ensureDom();
    document.getElementById("btnLiveReport")?.addEventListener("click", () => {
      if (localState.open) {
        closeDeck();
        return;
      }
      if (isActivityTeacherUi()) {
        void openAsTeacher();
        return;
      }
      void openAsViewer();
    });
    document.getElementById("btnLiveDeckClose")?.addEventListener("click", closeDeck);
    document.getElementById("btnLiveDeckBack")?.addEventListener("click", backToDeck);
    document.getElementById("btnLiveDeckPrint")?.addEventListener("click", printLiveDeck);
    document.getElementById("btnLiveDeckSave")?.addEventListener("click", saveLiveDeck);
    document.getElementById("btnLiveArenaFold")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      applyLiveArenaFoldUi(!liveArenaFolded);
    });
    root.querySelector("#liveDeckTable")?.addEventListener("click", (e) => {
      if (!isActivityTeacherUi()) return;
      const btn = e.target?.closest?.(".deck-card[data-sub-id]");
      if (!btn || btn.disabled) return;
      const id = btn.getAttribute("data-sub-id");
      if (id) focusCard(id);
    });
    // 배경 클릭으로는 닫지 않음 (닫기 버튼만)

    function bootChannel() {
      const code = getSubmitCodeFromPage();
      if (code) {
        // DOM/CSS 선행 로드 → 교사 강제 동기화 시 즉시 표시
        ensureDom();
        void bindLiveChannel(code);
      }
    }
    bootChannel();
    // 제출코드가 늦게 채워지는 경우 재시도
    setTimeout(bootChannel, 800);
    setTimeout(bootChannel, 2200);
    document.getElementById("submitCodeInput")?.addEventListener("change", bootChannel);
    window.addEventListener("career-submit-code-ready", bootChannel);
    syncTeacherSheetTools();
  }

  function autosizeTextarea(el) {
    if (!el || el.tagName !== "TEXTAREA") return;
    el.style.height = "auto";
    el.style.overflow = "hidden";
    el.style.height = `${Math.max(el.scrollHeight, 0)}px`;
  }

  function ensureAutosizeTextareas() {
    const root = document.getElementById("activity-root") || document.body;
    if (!root || root.dataset.autosizeBound === "1") {
      root?.querySelectorAll("textarea").forEach(autosizeTextarea);
      return;
    }
    root.dataset.autosizeBound = "1";
    const grow = (e) => {
      const t = e.target;
      if (t && t.tagName === "TEXTAREA") autosizeTextarea(t);
    };
    root.addEventListener("input", grow);
    root.addEventListener("change", grow);
    // 초기·폰트 로드 후 맞춤
    const syncAll = () => root.querySelectorAll("textarea").forEach(autosizeTextarea);
    syncAll();
    requestAnimationFrame(syncAll);
    window.addEventListener("load", syncAll, { once: true });
  }

  function ensureTopbarStart(topbar) {
    if (!topbar) return null;
    let start = topbar.querySelector(".topbar-start");
    if (start) return start;
    start = document.createElement("div");
    start.className = "topbar-start";
    const brand = topbar.querySelector(".brand");
    const meta = topbar.querySelector(".top-meta");
    if (brand) start.appendChild(brand);
    if (meta) start.appendChild(meta);
    topbar.insertBefore(start, topbar.firstChild);
    return start;
  }

  function syncTimeWatchHeroPad() {
    const topbar = document.querySelector(".topbar");
    const watch = document.getElementById("timeWatch");
    const title = document.querySelector(".hero-card h1");
    if (!topbar || !watch || !title) return;
    // 시계 열 왼쪽 → 히어로 '1차시' 글자 왼쪽 (보더·패딩 포함 실측)
    const colLeft = watch.getBoundingClientRect().left;
    const titleLeft = title.getBoundingClientRect().left;
    const pad = Math.max(0, Math.round(titleLeft - colLeft));
    topbar.style.setProperty("--hero-inline-pad", pad + "px");
  }

  function placeTimeWatchInTopbar(el) {
    const topbar = document.querySelector(".topbar");
    if (!topbar || !el) return;
    ensureTopbarStart(topbar);
    const actions = topbar.querySelector(".topbar-actions");
    // 가운데 열(본문과 같은 폭)에 배치 → '1차시' 왼쪽선과 맞춤
    if (actions) topbar.insertBefore(el, actions);
    else if (el.parentElement !== topbar) topbar.appendChild(el);
    requestAnimationFrame(syncTimeWatchHeroPad);
    if (document.documentElement.dataset.twPadBound !== "1") {
      document.documentElement.dataset.twPadBound = "1";
      window.addEventListener("resize", () => requestAnimationFrame(syncTimeWatchHeroPad), { passive: true });
    }
  }

  function getSubmitCodeFromPage() {
    try {
      const fromUrl = (new URLSearchParams(location.search).get("code") || "").trim().toUpperCase();
      if (fromUrl) return fromUrl;
    } catch {
      /* ignore */
    }
    const input = document.getElementById("submitCodeInput");
    return (input?.value || "").trim().toUpperCase();
  }

  function createAuthClient() {
    if (!window.supabase) return null;
    return window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: localStorage
      }
    });
  }

  function ensureTimeWatch() {
    const existing = document.getElementById("timeWatch");
    if (existing) {
      placeTimeWatchInTopbar(existing);
      if (typeof existing._twRefresh === "function") {
        void existing._twRefresh();
      }
      return;
    }
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;

    const wrap = document.createElement("div");
    wrap.className = "time-watch is-booting";
    wrap.id = "timeWatch";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "수업 타임워치");
    wrap.innerHTML = `
      <div class="tw-shell">
        <span class="tw-role" id="twRole" hidden></span>
        <label class="tw-set">
          <input id="twMinutes" type="number" min="1" max="300" step="1" inputmode="numeric" placeholder="50" aria-label="분 입력" />
          <span class="tw-unit">분</span>
        </label>
        <div class="tw-display-wrap">
          <div class="tw-display" id="twDisplay" aria-live="polite" aria-atomic="true">00:00</div>
          <div class="tw-remain-bubble" id="twRemainBubble" role="status" aria-live="assertive"></div>
        </div>
        <div class="tw-btns">
          <button type="button" class="tw-act" id="twToggle" title="시작" aria-label="시작">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>
          </button>
          <button type="button" class="tw-act tw-reset" id="twReset" title="리셋" aria-label="리셋">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7"/>
              <path d="M3 4v5h5"/>
            </svg>
          </button>
        </div>
      </div>`;

    placeTimeWatchInTopbar(wrap);

    const input = wrap.querySelector("#twMinutes");
    const display = wrap.querySelector("#twDisplay");
    const bubble = wrap.querySelector("#twRemainBubble");
    const toggleBtn = wrap.querySelector("#twToggle");
    const resetBtn = wrap.querySelector("#twReset");
    const roleBadge = wrap.querySelector("#twRole");

    const ICON_PLAY =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>';
    const ICON_PAUSE =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none"/></svg>';

    let mode = "idle"; // idle | running | paused | done
    let remainMs = 0;
    let endsAt = 0;
    let clockSkewMs = 0;
    let tickId = 0;
    let pollId = 0;
    let isTeacher = false;
    let pushing = false;
    let channel = null;
    let boundCode = "";
    let prevRemainSec = null;
    let bubbleHideTimer = 0;
    const bubbleShownMarks = new Set();
    const authSb = createAuthClient();

    const pad2 = (n) => (n < 10 ? "0" + n : String(n));

    function formatMs(ms) {
      const total = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(total / 60);
      const s = total % 60;
      return pad2(m) + ":" + pad2(s);
    }

    function readMinutes() {
      const n = Math.floor(Number(input?.value));
      if (!Number.isFinite(n) || n < 1) return null;
      return Math.min(300, n);
    }

    function nowMs() {
      return Date.now() - clockSkewMs;
    }

    function currentMs() {
      if (mode === "running") return Math.max(0, endsAt - nowMs());
      return Math.max(0, remainMs);
    }

    function clearRemainBubbleTracking(opts = {}) {
      prevRemainSec = opts.seedSec != null ? opts.seedSec : null;
      if (opts.resetMarks !== false) bubbleShownMarks.clear();
      if (bubbleHideTimer) {
        clearTimeout(bubbleHideTimer);
        bubbleHideTimer = 0;
      }
      if (bubble) {
        bubble.className = "tw-remain-bubble";
        bubble.textContent = "";
      }
    }

    function showRemainBubble(mins) {
      if (!bubble || !Number.isFinite(mins) || mins < 1) return;
      let text;
      let tone = "";
      if (mins <= 5) {
        text = `${mins}분 남았어요!!!`;
        tone = "is-urgent";
      } else if (mins <= 10) {
        text = `${mins}분 남았어요!`;
        tone = "is-exclaim";
      } else {
        text = `${mins}분 남았어요`;
      }
      bubble.textContent = text;
      bubble.className = `tw-remain-bubble is-on ${tone}`.trim();
      if (bubbleHideTimer) clearTimeout(bubbleHideTimer);
      const holdMs = mins <= 5 ? 4500 : mins <= 10 ? 3600 : 2800;
      bubbleHideTimer = setTimeout(() => {
        bubble.classList.remove("is-on", "is-exclaim", "is-urgent");
        bubbleHideTimer = 0;
      }, holdMs);
    }

    function maybeAnnounceRemain(ms) {
      if (mode !== "running") return;
      const sec = Math.ceil(Math.max(0, ms) / 1000);
      if (prevRemainSec == null) {
        prevRemainSec = sec;
        return;
      }
      const prev = prevRemainSec;
      prevRemainSec = sec;
      if (prev <= sec) return;

      const marks = [5];
      for (let m = 10; m <= 300; m += 10) marks.push(m);
      marks.sort((a, b) => b - a);

      for (const m of marks) {
        const boundary = m * 60;
        if (prev > boundary && sec <= boundary && !bubbleShownMarks.has(m)) {
          bubbleShownMarks.add(m);
          showRemainBubble(m);
          break;
        }
      }
    }

    function paint() {
      const ms = currentMs();
      const totalSec = Math.ceil(ms / 1000);
      display.textContent = formatMs(ms);
      display.classList.toggle("is-warn", totalSec > 0 && totalSec <= 600 && totalSec > 300);
      display.classList.toggle("is-alert", totalSec > 0 && totalSec <= 300);
      display.classList.toggle("is-done", mode === "done" || (totalSec === 0 && mode !== "idle"));
      if (input) input.disabled = !isTeacher || mode === "running";
      if (toggleBtn) {
        toggleBtn.disabled = !isTeacher;
        const running = mode === "running";
        toggleBtn.innerHTML = running ? ICON_PAUSE : ICON_PLAY;
        toggleBtn.title = running ? "일시정지" : mode === "paused" ? "계속" : "시작";
        toggleBtn.setAttribute("aria-label", toggleBtn.title);
      }
      if (resetBtn) resetBtn.disabled = !isTeacher;
      maybeAnnounceRemain(ms);
    }

    function stopTick() {
      if (tickId) {
        clearInterval(tickId);
        tickId = 0;
      }
    }

    function finishLocal() {
      stopTick();
      mode = "done";
      remainMs = 0;
      endsAt = 0;
      clearRemainBubbleTracking({ seedSec: 0 });
      paint();
    }

    function startTick() {
      stopTick();
      tickId = setInterval(() => {
        if (mode !== "running") return;
        if (nowMs() >= endsAt) {
          finishLocal();
          if (isTeacher) void pushTimer("done", { remainSec: 0 });
          return;
        }
        paint();
      }, 250);
    }

    function applyRemoteRow(row) {
      if (!row || pushing) return;
      const status = String(row.status || "idle");
      const durationSec = Number(row.duration_sec) || 0;
      const remainSec = Number(row.remain_sec);
      const prevMode = mode;
      if (row.server_now) {
        const serverMs = new Date(row.server_now).getTime();
        if (Number.isFinite(serverMs)) clockSkewMs = Date.now() - serverMs;
      }
      if (durationSec > 0 && input && document.activeElement !== input) {
        input.value = String(Math.max(1, Math.round(durationSec / 60)));
      }
      if (status === "running" && row.ends_at) {
        endsAt = new Date(row.ends_at).getTime();
        remainMs = Math.max(0, endsAt - nowMs());
        mode = remainMs > 0 ? "running" : "done";
        if (mode === "running") {
          const seed = Math.ceil(remainMs / 1000);
          if (prevMode !== "running") {
            if (prevMode === "paused") {
              prevRemainSec = seed;
            } else {
              clearRemainBubbleTracking({ seedSec: seed, resetMarks: true });
            }
          }
          startTick();
        } else {
          stopTick();
          remainMs = 0;
          endsAt = 0;
          clearRemainBubbleTracking({ seedSec: 0 });
        }
        paint();
        return;
      }
      stopTick();
      endsAt = 0;
      mode = status === "paused" || status === "done" || status === "idle" ? status : "idle";
      if (mode === "done") remainMs = 0;
      else if (Number.isFinite(remainSec)) remainMs = Math.max(0, remainSec) * 1000;
      else remainMs = durationSec > 0 ? durationSec * 1000 : 0;
      if (mode === "paused") {
        prevRemainSec = Math.ceil(remainMs / 1000);
      } else if (mode === "idle" || mode === "done") {
        clearRemainBubbleTracking({
          seedSec: mode === "done" ? 0 : Math.ceil(remainMs / 1000),
          resetMarks: true
        });
      }
      paint();
    }

    async function fetchRemoteTimer() {
      const code = getSubmitCodeFromPage();
      if (!code || !sb) return null;
      const { data, error } = await sb.rpc("get_lesson_timer", {
        p_submit_code: code,
        p_session_no: sessionNo
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row || null;
    }

    async function pushTimer(status, opts = {}) {
      const code = getSubmitCodeFromPage();
      if (!isTeacher || !code || !authSb) return;
      const mins = readMinutes();
      const durationSec =
        opts.durationSec != null
          ? opts.durationSec
          : mins
            ? mins * 60
            : Math.max(60, Math.round(remainMs / 1000) || 50 * 60);
      const remainSec =
        opts.remainSec != null
          ? opts.remainSec
          : status === "running" || status === "paused"
            ? Math.max(0, Math.ceil(currentMs() / 1000))
            : durationSec;
      pushing = true;
      try {
        const { data, error } = await authSb.rpc("set_lesson_timer", {
          p_submit_code: code,
          p_session_no: sessionNo,
          p_status: status,
          p_duration_sec: durationSec,
          p_remain_sec: remainSec
        });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          pushing = false;
          applyRemoteRow(row);
        }
        if (channel) {
          channel
            .send({
              type: "broadcast",
              event: "timer",
              payload: row || { status, duration_sec: durationSec, remain_sec: remainSec }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.warn(err);
        const msg = err?.message || "";
        if (/schema cache|Could not find the function|권한이 없습니다|로그인/i.test(msg)) {
          wrap.title =
            "타이머 동기화 실패: Supabase에서 supabase-lesson-timer.sql 실행·교사 로그인을 확인해 주세요.";
          showDraftToast?.(
            "타이머 저장 실패: SQL 실행·교사 로그인·제출코드를 확인해 주세요."
          );
        } else {
          showDraftToast?.(msg || "타이머 동기화에 실패했습니다.");
        }
      } finally {
        pushing = false;
      }
    }

    function syncFromInput() {
      if (!isTeacher) return;
      if (mode === "running" || mode === "paused") return;
      const mins = readMinutes();
      remainMs = mins ? mins * 60 * 1000 : 0;
      mode = "idle";
      paint();
    }

    async function startOrResume() {
      if (!isTeacher) return;
      if (mode === "running") {
        remainMs = currentMs();
        mode = "paused";
        stopTick();
        prevRemainSec = Math.ceil(remainMs / 1000);
        paint();
        await pushTimer("paused", { remainSec: Math.ceil(remainMs / 1000) });
        return;
      }
      const fromFresh = mode === "idle" || mode === "done";
      if (mode === "idle" || mode === "done") {
        const mins = readMinutes();
        if (!mins) {
          input?.focus();
          input?.select?.();
          return;
        }
        remainMs = mins * 60 * 1000;
      }
      if (remainMs <= 0) {
        finishLocal();
        await pushTimer("done", { remainSec: 0 });
        return;
      }
      if (fromFresh) clearRemainBubbleTracking({ resetMarks: true });
      mode = "running";
      endsAt = nowMs() + remainMs;
      prevRemainSec = Math.ceil(remainMs / 1000);
      paint();
      startTick();
      await pushTimer("running", {
        durationSec: readMinutes() ? readMinutes() * 60 : Math.round(remainMs / 1000),
        remainSec: Math.ceil(remainMs / 1000)
      });
    }

    async function reset() {
      if (!isTeacher) return;
      stopTick();
      mode = "idle";
      endsAt = 0;
      const mins = readMinutes() || 50;
      if (input && !readMinutes()) input.value = String(mins);
      remainMs = mins * 60 * 1000;
      clearRemainBubbleTracking({ seedSec: Math.ceil(remainMs / 1000), resetMarks: true });
      paint();
      await pushTimer("idle", { durationSec: mins * 60, remainSec: mins * 60 });
    }

    function setTeacherMode(on) {
      isTeacher = !!on;
      wrap.classList.toggle("is-teacher", isTeacher);
      wrap.classList.toggle("is-viewer", !isTeacher);
      wrap.classList.remove("is-booting");
      document.documentElement.dataset.activityTeacher = isTeacher ? "1" : "0";
      if (roleBadge) {
        roleBadge.hidden = false;
        roleBadge.textContent = isTeacher ? "교사" : "동기화";
        roleBadge.title = isTeacher
          ? "로그인한 교사만 분을 설정·시작·정지할 수 있습니다"
          : "교사가 설정한 시간이 QR로 접속한 전원에게 동일하게 표시됩니다";
      }
      wrap.setAttribute(
        "aria-label",
        isTeacher ? "수업 타임워치 (교사 제어)" : "수업 타임워치 (교사 설정값 동기화)"
      );
      wrap.title = isTeacher
        ? "교사 전용: 분을 입력한 뒤 시작하세요. QR로 들어온 학생 화면에 같은 시간이 동기화됩니다."
        : "학생용: 교사가 설정한 타이머가 자동 동기화됩니다. (조작 불가)";
      paint();
      try {
        if (typeof window.__careerSyncTeacherSheetTools === "function") {
          window.__careerSyncTeacherSheetTools();
        }
      } catch {
        /* ignore */
      }
    }

    async function bindRealtime(code) {
      if (!sb || !code) return;
      try {
        if (channel) {
          await sb.removeChannel(channel);
          channel = null;
        }
        channel = sb.channel(`lesson-timer:${code}`, {
          config: { broadcast: { self: false } }
        });
        channel.on("broadcast", { event: "timer" }, ({ payload }) => {
          applyRemoteRow(payload);
        });
        await channel.subscribe();
      } catch (e) {
        console.warn(e);
      }
    }

    function startPolling() {
      if (pollId) clearInterval(pollId);
      pollId = setInterval(() => {
        if (document.visibilityState === "hidden" || pushing) return;
        fetchRemoteTimer()
          .then((row) => {
            if (row) applyRemoteRow(row);
          })
          .catch(() => {});
      }, isTeacher ? 4000 : 1200);
    }

    async function resolveTeacherControl(code) {
      if (!code || !authSb) return false;
      try {
        const { data: sessionData } = await authSb.auth.getSession();
        if (!sessionData?.session) return false;
        const { data, error } = await authSb.rpc("can_control_lesson_timer", {
          p_submit_code: code,
          p_session_no: sessionNo
        });
        if (error) {
          console.warn(error);
          return false;
        }
        return !!data;
      } catch (e) {
        console.warn(e);
        return false;
      }
    }

    async function bootstrap(force) {
      const code = getSubmitCodeFromPage();
      if (!code) {
        boundCode = "";
        setTeacherMode(false);
        wrap.title =
          "QR(제출코드)가 있는 활동지에서 교사가 설정한 타이머가 동기화됩니다.";
        if (input) input.value = "";
        paint();
        return;
      }
      if (!force && code === boundCode) {
        // 세션만 재확인
        const can = await resolveTeacherControl(code);
        if (can !== isTeacher) setTeacherMode(can);
        return;
      }
      boundCode = code;

      const canControl = await resolveTeacherControl(code);
      setTeacherMode(canControl);

      try {
        const row = await fetchRemoteTimer();
        if (row) applyRemoteRow(row);
        else if (canControl && input && !input.value) {
          input.value = "50";
          syncFromInput();
        }
      } catch (e) {
        console.warn(e);
        wrap.title =
          "타이머 동기화 RPC가 없습니다. Supabase에서 supabase-lesson-timer.sql 을 실행해 주세요.";
        if (canControl && input && !input.value) {
          input.value = "50";
          syncFromInput();
        }
      }

      await bindRealtime(code);
      startPolling();
    }

    wrap._twRefresh = () => bootstrap(false);

    input?.addEventListener("input", syncFromInput);
    input?.addEventListener("change", () => {
      syncFromInput();
      if (isTeacher && (mode === "idle" || mode === "done")) {
        const mins = readMinutes();
        if (mins) void pushTimer("idle", { durationSec: mins * 60, remainSec: mins * 60 });
      }
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void startOrResume();
      }
    });
    toggleBtn?.addEventListener("click", () => void startOrResume());
    resetBtn?.addEventListener("click", () => void reset());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      void bootstrap(false);
      if (mode === "running") {
        if (nowMs() >= endsAt) finishLocal();
        else paint();
      }
      fetchRemoteTimer()
        .then((row) => {
          if (row) applyRemoteRow(row);
        })
        .catch(() => {});
    });

    // 제출코드 입력·변경 시 동기화 채널 재연결
    const codeInput = document.getElementById("submitCodeInput");
    codeInput?.addEventListener("change", () => void bootstrap(true));
    codeInput?.addEventListener("blur", () => void bootstrap(true));

    authSb?.auth.onAuthStateChange(() => {
      void bootstrap(true);
    });

    paint();
    void bootstrap(true);
  }

  function ensureReflectField() {
    const root = document.getElementById("activity-root");
    if (!root) return;
    let ta = root.querySelector("#fReflect");
    if (!ta) {
      const legacy = root.querySelector("#bReflect");
      if (legacy) {
        legacy.id = "fReflect";
        legacy.name = "fReflect";
        const lab = root.querySelector('label[for="bReflect"]');
        if (lab) {
          lab.setAttribute("for", "fReflect");
          lab.textContent = "느낀점(세특 참조)";
        }
        const wrap = legacy.closest(".bingo-reflection, .field") || legacy.parentElement;
        if (wrap) {
          wrap.classList.add("reflect-field");
          wrap.setAttribute("data-reflect", "1");
        }
        ta = legacy;
      }
    }
    if (ta) return;
    const box = document.createElement("div");
    box.className = "field reflect-field";
    box.setAttribute("data-reflect", "1");
    box.innerHTML = `
      <label for="fReflect">느낀점(세특 참조)</label>
      <textarea id="fReflect" name="fReflect" rows="4" placeholder="오늘 활동에서 느낀 점, 배운 점, 성장한 점을 적어 주세요. (생기부 세특 작성 시 참고됩니다)"></textarea>`;
    root.appendChild(box);
  }

  function getDraftCodeKey() {
    try {
      const fromUrl = (new URLSearchParams(location.search).get("code") || "").trim().toUpperCase();
      if (fromUrl) return fromUrl;
    } catch {
      /* ignore */
    }
    return "nocode";
  }

  const DRAFT_PREFIX = `career-activity-draft:v2:${sessionNo}:`;

  function draftStorageKey(codeKey) {
    const code = codeKey || getDraftCodeKey();
    return `${DRAFT_PREFIX}${code}`;
  }

  /** 제출코드가 바뀌어도 같은 차시 초안을 찾기 위한 보조 키 */
  function draftSessionFallbackKey() {
    return `${DRAFT_PREFIX}__session__`;
  }

  let draftRestored = false;

  function collectDraftFields() {
    const fields = {};
    const root = document.getElementById("activity-root");
    const scope = root || document;
    scope.querySelectorAll("input, textarea, select").forEach((el) => {
      if (el.disabled) return;
      const key = el.id || el.name;
      if (!key) return;
      if (el.type === "checkbox" || el.type === "radio") {
        fields[key] = !!el.checked;
      } else {
        fields[key] = el.value;
      }
    });
    const id = readSheetIdentity();
    return {
      v: 2,
      sessionNo,
      code: getDraftCodeKey(),
      savedAt: Date.now(),
      studentNo: id.studentNo,
      studentName: id.studentName,
      fields
    };
  }

  /** 본문(학번·이름 제외) 입력량 점수 */
  function draftFieldScore(payload) {
    if (!payload || typeof payload !== "object") return 0;
    const fields = payload.fields;
    if (!fields || typeof fields !== "object") return 0;
    let score = 0;
    Object.keys(fields).forEach((key) => {
      if (/^(sheetHakbun|sheetDisplayName)$/i.test(key)) return;
      const val = fields[key];
      if (typeof val === "boolean") {
        if (val) score += 2;
        return;
      }
      const str = String(val ?? "").trim();
      if (str) score += Math.min(48, str.length);
    });
    return score;
  }

  function draftHasActivityContent(payload) {
    return draftFieldScore(payload) > 0;
  }

  function draftHasMeaningfulContent(payload) {
    if (!payload || typeof payload !== "object") return false;
    if (draftHasActivityContent(payload)) return true;
    return !!(String(payload.studentNo || "").trim() || String(payload.studentName || "").trim());
  }

  /** 빈 값으로 본문을 지우지 않도록 병합 */
  function mergeDraftPayload(existing, incoming) {
    if (!existing) return incoming;
    if (!incoming) return existing;
    const aFields = existing.fields && typeof existing.fields === "object" ? existing.fields : {};
    const bFields = incoming.fields && typeof incoming.fields === "object" ? incoming.fields : {};
    const keys = new Set([...Object.keys(aFields), ...Object.keys(bFields)]);
    const fields = {};
    keys.forEach((key) => {
      const a = aFields[key];
      const b = bFields[key];
      if (typeof a === "boolean" || typeof b === "boolean") {
        fields[key] = typeof b === "boolean" ? b : !!a;
        return;
      }
      const bStr = String(b ?? "").trim();
      fields[key] = bStr !== "" ? b : a;
    });
    return {
      v: 2,
      sessionNo,
      code: incoming.code || existing.code || getDraftCodeKey(),
      savedAt: Date.now(),
      studentNo: String(incoming.studentNo || existing.studentNo || "").trim(),
      studentName: String(incoming.studentName || existing.studentName || "").trim(),
      fields
    };
  }

  function parseDraftRaw(raw) {
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw);
      if (!payload || Number(payload.sessionNo) !== sessionNo) return null;
      return payload;
    } catch {
      return null;
    }
  }

  function preferDraftPayload(a, b) {
    if (!a) return b;
    if (!b) return a;
    const sa = draftFieldScore(a);
    const sb = draftFieldScore(b);
    if (sb !== sa) return sb > sa ? b : a;
    return (b.savedAt || 0) >= (a.savedAt || 0) ? b : a;
  }

  function readStoredDraftPayload() {
    // 같은 제출코드·같은 차시 보조키만 사용 (다른 코드의 '예시 32개' 초안이 덮어쓰지 않게)
    let exact = null;
    let fallback = null;
    try {
      exact = parseDraftRaw(localStorage.getItem(draftStorageKey()));
    } catch {
      /* ignore */
    }
    try {
      fallback = parseDraftRaw(localStorage.getItem(draftSessionFallbackKey()));
    } catch {
      /* ignore */
    }
    if (exact && draftHasActivityContent(exact)) return exact;
    if (fallback && draftHasActivityContent(fallback)) return preferDraftPayload(exact, fallback);
    return preferDraftPayload(exact, fallback);
  }

  /** 예전 ‘예시 32개로 채우기’ 데모 초안(학번·성찰·우승 없음) — 복원하지 않음 */
  function isWorldcupDemoSampleDraft(payload) {
    if (!document.getElementById("wc-job-inputs")) return false;
    if (!payload || typeof payload !== "object") return false;
    if (String(payload.studentNo || "").trim() || String(payload.studentName || "").trim()) {
      return false;
    }
    const f = payload.fields && typeof payload.fields === "object" ? payload.fields : {};
    if (String(f["wc-winner"] || f.wcWinner || "").trim()) return false;
    if (String(f["wc-runner-up"] || f.wcRunnerUp || "").trim()) return false;
    if (["wc-q1", "wc-q2", "wc-q3", "wc-q4", "fReflect"].some((id) => String(f[id] || "").trim())) {
      return false;
    }
    const legacySamples = [
      "AI 프로덕트 매니저",
      "프론트엔드 개발자",
      "데이터 사이언티스트",
      "게임 기획자",
      "숏폼 크리에이터",
      "웹툰 작가",
      "UX 디자이너",
      "브랜드 디자이너",
      "콘텐츠 마케터",
      "스타트업 창업가",
      "프로덕트 오너",
      "투자 애널리스트",
      "의사",
      "임상심리사",
      "약사",
      "수의사",
      "환경 엔지니어",
      "우주항공 엔지니어",
      "생명공학 연구원",
      "기후 데이터 분석가",
      "교사",
      "외교관",
      "소방관",
      "변호사",
      "패션 스타일리스트",
      "호텔리어",
      "스포츠 마케터",
      "바리스타 창업가",
      "영상 PD",
      "로봇 공학자",
      "사이버보안 전문가",
      "지속가능 컨설턴트"
    ];
    const filled = [];
    for (let i = 1; i <= 32; i++) {
      const v = String(f[`job-${i}`] || f[`job${i}`] || "").trim();
      if (v) filled.push(v);
    }
    if (filled.length < 32) return false;
    return filled.every((name, i) => name === legacySamples[i]);
  }

  function syncQuestionCardStarUi(item) {
    if (!item) return;
    const star = item.querySelector('input[type="hidden"][data-q-star="1"]');
    const btn = item.querySelector(".q-star-btn");
    const on = String(star?.value || "") === "1";
    item.classList.toggle("is-starred", on);
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.title = on ? "강조 해제" : "강조 체크";
      btn.setAttribute("aria-label", on ? "강조 해제" : "이 질문 강조하기");
    }
  }

  function syncAllQuestionCardStars() {
    document.querySelectorAll(".questions-grid .q-item").forEach((item) => syncQuestionCardStarUi(item));
  }

  /** 2차시 100문100답: 강조하고 싶은 질문카드 체크 */
  function initQuestionCardStars() {
    const grid = document.querySelector(".questions-grid");
    if (!grid || grid.dataset.qStarsReady === "1") return;
    grid.dataset.qStarsReady = "1";

    grid.querySelectorAll(".q-item").forEach((item) => {
      const input =
        item.querySelector('input[type="text"], input:not([type]), textarea') ||
        item.querySelector("input");
      if (!input) return;
      const key = String(input.id || input.name || "").replace(/^q/i, "");
      const starId = `qStar${key || Math.random().toString(36).slice(2, 7)}`;

      let top = item.querySelector(".q-item-top");
      if (!top) {
        top = document.createElement("div");
        top.className = "q-item-top";
        const label = item.querySelector(".q-title, label");
        if (label) top.appendChild(label);
        item.insertBefore(top, item.firstChild);
      }

      let star = item.querySelector('input[type="hidden"][data-q-star="1"]');
      if (!star) {
        star = document.createElement("input");
        star.type = "hidden";
        star.dataset.qStar = "1";
        star.id = starId;
        star.name = starId;
        star.value = "0";
        item.appendChild(star);
      }

      let btn = item.querySelector(".q-star-btn");
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "q-star-btn";
        btn.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
        top.appendChild(btn);
      }

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = String(star.value || "") === "1" ? "0" : "1";
        star.value = next;
        syncQuestionCardStarUi(item);
        star.dispatchEvent(new Event("change", { bubbles: true }));
        try {
          if (typeof saveActivityDraft === "function") saveActivityDraft({ toast: false, force: true });
        } catch {
          /* ignore */
        }
      });

      syncQuestionCardStarUi(item);
    });
  }

  function applyDraftFields(payload) {
    if (!payload || !payload.fields || typeof payload.fields !== "object") return false;
    const root = document.getElementById("activity-root");
    const scope = root || document;
    let applied = 0;
    Object.keys(payload.fields).forEach((key) => {
      let el = null;
      try {
        el =
          (key && scope.querySelector(`#${CSS.escape(key)}`)) ||
          (key && scope.querySelector(`[name="${CSS.escape(key)}"]`));
      } catch {
        el = document.getElementById(key) || scope.querySelector(`[name="${key}"]`);
      }
      if (!el) return;
      const val = payload.fields[key];
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = !!val;
      } else if (val != null) {
        el.value = String(val);
      }
      applied += 1;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const noEl = document.getElementById("sheetHakbun");
    const nameEl = document.getElementById("sheetDisplayName");
    if (noEl && payload.studentNo) noEl.value = payload.studentNo;
    if (nameEl && payload.studentName) nameEl.value = payload.studentName;
    syncAllQuestionCardStars();
    return applied > 0 || !!(payload.studentNo || payload.studentName);
  }

  function saveActivityDraft(opts = {}) {
    try {
      if (!draftRestored && !opts.force) return false;
      const live = collectDraftFields();
      const existing = readStoredDraftPayload();
      let payload = existing && !opts.force ? mergeDraftPayload(existing, live) : live;
      if (!opts.force && existing && draftFieldScore(payload) < draftFieldScore(existing)) {
        payload = {
          ...existing,
          studentNo: live.studentNo || existing.studentNo,
          studentName: live.studentName || existing.studentName,
          code: live.code || existing.code,
          savedAt: Date.now()
        };
      }
      if (!opts.force && !draftHasMeaningfulContent(payload) && draftHasMeaningfulContent(existing)) {
        return false;
      }
      const raw = JSON.stringify(payload);
      localStorage.setItem(draftStorageKey(), raw);
      localStorage.setItem(draftSessionFallbackKey(), raw);
      if (opts.toast !== false) showDraftToast("임시 저장되었습니다");
      const btn = document.getElementById("btnDraftSave");
      if (btn) {
        btn.classList.add("is-saved");
        clearTimeout(saveActivityDraft._flash);
        saveActivityDraft._flash = setTimeout(() => btn.classList.remove("is-saved"), 1200);
      }
      return true;
    } catch (e) {
      console.warn(e);
      if (opts.toast !== false) showDraftToast("저장 실패 · 브라우저 저장공간을 확인해 주세요");
      return false;
    }
  }

  function restoreActivityDraft(opts = {}) {
    try {
      const payload = readStoredDraftPayload();
      if (!payload) return false;
      // 예시 32개만 채워 둔 초안은 기본(체크 해제) 화면을 유지
      if (isWorldcupDemoSampleDraft(payload)) {
        try {
          if (typeof window.__careerWorldcupEnsurePristine === "function") {
            window.__careerWorldcupEnsurePristine();
          }
        } catch (e) {
          console.warn(e);
        }
        return false;
      }
      const ok = applyDraftFields(payload);
      if (ok) {
        ensureAutosizeTextareas();
        try {
          if (typeof window.__careerWorldcupAfterDraft === "function") {
            window.__careerWorldcupAfterDraft();
          }
        } catch (e) {
          console.warn(e);
        }
        if (opts.toast !== false && draftHasActivityContent(payload)) {
          showDraftToast("저장된 내용을 불러왔습니다");
        }
      }
      return ok;
    } catch (e) {
      console.warn(e);
      return false;
    } finally {
      draftRestored = true;
    }
  }

  function showDraftToast(msg, ms) {
    let t = document.getElementById("draftToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "draftToast";
      t.className = "draft-toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg || "";
    t.classList.add("is-on");
    clearTimeout(showDraftToast._timer);
    showDraftToast._timer = setTimeout(() => t.classList.remove("is-on"), Math.max(1200, Number(ms) || 2000));
  }

  const SAVE_KEEP_HINT_HTML =
    '추후 "나만의 웹 페이지" 제작을 위해, HTML 저장 후 반드시 <span class="save-keep-hint-keep">보관해두세요~!</span>';

  function hideSaveKeepHint() {
    const hint = document.getElementById("saveKeepHint");
    const btn = document.getElementById("btnSaveSheet");
    btn?.classList.remove("is-save-hint");
    if (hideSaveKeepHint._onReposition) {
      window.removeEventListener("resize", hideSaveKeepHint._onReposition);
      window.removeEventListener("scroll", hideSaveKeepHint._onReposition, true);
      hideSaveKeepHint._onReposition = null;
    }
    if (hint) {
      hint.hidden = true;
      hint.setAttribute("aria-hidden", "true");
    }
  }

  function placeSaveKeepHint() {
    const hint = document.getElementById("saveKeepHint");
    const ring = hint?.querySelector(".save-keep-hint-ring");
    const card = hint?.querySelector(".save-keep-hint-card");
    const btn = document.getElementById("btnSaveSheet");
    if (!hint || hint.hidden || !ring || !card || !btn) return;

    const r = btn.getBoundingClientRect();
    const pad = 5;
    ring.style.top = `${Math.round(r.top - pad)}px`;
    ring.style.left = `${Math.round(r.left - pad)}px`;
    ring.style.width = `${Math.round(r.width + pad * 2)}px`;
    ring.style.height = `${Math.round(r.height + pad * 2)}px`;

    card.style.visibility = "hidden";
    card.style.top = "0";
    card.style.left = "0";
    const cw = card.offsetWidth || 320;
    const ch = card.offsetHeight || 120;
    const gap = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const edge = 10;
    const btnCenterX = r.left + r.width / 2;

    // 첨부 이미지와 같이: 다운로드 버튼 바로 아래, 화살표가 버튼 중앙을 가리킴
    let top = r.bottom + gap;
    let left = Math.round(btnCenterX - cw / 2);
    if (left < edge) left = edge;
    if (left + cw > vw - edge) left = Math.max(edge, vw - cw - edge);

    let above = false;
    if (top + ch > vh - edge) {
      top = Math.max(edge, r.top - ch - gap);
      above = top + ch <= r.top;
    }

    const arrowLeft = Math.min(cw - 16, Math.max(16, btnCenterX - left));
    card.style.setProperty("--hint-arrow-left", `${Math.round(arrowLeft)}px`);
    card.classList.toggle("is-above", above);
    card.style.top = `${Math.round(top)}px`;
    card.style.left = `${Math.round(left)}px`;
    card.style.visibility = "visible";
  }

  function showSaveKeepHint() {
    const btn = document.getElementById("btnSaveSheet");
    if (!btn) return;
    hideSaveKeepHint();

    let hint = document.getElementById("saveKeepHint");
    if (!hint) {
      hint = document.createElement("div");
      hint.id = "saveKeepHint";
      hint.className = "save-keep-hint";
      hint.innerHTML = `
        <div class="save-keep-hint-ring" aria-hidden="true"></div>
        <div class="save-keep-hint-card" role="dialog" aria-modal="true" aria-labelledby="saveKeepHintMsg">
          <p class="save-keep-hint-msg" id="saveKeepHintMsg"></p>
          <div class="save-keep-hint-actions">
            <button type="button" class="save-keep-hint-ok" id="btnSaveKeepHintOk">확인</button>
          </div>
        </div>`;
      document.body.appendChild(hint);
      hint.querySelector("#btnSaveKeepHintOk")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideSaveKeepHint();
      });
    }

    const msgEl = hint.querySelector(".save-keep-hint-msg");
    if (msgEl) msgEl.innerHTML = SAVE_KEEP_HINT_HTML;

    btn.classList.add("is-save-hint");
    if (!btn.dataset.saveHintDismissBound) {
      btn.dataset.saveHintDismissBound = "1";
      btn.addEventListener("click", () => {
        const h = document.getElementById("saveKeepHint");
        if (h && !h.hidden) hideSaveKeepHint();
      });
    }
    hint.hidden = false;
    hint.setAttribute("aria-hidden", "false");
    try {
      btn.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    } catch (_) {
      /* ignore */
    }
    placeSaveKeepHint();

    const onReposition = () => placeSaveKeepHint();
    hideSaveKeepHint._onReposition = onReposition;
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    requestAnimationFrame(placeSaveKeepHint);
    setTimeout(placeSaveKeepHint, 320);
    setTimeout(() => hint.querySelector("#btnSaveKeepHintOk")?.focus(), 80);
  }

  function bindDraftAutosave() {
    if (document.documentElement.dataset.draftBound === "1") return;
    document.documentElement.dataset.draftBound = "1";
    let timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => saveActivityDraft({ toast: false }), 600);
    };
    document.addEventListener(
      "input",
      (e) => {
        if (!e.target || !e.target.closest) return;
        if (!e.target.closest("#activity-root, #sheetIdentity, #submitOverlay")) return;
        if (!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        schedule();
      },
      true
    );
    document.addEventListener(
      "change",
      (e) => {
        if (!e.target || !e.target.closest) return;
        if (!e.target.closest("#activity-root, #sheetIdentity, #submitOverlay")) return;
        schedule();
      },
      true
    );
    window.addEventListener("pagehide", () => saveActivityDraft({ toast: false }));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveActivityDraft({ toast: false });
    });
  }

  function clearActivityDraftsFromStorage() {
    const prefixes = [
      `career-activity-draft:v2:${sessionNo}:`,
      `career-activity-draft:v1:${sessionNo}:`
    ];
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (prefixes.some((p) => k.startsWith(p))) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn(e);
    }
  }

  function resetActivitySheetToInitial() {
    if (
      !confirm(
        "작성한 내용을 모두 지우고 초기 화면으로 되돌릴까요?\n(이 기기의 임시저장도 삭제됩니다)"
      )
    ) {
      return false;
    }

    clearActivityDraftsFromStorage();

    const root = document.getElementById("activity-root");
    const scope = root || document;
    scope.querySelectorAll("input, textarea, select").forEach((el) => {
      if (el.disabled) return;
      const key = el.id || el.name || "";
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = false;
      } else if (el.type === "hidden") {
        if (/^wc/i.test(key) || /^job/i.test(key) || /^qStar/i.test(key)) el.value = /^qStar/i.test(key) ? "0" : "";
        else return;
      } else {
        el.value = "";
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const noEl = document.getElementById("sheetHakbun");
    const nameEl = document.getElementById("sheetDisplayName");
    if (noEl) noEl.value = "";
    if (nameEl) nameEl.value = "";

    try {
      if (typeof window.__careerWorldcupHardReset === "function") {
        window.__careerWorldcupHardReset();
      }
    } catch (e) {
      console.warn(e);
    }

    ensureAutosizeTextareas();
    syncAllQuestionCardStars();
    draftRestored = true;
    saveActivityDraft({ toast: false, force: true });
    showDraftToast("초기화되었습니다");
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* ignore */
    }
    return true;
  }

  function isActivityTeacherUi() {
    return document.documentElement.dataset.activityTeacher === "1";
  }

  function syncTeacherSheetTools() {
    const show = isActivityTeacherUi();
    const btn = document.getElementById("btnSheetReset");
    if (btn) {
      btn.hidden = !show;
      btn.setAttribute("aria-hidden", show ? "false" : "true");
    }
    const live = document.getElementById("btnLiveReport");
    if (live) {
      // 학생도 보기(동기화 대기) 가능 · 조작은 교사만
      live.disabled = false;
      live.classList.toggle("is-ready", show);
      live.title = show
        ? "실시간 보고서 종합 — 학생 화면에 동기화됩니다"
        : "선생님 <보고서 종합> 열리면 이 화면으로 자동 동기화됩니다";
      live.setAttribute(
        "aria-label",
        show ? "실시간 보고서 종합" : "실시간 보고서 종합 (자동 동기화)"
      );
    }
    const liveRoot = document.getElementById("liveReportDeck");
    if (liveRoot) {
      liveRoot.classList.toggle("is-viewer", !show);
      liveRoot.classList.add("report-deck");
      const printBtn = document.getElementById("btnLiveDeckPrint");
      const saveBtn = document.getElementById("btnLiveDeckSave");
      const close = document.getElementById("btnLiveDeckClose");
      const back = document.getElementById("btnLiveDeckBack");
      if (printBtn) printBtn.hidden = !show;
      if (saveBtn) saveBtn.hidden = !show;
      if (close) close.hidden = false;
      if (back) back.hidden = !show || !liveRoot.classList.contains("is-spread");
    }
  }

  window.__careerSyncTeacherSheetTools = syncTeacherSheetTools;

  function ensureDraftControls(actionsHost) {
    if (!actionsHost) return;
    ensureResetControls(actionsHost);
    if (document.getElementById("btnDraftSave")) {
      syncTeacherSheetTools();
      return;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "draft-fab";
    btn.id = "btnDraftSave";
    btn.setAttribute("aria-label", "임시 저장");
    btn.title = "작성 중인 내용을 이 기기에 임시 저장합니다";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <path d="M17 21v-8H7v8"/>
        <path d="M7 3v5h8"/>
      </svg>
      <span class="label">임시</span>`;
    btn.addEventListener("click", () => saveActivityDraft({ toast: true, force: true }));
    const submit = document.getElementById("btnSubmitActivity");
    if (submit && submit.parentNode === actionsHost) actionsHost.insertBefore(btn, submit);
    else actionsHost.appendChild(btn);
    syncTeacherSheetTools();
  }

  function ensureResetControls(actionsHost) {
    if (!actionsHost || document.getElementById("btnSheetReset")) {
      syncTeacherSheetTools();
      return;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "draft-fab reset-fab";
    btn.id = "btnSheetReset";
    btn.hidden = true;
    btn.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-label", "초기화");
    btn.title = "작성 내용을 모두 지우고 초기 화면으로 되돌립니다 (교사)";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 3-6.7"/>
        <path d="M3 4v5h5"/>
      </svg>
      <span class="label">초기화</span>`;
    btn.addEventListener("click", () => resetActivitySheetToInitial());
    // 임시 저장 왼쪽 · 제출하기 앞
    const draft = document.getElementById("btnDraftSave");
    const submit = document.getElementById("btnSubmitActivity");
    if (draft && draft.parentNode === actionsHost) actionsHost.insertBefore(btn, draft);
    else if (submit && submit.parentNode === actionsHost) actionsHost.insertBefore(btn, submit);
    else actionsHost.appendChild(btn);
    syncTeacherSheetTools();
  }

  function syncSubmitFabLabel() {
    const fab = document.getElementById("btnSubmitActivity");
    if (!fab) return;
    const svg = fab.querySelector("svg");
    fab.innerHTML = `
      ${svg ? svg.outerHTML : ""}
      <span class="label">제출하기</span>`;
    fab.setAttribute("aria-label", "제출하기");
  }

  function waitActivityTeacherResolved(timeoutMs = 1600) {
    return new Promise((resolve) => {
      const read = () => document.documentElement.dataset.activityTeacher;
      if (read() === "1" || read() === "0") {
        resolve(read() === "1");
        return;
      }
      const t0 = Date.now();
      const id = setInterval(() => {
        const v = read();
        if (v === "1" || v === "0" || Date.now() - t0 >= timeoutMs) {
          clearInterval(id);
          resolve(v === "1");
        }
      }, 40);
    });
  }

  function scheduleDraftRestore() {
    void (async () => {
      try {
        const isTeacher = await waitActivityTeacherResolved();
        // 교사가 제시하는 활동지: 임시저장 복원 없음 → 체크 풀린 기본 화면
        if (isTeacher) {
          try {
            if (typeof window.__careerWorldcupEnsurePristine === "function") {
              window.__careerWorldcupEnsurePristine();
            }
          } catch (e) {
            console.warn(e);
          }
          return;
        }
        restoreActivityDraft({ toast: true });
        const delays = document.getElementById("wc-job-inputs") ? [50, 200, 500] : [80];
        for (const ms of delays) {
          await new Promise((r) => setTimeout(r, ms));
          restoreActivityDraft({ toast: false });
        }
      } finally {
        draftRestored = true;
      }
    })();
  }

  function consumeLiveHintFlag() {
    try {
      const u = new URL(location.href);
      if (u.searchParams.get("liveHint") !== "1") return false;
      u.searchParams.delete("liveHint");
      const next = `${u.pathname}${u.search}${u.hash}`;
      history.replaceState({}, "", next);
      return true;
    } catch {
      return false;
    }
  }

  function hideLiveHintCoach() {
    const el = document.getElementById("liveHintCoach");
    if (!el) return;
    el.classList.add("is-out");
    const done = () => el.remove();
    el.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 700);
  }

  function positionLiveHintCoach() {
    const coach = document.getElementById("liveHintCoach");
    const btn = document.getElementById("btnLiveReport");
    const ring = coach?.querySelector(".live-hint-ring");
    const label = coach?.querySelector(".live-hint-label");
    if (!coach || !btn || !ring || !label) return false;
    const r = btn.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;

    const pad = 6;
    ring.style.top = `${Math.round(r.top - pad)}px`;
    ring.style.left = `${Math.round(r.left - pad)}px`;
    ring.style.width = `${Math.round(r.width + pad * 2)}px`;
    ring.style.height = `${Math.round(r.height + pad * 2)}px`;
    ring.style.borderRadius = `${Math.round(Math.min(r.height + pad * 2, 999))}px`;

    // 인쇄·줌 등 우측 도구와 겹치지 않도록 버튼 아래(빈 본문 쪽) 말풍선 배치
    const labelW = Math.min(300, Math.max(200, Math.min(280, window.innerWidth - 24)));
    label.style.width = `${labelW}px`;
    label.classList.remove("is-left", "is-right", "is-below", "is-above");

    const gap = 12;
    const labelH = label.offsetHeight || 64;
    let top = r.bottom + gap;
    let left = Math.round(r.left);
    let place = "below";

    if (top + labelH > window.innerHeight - 10) {
      top = Math.max(8, r.top - labelH - gap);
      place = "above";
    }
    if (left + labelW > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - labelW - 10);
    }
    if (left < 10) left = 10;

    label.classList.add(place === "above" ? "is-above" : "is-below");
    label.style.top = `${Math.round(top)}px`;
    label.style.left = `${Math.round(left)}px`;
    return true;
  }

  function showLiveHintCoach() {
    hideLiveHintCoach();
    const existing = document.getElementById("liveHintCoach");
    existing?.remove();

    const coach = document.createElement("div");
    coach.id = "liveHintCoach";
    coach.className = "live-hint-coach";
    coach.setAttribute("aria-live", "polite");
    coach.innerHTML = `
      <div class="live-hint-ring" aria-hidden="true"></div>
      <p class="live-hint-label"><strong>[교사용]</strong> 실시간 동기화 기능입니다.</p>`;
    document.body.appendChild(coach);

    const place = () => {
      if (!positionLiveHintCoach()) return false;
      requestAnimationFrame(() => coach.classList.add("is-on"));
      return true;
    };

    // 상단 도구가 자리를 잡을 때까지 재시도
    let tries = 0;
    const tryPlace = () => {
      tries += 1;
      if (place() || tries >= 20) return;
      setTimeout(tryPlace, 80);
    };
    tryPlace();

    const onReposition = () => positionLiveHintCoach();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    const holdMs = 4200;
    const fadeTimer = setTimeout(() => {
      coach.classList.add("is-out");
      coach.classList.remove("is-on");
    }, holdMs);
    const removeTimer = setTimeout(() => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      coach.remove();
    }, holdMs + 700);

    coach._cleanup = () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }

  function scheduleLiveHintCoach() {
    if (!consumeLiveHintFlag()) return;
    void (async () => {
      await waitActivityTeacherResolved(2000);
      // 도구 버튼 생성 직후
      await new Promise((r) => setTimeout(r, 280));
      showLiveHintCoach();
    })();
  }

  function ensureUi() {
    stripSheetIdentityFields();
    ensureHeroQr();
    ensureSheetIdentity();
    void resolveSheetDepartment();
    ensureReflectField();
    ensureAutosizeTextareas();
    initQuestionCardStars();
    if (document.getElementById("submitOverlay")) {
      const host =
        document.querySelector(".topbar-actions") ||
        document.querySelector(".topbar") ||
        document.body;
      ensureSheetTools(host);
      ensureZoomControls(host);
      ensureDraftControls(host);
      syncSubmitFabLabel();
      ensureTimeWatch();
      // 복원 먼저 → 이후 pagehide/visibility가 빈 폼으로 덮어쓰지 않음
      scheduleDraftRestore();
      bindDraftAutosave();
      scheduleLiveHintCoach();
      return;
    }

    const fab = document.createElement("button");
    fab.type = "button";
    fab.className = "submit-fab";
    fab.id = "btnSubmitActivity";
    fab.setAttribute("aria-label", "제출하기");
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12h11"/>
        <path d="M12 5l7 7-7 7"/>
        <path d="M4 19V5"/>
      </svg>
      <span class="label">제출하기</span>`;

    const actions = document.createElement("div");
    actions.className = "topbar-actions";

    const topbar = document.querySelector(".topbar");
    if (topbar) topbar.appendChild(actions);
    else {
      actions.style.position = "fixed";
      actions.style.top = "14px";
      actions.style.right = "14px";
      actions.style.zIndex = "30";
      document.body.appendChild(actions);
    }

    // 출력·저장 → 확대·축소 → 초기화(교사) → 임시 저장 → 제출하기
    ensureSheetTools(actions);
    ensureZoomControls(actions);
    ensureDraftControls(actions);
    actions.appendChild(fab);
    ensureTimeWatch();
    scheduleDraftRestore();
    bindDraftAutosave();

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.id = "submitOverlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="submitTitle">
        <h3 id="submitTitle">활동 제출</h3>
        <p class="sub">${sessionNo}차시 전용 제출코드를 입력해 주세요. (차시마다 코드가 다릅니다)</p>
        <div class="field">
          <label for="submitCodeInput">제출 코드</label>
          <input id="submitCodeInput" type="text" autocomplete="off" placeholder="교사가 알려준 이 차시 제출코드" maxlength="16" />
        </div>
        <div class="field">
          <label for="studentNoInput">학번</label>
          <input id="studentNoInput" type="text" inputmode="numeric" autocomplete="off" placeholder="예: 10101" maxlength="8" />
        </div>
        <div class="field">
          <label for="studentNameInput">이름</label>
          <input id="studentNameInput" type="text" autocomplete="name" placeholder="홍길동" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="btnCancelSubmit">취소</button>
          <button type="button" class="btn btn-primary" id="btnConfirmSubmit">전송</button>
        </div>
        <p class="msg" id="submitMsg" role="status" aria-live="polite"></p>
      </div>`;
    document.body.appendChild(overlay);

    fab.addEventListener("click", () => {
      saveActivityDraft({ toast: false });
      overlay.classList.add("is-open");
      prefillCodeFromUrl();
      const id = readSheetIdentity();
      const noInput = document.getElementById("studentNoInput");
      const nameInput = document.getElementById("studentNameInput");
      if (noInput && id.studentNo) noInput.value = id.studentNo;
      if (nameInput && id.studentName) nameInput.value = id.studentName;
      document.getElementById("submitCodeInput")?.focus();
    });
    document.getElementById("wc-btn-submit")?.addEventListener("click", () => {
      fab.click();
    });
    document.getElementById("btnCancelSubmit").addEventListener("click", () => {
      overlay.classList.remove("is-open");
      setMsg("");
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("is-open");
        setMsg("");
      }
    });
    document.getElementById("btnConfirmSubmit").addEventListener("click", submitActivity);
    prefillCodeFromUrl();
    scheduleLiveHintCoach();
  }

  function setMsg(text, type) {
    const el = document.getElementById("submitMsg");
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("is-error", "is-ok");
    if (type) el.classList.add(type === "error" ? "is-error" : "is-ok");
  }

  function isMeaningfulFieldValue(text, whoName, whoNo) {
    const raw = String(text || "").trim();
    if (!raw) return false;
    const compact = raw.replace(/\s+/g, "");
    const letters = compact.replace(/[^0-9A-Za-z가-힣]/g, "");
    if (letters.length < 2) return false;
    const name = String(whoName || "").replace(/\s+/g, "");
    const no = String(whoNo || "").replace(/\s+/g, "");
    if (name && (compact === name || letters === name)) return false;
    if (no && (compact === no || letters === no)) return false;
    if (
      /^(없음|없어요|없습니다|모름|몰라요|비밀|패스|스킵|보통|그냥|있어요|좋아요|싫어요|ㅎㅎ+|ㅋㅋ+|ㅠㅠ+|ㅜㅜ+|ㅇㅇ|ㄴㄴ)$/i.test(
        compact
      )
    ) {
      return false;
    }
    const laughOnly = letters.replace(/[하호히헤키크흐흫ㅋㅎㅜㅠㅡ]/g, "");
    if (letters.length >= 2 && laughOnly.length / letters.length < 0.35) return false;
    if (/오늘 활동에서 느낀 점|내용을 작성|예:\s*|적어\s*주세요/.test(raw) && letters.length < 24) {
      return false;
    }
    return true;
  }

  /** 활동지 입력·최종 단계 도달 여부 판정 (미비 제출 표시용) */
  function assessActivityCompleteness() {
    const root = document.getElementById("activity-root");
    const id = readSheetIdentity();
    const reasons = [];
    const isWc =
      sessionNo === 3 ||
      !!document.getElementById("wc-result") ||
      !!root?.classList.contains("activity-card--worldcup");

    if (isWc) {
      const winner = (document.getElementById("wc-winner")?.value || "").trim();
      const result = document.getElementById("wc-result");
      const reachedFinal =
        !!root?.classList.contains("is-wc-done") ||
        !!(result && !result.hidden) ||
        !!winner;
      if (!reachedFinal) reasons.push("no-final");

      let jobFilled = 0;
      for (let i = 1; i <= 32; i++) {
        const el = document.getElementById(`job-${i}`);
        if (el && String(el.value || "").trim()) jobFilled++;
      }
      if (!reachedFinal && jobFilled < 16) reasons.push("sparse");
      // 최종 페이지 도달 시 성찰 문항 미작성만으로 미비 처리하지 않음

      return {
        complete: reasons.length === 0,
        reasons: [...new Set(reasons)],
        reachedFinal,
        filledCount: jobFilled + (winner ? 1 : 0),
        fieldCount: 32 + 4
      };
    }

    const skip = /^(sheetHakbun|sheetDisplayName|submitCodeInput|studentNoInput|studentNameInput|twMinutes)$/i;
    const fields = [];
    (root || document).querySelectorAll("textarea, input[type='text'], input:not([type])").forEach((el) => {
      if (el.disabled || el.type === "hidden") return;
      const key = el.id || el.name || "";
      if (skip.test(key)) return;
      if (el.closest(".time-watch, .topbar, .overlay, .hero-qr-wrap")) return;
      fields.push(el);
    });
    const filled = fields.filter((el) =>
      isMeaningfulFieldValue(el.value, id.studentName, id.studentNo)
    );
    const need = Math.max(2, Math.ceil(fields.length * 0.3));
    if (fields.length >= 3 && filled.length < need) reasons.push("sparse");
    if (fields.length >= 1 && filled.length === 0) reasons.push("sparse");

    const reflect = document.getElementById("fReflect")?.value || "";
    // 느낀점만 있고 본문이 거의 없으면 미비
    if (
      fields.length >= 4 &&
      filled.length <= 1 &&
      isMeaningfulFieldValue(reflect, id.studentName, id.studentNo)
    ) {
      reasons.push("sparse");
    }

    return {
      complete: reasons.length === 0,
      reasons: [...new Set(reasons)],
      reachedFinal: true,
      filledCount: filled.length,
      fieldCount: fields.length
    };
  }

  function collectActivityHtml(studentNo, studentName) {
    const clone = snapshotFilledRoot();
    if (!clone) return "";

    const meta = activityMeta();
    const title = meta.title || `${sessionNo}차시`;
    const topTitle = meta.topTitle || title;
    const completeness = assessActivityCompleteness();
    const completeAttr = completeness.complete ? "1" : "0";
    const reasonAttr = escapeHtml((completeness.reasons || []).join(","));
    const finalAttr = completeness.reachedFinal ? "1" : "0";
    return `
<div class="student-activity-export" data-session="${sessionNo}" data-student-no="${escapeHtml(studentNo)}" data-student-name="${escapeHtml(studentName)}" data-complete="${completeAttr}" data-reached-final="${finalAttr}" data-incomplete-reasons="${reasonAttr}" data-filled="${completeness.filledCount || 0}" data-fields="${completeness.fieldCount || 0}">
  <div class="topbar">
    <div class="brand" aria-hidden="true">✳</div>
    <div class="top-meta">
      <span class="chip">${sessionNo}차시 활동</span>
      <strong>${escapeHtml(topTitle)}</strong>
    </div>
  </div>
  <div class="shell">
    <section class="hero-card">
      <div class="hero-copy">
        <div class="theme">${escapeHtml(meta.theme)}</div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(studentNo)} · ${escapeHtml(studentName)}</p>
      </div>
    </section>
    <section class="activity-card" id="activity-root">
      ${clone.innerHTML}
    </section>
  </div>
</div>`.trim();
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function submitActivity() {
    if (!sb) {
      setMsg("서버 연결에 실패했습니다.", "error");
      return;
    }

    const submitCode = document.getElementById("submitCodeInput").value.trim();
    const sheet = readSheetIdentity();
    const studentNo =
      document.getElementById("studentNoInput").value.trim() || sheet.studentNo;
    const studentName =
      document.getElementById("studentNameInput").value.trim() || sheet.studentName;

    if (!submitCode) return setMsg("제출 코드를 입력해 주세요.", "error");
    if (!studentNo) return setMsg("학번을 입력해 주세요.", "error");
    if (!studentName) return setMsg("이름을 입력해 주세요.", "error");
    const sheetNoEl = document.getElementById("sheetHakbun");
    const sheetNameEl = document.getElementById("sheetDisplayName");
    if (sheetNoEl && !sheetNoEl.value.trim()) sheetNoEl.value = studentNo;
    if (sheetNameEl && !sheetNameEl.value.trim()) sheetNameEl.value = studentName;

    const content = collectActivityHtml(studentNo, studentName);
    if (!content) return setMsg("제출할 활동 내용이 없습니다.", "error");

    const btn = document.getElementById("btnConfirmSubmit");
    btn.disabled = true;
    setMsg("전송 중…");

    try {
      const { data, error } = await sb.rpc("submit_activity_by_code", {
        p_submit_code: submitCode,
        p_session_no: sessionNo,
        p_student_no: studentNo,
        p_student_name: studentName,
        p_content: content
      });
      if (error) throw error;
      if (!data) {
        setMsg("제출에 실패했습니다. 제출 코드를 확인해 주세요.", "error");
        return;
      }

      setMsg("제출되었습니다. 교사 화면에 전송되었습니다.", "ok");
      saveActivityDraft({ toast: false });
      setTimeout(() => {
        document.getElementById("submitOverlay")?.classList.remove("is-open");
        setMsg("");
        showSaveKeepHint();
      }, 1200);
    } catch (err) {
      console.error(err);
      const msg = err.message || "제출에 실패했습니다.";
      if (/schema cache|Could not find the function/i.test(msg)) {
        setMsg("서버 함수가 없습니다. 교사에게 supabase-activity-submit.sql 실행을 요청해 주세요.", "error");
      } else {
        setMsg(msg, "error");
      }
    } finally {
      btn.disabled = false;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureUi);
  } else {
    ensureUi();
  }
})();
