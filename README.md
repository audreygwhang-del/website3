# Physics Lab Notebook

A small static site for posting physics lab write-ups, data, and charts.
No build step — just HTML/CSS/JS files, so it deploys straight to GitHub Pages for free.

## Files

```
index.html              home page — lab index + interactive pendulum demo
lab-01-pendulum.html    a fully worked example lab (table + chart + predictor + download)
style.css               shared styling
script.js               pendulum demo, chart rendering, predictor logic
data/pendulum_data.csv  sample data file, linked as a download from lab-01
images/                 toast, avocado, and egg artwork used by the toast game
```

## The lab page is a game

Each lab page has five click-to-open sections — Purpose, Procedure, Data/Results,
Error Analysis, Conclusion. Opening a section for the first time adds a
layer to the avocado toast graphic on the right (toast → avocado → egg →
chili flakes → microgreens) and fires a little popup notification. All the
game logic lives in `initToastGame()` in `script.js` — it reads each button's
`data-layer` and `data-note` attributes, so you don't need to touch the JS to
reuse it. The toast/avocado/egg artwork lives in `images/`; the chili and
microgreen flourishes are small inline SVGs in each lab page.

## Adding a new lab

1. Duplicate `lab-01-pendulum.html`, rename it (e.g. `lab-02-projectile.html`).
2. Edit the title, and the text inside each of the five accordion panels
   (Purpose / Procedure / Data-Results / Error Analysis / Conclusion).
3. Update the data table rows and the `lengths` / `periods` arrays (or swap
   the chart entirely if the new lab isn't length-vs-period).
4. Drop any data files in `data/` and link them in the Downloads block —
   `<a href="data/yourfile.csv" download>yourfile.csv</a>` works for CSV, PDF,
   XLSX, anything.
5. Add a new `<li>` to the `lab-log` list in `index.html` linking to the new page.

The toast graphic markup, the accordion CSS, and `initToastGame()` are all
shared — you never need to duplicate that part, just keep the same button
structure (`data-layer` + `data-note` attributes) in the new file.

## Deploying to Vercel (free)

1. Push these files to a GitHub repo (create one at github.com if needed,
   then upload the files — drag-and-drop on the repo page works fine).
2. Go to vercel.com, sign in (GitHub login is easiest), and click
   **Add New → Project**.
3. Import that repo. Vercel will detect it as a static site — leave the
   build settings blank/default, there's nothing to build, and click Deploy.
4. You get a live `yourproject.vercel.app` URL immediately, and it
   auto-redeploys every time you push a change to the repo.

## Deploying to GitHub Pages (free, alternative)

1. Create a free GitHub account if you don't have one, and a new repository
   (e.g. `physics-labs`).
2. Upload these files to the repo (drag-and-drop on github.com works, or use
   Git if you're comfortable with it).
3. In the repo: **Settings → Pages → Source**, select the `main` branch and
   `/ (root)` folder, then Save.
4. GitHub gives you a URL like `https://yourusername.github.io/physics-labs/`
   within a minute or two. Any time you push changes, the site updates
   automatically.

## Notes

- Fonts load from Google Fonts and the chart library from a CDN — both
  need an internet connection to render (fine for a hosted site, just means
  it won't look right opened with no wifi).
- The pendulum demo and lab chart are plain canvas/Chart.js — no build tools,
  frameworks, or npm install needed.
