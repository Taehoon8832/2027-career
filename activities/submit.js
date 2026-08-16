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

    let el = document.getElementById("activityPageQr") || wrap.querySelector(".hero-qr");
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

    const lesson = document.createElement("p");
    lesson.className = "print-lesson-title";
    lesson.setAttribute("aria-hidden", "true");
    lesson.textContent = lessonTitleText();
    bar.appendChild(lesson);

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
    pageZoom = nearestZoomStep(level);
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
  }

  function snapshotFilledRoot() {
    const root = document.getElementById("activity-root");
    if (!root) return null;

    const clone = root.cloneNode(true);
    clone.querySelectorAll("input, textarea, select").forEach((el) => {
      if (el.tagName === "TEXTAREA") {
        el.textContent = el.value;
      } else if (el.tagName === "SELECT") {
        [...el.options].forEach((opt) => {
          if (opt.value === el.value) opt.setAttribute("selected", "selected");
          else opt.removeAttribute("selected");
        });
      } else if (el.type === "checkbox" || el.type === "radio") {
        if (el.checked) el.setAttribute("checked", "checked");
        else el.removeAttribute("checked");
      } else {
        el.setAttribute("value", el.value);
      }
    });
    clone.querySelectorAll("input, textarea, select").forEach((el) => {
      el.setAttribute("readonly", "readonly");
      if (el.tagName === "SELECT") el.setAttribute("disabled", "disabled");
    });
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

  function buildPrintDocument(filledRoot) {
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
  }
  .print-sheet { margin: 0; padding: 0; width: 100%; }
  .activity-card { width: 100%; }
  .activity-sheet-bar {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    column-gap: 8px;
    min-height: 34px;
    margin: 0 0 8px;
    padding: 2px 0 6px;
    border-bottom: 1.5px solid #d6d3d1;
  }
  .print-lesson-title {
    display: block;
    grid-column: 1;
    justify-self: start;
    align-self: center;
    z-index: 1;
    width: max-content;
    max-width: none;
    margin: 0;
    padding: 0;
    font: 700 10.5px/1.25 "Noto Serif KR", Pretendard, serif;
    letter-spacing: -0.02em;
    white-space: nowrap;
    word-break: keep-all;
    overflow: visible;
    writing-mode: horizontal-tb;
  }
  .activity-sheet-bar-title {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, calc(-50% - 0.2cm));
    z-index: 0;
    margin: 0;
    text-align: center;
    white-space: nowrap;
    pointer-events: none;
  }
  .activity-sheet-bar h2 {
    margin: 0;
    font: 700 calc(17px + 5pt)/1.25 Pretendard, sans-serif;
    text-align: center;
  }
  .sheet-identity {
    grid-column: 2;
    justify-self: end;
    align-self: center;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 0.1cm;
  }
  @media print {
    .activity-sheet-bar-title {
      left: 50%;
      transform: translate(-50%, calc(-50% - 0.2cm));
    }
    .activity-sheet-bar h2 {
      font-size: calc(17px + 5pt);
    }
    .print-lesson-title {
      white-space: nowrap !important;
      word-break: keep-all !important;
      max-width: none !important;
      width: max-content !important;
      writing-mode: horizontal-tb !important;
    }
    .sheet-identity {
      padding-top: 0.1cm;
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
  .q-item .q-title {
    display: block;
    margin: 0 0 2px;
    font: 700 9px/1.25 Pretendard, sans-serif;
    color: #3730a3;
  }
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
    gap: 5px;
  }
  .na-card {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #94a3b8;
    border-radius: 8px;
    padding: 6px 7px;
  }
  .na-card-head {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 4px;
    font: 700 11px/1.25 Pretendard, sans-serif;
  }
  .na-card-icon { font-size: 12px; }
  .na-card textarea {
    width: 100%;
    min-height: 48px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 5px 6px;
    font: 500 10px/1.4 Pretendard, sans-serif;
    resize: none;
    background: #fff;
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
</style>
</head>
<body>
  <div class="print-sheet">
    <div class="activity-card">
      ${filledRoot.innerHTML}
    </div>
  </div>
</body>
</html>`;
  }

  function printActivitySheet() {
    syncPrintLessonTitle();
    const filled = snapshotFilledRoot();
    if (!filled) return;
    const html = buildPrintDocument(filled);

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

    const startDelay = mobile ? 320 : 50;
    if (iframe.contentDocument?.readyState === "complete") {
      setTimeout(runPrint, startDelay);
    } else {
      iframe.onload = () => setTimeout(runPrint, startDelay);
      setTimeout(runPrint, mobile ? 600 : 220);
    }
  }

  function ensureSheetTools(actionsHost) {
    if (document.getElementById("sheetTools")) return;

    const tools = document.createElement("div");
    tools.className = "sheet-tools";
    tools.id = "sheetTools";
    tools.setAttribute("role", "group");
    tools.setAttribute("aria-label", "출력 및 저장");
    tools.innerHTML = `
      <button type="button" class="tool-btn" id="btnPrintSheet" aria-label="출력하기" title="출력하기">
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
        <div class="tw-display" id="twDisplay" aria-live="polite" aria-atomic="true">00:00</div>
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
        if (mode === "running") startTick();
        else {
          stopTick();
          remainMs = 0;
          endsAt = 0;
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
        paint();
        await pushTimer("paused", { remainSec: Math.ceil(remainMs / 1000) });
        return;
      }
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
      mode = "running";
      endsAt = nowMs() + remainMs;
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
      paint();
      await pushTimer("idle", { durationSec: mins * 60, remainSec: mins * 60 });
    }

    function setTeacherMode(on) {
      isTeacher = !!on;
      wrap.classList.toggle("is-teacher", isTeacher);
      wrap.classList.toggle("is-viewer", !isTeacher);
      wrap.classList.remove("is-booting");
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

  function draftStorageKey() {
    return `career-activity-draft:v1:${sessionNo}:${getDraftCodeKey()}`;
  }

  function collectDraftFields() {
    const fields = {};
    const root = document.getElementById("activity-root");
    const scope = root || document;
    scope.querySelectorAll("input, textarea, select").forEach((el) => {
      if (el.disabled || el.type === "hidden") return;
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
      v: 1,
      sessionNo,
      code: getDraftCodeKey(),
      savedAt: Date.now(),
      studentNo: id.studentNo,
      studentName: id.studentName,
      fields
    };
  }

  function applyDraftFields(payload) {
    if (!payload || !payload.fields || typeof payload.fields !== "object") return false;
    const root = document.getElementById("activity-root");
    const scope = root || document;
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
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const noEl = document.getElementById("sheetHakbun");
    const nameEl = document.getElementById("sheetDisplayName");
    if (noEl && payload.studentNo && !noEl.value.trim()) noEl.value = payload.studentNo;
    if (nameEl && payload.studentName && !nameEl.value.trim()) nameEl.value = payload.studentName;
    return true;
  }

  function saveActivityDraft(opts = {}) {
    try {
      const payload = collectDraftFields();
      localStorage.setItem(draftStorageKey(), JSON.stringify(payload));
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

  function restoreActivityDraft() {
    try {
      const raw = localStorage.getItem(draftStorageKey());
      if (!raw) return false;
      const payload = JSON.parse(raw);
      if (!payload || Number(payload.sessionNo) !== sessionNo) return false;
      const ok = applyDraftFields(payload);
      if (ok) {
        ensureAutosizeTextareas();
        showDraftToast("저장된 내용을 불러왔습니다");
      }
      return ok;
    } catch (e) {
      console.warn(e);
      return false;
    }
  }

  function showDraftToast(msg) {
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
    showDraftToast._timer = setTimeout(() => t.classList.remove("is-on"), 2000);
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

  function ensureDraftControls(actionsHost) {
    if (!actionsHost || document.getElementById("btnDraftSave")) return;
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
      <span class="label">임시 저장</span>`;
    btn.addEventListener("click", () => saveActivityDraft({ toast: true }));
    // 제출하기 앞에 배치
    const submit = document.getElementById("btnSubmitActivity");
    if (submit && submit.parentNode === actionsHost) actionsHost.insertBefore(btn, submit);
    else actionsHost.appendChild(btn);
  }

  function ensureUi() {
    stripSheetIdentityFields();
    ensureHeroQr();
    ensureSheetIdentity();
    ensureReflectField();
    ensureAutosizeTextareas();
    if (document.getElementById("submitOverlay")) {
      const host =
        document.querySelector(".topbar-actions") ||
        document.querySelector(".topbar") ||
        document.body;
      ensureSheetTools(host);
      ensureZoomControls(host);
      ensureDraftControls(host);
      ensureTimeWatch();
      bindDraftAutosave();
      restoreActivityDraft();
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

    // 출력·저장 → 확대·축소 → 임시 저장 → 제출하기
    ensureSheetTools(actions);
    ensureZoomControls(actions);
    ensureDraftControls(actions);
    actions.appendChild(fab);
    ensureTimeWatch();
    bindDraftAutosave();
    restoreActivityDraft();

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
  }

  function setMsg(text, type) {
    const el = document.getElementById("submitMsg");
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("is-error", "is-ok");
    if (type) el.classList.add(type === "error" ? "is-error" : "is-ok");
  }

  function collectActivityHtml(studentNo, studentName) {
    const clone = snapshotFilledRoot();
    if (!clone) return "";

    const meta = activityMeta();
    const title = meta.title || `${sessionNo}차시`;
    const topTitle = meta.topTitle || title;
    return `
<div class="student-activity-export" data-session="${sessionNo}" data-student-no="${escapeHtml(studentNo)}" data-student-name="${escapeHtml(studentName)}">
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
