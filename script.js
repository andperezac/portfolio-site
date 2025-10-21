(function () {
  const container = document.getElementById("consistency-progress");
  if (!container) return;

  const startISO = container.dataset.start;
  const endISO = container.dataset.end;
  if (!startISO || !endISO)
    return console.warn("Progress: start/end dates missing.");

  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T23:59:59");

  const now = new Date();
  const total = Math.max(end - start, 1);
  const done = Math.min(Math.max(now - start, 0), total);
  const pct = Math.round((done / total) * 100);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.max(0, Math.ceil((end - now) / msPerDay));

  const bar = container.querySelector(".bar");
  const thumb = container.querySelector(".thumb");

  bar.style.setProperty("--pct", `${pct}%`);
  thumb.style.left = `calc(${pct}% - 11px)`;

  const pctLabel = container.querySelector(".pct-label");
  pctLabel.textContent = `${pct}%`;
  const daysLabel = container.querySelector(".days-label");
  daysLabel.textContent = `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`;
})();
