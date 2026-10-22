// Preview controls switch actual service captures. No account, API, or data storage.
const tabs = [...document.querySelectorAll('[role="tab"]')];
const siteHeader = document.querySelector(".site-header");
const productFrame = document.querySelector(".product-frame");
const siteMenu = document.querySelector(".site-menu");
const menuToggle = siteMenu.querySelector("summary");
const mobileMenu = matchMedia("(max-width: 768px)");
function resetMenu() { siteMenu.open = !mobileMenu.matches; }
resetMenu();
mobileMenu.addEventListener("change", resetMenu);
for (const link of siteMenu.querySelectorAll("a")) {
  link.addEventListener("click", () => {
    if (!mobileMenu.matches) return;
    siteMenu.open = false;
    const heading = document.querySelector(`${link.hash} h2`);
    if (heading) {
      heading.tabIndex = -1;
      // Let the native anchor navigation finish before restoring keyboard focus.
      requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    }
  });
}
document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || !mobileMenu.matches || !siteMenu.open) return;
  siteMenu.open = false;
  menuToggle.focus({ preventScroll: true });
  event.preventDefault();
});
document.addEventListener("click", event => {
  if (mobileMenu.matches && siteMenu.open && !siteMenu.contains(event.target)) siteMenu.open = false;
});
function selectTab(tab, revealStart = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
  }
  if (revealStart && matchMedia("(max-width: 768px)").matches && productFrame.getBoundingClientRect().top < siteHeader.offsetHeight) {
    window.scrollTo({ top: productFrame.getBoundingClientRect().top + scrollY - siteHeader.offsetHeight, behavior: "instant" });
  }
}
for (const [index, tab] of tabs.entries()) {
  tab.disabled = false;
  tab.addEventListener("click", () => selectTab(tab, true));
  tab.addEventListener("keydown", event => {
    let next;
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft") next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs.at(-1);
    if (!next) return;
    event.preventDefault();
    selectTab(next, true);
    next.focus({ preventScroll: true });
  });
}

// Choose the starting view once; resizing keeps the visitor's selected tab.
selectTab(document.getElementById(matchMedia("(max-width: 768px)").matches ? "today-tab" : "month-tab"));

// Keep the native anchor as the no-JavaScript fallback.
for (const link of document.querySelectorAll("[data-preview-tab]")) {
  link.addEventListener("click", () => {
    const tab = document.getElementById(link.dataset.previewTab);
    selectTab(tab);
    tab.focus({ preventScroll: true });
  });
}

if ("ResizeObserver" in window) {
  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--header-height", `${siteHeader.offsetHeight}px`);
  }).observe(siteHeader);
}

const viewer = document.getElementById("screenshot-viewer");
if (typeof viewer.showModal === "function") {
  const image = document.getElementById("viewer-image");
  const viewport = viewer.querySelector(".viewer-viewport");
  const sizeButton = document.getElementById("viewer-size");
  const closeButton = document.getElementById("viewer-close");
  let trigger;
  let previousScroll;
  let previousBodyStyle;
  let backdropStart = false;

  function setOriginal(original) {
    viewport.classList.toggle("is-original", original);
    sizeButton.setAttribute("aria-pressed", String(original));
    sizeButton.textContent = original ? "화면에 맞추기" : "원본 크기로";
    viewport.scrollTo(0, 0);
  }

  for (const link of document.querySelectorAll(".screenshot-trigger, .screenshot-link")) {
    const caption = link.closest(".preview-device").querySelector(".device-caption").textContent;
    link.setAttribute("aria-label", `${caption} 화면 크게 보기`);
    link.setAttribute("aria-haspopup", "dialog");
    const newTabNote = link.querySelector(".new-tab-note");
    if (newTabNote) newTabNote.hidden = true;
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      const source = link.closest(".preview-device").querySelector("img");
      image.src = source.src;
      image.alt = source.alt;
      image.style.setProperty("--image-width", `${source.getAttribute("width")}px`);
      document.getElementById("viewer-title").textContent = `${caption} 화면`;
      document.getElementById("viewer-original").href = link.href;
      setOriginal(false);
      previousScroll = { x: scrollX, y: scrollY };
      previousBodyStyle = document.body.getAttribute("style");
      Object.assign(document.body.style, { position: "fixed", top: `${-previousScroll.y}px`, left: "0", width: "100%", overflow: "hidden" });
      viewer.showModal();
      closeButton.focus({ preventScroll: true });
    });
  }

  sizeButton.addEventListener("click", () => setOriginal(sizeButton.getAttribute("aria-pressed") !== "true"));
  closeButton.addEventListener("click", () => viewer.close());
  viewer.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const first = sizeButton;
    const last = document.getElementById("viewer-original");
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  function outside(event) {
    const box = viewer.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  }
  viewer.addEventListener("pointerdown", event => { backdropStart = outside(event); });
  viewer.addEventListener("click", event => {
    if (backdropStart && outside(event)) viewer.close();
    backdropStart = false;
  });
  viewer.addEventListener("close", () => {
    if (previousBodyStyle === null) document.body.removeAttribute("style");
    else document.body.setAttribute("style", previousBodyStyle);
    window.scrollTo({ left: previousScroll.x, top: previousScroll.y, behavior: "instant" });
    trigger.focus({ preventScroll: true });
  });
}

const demoVideos = [...document.querySelectorAll(".demo-video")];
for (const video of demoVideos) {
  video.addEventListener("play", () => {
    for (const other of demoVideos) if (other !== video && !other.paused) other.pause();
  });
}
if ("IntersectionObserver" in window) {
  const playbackObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
  });
  for (const video of demoVideos) playbackObserver.observe(video);
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
