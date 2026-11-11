// Servicios: secuencia automática (Duchas -> Sauna individual -> Sauna familiar)
(() => {
const T = THREE, DUR = 8000;
const st = document.getElementById("escenario");
const cards = [...document.querySelectorAll(".srv-card")];
document.documentElement.style.setProperty("--dur", DUR + "ms");

// ===== Renderer, cámara, luces y entorno (reflejos realistas) =====
const R = new T.WebGLRenderer({ antialias: true, alpha: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.outputEncoding = T.sRGBEncoding;
R.toneMapping = T.ACESFilmicToneMapping;
R.toneMappingExposure = 1.05;
st.appendChild(R.domElement);
const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
{
  const s = new T.Scene(), pm = new T.PMREMGenerator(R);
  s.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x2a2018, side: T.BackSide })));
  [[0, 9, 0, 8, .2, 8], [-9, 2, 3, .2, 6, 6], [9, 3, -2, .2, 5, 5]].forEach(([x, y, z, w, h, d]) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ color: new T.Color(7, 6.4, 5.6) }));
    m.position.set(x, y, z); s.add(m);
  });
  scene.environment = pm.fromScene(s, .04).texture;
}
const sol = new T.DirectionalLight(0xfff0dc, 1.1); sol.position.set(3, 6, 5);
scene.add(sol, new T.HemisphereLight(0xffffff, 0x4a3a2a, .35));

// ===== Utilidades =====
const mat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: .6, ...o });
const rnd = (s => () => (s = s * 16807 % 2147483647) / 2147483647)(11);
const V3 = (x, y, z) => new T.Vector3(x, y, z);
function tex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
}
const sombraTex = tex(128, 128, (x) => {
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
});

// ===== Objeto 1: shampú =====
function shampu() {
  const g = new T.Group(), c = new T.Group(); g.add(c);
  const perfil = new T.SplineCurve([[0, 0], [.5, 0], [.6, .06], [.64, .25], [.65, 1.3], [.62, 1.9], [.5, 2.3], [.3, 2.52], [.27, 2.6]]
    .map(p => new T.Vector2(...p))).getPoints(70);
  c.add(new T.Mesh(new T.LatheGeometry(perfil, 48),
    new T.MeshPhysicalMaterial({ color: 0x2f8f6a, roughness: .28, clearcoat: 1, clearcoatRoughness: .08 })));
  const arco = Math.PI * 1.1;
  const et = tex(512, 256, (x, w, h) => {
    x.fillStyle = "#f4ecdc"; x.fillRect(0, 0, w, h); x.fillStyle = "#2f7a55"; x.textAlign = "center";
    x.font = "bold 72px Georgia"; x.fillText("Sauna Edén", w / 2, 110);
    x.font = "34px Georgia"; x.fillText("SHAMPÚ DE EUCALIPTO", w / 2, 165);
    x.fillRect(w * .2, 195, w * .6, 4);
  });
  const lab = new T.Mesh(new T.CylinderGeometry(.655, .655, 1.1, 48, 1, true, -arco / 2, arco),
    new T.MeshStandardMaterial({ map: et, roughness: .45, side: T.DoubleSide }));
  lab.position.y = .8; c.add(lab);
  const blanco = new T.MeshPhysicalMaterial({ color: 0xf6f3ec, roughness: .25, clearcoat: 1 });
  const collar = new T.Mesh(new T.CylinderGeometry(.31, .31, .14, 32), blanco); collar.position.y = 2.62;
  const tapa = new T.Mesh(new T.CylinderGeometry(.27, .29, .5, 32), blanco); tapa.position.y = 2.94;
  const pico = new T.Mesh(new T.CylinderGeometry(.07, .09, .26, 16), blanco); pico.position.set(.14, 3.28, 0); pico.rotation.z = -.5;
  c.add(collar, tapa, pico); c.scale.z = .6;
  return g;
}

// ===== Objeto 2: jabón con burbujas =====
function jabon() {
  const s = new T.Shape(), w = 1.05, h = .62, r = .28;
  s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
  const geo = new T.ExtrudeGeometry(s, { depth: .45, bevelEnabled: true, bevelThickness: .14, bevelSize: .12, bevelSegments: 8, curveSegments: 16 });
  geo.center(); geo.rotateX(-Math.PI / 2);
  const g = new T.Group();
  g.add(new T.Mesh(geo, new T.MeshPhysicalMaterial({ color: 0xe9d3a8, roughness: .35, clearcoat: .6, clearcoatRoughness: .25 })));
  const sello = new T.Mesh(new T.PlaneGeometry(1.5, .6), new T.MeshBasicMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    map: tex(256, 128, (x, w, h) => { x.fillStyle = "rgba(120,85,40,.55)"; x.font = "bold 70px Georgia"; x.textAlign = "center"; x.fillText("EDÉN", w / 2, 90); })
  }));
  sello.rotation.x = -Math.PI / 2; sello.position.y = .372; g.add(sello);
  const bm = new T.MeshStandardMaterial({ color: 0xdfefff, roughness: 0, metalness: .1, transparent: true, opacity: .28, envMapIntensity: 2.5 });
  const burbujas = [];
  for (let i = 0; i < 7; i++) {
    const b = new T.Mesh(new T.SphereGeometry(.1 + rnd() * .22, 24, 16), bm);
    b.userData = { x: (rnd() - .5) * 2.2, z: (rnd() - .5) * 1.1, y0: .45 + rnd() * 1.0, f: .4 + rnd() * .5, p: rnd() * 6 };
    burbujas.push(b); g.add(b);
  }
  g.userData.anim = t => burbujas.forEach(b => {
    const u = b.userData; b.position.set(u.x + Math.sin(t * u.f + u.p) * .12, u.y0 + Math.sin(t * u.f * 1.3 + u.p) * .15, u.z);
  });
  return g;
}

// ===== Vapor 3D (sprites suaves que suben alrededor de un objeto) =====
const puffTex = tex(128, 128, x => {
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
});
function vapor(sx, sy, sz, { n = 26, f = 1, gh = 1.1, op = .3 }) {
  const g = new T.Group(), S = [];
  for (let i = 0; i < n; i++) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 }));
    sp.userData = { x: (rnd() - .5) * sx * f, z: (rnd() - .5) * sz * f, p: rnd(), v: .08 + rnd() * .07, sz: sy * (.2 + rnd() * .2), d: (rnd() - .5) * sx * .15 };
    S.push(sp); g.add(sp);
  }
  g.userData.anim = t => S.forEach(sp => {
    const u = sp.userData, k = (t * u.v + u.p) % 1, e = u.sz * (1 + k * 1.6);
    sp.position.set(u.x + Math.sin(t * .6 + u.p * 9) * u.d, -sy / 2 + k * sy * gh, u.z);
    sp.scale.set(e, e, 1); sp.material.opacity = op * Math.sin(Math.PI * k);
  });
  return g;
}

// ===== Objeto 3: ducha con agua (tipo 0 = cromo redondo, tipo 1 = dorada cuadrada) =====
function ducha(tipo) {
  const g = new T.Group(), c = tipo ? 0xd4a94e : 0xe4e4e4;
  const met = new T.MeshStandardMaterial({ color: c, metalness: 1, roughness: tipo ? .32 : .16 });
  const cer = new T.MeshPhysicalMaterial({ color: 0xf5f3ee, roughness: .2, clearcoat: 1 });
  const add = (geo, m, x, y, z, rx = 0, rz = 0) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  add(new T.CylinderGeometry(1.2, 1.25, .12, 48), cer, .1, .06, 0);                       // plato
  add(new T.CylinderGeometry(.14, .14, .02, 24), mat(0x333333, { metalness: 1, roughness: .4 }), .1, .13, 0); // desagüe
  add(new T.CylinderGeometry(.055, .055, 3.2, 20), met, -.85, 1.7, 0);                    // tubo
  add(new T.SphereGeometry(.075, 20, 16), met, -.85, 3.3, 0);
  add(new T.CylinderGeometry(.045, .045, 1.2, 16), met, -.25, 3.3, 0, 0, Math.PI / 2);    // brazo
  add(new T.CylinderGeometry(.04, .04, .18, 12), met, .35, 3.22, 0);
  add(new T.CylinderGeometry(.13, .13, .1, 24), met, -.85, 1.8, .08, Math.PI / 2, 0);      // llave
  add(new T.BoxGeometry(.28, .05, .05), met, -.85, 1.8, .17);
  add(tipo ? new T.BoxGeometry(1, .07, 1) : new T.CylinderGeometry(.58, .58, .07, 48), met, .35, 3.1, 0); // cabezal
  const cara = tex(256, 256, (x, w, h) => {
    x.fillStyle = tipo ? "#b58f3a" : "#cfcfcf"; x.fillRect(0, 0, w, h); x.fillStyle = "#555";
    for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) { x.beginPath(); x.arc(10 + i * 18.5, 10 + j * 18.5, 3.2, 0, 6.3); x.fill(); }
  });
  add(tipo ? new T.PlaneGeometry(.92, .92) : new T.CircleGeometry(.52, 40), new T.MeshStandardMaterial({ map: cara, metalness: .8, roughness: .4 }), .35, 3.06, 0, Math.PI / 2);
  const N = 150, gota = new T.InstancedMesh(new T.CylinderGeometry(.012, .012, .3, 6),
    new T.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: .55, roughness: 0, envMapIntensity: 2.5 }), N), d = [], o = new T.Object3D();
  for (let i = 0; i < N; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * .5; d.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 1.3 + rnd() * .9, p: rnd() }); }
  gota.frustumCulled = false; g.add(gota);
  g.userData.anim = t => {
    d.forEach((q, i) => { const u = (t * q.s + q.p) % 1, e = 1 + u * .3; o.position.set(.35 + q.x * e, 3.05 - u * 2.9, q.z * e); o.updateMatrix(); gota.setMatrixAt(i, o.matrix); });
    gota.instanceMatrix.needsUpdate = true;
  };
  return g;
}

// ===== Objeto 3b: ducha sencilla y pequeña (tubo de acero, cabezal de plástico) =====
function duchaSimple() {
  const g = new T.Group(), o = new T.Object3D();
  const acero = new T.MeshStandardMaterial({ color: 0xb5b9bd, metalness: .85, roughness: .45 });
  const plast = new T.MeshStandardMaterial({ color: 0xf1f1ee, roughness: .4 });
  const add = (geo, m, x, y, z, rx = 0, rz = 0) => { const q = new T.Mesh(geo, m); q.position.set(x, y, z); q.rotation.set(rx, 0, rz); g.add(q); };
  const cara = tex(128, 128, (x, w, h) => {
    x.fillStyle = "#e9e9e5"; x.fillRect(0, 0, w, h); x.fillStyle = "#777";
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { x.beginPath(); x.arc(9 + i * 13.2, 9 + j * 13.2, 2.4, 0, 6.3); x.fill(); }
  });
  add(new T.CylinderGeometry(.8, .82, .08, 40), mat(0x8d8a84, { roughness: .9 }), 0, .04, 0);                  // piso de cemento
  add(new T.CylinderGeometry(.1, .1, .02, 20), mat(0x2b2b2b, { metalness: .8, roughness: .5 }), .15, .09, 0);   // desagüe
  add(new T.CylinderGeometry(.035, .035, 2.6, 16), acero, -.45, 1.38, 0);                                      // tubo
  add(new T.SphereGeometry(.05, 16, 12), acero, -.45, 2.68, 0);
  add(new T.CylinderGeometry(.03, .03, .6, 12), acero, -.15, 2.68, 0, 0, Math.PI / 2);                          // brazo
  add(new T.CylinderGeometry(.09, .27, .1, 32), plast, .15, 2.58, 0);                                          // cabezal
  add(new T.CircleGeometry(.25, 32), new T.MeshStandardMaterial({ map: cara, roughness: .5 }), .15, 2.529, 0, Math.PI / 2);
  add(new T.CylinderGeometry(.06, .06, .12, 16), acero, -.45, 1.5, .05, Math.PI / 2);                          // llave
  add(new T.BoxGeometry(.22, .04, .04), plast, -.45, 1.5, .13);
  const N = 90, gota = new T.InstancedMesh(new T.CylinderGeometry(.01, .01, .26, 6),
    new T.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: .5, roughness: 0, envMapIntensity: 2.5 }), N), d = [];
  for (let i = 0; i < N; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * .24; d.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 1.3 + rnd() * .9, p: rnd() }); }
  gota.frustumCulled = false; g.add(gota);
  g.userData.anim = t => {
    d.forEach((q, i) => { const u = (t * q.s + q.p) % 1, e = 1 + u * .25; o.position.set(.15 + q.x * e, 2.5 - u * 2.38, q.z * e); o.updateMatrix(); gota.setMatrixAt(i, o.matrix); });
    gota.instanceMatrix.needsUpdate = true;
  };
  return g;
}

// ===== Objeto 4: toallas como la imagen de referencia (sobre barra cromada + pila doblada) =====
function texFelpa(color) { // felpa fina: ruido suave y dobladillo con costura
  return tex(512, 1024, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 14000; i++) { x.fillStyle = Math.random() < .5 ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    x.fillStyle = "rgba(255,255,255,.14)"; x.fillRect(0, 0, 14, h); x.fillRect(w - 14, 0, 14, h); x.fillRect(0, 0, w, 14); x.fillRect(0, h - 14, w, 14);
    x.strokeStyle = "rgba(255,255,255,.5)"; x.lineWidth = 2; x.setLineDash([7, 5]); x.strokeRect(16, 16, w - 32, h - 32);
  });
}
const felpas = {}, felpa = c => felpas[c] || (felpas[c] = texFelpa(c));
const telaMat = c => new T.MeshStandardMaterial({ map: felpa(c), bumpMap: felpa(c), bumpScale: 1.5, roughness: .95, side: T.DoubleSide });

// Una sola tela doblada por la mitad sobre la barra: panel delantero largo, panel trasero más corto con dobladillo ondulado
function toallaSobreBarra(color, i, w = 1.3, Lf = 2.6, Lb = 1.9) {
  const rb = .09, Nf = 44, Na = 10, Nb = 34, M = 36, filas = [], pos = [], uv = [], idx = [];
  for (let r = 0; r <= Nf; r++) filas.push({ z: rb, y: -Lf + Lf * r / Nf, d: 1 - r / Nf, l: 1 });
  for (let r = 1; r < Na; r++) { const a = Math.PI * r / Na; filas.push({ z: rb * Math.cos(a), y: rb * Math.sin(a), d: 0, l: 0 }); }
  for (let r = 0; r <= Nb; r++) filas.push({ z: -rb, y: -Lb * r / Nb, d: r / Nb, l: -1 });
  const total = filas.length, ph = i * 1.7;
  filas.forEach((f, r) => {
    for (let j = 0; j <= M; j++) {
      const u = j / M, x = (u - .5) * w, d = f.d; let z = f.z, y = f.y;
      if (f.l) {
        z += f.l * (Math.sin(x * 5.5 + ph) * .045 + Math.sin(x * 11 + ph * 2) * .015) * Math.min(1, d * 3) + f.l * d * d * (f.l > 0 ? .06 : .09);
        if (f.l < 0) z -= Math.sin(x * 10 + ph) * .05 * Math.max(0, d - .55) * 2;
        y += Math.sin(x * 6 + ph) * .06 * d * d * d * (f.l < 0 ? 1 : .4);
      }
      pos.push(x, y, z); uv.push(u, r / (total - 1));
    }
  });
  for (let r = 0; r < total - 1; r++) for (let j = 0; j < M; j++) { const a = r * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return new T.Mesh(geo, telaMat(color));
}
function toallas() {
  const g = new T.Group(), cromo = mat(0xdcdcdc, { metalness: 1, roughness: .15 }), W = 2.5, Y = 3.8, anim = [];
  [-W, W].forEach(x => {
    const p = new T.Mesh(new T.CylinderGeometry(.05, .05, Y + .25, 16), cromo); p.position.set(x, (Y + .25) / 2, 0);
    const pie = new T.Mesh(new T.BoxGeometry(.18, .06, .9), cromo); pie.position.set(x, .03, 0);
    const bola = new T.Mesh(new T.SphereGeometry(.09, 16, 12), cromo); bola.position.set(x, Y + .25, 0);
    g.add(p, pie, bola);
  });
  const barra = new T.Mesh(new T.CylinderGeometry(.06, .06, W * 2, 24), cromo); barra.rotation.z = Math.PI / 2; barra.position.y = Y; g.add(barra);
  ["#4f9a94", "#d9775a", "#e2b04a"].forEach((c, i) => {
    const t = toallaSobreBarra(c, i); t.position.set(-1.4 + i * 1.4, Y, 0); g.add(t);
    anim.push(tt => { t.rotation.x = Math.sin(tt * .7 + i * 2) * .025; t.rotation.z = Math.sin(tt * .9 + i) * .012; });
  });
  ["#5b86b5", "#f0ece3", "#4f9a94"].forEach((c, i) => {                    // pila doblada abajo
    const w = 1.45 - (i % 2) * .06, d = .9, hh = .26, geo = new T.BoxGeometry(w, hh, d, 14, 2, 10), p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const px = p.getX(k), py = p.getY(k), pz = p.getZ(k);
      p.setY(k, py + Math.sign(py) * .05 * (1 - Math.pow(px / (w / 2), 2)) * (1 - Math.pow(pz / (d / 2), 2)));
    }
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, telaMat(c)); m.position.set((rnd() - .5) * .05, .06 + hh / 2 + i * hh * .96, .75); m.rotation.y = (rnd() - .5) * .14; g.add(m);
  });
  g.userData.anim = t => anim.forEach(f => f(t));
  return g;
}

// ===== Escenario: cada objeto vive en un "slot" que aparece/desaparece por fase =====
const slots = [], anims = []; let actual = 0;
function colocar(obj, { fase, x, y = 0, w, h, spin = 0, delay = 0, vp = null }) {
  const b = new T.Box3().setFromObject(obj), s = b.getSize(V3(0, 0, 0)), c = b.getCenter(V3(0, 0, 0));
  const k = Math.min(w / (spin ? Math.max(s.x, s.z) : s.x), h / s.y);
  obj.position.sub(c);
  const pivot = new T.Group(); pivot.add(obj); pivot.scale.setScalar(k); pivot.position.y = s.y * k / 2;
  if (vp) { const v = vapor(s.x, s.y, s.z, vp); pivot.add(v); anims.push(v.userData.anim); }
  const sombra = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: sombraTex, transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = .01 - y; sombra.scale.setScalar(Math.max(s.x, s.z) * k * 1.5);
  const slot = new T.Group(); slot.add(pivot, sombra); slot.position.x = x; slot.visible = false;
  slot.userData = { fase, pivot, spin, delay, y0: y, py: pivot.position.y, v: 0, desde: 0 };
  if (obj.userData.anim) anims.push(obj.userData.anim);
  scene.add(slot); slots.push(slot);
  if (fase === actual) slot.userData.desde = performance.now() + delay;
}
const IZQ = -2.8;
// Fase 0 (Duchas): en zigzag -> shampú arriba, jabón abajo, ducha alta
colocar(shampu(), { fase: 0, x: -3.3, y: 2.5, w: 2.4, h: 3.4, spin: .6 });
colocar(jabon(), { fase: 0, x: -1.3, w: 3.6, h: 2, spin: .6, delay: 350 });
colocar(ducha(0), { fase: 0, x: 2.7, w: 3.6, h: 5.4, delay: 700 });
// Fase 1 (Sauna individual): ducha sencilla y pequeña, con agua y vapor
colocar(duchaSimple(), { fase: 1, x: 2.6, w: 3.2, h: 4.2, delay: 350, vp: { n: 30, f: 1.2, gh: 1.1, op: .3 } });
// Fase 2 (Sauna familiar): repisa de toallas con vapor alrededor
colocar(toallas(), { fase: 2, x: 2.1, w: 4.8, h: 4.6, delay: 350, vp: { n: 34, f: 1.1, gh: .95, op: .26 } });
const GLB = new T.GLTFLoader();
GLB.load("eucalipto.glb", g => colocar(g.scene, { fase: 1, x: -2.4, y: 1.6, w: 4, h: 4.2, spin: .6 }), undefined, e => console.warn("No se pudo cargar eucalipto.glb", e));
GLB.load("trapitos.glb", g => {
  colocar(g.scene, { fase: 2, x: -3, w: 2.8, h: 4.4, spin: .6, vp: { n: 16, f: 1.2, gh: 1, op: .26 } });
}, undefined, e => console.warn("No se pudo cargar trapitos.glb", e));

// ===== Control de fases =====
let tm;
function ir(i) {
  actual = i; clearTimeout(tm);
  cards.forEach((c, j) => { c.classList.toggle("on", j === i); const p = c.querySelector(".prog"); p.style.animation = "none"; void p.offsetWidth; p.style.animation = ""; });
  slots.forEach(s => { if (s.userData.fase === i) s.userData.desde = performance.now() + s.userData.delay; });
  tm = setTimeout(() => ir((i + 1) % 3), DUR);
}
cards.forEach((c, i) => {
  c.addEventListener("click", () => ir(i));
  c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ir(i); } });
});
document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(tm); else ir(actual); });
ir(0);

// ===== Tamaño y bucle =====
function ajustar() {
  const w = st.clientWidth, h = st.clientHeight, a = w / h, tan = Math.tan(T.MathUtils.degToRad(cam.fov / 2));
  R.setSize(w, h, false); cam.aspect = a;
  cam.position.set(0, 3, Math.max(7.6 / (2 * tan), 9.2 / a / (2 * tan)));
  cam.lookAt(0, 2.4, 0); cam.updateProjectionMatrix();
}
new ResizeObserver(ajustar).observe(st); addEventListener("resize", ajustar); ajustar();
let vis = true, last = performance.now();
new IntersectionObserver(e => vis = e[0].isIntersecting).observe(st);
requestAnimationFrame(function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!vis) return;
  slots.forEach(s => {
    const u = s.userData, goal = (u.fase === actual && now >= u.desde) ? 1 : 0;
    u.v += (goal - u.v) * Math.min(1, dt * 4.5);
    s.visible = u.v > .01; s.scale.setScalar(Math.max(u.v, .001)); s.position.y = u.y0 - (1 - u.v) * .8;
    u.pivot.position.y = u.py + (u.y0 > 0 ? Math.sin(now * .0015 + s.position.x) * .08 : 0); // flotan suavemente
    u.pivot.rotation.y = u.spin ? u.pivot.rotation.y + dt * u.spin : Math.sin(now * .0006) * .45;
  });
  anims.forEach(f => f(now / 1000));
  R.render(scene, cam);
});
})();
