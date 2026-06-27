# Nakshatra Darshan — File Structure

This app is split into small, focused files so future edits only need to touch (and load) the relevant piece — not a single giant file.

```
.nojekyll                       Tells GitHub Pages to skip Jekyll processing
                                 (this is a plain static site, not a Jekyll site —
                                 see "Deploying on GitHub Pages" below).
index.html                      Markup only. No inline CSS/JS.
css/
  styles.css                    All styles.
js/
  ephemeris.js                  Sign/planet constants, dignity & relation logic,
                                 planet/sign icon path definitions, nakshatra &
                                 dasha reference data, core date/math helpers.
  vsop-data.js                  Pure VSOP87D planetary series data (huge, numeric,
                                 essentially never edited — kept isolated on purpose).
  ephemeris-cont.js             Ascendant calc, sidereal conversion, allPlanets()
                                 driver, Jaimini Karaka reference data.
  yogas-doshas-panchang.js      Karaka ranking, full Yoga/Dosha detection engine,
                                 Panchang calculation (Tithi/Nitya Yoga/Karana/Vara),
                                 Nakshatra Koota (Gana/Yoni/Nadi/Varna/Tatva),
                                 personality snapshot generator.
  shadbala-dashas.js            Avastha states (Baladi/Jagradadi/Deeptadi), full
                                 Shadbala six-fold strength engine, Bhava Bala,
                                 Navamsa (D9) calc, Ishta/Kashta Phala, Vimshottari
                                 Dasha → Antardasha → Pratyantardasha → Sookshma
                                 recursive period calculator.
  timezone-lookup.js            No-API-key UTC offset lookup from a city's country
                                 code + coordinates, used to auto-fill the timezone
                                 dropdown when a city is selected.
  app-state.js                  Global chart state, Individual/Couple mode
                                 selection, city autocomplete (Nominatim),
                                 calculateChart() / calculateCoupleCharts(),
                                 downloadable Markdown report generator.
  render-chart.js                Rashi Chakra (D1) & Navamsa (D9) SVG wheel drawing,
                                 house segment detail popups.
  render-tabs.js                 Panchang/Koota cards, planet positions table, Dasha
                                 list rendering, Karakas, Yogas & Doshas, Shadbala,
                                 Bhava Bala, Ishta/Kashta, Avastha, AI reading,
                                 showTab() router.
```

## Deploying on GitHub Pages

1. Upload the **contents** of this folder to your repo — `index.html`, `css/`, `js/`,
   and the hidden `.nojekyll` file — so `index.html` sits at the root of whatever
   branch/folder GitHub Pages is set to publish (most commonly the `main` branch,
   root folder). Don't nest everything inside an extra subfolder.
2. In your repo, go to **Settings → Pages** and confirm "Source" points at that
   same branch and folder.
3. Visit the actual published URL — `https://<your-username>.github.io/<repo-name>/`
   — not the repo's `github.com/.../blob/main/index.html` file-viewer page. The
   latter shows raw source code by design; it is not the live site.

**If the page loads as unstyled/raw text:** this is almost always GitHub Pages
running the site through Jekyll (its default static-site generator) and either
mishandling the file structure or stripping/altering files it doesn't expect.
The `.nojekyll` file at the repo root tells GitHub Pages to skip Jekyll entirely
and serve every file exactly as-is, which is what a plain HTML/CSS/JS site like
this one needs. Make sure `.nojekyll` actually made it into your repo — GitHub's
upload UI and some Git clients hide dotfiles by default, so it's easy to miss.
You can verify it's there by browsing your repo on github.com and ensuring you
see `.nojekyll` listed alongside `index.html`.

If it still doesn't render correctly after confirming `.nojekyll` is present and
the Pages source setting is correct, check the browser's developer console
(F12 → Console/Network tab) on the published URL — a 404 on `css/styles.css` or
any `js/*.js` file there will point at a path/casing mismatch (GitHub Pages is
case-sensitive, unlike some local setups).

## Load order matters

`<script>` tags in `index.html` load in this exact order:
`ephemeris.js` → `vsop-data.js` → `ephemeris-cont.js` → `yogas-doshas-panchang.js` → `shadbala-dashas.js` → `timezone-lookup.js` → `app-state.js` → `render-chart.js` → `render-tabs.js`

These are plain global-scope scripts (not ES modules), so every file shares one global scope — same as before the split, just organized. If you add a new file, add its `<script src="js/...">` tag in `index.html` in the right dependency position (data/constants before the code that uses them).

## Editing guidance for future sessions

- **Tweaking a planet icon or sign color** → `js/ephemeris.js` only.
- **Adding/adjusting a Yoga or Dosha rule** → `js/yogas-doshas-panchang.js` only.
- **Panchang (Tithi/Yoga/Karana/Vara) or Nakshatra Koota changes** → `js/yogas-doshas-panchang.js` only.
- **Shadbala/Avastha/Dasha math changes** → `js/shadbala-dashas.js` only.
- **Timezone auto-detection rules** → `js/timezone-lookup.js` only.
- **Couple mode, form handling, city search, report download** → `js/app-state.js` only.
- **Chart wheel drawing/visuals** → `js/render-chart.js` only.
- **Tab content/markup generation** → `js/render-tabs.js` only.
- **Page layout, new sections, new tab buttons** → `index.html` only.
- **Colors, spacing, responsive rules** → `css/styles.css` only.
- You should almost never need to open `js/vsop-data.js` — it's pure planetary
  ephemeris data, not application logic.

This file mapping was generated by mechanically splitting the original single-file
`index.html` along its natural section boundaries — the JS logic is byte-for-byte
identical to before, just reorganized into files.

