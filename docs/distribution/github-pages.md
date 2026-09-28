# GitHub Pages edition

## Behavior

The live public guide is
<https://ding-ding-projects.github.io/roco-kingdom-world-guide/>. GitHub Pages publishes the
contents of `dist/` using the Actions deployment source from `main`. The guide uses relative URLs
for its JavaScript, CSS, icon, and JSON data, so it works below the project path instead of
assuming a custom-domain root. `.nojekyll` keeps underscore-prefixed files available to the static
host.

The workflow in `.github/workflows/pages.yml` builds the static edition from `main`. It generates
the favicon and a small `data/build-info.json` record containing the version, build time, source
revision, and source ref. The generated provenance file is a build output and is not checked in.
The same workflow independently builds the desktop package on a Windows runner.

## Privacy and security

The browser edition has no account, server-side profile, analytics, or Status Hub connection.
Search, local preferences, saved records, and reading history remain in the current browser.
Every guide request uses same-origin project assets; there are no remote fonts or project-owned
third-party scripts. The hosting provider can add infrastructure scripts outside this source.

## Failure modes

- A missing Pages deployment permission or environment prevents publication; the workflow result
  must be read before describing the guide as updated.
- Opening `dist/index.html` through a `file:` URL prevents browser JSON loading. Serve it over
  HTTP or use the public address.
- A missing asset or JSON response is shown as a data-loading problem. Check the deployed
  response paths under `/roco-kingdom-world-guide/` rather than assuming the custom-domain root.
- Missing build metadata is disclosed in the page as unavailable version information.

## Verification

For source commit `6cc57241bb139e2dcbfc705171eb88ba4c0667ba`, workflow run
<https://github.com/Ding-Ding-Projects/roco-kingdom-world-guide/actions/runs/36380472795>
completed successfully, including the `publish-pages` job. Unauthenticated requests to `/`,
`/assets/app.js`, `/assets/site.css`, and all eight `/data/*.json` resources returned HTTP 200.
The repository homepage points to the live address. These requests verify delivery, not script
execution, layout, keyboard use, or accessibility. The historical captures under
`evidence/responsive-header/` were taken from source commit
`bf90e1fd30e1bec271620479e03d95c353646633` and do not verify the current deployment. Current
built-surface capture and interaction review remain separate requirements; the approved headless
capture route was unavailable during the latest delivery work.
