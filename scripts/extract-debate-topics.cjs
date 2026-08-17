const fs = require("fs");
const srcPath =
  "c:/Users/kth15/OneDrive/문서/카카오톡 받은 파일/찬반 토론.html";
const src = fs.readFileSync(srcPath, "utf8");
const m = src.match(/const debateTopics = \[([\s\S]*?)\];/);
if (!m) {
  console.error("no topics");
  process.exit(1);
}
const out = "/* auto-extracted debate topics */\nwindow.DEBATE_TOPICS = [" + m[1] + "];\n";
fs.writeFileSync("activities/debate-topics.js", out);
console.log("ok", out.length);
