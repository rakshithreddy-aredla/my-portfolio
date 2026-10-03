# rakshithreddy-aredla.github.io/my-portfolio

Personal portfolio and résumé for **Rakshith Reddy Aredla** — Full-Stack Developer,
AI/ML Engineer, RAG researcher.

- Live site: <https://rakshithreddy-aredla.github.io/my-portfolio/>
- Résumé (HTML): <https://rakshithreddy-aredla.github.io/my-portfolio/resume.html>
- Résumé (PDF): [`Rakshith-Reddy-Aredla-Resume.pdf`](./Rakshith-Reddy-Aredla-Resume.pdf)
- GitHub: <https://github.com/rakshithreddy-aredla>
- Email: rakshithreddyaredla@gmail.com · LinkedIn: <https://www.linkedin.com/in/aredla-rakshith>

## What is in this repository

This branch is the **published build output** that GitHub Pages serves directly
(`build_type: legacy`, source `main` at `/`). It is a React + TypeScript + Vite app
with two entry points in one bundle:

| Path | What it is |
| --- | --- |
| `index.html` | The portfolio page |
| `resume.html` | The printable résumé |
| `Rakshith-Reddy-Aredla-Resume.pdf` | Headless-printed export of the résumé |
| `assets/` | Hashed JS/CSS bundles |
| `.nojekyll` | Stops GitHub Pages running Jekyll, so underscore paths survive |

## Single source of truth

The portfolio and the résumé are **two entry points of the same app**, and both
render from one data file: **`src/data/profile.ts`**.

Projects, skills, stats, education, hackathon results, contact details and résumé
content all live in that file. Editing it updates the site and the résumé together —
there is no second copy of the content to keep in sync. Achievements are phrased
separately for each surface on purpose, so if you change a fact in one list, change
it in the other.

To change content, edit `src/data/profile.ts` in the source project, then rebuild —
do not hand-edit the files in this repository, they are overwritten on every deploy.

## Rebuilding and redeploying

```bash
# root build (local preview)
npm run lint && npm run build

# GitHub Pages sub-path build
BASE_PATH=/my-portfolio/ SITE_URL=https://rakshithreddy-aredla.github.io npm run build
```

Then copy the contents of `dist/` over the root of `main` and push. The résumé PDF
is regenerated from `resume.html` over HTTP (never over `file://` — the app emits
root-absolute asset URLs, so a `file://` print produces a blank page):

```bash
npx vite preview --port 4317 --strictPort
# then headless-print http://localhost:4317/resume.html
```

## PENDING — Certifications

The owner has completed an AI/ML course but has not supplied the course name or the
issuing platform, so `certifications` in `src/data/profile.ts` is an empty array and
the résumé omits the section rather than printing a placeholder. Adding one
`{ name, issuer, year? }` object makes the section reappear automatically.

## License

See [`LICENSE`](./LICENSE).