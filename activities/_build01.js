const fs = require("fs");
const path = require("path");

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

const naManual = extractNaManual(existing);

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>1차시 · 디지털 나 사용 설명서</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap" />
  <link rel="stylesheet" href="./activity.css?v=print2" />
  <script>window.ACTIVITY_SESSION = 1;</script>
</head>
<body>
  <div class="topbar">
    <div class="brand" aria-hidden="true">✳</div>
    <div class="top-meta">
      <span class="chip">1차시 활동</span>
      <strong>디지털 나 사용 설명서</strong>
    </div>
  </div>
  <div class="shell">
    <section class="hero-card">
      <div class="hero-copy">
        <div class="theme">3월 · 진로 탐색과 AI 기초 역량 빌드업</div>
        <h1>1차시 · 디지털 나 사용 설명서</h1>
      </div>
      <div class="hero-qr-wrap">
        <a class="hero-qr" id="activityPageQr" href="#" rel="noopener noreferrer" aria-label="활동지 QR — 눌러서 열기"></a>
        <span class="hero-qr-cap">눌러서 열기</span>
      </div>
    </section>

    <section class="activity-card" id="activity-root">
      <h2>학생 활동지</h2>
      ${naManual}
    </section>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../vendor/qrcode.min.js"></script>
  <script src="./submit.js?v=print2"></script>
</body>
</html>
`;

fs.writeFileSync(out, html, "utf8");
console.log("wrote 01.html (디지털 나 사용 설명서 only)");
