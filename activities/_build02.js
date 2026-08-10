const fs = require("fs");
const path = require("path");

const src = path.join(
  "c:",
  "Users",
  "Boin",
  "Documents",
  "카카오톡 받은 파일",
  "나를 소개하는 100문 100답.html"
);
const out = path.join(__dirname, "02.html");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const srcHtml = fs.readFileSync(src, "utf8");
const titles = [...srcHtml.matchAll(/<span class="q-title">([^<]+)<\/span>/g)].map((m) =>
  m[1].trim()
);

const qItems = titles
  .map((t, i) => {
    const n = i + 1;
    const label = t.replace(/^\d+\.\s*/, "");
    return `          <div class="q-item">
            <label class="q-title" for="q${n}">${n}. ${escapeHtml(label)}</label>
            <input id="q${n}" name="q${n}" type="text" autocomplete="off" />
          </div>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>2차시 · 나를 소개하는 100문 100답</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap" />
  <link rel="stylesheet" href="./activity.css?v=tools1" />
  <script>window.ACTIVITY_SESSION = 2;</script>
</head>
<body>
  <div class="topbar">
    <div class="brand" aria-hidden="true">✳</div>
    <div class="top-meta">
      <span class="chip">2차시 활동</span>
      <strong>나를 소개하는 100문 100답</strong>
    </div>
  </div>
  <div class="shell">
    <section class="hero-card">
      <div class="hero-copy">
        <div class="theme">3월 · 진로 탐색과 AI 기초 역량 빌드업</div>
        <h1>2차시 · 나를 소개하는 100문 100답</h1>
        <p>우리 반 친구들에게 나를 당당하게 알려보는 시간!</p>
      </div>
      <div class="hero-qr-wrap">
        <a class="hero-qr" id="activityPageQr" href="#" rel="noopener noreferrer" aria-label="활동지 QR — 눌러서 열기"></a>
        <span class="hero-qr-cap">눌러서 열기</span>
      </div>
    </section>

    <section class="activity-card" id="activity-root">
      <h2>학생 활동지</h2>
      <div class="q100">
        <header class="q100-head">
          <strong>나를 소개하는 100문 100답</strong>
          <span>우리 반 친구들에게 나를 당당하게 알려보는 시간!</span>
        </header>
        <div class="questions-grid">
${qItems}
        </div>
      </div>
    </section>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../vendor/qrcode.min.js"></script>
  <script src="./submit.js?v=tools1"></script>
</body>
</html>
`;

fs.writeFileSync(out, html, "utf8");
console.log("wrote 02.html with", titles.length, "questions");
