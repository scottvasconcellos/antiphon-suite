# Design system assets

Place shared brand assets here so all apps can reference them consistently.

## Logo

- **File:** `logo.png` — Antiphon mark (transparent background, dark charcoal mark for use on dark UIs).
- **Usage:** Header top-left across Hub, marketing pages, and app shells. See `docs/DESIGN_PRINCIPLES.md` (Logo placement).
- **In code:** Reference from this folder (e.g. copy into app `public/` as `/logo.png`, or use the path your bundler exposes for design-system assets).
- **Fallback:** If no logo file is present, UIs may show the gradient dot + “ANTIPHON” wordmark as in the mock.

Other shared images (e.g. favicons, OG images) can also live here.
