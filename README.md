# Adapter Designer — prototype

A working prototype of a customer-facing wheel adapter configurator: pick a vehicle,
enter eight measurements, watch a to-scale drawing build itself, get a price or a
quote, and submit into an eight-stage order pipeline.

**Single HTML file. No build step, no server, no dependencies** beyond Google Fonts.
Open `index.html` in a browser and it runs.

---

## Deploying

### GitHub Pages
1. Push this folder to a repository.
2. **Settings → Pages → Source:** Deploy from a branch → `main` → `/ (root)`.
3. Live at `https://<user>.github.io/<repo>/` in a minute or two.

No Jekyll config is needed — `.nojekyll` is included so the file is served verbatim.

### Anywhere else
Netlify, Vercel and Cloudflare Pages all work by dragging the folder in. So does any
web host, an S3 bucket, or a USB stick. It is one static file.

---

## Before you make the repo public

Right now every number in here is a **placeholder** I calibrated to match one
published catalogue price. That is safe to publish.

It stops being safe the moment the real values go in. The rule set and the pricing
formula are the parts of this that are actually worth something, and a public repo
publishes both — including to competitors.

If you put real numbers in, use a **private repo**. GitHub Pages from a private repo
needs a paid plan; Cloudflare Pages and Netlify both do it on their free tiers.

---

## What is real and what is stubbed

| Works for real | Stubbed for the demo |
| --- | --- |
| Parametric drawing computed from the inputs | Submissions are seeded in memory |
| Rule engine, 9 rules, editable live | Nothing persists across a reload |
| Pricing formula with a catalogue check | No Shopify account or checkout |
| Required-field gating and error states | No auth on the Admin tab |
| 12-hour edit window with live countdown | No email or SMS |
| Version stamping and change log | No DXF or toolpath export |
| Spotlight tour and help documentation | Fitment table is 25 unverified rows |

---

## Everything that needs shop sign-off

Marked in the source with the version it belongs to.

- **`VEHICLES`** — fitment table v0.1, 25 rows, **not verified**. In production this
  should be generated from the order history rather than typed by hand.
- **`RULES`** — rule set v1.0. Nine rules with thresholds. Needs a machinist to confirm
  every threshold and severity.
- **`PRICING`** — calibrated so 6x5.5 → 5x4.5 at 2.00" lands on $129.95. The real
  formula replaces it.
- **`LEGAL`** — disclaimer wording supplied by the shop. **Attorney review required.**
- The eight inputs themselves are my best guess. Confirm the real eight.

---

## Structure

One file, but organised so it ports cleanly to React:

```
index.html
├── <style>       brand tokens first — 4 values drive the whole palette
└── <script>
    ├── PATTERNS, THREADS, VEHICLES     reference data
    ├── RULES, KINDS, evalRule()        rule engine  → useValidation()
    ├── PRICING, priceOf()              pricing      → usePricing()
    ├── faceSvg()                       drawing      → <FaceDrawing/>
    ├── SUBMISSIONS, editLeft()         order list   → <MyDesigns/>
    ├── TOUR, showTour(), placeTour()   spotlight tour
    └── render()                        views        → route components
```

`evalRule`, `priceOf` and `faceSvg` are pure functions that touch no DOM, so they port
to React unchanged. That is where the real logic lives.

---

## Porting to React

The intended production stack is React on ASP.NET Core with PostgreSQL. When you get
there:

- Keep the URL paths and the parameter shape — a design is eight numbers, and the
  drawing is derived from them, never stored as a stale image.
- Rules belong in a table with immutable versions, so you can prove which version
  approved a given order.
- The Admin section needs real auth. It changes what every customer can buy.

## Known limits of the prototype

- State is in memory. Reloading resets everything.
- The Admin tab has no access control. It is a demo of a screen, not a secure one.
- Two-person review of rule changes is described in the help text but not enforced.
- 3D is not built. The 2D drawing is the fallback that low-end phones should keep.
