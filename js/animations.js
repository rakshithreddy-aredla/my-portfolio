/* ==========================================================================
   ANIMATIONS — the GSAP motion layer.
   --------------------------------------------------------------------------
   Preloader, custom cursor, scroll progress, nav state, scroll reveals,
   magnetic buttons, static film grain, smooth anchors.
   The marquee is pure CSS (styles.css) — no JS loop.
   If GSAP is missing, falls back to IntersectionObserver reveals only.
   Reduced motion: everything renders static — content is never hidden.
   ========================================================================== */
(function () {
  "use strict";

  var REDUCED = false;
  var rafId = 0;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- custom cursor (fine pointers only) ----------
     Position is lerped in JS; hover size/glow comes from CSS via
     body.cursor--hover (styles.css owns that state). */
  function initCursor() {
    var dot = document.getElementById("cursor-dot");
    var ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;
    var coarse = false;
    try { coarse = window.matchMedia("(pointer: coarse)").matches; } catch (e) {}
    if (coarse) return;

    var tgtX = -100, tgtY = -100;
    var ringX = -100, ringY = -100;
    var ringOn = false;

    function ringLoop() {
      ringX += (tgtX - ringX) * 0.18;
      ringY += (tgtY - ringY) * 0.18;
      ring.style.transform =
        "translate(" + (ringX - 19).toFixed(1) + "px," +
        (ringY - 19).toFixed(1) + "px)";
      rafId = window.requestAnimationFrame(ringLoop);
    }

    document.addEventListener("pointermove", function (e) {
      dot.style.transform =
        "translate(" + (e.clientX - 3.5) + "px," + (e.clientY - 3) + "px)";
      tgtX = e.clientX;
      tgtY = e.clientY;
      if (!ringOn) {
        ringX = e.clientX;
        ringY = e.clientY;
        ringOn = true;
        rafId = window.requestAnimationFrame(ringLoop);
      }
    }, { passive: true });

    document.addEventListener("mouseover", function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('[data-cursor="hover"]')) {
        document.body.classList.add("cursor--hover");
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-cursor="hover"]')) {
        document.body.classList.remove("cursor--hover");
      }
    });
  }

  /* ---------- scroll progress + nav state ---------- */
  function initScrollChrome() {
    var progress = document.getElementById("scroll-progress");
    var nav = document.querySelector(".nav");
    var queued = false;
    function update() {
      queued = false;
      var denom = Math.max(1,
        document.documentElement.scrollHeight - window.innerHeight);
      var y = window.scrollY || window.pageYOffset || 0;
      if (progress) progress.style.width = ((y / denom) * 100).toFixed(2) + "%";
      if (nav) nav.classList.toggle("nav--scrolled", y > 40);
    }
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- magnetic buttons ---------- */
  function initMagnetic() {
    var els = document.querySelectorAll("[data-magnetic]");
    Array.prototype.forEach.call(els, function (el) {
      var curX = 0, curY = 0, tgtX = 0, tgtY = 0, myRaf = 0;
      function step() {
        curX += (tgtX - curX) * 0.16;
        curY += (tgtY - curY) * 0.16;
        el.style.transform =
          "translate(" + curX.toFixed(2) + "px," + curY.toFixed(2) + "px)";
        if (Math.abs(tgtX - curX) > 0.05 || Math.abs(tgtY - curY) > 0.05) {
          myRaf = window.requestAnimationFrame(step);
        } else {
          myRaf = 0;
        }
      }
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        tgtX = clamp(dx * 0.18, -6, 6);
        tgtY = clamp(dy * 0.18, -6, 6);
        if (!myRaf) myRaf = window.requestAnimationFrame(step);
      });
      el.addEventListener("pointerleave", function () {
        tgtX = 0; tgtY = 0;
        if (!myRaf) myRaf = window.requestAnimationFrame(step);
      });
    });
  }

  /* ---------- film grain (static, drawn once — no loop) ---------- */
  function initNoise() {
    var c = document.querySelector(".noise-canvas");
    if (!c || !c.getContext) return;
    try {
      var ctx = c.getContext("2d");
      var w = (c.width = 320);
      var h = (c.height = 320);
      var imgd = ctx.createImageData(w, h);
      var px = imgd.data;
      for (var i = 0; i < px.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        px[i] = v;
        px[i + 1] = v;
        px[i + 2] = v;
        px[i + 3] = 255;
      }
      ctx.putImageData(imgd, 0, 0);
    } catch (err) { /* decorative only */ }
  }

  /* ---------- smooth anchors ---------- */
  function initAnchors() {
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          if (!id || id === "#") return;
          var target = null;
          try { target = document.querySelector(id); } catch (err) { return; }
          if (!target) return;
          e.preventDefault();
          try {
            target.scrollIntoView({
              behavior: REDUCED ? "auto" : "smooth",
              block: "start"
            });
          } catch (err) {
            window.scrollTo(0, target.offsetTop);
          }
        });
      })(links[i]);
    }
  }

  /* ---------- footer year ---------- */
  function initYear() {
    var y = document.getElementById("year");
    if (y && !y.textContent) y.textContent = String(new Date().getFullYear());
  }

  /* ---------- init ---------- */
  function init() {
    try {
      REDUCED = !!(window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (err) { REDUCED = false; }

    var hasGsap = typeof window.gsap !== "undefined";
    var hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";
    if (hasST) gsap.registerPlugin(ScrollTrigger);

    /* reveals — GSAP scroll-triggered when available; otherwise an
       IntersectionObserver flips .is-in (html.io-reveal owns the CSS). */
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (items.length && hasGsap && !REDUCED) {
      items.forEach(function (el) {
        gsap.fromTo(el,
          { y: 28, autoAlpha: 0 },
          {
            y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out",
            delay: parseFloat(el.getAttribute("data-delay") || "0"),
            scrollTrigger: { trigger: el, start: "top 88%", once: true }
          });
      });
    } else if (items.length) {
      document.documentElement.classList.add("io-reveal");
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            revealIO.unobserve(en.target);
          }
        });
      }, { threshold: 0.12 });
      items.forEach(function (el) { revealIO.observe(el); });
      if (REDUCED) {
        items.forEach(function (el) { el.classList.add("is-in"); });
      }
    }

    /* preloader: fill the bar, then hand over to the page.
       body.preloader--done is what makes .reveal content visible. */
    var pre = document.getElementById("preloader");
    var fill = pre ? pre.querySelector(".preloader__bar-fill") : null;
    function finishPreloader() {
      document.body.classList.add("preloader--done");
      if (pre) {
        pre.style.opacity = "0";
        pre.style.visibility = "hidden";
        window.setTimeout(function () {
          if (pre.parentNode) pre.parentNode.removeChild(pre);
        }, 950);
      }
    }
    if (REDUCED || !fill) {
      finishPreloader();
    } else {
      fill.style.transition = "width .9s cubic-bezier(.22,1,.36,1)";
      window.requestAnimationFrame(function () { fill.style.width = "100%"; });
      window.setTimeout(finishPreloader, 1000);
    }

    if (!REDUCED) initCursor();
    initNoise();
    initScrollChrome();
    initAnchors();
    initYear();
  }

  window.ANIMATIONS = { init: init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
