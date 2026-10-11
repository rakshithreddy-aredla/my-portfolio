/* ==========================================================================
   SPELLS — micro-interaction layer, modelled on motion.dev patterns and
   lab.xevrion.dev components:
     1. text scramble (nav hover + section titles reveal)
     2. spotlight cards (the cursor is a lamp)
     3. count-up stats
     4. command palette (Ctrl/⌘ + K)
     5. confetti burst on the contact CTA
     6. copy-email with a toast
   All decorative: reduced motion keeps plain text and instant UI.
   ========================================================================== */
(function () {
  "use strict";

  var REDUCED = false;
  var CHARS = "!<>-_\\/[]{}=+*^?#________";

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- 1. text scramble ---------- */

  function scramble(el, finalText) {
    if (REDUCED || el.__busy) return;
    el.__busy = true;
    var queue = [];
    for (var i = 0; i < finalText.length; i++) {
      queue.push({
        to: finalText.charAt(i),
        start: (Math.random() * 30) | 0,
        end: (Math.random() * 30 + 20) | 0,
        ch: ""
      });
    }
    var frameN = 0;
    function step() {
      var out = "";
      var done = 0;
      for (var j = 0; j < queue.length; j++) {
        var q = queue[j];
        if (frameN >= q.end) {
          out += q.to;
          done++;
        } else if (frameN >= q.start) {
          out += CHARS.charAt((Math.random() * CHARS.length) | 0);
        } else {
          out += q.to === " " ? " " : "";
        }
      }
      frameN++;
      el.textContent = out;
      if (done < queue.length) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = finalText;
        el.__busy = false;
      }
    }
    window.requestAnimationFrame(step);
  }

  function initScramble() {
    if (REDUCED) return;

    // hover scramble on nav links
    var navLinks = document.querySelectorAll(".nav__links a[data-scramble]");
    Array.prototype.forEach.call(navLinks, function (el) {
      var original = el.textContent;
      el.addEventListener("pointerenter", function () {
        scramble(el, original);
      });
    });

    // section titles scramble once, when they scroll into view
    var titles = document.querySelectorAll(".section__title, .contact__title");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        scramble(el, el.textContent);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(titles, function (el) { io.observe(el); });
  }

  /* ---------- 2. spotlight cards (the cursor is a lamp) ---------- */

  function initSpotlight() {
    var cards = document.querySelectorAll(".project-card, .more-card, .stat");
    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left)).toFixed(1) + "px");
        card.style.setProperty("--my", ((e.clientY - r.top)).toFixed(1) + "px");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
      });
    });
  }

  /* ---------- 3. count-up stats ---------- */

  function countUp(el, target, suffix, dur) {
    var start = null;
    function step(now) {
      if (start === null) start = now;
      var p = clamp((now - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function initCountUp() {
    var stats = document.querySelectorAll(".about__stats .stat b, .stat b");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var raw = el.textContent;
        var m = raw.match(/^([0-9]+)/);
        if (m) {
          var target = parseInt(m[1], 10);
          var suffix = raw.slice(m[1].length);
          if (REDUCED) { el.textContent = raw; }
          else { countUp(el, target, suffix, 1100); }
        }
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(stats, function (el) { io.observe(el); });
  }

  /* ---------- 5. confetti burst (Design Spells magic) ---------- */

  var confettiCanvas = null;
  var confettiParticles = [];
  var confettiRaf = 0;

  function confetti(x, y) {
    if (REDUCED) return;
    var canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var parts = [];
    var colors = ["#7C5CFF", "#E8B34B", "#F4F1EC", "#9F7DFF", "#E8954B"];
    for (var i = 0; i < 90; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 4 + Math.random() * 9;
      parts.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[(Math.random() * colors.length) | 0],
        life: 1
      });
    }
    var last = null;
    function step(now) {
      if (last === null) last = now;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = 0;
      for (var k = 0; k < parts.length; k++) {
        var pt = parts[k];
        pt.vy += 18 * dt;
        pt.x += pt.vx; pt.y += pt.vy; pt.rot += pt.vr; pt.life -= dt * 0.9;
        if (pt.life <= 0) continue;
        alive++;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size * 0.6);
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = 1;
      if (alive > 0) {
        confettiRaf = window.requestAnimationFrame(step);
      } else if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
    confettiRaf = window.requestAnimationFrame(step);
  }

  function initConfetti() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-spell='confetti']"), function (btn) {
      btn.addEventListener("click", function (e) {
        if (REDUCED) return;
        confetti(e.clientX, e.clientY);
      });
    });
  }

  /* ---------- 6. copy email + toast ---------- */

  function showToast(msg) {
    var toast = document.createElement("div");
    toast.className = "copy-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    document.body.appendChild(toast);
    window.setTimeout(function () { toast.classList.add("is-out"); }, 1500);
    window.setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 1900);
  }

  function initCopyEmail() {
    var btn = document.querySelector("[data-spell='copy-email']");
    if (!btn) return;
    var email = (window.PORTFOLIO && window.PORTFOLIO.email) || "rakshithreddy.aredla@gmail.com";
    btn.addEventListener("click", function () {
      function done() {
        btn.textContent = "Copied ✓";
        showToast("Email copied to clipboard");
        window.setTimeout(function () { btn.textContent = "Copy email"; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, function () { done(); });
      } else { done(); }
    });
  }

  /* ---------- 4. command palette (Ctrl/⌘ + K) ---------- */

  var palette = null;
  var paletteInput = null;
  var paletteList = null;
  var paletteItems = [];
  var paletteSel = 0;

  function paletteBuild() {
    var email = (window.PORTFOLIO && window.PORTFOLIO.email) || "rakshithreddy.aredla@gmail.com";
    paletteItems = [
      { label: "Home", hint: "section", act: function () { paletteGo("#home"); } },
      { label: "About", hint: "section", act: function () { paletteGo("#about"); } },
      { label: "Work", hint: "section", act: function () { paletteGo("#projects"); } },
      { label: "Skills", hint: "section", act: function () { paletteGo("#skills"); } },
      { label: "Journey", hint: "section", act: function () { paletteGo("#journey"); } },
      { label: "Contact", hint: "section", act: function () { paletteGo("#contact"); } },
      { label: "Copy email", hint: email, act: function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email);
          }
          showToast("Email copied to clipboard");
        } },
      { label: "GitHub ↗", hint: "external", act: function () { window.open("https://github.com/rakshithreddy-aredla", "_blank"); } },
      { label: "LinkedIn ↗", hint: "external", act: function () { window.open("https://www.linkedin.com/in/aredla-rakshith/", "_blank"); } },
      { label: "Resume ↗", hint: "page", act: function () { window.location.href = "resume.html"; } }
    ];
  }

  function paletteGo(sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    if (window.__lenis && window.__lenis.scrollTo) {
      window.__lenis.scrollTo(el);
    } else {
      try { el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" }); }
      catch (err) { window.scrollTo(0, el.offsetTop); }
    }
  }

  function paletteRender(filter) {
    if (!paletteList) return;
    paletteList.innerHTML = "";
    var f = (filter || "").toLowerCase();
    var shown = 0;
    for (var i = 0; i < paletteItems.length; i++) {
      var it = paletteItems[i];
      if (f && it.label.toLowerCase().indexOf(f) === -1) continue;
      var li = document.createElement("li");
      li.className = "palette__item" + (shown === paletteSel ? " is-active" : "");
      li.setAttribute("data-idx", String(i));
      li.innerHTML = "<span>" + it.label + "</span><em>" + it.hint + "</em>";
      li.addEventListener("click", function (ev) {
        var idx = parseInt(ev.currentTarget.getAttribute("data-idx"), 10);
        paletteClose();
        paletteItems[idx].act();
      });
      paletteList.appendChild(li);
      shown++;
    }
    if (shown === 0) {
      paletteList.innerHTML = '<li class="palette__empty">nothing matches</li>';
    }
  }

  function paletteOpen() {
    if (!palette) return;
    paletteSel = 0;
    palette.classList.add("is-open");
    paletteRender("");
    if (paletteInput) {
      paletteInput.value = "";
      window.setTimeout(function () { paletteInput.focus(); }, 30);
    }
  }

  function paletteClose() {
    if (palette) palette.classList.remove("is-open");
  }

  function initPalette() {
    if (document.getElementById("palette")) {
      palette = document.getElementById("palette");
      paletteInput = palette.querySelector(".palette__input");
      paletteList = palette.querySelector(".palette__list");
    } else {
      // build the palette DOM here so index.html stays lean
      palette = document.createElement("div");
      palette.id = "palette";
      palette.className = "palette";
      palette.innerHTML =
        '<div class="palette__backdrop"></div>' +
        '<div class="palette__panel" role="dialog" aria-label="Command palette">' +
        '<div class="palette__head"><span class="palette__dot"></span>' +
        '<input class="palette__input" type="text" placeholder="Type a command or search..." aria-label="Command" />' +
        '<span class="palette__esc">esc</span></div>' +
        '<ul class="palette__list"></ul></div>';
      document.body.appendChild(palette);
      paletteInput = palette.querySelector(".palette__input");
      paletteList = palette.querySelector(".palette__list");
    }

    paletteBuild();
    paletteRender("");

    palette.querySelector(".palette__backdrop").addEventListener("click", paletteClose);
    paletteInput.addEventListener("input", function () {
      paletteSel = 0;
      paletteRender(paletteInput.value);
    });
    paletteInput.addEventListener("keydown", function (e) {
      var shown = paletteList.querySelectorAll(".palette__item");
      if (e.key === "Escape") { paletteClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        paletteSel = Math.min(shown.length - 1, paletteSel + 1);
        paletteHighlight(shown);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        paletteSel = Math.max(0, paletteSel - 1);
        paletteHighlight(shown);
      } else if (e.key === "Enter") {
        e.preventDefault();
        var el = shown[paletteSel];
        if (el) {
          var idx = parseInt(el.getAttribute("data-idx"), 10);
          paletteClose();
          paletteItems[idx].act();
        }
      }
    });

    var openBtn = document.getElementById("palette-open");
    if (openBtn) openBtn.addEventListener("click", paletteOpen);

    document.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA";
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (palette.classList.contains("is-open")) paletteClose(); else paletteOpen();
      } else if (e.key === "/" && !typing && !palette.classList.contains("is-open")) {
        e.preventDefault();
        paletteOpen();
      } else if (e.key === "Escape") {
        paletteClose();
      }
    });
  }

  function paletteHighlight(shown) {
    Array.prototype.forEach.call(shown, function (el, i) {
      el.classList.toggle("is-active", i === paletteSel);
    });
  }

  /* ---------- lenis smooth scroll (motion.dev pattern) ----------
     Wired into GSAP's ticker so ScrollTrigger stays in sync. Exposed as
     window.__lenis so the command palette and anchor code can use it. */
  function initLenis() {
    if (REDUCED) return;
    var hasGsap = typeof window.gsap !== "undefined";
    if (typeof window.Lenis === "undefined" || !hasGsap) return;
    try {
      var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      window.__lenis = lenis;
      if (window.ScrollTrigger) lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } catch (err) { /* native scroll is fine */ }
  }

  /* ---------- init ---------- */
  function init() {
    try {
      REDUCED = !!(window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (err) { REDUCED = false; }

    initLenis();
    initScramble();
    initSpotlight();
    initCountUp();
    initConfetti();
    initCopyEmail();
    initPalette();
  }

  window.SPELLS = { init: init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
