/* Theme handling: respects ?scoutTheme=, saved choice, or OS preference. */
(() => {
  const KEY = "oauth-guide-theme";
  const param = new URLSearchParams(window.location.search).get("scoutTheme");
  const saved = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = param || saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    const sync = () => {
      btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☀" : "☾";
    };
    sync();
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      sync();
    });
  });
})();
