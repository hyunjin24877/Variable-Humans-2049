document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("timelineContent");
  if (!content) return;

  const lightbox = document.getElementById("timelineLightbox");
  const preview = lightbox.querySelector(".timeline-lightbox-image");
  const previousButton = lightbox.querySelector(".timeline-lightbox-prev");
  const nextButton = lightbox.querySelector(".timeline-lightbox-next");
  let imageTrigger = null;
  let galleryImages = [];
  let imageIndex = 0;

  function renderImage() {
    const image = galleryImages[imageIndex];
    preview.src = image.currentSrc || image.src;
    preview.alt = image.alt;
    preview.classList.toggle("observation-photo-flipped", image.classList.contains("observation-photo-flipped"));
    previousButton.hidden = nextButton.hidden = galleryImages.length < 2;
    previousButton.disabled = imageIndex === 0;
    nextButton.disabled = imageIndex === galleryImages.length - 1;
  }

  function changeImage(direction) {
    if (!lightbox.open || galleryImages.length < 2) return;
    const targetIndex = imageIndex + direction;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;
    imageIndex = targetIndex;
    renderImage();
  }

  function openImage(image) {
    imageTrigger = image;
    const gallery = image.closest(".observation-track, .research-track, .timeline-gallery");
    galleryImages = gallery
      ? Array.from(gallery.children)
          .filter((child) => child.matches(".observation-card, .research-card, .timeline-card"))
          .map((card) => card.querySelector(":scope > img"))
          .filter(Boolean)
      : [image];
    imageIndex = galleryImages.indexOf(image);
    renderImage();
    lightbox.showModal();
    content.classList.add("is-image-preview-open");
  }

  content.querySelectorAll("img").forEach((image) => {
    // Divide each row in proportion to the original image widths at equal height.
    const setImageRatio = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const card = image.closest(".observation-card, .research-card, .timeline-card");
      card?.style.setProperty("--timeline-image-ratio", image.naturalWidth / image.naturalHeight);
    };
    image.addEventListener("load", setImageRatio);
    setImageRatio();
    image.classList.add("timeline-image-trigger");
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-haspopup", "dialog");
    image.setAttribute("aria-label", `${image.alt || "이미지 / Image"} — 크게 보기 / Enlarge`);
    image.addEventListener("click", () => openImage(image));
    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openImage(image);
    });
  });

  previousButton.addEventListener("click", () => changeImage(-1));
  nextButton.addEventListener("click", () => changeImage(1));
  lightbox.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    changeImage(event.key === "ArrowLeft" ? -1 : 1);
  });

  let touchStart = null;
  preview.addEventListener("touchstart", (event) => {
    touchStart = event.touches.length === 1
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  preview.addEventListener("touchend", (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) changeImage(dx < 0 ? 1 : -1);
  }, { passive: true });
  preview.addEventListener("touchcancel", () => { touchStart = null; });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => {
    touchStart = null;
    content.classList.remove("is-image-preview-open");
    preview.removeAttribute("src");
    imageTrigger?.focus({ preventScroll: true });
  });

  /* Mobile: show one large image per gallery with previous/next controls. */
  content.querySelectorAll(".observation-track, .research-track, .timeline-gallery")
    .forEach((gallery) => {
      const cards = Array.from(gallery.children).filter((child) =>
        child.matches(".observation-card, .research-card, .timeline-card"));
      if (!cards.length) return;

      let currentIndex = 0;
      cards[0].classList.add("is-mobile-active");

      if (cards.length < 2) return;

      const controls = document.createElement("div");
      controls.className = "timeline-mobile-gallery-nav";

      const makeButton = (className, label, source) => {
        const button = document.createElement("button");
        const icon = document.createElement("img");
        button.type = "button";
        button.className = className;
        button.setAttribute("aria-label", label);
        icon.src = source;
        icon.alt = "";
        button.append(icon);
        return button;
      };

      const previous = makeButton(
        "timeline-mobile-gallery-prev",
        "이전 이미지 / Previous image",
        "./img/arrow-left.svg",
      );
      const next = makeButton(
        "timeline-mobile-gallery-next",
        "다음 이미지 / Next image",
        "./img/arrow-right.svg",
      );
      controls.append(previous, next);

      const render = () => {
        previous.disabled = currentIndex === 0;
        next.disabled = currentIndex === cards.length - 1;
        cards.forEach((card, index) => {
          card.classList.toggle("is-mobile-active", index === currentIndex);
        });
        const activeCard = cards[currentIndex];
        const caption = activeCard.querySelector(":scope > figcaption");
        activeCard.insertBefore(controls, caption);
      };

      previous.addEventListener("click", (event) => {
        event.stopPropagation();
        if (currentIndex <= 0) return;
        currentIndex--;
        render();
      });
      next.addEventListener("click", (event) => {
        event.stopPropagation();
        if (currentIndex >= cards.length - 1) return;
        currentIndex++;
        render();
      });

      render();
    });

  const sections = Array.from(content.querySelectorAll("article.timeline-section"));
  const navItems = Array.from(document.querySelectorAll(".timeline-nav-item"));
  const timelineNav = document.querySelector(".timeline-nav");
  const mobileYear = document.querySelector(".timeline-mobile-year");
  const mobileLayout = window.matchMedia("(max-width: 640px)");
  if (!sections.length) return;

  function sectionTop(target) {
    if (mobileLayout.matches) {
      return window.scrollY + target.getBoundingClientRect().top;
    }
    return content.scrollTop + target.getBoundingClientRect().top
      - content.getBoundingClientRect().top - content.clientTop;
  }

  function scrollPosition() {
    return mobileLayout.matches ? window.scrollY : content.scrollTop;
  }

  function activeLine() {
    return scrollPosition() + (mobileLayout.matches ? 61 + timelineNav.offsetHeight : 1);
  }

  function updateActiveState() {
    let active = sections[0];
    for (const section of sections) {
      if (sectionTop(section) > activeLine()) break;
      active = section;
    }
    if (!mobileLayout.matches && content.scrollHeight > content.clientHeight &&
        content.scrollTop + content.clientHeight >= content.scrollHeight - 1) {
      active = sections[sections.length - 1];
    }
    navItems.forEach((item) => {
      const selected = item.dataset.target === active.id;
      item.classList.toggle("active", selected);
      if (selected) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });
    if (mobileYear) {
      mobileYear.textContent = active.id.replace("timeline-", "");
    }
  }

  navItems.forEach((button) => {
    button.addEventListener("click", () => {
      const target = sections.find((section) => section.id === button.dataset.target);
      if (!target) return;
      const scroller = mobileLayout.matches ? window : content;
      scroller.scrollTo({
        top: sectionTop(target) - (mobileLayout.matches ? 61 + timelineNav.offsetHeight : 0),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    });
  });

  let scrollFrame = null;
  content.addEventListener("scroll", () => {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;
      updateActiveState();
    });
  }, { passive: true });
  window.addEventListener("scroll", () => {
    if (!mobileLayout.matches || scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;
      updateActiveState();
    });
  }, { passive: true });
  window.addEventListener("resize", updateActiveState);

  const resizeObserver = new ResizeObserver(updateActiveState);
  resizeObserver.observe(content);
  sections.forEach((section) => resizeObserver.observe(section));
  content.setAttribute("tabindex", "0");
  if (!mobileLayout.matches) content.scrollTo({ top: 0, behavior: "instant" });
  updateActiveState();
});
