import * as THREE from 'three';
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .42, metalness: .08, ...o });
const mesh = (g, m, p = [0, 0, 0], r = [0, 0, 0]) => { const o = new THREE.Mesh(g, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = true; return o; };
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function plane() {
  const g = new THREE.Group(), w = M(0xffffff), b = M(0x1F4FA3), d = M(0x10262C, { roughness: .2 });
  g.add(mesh(new THREE.CapsuleGeometry(.32, 1.7, 8, 24), w, [0, 0, 0], [0, 0, Math.PI / 2]));
  g.add(mesh(new THREE.BoxGeometry(.24, .13, .38), d, [.95, .13, 0]));
  g.add(mesh(new THREE.BoxGeometry(.75, .07, 2.9), b, [.1, -.1, 0]));
  g.add(mesh(new THREE.BoxGeometry(.42, .6, .07), b, [-1, .38, 0]));
  g.add(mesh(new THREE.BoxGeometry(.32, .05, 1.1), b, [-1, .1, 0]));
  for (const z of [-.75, .75]) g.add(mesh(new THREE.CylinderGeometry(.15, .15, .55, 20), d, [.3, -.32, z], [0, 0, Math.PI / 2]));
  g.rotation.z = .12; return g;
}
export function scope() {
  const g = new THREE.Group(), metal = M(0xdfe7e9, { metalness: .7, roughness: .25 });
  g.add(mesh(new THREE.CylinderGeometry(1.25, 1.25, .12, 48), M(0x0B4F47), [0, 0, -.1], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(1.25, .07, 16, 64), M(0xffffff), [0, 0, -.02]));
  const organ = mesh(new THREE.SphereGeometry(1, 32, 24), M(0xE8A38F, { roughness: .3 }), [0, -.2, .1]); organ.scale.set(.75, .5, .55); g.add(organ);
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(.045, .045, 1.9, 12), metal, [s * .85, .62, .35], [0, 0, -s * 1.03]));
    g.add(mesh(new THREE.SphereGeometry(.09, 16, 12), metal, [s * .08, .16, .35]));
  }
  return g;
}
export function extinguisher() {
  const g = new THREE.Group(), red = M(0xE5381C, { roughness: .3 }), dk = M(0x10262C), wh = M(0xffffff);
  g.add(mesh(new THREE.CylinderGeometry(.42, .42, 1.3, 32), red));
  g.add(mesh(new THREE.CylinderGeometry(.435, .435, .38, 32), wh, [0, .05, 0]));
  g.add(mesh(new THREE.CylinderGeometry(.2, .3, .24, 24), dk, [0, .76, 0]));
  g.add(mesh(new THREE.BoxGeometry(.55, .14, .2), dk, [0, .95, 0]));
  g.add(mesh(new THREE.BoxGeometry(.6, .05, .12), dk, [.05, 1.07, 0], [0, 0, -.12]));
  const hose = new THREE.CatmullRomCurve3([new THREE.Vector3(.28, .93, 0), new THREE.Vector3(.8, .8, 0), new THREE.Vector3(.75, .2, 0), new THREE.Vector3(.95, -.05, 0)]);
  g.add(mesh(new THREE.TubeGeometry(hose, 24, .05, 8), dk));
  const flame = new THREE.Group(); flame.position.set(1.75, -.1, 0);
  [[.45, 1.1, 0xFF7A2A, 0], [.32, .85, 0xFFC247, .05], [.18, .6, 0xffffff, .1]].forEach(([r, h, c, z]) => {
    const f = mesh(new THREE.ConeGeometry(r, h, 20), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .7, roughness: .6 }), [0, h / 2 - .55, z]);
    f.castShadow = false; flame.add(f);
  });
  g.add(flame);
  g.userData.update = t => { flame.children.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 9 + i) * .06, 1 + Math.sin(t * 12 + i * 2) * .14, 1); }); };
  g.position.y = .1; return g;
}
export function hero() {
  const g = new THREE.Group(), a = plane(), s = scope(), e = extinguisher();
  a.position.set(-2.1, .95, -.6); a.rotation.y = .55; a.scale.setScalar(.85);
  s.position.set(2.0, .85, -.4); s.scale.setScalar(.95);
  e.position.set(-.1, -.25, 1.2); e.scale.setScalar(.9);
  g.add(a, s, e);
  g.userData.update = t => { a.position.y = .95 + Math.sin(t * 1.3) * .12; s.position.y = .85 + Math.sin(t * 1.1 + 1) * .1; e.userData.update(t); };
  return g;
}

/* Mounts one model on a canvas. opt: sway (hero), spin (cards), cam:[y,z,lookY], floor */
export function mount(canvas, build, opt = {}) {
  let ren; try { ren = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return false; }
  ren.setPixelRatio(Math.min(devicePixelRatio, 2)); ren.shadowMap.enabled = true;
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, .1, 60), [cy, cz, look] = opt.cam || [.6, 6.4, 0];
  cam.position.set(0, cy, cz); cam.lookAt(0, look, 0);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x8fb0d0, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); sc.add(key);
  const obj = build(); sc.add(obj);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(opt.floorR || 3, 48), new THREE.ShadowMaterial({ opacity: .28 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = opt.floor ?? -1; floor.receiveShadow = true; sc.add(floor);
  const fit = () => { const r = canvas.getBoundingClientRect(); if (!r.width) return; ren.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); };
  new ResizeObserver(fit).observe(canvas); fit();
  let px = 0, py = 0, sx = 0, sy = 0, boost = 1, on = false, t0 = performance.now();
  const frame = now => {
    if (!on) return; const t = (now - t0) / 1000;
    sx += (px - sx) * .07; sy += (py - sy) * .07;
    if (opt.sway) obj.rotation.y = still ? 0 : Math.sin(t * .45) * .3 + sx * .5;
    else obj.rotation.y = still ? .5 : t * (opt.spin ?? .6) * boost + sx;
    obj.rotation.x = sy * .25;
    if (!opt.sway && !still) obj.position.y = Math.sin(t * 1.5) * .05;
    obj.userData.update && obj.userData.update(still ? 0 : t);
    ren.render(sc, cam); requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) requestAnimationFrame(frame); }).observe(canvas);
  const host = opt.hover || window;
  host.addEventListener('pointermove', e => { const r = (opt.hover ? host : document.documentElement).getBoundingClientRect(); const w = r.width || innerWidth, h = r.height || innerHeight;
    px = ((e.clientX - r.left) / w - .5) * 2; py = ((e.clientY - r.top) / h - .5) * 2; if (opt.hover) boost = 3; });
  if (opt.hover) host.addEventListener('pointerleave', () => { px = py = 0; boost = 1; });
  return true;
}
