(() => {
  function pickTopic() {
    const list = Array.isArray(window.DEBATE_TOPICS) ? window.DEBATE_TOPICS : [];
    const input = document.getElementById("f1");
    if (!input || !list.length) return;
    const topic = list[Math.floor(Math.random() * list.length)];
    input.value = topic;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function bind() {
    const btn = document.getElementById("btnDebateTopic");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", pickTopic);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
