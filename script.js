/* ============================================================
   Nav: highlight current page
   ============================================================ */
document.querySelectorAll(".site-nav a").forEach((link) => {
  if (link.getAttribute("href") === location.pathname.split("/").pop()) {
    link.classList.add("current");
  }
});

/* ============================================================
   Hero pendulum — drag the bob, release, watch it swing.
   Small-angle period readout updates live: T = 2*pi*sqrt(L/g)
   ============================================================ */
function initPendulumDemo(canvasId, readoutId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const readout = document.getElementById(readoutId);

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 260;
  }
  resize();
  window.addEventListener("resize", resize);

  const g = 9.81;
  const pivot = () => ({ x: canvas.width / 2, y: 28 });
  let length = 170;         // pixels
  let angle = 0.5;          // radians from vertical
  let angleVel = 0;
  let dragging = false;
  const damping = 0.999;

  function periodEstimate() {
    const Lm = length / 170; // treat 170px as ~1m for a readable demo
    return 2 * Math.PI * Math.sqrt(Lm / g);
  }

  function bobPosition() {
    const p = pivot();
    return {
      x: p.x + length * Math.sin(angle),
      y: p.y + length * Math.cos(angle),
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const p = pivot();
    const b = bobPosition();

    // faint arc guide
    ctx.beginPath();
    ctx.strokeStyle = "#d4dbd6";
    ctx.setLineDash([2, 5]);
    ctx.arc(p.x, p.y, length, Math.PI / 2 - 1.1, Math.PI / 2 + 1.1);
    ctx.stroke();
    ctx.setLineDash([]);

    // string
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = "#17253d";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // pivot
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#17253d";
    ctx.fill();

    // bob
    ctx.beginPath();
    ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = dragging ? "#2e6e6e" : "#b8843d";
    ctx.fill();

    if (readout) {
      readout.textContent = `T \u2248 ${periodEstimate().toFixed(2)} s   \u03b8\u2080 = ${Math.abs(
        (angle * 180) / Math.PI
      ).toFixed(0)}\u00b0`;
    }
  }

  function step() {
    if (!dragging) {
      const accel = (-g / (length / 170)) * Math.sin(angle) * 0.0025;
      angleVel += accel;
      angleVel *= damping;
      angle += angleVel;
    }
    draw();
    requestAnimationFrame(step);
  }

  function angleFromPointer(x, y) {
    const p = pivot();
    return Math.atan2(x - p.x, y - p.y);
  }

  function pointerDown(e) {
    dragging = true;
    angleVel = 0;
    pointerMove(e);
  }
  function pointerMove(e) {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    let a = angleFromPointer(x, y);
    const max = 1.3;
    angle = Math.max(-max, Math.min(max, a));
  }
  function pointerUp() {
    dragging = false;
  }

  canvas.addEventListener("mousedown", pointerDown);
  window.addEventListener("mousemove", pointerMove);
  window.addEventListener("mouseup", pointerUp);
  canvas.addEventListener("touchstart", pointerDown, { passive: true });
  window.addEventListener("touchmove", pointerMove, { passive: true });
  window.addEventListener("touchend", pointerUp);

  step();
}

/* ============================================================
   Lab page: length -> period predictor
   T = 2*pi*sqrt(L/g), compared against the class data
   ============================================================ */
function initPredictor(inputId, outputId) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  if (!input || !output) return;

  function update() {
    const L = parseFloat(input.value);
    if (isNaN(L) || L <= 0) {
      output.textContent = "Enter a positive length.";
      return;
    }
    const T = 2 * Math.PI * Math.sqrt(L / 9.81);
    output.innerHTML = `Predicted period at <b>${L.toFixed(2)} m</b>: <b>${T.toFixed(
      3
    )} s</b>`;
  }
  input.addEventListener("input", update);
  update();
}

/* ============================================================
   Slow, eased scroll — gentler than the browser's built-in
   "smooth" behavior, which snaps to a fixed short duration.
   Tracks the target element live (rather than a one-time Y value)
   so it doesn't jump or judder while the accordion is still
   expanding underneath it, and forces scroll-behavior: auto for
   the duration so it isn't fighting the CSS "smooth" setting.
   ============================================================ */
function easeScrollToElement(el, offset = 18, duration = 1100) {
  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const getTargetY = () =>
    el.getBoundingClientRect().top + window.scrollY - offset;

  if (reduceMotion) {
    window.scrollTo({ top: getTargetY(), left: 0, behavior: "auto" });
    return;
  }

  const root = document.documentElement;
  const prevBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";

  const startY = window.scrollY;
  let startTime = null;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    const currentTarget = getTargetY(); // re-measured every frame
    const y = startY + (currentTarget - startY) * eased;
    window.scrollTo({ top: y, left: 0, behavior: "auto" });
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      root.style.scrollBehavior = prevBehavior;
    }
  }
  requestAnimationFrame(step);
}

/* ============================================================
   Toast notification popups (bottom-right)
   ============================================================ */
function showToastNote(message) {
  let host = document.querySelector(".toast-notifications");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-notifications";
    document.body.appendChild(host);
  }
  const note = document.createElement("div");
  note.className = "toast-note";
  note.innerHTML = message;
  host.appendChild(note);
  requestAnimationFrame(() => note.classList.add("show"));
  setTimeout(() => {
    note.classList.remove("show");
    setTimeout(() => note.remove(), 300);
  }, 3400);
}

/* ============================================================
   Build-a-toast lab game
   Each accordion section, opened for the first time, reveals
   the next topping layer on the toast image and fires a toast
   note. A reset button clears everything back to a bare slice.
   ============================================================ */
function initToastGame() {
  const items = document.querySelectorAll(".accordion-item");
  if (!items.length) return;
  const progressEl = document.getElementById("toastProgress");
  const resetBtn = document.getElementById("toastReset");
  const total = items.length;
  let completed = 0;

  const states = Array.from(items).map((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");
    return {
      item,
      trigger,
      panel,
      layer: document.getElementById(trigger.dataset.layer),
      noteText: trigger.dataset.note,
      unlocked: false,
    };
  });

  function updateProgress() {
    if (progressEl) {
      progressEl.innerHTML = `<b>${completed}/${total}</b> on your order`;
    }
  }

  function closeAllPanels() {
    states.forEach((s) => {
      s.panel.classList.remove("open");
      s.trigger.setAttribute("aria-expanded", "false");
    });
  }

  function resetToast() {
    completed = 0;
    closeAllPanels();
    states.forEach((s) => {
      s.unlocked = false;
      s.trigger.classList.remove("done");
      if (s.layer) s.layer.classList.remove("show");
    });
    updateProgress();
  }

  states.forEach((state) => {
    const { trigger, panel, layer, noteText } = state;

    trigger.addEventListener("click", () => {
      const isOpen = panel.classList.contains("open");

      // close all others (accordion behavior)
      states.forEach((other) => {
        if (other !== state) {
          other.panel.classList.remove("open");
          other.trigger.setAttribute("aria-expanded", "false");
        }
      });

      panel.classList.toggle("open", !isOpen);
      trigger.setAttribute("aria-expanded", String(!isOpen));

      if (!isOpen) {
        // give the panel a beat to start expanding, then ease the page
        // down slowly so the newly revealed section settles at the top
        setTimeout(() => {
          easeScrollToElement(trigger, 18, 1100);
        }, 120);
      }

      if (!state.unlocked) {
        state.unlocked = true;
        trigger.classList.add("done");
        completed++;
        if (layer) layer.classList.add("show");
        showToastNote(noteText);
        updateProgress();
        if (completed === total) {
          setTimeout(() => showToastNote("<b>Order complete</b><br>Every course served \u2014 enjoy."), 400);
        }
      }
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetToast();
      showToastNote("<b>Ticket cleared</b><br>Ready to start a fresh order.");
    });
  }
}

/* ============================================================
   Lab page: data chart with a theoretical-curve toggle
   ============================================================ */
function initLabChart(canvasId, toggleId, lengths, periods, uncertainty) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;

  const theoretical = lengths.map((L) => 2 * Math.PI * Math.sqrt(L / 9.81));

  const chart = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Measured",
          data: lengths.map((L, i) => ({ x: L, y: periods[i] })),
          backgroundColor: "#b8843d",
          pointRadius: 5,
        },
        {
          label: "Theoretical  T = 2\u03c0\u221a(L/g)",
          data: lengths.map((L, i) => ({ x: L, y: theoretical[i] })),
          borderColor: "#2e6e6e",
          backgroundColor: "transparent",
          showLine: true,
          pointRadius: 0,
          borderWidth: 1.5,
          hidden: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Length (m)" } },
        y: { title: { display: true, text: "Period (s)" } },
      },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)} s at ${ctx.parsed.x} m`,
          },
        },
      },
    },
  });

  const toggle = document.getElementById(toggleId);
  if (toggle) {
    toggle.addEventListener("change", () => {
      chart.data.datasets[1].hidden = !toggle.checked;
      chart.update();
    });
  }
}
