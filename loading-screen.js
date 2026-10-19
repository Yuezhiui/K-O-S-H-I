(() => {
  "use strict";

  const TOTAL_SECONDS = 16;
  const TRANSITION_DELAY_MS = 120;

  const body = document.body;
  const loader = document.getElementById("portfolio-loader");
  const video = document.getElementById("portfolio-loader-video");
  const nextPanel = document.getElementById("portfolio-panel");

  if (!loader || !video || !nextPanel) return;

  // Temporary portfolio editing mode. The intro files and timing remain intact.
  // Change data-skip-loader to "false" in loading-screen.html to re-enable.
  if (document.documentElement.dataset.skipLoader === "true") {
    video.pause();
    body.classList.remove("is-loading");
    body.classList.add("is-complete");
    loader.setAttribute("aria-hidden", "true");
    nextPanel.setAttribute("aria-hidden", "false");
    nextPanel.inert = false;
    return;
  }

  let raf = 0;
  let fallbackTimer = 0;
  let finished = false;
  let startedAt = 0;

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function setProgress(progress) {
    loader.style.setProperty("--progress", `${(clamp(progress) * 100).toFixed(3)}%`);
  }

  function finish() {
    if (finished) return;
    finished = true;

    cancelAnimationFrame(raf);
    clearTimeout(fallbackTimer);
    setProgress(1);

    window.setTimeout(() => {
      body.classList.remove("is-loading");
      body.classList.add("is-complete");
      loader.setAttribute("aria-hidden", "true");
      nextPanel.setAttribute("aria-hidden", "false");
      nextPanel.inert = false;
    }, TRANSITION_DELAY_MS);
  }

  function updateProgress(now) {
    if (finished) return;

    if (!startedAt) startedAt = now;

    // Prefer actual media time so the bar and the 16-second video stay locked.
    // elapsed is only used as a fallback if the browser cannot report currentTime.
    const elapsed = (now - startedAt) / 1000;
    const hasMovingVideo = Number.isFinite(video.currentTime) && (!video.paused || video.currentTime > 0.05);
    const mediaTime = hasMovingVideo ? video.currentTime : elapsed;
    const progress = clamp(mediaTime / TOTAL_SECONDS);
    setProgress(progress);

    if (mediaTime >= TOTAL_SECONDS - 0.02 || video.ended) {
      finish();
      return;
    }

    raf = requestAnimationFrame(updateProgress);
  }

  async function start() {
    setProgress(0);
    body.classList.add("is-loading");
    body.classList.remove("is-complete");
    nextPanel.setAttribute("aria-hidden", "true");
    nextPanel.inert = true;
    loader.setAttribute("aria-hidden", "false");

    video.preload = "auto";
    video.currentTime = 0;
    video.muted = true;

    try {
      await video.play();
    } catch (error) {
      // Muted autoplay normally succeeds. If it does not, the 16-second timer
      // still advances the screen so the visitor is never trapped here.
      console.warn("Autoplay was blocked; using the 16-second fallback timer.", error);
    }

    startedAt = performance.now();
    raf = requestAnimationFrame(updateProgress);

    fallbackTimer = window.setTimeout(finish, TOTAL_SECONDS * 1000 + 250);
  }

  video.addEventListener("ended", finish, { once: true });
  video.addEventListener("error", () => {
    // Keep the exact 16-second cooldown even if the MP4 cannot be loaded.
    if (!startedAt) startedAt = performance.now();
    if (!raf) raf = requestAnimationFrame(updateProgress);
  });

  start();
})();
