// 3D-модель объёмной буквы: её можно повернуть и раздвинуть на слои.
// Three.js весит много, поэтому этот файл подгружается, только когда блок подходит к экрану (см. fx.js).
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function mount(root) {
  const host = root.querySelector("[data-model]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = innerWidth < 900;
  const clamp = THREE.MathUtils.clamp;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = "model-canvas";
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050b1f); // цвет тёмного блока страницы — края сцены не видны
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0.25, 11.5);
  camera.lookAt(0, 0, 0.2);

  scene.add(new THREE.HemisphereLight(0xa9bcff, 0x0a1030, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9a3d, 1.8);
  rim.position.set(-7, 2, -3);
  scene.add(rim);

  // Контур буквы «B» рисуем сами: стойка, две дуги и два окна — без файла шрифта
  const HALF = Math.PI / 2;
  const letter = new THREE.Shape();
  letter.moveTo(0, 0);
  letter.lineTo(1.25, 0);
  letter.absarc(1.25, 0.85, 0.85, -HALF, HALF, false);
  letter.lineTo(1.15, 1.63);
  letter.absarc(1.15, 2.315, 0.685, -HALF, HALF, false);
  letter.lineTo(0, 3);
  letter.closePath();
  const windowHole = (y, r, x) => {
    const h = new THREE.Path();
    h.moveTo(0.64, y - r);
    h.lineTo(x, y - r);
    h.absarc(x, y, r, -HALF, HALF, false);
    h.lineTo(0.64, y + r);
    h.closePath();
    return h;
  };
  letter.holes.push(windowHole(0.9, 0.36, 1.2), windowHole(2.29, 0.27, 1.1));
  const shapes = [letter];
  const flat = new THREE.ShapeGeometry(shapes);
  flat.computeBoundingBox();
  const bb = flat.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2;
  const extrude = (depth, bevel = 0) => {
    const g = new THREE.ExtrudeGeometry(shapes, { depth, curveSegments: 12, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 });
    g.translate(-cx, -cy, 0);
    return g;
  };

  const mats = {
    face: new THREE.MeshStandardMaterial({ color: 0xfff1dc, emissive: 0xffc68a, emissiveIntensity: 1.45, roughness: 0.35, transparent: true }),
    led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d2, emissiveIntensity: 2.6, roughness: 0.4, transparent: true }),
    side: new THREE.MeshStandardMaterial({ color: 0xef7b20, metalness: 0.55, roughness: 0.3, side: THREE.DoubleSide, transparent: true }),
    back: new THREE.MeshStandardMaterial({ color: 0x2a3766, metalness: 0.25, roughness: 0.65, transparent: true })
  };

  // Светодиодные модули — в узлах сетки, которые целиком попадают внутрь буквы
  const { shape: outer, holes } = shapes[0].extractPoints(8);
  const inPoly = (x, y, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  };
  const inside = (x, y) => inPoly(x, y, outer) && !holes.some((h) => inPoly(x, y, h));
  const spots = [], m = 0.16;
  for (let y = bb.min.y + 0.3; y < bb.max.y; y += 0.45)
    for (let x = bb.min.x + 0.3; x < bb.max.x; x += 0.4)
      if (inside(x, y) && inside(x - m, y) && inside(x + m, y) && inside(x, y - m) && inside(x, y + m)) spots.push([x - cx, y - cy]);
  const led = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.13, 0.05), mats.led, spots.length);
  const dummy = new THREE.Object3D();
  spots.forEach(([x, y], i) => { dummy.position.set(x, y, 0); dummy.updateMatrix(); led.setMatrixAt(i, dummy.matrix); });

  // Слои: где стоят в собранной букве (z) и на сколько отъезжают при разборке (move)
  const hiddenCap = new THREE.MeshBasicMaterial({ visible: false });
  const parts = {
    face: { mesh: new THREE.Mesh(extrude(0.07, 0.012), mats.face), z: 0.68, move: 1.75 },
    led: { mesh: led, z: 0.14, move: 0.95 },
    side: { mesh: new THREE.Mesh(extrude(0.62), [hiddenCap, mats.side]), z: 0.06, move: 0 }, // борт — пустая «труба» без торцов
    back: { mesh: new THREE.Mesh(extrude(0.06), mats.back), z: 0, move: -1 }
  };
  const group = new THREE.Group();
  group.position.set(0.45, 0, -0.6);
  for (const p of Object.values(parts)) group.add(p.mesh);
  scene.add(group);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), small ? 0.7 : 0.85, 0.7, 0.88);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 40 : 32; // на узком экране чуть шире угол, чтобы разобранная буква помещалась
    camera.updateProjectionMatrix();
  }

  // --- Состояние ---
  let explode = reduce ? 1 : 0, manual = reduce ? 1 : null, highlight = null, pinned = null;
  let rotY = -0.62, rotX = 0.12, toY = rotY, toX = rotX, idleAt = 0, dragging = false, lastX = 0, lastY = 0;
  const exBtn = root.querySelector("[data-explode]");
  const partBtns = [...root.querySelectorAll("[data-part]")];
  const target = () => {
    if (manual !== null) return manual;
    const top = host.getBoundingClientRect().top;
    return clamp((innerHeight * 0.92 - top) / (innerHeight * 0.6), 0, 1); // буква раскрывается, пока блок въезжает в экран
  };

  exBtn.addEventListener("click", () => { manual = target() >= 0.5 ? 0 : 1; });
  partBtns.forEach((b) => {
    const k = b.dataset.part;
    b.addEventListener("pointerenter", () => { highlight = k; });
    b.addEventListener("pointerleave", () => { highlight = pinned; });
    b.addEventListener("focus", () => { highlight = k; });
    b.addEventListener("blur", () => { highlight = pinned; });
    b.addEventListener("click", () => {
      pinned = pinned === k ? null : k;
      highlight = pinned;
      partBtns.forEach((o) => o.setAttribute("aria-pressed", o.dataset.part === pinned));
      if (pinned) manual = 1; // чтобы показать слой, букву нужно раскрыть
    });
  });

  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    toY = clamp(toY + (e.clientX - lastX) * 0.009, -1.3, 1.3);
    toX = clamp(toX + (e.clientY - lastY) * 0.006, -0.45, 0.5);
    lastX = e.clientX; lastY = e.clientY;
  });
  const release = () => { dragging = false; idleAt = performance.now() + 2600; };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  let raf = 0, shown = false, wasOpen = null;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const goal = target();
    explode += (goal - explode) * 0.07;
    const sway = !reduce && !dragging && t > idleAt ? Math.sin(t * 0.00045) * 0.22 : 0;
    rotY += (toY + sway - rotY) * 0.08;
    rotX += (toX - rotX) * 0.08;
    group.rotation.set(rotX, rotY, 0);
    for (const [k, p] of Object.entries(parts)) {
      p.mesh.position.z = p.z + p.move * explode;
      const mat = mats[k], to = highlight && highlight !== k ? 0.12 : 1;
      mat.opacity += (to - mat.opacity) * 0.14;
    }
    // Собранная буква светится лицом; в разобранной видно, что светят модули
    mats.face.emissiveIntensity = 1.45 - explode * 0.75;
    composer.render();
    const open = goal >= 0.5;
    if (open !== wasOpen) { wasOpen = open; exBtn.textContent = open ? exBtn.dataset.on : exBtn.dataset.off; }
    if (!shown) { shown = true; host.classList.add("is-3d"); }
  }

  new ResizeObserver(resize).observe(host);
  resize();
  let seen = false;
  const sync = () => {
    if (seen && !document.hidden) { if (!raf) raf = requestAnimationFrame(frame); }
    else { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver(([en]) => { seen = en.isIntersecting; sync(); }, { threshold: 0.02 }).observe(host);
  document.addEventListener("visibilitychange", sync);
}
