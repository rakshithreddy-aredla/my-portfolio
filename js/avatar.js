(function () {
  "use strict";

  if (typeof THREE === "undefined") return;

  var canvas = document.getElementById("avatar-canvas");
  var captionEl = document.getElementById("avatar-caption");
  if (!canvas) return;

  var clock = new THREE.Clock();
  var pointer = { x: 0, y: 0 };
  var target = { progress: 0 };
  var anim = { progress: 0, breathe: 0, blink: 0, blinkAt: 2.6 };
  var clickTimer = null;

  var captions = [
    "👋 hi, I’m Rakshith",
    "scroll & I’ll move",
    "my eyes follow your cursor",
    "let’s build something useful"
  ];

  var renderer, scene, camera, avatar, head;
  var eyeL, eyeR, irisL, irisR, pupilL, pupilR;
  var armL, armR, halo, ringOuter, particles, glowDisc;
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
  }

  function setupScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0B0908, 0.02);

    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 1.9, 10.5);

    scene.add(new THREE.AmbientLight(0xffb98a, 0.45));

    var key = new THREE.DirectionalLight(0xfff0e0, 1.4);
    key.position.set(3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.bias = -0.0004;
    scene.add(key);

    var fill = new THREE.DirectionalLight(0x8a6cff, 0.35);
    fill.position.set(-5, 1.5, 3);
    scene.add(fill);

    var rim = new THREE.DirectionalLight(0xff8a4c, 1.8);
    rim.position.set(0, 2.5, -7);
    scene.add(rim);

    var kick = new THREE.PointLight(0xe86a2c, 0.7, 14);
    kick.position.set(0, 0.6, 3.6);
    scene.add(kick);

    var under = new THREE.PointLight(0xe8b44a, 0.5, 10);
    under.position.set(0, -1.1, 1);
    scene.add(under);
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

  function glowTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.4)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function buildAvatar() {
    avatar = new THREE.Group();

    var skin = 0xE7B287;
    var skinLight = 0xF3D2B8;
    var hair = 0x14100C;
    var jacket = 0x241E1A;
    var shirt = 0x191512;
    var accent = 0xE86A2C;
    var bronze = 0xB08852;

    // legs
    var legGeo = new THREE.CapsuleGeometry(0.17, 0.75, 8, 16);
    var legMat = mat(jacket, { roughness: 0.7 });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.3, -0.72, 0);
    legL.castShadow = true;
    var legR = legL.clone();
    legR.position.x = 0.3;
    avatar.add(legL); avatar.add(legR);

    // feet
    var footGeo = new THREE.BoxGeometry(0.34, 0.14, 0.52);
    var footMat = mat(0x171310, { roughness: 0.6 });
    var footL = new THREE.Mesh(footGeo, footMat);
    footL.position.set(-0.3, -1.28, 0.08);
    var footR = footL.clone();
    footR.position.x = 0.3;
    avatar.add(footL); avatar.add(footR);

    // torso (jacket)
    var torso = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 48, 32),
      mat(jacket, { roughness: 0.55 })
    );
    torso.scale.set(1.12, 0.9, 0.72);
    torso.position.y = 0.42;
    torso.castShadow = true;
    torso.receiveShadow = true;
    avatar.add(torso);

    // collar / shirt
    var collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.42, 0.3, 24),
      mat(shirt, { roughness: 0.6 })
    );
    collar.position.y = 1.12;
    avatar.add(collar);

    // zipper accent
    var zip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.9, 0.02),
      mat(bronze, { metalness: 0.6, roughness: 0.3, emissive: accent, emissiveIntensity: 0.25 })
    );
    zip.position.set(0, 0.4, 0.365);
    avatar.add(zip);

    // neck
    var neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.3, 0.45, 24),
      mat(skinLight, { roughness: 0.6 })
    );
    neck.position.y = 1.42;
    avatar.add(neck);

    // head group
    head = new THREE.Group();
    head.position.y = 1.82;

    var skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.66, 48, 48),
      mat(skin, { roughness: 0.55 })
    );
    skull.scale.set(0.9, 1, 0.92);
    skull.position.y = 0.12;
    skull.castShadow = true;
    head.add(skull);

    // hair cap
    var hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.56),
      mat(hair, { roughness: 0.6 })
    );
    hairCap.scale.set(0.9, 1, 0.92);
    hairCap.position.set(0, 0.12, -0.05);
    head.add(hairCap);

    // fringe
    var fringe = new THREE.Mesh(
      new THREE.SphereGeometry(0.67, 48, 24, 0, Math.PI * 2, Math.PI * 0.34, Math.PI * 0.26),
      mat(hair, { roughness: 0.6 })
    );
    fringe.scale.set(0.93, 1, 0.92);
    fringe.position.set(0, 0.26, 0.1);
    head.add(fringe);

    // side hair
    var sideGeo = new THREE.SphereGeometry(0.6, 32, 16, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.2);
    var sideL = new THREE.Mesh(sideGeo, mat(hair, { roughness: 0.6 }));
    sideL.scale.set(0.28, 0.9, 0.9);
    sideL.position.set(-0.52, 0.12, -0.02);
    head.add(sideL);
    var sideR = sideL.clone();
    sideR.position.x = 0.52;
    head.add(sideR);

    // ears
    var earGeo = new THREE.SphereGeometry(0.13, 24, 24);
    var earL = new THREE.Mesh(earGeo, mat(skin));
    earL.position.set(-0.57, 0.05, 0);
    earL.scale.set(0.6, 1, 0.8);
    head.add(earL);
    var earR = earL.clone();
    earR.position.x = 0.57;
    head.add(earR);

    // nose
    var nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 20, 20),
      mat(skinLight, { roughness: 0.6 })
    );
    nose.scale.set(1, 1.25, 0.8);
    nose.position.set(0, 0.05, 0.6);
    head.add(nose);

    // eyes: sclera + iris + pupil + highlight
    eyeL = new THREE.Group(); eyeR = new THREE.Group();
    var scleraGeo = new THREE.SphereGeometry(0.15, 32, 32);
    var scleraMat = mat(0xF5F1EA, { roughness: 0.22, metalness: 0.02 });
    var sL = new THREE.Mesh(scleraGeo, scleraMat);
    var sR = sL.clone();
    eyeL.add(sL); eyeR.add(sR);
    eyeL.position.set(-0.25, 0.16, 0.61);
    eyeR.position.set(0.25, 0.16, 0.61);
    eyeL.scale.set(1, 1.05, 0.5);
    eyeR.scale.set(1, 1.05, 0.5);

    var irisGeo = new THREE.SphereGeometry(0.07, 24, 24);
    var irisMat = mat(0x6B4A2B, { roughness: 0.3, metalness: 0.05 });
    irisL = new THREE.Mesh(irisGeo, irisMat);
    irisR = irisL.clone();
    irisL.position.z = 0.105;
    irisR.position.z = 0.105;

    var pupilGeo = new THREE.SphereGeometry(0.034, 20, 20);
    var pupilMat = mat(0x160F0A, { roughness: 0.25 });
    pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR = pupilL.clone();
    pupilL.position.z = 0.13;
    pupilR.position.z = 0.13;

    var hlGeo = new THREE.SphereGeometry(0.024, 12, 12);
    var hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var hlL = new THREE.Mesh(hlGeo, hlMat); hlL.position.set(-0.03, 0.035, 0.145);
    var hlR = hlL.clone(); hlR.position.set(0.03, 0.035, 0.145);
    pupilL.add(hlL); pupilR.add(hlR);

    irisL.add(pupilL); irisR.add(pupilR);
    eyeL.add(irisL); eyeR.add(irisR);
    head.add(eyeL); head.add(eyeR);

    // brows
    var browMat = mat(hair, { roughness: 0.7 });
    var browGeo = new THREE.BoxGeometry(0.28, 0.045, 0.09);
    var browL = new THREE.Mesh(browGeo, browMat); browL.position.set(-0.25, 0.38, 0.57); browL.rotation.z = 0.12;
    var browR = new THREE.Mesh(browGeo, browMat); browR.position.set(0.25, 0.38, 0.57); browR.rotation.z = -0.12;
    head.add(browL); head.add(browR);

    // smile
    var smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.016, 12, 40, Math.PI),
      mat(accent, { roughness: 0.5, emissive: accent, emissiveIntensity: 0.18 })
    );
    smile.rotation.x = Math.PI * 0.12;
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.1, 0.585);
    head.add(smile);

    avatar.add(head);

    // arms pivoted at shoulders
    var armGeo = new THREE.CapsuleGeometry(0.1, 0.55, 8, 16);
    var armMat = mat(jacket, { roughness: 0.6 });

    armL = new THREE.Group();
    armL.position.set(-1.02, 1.02, 0);
    var armMeshL = new THREE.Mesh(armGeo, armMat);
    armMeshL.position.y = -0.42;
    armMeshL.castShadow = true;
    armL.add(armMeshL);
    var handL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), mat(skin, { roughness: 0.6 }));
    handL.position.y = -0.78;
    armL.add(handL);

    armR = new THREE.Group();
    armR.position.set(1.02, 1.02, 0);
    var armMeshR = new THREE.Mesh(armGeo, armMat);
    armMeshR.position.y = -0.42;
    armMeshR.castShadow = true;
    armR.add(armMeshR);
    var handR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), mat(skin, { roughness: 0.6 }));
    handR.position.y = -0.78;
    armR.add(handR);

    avatar.add(armL); avatar.add(armR);
    scene.add(avatar);

    // ground glow platform
    glowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 48),
      new THREE.MeshBasicMaterial({
        color: 0xe86a2c,
        transparent: true,
        opacity: 0.22,
        map: glowTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    glowDisc.rotation.x = -Math.PI / 2;
    glowDisc.position.y = -1.28;
    scene.add(glowDisc);

    // soft shadow
    var shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 48),
      new THREE.ShadowMaterial({ opacity: 0.4 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.26;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // outer orbit ring with orbiting sparkles
    ringOuter = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.008, 12, 96),
      mat(accent, { transparent: true, opacity: 0.35, emissive: accent, emissiveIntensity: 0.5 })
    );
    ringOuter.rotation.x = Math.PI / 2.2;
    ringOuter.position.y = 0.35;
    scene.add(ringOuter);
    for (var s = 0; s < 6; s++) {
      var spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 12),
        mat(0xE8B44A, { emissive: 0xE8B44A, emissiveIntensity: 1.2 })
      );
      var a = (s / 6) * Math.PI * 2;
      spark.position.set(Math.cos(a) * 2.35, 0.02, Math.sin(a) * 2.35);
      ringOuter.add(spark);
    }

    // wireframe halo
    halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.85, 1),
      new THREE.MeshBasicMaterial({ color: 0xe86a2c, wireframe: true, transparent: true, opacity: 0.12 })
    );
    halo.position.y = 0.4;
    scene.add(halo);

    // floating particles
    var count = 300;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = 2.3 + Math.random() * 2.8;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.9;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 0.8;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xE8B44A, size: 0.035, transparent: true, opacity: 0.65, sizeAttenuation: true })
    );
    scene.add(particles);
  }

  /* ================= Public API ================= */
  function setProgress(p) { target.progress = p; }

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

  function react() {
    if (clickTimer) return;
    clickTimer = clock.getElapsedTime();
    waveArm = waveArm === armL ? armR : armL;
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
    targetEl.addEventListener("pointerdown", react);
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
    var breath = Math.sin(anim.breathe * 1.4) * 0.02;

    // blink
    anim.blink += dt;
    var blinkScale = 1;
    if (anim.blink > anim.blinkAt) {
      var bt = anim.blink - anim.blinkAt;
      if (bt < 0.18) {
        blinkScale = 1 - Math.abs(Math.sin(bt / 0.18 * Math.PI)) * 0.85;
      } else {
        anim.blink = 0;
        anim.blinkAt = 2.2 + Math.random() * 2.6;
      }
    }
    eyeL.scale.y = blinkScale;
    eyeR.scale.y = blinkScale;

    // wave envelope
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
    var waveRaise = waveEnv * 1.55;

    if (waveArm === armR) {
      armR.rotation.z = -waveRaise;
      armR.rotation.x = waveSpin;
      armR.rotation.y = waveEnv * 0.35;
      armL.rotation.z = 0;
    } else {
      armL.rotation.z = waveRaise;
      armL.rotation.x = -waveSpin;
      armL.rotation.y = -waveEnv * 0.35;
      armR.rotation.z = 0;
    }
    if (waveT === 0) {
      armR.rotation.z = 0;
      armL.rotation.z = 0;
    }

    // cursor-driven look
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

    // subtle whole-body lean toward cursor
    avatar.position.x = pointer.x * 0.18;

    // scroll choreography
    avatar.position.y = -0.15 + Math.sin(anim.breathe * 1.4) * 0.03 - p * 0.35;
    avatar.rotation.y = Math.sin(t * 0.4) * 0.05 + p * 1.3;
    avatar.rotation.x = -0.03 - p * 0.18;
    avatar.scale.setScalar(1 + breath + p * 0.05);

    // scene elements
    ringOuter.rotation.z += dt * 0.14;
    ringOuter.rotation.x = Math.PI / 2.2 + Math.sin(t * 0.5) * 0.06;
    halo.rotation.y += dt * 0.1;
    halo.rotation.x = Math.sin(t * 0.3) * 0.12;
    particles.rotation.y += dt * 0.05;
    particles.position.y = Math.sin(t * 0.6) * 0.08;
    glowDisc.material.opacity = 0.18 + Math.sin(t * 0.8) * 0.05;

    camera.position.y = 1.9 + Math.sin(t * 0.7) * 0.03;
    camera.lookAt(0, 1.35, 0);

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
