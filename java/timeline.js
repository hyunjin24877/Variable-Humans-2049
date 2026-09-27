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
    previousButton.hidden = nextButton.hidden = galleryImages.length < 2;
  }

  function changeImage(direction) {
    if (!lightbox.open || galleryImages.length < 2) return;
    imageIndex = (imageIndex + direction + galleryImages.length) % galleryImages.length;
    renderImage();
  }

  function openImage(image) {
    imageTrigger = image;
    const gallery = image.closest(".observation-track, .research-track, .timeline-gallery");
    galleryImages = gallery ? Array.from(gallery.querySelectorAll("img")) : [image];
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

  const sections = Array.from(content.querySelectorAll("article.timeline-section"));
  const navItems = Array.from(document.querySelectorAll(".timeline-nav-item"));
  const timelineNav = document.querySelector(".timeline-nav");
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
