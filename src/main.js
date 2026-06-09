const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function animateCounters() {
  const counters = document.querySelectorAll("[data-count]");
  counters.forEach((counter) => {
    const target = Number(counter.dataset.count);
    if (prefersReducedMotion) {
      counter.textContent = target;
      return;
    }
    let start = null;
    const duration = 900;
    const step = (timestamp) => {
      start ??= timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientWidth * (canvas.height / canvas.width);
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, width, height };
}

function drawAxes(ctx, x, y, width, height) {
  ctx.strokeStyle = "#d7dee8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x + width, y + height);
  ctx.stroke();
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function barChart(canvasId, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  const pad = { top: 28, right: 18, bottom: 66, left: 48 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const max = options.max ?? Math.max(...data.map((d) => d.value)) * 1.15;

  ctx.clearRect(0, 0, width, height);
  drawAxes(ctx, pad.left, pad.top, chartW, chartH);

  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i += 1) {
    const value = Math.round((max / 4) * i);
    const y = pad.top + chartH - (value / max) * chartH;
    ctx.fillText(value, pad.left - 10, y + 4);
    if (i > 0) {
      ctx.strokeStyle = "#edf2f7";
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
    }
  }

  const gap = 16;
  const barW = (chartW - gap * (data.length - 1)) / data.length;
  data.forEach((d, i) => {
    const x = pad.left + i * (barW + gap);
    const barH = (d.value / max) * chartH;
    const y = pad.top + chartH - barH;
    const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
    gradient.addColorStop(0, d.color || "#0891b2");
    gradient.addColorStop(1, "#0f766e");
    ctx.fillStyle = gradient;
    roundedRect(ctx, x, y, barW, barH, 8);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${d.value}${options.percent ? "%" : ""}`, x + barW / 2, y - 8);
    ctx.fillStyle = "#475569";
    ctx.font = "12px Inter, system-ui, sans-serif";
    wrapLabel(ctx, d.label, x + barW / 2, pad.top + chartH + 22, Math.max(58, barW + 8));
  });
}

function horizontalBarChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const { ctx, width, height } = setupCanvas(canvas);
  const pad = { top: 24, right: 64, bottom: 26, left: 132 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value)) * 1.12;
  const rowH = chartH / data.length;

  ctx.clearRect(0, 0, width, height);
  data.forEach((d, i) => {
    const y = pad.top + i * rowH + rowH * 0.2;
    const barH = rowH * 0.48;
    const barW = (d.value / max) * chartW;
    ctx.fillStyle = "#334155";
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(d.label, pad.left - 14, y + barH / 2 + 5);

    ctx.fillStyle = "#e8eef5";
    roundedRect(ctx, pad.left, y, chartW, barH, 8);
    ctx.fill();
    ctx.fillStyle = d.color;
    roundedRect(ctx, pad.left, y, barW, barH, 8);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.textAlign = "left";
    ctx.font = "800 13px Inter, system-ui, sans-serif";
    ctx.fillText(`${d.value}%`, pad.left + barW + 10, y + barH / 2 + 5);
  });
}

function wrapLabel(ctx, text, x, y, maxWidth) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  words.forEach((word, index) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += 15;
    } else {
      line = test;
    }
    if (index === words.length - 1) ctx.fillText(line, x, lineY);
  });
}

function drawCharts() {
  barChart(
    "sleepChart",
    [
      { label: "11-12 p.m.", value: 5, color: "#e85d4f" },
      { label: "1-2 a.m.", value: 39, color: "#0891b2" },
    ],
    { max: 44 },
  );
  barChart(
    "deviceChart",
    [
      { label: "1-2 hours", value: 86, color: "#0f766e" },
      { label: "3-4 hours", value: 9, color: "#d97706" },
      { label: "5+ hours", value: 5, color: "#6054a8" },
    ],
    { max: 100, percent: true },
  );
  horizontalBarChart("stressChart", [
    { label: "Self-expectation", value: 59, color: "#0f766e" },
    { label: "Exam pressure", value: 34, color: "#0891b2" },
    { label: "Social pressure", value: 5, color: "#d97706" },
    { label: "Other sources", value: 2, color: "#e85d4f" },
  ]);
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawCharts, 160);
});

animateCounters();
drawCharts();
