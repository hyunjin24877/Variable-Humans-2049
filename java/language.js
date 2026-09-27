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

if (viewChangeLink) {
  viewChangeLink.addEventListener("click", (event) => {
    const usesModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    const reducesMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (usesModifiedClick || reducesMotion) return;

    event.preventDefault();
    viewChangeLink.classList.add("is-switching");

    window.setTimeout(() => {
      window.location.href = viewChangeLink.href;
    }, 300);
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
    }
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
