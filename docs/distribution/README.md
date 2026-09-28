# Distribution

- [GitHub Pages edition](github-pages.md)
- [Offline desktop companion](desktop-companion.md)
- [Historical capture gallery](historical-captures.md)

The browser edition and desktop companion serve the same `dist/` guide data. Distribution
automation is configured in `.github/workflows/pages.yml`. A push to any ref can create a
desktop package; the Pages deployment job publishes only from `main`. A maintainer can also
start the workflow manually, with Pages deployment limited to a run targeting `main`.
