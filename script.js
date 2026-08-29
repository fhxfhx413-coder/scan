// غير هذا الرابط إلى رابط سيرفرك الحقيقي.
const DISCORD_SERVER_URL = "https://discord.gg/yn9HppbZeg";

document.querySelectorAll("[data-discord-link]").forEach((link) => {
  link.href = DISCORD_SERVER_URL;
});

const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const clock = document.querySelector(".clock");
const updateClock = () => {
  if (!clock) return;

  clock.textContent = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
};

updateClock();
setInterval(updateClock, 30000);

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.getElementById("primary-navigation");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll("[data-fallback-image]").forEach((image) => {
  const shell = image.closest("[data-image-shell]");

  const showImage = () => {
    shell?.classList.add("has-image");
    shell?.classList.remove("is-missing");
  };

  const hideImage = () => {
    shell?.classList.add("is-missing");
    image.hidden = true;
  };

  if (image.complete) {
    if (image.naturalWidth > 0) {
      showImage();
    } else {
      hideImage();
    }
  }

  image.addEventListener("load", showImage);
  image.addEventListener("error", hideImage);
});

const lightboxLinks = document.querySelectorAll("[data-lightbox-image]");

if (lightboxLinks.length > 0) {
  const imageViewer = document.createElement("div");
  imageViewer.className = "image-viewer";
  imageViewer.setAttribute("role", "dialog");
  imageViewer.setAttribute("aria-modal", "true");
  imageViewer.setAttribute("aria-label", "معاينة الصورة");
  imageViewer.innerHTML = `
    <div class="viewer-window">
      <div class="viewer-title">
        <span>image_viewer.exe</span>
        <button class="viewer-close" type="button" aria-label="إغلاق الصورة">×</button>
      </div>
      <div class="viewer-body">
        <img alt="" />
      </div>
      <p class="viewer-caption"></p>
    </div>
  `;

  document.body.append(imageViewer);

  const viewerImage = imageViewer.querySelector(".viewer-body img");
  const viewerCaption = imageViewer.querySelector(".viewer-caption");
  const viewerClose = imageViewer.querySelector(".viewer-close");
  let lastFocusedElement = null;

  const closeViewer = () => {
    imageViewer.classList.remove("is-open");
    document.body.classList.remove("viewer-open");
    viewerImage.removeAttribute("src");
    lastFocusedElement?.focus();
  };

  const openViewer = (link) => {
    const image = link.querySelector("img");
    const caption = image?.getAttribute("alt") || "صورة BIGESCAN";

    lastFocusedElement = document.activeElement;
    viewerImage.src = link.href;
    viewerImage.alt = caption;
    viewerCaption.textContent = caption;
    imageViewer.classList.add("is-open");
    document.body.classList.add("viewer-open");
    viewerClose.focus();
  };

  lightboxLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openViewer(link);
    });
  });

  viewerClose.addEventListener("click", closeViewer);

  imageViewer.addEventListener("click", (event) => {
    if (event.target === imageViewer) {
      closeViewer();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && imageViewer.classList.contains("is-open")) {
      closeViewer();
    }
  });
}

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const navAnchors = document.querySelectorAll(".nav-links a");
const currentPage = window.location.pathname.split("/").pop() || "index.html";

navAnchors.forEach((anchor) => {
  const rawHref = anchor.getAttribute("href");
  if (!rawHref || rawHref.startsWith("http")) return;

  const linkUrl = new URL(rawHref, window.location.href);
  const linkPage = linkUrl.pathname.split("/").pop() || "index.html";
  const isCurrent = linkPage === currentPage;

  anchor.classList.toggle("is-active", isCurrent);
  if (isCurrent) {
    anchor.setAttribute("aria-current", "page");
  }
});
