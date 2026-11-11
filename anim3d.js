// DesligaApê — animação 3D de como funciona (three.js)
import * as THREE from 'three';
import { RoundedBoxGeometry } from './RoundedBoxGeometry.js';

const host = document.getElementById('da3d');
if (host) start(host);

function start(host) {
  const canvasWrap = host.querySelector('.da3d-canvas');
  const labelsEl = host.querySelector('.da3d-labels');
  const capTitle = document.getElementById('da3d-cap-title');
  const capText = document.getElementById('da3d-cap-text');
  const capStep = document.getElementById('da3d-cap-step');
  const timerEl = document.getElementById('da3d-timer');
  const barEl = document.getElementById('da3d-bar');
  const statusEl = document.getElementById('da3d-status');
  const dots = Array.from(document.querySelectorAll('.da3d-dot'));

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    host.classList.add('da3d-nowebgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  canvasWrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // ---------- materiais ----------
  const M = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...opts });
  const mat = {
    floor: M(0xc9a27e, { roughness: 0.6 }),
    plank: M(0xb88f6b, { roughness: 0.6 }),
    wallBack: M(0xf3efe6),
    wallLeft: M(0xece6da),
    baseboard: M(0xffffff),
    rug: M(0xcfd9cf, { roughness: 1 }),
    bedFrame: M(0x6b4f3a),
    mattress: M(0xffffff),
    blanket: M(0x2d5a43),
    pillow: M(0xeef1e8),
    sofa: M(0x5e7f8f),
    sofaCushion: M(0x6f93a3),
    wood: M(0x8a6447),
    tv: M(0x111416, { roughness: 0.3 }),
    tvScreen: new THREE.MeshStandardMaterial({ color: 0x0b0f12, emissive: 0x2a4a5f, emissiveIntensity: 0.6, roughness: 0.2 }),
    plantPot: M(0xd9d2c4),
    plant: M(0x3f7d4f),
    door: M(0xa77b57, { roughness: 0.55 }),
    doorFrame: M(0x5b4636),
    knob: M(0xd8c28a, { metalness: 0.6, roughness: 0.3 }),
    acBody: M(0xfafafa, { roughness: 0.4 }),
    acVent: M(0xd9dee0),
    ledGreen: new THREE.MeshStandardMaterial({ color: 0x1f8f4a, emissive: 0x33c26b, emissiveIntensity: 2 }),
    ledOff: new THREE.MeshStandardMaterial({ color: 0x555555 }),
    panel: M(0xc9cfcb, { roughness: 0.5 }),
    central: M(0x0f1f17, { roughness: 0.4 }),
    sensor: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xd7f24b, emissiveIntensity: 0, roughness: 0.4 }),
    button: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xd7f24b, emissiveIntensity: 0, roughness: 0.4 }),
    buttonRing: M(0x0f1f17),
    lampShade: new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffd98a, emissiveIntensity: 1.5, roughness: 0.6 }),
    window: new THREE.MeshStandardMaterial({ color: 0xbfe3f5, emissive: 0x9fd2ec, emissiveIntensity: 0.35, roughness: 0.1 }),
    windowFrame: M(0xffffff),
    hall: M(0xb7b2a7),
    skin: M(0xc68e6a),
    shirt: M(0xd96a3a),
    pants: M(0x2f3e55),
    hair: M(0x2b211b),
    air: new THREE.MeshBasicMaterial({ color: 0x9ed3f0, transparent: true, opacity: 0.6, depthWrite: false })
  };

  const box = (w, h, d, m, r = 0) => {
    const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

  // Sala: x 0..6 (largura), z 0..5 (profundidade), y altura 0..2.8
  const W = 6, D = 5, H = 2.8, T = 0.12;
  const room = new THREE.Group();
  scene.add(room);

  // piso com tábuas
  const floor = box(W, 0.06, D, mat.floor);
  at(floor, W / 2, -0.03, D / 2);
  room.add(floor);
  for (let i = 0; i < 12; i++) {
    const p = box(W, 0.005, 0.02, mat.plank);
    p.castShadow = false;
    at(p, W / 2, 0.002, 0.2 + i * 0.42);
    room.add(p);
  }

  // parede do fundo (z=0) com janela
  const back = new THREE.Group();
  room.add(back);
  const wb = (w, h, x, y) => back.add(at(box(w, h, T, mat.wallBack), x, y, -T / 2));
  // janela em x 3.9..5.3, y 1.0..2.1
  wb(3.9, H, 1.95, H / 2);
  wb(0.7, H, 5.65, H / 2);
  wb(1.4, 1.0, 4.6, 0.5);
  wb(1.4, 0.7, 4.6, 2.45);
  const win = at(box(1.4, 1.1, 0.03, mat.window), 4.6, 1.55, -0.06);
  win.castShadow = false;
  back.add(win);
  back.add(at(box(1.5, 0.06, 0.12, mat.windowFrame), 4.6, 1.0, 0));
  back.add(at(box(0.05, 1.1, 0.06, mat.windowFrame), 4.6, 1.55, -0.02));
  back.add(at(box(W, 0.1, 0.03, mat.baseboard), W / 2, 0.05, 0.015));

  // parede esquerda (x=0) com porta em z 3.4..4.3, altura 2.1
  const left = new THREE.Group();
  room.add(left);
  const wl = (d, h, z, y) => left.add(at(box(T, h, d, mat.wallLeft), -T / 2, y, z));
  wl(3.4, H, 1.7, H / 2);
  wl(0.7, H, 4.65, H / 2);
  wl(0.9, H - 2.1, 3.85, 2.1 + (H - 2.1) / 2);
  left.add(at(box(0.03, 0.1, D, mat.baseboard), 0.015, 0.05, D / 2));
  // batente
  left.add(at(box(0.16, 2.16, 0.06, mat.doorFrame), -0.04, 1.08, 3.37));
  left.add(at(box(0.16, 2.16, 0.06, mat.doorFrame), -0.04, 1.08, 4.33));
  left.add(at(box(0.16, 0.06, 1.0, mat.doorFrame), -0.04, 2.13, 3.85));
  // corredor do lado de fora
  const hall = box(1.6, 0.04, 2.2, mat.hall);
  at(hall, -0.9, -0.02, 3.85);
  room.add(hall);

  // folha da porta (pivô na dobradiça z=3.4)
  const doorPivot = new THREE.Group();
  at(doorPivot, -0.03, 0, 3.4);
  left.add(doorPivot);
  const doorLeaf = box(0.05, 2.08, 0.9, mat.door, 0.01);
  at(doorLeaf, 0, 1.04, 0.45);
  doorPivot.add(doorLeaf);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), mat.knob);
  at(knob, 0.05, 1.0, 0.8);
  doorPivot.add(knob);

  // sensor de porta (no batente, alto)
  const sensor = box(0.04, 0.16, 0.05, mat.sensor, 0.01);
  at(sensor, 0.05, 2.0, 4.25);
  left.add(sensor);
  // botão ao lado da porta
  const btnGroup = new THREE.Group();
  at(btnGroup, 0.02, 1.15, 4.7);
  left.add(btnGroup);
  const btnPlate = box(0.03, 0.14, 0.14, mat.buttonRing, 0.02);
  btnGroup.add(btnPlate);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24), mat.button);
  btn.rotation.z = Math.PI / 2;
  at(btn, 0.025, 0, 0);
  btnGroup.add(btn);

  // central e quadro na parede do fundo
  const panel = box(0.1, 0.56, 0.42, mat.panel, 0.02);
  at(panel, 0.05, 1.55, 2.0);
  room.add(panel);
  const panelLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), mat.ledGreen.clone());
  at(panelLed, 0.11, 1.72, 2.0);
  room.add(panelLed);
  const central = box(0.08, 0.2, 0.3, mat.central, 0.02);
  at(central, 0.04, 1.6, 2.65);
  room.add(central);
  const centralLed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd7f24b, emissive: 0xd7f24b, emissiveIntensity: 1.5 }));
  at(centralLed, 0.085, 1.65, 2.55);
  room.add(centralLed);

  // ar-condicionado split
  const ac = box(1.05, 0.3, 0.22, mat.acBody, 0.05);
  at(ac, 2.6, 2.3, 0.13);
  room.add(ac);
  const acVent = box(0.9, 0.03, 0.05, mat.acVent);
  at(acVent, 2.6, 2.17, 0.23);
  room.add(acVent);
  const acLed = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), mat.ledGreen.clone());
  at(acLed, 3.0, 2.3, 0.245);
  room.add(acLed);
  // fluxo de ar (fitas animadas)
  const airGroup = new THREE.Group();
  room.add(airGroup);
  const airs = [];
  for (let i = 0; i < 9; i++) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.025), mat.air.clone());
    a.userData.phase = i / 9;
    a.userData.x = 2.6 + ((i % 3) - 1) * 0.05;
    airGroup.add(a);
    airs.push(a);
  }

  // luminária de teto (pendente)
  const lampGroup = new THREE.Group();
  at(lampGroup, 0.45, 0, 0.45);
  room.add(lampGroup);
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 24), mat.central);
  at(lampBase, 0, 0.02, 0);
  lampGroup.add(lampBase);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.45, 8), mat.central);
  at(cord, 0, 0.75, 0);
  lampGroup.add(cord);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.26, 0.32, 32, 1, true), mat.lampShade);
  shade.material.side = THREE.DoubleSide;
  at(shade, 0, 1.55, 0);
  lampGroup.add(shade);
  const lampLight = new THREE.PointLight(0xffd59a, 6, 9, 1.4);
  at(lampLight, 0, 1.45, 0);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.bias = -0.002;
  lampGroup.add(lampLight);

  // tapete
  const rug = box(2.6, 0.01, 2.0, mat.rug);
  rug.castShadow = false;
  at(rug, 3.6, 0.006, 2.7);
  room.add(rug);

  // cama
  const bed = new THREE.Group();
  at(bed, 4.65, 0, 1.25);
  room.add(bed);
  bed.add(at(box(1.7, 0.32, 2.1, mat.bedFrame, 0.03), 0, 0.16, 0));
  bed.add(at(box(1.6, 0.2, 2.0, mat.mattress, 0.06), 0, 0.42, 0));
  bed.add(at(box(1.62, 0.06, 1.3, mat.blanket, 0.03), 0, 0.53, 0.35));
  bed.add(at(box(0.62, 0.14, 0.38, mat.pillow, 0.06), -0.38, 0.58, -0.72));
  bed.add(at(box(0.62, 0.14, 0.38, mat.pillow, 0.06), 0.38, 0.58, -0.72));
  bed.add(at(box(1.7, 0.9, 0.08, mat.bedFrame, 0.03), 0, 0.45, -1.06));
  // criado-mudo
  room.add(at(box(0.45, 0.5, 0.4, mat.wood, 0.03), 3.55, 0.25, 0.35));

  // sofá + TV
  const sofa = new THREE.Group();
  at(sofa, 1.5, 0, 3.0);
  room.add(sofa);
  sofa.add(at(box(0.85, 0.42, 1.9, mat.sofa, 0.06), 0, 0.21, 0));
  sofa.add(at(box(0.22, 0.75, 1.9, mat.sofa, 0.06), -0.33, 0.47, 0));
  sofa.add(at(box(0.85, 0.6, 0.2, mat.sofa, 0.06), 0, 0.3, -0.95));
  sofa.add(at(box(0.85, 0.6, 0.2, mat.sofa, 0.06), 0, 0.3, 0.95));
  sofa.add(at(box(0.6, 0.12, 0.85, mat.sofaCushion, 0.05), 0.05, 0.47, -0.43));
  sofa.add(at(box(0.6, 0.12, 0.85, mat.sofaCushion, 0.05), 0.05, 0.47, 0.43));
  // rack e TV na direita
  // TV na parede do fundo, ao lado da janela
  const tv = box(1.1, 0.62, 0.05, mat.tv, 0.02);
  at(tv, 2.6, 1.35, 0.04);
  room.add(tv);
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.54), mat.tvScreen);
  at(tvScreen, 2.6, 1.35, 0.07);
  room.add(tvScreen);
  room.add(at(box(1.4, 0.4, 0.4, mat.wood, 0.03), 2.6, 0.2, 0.25));
  // planta
  const plant = new THREE.Group();
  at(plant, 5.55, 0, 4.55);
  room.add(plant);
  plant.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 20), mat.plantPot), 0, 0.175, 0));
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2 - i * 0.02, 16, 12), mat.plant);
    leaf.castShadow = true;
    at(leaf, Math.sin(i * 2.1) * 0.08, 0.5 + i * 0.13, Math.cos(i * 2.1) * 0.08);
    plant.add(leaf);
  }

  // ---------- hóspede ----------
  const person = new THREE.Group();
  scene.add(person);
  const body = new THREE.Group();
  person.add(body);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 6, 16), mat.shirt);
  at(torso, 0, 1.15, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 18), mat.skin);
  at(head, 0, 1.66, 0);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2), mat.hair);
  at(hair, 0, 1.68, 0);
  const legL = new THREE.Group(), legR = new THREE.Group();
  at(legL, 0, 0.82, -0.08); at(legR, 0, 0.82, 0.08);
  const legGeo = new THREE.CapsuleGeometry(0.07, 0.62, 4, 10);
  const lL = new THREE.Mesh(legGeo, mat.pants); at(lL, 0, -0.38, 0); legL.add(lL);
  const lR = new THREE.Mesh(legGeo, mat.pants); at(lR, 0, -0.38, 0); legR.add(lR);
  const armL = new THREE.Group(), armR = new THREE.Group();
  at(armL, 0, 1.38, -0.22); at(armR, 0, 1.38, 0.22);
  const armGeo = new THREE.CapsuleGeometry(0.055, 0.45, 4, 10);
  const aL = new THREE.Mesh(armGeo, mat.skin); at(aL, 0, -0.27, 0); armL.add(aL);
  const aR = new THREE.Mesh(armGeo, mat.skin); at(aR, 0, -0.27, 0); armR.add(aR);
  [torso, head, hair, lL, lR, aL, aR].forEach(m => { m.castShadow = true; });
  body.add(torso, head, hair, legL, legR, armL, armR);

  // ---------- luzes ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb59a7a, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dd, 1.4);
  sun.position.set(8, 10, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const windowLight = new THREE.PointLight(0xcfe9ff, 1.5, 6, 1.5);
  at(windowLight, 4.6, 1.6, 0.4);
  scene.add(windowLight);

  // ---------- etiquetas ----------
  const tags = [
    { n: 1, text: 'Sensor da porta', obj: sensor, off: new THREE.Vector3(0, 0.12, 0) },
    { n: 2, text: 'Botão sem fio', obj: btnGroup, off: new THREE.Vector3(0, 0.12, 0) },
    { n: 3, text: 'Central', obj: central, off: new THREE.Vector3(0, 0.16, 0), px: 46, py: 30 },
    { n: 4, text: 'Quadro com contator', obj: panel, off: new THREE.Vector3(0, 0.36, 0), px: -30, py: 0 },
    { n: 5, text: 'Ar-condicionado', obj: ac, off: new THREE.Vector3(0, 0.25, 0) }
  ].map(t => {
    const el = document.createElement('div');
    el.className = 'da3d-tag';
    el.innerHTML = '<span class="da3d-tag-n">' + t.n + '</span><span class="da3d-tag-t">' + t.text + '</span>';
    labelsEl.appendChild(el);
    return { ...t, el };
  });

  // ---------- linha do tempo (22 s) ----------
  const L = 22;
  const steps = [
    { t: 0, n: 1, title: 'Hóspede no apartamento', text: 'Ar-condicionado e luzes ligados.' },
    { t: 3.2, n: 2, title: 'O hóspede saiu', text: 'A porta abriu e o sensor avisou a central.' },
    { t: 7.6, n: 3, title: 'Contagem de 60 segundos', text: 'Ninguém apertou o botão ao lado da porta.' },
    { t: 12.8, n: 4, title: 'Ar e luzes desligados', text: 'O contator corta os circuitos no quadro.' },
    { t: 15.8, n: 5, title: 'O hóspede voltou', text: 'Um toque no botão e tudo religa.' }
  ];
  const DOOR_OUT = [4.6, 7.2], DOOR_IN = [15.6, 18.2];
  const COUNT = [7.6, 12.6], OFF = [12.8, 18.0], PRESS = 17.6;

  // trajeto do hóspede: [tempo, x, z]
  const path = [
    [0, 2.2, 1.9], [2.8, 2.2, 1.9], [3.6, 1.4, 1.7], [4.8, 0.7, 3.85], [6.4, -0.6, 3.85], [7.0, -1.4, 3.85],
    [15.6, -1.4, 3.85], [16.6, -0.4, 3.85], [17.3, 0.35, 4.45], [17.9, 0.35, 4.45], [19.4, 1.4, 3.0], [20.6, 2.2, 1.9], [22, 2.2, 1.9]
  ];

  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const win01 = (t, a, b, ramp = 0.6) => ease((t - a) / ramp) * (1 - ease((t - (b - ramp)) / ramp));
  const lerp = (a, b, k) => a + (b - a) * k;

  function personAt(t) {
    for (let i = 0; i < path.length - 1; i++) {
      const [t0, x0, z0] = path[i], [t1, x1, z1] = path[i + 1];
      if (t >= t0 && t <= t1) {
        const k = (t - t0) / (t1 - t0 || 1);
        const moving = (x0 !== x1 || z0 !== z1);
        return { x: lerp(x0, x1, k), z: lerp(z0, z1, k), dx: x1 - x0, dz: z1 - z0, moving };
      }
    }
    return { x: path[0][1], z: path[0][2], dx: 0, dz: 0, moving: false };
  }

  let heading = 0;
  function update(t) {
    // porta
    const open = Math.max(win01(t, DOOR_OUT[0], DOOR_OUT[1], 0.7), win01(t, DOOR_IN[0], DOOR_IN[1], 0.7));
    doorPivot.rotation.y = -open * 1.45;
    sensor.material.emissiveIntensity = open > 0.05 ? 2.2 : 0;

    // energia
    const off = win01(t, OFF[0], OFF[1], 0.5);
    const on = 1 - off;
    lampLight.intensity = 6 * on;
    shade.material.emissiveIntensity = 1.5 * on + 0.05;
    hemi.intensity = 0.45 + 0.45 * on;
    sun.intensity = 0.7 + 0.7 * on;
    tvScreen.material.emissiveIntensity = 0.6 * on;
    acLed.material.emissiveIntensity = 2 * on;
    acLed.material.color.setHex(on > 0.5 ? 0x1f8f4a : 0x555555);
    panelLed.material.emissive.setHex(on > 0.5 ? 0x33c26b : 0xd64545);
    panelLed.material.color.setHex(on > 0.5 ? 0x1f8f4a : 0xb33a3a);
    renderer.toneMappingExposure = 0.75 + 0.3 * on;
    airs.forEach(a => {
      const p = (t * 0.9 + a.userData.phase) % 1;
      a.position.set(a.userData.x, 2.1 - p * 0.9, 0.3 + p * 0.9);
      a.rotation.x = -0.9;
      a.material.opacity = 0.55 * Math.sin(p * Math.PI) * on;
    });

    // botão
    const pressK = win01(t, PRESS - 0.1, PRESS + 0.7, 0.15);
    btn.material.emissiveIntensity = 2.5 * pressK;
    btn.position.x = 0.025 - 0.012 * pressK;

    // hóspede
    const p = personAt(t);
    person.position.set(p.x, 0, p.z);
    if (p.moving) heading = Math.atan2(-p.dz, p.dx);
    if (t >= 17.3 && t <= 17.95) heading = Math.atan2(-(4.7 - 4.45), -0.33);
    person.rotation.y = heading;
    const swing = p.moving ? Math.sin(t * 9) * 0.5 : 0;
    legL.rotation.z = swing; legR.rotation.z = -swing;
    armL.rotation.z = -swing * 0.8; armR.rotation.z = swing * 0.8;
    // braço apertando o botão
    if (pressK > 0) { armR.rotation.z = -1.3 * pressK; }
    person.visible = p.x > -1.3;

    // legendas
    let s = steps[0];
    for (const st of steps) if (t >= st.t) s = st;
    if (capTitle.textContent !== s.title) {
      capTitle.textContent = s.title;
      capText.textContent = s.text;
      capStep.textContent = s.n + '/5';
      dots.forEach((d, i) => d.classList.toggle('on', i === s.n - 1));
      host.classList.toggle('da3d-is-off', s.n === 4);
    }
    // contagem
    let secs = 60;
    if (t >= COUNT[0] && t < COUNT[1]) secs = Math.ceil(60 * (1 - (t - COUNT[0]) / (COUNT[1] - COUNT[0])));
    else if (t >= COUNT[1] && t < OFF[1]) secs = 0;
    timerEl.textContent = secs + ' s';
    barEl.style.transform = 'scaleX(' + (secs / 60) + ')';
    statusEl.textContent = on > 0.5 ? 'LIGADO' : 'DESLIGADO';
    statusEl.classList.toggle('off', on <= 0.5);
  }

  // ---------- câmera / tamanho ----------
  const target = new THREE.Vector3(2.7, 0.9, 2.6);
  function resize() {
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w / h < 1.1;
    camera.fov = narrow ? 50 : 30;
    const dist = narrow ? 15.5 : 14.5;
    const tg = narrow ? new THREE.Vector3(2.4, -1.1, 2.4) : target;
    camera.position.set(tg.x + dist * 0.62, tg.y + dist * 0.62, tg.z + dist * 0.48);
    camera.lookAt(tg);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const v = new THREE.Vector3();
  function placeTags() {
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    tags.forEach(tg => {
      tg.obj.getWorldPosition(v);
      v.add(tg.off).project(camera);
      const ew = tg.el.offsetWidth, eh = tg.el.offsetHeight;
      let x = (v.x * 0.5 + 0.5) * w + (tg.px || 0) - ew / 2;
      let y = (-v.y * 0.5 + 0.5) * h + (tg.py || 0) - eh;
      x = Math.max(6, Math.min(w - ew - 6, x));
      y = Math.max(6, y);
      tg.el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
  }

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true, t0 = performance.now(), paused = 0, pausedAt = null;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (!visible && pausedAt === null) pausedAt = performance.now();
      if (visible && pausedAt !== null) { paused += performance.now() - pausedAt; pausedAt = null; }
    }).observe(host);
  }
  window.__da3dSeek = sec => { window.__da3dHold = true; update(sec); placeTags(); renderer.render(scene, camera); };

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || window.__da3dHold) return;
    const t = reduce ? 1 : ((now - t0 - paused) / 1000) % L;
    update(t);
    placeTags();
    renderer.render(scene, camera);
  }
  host.classList.add('da3d-ready');
  requestAnimationFrame(frame);
}
