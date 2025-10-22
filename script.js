(function () {
  // Footer year
  document.getElementById("year")?.append(new Date().getFullYear());

  // Respect reduced motion
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------- Progress Widget ---------------- */
  (function progressWidget() {
    const container = document.getElementById("consistency-progress");
    if (!container) return;

    const startISO = container.dataset.start;
    const endISO = container.dataset.end;
    if (!startISO || !endISO) {
      console.warn("Progress: start/end dates missing.");
      return;
    }

    // Date math
    const start = new Date(startISO + "T00:00:00");
    const end = new Date(endISO + "T23:59:59");
    const now = new Date();

    const total = Math.max(end - start, 1);
    const elapsed = Math.min(Math.max(now - start, 0), total);
    const pctFloat = elapsed / total; // 0..1
    const pctTarget = Math.round(pctFloat * 100); // 0..100
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysTarget = Math.max(0, Math.ceil((end - now) / msPerDay));

    // DOM
    const bar = container.querySelector(".bar");
    const thumb = container.querySelector(".thumb");
    const pctEl = container.querySelector(".pct");
    const daysEl = container.querySelector(".timer");
    if (!bar) return;

    // Easing helpers
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // Animate bar via --pct (GPU-friendly)
    const currentPctVar =
      parseFloat(getComputedStyle(bar).getPropertyValue("--pct")) || 0;
    const from = currentPctVar / 100;
    const to = pctFloat;

    if (prefersReduced) {
      bar.style.setProperty("--pct", `${pctTarget}%`);
      if (thumb) thumb.style.left = `calc(max(${pctTarget}%, 3%) - 12px)`;
    } else {
      const startTS = performance.now();
      const dur = 600;
      const step = (ts) => {
        const p = Math.min(1, (ts - startTS) / dur);
        const v = from + (to - from) * easeOutCubic(p);
        const pct = +(v * 100).toFixed(3);
        bar.style.setProperty("--pct", `${pct}%`);
        if (thumb) thumb.style.left = `calc(max(${pct}%, 3%) - 12px)`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    // Pulse retrigger
    if (thumb) {
      thumb.classList.remove("pulse");
      void thumb.offsetWidth;
      thumb.classList.add("pulse");
    }

    // Numbers
    const animateNumber = (el, to, dur = 800) => {
      if (!el) return;
      const from = parseInt(el.textContent?.replace(/\D/g, "") || "0", 10);
      if (prefersReduced || from === to) {
        el.textContent = String(to);
        return;
      }
      const startTS = performance.now();
      const step = (ts) => {
        const p = Math.min(1, (ts - startTS) / dur);
        const val = Math.round(from + (to - from) * easeOutCubic(p));
        el.textContent = String(val);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    animateNumber(pctEl, pctTarget, 700);
    if (daysEl) {
      animateNumber(daysEl, daysTarget, 800);
      setTimeout(
        () => {
          daysEl.textContent = `${daysTarget} day${daysTarget !== 1 ? "s" : ""} remaining`;
        },
        prefersReduced ? 0 : 820
      );
    }

    // ARIA
    container.setAttribute("role", "progressbar");
    container.setAttribute("aria-valuemin", "0");
    container.setAttribute("aria-valuemax", "100");
    container.setAttribute("aria-valuenow", String(pctTarget));
    container.setAttribute(
      "aria-label",
      `Project progress ${pctTarget}% — ${daysTarget} day${daysTarget !== 1 ? "s" : ""} remaining`
    );

    // Keep days honest: refresh after midnight
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    setTimeout(() => location.reload(), msUntilMidnight + 1000);
  })();

  /* ---------------- Reveal-on-scroll ---------------- */
  (function revealOnScroll() {
    if (prefersReduced) {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "-10% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  })();

  /* ---------------- Header compaction ---------------- */
  (function compactHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;
    let last = 0;
    addEventListener(
      "scroll",
      () => {
        const y = scrollY;
        header.classList.toggle("compact", y > 80 && y > last);
        last = y;
      },
      { passive: true }
    );
  })();

  /* ---------------- Scroll progress bar ---------------- */
  (function scrollProgressBar() {
    if (prefersReduced) return;
    const bar = document.createElement("div");
    bar.id = "scroll-progress";
    document.body.appendChild(bar);
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  })();
})();
