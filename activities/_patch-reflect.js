/**
 * 모든 활동지 #activity-root 최하단에 느낀점(세특 참조) 칸을 넣습니다.
 * 이미 fReflect가 있으면 건너뜁니다. 03의 bReflect는 fReflect로 통일합니다.
 */
const fs = require("fs");
const path = require("path");
const dir = __dirname;

const BLOCK = `
      <div class="field reflect-field" data-reflect="1">
        <label for="fReflect">느낀점(세특 참조)</label>
        <textarea id="fReflect" name="fReflect" rows="4" placeholder="오늘 활동에서 느낀 점, 배운 점, 성장한 점을 적어 주세요. (생기부 세특 작성 시 참고됩니다)"></textarea>
      </div>
`;

let patched = 0;
let skipped = 0;

for (let n = 1; n <= 30; n++) {
  const file = path.join(dir, String(n).padStart(2, "0") + ".html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");

  // 03: 기존 빙고 느낀점 → 표준 필드로 교체
  if (/id=["']bReflect["']/.test(html)) {
    html = html.replace(
      /<div class="bingo-reflection">[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/section>)/,
      BLOCK.trim() + "\n        "
    );
  }

  if (/id=["']fReflect["']/.test(html)) {
    fs.writeFileSync(file, html, "utf8");
    skipped += 1;
    continue;
  }

  const marker = 'id="activity-root"';
  const start = html.indexOf(marker);
  if (start < 0) {
    console.warn("no activity-root:", file);
    continue;
  }

  // activity-root section의 닫는 </section> 찾기 (중첩 section 없다고 가정)
  const after = html.slice(start);
  const closeRel = after.indexOf("</section>");
  if (closeRel < 0) {
    console.warn("no closing section:", file);
    continue;
  }
  const closeAbs = start + closeRel;
  html = html.slice(0, closeAbs) + BLOCK + "    " + html.slice(closeAbs);
  fs.writeFileSync(file, html, "utf8");
  patched += 1;
}

console.log("patched", patched, "already-had/updated", skipped);
