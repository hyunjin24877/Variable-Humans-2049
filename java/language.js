/* =========================
   LANGUAGE
========================= */

const languageToggle = document.getElementById("languageToggle");
const krOption = document.querySelector(".lang-kr");
const enOption = document.querySelector(".lang-en");
const langTexts = document.querySelectorAll(".lang-text");
const LANGUAGE_KEY = "variableHumansLanguage";
const translations = window.VARIABLE_HUMANS_TRANSLATIONS || {};
const normalizeText = (text) => text.replace(/\s+/g, " ").trim();

let currentLanguage = "ko";
try {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
  if (savedLanguage === "ko" || savedLanguage === "en") {
    currentLanguage = savedLanguage;
  }
} catch {
  // Language switching remains available when browser storage is disabled.
}

function translateText(text, language = currentLanguage) {
  return language === "en" ? (translations[normalizeText(text)] || text) : text;
}

// Retain individual text nodes so links, line breaks, and layout stay intact.
const textBindings = [];
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let textNode;
while ((textNode = walker.nextNode())) {
  if (textNode.parentElement.closest("script, style, .lang-text")) continue;
  const original = textNode.nodeValue;
  const english = translations[normalizeText(original)];
  if (english) textBindings.push({ node: textNode, original, english });
}

const translatedAttributes = [
  "placeholder", "alt", "aria-label", "title",
  "data-description", "data-caption", "data-alt",
];
const attributeBindings = [];
document.querySelectorAll(translatedAttributes.map((name) => `[${name}]`).join(","))
  .forEach((element) => {
    translatedAttributes.forEach((name) => {
      const original = element.getAttribute(name);
      if (original === null) return;
      const english = translations[normalizeText(original)];
      if (english) attributeBindings.push({ element, name, original, english });
    });
  });

function applyLanguage() {
  textBindings.forEach(({ node, original, english }) => {
    // Keep boundary whitespace between adjacent inline elements.
    node.nodeValue = currentLanguage === "en"
      ? original.replace(/\S[\s\S]*\S|\S/, english)
      : original;
  });
  attributeBindings.forEach(({ element, name, original, english }) => {
    element.setAttribute(name, currentLanguage === "en" ? english : original);
  });
  langTexts.forEach((element) => {
    const text = element.dataset[currentLanguage];
    if (text !== undefined) element.textContent = text;
  });

  if (krOption) krOption.classList.toggle("active", currentLanguage === "ko");
  if (enOption) enOption.classList.toggle("active", currentLanguage === "en");
  if (languageToggle) {
    languageToggle.classList.toggle("is-en", currentLanguage === "en");
    languageToggle.setAttribute("aria-label",
      currentLanguage === "en" ? "Switch to Korean" : "영어로 전환");
  }
  document.documentElement.lang = currentLanguage;
  document.dispatchEvent(new CustomEvent("languagechange", {
    detail: { language: currentLanguage },
  }));
}

window.variableHumansLanguage = {
  translate: translateText,
  get language() { return currentLanguage; },
};

if (languageToggle) {
  languageToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    currentLanguage = currentLanguage === "ko" ? "en" : "ko";
    try {
      localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    } catch {
      // The current page still switches without persistent storage.
    }
    applyLanguage();
  });
}

applyLanguage();

/* =========================
   SEARCH
========================= */

const header = document.getElementById("header");
const searchButton = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");
const searchItem = document.querySelector(".search-item");
const shopMenu = document.getElementById("shopmenu");
const viewChangeLink = document.querySelector("#changefilter a");
let mobileMenuButton = null;

const updateSearchButtonState = () => {
  if (!header || !searchButton) return;

  const isOpen = header.classList.contains("search-open");
  searchButton.setAttribute("aria-expanded", String(isOpen));
  searchButton.setAttribute("aria-controls", "searchInput");
  searchButton.setAttribute("aria-label", isOpen
    ? "검색 닫기 / Close search"
    : "검색 열기 / Open search");
};

const updateSearchPlaceholder = () => {
  if (!searchInput) return;

  if (window.innerWidth <= 640) {
    searchInput.placeholder = currentLanguage === "en"
      ? "Enter a search term."
      : "검색어를 입력해 주세요.";
    return;
  }

  searchInput.placeholder = currentLanguage === "en"
    ? "Enter a search term."
    : "검색어를 입력해주세요.";
};

updateSearchButtonState();
updateSearchPlaceholder();
document.addEventListener("languagechange", updateSearchPlaceholder);
window.addEventListener("resize", updateSearchPlaceholder);

if (viewChangeLink) {
  const initialLines = Array.from(viewChangeLink.querySelectorAll("svg.change line"))
    .map((line) => ({ line, x1: line.getAttribute("x1"), x2: line.getAttribute("x2") }));
  window.addEventListener("pageshow", () => {
    viewChangeLink.classList.remove("is-switching");
    initialLines.forEach(({ line, x1, x2 }) => {
      line.setAttribute("x1", x1);
      line.setAttribute("x2", x2);
    });
  });
  viewChangeLink.addEventListener("click", (event) => {
    const usesModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    const reducesMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (usesModifiedClick || reducesMotion) return;

    event.preventDefault();
    if (viewChangeLink.classList.contains("is-switching")) return;
    viewChangeLink.classList.add("is-switching");

    const icon = viewChangeLink.querySelector("svg.change");
    if (!icon) {
      window.location.href = viewChangeLink.href;
      return;
    }
    // 같은 세 선을 유지하며 좌우 위치와 대각선 기울기만 보간한다.
    const shapes = {
      list: [[4.56, 21.87], [4.56, 12.7], [2.22, 21.87]],
      img: [[2.13, 19.44], [19.44, 11.3], [2.13, 21.78]],
    };
    const from = shapes[icon.dataset.view];
    const to = shapes[icon.dataset.view === "list" ? "img" : "list"];
    const lines = Array.from(icon.querySelectorAll("line"));
    const start = performance.now();
    function morph(now) {
      const progress = Math.min((now - start) / 280, 1);
      const eased = progress * progress * (3 - 2 * progress);
      lines.forEach((line, index) => {
        ["x1", "x2"].forEach((attribute, endpoint) => {
          line.setAttribute(attribute, from[index][endpoint]
            + (to[index][endpoint] - from[index][endpoint]) * eased);
        });
      });
      if (progress < 1) requestAnimationFrame(morph);
      else window.location.href = viewChangeLink.href;
    }
    requestAnimationFrame(morph);
  });
}

if (header && shopMenu) {
  mobileMenuButton = document.createElement("button");
  mobileMenuButton.type = "button";
  mobileMenuButton.className = "mobile-menu-toggle";
  mobileMenuButton.setAttribute("aria-label", "메뉴 열기 / Open menu");
  mobileMenuButton.setAttribute("aria-controls", "shopmenu");
  mobileMenuButton.setAttribute("aria-expanded", "false");
  mobileMenuButton.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
  header.prepend(mobileMenuButton);

  const closeMobileMenu = () => {
    header.classList.remove("mobile-menu-open");
    mobileMenuButton.setAttribute("aria-expanded", "false");
    mobileMenuButton.setAttribute("aria-label", "메뉴 열기 / Open menu");
  };

  mobileMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = !header.classList.contains("mobile-menu-open");
    header.classList.toggle("mobile-menu-open", willOpen);
    if (header.classList.contains("search-open")) {
      searchInput?.blur();
      resetSearch();
    }
    header.classList.remove("search-open");
    updateSearchButtonState();
    mobileMenuButton.setAttribute("aria-expanded", String(willOpen));
    mobileMenuButton.setAttribute("aria-label", willOpen
      ? "메뉴 닫기 / Close menu"
      : "메뉴 열기 / Open menu");
  });

  shopMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("click", (event) => {
    if (header.classList.contains("mobile-menu-open") &&
        !shopMenu.contains(event.target) &&
        !mobileMenuButton.contains(event.target)) {
      closeMobileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) closeMobileMenu();
  });
}

if (header && searchButton && searchInput) {
  searchButton.addEventListener("click", (event) => {
    event.stopPropagation();

    header.classList.remove("mobile-menu-open");
    mobileMenuButton?.setAttribute("aria-expanded", "false");
    mobileMenuButton?.setAttribute("aria-label", "메뉴 열기 / Open menu");
    header.classList.toggle("search-open");
    updateSearchButtonState();

    if (header.classList.contains("search-open")) {
      searchInput.focus();
    } else {
      resetSearch();
    }
  });

  searchInput.addEventListener("input", searchProducts);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchProducts();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      header.classList.contains("search-open") &&
      searchItem &&
      !searchItem.contains(event.target)
    ) {
      header.classList.remove("search-open");
      searchInput.blur();
      resetSearch();
      updateSearchButtonState();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !header.classList.contains("search-open")) return;

    header.classList.remove("search-open");
    searchInput.blur();
    resetSearch();
    updateSearchButtonState();
  });
}

/* =========================
   PRODUCT SEARCH
========================= */

function searchProducts() {
  if (!searchInput) return;

  const keyword = searchInput.value.trim().toLowerCase();

  /* 이미지형 페이지 */
  const archiveCards = document.querySelectorAll(".archive-card");

  archiveCards.forEach((card) => {
    const title = card.querySelector(".archive-title");

    if (!title) return;

    const productName = title.textContent.trim().toLowerCase();

    card.classList.toggle("is-hidden", !productName.includes(keyword));
  });

  /* 리스트형 페이지 */
  const listItems = document.querySelectorAll(".collection-list-item");

  listItems.forEach((item) => {
    const title = item.querySelector(".collection-list-title");

    if (!title) return;

    const productName = title.textContent.trim().toLowerCase();

    item.classList.toggle("is-hidden", !productName.includes(keyword));
  });

  /* 이미지 페이지 선 정렬 */
  if (archiveCards.length > 0) {
    updateVisibleCardBorders();
  }
}

/* =========================
   RESET
========================= */

function resetSearch() {
  if (!searchInput) return;

  searchInput.value = "";

  document.querySelectorAll(".archive-card").forEach((card) => {
    card.classList.remove("is-hidden");
    card.classList.remove("row-end");
  });

  document.querySelectorAll(".collection-list-item").forEach((item) => {
    item.classList.remove("is-hidden");
  });

  updateVisibleCardBorders();
}

/* =========================
   BORDER
========================= */

function updateVisibleCardBorders() {
  const cards = [...document.querySelectorAll(".archive-card")];

  const visibleCards = cards.filter(
    (card) => !card.classList.contains("is-hidden"),
  );

  cards.forEach((card) => {
    card.classList.remove("row-end");
  });

  visibleCards.forEach((card, index) => {
    if ((index + 1) % 3 === 0) {
      card.classList.add("row-end");
    }
  });
}
