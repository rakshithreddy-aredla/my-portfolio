(function () {
  "use strict";

  var stage = null;
  var canvas = null;
  var renderer = null;
  var scene = null;
  var camera = null;
  var sculpt = null;
  var sculptBaseY = 0.1;
  var loaded = false;
  var stageVisible = true;
  var revealed = false;
  var dragging = false;
  var lastX = 0;
  var lastY = 0;
  var reducedMotion = false;
  var prevTime = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function init() {
    if (typeof window.THREE === "undefined") {
      return;
    }

    stage = document.getElementById("sculpture-stage");
    canvas = document.getElementById("sculpture-canvas");
    if (!stage || !canvas) {
      return;
    }

    try {
      reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (err) {
      reducedMotion = false;
    }

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
      });
    } catch (err) {
      stage.style.display = "none";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(stage.clientWidth || 1, stage.clientHeight || 1);
    renderer.setClearColor(0x000000, 0);
    if (THREE.ACESFilmicToneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
    }
    renderer.toneMappingExposure = 1.1;
    if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      38,
      (stage.clientWidth || 1) / (stage.clientHeight || 1),
      0.1,
      100
    );
    camera.position.set(0, 0.4, 5.2);
    camera.lookAt(0, 0.1, 0);

    scene.add(new THREE.AmbientLight(0xffd9b0, 0.5));

    var keyLight = new THREE.DirectionalLight(0xfff0e0, 1.3);
    keyLight.position.set(2.5, 3, 4);
    scene.add(keyLight);

    var rimLight = new THREE.DirectionalLight(0x7c5cff, 1.6);
    rimLight.position.set(-2, 1.5, -4);
    scene.add(rimLight);

    var accentLight = new THREE.PointLight(0xe8b44a, 0.5, 10);
    accentLight.position.set(0, -0.8, 2);
    scene.add(accentLight);

    bindResize();
    bindDrag();
    observeStage();

    if (typeof THREE.GLTFLoader === "function") {
      try {
        new THREE.GLTFLoader().load("assets/face-relief.glb", onLoadSuccess, undefined, onLoadFail);
      } catch (err) {
        onLoadFail(err);
      }
    } else {
      onLoadFail(null);
    }

    prevTime = performance.now();
    requestAnimationFrame(loop);
  }

  function onLoadSuccess(gltf) {
    if (!scene || !gltf || !gltf.scene) {
      return;
    }

    try {
      var model = gltf.scene;
      var box = new THREE.Box3().setFromObject(model);
      var size = new THREE.Vector3();
      var center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      var scale = size.y > 0 ? 2.6 / size.y : 1;
      scale = clamp(scale, 0.2, 5);
      model.scale.setScalar(scale);
      model.position.set(
        -center.x * scale,
        -center.y * scale + 0.1,
        -center.z * scale
      );

      model.traverse(function (child) {
        if (child && child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });

      scene.add(model);
      sculpt = model;
      sculptBaseY = model.position.y;
      loaded = true;
    } catch (err) {
      onLoadFail(err);
    }
  }

  function onLoadFail() {
    if (!scene || loaded || typeof THREE.TorusKnotGeometry !== "function") {
      return;
    }

    var geometry = new THREE.TorusKnotGeometry(0.9, 0.28, 160, 24);
    var material = new THREE.MeshStandardMaterial({
      color: 0x7c5cff,
      metalness: 0.35,
      roughness: 0.3,
      emissive: 0x7c5cff,
      emissiveIntensity: 0.12
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    sculpt = mesh;
    sculptBaseY = 0;
    loaded = true;
  }

  function bindResize() {
    window.addEventListener("resize", function () {
      if (!renderer || !camera || !stage) {
        return;
      }
      var width = stage.clientWidth || 1;
      var height = stage.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
  }

  function bindDrag() {
    if (!stage) {
      return;
    }

    stage.style.cursor = "grab";
    stage.style.touchAction = "none";

    stage.addEventListener("pointerdown", function (event) {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      stage.style.cursor = "grabbing";
      if (typeof stage.setPointerCapture === "function") {
        try {
          stage.setPointerCapture(event.pointerId);
        } catch (err) {
          /* pointer capture is best-effort */
        }
      }
      if (typeof event.preventDefault === "function") {
        event.preventDefault();
      }
    });

    window.addEventListener("pointermove", function (event) {
      if (!dragging || !sculpt) {
        return;
      }
      var dx = event.clientX - lastX;
      var dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      sculpt.rotation.y += dx * 0.008;
      sculpt.rotation.x = clamp(sculpt.rotation.x + dy * 0.005, -0.5, 0.5);
    });

    function endDrag() {
      if (!dragging) {
        return;
      }
      dragging = false;
      if (stage) {
        stage.style.cursor = "grab";
      }
    }

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", endDrag);
  }

  function observeStage() {
    if (!stage) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      stageVisible = true;
      reveal();
      return;
    }

    stage.style.opacity = "0";

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          stageVisible = entries[i].isIntersecting;
          if (stageVisible) {
            reveal();
          }
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(stage);
  }

  function reveal() {
    if (revealed || !stage) {
      return;
    }
    revealed = true;
    stage.style.transition = "opacity 0.9s ease";
    stage.style.opacity = "1";
  }

  function loop(now) {
    requestAnimationFrame(loop);

    if (!renderer || !scene || !camera) {
      return;
    }

    var dt = (now - prevTime) / 1000;
    prevTime = now;

    if (!stageVisible) {
      return;
    }

    dt = clamp(dt, 0, 0.05);
    var t = now / 1000;

    if (sculpt && loaded) {
      if (!dragging && !reducedMotion) {
        sculpt.rotation.y += dt * 0.25;
      }
      if (!reducedMotion) {
        sculpt.position.y = sculptBaseY + Math.sin(t * 0.8) * 0.05;
      }
    }

    renderer.render(scene, camera);
  }

  function boot() {
    if (boot.done) {
      return;
    }
    boot.done = true;
    init();
  }

  window.SCULPTURE = {
    init: function () {
      boot();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
