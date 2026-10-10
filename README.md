# Rakshith Reddy Aredla — Portfolio

A premium **dark** portfolio with a custom interactive 3D avatar and a matching resume page.

> **Live:** https://rakshithreddy-aredla.github.io/my-portfolio/

## ✨ Highlights

- **3D model designed in Blender** (`blender/build_avatar.py` → `assets/avatar.glb`) — a stylized character with your face photo as the head texture, loaded via Three.js GLTFLoader.
- **Interactive 3D avatar** — waves and moves as you scroll, eyes track your cursor, blinks, whole body leans toward the cursor, click to make it wave.
- **Your face front and center** — a large interactive hero portrait (tilt, glare, sparkles, scroll parallax) plus the About-section photo.
- **Premium dark design** — editorial serif (Fraunces) + clean sans + mono accents, near-black warm palette with an electric-violet accent, glass surfaces, glowing atmosphere and film-grain noise.
- **Advanced motion** — GSAP + ScrollTrigger: preloader, scroll progress bar, custom cursor, reveals, parallax, marquee, magnetic buttons, animated skills cloud, timeline reveal.
- **Resume page** — matching dark `resume.html` with a downloadable PDF.
- **Real content** — projects, skills, stats and journey pulled straight from GitHub.

## 🛠️ Stack

- Plain HTML / CSS / JS — zero build step, runs on GitHub Pages
- [Blender](https://www.blender.org) (headless) for 3D model design + glTF export
- [Three.js](https://threejs.org) + GLTFLoader for the 3D avatar
- [GSAP](https://greensock.com/gsap) + ScrollTrigger for animation
- Google Fonts: Fraunces + Instrument Sans + Space Mono

## 📁 Structure

```
index.html        main portfolio page
resume.html       dark resume page
styles.css        design system + layout
js/data.js        real project/skill/stat/journey content + DOM rendering
js/avatar.js      Three.js 3D avatar (GLB + procedural fallback, scroll + eye-tracking)
js/portrait.js    interactive hero portrait (tilt, glare, sparks, parallax)
js/animations.js  GSAP motion layer
blender/          Blender headless build script (design source)
assets/avatar.glb exported 3D model
```

## 🚀 Run locally

Open `index.html` directly in a browser, or:

```bash
npx serve .
```

## 📫 Contact

- [GitHub @rakshithreddy-aredla](https://github.com/rakshithreddy-aredla)
- [LinkedIn](https://www.linkedin.com/in/aredla-rakshith/)

Built with real code, honest commits.
