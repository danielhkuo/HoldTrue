# The teaser site

A one-page teaser for HoldTrue. It lives at https://danielhkuo.github.io/HoldTrue/.

Vite, React, TypeScript and Tailwind, laid out the shadcn way: shared pieces go in
`src/components/ui`, page sections in `src/components/site`, and `@/` points at `src/`.
The hero field is `src/components/ui/particle-drift.tsx`, an isolated iframe that draws the
ASCII particle canvas.

```
npm install
npm run dev       # http://localhost:5173/HoldTrue/
npm run build
npm run deploy    # builds, then pushes dist/ to the gh-pages branch
```

The workflow in `.github/workflows/site.yml` runs the same deploy on every push to `main`
that touches `site/`. GitHub Pages serves the `gh-pages` branch.
