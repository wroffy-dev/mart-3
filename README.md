# MART Global — Premium Frontend Prototype

A presentation-ready design prototype for **MART Global Management Solutions LLP**, built with plain HTML5, CSS3 and vanilla JavaScript. It has no frameworks, build step or backend.

## Viewing the prototype

Open `index.html` directly in a browser, or serve the folder to get the closest match to a live site:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

Both methods work. When served over http(s), font preloads are added for slightly faster first paint.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Cinematic hero, the **"What are you looking for?"** selector, and two tailored homepage experiences (Corporate / Social) revealed on the same page |
| `research-strategy.html` | Corporate Solutions → Research & Strategy |
| `large-scale-program-implementation.html` | Social Solutions → Large-Scale Program Implementation |

```
assets/
  css/style.css        Design system + all component styles (tokens, type, motion, responsive, reduced motion)
  js/script.js         Shared: header, mega menus, mobile menu, reveals, accordions, parallax, scroll-linked tracks, toasts
  js/home.js           Homepage: experience switcher, service hover previews, focus chips, social capability panels
  js/service.js        Service pages: six principles, research framework, ecosystem diagram, model counter
  fonts/               Self-hosted variable fonts (Newsreader, Inter) — Google Fonts, SIL Open Font License
  icons/               SVG line icons (individual files + sprite.svg), favicon, logo mark
  images/              Colour-graded WebP/AVIF photography + footer world map (see CREDITS.md)
```

## Homepage experience model

- The first view shows only the hero, the selector, a short About band and the footer.
- Choosing **Corporate** or **Social** reveals that experience on the same page, with no reload and no URL change. The chosen panel is emphasised, the other recedes, a connector line draws down, and the content staggers in.
- Switching between experiences fades the current one out (height-locked so the page doesn't jump) before the new one reveals.
- The choice is kept for the session in `sessionStorage` under `martExperience`.
- Deep links used by the navigation: `index.html#corporate`, `#social`, `#focus` and `#projects`.
- Cross-discovery: each experience ends with **We Also Provide**, which shows capabilities from the other side without category badges.

## Design system (summary)

- **Colour:** navy `#063563` / deep navy `#032746`, accent yellow `#FFE21C`, text `#102033`, muted `#5D6A79`, surfaces white / `#F7F9FB` / `#EDF2F7`.
- **Type:** *Newsreader* (editorial serif) for headlines, with italics for emphasis; *Inter* for UI and body. The fluid type scale is defined in `:root`.
- **Radius:** 6 / 12 / 18 px. Shadows are deliberately minimal; borders and contrast come first.
- **Motion classes:** `.reveal`, `.reveal-up`, `.reveal-left`, `.reveal-right`, `.reveal-mask` (with `data-dir`), `.reveal-lines` (line-masked headings) and `.stagger-group`.
- **Reduced motion:** `prefers-reduced-motion: reduce` disables parallax, masks, staggers and scroll animation. All content stays visible.

## Prototype notes for the MART team

- **Pages for the next phase:** links to pages not in this prototype (other services, Knowledge Center, legal pages, case studies) show a short "next design phase" message instead of navigating to a dead page. They are marked with `data-soon` in the HTML.
- **Contact details** are taken from MART's public listings: Noida corporate office, Bhubaneswar regional office, Dhaka overseas office, +91-120-4215323, info@martrural.com. Please confirm them before launch.
- **Social links:** only Facebook (`facebook.com/martrural`) is linked. LinkedIn, X and YouTube URLs need to be supplied.
- **Project Experience** on the homepage uses representative engagement descriptions with client names withheld. Replace them with approved case studies.
- **Logo:** the header uses a crafted SVG wordmark as a stand-in. Swap in the official MART Global logo files.

## Photography

The live site martglobal.net and the usual stock libraries (Unsplash, Pexels) were not reachable from the build environment. The prototype therefore uses documentary photographs from the **Open Images Dataset** (originally on Flickr, licensed **CC BY 2.0**). Every photo is credited in the footer ("Photography credits") and in `assets/images/CREDITS.md`.

All images have been cropped, resized and colour-graded to one consistent look: controlled saturation, cool shadows and warm highlights, finished with navy overlays in CSS. They are placeholders for MART's own field photography. To replace one, keep its filename, a similar aspect ratio and these sizes:

- Large / full-bleed images: `name.webp` + `name.avif` at 1920 px wide, plus `name-sm.webp` + `name-sm.avif` at 960 px.
- CTA backgrounds: 1600 px wide.
- All other images: about 1024 px on the long edge, WebP.

## Quality checks performed

- Responsive at 1920, 1600, 1440, 1366, 1280, 1024, 768, 480, 430, 390 and 375 px. No horizontal overflow on any page or experience state.
- No console errors when served over http or opened via `file://`.
- All internal links, anchors, ARIA references and assets resolve. HTML passes `html-validate` (recommended ruleset); JavaScript passes ESLint.
- Keyboard: skip link, focus-visible rings, mega menus (Enter, ↓ and Esc), modal mobile menu with focus trap and scroll lock, and arrow-key navigation in the accordions and principle list.
- Functional tests cover experience switching and persistence, deep links, hover previews, accordions, timelines, principles (desktop panel and mobile accordion) and reduced motion.
