// gestion Light/Dark/System avec persistance
(function(){
  const KEY = "theme-pref"; // "light" | "dark" | "system"
  const root = document.documentElement;

  function applyTheme(pref){
    if (!pref || pref === "system"){
      root.removeAttribute("data-theme");
      localStorage.setItem(KEY, "system");
      updateUI("system");
      return;
    }
    root.setAttribute("data-theme", pref);
    localStorage.setItem(KEY, pref);
    updateUI(pref);
  }

  function updateUI(pref){
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.setAttribute("data-current-theme", pref);
    btn.setAttribute("aria-label", `Thème : ${pref}`);
    const ind = document.querySelector('[data-theme-indicator]');
    if (ind){
      const map = { system:"auto", light:"clair", dark:"sombre" };
      ind.textContent = map[pref] || pref;
    }
  }

  // lecture initiale
  const saved = localStorage.getItem(KEY) || "system";
  applyTheme(saved);

  // clic: cycle System -> Light -> Dark
  document.addEventListener("click", (e) => {
    const el = e.target.closest('[data-theme-toggle]');
    if (!el) return;
    const order = ["system","light","dark"];
    const current = localStorage.getItem(KEY) || "system";
    const next = order[(order.indexOf(current)+1) % order.length];
    applyTheme(next);
  });

  // changement de préférence système
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change", () => {
    const pref = localStorage.getItem(KEY) || "system";
    if (pref === "system") applyTheme("system");
  });
})();
