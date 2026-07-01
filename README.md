# Nakshatra Darshan — File Structure

This app is split into small, focused files so future edits only need to touch (and load) the relevant piece — not a single giant file.

```
.nojekyll                       Tells GitHub Pages to skip Jekyll processing
                                 (this is a plain static site, not a Jekyll site).
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
  divisional-charts.js          Calculates all 16 Shodasavarga divisional charts
                                 (D2 Hora through D60 Shashtiamsa) from verified
                                 classical sign-assignment rules, used by the
                                 Vargas tab.
  timezone-lookup.js            No-API-key UTC offset lookup from a city's country
                                 code + coordinates, used to auto-fill the timezone
                                 dropdown when a city is selected.
  app-state.js                  Global chart state, Individual/Couple mode
                                 selection, city autocomplete (Nominatim),
                                 calculateChart() / calculateCoupleCharts(),
                                 downloadable Markdown report generator.
  render-chart.js               Rashi Chakra (D1) & Navamsa (D9) SVG wheel drawing,
                                 house segment detail popups.
  render-tabs.js                Panchang/Koota cards, planet positions table, Dasha
                                 list rendering, Karakas, Yog & Dosh, Shadbala,
                                 Bhava Bala, Ishta/Kashta, Avastha, AI reading,
                                 showTab() router.
```

## Deploying on GitHub Pages

1. Upload `index.html`, the `css/` folder, the `js/` folder, and the hidden
   `.nojekyll` file to your repo root.
   - **If using GitHub's web "Upload files" button:** drag the `css` and `js`
     *folders themselves* onto the upload area (not just the files inside them).
     Most browsers preserve folder structure this way. After uploading, click
     into your repo on github.com and confirm you see `css` and `js` listed as
     actual folders (with a folder icon), not loose files at root — if they
     flattened, delete them and re-upload, or use one of the methods below.
   - **Most reliable: git command line.** Clone your repo, place the files in
     matching `css/`/`js/` folders locally, then `git add . && git commit -m "..." && git push`.
   - **No git needed:** use github.com's "Create new file" button and type the
     full path including the folder in the filename box (e.g. `css/styles.css`,
     `js/ephemeris.js`) — typing the slash creates the folder automatically and
     never flattens anything.
2. In your repo, go to **Settings → Pages** and confirm "Source" points at the
   branch/folder where you uploaded these files (commonly `main`, root).
3. Visit the actual published URL — `https://<your-username>.github.io/<repo-name>/`
   — not the repo's `github.com/.../blob/main/index.html` file-viewer page.

**If the page ever loads unstyled** (no dark theme, both forms visible at once,
nothing hidden/shown): open DevTools (F12) → Network tab, reload, and look for
red/failed requests. A 404 on `css/styles.css` or any `js/*.js` file means the
path `index.html` expects doesn't match where the file actually landed in your
repo — usually because a folder got flattened on upload. Re-check the folder
structure on github.com matches the layout above exactly.

## Load order matters

`<script>` tags in `index.html` load in this exact order:
`ephemeris.js` → `vsop-data.js` → `ephemeris-cont.js` → `yogas-doshas-panchang.js` → `shadbala-dashas.js` → `divisional-charts.js` → `timezone-lookup.js` → `app-state.js` → `render-chart.js` → `render-tabs.js`

These are plain global-scope scripts (not ES modules), so every file shares one global scope. If you add a new file, add its `<script src="js/...">` tag in `index.html` in the right dependency position (data/constants before the code that uses them).

## Editing guidance for future sessions

- **Tweaking a planet icon or sign color** → `js/ephemeris.js` only.
- **Adding/adjusting a Yoga or Dosha rule** → `js/yogas-doshas-panchang.js` only.
- **Panchang (Tithi/Yoga/Karana/Vara) or Nakshatra Koota changes** → `js/yogas-doshas-panchang.js` only.
- **Shadbala/Avastha/Dasha math changes** → `js/shadbala-dashas.js` only.
- **Divisional (Varga) chart rules or the Vargas tab** → `js/divisional-charts.js` for calculation, `js/render-tabs.js` for rendering.
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



