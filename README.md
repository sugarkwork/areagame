# Frontier Ring

Browser survival crafting prototype built as a static HTML/CSS/JavaScript game.

## Run Locally

Open `index.html` directly in a browser, or serve the folder with a local static server:

```sh
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/index.html`.

## Cloudflare Pages

Use Cloudflare Workers & Pages with a GitHub-connected project.

- Framework preset: `None`
- Build command: leave empty
- Build output directory: `/`
- Root directory: repository root

The site is fully static and does not require a build step.

For the Workers deployment flow, this repository includes `wrangler.jsonc`.
Use:

- Build command: leave empty
- Deploy command: `npx wrangler deploy`
- Non-production deploy command: `npx wrangler versions upload`
