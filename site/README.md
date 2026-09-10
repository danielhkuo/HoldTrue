# The teaser site

A one-page teaser for HoldTrue. It is its own Netlify site, apart from the app and the repo owner's
GitHub Pages.

Vite, React, TypeScript and Tailwind, laid out the shadcn way: shared pieces go in
`src/components/ui`, page sections in `src/components/site`, and `@/` points at `src/`.
The hero field is `src/components/ui/particle-drift.tsx`, an isolated iframe that draws the
ASCII particle canvas.

```
npm install
npm run dev       # http://localhost:5173/
npm run build
npm run deploy    # builds, then pushes dist/ to the linked Netlify site
```

`netlify.toml` holds the build settings. The Netlify CLI must be logged in and the folder
linked (`netlify link`) before `npm run deploy` works.
