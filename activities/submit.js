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
   * 현재 열린 활동지 주소 그대로 사용.
   * 경로를 다시 조립하면 file:// · 한글 폴더명에서 ERR_FILE_NOT_FOUND 가 난다.
   */
  function activityPageUrl() {
    try {
      const u = new URL(location.href);
      u.hash = "";
      const code = (u.searchParams.get("code") || "").trim().toUpperCase();
      if (code) u.searchParams.set("code", code);
      return u.href;
    } catch {
      return String(location.href || "").split("#")[0];
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
        el.removeAttribute("target");
        el.rel = "noopener noreferrer";
      }
      el.innerHTML = "";
      el.title = "탭하여 활동지 열기";
      el.setAttribute("aria-label", "활동지 QR — 눌러서 열기");
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
    if (el.tagName === "A") {
      el.href = url;
      el.removeAttribute("target");
      el.rel = "noopener noreferrer";
    }
    el.title = "탭하여 활동지 열기";
    el.setAttribute("aria-label", "활동지 QR — 눌러서 열기");
    el.dataset.qrUrl = url;

    if (paintScannableQr(el, url, displayPx)) return;

    loadQrLib().then(() => {
      if (!paintScannableQr(el, url, displayPx)) {
        el.textContent = "QR";
      }
    });
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
        `<a class="hero-qr" id="activityPageQr" href="#" rel="noopener noreferrer" aria-label="활동지 QR — 눌러서 열기"></a>` +
        `<span class="hero-qr-cap">눌러서 열기</span>`;
      hero.appendChild(wrap);
    }

    let el = document.getElementById("activityPageQr") || wrap.querySelector(".hero-qr");
    if (!el) return;

    const url = activityPageUrl();

    if (el.tagName !== "A") {
      const a = document.createElement("a");
      a.id = el.id || "activityPageQr";
      a.className = el.className || "hero-qr";
      a.setAttribute("aria-label", "활동지 QR — 눌러서 열기");
      el.replaceWith(a);
      el = a;
    }
    const cap = wrap.querySelector(".hero-qr-cap");
    if (cap) cap.textContent = "눌러서 열기";

    el.href = url;
    el.removeAttribute("target");
    el.rel = "noopener noreferrer";

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
          "#sheetStudentNo",
          "#sheetStudentName",
          "#studentId",
          "#studentName"
        ].join(", ")
      )
      .forEach((el) => el.remove());
  }

  function ensureUi() {
    stripSheetIdentityFields();
    ensureHeroQr();
    if (document.getElementById("submitOverlay")) return;

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

    const topbar = document.querySelector(".topbar");
    if (topbar) topbar.appendChild(fab);
    else {
      fab.style.position = "fixed";
      fab.style.top = "14px";
      fab.style.right = "14px";
      fab.style.zIndex = "30";
      document.body.appendChild(fab);
    }

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
      overlay.classList.add("is-open");
      prefillCodeFromUrl();
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
    const root = document.getElementById("activity-root");
    if (!root) return "";

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

    const title = document.querySelector(".hero-card h1")?.textContent?.trim() || `${sessionNo}차시`;
    const theme = document.querySelector(".hero-card .theme")?.textContent?.trim() || "";
    const topTitle = document.querySelector(".top-meta strong")?.textContent?.trim() || title;
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
        <div class="theme">${escapeHtml(theme)}</div>
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
    const studentNo = document.getElementById("studentNoInput").value.trim();
    const studentName = document.getElementById("studentNameInput").value.trim();

    if (!submitCode) return setMsg("제출 코드를 입력해 주세요.", "error");
    if (!studentNo) return setMsg("학번을 입력해 주세요.", "error");
    if (!studentName) return setMsg("이름을 입력해 주세요.", "error");

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
