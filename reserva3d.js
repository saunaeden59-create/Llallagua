// ===== Objetos 3D de la página Reservar: cronómetro, reloj y reloj de arena =====
// Todo se genera por código (no necesita archivos .glb) y con fondo transparente.

const PALETA = {
  crema: "#f4ecdc",
  tinta: "#2a1d14",
  terra: "#c0562f",
  cedro: "#6f9a68",
  oro: 0xd7a44a,
  madera: 0x8a5a36,
};

// ---------- Utilidades ----------
function texturaEsfera(dibujar) {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  g.scale(2, 2); // trabajamos en un lienzo de 512x512
  dibujar(g);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;
  return t;
}

function marcas(g, cx, cy, r, n, largo, ancho, cada, largoGrande, anchoGrande) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const grande = cada && i % cada === 0;
    const l = grande ? largoGrande : largo;
    g.lineWidth = grande ? anchoGrande : ancho;
    g.beginPath();
    g.moveTo(cx + Math.sin(a) * r, cy - Math.cos(a) * r);
    g.lineTo(cx + Math.sin(a) * (r - l), cy - Math.cos(a) * (r - l));
    g.stroke();
  }
}

function aguja(largo, ancho, color, cola = 0.15) {
  // aguja que apunta hacia +Y, con su pivote en el origen
  const forma = new THREE.Shape();
  forma.moveTo(-ancho, -cola);
  forma.lineTo(ancho, -cola);
  forma.lineTo(ancho * 0.45, largo * 0.85);
  forma.lineTo(0, largo);
  forma.lineTo(-ancho * 0.45, largo * 0.85);
  forma.closePath();
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(forma),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })
  );
  return m;
}

function metal(color, rugosidad = 0.32, metalico = 0.75) {
  return new THREE.MeshStandardMaterial({ color, roughness: rugosidad, metalness: metalico });
}

// ---------- Cronómetro ----------
function crearCronometro() {
  const grupo = new THREE.Group();
  const dorado = metal(PALETA.oro, 0.3, 0.8);
  const rojo = metal(0xb4472a, 0.4, 0.5);

  // Caja redonda (eje en Z)
  const caja = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.4, 64), dorado);
  caja.rotation.x = Math.PI / 2;
  grupo.add(caja);

  // Aro frontal (bisel)
  const bisel = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 24, 96), metal(0xf0c36e, 0.25, 0.9));
  bisel.position.z = 0.2;
  grupo.add(bisel);

  // Esfera
  const tex = texturaEsfera(g => {
    g.fillStyle = PALETA.crema;
    g.fillRect(0, 0, 512, 512);
    const rg = g.createRadialGradient(256, 256, 40, 256, 256, 256);
    rg.addColorStop(0, "rgba(255,255,255,.55)");
    rg.addColorStop(1, "rgba(120,80,40,.22)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 512);

    g.strokeStyle = PALETA.tinta;
    marcas(g, 256, 256, 236, 60, 12, 1.5, 5, 24, 4);   // 60 segundos
    marcas(g, 256, 256, 236, 300, 6, 0.8, 0, 0, 0);     // quintos de segundo

    g.fillStyle = PALETA.tinta;
    g.font = "bold 30px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let i = 5; i <= 60; i += 5) {
      const a = (i / 60) * Math.PI * 2;
      g.fillText(String(i === 60 ? 60 : i), 256 + Math.sin(a) * 188, 256 - Math.cos(a) * 188);
    }

    // Subesfera de minutos
    g.beginPath();
    g.arc(256, 340, 62, 0, Math.PI * 2);
    g.strokeStyle = PALETA.tinta;
    g.lineWidth = 2;
    g.stroke();
    marcas(g, 256, 340, 58, 30, 6, 1.2, 5, 11, 2.5);
    g.font = "bold 15px Georgia, serif";
    for (let i = 5; i <= 30; i += 5) {
      const a = (i / 30) * Math.PI * 2;
      g.fillText(String(i), 256 + Math.sin(a) * 40, 340 - Math.cos(a) * 40);
    }

    g.fillStyle = PALETA.terra;
    g.font = "italic 22px Georgia, serif";
    g.fillText("Sauna Edén", 256, 168);
  });
  const esfera = new THREE.Mesh(
    new THREE.CircleGeometry(0.97, 96),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0 })
  );
  esfera.position.z = 0.201;
  grupo.add(esfera);

  // Corona, botón superior y anilla
  const corona = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.28, 32), dorado);
  corona.position.y = 1.17;
  const boton = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.14, 32), rojo);
  boton.position.y = 1.38;
  const anilla = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 16, 48), dorado);
  anilla.position.set(0, 1.62, 0);
  grupo.add(corona, boton, anilla);

  // Botones laterales
  [-1, 1].forEach(lado => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.2, 20), rojo);
    b.position.set(Math.sin(lado * 0.72) * 1.12, Math.cos(lado * 0.72) * 1.12, 0);
    b.rotation.z = -lado * 0.72;
    grupo.add(b);
  });

  // Agujas
  const seg = new THREE.Group();
  const a1 = aguja(0.86, 0.022, 0xc0392b, 0.2);
  seg.add(a1);
  seg.position.z = 0.23;
  grupo.add(seg);

  const min = new THREE.Group();
  const a2 = aguja(0.2, 0.012, 0x2a1d14, 0.03);
  min.add(a2);
  min.position.set(0, -0.328, 0.215);
  grupo.add(min);

  const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 20), dorado);
  eje.rotation.x = Math.PI / 2;
  eje.position.z = 0.24;
  grupo.add(eje);

  return {
    obj: grupo,
    tam: 2.9,
    actualizar(t) {
      const s = t % 60;                       // vuelta de segundos
      seg.rotation.z = -(s / 60) * Math.PI * 2;
      min.rotation.z = -((t / 60) % 30 / 30) * Math.PI * 2;
    },
  };
}

// ---------- Reloj de pared ----------
function crearReloj() {
  const grupo = new THREE.Group();

  // Marco
  const marco = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 64), metal(0x3a2a1d, 0.55, 0.15));
  marco.rotation.x = Math.PI / 2;
  const aro = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.09, 24, 96), metal(PALETA.oro, 0.28, 0.85));
  aro.position.z = 0.15;
  const aroInterior = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.025, 16, 96), metal(0xa9cfa0, 0.4, 0.4));
  aroInterior.position.z = 0.17;
  grupo.add(marco, aro, aroInterior);

  const tex = texturaEsfera(g => {
    g.fillStyle = "#f6efe4";
    g.fillRect(0, 0, 512, 512);
    const rg = g.createRadialGradient(256, 256, 30, 256, 256, 256);
    rg.addColorStop(0, "rgba(255,255,255,.5)");
    rg.addColorStop(1, "rgba(120,80,40,.18)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 512);

    g.strokeStyle = PALETA.tinta;
    marcas(g, 256, 256, 238, 60, 9, 1.4, 5, 24, 5);

    g.fillStyle = PALETA.tinta;
    g.font = "bold 46px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillText(String(i), 256 + Math.sin(a) * 182, 256 - Math.cos(a) * 182);
    }
    g.fillStyle = PALETA.terra;
    g.font = "italic 26px Georgia, serif";
    g.fillText("Edén", 256, 340);
  });
  const esfera = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 96),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
  );
  esfera.position.z = 0.152;
  grupo.add(esfera);

  const hora = new THREE.Group();
  hora.add(aguja(0.5, 0.05, 0x2a1d14, 0.1));
  hora.position.z = 0.18;
  const minuto = new THREE.Group();
  minuto.add(aguja(0.78, 0.036, 0x2a1d14, 0.12));
  minuto.position.z = 0.2;
  const segundo = new THREE.Group();
  segundo.add(aguja(0.85, 0.014, 0xc0562f, 0.2));
  segundo.position.z = 0.22;
  grupo.add(hora, minuto, segundo);

  const centro = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), metal(PALETA.oro, 0.25, 0.9));
  centro.position.z = 0.23;
  grupo.add(centro);

  return {
    obj: grupo,
    tam: 2.5,
    actualizar() {
      const d = new Date();
      const s = d.getSeconds() + d.getMilliseconds() / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      segundo.rotation.z = -(s / 60) * Math.PI * 2;
      minuto.rotation.z = -(m / 60) * Math.PI * 2;
      hora.rotation.z = -(h / 12) * Math.PI * 2;
    },
  };
}

// ---------- Reloj de arena ----------
function crearRelojArena() {
  const grupo = new THREE.Group(); // se voltea
  const raiz = new THREE.Group();  // se balancea
  raiz.add(grupo);

  const R = 0.7, CUELLO = 0.05, ALTO = 1.1;
  // radio del bulbo a una altura normalizada t (0 = cuello, 1 = extremo)
  const radio = t => CUELLO + (R - CUELLO) * Math.sin(Math.min(t, 1) * Math.PI * 0.5) ** 0.9;

  function perfilVidrio(signo) {
    const p = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      p.push(new THREE.Vector2(radio(t), signo * t * ALTO));
    }
    return p;
  }
  const vidrio = new THREE.MeshPhysicalMaterial({
    color: 0xdff0ff, transparent: true, opacity: 0.2, roughness: 0.05,
    metalness: 0, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide,
  });
  const bulbo1 = new THREE.Mesh(new THREE.LatheGeometry(perfilVidrio(1), 48), vidrio);
  const bulbo2 = new THREE.Mesh(new THREE.LatheGeometry(perfilVidrio(-1), 48), vidrio);
  bulbo1.renderOrder = bulbo2.renderOrder = 3;
  grupo.add(bulbo1, bulbo2);

  // Tapas y columnas de madera
  const madera = new THREE.MeshStandardMaterial({ color: PALETA.madera, roughness: 0.65, metalness: 0.05 });
  [1, -1].forEach(s => {
    const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.12, 48), madera);
    tapa.position.y = s * (ALTO + 0.06);
    const borde = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.025, 12, 48), metal(PALETA.oro, 0.3, 0.8));
    borde.rotation.x = Math.PI / 2;
    borde.position.y = s * (ALTO + 0.12);
    grupo.add(tapa, borde);
  });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, ALTO * 2 + 0.1, 16), metal(PALETA.oro, 0.3, 0.85));
    col.position.set(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8);
    grupo.add(col);
  }

  // Arena
  const arenaMat = new THREE.MeshStandardMaterial({ color: 0xe6b86a, roughness: 0.95 });
  const arenaSup = new THREE.Mesh(new THREE.BufferGeometry(), arenaMat);
  const arenaInf = new THREE.Mesh(new THREE.BufferGeometry(), arenaMat);
  const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 8), arenaMat);
  grupo.add(arenaSup, arenaInf, hilo);

  function reconstruir(fSup) {
    const fInf = 1 - fSup;
    // Arena de arriba: llena desde el cuello hacia arriba
    arenaSup.geometry.dispose();
    arenaInf.geometry.dispose();
    const nivelSup = 0.9 * Math.pow(fSup, 0.65);
    arenaSup.visible = nivelSup > 0.02;
    if (arenaSup.visible) {
      const p = [new THREE.Vector2(0, 0.005)];
      for (let i = 1; i <= 14; i++) {
        const t = (i / 14) * nivelSup;
        p.push(new THREE.Vector2(Math.max(radio(t) * 0.93 - 0.01, 0.01), t * ALTO));
      }
      // la superficie baja un poco en el centro (embudo)
      p.push(new THREE.Vector2(0.01, nivelSup * ALTO - 0.05 * fSup));
      arenaSup.geometry = new THREE.LatheGeometry(p, 40);
    }
    // Arena de abajo: montículo desde la base
    const alto = 0.85 * Math.pow(fInf, 0.75);
    arenaInf.visible = alto > 0.02;
    if (arenaInf.visible) {
      const p = [new THREE.Vector2(0.001, -ALTO + 0.01)];
      const tope = 1 - alto;
      for (let i = 0; i <= 14; i++) {
        const t = 1 - (i / 14) * alto;
        p.push(new THREE.Vector2(radio(t) * 0.93 - 0.01, -t * ALTO));
      }
      p.push(new THREE.Vector2(0.001, -tope * ALTO + 0.14 * Math.min(1, fInf * 2)));
      arenaInf.geometry = new THREE.LatheGeometry(p, 40);
    }
    // Hilo de arena que cae
    const cae = fSup > 0.001 && fInf < 0.999;
    hilo.visible = cae;
    if (cae) {
      const yTop = 0.02;
      const yBase = -(1 - alto) * ALTO + 0.14 * Math.min(1, fInf * 2);
      const largo = Math.max(yTop - yBase, 0.01);
      hilo.scale.y = largo;
      hilo.position.y = yBase + largo / 2;
    }
  }

  const DURACION = 14, PAUSA = 0.4, VUELTA = 1.3;
  let fase = "cae", reloj = 0, f = 1;
  reconstruir(1);

  return {
    obj: raiz,
    tam: 3.1,
    actualizar(_t, dt) {
      reloj += dt;
      if (fase === "cae") {
        f = Math.max(0, 1 - reloj / DURACION);
        reconstruir(f);
        if (f <= 0) { fase = "pausa"; reloj = 0; }
      } else if (fase === "pausa") {
        if (reloj > PAUSA) { fase = "voltea"; reloj = 0; }
      } else {
        const k = Math.min(reloj / VUELTA, 1);
        const suave = k * k * (3 - 2 * k);
        grupo.rotation.z = suave * Math.PI;
        if (k >= 1) {
          // El objeto es simétrico: reiniciamos la rotación y la arena vuelve arriba
          grupo.rotation.z = 0;
          fase = "cae"; reloj = 0; f = 1;
          reconstruir(1);
        }
      }
    },
  };
}

// ---------- Escena genérica por contenedor ----------
function montar(contenedor, crear, opciones = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  contenedor.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x6b4a2e, 1.05));
  const sol = new THREE.DirectionalLight(0xfff1dc, 1.6);
  sol.position.set(3, 4, 5);
  scene.add(sol);
  const relleno = new THREE.PointLight(0xf08a5d, 0.9, 20);
  relleno.position.set(-4, -1, 3);
  scene.add(relleno);
  const brillo = new THREE.PointLight(0xffffff, 0.8, 20);
  brillo.position.set(2, 3, 6);
  scene.add(brillo);

  const item = crear();
  const marco = new THREE.Group();
  marco.add(item.obj);
  scene.add(marco);

  // Arrastrar para girar; al soltar vuelve suavemente
  let arrastrando = false, ax = 0, ay = 0, objX = 0, objY = 0, rotX = 0, rotY = 0;
  const cv = renderer.domElement;
  cv.style.touchAction = "pan-y";
  cv.style.cursor = "grab";
  cv.addEventListener("pointerdown", e => {
    arrastrando = true; ax = e.clientX; ay = e.clientY;
    cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing";
  });
  cv.addEventListener("pointermove", e => {
    if (!arrastrando) return;
    objY += (e.clientX - ax) * 0.012;
    objX += (e.clientY - ay) * 0.008;
    objX = Math.max(-0.8, Math.min(0.8, objX));
    ax = e.clientX; ay = e.clientY;
  });
  const soltar = () => { arrastrando = false; cv.style.cursor = "grab"; };
  cv.addEventListener("pointerup", soltar);
  cv.addEventListener("pointercancel", soltar);

  function ajustar() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // distancia para que el objeto quepa en alto y en ancho
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distAlto = (item.tam / 2) / Math.tan(fov / 2);
    const distAncho = (item.tam / 2) / (Math.tan(fov / 2) * camera.aspect);
    camera.position.set(0, 0, Math.max(distAlto, distAncho) * 1.12);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(contenedor);
  ajustar();

  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t0 = performance.now();
  let previo = t0, visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(contenedor);

  (function animar(ahora) {
    requestAnimationFrame(animar);
    if (!visible) { previo = ahora; return; }
    const dt = Math.min((ahora - previo) / 1000, 0.1);
    previo = ahora;
    const t = (ahora - t0) / 1000;

    item.actualizar(t, dt);

    // balanceo suave + giro del usuario que regresa a 0
    if (!arrastrando) { objX *= 0.94; objY *= 0.94; }
    const idleY = reducir ? 0 : Math.sin(t * 0.7 + (opciones.fase || 0)) * 0.32;
    const idleX = reducir ? 0 : Math.sin(t * 0.5 + 1) * 0.07;
    rotY += (objY + idleY - rotY) * 0.12;
    rotX += (objX + idleX - rotX) * 0.12;
    marco.rotation.y = rotY;
    marco.rotation.x = rotX;
    marco.position.y = reducir ? 0 : Math.sin(t * 1.1) * 0.05;

    renderer.render(scene, camera);
  })(t0);
}

// ---------- Inicio ----------
const slots = [
  ["slotCronometro", crearCronometro, 0],
  ["slotReloj", crearReloj, 1.5],
  ["slotArena", crearRelojArena, 3],
];
slots.forEach(([id, fn, fase]) => {
  const el = document.getElementById(id);
  if (el) montar(el, fn, { fase });
});
