/* ==========================================================================
   MINI-ME — a tiny 3D companion standing in the fixed right-side rail.
   --------------------------------------------------------------------------
   WHAT IT DOES
   - Stands on a glowing disc at the right edge of the page (desktop only;
     the rail is display:none below 1100px via styles.css).
   - Bounces / leans forward as the user scrolls, breathes when idle.
   - WAVES its arm whenever the active section changes, and a small speech
     bubble names the section.
   - Head + pupils track the cursor the whole time.

   MODEL: assets/avatar.glb (Blender-built full-body character, node names
   head / armL / armR / pupilL / pupilR). If the GLB fails, a procedural
   chibi is built with the exact same behaviors — the site never breaks.

   LOAD POLICY (perf review b9324a5 fix): Three.js + GLTFLoader (~700KB) are
   NOT loaded by index.html. This module injects them — integrity-pinned —
   only on desktop viewports (>= 1100px, where the rail is visible) and only
   for non-reduced-motion users. Mobile never downloads the 3.9MB GLB.
   ========================================================================== */
(function () {
  "use strict";

  var renderer = null;
  var scene = null;
  var camera = null;
  var model = null;        // the character group
  var head = null;
  var pupilL = null;
  var pupilR = null;
  var armR = null;
  var discs = [];          // glow discs under feet
  var rail = null;
  var canvas = null;
  var bubble = null;
  var progressFill = null;

  var raf = 0;
  var disposed = false;
  var railVisible = true;
  var reducedMotion = false;
  var prevTime = 0;
  var prevScroll = 0;
  var scrollVel = 0;       // lerped scroll velocity, 0..~1
  var waveT = -1;          // wave animation clock, -1 = idle
  var discPulse = 0;
  var baseRotY = -0.35;
  var cursor = { x: 0, y: 0, tx: 0, ty: 0 };
  var activeSection = "home";
  var sectionBits = {};
  var lastPointer = 0;     // Date.now() of last pointermove
  var lastRender = 0;      // for idle throttling
  var frameCount = 0;
  var lastProgress = -1;   // cached progress (scroll handler owns writes)
  var docDenom = 1;        // scrollable height, refreshed on scroll/resize
  var booting = false;

  var SECTIONS = ["home", "about", "projects", "skills", "journey", "contact"];
  var BUBBLES = {
    home: "Hey! I'm mini Rakshith",
    about: "That's me for real",
    projects: "My work →",
    skills: "My stack!",
    journey: "The journey",
    contact: "Say hi!"
  };

  var CDN = [
    {
      url: "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js",
      integrity: "sha384-vV17nr/rMaJqmeZkFUzXLpHdQ+ME5QHKdydaqqN+3Ga39RJlNrTatJxHwGV4ml2C"
    },
    {
      url: "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js",
      integrity: "sha384-FassWWYNEPQsuRQm+59KIMcDetEc30bNyE9yfx16Ok8lvoowyH81LtrPmLWltJMh"
    }
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function railEnabled() {
    try {
      return window.matchMedia("(min-width: 1100px)").matches;
    } catch (err) { return window.innerWidth >= 1100; }
  }

  /* ---------- helpers ---------- */

  function setBubble(text) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("is-visible");
    window.setTimeout(function () {
      bubble.classList.remove("is-visible");
    }, 2200);
  }

  function trackSections() {
    for (var i = 0; i < SECTIONS.length; i++) {
      var el = document.getElementById(SECTIONS[i]);
      if (!el) continue;
      sectionBits[SECTIONS[i]] = el;
      (function (id) {
        new IntersectionObserver(function (entries) {
          var e = entries[0];
          if (e && e.isIntersecting && activeSection !== id) {
            activeSection = id;
            setBubble(BUBBLES[id] || "Hi!");
            if (armR && !reducedMotion) waveT = 0;
          }
        }, { threshold: 0.35 }).observe(el);
      })(SECTIONS[i]);
    }
  }

  function textureFace() {
    if (!head) return;
    new THREE.TextureLoader().load(
      "assets/me.jpg",
      function (tex) {
        if (THREE.SRGBColorSpace && tex.colorSpace !== undefined) {
          tex.colorSpace = THREE.SRGBColorSpace;
        }
        var done = false;
        head.traverse(function (n) {
          if (done || !n.isMesh || !n.material) return;
          if (n.material.isMeshStandardMaterial) {
            n.material.map = tex;
            n.material.needsUpdate = true;
            done = true;
          }
        });
      },
      undefined,
      function () { /* texture optional — baked look is fine */ }
    );
  }

  function addGlowDiscs(parent) {
    var discGeo = new THREE.CircleGeometry(0.55, 40);
    var discMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, transparent: true, opacity: 0.35, side: THREE.DoubleSide
    });
    var disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.005;
    parent.add(disc);
    discs.push(disc);

    var innerGeo = new THREE.CircleGeometry(0.28, 32);
    var innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.5, side: THREE.DoubleSide
    });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.008;
    parent.add(inner);
    discs.push(inner);
  }

  /* ---------- model loading ---------- */

  function adoptGLB(gltf) {
    model = gltf.scene;
    scene.add(model);

    // Normalize: height 1.6, feet on the ground, centered.
    var box = new THREE.Box3().setFromObject(model);
    var size = new THREE.Vector3();
    var h = Math.max(0.0001, box.max.y - box.min.y);
    var s = 1.6 / h;
    model.scale.setScalar(s);
    box.setFromObject(model);
    var center = new THREE.Vector3();
    box.getCenter(center);
    model.position.x = -center.x;
    model.position.z = -center.z;
    model.position.y = -box.min.y;

    model.rotation.y = baseRotY;

    head = model.getObjectByName("head") || null;
    armR = model.getObjectByName("armR") || null;
    pupilL = model.getObjectByName("pupilL") || null;
    pupilR = model.getObjectByName("pupilR") || null;

    addGlowDiscs(model);
    textureFace();
  }

  function buildChibi() {
    model = new THREE.Group();
    model.rotation.y = baseRotY;
    scene.add(model);

    var skin = new THREE.MeshStandardMaterial({ color: 0xe8b48c, roughness: 0.6 });
    var jacket = new THREE.MeshStandardMaterial({ color: 0x0EA5E9, roughness: 0.5 });
    var hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.8 });
    var white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var dark = new THREE.MeshBasicMaterial({ color: 0x14100e });

    // legs + shoes
    var legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.5, 12);
    var legL = new THREE.Mesh(legGeo, hairMat); legL.position.set(-0.14, 0.25, 0);
    var legR = legL.clone(); legR.position.x = 0.14;
    var shoeGeo = new THREE.SphereGeometry(0.11, 12, 10);
    var shoeL = new THREE.Mesh(shoeGeo, jacket); shoeL.position.set(-0.14, 0.04, 0.05); shoeL.scale.set(1, 0.6, 1.4);
    var shoeR = shoeL.clone(); shoeR.position.x = 0.14;

    // torso
    var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.62, 16), jacket);
    torso.position.y = 0.82;

    // arms — armR is a shoulder pivot so the wave reads cleanly
    var armGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.42, 10);
    var armLp = new THREE.Group(); armLp.name = "armL"; armLp.position.set(-0.34, 1.06, 0);
    var armLm = new THREE.Mesh(armGeo, jacket); armLm.position.y = -0.21; armLp.add(armLm);
    var handL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skin); handL.position.y = -0.45; armLp.add(handL);
    armR = new THREE.Group(); armR.name = "armR"; armR.position.set(0.34, 1.06, 0);
    var armRm = new THREE.Mesh(armGeo, jacket); armRm.position.y = -0.21; armR.add(armRm);
    var handR = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skin); handR.position.y = -0.45; armR.add(handR);

    // head
    head = new THREE.Group(); head.name = "head"; head.position.y = 1.42;
    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 20), skin);
    skull.scale.set(0.95, 1.05, 0.95); head.add(skull);
    var cap = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    cap.position.y = 0.04; cap.scale.set(1, 0.9, 1); head.add(cap);

    var eyeGeo = new THREE.SphereGeometry(0.055, 10, 8);
    var eyeL = new THREE.Mesh(eyeGeo, white); eyeL.position.set(-0.12, 0.02, 0.27); head.add(eyeL);
    var eyeR = eyeL.clone(); eyeR.position.x = 0.12; head.add(eyeR);
    var pupGeo = new THREE.SphereGeometry(0.028, 8, 6);
    pupilL = new THREE.Mesh(pupGeo, dark); pupilL.position.set(-0.12, 0.02, 0.31); head.add(pupilL);
    pupilR = new THREE.Mesh(pupGeo, dark); pupilR.position.set(0.12, 0.02, 0.31); head.add(pupilR);

    // smile
    var smileGeo = new THREE.TorusGeometry(0.09, 0.016, 8, 16, Math.PI);
    var smile = new THREE.Mesh(smileGeo, dark);
    smile.position.set(0, -0.1, 0.29);
    smile.rotation.z = Math.PI; // opening faces up → reads as a smile
    head.add(smile);

    model.add(legL); model.add(legR); model.add(shoeL); model.add(shoeR);
    model.add(torso); model.add(armLp); model.add(armR); model.add(head);
    addGlowDiscs(model);
  }

  function injectScript(spec, onLoad, onError) {
    var s = document.createElement("script");
    s.src = spec.url;
    if (spec.integrity) {
      s.integrity = spec.integrity;
      s.crossOrigin = "anonymous";
    }
    s.onload = onLoad;
    s.onerror = onError;
    document.head.appendChild(s);
  }

  function loadThreeThenModel() {
    if (booting) return;
    booting = true;

    var three = {
      url: "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js",
      integrity: "sha384-vV17nr/rMaJqmeZkFUzXLpHdQ+ME5QHKdydaqqN+3Ga39RJlNrTatJxHwGV4ml2C"
    };
    var loader = {
      url: "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js",
      integrity: "sha384-FassWWYNEPQsuRQm+59KIMcDetEc30bNyE9yfx16Ok8lvoowyH81LtrPmLWltJMh"
    };

    injectScript(three, function () {
      if (disposed) return;
      injectScript(loader, function () {
        if (disposed) return;
        loadModel();
      }, function () {
        if (disposed) return;
        window.console && console.warn("mini-me: GLTFLoader failed to load");
        buildChibi();
        window.__miniMeSource = "procedural";
      });
    }, function () {
      if (disposed) return;
      window.console && console.warn("mini-me: three.js failed to load, hiding rail");
      rail.style.display = "none";
      window.__miniMeSource = "none";
      disposed = true;
    });
  }

  /* Creates the WebGL renderer, scene, camera and lights — called once,
     AFTER the dynamically injected three.js has executed. */
  function setupRenderer() {
    if (renderer) return true;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (err) {
      rail.style.display = "none";
      window.__miniMeSource = "none";
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 110 / 260, 0.1, 20);
    camera.position.set(0, 0.9, 3.1);
    camera.lookAt(0, 0.85, 0);

    scene.add(new THREE.AmbientLight(0x4a4460, 0.9));
    var key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(2, 3, 4); scene.add(key);
    var rim = new THREE.PointLight(0x22d3ee, 1.4, 12); rim.position.set(-2, 2, -2); scene.add(rim);
    var gold = new THREE.PointLight(0x38bdf8, 0.6, 8); gold.position.set(0, 0.6, 2); scene.add(gold);
    onResize();
    return true;
  }

  function loadModel() {
    if (!setupRenderer()) return;
    if (typeof THREE === "undefined") {
      buildChibi();
      window.__miniMeSource = "procedural";
      return;
    }
    var gltfReady = typeof THREE.GLTFLoader !== "undefined";
    if (gltfReady) {
      new THREE.GLTFLoader().load(
        "assets/avatar.glb",
        function (gltf) {
          if (disposed) return;
          adoptGLB(gltf);
          window.__miniMeSource = "glb";
        },
        undefined,
        function () {
          if (disposed) return;
          window.console && console.warn("mini-me: GLB failed, using fallback");
          buildChibi();
          window.__miniMeSource = "procedural";
        }
      );
    } else {
      window.console && console.warn("mini-me: no GLTFLoader, using fallback");
      buildChibi();
      window.__miniMeSource = "procedural";
    }
  }

  /* ---------- scroll progress (scroll-driven, not render-driven) ---------- */

  var scrollQueued = false;
  function onScrollRaf() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(function () {
      scrollQueued = false;
      var sy = window.scrollY || 0;
      var denom = Math.max(1,
        document.documentElement.scrollHeight - window.innerHeight);
      var prog = clamp(sy / denom, 0, 1);
      if (progressFill && Math.abs(prog - lastProgress) > 0.001) {
        progressFill.style.height = (prog * 100).toFixed(1) + "%";
        lastProgress = prog;
      }
    });
  }

  /* ---------- animation loop ---------- */

  function frame(time) {
    if (disposed) return;
    raf = window.requestAnimationFrame(frame);
    if (document.hidden || !railVisible || !model || !renderer) return;

    var t = time / 1000;
    var dt = Math.min(0.05, t - (prevTime || t));
    prevTime = t;

    /* Idle throttle: while the user is reading (no scroll, no pointer,
       no wave) render at ~10fps instead of 60 — the scene barely moves
       (disc pulse + breathing), so nothing is visually lost. */
    var pointerIdle = (time - lastPointer) > 2000;
    var idle = scrollVel < 0.02 && waveT < 0 && pointerIdle;
    if (idle && (t - lastRender) < 0.1) {
      return; // skip this frame's math + render entirely
    }
    lastRender = t;

    var sy = window.scrollY || 0;
    var rawVel = Math.abs(sy - prevScroll) / Math.max(1, window.innerHeight) / Math.max(dt, 0.001);
    prevScroll = sy;
    scrollVel = lerp(scrollVel, clamp(rawVel, 0, 1.4), 0.12);

    var walking = scrollVel > 0.06;
    if (walking) {
      model.position.y = Math.abs(Math.sin(t * 7)) * 0.05;
      model.rotation.x = lerp(model.rotation.x, -0.1, 0.15);
    } else {
      model.position.y = lerp(model.position.y, 0, 0.12);
      model.rotation.x = lerp(model.rotation.x, 0, 0.12);
    }
    // idle breathing
    model.scale.y = 1 + 0.01 * Math.sin(t * 2);

    // cursor tracking
    cursor.x = lerp(cursor.x, cursor.tx, 0.1);
    cursor.y = lerp(cursor.y, cursor.ty, 0.1);
    if (head) {
      head.rotation.y = lerp(head.rotation.y, cursor.tx * 0.5, 0.12);
      head.rotation.x = lerp(head.rotation.x, -cursor.ty * 0.22, 0.12);
    }
    if (pupilL) { pupilL.position.x = cursor.tx * 0.03; pupilL.position.y = cursor.ty * 0.1; }
    if (pupilR) { pupilR.position.x = cursor.tx * 0.03; pupilR.position.y = cursor.ty * 0.1; }
    model.rotation.y = baseRotY + cursor.tx * 0.12;

    // wave: 1.4s sine raise on armR
    if (waveT >= 0 && armR) {
      waveT += dt;
      var u = waveT / 1.4;
      if (u >= 1) { waveT = -1; armR.rotation.z = 0; }
      else armR.rotation.z = -2.1 * Math.sin(Math.PI * u);
    }

    // glow disc pulse
    discPulse += dt;
    var ps = 1 + 0.06 * Math.sin(discPulse * 3);
    for (var i = 0; i < discs.length; i++) discs[i].scale.set(ps, ps, 1);

    lastRender = t;
    renderer.render(scene, camera);
  }

  /* ---------- input ---------- */

  var lastPointer = 0;
  var pointerPending = false;
  function onPointerMove(e) {
    lastPointer = performance.now();
    if (pointerPending) return;
    pointerPending = true;
    window.requestAnimationFrame(function () {
      pointerPending = false;
      cursor.tx = (e.clientX / window.innerWidth) * 2 - 1;
      cursor.ty = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  function onResize() {
    if (!renderer || !canvas) return;
    var w = canvas.clientWidth || 110;
    var h = canvas.clientHeight || 260;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ---------- init ---------- */

  function init() {
    rail = document.querySelector(".mini-me-rail");
    canvas = document.getElementById("mini-me-canvas");
    bubble = document.getElementById("mini-me-bubble");
    progressFill = document.querySelector(".mini-me-progress__fill");
    if (!rail || !canvas) return;

    try {
      reducedMotion = !!(window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (err) { reducedMotion = false; }

    /* LOAD POLICY (review fix): the rail is decorative and display:none
       below 1100px — on mobile/tablet (and for reduced-motion users) skip
       everything: no WebGL context, no ~700KB Three.js, no 3.9MB GLB. */
    if (reducedMotion || !railEnabled() || canvas.clientWidth === 0) {
      rail.style.display = "none";
      window.__miniMeSource = "none";
      return;
    }

    /* The renderer/scene are created inside loadModel() — only after the
       dynamically injected three.js has executed. DOM listeners are safe
       to attach now. */
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScrollRaf, { passive: true });

    // inject three.js + GLTFLoader (integrity-pinned), then the GLB model
    loadThreeThenModel();

    // render only while the rail is on screen
    try {
      new IntersectionObserver(function (entries) {
        railVisible = !!(entries[0] && entries[0].isIntersecting);
      }, { rootMargin: "0px" }).observe(rail);
    } catch (err) { railVisible = true; }

    trackSections();

    raf = window.requestAnimationFrame(frame);
  }

  window.MINI_ME = { init: init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
