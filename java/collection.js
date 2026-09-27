const filterButtons = document.querySelectorAll(".filter-button");
const archiveCards = document.querySelectorAll(".archive-card");

/* 현재 보이는 카드 기준으로 오른쪽 끝 카드 찾기 */
function updateCardBorders() {
  // 기존 row-end 전부 초기화
  archiveCards.forEach((card) => {
    card.classList.remove("row-end");
  });

  // 숨겨지지 않은 카드만 가져오기
  const visibleCards = Array.from(archiveCards).filter((card) => {
    return !card.classList.contains("is-hidden");
  });

  // 보이는 카드 중 3, 6, 9... 번째만 오른쪽 선 제거
  visibleCards.forEach((card, index) => {
    if ((index + 1) % 3 === 0) {
      card.classList.add("row-end");
    }
  });
}

/* 필터 */
filterButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    const selectedFilter = button.dataset.filter;

    // 메뉴 활성화
    filterButtons.forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    // 카드 필터
    archiveCards.forEach((card) => {
      const category = card.dataset.category;

      if (selectedFilter === "all" || category === selectedFilter) {
        card.classList.remove("is-hidden");
      } else {
        card.classList.add("is-hidden");
      }
    });

    // 필터 적용 후 오른쪽 선 다시 계산
    updateCardBorders();
  });
});

/* 처음 페이지 열었을 때도 계산 */
updateCardBorders();

const viewToggle = document.getElementById("viewToggle");
const collectionContent = document.querySelector(".collection-content");
const listText = document.querySelector(".list-text");

const cards = document.querySelectorAll(".archive-card");
const previewImage = document.getElementById("listPreviewImage");

viewToggle.addEventListener("click", (e) => {
  e.preventDefault();

  collectionContent.classList.toggle("list-mode");

  const isList = collectionContent.classList.contains("list-mode");

  listText.textContent = isList ? "Img" : "List";
});

cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    if (!collectionContent.classList.contains("list-mode")) {
      return;
    }

    const cardImage = card.querySelector(".archive-image img");

    if (cardImage) {
      previewImage.src = cardImage.src;
    }
  });
});