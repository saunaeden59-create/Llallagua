// Portada animada de Sauna Edén (Three.js r128). Requiere: three.min.js cargado antes.
(function () {
  try { iniciar(); } catch (e) {
    console.error('Error en la portada 3D:', e);
    const c = document.getElementById('heroVisual');
    if (c) c.innerHTML = '<div style="position:absolute;top:10px;left:10px;right:10px;padding:8px 12px;background:rgba(0,0,0,.75);color:#ffb4a0;font:13px system-ui;border-radius:8px">Error 3D: ' + e.message + '</div>';
  }
  function iniciar() {
  const cont = document.getElementById('heroVisual');
  if (!cont) return;
  if (!window.THREE) throw new Error('No cargó Three.js. Revisa internet y que index.html tenga el <script> de three antes de hero.js');
  if (cont.clientHeight < 50) throw new Error('El contenedor 3D mide 0 de alto. Revisa que style.css sea el nuevo (clase .hero-visual).');
  const T = THREE;

  // ===== CONTENIDO (edita aquí textos, lados y tiempo) =====
  const TIEMPO = 9000; // milisegundos entre cambios
  const SLIDES = [
    { lado: 'izq', eyebrow: 'Relajación y bienestar',
      titulo: 'Tu momento de calma, <em>a puro vapor</em>',
      texto: 'Duchas, sauna individual y sauna familiar en un ambiente cálido y tranquilo. Desconecta del estrés y renueva tu cuerpo.',
      botones: [['Reservar ahora', 'reservar.html', 'btn'], ['Ver servicios', 'servicios.html', 'btn ghost'], ['Ver modelo 3D', 'visor3d.html', 'btn ghost']] },
    { lado: 'der', eyebrow: 'Sauna a vapor',
      titulo: 'Respira hondo y <em>deja que el vapor trabaje</em>',
      texto: 'El vapor caliente envuelve tu cuerpo, relaja los músculos y te ayuda a soltar la tensión del día. Entra, respira y desconecta.',
      botones: [['Reservar sauna', 'reservar.html', 'btn'], ['Ver precios', 'precios.html', 'btn ghost']] },
    { lado: 'izq', eyebrow: 'Después del vapor',
      titulo: 'Piel suave, <em>mente en calma</em>',
      texto: 'Una sesión de sauna a vapor te deja la piel suave y el cuerpo ligero. Ven solo o en familia y termina con una ducha caliente.',
      botones: [['Sauna familiar', 'servicios.html', 'btn'], ['Reservar ahora', 'reservar.html', 'btn ghost']] }
  ];

  // ===== AJUSTES DEL 3D (cambia estos números y guarda) =====
  const AJUSTES = {
    zoom: 1,          // mayor = duchas más chicas (cámara más lejos). Prueba entre 0.8 y 1.3
    separacion: 1.25,  // mayor = duchas más cerca de los bordes. Prueba entre 0.6 y 1.6
    altura: 0,        // positivo = sube las duchas, negativo = las baja. Prueba entre -0.4 y 0.4
    columna: { escala: 1, giroDerecha: -0.4, giroIzquierda: 2.0 }, // ducha plateada (giros en radianes)
    simple:  { escala: 1.25, giro: -0.3 },                          // primera ducha
    toallas: { x: 1.05, escala: 0.85, altura: 0 }                      // x = distancia de las toallas a la ducha plateada
  };

  const $ = id => document.getElementById(id);
  const texto = $('heroTexto'), dotsEl = $('heroDots');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const v = (x, y, z) => new T.Vector3(x, y, z);
  const UP = v(0, 1, 0);

  // ===== Renderer / escena / luces =====
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.outputEncoding = T.sRGBEncoding;
  cont.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 50);

  (function env() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#cfd9e6'); gr.addColorStop(.45, '#f4f6f8'); gr.addColorStop(.55, '#4a4f57'); gr.addColorStop(1, '#14171b');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    g.fillStyle = '#fff'; g.fillRect(100, 90, 120, 190); g.fillRect(430, 60, 160, 160); g.fillRect(780, 100, 110, 180);
    g.fillStyle = '#0c0e11'; g.fillRect(300, 70, 60, 250); g.fillRect(650, 70, 70, 250); g.fillRect(940, 70, 50, 250);
    const tex = new T.CanvasTexture(c);
    tex.mapping = T.EquirectangularReflectionMapping; tex.encoding = T.sRGBEncoding;
    scene.environment = new T.PMREMGenerator(renderer).fromEquirectangular(tex).texture;
  })();
  scene.add(new T.HemisphereLight(0xdfeaff, 0x30343a, 0.45));
  const key = new T.DirectionalLight(0xffffff, 1.3); key.position.set(3, 4, 4); scene.add(key);
  const rim = new T.DirectionalLight(0x9fc4ff, 0.7); rim.position.set(-4, 2, -3); scene.add(rim);
  const warm = new T.PointLight(0xff9d5c, 0.6, 12); warm.position.set(0, 1.5, 3); scene.add(warm);

  // ===== Materiales y ayudantes =====
  const chrome = new T.MeshStandardMaterial({ color: 0xf2f4f7, metalness: 1, roughness: 0.05 });
  const silver = new T.MeshStandardMaterial({ color: 0xd0d4da, metalness: 1, roughness: 0.22 });
  const nozzleMat = new T.MeshStandardMaterial({ color: 0x8d9299, metalness: 0.6, roughness: 0.4 });
  const dropMat = new T.MeshStandardMaterial({ color: 0xc8e6ff, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.2 });
  const radial = (stops) => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, col]) => r.addColorStop(o, col));
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  };
  const steamTex = radial([[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
  const blobTex = radial([[0, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]);

  const cyl = (r1, r2, h, m, s = 32) => new T.Mesh(new T.CylinderGeometry(r1, r2, h, s), m);
  const put = (P, m, x, y, z) => { m.position.set(x, y, z); P.add(m); return m; };
  const ball = (P, p, r = 0.026) => put(P, new T.Mesh(new T.SphereGeometry(r, 24, 16), chrome), p.x, p.y, p.z);
  const collar = (P, p) => put(P, cyl(0.036, 0.036, 0.04, chrome), p.x, p.y, p.z);
  function pipe(P, a, b, r = 0.02, m = silver) {
    const d = b.clone().sub(a), mesh = cyl(r, r, d.length(), m, 28);
    mesh.position.copy(a).addScaledVector(d, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, d.normalize()); P.add(mesh);
  }
  function holes(P, rings, rad, y) {
    const geo = new T.CylinderGeometry(rad, rad, 0.006, 8);
    rings.forEach(([r, n]) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; put(P, new T.Mesh(geo, nozzleMat), Math.cos(a) * r, y, Math.sin(a) * r); } });
  }

  // ===== Ducha 2: columna plateada =====
  function buildColumn() {
    const P = new T.Group(), RZ = -1, em = [];
    put(P, cyl(0.11, 0.12, 0.03, chrome, 48), 0, 0.015, RZ);
    put(P, cyl(0.06, 0.08, 0.03, silver, 48), 0, 0.045, RZ);
    pipe(P, v(0, 0.06, RZ), v(0, 2.45, RZ), 0.024);
    [0.12, 0.55, 1.15, 1.6, 2.1].forEach(y => collar(P, v(0, y, RZ)));
    ball(P, v(0, 2.45, RZ), 0.032);
    pipe(P, v(0, 2.45, RZ), v(0, 2.45, -0.1)); ball(P, v(0, 2.45, -0.1), 0.03);
    // lluvia
    const rain = new T.Group(); rain.position.set(0, 2.38, -0.1); P.add(rain);
    put(rain, cyl(0.018, 0.018, 0.09, silver, 20), 0, 0.05, 0);
    put(rain, cyl(0.32, 0.32, 0.035, chrome, 72), 0, 0, 0);
    put(rain, new T.Mesh(new T.TorusGeometry(0.32, 0.01, 12, 72), chrome), 0, 0, 0).rotation.x = Math.PI / 2;
    put(rain, cyl(0.3, 0.3, 0.006, silver, 72), 0, -0.019, 0);
    holes(rain, [[0, 1], [0.07, 8], [0.14, 16], [0.21, 24], [0.28, 32]], 0.008, -0.024);
    em.push({ obj: rain, r: 0.3, spread: 0.1, v0: 0.9, v1: 1.4, n: 600 });
    // mezclador
    const VZ = RZ + 0.07;
    put(P, new T.Mesh(new T.BoxGeometry(0.4, 0.24, 0.1), chrome), 0, 1.15, VZ);
    [-0.11, 0.11].forEach(x => {
      put(P, cyl(0.045, 0.05, 0.04, chrome, 40), x, 1.15, VZ + 0.07).rotation.x = Math.PI / 2;
      put(P, new T.Mesh(new T.BoxGeometry(0.1, 0.022, 0.022), silver), x, 1.15, VZ + 0.1).rotation.z = x < 0 ? 0.6 : -0.6;
      pipe(P, v(x, 1.03, VZ - 0.02), v(x, 0.06, VZ - 0.02), 0.016); ball(P, v(x, 1.03, VZ - 0.02), 0.02);
      put(P, cyl(0.03, 0.03, 0.03, chrome, 24), x, 0.075, VZ - 0.02);
    });
    // pico
    pipe(P, v(0, 0.55, RZ), v(0, 0.55, -0.68), 0.022); ball(P, v(0, 0.55, -0.68));
    pipe(P, v(0, 0.55, -0.68), v(0, 0.44, -0.68), 0.022); put(P, cyl(0.03, 0.022, 0.03, chrome, 24), 0, 0.42, -0.68);
    // jets laterales
    [-1, 1].forEach(s => {
      const x = s * 0.34, y = 1.6;
      pipe(P, v(0, y, RZ), v(x, y, RZ), 0.017); ball(P, v(x, y, RZ), 0.022); pipe(P, v(x, y, RZ), v(x, y, -0.84), 0.017);
      const jg = new T.Group(); jg.position.set(x, y, -0.84); jg.rotation.x = -(Math.PI / 2 - 0.25); P.add(jg);
      put(jg, cyl(0.02, 0.02, 0.05, silver, 16), 0, 0.02, 0);
      put(jg, cyl(0.055, 0.055, 0.025, chrome, 40), 0, -0.02, 0);
      put(jg, cyl(0.04, 0.04, 0.005, silver, 40), 0, -0.034, 0);
      holes(jg, [[0, 1], [0.022, 6], [0.036, 10]], 0.0045, -0.038);
      em.push({ obj: jg, r: 0.03, spread: 0.12, v0: 2, v1: 2.6, n: 60 });
    });
    // ducha de mano + manguera
    const hand = new T.Group(); hand.position.set(0.36, 1.78, -0.8); hand.rotation.x = -0.9; P.add(hand); hand.updateMatrix();
    put(hand, cyl(0.075, 0.075, 0.025, chrome, 48), 0, 0, 0);
    put(hand, cyl(0.065, 0.065, 0.005, silver, 48), 0, -0.014, 0);
    holes(hand, [[0, 1], [0.03, 6], [0.05, 12]], 0.005, -0.018);
    put(hand, cyl(0.022, 0.03, 0.3, chrome, 28), 0, 0.15, 0);
    put(hand, cyl(0.032, 0.032, 0.02, silver, 28), 0, 0.31, 0);
    const L = (y) => v(0, y, 0).applyMatrix4(hand.matrix), grip = L(0.32), cradle = L(0.16);
    pipe(P, v(0, cradle.y, RZ), cradle, 0.014);
    put(P, new T.Mesh(new T.TorusGeometry(0.034, 0.008, 12, 28), chrome), cradle.x, cradle.y, cradle.z).quaternion.copy(hand.quaternion);
    ball(P, v(0, cradle.y, RZ), 0.022);
    P.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([grip, v(grip.x + 0.04, grip.y + 0.05, grip.z - 0.05), v(0.38, 1.9, -1.08), v(0.36, 1.2, -1.14), v(0.2, 0.75, -1.1), v(0.04, 0.58, RZ + 0.02)]), 90, 0.012, 14, false),
      new T.MeshStandardMaterial({ color: 0xbfc4cb, metalness: 0.9, roughness: 0.35 })));
    em.push({ obj: hand, r: 0.06, spread: 0.28, v0: 2, v1: 2.8, n: 200 });
    return { P, em, pivot: 0.55, design: AJUSTES.columna.escala, steam: { cz: -0.5, rx: 0.6, rz: 0.6, h: 2 } };
  }

  // ===== Ducha 1: regadera sencilla =====
  function buildSimple() {
    const P = new T.Group();
    pipe(P, v(0, 2.1, -1.5), v(0, 2.1, -0.8), 0.018); ball(P, v(0, 2.1, -1.5), 0.02); ball(P, v(0, 2.1, -0.8));
    put(P, cyl(0.06, 0.06, 0.02, chrome), 0, 2.1, -1.5).rotation.x = Math.PI / 2;
    const head = new T.Group(); head.position.set(0, 2, -0.8); head.rotation.x = -0.35; P.add(head);
    put(head, cyl(0.018, 0.018, 0.1, chrome, 20), 0, 0.05, 0);
    put(head, new T.Mesh(new T.SphereGeometry(0.2, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), chrome), 0, 0, 0).scale.y = 0.3;
    put(head, cyl(0.2, 0.2, 0.03, chrome, 48), 0, -0.012, 0);
    holes(head, [[0, 1], [0.05, 6], [0.1, 12], [0.15, 18]], 0.009, -0.028);
    return { P, em: [{ obj: head, r: 0.17, spread: 0.175, v0: 1.6, v1: 2.4, n: 800 }], pivot: 0.8, design: AJUSTES.simple.escala, steam: { cz: -0.35, rx: 0.6, rz: 0.5, h: 1.6 } };
  }

  // ===== Agua + vapor de cada ducha =====
  function makeShower(def) {
    const root = new T.Group(), P = def.P;
    P.position.z = def.pivot; root.add(P);
    const sh = new T.Mesh(new T.PlaneGeometry(2.6, 2.6), new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.003; root.add(sh);
    let N = 0; const owner = [];
    def.em.forEach((e, k) => { e.obj.updateMatrix(); e.dir = v(0, -1, 0).applyQuaternion(e.obj.quaternion); for (let i = 0; i < e.n; i++) owner[N++] = k; });
    const G = 6.5 / def.design;
    const drops = new T.InstancedMesh(new T.CylinderGeometry(0.0022, 0.0022, 1, 4), dropMat, N);
    drops.frustumCulled = false; P.add(drops);
    const pos = [], vel = [], dm = new T.Object3D(), tmp = v(0, 0, 0);
    const spawn = i => {
      const e = def.em[owner[i]], rr = Math.sqrt(Math.random()) * e.r, a = Math.random() * 6.283;
      pos[i] = v(Math.cos(a) * rr, -0.03, Math.sin(a) * rr).applyMatrix4(e.obj.matrix);
      vel[i] = e.dir.clone().add(v((Math.random() - .5) * e.spread * 2, (Math.random() - .5) * 0.1, (Math.random() - .5) * e.spread * 2))
        .normalize().multiplyScalar(e.v0 + Math.random() * (e.v1 - e.v0));
    };
    for (let i = 0; i < N; i++) { spawn(i); const t = Math.random(); pos[i].addScaledVector(vel[i], t); pos[i].y -= 0.5 * G * t * t; vel[i].y -= G * t; if (pos[i].y < 0) spawn(i); }
    const st = def.steam, sp = [];
    for (let i = 0; i < 26; i++) {
      const s = new T.Sprite(new T.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0, depthWrite: false }));
      s.userData = { life: Math.random(), sp: 0.1 + Math.random() * 0.08, x: (Math.random() - .5) * 2 * st.rx, z: st.cz + (Math.random() - .5) * 2 * st.rz, ph: Math.random() * 6 };
      P.add(s); sp.push(s);
    }
    root.visible = false; root.scale.setScalar(0.001); scene.add(root);
    return {
      root,
      update(dt) {
        for (let i = 0; i < N; i++) {
          vel[i].y -= G * dt; pos[i].addScaledVector(vel[i], dt);
          if (pos[i].y < 0) spawn(i);
          dm.position.copy(pos[i]);
          dm.quaternion.setFromUnitVectors(UP, tmp.copy(vel[i]).normalize());
          dm.scale.set(1, Math.max(0.04, vel[i].length() * 0.03), 1);
          dm.updateMatrix(); drops.setMatrixAt(i, dm.matrix);
        }
        drops.instanceMatrix.needsUpdate = true;
        sp.forEach(s => {
          const d = s.userData; d.life += dt * d.sp; if (d.life > 1) d.life = 0;
          s.position.set(d.x + Math.sin(d.life * 6 + d.ph) * 0.08, 0.05 + d.life * st.h, d.z);
          s.scale.setScalar(0.5 + d.life * 1.4);
          s.material.opacity = Math.sin(d.life * Math.PI) * 0.3;
        });
      }
    };
  }

  // ===== Toallas colgadas =====
  function towel(w, len, color) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 64, 256);
    g.fillStyle = 'rgba(0,0,0,.06)'; for (let y = 0; y < 256; y += 4) g.fillRect(0, y, 64, 1);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 222, 64, 6); g.fillRect(0, 234, 64, 3);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
    const mat = new T.MeshStandardMaterial({ map: tex, roughness: 1, side: T.DoubleSide });
    const grp = new T.Group();
    [[len, 0.034], [len * 0.8, -0.034]].forEach(([l, z]) => {
      const geo = new T.PlaneGeometry(w, l, 10, 14); geo.translate(0, -l / 2, 0);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const f = -p.getY(i) / l; p.setZ(i, z + Math.sin(p.getX(i) * 20 + p.getY(i) * 4) * 0.006 * f + f * Math.sign(z) * 0.015); }
      geo.computeVertexNormals(); grp.add(new T.Mesh(geo, mat));
    });
    const cap = new T.Mesh(new T.CylinderGeometry(0.034, 0.034, w, 16, 1, true, 0, Math.PI), mat);
    cap.rotation.z = Math.PI / 2; grp.add(cap);
    return grp;
  }
  function buildTowels() {
    const G = new T.Group(); G.position.z = -0.1; G.rotation.y = 0.3; G.visible = false;
    [-0.42, 0.42].forEach(x => { put(G, cyl(0.018, 0.018, 1.7, silver, 16), x, 0.85, 0); put(G, cyl(0.09, 0.1, 0.02, chrome), x, 0.01, 0); ball(G, v(x, 1.7, 0), 0.028); });
    put(G, cyl(0.014, 0.014, 0.9, chrome, 16), 0, 1.62, 0).rotation.z = Math.PI / 2;
    const sh = put(G, new T.Mesh(new T.PlaneGeometry(1.6, 1.6), new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })), 0, 0.003, 0);
    sh.rotation.x = -Math.PI / 2;
    G.userData.sw = [[-0.28, '#f4efe6', 0.85], [0, '#d8c3a5', 0.7], [0.28, '#6fa08f', 0.78]].map(([x, c, l]) => { const t = towel(0.24, l, c); t.position.set(x, 1.62, 0); G.add(t); return t; });
    scene.add(G); return G;
  }

  const A = makeShower(buildColumn()), B = makeShower(buildSimple()), TW = buildTowels();

  // ===== Posiciones de cada diapositiva =====
  const cur = { A: { x: 0, ry: 0, s: 0.001 }, B: { x: 0, ry: 0, s: 0.001 }, T: 0 };
  const tg = { A: {}, B: {}, T: 0 };
  let sx = 1.3, mobile = false, idx = 0;
  function setScene(i) {
    const m = mobile ? 0.85 : 1;
    const S = [
      { A: [sx, AJUSTES.columna.giroDerecha, AJUSTES.columna.escala * m], B: [sx, AJUSTES.simple.giro, 0], T: 0 },   // 0: ducha plateada a la derecha
      { A: [-sx, AJUSTES.columna.giroIzquierda, AJUSTES.columna.escala * m], B: [sx, AJUSTES.simple.giro, 0], T: 1 }, // 1: ducha a la izquierda mirando a la derecha y atrás + toallas
      { A: [-sx, AJUSTES.columna.giroIzquierda, 0], B: [sx, AJUSTES.simple.giro, AJUSTES.simple.escala * m], T: 0 }   // 2: ducha 1 grande a la derecha
    ][i];
    ['A', 'B'].forEach(k => {
      const a = S[k]; tg[k] = { x: a[0], ry: a[1], s: a[2] };
      if (cur[k].s < 0.05) { cur[k].x = a[0]; cur[k].ry = a[1]; } // si está oculta, aparece directo en su lugar
    });
    tg.T = S.T;
  }
  function layout() {
    const w = cont.clientWidth || 1, h = cont.clientHeight || 1;
    renderer.setSize(w, h); camera.aspect = w / h; mobile = innerWidth <= 760;
    const tn = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((mobile ? 3.5 : 3.6) / (2 * tn), (mobile ? 3.2 : 0) / (2 * tn * camera.aspect)) * AJUSTES.zoom;
    camera.position.set(0, 1.45 - AJUSTES.altura, dist); camera.lookAt(0, 1.25 - AJUSTES.altura, 0); camera.updateProjectionMatrix();
    sx = mobile ? 0 : (Math.min(w, 1040) / 4) * (2 * tn * dist / h) * AJUSTES.separacion;
    setScene(idx);
  }

  // ===== Textos que cambian de lado =====
  let timer;
  const fill = S => {
    $('hEyebrow').textContent = S.eyebrow; $('hTitulo').innerHTML = S.titulo; $('hParrafo').textContent = S.texto;
    $('hCta').innerHTML = S.botones.map(([t, h, c]) => `<a class="${c}" href="${h}">${t}</a>`).join('');
  };
  function go(n) {
    idx = n; clearTimeout(timer);
    [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i === n));
    texto.classList.add('oculto');
    setTimeout(() => { fill(SLIDES[n]); texto.classList.remove('izq', 'der'); texto.classList.add(SLIDES[n].lado); texto.classList.remove('oculto'); }, reduce ? 0 : 420);
    setScene(n);
    if (!reduce) timer = setTimeout(() => go((n + 1) % SLIDES.length), TIEMPO);
  }
  SLIDES.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1)); b.onclick = () => go(i); dotsEl.appendChild(b); });

  // ===== Arranque (debe ir ANTES del bucle) =====
  layout(); addEventListener('resize', layout); go(0);

  // ===== Bucle =====
  let vis = true; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(cont);
  const clock = new T.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (!vis || document.hidden) return;
    const k = 1 - Math.exp(-dt * 3);
    [[A, 'A'], [B, 'B']].forEach(([o, key]) => {
      const c = cur[key], g = tg[key];
      c.x += (g.x - c.x) * k; c.ry += (g.ry - c.ry) * k; c.s += (g.s - c.s) * k;
      o.root.visible = c.s > 0.02;
      if (o.root.visible) { o.root.position.x = c.x; o.root.rotation.y = c.ry + Math.sin(t * 0.5) * 0.08; o.root.scale.setScalar(c.s); o.update(dt); }
    });
    cur.T += (tg.T - cur.T) * k; TW.visible = cur.T > 0.02;
    if (TW.visible) { TW.position.x = -sx + AJUSTES.toallas.x; TW.position.y = AJUSTES.toallas.altura; TW.scale.setScalar(cur.T * AJUSTES.toallas.escala); TW.userData.sw.forEach((s, i) => s.rotation.z = Math.sin(t * 1.3 + i * 2) * 0.02); }
    renderer.render(scene, camera);
  })();

  }
})();
