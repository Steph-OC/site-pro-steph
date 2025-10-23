(function () {
  const KEY = "theme-pref";            // "light" | "dark"
  const ORDER = ["light", "dark"];
  const btn = document.querySelector("[data-theme-toggle]");
  const ico = document.querySelector("[data-theme-icon]");

  function setIcon(pref) {
    if (!ico) return;
    ico.textContent = pref === "dark" ? "🌙" : "☀️";
  }

  function apply(pref) {
    const val = pref === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = val;
    try { localStorage.setItem(KEY, val); } catch {}
    setIcon(val);
    btn?.setAttribute("aria-label", "Thème : " + val);
    btn?.setAttribute("title", "Changer le thème (Clair ↔ Sombre) — Actuel : " + (val === "dark" ? "Sombre" : "Clair"));
  }

  function next(pref) {
    return ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
  }

  const saved = localStorage.getItem(KEY) || "light"; // défaut : clair
  apply(saved);

  btn?.addEventListener("click", () => {
    const current = localStorage.getItem(KEY) || "light";
    apply(next(current));
  });
})();
