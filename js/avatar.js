(function () {
  "use strict";

  if (typeof THREE === "undefined") return;

  var canvas = document.getElementById("avatar-canvas");
  var captionEl = document.getElementById("avatar-caption");
  if (!canvas) return;

  var clock = new THREE.Clock();
  var pointer = { x: 0, y: 0 };
  var target = { progress: 0 };
  var anim = { progress: 0, breathe: 0 };

  var captions = [
    "👋 hi, I’m Rakshith",
    "scroll & I’ll move",
    "my eyes follow your cursor",
    "let’s build something useful"
  ];

  var renderer, scene, camera, avatar, head;
  var eyeL, eyeR, pupilL, pupilR, armL, armR, ring, particles;
  var waveArm, waveStart = -10;
  var waveDuration = 1.6;
  var currentWave = -1;

  function setupRenderer() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.6, 9.5);

    scene.add(new THREE.AmbientLight(0xffb98a, 0.5));

    var key = new THREE.DirectionalLight(0xfff0e0, 1.25);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    scene.add(key);

    var fill = new THREE.DirectionalLight(0x8a6cff, 0.35);
    fill.position.set(-4, 1, 3);
    scene.add(fill);

    var rim = new THREE.DirectionalLight(0xff8a4c, 1.6);
    rim.position.set(0, 2, -6);
    scene.add(rim);

    var kick = new THREE.PointLight(0xe86a2c, 0.6, 12);
    kick.position.set(0, 0.4, 3.4);
    scene.add(kick);
  }

  function mat(color, opts) {
    var o = opts || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: o.roughness != null ? o.roughness : 0.5,
      metalness: o.metalness != null ? o.metalness : 0.0,
      flatShading: !!o.flatShading,
      transparent: !!o.transparent,
      opacity: o.opacity != null ? o.opacity : 1,
      emissive: o.emissive || 0x000000,
      emissiveIntensity: o.emissiveIntensity != null ? o.emissiveIntensity : 0,
      side: o.side || THREE.FrontSide
    });
  }

  function buildAvatar() {
    avatar = new THREE.Group();

    var skin = 0xE7B287;
    var skinLight = 0xF3D2B8;
    var ink = 0x14100C;
    var ivory = 0xD9CBB9;
    var accent = 0xE86A2C;

    var torso = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 48, 32),
      mat(ivory, { roughness: 0.55 })
    );
    torso.scale.set(1.25, 0.9, 0.9);
    torso.position.y = 0.3;
    torso.castShadow = true;
    torso.receiveShadow = true;
    avatar.add(torso);

    var neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.34, 0.55, 32),
      mat(skinLight, { roughness: 0.6 })
    );
    neck.position.y = 1.15;
    avatar.add(neck);

    head = new THREE.Group();
    head.position.y = 1.8;

    var skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 48, 48),
      mat(skin, { roughness: 0.55 })
    );
    skull.scale.set(0.86, 1, 0.92);
    skull.position.y = 0.15;
    skull.castShadow = true;
    head.add(skull);

    var hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.74, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat(ink, { roughness: 0.7 })
    );
    hair.scale.set(0.86, 1, 0.92);
    hair.position.set(0, 0.15, -0.06);
    head.add(hair);

    var fringe = new THREE.Mesh(
      new THREE.SphereGeometry(0.73, 48, 24, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.22),
      mat(ink, { roughness: 0.7 })
    );
    fringe.scale.set(0.88, 1, 0.92);
    fringe.position.set(0, 0.3, 0.08);
    head.add(fringe);

    var earGeo = new THREE.SphereGeometry(0.14, 24, 24);
    var earL = new THREE.Mesh(earGeo, mat(skin));
    earL.position.set(-0.62, 0.1, 0);
    earL.scale.set(0.6, 1, 0.8);
    head.add(earL);
    var earR = earL.clone();
    earR.position.x = 0.62;
    head.add(earR);

    eyeL = new THREE.Group(); eyeR = new THREE.Group();
    var scleraGeo = new THREE.SphereGeometry(0.16, 32, 32);
    var scleraMat = mat(0xF5F1EA, { roughness: 0.25 });
    var sL = new THREE.Mesh(scleraGeo, scleraMat);
    var sR = sL.clone();
    eyeL.add(sL); eyeR.add(sR);
    eyeL.position.set(-0.27, 0.18, 0.66);
    eyeR.position.set(0.27, 0.18, 0.66);
    eyeL.scale.set(1, 1.05, 0.55);
    eyeR.scale.set(1, 1.05, 0.55);

    var pupilGeo = new THREE.SphereGeometry(0.085, 24, 24);
    var pupilMat = mat(0x241B14, { roughness: 0.35 });
    pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR = pupilL.clone();
    pupilL.position.z = 0.11;
    pupilR.position.z = 0.11;
    var hlGeo = new THREE.SphereGeometry(0.028, 12, 12);
    var hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var hlL = new THREE.Mesh(hlGeo, hlMat); hlL.position.set(-0.03, 0.04, 0.13);
    var hlR = hlL.clone(); hlR.position.set(0.03, 0.04, 0.13);
    pupilL.add(hlL); pupilR.add(hlR);

    eyeL.add(pupilL); eyeR.add(pupilR);
    head.add(eyeL); head.add(eyeR);

    var browMat = mat(ink, { roughness: 0.8 });
    var browGeo = new THREE.BoxGeometry(0.3, 0.05, 0.1);
    var browL = new THREE.Mesh(browGeo, browMat); browL.position.set(-0.27, 0.42, 0.62); browL.rotation.z = 0.12;
    var browR = new THREE.Mesh(browGeo, browMat); browR.position.set(0.27, 0.42, 0.62); browR.rotation.z = -0.12;
    head.add(browL); head.add(browR);

    var smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.018, 12, 40, Math.PI),
      mat(accent, { roughness: 0.5 })
    );
    smile.rotation.x = Math.PI * 0.12;
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.08, 0.62);
    head.add(smile);

    avatar.add(head);

    var armGeo = new THREE.CapsuleGeometry(0.11, 0.5, 8, 16);
    armL = new THREE.Mesh(armGeo, mat(ivory, { roughness: 0.6 }));
    armL.position.set(-1.05, 0.6, 0);
    armL.rotation.z = 0.35;
    armL.castShadow = true;
    armR = new THREE.Mesh(armGeo, mat(ivory, { roughness: 0.6 }));
    armR.position.set(1.05, 0.6, 0);
    armR.rotation.z = -0.35;
    armR.castShadow = true;
    avatar.add(armL); avatar.add(armR);

    avatar.position.y = -0.2;
    avatar.scale.set(0.92, 0.92, 0.92);
    scene.add(avatar);

    var shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 48),
      new THREE.ShadowMaterial({ opacity: 0.35 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.3;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.012, 12, 96),
      mat(accent, { transparent: true, opacity: 0.5, emissive: accent, emissiveIntensity: 0.4 })
    );
    ring.rotation.x = Math.PI / 2.4;
    ring.position.y = 0.4;
    scene.add(ring);

    var count = 260;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = 2.4 + Math.random() * 2.4;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.8;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 1;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xE8B44A,
        size: 0.035,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
      })
    );
    scene.add(particles);
  }

  function setProgress(p) {
    target.progress = p;
  }

  function setWave(i) {
    currentWave = i;
    waveStart = clock.getElapsedTime();
    waveArm = i % 2 === 0 ? armR : armL;
  }

  function setPointer(nx, ny) {
    pointer.x = nx;
    pointer.y = ny;
  }

  function setCaption(i) {
    if (captionEl) captionEl.textContent = captions[i % captions.length];
  }

  function bindEvents() {
    window.addEventListener("resize", resize);

    var stage = document.getElementById("avatar-stage");
    var targetEl = stage || canvas;
    targetEl.addEventListener("pointermove", function (e) {
      var rect = targetEl.getBoundingClientRect();
      var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      var ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.x = nx;
      pointer.y = ny;
    });
  }

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    if (w < 2 || h < 2) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();
    var dt = Math.min(clock.getDelta(), 0.05);

    anim.progress += (target.progress - anim.progress) * Math.min(1, dt * 3.5);
    var p = anim.progress;
    anim.breathe += dt;
    var breath = Math.sin(anim.breathe * 1.4) * 0.018;

    var waveT = 0;
    if (currentWave !== -1) {
      var since = t - waveStart;
      if (since < waveDuration) {
        waveT = since / waveDuration;
      } else {
        currentWave = -1;
      }
    }
    var waveEnv = Math.sin(Math.PI * Math.min(1, waveT)) * (1 - waveT * 0.35);
    var waveSpin = waveEnv * Math.sin(waveT * 22) * 0.55;
    var waveRaise = waveEnv * 1.35;

    if (waveArm === armR) {
      armR.rotation.z = -0.35 - waveRaise;
      armR.rotation.x = waveSpin;
      armR.rotation.y = waveEnv * 0.4;
      armL.rotation.z = 0.35;
    } else {
      armL.rotation.z = 0.35 + waveRaise;
      armL.rotation.x = -waveSpin;
      armL.rotation.y = -waveEnv * 0.4;
      armR.rotation.z = -0.35;
    }
    if (waveT === 0) {
      armR.rotation.z = -0.35;
      armL.rotation.z = 0.35;
    }

    var headYaw = pointer.x * 0.22;
    var headPitch = pointer.y * 0.14;
    head.rotation.y += (headYaw - head.rotation.y) * Math.min(1, dt * 6);
    head.rotation.x += (headPitch - head.rotation.x) * Math.min(1, dt * 6);
    var px = pointer.x * 0.07;
    var py = -pointer.y * 0.055;
    pupilL.position.x += (px - pupilL.position.x) * Math.min(1, dt * 8);
    pupilL.position.y += (py - pupilL.position.y) * Math.min(1, dt * 8);
    pupilR.position.x += (px - pupilR.position.x) * Math.min(1, dt * 8);
    pupilR.position.y += (py - pupilR.position.y) * Math.min(1, dt * 8);

    avatar.position.y = -0.2 - p * 0.7 + Math.sin(anim.breathe * 1.4) * 0.03;
    avatar.rotation.y = Math.sin(t * 0.4) * 0.06 + p * 1.15;
    avatar.rotation.x = -0.05 - p * 0.22;
    avatar.scale.setScalar(0.92 + breath + p * 0.05);

    ring.rotation.z += dt * 0.12;
    ring.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.5) * 0.06;
    particles.rotation.y += dt * 0.05;
    particles.position.y = Math.sin(t * 0.6) * 0.08;

    camera.position.y = 1.6 + Math.sin(t * 0.8) * 0.02;
    camera.lookAt(0, 1.55, 0);

    renderer.render(scene, camera);
  }

  function init() {
    setupRenderer();
    setupScene();
    buildAvatar();
    bindEvents();
    resize();
    animate();
    setTimeout(function () {
      if (captionEl) captionEl.style.opacity = "1";
    }, 700);
  }

  window.AVATAR = {
    setProgress: setProgress,
    setWave: setWave,
    setPointer: setPointer,
    setCaption: setCaption,
    isReady: true
  };

  init();
})();
