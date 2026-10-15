// Phones: the header's buttons fold into one ☰ button with a small list hanging under the bar.
// It never covers the page or takes input away: a tap anywhere else, the button again, or Esc folds it.
// On wide screens the button is hidden by CSS and the same buttons simply sit in a row.
/**
 * @param {HTMLButtonElement} btn the ☰ button
 * @param {HTMLElement} menu the wrapper around the header buttons
 * @param {string[]} [closeOn] ids of the buttons that open something elsewhere on the page, so the list gets out of the way
 */
export function createBarMenu(btn, menu, closeOn = []) {
  const isOpen = () => menu.classList.contains("open");
  function set(open) { menu.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); }
  btn.addEventListener("click", () => set(!isOpen()));
  menu.addEventListener("click", (e) => { if (closeOn.some((id) => e.target.closest?.(`#${id}`))) set(false); });
  addEventListener("pointerdown", (e) => { if (isOpen() && !menu.contains(e.target) && !btn.contains(e.target)) set(false); }, true);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { e.stopImmediatePropagation(); set(false); btn.focus(); } }, true);
  return { close: () => set(false), isOpen };
}
