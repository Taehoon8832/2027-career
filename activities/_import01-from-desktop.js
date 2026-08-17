/**
 * Build activities/01.html from the desktop "나 사용 설명서" source,
 * keeping the project shell (topbar/hero/activity.css/submit.js).
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(
  "c:/Users/kth15/OneDrive/바탕 화면/Cursor/나 사용 설명서",
  "1차시-학번미입력-이름미입력.html"
);
const DIR = __dirname;
const ASSET_V = "2101";

const html = fs.readFileSync(SRC, "utf8");
const cssAll = html.slice(html.indexOf(">", html.indexOf("<style")) + 1, html.indexOf("</style>"));

function extractSectionById(doc, id) {
  const marker = `id="${id}"`;
  const idPos = doc.indexOf(marker);
  if (idPos < 0) throw new Error("missing #" + id);
  const start = doc.lastIndexOf("<", idPos);
  const tag = doc.slice(start).match(/^<([a-zA-Z0-9-]+)/)[1];
  let i = doc.indexOf(">", start) + 1;
  let depth = 1;
  const openRe = new RegExp(`<${tag}(\\s|>)`, "g");
  const closeStr = `</${tag}>`;
  while (i < doc.length && depth > 0) {
    openRe.lastIndex = i;
    const openM = openRe.exec(doc);
    const nextOpen = openM ? openM.index : -1;
    const nextClose = doc.indexOf(closeStr, i);
    if (nextClose < 0) throw new Error("unclosed " + tag);
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 1;
    } else {
      depth -= 1;
      i = nextClose + closeStr.length;
      if (depth === 0) return doc.slice(start, i);
    }
  }
  throw new Error("failed " + id);
}

function extractByClass(doc, className) {
  const open = `<div class="${className}"`;
  const start = doc.indexOf(open);
  if (start < 0) throw new Error("missing ." + className);
  let i = doc.indexOf(">", start) + 1;
  let depth = 1;
  while (i < doc.length && depth > 0) {
    const nextOpen = doc.indexOf("<div", i);
    const nextClose = doc.indexOf("</div>", i);
    if (nextClose < 0) throw new Error("unclosed div ." + className);
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      i = nextClose + 6;
      if (depth === 0) return doc.slice(start, i);
    }
  }
  throw new Error("failed ." + className);
}

function extractReflect(rootHtml) {
  const start = rootHtml.indexOf('<div class="field reflect-field"');
  if (start < 0) throw new Error("reflect missing");
  let i = rootHtml.indexOf(">", start) + 1;
  let depth = 1;
  while (i < rootHtml.length && depth > 0) {
    const nextOpen = rootHtml.indexOf("<div", i);
    const nextClose = rootHtml.indexOf("</div>", i);
    if (nextClose < 0) throw new Error("unclosed reflect");
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      i = nextClose + 6;
      if (depth === 0) return rootHtml.slice(start, i);
    }
  }
  throw new Error("reflect fail");
}

function tidy(s) {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

const root = extractSectionById(html, "activity-root");
const naManual = extractByClass(root, "na-manual");
const part2 = extractSectionById(root, "part2-html");
const reflect = extractReflect(root);

// CSS: lesson-part / html-forge / inf-* through print block, stop before 100문100답
const cssStart = cssAll.indexOf(".lesson-part--html");
const cssEnd = cssAll.indexOf("/* 1차시 (2) · 100문 100답 */", cssStart);
if (cssStart < 0 || cssEnd < 0) throw new Error("css range not found");
let part2Css = cssAll.slice(cssStart, cssEnd);
// Don't override project body font
part2Css = part2Css.replace(
  /@media \(max-width: 1024px\) \{\s*body \{\s*font-family:[^}]+\}\s*/m,
  "@media (max-width: 1024px) {\n  "
);
part2Css = tidy(part2Css);

// Script
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error("inline script missing");
let forgeJs = scriptMatch[1].trim();
// Lazy-bind sheetDisplayName (submit.js injects the sheet bar)
const bindPatch = `
  function bindNameInput() {
    var el = document.getElementById("sheetDisplayName");
    if (!el) return;
    if (els.nameInput === el) return;
    els.nameInput = el;
    el.addEventListener("input", schedule);
    el.addEventListener("change", schedule);
  }
  bindNameInput();
  document.addEventListener("DOMContentLoaded", bindNameInput);
  setTimeout(bindNameInput, 0);
  setTimeout(bindNameInput, 80);
`;
if (!forgeJs.includes("function bindNameInput")) {
  forgeJs = forgeJs.replace(
    /if \(els\.nameInput\) \{\s*els\.nameInput\.addEventListener\("input", schedule\);\s*els\.nameInput\.addEventListener\("change", schedule\);\s*\}/,
    bindPatch
  );
  if (!forgeJs.includes("function bindNameInput")) {
    // fallback: append before final update();
    forgeJs = forgeJs.replace(/\n\s*update\(\);\s*\}\)\(\);\s*$/, "\n" + bindPatch + "\n  update();\n})();\n");
  }
}

// Append part2 CSS into activity.css if not already present
const activityCssPath = path.join(DIR, "activity.css");
let activityCss = fs.readFileSync(activityCssPath, "utf8");
const MARK_START = "/* === 1차시 HTML·캐릭터 포지 (auto) === */";
const MARK_END = "/* === /1차시 HTML·캐릭터 포지 === */";
const block = `${MARK_START}\n${part2Css}\n\n/* reflect after part2 */\n.lesson-part + .reflect-field {\n  margin-top: 18px;\n}\n${MARK_END}`;
if (activityCss.includes(MARK_START)) {
  activityCss =
    activityCss.slice(0, activityCss.indexOf(MARK_START)) +
    block +
    activityCss.slice(activityCss.indexOf(MARK_END) + MARK_END.length);
} else {
  activityCss = activityCss.trimEnd() + "\n\n" + block + "\n";
}
// ensure reflect selector includes lesson-part
activityCss = activityCss.replace(
  ".na-manual + .reflect-field,\n.bingo > .reflect-field {",
  ".na-manual + .reflect-field,\n.lesson-part + .reflect-field,\n.bingo > .reflect-field {"
);
activityCss = activityCss.replace(
  ".na-manual + .reflect-field,\r\n.bingo > .reflect-field {",
  ".na-manual + .reflect-field,\r\n.lesson-part + .reflect-field,\r\n.bingo > .reflect-field {"
);

fs.writeFileSync(activityCssPath, activityCss, "utf8");
fs.writeFileSync(path.join(DIR, "01-forge.js"), forgeJs + "\n", "utf8");

const outHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <!-- encoding-fix3 -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>1차시 · 디지털 나 사용 설명서</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap" />
  <link rel="stylesheet" href="./activity.css?v=${ASSET_V}" />
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
        <p>서로를 이해하고 즐거운 학급 문화를 만들기 위한 상세 안내서</p>
      </div>
      <div class="hero-qr-wrap">
        <a class="hero-qr" id="activityPageQr" href="#" rel="noopener noreferrer" aria-label="활동지 QR — 눌러서 열기"></a>
        <span class="hero-qr-cap">눌러서 열기</span>
      </div>
    </section>

    <section class="activity-card" id="activity-root">
      <h2>학생 활동지</h2>
      ${tidy(naManual)}

      ${tidy(part2)}

      ${tidy(reflect)}
    </section>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../vendor/qrcode.min.js"></script>
  <script src="./submit.js?v=${ASSET_V}"></script>
  <script src="./01-forge.js?v=${ASSET_V}"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(DIR, "01.html"), outHtml, "utf8");

// Update _build01.js to keep the new structure
fs.writeFileSync(
  path.join(DIR, "_build01.js"),
  `/**
 * Rebuild 01.html shell while preserving na-manual + part2 + reflect + 01-forge.js.
 * Prefer: node _import01-from-desktop.js (full import from desktop source).
 */
console.log("01.html is maintained by _import01-from-desktop.js — run that to refresh from the desktop source.");
`,
  "utf8"
);

fs.writeFileSync(path.join(DIR, "_import01-from-desktop.js"), fs.readFileSync(__filename, "utf8"), "utf8");

console.log("wrote 01.html, 01-forge.js, activity.css (part2 styles), v=" + ASSET_V);
console.log("na", naManual.length, "part2", part2.length, "css", part2Css.length, "js", forgeJs.length);
