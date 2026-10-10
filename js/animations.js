(function () {
  "use strict";

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var AVATAR = window.AVATAR || null;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Preloader ---------- */
  function runPreloader() {
    var preloader = document.getElementById("preloader");
    if (!preloader) return;
    var bar = document.querySelector(".preloader__bar-fill");
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      if (gsap) {
        gsap.to(preloader, {
          opacity: 0,
          y: -40,
          duration: 0.9,
          ease: "power2.inOut",
          delay: 0.15,
          onComplete: function () {
            preloader.style.display = "none";
            if (document.body) document.body.classList.add("preloader--done");
          }
        });
        gsap.fromTo(
          ".hero__content > *",
          { y: 48, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.2 }
        );
      } else {
        preloader.style.display = "none";
        if (document.body) document.body.classList.add("preloader--done");
      }
    }
    if (gsap && bar) {
      gsap.to(bar, { width: "100%", duration: 1.1, ease: "power2.inOut", onComplete: finish });
    }
    window.addEventListener("load", finish);
    setTimeout(finish, 2600);
  }

  /* ---------- Noise canvas (film grain) ---------- */
  function initNoise() {
    var c = document.getElementById("noise-canvas");
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = (c.width = window.innerWidth);
    var h = (c.height = window.innerHeight);
    var frame = 0;
    function tick() {
      frame++;
      var img = ctx.createImageData(w, h);
      var d = img.data;
      var len = w * h * 4;
      var noise = 24;
      for (var i = 0; i < len; i += 4) {
        var v = (Math.random() - 0.5) * noise;
        d[i] = 128 + v;
        d[i + 1] = 128 + v;
        d[i + 2] = 128 + v;
        d[i + 3] = 26;
      }
      ctx.putImageData(img, 0, 0);
      requestAnimationFrame(tick);
    }
    window.addEventListener("resize", function () {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    });
    requestAnimationFrame(tick);
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (!finePointer) return;
    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");
    if (!dot && !ring) return;
    var dotX = 0, dotY = 0, ringX = 0, ringY = 0;
    document.addEventListener("mousemove", function (e) {
      dotX = e.clientX;
      dotY = e.clientY;
      if (dot) dot.style.transform = "translate3d(" + dotX + "px," + dotY + "px,0)";
    });
    (function loop() {
      requestAnimationFrame(loop);
      if (!ring) return;
      ringX += (dotX - ringX) * 0.16;
      ringY += (dotY - ringY) * 0.16;
      ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0)";
    })();
    var hoverSel = "a, button, [data-cursor='hover'], .project-card, .more-card, .skill, .contact__btn, .btn, .tag";
    document.addEventListener("mouseover", function (e) {
      if (e.target && e.target.closest && e.target.closest(hoverSel)) document.body.classList.add("cursor--hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target && e.target.closest && e.target.closest(hoverSel)) document.body.classList.remove("cursor--hover");
    });
  }

  /* ---------- Nav scrolled state ---------- */
  function initNav() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("nav--scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll progress bar ---------- */
  function initProgress() {
    var bar = document.querySelector("#scroll-progress span");
    if (!bar) return;
    if (gsap && ScrollTrigger && !reduced) {
      gsap.to(bar, {
        width: "100%",
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
      });
    } else {
      var onScroll = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? Math.min(1, window.scrollY / max) : 0) * 100 + "%";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    if (!gsap || !ScrollTrigger) return;
    if (reduced) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.style.opacity = "1"; el.style.transform = "none"; });
      return;
    }
    gsap.utils.toArray(".reveal").forEach(function (el) {
      gsap.fromTo(
        el,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } }
      );
    });
  }

  /* ---------- Cards stagger ---------- */
  function initCards() {
    if (!gsap || !ScrollTrigger || reduced) return;
    ["featured-projects", "more-projects"].forEach(function (id) {
      var wrap = document.getElementById(id);
      if (!wrap) return;
      var items = wrap.querySelectorAll(".project-card, .more-card");
      gsap.fromTo(
        items,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12,
          scrollTrigger: { trigger: wrap, start: "top 82%", once: true } }
      );
    });
    var timeline = document.getElementById("timeline");
    if (timeline) {
      gsap.fromTo(
        timeline.querySelectorAll(".timeline-item"),
        { x: -24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.15,
          scrollTrigger: { trigger: timeline, start: "top 80%", once: true } }
      );
    }
  }

  /* ---------- Marquee seamless loop ---------- */
  function initMarquee() {
    var track = document.getElementById("marquee-track");
    if (!track) return;
    track.innerHTML = track.innerHTML + track.innerHTML;
  }

  /* ---------- Hero parallax ---------- */
  function initHeroParallax() {
    if (!gsap || !ScrollTrigger || reduced) return;
    var heroContent = document.querySelector(".hero__content");
    if (heroContent) {
      gsap.to(heroContent, {
        y: -120, opacity: 0.15, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    var avatarStage = document.querySelector(".hero__avatar");
    if (avatarStage) {
      gsap.to(avatarStage, {
        y: 60, rotate: -2, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
  }

  /* ---------- Avatar: scroll progress + per-section wave ---------- */
  function initAvatarScroll() {
    if (!AVATAR) return;
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      AVATAR.setProgress(p);
    }
    function request() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", request, { passive: true });
    update();

    if (gsap && ScrollTrigger && !reduced) {
      ["about", "work", "skills", "journey", "contact"].forEach(function (id, i) {
        var el = document.getElementById(id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 65%",
          onEnter: function () {
            AVATAR.setWave(i);
            AVATAR.setCaption(i + 1);
          }
        });
      });
    }
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!finePointer || !gsap || reduced) return;
    document.querySelectorAll(".btn, .contact__btn, .nav__cta, .project__link").forEach(function (el) {
      var xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1,0.4)" });
      var yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1,0.4)" });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Smooth anchor scroll ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* ---------- Contact title word reveal ---------- */
  function initContactReveal() {
    if (!gsap || !ScrollTrigger || reduced) return;
    var title = document.querySelector(".contact__title");
    if (!title) return;
    var words = title.textContent.trim().split(/\s+/);
    title.innerHTML = words
      .map(function (w) {
        return '<span class="contact__word" style="display:inline-block;overflow:hidden;vertical-align:top">' +
          '<span class="contact__word-inner" style="display:inline-block">' + w + "</span></span>";
      })
      .join(" ");
    gsap.fromTo(
      ".contact__word-inner",
      { y: "110%" },
      { y: "0%", duration: 0.9, ease: "power4.out", stagger: 0.05,
        scrollTrigger: { trigger: title, start: "top 85%", once: true } }
    );
  }

  /* ---------- Skills cloud ---------- */
  function initSkillsCloud() {
    var cloud = document.getElementById("skills-cloud");
    var list = document.getElementById("skills-list");
    if (!cloud || !list) return;
    var skills = Array.prototype.slice.call(list.children).map(function (s) { return s.textContent; });
    var hot = ["TypeScript", "Python", "Next.js", "Supabase", "RAG"];
    var fonts = [2.6, 2.0, 1.5, 1.2];
    skills.forEach(function (skill, i) {
      var span = document.createElement("span");
      span.textContent = skill;
      var size = fonts[i % fonts.length] + (skill.length > 8 ? -0.2 : 0);
      span.style.fontSize = size + "rem";
      span.style.left = (8 + Math.random() * 78) + "%";
      span.style.top = (10 + Math.random() * 72) + "%";
      if (hot.indexOf(skill) !== -1) span.classList.add("hot");
      cloud.appendChild(span);
      // drift animation via GSAP
      if (gsap && !reduced) {
        gsap.to(span, {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 40,
          duration: 4 + Math.random() * 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    });
  }

  function init() {
    runPreloader();
    initNoise();
    initCursor();
    initNav();
    initProgress();
    initReveals();
    initCards();
    initMarquee();
    initHeroParallax();
    initAvatarScroll();
    initMagnetic();
    initAnchors();
    initContactReveal();
    initSkillsCloud();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
