(function () {
  'use strict';

  var reducedMotion = false;

  function init() {
    var container = document.getElementById('portrait');
    if (!container) return;

    var frame = container.querySelector('.hero__portrait-frame');
    var img = container.querySelector('.hero__portrait-img');
    var glare = container.querySelector('.hero__portrait-glare');
    if (!frame || !img) return;

    reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var style = frame.style;
    var isOver = false;
    var tx = 0, ty = 0;          // target nx, ny
    var cx = 0, cy = 0;          // current nx, ny
    var gx = 50, gy = 50;        // glare target x/y (%)
    var ggx = 50, ggy = 50;      // glare current x/y
    var glareOpacity = 0;
    var scale = 1;
    var sparks = [];

    var portraitFrame = frame;
    var portraitGlare = glare;

    function setFrameBase() {
      style.position = 'relative';
      style.transformStyle = 'preserve-3d';
      style.willChange = 'transform';
      portraitFrame.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';
    }

    if (!reducedMotion) {
      setFrameBase();
      if (portraitGlare) {
        portraitGlare.style.position = 'absolute';
        portraitGlare.style.top = '0';
        portraitGlare.style.left = '0';
        portraitGlare.style.width = '100%';
        portraitGlare.style.height = '100%';
        portraitGlare.style.borderRadius = '50%';
        portraitGlare.style.pointerEvents = 'none';
        portraitGlare.style.opacity = '0';
      }

      var onMove = function (e) {
        var rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        var px = e.clientX - rect.left;
        var py = e.clientY - rect.top;
        var inside = px >= 0 && px <= rect.width && py >= 0 && py <= rect.height;
        if (inside) {
          tx = (px / rect.width) * 2 - 1;
          ty = (py / rect.height) * 2 - 1;
          isOver = true;
          if (portraitGlare) {
            gx = (px / rect.width) * 100;
            gy = (py / rect.height) * 100;
          }
          spawnSpark(px, py, rect);
        }
      };

      var onLeave = function () {
        isOver = false;
        tx = 0; ty = 0;
        gx = 50; gy = 50;
        if (portraitGlare) glareOpacity = 0;
      };

      container.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointermove', onMove, { passive: true });
      container.addEventListener('pointerleave', onLeave);
      window.addEventListener('blur', onLeave);

      function spawnSpark(px, py, rect) {
        var now = Date.now();
        if (now - spawnSpark._last < 120) return;
        spawnSpark._last = now;

        var spark = document.createElement('span');
        spark.className = 'hero__portrait-spark';
        spark.style.position = 'absolute';
        spark.style.width = '8px';
        spark.style.height = '8px';
        spark.style.borderRadius = '50%';
        spark.style.background = '#E8B44A';
        spark.style.boxShadow = '0 0 8px rgba(232,180,74,0.9)';
        spark.style.pointerEvents = 'none';
        spark.style.willChange = 'transform, opacity';

        var spread = 24;
        var x = px + (Math.random() * 2 - 1) * spread;
        var y = py + (Math.random() * 2 - 1) * spread;
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';

        var angle = (Math.random() * Math.PI * 2);
        var speed = 30 + Math.random() * 40;
        var vx = Math.cos(angle) * speed;
        var vy = Math.sin(angle) * speed - 30;

        portraitFrame.appendChild(spark);
        sparks.push(spark);

        if (sparks.length > 14) {
          var oldest = sparks.shift();
          if (oldest && oldest.parentNode) oldest.parentNode.removeChild(oldest);
        }

        var start = null;
        var duration = 700;
        function animate(ts) {
          if (!start) start = ts;
          var t = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          spark.style.transform =
            'translate3d(' + (vx * eased) + 'px,' + (vy * eased) + 'px,0)';
          spark.style.opacity = String(1 - t);
          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            if (spark.parentNode) spark.parentNode.removeChild(spark);
            var idx = sparks.indexOf(spark);
            if (idx !== -1) sparks.splice(idx, 1);
          }
        }
        requestAnimationFrame(animate);
      }

      var onScroll = function () {
        var sy = window.scrollY || window.pageYOffset || 0;
        if (sy < window.innerHeight * 1.2) {
          var par = 1 - sy * 0.0004;
          scale = par < 0.85 ? 0.85 : par;
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });

      var last = null;
      function loop(ts) {
        if (!last) last = ts;
        var dt = ts - last;
        last = ts;
        if (dt > 100) dt = 100;
        var k = 1 - Math.pow(1 - 0.12, dt / 16.6);

        cx += (tx - cx) * k;
        cy += (ty - cy) * k;

        var sy = window.scrollY || window.pageYOffset || 0;
        var parallax = 0;
        var opac = 1;
        if (sy < window.innerHeight * 1.2 && sy > 0) {
          parallax = -(sy * 0.12);
          opac = Math.max(0.55, 1 - sy / (window.innerHeight * 1.2) * 0.45);
        }
        var finalScale = (isOver ? 1.02 : 1) * (scale < 1 ? scale : 1);

        style.transform =
          'perspective(900px) rotateX(' + (-cy * 12).toFixed(2) + 'deg) ' +
          'rotateY(' + (cx * 14).toFixed(2) + 'deg) ' +
          'translateZ(40px) translateY(' + parallax.toFixed(2) + 'px) ' +
          'scale(' + finalScale.toFixed(3) + ')';
        style.opacity = String(opac);

        if (portraitGlare) {
          ggx += (gx - ggx) * k;
          ggy += (gy - ggy) * k;
          var targetGlare = isOver ? 1 : 0;
          glareOpacity += (targetGlare - glareOpacity) * k;
          if (glareOpacity > 0.01) {
            portraitGlare.style.background =
              'radial-gradient(circle at ' + ggx.toFixed(1) + '% ' + ggy.toFixed(1) + '%, ' +
              'rgba(255,255,255,0.35), transparent 42%)';
          }
          portraitGlare.style.opacity = String(Math.max(0, Math.min(1, glareOpacity)));
        }

        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    } else {
      style.position = 'relative';
      style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';
    }
  }

  window.PORTRAIT = {
    init: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
