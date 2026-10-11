# PORTFOLIO SPEC — Complete Handoff Document
## Rakshith Reddy Aredla — everything needed to build the portfolio from scratch

---

## 1. IDENTITY

| Field | Value |
|---|---|
| Name | Rakshith Reddy Aredla |
| Role | Full-Stack + AI Developer |
| Location | Hyderabad, India |
| Email | rakshithreddy.aredla@gmail.com |
| GitHub | https://github.com/rakshithreddy-aredla |
| LinkedIn | https://www.linkedin.com/in/aredla-rakshith/ |
| Live site | https://rakshithreddy-aredla.github.io/my-portfolio/ |
| Repo | https://github.com/rakshithreddy-aredla/my-portfolio |

**Stats:** 18 public repos · 99% CNN accuracy (MNIST) · 6 flagship builds · 3 live deployments · HackWithHyderabad 3.0 participant

**Summary bio (verbatim from resume):**
"Full-stack + AI developer in Hyderabad. Mostly TypeScript and Python — Next.js and Supabase on the front, FastAPI when there's a model involved. I build small tools that are small enough to finish and real enough to use, shipping everything end-to-end. Currently exploring retrieval and the parts of agent memory that turn out to be harder than they sound."

---

## 2. PAGE STRUCTURE

1. Preloader — name + progress bar, fades out
2. Nav (fixed glass) — logo "Rakshith." · About, Work, Skills, Journey, Contact, Resume ↗ · "Ctrl K" keycap
3. Hero (#home) — eyebrow, giant name, tagline, CTAs, badges, portrait backdrop panel, scroll hint
4. Marquee — infinite ticker: Full-Stack ✦ AI Engineering ✦ On-Device ML ✦ Agent Memory ✦ RAG Systems ✦ Shipping > Talking
5. About (#about) — bio + circular photo + 3 stat cards
6. Work (#projects) — 6 featured alternating cards + 9 compact cards
7. Skills (#skills) — pill cloud, 18 skills
8. Journey (#journey) — 5-step timeline
9. Contact (#contact) — "Let's build something." + Email / Copy email / LinkedIn / GitHub / Resume
10. Footer — © year + "Built by hand — no templates."
11. Global extras — command palette (Ctrl/⌘+K), custom cursor, scroll progress bar, Mini-Me 3D side rail

### About body copy (exact)
- P1: "I'm Rakshith — a developer from Hyderabad who learns by building. Not toy apps: real products with live users, real payments, real models running on-device."
- P2: "My work spans the stack — Next.js storefronts with realtime stock, PyTorch CNNs at ~99% accuracy, hand-written Naive Bayes classifiers with zero dependencies, and LLM systems with agent memory and retrieval grounding."
- P3: "I care about the boring parts: state that can't corrupt, latency that doesn't spike, pipelines you can trace when they fail. That's what turns demos into products."

---

## 3. FEATURED PROJECTS (6)

**01 — Arkaira**
Online flower shop with realtime stock, Razorpay checkout and an admin dashboard — stock decrements the moment someone pays. A production-grade full-stack build with a live deployment.
Tags: Next.js, Supabase, Razorpay, TypeScript · github.com/rakshithreddy-aredla/Arkaira · demo: https://arkaira.vercel.app

**02 — Netra**
Real-time AI driver drowsiness & distraction detection running on-device — React Native + ML Kit. Alert-level safety monitoring that works without a server.
Tags: React Native, ML Kit, On-device AI, TypeScript · /Netra

**03 — RecallDesk**
A support copilot that remembers. When a customer comes back saying "it's broken again", the agent already knows which ticket it was and what fixed it last time.
Tags: LLM, Retrieval, Agent Memory · /recalldesk

**04 — Anchor**
Memory-powered health navigator for family caregivers — meds, labs and doctor's instructions in one place, so you're not reconstructing three months of history mid-visit.
Tags: FastAPI, Streamlit, LLM, Memory · /anchor-caregiver-memory

**05 — CascadeGuard**
RAG pipeline monitoring — an implementation of a published paper. Observability for retrieval pipelines: trace every stage, catch silent failures before users do.
Tags: RAG, Observability, Paper implementation, Python · /rag-pipeline-monitor

**06 — GitGlance**
CLI that scores any GitHub profile the way a selection committee would, and tells you what to fix — transparency over vibes, zero dependencies.
Tags: Python, CLI, GitHub API · /GitGlance

---

## 4. MORE BUILDS (9)

| Project | Description | Tags | Repo slug |
|---|---|---|---|
| EnvGuard | Fail-fast, zero-dependency env var validation for Node — schema in, typed config out. | TypeScript, Node.js | EnvGuard |
| SpamScope | Naive Bayes spam classifier written by hand — no sklearn, no numpy. Laplace smoothing, log-space inference, full metrics. | Python, ML | SpamScope |
| SMS Spam Classifier | TF-IDF + Naive Bayes on the UCI dataset — ~97% accuracy. | Python, TF-IDF, Naive Bayes | spam-classifier |
| Digit CNN | CNN on MNIST, full PyTorch pipeline — ~99% test accuracy. | Python, PyTorch, CV | handwritten-digit-cnn |
| Netra Prototype | Earlier prototype — drowsiness, yawn and distraction detection. | React Native, ML Kit | netra-driver-guardian |
| RAG Chatbot | RAG chatbot — answers from your own documents with citations, live browser UI. | Python, Flask, RAG, LLM | ai-chatbot-rag |
| House Price Predictor | Random Forest + feature engineering — R-squared ~0.80. | Python, ML | house-price-predictor |
| Movie Recommender | Recommendation engine experiment. | Python, ML | movie-recommender |
| Iris Classifier | Classic iris classification, clean and readable. | Python, ML | iris-classifier |

---

## 5. SKILLS (18)
TypeScript, JavaScript, Python, Next.js, Node.js, FastAPI, Flask, PyTorch, React Native, ML Kit, Supabase, Postgres, Razorpay API, Streamlit, Tailwind CSS, Git, GitHub Actions, Vercel

---

## 6. TIMELINE (5)

1. **The beginning** — First website & first Python — "My first HTML/CSS about-me page and the classic number guessing game. Where it all started."
2. **AI / ML deep dive** — "Worked through ML end-to-end: CNN on MNIST (~99%), RAG chatbot, house-price regression, iris classification, movie recommender."
3. **2026 — Shipping full-stack products** — "Arkaira (live e-commerce with realtime stock + Razorpay), EnvGuard (typed env validation), GitGlance (GitHub profile scorer)."
4. **2026 — HackWithHyderabad 3.0** — "Built and shipped under hackathon pressure."
5. **2026 — Agent memory & RAG** — "RecallDesk (support copilot that remembers), Anchor (caregiver memory), CascadeGuard (RAG pipeline monitoring, published-paper implementation)."

---

## 7. CONTACT
- Email: rakshithreddy.aredla@gmail.com
- LinkedIn: https://www.linkedin.com/in/aredla-rakshith/
- GitHub: https://github.com/rakshithreddy-aredla

---

## 8. DESIGN SYSTEM ("cyan tech" theme)

### Colors (CSS custom properties)
```
--bg: #060B12;          deep navy base
--bg-2: #0A1420;
--surface: #0E1A26;
--surface-2: #122031;
--ink: #EAF2F8;         primary text
--ink-soft: #A9BDCB;
--muted: #6B7F8F;
--line: rgba(234, 242, 248, 0.09);
--line-strong: rgba(234, 242, 248, 0.16);
--accent: #22D3EE;      electric cyan
--accent-2: #0891B2;
--ember: #67E8F9;       light cyan highlight
--gold: #38BDF8;        sky-blue secondary
--glow: rgba(34, 211, 238, 0.3);
```

### Typography
- Display: Fraunces (serif, 400/500/600, italic accents) — hero name clamp(3.4rem, 10.5vw, 9rem), line-height 0.9
- Body: Instrument Sans / Space Grotesk
- Mono (eyebrows, tags, meta): Space Mono / JetBrains Mono
- Section titles clamp(2.8rem, 6.5vw, 4.6rem); section padding 170px

### Motion tokens
- Ease: cubic-bezier(0.22, 1, 0.36, 1)
- Reveals: y 28px, autoAlpha 0 to 1, 0.7s power3.out, data-delay stagger
- Philosophy (motion.dev / lab.xevrion.dev): springs over durations, interruptible, 30-80ms stagger, restraint

### Layout
- Container max-width 1200px
- Hero: 100svh cinematic — portrait backdrop panel right (min(42vw,540px) x min(86vh,820px), radius 26px, bottom mask fade), giant overlapping name
- Mini-Me rail: fixed right, 128px wide, hidden below 1100px

---

## 9. ASSETS

| File | What it is | Origin |
|---|---|---|
| assets/me.jpg | Hero portrait (960x1280) | C:\Users\raksh\Downloads\Images\WhatsApp Image 2026-10-10 at 4.41.25 PM.jpeg |
| assets/me-2.jpg | About photo (960x1280) | C:\Users\raksh\Downloads\Images\WhatsApp Image 2026-10-10 at 4.41.27 PM (2).jpeg |
| assets/avatar.glb | Blender-built full-body 3D character (3.9MB). Node names: head, armL, armR, pupilL, pupilR. Head receives assets/me.jpg as runtime texture | Blender 4.2 |
| favicon.svg, share.png | Favicon + OG image | repo root |
| resume.html | Standalone resume page | repo root |

---

## 10. FEATURES / INTERACTIONS

1. Preloader — name + progress bar, hands over via body.preloader--done
2. Custom cursor — dot + lerped ring, expands on [data-cursor="hover"]
3. Lenis smooth scroll (1.1.18) wired into GSAP ticker + ScrollTrigger
4. Scroll reveals — GSAP ScrollTrigger, y:28 autoAlpha 0-1, 0.7s power3.out (IO fallback)
5. Text scramble — nav links on hover; section titles decode in view
6. Spotlight cards — cursor-following radial glow (--mx/--my) on project/more/stat cards
7. Count-up stats — 0 to target with cubic ease-out on reveal
8. Command palette — Ctrl/Cmd+K or "/": navigate, copy email, external links; filter + arrows + Enter + Esc
9. Confetti burst — 90 canvas particles on the Email button
10. Copy email button — clipboard + "Copied" morph + toast
11. Marquee — pure-CSS infinite ticker, pauses on hover
12. Magnetic buttons — [data-magnetic] drift + snap back
13. Hero portrait — 3D tilt toward cursor + glare + cyan spark particles + scroll parallax
14. MINI-ME (signature) — fixed right rail, desktop >=1100px only: Three.js renders avatar.glb standing on glowing discs; bounces with scroll velocity, waves on section change, head+pupils track cursor, speech bubble per section ("Hey! I'm mini Rakshith" / "That's me for real" / "My work →" / "My stack!" / "The journey" / "Say hi!"). Procedural chibi fallback. Mobile downloads zero 3D.
15. Reduced motion — everything static/instant, no loops.

### Tech stack
- No build tools. Plain ES5-style JS, IIFEs, globals: THREE, gsap, Lenis, PORTFOLIO, ANIMATIONS, PORTRAIT, MINI_ME, SPELLS
- CDN pinned + SRI: three r147 UMD + GLTFLoader (dynamic, desktop only), gsap 3.12.5 + ScrollTrigger, lenis 1.1.18
- Files: index.html, styles.css, resume.html, js/data.js, js/animations.js, js/portrait.js, js/mini-me.js, js/spells.js

---

## 11. DEPLOYMENT
- GitHub Pages from repo root (main branch), no build step. Push to main = live in ~1-2 min at https://rakshithreddy-aredla.github.io/my-portfolio/
- vercel.json exists (framework: vite) but current hosting is GitHub Pages
