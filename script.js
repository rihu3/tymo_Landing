// Preview controls change example panels only. No account, API, or data storage.
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
  }
  const month = tab.id === "month-tab";
  document.querySelector(".mock-sidebar .mock-active")?.classList.remove("mock-active");
  document.querySelectorAll(".mock-sidebar > span")[month ? 1 : 0].classList.add("mock-active");
  document.querySelector(".product-topline h3").textContent = month ? "한눈에 보는 이번 달" : "오늘의 작은 계획";
}
for (const [index, tab] of tabs.entries()) {
  tab.disabled = false;
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", event => {
    let next;
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft") next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs.at(-1);
    if (!next) return;
    event.preventDefault();
    selectTab(next);
    next.focus();
  });
}

if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  for (const element of document.querySelectorAll(".reveal")) {
    element.classList.add("is-ready");
    observer.observe(element);
  }
}
