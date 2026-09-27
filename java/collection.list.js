console.log("collection-list.js 연결됨");

document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-button");
  const listItems = document.querySelectorAll(".collection-list-item");

  const preview = document.querySelector(".collection-list-preview");
  const previewImage = document.getElementById("previewImage");
  const previewCategory = document.getElementById("previewCategory");
  const previewTitle = document.getElementById("previewTitle");
  const previewDescription = document.getElementById("previewDescription");
  let previewItem = null;

  document.addEventListener("languagechange", () => {
    if (previewItem && previewDescription) {
      previewDescription.textContent = previewItem.dataset.description || "";
    }
  });

  /* =========================
     FILTER
  ========================= */

  filterButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      const selectedFilter = button.dataset.filter;

      filterButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      listItems.forEach((item) => {
        const category = item.dataset.category;

        if (selectedFilter === "all" || category === selectedFilter) {
          item.classList.remove("is-hidden");
        } else {
          item.classList.add("is-hidden");
        }
      });

      if (preview) {
        preview.classList.remove("is-visible");
      }
    });
  });

  /* =========================
     HOVER PREVIEW
  ========================= */

  listItems.forEach((item) => {
    /* 마우스 올렸을 때 */
    item.addEventListener("mouseenter", () => {
      previewItem = item;
      console.log("hover:", item.dataset.title);

      if (!preview) {
        console.error("preview 영역 없음");
        return;
      }

      if (previewImage) {
        previewImage.src = item.dataset.image || "";
      }

      if (previewCategory) {
        previewCategory.textContent = item.dataset.number || "";
      }

      if (previewTitle) {
        previewTitle.textContent = item.dataset.title || "";
      }

      if (previewDescription) {
        previewDescription.textContent = item.dataset.description || "";
      }

      preview.classList.add("is-visible");
    });

    /* 마우스 뗐을 때 */
    item.addEventListener("mouseleave", () => {
      previewItem = null;
      if (!preview) return;

      preview.classList.remove("is-visible");

      if (previewImage) {
        previewImage.src = "";
      }

      if (previewCategory) {
        previewCategory.textContent = "";
      }

      if (previewTitle) {
        previewTitle.textContent = "";
      }

      if (previewDescription) {
        previewDescription.textContent = "";
      }
    });
  });
});
