# SimuVerse

Gamified training platform hosting three VR-ready simulations (A320 cockpit, laparoscopic trainer, fire extinguisher trainer).
Static site: no build step. Deploy the folder that contains `index.html`.

## Run locally
    python -m http.server 8000      # then open http://localhost:8000

## Deploy to Vercel
    npm i -g vercel
    vercel          # preview; answer the prompts (Framework: Other, no build command, output: ./)
    vercel --prod   # production

Or push this folder to GitHub, import the repo in Vercel, Framework Preset "Other", leave Build Command empty.

## Notes
- Accounts and XP are stored in each browser's localStorage (per domain), so the preview and production URLs have separate data.
- Three.js loads from cdn.jsdelivr.net, so the simulations need an internet connection.
- The laparoscopic simulator's ESP32 glove uses `http://<ip>/data`. Browsers block that from an HTTPS page (mixed content),
  so use the glove from a local copy (http://localhost) or allow "Insecure content" for the site in Chrome's site settings.
