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
  var isGLB = false;

  var captions = [
    "👋 hi, I’m Rakshith",
    "scroll & I’ll move",
    "my eyes follow your cursor",
    "let’s build something useful"
  ];

  var renderer, scene, camera, avatar;
  var head, eyeL, eyeR, pupilL, pupilR, armL, armR;
  var halo, ringOuter, particles, glowDisc;
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
    renderer.toneMappingExposure = 1.1;
    if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  }

  function setupScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0B0908, 0.02);
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 1.9, 10.5);

    scene.add(new THREE.AmbientLight(0xffb98a, 0.5));
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

    var fill = new THREE.DirectionalLight(0x8a6cff, 0.4);
    fill.position.set(-5, 1.5, 3);
    scene.add(fill);

    var rim = new THREE.DirectionalLight(0xff8a4c, 1.7);
    rim.position.set(0, 2.5, -7);
    scene.add(rim);

    var kick = new THREE.PointLight(0x7c5cff, 0.6, 14);
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
      transparent: !!o.transparent,
      opacity: o.opacity != null ? o.opacity : 1,
      emissive: o.emissive || 0x000000,
      emissiveIntensity: o.emissiveIntensity != null ? o.emissiveIntensity : 0
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

  /* ============ shared scene effects ============ */
  function setupEffects() {
    glowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 48),
      new THREE.MeshBasicMaterial({
        color: 0x7c5cff,
        transparent: true,
        opacity: 0.2,
        map: glowTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    glowDisc.rotation.x = -Math.PI / 2;
    glowDisc.position.y = -1.28;
    scene.add(glowDisc);

    var shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 48),
      new THREE.ShadowMaterial({ opacity: 0.4 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.26;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    ringOuter = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.008, 12, 96),
      mat(0x7c5cff, { transparent: true, opacity: 0.35, emissive: 0x7c5cff, emissiveIntensity: 0.5 })
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

    halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.9, 1),
      new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.12 })
    );
    halo.position.y = 0.4;
    scene.add(halo);

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

  /* ============ Blender GLB model (preferred) ============ */
  function loadGLB() {
    if (typeof THREE.GLTFLoader === "undefined") { buildProcedural(); return; }
    var loader = new THREE.GLTFLoader();
    loader.load(
      "assets/avatar.glb",
      function (gltf) {
        try {
          avatar = gltf.scene;
          avatar.traverse(function (o) {
            if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
          });
      avatar.position.y = -0.15;
      avatar.scale.set(1.02, 1.02, 1.02);
      scene.add(avatar);
      window.__avatarSource = "glb";
          head = gltf.scene.getObjectByName("head") || null;
          pupilL = gltf.scene.getObjectByName("pupil_L") || null;
          pupilR = gltf.scene.getObjectByName("pupil_R") || null;
          armL = gltf.scene.getObjectByName("pivot_L") || null;
          armR = gltf.scene.getObjectByName("pivot_R") || null;
          if (!head) head = avatar;
          eyeL = eyeR = null;
          isGLB = true;
          waveArm = armR;
          window.__avatarSource = "glb";
          window.__parts = { head: !!head, pl: !!pupilL, pr: !!pupilR, al: !!armL, ar: !!armR };
        } catch (e) {
          if (avatar) { scene.remove(avatar); avatar = null; }
          buildProcedural();
        }
      },
      undefined,
      function () { buildProcedural(); }
    );
  }

  /* ============ Procedural avatar (fallback) ============ */
  function buildProcedural() {
    avatar = new THREE.Group();
    var skin = 0xE7B287, skinLight = 0xF3D2B8, hairC = 0x14100C, accent = 0x7C5CFF;

    var legGeo = new THREE.CapsuleGeometry(0.17, 0.75, 8, 16);
    var legMat = mat(0x241E1A, { roughness: 0.7 });
    var legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-0.3, -0.72, 0); legL.castShadow = true;
    var legR = legL.clone(); legR.position.x = 0.3;
    avatar.add(legL); avatar.add(legR);

    var footGeo = new THREE.BoxGeometry(0.34, 0.14, 0.52);
    var footL = new THREE.Mesh(footGeo, mat(0x171310, { roughness: 0.6 })); footL.position.set(-0.3, -1.28, 0.08);
    var footR = footL.clone(); footR.position.x = 0.3;
    avatar.add(footL); avatar.add(footR);

    var torso = new THREE.Mesh(new THREE.SphereGeometry(0.95, 48, 32), mat(0x241E1A, { roughness: 0.55 }));
    torso.scale.set(1.12, 0.9, 0.72); torso.position.y = 0.42; torso.castShadow = true; torso.receiveShadow = true;
    avatar.add(torso);
    var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.3, 24), mat(0x191512, { roughness: 0.6 }));
    collar.position.y = 1.12; avatar.add(collar);
    var zip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.02), mat(0xB08852, { metalness: 0.6, roughness: 0.3, emissive: 0x7C5CFF, emissiveIntensity: 0.25 }));
    zip.position.set(0, 0.4, 0.365); avatar.add(zip);
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.45, 24), mat(skinLight, { roughness: 0.6 }));
    neck.position.y = 1.42; avatar.add(neck);

    head = new THREE.Group(); head.position.y = 1.82;
    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.66, 48, 48), mat(skin, { roughness: 0.55 }));
    skull.scale.set(0.9, 1, 0.92); skull.position.y = 0.12; skull.castShadow = true; head.add(skull);
    try {
      new THREE.TextureLoader().load("rakshith.jpg", function (tex) {
        skull.material.map = tex;
        skull.material.color.set(0xffffff);
        skull.material.needsUpdate = true;
      });
    } catch (e) { /* optional */ }
    var hair = new THREE.Mesh(new THREE.SphereGeometry(0.68, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.56), mat(hairC, { roughness: 0.6 }));
    hair.scale.set(0.9, 1, 0.92); hair.position.set(0, 0.12, -0.05); head.add(hair);
    var fringe = new THREE.Mesh(new THREE.SphereGeometry(0.67, 48, 24, 0, Math.PI * 2, Math.PI * 0.34, Math.PI * 0.26), mat(hairC, { roughness: 0.6 }));
    fringe.scale.set(0.93, 1, 0.92); fringe.position.set(0, 0.26, 0.1); head.add(fringe);
    var earGeo = new THREE.SphereGeometry(0.13, 24, 24);
    var earL = new THREE.Mesh(earGeo, mat(skin)); earL.position.set(-0.57, 0.05, 0); earL.scale.set(0.6, 1, 0.8); head.add(earL);
    var earR = earL.clone(); earR.position.x = 0.57; head.add(earR);

    function makeEye(side, x) {
      var g = new THREE.Group();
      var sc = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), mat(0xF5F1EA, { roughness: 0.22 }));
      g.add(sc);
      var iris = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 24), mat(0x6B4A2B, { roughness: 0.3 }));
      iris.position.z = 0.105; g.add(iris);
      var pup = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 20), mat(0x160F0A, { roughness: 0.25 }));
      pup.position.z = 0.13; g.add(pup);
      var hl = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      hl.position.set(side * 0.03, 0.035, 0.145); pup.add(hl);
      g.position.set(x, 0.16, 0.61);
      g.scale.set(1, 1.05, 0.5);
      head.add(g);
      return { group: g, pupil: pup };
    }
    var eL = makeEye(-1, -0.25), eR = makeEye(1, 0.25);
    eyeL = eL.group; eyeR = eR.group; pupilL = eL.pupil; pupilR = eR.pupil;

    var browMat = mat(hairC, { roughness: 0.7 });
    var browGeo = new THREE.BoxGeometry(0.28, 0.045, 0.09);
    var browL = new THREE.Mesh(browGeo, browMat); browL.position.set(-0.25, 0.38, 0.57); browL.rotation.z = 0.12; head.add(browL);
    var browR = new THREE.Mesh(browGeo, browMat); browR.position.set(0.25, 0.38, 0.57); browR.rotation.z = -0.12; head.add(browR);
    var smile = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.016, 12, 40, Math.PI), mat(accent, { roughness: 0.5, emissive: accent, emissiveIntensity: 0.18 }));
    smile.rotation.x = Math.PI * 0.12; smile.rotation.z = Math.PI; smile.position.set(0, -0.1, 0.585); head.add(smile);
    avatar.add(head);

    var armGeo = new THREE.CapsuleGeometry(0.1, 0.55, 8, 16);
    var armMat = mat(0x241E1A, { roughness: 0.6 });
    armL = new THREE.Group(); armL.position.set(-1.02, 1.02, 0);
    var amL = new THREE.Mesh(armGeo, armMat); amL.position.y = -0.42; amL.castShadow = true; armL.add(amL);
    var hL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), mat(skin)); hL.position.y = -0.78; armL.add(hL);
    armR = new THREE.Group(); armR.position.set(1.02, 1.02, 0);
    var amR = new THREE.Mesh(armGeo, armMat); amR.position.y = -0.42; amR.castShadow = true; armR.add(amR);
    var hR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 20), mat(skin)); hR.position.y = -0.78; armR.add(hR);
    avatar.add(armL); avatar.add(armR);

    avatar.position.y = -0.15;
    scene.add(avatar);
    window.__avatarSource = "procedural";
  }

  /* ============ Public API ============ */
  function setProgress(p) { target.progress = p; }
  function setWave(i) {
    currentWave = i;
    waveStart = clock.getElapsedTime();
    waveArm = i % 2 === 0 ? armR : armL;
  }
  function setPointer(nx, ny) { pointer.x = nx; pointer.y = ny; }
  function setCaption(i) { if (captionEl) captionEl.textContent = captions[i % captions.length]; }
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
      pointer.x = nx; pointer.y = ny;
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

    // blink (procedural eyes only)
    anim.blink += dt;
    var blinkScale = 1;
    if (anim.blink > anim.blinkAt) {
      var bt = anim.blink - anim.blinkAt;
      if (bt < 0.18) {
        blinkScale = 1 - Math.abs(Math.sin((bt / 0.18) * Math.PI)) * 0.85;
      } else {
        anim.blink = 0;
        anim.blinkAt = 2.2 + Math.random() * 2.6;
      }
    }
    if (eyeL) { eyeL.scale.y = blinkScale; eyeR.scale.y = blinkScale; }

    // wave
    var waveT = 0;
    if (currentWave !== -1) {
      var since = t - waveStart;
      if (since < waveDuration) { waveT = since / waveDuration; } else { currentWave = -1; }
    }
    var waveEnv = Math.sin(Math.PI * Math.min(1, waveT)) * (1 - waveT * 0.35);
    var waveSpin = waveEnv * Math.sin(waveT * 22) * 0.55;
    var waveRaise = waveEnv * 1.55;
    if (waveArm === armR) {
      if (armR) { armR.rotation.z = -waveRaise; armR.rotation.x = waveSpin; armR.rotation.y = waveEnv * 0.35; }
      if (armL) { armL.rotation.z = 0; armL.rotation.x = 0; armL.rotation.y = 0; }
    } else {
      if (armL) { armL.rotation.z = waveRaise; armL.rotation.x = -waveSpin; armL.rotation.y = -waveEnv * 0.35; }
      if (armR) { armR.rotation.z = 0; armR.rotation.x = 0; armR.rotation.y = 0; }
    }
    if (waveT === 0) {
      if (armR) { armR.rotation.z = 0; armR.rotation.x = 0; armR.rotation.y = 0; }
      if (armL) { armL.rotation.z = 0; armL.rotation.x = 0; armL.rotation.y = 0; }
    }

    // cursor-driven look
    if (head) {
      head.rotation.y += ((pointer.x * 0.22) - head.rotation.y) * Math.min(1, dt * 6);
      head.rotation.x += ((pointer.y * 0.14) - head.rotation.x) * Math.min(1, dt * 6);
    }
    var px = pointer.x * 0.07;
    var py = -pointer.y * 0.055;
    if (pupilL) {
      if (isGLB) {
        pupilL.position.x += (px - pupilL.position.x) * Math.min(1, dt * 8);
        pupilL.position.z += (py - pupilL.position.z) * Math.min(1, dt * 8);
        pupilR.position.x += (px - pupilR.position.x) * Math.min(1, dt * 8);
        pupilR.position.z += (py - pupilR.position.z) * Math.min(1, dt * 8);
      } else {
        pupilL.position.x += (px - pupilL.position.x) * Math.min(1, dt * 8);
        pupilL.position.y += (py - pupilL.position.y) * Math.min(1, dt * 8);
        pupilR.position.x += (px - pupilR.position.x) * Math.min(1, dt * 8);
        pupilR.position.y += (py - pupilR.position.y) * Math.min(1, dt * 8);
      }
    }

    // body lean + scroll choreography
    if (avatar) {
      avatar.position.x = pointer.x * 0.18;
      avatar.position.y = -0.15 + Math.sin(anim.breathe * 1.4) * 0.03 - p * 0.35;
      avatar.rotation.y = Math.sin(t * 0.4) * 0.05 + p * 1.3;
      avatar.rotation.x = -0.03 - p * 0.18;
      avatar.scale.setScalar(1.02 + breath + p * 0.05);
    }

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
    setupEffects();
    loadGLB();
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
