/* ============================================================
   Nav: highlight current page
   ============================================================ */
document.querySelectorAll(".site-nav a").forEach((link) => {
  if (link.getAttribute("href") === location.pathname.split("/").pop()) {
    link.style.borderBottomColor = "var(--accent)";
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
   the next topping layer on the toast SVG and fires a toast note.
   ============================================================ */
function initToastGame() {
  const items = document.querySelectorAll(".accordion-item");
  if (!items.length) return;
  const progressEl = document.getElementById("toastProgress");
  let completed = 0;
  const total = items.length;

  items.forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");
    const layerId = trigger.dataset.layer;
    const noteText = trigger.dataset.note;
    let unlocked = false;

    trigger.addEventListener("click", () => {
      const isOpen = panel.classList.contains("open");

      // close all others (accordion behavior)
      items.forEach((other) => {
        if (other !== item) {
          other.querySelector(".accordion-panel").classList.remove("open");
          other.querySelector(".accordion-trigger").setAttribute("aria-expanded", "false");
        }
      });

      panel.classList.toggle("open", !isOpen);
      trigger.setAttribute("aria-expanded", String(!isOpen));

      if (!unlocked) {
        unlocked = true;
        trigger.classList.add("done");
        completed++;
        const layer = document.getElementById(layerId);
        if (layer) layer.classList.add("show");
        showToastNote(noteText);
        if (progressEl) {
          progressEl.innerHTML = `<b>${completed}/${total}</b> toppings added`;
        }
        if (completed === total) {
          setTimeout(() => showToastNote("\ud83c\udf5e Your toast is complete!"), 400);
        }
      }
    });
  });
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
