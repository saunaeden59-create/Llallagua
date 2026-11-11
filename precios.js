// Precios: ducha.glb con agua -> efectivo (Bs) -> QR, y ducha plateada con vapor a la izquierda. Three.js r128.
(() => {
const T = THREE, v = (x, y, z) => new T.Vector3(x, y, z), UP = v(0, 1, 0);
const cont = document.getElementById("escenaPrecios"), slot = document.getElementById("slotDer");
if (!cont || !slot) return;
const wrap = document.querySelector("#precios .wrap"), eti = document.getElementById("pagoEtiqueta"), dotsEl = document.getElementById("pagoDots");
const DUR = 8000, D = 50;
const QR_IMG = "qr.jpg"; // tu QR de Yape (si no carga, se dibuja un QR de ejemplo)
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ===== Renderer, cámara, luces, entorno =====
const R = new T.WebGLRenderer({ antialias: true, alpha: true });
R.setClearColor(0x000000, 0); R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.1;
cont.appendChild(R.domElement);
const scene = new T.Scene(), cam = new T.PerspectiveCamera(22, 1, 1, 300);
const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; };
{
  const e = tex(1024, 512, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#cfd9e6"); gr.addColorStop(.45, "#f4f6f8"); gr.addColorStop(.55, "#4a4f57"); gr.addColorStop(1, "#14171b");
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 512); g.fillStyle = "#fff"; g.fillRect(100, 90, 120, 190); g.fillRect(430, 60, 160, 160); g.fillRect(780, 100, 110, 180);
    g.fillStyle = "#0c0e11"; g.fillRect(300, 70, 60, 250); g.fillRect(650, 70, 70, 250);
  });
  e.mapping = T.EquirectangularReflectionMapping; scene.environment = new T.PMREMGenerator(R).fromEquirectangular(e).texture;
}
scene.add(new T.HemisphereLight(0xdfeaff, 0x30343a, .5));
const key = new T.DirectionalLight(0xffffff, 1.3); key.position.set(3, 4, 6); scene.add(key);
const rim = new T.DirectionalLight(0x9fc4ff, .7); rim.position.set(-4, 2, -3); scene.add(rim);

// ===== Materiales y ayudantes =====
const chrome = new T.MeshStandardMaterial({ color: 0xf2f4f7, metalness: 1, roughness: .05 });
const silver = new T.MeshStandardMaterial({ color: 0xd0d4da, metalness: 1, roughness: .22 });
const nozzle = new T.MeshStandardMaterial({ color: 0x8d9299, metalness: .6, roughness: .4 });
const dropMat = new T.MeshStandardMaterial({ color: 0xc8e6ff, transparent: true, opacity: .6, roughness: .05, metalness: .2, depthWrite: false });
const steamTex = tex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,.6)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
const rnd = (s => () => (s = s * 16807 % 2147483647) / 2147483647)(7);
const cyl = (r1, r2, h, m, s = 32) => new T.Mesh(new T.CylinderGeometry(r1, r2, h, s), m);
const put = (P, m, x, y, z) => { m.position.set(x, y, z); P.add(m); return m; };
const ball = (P, p, r = .026) => put(P, new T.Mesh(new T.SphereGeometry(r, 24, 16), chrome), p.x, p.y, p.z);
const collar = (P, p) => put(P, cyl(.036, .036, .04, chrome), p.x, p.y, p.z);
function pipe(P, a, b, r = .02, m = silver) { const d = b.clone().sub(a), me = cyl(r, r, d.length(), m, 28); me.position.copy(a).addScaledVector(d, .5); me.quaternion.setFromUnitVectors(UP, d.normalize()); P.add(me); }
function holes(P, rings, rad, y) { const geo = new T.CylinderGeometry(rad, rad, .006, 8); rings.forEach(([r, n]) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283; put(P, new T.Mesh(geo, nozzle), Math.cos(a) * r, y, Math.sin(a) * r); } }); }

// ===== Agua (gotas) + vapor opcional. ems: [{p, q, r, spread, v0, v1, n}] en coordenadas de P; f = escala del modelo =====
function lluvia(P, ems, f, piso, st) {
  const G = 6.5 * f, own = []; let N = 0;
  ems.forEach((e, k) => { e.q = e.q || new T.Quaternion(); e.dir = v(0, -1, 0).applyQuaternion(e.q); for (let i = 0; i < e.n; i++) own[N++] = k; });
  const drops = new T.InstancedMesh(new T.CylinderGeometry(.0026 * f, .0026 * f, 1, 4), dropMat, N); drops.frustumCulled = false; P.add(drops);
  const pos = [], vel = [], dm = new T.Object3D(), tmp = v(0, 0, 0);
  const spawn = i => {
    const e = ems[own[i]], rr = Math.sqrt(Math.random()) * e.r, a = Math.random() * 6.283;
    pos[i] = v(Math.cos(a) * rr, 0, Math.sin(a) * rr).applyQuaternion(e.q).add(e.p);
    vel[i] = e.dir.clone().add(v((Math.random() - .5) * e.spread * 2, (Math.random() - .5) * .1, (Math.random() - .5) * e.spread * 2)).normalize().multiplyScalar((e.v0 + Math.random() * (e.v1 - e.v0)) * f);
  };
  for (let i = 0; i < N; i++) { spawn(i); const t = Math.random(); pos[i].addScaledVector(vel[i], t); pos[i].y -= .5 * G * t * t; vel[i].y -= G * t; if (pos[i].y < piso) spawn(i); }
  const sp = [];
  if (st) for (let i = 0; i < st.n; i++) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { life: Math.random(), sp: .1 + Math.random() * .08, x: st.cx + (Math.random() - .5) * 2 * st.rx, z: st.cz + (Math.random() - .5) * 2 * st.rz, ph: Math.random() * 6 };
    P.add(s); sp.push(s);
  }
  return dt => {
    for (let i = 0; i < N; i++) {
      vel[i].y -= G * dt; pos[i].addScaledVector(vel[i], dt); if (pos[i].y < piso) spawn(i);
      dm.position.copy(pos[i]); dm.quaternion.setFromUnitVectors(UP, tmp.copy(vel[i]).normalize());
      dm.scale.set(1, Math.max(.04 * f, vel[i].length() * .03), 1); dm.updateMatrix(); drops.setMatrixAt(i, dm.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
    sp.forEach(s => { const d = s.userData; d.life += dt * d.sp; if (d.life > 1) d.life = 0;
      s.position.set(d.x + Math.sin(d.life * 6 + d.ph) * .1, piso + .05 + d.life * st.h, d.z);
      s.scale.setScalar(.6 + d.life * 1.6); s.material.opacity = Math.sin(d.life * Math.PI) * st.op; });
  };
}

// ===== Ducha grande plateada (columna) =====
function columna() {
  const P = new T.Group(), RZ = -1, ems = [], Q = (x, y = 0) => new T.Quaternion().setFromEuler(new T.Euler(x, y, 0));
  put(P, cyl(.11, .12, .03, chrome, 48), 0, .015, RZ); put(P, cyl(.06, .08, .03, silver, 48), 0, .045, RZ);
  pipe(P, v(0, .06, RZ), v(0, 2.45, RZ), .024); [.12, .55, 1.15, 1.6, 2.1].forEach(y => collar(P, v(0, y, RZ)));
  ball(P, v(0, 2.45, RZ), .032); pipe(P, v(0, 2.45, RZ), v(0, 2.45, -.1)); ball(P, v(0, 2.45, -.1), .03);
  const rain = new T.Group(); rain.position.set(0, 2.38, -.1); P.add(rain);
  put(rain, cyl(.018, .018, .09, silver, 20), 0, .05, 0); put(rain, cyl(.32, .32, .035, chrome, 72), 0, 0, 0);
  put(rain, new T.Mesh(new T.TorusGeometry(.32, .01, 12, 72), chrome), 0, 0, 0).rotation.x = Math.PI / 2;
  put(rain, cyl(.3, .3, .006, silver, 72), 0, -.019, 0); holes(rain, [[0, 1], [.07, 8], [.14, 16], [.21, 24], [.28, 32]], .008, -.024);
  ems.push({ p: v(0, 2.35, -.1), r: .3, spread: .1, v0: .9, v1: 1.4, n: 600 });
  const VZ = RZ + .07; put(P, new T.Mesh(new T.BoxGeometry(.4, .24, .1), chrome), 0, 1.15, VZ);
  [-.11, .11].forEach(x => {
    put(P, cyl(.045, .05, .04, chrome, 40), x, 1.15, VZ + .07).rotation.x = Math.PI / 2;
    put(P, new T.Mesh(new T.BoxGeometry(.1, .022, .022), silver), x, 1.15, VZ + .1).rotation.z = x < 0 ? .6 : -.6;
    pipe(P, v(x, 1.03, VZ - .02), v(x, .06, VZ - .02), .016); ball(P, v(x, 1.03, VZ - .02), .02); put(P, cyl(.03, .03, .03, chrome, 24), x, .075, VZ - .02);
  });
  pipe(P, v(0, .55, RZ), v(0, .55, -.68), .022); ball(P, v(0, .55, -.68)); pipe(P, v(0, .55, -.68), v(0, .44, -.68), .022); put(P, cyl(.03, .022, .03, chrome, 24), 0, .42, -.68);
  [-1, 1].forEach(s => {
    const x = s * .34, y = 1.6; pipe(P, v(0, y, RZ), v(x, y, RZ), .017); ball(P, v(x, y, RZ), .022); pipe(P, v(x, y, RZ), v(x, y, -.84), .017);
    const jg = new T.Group(); jg.position.set(x, y, -.84); jg.rotation.x = -(Math.PI / 2 - .25); P.add(jg);
    put(jg, cyl(.02, .02, .05, silver, 16), 0, .02, 0); put(jg, cyl(.055, .055, .025, chrome, 40), 0, -.02, 0); put(jg, cyl(.04, .04, .005, silver, 40), 0, -.034, 0);
    holes(jg, [[0, 1], [.022, 6], [.036, 10]], .0045, -.038); ems.push({ p: v(x, y, -.84), q: Q(-(Math.PI / 2 - .25)), r: .03, spread: .12, v0: 2, v1: 2.6, n: 60 });
  });
  const hand = new T.Group(); hand.position.set(.36, 1.78, -.8); hand.rotation.x = -.9; P.add(hand); hand.updateMatrix();
  put(hand, cyl(.075, .075, .025, chrome, 48), 0, 0, 0); put(hand, cyl(.065, .065, .005, silver, 48), 0, -.014, 0); holes(hand, [[0, 1], [.03, 6], [.05, 12]], .005, -.018);
  put(hand, cyl(.022, .03, .3, chrome, 28), 0, .15, 0); put(hand, cyl(.032, .032, .02, silver, 28), 0, .31, 0);
  const L = y => v(0, y, 0).applyMatrix4(hand.matrix), grip = L(.32), cradle = L(.16);
  pipe(P, v(0, cradle.y, RZ), cradle, .014); put(P, new T.Mesh(new T.TorusGeometry(.034, .008, 12, 28), chrome), cradle.x, cradle.y, cradle.z).quaternion.copy(hand.quaternion); ball(P, v(0, cradle.y, RZ), .022);
  P.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([grip, v(grip.x + .04, grip.y + .05, grip.z - .05), v(.38, 1.9, -1.08), v(.36, 1.2, -1.14), v(.2, .75, -1.1), v(.04, .58, RZ + .02)]), 90, .012, 14, false), new T.MeshStandardMaterial({ color: 0xbfc4cb, metalness: .9, roughness: .35 })));
  ems.push({ p: v(.36, 1.76, -.8), q: Q(-.9), r: .06, spread: .28, v0: 2, v1: 2.8, n: 200 });
  P.userData.agua = (Pp) => lluvia(Pp, ems, 1, 0, { cx: -.1, cz: -.5, rx: .7, rz: .6, h: 2.6, n: 40, op: .4 });
  return P;
}

// ===== Efectivo: un solo objeto "Bs" dorado en 3D =====
function efectivo(font) {
  const oro = new T.MeshStandardMaterial({ color: 0xd9ad3c, metalness: 1, roughness: .22 }), G = new T.Group();
  if (font) {
    const geo = new T.TextGeometry("Bs", { font, size: 1, height: .38, curveSegments: 14, bevelEnabled: true, bevelThickness: .06, bevelSize: .04, bevelSegments: 5 });
    geo.center(); G.add(new T.Mesh(geo, oro));
  } else { // plan B si no carga la tipografía: medallón con "Bs"
    const t = tex(256, 256, (g) => { g.fillStyle = "#d9ad3c"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#7a5a14"; g.textAlign = "center"; g.font = "bold 130px Georgia"; g.fillText("Bs", 128, 170); });
    const m = new T.Mesh(new T.CylinderGeometry(1, 1, .25, 56), [oro, new T.MeshStandardMaterial({ map: t, metalness: .8, roughness: .3 }), oro]); m.rotation.x = Math.PI / 2; G.add(m);
  }
  return G;
}

// ===== QR: tarjeta con QR + celular con "Pago realizado" =====
function qrCanvas() {
  const n = 29, px = 16, c = document.createElement("canvas"); c.width = c.height = (n + 4) * px; const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#111";
  const fin = [[0, 0], [n - 7, 0], [0, n - 7]];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    let on = rnd() > .5, z = false;
    fin.forEach(([a, b]) => { if (i >= a - 1 && i <= a + 7 && j >= b - 1 && j <= b + 7) { z = true; const d = Math.max(Math.abs(i - a - 3), Math.abs(j - b - 3)); on = d === 3 || d <= 1; } });
    if (on) g.fillRect((i + 2) * px, (j + 2) * px, px, px);
  }
  return c;
}
function qr() {
  const G = new T.Group(), qc = qrCanvas();
  const cardT = tex(1024, 1280, () => {}), cg = cardT.image.getContext("2d");
  cardT.anisotropy = 16;
  const pinta = img => {
    cg.setTransform(2, 0, 0, 2, 0, 0); // dibujamos en 512x640 y se ve a doble resolución (el QR necesita nitidez)
    cg.fillStyle = "#fff"; cg.fillRect(0, 0, 512, 640); cg.fillStyle = "#c0562f"; cg.fillRect(0, 0, 512, 76);
    cg.fillStyle = "#fff"; cg.textAlign = "center"; cg.font = "bold 36px Georgia"; cg.fillText("ESCANEA Y PAGA", 256, 52);
    if (img === qc) cg.drawImage(img, 56, 100, 400, 400);
    else { const w = 470, h = w * img.naturalHeight / img.naturalWidth; cg.drawImage(img, 21, 84, w, h); }
    cg.fillStyle = "#222"; cg.font = "bold 30px Georgia"; cg.fillText("Sauna Edén · Bs", 256, 618); cardT.needsUpdate = true;
  };
  pinta(qc);
  if (QR_IMG) { const im = new Image(); im.onload = () => pinta(im); im.src = QR_IMG; }
  const body = new T.MeshStandardMaterial({ color: 0xf2efe8, roughness: .5 }), front = new T.MeshStandardMaterial({ map: cardT, roughness: .4 });
  const card = new T.Mesh(new T.BoxGeometry(1.6, 2, .05), [body, body, body, body, front, body]); card.position.set(-.45, 1, 0); card.rotation.y = .12; G.add(card);
  const base = new T.Mesh(new T.BoxGeometry(1.3, .08, .5), new T.MeshStandardMaterial({ color: 0x3f5a47, roughness: .6 })); base.position.set(-.45, .04, -.05); G.add(base);
  const bar = new T.Mesh(new T.PlaneGeometry(1.2, .05), new T.MeshBasicMaterial({ color: 0x59e08a, transparent: true, opacity: .75, depthWrite: false })); bar.rotation.y = .12; G.add(bar);
  const ph = new T.Group(); ph.position.set(.75, .95, .35); ph.rotation.set(-.08, -.35, .06); G.add(ph);
  ph.add(new T.Mesh(new T.BoxGeometry(.8, 1.6, .08), new T.MeshStandardMaterial({ color: 0x15171a, metalness: .6, roughness: .3 })));
  const scr = tex(256, 512, (g, w, h) => {
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "#2fa866"; g.beginPath(); g.arc(128, 190, 70, 0, 6.3); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 16; g.lineCap = "round"; g.beginPath(); g.moveTo(92, 192); g.lineTo(120, 222); g.lineTo(168, 160); g.stroke();
    g.fillStyle = "#222"; g.textAlign = "center"; g.font = "bold 30px Georgia"; g.fillText("Pago realizado", 128, 330); g.font = "bold 52px Georgia"; g.fillStyle = "#c0562f"; g.fillText("Bs 26", 128, 400);
  });
  const sc = new T.Mesh(new T.PlaneGeometry(.72, 1.48), new T.MeshBasicMaterial({ map: scr })); sc.position.z = .045; ph.add(sc);
  G.userData.anim = t => { const k = (t * .5) % 1; bar.position.set(-.45 + .03, .3 + k * 1.4, .03); bar.material.opacity = Math.sin(k * Math.PI) * .8; };
  return G;
}

// ===== Escenario: cada objeto aparece/desaparece por fase (como en servicios) =====
const items = []; let fase = 0, nf = 3, ancho = true, FASE = {}, tm;
const CAPT = { glb: "Ducha de agua caliente", plata: "Ducha plateada con vapor", efectivo: "Efectivo · Bolivianos (Bs)", qr: "Paga con QR (Yape)" };
const faseDe = () => ({ glb: 0, plata: ancho ? -1 : 1, efectivo: ancho ? 1 : 2, qr: ancho ? 2 : 3 });
FASE = faseDe();
function colocar(key, P, o = {}) {
  const b = new T.Box3().setFromObject(P), s = b.getSize(v(0, 0, 0)), c = b.getCenter(v(0, 0, 0));
  const upd = o.agua ? o.agua(P, b) : null;
  P.position.sub(c); const piv = new T.Group(); piv.add(P); const sl = new T.Group(); sl.add(piv); sl.visible = false; scene.add(sl);
  const now = performance.now();
  items.push({ key, slot: sl, piv, s, k: 1, v: 0, upd, anim: P.userData.anim, ph: items.length * 1.7, delay: o.delay || 0, desde: (FASE[key] < 0 || FASE[key] === fase) ? now + (o.delay || 0) : 0 });
  layout();
}
function layout() {
  const W = cont.clientWidth, H = cont.clientHeight; if (!W || !H) return;
  R.setSize(W, H, false); cam.aspect = W / H; cam.position.set(0, 0, D); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  const u = 2 * D * Math.tan(T.MathUtils.degToRad(cam.fov / 2)) / H, cr = cont.getBoundingClientRect(), sr = slot.getBoundingClientRect(), margen = wrap.getBoundingClientRect().left - cr.left;
  const nuevo = margen >= 190;
  if (nuevo !== ancho || !dotsEl.children.length) { ancho = nuevo; FASE = faseDe(); nf = ancho ? 3 : 4; if (fase >= nf) fase = 0; puntos(); ir(fase); }
  const der = { cx: sr.left - cr.left + sr.width / 2, cy: sr.top - cr.top + sr.height * .42, w: sr.width * .92, h: sr.height * .74 };
  const izq = { cx: margen / 2, cy: H / 2, w: Math.min(margen - 16, 340), h: Math.min(H * .9, 640) };
  items.forEach(it => { const r = (it.key === "plata" && ancho) ? izq : der; it.k = Math.min(r.w * u / it.s.x, r.h * u / it.s.y); it.slot.position.set((r.cx - W / 2) * u, (H / 2 - r.cy) * u, 0); });
}
function puntos() { dotsEl.innerHTML = ""; for (let i = 0; i < nf; i++) { const b = document.createElement("button"); b.setAttribute("aria-label", "Ver " + (i + 1)); b.onclick = () => ir(i); dotsEl.appendChild(b); } }
function ir(i) {
  fase = i; clearTimeout(tm); const now = performance.now();
  [...dotsEl.children].forEach((d, j) => d.classList.toggle("on", j === i));
  items.forEach(it => { if (FASE[it.key] === i) it.desde = now + it.delay; });
  eti.textContent = CAPT[Object.keys(FASE).find(k => FASE[k] === i)] || "";
  if (!reduce) tm = setTimeout(() => ir((i + 1) % nf), DUR);
}
document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(tm); else ir(fase); });
new ResizeObserver(layout).observe(cont); addEventListener("resize", layout);

colocar("plata", columna(), { delay: 300, agua: (P) => P.userData.agua(P) });
const FONT_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json";
if (T.FontLoader && T.TextGeometry) new T.FontLoader().load(FONT_URL, f => colocar("efectivo", efectivo(f), { delay: 350 }), undefined, () => colocar("efectivo", efectivo(null), { delay: 350 }));
else colocar("efectivo", efectivo(null), { delay: 350 });
colocar("qr", qr(), { delay: 350 });
new T.GLTFLoader().load("ducha.glb", g => {
  const S = g.scene; S.updateMatrixWorld(true);
  const hb = new T.Box3(); ["Cylinder", "Plane"].forEach(n => { const o = S.getObjectByName(n); if (o) hb.expandByObject(o); });
  colocar("glb", S, { delay: 200, agua: (P, b) => {
    const sz = b.getSize(v(0, 0, 0)); let p, r;
    if (!hb.isEmpty()) { const hs = hb.getSize(v(0, 0, 0)), hc = hb.getCenter(v(0, 0, 0)); p = v(hc.x, hb.min.y, hc.z); r = Math.min(hs.x, hs.z) * .4; }
    else { const c = b.getCenter(v(0, 0, 0)); p = v(b.max.x - sz.x * .2, b.min.y + sz.y * .6, c.z); r = sz.x * .08; }
    return lluvia(P, [{ p, r, spread: .16, v0: 1.6, v1: 2.4, n: 700 }], r / .3 / .8, b.min.y, null);
  } });
}, undefined, e => console.warn("No se pudo cargar ducha.glb", e));

// ===== Bucle =====
let vis = true, last = performance.now(); new IntersectionObserver(e => vis = e[0].isIntersecting).observe(cont);
requestAnimationFrame(function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now; if (!vis || document.hidden) return;
  items.forEach(it => {
    const f = FASE[it.key], goal = ((f < 0 || f === fase) && now >= it.desde) ? 1 : 0;
    it.v += (goal - it.v) * Math.min(1, dt * 4.5); it.slot.visible = it.v > .01; if (!it.slot.visible) return;
    it.slot.scale.setScalar(Math.max(it.v, .001) * it.k);
    it.piv.rotation.y = Math.sin(now * .0006 + it.ph) * .4; it.piv.position.y = Math.sin(now * .0015 + it.ph) * it.s.y * .012;
    if (it.upd) it.upd(dt); if (it.anim) it.anim(now / 1000);
  });
  R.render(scene, cam);
});
})();
