console.log("연결됨");

const image = document.getElementById("productImage");

// 현재 이미지 주소에서 제품 번호 자동 추출
// 예: 2-front.webp → 2
const match = image.src.match(/\/(\d+)-(use|front|side|back)\.webp/i);

if (!match) {
  console.error("제품 번호를 찾을 수 없음:", image.src);
}

const productNumber = match ? match[1] : "1";

const images = [
  `./img/collection/${productNumber}-use.webp`,
  `./img/collection/${productNumber}-front.webp`,
  `./img/collection/${productNumber}-side.webp`,
  `./img/collection/${productNumber}-back.webp`,
];

let current = 0;

const prevButton = document.querySelector(".detail-arrow-prev");
const nextButton = document.querySelector(".detail-arrow-next");
const pageButtons = document.querySelectorAll(".page");
const viewButtons = document.querySelectorAll(".view");

function updateUI() {
  image.src = images[current];
  prevButton.disabled = current === 0;
  nextButton.disabled = current === images.length - 1;

  pageButtons.forEach((button, index) => {
    button.classList.toggle("active", index === current);
  });

  viewButtons.forEach((button, index) => {
    button.classList.toggle("active", index === current);
  });
}

nextButton.addEventListener("click", () => {
  if (current >= images.length - 1) return;
  current++;
  updateUI();
});

prevButton.addEventListener("click", () => {
  if (current <= 0) return;
  current--;
  updateUI();
});

pageButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    current = index;
    updateUI();
  });
});

viewButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    current = index;
    updateUI();
  });
});

/* 모바일 이미지 스와이프: 세로 스크롤과 두 손가락 확대는 유지 */
const mobileGallery = window.matchMedia("(max-width: 640px)");
let swipeStart = null;

image.addEventListener("touchstart", (event) => {
  swipeStart = mobileGallery.matches && event.touches.length === 1
    ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
    : null;
}, { passive: true });

image.addEventListener("touchmove", (event) => {
  if (event.touches.length !== 1) swipeStart = null;
}, { passive: true });

image.addEventListener("touchend", (event) => {
  const start = swipeStart;
  swipeStart = null;
  if (!start || !mobileGallery.matches || !event.changedTouches.length) return;

  const dx = event.changedTouches[0].clientX - start.x;
  const dy = event.changedTouches[0].clientY - start.y;
  if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;

  const target = current + (dx < 0 ? 1 : -1);
  if (target < 0 || target >= images.length) return;
  current = target;
  updateUI();
}, { passive: true });

image.addEventListener("touchcancel", () => { swipeStart = null; });
mobileGallery.addEventListener("change", () => { swipeStart = null; });

/* =========================
   ZOOM
========================= */

const zoomBox = document.querySelector(".zoom-box");

image.addEventListener("mousemove", (e) => {
  const rect = image.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  zoomBox.style.display = "block";

  zoomBox.style.left = `${x + 20}px`;
  zoomBox.style.top = `${y - 150}px`;

  zoomBox.style.backgroundImage = `url("${image.src}")`;

  zoomBox.style.backgroundSize = `${rect.width * 2}px ${rect.height * 2}px`;

  zoomBox.style.backgroundPosition = `-${x * 2 - 150}px -${y * 2 - 150}px`;
});

image.addEventListener("mouseleave", () => {
  zoomBox.style.display = "none";
});

updateUI();
