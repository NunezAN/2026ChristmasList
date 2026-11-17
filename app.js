"use strict";

const container = document.querySelector("#gifts");
const status = document.querySelector("#status");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

let cards = [];
let framePending = false;

const musicTracks = [
  "./assets/You're A Mean One, Mr. Grinch.mp3",
  "./assets/I AM THE GRINCH featuring Fletcher Jones 0.mp3",
];
const music = new Audio();
music.preload = "none";
let currentTrack = 0;
const musicToggle = document.querySelector("#music-toggle");

function setMusicButton(isPlaying) {
  musicToggle.textContent = isPlaying ? "Pause music ♪" : "Play music ♫";
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
}

function playCurrentTrack() {
  const trackUrl = new URL(musicTracks[currentTrack], window.location.href).href;
  if (music.src !== trackUrl) music.src = trackUrl;
  return music.play();
}

music.addEventListener("ended", () => {
  currentTrack = (currentTrack + 1) % musicTracks.length;
  playCurrentTrack().catch(() => setMusicButton(false));
});

music.addEventListener("play", () => setMusicButton(true));
music.addEventListener("pause", () => setMusicButton(false));

musicToggle.addEventListener("click", () => {
  if (!music.paused) {
    music.pause();
    return;
  }

  playCurrentTrack().catch(() => {
    musicToggle.textContent = "Can't play music";
    musicToggle.setAttribute("aria-pressed", "false");
  });
});

function createSnowfall() {
  const snowfall = document.querySelector("#snowfall");
  if (!snowfall) return;
  if (motionPreference.matches) {
    snowfall.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();
  const flakeCount = Math.min(64, Math.max(32, Math.round(window.innerWidth / 20)));

  for (let index = 0; index < flakeCount; index += 1) {
    const flake = makeElement("span", "snowflake");
    flake.setAttribute("aria-hidden", "true");
    flake.style.setProperty("--left", `${Math.random() * 100}%`);
    flake.style.setProperty("--size", `${2 + Math.random() * 3}px`);
    flake.style.setProperty("--drift", `${-45 + Math.random() * 90}px`);
    flake.style.setProperty("--duration", `${9 + Math.random() * 13}s`);
    flake.style.setProperty("--delay", `${-Math.random() * 22}s`);
    flake.style.setProperty("--opacity", `${0.28 + Math.random() * 0.52}`);
    fragment.append(flake);
  }

  snowfall.replaceChildren(fragment);
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value, window.location.href);

    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function createGift(gift, index, total, currency) {
  if (
    !gift ||
    typeof gift.name !== "string" ||
    typeof gift.price !== "number" ||
    !Number.isFinite(gift.price) ||
    gift.price < 0 ||
    !safeUrl(gift.url)
  ) {
    throw new Error(`Gift ${index + 1} has an invalid name, price, or link.`);
  }

  const section = makeElement("div", "gift-section");
  const card = makeElement("article", "gift-card");
  const headingId = `gift-heading-${index}`;

  section.style.zIndex = String(index + 1);
  card.setAttribute("aria-labelledby", headingId);

  const imageArea = makeElement("div", "product-image");
  const imageUrl = safeUrl(gift.image);

  function showImageError() {
    imageArea.replaceChildren(
      makeElement("p", "image-error", "Product photo unavailable"),
    );
  }

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = gift.name;
    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";
    image.addEventListener("error", showImageError);
    imageArea.append(image);
  } else {
    showImageError();
  }

  const top = makeElement("div", "card-top");

  top.append(
    makeElement("span", "category", gift.category || "Wishlist"),
    makeElement(
      "span",
      "number",
      `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    ),
  );

  const bottom = makeElement("div", "card-bottom");
  const heading = makeElement("h2", "", gift.name);
  heading.id = headingId;

  const options = [];

  if (gift.size) options.push(`Size ${gift.size}`);
  if (gift.color) options.push(gift.color);

  const details = options.length
    ? options.join(" · ")
    : gift.description || "A little something on my list.";

  const purchaseRow = makeElement("div", "purchase-row");

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(gift.price);

  const link = makeElement("a", "buy-button");
  link.href = safeUrl(gift.url);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute(
    "aria-label",
    `Shop ${gift.name} at ${gift.store || "the store"} (opens in a new tab)`,
  );

  link.append(
    makeElement("span", "", "Shop this gift"),
    makeElement("span", "", "↗"),
  );

  purchaseRow.append(makeElement("span", "price", price), link);

  bottom.append(
    makeElement("p", "store", gift.store || "Wishlist"),
    heading,
    makeElement("p", "details", details),
    purchaseRow,
  );

  card.append(imageArea, top, bottom);
  section.append(card);

  return { section, card };
}

function animateCards() {
  framePending = false;

  cards.forEach(({ section, card }) => {
    if (motionPreference.matches) {
      card.style.transform = "";
      card.style.filter = "";
      card.style.opacity = "";
      return;
    }

    const top = window.innerWidth <= 600 ? 14 : 24;
    const distance = top - section.getBoundingClientRect().top;
    const progress = Math.max(
      0,
      Math.min(1, distance / (window.innerHeight * 0.85)),
    );
    const easedProgress = progress * progress * (3 - 2 * progress);

    card.style.transform = `translate3d(0, ${-easedProgress * 12}px, 0) scale(${1 - easedProgress * 0.055})`;

    card.style.filter = `brightness(${1 - easedProgress * 0.9})`;
    card.style.opacity = String(1 - easedProgress * 0.88);
  });
}

function requestAnimation() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(animateCards);
}

window.addEventListener("scroll", requestAnimation, { passive: true });
window.addEventListener("resize", requestAnimation);
motionPreference.addEventListener("change", requestAnimation);
motionPreference.addEventListener("change", createSnowfall);

function updateCountdown() {
  const now = new Date();
  const year = now.getFullYear();
  const today = Date.UTC(year, now.getMonth(), now.getDate());

  let christmas = Date.UTC(year, 11, 25);

  if (today > christmas) {
    christmas = Date.UTC(year + 1, 11, 25);
  }

  const days = Math.round((christmas - today) / 86400000);

  document.querySelector("#countdown").textContent =
    days === 0
      ? "Merry Christmas."
      : `${days} ${days === 1 ? "day" : "days"} until Christmas`;
}

document.querySelector("#share").addEventListener("click", async () => {
  const button = document.querySelector("#share");

  const shareData = {
    title: document.title,
    text: "Take a look at Alex's Christmas List.",
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareData.url);
      button.textContent = "Link copied";
      window.setTimeout(() => {
        button.textContent = "Share ↗";
      }, 2000);
    } else {
      window.prompt("Copy your wishlist link:", shareData.url);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      window.prompt("Copy your wishlist link:", shareData.url);
    }
  }
});

async function init() {
  createSnowfall();
  updateCountdown();
  window.setInterval(updateCountdown, 60000);

  // Try autoplay; browsers that block sound leave the visible control ready.
  playCurrentTrack().catch(() => {
    setMusicButton(false);
  });

  try {
    const response = await fetch("./gifts.json");

    if (!response.ok) {
      throw new Error(`Could not load gifts.json (${response.status}).`);
    }

    const data = await response.json();

    if (!Array.isArray(data.gifts)) {
      throw new Error('gifts.json needs a "gifts" array.');
    }

    const currency = data.currency || "USD";

    cards = data.gifts.map((gift, index) =>
      createGift(gift, index, data.gifts.length, currency),
    );

    container.replaceChildren(...cards.map(({ section }) => section));

    if (typeof data.title === "string") {
      document.title = data.title;
    }

    status.textContent = cards.length ? "" : "Your next wish goes here.";
    requestAnimation();
  } catch (error) {
    status.textContent = `${error.message} Check your JSON and run the site with Live Server.`;
    console.error(error);
  }
}

init();
