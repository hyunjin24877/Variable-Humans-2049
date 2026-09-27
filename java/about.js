const aboutContent = document.querySelector(".about-content");
const navItems = document.querySelectorAll(".about-nav-item");
const sections = document.querySelectorAll(".about-section");

const aboutHero = document.querySelector(".about-hero");
const heroText = document.querySelector(".about-hero-text");
const scrollContent = document.querySelector(".about-scroll-content");

/* ========================================
   NAV 클릭 중인지 확인
======================================== */

let isNavScrolling = false;
let scrollEndTimer;

/* ========================================
   제목 + 날짜 아래 기준선
======================================== */

function getActiveLine() {
  const heroRect = heroText.getBoundingClientRect();

  return heroRect.bottom + 40;
}

/* ========================================
   NAV CLICK
======================================== */

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const targetId = item.dataset.section;
    const target = document.getElementById(targetId);

    if (!target) return;

    /* 클릭한 메뉴 즉시 active */
    navItems.forEach((nav) => {
      nav.classList.remove("active");
    });

    item.classList.add("active");

    /* 클릭 이동 중 자동 active 변경 막기 */
    isNavScrolling = true;

    const targetRect = target.getBoundingClientRect();
    const activeLine = getActiveLine();

    /*
        target의 현재 위치에서
        activeLine 위치까지 이동해야 하는 거리 계산
        */
    const distance = targetRect.top - activeLine;

    const targetScrollTop = aboutContent.scrollTop + distance;

    aboutContent.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  });
});

/* ========================================
   ACTIVE NAV
======================================== */

function updateActiveNav() {
  /*
    메뉴 클릭으로 이동 중이면
    자동 active 변경하지 않음
    */
  if (isNavScrolling) return;

  const activeLine = getActiveLine();

  let current = "";

  /* 첫 번째 섹션 */
  const firstSection = sections[0];

  if (!firstSection) return;

  const firstRect = firstSection.getBoundingClientRect();

  /*
    아직 전시정보가 기준선까지
    올라오지 않았다면 아무것도 선택 X
    */
  if (firstRect.top > activeLine) {
    navItems.forEach((item) => {
      item.classList.remove("active");
    });

    return;
  }

  /*
    기준선을 가장 최근에 통과한 section 찾기
    */
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();

    if (rect.top <= activeLine) {
      current = section.id;
    }
  });

  /*
    페이지 맨 아래에서는
    archive 강제 활성화
    */
  const isBottom =
    aboutContent.scrollTop + aboutContent.clientHeight >=
    aboutContent.scrollHeight - 5;

  if (isBottom && sections.length > 0) {
    current = sections[sections.length - 1].id;
  }

  /* 실제 active 적용 */
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.section === current);
  });
}

/* ========================================
   FEATHER
======================================== */

function updateFeather() {
  const heroRect = heroText.getBoundingClientRect();

  const scrollRect = scrollContent.getBoundingClientRect();

  /* 제목/날짜 아래 40px */
  const fadeTrigger = heroRect.bottom + 40;

  const relativeFade = fadeTrigger - scrollRect.top;

  if (relativeFade > 0) {
    scrollContent.classList.add("is-fading");

    scrollContent.style.setProperty(
      "--fade-start",
      `${Math.max(0, relativeFade - 80)}px`,
    );

    scrollContent.style.setProperty("--fade-end", `${relativeFade}px`);
  } else {
    scrollContent.classList.remove("is-fading");
  }
}

/* ========================================
   SCROLL
======================================== */

function updateScroll() {
  const scrollTop = aboutContent.scrollTop;

  /* 이미지 opacity */
  if (scrollTop > 40) {
    aboutHero.classList.add("is-scrolled");
  } else {
    aboutHero.classList.remove("is-scrolled");
  }

  /* 페더 */
  updateFeather();

  /* 자동 메뉴 */
  updateActiveNav();

  /*
    클릭 이동 중이라면
    스크롤이 멈춘 뒤 자동 감지 다시 시작
    */
  if (isNavScrolling) {
    clearTimeout(scrollEndTimer);

    scrollEndTimer = setTimeout(() => {
      isNavScrolling = false;

      /*
            클릭한 위치가 이미 정확히 맞으므로
            여기서 active를 다시 계산할 필요 없음
            */
    }, 150);
  }
}

/* ========================================
   EVENT
======================================== */

aboutContent.addEventListener("scroll", updateScroll);

window.addEventListener("resize", () => {
  updateFeather();

  if (!isNavScrolling) {
    updateActiveNav();
  }
});

updateScroll();


/* =========================
   HERO IMAGE SLIDER
========================= */

const heroImage = document.querySelector(".about-hero-image");
const prevButton = document.querySelector(".detail-arrow-prev");
const nextButton = document.querySelector(".detail-arrow-next");

/* 보여줄 이미지 */
const heroImages = [
  "./img/about/about1.webp",
  "./img/about/about2.webp",
  "./img/about/about3.webp",
  "./img/about/about4.webp",
  "./img/about/about5.webp",
];


let currentImageIndex = 0;


/* 이미지 변경 */
function changeHeroImage() {
  heroImage.src = heroImages[currentImageIndex];
}


/* 이전 이미지 */
prevButton.addEventListener("click", () => {
  currentImageIndex--;

  if (currentImageIndex < 0) {
    currentImageIndex = heroImages.length - 1;
  }

  changeHeroImage();
});


/* 다음 이미지 */
nextButton.addEventListener("click", () => {
  currentImageIndex++;

  if (currentImageIndex >= heroImages.length) {
    currentImageIndex = 0;
  }

  changeHeroImage();
});