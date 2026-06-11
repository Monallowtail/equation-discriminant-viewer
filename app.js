const app = {

  level: 1,

  normalized: false,

  showDiscriminant: false,

  showStrata: false,

  spatialDrag: false,

  coeffs: { a: 0.8, b: -1.1, c: 0.45, d: -0.6 },

  rotation: { yaw: -0.72, pitch: 0.62 },

  dragging: false,

  dragTarget: null,

  lastPointer: null,

  trapKind: null,

};



const els = {

  select: document.getElementById("level-select"),

  viewer: document.getElementById("viewer"),

  back: document.getElementById("back-button"),

  levelLabel: document.getElementById("level-label"),

  title: document.getElementById("title"),

  coeffTitle: document.getElementById("coeff-title"),

  coeffReadout: document.getElementById("coeff-readout"),

  rootSummary: document.getElementById("root-summary"),

  solutionBadge: document.getElementById("solution-badge"),

  normalizeToggle: document.getElementById("normalize-toggle"),

  normalizeLabel: document.getElementById("normalize-label"),

  discriminantToggle: document.getElementById("discriminant-toggle"),

  strataToggle: document.getElementById("strata-toggle"),

  strataToggleLabel: document.getElementById("strata-toggle-label"),

  spatialDragToggle: document.getElementById("spatial-drag-toggle"),

  spatialDragToggleLabel: document.getElementById("spatial-drag-toggle-label"),

  sliderPanel: document.getElementById("a-slider-panel"),

  bSliderPanel: document.getElementById("b-slider-panel"),

  aSlider: document.getElementById("a-slider"),

  aSliderValue: document.getElementById("a-slider-value"),

  bSlider: document.getElementById("b-slider"),

  bSliderValue: document.getElementById("b-slider-value"),

  inputs: {

    a: document.getElementById("input-a"),

    b: document.getElementById("input-b"),

    c: document.getElementById("input-c"),

    d: document.getElementById("input-d"),

  },

  coeffCanvas: document.getElementById("coeff-canvas"),

  graphCanvas: document.getElementById("graph-canvas"),

};



const ctxCoeff = els.coeffCanvas.getContext("2d");

const ctxGraph = els.graphCanvas.getContext("2d");

const EPS = 1e-5;



document.querySelectorAll("[data-level]").forEach((button) => {

  button.addEventListener("click", () => startLevel(Number(button.dataset.level)));

});



els.back.addEventListener("click", showLevelSelect);



els.normalizeToggle.addEventListener("change", () => {

  app.normalized = els.normalizeToggle.checked;

  applyNormalization();

  syncSlider();

  render();

});



els.discriminantToggle.addEventListener("change", () => {

  app.showDiscriminant = els.discriminantToggle.checked;

  render();

});



els.strataToggle.addEventListener("change", () => {

  app.showStrata = els.strataToggle.checked;

  if (!app.showStrata) {

    app.spatialDrag = false;

    els.spatialDragToggle.checked = false;

  }

  render();

});



els.spatialDragToggle.addEventListener("change", () => {

  app.spatialDrag = els.spatialDragToggle.checked;

  if (app.spatialDrag) {

    app.showStrata = true;

    els.strataToggle.checked = true;

  }

  render();

});



els.aSlider.addEventListener("input", () => {

  app.coeffs.a = Number(els.aSlider.value);

  render();

});



els.bSlider.addEventListener("input", () => {

  app.coeffs.b = Number(els.bSlider.value);

  render();

});



Object.entries(els.inputs).forEach(([key, input]) => {

  input.addEventListener("change", () => {

    const value = Number(input.value);

    if (Number.isFinite(value)) {

      app.coeffs[key] = clamp(value, -coeffRange(), coeffRange());

      applyNormalization();

      render();

    }

  });

});



els.coeffCanvas.addEventListener("pointerdown", (event) => {

  const p = canvasPoint(els.coeffCanvas, event);

  const hit = hitCoefficient(p.x, p.y);

  if (!hit) return;

  app.dragging = true;

  app.dragTarget = hit;

  app.lastPointer = p;

  els.coeffCanvas.setPointerCapture(event.pointerId);

  updateFromCanvasPoint(p.x, p.y);

});



els.coeffCanvas.addEventListener("pointermove", (event) => {

  if (!app.dragging) return;

  const p = canvasPoint(els.coeffCanvas, event);

  updateFromCanvasPoint(p.x, p.y);

});



els.coeffCanvas.addEventListener("pointerup", (event) => {

  app.dragging = false;

  app.dragTarget = null;

  app.lastPointer = null;

  els.coeffCanvas.releasePointerCapture(event.pointerId);

});



window.addEventListener("resize", render);



function startLevel(level) {

  app.level = level;

  app.normalized = false;

  app.showDiscriminant = false;

  app.showStrata = false;

  app.spatialDrag = false;

  els.normalizeToggle.checked = false;

  els.discriminantToggle.checked = false;

  els.strataToggle.checked = false;

  els.spatialDragToggle.checked = false;

  els.select.classList.add("hidden");

  els.viewer.classList.remove("hidden");

  applyNormalization();

  updateLabels();

  syncSlider();

  render();

}



function showLevelSelect() {

  els.viewer.classList.add("hidden");

  els.select.classList.remove("hidden");

}



function updateLabels() {
  const names = {
    1: "1????",
    2: "2????",
    3: "3????",
    4: "4????",
  };
  const normalizeLabels = {
    1: "??????????",
    2: "??????????",
    3: "??????????",
    4: "??????????",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "??????";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} ????`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "????????????????????????";
}

function applyNormalization() {

  if (!app.normalized) return;

  if (app.level >= 1) app.coeffs.a = 0;

}



function syncSlider() {

  const range = coeffRange();

  els.aSlider.min = String(-range);

  els.aSlider.max = String(range);

  els.aSlider.value = String(clamp(app.coeffs.a, -range, range));

  els.aSlider.disabled = app.normalized;

  els.aSliderValue.textContent = `a=${format(app.coeffs.a)}`;

  els.bSlider.min = String(-range);

  els.bSlider.max = String(range);

  els.bSlider.value = String(clamp(app.coeffs.b, -range, range));

  els.bSliderValue.textContent = `b=${format(app.coeffs.b)}`;

}



function syncNumberInputs() {

  const active = { a: true, b: app.level >= 2, c: app.level >= 3, d: app.level >= 4 };

  Object.entries(els.inputs).forEach(([key, input]) => {

    input.parentElement.classList.toggle("hidden", !active[key]);

    input.disabled = !active[key] || (key === "a" && app.normalized);

    input.value = format(app.coeffs[key]);

  });

}



function render() {

  if (els.viewer.classList.contains("hidden")) return;

  fitCanvas(els.coeffCanvas, ctxCoeff);

  fitCanvas(els.graphCanvas, ctxGraph);

  syncSlider();

  syncNumberInputs();

  updateReadout();

  drawCoefficientSpace();

  drawGraph();

}



function fitCanvas(canvas, ctx) {

  const rect = canvas.getBoundingClientRect();

  const dpr = window.devicePixelRatio || 1;

  const w = Math.max(320, Math.round(rect.width * dpr));

  const h = Math.max(320, Math.round(rect.height * dpr));

  if (canvas.width !== w || canvas.height !== h) {

    canvas.width = w;

    canvas.height = h;

  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

}



function canvasPoint(canvas, event) {

  const rect = canvas.getBoundingClientRect();

  return { x: event.clientX - rect.left, y: event.clientY - rect.top };

}



function coeffRange() {

  return 5;

}



function coefficientRect() {

  const w = els.coeffCanvas.clientWidth;

  const h = els.coeffCanvas.clientHeight;

  return { x: 54, y: 44, w: w - 94, h: h - 96 };

}



function map2D(x, y, rect, range = coeffRange()) {

  return {

    x: rect.x + rect.w * (x + range) / (2 * range),

    y: rect.y + rect.h * (range - y) / (2 * range),

  };

}



function unmap2D(px, py, rect, range = coeffRange()) {

  return {

    x: ((px - rect.x) / rect.w) * (2 * range) - range,

    y: range - ((py - rect.y) / rect.h) * (2 * range),

  };

}



function drawCoefficientSpace() {

  const w = els.coeffCanvas.clientWidth;

  const h = els.coeffCanvas.clientHeight;

  ctxCoeff.clearRect(0, 0, w, h);

  if (app.level === 1) drawLevel1Coeff();

  if (app.level === 2) drawLevel2Coeff();

  if (app.level === 3) drawLevel3Coeff();

  if (app.level === 4) drawLevel4Coeff();

}



function drawGrid(ctx, rect, range) {

  ctx.save();

  ctx.strokeStyle = "#eadff2";

  ctx.lineWidth = 1;

  for (let i = Math.ceil(-range); i <= Math.floor(range); i++) {

    const p1 = map2D(i, -range, rect, range);

    const p2 = map2D(i, range, rect, range);

    const q1 = map2D(-range, i, rect, range);

    const q2 = map2D(range, i, rect, range);

    line(ctx, p1.x, p1.y, p2.x, p2.y);

    line(ctx, q1.x, q1.y, q2.x, q2.y);

  }

  const ox = map2D(0, 0, rect, range);

  ctx.strokeStyle = "#b8a9cc";

  line(ctx, rect.x, ox.y, rect.x + rect.w, ox.y);

  line(ctx, ox.x, rect.y, ox.x, rect.y + rect.h);

  ctx.fillStyle = "#7f728e";

  ctx.font = "12px Segoe UI, sans-serif";

  ctx.fillText("0", ox.x + 6, ox.y - 6);

  ctx.restore();

}



function drawLevel1Coeff() {

  const rect = coefficientRect();

  drawGrid(ctxCoeff, rect, coeffRange());

  const y = rect.y + rect.h / 2;

  ctxCoeff.save();

  ctxCoeff.strokeStyle = "#7aa7ff";

  ctxCoeff.lineWidth = 2;

  line(ctxCoeff, rect.x, y, rect.x + rect.w, y);

  const x = map2D(app.coeffs.a, 0, rect).x;

  drawPoint(ctxCoeff, x, y, app.normalized ? "#d98c00" : "#6b5b95", "a");

  ctxCoeff.fillStyle = "#7f728e";

  ctxCoeff.fillText("a", rect.x + rect.w - 12, y - 10);


  ctxCoeff.restore();

}



function drawLevel2Coeff() {

  const rect = coefficientRect();

  drawGrid(ctxCoeff, rect, coeffRange());

  if (app.showDiscriminant) {

    ctxCoeff.save();

    ctxCoeff.strokeStyle = "#ff765f";

    ctxCoeff.lineWidth = 3;

    ctxCoeff.beginPath();

    let started = false;

    for (let a = -3; a <= 3; a += 0.02) {

      const b = (a * a) / 4;

      if (Math.abs(b) > 3) continue;

      const p = map2D(a, b, rect);

      if (!started) {

        ctxCoeff.moveTo(p.x, p.y);

        started = true;

      } else ctxCoeff.lineTo(p.x, p.y);

    }

    ctxCoeff.stroke();


    ctxCoeff.restore();

  }

  const p = map2D(app.coeffs.a, app.coeffs.b, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#6b5b95", "(a,b)");

  labelAxes("a", "b", rect);

}



function drawLevel3Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["a", "b", "c"], 3);

  drawABCPlane(rect);

  if (app.showDiscriminant) drawCubicDiscriminantSurface(rect);

  const p = projectABC(app.coeffs.a, app.coeffs.b, app.coeffs.c, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#6b5b95", "(b,c)");


}



function drawLevel4Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["b", "c", "d"], 5);

  drawBCDPlane(rect);

  if (app.showDiscriminant) drawQuarticDiscriminantSurface(rect);

  const p = projectBCD(app.coeffs.b, app.coeffs.c, app.coeffs.d, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#6b5b95", "(c,d)");


}



function spaceBasis(rect, range) {

  const unit = Math.min(rect.w, rect.h) / (2 * range + 1.2);

  const o = { x: rect.x + rect.w * 0.5, y: rect.y + rect.h * 0.56 };

  const origin = rotateAndProject(0, 0, 0, unit, o);

  const xAxis = rotateAndProject(1, 0, 0, unit, o);

  const yAxis = rotateAndProject(0, 1, 0, unit, o);

  const zAxis = rotateAndProject(0, 0, 1, unit, o);

  return {

    o,

    ex: { x: xAxis.x - origin.x, y: xAxis.y - origin.y },

    ey: { x: yAxis.x - origin.x, y: yAxis.y - origin.y },

    ez: { x: zAxis.x - origin.x, y: zAxis.y - origin.y },

    unit,

    range,

  };

}



function projectSpace(x, y, z, rect, range) {

  const b = spaceBasis(rect, range);

  return rotateAndProject(x, y, z, b.unit, b.o);

}



function rotateAndProject(x, y, z, unit, origin) {

  const cy = Math.cos(app.rotation.yaw);

  const sy = Math.sin(app.rotation.yaw);

  const cp = Math.cos(app.rotation.pitch);

  const sp = Math.sin(app.rotation.pitch);

  const x1 = x * cy - y * sy;

  const y1 = x * sy + y * cy;

  const z1 = z;

  const y2 = y1 * cp - z1 * sp;

  const z2 = y1 * sp + z1 * cp;

  return { x: origin.x + x1 * unit, y: origin.y - z2 * unit, depth: y2 };

}



function projectABC(a, b, c, rect) {

  return projectSpace(a, b, c, rect, 5);

}



function projectBCD(b, c, d, rect) {

  return projectSpace(b, c, d, rect, 5);

}



function unprojectFixedX(px, py, fixedX, rect, range) {

  const b = spaceBasis(rect, range);

  const vx = px - b.o.x - fixedX * b.ex.x;

  const vy = py - b.o.y - fixedX * b.ex.y;

  const det = b.ey.x * b.ez.y - b.ey.y * b.ez.x;

  return {

    y: (vx * b.ez.y - vy * b.ez.x) / det,

    z: (b.ey.x * vy - b.ey.y * vx) / det,

  };

}



function drawSpaceBox(rect, labels, range) {

  const corners = [];

  [-range, range].forEach((x) => {

    [-range, range].forEach((y) => {

      [-range, range].forEach((z) => corners.push({ x, y, z, p: projectSpace(x, y, z, rect, range) }));

    });

  });

  ctxCoeff.save();

  ctxCoeff.strokeStyle = "#eadff2";

  ctxCoeff.lineWidth = 1;

  corners.forEach((a) => {

    corners.forEach((b) => {

      const diff = Number(a.x !== b.x) + Number(a.y !== b.y) + Number(a.z !== b.z);

      if (diff === 1) line(ctxCoeff, a.p.x, a.p.y, b.p.x, b.p.y);

    });

  });

  const o = projectSpace(0, 0, 0, rect, range);

  const ax = projectSpace(range, 0, 0, rect, range);

  const ay = projectSpace(0, range, 0, rect, range);

  const az = projectSpace(0, 0, range, rect, range);

  ctxCoeff.strokeStyle = "#b8a9cc";

  ctxCoeff.lineWidth = 1.6;

  line(ctxCoeff, o.x, o.y, ax.x, ax.y);

  line(ctxCoeff, o.x, o.y, ay.x, ay.y);

  line(ctxCoeff, o.x, o.y, az.x, az.y);

  ctxCoeff.fillStyle = "#7f728e";

  ctxCoeff.font = "12px Segoe UI, sans-serif";

  ctxCoeff.fillText(labels[0], ax.x - 12, ax.y + 18);

  ctxCoeff.fillText(labels[1], ay.x + 8, ay.y);

  ctxCoeff.fillText(labels[2], az.x + 8, az.y - 8);

  ctxCoeff.restore();

}



function drawABCPlane(rect) {

  const a = app.coeffs.a;

  const range = 5;

  const pts = [

    projectABC(a, -range, -range, rect),

    projectABC(a, range, -range, rect),

    projectABC(a, range, range, rect),

    projectABC(a, -range, range, rect),

  ];

  drawPlanePolygon(pts, `a = ${format(a)} 蟷ｳ髱｢`);

}



function drawBCDPlane(rect) {

  const b = app.coeffs.b;

  const range = 5;

  const pts = [

    projectBCD(b, -range, -range, rect),

    projectBCD(b, range, -range, rect),

    projectBCD(b, range, range, rect),

    projectBCD(b, -range, range, rect),

  ];

  drawPlanePolygon(pts, `b = ${format(b)} 蟷ｳ髱｢`);

}



function drawPlanePolygon(pts, label) {

  ctxCoeff.save();

  ctxCoeff.fillStyle = "rgba(88, 196, 167, 0.13)";

  ctxCoeff.strokeStyle = "rgba(88, 196, 167, 0.62)";

  ctxCoeff.lineWidth = 2;

  ctxCoeff.beginPath();

  pts.forEach((p, i) => (i === 0 ? ctxCoeff.moveTo(p.x, p.y) : ctxCoeff.lineTo(p.x, p.y)));

  ctxCoeff.closePath();

  ctxCoeff.fill();

  ctxCoeff.stroke();


  ctxCoeff.restore();

}



function drawCubicDiscriminantSurface(rect) {

  const range = 5;

  const aValues = rangeValues(-range, range, 0.22);

  const bValues = rangeValues(-range, range, 0.22);

  const lower = [];

  const upper = [];

  for (let i = 0; i < aValues.length; i++) {

    lower[i] = [];

    upper[i] = [];

    for (let j = 0; j < bValues.length; j++) {

      const branches = cubicImplicitCBranches(aValues[i], bValues[j]);

      lower[i][j] = cubicImplicitPoint(aValues[i], bValues[j], branches[0], rect, range);

      upper[i][j] = cubicImplicitPoint(aValues[i], bValues[j], branches[1], rect, range);

    }

  }

  ctxCoeff.save();

  drawSurfacePatches(lower, "rgba(255, 118, 141, 0.18)", "rgba(255, 118, 141, 0.22)");

  drawSurfacePatches(upper, "rgba(95, 188, 255, 0.16)", "rgba(95, 188, 255, 0.22)");

  drawSurfaceMesh(lower, 5, "rgba(121, 93, 189, 0.20)");

  drawSurfaceMesh(upper, 5, "rgba(121, 93, 189, 0.20)");

  ctxCoeff.strokeStyle = "#ff765f";

  ctxCoeff.lineWidth = 3;

  ctxCoeff.beginPath();

  let sliceStarted = false;

  const a0 = app.coeffs.a;

  for (let r = -3.2; r <= 3.2; r += 0.01) {

    const b = -3 * r * r - 2 * a0 * r;

    const c = 2 * r * r * r + a0 * r * r;

    if (Math.abs(b) > range || Math.abs(c) > range) {

      sliceStarted = false;

      continue;

    }

    const p = projectABC(a0, b, c, rect);

    if (!sliceStarted) {

      ctxCoeff.moveTo(p.x, p.y);

      sliceStarted = true;

    } else ctxCoeff.lineTo(p.x, p.y);

  }

  ctxCoeff.stroke();

  const cuspB = (a0 * a0) / 3;

  const cuspC = (a0 ** 3) / 27;

  if (Math.abs(cuspB) <= range && Math.abs(cuspC) <= range) {

    const cusp = projectABC(a0, cuspB, cuspC, rect);

    drawPoint(ctxCoeff, cusp.x, cusp.y, "#ff6f9d", "3?");

  }


  ctxCoeff.restore();

}



function drawQuarticDiscriminantSurface(rect) {

  const a = app.coeffs.a;

  const range = 5;

  const rValues = rangeValues(-3.8, 3.8, 0.18);

  const uValues = rangeValues(-9, 9, 0.28);

  const surface = [];

  for (let i = 0; i < rValues.length; i++) {

    surface[i] = [];

    for (let j = 0; j < uValues.length; j++) {

      surface[i][j] = quarticDoubleRootPoint(a, rValues[i], uValues[j], rect, range);

    }

  }

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(134, 216, 177, 0.18)", "rgba(134, 216, 177, 0.24)");

  drawSurfaceMesh(surface, 5, "rgba(107, 91, 149, 0.22)");

  ctxCoeff.strokeStyle = "#ff765f";

  ctxCoeff.lineWidth = 2.8;

  for (let branch = 0; branch < 2; branch++) {

    ctxCoeff.beginPath();

    let started = false;

    for (let r = -2; r <= 2; r += 0.02) {

      const roots = solveQuarticSliceSimpleRoots(a, app.coeffs.b, r);

      const s = roots[branch];

      if (!Number.isFinite(s)) {

        started = false;

        continue;

      }

      const t = -a - 2 * r - s;

      const c = -(r * r * s + r * r * t + 2 * r * s * t);

      const d = r * r * s * t;

      if (Math.max(Math.abs(c), Math.abs(d)) > range) {

        started = false;

        continue;

      }

      const p = projectBCD(app.coeffs.b, c, d, rect);

      if (!started) {

        ctxCoeff.moveTo(p.x, p.y);

        started = true;

      } else ctxCoeff.lineTo(p.x, p.y);

    }

    ctxCoeff.stroke();

  }


  ctxCoeff.restore();

}



function solveQuarticSliceSimpleRoots(a, b, r) {

  const linear = a + 2 * r;

  const constant = b + 3 * r * r + 2 * a * r;

  const disc = linear * linear - 4 * constant;

  if (disc < 0) return [NaN, NaN];

  const root = Math.sqrt(disc);

  return [(-linear - root) / 2, (-linear + root) / 2];

}



function cubicDoubleRootPoint(r, s, rect, range) {

  const a = -(2 * r + s);

  const b = r * r + 2 * r * s;

  const c = -r * r * s;

  if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) > range) return null;

  return { p: projectABC(a, b, c, rect), depth: a + b + c };

}



function cubicImplicitCBranches(a, b) {

  const A = -27;

  const B = 18 * a * b - 4 * a ** 3;

  const C = a * a * b * b - 4 * b ** 3;

  const disc = B * B - 4 * A * C;

  if (disc < 0) return [NaN, NaN];

  const root = Math.sqrt(disc);

  return [(-B - root) / (2 * A), (-B + root) / (2 * A)].sort((x, y) => x - y);

}



function cubicImplicitPoint(a, b, c, rect, range) {

  if (!Number.isFinite(c) || Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) > range) return null;

  const p = projectABC(a, b, c, rect);

  return { p, depth: p.depth };

}



function quarticDoubleRootPoint(a, r, u, rect, range) {

  const s = (-a - 2 * r + u) / 2;

  const t = (-a - 2 * r - u) / 2;

  const b = r * r + 2 * r * s + 2 * r * t + s * t;

  const c = -(r * r * s + r * r * t + 2 * r * s * t);

  const d = r * r * s * t;

  if (Math.max(Math.abs(b), Math.abs(c), Math.abs(d)) > range) return null;

  const p = projectBCD(b, c, d, rect);

  return { p, depth: p.depth };

}



function drawSurfacePatches(grid, fillStyle, strokeStyle) {

  const patches = [];

  for (let i = 0; i < grid.length - 1; i++) {

    for (let j = 0; j < grid[i].length - 1; j++) {

      const quad = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];

      const valid = quad.filter(Boolean);

      if (valid.length >= 3) {

        patches.push({ quad: valid, depth: valid.reduce((sum, item) => sum + item.depth, 0) / valid.length });

      }

    }

  }

  patches.sort((a, b) => a.depth - b.depth);

  ctxCoeff.save();

  ctxCoeff.fillStyle = fillStyle;

  ctxCoeff.strokeStyle = strokeStyle;

  ctxCoeff.lineWidth = 0.4;

  patches.forEach(({ quad }) => {

    ctxCoeff.beginPath();

    quad.forEach((item, index) => {

      if (index === 0) ctxCoeff.moveTo(item.p.x, item.p.y);

      else ctxCoeff.lineTo(item.p.x, item.p.y);

    });

    ctxCoeff.closePath();

    ctxCoeff.fill();

    ctxCoeff.stroke();

  });

  ctxCoeff.restore();

}



function drawSurfaceMesh(grid, stride, strokeStyle) {

  ctxCoeff.save();

  ctxCoeff.strokeStyle = strokeStyle;

  ctxCoeff.lineWidth = 1;

  for (let i = 0; i < grid.length; i += stride) drawSurfacePolyline(grid[i]);

  for (let j = 0; j < grid[0].length; j += stride) drawSurfacePolyline(grid.map((row) => row[j]));

  ctxCoeff.restore();

}



function drawSurfacePolyline(items) {

  ctxCoeff.beginPath();

  let started = false;

  items.forEach((item) => {

    if (!item) {

      started = false;

      return;

    }

    if (!started) {

      ctxCoeff.moveTo(item.p.x, item.p.y);

      started = true;

    } else ctxCoeff.lineTo(item.p.x, item.p.y);

  });

  ctxCoeff.stroke();

}



function rangeValues(min, max, step) {

  const values = [];

  for (let value = min; value <= max + step / 2; value += step) values.push(value);

  return values;

}



function snapQuadraticIfClose() {

  if (!app.showDiscriminant) return;

  const rect = coefficientRect();

  const current = map2D(app.coeffs.a, app.coeffs.b, rect);

  let best = null;

  const start = app.normalized ? 0 : -3;

  const end = app.normalized ? 0 : 3;

  const step = app.normalized ? 1 : 0.01;

  for (let a = start; a <= end; a += step) {

    const b = (a * a) / 4;

    if (Math.abs(b) > 3) continue;

    const p = map2D(a, b, rect);

    const dist = Math.hypot(p.x - current.x, p.y - current.y);

    if (!best || dist < best.dist) best = { dist, a, b };

  }

  if (best && best.dist <= 11) {

    app.coeffs.a = app.normalized ? 0 : best.a;

    app.coeffs.b = best.b;

  }

}



function snapCubicIfClose() {

  if (!app.showDiscriminant) return;

  const rect = coefficientRect();

  const a = app.coeffs.a;

  const current = projectABC(a, app.coeffs.b, app.coeffs.c, rect);

  let best = null;

  for (let r = -3.2; r <= 3.2; r += 0.01) {

    const b = -3 * r * r - 2 * a * r;

    const c = 2 * r * r * r + a * r * r;

    if (Math.abs(b) > 3 || Math.abs(c) > 3) continue;

    const p = projectABC(a, b, c, rect);

    const dist = Math.hypot(p.x - current.x, p.y - current.y);

    if (!best || dist < best.dist) best = { dist, b, c };

  }

  if (best && best.dist <= 11) {

    app.coeffs.b = best.b;

    app.coeffs.c = best.c;

  }

}



function snapQuarticIfClose() {

  if (!app.showDiscriminant) return;

  const rect = coefficientRect();

  const { a, b } = app.coeffs;

  const current = projectBCD(b, app.coeffs.c, app.coeffs.d, rect);

  let best = null;

  for (let r = -2; r <= 2; r += 0.01) {

    solveQuarticSliceSimpleRoots(a, b, r).forEach((s) => {

      if (!Number.isFinite(s)) return;

      const t = -a - 2 * r - s;

      const c = -(r * r * s + r * r * t + 2 * r * s * t);

      const d = r * r * s * t;

      if (Math.max(Math.abs(c), Math.abs(d)) > 5) return;

      const p = projectBCD(b, c, d, rect);

      const dist = Math.hypot(p.x - current.x, p.y - current.y);

      if (!best || dist < best.dist) best = { dist, c, d };

    });

  }

  if (best && best.dist <= 11) {

    app.coeffs.c = best.c;

    app.coeffs.d = best.d;

  }

}



function labelAxes(xLabel, yLabel, rect) {

  const ox = map2D(0, 0, rect, coeffRange());

  ctxCoeff.save();

  ctxCoeff.fillStyle = "#7f728e";

  ctxCoeff.font = "12px Segoe UI, sans-serif";

  ctxCoeff.fillText(xLabel, rect.x + rect.w - 14, ox.y - 8);

  ctxCoeff.fillText(yLabel, ox.x + 8, rect.y + 14);

  ctxCoeff.restore();

}



function hitCoefficient(px, py) {

  if (app.normalized && app.level === 1) return null;

  const rect = coefficientRect();

  if (app.level === 1) return "a";

  if (app.level === 2) return "ab";

  if (app.level === 3 && hitSpaceCorner(px, py, rect, 5)) return "rotate";

  if (app.level === 3 && inside(px, py, rect)) return "bc3";

  if (app.level === 4) {

    if (hitSpaceCorner(px, py, rect, 5)) return "rotate";

    if (inside(px, py, rect)) return "bc4";

  }

  return null;

}



function updateFromCanvasPoint(px, py) {

  const rect = coefficientRect();

  const range = coeffRange();

  if (app.dragTarget === "rotate") {

    const last = app.lastPointer || { x: px, y: py };

    app.rotation.yaw += (px - last.x) * 0.012;

    app.rotation.pitch = clamp(app.rotation.pitch + (py - last.y) * 0.012, -1.15, 1.15);

    app.lastPointer = { x: px, y: py };

    render();

    return;

  }

  if (app.dragTarget === "a") {

    const v = unmap2D(px, py, rect, range);

    app.coeffs.a = clamp(v.x, -range, range);

  }

  if (app.dragTarget === "ab") {

    const v = unmap2D(px, py, rect, range);

    app.coeffs.a = app.normalized ? 0 : clamp(v.x, -range, range);

    app.coeffs.b = clamp(v.y, -range, range);

    snapQuadraticIfClose();

  }

  if (app.dragTarget === "bc3") {

    const v = unprojectFixedX(px, py, app.coeffs.a, rect, 5);

    app.coeffs.b = clamp(v.y, -range, range);

    app.coeffs.c = clamp(v.z, -range, range);

    snapCubicIfClose();

  }

  if (app.dragTarget === "bc4") {

    const v = unprojectFixedX(px, py, app.coeffs.b, rect, 5);

    app.coeffs.c = clamp(v.y, -range, range);

    app.coeffs.d = clamp(v.z, -range, range);

    snapQuarticIfClose();

  }

  if (app.dragTarget === "cd4") {

    const v = unprojectFixedX(px, py, app.coeffs.b, rect, 5);

    app.coeffs.c = clamp(v.y, -range, range);

    app.coeffs.d = clamp(v.z, -range, range);

    snapQuarticIfClose();

  }

  applyNormalization();

  app.lastPointer = { x: px, y: py };

  render();

}



function hitSpaceCorner(px, py, rect, range) {

  for (const x of [-range, range]) {

    for (const y of [-range, range]) {

      for (const z of [-range, range]) {

        const p = projectSpace(x, y, z, rect, range);

        if (Math.hypot(px - p.x, py - p.y) <= 16) return true;

      }

    }

  }

  return false;

}



function drawGraph() {

  const w = els.graphCanvas.clientWidth;

  const h = els.graphCanvas.clientHeight;

  ctxGraph.clearRect(0, 0, w, h);

  const rect = { x: 54, y: 36, w: w - 94, h: h - 86 };

  const xRange = app.level === 4 ? 2.7 : 3.2;

  const yRange = app.level === 4 ? 8 : 6;

  drawGraphGrid(ctxGraph, rect, xRange, yRange);

  drawPolynomialCurve(rect, xRange, yRange);

  const roots = realRoots(getCoefficients());

  roots.forEach((r) => {

    const p = graphMap(r, 0, rect, xRange, yRange);

    drawPoint(ctxGraph, p.x, p.y, "#d98c00", format(r));

  });

  els.rootSummary.textContent = "";

  els.solutionBadge.textContent = classify();

}



function drawGraphGrid(ctx, rect, xRange, yRange) {

  ctx.save();

  ctx.strokeStyle = "#eadff2";

  for (let x = Math.ceil(-xRange); x <= Math.floor(xRange); x++) {

    const p1 = graphMap(x, -yRange, rect, xRange, yRange);

    const p2 = graphMap(x, yRange, rect, xRange, yRange);

    line(ctx, p1.x, p1.y, p2.x, p2.y);

  }

  for (let y = Math.ceil(-yRange); y <= Math.floor(yRange); y++) {

    const p1 = graphMap(-xRange, y, rect, xRange, yRange);

    const p2 = graphMap(xRange, y, rect, xRange, yRange);

    line(ctx, p1.x, p1.y, p2.x, p2.y);

  }

  const ox1 = graphMap(-xRange, 0, rect, xRange, yRange);

  const ox2 = graphMap(xRange, 0, rect, xRange, yRange);

  const oy1 = graphMap(0, -yRange, rect, xRange, yRange);

  const oy2 = graphMap(0, yRange, rect, xRange, yRange);

  ctx.strokeStyle = "#b8a9cc";

  ctx.lineWidth = 1.4;

  line(ctx, ox1.x, ox1.y, ox2.x, ox2.y);

  line(ctx, oy1.x, oy1.y, oy2.x, oy2.y);

  ctx.fillStyle = "#7f728e";

  ctx.fillText("x", ox2.x - 12, ox2.y - 8);

  ctx.fillText("y", oy2.x + 8, oy2.y + 14);

  ctx.restore();

}



function drawPolynomialCurve(rect, xRange, yRange) {

  ctxGraph.save();

  ctxGraph.strokeStyle = "#008c95";

  ctxGraph.lineWidth = 3;

  ctxGraph.beginPath();

  let started = false;

  for (let i = 0; i <= 720; i++) {

    const x = -xRange + (2 * xRange * i) / 720;

    const y = polyValue(getCoefficients(), x);

    const p = graphMap(x, clamp(y, -yRange * 1.25, yRange * 1.25), rect, xRange, yRange);

    if (!Number.isFinite(y) || Math.abs(y) > yRange * 1.25) {

      started = false;

      continue;

    }

    if (!started) {

      ctxGraph.moveTo(p.x, p.y);

      started = true;

    } else ctxGraph.lineTo(p.x, p.y);

  }

  ctxGraph.stroke();

  ctxGraph.restore();

}



function graphMap(x, y, rect, xRange, yRange) {

  return {

    x: rect.x + rect.w * (x + xRange) / (2 * xRange),

    y: rect.y + rect.h * (yRange - y) / (2 * yRange),

  };

}



function getCoefficients() {

  const { a, b, c, d } = app.coeffs;

  if (app.level === 1) return [1, a];

  if (app.level === 2) return [1, a, b];

  if (app.level === 3) return [1, a, b, c];

  return [1, a, b, c, d];

}



function polyValue(coeffs, x) {

  return coeffs.reduce((acc, value) => acc * x + value, 0);

}



function realRoots(coeffs) {

  if (coeffs.length === 2) return [-coeffs[1] / coeffs[0]];

  const roots = [];

  const min = -8;

  const max = 8;

  const step = 0.0125;

  let x0 = min;

  let y0 = polyValue(coeffs, x0);

  for (let x = min + step; x <= max; x += step) {

    const y = polyValue(coeffs, x);

    if (Math.abs(y) < 0.003) roots.push(x);

    if (y0 === 0 || y === 0 || y0 * y < 0) roots.push(bisect(coeffs, x0, x));

    x0 = x;

    y0 = y;

  }

  criticalPoints(coeffs).forEach((x) => {

    if (x > min && x < max && Math.abs(polyValue(coeffs, x)) < 0.002) roots.push(x);

  });

  return uniqueSorted(roots).filter((x) => Math.abs(polyValue(coeffs, x)) < 0.01);

}



function criticalPoints(coeffs) {

  const n = coeffs.length - 1;

  if (n <= 0) return [];

  const d = coeffs.slice(0, -1).map((c, i) => c * (n - i));

  if (d.length === 2) return [-d[1] / d[0]];

  if (d.length === 3) {

    const [a, b, c] = d;

    const disc = b * b - 4 * a * c;

    if (disc < 0) return [];

    return [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)];

  }

  return realRoots(d);

}



function bisect(coeffs, lo, hi) {

  let a = lo;

  let b = hi;

  let fa = polyValue(coeffs, a);

  for (let i = 0; i < 48; i++) {

    const m = (a + b) / 2;

    const fm = polyValue(coeffs, m);

    if (Math.abs(fm) < 1e-9) return m;

    if (fa * fm <= 0) b = m;

    else {

      a = m;

      fa = fm;

    }

  }

  return (a + b) / 2;

}



function classify() {

  const { a, b, c } = app.coeffs;

  if (app.level === 1) return "?? 1 ?";

  if (app.level === 2) {

    const disc = a * a - 4 * b;

    if (Math.abs(disc) < EPS) return "驥崎ｧ｣縺・縺､";

    return disc > 0 ? "逶ｸ逡ｰ縺ｪ繧句ｮ滓焚隗｣縺・縺､" : "逶ｸ逡ｰ縺ｪ繧玖劒謨ｰ隗｣縺・縺､";

  }

  if (app.level === 3) {

    const delta = cubicDiscriminant(a, b, c);

    const p = b - (a * a) / 3;

    const q = (2 * a ** 3) / 27 - (a * b) / 3 + c;

    if (Math.abs(p) < 0.015 && Math.abs(q) < 0.015) return "3驥崎ｧ｣";

    if (Math.abs(delta) < 0.02) return "2驥崎ｧ｣";

    return delta > 0 ? "螳溯ｧ｣3縺､" : "螳溯ｧ｣1縺､";

  }

  return classifyQuartic();

}



function cubicDiscriminant(a, b, c) {

  return a * a * b * b - 4 * b ** 3 - 4 * a ** 3 * c - 27 * c * c + 18 * a * b * c;

}



function classifyQuartic() {

  const roots = durandKerner(getCoefficients());

  const clusters = clusterComplex(roots);

  const realClusters = clusters.filter((cl) => Math.abs(cl.z.im) < 1e-4);

  const mults = clusters.map((cl) => cl.count).sort((a, b) => b - a);

  if (mults[0] === 4) return "4驥崎ｧ｣";

  if (mults[0] === 3) return "3驥崎ｧ｣縺ｨ1驥崎ｧ｣1縺､";

  if (mults[0] === 2 && mults[1] === 2) {

    return realClusters.length === 2 ? "螳溘・2驥崎ｧ｣2縺､" : "陌壹・2驥崎ｧ｣2縺､";

  }

  if (mults[0] === 2) return "螳溘・2驥崎ｧ｣縺ｨ1驥崎ｧ｣2縺､";

  const realCount = roots.filter((z) => Math.abs(z.im) < 1e-5).length;

  return realCount >= 4 ? "螳溯ｧ｣4縺､" : "螳溯ｧ｣2縺､縺ｨ陌壽焚隗｣2縺､";

}



function durandKerner(coeffs) {

  const n = coeffs.length - 1;

  let roots = Array.from({ length: n }, (_, i) => {

    const angle = (2 * Math.PI * i) / n;

    return { re: Math.cos(angle) * 0.7, im: Math.sin(angle) * 0.7 };

  });

  for (let k = 0; k < 90; k++) {

    roots = roots.map((z, i) => {

      let denom = { re: 1, im: 0 };

      roots.forEach((w, j) => {

        if (i !== j) denom = cMul(denom, cSub(z, w));

      });

      return cSub(z, cDiv(polyComplex(coeffs, z), denom));

    });

  }

  return roots;

}



function polyComplex(coeffs, z) {

  return coeffs.reduce((acc, value) => cAdd(cMul(acc, z), { re: value, im: 0 }), { re: 0, im: 0 });

}



function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }

function cSub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }

function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }

function cDiv(a, b) {

  const den = b.re * b.re + b.im * b.im || 1e-12;

  return { re: (a.re * b.re + a.im * b.im) / den, im: (a.im * b.re - a.re * b.im) / den };

}



function clusterComplex(roots) {

  const clusters = [];

  roots.forEach((z) => {

    const found = clusters.find((cl) => Math.hypot(cl.z.re - z.re, cl.z.im - z.im) < 0.035);

    if (found) {

      found.z.re = (found.z.re * found.count + z.re) / (found.count + 1);

      found.z.im = (found.z.im * found.count + z.im) / (found.count + 1);

      found.count += 1;

    } else clusters.push({ z: { ...z }, count: 1 });

  });

  return clusters;

}



function updateReadout() {

  const { a, b, c, d } = app.coeffs;

  const parts = [`a=${format(a)}`];

  if (app.level >= 2) parts.push(`b=${format(b)}`);

  if (app.level >= 3) parts.push(`c=${format(c)}`);

  if (app.level >= 4) parts.push(`d=${format(d)}`);

  els.coeffReadout.textContent = parts.join("  ");

}



function drawPoint(ctx, x, y, color, label) {

  ctx.save();

  ctx.shadowColor = color;

  ctx.shadowBlur = 14;

  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.arc(x, y, 7, 0, Math.PI * 2);

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#392f45";

  ctx.font = "12px Segoe UI, sans-serif";

  ctx.fillText(label, x + 11, y - 10);

  ctx.restore();

}






function line(ctx, x1, y1, x2, y2) {

  ctx.beginPath();

  ctx.moveTo(x1, y1);

  ctx.lineTo(x2, y2);

  ctx.stroke();

}



function uniqueSorted(values) {

  return values

    .filter(Number.isFinite)

    .sort((a, b) => a - b)

    .filter((x, i, arr) => i === 0 || Math.abs(x - arr[i - 1]) > 0.045);

}



function inside(x, y, rect) {

  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

}



function clamp(value, min, max) {

  return Math.min(max, Math.max(min, value));

}



function format(value) {

  if (Math.abs(value) < 0.0005) return "0.00";

  return value.toFixed(2);

}



function updateLabels() {
  const names = {
    1: "1????",
    2: "2????",
    3: "3????",
    4: "4????",
  };
  const normalizeLabels = {
    1: "??????????",
    2: "??????????",
    3: "??????????",
    4: "??????????",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "??????";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} ????`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "????????????????????????";
}

function drawGrid(ctx, rect, range) {

  ctx.save();

  ctx.strokeStyle = "#f2dce8";

  ctx.lineWidth = 1;

  for (let i = Math.ceil(-range); i <= Math.floor(range); i++) {

    const p1 = map2D(i, -range, rect, range);

    const p2 = map2D(i, range, rect, range);

    const q1 = map2D(-range, i, rect, range);

    const q2 = map2D(range, i, rect, range);

    line(ctx, p1.x, p1.y, p2.x, p2.y);

    line(ctx, q1.x, q1.y, q2.x, q2.y);

  }

  const ox = map2D(0, 0, rect, range);

  ctx.strokeStyle = "#d2a8c6";

  line(ctx, rect.x, ox.y, rect.x + rect.w, ox.y);

  line(ctx, ox.x, rect.y, ox.x, rect.y + rect.h);

  ctx.fillStyle = "#7b6678";

  ctx.font = "12px Segoe UI, sans-serif";

  ctx.fillText("0", ox.x + 6, ox.y - 6);

  ctx.restore();

}



function drawLevel1Coeff() {

  const rect = coefficientRect();

  drawGrid(ctxCoeff, rect, coeffRange());

  const y = rect.y + rect.h / 2;

  ctxCoeff.save();

  ctxCoeff.strokeStyle = "#80c7d8";

  ctxCoeff.lineWidth = 2;

  line(ctxCoeff, rect.x, y, rect.x + rect.w, y);

  const x = map2D(app.coeffs.a, 0, rect).x;

  drawPoint(ctxCoeff, x, y, app.normalized ? "#e9a94f" : "#db5f7a", "a");

  ctxCoeff.fillStyle = "#7b6678";

  ctxCoeff.fillText("a", rect.x + rect.w - 12, y - 10);


  ctxCoeff.restore();

}



function drawLevel2Coeff() {

  const rect = coefficientRect();

  drawGrid(ctxCoeff, rect, coeffRange());

  if (app.showDiscriminant) {

    ctxCoeff.save();

    ctxCoeff.strokeStyle = "#db5f7a";

    ctxCoeff.lineWidth = 3;

    ctxCoeff.beginPath();

    let started = false;

    for (let a = -3; a <= 3; a += 0.02) {

      const b = (a * a) / 4;

      if (Math.abs(b) > 3) continue;

      const p = map2D(a, b, rect);

      if (!started) {

        ctxCoeff.moveTo(p.x, p.y);

        started = true;

      } else ctxCoeff.lineTo(p.x, p.y);

    }

    ctxCoeff.stroke();


    ctxCoeff.restore();

  }

  const p = map2D(app.coeffs.a, app.coeffs.b, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a", "(a,b)");

  labelAxes("a", "b", rect);

}



function drawLevel3Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["a", "b", "c"], 5);

  drawABCPlane(rect);

  if (app.showDiscriminant) drawCubicDiscriminantSurface(rect);

  const p = projectABC(app.coeffs.a, app.coeffs.b, app.coeffs.c, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a", "(b,c)");


}



function drawLevel4Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["b", "c", "d"], 5);

  drawBCDPlane(rect);

  if (app.showDiscriminant) drawQuarticDiscriminantSurface(rect);

  const p = projectBCD(app.coeffs.b, app.coeffs.c, app.coeffs.d, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a", "(c,d)");


}



function drawSpaceBox(rect, labels, range) {

  const corners = [];

  [-range, range].forEach((x) => {

    [-range, range].forEach((y) => {

      [-range, range].forEach((z) => corners.push({ x, y, z, p: projectSpace(x, y, z, rect, range) }));

    });

  });

  ctxCoeff.save();

  ctxCoeff.strokeStyle = "#f2dce8";

  ctxCoeff.lineWidth = 1;

  corners.forEach((a) => {

    corners.forEach((b) => {

      const diff = Number(a.x !== b.x) + Number(a.y !== b.y) + Number(a.z !== b.z);

      if (diff === 1) line(ctxCoeff, a.p.x, a.p.y, b.p.x, b.p.y);

    });

  });

  const o = projectSpace(0, 0, 0, rect, range);

  const ax = projectSpace(range, 0, 0, rect, range);

  const ay = projectSpace(0, range, 0, rect, range);

  const az = projectSpace(0, 0, range, rect, range);

  ctxCoeff.strokeStyle = "#d2a8c6";

  ctxCoeff.lineWidth = 1.6;

  line(ctxCoeff, o.x, o.y, ax.x, ax.y);

  line(ctxCoeff, o.x, o.y, ay.x, ay.y);

  line(ctxCoeff, o.x, o.y, az.x, az.y);

  ctxCoeff.fillStyle = "#7b6678";

  ctxCoeff.font = "12px Segoe UI, sans-serif";

  ctxCoeff.fillText(labels[0], ax.x - 12, ax.y + 18);

  ctxCoeff.fillText(labels[1], ay.x + 8, ay.y);

  ctxCoeff.fillText(labels[2], az.x + 8, az.y - 8);

  ctxCoeff.restore();

}



function drawABCPlane(rect) {

  const a = app.coeffs.a;

  const range = 5;

  const pts = [

    projectABC(a, -range, -range, rect),

    projectABC(a, range, -range, rect),

    projectABC(a, range, range, rect),

    projectABC(a, -range, range, rect),

  ];

  drawPlanePolygon(pts, `a = ${format(a)} 蟷ｳ髱｢`);

}



function drawBCDPlane(rect) {

  const b = app.coeffs.b;

  const range = 5;

  const pts = [

    projectBCD(b, -range, -range, rect),

    projectBCD(b, range, -range, rect),

    projectBCD(b, range, range, rect),

    projectBCD(b, -range, range, rect),

  ];

  drawPlanePolygon(pts, `b = ${format(b)} 蟷ｳ髱｢`);

}



function drawPlanePolygon(pts, label) {

  ctxCoeff.save();

  ctxCoeff.fillStyle = "rgba(141, 210, 203, 0.14)";

  ctxCoeff.strokeStyle = "rgba(92, 181, 173, 0.62)";

  ctxCoeff.lineWidth = 2;

  ctxCoeff.beginPath();

  pts.forEach((p, i) => (i === 0 ? ctxCoeff.moveTo(p.x, p.y) : ctxCoeff.lineTo(p.x, p.y)));

  ctxCoeff.closePath();

  ctxCoeff.fill();

  ctxCoeff.stroke();


  ctxCoeff.restore();

}



function drawCubicDiscriminantSurface(rect) {

  const range = 5;

  const aValues = rangeValues(-range, range, 0.18);

  const rValues = rangeValues(-2.7, 2.7, 0.08);

  const surface = aValues.map((a) => rValues.map((r) => cubicParametricPoint(a, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(120, 200, 190, 0.22)", "rgba(90, 174, 165, 0.24)");

  drawSurfaceMesh(surface, 6, "rgba(92, 148, 166, 0.28)");

  drawCubicSliceCurve(rect, app.coeffs.a, range);


  ctxCoeff.restore();

}



function drawCubicSliceCurve(rect, a, range) {

  ctxCoeff.strokeStyle = "#6d73c9";

  ctxCoeff.lineWidth = 3;

  ctxCoeff.beginPath();

  let started = false;

  for (let r = -3.2; r <= 3.2; r += 0.01) {

    const item = cubicParametricPoint(a, r, rect, range);

    if (!item) {

      started = false;

      continue;

    }

    if (!started) {

      ctxCoeff.moveTo(item.p.x, item.p.y);

      started = true;

    } else ctxCoeff.lineTo(item.p.x, item.p.y);

  }

  ctxCoeff.stroke();

  const cuspR = -a / 3;

  const cusp = cubicParametricPoint(a, cuspR, rect, range);

  if (cusp) drawPoint(ctxCoeff, cusp.p.x, cusp.p.y, "#6d73c9", "3?");

}



function cubicParametricPoint(a, r, rect, range) {

  const b = -3 * r * r - 2 * a * r;

  const c = 2 * r * r * r + a * r * r;

  if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) > range) return null;

  const p = projectABC(a, b, c, rect);

  return { p, depth: p.depth };

}



function drawQuarticDiscriminantSurface(rect) {

  const range = 5;

  const { a, b } = app.coeffs;

  const bValues = rangeValues(-range, range, 0.16);

  const rValues = rangeValues(-2.45, 2.45, 0.055);

  const surface = bValues.map((b0) => rValues.map((r) => quarticParametricPoint(a, b0, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(178, 151, 216, 0.24)", "rgba(145, 116, 195, 0.25)");

  drawSurfaceMesh(surface, 7, "rgba(109, 115, 201, 0.24)");

  drawQuarticSliceCurve(rect, a, b, range);


  ctxCoeff.restore();

}



function drawQuarticSliceCurve(rect, a, b, range) {

  ctxCoeff.strokeStyle = "#4fa6b7";

  ctxCoeff.lineWidth = 2.8;

  ctxCoeff.beginPath();

  let started = false;

  for (let r = -3; r <= 3; r += 0.01) {

    const item = quarticParametricPoint(a, b, r, rect, range);

    if (!item) {

      started = false;

      continue;

    }

    if (!started) {

      ctxCoeff.moveTo(item.p.x, item.p.y);

      started = true;

    } else ctxCoeff.lineTo(item.p.x, item.p.y);

  }

  ctxCoeff.stroke();

}



function quarticParametricPoint(a, b, r, rect, range) {

  const c = -4 * r ** 3 - 3 * a * r * r - 2 * b * r;

  const d = 3 * r ** 4 + 2 * a * r ** 3 + b * r * r;

  if (Math.max(Math.abs(b), Math.abs(c), Math.abs(d)) > range) return null;

  const p = projectBCD(b, c, d, rect);

  return { p, depth: p.depth };

}



function snapQuarticIfClose() {

  if (!app.showDiscriminant) return;

  const rect = coefficientRect();

  const { a, b } = app.coeffs;

  const current = projectBCD(b, app.coeffs.c, app.coeffs.d, rect);

  let best = null;

  for (let r = -3; r <= 3; r += 0.01) {

    const item = quarticParametricPoint(a, b, r, rect, 5);

    if (!item) continue;

    const dist = Math.hypot(item.p.x - current.x, item.p.y - current.y);

    if (!best || dist < best.dist) {

      const c = -4 * r ** 3 - 3 * a * r * r - 2 * b * r;

      const d = 3 * r ** 4 + 2 * a * r ** 3 + b * r * r;

      best = { dist, c, d };

    }

  }

  if (best && best.dist <= 11) {

    app.coeffs.c = best.c;

    app.coeffs.d = best.d;

  }

}



function labelAxes(xLabel, yLabel, rect) {

  const ox = map2D(0, 0, rect, coeffRange());

  ctxCoeff.save();

  ctxCoeff.fillStyle = "#7b6678";

  ctxCoeff.font = "12px Segoe UI, sans-serif";

  ctxCoeff.fillText(xLabel, rect.x + rect.w - 14, ox.y - 8);

  ctxCoeff.fillText(yLabel, ox.x + 8, rect.y + 14);

  ctxCoeff.restore();

}



function drawGraph() {

  const w = els.graphCanvas.clientWidth;

  const h = els.graphCanvas.clientHeight;

  ctxGraph.clearRect(0, 0, w, h);

  const rect = { x: 54, y: 36, w: w - 94, h: h - 86 };

  const xRange = app.level === 4 ? 2.7 : 3.2;

  const yRange = app.level === 4 ? 8 : 6;

  drawGraphGrid(ctxGraph, rect, xRange, yRange);

  drawPolynomialCurve(rect, xRange, yRange);

  const roots = realRoots(getCoefficients());

  roots.forEach((r) => {

    const p = graphMap(r, 0, rect, xRange, yRange);

    drawPoint(ctxGraph, p.x, p.y, "#e9a94f", format(r));

  });

  els.rootSummary.textContent = "";

  els.solutionBadge.textContent = classify();

}



function drawGraphGrid(ctx, rect, xRange, yRange) {

  ctx.save();

  ctx.strokeStyle = "#f2dce8";

  for (let x = Math.ceil(-xRange); x <= Math.floor(xRange); x++) {

    const p1 = graphMap(x, -yRange, rect, xRange, yRange);

    const p2 = graphMap(x, yRange, rect, xRange, yRange);

    line(ctx, p1.x, p1.y, p2.x, p2.y);

  }

  for (let y = Math.ceil(-yRange); y <= Math.floor(yRange); y++) {

    const p1 = graphMap(-xRange, y, rect, xRange, yRange);

    const p2 = graphMap(xRange, y, rect, xRange, yRange);

    line(ctx, p1.x, p1.y, p2.x, p2.y);

  }

  const ox1 = graphMap(-xRange, 0, rect, xRange, yRange);

  const ox2 = graphMap(xRange, 0, rect, xRange, yRange);

  const oy1 = graphMap(0, -yRange, rect, xRange, yRange);

  const oy2 = graphMap(0, yRange, rect, xRange, yRange);

  ctx.strokeStyle = "#d2a8c6";

  ctx.lineWidth = 1.4;

  line(ctx, ox1.x, ox1.y, ox2.x, ox2.y);

  line(ctx, oy1.x, oy1.y, oy2.x, oy2.y);

  ctx.fillStyle = "#7b6678";

  ctx.fillText("x", ox2.x - 12, ox2.y - 8);

  ctx.fillText("y", oy2.x + 8, oy2.y + 14);

  ctx.restore();

}



function drawPolynomialCurve(rect, xRange, yRange) {

  ctxGraph.save();

  ctxGraph.strokeStyle = "#2f9aa7";

  ctxGraph.lineWidth = 3;

  ctxGraph.beginPath();

  let started = false;

  for (let i = 0; i <= 720; i++) {

    const x = -xRange + (2 * xRange * i) / 720;

    const y = polyValue(getCoefficients(), x);

    const p = graphMap(x, clamp(y, -yRange * 1.25, yRange * 1.25), rect, xRange, yRange);

    if (!Number.isFinite(y) || Math.abs(y) > yRange * 1.25) {

      started = false;

      continue;

    }

    if (!started) {

      ctxGraph.moveTo(p.x, p.y);

      started = true;

    } else ctxGraph.lineTo(p.x, p.y);

  }

  ctxGraph.stroke();

  ctxGraph.restore();

}



function classify() {

  const { a, b, c } = app.coeffs;

  if (app.level === 1) return "隗｣縺ｯ縺・▽繧・1 縺､";

  if (app.level === 2) {

    const disc = a * a - 4 * b;

    if (Math.abs(disc) < EPS) return "驥崎ｧ｣ 1 縺､";

    return disc > 0 ? "逡ｰ縺ｪ繧句ｮ滓焚隗｣ 2 縺､" : "逡ｰ縺ｪ繧玖､・ｴ謨ｰ隗｣ 2 縺､";

  }

  if (app.level === 3) {

    const delta = cubicDiscriminant(a, b, c);

    const p = b - (a * a) / 3;

    const q = (2 * a ** 3) / 27 - (a * b) / 3 + c;

    if (Math.abs(p) < 0.015 && Math.abs(q) < 0.015) return "3驥崎ｧ｣";

    if (Math.abs(delta) < 0.02) return "2驥崎ｧ｣";

    return delta > 0 ? "螳滓焚隗｣ 3 縺､" : "螳滓焚隗｣ 1 縺､";

  }

  return classifyQuartic();

}



function classifyQuartic() {

  const roots = durandKerner(getCoefficients());

  const clusters = clusterComplex(roots);

  const realClusters = clusters.filter((cl) => Math.abs(cl.z.im) < 1e-4);

  const mults = clusters.map((cl) => cl.count).sort((a, b) => b - a);

  if (mults[0] === 4) return "4驥崎ｧ｣";

  if (mults[0] === 3) return "3驥崎ｧ｣縺ｨ蜊俶ｹ 1 縺､";

  if (mults[0] === 2 && mults[1] === 2) return realClusters.length === 2 ? "螳・2驥崎ｧ｣ 2 縺､" : "隍・ｴ 2驥崎ｧ｣ 2 縺､";

  if (mults[0] === 2) return "2驥崎ｧ｣縺ｨ蜊俶ｹ 2 縺､";

  const realCount = roots.filter((z) => Math.abs(z.im) < 1e-5).length;

  return realCount >= 4 ? "螳滓焚隗｣ 4 縺､" : "螳滓焚隗｣ 2 縺､縺ｨ隍・ｴ謨ｰ隗｣ 2 縺､";

}



function drawPoint(ctx, x, y, color, label) {

  ctx.save();

  ctx.shadowColor = color;

  ctx.shadowBlur = 14;

  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.arc(x, y, 7, 0, Math.PI * 2);

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#3d2f3d";

  ctx.font = "12px Segoe UI, sans-serif";

  ctx.fillText(label, x + 11, y - 10);

  ctx.restore();

}






function coeffRange() {

  return 3;

}



function levelFormulaHTML(level = app.level) {

  const formulas = {

    1: '<span class="math">y = x + a</span>',

    2: '<span class="math">y = x<sup>2</sup> + ax + b</span>',

    3: '<span class="math">y = x<sup>3</sup> + ax<sup>2</sup> + bx + c</span>',

    4: '<span class="math">y = x<sup>4</sup> + ax<sup>3</sup> + bx<sup>2</sup> + cx + d</span>',

  };

  return formulas[level];

}



function updateLabels() {
  const names = {
    1: "1????",
    2: "2????",
    3: "3????",
    4: "4????",
  };
  const normalizeLabels = {
    1: "??????????",
    2: "??????????",
    3: "??????????",
    4: "??????????",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "??????";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} ????`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "????????????????????????";
}

function syncSlider() {

  const range = coeffRange();

  els.aSlider.min = String(-range);

  els.aSlider.max = String(range);

  els.aSlider.value = String(clamp(app.coeffs.a, -range, range));

  els.aSlider.disabled = app.normalized;

  els.aSliderValue.textContent = `a=${format(app.coeffs.a)}`;

  els.bSlider.min = String(-range);

  els.bSlider.max = String(range);

  els.bSlider.value = String(clamp(app.coeffs.b, -range, range));

  els.bSliderValue.textContent = `b=${format(app.coeffs.b)}`;

}



function projectABC(a, b, c, rect) {

  return projectSpace(a, b, c, rect, coeffRange());

}



function projectBCD(b, c, d, rect) {

  return projectSpace(b, c, d, rect, coeffRange());

}



function drawLevel3Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["a", "b", "c"], coeffRange());

  drawABCPlane(rect);

  if (app.showDiscriminant) drawCubicDiscriminantSurface(rect);

  const p = projectABC(app.coeffs.a, app.coeffs.b, app.coeffs.c, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a", "(b,c)");


}



function drawLevel4Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["b", "c", "d"], coeffRange());

  drawBCDPlane(rect);

  if (app.showDiscriminant) drawQuarticDiscriminantSurface(rect);

  const p = projectBCD(app.coeffs.b, app.coeffs.c, app.coeffs.d, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a", "(c,d)");


}



function drawABCPlane(rect) {

  const a = app.coeffs.a;

  const range = coeffRange();

  const pts = [

    projectABC(a, -range, -range, rect),

    projectABC(a, range, -range, rect),

    projectABC(a, range, range, rect),

    projectABC(a, -range, range, rect),

  ];

  drawPlanePolygon(pts, `a = ${format(a)} \u5e73\u9762`);

}



function drawBCDPlane(rect) {

  const b = app.coeffs.b;

  const range = coeffRange();

  const pts = [

    projectBCD(b, -range, -range, rect),

    projectBCD(b, range, -range, rect),

    projectBCD(b, range, range, rect),

    projectBCD(b, -range, range, rect),

  ];

  drawPlanePolygon(pts, `b = ${format(b)} \u5e73\u9762`);

}



function drawCubicDiscriminantSurface(rect) {

  const range = coeffRange();

  const aValues = rangeValues(-range, range, 0.12);

  const rValues = rangeValues(-2.2, 2.2, 0.055);

  const surface = aValues.map((a) => rValues.map((r) => cubicParametricPoint(a, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(120, 200, 190, 0.22)", "rgba(90, 174, 165, 0.24)");

  drawSurfaceMesh(surface, 6, "rgba(92, 148, 166, 0.28)");

  drawCubicSliceCurve(rect, app.coeffs.a, range);


  ctxCoeff.restore();

}



function drawCubicSliceCurve(rect, a, range) {

  ctxCoeff.strokeStyle = "#6d73c9";

  ctxCoeff.lineWidth = 3;

  ctxCoeff.beginPath();

  let started = false;

  for (let r = -2.4; r <= 2.4; r += 0.01) {

    const item = cubicParametricPoint(a, r, rect, range);

    if (!item) {

      started = false;

      continue;

    }

    if (!started) {

      ctxCoeff.moveTo(item.p.x, item.p.y);

      started = true;

    } else ctxCoeff.lineTo(item.p.x, item.p.y);

  }

  ctxCoeff.stroke();

  const cusp = cubicParametricPoint(a, -a / 3, rect, range);

  if (cusp) drawPoint(ctxCoeff, cusp.p.x, cusp.p.y, "#6d73c9", "3\u91cd");

}



function drawQuarticDiscriminantSurface(rect) {

  const range = coeffRange();

  const { a, b } = app.coeffs;

  const bValues = rangeValues(-range, range, 0.12);

  const rValues = rangeValues(-1.9, 1.9, 0.045);

  const surface = bValues.map((b0) => rValues.map((r) => quarticParametricPoint(a, b0, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(178, 151, 216, 0.24)", "rgba(145, 116, 195, 0.25)");

  drawSurfaceMesh(surface, 7, "rgba(109, 115, 201, 0.24)");

  drawQuarticSliceCurve(rect, a, b, range);


  ctxCoeff.restore();

}



function drawQuarticSliceCurve(rect, a, b, range) {

  ctxCoeff.strokeStyle = "#4fa6b7";

  ctxCoeff.lineWidth = 2.8;

  ctxCoeff.beginPath();

  let started = false;

  for (let r = -2.1; r <= 2.1; r += 0.01) {

    const item = quarticParametricPoint(a, b, r, rect, range);

    if (!item) {

      started = false;

      continue;

    }

    if (!started) {

      ctxCoeff.moveTo(item.p.x, item.p.y);

      started = true;

    } else ctxCoeff.lineTo(item.p.x, item.p.y);

  }

  ctxCoeff.stroke();

}



function snapQuarticIfClose() {

  if (!app.showDiscriminant) return;

  const rect = coefficientRect();

  const { a, b } = app.coeffs;

  const current = projectBCD(b, app.coeffs.c, app.coeffs.d, rect);

  let best = null;

  for (let r = -2.1; r <= 2.1; r += 0.01) {

    const item = quarticParametricPoint(a, b, r, rect, coeffRange());

    if (!item) continue;

    const dist = Math.hypot(item.p.x - current.x, item.p.y - current.y);

    if (!best || dist < best.dist) {

      const c = -4 * r ** 3 - 3 * a * r * r - 2 * b * r;

      const d = 3 * r ** 4 + 2 * a * r ** 3 + b * r * r;

      best = { dist, c, d };

    }

  }

  if (best && best.dist <= 11) {

    app.coeffs.c = best.c;

    app.coeffs.d = best.d;

  }

}



function hitCoefficient(px, py) {

  if (app.normalized && app.level === 1) return null;

  const rect = coefficientRect();

  const range = coeffRange();

  if (app.level === 1) return "a";

  if (app.level === 2) return "ab";

  if (app.level === 3 && hitSpaceCorner(px, py, rect, range)) return "rotate";

  if (app.level === 3 && inside(px, py, rect)) return "bc3";

  if (app.level === 4) {

    if (hitSpaceCorner(px, py, rect, range)) return "rotate";

    if (inside(px, py, rect)) return "bc4";

  }

  return null;

}



function updateFromCanvasPoint(px, py) {

  const rect = coefficientRect();

  const range = coeffRange();

  if (app.dragTarget === "rotate") {

    const last = app.lastPointer || { x: px, y: py };

    app.rotation.yaw += (px - last.x) * 0.012;

    app.rotation.pitch = clamp(app.rotation.pitch + (py - last.y) * 0.012, -1.15, 1.15);

    app.lastPointer = { x: px, y: py };

    render();

    return;

  }

  if (app.dragTarget === "a") {

    const v = unmap2D(px, py, rect, range);

    app.coeffs.a = clamp(v.x, -range, range);

  }

  if (app.dragTarget === "ab") {

    const v = unmap2D(px, py, rect, range);

    app.coeffs.a = app.normalized ? 0 : clamp(v.x, -range, range);

    app.coeffs.b = clamp(v.y, -range, range);

    snapQuadraticIfClose();

  }

  if (app.dragTarget === "bc3") {

    const v = unprojectFixedX(px, py, app.coeffs.a, rect, range);

    app.coeffs.b = clamp(v.y, -range, range);

    app.coeffs.c = clamp(v.z, -range, range);

    snapCubicIfClose();

  }

  if (app.dragTarget === "bc4") {

    const v = unprojectFixedX(px, py, app.coeffs.b, rect, range);

    app.coeffs.c = clamp(v.y, -range, range);

    app.coeffs.d = clamp(v.z, -range, range);

    snapQuarticIfClose();

  }

  applyNormalization();

  app.lastPointer = { x: px, y: py };

  render();

}



function drawGraph() {

  const w = els.graphCanvas.clientWidth;

  const h = els.graphCanvas.clientHeight;

  ctxGraph.clearRect(0, 0, w, h);

  const rect = { x: 54, y: 36, w: w - 94, h: h - 86 };

  const xRange = app.level === 4 ? 2.4 : 2.8;

  const yRange = app.level === 4 ? 8 : 6;

  drawGraphGrid(ctxGraph, rect, xRange, yRange);

  drawPolynomialCurve(rect, xRange, yRange);

  const roots = realRoots(getCoefficients()).filter((r) => Math.abs(r) <= xRange);

  roots.forEach((r) => {

    const p = graphMap(r, 0, rect, xRange, yRange);

    drawPoint(ctxGraph, p.x, p.y, "#e9a94f", format(r));

  });

  els.rootSummary.textContent = `\u30b0\u30e9\u30d5\u306e\u96f6\u70b9\uff08\u65b9\u7a0b\u5f0f\u306e\u89e3\uff09: ${roots.length ? roots.map(format).join(", ") : "\u5b9f\u6570\u96f6\u70b9\u306a\u3057"}`;

  els.solutionBadge.textContent = classify();

}



function classify() {

  const { a, b, c } = app.coeffs;

  if (app.level === 1) return "\u89e3\u306f\u3044\u3064\u3082 1 \u3064";

  if (app.level === 2) {

    const disc = a * a - 4 * b;

    if (Math.abs(disc) < EPS) return "\u91cd\u89e3 1 \u3064";

    return disc > 0 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3 2 \u3064" : "\u7570\u306a\u308b\u8907\u7d20\u6570\u89e3 2 \u3064";

  }

  if (app.level === 3) {

    const delta = cubicDiscriminant(a, b, c);

    const p = b - (a * a) / 3;

    const q = (2 * a ** 3) / 27 - (a * b) / 3 + c;

    if (Math.abs(p) < 0.015 && Math.abs(q) < 0.015) return "3\u91cd\u89e3";

    if (Math.abs(delta) < 0.02) return "2\u91cd\u89e3";

    return delta > 0 ? "\u5b9f\u6570\u89e3 3 \u3064" : "\u5b9f\u6570\u89e3 1 \u3064";

  }

  return classifyQuartic();

}



function classifyQuartic() {

  const roots = durandKerner(getCoefficients());

  const clusters = clusterComplex(roots);

  const realClusters = clusters.filter((cl) => Math.abs(cl.z.im) < 1e-4);

  const mults = clusters.map((cl) => cl.count).sort((a, b) => b - a);

  if (mults[0] === 4) return "4\u91cd\u89e3";

  if (mults[0] === 3) return "3\u91cd\u89e3\u3068\u5358\u6839 1 \u3064";

  if (mults[0] === 2 && mults[1] === 2) return realClusters.length === 2 ? "\u5b9f 2\u91cd\u89e3 2 \u3064" : "\u8907\u7d20 2\u91cd\u89e3 2 \u3064";

  if (mults[0] === 2) return "2\u91cd\u89e3\u3068\u5358\u6839 2 \u3064";

  const realCount = roots.filter((z) => Math.abs(z.im) < 1e-5).length;

  return realCount >= 4 ? "\u5b9f\u6570\u89e3 4 \u3064" : "\u5b9f\u6570\u89e3 2 \u3064\u3068\u8907\u7d20\u6570\u89e3 2 \u3064";

}



const MATH_FONT = "'Neo Euler', 'Euler Math', Euler, 'Latin Modern Math', 'Cambria Math', 'Times New Roman', serif";



function levelFormulaHTML(level = app.level) {

  const formulas = {

    1: '<span class="math">y = x + a</span>',

    2: '<span class="math">y = x<sup>2</sup> + ax + b</span>',

    3: '<span class="math">y = x<sup>3</sup> + ax<sup>2</sup> + bx + c</span>',

    4: '<span class="math">y = x<sup>4</sup> + ax<sup>3</sup> + bx<sup>2</sup> + cx + d</span>',

  };

  return formulas[level];

}



function updateLabels() {
  const names = {
    1: "1????",
    2: "2????",
    3: "3????",
    4: "4????",
  };
  const normalizeLabels = {
    1: "??????????",
    2: "??????????",
    3: "??????????",
    4: "??????????",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "??????";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} ????`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "????????????????????????";
}

function drawLevel2Coeff() {

  const rect = coefficientRect();

  drawGrid(ctxCoeff, rect, coeffRange());

  if (app.showDiscriminant) {

    ctxCoeff.save();

    ctxCoeff.strokeStyle = "#db5f7a";

    ctxCoeff.lineWidth = 3;

    ctxCoeff.beginPath();

    let started = false;

    for (let a = -3; a <= 3; a += 0.02) {

      const b = (a * a) / 4;

      if (Math.abs(b) > 3) continue;

      const p = map2D(a, b, rect);

      if (!started) {

        ctxCoeff.moveTo(p.x, p.y);

        started = true;

      } else ctxCoeff.lineTo(p.x, p.y);

    }

    ctxCoeff.stroke();


    ctxCoeff.restore();

  }

  const p = map2D(app.coeffs.a, app.coeffs.b, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a", "(a,b)");

  labelAxes("a", "b", rect);

}



function drawCubicDiscriminantSurface(rect) {

  const range = coeffRange();

  const aValues = rangeValues(-range, range, 0.12);

  const rValues = rangeValues(-2.2, 2.2, 0.055);

  const surface = aValues.map((a) => rValues.map((r) => cubicParametricPoint(a, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(120, 200, 190, 0.22)", "rgba(90, 174, 165, 0.24)");

  drawSurfaceMesh(surface, 6, "rgba(92, 148, 166, 0.28)");

  drawCubicSliceCurve(rect, app.coeffs.a, range);


  ctxCoeff.restore();

}



function drawQuarticDiscriminantSurface(rect) {

  const range = coeffRange();

  const { a, b } = app.coeffs;

  const bValues = rangeValues(-range, range, 0.12);

  const rValues = rangeValues(-1.9, 1.9, 0.045);

  const surface = bValues.map((b0) => rValues.map((r) => quarticParametricPoint(a, b0, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(178, 151, 216, 0.24)", "rgba(145, 116, 195, 0.25)");

  drawSurfaceMesh(surface, 7, "rgba(109, 115, 201, 0.24)");

  drawQuarticSliceCurve(rect, a, b, range);


  ctxCoeff.restore();

}



function drawPoint(ctx, x, y, color, label) {

  ctx.save();

  ctx.shadowColor = color;

  ctx.shadowBlur = 14;

  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.arc(x, y, 7, 0, Math.PI * 2);

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#3d2f3d";

  ctx.font = `12px ${MATH_FONT}`;

  ctx.fillText(label, x + 11, y - 10);

  ctx.restore();

}



function drawGraphGrid(ctx, rect, xRange, yRange) {

  ctx.save();

  ctx.strokeStyle = "#f2dce8";

  for (let x = Math.ceil(-xRange); x <= Math.floor(xRange); x++) {

    const p1 = graphMap(x, -yRange, rect, xRange, yRange);

    const p2 = graphMap(x, yRange, rect, xRange, yRange);

    line(ctx, p1.x, p1.y, p2.x, p2.y);

  }

  for (let y = Math.ceil(-yRange); y <= Math.floor(yRange); y++) {

    const p1 = graphMap(-xRange, y, rect, xRange, yRange);

    const p2 = graphMap(xRange, y, rect, xRange, yRange);

    line(ctx, p1.x, p1.y, p2.x, p2.y);

  }

  const ox1 = graphMap(-xRange, 0, rect, xRange, yRange);

  const ox2 = graphMap(xRange, 0, rect, xRange, yRange);

  const oy1 = graphMap(0, -yRange, rect, xRange, yRange);

  const oy2 = graphMap(0, yRange, rect, xRange, yRange);

  ctx.strokeStyle = "#d2a8c6";

  ctx.lineWidth = 1.4;

  line(ctx, ox1.x, ox1.y, ox2.x, ox2.y);

  line(ctx, oy1.x, oy1.y, oy2.x, oy2.y);

  ctx.fillStyle = "#7b6678";

  ctx.font = `13px ${MATH_FONT}`;

  ctx.fillText("x", ox2.x - 12, ox2.y - 8);

  ctx.fillText("y", oy2.x + 8, oy2.y + 14);

  ctx.restore();

}



function labelAxes(xLabel, yLabel, rect) {

  const ox = map2D(0, 0, rect, coeffRange());

  ctxCoeff.save();

  ctxCoeff.fillStyle = "#7b6678";

  ctxCoeff.font = `13px ${MATH_FONT}`;

  ctxCoeff.fillText(xLabel, rect.x + rect.w - 14, ox.y - 8);

  ctxCoeff.fillText(yLabel, ox.x + 8, rect.y + 14);

  ctxCoeff.restore();

}






const JP_FONT = "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', Meiryo, 'Segoe UI', sans-serif";



function updateLabels() {
  const names = {
    1: "1????",
    2: "2????",
    3: "3????",
    4: "4????",
  };
  const normalizeLabels = {
    1: "??????????",
    2: "??????????",
    3: "??????????",
    4: "??????????",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "??????";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} ????`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "????????????????????????";
}

function drawLevel1Coeff() {

  const rect = coefficientRect();

  const range = coeffRange();

  const y = rect.y + rect.h / 2;

  ctxCoeff.save();

  ctxCoeff.strokeStyle = "#d2a8c6";

  ctxCoeff.lineWidth = 1.4;

  line(ctxCoeff, rect.x, y, rect.x + rect.w, y);

  ctxCoeff.strokeStyle = "#f2dce8";

  ctxCoeff.lineWidth = 1;

  ctxCoeff.fillStyle = "#7b6678";

  ctxCoeff.font = `12px ${MATH_FONT}`;

  for (let i = -range; i <= range; i++) {

    const x = map2D(i, 0, rect, range).x;

    line(ctxCoeff, x, y - 6, x, y + 6);

    ctxCoeff.fillText(String(i), x - 5, y + 22);

  }

  const x = map2D(app.coeffs.a, 0, rect, range).x;

  drawPoint(ctxCoeff, x, y, app.normalized ? "#e9a94f" : "#db5f7a", "a");

  ctxCoeff.fillStyle = "#7b6678";

  ctxCoeff.font = `13px ${MATH_FONT}`;

  ctxCoeff.fillText("a", rect.x + rect.w - 12, y - 10);

  ctxCoeff.restore();

}



function drawLevel2Coeff() {

  const rect = coefficientRect();

  drawGrid(ctxCoeff, rect, coeffRange());

  if (app.showDiscriminant) {

    ctxCoeff.save();

    ctxCoeff.strokeStyle = "#db5f7a";

    ctxCoeff.lineWidth = 3;

    ctxCoeff.beginPath();

    let started = false;

    for (let a = -3; a <= 3; a += 0.02) {

      const b = (a * a) / 4;

      if (Math.abs(b) > 3) continue;

      const p = map2D(a, b, rect);

      if (!started) {

        ctxCoeff.moveTo(p.x, p.y);

        started = true;

      } else ctxCoeff.lineTo(p.x, p.y);

    }

    ctxCoeff.stroke();

    ctxCoeff.restore();

  }

  const p = map2D(app.coeffs.a, app.coeffs.b, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a", "(a,b)");

  labelAxes("a", "b", rect);

}



function drawCubicDiscriminantSurface(rect) {

  const range = coeffRange();

  const aValues = rangeValues(-range, range, 0.12);

  const rValues = rangeValues(-2.2, 2.2, 0.055);

  const surface = aValues.map((a) => rValues.map((r) => cubicParametricPoint(a, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(120, 200, 190, 0.22)", "rgba(90, 174, 165, 0.24)");

  drawSurfaceMesh(surface, 6, "rgba(92, 148, 166, 0.28)");

  drawCubicSliceCurve(rect, app.coeffs.a, range);

  ctxCoeff.restore();

}



function drawQuarticDiscriminantSurface(rect) {

  const range = coeffRange();

  const { a, b } = app.coeffs;

  const bValues = rangeValues(-range, range, 0.12);

  const rValues = rangeValues(-1.9, 1.9, 0.045);

  const surface = bValues.map((b0) => rValues.map((r) => quarticParametricPoint(a, b0, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, "rgba(178, 151, 216, 0.24)", "rgba(145, 116, 195, 0.25)");

  drawSurfaceMesh(surface, 7, "rgba(109, 115, 201, 0.24)");

  drawQuarticSliceCurve(rect, a, b, range);

  ctxCoeff.restore();

}



function updateFromCanvasPoint(px, py) {

  const rect = coefficientRect();

  const range = coeffRange();

  if (app.dragTarget === "rotate") {

    const last = app.lastPointer || { x: px, y: py };

    app.rotation.yaw += (px - last.x) * 0.012;

    app.rotation.pitch = clamp(app.rotation.pitch + (py - last.y) * 0.012, -1.15, 1.15);

    app.lastPointer = { x: px, y: py };

    render();

    return;

  }

  if (app.dragTarget === "a") {

    const v = unmap2D(px, py, rect, range);

    app.coeffs.a = clamp(v.x, -range, range);

  }

  if (app.dragTarget === "ab") {

    const v = unmap2D(px, py, rect, range);

    app.coeffs.a = app.normalized ? 0 : clamp(v.x, -range, range);

    app.coeffs.b = clamp(v.y, -range, range);

    if (app.showDiscriminant) snapQuadraticIfClose();

  }

  if (app.dragTarget === "bc3") {

    const v = unprojectFixedX(px, py, app.coeffs.a, rect, range);

    app.coeffs.b = clamp(v.y, -range, range);

    app.coeffs.c = clamp(v.z, -range, range);

    if (app.showDiscriminant) snapCubicIfClose();

  }

  if (app.dragTarget === "bc4") {

    const v = unprojectFixedX(px, py, app.coeffs.b, rect, range);

    app.coeffs.c = clamp(v.y, -range, range);

    app.coeffs.d = clamp(v.z, -range, range);

    if (app.showDiscriminant) snapQuarticIfClose();

  }

  applyNormalization();

  app.lastPointer = { x: px, y: py };

  render();

}



function drawGraph() {

  const w = els.graphCanvas.clientWidth;

  const h = els.graphCanvas.clientHeight;

  ctxGraph.clearRect(0, 0, w, h);

  const rect = { x: 54, y: 36, w: w - 94, h: h - 86 };

  const xRange = app.level === 4 ? 2.4 : 2.8;

  const yRange = app.level === 4 ? 8 : 6;

  drawGraphGrid(ctxGraph, rect, xRange, yRange);

  drawPolynomialCurve(rect, xRange, yRange);

  const roots = realRoots(getCoefficients()).filter((r) => Math.abs(r) <= xRange);

  roots.forEach((r) => {

    const p = graphMap(r, 0, rect, xRange, yRange);

    drawPoint(ctxGraph, p.x, p.y, "#e9a94f", format(r));

  });

  els.rootSummary.textContent = "";

  els.solutionBadge.textContent = classify();

}



function classify() {

  const roots = realRoots(getCoefficients());

  if (app.level === 1) return "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (app.level === 2) {

    const disc = app.coeffs.a * app.coeffs.a - 4 * app.coeffs.b;

    if (Math.abs(disc) < EPS) return "\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

    return disc > 0 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  }

  if (app.level === 3) {

    const { a, b, c } = app.coeffs;

    const delta = cubicDiscriminant(a, b, c);

    const p = b - (a * a) / 3;

    const q = (2 * a ** 3) / 27 - (a * b) / 3 + c;

    if (Math.abs(p) < 0.015 && Math.abs(q) < 0.015) return "3\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

    if (Math.abs(delta) < 0.02) return "\u91cd\u89e3\u3092\u3082\u3064\u89e3\u306e\u914d\u7f6e\u3067\u3059\u3002";

    return delta > 0 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 3 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  }

  return classifyQuartic();

}



function classifyQuartic() {

  const roots = durandKerner(getCoefficients());

  const clusters = clusterComplex(roots);

  const realClusters = clusters.filter((cl) => Math.abs(cl.z.im) < 1e-4);

  const realCount = realClusters.reduce((sum, cl) => sum + cl.count, 0);

  const mults = clusters.map((cl) => cl.count).sort((a, b) => b - a);

  if (mults[0] === 4) return "4\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (mults[0] === 3) return "3\u91cd\u89e3\u3068\u5358\u6839\u3092\u3082\u3064\u89e3\u306e\u914d\u7f6e\u3067\u3059\u3002";

  if (mults[0] === 2 && mults[1] === 2) return realClusters.length === 2 ? "2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u8907\u7d20\u306e 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (mults[0] === 2) return "\u91cd\u89e3\u3092\u3082\u3064\u89e3\u306e\u914d\u7f6e\u3067\u3059\u3002";

  if (realCount === 4) return "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (realCount === 2) return "\u5b9f\u6570\u89e3\u304c 2 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  return "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";

}



function drawPoint(ctx, x, y, color, label) {

  ctx.save();

  ctx.shadowColor = color;

  ctx.shadowBlur = 14;

  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.arc(x, y, 7, 0, Math.PI * 2);

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#3d2f3d";

  ctx.font = `12px ${MATH_FONT}`;

  ctx.fillText(label, x + 11, y - 10);

  ctx.restore();

}






const coeffRanges = {

  a: document.getElementById("range-a"),

  b: document.getElementById("range-b"),

  c: document.getElementById("range-c"),

  d: document.getElementById("range-d"),

};



Object.entries(coeffRanges).forEach(([key, input]) => {

  input.addEventListener("input", () => {

    app.coeffs[key] = Number(input.value);

    applyNormalization();

    render();

  });

});



function updateLabels() {
  const names = {
    1: "1????",
    2: "2????",
    3: "3????",
    4: "4????",
  };
  const normalizeLabels = {
    1: "??????????",
    2: "??????????",
    3: "??????????",
    4: "??????????",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "??????";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} ????`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "????????????????????????";
}

function syncSlider() {

  const range = coeffRange();

  els.aSlider.min = String(-range);

  els.aSlider.max = String(range);

  els.aSlider.value = String(clamp(app.coeffs.a, -range, range));

  els.bSlider.min = String(-range);

  els.bSlider.max = String(range);

  els.bSlider.value = String(clamp(app.coeffs.b, -range, range));

}



function syncNumberInputs() {

  const active = { a: true, b: app.level >= 2, c: app.level >= 3, d: app.level >= 4 };

  Object.entries(els.inputs).forEach(([key, input]) => {

    const label = input.parentElement;

    const rangeInput = coeffRanges[key];

    label.classList.toggle("hidden", !active[key]);

    input.disabled = !active[key] || (key === "a" && app.normalized);

    input.value = format(app.coeffs[key]);

    rangeInput.disabled = input.disabled;

    rangeInput.min = String(-coeffRange());

    rangeInput.max = String(coeffRange());

    rangeInput.value = String(clamp(app.coeffs[key], -coeffRange(), coeffRange()));

  });

}



function updateReadout() {

  els.coeffReadout.textContent = "";

}



function drawGrid(ctx, rect, range) {

  ctx.save();

  const ox = map2D(0, 0, rect, range);

  ctx.strokeStyle = "#d2a8c6";

  ctx.lineWidth = 1.4;

  line(ctx, rect.x, ox.y, rect.x + rect.w, ox.y);

  line(ctx, ox.x, rect.y, ox.x, rect.y + rect.h);

  ctx.fillStyle = "#7b6678";

  ctx.font = `12px ${MATH_FONT}`;

  ctx.fillText("0", ox.x + 6, ox.y - 6);

  ctx.restore();

}



function drawPlanePolygon(pts) {

  ctxCoeff.save();

  ctxCoeff.fillStyle = "rgba(141, 210, 203, 0.14)";

  ctxCoeff.strokeStyle = "rgba(92, 181, 173, 0.62)";

  ctxCoeff.lineWidth = 2;

  ctxCoeff.beginPath();

  pts.forEach((p, i) => (i === 0 ? ctxCoeff.moveTo(p.x, p.y) : ctxCoeff.lineTo(p.x, p.y)));

  ctxCoeff.closePath();

  ctxCoeff.fill();

  ctxCoeff.stroke();

  ctxCoeff.restore();

}



function drawLevel1Coeff() {

  const rect = coefficientRect();

  const range = coeffRange();

  const y = rect.y + rect.h / 2;

  ctxCoeff.save();

  ctxCoeff.strokeStyle = "#d2a8c6";

  ctxCoeff.lineWidth = 1.4;

  line(ctxCoeff, rect.x, y, rect.x + rect.w, y);

  ctxCoeff.strokeStyle = "#f2dce8";

  ctxCoeff.lineWidth = 1;

  ctxCoeff.fillStyle = "#7b6678";

  ctxCoeff.font = `12px ${MATH_FONT}`;

  for (let i = -range; i <= range; i++) {

    const x = map2D(i, 0, rect, range).x;

    line(ctxCoeff, x, y - 6, x, y + 6);

    ctxCoeff.fillText(String(i), x - 5, y + 22);

  }

  const x = map2D(app.coeffs.a, 0, rect, range).x;

  drawPoint(ctxCoeff, x, y, app.normalized ? "#e9a94f" : "#db5f7a");

  ctxCoeff.restore();

}



function drawLevel2Coeff() {

  const rect = coefficientRect();

  drawGrid(ctxCoeff, rect, coeffRange());

  if (app.showDiscriminant) {

    ctxCoeff.save();

    ctxCoeff.strokeStyle = "#db5f7a";

    ctxCoeff.lineWidth = 3;

    ctxCoeff.beginPath();

    let started = false;

    for (let a = -3; a <= 3; a += 0.02) {

      const b = (a * a) / 4;

      if (Math.abs(b) > 3) continue;

      const p = map2D(a, b, rect);

      if (!started) {

        ctxCoeff.moveTo(p.x, p.y);

        started = true;

      } else ctxCoeff.lineTo(p.x, p.y);

    }

    ctxCoeff.stroke();

    ctxCoeff.restore();

  }

  const p = map2D(app.coeffs.a, app.coeffs.b, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a");

  labelAxes("a", "b", rect);

}



function drawLevel3Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["a", "b", "c"], coeffRange());

  drawABCPlane(rect);

  if (app.showDiscriminant) drawCubicDiscriminantSurface(rect);

  const p = projectABC(app.coeffs.a, app.coeffs.b, app.coeffs.c, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a");

}



function drawLevel4Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["b", "c", "d"], coeffRange());

  drawBCDPlane(rect);

  if (app.showDiscriminant) drawQuarticDiscriminantSurface(rect);

  const p = projectBCD(app.coeffs.b, app.coeffs.c, app.coeffs.d, rect);

  drawPoint(ctxCoeff, p.x, p.y, "#db5f7a");

}



function drawPoint(ctx, x, y, color) {

  ctx.save();

  ctx.shadowColor = color;

  ctx.shadowBlur = 14;

  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.arc(x, y, 7, 0, Math.PI * 2);

  ctx.fill();

  ctx.restore();

}



function realRoots(coeffs) {

  const degree = coeffs.length - 1;

  if (degree === 1) return [-coeffs[1] / coeffs[0]];

  const roots = [];

  const min = -12;

  const max = 12;

  const step = 0.01;

  let x0 = min;

  let y0 = polyValue(coeffs, x0);

  for (let x = min + step; x <= max + step / 2; x += step) {

    const y = polyValue(coeffs, x);

    if (Math.abs(y) < 1e-8) roots.push(refineRootNear(coeffs, x, step));

    if (y0 === 0 || y === 0 || y0 * y < 0) roots.push(bisect(coeffs, x0, x));

    x0 = x;

    y0 = y;

  }

  criticalPoints(coeffs).forEach((x) => {

    if (x > min && x < max && Math.abs(polyValue(coeffs, x)) < 1e-5) roots.push(refineRootNear(coeffs, x, 0.08));

  });

  durandKerner(coeffs).forEach((z) => {

    if (Math.abs(z.im) < 1e-6 && z.re > min && z.re < max && Math.abs(polyValue(coeffs, z.re)) < 1e-5) {

      roots.push(refineRootNear(coeffs, z.re, 0.08));

    }

  });

  return uniqueSorted(roots).filter((x) => Math.abs(polyValue(coeffs, x)) < 1e-4);

}



function refineRootNear(coeffs, guess, radius) {

  let x = guess;

  for (let i = 0; i < 16; i++) {

    const f = polyValue(coeffs, x);

    const df = derivativeValue(coeffs, x);

    if (Math.abs(df) < 1e-10) break;

    const next = x - f / df;

    if (!Number.isFinite(next) || Math.abs(next - guess) > radius * 2) break;

    x = next;

  }

  let best = x;

  let left = guess - radius;

  let right = guess + radius;

  const phi = (Math.sqrt(5) - 1) / 2;

  let c = right - phi * (right - left);

  let d = left + phi * (right - left);

  for (let i = 0; i < 80; i++) {

    if (Math.abs(polyValue(coeffs, c)) < Math.abs(polyValue(coeffs, d))) {

      right = d;

      d = c;

      c = right - phi * (right - left);

    } else {

      left = c;

      c = d;

      d = left + phi * (right - left);

    }

  }

  const minimized = (left + right) / 2;

  if (Math.abs(polyValue(coeffs, minimized)) < Math.abs(polyValue(coeffs, best))) best = minimized;

  return Math.abs(best) < 1e-8 ? 0 : best;

}



function derivativeValue(coeffs, x) {

  const n = coeffs.length - 1;

  let acc = 0;

  for (let i = 0; i < coeffs.length - 1; i++) acc = acc * x + coeffs[i] * (n - i);

  return acc;

}



function derivativeCoefficients(coeffs) {

  const n = coeffs.length - 1;

  return coeffs.slice(0, -1).map((c, i) => c * (n - i));

}



function rootMultiplicity(coeffs, root) {

  let d = coeffs.slice();

  let multiplicity = 0;

  const tolerance = 2e-4;

  while (d.length > 1 && Math.abs(polyValue(d, root)) < tolerance) {

    multiplicity += 1;

    d = derivativeCoefficients(d);

  }

  return Math.max(1, multiplicity);

}



function realRootsWithMultiplicity(coeffs) {

  return realRoots(coeffs).map((root) => ({ root, multiplicity: rootMultiplicity(coeffs, root) }));

}



function drawGraphGrid(ctx, rect, xRange, yRange) {

  ctx.save();

  const ox1 = graphMap(-xRange, 0, rect, xRange, yRange);

  const ox2 = graphMap(xRange, 0, rect, xRange, yRange);

  const oy1 = graphMap(0, -yRange, rect, xRange, yRange);

  const oy2 = graphMap(0, yRange, rect, xRange, yRange);

  ctx.strokeStyle = "#d2a8c6";

  ctx.lineWidth = 1.4;

  line(ctx, ox1.x, ox1.y, ox2.x, ox2.y);

  line(ctx, oy1.x, oy1.y, oy2.x, oy2.y);

  ctx.fillStyle = "#7b6678";

  ctx.font = `13px ${MATH_FONT}`;

  ctx.fillText("x", ox2.x - 12, ox2.y - 8);

  ctx.fillText("y", oy2.x + 8, oy2.y + 14);

  ctx.restore();

}



function drawGraph() {

  const w = els.graphCanvas.clientWidth;

  const h = els.graphCanvas.clientHeight;

  ctxGraph.clearRect(0, 0, w, h);

  const rect = { x: 54, y: 36, w: w - 94, h: h - 86 };

  const xRange = app.level === 4 ? 3.2 : 3.4;

  const yRange = app.level === 4 ? 10 : 8;

  drawGraphGrid(ctxGraph, rect, xRange, yRange);

  drawPolynomialCurve(rect, xRange, yRange);

  const roots = realRoots(getCoefficients()).filter((r) => Math.abs(r) <= xRange);

  roots.forEach((r) => {

    const p = graphMap(r, 0, rect, xRange, yRange);

    drawPoint(ctxGraph, p.x, p.y, "#e9a94f");

  });

  els.rootSummary.textContent = "";

  els.solutionBadge.textContent = classify();

}



function classify() {

  if (app.level === 1) return "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (app.level === 2) {

    const disc = app.coeffs.a * app.coeffs.a - 4 * app.coeffs.b;

    if (Math.abs(disc) < EPS) return "\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

    return disc > 0 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  }

  if (app.level === 3) {

    const roots = realRootsWithMultiplicity(getCoefficients());

    const realTotal = roots.reduce((sum, item) => sum + item.multiplicity, 0);

    const maxMultiplicity = roots.reduce((max, item) => Math.max(max, item.multiplicity), 1);

    if (maxMultiplicity === 3) return "3\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

    if (maxMultiplicity === 2) return "\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

    return realTotal === 3 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 3 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  }

  return classifyQuartic();

}



function classifyQuartic() {

  const roots = realRootsWithMultiplicity(getCoefficients());

  const realTotal = roots.reduce((sum, item) => sum + item.multiplicity, 0);

  const mults = roots.map((item) => item.multiplicity).sort((a, b) => b - a);

  const complexTotal = 4 - realTotal;

  if (mults[0] === 4) return "4\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (mults[0] === 3) return "3\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (mults[0] === 2 && mults[1] === 2) return "2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (mults[0] === 2) {

    if (complexTotal === 0) return "\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

    return "\u91cd\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  }

  if (realTotal === 4) return "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";

  if (realTotal === 2) return "\u5b9f\u6570\u89e3\u304c 2 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";

  return "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";

}



const STRATA_COLORS = {

  selected: "#d1495b",

  curve: "#247ba0",

  roots: "#f2a541",

  cubicMain: "rgba(47, 154, 167, 0.25)",

  cubicMainStroke: "rgba(47, 154, 167, 0.34)",

  cubicTriple: "#7b2cbf",

  quarticRealSimple: "rgba(42, 157, 143, 0.27)",

  quarticComplexSimple: "rgba(231, 111, 81, 0.25)",

  quarticTriple: "#6a4c93",

  quarticRealDouble: "#0b7285",

  quarticComplexDouble: "#c44569",

  quarticQuadruple: "#1d3557",

  mesh: "rgba(63, 73, 99, 0.22)",

};



function updateLabels() {
  const names = {
    1: "1????",
    2: "2????",
    3: "3????",
    4: "4????",
  };
  const normalizeLabels = {
    1: "??????????",
    2: "??????????",
    3: "??????????",
    4: "??????????",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "??????";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} ????`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "????????????????????????";
}

function drawLevel1Coeff() {

  const rect = coefficientRect();

  const range = coeffRange();

  const y = rect.y + rect.h / 2;

  ctxCoeff.save();

  ctxCoeff.strokeStyle = "#c9b7d8";

  ctxCoeff.lineWidth = 1.4;

  line(ctxCoeff, rect.x, y, rect.x + rect.w, y);

  ctxCoeff.strokeStyle = "#e9e1ef";

  ctxCoeff.lineWidth = 1;

  ctxCoeff.fillStyle = "#6f6577";

  ctxCoeff.font = `12px ${MATH_FONT}`;

  for (let i = -range; i <= range; i++) {

    const x = map2D(i, 0, rect, range).x;

    line(ctxCoeff, x, y - 6, x, y + 6);

    ctxCoeff.fillText(String(i), x - 5, y + 22);

  }

  const x = map2D(app.coeffs.a, 0, rect, range).x;

  drawPoint(ctxCoeff, x, y, STRATA_COLORS.selected);

  ctxCoeff.restore();

}



function drawLevel2Coeff() {

  const rect = coefficientRect();

  drawGrid(ctxCoeff, rect, coeffRange());

  if (app.showDiscriminant) {

    ctxCoeff.save();

    ctxCoeff.strokeStyle = STRATA_COLORS.selected;

    ctxCoeff.lineWidth = 3;

    ctxCoeff.beginPath();

    let started = false;

    for (let a = -4.5; a <= 4.5; a += 0.02) {

      const b = (a * a) / 4;

      if (Math.abs(b) > coeffRange()) continue;

      const p = map2D(a, b, rect);

      if (!started) {

        ctxCoeff.moveTo(p.x, p.y);

        started = true;

      } else ctxCoeff.lineTo(p.x, p.y);

    }

    ctxCoeff.stroke();

    ctxCoeff.restore();

  }

  const p = map2D(app.coeffs.a, app.coeffs.b, rect);

  drawPoint(ctxCoeff, p.x, p.y, STRATA_COLORS.selected);

  labelAxes("a", "b", rect);

}



function drawLevel3Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["a", "b", "c"], coeffRange());

  drawABCPlane(rect);

  if (app.showStrata) drawCubicStrata(rect);

  else if (app.showDiscriminant) drawCubicDiscriminantSurface(rect);

  const p = projectABC(app.coeffs.a, app.coeffs.b, app.coeffs.c, rect);

  drawPoint(ctxCoeff, p.x, p.y, STRATA_COLORS.selected);

}



function drawLevel4Coeff() {

  const rect = coefficientRect();

  drawSpaceBox(rect, ["b", "c", "d"], coeffRange());

  drawBCDPlane(rect);

  if (app.showStrata) drawQuarticStrata(rect);

  else if (app.showDiscriminant) drawQuarticDiscriminantSurface(rect);

  const p = projectBCD(app.coeffs.b, app.coeffs.c, app.coeffs.d, rect);

  drawPoint(ctxCoeff, p.x, p.y, STRATA_COLORS.selected);

}



function drawCubicStrata(rect) {

  const range = coeffRange();

  const aValues = rangeValues(-range, range, 0.13);

  const rValues = rangeValues(-2.55, 2.55, 0.06);

  const surface = aValues.map((a) => rValues.map((r) => cubicParametricPoint(a, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatches(surface, STRATA_COLORS.cubicMain, STRATA_COLORS.cubicMainStroke);

  drawSurfaceMesh(surface, 7, STRATA_COLORS.mesh);

  drawCubicTripleCurve(rect, range);

  drawCubicSliceCurve(rect, app.coeffs.a, range);

  ctxCoeff.restore();

}



function drawCubicTripleCurve(rect, range) {

  ctxCoeff.save();

  ctxCoeff.strokeStyle = STRATA_COLORS.cubicTriple;

  ctxCoeff.lineWidth = 4;

  ctxCoeff.beginPath();

  let started = false;

  for (let r = -2.2; r <= 2.2; r += 0.01) {

    const a = -3 * r;

    const b = 3 * r * r;

    const c = -r * r * r;

    if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) > range) {

      started = false;

      continue;

    }

    const p = projectABC(a, b, c, rect);

    if (!started) {

      ctxCoeff.moveTo(p.x, p.y);

      started = true;

    } else ctxCoeff.lineTo(p.x, p.y);

  }

  ctxCoeff.stroke();

  const r0 = -app.coeffs.a / 3;

  const marker = cubicParametricPoint(app.coeffs.a, r0, rect, range);

  if (marker) drawPoint(ctxCoeff, marker.p.x, marker.p.y, STRATA_COLORS.cubicTriple);

  ctxCoeff.restore();

}



function drawQuarticStrata(rect) {

  const range = coeffRange();

  const { a } = app.coeffs;

  const bValues = rangeValues(-range, range, 0.14);

  const rValues = rangeValues(-2.45, 2.45, 0.055);

  const surface = bValues.map((b) => rValues.map((r) => quarticStrataSurfacePoint(a, b, r, rect, range)));

  ctxCoeff.save();

  drawSurfacePatchesByStratum(surface, {

    realSimple: [STRATA_COLORS.quarticRealSimple, "rgba(42, 157, 143, 0.20)"],

    complexSimple: [STRATA_COLORS.quarticComplexSimple, "rgba(231, 111, 81, 0.18)"],

  });

  drawSurfaceMesh(surface, 8, STRATA_COLORS.mesh);

  drawQuarticTripleCurve(rect, a, range);

  drawQuarticDoubleDoubleCurves(rect, a, range);

  drawQuarticSliceCurve(rect, a, app.coeffs.b, range);

  drawQuarticQuadruplePoint(rect, a, range);

  ctxCoeff.restore();

}



function quarticStrataSurfacePoint(a, b, r, rect, range) {

  const item = quarticParametricPoint(a, b, r, rect, range);

  if (!item) return null;

  const m = a + 2 * r;

  const n = b + 2 * a * r + 3 * r * r;

  const qDisc = m * m - 4 * n;

  return { ...item, stratum: qDisc >= 0 ? "realSimple" : "complexSimple" };

}



function drawQuarticTripleCurve(rect, a, range) {

  drawParametricSpaceCurve(-2.2, 2.2, 0.01, STRATA_COLORS.quarticTriple, 4, (r) => {

    const b = -3 * a * r - 6 * r * r;

    return quarticParametricPoint(a, b, r, rect, range);

  });

}



function drawQuarticDoubleDoubleCurves(rect, a, range) {

  const split = (3 * a * a) / 8;

  drawParametricSpaceCurve(-range, Math.min(split, range), 0.01, STRATA_COLORS.quarticRealDouble, 3.2, (b) => quarticDoubleDoublePoint(a, b, rect, range));

  drawParametricSpaceCurve(Math.max(split, -range), range, 0.01, STRATA_COLORS.quarticComplexDouble, 3.2, (b) => quarticDoubleDoublePoint(a, b, rect, range));

}



function quarticDoubleDoublePoint(a, b, rect, range) {

  const q = (b - (a * a) / 4) / 2;

  const c = a * q;

  const d = q * q;

  if (Math.max(Math.abs(b), Math.abs(c), Math.abs(d)) > range) return null;

  const p = projectBCD(b, c, d, rect);

  return { p, depth: p.depth };

}



function drawQuarticQuadruplePoint(rect, a, range) {

  const r = -a / 4;

  const b = 6 * r * r;

  const c = -4 * r ** 3;

  const d = r ** 4;

  if (Math.max(Math.abs(b), Math.abs(c), Math.abs(d)) > range) return;

  const p = projectBCD(b, c, d, rect);

  drawPoint(ctxCoeff, p.x, p.y, STRATA_COLORS.quarticQuadruple);

}



function drawParametricSpaceCurve(min, max, step, color, width, pointForValue) {

  ctxCoeff.save();

  ctxCoeff.strokeStyle = color;

  ctxCoeff.lineWidth = width;

  ctxCoeff.beginPath();

  let started = false;

  for (let t = min; t <= max + step / 2; t += step) {

    const item = pointForValue(t);

    if (!item) {

      started = false;

      continue;

    }

    if (!started) {

      ctxCoeff.moveTo(item.p.x, item.p.y);

      started = true;

    } else ctxCoeff.lineTo(item.p.x, item.p.y);

  }

  ctxCoeff.stroke();

  ctxCoeff.restore();

}



function drawSurfacePatchesByStratum(grid, styles) {

  const patches = [];

  for (let i = 0; i < grid.length - 1; i++) {

    for (let j = 0; j < grid[i].length - 1; j++) {

      const quad = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];

      const valid = quad.filter(Boolean);

      if (valid.length >= 3) {

        const counts = valid.reduce((acc, item) => {

          acc[item.stratum] = (acc[item.stratum] || 0) + 1;

          return acc;

        }, {});

        const stratum = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

        patches.push({ quad: valid, stratum, depth: valid.reduce((sum, item) => sum + item.depth, 0) / valid.length });

      }

    }

  }

  patches.sort((a, b) => a.depth - b.depth);

  patches.forEach(({ quad, stratum }) => {

    const [fill, stroke] = styles[stratum];

    ctxCoeff.save();

    ctxCoeff.fillStyle = fill;

    ctxCoeff.strokeStyle = stroke;

    ctxCoeff.lineWidth = 0.45;

    ctxCoeff.beginPath();

    quad.forEach((item, index) => {

      if (index === 0) ctxCoeff.moveTo(item.p.x, item.p.y);

      else ctxCoeff.lineTo(item.p.x, item.p.y);

    });

    ctxCoeff.closePath();

    ctxCoeff.fill();

    ctxCoeff.stroke();

    ctxCoeff.restore();

  });

}



function drawPoint(ctx, x, y, color, label = "") {

  ctx.save();

  ctx.shadowColor = color;

  ctx.shadowBlur = 12;

  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.arc(x, y, 6.5, 0, Math.PI * 2);

  ctx.fill();

  ctx.shadowBlur = 0;

  if (label) {

    ctx.fillStyle = "#3d2f3d";

    ctx.font = `12px ${MATH_FONT}`;

    ctx.fillText(label, x + 10, y - 9);

  }

  ctx.restore();

}



function drawGraph() {

  const w = els.graphCanvas.clientWidth;

  const h = els.graphCanvas.clientHeight;

  ctxGraph.clearRect(0, 0, w, h);

  const rect = { x: 54, y: 36, w: w - 94, h: h - 86 };

  const xRange = app.level === 4 ? 3.2 : 3.4;

  const yRange = app.level === 4 ? 10 : 8;

  drawGraphGrid(ctxGraph, rect, xRange, yRange);

  drawPolynomialCurve(rect, xRange, yRange);

  const roots = realRoots(getCoefficients()).filter((r) => Math.abs(r) <= xRange);

  roots.forEach((r) => {

    const p = graphMap(r, 0, rect, xRange, yRange);

    drawPoint(ctxGraph, p.x, p.y, STRATA_COLORS.roots);

  });

  els.rootSummary.textContent = "";

  els.solutionBadge.textContent = classify();

}



function drawPolynomialCurve(rect, xRange, yRange) {

  ctxGraph.save();

  ctxGraph.beginPath();

  ctxGraph.rect(rect.x, rect.y, rect.w, rect.h);

  ctxGraph.clip();

  ctxGraph.strokeStyle = STRATA_COLORS.curve;

  ctxGraph.lineWidth = 3;

  ctxGraph.beginPath();

  let started = false;

  for (let i = 0; i <= 900; i++) {

    const x = -xRange + (2 * xRange * i) / 900;

    const y = polyValue(getCoefficients(), x);

    if (!Number.isFinite(y) || Math.abs(y) > yRange) {

      started = false;

      continue;

    }

    const p = graphMap(x, y, rect, xRange, yRange);

    if (!started) {

      ctxGraph.moveTo(p.x, p.y);

      started = true;

    } else ctxGraph.lineTo(p.x, p.y);

  }

  ctxGraph.stroke();

  ctxGraph.restore();

}



function hitCoefficient(px, py) {

  if (app.normalized && app.level === 1) return null;

  const rect = coefficientRect();

  if (app.spatialDrag && app.showStrata && app.level === 3 && inside(px, py, rect)) return "space3";

  if (app.spatialDrag && app.showStrata && app.level === 4 && inside(px, py, rect)) return "space4";

  if (app.level === 1) return "a";

  if (app.level === 2) return "ab";

  if (app.level === 3 && hitSpaceCorner(px, py, rect, coeffRange())) return "rotate";

  if (app.level === 3 && inside(px, py, rect)) return "bc3";

  if (app.level === 4) {

    if (hitSpaceCorner(px, py, rect, coeffRange())) return "rotate";

    if (inside(px, py, rect)) return "bc4";

  }

  return null;

}



function updateFromCanvasPoint(px, py) {

  const rect = coefficientRect();

  const range = coeffRange();

  if (app.dragTarget === "rotate") {

    const last = app.lastPointer || { x: px, y: py };

    app.rotation.yaw += (px - last.x) * 0.012;

    app.rotation.pitch = clamp(app.rotation.pitch + (py - last.y) * 0.012, -1.15, 1.15);

    app.lastPointer = { x: px, y: py };

    render();

    return;

  }

  if (app.dragTarget === "space3") {

    moveToNearestCubicSingular(px, py, rect, range);

  } else if (app.dragTarget === "space4") {

    moveToNearestQuarticSingular(px, py, rect, range);

  } else if (app.dragTarget === "a") {

    const v = unmap2D(px, py, rect, range);

    app.coeffs.a = clamp(v.x, -range, range);

  } else if (app.dragTarget === "ab") {

    const v = unmap2D(px, py, rect, range);

    app.coeffs.a = app.normalized ? 0 : clamp(v.x, -range, range);

    app.coeffs.b = clamp(v.y, -range, range);

    if (app.showDiscriminant) snapQuadraticIfClose();

  } else if (app.dragTarget === "bc3") {

    const v = unprojectFixedX(px, py, app.coeffs.a, rect, range);

    app.coeffs.b = clamp(v.y, -range, range);

    app.coeffs.c = clamp(v.z, -range, range);

    if (app.showDiscriminant) snapCubicIfClose();

  } else if (app.dragTarget === "bc4") {

    const v = unprojectFixedX(px, py, app.coeffs.b, rect, range);

    app.coeffs.c = clamp(v.y, -range, range);

    app.coeffs.d = clamp(v.z, -range, range);

    if (app.showDiscriminant) snapQuarticIfClose();

  }

  if (app.dragTarget !== "space3") applyNormalization();

  app.lastPointer = { x: px, y: py };

  render();

}



function moveToNearestCubicSingular(px, py, rect, range) {

  let best = null;

  const limit = Math.sqrt(range / 3);

  for (let r = -limit; r <= limit + 0.001; r += 0.006) {

    const a = -3 * r;

    const b = 3 * r * r;

    const c = -r * r * r;

    const p = projectABC(a, b, c, rect);

    const dist = Math.hypot(px - p.x, py - p.y);

    if (!best || dist < best.dist) best = { dist, a, b, c };

  }

  if (!best) return;

  app.coeffs.a = best.a;

  app.coeffs.b = best.b;

  app.coeffs.c = best.c;

}



function moveToNearestQuarticSingular(px, py, rect, range) {

  let best = null;

  const consider = (item, coeffs) => {

    if (!item) return;

    const dist = Math.hypot(px - item.p.x, py - item.p.y);

    if (!best || dist < best.dist) best = { dist, coeffs };

  };

  const a = app.coeffs.a;

  for (let r = -2.2; r <= 2.2; r += 0.006) {

    const b = -3 * a * r - 6 * r * r;

    const item = quarticParametricPoint(a, b, r, rect, range);

    if (!item) continue;

    const c = -4 * r ** 3 - 3 * a * r * r - 2 * b * r;

    const d = 3 * r ** 4 + 2 * a * r ** 3 + b * r * r;

    consider(item, { b, c, d });

  }

  const split = (3 * a * a) / 8;

  for (let b = -range; b <= range + 0.001; b += 0.012) {

    const item = quarticDoubleDoublePoint(a, b, rect, range);

    if (!item) continue;

    const q = (b - (a * a) / 4) / 2;

    consider(item, { b, c: a * q, d: q * q });

  }

  const r = -a / 4;

  const b = 6 * r * r;

  const c = -4 * r ** 3;

  const d = r ** 4;

  if (Math.max(Math.abs(b), Math.abs(c), Math.abs(d)) <= range) {

    const p = projectBCD(b, c, d, rect);

    consider({ p }, { b, c, d });

  }

  if (!best) return;

  app.coeffs.b = best.coeffs.b;

  app.coeffs.c = best.coeffs.c;

  app.coeffs.d = best.coeffs.d;

}

function updateLabels() {
  const names = {
    1: "1次方程式",
    2: "2次方程式",
    3: "3次方程式",
    4: "4次方程式",
  };
  const normalizeLabels = {
    1: "平行移動による標準化",
    2: "平方完成による標準化",
    3: "立方完成による標準化",
    4: "立方完成による標準化",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "方程式の係数";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} のグラフ`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "点やスライダーをドラッグして係数を変更できます。";
}

function classify() {
  if (app.level === 1) return "実数解が 1 個あります。";
  if (app.level === 2) {
    const disc = app.coeffs.a * app.coeffs.a - 4 * app.coeffs.b;
    if (Math.abs(disc) < EPS) return "重解が 1 個あります。";
    return disc > 0 ? "異なる実数解が 2 個あります。" : "実数解はありません。複素数解が 2 個あります。";
  }
  if (app.level === 3) {
    const roots = realRootsWithMultiplicity(getCoefficients());
    const realTotal = roots.reduce((sum, item) => sum + item.multiplicity, 0);
    const maxMultiplicity = roots.reduce((max, item) => Math.max(max, item.multiplicity), 1);
    if (maxMultiplicity === 3) return "3重解が 1 個あります。";
    if (maxMultiplicity === 2) return "重解が 1 個、単解が 1 個あります。";
    return realTotal === 3 ? "異なる実数解が 3 個あります。" : "実数解が 1 個、複素数解が 2 個あります。";
  }
  return classifyQuartic();
}

function classifyQuartic() {
  const roots = realRootsWithMultiplicity(getCoefficients());
  const realTotal = roots.reduce((sum, item) => sum + item.multiplicity, 0);
  const mults = roots.map((item) => item.multiplicity).sort((a, b) => b - a);
  const complexTotal = 4 - realTotal;
  if (mults[0] === 4) return "4重解が 1 個あります。";
  if (mults[0] === 3) return "3重解が 1 個、単解が 1 個あります。";
  if (mults[0] === 2 && mults[1] === 2) return "2重解が 2 個あります。";
  if (mults[0] === 2) {
    if (complexTotal === 0) return "重解が 1 個、単解が 2 個あります。";
    return "重解が 1 個、複素数解が 2 個あります。";
  }
  if (realTotal === 4) return "異なる実数解が 4 個あります。";
  if (realTotal === 2) return "実数解が 2 個、複素数解が 2 個あります。";
  return "実数解はありません。複素数解が 4 個あります。";
}

function updateLabels() {
  const names = {
    1: "1\u6b21\u65b9\u7a0b\u5f0f",
    2: "2\u6b21\u65b9\u7a0b\u5f0f",
    3: "3\u6b21\u65b9\u7a0b\u5f0f",
    4: "4\u6b21\u65b9\u7a0b\u5f0f",
  };
  const normalizeLabels = {
    1: "\u5e73\u884c\u79fb\u52d5\u306b\u3088\u308b\u6a19\u6e96\u5316",
    2: "\u5e73\u65b9\u5b8c\u6210\u306b\u3088\u308b\u6a19\u6e96\u5316",
    3: "\u7acb\u65b9\u5b8c\u6210\u306b\u3088\u308b\u6a19\u6e96\u5316",
    4: "\u7acb\u65b9\u5b8c\u6210\u306b\u3088\u308b\u6a19\u6e96\u5316",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "\u65b9\u7a0b\u5f0f\u306e\u4fc2\u6570";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${levelFormulaHTML()} \u306e\u30b0\u30e9\u30d5`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "\u70b9\u3084\u30b9\u30e9\u30a4\u30c0\u30fc\u3092\u30c9\u30e9\u30c3\u30b0\u3057\u3066\u4fc2\u6570\u3092\u5909\u66f4\u3067\u304d\u307e\u3059\u3002";
}

function classify() {
  if (app.level === 1) return "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.level === 2) {
    const disc = app.coeffs.a * app.coeffs.a - 4 * app.coeffs.b;
    if (Math.abs(disc) < EPS) return "\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    return disc > 0 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  if (app.level === 3) {
    const roots = realRootsWithMultiplicity(getCoefficients());
    const realTotal = roots.reduce((sum, item) => sum + item.multiplicity, 0);
    const maxMultiplicity = roots.reduce((max, item) => Math.max(max, item.multiplicity), 1);
    if (maxMultiplicity === 3) return "3\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    if (maxMultiplicity === 2) return "\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    return realTotal === 3 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 3 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  return classifyQuartic();
}

function classifyQuartic() {
  const roots = realRootsWithMultiplicity(getCoefficients());
  const realTotal = roots.reduce((sum, item) => sum + item.multiplicity, 0);
  const mults = roots.map((item) => item.multiplicity).sort((a, b) => b - a);
  const complexTotal = 4 - realTotal;
  if (mults[0] === 4) return "4\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (mults[0] === 3) return "3\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (mults[0] === 2 && mults[1] === 2) return "2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (mults[0] === 2) {
    if (complexTotal === 0) return "\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
    return "\u91cd\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  if (realTotal === 4) return "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (realTotal === 2) return "\u5b9f\u6570\u89e3\u304c 2 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  return "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";
}

function startLevel(level) {
  app.level = level;
  app.normalized = false;
  app.showDiscriminant = false;
  app.showStrata = false;
  app.spatialDrag = false;
  app.trapKind = null;
  els.normalizeToggle.checked = false;
  els.discriminantToggle.checked = false;
  els.strataToggle.checked = false;
  els.spatialDragToggle.checked = false;
  els.select.classList.add("hidden");
  els.viewer.classList.remove("hidden");
  applyNormalization();
  updateLabels();
  syncSlider();
  render();
}

function snapQuadraticIfClose() {
  app.trapKind = null;
  if (!app.showDiscriminant) return;
  const rect = coefficientRect();
  const current = map2D(app.coeffs.a, app.coeffs.b, rect);
  let best = null;
  const start = app.normalized ? 0 : -3;
  const end = app.normalized ? 0 : 3;
  const step = app.normalized ? 1 : 0.01;
  for (let a = start; a <= end; a += step) {
    const b = (a * a) / 4;
    if (Math.abs(b) > 3) continue;
    const p = map2D(a, b, rect);
    const dist = Math.hypot(p.x - current.x, p.y - current.y);
    if (!best || dist < best.dist) best = { dist, a, b };
  }
  if (best && best.dist <= 11) {
    app.coeffs.a = app.normalized ? 0 : best.a;
    app.coeffs.b = best.b;
    app.trapKind = "quadraticDouble";
  }
}

function snapCubicIfClose() {
  app.trapKind = null;
  if (!app.showDiscriminant) return;
  const rect = coefficientRect();
  const a = app.coeffs.a;
  const current = projectABC(a, app.coeffs.b, app.coeffs.c, rect);
  let best = null;
  for (let r = -3.2; r <= 3.2; r += 0.01) {
    const b = -3 * r * r - 2 * a * r;
    const c = 2 * r * r * r + a * r * r;
    if (Math.abs(b) > 3 || Math.abs(c) > 3) continue;
    const p = projectABC(a, b, c, rect);
    const dist = Math.hypot(p.x - current.x, p.y - current.y);
    if (!best || dist < best.dist) best = { dist, b, c, r };
  }
  if (best && best.dist <= 11) {
    app.coeffs.b = best.b;
    app.coeffs.c = best.c;
    app.trapKind = Math.abs(best.r + a / 3) < 0.035 ? "cubicTriple" : "cubicDouble";
  }
}

function snapQuarticIfClose() {
  app.trapKind = null;
  if (!app.showDiscriminant) return;
  const rect = coefficientRect();
  const { a, b } = app.coeffs;
  const current = projectBCD(b, app.coeffs.c, app.coeffs.d, rect);
  let best = null;
  for (let r = -3; r <= 3; r += 0.01) {
    const item = quarticParametricPoint(a, b, r, rect, 5);
    if (!item) continue;
    const dist = Math.hypot(item.p.x - current.x, item.p.y - current.y);
    if (!best || dist < best.dist) {
      const c = -4 * r ** 3 - 3 * a * r * r - 2 * b * r;
      const d = 3 * r ** 4 + 2 * a * r ** 3 + b * r * r;
      const m = a + 2 * r;
      const n = b + 2 * a * r + 3 * r * r;
      const qDisc = m * m - 4 * n;
      const tripleResidual = Math.abs(b + 3 * a * r + 6 * r * r);
      const quadrupleResidual = Math.hypot(r + a / 4, b - 6 * r * r);
      best = { dist, c, d, qDisc, tripleResidual, quadrupleResidual };
    }
  }
  if (best && best.dist <= 11) {
    app.coeffs.c = best.c;
    app.coeffs.d = best.d;
    if (best.quadrupleResidual < 0.035) app.trapKind = "quarticQuadruple";
    else if (best.tripleResidual < 0.035) app.trapKind = "quarticTriple";
    else if (Math.abs(best.qDisc) < 0.025) app.trapKind = "quarticDoubleDoubleReal";
    else app.trapKind = best.qDisc > 0 ? "quarticDoubleRealSimple" : "quarticDoubleComplexSimple";
  }
}

function updateFromCanvasPoint(px, py) {
  const rect = coefficientRect();
  const range = coeffRange();
  if (app.dragTarget === "rotate") {
    const last = app.lastPointer || { x: px, y: py };
    app.rotation.yaw += (px - last.x) * 0.012;
    app.rotation.pitch = clamp(app.rotation.pitch + (py - last.y) * 0.012, -1.15, 1.15);
    app.lastPointer = { x: px, y: py };
    render();
    return;
  }
  app.trapKind = null;
  if (app.dragTarget === "space3") {
    moveToNearestCubicSingular(px, py, rect, range);
  } else if (app.dragTarget === "space4") {
    moveToNearestQuarticSingular(px, py, rect, range);
  } else if (app.dragTarget === "a") {
    const v = unmap2D(px, py, rect, range);
    app.coeffs.a = clamp(v.x, -range, range);
  } else if (app.dragTarget === "ab") {
    const v = unmap2D(px, py, rect, range);
    app.coeffs.a = app.normalized ? 0 : clamp(v.x, -range, range);
    app.coeffs.b = clamp(v.y, -range, range);
    if (app.showDiscriminant) snapQuadraticIfClose();
  } else if (app.dragTarget === "bc3") {
    const v = unprojectFixedX(px, py, app.coeffs.a, rect, range);
    app.coeffs.b = clamp(v.y, -range, range);
    app.coeffs.c = clamp(v.z, -range, range);
    if (app.showDiscriminant) snapCubicIfClose();
  } else if (app.dragTarget === "bc4") {
    const v = unprojectFixedX(px, py, app.coeffs.b, rect, range);
    app.coeffs.c = clamp(v.y, -range, range);
    app.coeffs.d = clamp(v.z, -range, range);
    if (app.showDiscriminant) snapQuarticIfClose();
  }
  if (app.dragTarget !== "space3") applyNormalization();
  app.lastPointer = { x: px, y: py };
  render();
}

function moveToNearestCubicSingular(px, py, rect, range) {
  let best = null;
  const limit = Math.sqrt(range / 3);
  for (let r = -limit; r <= limit + 0.001; r += 0.006) {
    const a = -3 * r;
    const b = 3 * r * r;
    const c = -r * r * r;
    const p = projectABC(a, b, c, rect);
    const dist = Math.hypot(px - p.x, py - p.y);
    if (!best || dist < best.dist) best = { dist, a, b, c };
  }
  if (!best) return;
  app.coeffs.a = best.a;
  app.coeffs.b = best.b;
  app.coeffs.c = best.c;
  app.trapKind = "cubicTriple";
}

function moveToNearestQuarticSingular(px, py, rect, range) {
  let best = null;
  const consider = (item, coeffs, kind) => {
    if (!item) return;
    const dist = Math.hypot(px - item.p.x, py - item.p.y);
    if (!best || dist < best.dist) best = { dist, coeffs, kind };
  };
  const a = app.coeffs.a;
  for (let r = -2.2; r <= 2.2; r += 0.006) {
    const b = -3 * a * r - 6 * r * r;
    const item = quarticParametricPoint(a, b, r, rect, range);
    if (!item) continue;
    const c = -4 * r ** 3 - 3 * a * r * r - 2 * b * r;
    const d = 3 * r ** 4 + 2 * a * r ** 3 + b * r * r;
    consider(item, { b, c, d }, "quarticTriple");
  }
  const split = (3 * a * a) / 8;
  for (let b = -range; b <= range + 0.001; b += 0.012) {
    const item = quarticDoubleDoublePoint(a, b, rect, range);
    if (!item) continue;
    const q = (b - (a * a) / 4) / 2;
    const kind = b <= split ? "quarticDoubleDoubleReal" : "quarticDoubleDoubleComplex";
    consider(item, { b, c: a * q, d: q * q }, kind);
  }
  const r = -a / 4;
  const b = 6 * r * r;
  const c = -4 * r ** 3;
  const d = r ** 4;
  if (Math.max(Math.abs(b), Math.abs(c), Math.abs(d)) <= range) {
    const p = projectBCD(b, c, d, rect);
    consider({ p }, { b, c, d }, "quarticQuadruple");
  }
  if (!best) return;
  app.coeffs.b = best.coeffs.b;
  app.coeffs.c = best.coeffs.c;
  app.coeffs.d = best.coeffs.d;
  app.trapKind = best.kind;
}

function classify() {
  if (app.trapKind === "quadraticDouble") return "\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "cubicTriple") return "3\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "cubicDouble") return "\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticTriple") return "3\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticQuadruple") return "4\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticDoubleDoubleReal") return "\u7570\u306a\u308b\u5b9f 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticDoubleDoubleComplex") return "\u7570\u306a\u308b\u865a 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticDoubleRealSimple") return "\u91cd\u89e3\u304c 1 \u500b\u3001\u7570\u306a\u308b\u5b9f\u5358\u6839\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticDoubleComplexSimple") return "\u91cd\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u5358\u6839\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.level === 1) return "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.level === 2) {
    const disc = app.coeffs.a * app.coeffs.a - 4 * app.coeffs.b;
    if (Math.abs(disc) < EPS) return "\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    return disc > 0 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  if (app.level === 3) {
    const roots = realRootsWithMultiplicity(getCoefficients());
    const realTotal = roots.reduce((sum, item) => sum + item.multiplicity, 0);
    const maxMultiplicity = roots.reduce((max, item) => Math.max(max, item.multiplicity), 1);
    if (maxMultiplicity === 3) return "3\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    if (maxMultiplicity === 2) return "\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    return realTotal === 3 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 3 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  return classifyQuartic();
}

function classifyQuartic() {
  const clusters = clusterComplex(durandKerner(getCoefficients()));
  const mults = clusters.map((cl) => cl.count).sort((a, b) => b - a);
  const realMultiplicity = clusters.filter((cl) => Math.abs(cl.z.im) < 1e-4).reduce((sum, cl) => sum + cl.count, 0);
  const realClusterCount = clusters.filter((cl) => Math.abs(cl.z.im) < 1e-4).length;
  if (mults[0] === 4) return "4\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (mults[0] === 3) return "3\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u6839\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (mults[0] === 2 && mults[1] === 2) {
    if (realClusterCount === 2) return "\u7570\u306a\u308b\u5b9f 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
    if (realClusterCount === 0) return "\u7570\u306a\u308b\u865a 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
    return "2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  if (mults[0] === 2) {
    if (realMultiplicity === 4) return "\u91cd\u89e3\u304c 1 \u500b\u3001\u7570\u306a\u308b\u5b9f\u5358\u6839\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
    return "\u91cd\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  if (realMultiplicity === 4) return "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (realMultiplicity === 2) return "\u5b9f\u6570\u89e3\u304c 2 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  return "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";
}

function drawCubicDiscriminantSurface(rect) {
  const range = coeffRange();
  const aValues = rangeValues(-range, range, 0.18);
  const rValues = rangeValues(-2.7, 2.7, 0.08);
  const surface = aValues.map((a) => rValues.map((r) => cubicParametricPoint(a, r, rect, range)));
  ctxCoeff.save();
  drawSurfacePatches(surface, STRATA_COLORS.cubicMain, STRATA_COLORS.cubicMainStroke);
  drawSurfaceMesh(surface, 6, STRATA_COLORS.mesh);
  drawCubicSliceCurve(rect, app.coeffs.a, range);
  ctxCoeff.restore();
}

function drawQuarticDiscriminantSurface(rect) {
  const range = coeffRange();
  const { a, b } = app.coeffs;
  const bValues = rangeValues(-range, range, 0.16);
  const rValues = rangeValues(-2.45, 2.45, 0.055);
  const surface = bValues.map((b0) => rValues.map((r) => quarticParametricPoint(a, b0, r, rect, range)));
  ctxCoeff.save();
  drawSurfacePatches(surface, STRATA_COLORS.quarticRealSimple, "rgba(42, 157, 143, 0.20)");
  drawSurfaceMesh(surface, 7, STRATA_COLORS.mesh);
  drawQuarticSliceCurve(rect, a, b, range);
  ctxCoeff.restore();
}

function quarticQuadrupleResidual() {
  const { a, b, c, d } = app.coeffs;
  const r = -a / 4;
  return Math.hypot(b - 6 * r * r, c + 4 * r ** 3, d - r ** 4);
}

function classify() {
  if (app.trapKind === "quadraticDouble") return "\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "cubicTriple") return "3\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "cubicDouble") return "\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticTriple") return "3\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticQuadruple") return "4\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticDoubleDoubleReal") return "\u7570\u306a\u308b\u5b9f 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticDoubleDoubleComplex") return "\u7570\u306a\u308b\u865a 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticDoubleRealSimple") return "\u91cd\u89e3\u304c 1 \u500b\u3001\u7570\u306a\u308b\u5b9f\u5358\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.trapKind === "quarticDoubleComplexSimple") return "\u91cd\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u5358\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.level === 1) return "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (app.level === 2) {
    const disc = app.coeffs.a * app.coeffs.a - 4 * app.coeffs.b;
    if (Math.abs(disc) < EPS) return "\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    return disc > 0 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  if (app.level === 3) {
    const roots = realRootsWithMultiplicity(getCoefficients());
    const realTotal = roots.reduce((sum, item) => sum + item.multiplicity, 0);
    const maxMultiplicity = roots.reduce((max, item) => Math.max(max, item.multiplicity), 1);
    if (maxMultiplicity === 3) return "3\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    if (maxMultiplicity === 2) return "\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
    return realTotal === 3 ? "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 3 \u500b\u3042\u308a\u307e\u3059\u3002" : "\u5b9f\u6570\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  return classifyQuartic();
}

function classifyQuartic() {
  if (quarticQuadrupleResidual() < 1e-5) return "4\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  const clusters = clusterComplex(durandKerner(getCoefficients()));
  const mults = clusters.map((cl) => cl.count).sort((a, b) => b - a);
  const realMultiplicity = clusters.filter((cl) => Math.abs(cl.z.im) < 1e-4).reduce((sum, cl) => sum + cl.count, 0);
  const realClusterCount = clusters.filter((cl) => Math.abs(cl.z.im) < 1e-4).length;
  if (mults[0] === 4) return "4\u91cd\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (mults[0] === 3) return "3\u91cd\u89e3\u304c 1 \u500b\u3001\u5358\u89e3\u304c 1 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (mults[0] === 2 && mults[1] === 2) {
    if (realClusterCount === 2) return "\u7570\u306a\u308b\u5b9f 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
    if (realClusterCount === 0) return "\u7570\u306a\u308b\u865a 2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
    return "2\u91cd\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  if (mults[0] === 2) {
    if (realMultiplicity === 4) return "\u91cd\u89e3\u304c 1 \u500b\u3001\u7570\u306a\u308b\u5b9f\u5358\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
    return "\u91cd\u89e3\u304c 1 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  }
  if (realMultiplicity === 4) return "\u7570\u306a\u308b\u5b9f\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";
  if (realMultiplicity === 2) return "\u5b9f\u6570\u89e3\u304c 2 \u500b\u3001\u8907\u7d20\u6570\u89e3\u304c 2 \u500b\u3042\u308a\u307e\u3059\u3002";
  return "\u5b9f\u6570\u89e3\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u8907\u7d20\u6570\u89e3\u304c 4 \u500b\u3042\u308a\u307e\u3059\u3002";
}

function levelFormulaHTML(level = app.level) {
  const formulas = {
    1: '<span class="math">x + a = 0</span>',
    2: '<span class="math">x<sup>2</sup> + ax + b = 0</span>',
    3: '<span class="math">x<sup>3</sup> + ax<sup>2</sup> + bx + c = 0</span>',
    4: '<span class="math">x<sup>4</sup> + ax<sup>3</sup> + bx<sup>2</sup> + cx + d = 0</span>',
  };
  return formulas[level];
}

function graphFormulaHTML(level = app.level) {
  const formulas = {
    1: '<span class="math">y = x + a</span>',
    2: '<span class="math">y = x<sup>2</sup> + ax + b</span>',
    3: '<span class="math">y = x<sup>3</sup> + ax<sup>2</sup> + bx + c</span>',
    4: '<span class="math">y = x<sup>4</sup> + ax<sup>3</sup> + bx<sup>2</sup> + cx + d</span>',
  };
  return formulas[level];
}

function updateLabels() {
  const names = {
    1: "1\u6b21\u65b9\u7a0b\u5f0f",
    2: "2\u6b21\u65b9\u7a0b\u5f0f",
    3: "3\u6b21\u65b9\u7a0b\u5f0f",
    4: "4\u6b21\u65b9\u7a0b\u5f0f",
  };
  const normalizeLabels = {
    1: "\u5e73\u884c\u79fb\u52d5\u306b\u3088\u308b\u6a19\u6e96\u5316",
    2: "\u5e73\u65b9\u5b8c\u6210\u306b\u3088\u308b\u6a19\u6e96\u5316",
    3: "\u7acb\u65b9\u5b8c\u6210\u306b\u3088\u308b\u6a19\u6e96\u5316",
    4: "\u6a19\u6e96\u5316",
  };
  els.levelLabel.textContent = `Degree ${app.level}`;
  els.title.innerHTML = `${names[app.level]} ${levelFormulaHTML()}`;
  els.coeffTitle.textContent = "\u65b9\u7a0b\u5f0f\u306e\u4fc2\u6570";
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) graphTitle.innerHTML = `${graphFormulaHTML()} \u306e\u30b0\u30e9\u30d5`;
  els.normalizeLabel.textContent = normalizeLabels[app.level];
  els.discriminantToggle.parentElement.style.display = app.level === 1 ? "none" : "inline-flex";
  els.strataToggleLabel.classList.toggle("hidden", app.level < 3);
  els.spatialDragToggleLabel.classList.toggle("hidden", app.level < 3);
  els.sliderPanel.classList.add("hidden");
  els.bSliderPanel.classList.add("hidden");
  const hint = document.getElementById("drag-hint");
  if (hint) hint.textContent = "\u70b9\u3084\u30b9\u30e9\u30a4\u30c0\u30fc\u3092\u30c9\u30e9\u30c3\u30b0\u3057\u3066\u4fc2\u6570\u3092\u5909\u66f4\u3067\u304d\u307e\u3059\u3002";
}



render();

