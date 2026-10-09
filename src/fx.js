// BST Phuket — «технологичный» слой. Блоки взяты с React Bits (reactbits.dev, лицензия MIT + Commons Clause)
// и перенесены с React на чистый JS без библиотек: LightRays, ElectricBorder, ScrollVelocity, TiltedCard, Magnet, ClickSpark.
// Слой необязательный: без этого файла сайт выглядит проще, но работает так же.
(() => {
  const HERE = document.currentScript.src; // адрес этого файла — от него считаем путь к 3D-сцене
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = reduce || navigator.connection?.saveData || (navigator.deviceMemory || 8) <= 2;
  const hover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // Анимация идёт, только пока блок на экране и вкладка открыта
  function whileVisible(el, start, stop) {
    let seen = false;
    const sync = () => (seen && !document.hidden ? start() : stop());
    new IntersectionObserver(([en]) => { seen = en.isIntersecting; sync(); }, { threshold: 0.05 }).observe(el);
    document.addEventListener("visibilitychange", sync);
  }

  // ---------- LightRays: объёмные лучи света на WebGL (первый экран) ----------
  const VERT = "attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}";
  const FRAG = `precision highp float;
uniform float iTime;uniform vec2 iResolution;uniform vec2 rayPos;uniform vec2 rayDir;uniform vec3 raysColor;
uniform float raysSpeed;uniform float lightSpread;uniform float rayLength;uniform float fadeDistance;
uniform vec2 mousePos;uniform float mouseInfluence;uniform float noiseAmount;uniform float distortion;
float noise(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}
float rayStrength(vec2 raySource,vec2 rayRefDirection,vec2 coord,float seedA,float seedB,float speed){
  vec2 sourceToCoord=coord-raySource;vec2 dirNorm=normalize(sourceToCoord);float cosAngle=dot(dirNorm,rayRefDirection);
  float distortedAngle=cosAngle+distortion*sin(iTime*2.0+length(sourceToCoord)*0.01)*0.2;
  float spreadFactor=pow(max(distortedAngle,0.0),1.0/max(lightSpread,0.001));
  float dist=length(sourceToCoord);float maxDistance=iResolution.x*rayLength;
  float lengthFalloff=clamp((maxDistance-dist)/maxDistance,0.0,1.0);
  float fadeFalloff=clamp((iResolution.x*fadeDistance-dist)/(iResolution.x*fadeDistance),0.5,1.0);
  float baseStrength=clamp((0.45+0.15*sin(distortedAngle*seedA+iTime*speed))+(0.3+0.2*cos(-distortedAngle*seedB+iTime*speed)),0.0,1.0);
  return baseStrength*lengthFalloff*fadeFalloff*spreadFactor;}
void main(){
  vec2 coord=vec2(gl_FragCoord.x,iResolution.y-gl_FragCoord.y);
  vec2 mouseDirection=normalize(mousePos*iResolution.xy-rayPos);
  vec2 finalRayDir=normalize(mix(rayDir,mouseDirection,mouseInfluence));
  vec4 rays1=vec4(1.0)*rayStrength(rayPos,finalRayDir,coord,36.2214,21.11349,1.5*raysSpeed);
  vec4 rays2=vec4(1.0)*rayStrength(rayPos,finalRayDir,coord,22.3991,18.0234,1.1*raysSpeed);
  vec4 c=rays1*0.5+rays2*0.4;
  float n=noise(coord*0.01+iTime*0.1);c.rgb*=(1.0-noiseAmount+noiseAmount*n);
  float brightness=1.0-(coord.y/iResolution.y);
  c.x*=0.1+brightness*0.8;c.y*=0.3+brightness*0.6;c.z*=0.5+brightness*0.5;
  c.rgb*=raysColor;gl_FragColor=c;}`;

  function lightRays(host) {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-rays";
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return canvas.remove();
    const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return canvas.remove();
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const origin = [Number(host.dataset.rays) || 0.72, -0.2];
    gl.uniform3f(U("raysColor"), 1, 0.74, 0.47); // тёплый свет в тон фирменному оранжевому
    gl.uniform1f(U("raysSpeed"), 1);
    gl.uniform1f(U("lightSpread"), 0.9);
    gl.uniform1f(U("rayLength"), 1.7);
    gl.uniform1f(U("fadeDistance"), 1.1);
    gl.uniform1f(U("mouseInfluence"), hover ? 0.16 : 0);
    gl.uniform1f(U("noiseAmount"), 0.08);
    gl.uniform1f(U("distortion"), 0.04);
    gl.uniform2f(U("rayDir"), -0.12, 0.993);
    const uTime = U("iTime"), uMouse = U("mousePos"), uRes = U("iResolution"), uPos = U("rayPos");
    const mouse = [origin[0] - 0.1, 0.8], smooth = [...mouse];

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1 : 1.5);
      const w = Math.round(host.clientWidth * dpr), h = Math.round(host.clientHeight * dpr);
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uPos, origin[0] * w, origin[1] * h);
    }
    function draw(t) {
      smooth[0] += (mouse[0] - smooth[0]) * 0.06;
      smooth[1] += (mouse[1] - smooth[1]) * 0.06;
      gl.uniform1f(uTime, t * 0.001);
      gl.uniform2f(uMouse, smooth[0], smooth[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    let raf = 0, last = 0;
    const frame = (t) => { raf = requestAnimationFrame(frame); if (t - last < 30) return; last = t; draw(t); };
    new ResizeObserver(() => { size(); if (!raf) draw(2400); }).observe(host);
    size();
    draw(2400);
    canvas.classList.add("is-on");
    if (reduce) return;
    if (hover) addEventListener("pointermove", (e) => {
      const r = host.getBoundingClientRect();
      mouse[0] = (e.clientX - r.left) / r.width; mouse[1] = (e.clientY - r.top) / r.height;
    }, { passive: true });
    whileVisible(host, () => { if (!raf) raf = requestAnimationFrame(frame); }, () => { cancelAnimationFrame(raf); raf = 0; });
  }

  // ---------- ElectricBorder: «электрическая» рамка вокруг формы заявки ----------
  function electricBorder(el, { color = "#FF9A3D", speed = 0.9, chaos = 0.1 } = {}) {
    const PAD = 40, DISPLACE = 60;
    const layer = document.createElement("span");
    layer.className = "eb";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = '<canvas></canvas><i class="eb-g1"></i><i class="eb-g2"></i><i class="eb-bg"></i>';
    el.classList.add("has-eb");
    el.prepend(layer);
    const canvas = layer.firstChild, ctx = canvas.getContext("2d");
    const rnd = (x) => (Math.sin(x * 12.9898) * 43758.5453) % 1;
    function noise2D(x, y) {
      const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
      const a = rnd(i + j * 57), b = rnd(i + 1 + j * 57), c = rnd(i + (j + 1) * 57), d = rnd(i + 1 + (j + 1) * 57);
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    }
    function octaved(x, time, seed) {
      let y = 0, amp = chaos, freq = 10;
      for (let i = 0; i < 10; i++) {
        if (i) y += amp * noise2D(freq * x + seed * 100, time * freq * 0.3); // первая октава в оригинале обнулена
        freq *= 1.6; amp *= 0.7;
      }
      return y;
    }
    const corner = (cx, cy, r, from, p) => [cx + r * Math.cos(from + p * Math.PI / 2), cy + r * Math.sin(from + p * Math.PI / 2)];
    function point(t, l, tp, w, h, r) {
      const sw = w - 2 * r, sh = h - 2 * r, arc = (Math.PI * r) / 2;
      let d = t * (2 * sw + 2 * sh + 4 * arc);
      if (d <= sw) return [l + r + d, tp];
      d -= sw; if (d <= arc) return corner(l + w - r, tp + r, r, -Math.PI / 2, d / arc);
      d -= arc; if (d <= sh) return [l + w, tp + r + d];
      d -= sh; if (d <= arc) return corner(l + w - r, tp + h - r, r, 0, d / arc);
      d -= arc; if (d <= sw) return [l + w - r - d, tp + h];
      d -= sw; if (d <= arc) return corner(l + r, tp + h - r, r, Math.PI / 2, d / arc);
      d -= arc; if (d <= sh) return [l, tp + h - r - d];
      return corner(l + r, tp + r, r, Math.PI, (d - sh) / arc);
    }
    let W = 0, H = 0, dpr = 1, time = 0, last = 0, raf = 0;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = el.offsetWidth + PAD * 2; H = el.offsetHeight + PAD * 2;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    }
    function draw() {
      const bw = W - 2 * PAD, bh = H - 2 * PAD;
      const radius = Math.min(parseFloat(getComputedStyle(el).borderRadius) || 22, bw / 2, bh / 2);
      const samples = Math.floor((2 * (bw + bh) + 2 * Math.PI * radius) / 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const p = i / samples, [x, y] = point(p, PAD, PAD, bw, bh, radius);
        ctx.lineTo(x + octaved(p * 8, time, 0) * DISPLACE, y + octaved(p * 8, time, 1) * DISPLACE);
      }
      ctx.closePath();
      ctx.stroke();
    }
    const frame = (t) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 32) return;
      time += (Math.min(t - last, 100) / 1000) * speed; last = t;
      draw();
    };
    new ResizeObserver(() => { size(); draw(); }).observe(el);
    size(); draw();
    if (reduce) return;
    whileVisible(el, () => { if (!raf) raf = requestAnimationFrame(frame); }, () => { cancelAnimationFrame(raf); raf = 0; });
  }

  // ---------- ScrollVelocity: лента ускоряется и меняет направление вместе с прокруткой ----------
  function scrollVelocity(el) {
    const track = el.firstElementChild;
    el.classList.add("is-live");
    let x = 0, dir = -1, vel = 0, lastY = scrollY, last = 0, raf = 0;
    const frame = (t) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(t - (last || t), 50) / 1000; last = t;
      if (!dt) return;
      const half = track.scrollWidth / 2;
      vel += ((scrollY - lastY) / dt - vel) * 0.1; lastY = scrollY;
      if (Math.abs(vel) > 40) dir = vel > 0 ? -1 : 1;
      x += dir * 44 * dt * (1 + Math.min(1.5, Math.abs(vel) / 420));
      if (x <= -half) x += half; else if (x > 0) x -= half;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    };
    whileVisible(el, () => { if (!raf) { last = 0; lastY = scrollY; raf = requestAnimationFrame(frame); } }, () => { cancelAnimationFrame(raf); raf = 0; });
  }

  // ---------- TiltedCard: плитки каталога наклоняются вслед за мышью, картинка внутри смещается ----------
  function tilt(el) {
    let f = 0;
    el.addEventListener("pointermove", (e) => {
      if (f) return;
      f = requestAnimationFrame(() => {
        f = 0;
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ty", `${(x * 4).toFixed(2)}deg`);
        el.style.setProperty("--tx", `${(-y * 4).toFixed(2)}deg`);
        el.style.setProperty("--px", `${(-x * 8).toFixed(1)}px`);
        el.style.setProperty("--py", `${(-y * 6).toFixed(1)}px`);
      });
    });
    el.addEventListener("pointerleave", () => ["--tx", "--ty", "--px", "--py"].forEach((p) => el.style.removeProperty(p)));
  }

  // ---------- Magnet: большие кнопки слегка тянутся к курсору ----------
  function magnet(el) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(1)}px,${(((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1)}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  }

  // ---------- ClickSpark: искры от нажатия на оранжевую кнопку ----------
  function clickSpark() {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-sparks";
    canvas.setAttribute("aria-hidden", "true");
    document.body.append(canvas);
    const ctx = canvas.getContext("2d");
    let sparks = [], raf = 0;
    const fit = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    fit();
    addEventListener("resize", fit);
    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter((s) => t - s.t < 440);
      ctx.strokeStyle = "#FFB36B"; ctx.lineWidth = 2; ctx.lineCap = "round";
      for (const s of sparks) {
        const e = 1 - Math.pow(1 - (t - s.t) / 440, 3), d = 8 + e * 26, len = 11 * (1 - e);
        ctx.beginPath();
        ctx.moveTo(s.x + d * Math.cos(s.a), s.y + d * Math.sin(s.a));
        ctx.lineTo(s.x + (d + len) * Math.cos(s.a), s.y + (d + len) * Math.sin(s.a));
        ctx.stroke();
      }
      raf = sparks.length ? requestAnimationFrame(draw) : 0;
    }
    document.addEventListener("pointerdown", (e) => {
      if (!e.target.closest(".btn-accent")) return;
      const t = performance.now();
      for (let i = 0; i < 10; i++) sparks.push({ x: e.clientX, y: e.clientY, a: (Math.PI * 2 * i) / 10, t });
      if (!raf) raf = requestAnimationFrame(draw);
    });
  }

  // ---------- 3D-модель буквы: тяжёлый файл подгружается, только когда блок близко к экрану ----------
  function model(root) {
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      import(new URL(`scene3d.js?v=${window.BST.v3d}`, HERE).href).then((m) => m.mount(root)).catch(() => {}); // нет WebGL — остаётся картинка
    }, { rootMargin: "700px 0px" });
    io.observe(root);
  }

  function init() {
    if (!lite) $$(".model").forEach(model);
    if (!lite) $$("[data-rays]").forEach(lightRays);
    if (!reduce) $$(".marquee").forEach(scrollVelocity);
    if (hover && !reduce) $$(".bento .tile").forEach(tilt);
    // Спокойный режим (09.10.2026, по просьбе владельца «поскромнее»): электрическая рамка формы, притяжение кнопок
    // и искры от нажатия выключены. Вернуть — поставить LOUD = true.
    const LOUD = false;
    if (LOUD && !lite) { $$("[data-quiz]").forEach((el) => electricBorder(el)); clickSpark(); }
    if (LOUD && hover && !reduce) $$(".btn-lg").forEach(magnet);
  }
  // Не мешаем первой отрисовке: эффекты включаются, когда браузер свободен
  (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(init, { timeout: 1200 });
})();
