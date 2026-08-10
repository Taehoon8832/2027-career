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

  /** 교사 대시보드 activityUrl 과 동일한 절대 URL (제출코드 포함) */
  function activityPageUrl() {
    try {
      const u = new URL(location.href);
      u.hash = "";
      const code = (u.searchParams.get("code") || "").trim().toUpperCase();
      if (code) u.searchParams.set("code", code);
      else u.searchParams.delete("code");
      // 경로 정규화: .../activities/01.html
      return u.toString();
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
        if (typeof window.QRCode === "function") return resolve(window.QRCode);
        existing.addEventListener("load", () =>
          resolve(typeof window.QRCode === "function" ? window.QRCode : null)
        );
        existing.addEventListener("error", () => resolve(null));
        // 이미 로드 실패/완료된 경우 대비
        setTimeout(() => resolve(typeof window.QRCode === "function" ? window.QRCode : null), 800);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.async = true;
      s.dataset.qrcodeLib = "1";
      s.onload = () => resolve(typeof window.QRCode === "function" ? window.QRCode : null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  function paintQrInto(el, text, size) {
    if (!el || !text) return;
    const px = Math.max(64, Number(size) || 88);
    const url = String(text);
    if (el.tagName === "A") {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    }
    el.innerHTML = "";
    el.title = "탭하여 활동지 열기";
    el.setAttribute("aria-label", "활동지 QR — 눌러서 열기");

    const paintImg = () => {
      el.innerHTML = "";
      const img = document.createElement("img");
      img.alt = "활동지 QR";
      img.width = px;
      img.height = px;
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.display = "block";
      img.style.objectFit = "contain";
      img.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=" +
        px +
        "x" +
        px +
        "&margin=6&data=" +
        encodeURIComponent(url);
      el.appendChild(img);
      el.dataset.painted = "1";
      el.dataset.qrUrl = url;
    };

    // 1) 먼저 이미지로 즉시 표시 (빈 칸 방지)
    paintImg();

    // 2) qrcodejs 가 있으면 동일 URL로 로컬 렌더(교사 화면과 같은 라이브러리)
    loadQrLib().then((QR) => {
      if (typeof QR !== "function") return;
      if (el.dataset.qrUrl && el.dataset.qrUrl !== url) return;
      try {
        el.innerHTML = "";
        // eslint-disable-next-line no-new
        new QR(el, {
          text: url,
          width: px,
          height: px,
          colorDark: "#111110",
          colorLight: "#ffffff",
          correctLevel: QR.CorrectLevel ? QR.CorrectLevel.M : 1
        });
        const node = el.querySelector("canvas, img, table");
        if (!node) {
          paintImg();
          return;
        }
        if (node.tagName === "CANVAS" || node.tagName === "IMG") {
          node.style.width = "100%";
          node.style.height = "100%";
          node.style.display = "block";
        }
        if (node.tagName === "TABLE") {
          node.style.width = "100%";
          node.style.height = "100%";
          node.style.border = "0";
        }
        el.dataset.painted = "1";
        el.dataset.qrUrl = url;
      } catch {
        paintImg();
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
        `<a class="hero-qr" id="activityPageQr" href="#" target="_blank" rel="noopener noreferrer" aria-label="활동지 QR — 눌러서 열기"></a>` +
        `<span class="hero-qr-cap">눌러서 열기</span>`;
      hero.appendChild(wrap);
    }

    let el = document.getElementById("activityPageQr") || wrap.querySelector(".hero-qr");
    if (!el) return;

    const url = activityPageUrl();

    // div → a 로 승격 (클릭으로 활동지 열기)
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
    el.target = "_blank";
    el.rel = "noopener noreferrer";

    // 같은 URL이면 다시 그리지 않음
    if (el.dataset.painted === "1" && el.dataset.qrUrl === url && el.querySelector("canvas, img, table")) {
      return;
    }

    const size = window.matchMedia("(max-width: 640px)").matches
      ? 84
      : window.matchMedia("(max-width: 1024px)").matches
        ? 100
        : 92;
    paintQrInto(el, url, size);
  }

  function ensureUi() {
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
          <input id="studentNoInput" type="text" inputmode="numeric" autocomplete="off" placeholder="예: 10101 (1학년 1반 1번)" maxlength="8" />
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
