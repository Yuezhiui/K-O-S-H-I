(() => {
  "use strict";

  const page = document.getElementById("portfolio-panel");
  const toggle = document.getElementById("portfolio-theme-toggle");
  if (!page || !toggle) return;

  function setTheme(theme) {
    const dark = theme === "dark";
    page.dataset.theme = dark ? "dark" : "light";
    document.body.dataset.theme = dark ? "dark" : "light";
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  toggle.addEventListener("click", () => {
    setTheme(page.dataset.theme === "dark" ? "light" : "dark");
  });

  const portrait = page.querySelector(".portfolio-intro__portrait");
  if (portrait) {
    portrait.addEventListener("click", () => {
      portrait.classList.toggle("is-flipped");
    });
  }

  page.querySelectorAll("[data-scroll-target]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.getElementById(link.dataset.scrollTarget);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start"
      });
    });
  });

  // Four fully separate 16-second stroke videos. The order matches the request:
  // 2.mp4 → 3.mp4 → 4.mp4 → 1.mp4 → repeat. Only one is visible at a time,
  // keeping the original single-window ornamental header composition intact.
  const headerVideos = [...page.querySelectorAll(".portfolio-intro__header-video")];
  if (headerVideos.length) {
    let currentIndex = -1;
    let isSwitching = false;
    let started = false;
    let failures = 0;

    const showNext = async (index) => {
      if (isSwitching) return;
      isSwitching = true;
      const nextIndex = index % headerVideos.length;
      const next = headerVideos[nextIndex];
      next.preload = "auto";
      next.muted = true;
      next.playsInline = true;

      try {
        next.currentTime = 0;
        await next.play();
        const previousIndex = currentIndex;
        next.classList.add("is-current");
        currentIndex = nextIndex;
        failures = 0;
        if (previousIndex >= 0 && previousIndex !== nextIndex) {
          const previous = headerVideos[previousIndex];
          previous.classList.remove("is-current");
          previous.pause();
        }
      } catch (error) {
        console.warn("Header stroke video could not start:", next.currentSrc, error);
        failures++;
        if (failures >= headerVideos.length) {
          // Preserve the header rather than retrying indefinitely.
          isSwitching = false;
          return;
        }
        isSwitching = false;
        showNext((nextIndex + 1) % headerVideos.length);
        return;
      }
      isSwitching = false;
    };

    headerVideos.forEach((video, index) => {
      video.addEventListener("ended", () => {
        if (index === currentIndex) {
          showNext((index + 1) % headerVideos.length);
        }
      });
      video.addEventListener("timeupdate", () => {
        if (index === currentIndex && video.currentTime > 11) {
          headerVideos[(index + 1) % headerVideos.length].preload = "auto";
        }
      });
      video.addEventListener("error", () => {
        if (index === currentIndex) {
          video.pause();
          showNext((index + 1) % headerVideos.length);
        }
      });
    });

    showNext(0);
  }

  // Project detail modal interaction (Image 5)
  const modal = document.getElementById("project-detail-modal");
  const modalTitle = document.getElementById("project-modal-title");
  const modalClose = document.getElementById("project-modal-close");
  const modalDescSection = document.getElementById("project-modal-desc-section");
  const modalDesc = document.getElementById("project-modal-desc");
  const projectCards = page.querySelectorAll(".portfolio-projects__card");

  const projectData = {
    "ophelia": {
      title: "OPHELIA AUTOMATION",
      desc: "Ophelia is an intelligent system and workflow automation platform and native desktop workspace designed to streamline complex computer operations, browser workflows, and cross-application tasks on an infinite canvas with local AI tool integrations."
    },
    "aphanes-windows": {
      title: "APHANES WINDOWS",
      desc: "A lightweight native Windows MAC address manager and connection identity rotator built with WinUI 3 and .NET 8, featuring direct Windows registry-level network adapter management, secure randomization, and adapter recovery safeguards."
    },
    "aphanes-mobile": {
      title: "APHANES MOBILE",
      desc: "A lightweight native mobile MAC address manager and connection identity rotator built with Kotlin Multiplatform (KMP), featuring network identity rotation, secure randomization safeguards, and native mobile network adapter management."
    },
    "retro-photo-card": {
      title: "RETRO PHOTO CARD",
      desc: "A privacy-friendly, browser-local photo editor for turning everyday images into retro memory cards, film-inspired prints, postcards, and contact sheets with analog-inspired visual controls that keep photos securely on your device."
    },
    "techne": {
      title: "TECHNE",
      desc: "An AI-powered 2D sprite generator that transforms concept art and drawings into game-ready sprite sheets, texture atlases, and transparent motion loops for interactive game development."
    },
    "kilos-grammar": {
      title: "KILOS GRAMMAR",
      desc: ""
    }
  };

  function openProjectModal(projectId) {
    if (!modal) return;
    const project = projectData[projectId] || { title: "PROJECT DETAILS", desc: "" };
    if (modalTitle) modalTitle.textContent = project.title;

    if (modalDescSection && modalDesc) {
      if (project.desc && project.desc.trim().length > 0) {
        modalDesc.textContent = project.desc;
        modalDescSection.hidden = false;
      } else {
        modalDesc.textContent = "";
        modalDescSection.hidden = true;
      }
    }

    modal.hidden = false;
    page.style.overflow = "hidden";
    modalClose?.focus();
  }

  function closeProjectModal() {
    if (!modal) return;
    modal.hidden = true;
    page.style.overflow = "";
  }

  projectCards.forEach((card) => {
    const trigger = card.querySelector(".portfolio-projects__trigger");
    if (trigger) {
      trigger.addEventListener("click", () => {
        openProjectModal(card.dataset.projectId);
      });
    }
  });

  modalClose?.addEventListener("click", closeProjectModal);

  modal?.addEventListener("click", (e) => {
    if (e.target.classList.contains("project-modal__backdrop")) {
      closeProjectModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) {
      closeProjectModal();
    }
  });

  // ---------------------------------------------------------------------------
  // Background Music Controller
  // ---------------------------------------------------------------------------
  const bgm = document.getElementById("portfolio-bgm");
  const soundToggle = document.getElementById("portfolio-sound-toggle");

  if (bgm && soundToggle) {
    let soundEnabled = true;

    const updateSoundButton = (enabled) => {
      soundToggle.textContent = enabled ? "SOUND ON <//>" : "SOUND OFF <//>";
      soundToggle.setAttribute("aria-label", enabled ? "Turn sound off" : "Turn sound on");
      soundToggle.setAttribute("aria-pressed", String(enabled));
    };

    const tryPlay = () => {
      if (!soundEnabled) return;
      bgm.play().then(() => {
        updateSoundButton(true);
      }).catch(() => {
        // Autoplay may be deferred until user interaction by browser policy
      });
    };

    bgm.loop = true;
    bgm.volume = 0.8;
    tryPlay();

    // Browser autoplay policy fallback: unlock on first user gesture anywhere
    const unlockOnGesture = (e) => {
      if (e && (e.target === soundToggle || soundToggle.contains(e.target))) {
        return; // Handled directly by the button click
      }
      if (soundEnabled && bgm.paused) {
        bgm.play().then(() => {
          updateSoundButton(true);
        }).catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlockOnGesture, { once: true, capture: true });
    window.addEventListener("keydown", unlockOnGesture, { once: true, capture: true });

    // Explicit user click on the SOUND toggle button
    soundToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        bgm.play().then(() => {
          updateSoundButton(true);
        }).catch(() => {});
      } else {
        bgm.pause();
        updateSoundButton(false);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Rotating Role Text (Software Engineer. -> AI/ML Engineer. -> Game Developer.)
  // ---------------------------------------------------------------------------
  const roleRotator = document.getElementById("portfolio-rotating-role");
  if (roleRotator) {
    const roles = [
      "Software Engineer.",
      "AI/ML Engineer.",
      "Game Developer."
    ];
    let roleIndex = 0;
    const intervalMs = 3000;

    function renderCharacters(text) {
      const line = document.createElement("span");
      line.className = "rotating-role__line";
      const chars = Array.from(text);
      chars.forEach((char, i) => {
        const span = document.createElement("span");
        span.className = "rotating-role__character";
        span.style.setProperty("--char-i", i);
        span.textContent = char === " " ? "\u00A0" : char;
        line.appendChild(span);
      });
      return line;
    }

    // Initial render
    roleRotator.innerHTML = "";
    roleRotator.appendChild(renderCharacters(roles[0]));

    setInterval(() => {
      const currentLine = roleRotator.querySelector(".rotating-role__line");
      if (currentLine) {
        const chars = currentLine.querySelectorAll(".rotating-role__character");
        chars.forEach((ch) => {
          ch.classList.add("is-exiting");
        });
      }

      setTimeout(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        roleRotator.innerHTML = "";
        roleRotator.appendChild(renderCharacters(roles[roleIndex]));
      }, 460);
    }, intervalMs);
  }

  // ---------------------------------------------------------------------------
  // Custom User Cursor with Spring Physics & Velocity Tilt (from William T)
  // ---------------------------------------------------------------------------
  const cursorRoot = document.getElementById("user-cursor");
  const arrowEl = cursorRoot?.querySelector(".user-cursor__arrow");
  const labelEl = cursorRoot?.querySelector(".user-cursor__label");

  if (cursorRoot && arrowEl && labelEl) {
    const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (isFinePointer.matches) {
      class Spring {
        constructor(stiffness, damping, mass, initialValue = 0) {
          this.stiffness = stiffness;
          this.damping = damping;
          this.mass = mass;
          this.value = initialValue;
          this.target = initialValue;
          this.velocity = 0;
        }

        jump(val) {
          this.value = val;
          this.target = val;
          this.velocity = 0;
        }

        set(target) {
          this.target = target;
        }

        update(dt) {
          const clampedDt = Math.min(dt, 0.05);
          const step = 0.002;
          let remaining = clampedDt;
          while (remaining > 0) {
            const h = Math.min(remaining, step);
            const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
            const accel = force / this.mass;
            this.velocity += accel * h;
            this.value += this.velocity * h;
            remaining -= h;
          }
          return this.value;
        }
      }

      // Exact physics parameters matching William T UserCursor.jsx:
      // arrow: stiffness 380, damping 32, mass 0.6
      // label: stiffness 220, damping 26, mass 0.7
      // scale: stiffness 500, damping 28, mass 0.5
      // tilt:  stiffness 200, damping 24, mass 0.6
      const arrowX = new Spring(380, 32, 0.6, -9999);
      const arrowY = new Spring(380, 32, 0.6, -9999);
      const labelX = new Spring(220, 26, 0.7, -9999);
      const labelY = new Spring(220, 26, 0.7, -9999);
      const scaleSpring = new Spring(500, 28, 0.5, 1);
      const tiltSpring = new Spring(200, 24, 0.6, 0);

      const size = 31;
      const MAX_TILT_SPEED = 1500;
      const labelTiltStrength = 25;
      const pressScale = 0.92;

      let hasPosition = false;
      let isVisible = false;
      let lastSample = null;
      let lastTime = performance.now();

      const onMouseMove = (e) => {
        const x = e.clientX;
        const y = e.clientY;
        const now = performance.now();

        if (!hasPosition) {
          arrowX.jump(x);
          arrowY.jump(y);
          labelX.jump(x);
          labelY.jump(y);
          hasPosition = true;
          isVisible = true;
          document.documentElement.classList.add("custom-cursor");
          cursorRoot.style.opacity = "1";
        } else {
          arrowX.set(x);
          arrowY.set(y);
          labelX.set(x);
          labelY.set(y);
        }

        if (lastSample) {
          const elapsed = Math.max(1, now - lastSample.t);
          const vx = ((x - lastSample.x) / elapsed) * 1000;
          const vy = ((y - lastSample.y) / elapsed) * 1000;
          const speed = Math.hypot(vx, vy);
          const intensity = Math.min(1, speed / MAX_TILT_SPEED);
          const direction = Math.sign(vx);
          tiltSpring.set(direction * intensity * labelTiltStrength);
        }
        lastSample = { x, y, t: now };

        if (!isVisible) {
          isVisible = true;
          cursorRoot.style.opacity = "1";
        }
      };

      const onMouseDown = () => scaleSpring.set(pressScale);
      const onMouseUp = () => scaleSpring.set(1);

      const onLeave = () => {
        isVisible = false;
        hasPosition = false;
        lastSample = null;
        tiltSpring.jump(0);
        cursorRoot.style.opacity = "0";
        document.documentElement.classList.remove("custom-cursor");
      };

      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("blur", onLeave);
      document.addEventListener("mouseleave", onLeave);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) onLeave();
      });

      function renderLoop(now) {
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        if (hasPosition) {
          if (lastSample && now - lastSample.t > 60) {
            tiltSpring.set(0);
          }

          const ax = arrowX.update(dt);
          const ay = arrowY.update(dt);
          const lx = labelX.update(dt);
          const ly = labelY.update(dt);
          const s = scaleSpring.update(dt);
          const t = tiltSpring.update(dt);

          // Arrow tip hotspot at (5.5px, 3.3px)
          arrowEl.style.transform = `translate3d(${ax - 5.5}px, ${ay - 3.3}px, 0) scale(${s})`;

          // Label offset (+ size * 0.9, + size * 0.2 + 6)
          const lOffsetX = lx + size * 0.9;
          const lOffsetY = ly + size * 0.2 + 6;
          labelEl.style.transform = `translate3d(${lOffsetX}px, ${lOffsetY}px, 0) rotate(${t}deg) scale(${s})`;
        }

        requestAnimationFrame(renderLoop);
      }
      requestAnimationFrame(renderLoop);
    }
  }

  // Set initial theme
  setTheme("light");
})();

