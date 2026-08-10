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
const out = path.join(__dirname, "01.html");
const existing = fs.readFileSync(out, "utf8");

function extractNaManual(html) {
  const start = html.indexOf('<div class="na-manual">');
  if (start < 0) throw new Error("na-manual not found");
  let i = start + '<div class="na-manual">'.length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf("<div", i);
    const nextClose = html.indexOf("</div>", i);
    if (nextClose < 0) throw new Error("unclosed div");
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      i = nextClose + 6;
      if (depth === 0) return html.slice(start, i);
    }
  }
  throw new Error("failed to extract na-manual");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const naManual = extractNaManual(existing);
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
  <title>1차시 · 디지털 나 사용 설명서(1) · 100문 100답(2)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap" />
  <link rel="stylesheet" href="./activity.css?v=na4" />
  <script>window.ACTIVITY_SESSION = 1;</script>
</head>
<body>
  <div class="topbar">
    <div class="brand" aria-hidden="true">✳</div>
    <div class="top-meta">
      <span class="chip">1차시 활동</span>
      <strong>디지털 나 사용 설명서(1) · 100문100답(2)</strong>
    </div>
  </div>
  <div class="shell">
    <section class="hero-card">
      <div class="hero-copy">
        <div class="theme">3월 · 진로 탐색과 AI 기초 역량 빌드업</div>
        <h1>1차시 · 디지털 나 사용 설명서(1)</h1>
        <p>아래 <strong>나를 소개하는 100문 100답(2)</strong>까지 함께 작성해 주세요.</p>
      </div>
      <div class="hero-qr-wrap">
        <a class="hero-qr" id="activityPageQr" href="#" rel="noopener noreferrer" aria-label="활동지 QR — 눌러서 열기"></a>
        <span class="hero-qr-cap">눌러서 열기</span>
      </div>
    </section>

    <section class="activity-card activity-card--session1" id="activity-root">
      <h2>1차시 · 디지털 나 사용 설명서(1)</h2>
      ${naManual}

      <h2 class="activity-part-title">1차시 · 나를 소개하는 100문 100답(2)</h2>
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
  <script src="./submit.js"></script>
</body>
</html>
`;

fs.writeFileSync(out, html, "utf8");
console.log("wrote 01.html with", titles.length, "questions");
